import { beforeEach, describe, expect, it } from "vitest";
import {
  createPurchaseIntent,
  getCandidateProducts,
  selectBestProduct,
  shouldRefill
} from "./agent";
import { validatePurchaseIntent } from "./policy";
import { approvePendingConsent, rejectPendingConsent, runAgentScenario } from "./runner";
import { demoAgent, demoUser, seedInventory, seedMandates, seedProducts } from "./seed";
import { getStore, resetStore } from "./store";

const lensMandate = seedMandates.find((mandate) => mandate.id === "mandate_lens_001")!;
const allergyMandate = seedMandates.find((mandate) => mandate.id === "mandate_allergy_001")!;
const lensInventory = seedInventory.find((item) => item.id === "inventory_lens_001")!;

beforeEach(() => {
  resetStore();
});

describe("RefillGuard agent logic", () => {
  it("detects refill when contact lens solution is below threshold", () => {
    expect(shouldRefill({ ...lensInventory, currentPercent: 15 }, lensMandate)).toBe(true);
  });

  it("does not create refill need when stock is above threshold", () => {
    expect(shouldRefill({ ...lensInventory, currentPercent: 50 }, lensMandate)).toBe(false);
  });

  it("filters candidate products to allowed merchant, SKU, budget, delivery, and category", () => {
    const candidates = getCandidateProducts(seedProducts, lensMandate);
    expect(candidates.map((product) => `${product.merchantId}:${product.sku}`)).toEqual([
      "guardian_demo:opti_free_puremoist_300ml",
      "watsons_demo:renu_fresh_355ml"
    ]);
  });

  it("selects the lowest priced valid product", () => {
    const product = selectBestProduct(getCandidateProducts(seedProducts, lensMandate));
    expect(product?.merchantId).toBe("guardian_demo");
    expect(product?.priceSgd).toBe(15.9);
  });
});

describe("RefillGuard policy enforcement", () => {
  it("rejects over-quantity purchase intents", () => {
    const product = seedProducts.find((item) => item.merchantId === "guardian_demo" && item.sku === "opti_free_puremoist_300ml")!;
    const intent = createPurchaseIntent({
      userId: demoUser.id,
      agentId: demoAgent.id,
      mandate: lensMandate,
      product,
      reason: "Test",
      quantity: 2
    });

    const result = validatePurchaseIntent(intent, lensMandate, product);
    expect(result.approved).toBe(false);
    expect(result.checks.find((check) => check.key === "quantity")?.passed).toBe(false);
  });

  it("routes allergy tablets to manual review", () => {
    const product = seedProducts.find((item) => item.sku === "loratadine_demo_10mg")!;
    const intent = createPurchaseIntent({
      userId: demoUser.id,
      agentId: demoAgent.id,
      mandate: allergyMandate,
      product,
      reason: "Test"
    });

    const result = validatePurchaseIntent(intent, allergyMandate, product);
    expect(result.manualReview).toBe(true);
    expect(result.approved).toBe(false);
  });

  it("keeps raw secrets out of purchase intents", () => {
    const product = seedProducts.find((item) => item.merchantId === "guardian_demo" && item.sku === "opti_free_puremoist_300ml")!;
    const intent = createPurchaseIntent({
      userId: demoUser.id,
      agentId: demoAgent.id,
      mandate: lensMandate,
      product,
      reason: "Test"
    });

    const serialized = JSON.stringify(intent).toLowerCase();
    expect(serialized).not.toContain("card number");
    expect(serialized).not.toContain("address/home");
    expect(serialized).not.toContain("phone/primary");
    expect(serialized).not.toContain("cvv");
  });
});

describe("RefillGuard consent and audit receipts", () => {
  it("pauses confirmation-required mandates before T3N authorization", async () => {
    const result = await runAgentScenario({ scenario: "pet_food_success" });

    expect(result.authorizationResult.status).toBe("pending_user_approval");
    expect(result.pendingConsent?.status).toBe("pending");
    expect(result.authorizationResult.t3nExecutionId).toBeUndefined();
  });

  it("continues a pending intent after user approval", async () => {
    const pending = await runAgentScenario({ scenario: "pet_food_success" });
    const approved = await approvePendingConsent(pending.pendingConsent!.id);

    expect(approved.authorizationResult.status).toBe("approved");
    expect(approved.authorizationResult.t3nExecutionId).toContain("t3n_demo_exec");
    expect(approved.authorizationResult.merchantCheckoutPayload?.paymentMethod).toBe("{{sealed:t3n.payment.default_card}}");
  });

  it("records rejected consent without authorizing checkout", async () => {
    const pending = await runAgentScenario({ scenario: "pet_food_success" });
    const rejected = rejectPendingConsent(pending.pendingConsent!.id);

    expect(rejected.status).toBe("rejected");
    expect(getStore().audit[0].eventType).toBe("user_consent_rejected");
    expect(getStore().audit[0].decision).toBe("user_rejected");
  });

  it("adds hash chain metadata to new audit entries", async () => {
    await runAgentScenario({ scenario: "success" });
    const [latest, previous] = getStore().audit;

    expect(latest.hash).toHaveLength(64);
    expect(latest.previousHash).toBe(previous.hash);
  });
});

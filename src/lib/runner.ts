import {
  createPurchaseIntent,
  describeRefillDecision,
  getCandidateProducts,
  getRejectedCandidates,
  scenarioMandateId,
  selectScenarioProduct,
  shouldRefill
} from "./agent";
import { checkoutWithMerchant } from "./merchant";
import { validatePurchaseIntent } from "./policy";
import { addAudit, getStore } from "./store";
import { authorizePurchase } from "./t3n";
import type { AgentRunResult, DemoScenario } from "./types";

export async function runAgentScenario(params: {
  mandateId?: string;
  scenario: DemoScenario;
}): Promise<AgentRunResult> {
  const store = getStore();
  const mandateId = params.scenario === "success" ? params.mandateId ?? "mandate_lens_001" : scenarioMandateId(params.scenario);
  const mandate = store.mandates.find((item) => item.id === mandateId);

  if (!mandate) {
    throw new Error(`Mandate not found: ${mandateId}`);
  }

  const inventory = store.inventory.find((item) => item.mandateId === mandate.id);
  if (!inventory) {
    throw new Error(`Inventory not found for mandate: ${mandate.id}`);
  }

  if (params.scenario === "no_refill_needed" && inventory.currentPercent !== undefined) {
    inventory.currentPercent = 50;
    inventory.lastUpdatedAt = new Date().toISOString();
  }

  const refillNeeded = shouldRefill(inventory, mandate);
  const refillReason = describeRefillDecision(inventory, mandate, refillNeeded);

  addAudit({
    actorType: "agent",
    actorId: store.agent.id,
    eventType: refillNeeded ? "refill_needed" : "refill_not_needed",
    title: refillNeeded ? "Refill needed" : "No refill needed",
    details: { mandateId: mandate.id, reason: refillReason }
  });

  const relatedProducts = store.products.filter(
    (product) => product.category === mandate.category || params.scenario !== "success"
  );
  const candidates = getCandidateProducts(relatedProducts, mandate);
  const rejectedCandidates = getRejectedCandidates(relatedProducts, mandate);

  if (!refillNeeded) {
    const authorizationResult = {
      id: `auth_not_needed_${Date.now()}`,
      purchaseIntentId: "none",
      approved: false,
      status: "not_needed" as const,
      checks: [],
      blockedReason: "Stock is above threshold",
      sealedFieldsUsed: [],
      rawSecretsExposedToAgent: false as const,
      createdAt: new Date().toISOString()
    };

    return {
      scenario: params.scenario,
      refillNeeded,
      refillReason,
      candidates,
      rejectedCandidates,
      purchaseIntent: null,
      policyPrecheck: { approved: false, checks: [] },
      authorizationResult
    };
  }

  const product = selectScenarioProduct(params.scenario, store.products, candidates);
  if (!product) {
    throw new Error("No product available for scenario.");
  }

  const purchaseIntent = createPurchaseIntent({
    userId: store.user.id,
    agentId: store.agent.id,
    mandate,
    product,
    reason: refillReason,
    quantity: params.scenario === "over_quantity" ? 2 : 1
  });

  addAudit({
    actorType: "agent",
    actorId: store.agent.id,
    eventType: "purchase_intent_created",
    title: "Purchase intent created",
    details: {
      merchant: product.merchantName,
      sku: product.sku,
      priceSgd: product.priceSgd,
      quantity: purchaseIntent.quantity,
      sealedSecretsOnly: true
    }
  });

  const policyPrecheck = validatePurchaseIntent(purchaseIntent, mandate, product);
  const authorizationResult = await authorizePurchase({
    userId: store.user.id,
    agentId: store.agent.id,
    mandate,
    purchaseIntent,
    product
  });

  addAudit({
    actorType: "terminal3",
    actorId: "terminal3_adk",
    eventType:
      authorizationResult.status === "manual_review"
        ? "manual_review_required"
        : authorizationResult.approved
          ? "authorization_approved"
          : "authorization_rejected",
    title:
      authorizationResult.status === "manual_review"
        ? "Manual review required"
        : authorizationResult.approved
          ? "Authorization approved"
          : "Authorization blocked",
    details: {
      executionId: authorizationResult.t3nExecutionId,
      reason: authorizationResult.blockedReason,
      sealedFieldsUsed: authorizationResult.sealedFieldsUsed
    }
  });

  if (authorizationResult.approved) {
    const order = checkoutWithMerchant(purchaseIntent, authorizationResult);
    authorizationResult.orderId = order.orderId;
    addAudit({
      actorType: "merchant",
      actorId: product.merchantId,
      eventType: "checkout_completed",
      title: "Checkout completed",
      details: {
        orderId: order.orderId,
        merchant: product.merchantName,
        sealedPayload: order.payload
      }
    });
  }

  return {
    scenario: params.scenario,
    refillNeeded,
    refillReason,
    candidates,
    rejectedCandidates,
    purchaseIntent,
    policyPrecheck: {
      approved: policyPrecheck.approved,
      checks: policyPrecheck.checks
    },
    authorizationResult
  };
}

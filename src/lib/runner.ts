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
import type { AgentRunResult, AgentTraceEntry, DemoScenario } from "./types";

export async function runAgentScenario(params: {
  mandateId?: string;
  scenario: DemoScenario;
}): Promise<AgentRunResult> {
  const store = getStore();
  const trace: AgentTraceEntry[] = [];
  let traceStep = 0;
  const pushTrace = (
    entry: Omit<AgentTraceEntry, "id" | "at"> & {
      at?: string;
    }
  ) => {
    traceStep += 1;
    trace.push({
      id: `trace_${Date.now()}_${traceStep}`,
      at: entry.at ?? new Date().toISOString(),
      actor: entry.actor,
      status: entry.status,
      command: entry.command,
      detail: entry.detail,
      metadata: entry.metadata
    });
  };
  const mandateId = params.scenario === "success" ? params.mandateId ?? "mandate_lens_001" : scenarioMandateId(params.scenario);
  const mandate = store.mandates.find((item) => item.id === mandateId);

  if (!mandate) {
    throw new Error(`Mandate not found: ${mandateId}`);
  }

  const inventory = store.inventory.find((item) => item.mandateId === mandate.id);
  if (!inventory) {
    throw new Error(`Inventory not found for mandate: ${mandate.id}`);
  }

  pushTrace({
    actor: "agent",
    status: "ok",
    command: "agent.load_mandate",
    detail: `Loaded active mandate ${mandate.id} for ${readableCategory(mandate.category)}.`,
    metadata: {
      maxPriceSgd: mandate.maxPriceSgd,
      maxQuantity: mandate.maxQuantity,
      approvedMerchants: mandate.approvedMerchants.length
    }
  });

  if (params.scenario === "no_refill_needed" && inventory.currentPercent !== undefined) {
    inventory.currentPercent = 50;
    inventory.lastUpdatedAt = new Date().toISOString();
  }

  const refillNeeded = shouldRefill(inventory, mandate);
  const refillReason = describeRefillDecision(inventory, mandate, refillNeeded);
  pushTrace({
    actor: "agent",
    status: refillNeeded ? "ok" : "skipped",
    command: "agent.scan_inventory",
    detail: refillReason,
    metadata: inventory.currentPercent !== undefined ? { currentPercent: inventory.currentPercent } : undefined
  });

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
  pushTrace({
    actor: "agent",
    status: "ok",
    command: "agent.filter_catalog",
    detail: `Found ${candidates.length} allowed candidate${candidates.length === 1 ? "" : "s"} and rejected ${rejectedCandidates.length}.`,
    metadata: {
      candidates: candidates.length,
      rejected: rejectedCandidates.length
    }
  });

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
    pushTrace({
      actor: "agent",
      status: "skipped",
      command: "agent.stop",
      detail: "Stock is above the mandate trigger, so no purchase intent or T3N call was made."
    });

    return {
      scenario: params.scenario,
      refillNeeded,
      refillReason,
      candidates,
      rejectedCandidates,
      purchaseIntent: null,
      policyPrecheck: { approved: false, checks: [] },
      authorizationResult,
      trace
    };
  }

  const product = selectScenarioProduct(params.scenario, store.products, candidates);
  if (!product) {
    throw new Error("No product available for scenario.");
  }
  pushTrace({
    actor: "agent",
    status: "ok",
    command: "agent.select_product",
    detail: `${product.name} from ${product.merchantName} at ${money.format(product.priceSgd)}.`,
    metadata: {
      sku: product.sku,
      merchantId: product.merchantId,
      deliveryDays: product.deliveryDays
    }
  });

  const purchaseIntent = createPurchaseIntent({
    userId: store.user.id,
    agentId: store.agent.id,
    mandate,
    product,
    reason: refillReason,
    quantity: params.scenario === "over_quantity" ? 2 : 1
  });
  pushTrace({
    actor: "agent",
    status: "ok",
    command: "agent.create_intent",
    detail: `Created purchase intent ${purchaseIntent.id} for quantity ${purchaseIntent.quantity}.`,
    metadata: {
      quantity: purchaseIntent.quantity,
      priceSgd: purchaseIntent.priceSgd
    }
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
  const failedPrecheck = policyPrecheck.checks.find((check) => !check.passed);
  pushTrace({
    actor: "policy",
    status: policyPrecheck.manualReview ? "review" : policyPrecheck.approved ? "ok" : "blocked",
    command: "policy.precheck",
    detail: policyPrecheck.approved
      ? `Local precheck passed ${policyPrecheck.checks.length}/${policyPrecheck.checks.length} checks before asking T3N.`
      : failedPrecheck
        ? `Local precheck flagged ${failedPrecheck.label}. T3N still receives the intent for final authorization.`
        : "Local precheck requires review.",
    metadata: {
      passed: policyPrecheck.checks.filter((check) => check.passed).length,
      total: policyPrecheck.checks.length
    }
  });
  const authorizationResult = await authorizePurchase({
    userId: store.user.id,
    agentId: store.agent.id,
    mandate,
    purchaseIntent,
    product
  });
  pushTrace({
    actor: "t3n",
    status:
      authorizationResult.status === "manual_review"
        ? "review"
        : authorizationResult.approved
          ? "ok"
          : "blocked",
    command: "t3n.authorize_purchase",
    detail: authorizationResult.approved
      ? "T3N approved the delegated purchase and released only sealed checkout references."
      : authorizationResult.blockedReason ?? statusLabel(authorizationResult.status),
    metadata: {
      checksPassed: authorizationResult.checks.filter((check) => check.passed).length,
      checksTotal: authorizationResult.checks.length,
      sealedFields: authorizationResult.sealedFieldsUsed.length,
      executionId: authorizationResult.t3nExecutionId ?? "none"
    }
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
    pushTrace({
      actor: "merchant",
      status: "ok",
      command: "merchant.checkout",
      detail: `Checkout completed at ${product.merchantName}; order ${order.orderId}.`,
      metadata: {
        orderId: order.orderId,
        merchantId: product.merchantId
      }
    });
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
  } else {
    pushTrace({
      actor: "merchant",
      status: "skipped",
      command: "merchant.checkout",
      detail: "Checkout was not called because T3N did not approve the purchase."
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
    authorizationResult,
    trace
  };
}

const money = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  minimumFractionDigits: 2
});

function readableCategory(category: string) {
  return category
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function statusLabel(status: AgentRunResult["authorizationResult"]["status"]) {
  if (status === "approved") return "Approved";
  if (status === "manual_review") return "Manual review required";
  if (status === "not_needed") return "No refill needed";
  return "Blocked";
}

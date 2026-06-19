import { candidateRejectionReasons } from "./policy";
import type {
  DemoScenario,
  InventoryItem,
  MerchantProduct,
  PurchaseIntent,
  RefillMandate
} from "./types";

export function shouldRefill(item: InventoryItem, mandate: RefillMandate): boolean {
  if (mandate.trigger.type === "stock_percentage") {
    return (item.currentPercent ?? 100) < mandate.trigger.thresholdPercent;
  }

  if (mandate.trigger.type === "days_remaining") {
    return (item.estimatedDaysRemaining ?? Infinity) < mandate.trigger.thresholdDays;
  }

  if (mandate.trigger.type === "unit_count") {
    return (item.currentUnits ?? Infinity) < mandate.trigger.thresholdUnits;
  }

  return false;
}

export function describeRefillDecision(item: InventoryItem, mandate: RefillMandate, refillNeeded: boolean): string {
  if (mandate.trigger.type === "stock_percentage") {
    return `${item.currentPercent ?? 100}% is ${refillNeeded ? "below" : "above"} the ${mandate.trigger.thresholdPercent}% refill threshold.`;
  }

  if (mandate.trigger.type === "days_remaining") {
    return `${item.estimatedDaysRemaining ?? "Unknown"} days remain with a ${mandate.trigger.thresholdDays}-day refill threshold.`;
  }

  return `${item.currentUnits ?? "Unknown"} units remain with a ${mandate.trigger.thresholdUnits}-unit refill threshold.`;
}

export function getCandidateProducts(products: MerchantProduct[], mandate: RefillMandate): MerchantProduct[] {
  return products.filter((product) => candidateRejectionReasons(product, mandate).length === 0);
}

export function getRejectedCandidates(products: MerchantProduct[], mandate: RefillMandate) {
  return products
    .map((product) => ({ ...product, reasons: candidateRejectionReasons(product, mandate) }))
    .filter((product) => product.reasons.length > 0);
}

export function selectBestProduct(candidates: MerchantProduct[]): MerchantProduct | null {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    if (a.priceSgd !== b.priceSgd) return a.priceSgd - b.priceSgd;
    return a.deliveryDays - b.deliveryDays;
  })[0];
}

export function createPurchaseIntent(params: {
  userId: string;
  agentId: string;
  mandate: RefillMandate;
  product: MerchantProduct;
  reason: string;
  quantity?: number;
}): PurchaseIntent {
  return {
    id: `intent_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    mandateId: params.mandate.id,
    userId: params.userId,
    agentId: params.agentId,
    action: "purchase_essential",
    merchantId: params.product.merchantId,
    merchantName: params.product.merchantName,
    productName: params.product.name,
    sku: params.product.sku,
    category: params.product.category,
    priceSgd: params.product.priceSgd,
    quantity: params.quantity ?? 1,
    deliveryDays: params.product.deliveryDays,
    reason: params.reason,
    createdAt: new Date().toISOString()
  };
}

export function scenarioMandateId(scenario: DemoScenario) {
  if (scenario === "pet_food_success") return "mandate_pet_001";
  if (scenario === "regulated_item") return "mandate_allergy_001";
  return "mandate_lens_001";
}

export function selectScenarioProduct(
  scenario: DemoScenario,
  products: MerchantProduct[],
  candidates: MerchantProduct[]
): MerchantProduct | null {
  const by = (merchantId: string, sku: string) =>
    products.find((product) => product.merchantId === merchantId && product.sku === sku) ?? null;

  if (scenario === "over_budget") return by("watsons_demo", "opti_free_puremoist_300ml");
  if (scenario === "unapproved_merchant") return by("random_market_demo", "cheap_unknown_solution_500ml");
  if (scenario === "wrong_category") return by("guardian_demo", "eye_drops_refresh_15ml");
  if (scenario === "regulated_item") return by("guardian_demo", "loratadine_demo_10mg");
  if (scenario === "pet_food_success") return by("pet_lovers_demo", "royal_canin_indoor_cat_2kg");

  return selectBestProduct(candidates);
}

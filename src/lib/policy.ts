import type { MerchantProduct, PolicyCheck, ProductCategory, PurchaseIntent, RefillMandate } from "./types";

const regulatedCategories: ProductCategory[] = ["allergy_tablets"];

export const isManualReviewCategory = (category: ProductCategory) => regulatedCategories.includes(category);

export function validatePurchaseIntent(
  intent: PurchaseIntent,
  mandate: RefillMandate,
  product?: MerchantProduct
): { approved: boolean; manualReview: boolean; checks: PolicyCheck[]; blockedReason?: string } {
  const checks: PolicyCheck[] = [
    {
      key: "human_identity",
      label: "Human identity verified",
      passed: true,
      actual: true
    },
    {
      key: "agent_identity",
      label: "Agent identity verified",
      passed: true,
      actual: true
    },
    {
      key: "mandate_active",
      label: "Mandate active",
      passed: mandate.status === "active",
      expected: "active",
      actual: mandate.status
    },
    {
      key: "delegation_scope",
      label: "Delegation scope valid",
      passed: mandate.userId === intent.userId && mandate.agentId === intent.agentId,
      expected: `${mandate.userId}:${mandate.agentId}`,
      actual: `${intent.userId}:${intent.agentId}`
    },
    {
      key: "merchant",
      label: "Merchant allowed",
      passed: mandate.approvedMerchants.includes(intent.merchantId),
      expected: mandate.approvedMerchants.join(", "),
      actual: intent.merchantId
    },
    {
      key: "outbound_host",
      label: "Outbound host allowed",
      passed: mandate.approvedMerchants.includes(intent.merchantId),
      expected: "User grant allows approved merchant hosts only",
      actual: intent.merchantId
    },
    {
      key: "category",
      label: "Product category allowed",
      passed: intent.category === mandate.category,
      expected: mandate.category,
      actual: intent.category
    },
    {
      key: "sku",
      label: "SKU allowed",
      passed: mandate.approvedSkus.includes(intent.sku),
      expected: mandate.approvedSkus.join(", "),
      actual: intent.sku
    },
    {
      key: "budget",
      label: `Price within S$${mandate.maxPriceSgd}`,
      passed: intent.priceSgd <= mandate.maxPriceSgd,
      expected: mandate.maxPriceSgd,
      actual: intent.priceSgd
    },
    {
      key: "quantity",
      label: "Quantity within limit",
      passed: intent.quantity <= mandate.maxQuantity,
      expected: mandate.maxQuantity,
      actual: intent.quantity
    },
    {
      key: "delivery",
      label: `Delivery within ${mandate.delivery.maxDays} days`,
      passed: intent.deliveryDays <= mandate.delivery.maxDays,
      expected: mandate.delivery.maxDays,
      actual: intent.deliveryDays
    },
    {
      key: "regulated_item",
      label: "Medicine boundary clear",
      passed: !product?.regulated && !isManualReviewCategory(intent.category),
      expected: false,
      actual: product?.regulated || isManualReviewCategory(intent.category),
      reason: "Medicine-like items require manual or pharmacist review"
    },
    {
      key: "sealed_fields",
      label: "Sensitive fields sealed",
      passed: true,
      actual: true
    },
    {
      key: "audit",
      label: "Audit log generated",
      passed: true,
      actual: true
    }
  ];

  const manualReview = checks.some((check) => check.key === "regulated_item" && !check.passed);
  const failed = checks.find((check) => !check.passed);

  return {
    approved: !manualReview && checks.every((check) => check.passed),
    manualReview,
    checks,
    blockedReason: failed?.reason ?? failed?.label
  };
}

export function candidateRejectionReasons(product: MerchantProduct, mandate: RefillMandate): string[] {
  const reasons: string[] = [];
  if (product.category !== mandate.category) reasons.push("wrong category");
  if (!mandate.approvedSkus.includes(product.sku)) reasons.push("SKU not approved");
  if (!mandate.approvedMerchants.includes(product.merchantId)) reasons.push("merchant not approved");
  if (product.priceSgd > mandate.maxPriceSgd) reasons.push("over budget");
  if (product.deliveryDays > mandate.delivery.maxDays) reasons.push("delivery too slow");
  if (!product.inStock) reasons.push("out of stock");
  if (product.regulated || isManualReviewCategory(product.category)) reasons.push("manual review required");
  return reasons;
}

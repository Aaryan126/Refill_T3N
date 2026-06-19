import { validatePurchaseIntent } from "./policy";
import { executeLiveAuthorizationContract } from "./t3n-live";
import type { AuthorizationResult, MerchantProduct, PurchaseIntent, RefillMandate } from "./types";

export type T3nPurchaseAuthorizationInput = {
  userId: string;
  agentId: string;
  mandate: RefillMandate;
  purchaseIntent: PurchaseIntent;
  product?: MerchantProduct;
};

export async function authorizePurchase(input: T3nPurchaseAuthorizationInput): Promise<AuthorizationResult> {
  if (process.env.DEMO_MODE !== "false") {
    return authorizePurchaseWithDemoAdapter(input);
  }

  return authorizePurchaseWithLiveAdapter(input);
}

async function authorizePurchaseWithDemoAdapter(input: T3nPurchaseAuthorizationInput): Promise<AuthorizationResult> {
  const validation = validatePurchaseIntent(input.purchaseIntent, input.mandate, input.product);
  const now = new Date().toISOString();
  const status = validation.manualReview ? "manual_review" : validation.approved ? "approved" : "blocked";

  return {
    id: `auth_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    purchaseIntentId: input.purchaseIntent.id,
    approved: validation.approved,
    status,
    checks: validation.checks,
    t3nExecutionId: `t3n_demo_exec_${Date.now()}`,
    blockedReason: validation.approved ? undefined : validation.blockedReason,
    sealedFieldsUsed: [
      input.mandate.sensitiveFieldRefs.paymentMethodRef,
      input.mandate.sensitiveFieldRefs.addressRef,
      input.mandate.sensitiveFieldRefs.phoneRef
    ],
    rawSecretsExposedToAgent: false,
    merchantCheckoutPayload: validation.approved
      ? {
          merchantId: input.purchaseIntent.merchantId,
          sku: input.purchaseIntent.sku,
          quantity: input.purchaseIntent.quantity,
          paymentMethod: "{{sealed:t3n.payment.default_card}}",
          deliveryAddress: "{{sealed:t3n.address.home}}",
          phone: "{{sealed:t3n.phone.primary}}"
        }
      : undefined,
    createdAt: now
  };
}

async function authorizePurchaseWithLiveAdapter(input: T3nPurchaseAuthorizationInput): Promise<AuthorizationResult> {
  const required = ["T3N_API_KEY", "T3N_USER_ID"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Terminal 3 live mode is missing: ${missing.join(", ")}. Run npm run t3n:whoami first.`);
  }

  const live = await executeLiveAuthorizationContract({
    purchaseIntent: input.purchaseIntent,
    mandate: input.mandate,
    product: input.product
  });
  const now = new Date().toISOString();

  return {
    id: `auth_t3n_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    purchaseIntentId: input.purchaseIntent.id,
    approved: live.approved,
    status: live.status,
    checks: live.checks.map((check) => ({
      key: check.key,
      label: check.label,
      passed: check.passed,
      expected:
        typeof check.expected === "string" || typeof check.expected === "number" || typeof check.expected === "boolean"
          ? check.expected
          : JSON.stringify(check.expected),
      actual:
        typeof check.actual === "string" || typeof check.actual === "number" || typeof check.actual === "boolean"
          ? check.actual
          : JSON.stringify(check.actual),
      reason: check.reason
    })),
    t3nExecutionId: `t3n_live_${process.env.T3N_CONTRACT_ID ?? process.env.T3N_CONTRACT_TAIL ?? "contract"}_${Date.now()}`,
    blockedReason: live.approved ? undefined : live.blockedReason,
    sealedFieldsUsed: live.sealedFieldsUsed,
    rawSecretsExposedToAgent: false,
    merchantCheckoutPayload: live.approved
      ? {
          merchantId: input.purchaseIntent.merchantId,
          sku: input.purchaseIntent.sku,
          quantity: input.purchaseIntent.quantity,
          paymentMethod: "{{sealed:t3n.payment.default_card}}",
          deliveryAddress: "{{sealed:t3n.address.home}}",
          phone: "{{sealed:t3n.phone.primary}}"
        }
      : undefined,
    createdAt: now
  };
}

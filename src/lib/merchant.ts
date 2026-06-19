import type { AuthorizationResult, PurchaseIntent } from "./types";

export function checkoutWithMerchant(intent: PurchaseIntent, authorization: AuthorizationResult) {
  if (!authorization.approved || !authorization.merchantCheckoutPayload) {
    throw new Error("Merchant checkout requires Terminal 3 approval.");
  }

  return {
    orderId: `order_demo_${intent.merchantId}_${String(Date.now()).slice(-6)}`,
    merchantId: intent.merchantId,
    sku: intent.sku,
    quantity: intent.quantity,
    payload: authorization.merchantCheckoutPayload
  };
}

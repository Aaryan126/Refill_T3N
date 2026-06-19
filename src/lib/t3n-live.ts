import {
  T3nClient,
  createEthAuthInput,
  eth_get_address,
  getNodeUrl,
  getScriptVersion,
  loadWasmComponent,
  metamask_sign,
  setEnvironment
} from "@terminal3/t3n-sdk";
import type { MerchantProduct, PurchaseIntent, RefillMandate } from "./types";

export type LiveT3nContractResult = {
  approved: boolean;
  status: "approved" | "blocked" | "manual_review";
  checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    expected?: unknown;
    actual?: unknown;
    reason?: string;
  }>;
  blockedReason?: string;
  rawSecretsExposedToAgent: false;
  sealedFieldsUsed: string[];
};

export async function executeLiveAuthorizationContract(params: {
  purchaseIntent: PurchaseIntent;
  mandate: RefillMandate;
  product?: MerchantProduct;
}) {
  const useSeparateAgent = process.env.T3N_USE_SEPARATE_AGENT === "true";
  const key = useSeparateAgent ? process.env.T3N_AGENT_KEY : process.env.T3N_API_KEY;
  if (!key) {
    throw new Error(useSeparateAgent ? "Missing T3N_AGENT_KEY" : "Missing T3N_API_KEY");
  }

  const tenantDid = process.env.T3N_USER_ID;
  if (!tenantDid) {
    throw new Error("Missing T3N_USER_ID. Run `npm run t3n:whoami` and copy the returned tenantDid.");
  }

  const environment = process.env.T3N_ENVIRONMENT ?? (process.env.T3N_SANDBOX_MODE === "false" ? "production" : "testnet");
  setEnvironment(environment as "testnet" | "production");
  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(key);
  const t3n = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, key)
    }
  });

  await t3n.handshake();
  await t3n.authenticate(createEthAuthInput(address));

  const tenantId = tenantDid.slice("did:t3n:".length);
  const tail = process.env.T3N_CONTRACT_TAIL ?? "refillguard-auth";
  const scriptName = process.env.T3N_SCRIPT_NAME ?? `z:${tenantId}:${tail}`;
  const scriptVersion = process.env.T3N_CONTRACT_VERSION ?? (await getScriptVersion(getNodeUrl(), scriptName));

  return t3n.executeAndDecode<LiveT3nContractResult>({
    script_name: scriptName,
    script_version: scriptVersion,
    function_name: "authorize-purchase",
    pii_did: useSeparateAgent ? tenantDid : undefined,
    input: {
      purchaseIntentId: params.purchaseIntent.id,
      userId: params.purchaseIntent.userId,
      agentId: params.purchaseIntent.agentId,
      mandateUserId: params.mandate.userId,
      mandateAgentId: params.mandate.agentId,
      merchantId: params.purchaseIntent.merchantId,
      sku: params.purchaseIntent.sku,
      category: params.purchaseIntent.category,
      priceSgd: params.purchaseIntent.priceSgd,
      quantity: params.purchaseIntent.quantity,
      deliveryDays: params.purchaseIntent.deliveryDays,
      mandate: {
        status: params.mandate.status,
        category: params.mandate.category,
        approvedSkus: params.mandate.approvedSkus,
        approvedMerchants: params.mandate.approvedMerchants,
        maxPriceSgd: params.mandate.maxPriceSgd,
        maxQuantity: params.mandate.maxQuantity,
        delivery: params.mandate.delivery
      },
      product: {
        regulated: params.product?.regulated ?? false
      }
    }
  });
}

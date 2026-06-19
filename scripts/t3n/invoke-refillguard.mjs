import "dotenv/config";
import { getNodeUrl, getScriptVersion } from "@terminal3/t3n-sdk";
import { createAuthenticatedClient, printJson, tenantScriptName } from "./shared.mjs";

const useSeparateAgent = process.env.T3N_USE_SEPARATE_AGENT === "true";
const invocationKey = useSeparateAgent ? process.env.T3N_AGENT_KEY : process.env.T3N_API_KEY;
const { t3n, tenantDid } = await createAuthenticatedClient(invocationKey);
const scriptName = process.env.T3N_SCRIPT_NAME ?? tenantScriptName(process.env.T3N_USER_ID || tenantDid);
const scriptVersion = process.env.T3N_CONTRACT_VERSION ?? (await getScriptVersion(getNodeUrl(), scriptName));

const input = {
  purchaseIntentId: "intent_cli_success",
  userId: "user_demo_001",
  agentId: "agent_refillguard_v1",
  mandateUserId: "user_demo_001",
  mandateAgentId: "agent_refillguard_v1",
  merchantId: "guardian_demo",
  sku: "opti_free_puremoist_300ml",
  category: "contact_lens_solution",
  priceSgd: 15.9,
  quantity: 1,
  deliveryDays: 2,
  mandate: {
    status: "active",
    category: "contact_lens_solution",
    approvedSkus: ["opti_free_puremoist_300ml", "renu_fresh_355ml"],
    approvedMerchants: ["guardian_demo", "watsons_demo"],
    maxPriceSgd: 18,
    maxQuantity: 1,
    delivery: { maxDays: 3 }
  },
  product: { regulated: false }
};

try {
  const result = await t3n.executeAndDecode({
    script_name: scriptName,
    script_version: scriptVersion,
    function_name: "authorize-purchase",
    pii_did: useSeparateAgent ? process.env.T3N_USER_ID : undefined,
    input
  });

  printJson({
    scriptName,
    scriptVersion,
    useSeparateAgent,
    invokedAsDid: tenantDid,
    configuredAgentDid: process.env.T3N_AGENT_DID || null,
    piiDid: useSeparateAgent ? process.env.T3N_USER_ID || null : null,
    result
  });
} catch (error) {
  printJson({
    scriptName,
    scriptVersion,
    useSeparateAgent,
    invokedAsDid: tenantDid,
    configuredAgentDid: process.env.T3N_AGENT_DID || null,
    piiDid: useSeparateAgent ? process.env.T3N_USER_ID || null : null,
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      data: error?.data,
      shortMessage: error?.shortMessage
    }
  });
  process.exitCode = 1;
}

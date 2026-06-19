import "dotenv/config";
import { formatTokens } from "@terminal3/t3n-sdk";
import { createAuthenticatedClient, printJson } from "./shared.mjs";

const agentKey = process.env.T3N_AGENT_KEY;

if (!agentKey) {
  throw new Error("Missing T3N_AGENT_KEY. Run `npm run t3n:agent` first.");
}

const { tenantDid, tenant, t3n } = await createAuthenticatedClient(agentKey);

let claimResult = null;
let claimError = null;

try {
  claimResult = await tenant.tenant.claim();
} catch (error) {
  claimError = {
    name: error?.name,
    message: error?.message
  };
}

let usage = null;
let usageError = null;

try {
  usage = await tenant.token.getUsage({ limit: 10 });
} catch (error) {
  try {
    usage = await t3n.getUsage({ limit: 10 });
  } catch (fallbackError) {
    usageError = {
      name: fallbackError?.name ?? error?.name,
      message: fallbackError?.message ?? error?.message
    };
  }
}

const balance =
  usage?.balance?.available ??
  usage?.balance?.spendable ??
  usage?.balance?.free ??
  usage?.available ??
  null;

printJson({
  agentDid: tenantDid,
  claimResult,
  claimError,
  balanceBaseUnits: balance,
  balanceTokens: balance == null ? null : formatTokens(balance),
  usage,
  usageError
});

import "dotenv/config";
import { createAuthenticatedClient, printJson, tenantScriptName } from "./shared.mjs";

const { address, tenant, tenantDid } = await createAuthenticatedClient();
let tenantRecord = null;

try {
  tenantRecord = await tenant.tenant.me();
} catch (error) {
  tenantRecord = {
    error: error instanceof Error ? error.message : String(error),
    hint: "If the tenant is not admitted yet, run the Terminal 3 claim/test-token flow first."
  };
}

printJson({
  walletAddress: address,
  tenantDid,
  tenantId: tenantDid.slice("did:t3n:".length),
  defaultScriptName: tenantScriptName(tenantDid),
  tenantRecord
});

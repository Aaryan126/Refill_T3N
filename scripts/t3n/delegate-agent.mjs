import "dotenv/config";
import { getNodeUrl, getScriptVersion } from "@terminal3/t3n-sdk";
import { createAuthenticatedClient, printJson, tenantScriptName } from "./shared.mjs";

const agentDid = process.env.T3N_AGENT_DID || process.env.T3N_AGENT_ID;
const tenantDid = process.env.T3N_USER_ID;

if (!agentDid) {
  throw new Error("Missing T3N_AGENT_DID. Run `npm run t3n:agent` first.");
}

if (!tenantDid) {
  throw new Error("Missing T3N_USER_ID. Run `npm run t3n:whoami` first.");
}

const { t3n: userClient } = await createAuthenticatedClient(process.env.T3N_API_KEY);
const tenantScript = process.env.T3N_SCRIPT_NAME ?? tenantScriptName(tenantDid, process.env.T3N_CONTRACT_TAIL ?? "refillguard-auth");
const scriptVersion = process.env.T3N_CONTRACT_VERSION ?? (await getScriptVersion(getNodeUrl(), tenantScript));
const userContractVersion = await getScriptVersion(getNodeUrl(), "tee:user/contracts");
const allowedHosts = (process.env.T3N_ALLOWED_HOSTS ?? "guardian-demo.refillguard.local,watsons-demo.refillguard.local,pet-lovers-demo.refillguard.local")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const result = await userClient.executeAndDecode({
  script_name: "tee:user/contracts",
  script_version: userContractVersion,
  function_name: "agent-auth-update",
  input: {
    agents: [
      {
        agentDid,
        scripts: [
          {
            scriptName: tenantScript,
            versionReq: scriptVersion,
            functions: ["authorize-purchase"],
            allowedHosts
          }
        ]
      }
    ]
  }
});

printJson({
  delegatedByUserDid: tenantDid,
  agentDid,
  tenantScript,
  scriptVersion,
  functions: ["authorize-purchase"],
  allowedHosts,
  result
});

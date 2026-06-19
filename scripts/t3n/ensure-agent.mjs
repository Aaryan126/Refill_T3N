import "dotenv/config";
import { createAuthenticatedClient, generatePrivateKey, printJson, updateEnvFile } from "./shared.mjs";

const existingKey = process.env.T3N_AGENT_KEY?.trim();
const agentKey = existingKey || generatePrivateKey();
const { address, tenantDid: agentDid } = await createAuthenticatedClient(agentKey);

const updates = {
  T3N_AGENT_KEY: agentKey,
  T3N_AGENT_DID: agentDid,
  T3N_AGENT_ID: agentDid
};

await updateEnvFile(updates);

printJson({
  agentWalletAddress: address,
  agentDid,
  envUpdated: Object.keys(updates),
  generatedNewAgentKey: !existingKey,
  note: "T3N_AGENT_KEY was written to .env and intentionally not printed."
});

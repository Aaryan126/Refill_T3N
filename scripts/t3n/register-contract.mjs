import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  CONTRACT_TAIL,
  CONTRACT_VERSION,
  createAuthenticatedClient,
  normalizeContractId,
  printJson,
  tenantScriptName
} from "./shared.mjs";

const wasmPath =
  process.env.T3N_WASM_PATH ??
  "contracts/refillguard-auth/target/wasm32-wasip2/release/refillguard_auth.wasm";
const wasm = await readFile(resolve(wasmPath));
const { tenant, tenantDid } = await createAuthenticatedClient();

const result = await tenant.contracts.register({
  tail: CONTRACT_TAIL,
  version: CONTRACT_VERSION,
  wasm
});

const contractId = normalizeContractId(result);

printJson({
  contractTail: CONTRACT_TAIL,
  contractVersion: CONTRACT_VERSION,
  contractId,
  tenantDid,
  tenantScriptName: tenantScriptName(tenantDid, CONTRACT_TAIL),
  rawResult: result,
  envToSet: {
    T3N_USER_ID: tenantDid,
    T3N_CONTRACT_ID: contractId ?? "<copy contract_id from rawResult>",
    T3N_CONTRACT_TAIL: CONTRACT_TAIL,
    T3N_CONTRACT_VERSION: CONTRACT_VERSION,
    DEMO_MODE: "false"
  }
});

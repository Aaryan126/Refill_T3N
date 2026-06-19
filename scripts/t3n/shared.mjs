import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment
} from "@terminal3/t3n-sdk";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const T3N_ENVIRONMENT = process.env.T3N_ENVIRONMENT ?? (process.env.T3N_SANDBOX_MODE === "false" ? "production" : "testnet");
export const CONTRACT_TAIL = process.env.T3N_CONTRACT_TAIL ?? "refillguard-auth";
export const CONTRACT_VERSION = process.env.T3N_CONTRACT_VERSION ?? "0.1.0";

export async function createAuthenticatedClient(privateKey = process.env.T3N_API_KEY) {
  if (!privateKey) {
    throw new Error("Missing T3N_API_KEY in .env");
  }

  setEnvironment(T3N_ENVIRONMENT);
  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(privateKey);
  const t3n = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, privateKey)
    }
  });

  await t3n.handshake();
  const did = await t3n.authenticate(createEthAuthInput(address));
  const tenantDid = did.value;
  const tenant = new TenantClient({
    t3n,
    baseUrl: getNodeUrl(),
    endpoint: getNodeUrl(),
    tenantDid
  });

  return { address, did, tenantDid, t3n, tenant };
}

export function tenantScriptName(tenantDid, tail = CONTRACT_TAIL) {
  return `z:${tenantDid.slice("did:t3n:".length)}:${tail}`;
}

export function normalizeContractId(result) {
  if (result && typeof result === "object") {
    if ("contract_id" in result) return result.contract_id;
    if ("contractId" in result) return result.contractId;
    if ("id" in result) return result.id;
  }
  return undefined;
}

export function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

export function generatePrivateKey() {
  return `0x${randomBytes(32).toString("hex")}`;
}

export async function updateEnvFile(updates, envPath = ".env") {
  const absolutePath = resolve(envPath);
  let text = "";
  try {
    text = await readFile(absolutePath, "utf8");
  } catch {
    text = "";
  }

  const lines = text.split(/\r?\n/);
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in updates)) return line;
    seen.add(match[1]);
    return `${match[1]}=${updates[match[1]]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) nextLines.push(`${key}=${value}`);
  }

  await writeFile(absolutePath, `${nextLines.filter((line, index, all) => index < all.length - 1 || line !== "").join("\n")}\n`);
}

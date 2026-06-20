import { demoAgent, demoUser, seedAudit, seedInventory, seedMandates, seedProducts } from "./seed";
import { createHash } from "crypto";
import type { AuditLogEntry, InventoryItem, PendingConsent, RefillMandate, T3nRuntimeStatus } from "./types";

type DemoStore = {
  user: typeof demoUser;
  agent: typeof demoAgent;
  mandates: RefillMandate[];
  inventory: InventoryItem[];
  products: typeof seedProducts;
  audit: AuditLogEntry[];
  pendingConsents: PendingConsent[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createInitialStore = (): DemoStore => ({
  user: clone(demoUser),
  agent: clone(demoAgent),
  mandates: clone(seedMandates),
  inventory: clone(seedInventory),
  products: clone(seedProducts),
  audit: clone(seedAudit),
  pendingConsents: []
});

const globalForStore = globalThis as typeof globalThis & {
  __refillGuardStore?: DemoStore;
};

export const getStore = (): DemoStore => {
  if (!globalForStore.__refillGuardStore) {
    globalForStore.__refillGuardStore = createInitialStore();
  }

  return globalForStore.__refillGuardStore;
};

export const resetStore = () => {
  globalForStore.__refillGuardStore = createInitialStore();
  return getStore();
};

export const addAudit = (entry: Omit<AuditLogEntry, "id" | "timestamp" | "hash" | "previousHash">) => {
  const store = getStore();
  const previousHash = store.audit[0]?.hash;
  const auditEntryWithoutHash: Omit<AuditLogEntry, "hash"> = {
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    previousHash,
    ...entry
  };
  const auditEntry: AuditLogEntry = {
    ...auditEntryWithoutHash,
    hash: createAuditHash(auditEntryWithoutHash)
  };
  store.audit.unshift(auditEntry);
  return auditEntry;
};

export const addPendingConsent = (pending: Omit<PendingConsent, "id" | "status" | "createdAt">) => {
  const store = getStore();
  const entry: PendingConsent = {
    id: `consent_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    ...pending
  };
  store.pendingConsents.unshift(entry);
  return entry;
};

export const getPendingConsent = (id: string) => getStore().pendingConsents.find((item) => item.id === id);

export const resolvePendingConsent = (id: string, status: "approved" | "rejected") => {
  const pending = getPendingConsent(id);
  if (!pending) return null;
  pending.status = status;
  pending.resolvedAt = new Date().toISOString();
  return pending;
};

export const getT3nRuntimeStatus = (): T3nRuntimeStatus => {
  const store = getStore();
  const mode = process.env.DEMO_MODE === "false" ? "live" : "demo";
  const invocationActor = process.env.T3N_USE_SEPARATE_AGENT === "true" ? "separate_agent" : "user_self_call";
  const allowedHosts = (process.env.T3N_ALLOWED_HOSTS ?? "guardian-demo.refillguard.local,watsons-demo.refillguard.local,pet-lovers-demo.refillguard.local")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    mode,
    environment: (process.env.T3N_ENVIRONMENT ?? (process.env.T3N_SANDBOX_MODE === "false" ? "production" : "testnet")) as "testnet" | "production",
    invocationActor,
    userDid: process.env.T3N_USER_ID || store.user.t3nUserId,
    agentDid: process.env.T3N_AGENT_DID || store.agent.t3nAgentId,
    agentFunded: process.env.T3N_AGENT_FUNDED === "true",
    contractName: process.env.T3N_SCRIPT_NAME ?? `z:<tenant>:${process.env.T3N_CONTRACT_TAIL ?? "refillguard-auth"}`,
    contractId: process.env.T3N_CONTRACT_ID,
    contractVersion: process.env.T3N_CONTRACT_VERSION,
    functionName: "authorize-purchase",
    allowedHosts
  };
};

function createAuditHash(entry: Omit<AuditLogEntry, "hash">) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        previousHash: entry.previousHash,
        actorType: entry.actorType,
        actorId: entry.actorId,
        eventType: entry.eventType,
        title: entry.title,
        details: entry.details,
        decision: entry.decision,
        executionId: entry.executionId
      })
    )
    .digest("hex");
}

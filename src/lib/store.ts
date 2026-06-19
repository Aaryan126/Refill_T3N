import { demoAgent, demoUser, seedAudit, seedInventory, seedMandates, seedProducts } from "./seed";
import type { AuditLogEntry, InventoryItem, RefillMandate } from "./types";

type DemoStore = {
  user: typeof demoUser;
  agent: typeof demoAgent;
  mandates: RefillMandate[];
  inventory: InventoryItem[];
  products: typeof seedProducts;
  audit: AuditLogEntry[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createInitialStore = (): DemoStore => ({
  user: clone(demoUser),
  agent: clone(demoAgent),
  mandates: clone(seedMandates),
  inventory: clone(seedInventory),
  products: clone(seedProducts),
  audit: clone(seedAudit)
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

export const addAudit = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
  const store = getStore();
  const auditEntry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  store.audit.unshift(auditEntry);
  return auditEntry;
};

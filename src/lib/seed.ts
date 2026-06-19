import type {
  AgentIdentity,
  AuditLogEntry,
  InventoryItem,
  MerchantProduct,
  RefillMandate,
  User
} from "./types";

const now = new Date("2026-06-18T10:30:00.000Z").toISOString();

export const demoUser: User = {
  id: "user_demo_001",
  displayName: "Aaryan",
  t3nUserId: "t3n_user_demo_aaryan",
  verified: true,
  sealedRefs: {
    paymentMethodRef: "t3n://payment/default_card",
    addressRef: "t3n://address/home",
    phoneRef: "t3n://phone/primary"
  }
};

export const demoAgent: AgentIdentity = {
  id: "agent_refillguard_v1",
  name: "RefillGuard Agent",
  version: "1.0.0",
  t3nAgentId: "t3n_agent_refillguard_v1",
  verified: true
};

export const seedMandates: RefillMandate[] = [
  {
    id: "mandate_lens_001",
    userId: demoUser.id,
    agentId: demoAgent.id,
    status: "active",
    category: "contact_lens_solution",
    approvedSkus: ["opti_free_puremoist_300ml", "renu_fresh_355ml"],
    approvedMerchants: ["guardian_demo", "watsons_demo"],
    maxPriceSgd: 18,
    maxQuantity: 1,
    trigger: { type: "stock_percentage", thresholdPercent: 20 },
    delivery: { maxDays: 3 },
    requiresUserConfirmation: false,
    sensitiveFieldRefs: demoUser.sealedRefs,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "mandate_pet_001",
    userId: demoUser.id,
    agentId: demoAgent.id,
    status: "active",
    category: "pet_food",
    approvedSkus: ["royal_canin_indoor_cat_2kg"],
    approvedMerchants: ["pet_lovers_demo"],
    maxPriceSgd: 35,
    maxQuantity: 1,
    trigger: { type: "days_remaining", thresholdDays: 4 },
    delivery: { maxDays: 3 },
    requiresUserConfirmation: false,
    sensitiveFieldRefs: demoUser.sealedRefs,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "mandate_allergy_001",
    userId: demoUser.id,
    agentId: demoAgent.id,
    status: "active",
    category: "allergy_tablets",
    approvedSkus: ["loratadine_demo_10mg"],
    approvedMerchants: ["guardian_demo"],
    maxPriceSgd: 12,
    maxQuantity: 1,
    trigger: { type: "unit_count", thresholdUnits: 3 },
    delivery: { maxDays: 2 },
    requiresUserConfirmation: true,
    sensitiveFieldRefs: demoUser.sealedRefs,
    createdAt: now,
    updatedAt: now
  }
];

export const seedInventory: InventoryItem[] = [
  {
    id: "inventory_lens_001",
    userId: demoUser.id,
    mandateId: "mandate_lens_001",
    name: "Contact Lens Solution",
    category: "contact_lens_solution",
    currentPercent: 15,
    lastUpdatedAt: now
  },
  {
    id: "inventory_pet_001",
    userId: demoUser.id,
    mandateId: "mandate_pet_001",
    name: "Royal Canin Indoor Cat Food",
    category: "pet_food",
    estimatedDaysRemaining: 3,
    lastUpdatedAt: now
  },
  {
    id: "inventory_allergy_001",
    userId: demoUser.id,
    mandateId: "mandate_allergy_001",
    name: "Allergy Tablets",
    category: "allergy_tablets",
    currentUnits: 2,
    lastUpdatedAt: now
  }
];

export const seedProducts: MerchantProduct[] = [
  {
    sku: "opti_free_puremoist_300ml",
    merchantId: "guardian_demo",
    merchantName: "Guardian Demo",
    name: "OPTI-FREE PureMoist Contact Lens Solution 300ml",
    category: "contact_lens_solution",
    priceSgd: 15.9,
    deliveryDays: 2,
    inStock: true,
    quantityLabel: "300ml"
  },
  {
    sku: "renu_fresh_355ml",
    merchantId: "watsons_demo",
    merchantName: "Watsons Demo",
    name: "Renu Fresh Multi-Purpose Solution 355ml",
    category: "contact_lens_solution",
    priceSgd: 17.5,
    deliveryDays: 3,
    inStock: true,
    quantityLabel: "355ml"
  },
  {
    sku: "opti_free_puremoist_300ml",
    merchantId: "watsons_demo",
    merchantName: "Watsons Demo",
    name: "OPTI-FREE PureMoist Contact Lens Solution 300ml",
    category: "contact_lens_solution",
    priceSgd: 21.9,
    deliveryDays: 2,
    inStock: true,
    quantityLabel: "300ml"
  },
  {
    sku: "cheap_unknown_solution_500ml",
    merchantId: "random_market_demo",
    merchantName: "Random Market Demo",
    name: "Cheap Contact Lens Solution 500ml",
    category: "contact_lens_solution",
    priceSgd: 9.9,
    deliveryDays: 1,
    inStock: true,
    quantityLabel: "500ml"
  },
  {
    sku: "eye_drops_refresh_15ml",
    merchantId: "guardian_demo",
    merchantName: "Guardian Demo",
    name: "Refresh Eye Drops 15ml",
    category: "other",
    priceSgd: 8.5,
    deliveryDays: 2,
    inStock: true,
    quantityLabel: "15ml"
  },
  {
    sku: "royal_canin_indoor_cat_2kg",
    merchantId: "pet_lovers_demo",
    merchantName: "Pet Lovers Centre Demo",
    name: "Royal Canin Indoor Cat Food 2kg",
    category: "pet_food",
    priceSgd: 32.8,
    deliveryDays: 2,
    inStock: true,
    quantityLabel: "2kg"
  },
  {
    sku: "loratadine_demo_10mg",
    merchantId: "guardian_demo",
    merchantName: "Guardian Demo",
    name: "Loratadine Allergy Tablets 10mg",
    category: "allergy_tablets",
    priceSgd: 9.8,
    deliveryDays: 1,
    inStock: true,
    quantityLabel: "10 tablets",
    regulated: true
  }
];

export const seedAudit: AuditLogEntry[] = [
  {
    id: "audit_seed_mandate",
    timestamp: now,
    actorType: "user",
    actorId: demoUser.id,
    eventType: "mandate_created",
    title: "Contact lens mandate created",
    details: {
      maxPriceSgd: 18,
      approvedMerchants: ["Guardian Demo", "Watsons Demo"]
    }
  }
];

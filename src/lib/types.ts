export type ProductCategory =
  | "contact_lens_solution"
  | "pet_food"
  | "cat_litter"
  | "bandages"
  | "oral_rehydration_salts"
  | "allergy_tablets"
  | "other";

export type User = {
  id: string;
  displayName: string;
  t3nUserId: string;
  verified: boolean;
  sealedRefs: {
    paymentMethodRef: string;
    addressRef: string;
    phoneRef: string;
  };
};

export type AgentIdentity = {
  id: string;
  name: string;
  version: string;
  t3nAgentId: string;
  verified: boolean;
};

export type RefillTrigger =
  | { type: "stock_percentage"; thresholdPercent: number }
  | { type: "days_remaining"; thresholdDays: number }
  | { type: "unit_count"; thresholdUnits: number };

export type RefillMandate = {
  id: string;
  userId: string;
  agentId: string;
  status: "active" | "paused" | "expired";
  category: ProductCategory;
  approvedSkus: string[];
  approvedMerchants: string[];
  maxPriceSgd: number;
  maxQuantity: number;
  trigger: RefillTrigger;
  delivery: { maxDays: number };
  requiresUserConfirmation: boolean;
  sensitiveFieldRefs: {
    paymentMethodRef: string;
    addressRef: string;
    phoneRef: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  userId: string;
  mandateId: string;
  name: string;
  category: ProductCategory;
  currentPercent?: number;
  currentUnits?: number;
  estimatedDaysRemaining?: number;
  lastUpdatedAt: string;
};

export type MerchantProduct = {
  sku: string;
  merchantId: string;
  merchantName: string;
  name: string;
  category: ProductCategory;
  priceSgd: number;
  deliveryDays: number;
  inStock: boolean;
  quantityLabel: string;
  regulated?: boolean;
};

export type PurchaseIntent = {
  id: string;
  mandateId: string;
  userId: string;
  agentId: string;
  action: "purchase_essential";
  merchantId: string;
  merchantName: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  priceSgd: number;
  quantity: number;
  deliveryDays: number;
  reason: string;
  createdAt: string;
};

export type PolicyCheck = {
  key: string;
  label: string;
  passed: boolean;
  expected?: string | number | boolean;
  actual?: string | number | boolean;
  reason?: string;
};

export type AuthorizationResult = {
  id: string;
  purchaseIntentId: string;
  approved: boolean;
  status: "approved" | "blocked" | "manual_review" | "not_needed";
  checks: PolicyCheck[];
  t3nExecutionId?: string;
  orderId?: string;
  blockedReason?: string;
  sealedFieldsUsed: string[];
  rawSecretsExposedToAgent: false;
  merchantCheckoutPayload?: {
    merchantId: string;
    sku: string;
    quantity: number;
    paymentMethod: "{{sealed:t3n.payment.default_card}}";
    deliveryAddress: "{{sealed:t3n.address.home}}";
    phone: "{{sealed:t3n.phone.primary}}";
  };
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorType: "user" | "agent" | "terminal3" | "merchant" | "system";
  actorId: string;
  eventType:
    | "mandate_created"
    | "stock_updated"
    | "llm_orchestrated"
    | "refill_not_needed"
    | "refill_needed"
    | "purchase_intent_created"
    | "authorization_approved"
    | "authorization_rejected"
    | "checkout_completed"
    | "manual_review_required";
  title: string;
  details: Record<string, unknown>;
};

export type DemoScenario =
  | "success"
  | "no_refill_needed"
  | "over_budget"
  | "unapproved_merchant"
  | "wrong_category"
  | "over_quantity"
  | "regulated_item"
  | "pet_food_success";

export type AgentRunResult = {
  scenario: DemoScenario;
  userMessage?: string;
  orchestration?: {
    model: string;
    scenario: DemoScenario;
    confidence: number;
    rationale: string;
    userFacingReply: string;
  };
  refillNeeded: boolean;
  refillReason: string;
  candidates: MerchantProduct[];
  rejectedCandidates: Array<MerchantProduct & { reasons: string[] }>;
  purchaseIntent: PurchaseIntent | null;
  policyPrecheck: { approved: boolean; checks: PolicyCheck[] };
  authorizationResult: AuthorizationResult;
};

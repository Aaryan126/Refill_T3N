# PRD.md — RefillGuard

## 1. Product Summary

**Product name:** RefillGuard  
**Hackathon track:** Best Agent utilising Terminal 3 Agent Auth SDK  
**Core demo item:** Contact lens solution  
**Secondary demo item:** Pet food  
**Safety boundary demo:** Allergy tablets or health tablets routed to manual/pharmacist review  

RefillGuard is a safe autonomous refill agent for health and pet essentials. It allows a user to delegate narrow, rule-bound purchase authority to an AI agent. The agent can reorder approved recurring essentials only when stock is low, only from approved merchants, only within budget, only in approved quantities, and without ever seeing sensitive payment, address, phone, or identity details.

Terminal 3 is central to the product. RefillGuard does not simply use Terminal 3 as a login or payment add-on. Terminal 3 acts as the trust and execution layer that verifies the human, verifies the agent, enforces the user’s mandate, substitutes sealed private data into checkout, restricts outbound merchant actions, and records an auditable decision trail.

### One-liner

> RefillGuard lets AI agents safely reorder sensitive daily essentials without exposing private data or giving the agent unlimited purchase power.

### Demo thesis

> AI agents should not be allowed to freely shop with a user’s money. RefillGuard shows how Terminal 3 makes autonomous purchasing safe: the agent can act, but only inside a user-signed mandate.

---

## 2. Problem

Many daily essentials are annoying or risky to run out of, especially health-adjacent and pet-care items:

- Contact lens solution
- Bandages
- Oral rehydration salts
- Approved allergy tablets or health essentials
- Pet food
- Cat litter

Users often already know the exact product they want, but they still need to repeatedly check stock, compare merchants, enter payment details, and reorder before they run out.

A normal AI shopping assistant is not safe enough for this use case because:

1. The agent may see sensitive personal information.
2. The agent may overbuy or buy the wrong product.
3. The agent may buy from an untrusted merchant.
4. The agent may exceed the user’s budget.
5. The agent may perform a transaction the user did not clearly authorize.
6. There may be no reliable audit trail explaining why the agent acted.

This is especially important for health-adjacent items. The product should not behave like a medical recommender or autonomous medication buyer. It should only reorder pre-approved essentials within clear boundaries.

---

## 3. Target Users

### Primary user

Busy students, young professionals, parents, pet owners, and contact lens users who repeatedly buy the same essential items and do not want to run out.

### Example persona

**Aaryan, student / young professional**

- Uses contact lenses daily.
- Buys the same trusted contact lens solution from Guardian or Watsons.
- Does not want to run out suddenly.
- Does not want an AI agent to see his card number, address, phone number, or full personal details.
- Is comfortable delegating a narrow mandate: “Buy only this product, from these merchants, under this price, when stock is low.”

### Secondary persona

**Pet owner**

- Buys the same pet food repeatedly.
- Running out is painful.
- Overbuying is inconvenient because pet food is bulky and may expire or go stale.
- Wants the same brand/flavour/size only.

---

## 4. Goals

### Product goals

1. Let users create narrow refill mandates for approved essentials.
2. Let an AI agent detect when refill is needed.
3. Let the agent search a merchant catalog and create a structured purchase intent.
4. Use Terminal 3 to verify whether the agent is allowed to execute that purchase.
5. Keep sensitive payment, address, phone, and identity details sealed from the agent.
6. Show both successful and blocked transactions.
7. Produce a clear audit log for every attempted action.

### Hackathon goals

1. Demonstrate a complete working loop.
2. Make Terminal 3 SDK central to the workflow.
3. Show creativity through safe autonomous refills for sensitive essentials.
4. Show multiple policy enforcement cases, not just one successful checkout.
5. Make the demo understandable in under 4 minutes.

---

## 5. Non-Goals

RefillGuard is not trying to solve all shopping, all healthcare, or all e-commerce automation.

For the hackathon MVP, RefillGuard will not:

1. Diagnose health conditions.
2. Recommend new medicines.
3. Purchase prescription-only or pharmacist-only items autonomously.
4. Scrape real Guardian, Watsons, or marketplace websites.
5. Integrate with real payment cards unless Terminal 3 sandbox supports it.
6. Build a full mobile app.
7. Build real IoT stock sensing.
8. Support unlimited arbitrary products.
9. Let the AI agent directly call merchant checkout without Terminal 3 authorization.

---

## 6. Core Use Case

### Main demo: Contact lens solution refill

User creates this mandate:

```text
Buy my approved contact lens solution when bottle level is below 20%.
Only buy OPTI-FREE PureMoist 300ml or Renu Fresh 355ml.
Only buy from Guardian Demo or Watsons Demo.
Maximum price: S$18.
Maximum quantity: 1 bottle.
Delivery must be within 3 days.
Use my sealed payment method and home delivery address stored in Terminal 3.
Do not expose payment, address, or phone number to the agent.
```

User updates stock:

```text
Bottle level: 15%
```

Agent decides:

```text
15% is below the 20% refill threshold.
Refill is needed.
```

Agent finds:

```text
OPTI-FREE PureMoist 300ml
Merchant: Guardian Demo
Price: S$15.90
Delivery: 2 days
Quantity: 1
```

Terminal 3 checks:

```text
Human identity verified
Agent identity verified
Delegation exists
Mandate is active
Product category allowed
SKU allowed
Merchant allowed
Price below S$18
Quantity within limit
Delivery within 3 days
Payment sealed
Address sealed
Phone sealed
```

Result:

```text
Purchase approved.
Checkout completed.
Audit log generated.
```

---

## 7. Secondary Use Cases

### 7.1 Pet food refill

Mandate:

```text
Buy Royal Canin Indoor Cat Food 2kg when fewer than 4 days remain.
Only from Pet Lovers Centre Demo.
Maximum price: S$35.
Maximum quantity: 1 bag.
Delivery within 3 days.
```

Blocked cases:

```text
Dog food instead of cat food -> blocked
Different brand -> blocked
S$42 pack -> blocked
Unapproved merchant -> blocked
2 bags -> blocked
```

### 7.2 Allergy tablets or health tablets boundary case

The agent should not autonomously buy regulated or uncertain medicines.

Demo behavior:

```text
User tries to create an autonomous refill mandate for allergy tablets.
System flags item as health/medicine category requiring review.
Agent does not complete autonomous purchase.
RefillGuard can either:
1. create a reminder,
2. open an approved pharmacy checkout flow for user confirmation,
3. or route to manual/pharmacist review.
```

UI message:

```text
Autonomous purchase blocked.
Reason: This item may require pharmacy or manual review. RefillGuard can remind you or prepare a checkout, but cannot autonomously purchase it under this mandate.
```

This demonstrates responsible boundaries and makes the product safer.

---

## 8. User Stories

### Must-have stories

1. As a user, I can create a refill mandate for an approved product.
2. As a user, I can choose approved merchants.
3. As a user, I can set a maximum price.
4. As a user, I can set a maximum quantity.
5. As a user, I can set a refill trigger.
6. As a user, I can link sealed payment and delivery details through Terminal 3.
7. As a user, I can update stock level manually.
8. As an agent, I can detect that a refill is needed.
9. As an agent, I can search a mock merchant catalog.
10. As an agent, I can create a structured purchase intent.
11. As Terminal 3, I can approve a purchase that satisfies the mandate.
12. As Terminal 3, I can reject a purchase that violates the mandate.
13. As a user, I can see why a purchase was approved or blocked.
14. As a judge, I can see that the agent never receives raw payment or address details.
15. As a judge, I can see a clear audit log.

### Nice-to-have stories

1. As a user, I can upload a photo of a bottle and set stock percentage.
2. As a user, I can track multiple essentials.
3. As a user, I can pause a mandate.
4. As a user, I can require confirmation above a certain price.
5. As a user, I can view all historical refill attempts.
6. As a user, I can see a risk label for health/medicine items.

---

## 9. MVP Scope

### MVP must include

1. Web dashboard.
2. Mandate creation form.
3. Contact lens solution tracked item.
4. Manual stock input.
5. Mock merchant catalog.
6. Agent decision engine.
7. Structured purchase intent.
8. Terminal 3 integration wrapper.
9. Successful purchase flow.
10. Blocked purchase flows.
11. Audit log UI.
12. Demo seed data.

### MVP should include

1. Pet food secondary item.
2. Allergy tablets boundary case.
3. Clickable policy-check details.
4. Simulated secret placeholders for payment/address/phone.
5. Clear UI labels showing what the agent can and cannot see.

### MVP can skip

1. Real merchant scraping.
2. Real inventory sensors.
3. Real pharmacy integration.
4. Real medical product classification API.
5. Advanced LLM reasoning.
6. Mobile responsiveness beyond basic web layout.

---

## 10. Judging Alignment

### Completeness: 30%

RefillGuard should show a full working loop:

```text
Create mandate
-> Update stock
-> Agent detects refill need
-> Agent searches products
-> Agent creates purchase intent
-> Terminal 3 verifies action
-> Checkout succeeds or fails
-> Audit log appears
```

Success criteria:

- Demo does not stop at recommendation.
- Demo shows a completed authorized transaction.
- Demo shows multiple blocked transactions.
- Demo has polished UI and clear state transitions.

### SDK integration: 40%

Terminal 3 is central because it performs the trust-critical operations:

1. Human identity verification.
2. Agent identity verification.
3. User-to-agent delegation.
4. Mandate enforcement.
5. Sensitive field substitution.
6. Outbound merchant authorization.
7. Payment execution through sealed references.
8. Audit logging.

Success criteria:

- The agent cannot checkout directly.
- The agent submits a purchase intent to Terminal 3.
- Terminal 3 decides whether execution is allowed.
- The agent never sees raw payment/address/phone values.
- Rejected actions have clear policy reasons.

### Creativity: 30%

RefillGuard is creative because it applies agent authorization to health-adjacent and pet essentials, where both convenience and safety matter. It is more compelling than a generic shopping bot because the product intentionally limits autonomy rather than maximizing it.

Success criteria:

- Use case feels real.
- Autonomous action is justified.
- Safety boundaries are visible.
- Contact lens solution and pet food show repeat-purchase value.
- Allergy tablets boundary case shows responsible design.

---

## 11. Product Principles

1. **Bounded autonomy over full autonomy**  
   The agent should act only inside narrow user-defined rules.

2. **Deterministic policy over prompt trust**  
   The LLM may reason, but purchase approval must be rule-based and enforced by Terminal 3.

3. **Sealed secrets by default**  
   Payment, address, phone, and identity details should never enter agent context.

4. **Clear denial is a feature**  
   Blocked purchases should be celebrated in the demo because they prove the safety layer works.

5. **No medical decision-making**  
   The system reorders pre-approved essentials. It does not recommend treatment or choose new medicines.

6. **Auditability matters**  
   Every action should answer: who acted, under what mandate, what was attempted, what passed, what failed, and what happened.

---

## 12. System Architecture

### High-level architecture

```text
User Web App
  |
  | create mandate / update stock
  v
RefillGuard Backend
  |
  | inventory state + mandate rules
  v
Agent Decision Engine
  |
  | product search + purchase intent
  v
Local Policy Pre-Check
  |
  | valid structured intent
  v
Terminal 3 ADK / Agent Auth SDK
  |
  | identity + delegation + sealed fields + allowed outbound action
  v
Mock Merchant Checkout API
  |
  | checkout result
  v
Audit Log + UI
```

### Key rule

The agent must never call merchant checkout directly. All checkout attempts must go through the Terminal 3 execution path.

---

## 13. Core Components

### 13.1 Frontend

Recommended stack:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui or simple custom components
```

Main screens:

1. Dashboard
2. Create Mandate
3. Agent Run / Simulation
4. Authorization Result
5. Audit Log

### 13.2 Backend

Recommended stack:

```text
Next.js API routes or Express
TypeScript
SQLite or JSON file for demo persistence
```

Backend modules:

```text
/inventory
/mandates
/products
/agent
/policy
/t3n
/merchant
/audit
```

### 13.3 Agent Decision Engine

Responsibilities:

1. Read mandate.
2. Read current inventory state.
3. Decide whether refill is needed.
4. Search mock product catalog.
5. Rank valid products.
6. Create structured purchase intent.
7. Explain decision.

The agent can use an LLM for natural language explanation, but candidate filtering should be deterministic.

### 13.4 Terminal 3 Integration Layer

Responsibilities:

1. Register or reference verified user identity.
2. Register or reference agent identity.
3. Create or reference user delegation/mandate.
4. Submit purchase intent for authorization.
5. Substitute sealed sensitive fields into checkout request.
6. Restrict outbound calls to approved merchants.
7. Return approved/rejected result.
8. Return audit metadata.

### 13.5 Mock Merchant API

Responsibilities:

1. Provide product catalog.
2. Accept checkout request.
3. Return order confirmation.
4. Provide failure states for demo.

---

## 14. Data Models

### 14.1 User

```ts
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
```

### 14.2 Agent

```ts
export type AgentIdentity = {
  id: string;
  name: string;
  version: string;
  t3nAgentId: string;
  verified: boolean;
};
```

### 14.3 Mandate

```ts
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
  delivery: {
    maxDays: number;
  };
  requiresUserConfirmation: boolean;
  sensitiveFieldRefs: {
    paymentMethodRef: string;
    addressRef: string;
    phoneRef: string;
  };
  createdAt: string;
  updatedAt: string;
};
```

### 14.4 Product Category

```ts
export type ProductCategory =
  | "contact_lens_solution"
  | "pet_food"
  | "cat_litter"
  | "bandages"
  | "oral_rehydration_salts"
  | "allergy_tablets"
  | "other";
```

### 14.5 Refill Trigger

```ts
export type RefillTrigger =
  | {
      type: "stock_percentage";
      thresholdPercent: number;
    }
  | {
      type: "days_remaining";
      thresholdDays: number;
    }
  | {
      type: "unit_count";
      thresholdUnits: number;
    };
```

### 14.6 Inventory Item

```ts
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
```

### 14.7 Merchant Product

```ts
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
  imageUrl?: string;
  regulated?: boolean;
};
```

### 14.8 Purchase Intent

```ts
export type PurchaseIntent = {
  id: string;
  mandateId: string;
  userId: string;
  agentId: string;
  action: "purchase_essential";
  merchantId: string;
  sku: string;
  category: ProductCategory;
  priceSgd: number;
  quantity: number;
  deliveryDays: number;
  reason: string;
  createdAt: string;
};
```

### 14.9 Policy Check

```ts
export type PolicyCheck = {
  key: string;
  label: string;
  passed: boolean;
  expected?: string | number | boolean;
  actual?: string | number | boolean;
  reason?: string;
};
```

### 14.10 Authorization Result

```ts
export type AuthorizationResult = {
  id: string;
  purchaseIntentId: string;
  approved: boolean;
  checks: PolicyCheck[];
  t3nExecutionId?: string;
  orderId?: string;
  blockedReason?: string;
  sealedFieldsUsed: string[];
  rawSecretsExposedToAgent: false;
  createdAt: string;
};
```

### 14.11 Audit Log

```ts
export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorType: "user" | "agent" | "terminal3" | "merchant" | "system";
  actorId: string;
  eventType:
    | "mandate_created"
    | "stock_updated"
    | "refill_needed"
    | "purchase_intent_created"
    | "authorization_approved"
    | "authorization_rejected"
    | "checkout_completed"
    | "manual_review_required";
  title: string;
  details: Record<string, unknown>;
};
```

---

## 15. Seed Demo Data

### 15.1 User

```json
{
  "id": "user_demo_001",
  "displayName": "Aaryan",
  "t3nUserId": "t3n_user_demo_aaryan",
  "verified": true,
  "sealedRefs": {
    "paymentMethodRef": "t3n://payment/default_card",
    "addressRef": "t3n://address/home",
    "phoneRef": "t3n://phone/primary"
  }
}
```

### 15.2 Agent

```json
{
  "id": "agent_refillguard_v1",
  "name": "RefillGuard Agent",
  "version": "1.0.0",
  "t3nAgentId": "t3n_agent_refillguard_v1",
  "verified": true
}
```

### 15.3 Contact Lens Mandate

```json
{
  "id": "mandate_lens_001",
  "userId": "user_demo_001",
  "agentId": "agent_refillguard_v1",
  "status": "active",
  "category": "contact_lens_solution",
  "approvedSkus": ["opti_free_puremoist_300ml", "renu_fresh_355ml"],
  "approvedMerchants": ["guardian_demo", "watsons_demo"],
  "maxPriceSgd": 18,
  "maxQuantity": 1,
  "trigger": {
    "type": "stock_percentage",
    "thresholdPercent": 20
  },
  "delivery": {
    "maxDays": 3
  },
  "requiresUserConfirmation": false,
  "sensitiveFieldRefs": {
    "paymentMethodRef": "t3n://payment/default_card",
    "addressRef": "t3n://address/home",
    "phoneRef": "t3n://phone/primary"
  }
}
```

### 15.4 Product Catalog

```json
[
  {
    "sku": "opti_free_puremoist_300ml",
    "merchantId": "guardian_demo",
    "merchantName": "Guardian Demo",
    "name": "OPTI-FREE PureMoist Contact Lens Solution 300ml",
    "category": "contact_lens_solution",
    "priceSgd": 15.9,
    "deliveryDays": 2,
    "inStock": true,
    "quantityLabel": "300ml"
  },
  {
    "sku": "renu_fresh_355ml",
    "merchantId": "watsons_demo",
    "merchantName": "Watsons Demo",
    "name": "Renu Fresh Multi-Purpose Solution 355ml",
    "category": "contact_lens_solution",
    "priceSgd": 17.5,
    "deliveryDays": 3,
    "inStock": true,
    "quantityLabel": "355ml"
  },
  {
    "sku": "opti_free_puremoist_300ml",
    "merchantId": "watsons_demo",
    "merchantName": "Watsons Demo",
    "name": "OPTI-FREE PureMoist Contact Lens Solution 300ml",
    "category": "contact_lens_solution",
    "priceSgd": 21.9,
    "deliveryDays": 2,
    "inStock": true,
    "quantityLabel": "300ml"
  },
  {
    "sku": "cheap_unknown_solution_500ml",
    "merchantId": "random_market_demo",
    "merchantName": "Random Market Demo",
    "name": "Cheap Contact Lens Solution 500ml",
    "category": "contact_lens_solution",
    "priceSgd": 9.9,
    "deliveryDays": 1,
    "inStock": true,
    "quantityLabel": "500ml"
  },
  {
    "sku": "eye_drops_refresh_15ml",
    "merchantId": "guardian_demo",
    "merchantName": "Guardian Demo",
    "name": "Refresh Eye Drops 15ml",
    "category": "other",
    "priceSgd": 8.5,
    "deliveryDays": 2,
    "inStock": true,
    "quantityLabel": "15ml"
  }
]
```

---

## 16. Functional Requirements

### FR1: Create refill mandate

The user can create a mandate with:

- product category
- approved SKU list
- approved merchant list
- maximum price
- maximum quantity
- refill trigger
- maximum delivery days
- confirmation requirement
- sealed payment/address/phone references

Acceptance criteria:

- Mandate is saved.
- Mandate appears on dashboard.
- Mandate status is active by default.
- UI clearly shows what the agent is allowed to do.
- UI clearly shows what data is sealed by Terminal 3.

### FR2: Update stock level

The user can update stock level for an item.

For contact lens solution:

- stock percentage slider or input
- demo preset buttons: 50%, 15%, 5%

Acceptance criteria:

- Stock update is saved.
- Audit log records the update.
- Agent can run after stock update.

### FR3: Detect refill need

The system determines whether refill is needed based on the mandate trigger.

Acceptance criteria:

- If bottle level is 15% and threshold is 20%, refill is needed.
- If bottle level is 50% and threshold is 20%, refill is not needed.
- Result appears in UI with explanation.

### FR4: Product search

The agent searches mock merchant catalog.

Acceptance criteria:

- Products are returned from multiple merchants.
- UI can show valid and invalid candidates.
- Invalid products include reason labels.

### FR5: Create purchase intent

The agent creates a structured purchase intent for the best valid product.

Acceptance criteria:

- Purchase intent includes mandate ID, agent ID, merchant, SKU, category, price, quantity, delivery days, and reason.
- Purchase intent does not include raw payment, address, or phone.
- Purchase intent is displayed before authorization.

### FR6: Local policy pre-check

Before calling Terminal 3, the backend performs deterministic validation.

Acceptance criteria:

- Merchant must be approved.
- SKU must be approved.
- Category must match.
- Price must be within budget.
- Quantity must be within limit.
- Delivery must be within allowed days.
- Regulated item flag must route to manual review where applicable.

### FR7: Terminal 3 authorization

The purchase intent is sent to Terminal 3 for final authorization and execution.

Acceptance criteria:

- Terminal 3 verifies human/user identity.
- Terminal 3 verifies agent identity.
- Terminal 3 verifies mandate/delegation.
- Terminal 3 enforces policy constraints.
- Terminal 3 uses sealed payment/address/phone references.
- Terminal 3 returns approved or rejected result.
- Agent never receives raw secrets.

### FR8: Checkout execution

If Terminal 3 approves, checkout is performed against mock merchant API.

Acceptance criteria:

- Approved purchase returns order ID.
- Order confirmation appears in UI.
- Audit log records checkout.

### FR9: Blocked cases

The app must support demo buttons for blocked cases.

Required blocked cases:

1. Over budget: S$21.90 vs S$18 limit.
2. Unapproved merchant: Random Market Demo.
3. Wrong category: eye drops instead of contact lens solution.
4. Over quantity: 2 bottles vs max 1.
5. Health/medicine boundary: allergy tablets require manual review.

Acceptance criteria:

- Each blocked case clearly shows failed checks.
- UI explains why Terminal 3 rejected or did not execute the action.
- Audit log records rejected action.

### FR10: Audit log

Every important action creates an audit entry.

Acceptance criteria:

- Mandate creation logged.
- Stock update logged.
- Refill decision logged.
- Purchase intent logged.
- Authorization result logged.
- Checkout result logged.
- Rejection reason logged.

---

## 17. API Design

### 17.1 Mandates

#### `GET /api/mandates`

Returns all mandates for demo user.

#### `POST /api/mandates`

Creates a new mandate.

Request:

```json
{
  "category": "contact_lens_solution",
  "approvedSkus": ["opti_free_puremoist_300ml"],
  "approvedMerchants": ["guardian_demo", "watsons_demo"],
  "maxPriceSgd": 18,
  "maxQuantity": 1,
  "trigger": {
    "type": "stock_percentage",
    "thresholdPercent": 20
  },
  "delivery": {
    "maxDays": 3
  },
  "requiresUserConfirmation": false
}
```

### 17.2 Inventory

#### `GET /api/inventory`

Returns tracked items.

#### `POST /api/inventory/:itemId/update`

Updates stock level.

Request:

```json
{
  "currentPercent": 15
}
```

### 17.3 Agent Run

#### `POST /api/agent/run`

Runs agent for a mandate.

Request:

```json
{
  "mandateId": "mandate_lens_001",
  "scenario": "success"
}
```

Supported scenarios:

```text
success
over_budget
unapproved_merchant
wrong_category
over_quantity
regulated_item
no_refill_needed
```

Response:

```json
{
  "refillNeeded": true,
  "purchaseIntent": {
    "merchantId": "guardian_demo",
    "sku": "opti_free_puremoist_300ml",
    "category": "contact_lens_solution",
    "priceSgd": 15.9,
    "quantity": 1,
    "deliveryDays": 2,
    "reason": "Bottle level is 15%, below 20% threshold."
  },
  "policyPrecheck": {
    "approved": true,
    "checks": []
  },
  "authorizationResult": {
    "approved": true,
    "orderId": "order_demo_001"
  }
}
```

### 17.4 Agent Chat

#### `POST /api/agent/chat`

Uses OpenAI to map a free-form user message to one supported agent scenario, then runs the same T3N-gated agent workflow.

Request:

```json
{
  "message": "My lens solution is low. Refill it if the mandate allows it."
}
```

Response includes the normal agent run payload plus:

```json
{
  "userMessage": "My lens solution is low. Refill it if the mandate allows it.",
  "orchestration": {
    "model": "gpt-5.4-mini",
    "scenario": "success",
    "confidence": 0.94,
    "rationale": "The user requested a normal approved contact lens solution refill.",
    "userFacingReply": "I mapped this to an approved lens solution refill request."
  }
}
```

### 17.5 Products

#### `GET /api/products?category=contact_lens_solution`

Returns mock products.

### 17.6 Audit

#### `GET /api/audit`

Returns audit log.

---

## 18. Terminal 3 Integration Contract

### 18.1 Integration goal

The app must demonstrate that Terminal 3 is responsible for execution-time authorization and sensitive data handling.

### 18.2 Purchase authorization input

```ts
export type T3nPurchaseAuthorizationInput = {
  userId: string;
  agentId: string;
  mandateId: string;
  purchaseIntent: {
    action: "purchase_essential";
    merchantId: string;
    sku: string;
    category: ProductCategory;
    priceSgd: number;
    quantity: number;
    deliveryDays: number;
  };
  sealedRefs: {
    paymentMethodRef: string;
    addressRef: string;
    phoneRef: string;
  };
};
```

### 18.3 Purchase authorization output

```ts
export type T3nPurchaseAuthorizationOutput = {
  approved: boolean;
  t3nExecutionId: string;
  checks: PolicyCheck[];
  sealedFieldsUsed: string[];
  merchantCheckoutPayload?: {
    merchantId: string;
    sku: string;
    quantity: number;
    paymentMethod: "{{sealed:t3n.payment.default_card}}";
    deliveryAddress: "{{sealed:t3n.address.home}}";
    phone: "{{sealed:t3n.phone.primary}}";
  };
  blockedReason?: string;
};
```

### 18.4 Sensitive fields

The agent must never receive these plaintext values:

```text
card number
billing address
delivery address
phone number
identity document number
full legal identity fields
```

Instead, the agent and backend should reference sealed placeholders:

```text
t3n://payment/default_card
t3n://address/home
t3n://phone/primary
```

### 18.5 Required Terminal 3 checks shown in UI

```text
Human identity verified
Agent identity verified
Mandate active
Delegation scope valid
Merchant allowed
Outbound host allowed
Product category allowed
SKU allowed
Budget valid
Quantity valid
Delivery valid
Sensitive fields sealed
Audit log generated
```

---

## 19. Agent Logic

### 19.1 Refill decision

```ts
export function shouldRefill(item: InventoryItem, mandate: RefillMandate): boolean {
  if (mandate.trigger.type === "stock_percentage") {
    return (item.currentPercent ?? 100) < mandate.trigger.thresholdPercent;
  }

  if (mandate.trigger.type === "days_remaining") {
    return (item.estimatedDaysRemaining ?? Infinity) < mandate.trigger.thresholdDays;
  }

  if (mandate.trigger.type === "unit_count") {
    return (item.currentUnits ?? Infinity) < mandate.trigger.thresholdUnits;
  }

  return false;
}
```

### 19.2 Product filtering

```ts
export function getCandidateProducts(
  products: MerchantProduct[],
  mandate: RefillMandate
): MerchantProduct[] {
  return products.filter((product) => {
    return (
      product.category === mandate.category &&
      mandate.approvedSkus.includes(product.sku) &&
      mandate.approvedMerchants.includes(product.merchantId) &&
      product.priceSgd <= mandate.maxPriceSgd &&
      product.deliveryDays <= mandate.delivery.maxDays &&
      product.inStock === true &&
      product.regulated !== true
    );
  });
}
```

### 19.3 Product selection

Default strategy:

1. Filter valid candidates.
2. Sort by price ascending.
3. Prefer faster delivery if price difference is small.
4. Pick one product.

```ts
export function selectBestProduct(candidates: MerchantProduct[]): MerchantProduct | null {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    if (a.priceSgd !== b.priceSgd) return a.priceSgd - b.priceSgd;
    return a.deliveryDays - b.deliveryDays;
  })[0];
}
```

### 19.4 Purchase intent creation

```ts
export function createPurchaseIntent(params: {
  userId: string;
  agentId: string;
  mandate: RefillMandate;
  product: MerchantProduct;
  reason: string;
}): PurchaseIntent {
  return {
    id: crypto.randomUUID(),
    mandateId: params.mandate.id,
    userId: params.userId,
    agentId: params.agentId,
    action: "purchase_essential",
    merchantId: params.product.merchantId,
    sku: params.product.sku,
    category: params.product.category,
    priceSgd: params.product.priceSgd,
    quantity: 1,
    deliveryDays: params.product.deliveryDays,
    reason: params.reason,
    createdAt: new Date().toISOString()
  };
}
```

---

## 20. Policy Validation

### 20.1 Local policy pre-check

```ts
export function validatePurchaseIntent(
  intent: PurchaseIntent,
  mandate: RefillMandate
): { approved: boolean; checks: PolicyCheck[] } {
  const checks: PolicyCheck[] = [
    {
      key: "category",
      label: "Product category matches mandate",
      passed: intent.category === mandate.category,
      expected: mandate.category,
      actual: intent.category
    },
    {
      key: "merchant",
      label: "Merchant is approved",
      passed: mandate.approvedMerchants.includes(intent.merchantId),
      expected: mandate.approvedMerchants.join(", "),
      actual: intent.merchantId
    },
    {
      key: "sku",
      label: "SKU is approved",
      passed: mandate.approvedSkus.includes(intent.sku),
      expected: mandate.approvedSkus.join(", "),
      actual: intent.sku
    },
    {
      key: "budget",
      label: "Price is within budget",
      passed: intent.priceSgd <= mandate.maxPriceSgd,
      expected: mandate.maxPriceSgd,
      actual: intent.priceSgd
    },
    {
      key: "quantity",
      label: "Quantity is within limit",
      passed: intent.quantity <= mandate.maxQuantity,
      expected: mandate.maxQuantity,
      actual: intent.quantity
    },
    {
      key: "delivery",
      label: "Delivery is within allowed window",
      passed: intent.deliveryDays <= mandate.delivery.maxDays,
      expected: mandate.delivery.maxDays,
      actual: intent.deliveryDays
    }
  ];

  return {
    approved: checks.every((check) => check.passed),
    checks
  };
}
```

### 20.2 Why local policy check exists

The local policy check improves explainability and UI responsiveness. It does not replace Terminal 3. Terminal 3 remains the final execution gate.

---

## 21. UI Requirements

### 21.1 Dashboard

Dashboard cards:

```text
Contact Lens Solution
Current level: 15%
Status: Refill needed
Mandate: Active
Budget: S$18
Merchants: Guardian Demo, Watsons Demo
Sensitive data: Sealed by Terminal 3

Pet Food
Days remaining: 3
Status: Refill needed soon
Mandate: Active

Allergy Tablets
Status: Manual review required
```

Primary actions:

```text
Run Agent
Create Mandate
Update Stock
View Audit Log
```

### 21.2 Mandate creation screen

Fields:

```text
Product category
Approved product/SKU
Approved merchants
Maximum price
Maximum quantity
Refill trigger
Maximum delivery time
Require confirmation toggle
Sealed payment reference
Sealed address reference
Sealed phone reference
```

Important UI copy:

```text
The agent can request a purchase, but Terminal 3 decides whether it is allowed.
Your payment, address, and phone number are never shown to the agent.
```

### 21.3 Agent run screen

Timeline:

```text
1. Stock checked
2. Refill threshold crossed
3. Product catalog searched
4. Purchase intent created
5. Sent to Terminal 3
6. Authorization result returned
7. Checkout completed or blocked
```

### 21.4 Authorization result screen

Approved state:

```text
Purchase Approved
OPTI-FREE PureMoist Contact Lens Solution 300ml
Guardian Demo
S$15.90
Delivery: 2 days
Order ID: order_demo_001
```

Checks:

```text
✅ Human identity verified
✅ Agent identity verified
✅ Mandate active
✅ Merchant approved
✅ SKU approved
✅ Category approved
✅ Price within S$18
✅ Quantity within limit
✅ Delivery within 3 days
✅ Payment sealed
✅ Address sealed
✅ Audit log generated
```

Rejected state:

```text
Purchase Blocked
Reason: Merchant is not approved under this mandate.
```

Checks:

```text
✅ Human identity verified
✅ Agent identity verified
✅ Mandate active
❌ Merchant approved
✅ Price within budget
✅ Quantity within limit
✅ Payment sealed
```

### 21.5 Audit log screen

Table columns:

```text
Time
Actor
Event
Result
Details
```

Example rows:

```text
10:32 User       Mandate created              Active
10:33 User       Stock updated                15%
10:33 Agent      Refill needed                Below 20%
10:33 Agent      Purchase intent created      Guardian S$15.90
10:33 Terminal3  Authorization approved       All checks passed
10:33 Merchant   Checkout completed           Order #001
```

---

## 22. Demo Script

### 22.1 Opening

```text
RefillGuard is a safe autonomous refill agent for health and pet essentials. Today I am showing contact lens solution. This is something users do not want to run out of, but they also do not want an AI agent to freely spend money or see private payment and address details.
```

### 22.2 Mandate

```text
The user delegates a narrow mandate: buy only approved contact lens solution, only from Guardian or Watsons, under S$18, max one bottle, only when bottle level is below 20%.
```

### 22.3 Refill trigger

```text
The user updates the bottle level to 15%. The agent detects that this crosses the refill threshold.
```

### 22.4 Agent selection

```text
The agent searches the merchant catalog and finds OPTI-FREE PureMoist from Guardian for S$15.90 with delivery in 2 days.
```

### 22.5 Terminal 3 authorization

```text
The agent cannot checkout directly. It sends a structured purchase intent to Terminal 3. Terminal 3 verifies the human, verifies the agent, checks the mandate, enforces merchant, SKU, price, quantity, and delivery rules, and substitutes sealed payment and address details.
```

### 22.6 Approval

```text
Because every rule is satisfied, Terminal 3 approves the purchase and checkout succeeds. The agent never saw the payment method, address, or phone number.
```

### 22.7 Blocked cases

```text
Now I will show why Terminal 3 matters. If the agent tries a cheaper random merchant, it is blocked. If the product is over budget, it is blocked. If it picks eye drops instead of contact lens solution, it is blocked. If it tries to buy allergy tablets autonomously, it is routed to manual review.
```

### 22.8 Closing

```text
The key idea is bounded autonomy. The agent can act, but it cannot overreach. Terminal 3 is the trust layer that makes autonomous purchasing safe enough for sensitive daily essentials.
```

---

## 23. Demo Scenarios

### Scenario A: Successful contact lens refill

Input:

```text
Bottle level: 15%
```

Selected product:

```text
Guardian Demo
OPTI-FREE PureMoist 300ml
S$15.90
Delivery 2 days
```

Expected result:

```text
Approved
```

### Scenario B: No refill needed

Input:

```text
Bottle level: 50%
```

Expected result:

```text
No purchase intent created
Reason: Stock is above threshold
```

### Scenario C: Over budget

Product:

```text
Watsons Demo
OPTI-FREE PureMoist 300ml
S$21.90
```

Expected result:

```text
Blocked
Reason: Price exceeds S$18 mandate
```

### Scenario D: Unapproved merchant

Product:

```text
Random Market Demo
Cheap Contact Lens Solution 500ml
S$9.90
```

Expected result:

```text
Blocked
Reason: Merchant not approved
```

### Scenario E: Wrong category

Product:

```text
Guardian Demo
Refresh Eye Drops 15ml
S$8.50
```

Expected result:

```text
Blocked
Reason: Product category is not contact lens solution
```

### Scenario F: Over quantity

Attempt:

```text
Buy 2 bottles
```

Expected result:

```text
Blocked
Reason: Quantity exceeds max 1
```

### Scenario G: Allergy tablets manual review

Attempt:

```text
Buy allergy tablets autonomously
```

Expected result:

```text
Manual review required
Reason: Health/medicine item may require pharmacy or user confirmation flow
```

---

## 24. Safety and Compliance Design

### Health-related guardrails

1. The agent does not diagnose.
2. The agent does not recommend new medication.
3. The agent does not change dosage.
4. The agent does not buy prescription-only items autonomously.
5. The agent does not buy pharmacist-only items autonomously.
6. The agent only reorders pre-approved health-adjacent essentials.
7. Uncertain medicine categories are routed to manual review.

### Product category handling

```text
Safe autonomous demo categories:
- contact lens solution
- bandages
- oral rehydration salts, if treated as pre-approved essential
- pet food
- cat litter

Manual review categories:
- allergy tablets
- pain relief tablets
- any medicine-like product
- anything with dosage or pharmacist guidance
```

### UI disclaimer

```text
RefillGuard does not provide medical advice or recommend treatment. It only helps reorder pre-approved essentials under user-defined mandates. Medicine-like items may require manual review or pharmacist checkout.
```

---

## 25. Security Requirements

### SR1: No raw secrets in agent context

The following must not appear in agent prompts, logs, or purchase intents:

```text
raw card number
CVV
full address
phone number
identity document number
```

### SR2: Structured purchase intents only

The agent must output structured JSON, not directly execute code or checkout.

### SR3: Terminal 3 final gate

Every checkout attempt must pass through Terminal 3 authorization.

### SR4: Merchant allowlist

Only approved merchants can be called.

### SR5: Audit everything

Every attempted action must create an audit log entry.

### SR6: Rejection by default

If mandate is missing, expired, ambiguous, or mismatched, reject the purchase.

---

## 26. Implementation Plan

### Phase 1: Project setup

Tasks:

1. Create Next.js TypeScript app.
2. Add Tailwind.
3. Create basic layout.
4. Add demo seed data.
5. Create mock product catalog.

Deliverable:

```text
Dashboard loads with seeded contact lens mandate and inventory state.
```

### Phase 2: Mandates and inventory

Tasks:

1. Implement mandate data model.
2. Implement inventory update.
3. Implement stock threshold logic.
4. Add audit events for mandate and stock changes.

Deliverable:

```text
User can update bottle level and see whether refill is needed.
```

### Phase 3: Agent decision engine

Tasks:

1. Implement product search.
2. Implement deterministic filtering.
3. Implement best product selection.
4. Implement purchase intent creation.
5. Add scenario switcher for demo cases.

Deliverable:

```text
Agent can create purchase intent for valid product and invalid demo scenarios.
```

### Phase 4: Policy validation

Tasks:

1. Implement local policy pre-check.
2. Add check cards to UI.
3. Add blocked reason messages.
4. Add audit events.

Deliverable:

```text
Blocked cases show exact failed rules.
```

### Phase 5: Terminal 3 integration

Tasks:

1. Connect Terminal 3 SDK / ADK.
2. Create or reference user identity.
3. Create or reference agent identity.
4. Create or reference delegation/mandate.
5. Send purchase intent to Terminal 3.
6. Use sealed refs for payment/address/phone.
7. Execute approved checkout via mock merchant.
8. Store Terminal 3 execution ID or authorization result.

Deliverable:

```text
Successful purchase and blocked purchases go through Terminal 3 path.
```

### Phase 6: UI polish and pitch flow

Tasks:

1. Polish dashboard.
2. Add timeline animation or stepper.
3. Add large Terminal 3 authorization card.
4. Add demo buttons.
5. Add audit log.
6. Add final pitch copy.

Deliverable:

```text
4-minute demo is smooth and understandable.
```

---

## 27. Suggested File Structure

```text
refillguard/
  README.md
  PRD.md
  package.json
  .env.example
  src/
    app/
      page.tsx
      mandates/page.tsx
      audit/page.tsx
      api/
        mandates/route.ts
        inventory/route.ts
        products/route.ts
        agent/run/route.ts
        audit/route.ts
    components/
      DashboardCard.tsx
      MandateCard.tsx
      InventoryControl.tsx
      AgentTimeline.tsx
      AuthorizationResultCard.tsx
      PolicyCheckList.tsx
      AuditLogTable.tsx
      DemoScenarioButtons.tsx
    lib/
      seed.ts
      types.ts
      inventory.ts
      products.ts
      agent.ts
      policy.ts
      audit.ts
      t3n.ts
      merchant.ts
    data/
      products.json
      mandates.json
      audit.json
```

---

## 28. Environment Variables

```bash
# Terminal 3
T3N_API_KEY=
T3N_PROJECT_ID=
T3N_AGENT_ID=
T3N_USER_ID=
T3N_SANDBOX_MODE=true

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_MODE=true
```

---

## 29. Testing Checklist

### Unit tests

1. `shouldRefill` returns true at 15% with 20% threshold.
2. `shouldRefill` returns false at 50% with 20% threshold.
3. Product filtering removes unapproved merchant.
4. Product filtering removes over-budget item.
5. Product filtering removes wrong category.
6. Product filtering removes out-of-stock item.
7. Purchase intent does not include raw secrets.
8. Policy validation catches over-quantity purchase.
9. Regulated item routes to manual review.
10. Audit log entry is created for each event.

### Integration tests

1. Successful contact lens refill flow.
2. No refill needed flow.
3. Over-budget rejection flow.
4. Unapproved merchant rejection flow.
5. Wrong category rejection flow.
6. Terminal 3 authorization wrapper receives structured intent.
7. Mock merchant checkout receives sealed placeholder fields only.

### Demo tests

1. Reset demo data works.
2. All scenario buttons work.
3. UI clearly shows Terminal 3 checks.
4. Audit log updates after each action.
5. 4-minute script can be completed smoothly.

---

## 30. Success Metrics

### Hackathon success metrics

1. Full loop demo completed without manual backend intervention.
2. At least one successful purchase authorization.
3. At least three blocked purchase attempts.
4. UI clearly shows Terminal 3 as execution gate.
5. Agent never displays raw payment/address/phone.
6. Audit log shows every step.
7. Judges can explain the product after one sentence.

### Product metrics, future-facing

1. Refill success rate.
2. Prevented stockout events.
3. Blocked unsafe purchase attempts.
4. Average time saved per refill.
5. Percentage of actions completed without exposing sensitive data.
6. User trust score after viewing audit logs.

---

## 31. Risks and Mitigations

### Risk 1: Product feels like a simple shopping bot

Mitigation:

- Emphasize health/pet essentials.
- Show sealed private data.
- Show policy enforcement.
- Show blocked cases.
- Show audit trail.

### Risk 2: Medical safety concerns

Mitigation:

- Use contact lens solution as main demo.
- Do not recommend medicines.
- Route allergy tablets to manual review.
- Add medical disclaimer.

### Risk 3: Terminal 3 integration is too shallow

Mitigation:

- All checkout attempts must go through Terminal 3.
- Show human identity, agent identity, mandate, sealed fields, allowed merchant, and audit result.
- Do not let the agent directly call checkout.

### Risk 4: Real merchant integration is too hard

Mitigation:

- Use mock merchant API.
- Make the Terminal 3 authorization flow real or as close to real as the SDK allows.
- Focus demo on authorization, not merchant scraping.

### Risk 5: Agent makes unpredictable choices

Mitigation:

- Use deterministic filtering for policy.
- Use LLM only for explanation and natural language summaries.
- Reject ambiguous purchase intents.

---

## 32. Future Extensions

1. Real Guardian/Watsons/Pet Lovers Centre merchant integrations.
2. Browser extension for approved checkout sites.
3. Email receipt ingestion to estimate stock from purchase history.
4. WhatsApp/Telegram stock check-ins.
5. Photo-based stock estimation.
6. Shared household mandates.
7. Expiry-aware refill scheduling.
8. Pharmacist-assisted checkout mode.
9. Delivery-slot optimization.
10. More categories: oral care, first aid, baby care, pet care.

---

## 33. Final Build Priority

If time is limited, build in this order:

1. Seeded dashboard.
2. Contact lens mandate.
3. Manual stock update.
4. Product catalog.
5. Agent purchase intent.
6. Terminal 3 authorization card.
7. Successful checkout.
8. Blocked cases.
9. Audit log.
10. Pet food secondary demo.
11. Allergy tablet manual-review demo.

The minimum winning demo is:

```text
Contact lens solution at 15%
-> Agent finds Guardian product
-> Terminal 3 approves
-> Checkout succeeds
-> Random merchant blocked
-> Over-budget item blocked
-> Wrong-category item blocked
-> Audit log shown
```

---

## 34. Pitch Summary

RefillGuard is a bounded autonomous refill agent for health and pet essentials. The user delegates a narrow mandate such as: “Buy my approved contact lens solution when bottle level is below 20%, only from Guardian or Watsons, under S$18, max one bottle.” The agent can detect low stock and choose a product, but it cannot checkout directly. Terminal 3 verifies the human, verifies the agent, enforces the mandate, substitutes sealed payment and delivery details, restricts unauthorized merchants, and creates an auditable record. The result is an AI agent that can act on behalf of the user without becoming an unsafe autonomous buyer.

## 27. Implemented Trust-Boundary Upgrade

The current demo now makes the Terminal 3 workflow visible before, during, and after each agent action:

- **Vault setup visibility:** the app shows verified human identity, verified agent identity, sealed payment/address/phone refs, contract/function, allowed hosts, and demo/live mode.
- **Delegated consent:** mandates expose whether the agent can auto-execute inside scope or must pause for explicit user approval.
- **Pending consent flow:** the pet-food mandate creates a purchase intent, waits for user approval, then asks T3N only after approval.
- **Agent/T3N split:** the inspector shows product and merchant data available to the agent separately from sealed fields resolved by T3N.
- **Sanitized merchant receipt:** approved checkout displays sealed placeholders instead of raw private data.
- **Red-team validation:** unsafe attempts are grouped in the UI and demonstrate T3N blocking or manual-review routing.
- **Audit receipts:** audit entries include hash-chain metadata, decisions, actors, and execution IDs where available.

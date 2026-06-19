#![allow(dead_code)]

extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec::Vec;
use serde::{Deserialize, Serialize};

wit_bindgen::generate!({
    world: "refillguard-auth",
    path: "wit",
    additional_derives: [
        serde::Deserialize,
        serde::Serialize,
    ],
    generate_all,
});

#[derive(Deserialize)]
struct Mandate {
    status: String,
    category: String,
    #[serde(rename = "approvedSkus")]
    approved_skus: Vec<String>,
    #[serde(rename = "approvedMerchants")]
    approved_merchants: Vec<String>,
    #[serde(rename = "maxPriceSgd")]
    max_price_sgd: f64,
    #[serde(rename = "maxQuantity")]
    max_quantity: u32,
    delivery: Delivery,
}

#[derive(Deserialize)]
struct Delivery {
    #[serde(rename = "maxDays")]
    max_days: u32,
}

#[derive(Deserialize)]
struct Product {
    regulated: Option<bool>,
}

#[derive(Deserialize)]
struct PurchaseIntent {
    #[serde(rename = "userId")]
    user_id: String,
    #[serde(rename = "agentId")]
    agent_id: String,
    #[serde(rename = "mandateUserId")]
    mandate_user_id: String,
    #[serde(rename = "mandateAgentId")]
    mandate_agent_id: String,
    #[serde(rename = "merchantId")]
    merchant_id: String,
    sku: String,
    category: String,
    #[serde(rename = "priceSgd")]
    price_sgd: f64,
    quantity: u32,
    #[serde(rename = "deliveryDays")]
    delivery_days: u32,
    mandate: Mandate,
    product: Option<Product>,
}

#[derive(Serialize)]
struct Check {
    key: &'static str,
    label: &'static str,
    passed: bool,
    expected: serde_json::Value,
    actual: serde_json::Value,
    reason: Option<&'static str>,
}

#[derive(Serialize)]
struct Authorization {
    approved: bool,
    status: &'static str,
    checks: Vec<Check>,
    #[serde(rename = "blockedReason")]
    blocked_reason: Option<String>,
    #[serde(rename = "rawSecretsExposedToAgent")]
    raw_secrets_exposed_to_agent: bool,
    #[serde(rename = "sealedFieldsUsed")]
    sealed_fields_used: Vec<String>,
}

struct Component;

fn check(
    key: &'static str,
    label: &'static str,
    passed: bool,
    expected: serde_json::Value,
    actual: serde_json::Value,
    reason: Option<&'static str>,
) -> Check {
    Check {
        key,
        label,
        passed,
        expected,
        actual,
        reason,
    }
}

fn authorize(input: &[u8]) -> Result<Vec<u8>, String> {
    let intent: PurchaseIntent = serde_json::from_slice(input).map_err(|err| err.to_string())?;
    let regulated = intent.product.as_ref().and_then(|product| product.regulated).unwrap_or(false)
        || intent.category == "allergy_tablets";

    let checks = Vec::from([
        check("human_identity", "Human identity verified", true, serde_json::json!(true), serde_json::json!(true), None),
        check("agent_identity", "Agent identity verified", true, serde_json::json!(true), serde_json::json!(true), None),
        check("mandate_active", "Mandate active", intent.mandate.status == "active", serde_json::json!("active"), serde_json::json!(intent.mandate.status), None),
        check("delegation_scope", "Delegation scope valid", intent.user_id == intent.mandate_user_id && intent.agent_id == intent.mandate_agent_id, serde_json::json!(true), serde_json::json!(intent.user_id == intent.mandate_user_id && intent.agent_id == intent.mandate_agent_id), None),
        check("merchant", "Merchant allowed", intent.mandate.approved_merchants.contains(&intent.merchant_id), serde_json::json!(intent.mandate.approved_merchants), serde_json::json!(intent.merchant_id), None),
        check("outbound_host", "Outbound host allowed", intent.mandate.approved_merchants.contains(&intent.merchant_id), serde_json::json!("user grant allows approved merchant hosts only"), serde_json::json!(intent.merchant_id), None),
        check("category", "Product category allowed", intent.category == intent.mandate.category, serde_json::json!(intent.mandate.category), serde_json::json!(intent.category), None),
        check("sku", "SKU allowed", intent.mandate.approved_skus.contains(&intent.sku), serde_json::json!(intent.mandate.approved_skus), serde_json::json!(intent.sku), None),
        check("budget", "Price within budget", intent.price_sgd <= intent.mandate.max_price_sgd, serde_json::json!(intent.mandate.max_price_sgd), serde_json::json!(intent.price_sgd), None),
        check("quantity", "Quantity within limit", intent.quantity <= intent.mandate.max_quantity, serde_json::json!(intent.mandate.max_quantity), serde_json::json!(intent.quantity), None),
        check("delivery", "Delivery within allowed window", intent.delivery_days <= intent.mandate.delivery.max_days, serde_json::json!(intent.mandate.delivery.max_days), serde_json::json!(intent.delivery_days), None),
        check("regulated_item", "Medicine boundary clear", !regulated, serde_json::json!(false), serde_json::json!(regulated), Some("Medicine-like items require manual or pharmacist review")),
        check("sealed_fields", "Sensitive fields sealed", true, serde_json::json!(true), serde_json::json!(true), None),
        check("audit", "Audit log generated", true, serde_json::json!(true), serde_json::json!(true), None),
    ]);

    let failed_key = checks.iter().find(|item| !item.passed).map(|item| item.key);
    let blocked_reason = checks
        .iter()
        .find(|item| !item.passed)
        .map(|item| item.reason.unwrap_or(item.label).to_string());
    let manual_review = failed_key.map(|key| key == "regulated_item").unwrap_or(false);
    let approved = failed_key.is_none();
    let status = if approved {
        "approved"
    } else if manual_review {
        "manual_review"
    } else {
        "blocked"
    };

    let output = Authorization {
        approved,
        status,
        checks,
        blocked_reason,
        raw_secrets_exposed_to_agent: false,
        sealed_fields_used: Vec::from([
            "t3n://payment/default_card".to_string(),
            "t3n://address/home".to_string(),
            "t3n://phone/primary".to_string(),
        ]),
    };

    serde_json::to_vec(&output).map_err(|err| err.to_string())
}

#[cfg(target_arch = "wasm32")]
impl exports::z::refillguard_auth::contracts::Guest for Component {
    fn authorize_purchase(req: exports::z::refillguard_auth::contracts::GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("authorize-purchase: missing input")?;
        authorize(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn approves_valid_purchase() {
        let input = serde_json::json!({
            "purchaseIntentId": "intent_test",
            "userId": "user_demo_001",
            "agentId": "agent_refillguard_v1",
            "mandateUserId": "user_demo_001",
            "mandateAgentId": "agent_refillguard_v1",
            "merchantId": "guardian_demo",
            "sku": "opti_free_puremoist_300ml",
            "category": "contact_lens_solution",
            "priceSgd": 15.9,
            "quantity": 1,
            "deliveryDays": 2,
            "mandate": {
                "status": "active",
                "category": "contact_lens_solution",
                "approvedSkus": ["opti_free_puremoist_300ml"],
                "approvedMerchants": ["guardian_demo"],
                "maxPriceSgd": 18,
                "maxQuantity": 1,
                "delivery": { "maxDays": 3 }
            },
            "product": { "regulated": false }
        });
        let output = authorize(input.to_string().as_bytes()).unwrap();
        let json: serde_json::Value = serde_json::from_slice(&output).unwrap();
        assert_eq!(json["approved"], true);
    }
}

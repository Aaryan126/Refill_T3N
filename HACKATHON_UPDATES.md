# Hackathon Updates

This file tracks the additions made to make Terminal 3 central and visible in the RefillGuard demo.

## What Was Added

- **T3N Trust Setup tab**: shows verified human identity, verified agent identity, runtime mode, invocation actor, contract/function, allowed merchant hosts, and sealed vault references.
- **Configurable user consent**: low-risk contact lens refills auto-execute inside the mandate; the pet-food mandate now pauses for explicit user approval before T3N authorization; regulated allergy tablets still route to manual review.
- **Agent vs T3N boundary**: every actionable run shows what the agent sees versus what Terminal 3 resolves from sealed references.
- **Merchant receipt**: approved purchases show the sanitized checkout payload using sealed placeholders instead of raw payment, address, or phone data.
- **Red-team attempts**: blocked scenarios are grouped in the chat controls to demonstrate wrong merchant, over-budget, wrong category, over-quantity, and regulated-item protection.
- **Prompt-injection attempt**: the **Ignore rules** scenario asks the agent to bypass the mandate and hide an unauthorized merchant purchase; T3N blocks it.
- **Why Terminal 3 mattered card**: every actionable result now summarizes the decision, whether checkout was called, and confirms zero secret exposure.
- **Audit receipts**: audit entries now include hash-chain metadata, decision status, and execution IDs when available.
- **Runtime status API**: `/api/t3n/status` exposes demo/live mode, testnet/production environment, contract metadata, allowed hosts, and separate-agent status.
- **Consent API**: `/api/consent/[consentId]` approves or rejects pending purchase intents.

## Scoring Criteria Mapping

- **Completeness**: the demo now covers setup, delegation, intent creation, user approval, T3N authorization, merchant checkout, blocked attempts, manual review, and audit.
- **SDK integration**: the Terminal 3 boundary is visible at each trust-critical step, and the live SDK adapter remains available behind `DEMO_MODE=false`.
- **Creativity**: RefillGuard demonstrates bounded autonomy for recurring health-adjacent and pet essentials, including adversarial attempts and consent-sensitive mandates.

## Recommended Demo Script

1. Open **T3N setup** and show that the app stores sealed refs, not raw private data.
2. Run **Approve refill** to show autonomous checkout inside a narrow mandate.
3. Open the right inspector and show **Agent vs T3N** plus the sealed merchant receipt.
4. Run **Pet food** to show a purchase intent pausing for explicit user approval before T3N authorization.
5. Approve it and show the resulting T3N execution ID and checkout payload.
6. Run **Ignore rules** and other red-team attempts to show that checkout is skipped when T3N blocks or manual review is required.
7. Open **Audit** and show hash-chain receipts, decisions, actors, and execution IDs.

Use `DEMO_SCRIPT.md` for the video narration and workflow diagram.

## Privacy Claim

The agent never receives raw card details, address, phone number, or CVV. It creates structured purchase intents with product and merchant data only. Terminal 3 owns identity verification, delegation checks, sealed reference substitution, outbound authorization, and audit receipt generation.

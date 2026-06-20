# RefillGuard Product Structure

## Current product

RefillGuard is a Terminal 3/T3N-backed recurring purchase authorization prototype. The app lets a user delegate a constrained refill mandate to an agent. A server-side OpenAI LLM maps free-form chat text to an allowed agent action. The agent then proposes a purchase intent, and the T3N contract evaluates the intent against the user mandate without exposing sealed payment, address, or phone references to the agent.

## Main parts

- `src/app/page.tsx`: interactive refill dashboard and authorization UI.
- `src/app/api/*`: API routes for mandates, inventory, products, audit, direct agent runs, and LLM-orchestrated chat runs.
- `src/lib/llm-orchestrator.ts`: OpenAI-backed action selection for chat requests.
- `src/lib/policy.ts`: local policy validation logic used by demo mode and mirrored by the contract.
- `src/lib/t3n-live.ts`: live T3N invocation adapter.
- `src/app/api/t3n/status/route.ts`: runtime trust-boundary status for demo/live mode.
- `src/app/api/consent/[consentId]/route.ts`: explicit approval/rejection of pending purchase intents.
- `contracts/refillguard-auth`: Rust/WASM TEE contract exporting `authorize-purchase`.

## Latest trust-boundary additions

- The UI now has a **T3N setup** tab for identity, sealed refs, contract/function, allowed hosts, and demo/live status.
- The chat controls group normal approved paths separately from red-team attempts.
- Confirmation-required mandates pause with `pending_user_approval` before calling T3N.
- The pet-food mandate demonstrates the explicit approval flow; the contact lens mandate demonstrates autonomous execution inside a narrow scope.
- The inspector shows **Agent vs T3N** and a merchant receipt with sealed placeholders.
- Audit entries include hash-chain metadata, decision status, and execution IDs when available.
- `scripts/t3n/*`: setup, contract registration, delegation, invocation, and balance/debug scripts.

## T3N state

- User/data-owner DID: `did:t3n:e7a437fbead5c8bd10bd62ddf47b0023264cb00e`
- Separate agent DID: `did:t3n:c77c2a237f78bf9224899772dbad70168d60b85b`
- Contract: `z:e7a437fbead5c8bd10bd62ddf47b0023264cb00e:refillguard-auth`
- Contract ID: `181`
- Contract version: `0.1.1`
- Delegation exists in the T3N dashboard for the separate agent DID to the RefillGuard contract.

## Current blocker

The separate agent DID is correctly configured and delegated, but it currently has no T3N testnet credits. Live invocation as the separate agent fails with:

```text
InsufficientCredit account=c77c2a237f78bf9224899772dbad70168d60b85b required=10000 available=0
```

Until Terminal 3 funds the agent DID with testnet tokens, the product defaults `T3N_USE_SEPARATE_AGENT=false`. In that mode, live calls use the older self-call behavior: the user/data-owner key invokes the contract directly instead of the separate agent key. This keeps the live contract path usable while preserving the separate-agent setup for later.

## Re-enable separate agent mode

After the agent DID has testnet credits:

1. Set `T3N_USE_SEPARATE_AGENT=true` in `.env`.
2. Run `npm run t3n:claim-agent` to confirm the agent balance is non-zero.
3. Run `npm run t3n:invoke`.

Use Node 22 for SDK scripts if the global Node version is newer:

```bash
PATH=/opt/homebrew/opt/node@22/bin:$PATH npm run t3n:invoke
```

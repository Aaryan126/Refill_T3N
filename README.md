# RefillGuard

Safe autonomous refills for health-adjacent and pet essentials, built around a Terminal 3 authorization boundary.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo

Use the scenario buttons to run:

- successful contact lens refill
- no refill needed
- over-budget rejection
- unapproved merchant rejection
- wrong-category rejection
- over-quantity rejection
- allergy tablets manual review
- pet food refill

All checkout attempts pass through the `t3n` adapter. In demo mode it enforces Terminal 3-like checks locally and emits execution IDs, sealed placeholders, and audit events.

## Terminal 3 Live Mode

The current ADK setup uses your API key to authenticate and returns your tenant DID from the session. `T3N_PROJECT_ID` is not used by the current SDK flow.

```bash
npm run t3n:whoami
npm run t3n:agent
npm run t3n:build-contract
npm run t3n:register
npm run t3n:delegate
```

Copy the returned `tenantDid` into `T3N_USER_ID`, copy the returned `contract_id` into `T3N_CONTRACT_ID`, set `DEMO_MODE=false`, then restart `npm run dev`. If you re-register the same contract tail, bump `T3N_CONTRACT_VERSION`.

`t3n:agent` creates a separate agent key/DID if `T3N_AGENT_KEY` is missing. `t3n:delegate` is signed by the user key and grants that agent DID access to the registered contract/function. The app invokes the contract with `T3N_AGENT_KEY` and passes `pii_did` as the user DID.

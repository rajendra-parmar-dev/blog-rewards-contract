# BlogRewards

[![CI](https://github.com/rajendra-parmar-dev/blog-rewards-contract/actions/workflows/ci.yml/badge.svg)](https://github.com/rajendra-parmar-dev/blog-rewards-contract/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An Ethereum smart contract that rewards verified bloggers, with a built-in
veto-and-appeal mechanism to dispute fraudulent reward claims.

## Overview

Verified bloggers submit a reward claim backed by a deposit. Other verified
users can veto a claim they believe is fraudulent by staking their own deposit.
The blogger may appeal, and a coordinator issues the final verdict. Stakes are
redistributed based on the outcome.

| Symbol | Meaning      |
| ------ | ------------ |
| `r`    | Reward cost  |
| `d`    | Deposit cost |
| `v`    | Veto cost    |
| `a`    | Appeal cost  |

**Happy path** — a blogger submits a claim for `r` rewards (capped at 5) and
deposits `d`. After 28 days with no veto, `r` and `d` are available to withdraw.

**Disputed path** — a verified user vetoes within 28 days by staking `v`. The
blogger has 7 days to appeal for `a`. The coordinator then rules:
- Blogger wins → blogger recovers `d + a + r`; vetos forfeit their `v`.
- Vetos win → vetos recover `v + (d + r) / num(vetos)`; blogger forfeits `d + a + r`.

## Project layout

```
contracts/
  BlogRewards.sol      Main reward-claim contract
  Migrations.sol       Truffle migrations bookkeeping
migrations/            Deployment scripts
test/
  blogreward.js        Test suite
  helpers/             Assertion and logging helpers
truffle.js             Truffle network configuration
```

## Getting started

```bash
npm install -g truffle
truffle develop      # starts a local dev chain
truffle test         # run the test suite
truffle migrate      # deploy to the configured network
```

## Testing

The suite in `test/blogreward.js` covers reward creation, deposit validation,
cancellation, veto and appeal flows, verdicts, payouts, and the time-based
constraints (28-day claim window, 7-day appeal window), and reports gas usage
per transaction. All 36 tests pass, and they run automatically in CI on every
push and pull request.

## License

Released under the [MIT License](LICENSE).

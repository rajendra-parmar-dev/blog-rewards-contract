# Contributing

Thanks for your interest in improving BlogRewards. This guide covers the basics
for getting set up and submitting changes.

## Getting started

```bash
npm install          # install Truffle and dependencies
npx truffle compile  # compile the contracts (fetches solc 0.4.15)
```

## Running the tests

The suite expects a local Ethereum node on `http://localhost:8545`:

```bash
npx ganache --port 8545     # in one terminal
npm test                    # in another (runs `truffle test`)
```

All tests must pass before a change can be merged. CI runs the same steps on
every push and pull request.

## Making changes

1. Create a feature branch off `main`.
2. Keep commits focused and use [Conventional Commits](https://www.conventionalcommits.org/)
   messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
3. Add or update tests for any behavior you change.
4. Ensure `npx truffle compile` and `npm test` both succeed.
5. Open a pull request describing what changed and why.

## Coding conventions

- Solidity: document public/external functions with NatSpec (`/// @notice`, `@param`, `@return`).
- JavaScript tests: keep helpers in `test/helpers/` and one assertion focus per `it` block.

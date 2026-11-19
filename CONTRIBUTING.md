# Contributing

Bug reports and pull requests are welcome.

## Before you open a pull request

```bash
npm ci
npm test          # unit and CLI tests
npm run probe     # opens the pages in Chrome at 1280 and 390 wide; fails on any script error or blank canvas
```

Both run in CI on every pull request (Node 22, 24 and 26 on Linux, Node 26 on macOS).

- One change per pull request, with a test that fails without it.
- Keep the package free of runtime dependencies.
- Keep the page offline: no network request, no external font, script or image.

## How changes land

This repository is published from a maintainer's working tree. An accepted pull request is applied there and arrives
here in the next release commit, with credit to you in the changelog. Your pull request is then closed as merged
by that commit.

## Releases

A maintainer bumps `version` in `package.json`, adds the changelog entry and pushes a `vX.Y.Z` tag. The `release`
workflow tests the tag, stages the version on npm and creates the GitHub release. The npm version goes public when
a maintainer approves it.

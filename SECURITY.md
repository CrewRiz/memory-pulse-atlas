# Security policy

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting instead:
**Security → Report a vulnerability** on this repository. You will get a first reply within five working days.

Useful reports name the version, the command you ran and what a ledger or page could do that it should not.

## Supported versions

Fixes go into the latest release only.

## What the atlas promises

- The page it writes makes no network request. Its Content-Security-Policy forbids them, so a ledger cannot make
  the page call out.
- `serve` listens on 127.0.0.1 only, refuses requests sent under any other host name, and refuses to be framed by
  another site.
- The widget is a sandboxed frame. It cannot read the page around it or navigate the top window.
- The package has no runtime dependencies.

A way around any of these is a vulnerability. Please report it.

## Releases

Releases from 0.1.1 on are built by this repository's `release` workflow through npm trusted publishing: no
long-lived npm token exists, each version carries a provenance statement naming the commit it was built from, and a
maintainer approves each staged version with two-factor authentication before it is public. 0.1.0 was published by
hand, because npm requires a package to exist before a trusted publisher can be configured for it. Check a
release with `npm audit signatures`.

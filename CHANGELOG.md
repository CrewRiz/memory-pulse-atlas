# Changelog

Every release of memory-pulse-atlas, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-19

The first release.

### Added

- `npx memory-pulse-atlas` writes one offline HTML page from a memory ledger: map, river, list and 3-D brain views,
  corrections drawn in red over the notes that still carry a withdrawn value, and time replay of the ledger.
- `serve`: a live page on 127.0.0.1 that follows the ledger; memories already drawn keep their places as rows are added.
- `--embed` and the `<memory-atlas-widget>` element for dashboards and documentation sites.
- `--mood-cmd`: optional gauges for an agent harness that reports neuromodulator levels.
- A correction may give one withdrawn or replacement value as a string; it is read as a one-item list.
- Every skipped ledger line is reported with its line number and the reason.

[0.1.0]: https://github.com/CrewRiz/memory-pulse-atlas/releases/tag/v0.1.0

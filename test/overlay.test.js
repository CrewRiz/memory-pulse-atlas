// The correction overlay checks every binding correction against every memory. On a 4,700-row ledger that scan was
// about 1 s of the 1.9 s it took to fold one appended row into a live map (measured 2026-11-19). A ledger only grows,
// so the pairs already checked keep their answer: an appended row needs only the new pairs.
import test from "node:test";
import assert from "node:assert/strict";
import { overlayCorrections } from "../src/core/sources-core.js";
import { fromRows } from "../src/core/load.js";
import { atlasFromLedgers } from "../src/core/atlas.js";

const row = (t, cause, effect, extra = {}) => ({ t, cause, effect, ...extra });
const base = [
  row(1, "price set", "the plan costs $49 a month"),
  row(2, "pricing page", "shows $49 and a trial"),
  row(3, "price corrected", "willingness to pay is $29", { kind: "correction", withdrawn: ["$49"], replacement: ["$29"] }),
  row(4, "cache size", "the cache holds 512 entries"),
  row(5, "launch email", "still says $49"),
];
const notesOf = (rows) => fromRows(rows).notes;
const fresh = (rows) => overlayCorrections(notesOf(rows), rows, { sameLedger: true });
const grown = (before, rows) => overlayCorrections(notesOf(rows), rows, { sameLedger: true, previous: fresh(before).memo });

test("overlay: grown from the previous scan, the flags are exactly those of a fresh scan", () => {
  const cases = {
    "a memory that reasserts a withdrawn value": [...base, row(6, "invoice", "billed $49")],
    "a new correction that reaches earlier memories": [...base, row(6, "cache corrected", "the cache holds 256 entries", { kind: "correction", withdrawn: ["512 entries"], replacement: ["256 entries"] })],
    "a correction retired by a later one": [...base, row(6, "price corrected again", "the plan is $39", { kind: "correction", withdrawn: ["$29"], replacement: ["$39"], supersedes: [3] })],
    "nothing that touches a correction": [...base, row(6, "weather", "rain on Tuesday")],
  };
  for (const [name, rows] of Object.entries(cases)) {
    const a = grown(base, rows), b = fresh(rows);
    assert.deepEqual(a.hits, b.hits, name);
    assert.deepEqual(a.binding.map((c) => c.t), b.binding.map((c) => c.t), name);
  }
});

test("overlay: an appended row checks only the new pairs, not every correction against every memory again", () => {
  const rows = [...base, row(6, "invoice", "billed $49")];
  const n = notesOf(rows).length;
  assert.equal(fresh(rows).checked, 1 * n, "a fresh scan checks the one correction against every memory");
  assert.equal(grown(base, rows).checked, 1, "grown: the one old correction against the one new memory");
  const withCorrection = [...base, row(6, "cache corrected", "256 entries", { kind: "correction", withdrawn: ["512 entries"], replacement: ["256 entries"] })];
  assert.equal(grown(base, withCorrection).checked, 1 + notesOf(withCorrection).length, "a new correction is checked against every memory");
});

test("overlay: a previous scan of different memories is not reused", () => {
  const edited = base.map((r) => (r.t === 2 ? { ...r, effect: "shows $29 and a trial" } : r));
  const a = grown(base, edited), b = fresh(edited);
  assert.deepEqual(a.hits, b.hits);
  assert.equal(a.checked, b.checked, "an edited earlier memory means a full scan");
});

test("overlay: a live map rebuilt with the previous one reuses its scan, and the page data does not carry it", () => {
  const before = atlasFromLedgers([{ name: "work.jsonl", rows: base }]);
  const after = atlasFromLedgers([{ name: "work.jsonl", rows: [...base, row(6, "invoice", "billed $49")] }], { previous: before });
  const freshAfter = atlasFromLedgers([{ name: "work.jsonl", rows: [...base, row(6, "invoice", "billed $49")] }]);
  assert.deepEqual(after.flags, freshAfter.flags);
  assert.equal(after._overlay[0].checked, 1);
  assert.ok(!JSON.stringify(after).includes("_overlay") && !("_overlay" in JSON.parse(JSON.stringify(after))));
});

// The open layout: plain word statistics (TF-IDF, cosine, k-means, classical MDS), emitting the atlas the viewer reads.
import test from "node:test";
import assert from "node:assert/strict";
import { layout, regionsOf } from "../src/core/layout.js";
import { fromRows } from "../src/core/load.js";

const SUBJECTS = [
  ["Quantum research", ["qubits", "circuit", "coherence", "quantum", "measurement", "simulation"]],
  ["Garden journal", ["garden", "soil", "seedlings", "flowers", "water", "plants"]],
  ["Customer operations", ["customer", "billing", "invoice", "subscription", "renewal", "support"]],
  ["Field astronomy", ["telescope", "stars", "galaxy", "orbit", "astronomy", "observatory"]],
];
const rows = SUBJECTS.flatMap(([name, w], g) => Array.from({ length: 30 }, (_, i) => ({
  t: g * 30 + i + 1, cause: i ? `${name} step ${i}` : name, effect: `${w[i % 6]} ${w[(i + 2) % 6]} noted`,
  note: `${w[i % 6]} ${w[(i + 1) % 6]} ${w[(i + 3) % 6]}: observation ${i + 1}.`, tags: [w[i % 6]],
})));
rows.push({ t: 121, cause: "billing", effect: "the invoice total was wrong", kind: "correction", withdrawn: ["total 42"], replacement: ["total 24"] });
const subjectOf = (i) => (i < 120 ? Math.floor(i / 30) : 2);
const A = layout(fromRows(rows, { name: "four subjects" }));

test("layout: the atlas carries every field the viewer reads", () => {
  for (const k of ["v", "notes", "topics", "links", "related", "suggested", "flags", "decay", "build", "source"]) assert.ok(k in A, k);
  assert.equal(A.notes.length, rows.length);
  for (const n of A.notes) for (const k of ["id", "title", "x", "y", "z", "topic", "fit", "sal", "time"]) assert.ok(k in n, k);
  for (const t of A.topics) for (const k of ["name", "size", "x", "y", "z", "ax", "ay"]) assert.ok(k in t, k);
  assert.equal(A.related.length, A.notes.length);
  assert.ok(A.decay.halfLife > 0);
});

test("layout: the same input gives the same map", () => {
  const B = layout(fromRows(rows, { name: "four subjects" }));
  const strip = (a) => JSON.stringify({ ...a, generated: 0, build: { ...a.build, ms: 0 } });
  assert.equal(strip(B), strip(A));
});

test("layout: notes about one subject share a topic, and different subjects do not", () => {
  const bySubject = SUBJECTS.map((_, g) => A.notes.slice(g * 30, g * 30 + 30).map((n) => n.topic));
  const majority = bySubject.map((ts) => { const c = new Map(); ts.forEach((t) => c.set(t, (c.get(t) ?? 0) + 1)); return [...c].sort((a, b) => b[1] - a[1])[0]; });
  majority.forEach(([, count], g) => assert.ok(count >= 27, SUBJECTS[g][0] + ": " + count + " of 30 in its main topic"));
  assert.equal(new Set(majority.map(([t]) => t)).size, SUBJECTS.length, "each subject has its own main topic");
});

test("layout: notes about one subject sit closer together than notes about different subjects", () => {
  const d = (i, j) => Math.hypot(A.notes[i].x - A.notes[j].x, A.notes[i].y - A.notes[j].y);
  let within = 0, wn = 0, across = 0, an = 0;
  for (let i = 0; i < 120; i += 3) for (let j = i + 1; j < 120; j += 4) { if (subjectOf(i) === subjectOf(j)) { within += d(i, j); wn++; } else { across += d(i, j); an++; } }
  assert.ok(within / wn < 0.5 * (across / an), `within ${(within / wn).toFixed(3)} vs across ${(across / an).toFixed(3)}`);
  for (const n of A.notes) for (const k of ["x", "y"]) assert.ok(n[k] >= -1.0001 && n[k] <= 1.0001, k + " in [-1, 1]");
});

test("layout: topics are named with their own words", () => {
  const names = A.topics.map((t) => t.name.join(" "));
  for (const [, w] of SUBJECTS) assert.ok(names.some((n) => w.some((x) => n.includes(x))), "a topic named from " + w.join(","));
});

test("layout: related notes are other notes, strongest first, and a suggestion is never an already recorded link", () => {
  A.related.forEach((list, i) => {
    assert.ok(list.every(([j]) => j !== i), "never itself");
    for (let k = 1; k < list.length; k++) assert.ok(list[k - 1][1] >= list[k][1], "sorted");
  });
  const top = A.related[5][0];
  assert.equal(subjectOf(top[0]), subjectOf(5), "a note's closest relative is about the same subject");
  const recorded = new Set(A.links.map((l) => `${Math.min(l.a, l.b)}:${Math.max(l.a, l.b)}`));
  for (const [a, b] of A.suggested) assert.ok(!recorded.has(`${a}:${b}`));
});

test("layout: the correction is kept as a correction and flags the row that carries the withdrawn value", () => {
  const rowsWithStale = [...rows, { t: 122, cause: "billing report", effect: "sent the total 42 to the customer" }];
  const B = layout(fromRows(rowsWithStale, { name: "x" }));
  const c = B.notes.findIndex((n) => n.kind === "correction");
  assert.ok(c >= 0);
  const f = B.flags.find((x) => B.notes[x.note].effect.includes("total 42"));
  assert.ok(f, "the later row writing the withdrawn value back is flagged");
  assert.equal(f.status, "reasserted");
  assert.equal(f.correction, c);
});

test("regions: a handful of named, coloured regions covering every note, none in the violet range", () => {
  const R = regionsOf(A);
  assert.ok(R.regions.length >= 3 && R.regions.length <= 8);
  assert.equal(R.assignment.length, A.notes.length);
  assert.ok(R.assignment.every((id) => R.regions.some((r) => r.id === id)));
  for (const r of R.regions) {
    assert.ok(r.label.length > 0 && /^#[0-9a-f]{6}$/.test(r.color));
    const [h] = hue(r.color);
    assert.ok(!(h >= 240 && h <= 300), r.color + " is violet");
  }
  assert.ok(R.neighborhoods.length >= R.regions.length);
});

function hue(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return [0];
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360];
}

test("layout: words every note shares do not melt the subjects into one giant topic", () => {
  // measured 2026-11-18 on a 4,636-row working ledger: chained merges put 3,238 rows in one topic
  const subjects = ["kernel", "garden", "invoice", "telescope", "violin", "harbour", "glacier", "bakery", "orchard", "satellite"]
    .map((s, g) => [s, ["alpha", "beta", "gamma", "delta", "omega"].map((x) => s + x)]);
  const rs = subjects.flatMap(([s, w], g) => Array.from({ length: 25 }, (_, i) => ({
    t: g * 25 + i + 1, cause: `session ${i} test`, effect: `${s} ${w[i % 5]} passed today`, note: `the session test passed today with ${s} ${w[(i + 1) % 5]} ${w[(i + 3) % 5]}`,
  })));
  const B = layout(fromRows(rs, { name: "shared words" }));
  const largest = Math.max(...B.topics.map((t) => t.size));
  assert.ok(largest <= 0.2 * rs.length, `largest topic holds ${largest} of ${rs.length}`);
});

test("merge: joining near topics stops at a size cap, so merged centres cannot chain into one topic", async () => {
  const { mergeClose } = await import("../src/core/layout.js");
  // ten topics of 20 notes; every pair of topics shares half its weight (centre cosine 0.5, above the merge line)
  const V = [], groups = [];
  for (let g = 0; g < 10; g++) {
    const ids = [];
    for (let i = 0; i < 20; i++) { ids.push(V.length); V.push(new Map([["common", Math.SQRT1_2], ["own" + g, Math.SQRT1_2]])); }
    groups.push(ids);
  }
  const merged = mergeClose(groups, V, 0.45, 50);
  assert.ok(Math.max(...merged.map((g) => g.ids.length)) <= 50, "largest " + Math.max(...merged.map((g) => g.ids.length)));
  assert.equal(merged.reduce((s, g) => s + g.ids.length, 0), 200, "no note lost");
});

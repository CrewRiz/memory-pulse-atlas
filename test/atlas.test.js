import test from "node:test";
import assert from "node:assert/strict";
import { atlasFromLedgers, importMemories } from "../src/core/atlas.js";

const ledger = (w, n = 24) => Array.from({ length: n }, (_, i) => ({ t: i + 1, cause: `${w[0]} step ${i}`, effect: `${w[i % w.length]} ${w[(i + 1) % w.length]}`, note: w.join(" ") }));
const two = [{ name: "garden.jsonl", rows: ledger(["soil", "seedlings", "water", "flowers"]) }, { name: "stars.jsonl", rows: ledger(["telescope", "galaxy", "orbit", "nebula"]) }];

test("atlas: two ledgers become one brain, every memory placed inside it and tagged with its source and region", () => {
  const a = atlasFromLedgers(two, { title: "t" });
  assert.equal(a.mode, "brain");
  assert.equal(a.sources.length, 2);
  assert.equal(a.notes.length, 48);
  assert.ok(a.notes.every((n) => Array.isArray(n.brain) && n.brain.length === 3 && n.region));
  assert.deepEqual([...new Set(a.notes.map((n) => n.src))], [0, 1]);
  assert.ok(a.brainLayout.capacity > 1000);
});

test("atlas: the size limit is a refusal, not a silent cut", () => {
  assert.throws(() => atlasFromLedgers(two, { maxNotes: 30 }), /More than 30 memories/);
});

test("import: a bad line names its file and line, and nothing is drawn from it", () => {
  assert.throws(() => importMemories([{ name: "a.jsonl", text: '{"t":1,"cause":"a","effect":"b"}\nnot json' }]), /a.jsonl: line 2/);
  assert.throws(() => importMemories([{ name: "b.jsonl", text: '{"t":1,"cause":"a"}' }]), /b.jsonl: line 1/);
  const a = importMemories(two.map((l) => ({ name: l.name, text: l.rows.map((r) => JSON.stringify(r)).join("\n") })));
  assert.equal(a.notes.length, 48);
  assert.equal(a.hosted, true);
});

// ---- hold: a live map that is rebuilt when the ledger grows must not move what the reader has already found -----------
// Measured before this was written (2026-11-19): one appended row moved every one of 150 earlier memories in a fictional
// ledger, and on 1,200 rows of a real ledger one memory in ten jumped 0.3 or more in the brain view.
const SUBJECTS = ["soil seedlings water flowers compost", "telescope galaxy orbit nebula comet", "invoice customer renewal refund ledger", "compiler cache thread scheduler kernel", "river bridge flood bank survey"];
const varied = (n) => Array.from({ length: n }, (_, i) => {
  const w = SUBJECTS[(i * 7) % 5].split(" "), v = SUBJECTS[(i * 3 + 1) % 5].split(" ");
  return { t: i + 1, cause: `${w[i % 5]} ${v[(i >> 1) % 5]}`, effect: `${w[(i + 2) % 5]} ${w[(i + 3) % 5]} ${i % 4 ? v[i % 5] : ""}`, note: `${w.join(" ")} ${i % 3 ? "" : v.slice(0, 2).join(" ")}` };
});
const grow = (base, more) => [{ name: "work.jsonl", rows: [...base[0].rows, ...more] }, base[1]];
const startHold = [{ name: "work.jsonl", rows: varied(150) }, { name: "stars.jsonl", rows: ledger(["telescope", "galaxy", "orbit", "nebula"]) }];
const newRows = [{ t: 151, cause: "flood survey", effect: "bridge river checked", note: "river bridge flood bank survey" }, { t: 152, cause: "refund", effect: "invoice customer renewal", note: "invoice customer renewal refund ledger" }];
const key = (a, n) => a.sources[n.src].name + "#" + n.id;

test("hold: rebuilt with the previous map, every earlier memory keeps its place, depth, topic, region and brain place", () => {
  const before = atlasFromLedgers(startHold);
  const fresh = atlasFromLedgers(grow(startHold, newRows));
  const held = atlasFromLedgers(grow(startHold, newRows), { previous: before });
  const prev = new Map(before.notes.map((n) => [key(before, n), n]));
  // control: without the previous map the same rows land elsewhere, so the assertions below can fail
  assert.ok(fresh.notes.some((n) => { const p = prev.get(key(fresh, n)); return p && (p.x !== n.x || p.y !== n.y); }), "a fresh build moves earlier memories");
  assert.equal(held.notes.length, before.notes.length + 2);
  let checked = 0;
  for (const n of held.notes) {
    const p = prev.get(key(held, n));
    if (!p) continue;
    checked++;
    assert.deepEqual([n.x, n.y, n.z], [p.x, p.y, p.z], key(held, n) + " keeps its map place");
    assert.deepEqual(n.brain, p.brain, key(held, n) + " keeps its brain place");
    assert.deepEqual(held.topics[n.topic].name, before.topics[p.topic].name, key(held, n) + " keeps its topic");
    assert.equal(n.region, p.region, key(held, n) + " keeps its region");
  }
  assert.equal(checked, before.notes.length);
});

test("hold: a new memory lands beside the earlier memory it is most like, and the topics and regions count it", () => {
  const before = atlasFromLedgers(startHold);
  const held = atlasFromLedgers(grow(startHold, newRows), { previous: before });
  const prevKeys = new Set(before.notes.map((n) => key(before, n)));
  const added = held.notes.map((n, i) => [n, i]).filter(([n]) => !prevKeys.has(key(held, n)));
  assert.equal(added.length, 2);
  for (const [n, i] of added) {
    const [j] = held.related[i].find(([j]) => prevKeys.has(key(held, held.notes[j])));
    const m = held.notes[j];
    assert.ok(Math.hypot(n.x - m.x, n.y - m.y) < 0.15, `${n.id} sits ${Math.hypot(n.x - m.x, n.y - m.y).toFixed(3)} from ${m.id}`);
    assert.equal(n.topic, m.topic, n.id + " joins the topic of the memory it is most like");
    assert.equal(n.region, m.region, n.id + " joins its region");
    assert.ok(n.brain.every(Number.isFinite));
  }
  assert.equal(held.topics.reduce((s, t) => s + t.size, 0), held.notes.length, "topic sizes count every memory");
  assert.equal(held.knowledge.regions.reduce((s, r) => s + r.members.length, 0), held.notes.length, "regions count every memory");
  for (const r of held.knowledge.regions) assert.ok(r.members.every((i) => held.notes[i].region === r.id));
});

test("hold: a map that has outgrown the previous one by half is laid out afresh", () => {
  const before = atlasFromLedgers([{ name: "work.jsonl", rows: varied(40) }]);
  const big = atlasFromLedgers([{ name: "work.jsonl", rows: varied(150) }], { previous: before });
  const fresh = atlasFromLedgers([{ name: "work.jsonl", rows: varied(150) }]);
  assert.deepEqual(big.notes.map((n) => [n.x, n.y, n.brain]), fresh.notes.map((n) => [n.x, n.y, n.brain]));
});

// ---- fold: a grown ledger is added to the map, not laid out again -------------------------------------------------------
// A topic is a sum of its members and a new memory needs only its own row of similarities, so rows appended to a ledger
// cost O(N) each instead of a whole layout (measured 2026-11-19: 8.7 s at 1,200 rows for every appended row).
const cos = (a, b) => { if (a.size > b.size) [a, b] = [b, a]; let s = 0; for (const [w, x] of a) { const y = b.get(w); if (y) s += x * y; } return s; };
const exactRelated = (V, i) => V.map((v, j) => [j, cos(V[i], v)]).filter(([j, c]) => j !== i && c >= 0.12).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 8).map(([j, c]) => [j, Math.round(c * 200) / 10]);

test("fold: rows appended to a ledger join the map without a new layout, each with its exact eight most related memories", () => {
  const before = atlasFromLedgers(startHold);
  const a = atlasFromLedgers(grow(startHold, newRows), { previous: before });
  assert.equal(a.build.layout, "folded");
  const V = a._vectors;
  assert.ok(V && V.length === a.notes.length, "the map keeps a vector for every memory");
  const prevKeys = new Set(before.notes.map((n) => key(before, n)));
  const added = a.notes.map((n, i) => i).filter((i) => !prevKeys.has(key(a, a.notes[i])));
  assert.equal(added.length, 2);
  for (const i of added) {
    assert.deepEqual(a.related[i], exactRelated(V, i), a.notes[i].id + ": exact top eight over every memory");
    // the memory a new one is most like lists it back once it beats that memory's weakest related note
    for (const [j, z] of a.related[i]) {
      const list = a.related[j];
      if (list.length < 8 || z > list[list.length - 1][1]) assert.ok(list.some(([k]) => k === i), `${a.notes[j].id} lists ${a.notes[i].id}`);
      assert.ok(list.every((e, x) => !x || list[x - 1][1] >= e[1]), "related lists stay ordered");
      assert.ok(list.length <= 8);
    }
  }
  assert.ok(a.related.flat().every(([j]) => j >= 0 && j < a.notes.length));
  assert.ok(a.suggested.every(([x, y, z]) => x < y && z >= 7));
});

test("fold: adding a row to a 600-memory map costs under a fifth of laying the map out", () => {
  const base = [{ name: "work.jsonl", rows: varied(600) }];
  let t = performance.now();
  const before = atlasFromLedgers(base);
  const layoutMs = performance.now() - t;
  t = performance.now();
  const after = atlasFromLedgers([{ name: "work.jsonl", rows: [...base[0].rows, { t: 601, cause: "refund", effect: "invoice renewal", note: "invoice customer refund" }] }], { previous: before });
  const foldMs = performance.now() - t;
  assert.equal(after.build.layout, "folded");
  assert.ok(foldMs < layoutMs / 5, `fold ${foldMs.toFixed(0)} ms, layout ${layoutMs.toFixed(0)} ms`);
});

test("fold: a ledger whose earlier rows changed is laid out again and held, not folded", () => {
  const before = atlasFromLedgers(startHold);
  const edited = grow(startHold, newRows);
  edited[0] = { ...edited[0], rows: edited[0].rows.slice(1) };
  const a = atlasFromLedgers(edited, { previous: before });
  assert.equal(a.build.layout, "open, held");
});

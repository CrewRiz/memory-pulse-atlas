// One atlas from one or more ledgers: the open layout, regions, and places inside the brain. Runs in Node and in the
// browser (scripts/build.mjs bundles it for the page's Import button).
import { layout, regionsOf, vectors, relatedRow, suggestionsOf, dot, RELATED_SCALE } from "./layout.js";
import { fromRows, parseLedger } from "./load.js";
import { salienceOf, halfLifeForSpan } from "./salience.js";
import { packBrain } from "../viewer/brain-space.js";

export const MAX_NOTES = 5000;
const DAY = 86_400_000;
const base = (n) => String(n).split(/[\\/]/).pop();

// ---- hold: rebuilt while someone is looking, a map keeps every memory already on it where it was ------------------------
// A memory is the same memory when its ledger's file name and its id match. New memories join the topic, region and
// neighbourhood of the earlier memory they are most like (by the fresh layout's related list) and sit a short, fixed
// step from it. Once the new memories outnumber half the previous map, the old topics no longer describe it and the
// map is laid out afresh (a restart of serve does the same).
export const HOLD_GROWTH = 0.5;
const heldKey = (sources, n) => sources[n.src].name + "\u0000" + n.id;
function fnv(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
const step = (id, k) => ((fnv(id + ":hold:" + k) % 10007) / 10007) * 2 - 1;
const round4 = (v) => Math.round(v * 1e4) / 1e4;
function sdot(a, b) { if (a.size > b.size) [a, b] = [b, a]; let s = 0; for (const [w, x] of a) { const y = b.get(w); if (y) s += x * y; } return s; }
function scentre(vs) { const c = new Map(); for (const v of vs) for (const [w, x] of v) c.set(w, (c.get(w) ?? 0) + x); let q = 0; for (const x of c.values()) q += x * x; q = Math.sqrt(q) || 1; for (const [w, x] of c) c.set(w, x / q); return c; }

function holdPlaces(a, previous) {
  const prev = new Map(previous.notes.map((n, i) => [heldKey(previous.sources, n), i]));
  const was = a.notes.map((n) => prev.get(heldKey(a.sources, n)));
  const held = was.filter((i) => i != null).length, fresh = a.notes.length - held;
  if (!held || fresh > HOLD_GROWTH * previous.notes.length) return false;
  const V = a._vectors, P = previous.notes;
  const prevHood = new Map();
  for (const h of previous.knowledge?.neighborhoods ?? []) for (const i of h.members) prevHood.set(i, h.id);
  const topics = previous.topics.map((t) => ({ ...t }));
  const hood = new Array(a.notes.length);
  // earlier memories: exactly where they were
  a.notes.forEach((n, i) => {
    const p = was[i]; if (p == null) return;
    Object.assign(n, { x: P[p].x, y: P[p].y, z: P[p].z, topic: P[p].topic, region: P[p].region });
    hood[i] = prevHood.get(p);
  });
  const members = (t) => a.notes.map((n, i) => [n, i]).filter(([n, i]) => was[i] != null && n.topic === t).map(([, i]) => i);
  const centres = topics.map((_, t) => scentre(members(t).map((i) => V[i])));
  // new memories: beside the earlier memory they are most like; with none alike, at the centre of the nearest topic
  a.notes.forEach((n, i) => {
    if (was[i] != null) return;
    const near = (a.related[i] ?? []).find(([j]) => was[j] != null)?.[0];
    if (near != null) {
      const m = a.notes[near];
      Object.assign(n, { x: round4(m.x + 0.04 * step(n.id, "x")), y: round4(m.y + 0.04 * step(n.id, "y")), z: round4(m.z + 0.04 * step(n.id, "z")), topic: m.topic, region: m.region });
      hood[i] = hood[near];
      return;
    }
    let t = 0, best = -Infinity; centres.forEach((c, k) => { const d = sdot(V[i], c); if (d > best) { best = d; t = k; } });
    const others = members(t), region = others.length ? a.notes[others[0]].region : previous.knowledge?.regions?.[0]?.id;
    Object.assign(n, { x: round4(topics[t].x + 0.06 * step(n.id, "x")), y: round4(topics[t].y + 0.06 * step(n.id, "y")), z: round4(topics[t].z + 0.06 * step(n.id, "z")), topic: t, region });
  });
  // topics and regions count what they now hold
  topics.forEach((t, k) => {
    const ids = a.notes.map((n, i) => [n, i]).filter(([n]) => n.topic === k).map(([, i]) => i);
    t.size = ids.length;
    if (ids.length) for (const c of ["x", "y", "z"]) t[c] = round4(ids.reduce((s, i) => s + a.notes[i][c], 0) / ids.length);
    const c = scentre(ids.map((i) => V[i]));
    for (const i of ids) a.notes[i].fit = Math.round(sdot(V[i], c) * 200) / 10;
  });
  a.topics = topics;
  const regions = (previous.knowledge?.regions ?? []).map(({ center, members, ...r }) => ({ ...r, members: [] }));
  const byRegion = new Map(regions.map((r) => [r.id, r]));
  const hoods = (previous.knowledge?.neighborhoods ?? []).map(({ center, members, ...h }) => ({ ...h, members: [] }));
  const byHood = new Map(hoods.map((h) => [h.id, h]));
  a.notes.forEach((n, i) => {
    byRegion.get(n.region)?.members.push(i);
    const h = byHood.get(hood[i]) ?? hoods.find((x) => x.region === n.region);
    h?.members.push(i);
  });
  a.knowledge = { regions, assignment: a.notes.map((n) => n.region), neighborhoods: hoods };
  a.build = { ...a.build, layout: "open, held", held, added: fresh };
  return true;
}

// ---- fold: a ledger that has only grown is added to the map, not laid out again ------------------------------------------
// Every earlier memory is unchanged, so the map keeps it whole (place, topic, region, related list) and only the new
// memories are worked out: each one's exact related list over every memory (O(N) per new memory), and each earlier
// memory's list takes the new one when it beats that list's weakest entry. Topics are sums of their members, so a new
// member is an addition; holdPlaces then seats it beside the memory it is most like.
function foldable(notes, sources, previous) {
  if (!previous?.notes?.length || !previous.related || notes.length <= previous.notes.length) return null;
  if (notes.length - previous.notes.length > HOLD_GROWTH * previous.notes.length) return null;
  const prev = new Map(previous.notes.map((n, i) => [heldKey(previous.sources, n), i]));
  const was = notes.map((n) => prev.get(heldKey(sources, n)));
  let seen = 0;
  for (let i = 0; i < notes.length; i++) {
    const p = was[i]; if (p == null) continue;
    const q = previous.notes[p];
    if (q.title !== notes[i].title || q.kind !== notes[i].kind || q.time !== notes[i].time) return null; // an earlier row changed
    seen++;
  }
  return seen === previous.notes.length ? was : null;                                                     // or one was removed
}
function foldLayout(input, previous, was, o = {}) {
  const t0 = Date.now(), { notes, links, flags, source } = input, N = notes.length;
  const { V } = vectors(notes, o);
  const back = new Int32Array(previous.notes.length);
  was.forEach((p, i) => { if (p != null) back[p] = i; });
  const all = notes.map((_, i) => i), added = all.filter((i) => was[i] == null);
  const related = notes.map((_, i) => (was[i] == null ? null : previous.related[was[i]].map(([j, z]) => [back[j], z])));
  for (const i of added) related[i] = relatedRow(V, i, all, o);
  const k = o.relatedK ?? 8, floor = o.relatedMin ?? 0.12;
  for (const i of added) for (let j = 0; j < N; j++) {
    if (was[j] == null) continue;
    const c = dot(V[i], V[j]); if (c < floor) continue;
    const z = Math.round(c * RELATED_SCALE * 10) / 10, list = related[j];
    if (list.length >= k && z <= list[list.length - 1][1]) continue;
    let at = list.findIndex(([, y]) => y < z); if (at < 0) at = list.length;
    list.splice(at, 0, [i, z]); if (list.length > k) list.pop();
  }
  const halfLife = halfLifeForSpan(notes.map((n) => ({ t: n.time }))), now = Math.max(...notes.map((n) => n.time));
  const out = {
    v: 1, generated: new Date().toISOString(), source,
    notes: notes.map((n, i) => {
      const sal = Math.round(salienceOf({ t: n.time, kind: n.kind, pinned: n.pinned }, { now, halfLife }) * 1000) / 1000;
      if (was[i] != null) return { ...previous.notes[was[i]], src: n.src, sal };
      const { body, head, ...keep } = n; return { ...keep, sal };
    }),
    topics: previous.topics.map((t) => ({ ...t })),
    links, related, suggested: suggestionsOf(related, links, o), flags: flags ?? [],
    decay: { halfLife: Math.round(halfLife * 100) / 100, now, unit: source.timeUnit ?? "row" },
    build: { ms: 0, layout: "folded", topics: previous.topics.length, related: "exact for new memories", added: added.length },
  };
  Object.defineProperty(out, "_vectors", { value: V, enumerable: false });
  out.build.ms = Date.now() - t0;
  return out;
}

/** @param {{name:string, rows:object[]}[]} ledgers @param {{previous?: object}} o previous: the map this one replaces */
export function atlasFromLedgers(ledgers, { title = "Memory", maxNotes = MAX_NOTES, datesFromRows = false, previous = null } = {}) {
  if (!ledgers.length) throw new Error("Give at least one ledger.");
  const notes = [], links = [], flags = [], sources = [], overlays = [];
  for (const { name, rows } of ledgers) {
    const si = sources.length, was = previous?.sources?.[si]?.name === base(name) ? previous._overlay?.[si] : null;
    const src = fromRows(rows, { name, previous: was?.memo }), off = notes.length;
    overlays.push(src.overlay);
    if (off + src.notes.length > maxNotes) throw new Error(`More than ${maxNotes} memories; pass --max-notes to raise the limit.`);
    src.notes.forEach((n) => {
      const day = Date.parse(n.date ?? "");
      // a ledger counts time in rows; with no dates on the rows, the map plays forward in row order
      notes.push({ ...n, src: si, row: n.time, time: datesFromRows && Number.isFinite(day) ? Math.floor(day / DAY) : n.time, chain: n.chain ?? "unverified" });
    });
    links.push(...src.links.map((l) => ({ ...l, a: l.a + off, b: l.b + off })));
    flags.push(...src.flags.map((f) => ({ ...f, note: f.note + off, correction: f.correction + off })));
    sources.push({ id: "ledger:" + si, path: base(name), name: base(name), kind: "ledger", notes: src.notes.length, integrity: null, lobe: { x: 0, y: 0, r: 1 } });
  }
  const input = { notes, links, flags, source: { name: title, kind: "brain", timeUnit: datesFromRows ? "day" : "row" } };
  const was = foldable(notes, sources, previous);
  const a = was ? foldLayout(input, previous, was) : layout(input);
  a.mode = "brain"; a.sources = sources; a.across = []; a.live = false;
  const hold = !!previous && holdPlaces(a, previous);
  if (was) a.build = { ...a.build, layout: "folded" };
  if (!hold) {
    a.knowledge = regionsOf(a);
    a.notes.forEach((n, i) => { n.region = a.knowledge.assignment[i]; });
  }
  const packed = packBrain(a, hold ? previous : null);
  a.notes.forEach((n, i) => { n.brain = packed.positions[i]; });
  delete packed.positions;
  a.brainLayout = packed;
  sources.forEach((s, si) => { const ns = a.notes.filter((n) => n.src === si); s.brainCenter = [0, 1, 2].map((k) => ns.reduce((v, n) => v + n.brain[k], 0) / Math.max(1, ns.length)); });
  for (const r of [...a.knowledge.regions, ...a.knowledge.neighborhoods]) r.center = [0, 1, 2].map((k) => r.members.reduce((s, i) => s + a.notes[i].brain[k], 0) / Math.max(1, r.members.length));
  // each ledger's correction scan, for the next rebuild to reuse; not part of the page data
  Object.defineProperty(a, "_overlay", { value: overlays, enumerable: false });
  return a;
}

/** The page's Import button: files chosen in the browser, never uploaded. */
export function importMemories(files) {
  if (!files.length) throw new Error("Choose one or more ledger files.");
  if (files.reduce((s, f) => s + f.text.length, 0) > 20_000_000) throw new Error("Choose files totaling less than 20 MB.");
  const a = atlasFromLedgers(files.map((f) => ({ name: f.name, rows: parseLedger(f.text, base(f.name)) })), { title: "Private workspace", maxNotes: 2500 });
  a.hosted = true;
  return a;
}

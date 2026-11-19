// The open layout (2026-11-18): plain word statistics. Each note is a TF-IDF vector over its words; topics are
// spherical k-means clusters (seeded deterministically, near-duplicate topics merged); topic anchors come from
// classical multidimensional scaling of the topic-to-topic cosine; a note sits at a softmax blend of the anchors it
// is closest to. Related notes are an exact cosine top-k. Deterministic: the same input gives the same map.
import { salienceOf, halfLifeForSpan } from "./salience.js";

const STOP = new Set(("the and for with that this was are from not but into its has have had were been which when than then " +
  "they them their there what where will would can could should also only more most over under very just about after before " +
  "because while each other such same these those does did done onto upon via per any all one two three our you your his her " +
  "who how why yes use used using new now yet ever still").split(" "));
export const words = (text) => (String(text ?? "").toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? []).filter((w) => !STOP.has(w));
const round = (v, n = 4) => Math.round(v * 10 ** n) / 10 ** n;
const nameable = (w) => !/^[a-f0-9]+$/.test(w) && (w.match(/\d/g) ?? []).length * 2 < w.length;
function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
const unit = (s, k) => ((hash(s + ":" + k) % 100003) / 100003) * 2 - 1;

// ---- sparse vectors -------------------------------------------------------------------------------------------------
export function dot(a, b) { if (a.size > b.size) [a, b] = [b, a]; let s = 0; for (const [w, x] of a) { const y = b.get(w); if (y) s += x * y; } return s; }
function normalise(v) { let q = 0; for (const x of v.values()) q += x * x; q = Math.sqrt(q); if (q) for (const [w, x] of v) v.set(w, x / q); return v; }
function centroid(vs) { const c = new Map(); for (const v of vs) for (const [w, x] of v) c.set(w, (c.get(w) ?? 0) + x); return normalise(c); }

export function vectors(notes, { headWeight = 3 } = {}) {
  const toks = notes.map((n) => { const head = words(n.head ?? n.title), body = words(n.body ?? n.text); const out = []; for (let r = 0; r < headWeight; r++) out.push(...head); return out.concat(body); });
  const df = new Map();
  for (const ts of toks) for (const w of new Set(ts)) df.set(w, (df.get(w) ?? 0) + 1);
  const N = notes.length, idf = (w) => Math.log((N + 1) / ((df.get(w) ?? 0) + 1)) + 1;
  const V = toks.map((ts) => { const tf = new Map(); for (const w of ts) tf.set(w, (tf.get(w) ?? 0) + 1); const v = new Map(); for (const [w, c] of tf) v.set(w, (1 + Math.log(c)) * idf(w)); return normalise(v); });
  return { V, toks };
}

// ---- spherical k-means with farthest-point seeding ----------------------------------------------------------------------
export function kmeans(ids, V, k, { rounds = 12 } = {}) {
  if (!ids.length) return [];
  const seeds = [ids[0]];
  const best = new Float64Array(ids.length).fill(-Infinity);
  while (seeds.length < Math.min(k, ids.length)) {
    const last = V[seeds[seeds.length - 1]];
    let pick = -1, low = Infinity;
    ids.forEach((i, x) => { best[x] = Math.max(best[x], dot(V[i], last)); if (best[x] < low) { low = best[x]; pick = i; } });
    if (pick < 0 || low > 0.92) break;               // everything left is a near copy of a seed
    seeds.push(pick);
  }
  let C = seeds.map((i) => V[i]), groups = [];
  for (let r = 0; r < rounds; r++) {
    const next = C.map(() => []);
    for (const i of ids) { let b = 0, s = -Infinity; C.forEach((c, x) => { const d = dot(V[i], c); if (d > s) { s = d; b = x; } }); next[b].push(i); }
    groups = next.filter((g) => g.length);
    const nc = groups.map((g) => centroid(g.map((i) => V[i])));
    if (r && nc.length === C.length && nc.every((c, x) => dot(c, C[x]) > 0.999999)) { C = nc; break; }
    C = nc;
  }
  return groups;
}
// merge topics whose centres say the same thing: k-means at a generous k splits a subject in two, this joins it back
export function mergeClose(groups, V, th, cap = Infinity) {
  let G = groups.map((g) => ({ ids: g, c: centroid(g.map((i) => V[i])) }));
  for (;;) {
    let bi = -1, bj = -1, bs = th;
    for (let i = 0; i < G.length; i++) for (let j = i + 1; j < G.length; j++) {
      if (G[i].ids.length + G[j].ids.length > cap) continue;   // a merged centre grows generic and would absorb the next
      const s = dot(G[i].c, G[j].c); if (s > bs) { bs = s; bi = i; bj = j; }
    }
    if (bi < 0) return G;
    const ids = [...G[bi].ids, ...G[bj].ids].sort((a, b) => a - b);
    G.splice(bj, 1); G[bi] = { ids, c: centroid(ids.map((i) => V[i])) };
  }
}

// ---- classical multidimensional scaling (power iteration, deflation) ----------------------------------------------------
export function mds(S, dims = 3) {
  const K = S.length;
  if (K === 0) return [];
  if (K === 1) return [[0, 0, 0]];
  const D2 = S.map((r) => r.map((s) => 2 * (1 - s)));
  const rowM = D2.map((r) => r.reduce((a, b) => a + b, 0) / K), all = rowM.reduce((a, b) => a + b, 0) / K;
  let B = D2.map((r, i) => r.map((d, j) => -0.5 * (d - rowM[i] - rowM[j] + all)));
  const out = Array.from({ length: K }, () => new Array(dims).fill(0));
  for (let d = 0; d < dims; d++) {
    let v = Array.from({ length: K }, (_, i) => unit("mds", i * 7 + d)), lam = 0;
    for (let it = 0; it < 200; it++) {
      const w = B.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
      const n = Math.hypot(...w); if (!n) break;
      lam = n; v = w.map((x) => x / n);
    }
    // a fixed sign, so the map does not flip between builds
    const lead = v.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);
    if (lead < 0) v = v.map((x) => -x);
    const s = Math.sqrt(Math.max(0, lam));
    v.forEach((x, i) => { out[i][d] = x * s; });
    B = B.map((r, i) => r.map((x, j) => x - lam * v[i] * v[j]));
  }
  return out;
}

// overlapping points step apart on a grid; held points never move
export function relax(pos, gap, rounds) {
  for (let r = 0; r < rounds; r++) {
    const grid = new Map(), key = (x, y) => Math.floor(x / gap) + ":" + Math.floor(y / gap);
    pos.forEach((p, i) => { const k = key(p[0], p[1]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    let moved = 0;
    pos.forEach((p, i) => {
      const cx = Math.floor(p[0] / gap), cy = Math.floor(p[1] / gap);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const j of grid.get(cx + dx + ":" + (cy + dy)) ?? []) {
        if (j <= i) continue;
        const q = pos[j]; let ex = q[0] - p[0], ey = q[1] - p[1], d = Math.hypot(ex, ey);
        if (d >= gap) continue;
        if (d < 1e-9) { ex = unit("relax", i * 31 + j); ey = unit("relax", j * 31 + i); d = Math.hypot(ex, ey) || 1; }
        const push = (gap - d) / 2 / d; p[0] -= ex * push; p[1] -= ey * push; q[0] += ex * push; q[1] += ey * push; moved++;
      }
    });
    if (!moved) return;
  }
}

// ---- related notes: one memory's exact cosine top-k over a candidate list; suggestions: strong pairs no link records ----
export const RELATED_SCALE = 20;
export function relatedRow(V, i, cand, o = {}) {
  const floor = o.relatedMin ?? 0.12, s = [];
  for (const j of cand) { if (j === i) continue; const c = dot(V[i], V[j]); if (c >= floor) s.push([j, c]); }
  s.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return s.slice(0, o.relatedK ?? 8).map(([j, c]) => [j, round(c * RELATED_SCALE, 1)]);
}
export function suggestionsOf(related, links, o = {}) {
  const recorded = new Set(links.map((l) => `${Math.min(l.a, l.b)}:${Math.max(l.a, l.b)}`)), sugg = new Map();
  related.forEach((list, i) => { for (const [j, z] of list) { if (z < (o.suggestMin ?? 7)) continue; const key = `${Math.min(i, j)}:${Math.max(i, j)}`; if (!recorded.has(key) && !sugg.has(key)) sugg.set(key, [Math.min(i, j), Math.max(i, j), z]); } });
  return [...sugg.values()].sort((a, b) => b[2] - a[2] || a[0] - b[0]).slice(0, o.suggestMax ?? 200);
}

/**
 * @param {{notes:object[], links:object[], source:object, flags?:object[]}} input (load.js fromRows)
 */
export function layout(input, o = {}) {
  const t0 = Date.now();
  const { notes, links = [], source = { kind: "ledger", name: "memory" } } = input;
  const N = notes.length;
  const { V, toks } = vectors(notes, o);
  const order = notes.map((_, i) => i).sort((a, b) => (notes[a].time - notes[b].time) || String(notes[a].id).localeCompare(String(notes[b].id)));

  // ---- topics
  const k = o.k ?? Math.max(2, Math.min(48, Math.round(Math.sqrt(N / 1.5))));
  const minTopic = Math.min(3, N);
  let G = mergeClose(kmeans(order, V, k), V, o.merge ?? 0.45, Math.max(2 * minTopic, Math.ceil((2.5 * N) / k)));
  const small = G.filter((g) => g.ids.length < minTopic);
  G = G.filter((g) => g.ids.length >= minTopic);
  if (!G.length && N) G = [{ ids: order.slice(), c: centroid(V) }];
  for (const g of small) for (const i of g.ids) { let b = 0, s = -Infinity; G.forEach((h, x) => { const d = dot(V[i], h.c); if (d > s) { s = d; b = x; } }); G[b].ids.push(i); }
  G.forEach((g) => { g.ids.sort((a, b) => a - b); g.c = centroid(g.ids.map((i) => V[i])); });
  G.sort((a, b) => b.ids.length - a.ids.length || a.ids[0] - b.ids[0]);
  const topicOf = new Int32Array(N);
  G.forEach((g, t) => { for (const i of g.ids) topicOf[i] = t; });

  // ---- names: the words most over-represented in the topic
  const overall = new Map();
  toks.forEach((ts) => { for (const w of new Set(ts)) overall.set(w, (overall.get(w) ?? 0) + 1); });
  const names = G.map((g) => {
    const c = new Map();
    for (const i of g.ids) for (const w of new Set(toks[i])) c.set(w, (c.get(w) ?? 0) + 1);
    const min = g.ids.length >= 6 ? 2 : 1;
    return [...c].filter(([w, n]) => n >= min && nameable(w)).map(([w, n]) => [w, n / g.ids.length - (overall.get(w) - n) / Math.max(1, N - g.ids.length)])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([w]) => w);
  });

  // ---- anchors and positions
  const S = G.map((a) => G.map((b) => dot(a.c, b.c)));
  const A3 = mds(S, 3);
  const ext = Math.max(1e-9, ...A3.flatMap((a) => [Math.abs(a[0]), Math.abs(a[1])]));
  const anchors = A3.map((a) => a.map((x) => x / ext));
  const spread = o.spread ?? Math.max(0.05, Math.min(0.28, 0.5 / Math.sqrt(G.length)));
  const beta = o.beta ?? 14;
  const M = V.map((v) => G.map((g) => dot(v, g.c)));
  const depth = new Float64Array(N);
  const pos = notes.map((n, i) => {
    const m = M[i], mx = Math.max(...m);
    let x = 0, y = 0, z = 0, W = 0;
    m.forEach((s, t) => { const w = Math.exp(beta * (s - mx)); x += w * anchors[t][0]; y += w * anchors[t][1]; z += w * anchors[t][2]; W += w; });
    // a note's own place inside its topic: a fixed offset from its id, narrower the closer it is to the topic centre
    const r = spread * (1.15 - 0.6 * Math.max(0, mx));
    depth[i] = z / W + r * 0.5 * unit(n.id, "z");
    return [x / W + r * unit(n.id, "x"), y / W + r * unit(n.id, "y")];
  });
  relax(pos, o.minGap ?? 0.012, 30);
  const xs = pos.map((p) => p[0]), ys = pos.map((p) => p[1]);
  const cx = N ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0, cy = N ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;
  const half = N ? Math.max(1e-9, (Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2) : 1;
  pos.forEach((p) => { p[0] = (p[0] - cx) / half; p[1] = (p[1] - cy) / half; });
  const cz = N ? (Math.min(...depth) + Math.max(...depth)) / 2 : 0;
  for (let i = 0; i < N; i++) depth[i] = (depth[i] - cz) / half;

  // ---- related (exact cosine top-k) and suggested links
  const related = notes.map((_, i) => relatedRow(V, i, N <= (o.exactUpTo ?? 3000) ? order : G[topicOf[i]].ids, o));
  const suggested = suggestionsOf(related, links, o);

  const halfLife = halfLifeForSpan(notes.map((n) => ({ t: n.time })));
  const now = N ? Math.max(...notes.map((n) => n.time)) : 0;
  const out = {
    v: 1, generated: new Date().toISOString(), source,
    notes: notes.map((n, i) => { const { body, head, ...keep } = n; return { ...keep, x: round(pos[i][0]), y: round(pos[i][1]), z: round(depth[i]), topic: topicOf[i], fit: round(M[i][topicOf[i]] * RELATED_SCALE, 1), sal: round(salienceOf({ t: n.time, kind: n.kind, pinned: n.pinned }, { now, halfLife }), 3) }; }),
    topics: G.map((g, t) => {
      const c = [0, 0, 0]; for (const i of g.ids) { c[0] += pos[i][0]; c[1] += pos[i][1]; c[2] += depth[i]; }
      return { name: names[t], size: g.ids.length, x: round(c[0] / g.ids.length), y: round(c[1] / g.ids.length), z: round(c[2] / g.ids.length), ax: round((anchors[t][0] - cx) / half), ay: round((anchors[t][1] - cy) / half) };
    }),
    links, related, suggested, flags: input.flags ?? [],
    decay: { halfLife: round(halfLife, 2), now, unit: source.timeUnit ?? "row" },
    build: { ms: Date.now() - t0, layout: "open", topics: G.length, related: N <= (o.exactUpTo ?? 3000) ? "exact" : "within topic" },
  };
  Object.defineProperty(out, "_vectors", { value: V, enumerable: false });
  return out;
}

// ---- regions: a handful of named areas for the brain view, each split into neighbourhoods -------------------------------
const PALETTE = ["#70b7ce", "#d4b574", "#8ac49c", "#dc9981", "#94b1de", "#c5c681", "#73c7bd", "#d7aaa2"];
export function regionsOf(a) {
  const notes = a.notes, N = notes.length;
  if (!N) return { regions: [], assignment: [], neighborhoods: [] };
  const V = a._vectors ?? vectors(notes).V;
  const toks = notes.map((n) => words([n.title, n.cause, n.effect, n.text, ...(n.tags ?? [])].join(" ")));
  const order = notes.map((_, i) => i);
  const name = (ids) => {
    const c = new Map(); for (const i of ids) for (const w of new Set(toks[i])) if (nameable(w) && !/\d/.test(w)) c.set(w, (c.get(w) ?? 0) + 1);
    return [...c].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 3).map(([w]) => w);
  };
  const want = Math.min(8, Math.max(3, Math.round(Math.sqrt(N) / 4)));
  const groups = mergeClose(kmeans(order, V, want), V, 0.6, Math.ceil((2.5 * N) / want)).map((g) => g.ids).sort((x, y) => y.length - x.length || x[0] - y[0]);
  const assignment = new Array(N), neighborhoods = [];
  const regions = groups.map((members, k) => {
    const terms = name(members), id = "region-" + k;
    members.forEach((i) => { assignment[i] = id; });
    const label = terms.map((t, x) => (x ? t : t[0].toUpperCase() + t.slice(1))).join(" / ") || "Unsorted memories";
    kmeans(members, V, Math.min(6, Math.max(1, Math.round(Math.sqrt(members.length) / 3)))).forEach((m, j) => neighborhoods.push({ id: id + "-n" + j, region: id, label: name(m).join(" / ") || label, members: m }));
    return { id, members, terms, label, color: PALETTE[k % PALETTE.length] };
  });
  return { regions, assignment, neighborhoods };
}

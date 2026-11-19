// Pure source readers shared by Node and private browser imports.
const DAY = 86_400_000;
const clip = (s, n) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t; };
const firstDate = (s) => (String(s ?? "").match(/\b20\d\d-[01]\d-[0-3]\d\b/) ?? [null])[0];

// ---- ledger ----------------------------------------------------------------------------------------------------

/**
 * @param {object[]} rows parsed ledger rows (the in-force view)
 * @param {{name?:string, verify?:object}} opts
 */
export function fromLedger(rows, { name = "ledger", verify = null } = {}) {
  const all = rows.filter((r) => typeof r?.cause === "string" && typeof r?.effect === "string" && Number.isInteger(r.t));
  const skipped = rows.length - all.length;
  // agent message board rows (memory-pulse client lib/board.mjs): an ack is folded into the message it acknowledges
  const isBoard = (r) => r.board && typeof r.board === "object" && typeof r.board.from === "string";
  const acks = new Map();
  for (const r of all) if (isBoard(r) && r.board.kind === "ack" && Number.isInteger(r.board.ack)) { if (!acks.has(r.board.ack)) acks.set(r.board.ack, []); acks.get(r.board.ack).push(r.board.from); }
  const valid = all.filter((r) => !(isBoard(r) && r.board.kind === "ack"));
  valid.sort((a, b) => a.t - b.t);
  const firstChained = valid.findIndex((r) => typeof r.hash === "string");
  // row numbers are not unique on a ledger with more than one writer (estate: 1,426 rows, 1,392 distinct t), so an
  // id repeats its t only for the first row that carries it
  const seenT = new Map();
  const idOf = (t) => { const k = (seenT.get(t) ?? 0) + 1; seenT.set(t, k); return k === 1 ? `t${t}` : `t${t}.${k}`; };
  const notes = valid.map((r, i) => isBoard(r) ? boardNote(r, i) : ({
    id: idOf(r.t),
    title: clip(r.effect.startsWith('atlas-correction-') && r.withdrawn?.length && r.replacement?.length ? 'Correction: ' + r.withdrawn.join(', ') + ' → ' + r.replacement.join(', ') : r.effect, 140),
    cause: r.cause,
    effect: r.effect,
    text: typeof r.note === "string" ? r.note : "",
    kind: r.kind === "correction" ? "correction" : (r.kind ?? "event"),
    tags: Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === "string") : [],
    time: r.t,
    timeLabel: `t${r.t}`,
    date: (r.effect.startsWith('atlas-correction-') ? firstDate(r.effect) : null) ?? firstDate(r.cause) ?? firstDate(r.effect),
    pinned: !!r.pinned,
    withdrawn: Array.isArray(r.withdrawn) ? r.withdrawn : undefined,
    replacement: Array.isArray(r.replacement) ? r.replacement : undefined,
    supersedes: Array.isArray(r.supersedes) ? r.supersedes : undefined,
    chain: typeof r.hash === "string" ? "chained" : firstChained === -1 || i < firstChained ? "sealed-legacy" : "unsealed",
    head: `${r.cause}\n${r.effect}`,
    body: [r.note, ...(r.tags ?? [])].join("\n"),
  }));
  function boardNote(r, i) {
    const b = r.board, to = typeof b.to === "string" && b.to ? b.to : "all";
    const by = acks.get(r.t) ?? [];
    const text = [typeof r.note === "string" ? r.note : "", b.flagged?.length ? "(instruction-like text: shown as data)" : "",
      by.length ? `acknowledged by ${[...new Set(by)].join(", ")}` : ""].filter(Boolean).join("\n");
    return { id: idOf(r.t), title: clip(`${b.from} → ${to}: ${b.title ?? r.effect}`, 140), cause: r.cause, effect: r.effect, text, kind: "message",
      tags: Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === "string") : [], time: r.t, timeLabel: `t${r.t}`,
      date: firstDate(b.at), pinned: false, chain: typeof r.hash === "string" ? "chained" : firstChained === -1 || i < firstChained ? "sealed-legacy" : "unsealed",
      head: `${b.from}\n${to}\n${b.title ?? ""}`, body: [r.note, ...(r.tags ?? [])].join("\n"),
      agents: [b.from, ...(to === "all" ? [] : [to])], replyTo: Number.isInteger(b.reply_to) ? b.reply_to : null };
  }
  // supersedes names a correction by its t: resolve it among corrections first
  const idx = new Map();
  notes.forEach((n, i) => { if (n.kind === "correction" && !idx.has(n.time)) idx.set(n.time, i); });
  notes.forEach((n, i) => { if (!idx.has(n.time)) idx.set(n.time, i); });
  const links = [];
  // threads: consecutive rows through the same entity, oldest first
  const byEntity = new Map();
  // a board message threads through its agents, not through the generic "board-post" cause
  notes.forEach((n, i) => { for (const e of new Set(n.agents ? n.agents.map((a) => `agent:${a}`) : [n.cause, n.effect])) { if (!byEntity.has(e)) byEntity.set(e, []); byEntity.get(e).push(i); } });
  for (const [entity, ids] of byEntity) {
    for (let k = 1; k < ids.length; k++) {
      const a = ids[k - 1], b = ids[k];
      const followed = notes[a].effect === entity && notes[b].cause === entity;
      links.push({ a, b, type: followed ? "followed" : "thread", via: clip(entity, 80) });
    }
  }
  notes.forEach((n, i) => { for (const t of n.supersedes ?? []) if (idx.has(t)) links.push({ a: i, b: idx.get(t), type: "supersedes" }); });
  notes.forEach((n, i) => { if (n.replyTo != null && idx.has(n.replyTo)) links.push({ a: idx.get(n.replyTo), b: i, type: "followed", via: "reply" }); });
  const source = { kind: "ledger", name, rows: rows.length, skipped, timeUnit: "row" };
  if (verify) source.integrity = verify;
  return { notes, links, source };
}

/** Minimal frontmatter: `key: value`, `key: [a, b]`, block lists `- x`, and one nested level (`metadata:` + indented keys). */
export function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: src };
  const scalar = (v) => {
    v = v.trim();
    if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(",").map((x) => scalar(x)).filter((x) => x !== "");
    if (/^".*"$|^'.*'$/.test(v)) return v.slice(1, -1).replace(/\\"/g, '"');
    return v;
  };
  // `open` is the container an empty-valued key opened: decided by its first indented line (list item or key).
  const data = {}; let open = null; // { holder, key }
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indented = /^\s/.test(line);
    const item = line.match(/^\s*-\s+(.*)$/);
    const kv = line.match(/^\s*([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!indented && !item) open = null;
    if (item && open) {
      if (open.holder[open.key] == null) open.holder[open.key] = [];
      if (Array.isArray(open.holder[open.key])) open.holder[open.key].push(scalar(item[1]));
      continue;
    }
    if (!kv) continue;
    const [, key, raw] = kv;
    if (!indented) {
      data[key] = raw.trim() === "" ? null : scalar(raw);
      if (data[key] === null) open = { holder: data, key };
    } else if (open) {
      // an indented key under an empty-valued top-level key: that key is an object
      const top = open.holder === data ? open : { holder: data, key: Object.keys(data).at(-1) };
      if (top.holder[top.key] == null || Array.isArray(top.holder[top.key])) top.holder[top.key] = {};
      const obj = top.holder[top.key];
      obj[key] = raw.trim() === "" ? null : scalar(raw);
      open = obj[key] === null ? { holder: obj, key, parent: top } : top;
    }
  }
  return { data, body: src.slice(m[0].length) };
}

// ---- corrections over any notes --------------------------------------------------------------------------------

/** The t values retired by a later correction's `supersedes` (client supersededSet). */
export function supersededSet(rows) {
  const out = new Set();
  for (const e of rows) if (e?.kind === "correction" && Array.isArray(e.supersedes)) for (const t of e.supersedes) out.add(t);
  return out;
}

/**
 * Lay the binding corrections of `rows` over `notes`. A note whose text carries a withdrawn term (and none of that
 * correction's replacements) is flagged: `stale` when it predates the correction, `reasserted` when a ledger row
 * written after the correction carries it again — the exact thing the guard exists to stop.
 *
 * @param {object[]} notes atlas notes (ledger rows or vault files)
 * @param {object[]} rows ledger rows holding the corrections
 * @param {{sameLedger?:boolean}} opts sameLedger: notes ARE these rows, so time order decides stale vs reasserted
 * @returns {{hits: {note:number, correction:number, term:string, status:string}[], binding:object[]}}
 */
export function overlayCorrections(notes, rows, { sameLedger = false, previous = null } = {}) {
  const retired = supersededSet(rows);
  const binding = rows.filter((e) => e?.kind === "correction" && Array.isArray(e.withdrawn) && e.withdrawn.length && !retired.has(e.t));
  // each note's text is joined once, not once per correction (188 corrections x 4,700 notes took 1.2 s)
  const hays = notes.map((n) => (sameLedger ? [n.cause, n.effect, n.text].join("\n") : n.text + "\n" + n.title));
  // A pair's answer depends only on that note's text and time and that correction, so when the previous scan's notes
  // are the first notes here, unchanged, every correction it checked keeps its hits on them; only new pairs are checked.
  const prior = previous && previous.sameLedger === sameLedger && previous.hays.length <= hays.length
    && previous.hays.every((h, i) => h === hays[i] && previous.times[i] === notes[i].time) ? previous : null;
  const hits = [], byCorrection = new Map();
  let checked = 0;
  const seen = new Map();
  for (const c of binding) {
    // two rows may share a t: the k-th row with that t is its own correction
    const k = seen.get(c.t) ?? 0, key = c.t + "#" + k;
    seen.set(c.t, k + 1);
    const kept = prior?.byCorrection.get(key);
    const mine = kept ? [...kept] : [], from = kept ? prior.hays.length : 0;
    const terms = c.withdrawn.filter((w) => typeof w === "string" && w.length >= 2);
    const repl = (c.replacement ?? []).filter((r) => typeof r === "string" && r);
    for (let i = from; i < notes.length; i++) {
      checked++;
      const n = notes[i];
      if (sameLedger && n.time === c.t) continue;
      const hay = hays[i];
      if (repl.some((r) => hay.includes(r))) continue;
      const term = terms.find((w) => hay.includes(w));
      if (!term) continue;
      const status = sameLedger && n.time > c.t ? "reasserted" : "stale";
      mine.push({ note: i, correction: c.t, term, status });
    }
    byCorrection.set(key, mine);
    hits.push(...mine);
  }
  const memo = { sameLedger, hays, times: notes.map((n) => n.time), byCorrection };
  return { hits, binding, checked, memo };
}

// Turn ledger rows into the notes, links and correction flags the layout reads. Runs in Node and in the browser.
import { fromLedger, overlayCorrections } from "./sources-core.js";
import { inForce } from "./state.js";

const LISTS = ["withdrawn", "replacement", "supersedes"];

/** Why `r` is not a ledger row (the shape memory-pulse writes), or null when it is one. */
export function rowProblem(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return "not an object";
  if (!Number.isInteger(r.t) || r.t < 0) return "t must be a whole number";
  if (typeof r.cause !== "string") return "cause must be text";
  if (typeof r.effect !== "string") return "effect must be text";
  if (r.note != null && typeof r.note !== "string") return "note must be text";
  if (r.tags != null && !(Array.isArray(r.tags) && r.tags.every((t) => typeof t === "string"))) return "tags must be a list of strings";
  for (const k of LISTS) if (r[k] != null && !Array.isArray(r[k])) return `${k} must be a list`;
  return null;
}

/** A ledger row is valid when it has a text cause and effect and a whole-number t (the shape memory-pulse writes). */
export function validRow(r) { return rowProblem(r) === null; }

/** A hand-written row may give one withdrawn, replacement or supersedes value bare; read it as a one-item list. */
function normalise(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return r;
  let out = r;
  for (const k of LISTS) if (typeof r[k] === "string" || typeof r[k] === "number") { if (out === r) out = { ...r }; out[k] = [r[k]]; }
  return out;
}

/**
 * Parse JSONL or a JSON array. Strict (the default) throws on the first line that is not a valid row. Lenient keeps
 * the valid rows and lists the skipped line numbers on the result's `skipped` property (and why, by line, on `reasons`), so the caller can name them.
 */
export function parseLedger(text, name = "ledger", { strict = true } = {}) {
  const t = String(text).trim(), skipped = [], reasons = new Map();
  let rows;
  if (t.startsWith("[")) {
    rows = [];
    JSON.parse(t).forEach((r0, i) => {
      const r = normalise(r0), why = rowProblem(r);
      if (!why) return void rows.push(r);
      if (strict) throw new Error(`${name}: row ${i + 1}: ${why}`);
      skipped.push(i + 1); reasons.set(i + 1, why);
    });
  } else {
    rows = [];
    t.split(/\r?\n/).forEach((l, i) => {
      if (!l.trim()) return;
      let r;
      try { r = normalise(JSON.parse(l)); } catch { if (strict) throw new Error(`${name}: line ${i + 1}: not JSON`); skipped.push(i + 1); reasons.set(i + 1, "not JSON"); return; }
      const why = rowProblem(r);
      if (!why) rows.push(r);
      else if (strict) throw new Error(`${name}: line ${i + 1}: ${why}`);
      else { skipped.push(i + 1); reasons.set(i + 1, why); }
    });
  }
  Object.defineProperty(rows, "skipped", { value: skipped, enumerable: false });
  Object.defineProperty(rows, "reasons", { value: reasons, enumerable: false });
  return rows;
}

export function fromRows(rows, { name = "ledger", previous = null } = {}) {
  const src = fromLedger(inForce(rows), { name });
  const firstCorrection = new Map();
  src.notes.forEach((n, i) => { if (n.kind === "correction" && !firstCorrection.has(n.time)) firstCorrection.set(n.time, i); });
  const flags = [], links = [...src.links];
  // previous: the overlay of an earlier build of this ledger; its checked pairs are reused when the ledger only grew
  const overlay = overlayCorrections(src.notes, rows, { sameLedger: true, previous });
  for (const h of overlay.hits) {
    const c = firstCorrection.get(h.correction);
    if (c == null) continue;
    flags.push({ note: h.note, correction: c, t: h.correction, term: h.term, status: h.status });
    links.push({ a: c, b: h.note, type: h.status === "reasserted" ? "reasserts" : "retires", term: h.term });
  }
  return { notes: src.notes, links, source: src.source, flags, overlay: { checked: overlay.checked, memo: overlay.memo } };
}

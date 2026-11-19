// Turn ledger rows into the notes, links and correction flags the layout reads. Runs in Node and in the browser.
import { fromLedger, overlayCorrections } from "./sources-core.js";
import { inForce } from "./state.js";

/** A ledger row is valid when it has a text cause and effect and a whole-number t (the shape memory-pulse writes). */
export function validRow(r) {
  return r && typeof r === "object" && typeof r.cause === "string" && typeof r.effect === "string" && Number.isInteger(r.t) && r.t >= 0
    && (r.note == null || typeof r.note === "string")
    && (r.tags == null || (Array.isArray(r.tags) && r.tags.every((t) => typeof t === "string")))
    && ["withdrawn", "replacement", "supersedes"].every((k) => r[k] == null || Array.isArray(r[k]));
}

/**
 * Parse JSONL or a JSON array. Strict (the default) throws on the first line that is not a valid row. Lenient keeps
 * the valid rows and lists the skipped line numbers on the result's `skipped` property, so the caller can name them.
 */
export function parseLedger(text, name = "ledger", { strict = true } = {}) {
  const t = String(text).trim(), skipped = [];
  let rows;
  if (t.startsWith("[")) {
    rows = JSON.parse(t);
    rows = rows.filter((r, i) => { if (validRow(r)) return true; if (strict) throw new Error(`${name}: row ${i + 1} is not a ledger row (needs cause, effect and a whole-number t)`); skipped.push(i + 1); return false; });
  } else {
    rows = [];
    t.split(/\r?\n/).forEach((l, i) => {
      if (!l.trim()) return;
      let r;
      try { r = JSON.parse(l); } catch { if (strict) throw new Error(`${name}: line ${i + 1} is not JSON`); skipped.push(i + 1); return; }
      if (validRow(r)) rows.push(r);
      else if (strict) throw new Error(`${name}: line ${i + 1} is not a ledger row (needs cause, effect and a whole-number t)`);
      else skipped.push(i + 1);
    });
  }
  Object.defineProperty(rows, "skipped", { value: skipped, enumerable: false });
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

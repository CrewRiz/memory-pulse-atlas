/**
 * Agent state — the in-force view (2026-09-21).
 *
 * A rollback is a ROW, never an edit: `{ tags: ["rollback"], rollback_to: t }` appended by the client's
 * `state rollback`. It restores the ledger as it stood at row t and keeps everything recorded after itself,
 * so rolling back past a rollback restores what that rollback removed. Rows out of force stay on the
 * record: the seal, the chain and the set head commit to every row as written, and only the READ view
 * (brief ranking, check, before) is filtered. Twin of the client's inForceSet; keep them in step.
 */
export const isRollback = (e) => !!e && Array.isArray(e.tags) && e.tags.includes("rollback") && Number.isInteger(e.rollback_to);

/** The row numbers (t) in force at the head. Rows without an integer t are never rolled back. */
export function inForceSet(events) {
  const byT = new Map(); for (const e of events) if (Number.isInteger(e?.t) && !byT.has(e.t)) byT.set(e.t, e);
  const ts = [...byT.keys()].sort((a, b) => a - b);
  // the state at a target X is the state after the last row with t <= X; snapshots are kept at those rows only
  const anchorOf = (X) => { let a = 0; for (const t of ts) { if (t > X) break; a = t; } return a; };
  const anchors = new Set(); for (const t of ts) { const e = byT.get(t); if (isRollback(e) && e.rollback_to < t) anchors.add(anchorOf(e.rollback_to)); }
  const snapshots = new Map([[0, new Set()]]);
  let s = new Set();
  for (const t of ts) {
    const e = byT.get(t);
    if (isRollback(e) && e.rollback_to < t) s = new Set(snapshots.get(anchorOf(e.rollback_to)) ?? []);
    s.add(t);
    if (anchors.has(t)) snapshots.set(t, new Set(s));
  }
  return s;
}

/** The rows in force: the same array back when no rollback was ever recorded (the common case costs nothing). */
export function inForce(events) {
  if (!Array.isArray(events) || !events.some(isRollback)) return events;
  const s = inForceSet(events);
  return events.filter((e) => !Number.isInteger(e?.t) || s.has(e.t));
}

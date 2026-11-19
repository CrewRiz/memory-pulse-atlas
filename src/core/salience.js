/**
 * Salience — explicit, inspectable forgetting.
 *
 * Part III of the provisional goes out of its way to REMOVE recency bias: unit-
 * modulus complex accumulation makes every stored entry contribute equally no
 * matter when it arrived. That is a property worth keeping, and it means decay
 * must not be smuggled in through the accumulator.
 *
 * So salience is computed here, as a number you can print, and applied at
 * rank time by default. Order-invariance survives (see test/memory.test.js)
 * because the exact substrate receives unit weights. Two consequences follow:
 *
 *   - Rebuilding the memory from the same events in any order is bit-identical.
 *   - A correction stays load-bearing forever, because its salience is policy
 *     (1, always) rather than a decay of when it happened. A withdrawn number
 *     does not un-withdraw because the session got long.
 */

export const DECAY = {
  /** Age, in ledger ticks, at which an ordinary event is worth half. */
  halfLife: 64,
  /** Pinned events never attenuate past this. */
  pinFloor: 0.5,
  /** Each prior access buys this much of the gap back toward 1. */
  hitBonus: 0.12,
  /** Cap on reinforcement, so a hot memory cannot crowd out a correction. */
  maxHitBoost: 0.5,
  /** Nothing is ever deleted by decay — forgetting is attenuation. */
  floor: 1e-6,
};

/** Kept as a named compatibility constant; exact accumulation is unit weight. */
export const CORRECTION_WEIGHT = 1;

const clamp = (x) => Math.min(1, Math.max(DECAY.floor, x));

/**
 * @param {{t:number, kind?:string, pinned?:boolean, hits?:number, lastHit?:number}} ev
 * @param {{now:number}} opts
 * @returns {number} salience in (0, 1]
 */
export function salienceOf(ev, { now, halfLife = DECAY.halfLife } = {}) {
  if (ev.kind === "correction") return 1;

  const t = ev.t ?? 0;
  const clock = now ?? t;
  const age = Math.max(0, clock - t);

  // Access reinforcement: a memory that was read recently is treated as young.
  // The event's own timestamp still bounds it — reading cannot make something
  // older than it is.
  const hits = ev.hits ?? 0;
  const effectiveAge = hits > 0 && ev.lastHit != null ? Math.min(age, Math.max(0, clock - ev.lastHit)) : age;

  let s = Math.pow(2, -effectiveAge / halfLife);
  if (hits > 0) {
    const boost = Math.min(DECAY.maxHitBoost, hits * DECAY.hitBonus);
    s = s + (1 - s) * boost;
  }
  if (ev.pinned) s = Math.max(s, DECAY.pinFloor);
  return clamp(s);
}

/** Optional legacy ingest-mode weight; corrections remain bounded at one. */
export function weightOf(ev, opts) {
  return salienceOf(ev, opts);
}

/**
 * Half-life chosen from the ledger's own span rather than a fixed constant.
 *
 * This exists because of a measurement, not a preference. With the fixed
 * 64-tick half-life, a 400-event ledger puts everything older than ~t=300
 * below the point where recall can find them: the memory silently loses its own early
 * history. Scaling to span/4 puts the OLDEST event at 2^-4 ≈ 6% salience —
 * attenuated, still reachable, and recoverable to full weight by pinning or by
 * being read (reinforcement).
 *
 * The span/4 shape, not the number 4, is the claim: whatever the ledger's
 * length, the far end of history should be faint rather than absent.
 */
export function halfLifeForSpan(events, { fraction = 4 } = {}) {
  const ts = events.map((e) => e.t ?? 0);
  if (!ts.length) return DECAY.halfLife;
  const span = Math.max(...ts) - Math.min(...ts);
  return Math.max(DECAY.halfLife, span / fraction);
}

/** The decay curve, for charting and for asserting the half-life is what we say. */
export function decayCurve({ from = 0, to = DECAY.halfLife * 4, step = 1 } = {}) {
  const out = [];
  for (let age = from; age <= to; age += step) {
    out.push({ age, salience: salienceOf({ t: 0, kind: "event" }, { now: age }) });
  }
  return out;
}

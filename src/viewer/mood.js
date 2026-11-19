// The optional cognitive-harness layer: four gauges for a harness's neuromodulator levels, and the values handed to the
// 3-D view (window.AtlasMood), which lets them tint the scene. A visual reading of the harness's own numbers, nothing more.
//   dopamine (reward, -1 to 1): note halos brighten with it
//   acetylcholine (attention, 0 to 1): the brain's outer membrane thins so the memories stand out
//   norepinephrine (arousal, 0 to 1): glow strength and the speed of the slow turn
//   serotonin (patience, 0 to 1): slows the turn
export const MOOD_KEYS = [
  ["DA", "Dopamine", "reward", -1],
  ["ACh", "Acetylcholine", "attention", 0],
  ["NE", "Norepinephrine", "arousal", 0],
  ["5HT", "Serotonin", "patience", 0],
];

/** Accepts {DA, ACh, NE, 5HT} (or 5-HT / serotonin-style long names); throws on a value that is not a number. */
export function normaliseMood(m) {
  if (!m || typeof m !== "object") throw new Error("mood must be an object with DA, ACh, NE and 5HT");
  const alias = { dopamine: "DA", acetylcholine: "ACh", norepinephrine: "NE", serotonin: "5HT", "5-HT": "5HT" };
  const src = {};
  for (const [k, v] of Object.entries(m)) src[alias[k] ?? k] = v;
  const out = {};
  for (const [k, , , lo] of MOOD_KEYS) {
    const v = src[k] ?? 0;
    if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`mood.${k} must be a number, got ${JSON.stringify(v)}`);
    out[k] = Math.round(Math.max(lo, Math.min(1, v)) * 1000) / 1000;
  }
  if (typeof src.phase === "string") out.phase = src.phase.slice(0, 24);
  return out;
}

export const MOOD_CSS = String.raw`
.mood{position:absolute;top:12px;right:12px;z-index:4;background:var(--raise);border:1px solid var(--rule);border-radius:8px;padding:10px 12px;width:230px;font-size:12px;color:var(--ink-2)}
.mood summary{font-size:12.5px;font-weight:650;color:var(--ink);display:flex;justify-content:space-between;gap:12px;cursor:pointer;list-style:none}
.mood summary::-webkit-details-marker{display:none}
.mood summary span{font-weight:500;color:var(--ink-3)}
.mood[open] summary{margin-bottom:8px}
.mood .g{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin-bottom:7px}
.mood .g b{font-weight:550;color:var(--ink)}
.mood .g i{font-style:normal;color:var(--ink-3)}
.mood .t{grid-column:1/-1;height:5px;border-radius:3px;background:var(--grid-major);position:relative;overflow:hidden}
.mood .t s{position:absolute;top:0;bottom:0;background:var(--blue);transition:left 400ms ease-out,width 400ms ease-out}
.mood .t.bi::after{content:"";position:absolute;left:50%;top:-1px;bottom:-1px;width:1px;background:var(--rule-strong)}
@media (prefers-reduced-motion:reduce){.mood .t s{transition:none}}
body.embed .mood{top:8px;right:8px;width:200px}
@media (max-width:720px){.mood{width:auto;min-width:150px;max-width:calc(100% - 24px);padding:7px 10px}.mood[open]{left:12px}}`;

export function moodHtml(m) {
  return `<details class="mood" id="mood" open aria-label="Cognitive harness">
  <summary>Harness <span id="mood-phase">${m.phase ? m.phase.replace(/[<&>"]/g, "") : ""}</span></summary>
  ${MOOD_KEYS.map(([k, name, what, lo]) => `<div class="g"><b>${name}</b><i id="mood-v-${k}"></i><div class="t${lo < 0 ? " bi" : ""}" role="meter" aria-label="${name}, ${what}" aria-valuemin="${lo}" aria-valuemax="1" id="mood-m-${k}"><s id="mood-b-${k}"></s></div><i style="grid-column:1/-1;font-size:11px">${what}</i></div>`).join("\n  ")}
</details>`;
}

export function moodScript(m, { live = false } = {}) {
  return `window.AtlasMood = ${JSON.stringify(m)};
(function () {
  var KEYS = ${JSON.stringify(MOOD_KEYS.map(([k, , , lo]) => [k, lo]))};
  function paint(m) {
    window.AtlasMood = m;
    KEYS.forEach(function (kl) {
      var k = kl[0], lo = kl[1], v = Math.max(lo, Math.min(1, Number(m[k]) || 0));
      var b = document.getElementById("mood-b-" + k), t = document.getElementById("mood-m-" + k), o = document.getElementById("mood-v-" + k);
      if (!b) return;
      if (lo < 0) { b.style.left = (50 + Math.min(0, v) * 50) + "%"; b.style.width = (Math.abs(v) * 50) + "%"; }
      else { b.style.left = "0"; b.style.width = (v * 100) + "%"; }
      t.setAttribute("aria-valuenow", v); o.textContent = v.toFixed(2);
    });
    var p = document.getElementById("mood-phase"); if (p) p.textContent = m.phase || "";
  }
  paint(window.AtlasMood);
  // on a phone the gauges start folded into one line, so they do not cover the brain
  var d = document.getElementById("mood"); if (d && window.matchMedia && matchMedia("(max-width: 720px)").matches) d.open = false;
  ${live ? `setInterval(function () { fetch("/api/mood", { credentials: "same-origin" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) { if (m) paint(m); }).catch(function () {}); }, 3000);` : ""}
})();`;
}

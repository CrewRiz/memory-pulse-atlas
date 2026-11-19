/**
 * Atlas page — one self-contained HTML file (2026-09-26).
 *
 * Offline by construction: the Content-Security-Policy allows no network request at all (connect, img, font and
 * frame sources are 'none' or data:), so a note that contains markup can never fetch anything, and the file works
 * from a laptop with no connection. The data rides in a JSON script tag with every "<" escaped.
 */
import { IMPORT_JS } from "./import.bundle.js";
import { VIEWER_CSS, VIEWER_JS } from "./viewer.js";
import { VIEWER3D_JS } from "./viewer3d.bundle.js";
import { BRAIN_SHELL_B64 } from "./brain-shell.js";
import { MOOD_CSS, moodHtml, moodScript, normaliseMood } from "./mood.js";

// the widget: the brain alone, no rails, opening in 3-D
const EMBED_CSS = String.raw`
body.embed{grid-template-columns:minmax(0,1fr);grid-template-rows:44px minmax(0,1fr);grid-template-areas:"bar" "stage"}
body.embed .rail,body.embed .panel,body.embed .time,body.embed .seg,body.embed .integrity,body.embed .legend,body.embed #explore-launch,body.embed .narrow-only,body.embed .presentation-exit{display:none !important}
body.embed .bar{gap:12px}`;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ICON = {
  menu: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>',
  note: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h6l2.5 2.5v8.5h-8.5z"/><path d="M6 8h4.5M6 10.5h4.5"/></svg>',
  theme: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 2.5v11" /><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>',
  minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9"/></svg>',
  fit: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/></svg>',
  close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  live: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8.5h3l1.5-4 2.5 8 2-6 1.2 2h2.8"/></svg>',
};
const SWATCH = {
  dot: '<svg viewBox="0 0 22 12" aria-hidden="true"><circle cx="11" cy="6" r="3.6" style="fill:var(--ink)"/></svg>',
  faded: '<svg viewBox="0 0 22 12" aria-hidden="true"><circle cx="6" cy="6" r="3.2" style="fill:var(--ink)" opacity=".3"/><circle cx="16" cy="6" r="3.2" style="fill:var(--ink)"/></svg>',
  diamond: '<svg viewBox="0 0 22 12" aria-hidden="true"><path d="M11 1.5l4.5 4.5-4.5 4.5-4.5-4.5z" style="fill:var(--red)"/></svg>',
  ring: '<svg viewBox="0 0 22 12" aria-hidden="true"><circle cx="11" cy="6" r="2.8" style="fill:var(--ink)"/><circle cx="11" cy="6" r="5" fill="none" style="stroke:var(--red)" stroke-width="1.5"/></svg>',
  line: '<svg viewBox="0 0 26 12" aria-hidden="true"><path d="M2 6h22" style="stroke:var(--ink)" stroke-width="1.4" opacity=".7"/></svg>',
  dash: '<svg viewBox="0 0 26 12" aria-hidden="true"><path d="M2 6h22" style="stroke:var(--blue)" stroke-width="1.6" stroke-dasharray="4 3"/></svg>',
  curve: '<svg viewBox="0 0 26 12" aria-hidden="true"><path d="M2 9Q13 0 24 9" fill="none" style="stroke:var(--red)" stroke-width="1.5"/></svg>',
  fibre: '<svg viewBox="0 0 26 12" aria-hidden="true"><path d="M2 3Q13 13 24 3" fill="none" style="stroke:var(--blue)" stroke-width="1.5"/></svg>',
};

function integrityLine(source, atlas) {
  const bits = [];
  if (atlas?.mode === "brain") {
    const chained = atlas.sources.filter((x) => x.integrity?.chained);
    const broken = chained.filter((x) => !x.integrity.ok);
    bits.push(`<span>${chained.length} hash-chained ${chained.length === 1 ? "ledger" : "ledgers"}, ${broken.length ? `<span class="bad">${broken.map((x) => esc(x.name)).join(", ")} broken</span>` : "all intact"}</span>`);
    bits.push(`<span>${atlas.across.length.toLocaleString("en-US")} notes that say the same thing in two memories</span>`);
    return bits.join("");
  }
  const v = source.integrity;
  if (v) {
    if (v.ok) bits.push(v.chained ? `<span>Hash chain intact from t${esc(v.from)}, head <span class="mono">${esc(String(v.head).slice(0, 12))}</span></span>` : "<span>Chain not started yet</span>");
    else bits.push(`<span class="bad">Hash chain broken: ${esc(v.reason ?? "verification failed")}</span>`);
  }
  if (source.kind === "vault") bits.push(`<span>${esc(source.files)} files, ${esc(source.unresolved)} links to notes that do not exist yet</span>`);
  if (source.corrections) bits.push(`<span>${esc(source.corrections.binding)} corrections in force from ${esc(source.corrections.from)}, ${esc(source.corrections.bearing)} bear on these notes</span>`);
  return bits.join("");
}

/**
 * @param {object} atlas output of buildAtlas
 * @param {{title?:string}} opts
 */
export function renderAtlasHtml(atlas, { title, live = false, hosted = false, embed = false, mood = null, moodLive = false } = {}) {
  const md = mood ? normaliseMood(mood) : null;
  const name = title ?? atlas.source?.name ?? "memory";
  const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
  const data = JSON.stringify(atlas).replace(/</g, "\\u003c").split(LS).join("\\u2028").split(PS).join("\\u2029");
  const noun = atlas.source?.kind === "ledger" ? "rows" : "notes";
  const brain = atlas.mode === "brain";
  // a live page (atlas serve) may talk to the server that sent it and nothing else; a saved file talks to nothing
  const csp = `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'${live ? "; connect-src 'self'" : ""}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex,nofollow">
<title>${esc(name)} atlas</title>
<style>${VIEWER_CSS}${md ? MOOD_CSS : ""}${embed ? EMBED_CSS : ""}</style>
</head>
<body${embed ? ' class="embed"' : ""}>
<header class="bar">
  <button class="iconbtn narrow-only" id="railbtn" aria-label="Search and browse">${ICON.menu}</button>
  <h1>${esc(name)}</h1>
  <span class="count" id="count">${brain ? `${atlas.notes.length.toLocaleString("en-US")} notes from ${atlas.sources.length} memories` : `${atlas.notes.length} ${noun} in ${atlas.topics.length} topics`}</span>
  <div class="seg" role="group" aria-label="View">
    <button data-view="map" aria-pressed="true">Map</button><button data-view="river" aria-pressed="false">River</button><button data-view="list" aria-pressed="false">List</button><button data-view="3d" aria-pressed="false">3D</button>
  </div>
  <div class="integrity">${integrityLine(atlas.source ?? {}, atlas)}${live ? '<span id="livestatus">Live, connecting</span>' : ""}</div>
  <button class="iconbtn narrow-only" id="panelbtn" aria-label="Selected note">${ICON.note}</button>
  <button class="iconbtn" id="livebtn" aria-pressed="false" aria-label="Show live signals">${ICON.live}</button>
  <button class="iconbtn" id="theme" aria-label="Switch between light and dark">${ICON.theme}</button>
  <button class="btn presentation-exit" data-ex="exit-present">Exit presentation</button>
</header>
<aside class="rail" aria-label="Search and browse">
  <label class="find" for="q">Find a note</label>
  <input type="search" id="q" placeholder="${atlas.source?.kind === "ledger" ? "A word, a name, or t812…" : "A word or a note name…"}" autocomplete="off" spellcheck="false">
  <ol class="results" id="results"></ol>
  <p class="hint" id="searchhint" aria-live="polite"></p>
  ${hosted && !embed ? `<section class="hosted-tools">
    <p class="hint" id="workspace-status" role="status">Sample workspace. Fictional notes. Your imports stay in this tab and are cleared on reload.</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin:10px 0">
      <button class="btn" id="autofind-btn" style="background:var(--blue);color:var(--paper);border:0;font-weight:600">Auto-Find Project Ledger</button>
      <div style="display:flex;gap:6px">
        <label class="btn" for="memory-files" style="flex:1;text-align:center;cursor:pointer">Import memories</label>
        <button class="btn" id="clipboard-fill-btn" style="flex:1" title="Paste JSONL from clipboard">Paste ledger</button>
      </div>
    </div>
    <input id="memory-files" type="file" accept=".jsonl,.json" multiple hidden>
    <p class="hint">Auto-Find scans any selected project for <span class="mono">.memory-pulse/events.jsonl</span>, or drag a folder here.</p>
    <button class="btn" id="clear-workspace">Clear workspace</button>
  </section>` : ""}
  <button class="btn" id="export-workspace">Export workspace</button>
  <nav class="source-nav region-nav" aria-label="Content regions"><div class="rail-heading">Content regions</div><div id="region-list"></div></nav>
  <nav class="source-nav" aria-label="Memory sources"><div class="rail-heading">Library</div><button class="item" data-source="-1" aria-pressed="true">All memories</button><div id="source-list"></div></nav>
  <div class="layers" role="group" aria-label="Layers">
    <label><input type="checkbox" id="l-recorded"> ${SWATCH.line} Recorded links</label>
    <label><input type="checkbox" id="l-related"> ${SWATCH.dash} Related, not linked</label>
    <label><input type="checkbox" id="l-corrections"> ${SWATCH.curve} Corrections</label>
  </div>
  <details><summary>Needs attention <span class="n" id="att-n"></span></summary><ol id="att"></ol></details>
  <details><summary>Suggested links <span class="n" id="sug-n"></span></summary><ol id="sug"></ol></details>
  <details><summary>Topics <span class="n" id="top-n"></span></summary><ol id="top"></ol></details>
</aside>
<main class="stage" aria-label="Map of the memory">
  ${md ? moodHtml(md) : ""}
  <button class="btn explore-launch" id="explore-launch" data-ex="home" aria-pressed="false">Explore memory</button>
  <canvas id="cv3" hidden aria-label="The same memory in three dimensions. Drag to turn it, scroll to zoom, click a note to open it."></canvas>
  <div class="labels3" id="labels3" hidden></div>
  <canvas id="cv" role="img" aria-label="Map of ${atlas.notes.length} ${noun}. Notes that say similar things sit together. The list view holds the same notes as a table."></canvas>
  <div class="tip" id="tip" role="status"></div>
  <div class="localbar" id="localbar"><span id="localtitle"></span><button class="iconbtn" id="localexit" aria-label="Back to the whole map">${ICON.close}</button></div>
  <div class="legend" id="legend">
    ${SWATCH.faded}<span>Note, fading with age</span>
    ${SWATCH.diamond}<span>Correction</span>
    ${SWATCH.ring}<span>Carries a withdrawn value</span>
    ${SWATCH.line}<span>Recorded link</span>
    ${SWATCH.dash}<span>Related, not linked</span>${brain ? `
    ${SWATCH.fibre}<span>Same thing in two memories</span>` : ""}
  </div>
  <div class="growbar" id="growbar" role="status"><span id="growtext"></span><button class="btn" id="growskip">Skip</button></div>
  <div class="zoom" id="zoombox"><button class="iconbtn" id="zin" aria-label="Zoom in">${ICON.plus}</button><button class="iconbtn" id="zout" aria-label="Zoom out">${ICON.minus}</button><button class="iconbtn" id="zfit" aria-label="Fit the map">${ICON.fit}</button></div>
  <div class="listview" id="listview"></div>
  <div class="tour-caption" id="tour-caption" hidden aria-live="polite"></div>
</main>
<aside class="panel" id="panel" aria-label="Selected note" aria-live="polite"></aside>
<footer class="time">
  <button class="iconbtn" id="play" aria-label="Play the memory forward"></button>
  <div class="scrub"><canvas id="spark" aria-hidden="true"></canvas><input type="range" id="when" aria-label="Show the memory as it stood at this point"></div>
  <output id="whenout" for="when"></output>
</footer>
<div class="scrim" id="scrim"></div>
<script type="application/json" id="atlas-data">${data}</script>${brain ? `
<script type="application/octet-stream" id="brain-shell">${BRAIN_SHELL_B64}</script>` : ""}
<script>${VIEWER3D_JS}</script>
${hosted && !embed ? `<script>${IMPORT_JS}</script>` : ""}
${md ? `<script>${moodScript(md, { live: live && moodLive })}</script>` : ""}
<script>${VIEWER_JS}</script>${embed ? `
<script>(function () { var b = document.querySelector('.seg button[data-view="3d"]'); if (b && !b.hidden) b.click(); })();</script>` : ""}
</body>
</html>
`;
}

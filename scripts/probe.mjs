// Release check: build the full page, the widget and a live server from a fictional ledger, open each in Chrome at
// desktop and phone width, and fail on any script error or a canvas with nothing drawn.
//   PLAYWRIGHT_FROM=<dir with node_modules/playwright-core> node scripts/probe.mjs [--shots dir]
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const args = process.argv.slice(2), si = args.indexOf("--shots"), shots = si >= 0 ? args[si + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });
const from = process.env.PLAYWRIGHT_FROM ?? new URL("../", import.meta.url).pathname;
let chromium;
try { ({ chromium } = createRequire(`${from.replace(/\/?$/, "/")}node_modules/`)("playwright-core")); } catch { console.error("playwright-core not found; set PLAYWRIGHT_FROM"); process.exit(1); }
const BIN = new URL("../bin/memory-atlas.mjs", import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), "atlas-probe-"));
const subjects = [["garden", "soil seedlings water flowers"], ["sky", "telescope galaxy orbit nebula"], ["billing", "invoice customer renewal refund"], ["kernel", "compiler cache thread scheduler"]];
const rows = subjects.flatMap(([s, w], g) => Array.from({ length: 40 }, (_, i) => { const ws = w.split(" "); return { t: g * 40 + i + 1, cause: `${s} ${i % 7}`, effect: `${ws[i % 4]} ${ws[(i + 1) % 4]} checked`, note: `${ws.join(" ")} observation ${i}` }; }));
rows.push({ t: 161, cause: "billing", effect: "refund policy corrected", kind: "correction", withdrawn: ["30 days"], replacement: ["14 days"] }, { t: 162, cause: "billing", effect: "told the customer 30 days" });
const ledger = join(dir, "events.jsonl");
writeFileSync(ledger, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
const mood = `echo '{"DA":0.6,"ACh":0.9,"NE":0.7,"5HT":0.2,"phase":"act"}'`;
for (const [name, extra] of [["full.html", []], ["embed.html", ["--embed", "--mood-cmd", mood]], ["mood.html", ["--mood-cmd", mood]]]) {
  const r = spawnSync(process.execPath, [BIN, ledger, "--out", join(dir, name), "--title", "Fictional project", ...extra], { encoding: "utf8" });
  if (r.status) { console.error(r.stderr); process.exit(1); }
}
const server = spawn(process.execPath, [BIN, "serve", ledger, "--port", "0", "--mood-cmd", mood]);
const liveUrl = await new Promise((ok) => { let s = ""; server.stdout.on("data", (d) => { s += d; const m = s.match(/http:\/\/127\.0\.0\.1:\d+\//); if (m) ok(m[0]); }); });

const drawnShare = (page, png) => page.evaluate(async (b64) => {
  const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "image/png" }));
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext("2d"); g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, bmp.width, bmp.height).data, seen = new Map();
  for (let i = 0; i < d.length; i += 16) { const k = (d[i] >> 3) << 10 | (d[i + 1] >> 3) << 5 | (d[i + 2] >> 3); seen.set(k, (seen.get(k) ?? 0) + 1); }
  return 1 - Math.max(...seen.values()) / (d.length / 16);
}, png.toString("base64"));

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
let bad = 0;
for (const [name, url] of [["full", "file://" + join(dir, "full.html")], ["widget", "file://" + join(dir, "embed.html")], ["mood", "file://" + join(dir, "mood.html")], ["live", liveUrl]]) for (const [w, h] of [[1280, 800], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } }), errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  // record text drawn on the 2-D map that runs past the canvas edge (a label cut off mid-word at phone width)
  await page.addInitScript(() => {
    window.__clipped = [];
    const fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...rest) {
      const c = this.canvas;
      if (c && c.id === "cv" && String(text).length > 3) {
        const tw = this.measureText(text).width, dpr = this.getTransform().a || 1, cw = c.width / dpr;
        const left = this.textAlign === "center" ? x - tw / 2 : this.textAlign === "right" || this.textAlign === "end" ? x - tw : x;
        if (left < -1 || left + tw > cw + 1) window.__clipped.push(String(text).slice(0, 40) + " @" + Math.round(left) + ".." + Math.round(left + tw) + " of " + Math.round(cw));
      }
      return fill.call(this, text, x, y, ...rest);
    };
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(3500);
  let drawn = 0, note = "";
  try {
    const box = await page.locator("#cv3").boundingBox({ timeout: 4000 });
    if (!box || box.width < 40) throw new Error("the 3-D view is not shown");
    if (shots) await page.screenshot({ path: join(shots, `${name}-${w}.png`) });
    const only = await page.addStyleTag({ content: "body *{visibility:hidden !important} #cv3{visibility:visible !important}" });
    drawn = await drawnShare(page, await page.screenshot({ clip: box }));
    await only.evaluate((el) => el.remove());
    // the widget shows only the 3-D view; the full and live pages also have the map
    if (name !== "widget") { await page.click('button[data-view="map"]', { timeout: 4000 }); await page.waitForTimeout(1500); }
  } catch (e) { note = String(e).split("\n")[0].slice(0, 120); }
  const clipped = await page.evaluate(() => [...new Set(window.__clipped)]);
  if (clipped.length) note += (note ? "; " : "") + `${clipped.length} map labels cut at the edge (${clipped.slice(0, 3).join(" | ")})`;
  const gauges = await page.locator("#mood [role=meter]").count();
  const ok = !errors.length && !clipped.length && drawn > 0.002 && (name === "full" ? gauges === 0 : gauges === 4);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} at ${w}: script errors ${errors.length}${errors[0] ? " (" + errors[0] + ")" : ""}; 3-D drawn ${(drawn * 100).toFixed(1)}%; gauges ${gauges}${note ? "; " + note : ""}`);
  await page.close();
}
await browser.close(); server.kill();
process.exit(bad ? 1 : 0);

#!/usr/bin/env node
// memory-atlas: see an agent's memory as a 3-D brain. Everything runs on this machine; nothing is uploaded.
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createServer } from "node:http";
import { spawnSync, spawn } from "node:child_process";
import { atlasFromLedgers, parseLedger, renderAtlasHtml, normaliseMood } from "../src/index.js";

const HELP = `memory-atlas: see an agent's memory as a 3-D brain, in one offline HTML file.

  memory-atlas [ledger.jsonl ...] [--out memory-atlas.html] [--title NAME] [--embed] [--open]
  memory-atlas serve [ledger.jsonl ...] [--port 4747]      a live page on 127.0.0.1 that follows the ledger

  With no ledger named: ./.memory-pulse/events.jsonl, else $MEMORY_PULSE_LEDGER.
  --strict             refuse the build on a line that is not a ledger row (default: skip it and name it)
  --embed              the widget: the brain alone, for an iframe or <memory-atlas-widget>
  --mood-cmd "CMD"     a cognitive harness's levels, from any command that prints
                       {"DA":..,"ACh":..,"NE":..,"5HT":..} (or {"modulator":{...}}), e.g. --mood-cmd "rain state"
  --max-notes N        refuse more than N memories (default 5000)
  --open               open the page when it is written (macOS, Linux)
  --version            print the version`;

const argv = process.argv.slice(2);
const flag = (k, d = null) => { const i = argv.indexOf("--" + k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const has = (k) => { const i = argv.indexOf("--" + k); if (i < 0) return false; argv.splice(i, 1); return true; };
const fail = (m) => { process.stderr.write("memory-atlas: " + m + "\n"); process.exit(1); };
if (has("help") || has("h")) { console.log(HELP); process.exit(0); }
if (argv.includes("--version") || argv.includes("-v")) { console.log(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version); process.exit(0); }
const serve = argv[0] === "serve" ? argv.shift() : null;
const out = resolve(flag("out", "memory-atlas.html")), title = flag("title"), port = Number(flag("port", "4747"));
const moodCmd = flag("mood-cmd"), maxNotes = Number(flag("max-notes", "5000")), embed = has("embed"), open = has("open"), strict = has("strict");
const unknown = argv.find((a) => a.startsWith("--"));
if (unknown) fail(`unknown option ${unknown}\n\n${HELP}`);

let files = argv.map((f) => resolve(f));
if (!files.length) {
  // the project you are standing in first: an environment variable set for every shell should not override it
  const env = process.env.MEMORY_PULSE_LEDGER, local = resolve(".memory-pulse/events.jsonl");
  if (existsSync(local)) files = [local];
  else if (env && existsSync(env)) files = [env];
  else fail("No ledger found. Name one (memory-atlas path/to/events.jsonl), set MEMORY_PULSE_LEDGER, or run inside a project with .memory-pulse/events.jsonl.");
}
for (const f of files) if (!existsSync(f)) fail(`no such file: ${f}`);

function readMood() {
  if (!moodCmd) return null;
  const r = spawnSync("/bin/sh", ["-c", moodCmd], { encoding: "utf8", timeout: 15000 });
  if (r.status !== 0) throw new Error(`mood command exited ${r.status}: ${(r.stderr || "").trim().slice(0, 200)}`);
  let j;
  try { j = JSON.parse(r.stdout); } catch { throw new Error(`mood command did not print JSON: ${r.stdout.trim().slice(0, 120)}`); }
  return normaliseMood(j.modulator ?? j.modulators ?? j);
}
function build(previous = null) {
  const ledgers = files.map((f) => {
    const rows = parseLedger(readFileSync(f, "utf8"), basename(f), { strict });
    if (rows.skipped.length) process.stderr.write(`memory-atlas: ${basename(f)}: skipped ${rows.skipped.length} lines that are not ledger rows: ${rows.skipped.slice(0, 20).join(", ")}${rows.skipped.length > 20 ? ", ..." : ""} (--strict refuses instead)\n`);
    if (rows.skipped.length) for (const n of rows.skipped.slice(0, 5)) process.stderr.write(`  line ${n}: ${rows.reasons.get(n)}\n`);
    return { name: basename(f), rows };
  });
  return atlasFromLedgers(ledgers, { title: title ?? (files.length === 1 ? basename(resolve(files[0], "../..")) : "Memory"), maxNotes, previous });
}

if (!serve) {
  let atlas, mood;
  try { atlas = build(); mood = readMood(); } catch (e) { fail(e.message); }
  writeFileSync(out, renderAtlasHtml(atlas, { title: atlas.source.name, embed, mood }));
  const corr = atlas.notes.filter((n) => n.kind === "correction").length;
  console.log(`memory-atlas: ${atlas.notes.length} memories, ${atlas.topics.length} topics, ${corr} corrections, ${atlas.flags.length} rows still carrying a withdrawn value -> ${out}`);
  if (open) spawn(process.platform === "darwin" ? "open" : "xdg-open", [out], { stdio: "ignore", detached: true }).unref();
  process.exit(0);
}

// ---- serve: 127.0.0.1 only; refuses other Host headers (a page elsewhere cannot rebind its name to this port) and framing
let atlas, sig = "", mood = null, moodAt = 0;
const signature = () => files.map((f) => { const s = statSync(f); return s.size + ":" + s.mtimeMs; }).join("|");
const clients = new Set();
function refresh() {
  const s = signature();
  if (s === sig) return;
  // the map on screen is the previous one: earlier memories hold their places, new ones join beside their nearest
  try { atlas = build(atlas); sig = s; for (const c of clients) c.write(`event: update\ndata: ${JSON.stringify({ added: 1 })}\n\n`); }
  catch (e) { process.stderr.write("memory-atlas: " + e.message + " (kept the last good map)\n"); sig = s; }
}
try { refresh(); } catch (e) { fail(e.message); }
if (!atlas) fail("could not build the first map");
setInterval(refresh, 1000).unref?.();
const SECURE = { "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer", "cache-control": "no-store" };
const LOCAL = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
const server = createServer((req, res) => {
  if (!LOCAL.test(req.headers.host ?? "")) { res.writeHead(403, SECURE); return res.end("local only"); }
  if (req.method !== "GET") { res.writeHead(405, { ...SECURE, allow: "GET" }); return res.end(); }
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  if (path === "/") {
    let md = null;
    try { md = readMood(); } catch { md = null; }
    const html = renderAtlasHtml({ ...atlas, live: true }, { title: atlas.source.name, live: true, embed, mood: md, moodLive: !!moodCmd });
    res.writeHead(200, { ...SECURE, "content-type": "text/html; charset=utf-8", "content-security-policy": "frame-ancestors 'none'" });
    return res.end(html);
  }
  if (path === "/api/brain") { res.writeHead(200, { ...SECURE, "content-type": "application/json" }); return res.end(JSON.stringify({ ...atlas, live: true })); }
  if (path === "/api/mood") {
    if (!moodCmd) { res.writeHead(404, SECURE); return res.end(); }
    if (Date.now() - moodAt > 2000) { try { mood = readMood(); } catch { mood = null; } moodAt = Date.now(); }
    res.writeHead(mood ? 200 : 502, { ...SECURE, "content-type": "application/json" }); return res.end(JSON.stringify(mood ?? { error: "the mood command failed" }));
  }
  if (path === "/events") {
    res.writeHead(200, { ...SECURE, "content-type": "text/event-stream" }); res.write(": live\n\n");
    clients.add(res); req.on("close", () => clients.delete(res)); return;
  }
  res.writeHead(404, SECURE); res.end();
});
server.listen(port, "127.0.0.1", () => {
  console.log(`memory-atlas: ${atlas.notes.length} memories, live at http://127.0.0.1:${server.address().port}/ (Ctrl-C to stop)`);
  if (open) spawn(process.platform === "darwin" ? "open" : "xdg-open", [`http://127.0.0.1:${server.address().port}/`], { stdio: "ignore", detached: true }).unref();
});

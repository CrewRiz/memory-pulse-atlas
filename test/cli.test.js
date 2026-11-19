import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request } from "node:http";

const BIN = new URL("../bin/memory-atlas.mjs", import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), "atlas-cli-"));
const row = (t, w) => JSON.stringify({ t, cause: `${w} step ${t}`, effect: `${w} result ${t}`, note: `${w} notes about ${w} work` });
const ledger = join(dir, "events.jsonl");
writeFileSync(ledger, Array.from({ length: 24 }, (_, i) => row(i + 1, i % 2 ? "garden" : "telescope")).join("\n") + "\n");
const run = (args, opts = {}) => spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8", cwd: dir, env: { ...process.env, MEMORY_PULSE_LEDGER: "" }, ...opts });

test("cli: builds one offline page from a ledger and says what it drew", () => {
  const out = join(dir, "a.html");
  const r = run([ledger, "--out", out, "--title", "Garden and sky"]);
  assert.equal(r.status, 0, r.stderr);
  const html = readFileSync(out, "utf8");
  assert.match(html, /<title>Garden and sky atlas<\/title>/);
  assert.match(html, /default-src 'none'/);
  assert.match(r.stdout, /24 memories/);
});

test("cli: with no file named it uses the project's memory ledger, and says so when there is none", () => {
  mkdirSync(join(dir, ".memory-pulse"), { recursive: true });
  writeFileSync(join(dir, ".memory-pulse", "events.jsonl"), readFileSync(ledger));
  assert.equal(run(["--out", join(dir, "b.html")]).status, 0);
  const empty = mkdtempSync(join(tmpdir(), "atlas-empty-"));
  const r = run([], { cwd: empty });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /No ledger found/);
});

test("cli: a bad row is skipped and named, never dropped in silence; --strict refuses the build instead", () => {
  const bad = join(dir, "bad.jsonl");
  writeFileSync(bad, row(1, "x") + "\n" + JSON.stringify({ t: 2, cause: "only a cause" }) + "\nnot json\n" + row(4, "x") + "\n");
  const out = join(dir, "lenient.html");
  const r = run([bad, "--out", out]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /bad\.jsonl: skipped 2 lines that are not ledger rows: 2, 3/);
  assert.match(r.stdout, /2 memories/);
  const never = join(dir, "never.html");
  const s = run([bad, "--out", never, "--strict"]);
  assert.equal(s.status, 1);
  assert.match(s.stderr, /bad\.jsonl: line 2/);
  assert.throws(() => readFileSync(never));
});

test("cli: the project's own ledger comes before the one named in the environment", () => {
  const proj = mkdtempSync(join(tmpdir(), "atlas-proj-"));
  mkdirSync(join(proj, ".memory-pulse"));
  writeFileSync(join(proj, ".memory-pulse", "events.jsonl"), row(1, "local") + "\n" + row(2, "local") + "\n");
  const r = run(["--out", join(proj, "p.html")], { cwd: proj, env: { ...process.env, MEMORY_PULSE_LEDGER: ledger } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /2 memories/);
});

test("cli: --embed writes the widget page; --mood-cmd reads a harness's levels from any command that prints them", () => {
  const out = join(dir, "w.html");
  const cmd = `echo '{"name":"rain","modulator":{"DA":0.3,"ACh":1,"NE":0.6,"5HT":0.1,"phase":"act"}}'`;
  const r = run([ledger, "--out", out, "--embed", "--mood-cmd", cmd]);
  assert.equal(r.status, 0, r.stderr);
  const html = readFileSync(out, "utf8");
  assert.match(html, /<body class="embed">/);
  assert.match(html, /window\.AtlasMood = \{"DA":0\.3,"ACh":1,"NE":0\.6,"5HT":0\.1,"phase":"act"\}/);
  const fail = run([ledger, "--out", join(dir, "x.html"), "--mood-cmd", "echo not-json"]);
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /mood/);
});

const get = (port, path, headers = {}) => new Promise((ok, no) => {
  const q = request({ host: "127.0.0.1", port, path, headers }, (res) => { let b = ""; res.on("data", (d) => (b += d)); res.on("end", () => ok({ status: res.statusCode, headers: res.headers, body: b })); });
  q.on("error", no); q.end();
});

test("serve: local only, refuses other hosts and framing, and a row appended to the ledger reaches the page while every earlier memory keeps its place", async () => {
  const live = join(dir, "live.jsonl");
  writeFileSync(live, readFileSync(ledger));
  const p = spawn(process.execPath, [BIN, "serve", live, "--port", "0", "--mood-cmd", `echo '{"DA":0,"ACh":1,"NE":1,"5HT":0}'`], { cwd: dir });
  const port = await new Promise((ok, no) => { let s = ""; p.stdout.on("data", (d) => { s += d; const m = s.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (m) ok(+m[1]); }); p.on("exit", () => no(new Error("server exited: " + s))); setTimeout(() => no(new Error("no url printed")), 20000); });
  try {
    const page = await get(port, "/");
    assert.equal(page.status, 200);
    assert.match(page.headers["content-security-policy"], /frame-ancestors 'none'/);
    assert.equal(page.headers["x-frame-options"], "DENY");
    assert.match(page.body, /connect-src 'self'/);
    assert.equal((await get(port, "/", { host: "evil.example" })).status, 403);
    assert.equal(JSON.parse((await get(port, "/api/mood")).body).ACh, 1);
    const first = JSON.parse((await get(port, "/api/brain")).body), before = first.notes.length;
    appendFileSync(live, row(25, "garden") + "\n");
    let next = first;
    for (let i = 0; i < 40 && next.notes.length === before; i++) { await new Promise((r) => setTimeout(r, 250)); next = JSON.parse((await get(port, "/api/brain")).body); }
    assert.equal(next.notes.length, before + 1);
    const was = new Map(first.notes.map((n) => [n.src + "#" + n.id, n]));
    const moved = next.notes.filter((n) => { const p = was.get(n.src + "#" + n.id); return p && (p.x !== n.x || p.y !== n.y || p.brain.join() !== n.brain.join()); });
    assert.deepEqual(moved.map((n) => n.id), [], "earlier memories moved when the ledger grew");
  } finally { p.kill(); }
});

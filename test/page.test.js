// The rendered page: what a browser is given. Read as text here; scripts/probe.mjs runs it in Chrome.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { existsSync, readFileSync } from "node:fs";
import { renderAtlasHtml } from "../src/viewer/html.js";
import { atlasFromLedgers } from "../src/core/atlas.js";

const rows = (w) => Array.from({ length: 20 }, (_, i) => ({ t: i + 1, cause: `${w[0]} ${i}`, effect: `${w[i % 3]} ${w[(i + 1) % 3]}`, note: w.join(" ") }));
const A = atlasFromLedgers([{ name: "a.jsonl", rows: rows(["soil", "water", "seed"]) }, { name: "b.jsonl", rows: rows(["orbit", "comet", "lens"]) }], { title: "Test" });
const scripts = (html) => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => !/\btype="/.test(m[1])).map((m) => m[2]);
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");

test("page: a saved file can reach nothing on the network; a live page only its own server", () => {
  assert.match(renderAtlasHtml(A), /default-src 'none'/);
  assert.doesNotMatch(renderAtlasHtml(A), /connect-src/);
  assert.match(renderAtlasHtml(A, { live: true }), /connect-src 'self'/);
});

test("page: every script parses and reads no name that nothing defines", async () => {
  const { Linter } = await import("eslint");
  const globals = (await import("globals")).default;
  // AtlasImport is the import bundle's global; the viewer reads it only from the hosted page's import buttons
  const html = renderAtlasHtml(A, { mood: { DA: 0.2, ACh: 1, NE: 0.5, "5HT": 0.1 }, embed: true });
  const declared = {};
  for (const [i, code] of scripts(html).entries()) {
    new vm.Script(code, { filename: "s" + i + ".js" });
    const found = new Linter().verify(code, { languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: { ...globals.browser, __THREE_DEVTOOLS__: "readonly", Float16Array: "readonly", AtlasImport: "readonly", ...declared } }, rules: { "no-undef": "error" } });
    assert.deepEqual([...new Set(found.map((m) => m.message.slice(0, 60)))].slice(0, 8), [], "script " + i);
    for (const m of code.matchAll(/^(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/gm)) declared[m[1]] = "readonly";
  }
});

test("embed: the widget page is the brain alone, opens in 3-D, and carries no import tools", () => {
  const html = renderAtlasHtml(A, { embed: true });
  assert.match(html, /<body class="embed">/);
  assert.match(html, /body\.embed \.rail/);
  assert.doesNotMatch(html, /id="memory-files"/);
  assert.match(html, /data-view="3d"\][\s\S]{0,60}\.click\(\)/);
  assert.doesNotMatch(renderAtlasHtml(A), /<body class="embed">/);
});

test("mood: four gauges with the harness's values, and the 3-D view can read them; no harness, no gauges", () => {
  const html = renderAtlasHtml(A, { mood: { DA: -0.25, ACh: 0.9, NE: 0.4, "5HT": 0.05, phase: "act" } });
  for (const label of ["Dopamine", "Acetylcholine", "Norepinephrine", "Serotonin"]) assert.match(visible(html), new RegExp(label));
  assert.match(html, /window\.AtlasMood = \{"DA":-0\.25,"ACh":0\.9,"NE":0\.4,"5HT":0\.05,"phase":"act"\}/);
  assert.doesNotMatch(renderAtlasHtml(A), /id="mood"/);
  assert.throws(() => renderAtlasHtml(A, { mood: { DA: "high" } }), /mood\.DA/);
});

// The word list is the maintainers' own (one pattern per line) and is not part of the published source; a copy of the
// repository without it skips this check.
const NEVER_FILE = new URL("./never-say.private.txt", import.meta.url);
test("public language: no visible text and no script names the method", { skip: !existsSync(NEVER_FILE) && "no word list in this copy" }, async () => {
  const NEVER = new RegExp(readFileSync(NEVER_FILE, "utf8").split("\n").filter(Boolean).join("|"), "i");
  // three.js is a library with its own method names; the check covers our text and our scripts
  const { VIEWER3D_JS } = await import("../src/viewer/viewer3d.bundle.js");
  const html = renderAtlasHtml(A, { mood: { DA: 0, ACh: 1, NE: 1, "5HT": 0 }, embed: true, hosted: true }).replace(VIEWER3D_JS, "");
  const hit = html.match(NEVER);
  assert.equal(hit, null, "found " + hit?.[0] + " near " + JSON.stringify(html.slice(Math.max(0, hit?.index - 60), hit?.index + 60)));
});

test("the page carries the brain model once: the import code reads the copy already on the page", async () => {
  const { IMPORT_JS } = await import("../src/viewer/import.bundle.js");
  const { BRAIN_SHELL_B64 } = await import("../src/viewer/brain-shell.js");
  assert.ok(!IMPORT_JS.includes(BRAIN_SHELL_B64.slice(1000, 1200)), "the import bundle holds its own copy of the model");
  assert.ok(IMPORT_JS.length < 150_000, "import bundle " + IMPORT_JS.length + " characters");
  const html = renderAtlasHtml(A, { hosted: true });
  assert.equal(html.split(BRAIN_SHELL_B64.slice(5000, 5100)).length - 1, 1, "one copy of the model on a hosted page");
});

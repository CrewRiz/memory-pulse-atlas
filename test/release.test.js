// Release hygiene: what npm and GitHub will serve is what we meant to ship. Written 2026-11-19 before the first npm
// release, against the npm and Node docs read that day (Node 20 end of life 2026-04-30; trusted publishing and staged
// publishing need Node 22.14 or later).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");
const pkg = JSON.parse(read("package.json"));

test("release: engines name no Node line that is past its end of life", () => {
  const min = Number(/>=\s*(\d+)/.exec(pkg.engines?.node ?? "")?.[1]);
  assert.ok(min >= 22, `engines.node is ${pkg.engines?.node}; Node 20 reached end of life on 2026-04-30`);
});

test("release: the tarball holds the code, the licence and the notices, and nothing private or test-only", () => {
  const r = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const files = JSON.parse(r.stdout)[0].files.map((f) => f.path);
  for (const f of ["LICENSE", "README.md", "THIRD_PARTY_NOTICES.md", "package.json", "bin/memory-atlas.mjs", "src/index.js", "src/widget.js"]) assert.ok(files.includes(f), `missing ${f}`);
  for (const f of files) assert.doesNotMatch(f, /^(test|scripts|docs|\.github)\/|PROVENANCE|private|\.env/, `ships ${f}`);
  for (const target of [...Object.values(pkg.bin), ...Object.values(pkg.exports)]) assert.ok(files.includes(target.replace(/^\.\//, "")), `${target} is named but not shipped`);
});

test("release: the lockfile names this package and version", () => {
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[""].version, pkg.version);
});

test("release: the changelog has an entry for this version", () => {
  assert.match(read("CHANGELOG.md"), new RegExp(`^## \\[${pkg.version.replace(/\./g, "\\.")}\\]`, "m"));
});

test("release: the README's images load on npmjs.com, where docs/ is not shipped", () => {
  for (const [, src] of read("README.md").matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) assert.match(src, /^https:\/\//, `relative image ${src}`);
});

test("release: the package publishes publicly, from the repository its provenance will name", () => {
  assert.equal(pkg.publishConfig?.access, "public");
  assert.equal(pkg.repository?.url, "git+https://github.com/CrewRiz/memory-pulse-atlas.git");
});

const workflows = existsSync(join(root, ".github/workflows")) ? readdirSync(join(root, ".github/workflows")).filter((f) => /\.ya?ml$/.test(f)) : [];

test("ci: a test workflow and a release workflow exist", () => {
  assert.ok(workflows.includes("ci.yml"), "no ci.yml");
  assert.ok(workflows.includes("release.yml"), "no release.yml");
});

test("ci: every action is pinned to a full commit, every checkout drops its token, every workflow sets its permissions", () => {
  for (const f of workflows) {
    const y = read(`.github/workflows/${f}`);
    for (const [, ref] of y.matchAll(/uses:\s*([^\s#]+)/g)) assert.match(ref, /@[0-9a-f]{40}$/, `${f}: ${ref} is not pinned to a commit`);
    const checkouts = [...y.matchAll(/uses:\s*actions\/checkout@/g)].length;
    assert.equal([...y.matchAll(/persist-credentials:\s*false/g)].length, checkouts, `${f}: a checkout keeps its token`);
    assert.match(y, /^permissions:/m, `${f}: no top-level permissions`);
    assert.doesNotMatch(y, /pull_request_target/, `${f}: pull_request_target runs fork code with secrets`);
  }
});

test("ci: only the release job can mint an npm identity, and it stages for a human to approve", () => {
  const ci = read(".github/workflows/ci.yml"), rel = read(".github/workflows/release.yml");
  assert.doesNotMatch(ci, /id-token:\s*write/);
  assert.equal([...rel.matchAll(/id-token:\s*write/g)].length, 1);
  assert.match(rel, /npm stage publish/);
  assert.doesNotMatch(rel, /NODE_AUTH_TOKEN|NPM_TOKEN/, "a long-lived npm token in the release");
  assert.match(rel, /environment:\s*npm/);
});

test("ci: dependency updates wait a week before they are proposed", () => {
  const d = read(".github/dependabot.yml");
  for (const eco of ["github-actions", "npm"]) assert.match(d, new RegExp(`package-ecosystem:\\s*"?${eco}`));
  assert.match(d, /cooldown:/);
});

test("repo: security policy and contribution guide exist", () => {
  assert.match(read("SECURITY.md"), /private vulnerability report/i);
  assert.ok(existsSync(join(root, "CONTRIBUTING.md")));
});

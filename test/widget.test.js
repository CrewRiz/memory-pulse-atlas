import test from "node:test";
import assert from "node:assert/strict";
import { widgetFrame } from "../src/widget.js";

test("widget: an iframe that may run scripts but cannot reach its host page, the network origin or the top window", () => {
  const f = widgetFrame({ src: "atlas-embed.html", height: 420, title: "Project memory" });
  assert.equal(f.sandbox, "allow-scripts", "no allow-same-origin, no allow-top-navigation, no popups");
  assert.equal(f.loading, "lazy");
  assert.equal(f.title, "Project memory");
  assert.equal(f.style.height, "420px");
  assert.equal(f.referrerPolicy, "no-referrer");
});

test("widget: refuses a source that is not a page address", () => {
  assert.throws(() => widgetFrame({ src: "javascript:alert(1)" }), /src/);
  assert.throws(() => widgetFrame({}), /src/);
});

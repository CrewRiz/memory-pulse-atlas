/**
 * Atlas 3-D view (2026-09-26): the same memory, drawn in WebGL.
 *
 * Bundled with three.js into one inline script (scripts/build-atlas-3d.mjs) so the page stays a single offline
 * file. The 2-D viewer owns the state (selection, focus, time, growth, firing, signals); this module only draws
 * it and reports pointer events back, so every view agrees about what is selected and what is firing.
 *
 * Brain pages use stable interior positions from the cortex mesh, relaxed by recorded connections and local
 * spacing. Standalone maps retain their original topic coordinates. The shell has a fixed scale as memory grows.
 * Public-surface rules apply to every string shown (docs/PUBLIC_LANGUAGE.md).
 */
import * as THREE from "three";
import { createFrameBudget, fitDistance } from '../render-policy.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function supported() {
  try { const c = document.createElement("canvas"); return !!c.getContext("webgl2"); } catch (e) { return false; }
}

const NODE_VS = `
attribute vec3 aCol; attribute float aSize; attribute float aAlpha; attribute float aShape; attribute float aFire;
uniform float uScale; uniform float uMax;
varying vec3 vCol; varying float vAlpha; varying float vShape; varying float vFire;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // capped, or a note beside the camera becomes a blurred disc across the screen
  gl_PointSize = min(uMax, aSize * uScale * (1.0 + 0.9 * aFire) / max(0.05, -mv.z));
  vCol = aCol; vAlpha = aAlpha; vShape = aShape; vFire = aFire;
}`;
const NODE_FS = `
uniform float uHalo; uniform float uPart;
varying vec3 vCol; varying float vAlpha; varying float vShape; varying float vFire;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = vShape > 0.5 ? (abs(c.x) + abs(c.y)) * 0.72 : length(c);
  // two passes over the same points: crisp cores blended normally (1,400 overlapping cores added up to white),
  // then halos added as light, faint at rest and full when the note fires
  if (uPart < 0.5) {
    float core = smoothstep(0.17, 0.11, d);
    float a = core * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vCol * (0.78 + 0.5 * vFire), a);
  } else {
    // firing is an accent: in a dense region many neurons fire at once, and full halos summed into a fog
    float halo = exp(-d * d * (30.0 - 12.0 * vFire)) * (uHalo + 0.5 * vFire) * vAlpha;
    if (halo < 0.004) discard;
    gl_FragColor = vec4(vCol * (0.7 + 1.9 * vFire), halo);
  }
}`;
const LINE_VS = `
attribute vec4 aCol;
varying vec4 vCol;
void main() { vCol = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const LINE_FS = `
varying vec4 vCol;
void main() { if (vCol.a < 0.003) discard; gl_FragColor = vCol; }`;
const RIM_VS = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = (modelMatrix * vec4(position, 1.0)).xyz; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const RIM_FS = `
uniform vec3 uColor; uniform float uAlpha;
varying vec3 vN; varying vec3 vV;
void main() { float rim = pow(1.0 - abs(dot(vN, vV)), 3.2); gl_FragColor = vec4(uColor, rim * uAlpha); }`;

// the cortex: a membrane whose rim catches the folds, faint where it faces the camera so the neurons inside read.
// The model carries a fold depth (colour r: 0 on a crown, 1 on a groove floor) and ambient occlusion baked in Blender
// (colour g), so the folds are drawn from geometry, not a texture: crowns catch the rim and a soft key light, grooves
// and tucked-in places stay dark.
const SHELL_VS = `
attribute vec4 color;
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec2 vFold;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = (modelMatrix * vec4(position, 1.0)).xyz; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vFold = color.rg; gl_Position = projectionMatrix * mv; }`;
const SHELL_FS = `
uniform vec3 uColor; uniform vec3 uGlow; uniform float uAlpha; uniform float uFill; uniform float uCut; uniform float uKey;
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec2 vFold;
void main() {
  if (vP.z > uCut) discard;
  vec3 n = normalize(vN);
  float facing = abs(dot(n, vV)), f = 1.0 - facing;
  float crown = 1.0 - vFold.x, ao = vFold.y;
  float rim = pow(f, 2.0) * (0.35 + 0.65 * crown);
  // a wrapped key light from above and in front, in view space, gives the folds volume
  float key = clamp(dot(n, normalize(vec3(0.35, 0.8, 0.5))) * 0.5 + 0.5, 0.0, 1.0);
  float lit = (rim + uFill * f + uKey * key * crown * facing * 0.35) * mix(0.35, 1.0, ao);
  vec3 c = mix(uColor, uGlow, 0.35 * rim);
  gl_FragColor = vec4(c, lit * uAlpha);
}`;

const RECORDED = { rec: 1 };

/**
 * @param {{canvas:HTMLCanvasElement, overlay:HTMLElement, host:object, reducedMotion:boolean}} opts
 */
export function create({ canvas, overlay, host, reducedMotion }) {
  const { A, E, N } = host;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 60);
  const home = new THREE.Vector3(0, 0.3, 3.7);
  const budget = createFrameBudget(); let lastFrame = 0, initialFit = false, moodShell = 1;
  camera.position.copy(home);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.6, zoomSpeed: 0.8, panSpeed: 0.7, minDistance: 0.2, maxDistance: 9 });
  controls.autoRotate = !reducedMotion; controls.autoRotateSpeed = 0.35;
  controls.addEventListener("start", () => { controls.autoRotate = false; flight = null; });
  controls.addEventListener('change', () => host.kick());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.32, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- positions: the flat map's x and y (y flipped so up is up), the third axis as depth
  const P = new Float32Array(N * 3);
  A.notes.forEach((n, j) => { const p = n.brain || [n.x, -n.y, (n.z || 0) * 0.9]; P.set(p, 3 * j); });
  const pos = (j, out) => out.set(P[3 * j], P[3 * j + 1], P[3 * j + 2]);

  // ---- neurons
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(P, 3));
  const aCol = new Float32Array(N * 3), aSize = new Float32Array(N), aAlpha = new Float32Array(N), aShape = new Float32Array(N), aFire = new Float32Array(N);
  const attr = (name, arr, k) => { const a = new THREE.BufferAttribute(arr, k); a.setUsage(THREE.DynamicDrawUsage); nodeGeo.setAttribute(name, a); return a; };
  const colA = attr("aCol", aCol, 3), sizeA = attr("aSize", aSize, 1), alphaA = attr("aAlpha", aAlpha, 1), fireA = attr("aFire", aFire, 1);
  attr("aShape", aShape, 1);
  A.notes.forEach((n, j) => { aShape[j] = n.kind === "correction" ? 1 : 0; });
  const shared = { uScale: { value: 400 }, uMax: { value: 48 } };
  const nodeMat = new THREE.ShaderMaterial({ uniforms: { ...shared, uHalo: { value: 0.06 }, uPart: { value: 0 } }, vertexShader: NODE_VS, fragmentShader: NODE_FS, transparent: true, depthWrite: false });
  const haloMat = new THREE.ShaderMaterial({ uniforms: { ...shared, uHalo: nodeMat.uniforms.uHalo, uPart: { value: 1 } }, vertexShader: NODE_VS, fragmentShader: NODE_FS, transparent: true, depthWrite: false });
  const nodes = new THREE.Points(nodeGeo, nodeMat), halos = new THREE.Points(nodeGeo, haloMat);
  nodes.frustumCulled = halos.frustumCulled = false;
  halos.renderOrder = 1;
  scene.add(nodes); scene.add(halos);

  // ---- dendrites and fibres: every edge sampled once into segments, alpha updated per frame
  const cp = E.map((e) => {
    const a = new THREE.Vector3(), b = new THREE.Vector3(); pos(e.a, a); pos(e.b, b);
    const m = a.clone().add(b).multiplyScalar(0.5);
    if (e.kind === "across") { m.x *= 0.75; m.y *= 0.75; m.z *= 0.75; return m; }
    const d = b.clone().sub(a), side = new THREE.Vector3(-d.y, d.x, d.z * 0.3).normalize();
    return m.add(side.multiplyScalar(d.length() * (e.bend || 0)));
  });
  const SEG = { rec: 5, corr: 8, across: 14 };
  let vcount = 0; const range = E.map((e) => { const s = vcount, n = SEG[e.kind] || 5; vcount += n * 2; return [s, n]; });
  const LP = new Float32Array(vcount * 3), LC = new Float32Array(vcount * 4);
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const qpt = (k, t, out) => {
    const e = E[k]; pos(e.a, tmpA); pos(e.b, tmpB); const c = cp[k], u = 1 - t;
    return out.set(u * u * tmpA.x + 2 * u * t * c.x + t * t * tmpB.x, u * u * tmpA.y + 2 * u * t * c.y + t * t * tmpB.y, u * u * tmpA.z + 2 * u * t * c.z + t * t * tmpB.z);
  };
  const v = new THREE.Vector3();
  E.forEach((e, k) => { const [s, n] = range[k]; for (let i = 0; i < n; i++) { qpt(k, i / n, v); LP.set([v.x, v.y, v.z], 3 * (s + 2 * i)); qpt(k, (i + 1) / n, v); LP.set([v.x, v.y, v.z], 3 * (s + 2 * i + 1)); } });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(LP, 3));
  const lineCol = new THREE.BufferAttribute(LC, 4); lineCol.setUsage(THREE.DynamicDrawUsage); lineGeo.setAttribute("aCol", lineCol);
  const lineMat = new THREE.ShaderMaterial({ vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.frustumCulled = false;
  scene.add(lines);

  // ---- signals: a bright head and a short trail per signal
  const SMAX = 360 * 7;
  const SP = new Float32Array(SMAX * 3), SC = new Float32Array(SMAX * 3), SS = new Float32Array(SMAX), SA = new Float32Array(SMAX), SF = new Float32Array(SMAX), SSh = new Float32Array(SMAX);
  const sigGeo = new THREE.BufferGeometry();
  const sattr = (name, arr, k) => { const a = new THREE.BufferAttribute(arr, k); a.setUsage(THREE.DynamicDrawUsage); sigGeo.setAttribute(name, a); return a; };
  const sPos = sattr("position", SP, 3), sCol = sattr("aCol", SC, 3), sSize = sattr("aSize", SS, 1), sAlpha = sattr("aAlpha", SA, 1), sFire = sattr("aFire", SF, 1);
  sattr("aShape", SSh, 1);
  const sigMat = new THREE.ShaderMaterial({ uniforms: { ...shared, uHalo: { value: 0.3 }, uPart: { value: 1 } }, vertexShader: NODE_VS, fragmentShader: NODE_FS, transparent: true, depthWrite: false });
  const sigCoreMat = new THREE.ShaderMaterial({ uniforms: { ...shared, uHalo: { value: 0 }, uPart: { value: 0 } }, vertexShader: NODE_VS, fragmentShader: NODE_FS, transparent: true, depthWrite: false });
  const sigs = new THREE.Points(sigGeo, sigMat), sigCores = new THREE.Points(sigGeo, sigCoreMat);
  sigs.frustumCulled = sigCores.frustumCulled = false;
  sigs.renderOrder = 2; sigCores.renderOrder = 3;
  scene.add(sigs); scene.add(sigCores);

  // ---- lobes: a faint membrane per memory
  const lobes = (A.sources || []).map((s) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color() }, uAlpha: { value: 0.2 } }, vertexShader: RIM_VS, fragmentShader: RIM_FS, transparent: true, depthWrite: false, side: THREE.FrontSide }));
    m.position.set(s.lobe.x, -s.lobe.y, 0); m.scale.setScalar(s.lobe.r * 1.12);
    scene.add(m); return m;
  });

  // ---- the brain: a Blender-made cortex, cerebellum and stem (src/atlas/brain-shell.js), fitted around the memories
  let shell = null;
  const shellMat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uAlpha: { value: 0.0 }, uFill: { value: 0.12 }, uCut: { value: 1.2 }, uKey: { value: 0.6 } },
    vertexShader: SHELL_VS, fragmentShader: SHELL_FS, transparent: true, depthWrite: false, side: THREE.FrontSide });
  const shellEl = document.getElementById("brain-shell");
  if (shellEl && (A.sources || []).length) {
    try {
      const bin = Uint8Array.from(atob(shellEl.textContent.trim()), (c) => c.charCodeAt(0));
      new GLTFLoader().parse(bin.buffer, "", (gltf) => {
        shell = gltf.scene;
        // the model ships without normals (a sixth of its size); a model without baked folds reads as crowns everywhere
        shell.traverse((o) => {
          if (!o.isMesh) return;
          if (!o.geometry.getAttribute("normal")) o.geometry.computeVertexNormals();
          if (!o.geometry.getAttribute("color")) o.geometry.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(o.geometry.getAttribute("position").count * 4).fill(1).map((v, i) => (i % 4 === 0 ? 0 : v)), 4));
          o.material = shellMat; o.renderOrder = -1;
        });
        // fit: the brain's bounds around the notes' bounds, uniform scale, centred
        if (A.brainLayout) { shell.scale.setScalar(2); scene.add(shell); return; }
        const nb = new THREE.Box3().setFromBufferAttribute(nodeGeo.getAttribute("position"));
        const bb = new THREE.Box3().setFromObject(shell), ns = nb.getSize(new THREE.Vector3()), bs = bb.getSize(new THREE.Vector3());
        const k = Math.max((ns.x * 1.08) / bs.x, (ns.y * 1.2) / bs.y);
        shell.scale.setScalar(k);
        const bc = bb.getCenter(new THREE.Vector3()).multiplyScalar(k), nc = nb.getCenter(new THREE.Vector3());
        shell.position.set(nc.x - bc.x, nc.y - bc.y + ns.y * 0.04, nc.z - bc.z);
        scene.add(shell);
      }, () => { shell = null; });
    } catch (e) { shell = null; }
  }

  // ---- labels: HTML over the canvas, placed by projection each frame
  overlay.textContent = "";
  const mk = (cls, html) => { const d = document.createElement("div"); d.className = "l3 " + cls; d.innerHTML = html; overlay.appendChild(d); return d; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lobeLabels = (A.sources || []).map((s) => mk("lobe", "<b>" + esc(s.name) + "</b><span>" + s.notes.toLocaleString("en-US") + (s.kind === "claude-memory" || s.kind === "vault" ? " notes" : " rows") + "</span>"));
  const topicCentre = A.topics.map(() => [0, 0, 0, 0]);
  A.notes.forEach((n, j) => { const t = topicCentre[n.topic]; if (t) { t[0] += P[3 * j]; t[1] += P[3 * j + 1]; t[2] += P[3 * j + 2]; t[3]++; } });
  const topTopics = A.topics.map((t, k) => k).filter((k) => topicCentre[k][3] >= 4).sort((a, b) => topicCentre[b][3] - topicCentre[a][3]).slice(0, 64);
  const topicLabels = topTopics.map((k) => mk("topic", esc(A.topics[k].name.join(", "))));
  const regions=A.knowledge?.regions||[], regionColors=new Map(regions.map(r=>[r.id,new THREE.Color(r.color)]));
  const regionLabels=regions.map(r=>{const el=mk('region',esc(r.label)+'<span>'+r.members.length+' memories</span>');el.dataset.region=r.id;el.style.setProperty('--region-color',r.color);el.setAttribute('role','button');el.tabIndex=0;el.title=r.terms.join(', ')+'. Click to explore neighborhoods.';el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});return el;});
  const focusLabel = mk("focus", "");
  const boxes = [], lastXY = [0, 0];
  const claim = (x, y, w, h) => {
    const b = [x - w / 2, y - h / 2, w, h];
    for (const o of boxes) if (b[0] < o[0] + o[2] && b[0] + b[2] > o[0] && b[1] < o[1] + o[3] && b[1] + b[3] > o[1]) return false;
    boxes.push(b); return true;
  };
  const place = (el, x, y, z) => {
    v.set(x, y, z).project(camera);
    if (v.z > 1 || v.z < -1) { el.style.opacity = "0"; return null; }
    lastXY[0] = (v.x * 0.5 + 0.5) * W; lastXY[1] = (-v.y * 0.5 + 0.5) * H;
    el.style.transform = "translate(" + lastXY[0].toFixed(1) + "px," + lastXY[1].toFixed(1) + "px) translate(-50%,-50%)";
    return v.z;
  };

  // ---- pointer: hover and click, a drag is the orbit
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), listening = new AbortController(), opt = { signal: listening.signal };
  let down = null, W = 1, H = 1, flight = null, lastState = null, lastHoverAt = 0;
  const pick = (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.params.Points.threshold = 0.012 * camera.position.distanceTo(controls.target);
    const hits = ray.intersectObject(nodes, false).filter((h) => aAlpha[h.index] > 0.2);
    hits.sort((a, b) => a.distanceToRay - b.distanceToRay || a.distance - b.distance);
    return hits.length ? hits[0].index : -1;
  };
  canvas.addEventListener("pointerdown", (ev) => { down = [ev.clientX, ev.clientY]; }, opt);
  canvas.addEventListener("pointermove", (ev) => {
    if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 4) { host.hover(-1); return; }
    const now = performance.now(); if (now - lastHoverAt < 30) return; lastHoverAt = now;
    const r = canvas.getBoundingClientRect(), j = pick(ev);
    host.hover(j, ev.clientX - r.left, ev.clientY - r.top);
    canvas.style.cursor = j >= 0 ? "pointer" : "grab";
  }, opt);
  canvas.addEventListener("pointerup", (ev) => {
    if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) < 5) host.select(pick(ev));
    down = null;
  }, opt);
  canvas.addEventListener("pointerleave", () => host.hover(-1), opt);
  canvas.addEventListener("dblclick", (ev) => { const j = pick(ev); if (j >= 0) { host.select(j); api.flyTo(j, 0.45); } }, opt);

  const colorOf = (hex) => new THREE.Color().setStyle(hex);
  let C3 = null, darkNow = null;
  function applyTheme(st) {
    if (darkNow === st.dark && C3) return;
    darkNow = st.dark;
    C3 = { ink: colorOf(st.C.ink), red: colorOf(st.C.red), blue: colorOf(st.C.blue), paper: colorOf(st.C.paper) };
    scene.background = C3.paper;
    const blend = st.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    [haloMat, sigMat, lineMat].forEach((m) => { m.blending = blend; m.needsUpdate = true; });
    [nodeMat, sigCoreMat].forEach((m) => { m.blending = THREE.NormalBlending; m.needsUpdate = true; });
    nodeMat.uniforms.uHalo.value = st.dark ? 0.022 : 0.02;
    // membranes blend normally: an additive shell the size of a lobe is what washed the first render to white
    lobes.forEach((m) => { m.material.blending = THREE.NormalBlending; m.material.uniforms.uColor.value.copy(C3.ink); m.material.needsUpdate = true; });
    shellMat.uniforms.uColor.value.copy(C3.ink); shellMat.uniforms.uGlow.value.copy(C3.blue);
    shellMat.uniforms.uKey.value = st.dark ? 0.6 : 0.9;
    shellMat.blending = st.dark ? THREE.AdditiveBlending : THREE.NormalBlending; shellMat.needsUpdate = true;
    bloom.strength = st.dark ? 0.42 : 0;
  }

  function resize() {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1) * budget.scale;
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    composer.setPixelRatio(Math.min(dpr, 1.5)); composer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    home.set(0, 0.12, fitDistance([2.1, 1.65, 1.85], camera.aspect));
    if (!initialFit) { camera.position.copy(home); initialFit = true; }
    // a note's core is ~0.012 world units wide; uScale turns world size at depth into pixels
    shared.uScale.value = (H * dpr * 0.5) / Math.tan((camera.fov * Math.PI) / 360) * 0.034;
    shared.uMax.value = 44 * dpr;
  }

  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function render(now) {
    const oldScale = budget.scale; if(lastFrame) budget.sample(now-lastFrame); lastFrame=now;
    if(oldScale!==budget.scale)resize();
    const st = host.state();
    applyTheme(st);
    // an optional cognitive harness (window.AtlasMood, src/viewer/mood.js) tints the scene with its own levels
    const md = window.AtlasMood;
    if (md) {
      const c = (v, lo) => Math.max(lo, Math.min(1, Number(v) || 0));
      const da = c(md.DA, -1), ach = c(md.ACh, 0), ne = c(md.NE, 0), ht = c(md["5HT"], 0);
      bloom.strength = st.dark ? 0.42 * (0.6 + 0.8 * ne) : 0;
      nodeMat.uniforms.uHalo.value = (st.dark ? 0.022 : 0.02) * (1 + 1.5 * Math.max(0, da));
      controls.autoRotateSpeed = 0.35 * (0.6 + 0.8 * ne) * (1 - 0.4 * ht);
      moodShell = 1.15 - 0.4 * ach;
    }
    // flight to a selected note
    if (flight) {
      const p = Math.min(1, (now - flight.t0) / flight.dur), e = 1 - Math.pow(1 - p, 3);
      controls.target.lerpVectors(flight.fromT, flight.toT, e); camera.position.lerpVectors(flight.fromC, flight.toC, e);
      if (p >= 1) flight = null;
    }
    controls.update();
    const fs = st.fs, f = st.hover >= 0 ? st.hover : st.sel, el = st.el;
    // neurons
    for (let j = 0; j < N; j++) {
      const n = A.notes[j];
      if (!host.shown(j) || !host.isBorn(j, el)) { aAlpha[j] = 0; aSize[j] = 0; aFire[j] = 0; continue; }
      const fl = st.layers.corrections ? host.flagged(j) : null, isRed = n.kind === "correction" || !!fl;
      let a = (0.35 + 0.65 * host.sal(j)); if (fs && !fs[j]) a *= 0.12;
      const born = st.growth ? Math.max(0, 1 - (el - st.growth.born[j]) / 520) : 0;
      aFire[j] = Math.max(host.fire[j], born) * (fs && !fs[j] ? 0.2 : 1);
      aAlpha[j] = a;
      aSize[j] = (0.72 + 0.18 * Math.sqrt(Math.min(24, host.degree[j])) + Math.abs(Math.sin(j * 37.17)) * 0.22) * (j === st.sel ? 1.8 : j === st.hover ? 1.5 : st.matches && st.matches[j] ? 1.4 : 1) * (isRed && n.kind === "correction" ? 0.9 : 1);
      const added = st.exploration?.diff?.added.includes(j);
      const c = isRed ? C3.red : j === st.sel || (st.matches && st.matches[j]) || added ? C3.blue : regionColors.get(n.region) || C3.ink;
      aCol[3 * j] = c.r; aCol[3 * j + 1] = c.g; aCol[3 * j + 2] = c.b;
    }
    colA.needsUpdate = sizeA.needsUpdate = alphaA.needsUpdate = fireA.needsUpdate = true;
    // edges
    const dark = st.dark;
    const rest = { rec: dark ? 0.055 : 0.13, corr: dark ? 0.18 : 0.32, across: dark ? 0.025 : 0.07 };
    for (let k = 0; k < E.length; k++) {
      const e = E[k], [s, n] = range[k];
      let alpha = 0, c = e.kind === "corr" ? C3.red : e.kind === "across" ? C3.blue : regionColors.get(A.notes[e.a]?.region) || C3.ink;
      const on = (e.kind === "rec" ? st.layers.recorded : e.kind === "corr" ? st.layers.corrections : st.layers.related);
      let g = 0;
      if (on && host.shown(e.a) && host.shown(e.b) && host.isBorn(e.a, el) && host.isBorn(e.b, el)) {
        g = host.edgeGrow(e, el);
        const hot = st.exploration?.edgeSet ? !!st.exploration.edgeSet[e.a + ':' + e.b + ':' + e.type] : fs ? !!(fs[e.a] && fs[e.b] && (f < 0 || e.a === f || e.b === f)) : false;
        alpha = hot ? (e.kind === "rec" ? 0.75 : 0.9) : fs ? rest[e.kind] * 0.2 : rest[e.kind];
      }
      // a growing dendrite extends from the note that was there first
      const fromB = st.growth && g < 1 && st.growth.born[e.b] < st.growth.born[e.a];
      for (let i = 0; i < n; i++) {
        const t = fromB ? (n - i - 0.5) / n : (i + 0.5) / n, visible = t <= g ? alpha : 0;
        for (let q = 0; q < 2; q++) { const o = 4 * (s + 2 * i + q); LC[o] = c.r; LC[o + 1] = c.g; LC[o + 2] = c.b; LC[o + 3] = visible; }
      }
    }
    lineCol.needsUpdate = true;
    // signals
    let m = 0;
    for (const sg of host.signals) {
      if (m + 7 > SMAX) break;
      const k = sg.e.k; if (k == null || !E[k]) continue;
      const p = Math.min(1, (now - sg.t0) / sg.dur), fwd = sg.from === sg.e.a, c = sg.e.kind === "corr" ? C3.red : sg.e.kind === "across" ? C3.blue : regionColors.get(A.notes[sg.e.a]?.region) || C3.ink;
      const dim = fs && !(fs[sg.e.a] && fs[sg.e.b]) ? 0.25 : 1;
      for (let q = 0; q < 7; q++) {
        const tt = Math.max(0, p - q * 0.03); qpt(k, fwd ? tt : 1 - tt, tmp);
        SP[3 * m] = tmp.x; SP[3 * m + 1] = tmp.y; SP[3 * m + 2] = tmp.z;
        SC[3 * m] = c.r; SC[3 * m + 1] = c.g; SC[3 * m + 2] = c.b;
        SS[m] = q ? 0.8 - q * 0.09 : 1.15; SA[m] = (q ? 0.5 - q * 0.06 : 1) * sg.s * dim; SF[m] = q ? 0.4 : 1; m++;
      }
    }
    sigGeo.setDrawRange(0, m);
    sPos.needsUpdate = sCol.needsUpdate = sSize.needsUpdate = sAlpha.needsUpdate = sFire.needsUpdate = true;
    // lobes grow in with their memory
    // the cortex fades in once the first memory has grown; the per-memory membranes step back behind it
    if (shell) {
      shellMat.uniforms.uAlpha.value = (dark ? 0.2 : 0.16) * (st.exploration?.shell ?? 1) * moodShell;
      shellMat.uniforms.uCut.value = st.exploration?.cut ?? 1.2;
    }
    lobes.forEach((mesh, si) => {
      const t = st.growth ? Math.max(0, Math.min(1, (el - st.growth.lobeAt[si]) / 450)) : 1;
      mesh.visible = !A.brainLayout && t > 0; mesh.material.uniforms.uAlpha.value = (dark ? 0.09 : 0.08) * t * (shell ? 0.45 : 1);
    });
    // labels: placed greedily (lobes, then topics by size) and skipped where they would cover one already placed
    boxes.length = 0;
    (A.sources || []).forEach((s, si) => {
      if(regions.length){lobeLabels[si].style.opacity="0";return;}
      const center = s.brainCenter || [s.lobe.x, -s.lobe.y + s.lobe.r * 1.2, 0];
      const t = st.growth ? el >= st.growth.lobeAt[si] : true, z = t ? place(lobeLabels[si], ...center) : null;
      lobeLabels[si].style.opacity = z == null || !claim(lastXY[0], lastXY[1], 12 * (s.name.length + 2) * 0.62, 38) ? "0" : "1";
    });
    regions.forEach((r,i)=>{
      const el=regionLabels[i],visible=r.members.filter(j=>host.shown(j)&&host.isBorn(j,st.el)).length;
      const z=visible ? place(el,...r.center) : null;
      const active=st.exploration?.region===r.id && st.exploration?.mode==='region';
      const show=z!=null && (!fs || active) && claim(lastXY[0],lastXY[1],Math.min(235,r.label.length*6.5+20),40);
      el.style.opacity=show?'0.92':'0';el.style.pointerEvents=show?'auto':'none';el.tabIndex=show?0:-1;
      el.querySelector('span').textContent=visible+' memories';
    });
    topTopics.forEach((k, i) => {
      const t = topicCentre[k], el2 = topicLabels[i];
      if(regions.length){el2.style.opacity='0';return;}
      const zoom = camera.position.distanceTo(controls.target), limit = zoom > 3.2 ? 0 : zoom > 2 ? 12 : 48;
      if (i >= limit) { el2.style.opacity = '0'; return; }
      if (st.growth || fs) { el2.style.opacity = fs ? "0.25" : "0"; if (!fs) return; }
      const z = place(el2, t[0] / t[3], t[1] / t[3], t[2] / t[3]);
      if (z == null || !claim(lastXY[0], lastXY[1], el2.textContent.length * 7.2 + 8, 20)) { el2.style.opacity = "0"; return; }
      if (!fs) el2.style.opacity = String(Math.max(0.35, Math.min(0.95, 1.6 - camera.position.distanceTo(tmp2.set(t[0] / t[3], t[1] / t[3], t[2] / t[3])) / 3)));
    });
    if (f >= 0 && host.shown(f)) { focusLabel.textContent = A.notes[f].title.length > 70 ? A.notes[f].title.slice(0, 69) + "…" : A.notes[f].title; const z = place(focusLabel, P[3 * f], P[3 * f + 1], P[3 * f + 2]); focusLabel.style.opacity = z == null ? "0" : "1"; }
    else focusLabel.style.opacity = "0";
    if (dark) composer.render(); else renderer.render(scene, camera);
    lastState = st;
    return controls.autoRotate || !!flight;
  }

  const api = {
    render, resize,
    focusGroup(ids) {
      if(!ids.length)return;
      const box = new THREE.Box3(); ids.forEach(j => box.expandByPoint(pos(j,new THREE.Vector3())));
      const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const d = Math.max(0.7, fitDistance(size.toArray(), camera.aspect)), direction = camera.position.clone().sub(controls.target).normalize();
      controls.autoRotate=false;
      flight={t0:performance.now(),dur:reducedMotion?1:650,fromT:controls.target.clone(),toT:center,fromC:camera.position.clone(),toC:center.clone().add(direction.multiplyScalar(d))};
    },
    edgeLen(e) { pos(e.a, tmpA); pos(e.b, tmpB); return tmpA.distanceTo(tmpB) * 420; },
    flyTo(j, dist) {
      if (j < 0) return;
      pos(j, tmp);
      const dir = camera.position.clone().sub(controls.target).normalize(), d = dist || Math.min(1.1, camera.position.distanceTo(controls.target));
      const toT = tmp.clone(), toC = tmp.clone().add(dir.multiplyScalar(d));
      controls.autoRotate = false;
      if (reducedMotion) { controls.target.copy(toT); camera.position.copy(toC); return; }
      flight = { t0: performance.now(), dur: 750, fromT: controls.target.clone(), toT, fromC: camera.position.clone(), toC };
    },
    zoom(f) { const d = camera.position.clone().sub(controls.target); camera.position.copy(controls.target).add(d.multiplyScalar(1 / f)); },
    reset() { flight = { t0: performance.now(), dur: reducedMotion ? 1 : 700, fromT: controls.target.clone(), toT: new THREE.Vector3(), fromC: camera.position.clone(), toC: home.clone() }; },
    setAutoRotate(on) { controls.autoRotate = !!on && !reducedMotion; },
    getView() { return { p: camera.position.toArray(), t: controls.target.toArray(), auto: controls.autoRotate }; },
    setView(vw) { if (!vw) return; camera.position.fromArray(vw.p); controls.target.fromArray(vw.t); controls.autoRotate = !!vw.auto && !reducedMotion; controls.update(); },
    dispose() {
      listening.abort(); controls.dispose(); composer.dispose && composer.dispose();
      [nodeGeo, lineGeo, sigGeo].forEach((g) => g.dispose()); [nodeMat, haloMat, lineMat, sigMat, sigCoreMat].forEach((m) => m.dispose());
      lobes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); scene.remove(m); });
      if (shell) { shell.traverse((o) => { if (o.isMesh) o.geometry.dispose(); }); scene.remove(shell); } shellMat.dispose();
      overlay.textContent = ""; renderer.dispose();
    },
  };
  resize();
  return api;
}

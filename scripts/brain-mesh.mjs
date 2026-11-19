// Brain model geometry (2026-11-18): one cortex hemisphere (mirrored across the midline when built), a folded
// cerebellum and a tapering stem, each with a per-vertex fold depth ("cavity", 0 on a crown, 1 on a groove floor) that
// the 3-D view shades with instead of a texture. Deterministic: the same arrays on every run.
//
// Axes are Blender's: X front(+) to back(-), Y left(+)/right(-), Z up. The brain is 1.0 long.
// Cortex folds are cut along the integer contours of a smooth noise field: contour lines of smooth noise are
// meandering bands of near-constant width, which is what gyri look like from outside. Cerebellum folds are parallel
// bands around its lateral axis. Fold depth is smoothed over the mesh so no edge jumps from a crown to a floor.
//
//   node src/atlas/assets/brain-mesh.mjs [--out brain-mesh.json]

// ---- icosphere ------------------------------------------------------------------------------------------------------
function icosphere(n) {
  const t = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const norm = (p) => { const l = Math.hypot(...p); return p.map((c) => c / l); };
  v = v.map(norm);
  for (let s = 0; s < n; s++) {
    const cache = new Map(), nf = [];
    const mid = (a, b) => { const k = a < b ? a * 1e6 + b : b * 1e6 + a; let i = cache.get(k); if (i === undefined) { v.push(norm(v[a].map((c, j) => (c + v[b][j]) / 2))); i = v.length - 1; cache.set(k, i); } return i; };
    for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    f = nf;
  }
  return { v, f };
}

// ---- improved Perlin noise (Ken Perlin 2002), seeded ------------------------------------------------------------------
function perlin(seed) {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = 255; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  const perm = [...p, ...p];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + t * (b - a);
  const grad = (h, x, y, z) => { const u = h < 8 ? x : y, w = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -w : w); };
  return (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z), A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(lerp(lerp(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u), lerp(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u), lerp(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
  };
}
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- mesh helpers -------------------------------------------------------------------------------------------------------
function normals(pts, faces) {
  const nrm = pts.map(() => [0, 0, 0]);
  for (const [a, b, c] of faces) {
    const [ax, ay, az] = pts[a], [bx, by, bz] = pts[b], [cx, cy, cz] = pts[c];
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    for (const k of [a, b, c]) for (let i = 0; i < 3; i++) nrm[k][i] += n[i];
  }
  return nrm.map((n) => { const l = Math.hypot(...n) || 1; return n.map((c) => c / l); });
}
function neighbours(count, faces) {
  const nb = Array.from({ length: count }, () => new Set());
  for (const [a, b, c] of faces) { nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
  return nb.map((s) => [...s]);
}
// a scalar field averaged with its neighbours: grooves keep their place and lose their hard edges
function relaxField(values, nb, passes, keep = 0.5) {
  let cur = values.slice();
  for (let p = 0; p < passes; p++) cur = cur.map((v, i) => keep * v + (1 - keep) * nb[i].reduce((s, j) => s + cur[j], 0) / nb[i].length);
  return cur;
}
const r5 = (n) => Math.round(n * 1e5) / 1e5 || 0;
const r3 = (n) => Math.round(Math.max(0, Math.min(1, n)) * 1e3) / 1e3;
const pack = (name, pts, faces, cavity, extra = {}) => ({
  name, vertices: pts.flatMap((p) => p.map(r5)), faces: faces.flat(), cavity: cavity.map(r3), ...extra,
});

// ---- cortex: one hemisphere ---------------------------------------------------------------------------------------------
function cortex({ sub, seed }) {
  const noise = perlin(seed);
  const fbm = (x, y, z) => noise(x, y, z) + 0.45 * noise(2.03 * x + 17, 2.03 * y + 3, 2.03 * z + 9);
  const { v: sphere, f: faces } = icosphere(sub);
  const CY = 0.225, HX = 0.5, HY = 0.21, HZ = 0.3;
  const base = sphere.map(([ux, uy, uz]) => {
    let x = ux * HX, z = uz * HZ;
    // the medial half is pushed to a nearly flat wall just off the midline, so the hemispheres meet across a fissure
    let y = uy >= 0 ? CY + uy * HY : CY - HY * Math.pow(-uy, 0.3);
    y = Math.max(y, 0.012);
    if (z < 0) z *= 0.72;                                     // flatter underside
    const front = smooth(0.1, 0.5, x);                        // frontal lobe narrows
    y = CY + (y - CY) * (1 - 0.22 * front); z *= 1 - 0.12 * front;
    const back = smooth(-0.3, -0.5, x);                       // occipital pole tapers
    z *= 1 - 0.18 * back; y = CY + (y - CY) * (1 - 0.15 * back);
    const tx = (x - 0.08) / 0.2, tz = (z + 0.12) / 0.1;      // temporal lobe: low and forward on the lateral side
    const temporal = Math.exp(-(tx * tx + tz * tz)) * smooth(CY, CY + 0.1, y);
    z -= 0.07 * temporal; y += 0.025 * temporal;
    return [x, y, z];
  });
  const N0 = normals(base, faces), nb = neighbours(base.length, faces);
  const FREQ = 3.4, AMP = 3.6, DEPTH = 0.026;
  const raw = base.map(([x, y, z]) => {
    const n = fbm(x * FREQ, y * FREQ, z * FREQ) * AMP;
    return Math.pow(1 - Math.abs(Math.sin(Math.PI * n)), 2.4);   // 1 in a sulcus, 0 on a gyrus crown
  });
  // smoothing lowers the floors; rescale so the deepest few percent reach the floor again
  const relaxed = relaxField(raw, nb, 2, 0.55), top = relaxed.slice().sort((p, q) => p - q)[Math.floor(relaxed.length * 0.95)];
  const groove = relaxed.map((g) => Math.min(1, g / top));
  // the lateral (Sylvian) fissure rises from the front of the temporal lobe toward the back
  const sylvian = base.map(([x, y, z]) => {
    const sy = -0.02 + (0.12 - x) * 0.25, sd = Math.abs(z - sy);
    return Math.exp(-(sd * sd) / 0.0004) * smooth(0.25, 0.05, x) * smooth(-0.3, -0.1, x) * smooth(CY, CY + 0.12, y);
  });
  const cavity = groove.map((g, i) => Math.min(1, g * (0.35 + 0.65 * smooth(0.05, CY, base[i][1])) + sylvian[i]));
  const pts = base.map((p, i) => {
    const d = -DEPTH * cavity[i] - 0.03 * sylvian[i];
    return [p[0] + N0[i][0] * d, Math.max(0.008, p[1] + N0[i][1] * d), p[2] + N0[i][2] * d];
  });
  return pack("Cortex", pts, faces, cavity, { mirror: "y" });
}

// ---- cerebellum: folia as parallel bands around its lateral axis ---------------------------------------------------------
function cerebellum({ sub }) {
  const { v: sphere, f: faces } = icosphere(sub);
  const C = [-0.33, 0, -0.2], R = [0.155, 0.29, 0.105];
  const base = sphere.map(([ux, uy, uz]) => {
    // flatter on top where it sits under the cortex, a notch at the midline
    const top = uz > 0 ? 0.82 : 1;
    const notch = 1 - 0.12 * Math.exp(-(uy * uy) / 0.02) * smooth(-0.2, 0.6, -ux);
    return [C[0] + ux * R[0] * notch, C[1] + uy * R[1], C[2] + uz * R[2] * top];
  });
  const N0 = normals(base, faces), nb = neighbours(base.length, faces);
  const raw = base.map(([x, , z]) => {
    const th = Math.atan2((z - C[2]) / R[2], (x - C[0]) / R[0]);
    return Math.pow(1 - Math.abs(Math.sin(th * 9)), 2);
  });
  const relaxed = relaxField(raw, nb, 1, 0.6), top = relaxed.slice().sort((p, q) => p - q)[Math.floor(relaxed.length * 0.97)];
  const cavity = relaxed.map((g) => Math.min(1, g / top));
  const pts = base.map((p, i) => p.map((c, k) => c - N0[i][k] * 0.011 * cavity[i]));
  return pack("Cerebellum", pts, faces, cavity);
}

// ---- stem: rings from inside the brain down and back, tapering ------------------------------------------------------------
function stem({ rings = 20, ringSize = 28 } = {}) {
  const T = [-0.12, 0, -0.1], B = [-0.19, 0, -0.44], r0 = 0.07, r1 = 0.045;
  const ax = B.map((c, k) => c - T[k]), L = Math.hypot(...ax), a = ax.map((c) => c / L);
  const u = [0, 1, 0], w = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]];
  const pts = [], cavity = [], faces = [];
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1), c = T.map((v, k) => v + ax[k] * t), r = r0 + (r1 - r0) * t * t * (3 - 2 * t);
    for (let j = 0; j < ringSize; j++) {
      const ph = (2 * Math.PI * j) / ringSize;
      pts.push(c.map((v, k) => v + r * (Math.cos(ph) * u[k] + Math.sin(ph) * w[k])));
      cavity.push(0.08 + 0.12 * Math.pow(Math.abs(Math.sin(ph)), 8));   // two shallow lengthwise grooves at the front and back
    }
  }
  for (let i = 0; i + 1 < rings; i++) for (let j = 0; j < ringSize; j++) {
    const a0 = i * ringSize + j, a1 = i * ringSize + (j + 1) % ringSize, b0 = a0 + ringSize, b1 = a1 + ringSize;
    faces.push([a0, b0, a1], [a1, b0, b1]);
  }
  pts.push(B.slice()); cavity.push(0.1);                                  // bottom cap
  const cap = pts.length - 1, last = (rings - 1) * ringSize;
  for (let j = 0; j < ringSize; j++) faces.push([last + j, cap, last + (j + 1) % ringSize]);
  return pack("Stem", pts, faces, cavity, { rings, ringSize });
}

export function brainMesh({ sub = 5, cerebellumSub = 4, seed = 1337 } = {}) {
  return { v: 1, axes: "x front, y left, z up; length 1.0", parts: [cortex({ sub, seed }), cerebellum({ sub: cerebellumSub }), stem()] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFileSync } = await import("node:fs");
  const i = process.argv.indexOf("--out"), out = i >= 0 ? process.argv[i + 1] : "brain-mesh.json";
  const m = brainMesh();
  writeFileSync(out, JSON.stringify(m));
  console.log(JSON.stringify({ out, parts: m.parts.map((p) => ({ name: p.name, vertices: p.vertices.length / 3, triangles: p.faces.length / 3 })) }));
}

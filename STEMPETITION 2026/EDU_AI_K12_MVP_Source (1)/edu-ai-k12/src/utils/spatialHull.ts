import { ConvexHull } from "three/addons/math/ConvexHull.js";
import { V, mean, same, normal, type Item } from "./construction";
const eps = 1e-7;
export const unique = (pts: V[]) =>
  pts.filter((p, i) => !pts.slice(0, i).some((q) => same(p, q)));
export function outline(pts: V[]) {
  const v = unique(pts),
    a = v[0],
    b = v[1];
  if (!b) throw Error("Chưa đủ điểm.");
  const u = b.clone().sub(a).normalize(),
    c = v.find((p) => u.clone().cross(p.clone().sub(a)).length() > eps);
  if (!c) throw Error("Các điểm thẳng hàng.");
  const n = u.clone().cross(c.clone().sub(a)).normalize(),
    w = n.clone().cross(u);
  if (v.some((p) => Math.abs(n.dot(p.clone().sub(a))) > eps))
    throw Error("Các điểm không đồng phẳng.");
  const sorted = [...v].sort(
    (p, q) => u.dot(p) - u.dot(q) || w.dot(p) - w.dot(q),
  );
  function chain(list: V[]) {
    const h: V[] = [];
    for (const p of list) {
      while (
        h.length >= 2 &&
        normal([h[h.length - 2], h[h.length - 1], p]).dot(n) <= eps
      )
        h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  }
  return [...chain(sorted), ...chain(sorted.reverse())];
}
export function hull(pts: V[]) {
  const v = unique(pts);
  if (v.length < 4) throw Error("Cần ít nhất bốn điểm.");
  try {
    outline(v);
    throw Error("Đồng phẳng.");
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "Các điểm không đồng phẳng.")
      throw Error("Không tạo được khối từ các điểm này.");
  }
  const h = new ConvexHull().setFromPoints(v),
    groups: { n: V; d: number; v: V[] }[] = [];
  for (const f of h.faces) {
    const a = f.edge.head().point;
    let g = groups.find(
      (g) => g.n.dot(f.normal) > 1 - eps && Math.abs(g.d - f.constant) < eps,
    );
    if (!g) {
      g = { n: f.normal, d: f.constant, v: [] };
      groups.push(g);
    }
    g.v.push(a, f.edge.next.head().point, f.edge.prev.head().point);
  }
  return groups.map((g) => outline(g.v));
}
export function planes(faces: V[][]) {
  const c = mean(unique(faces.flat()));
  return faces.map((f) => {
    const n = normal(f).normalize();
    if (n.dot(c.clone().sub(f[0])) > 0) n.negate();
    return { n, d: n.dot(f[0]) };
  });
}
function clip(poly: V[], n: V, d: number) {
  const out: V[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length],
      s = n.dot(a) - d,
      t = n.dot(b) - d;
    if (s <= eps) out.push(a);
    if (s * t < 0 && Math.abs(s) > eps && Math.abs(t) > eps)
      out.push(a.clone().lerp(b, s / (s - t)));
  });
  return unique(out);
}
// Subtract each convex cell from the outward side of each boundary polygon.
export function unionFaces(cells: V[][][]) {
  const bounds = cells.map(planes);
  return cells.flatMap((cell, i) =>
    cell.flatMap((face, j) => {
      let pieces = [face];
      const outward = bounds[i][j].n;
      bounds.forEach((bs, k) => {
        if (k === i) return;
        pieces = pieces.flatMap((poly) => {
          const outside: V[][] = [];
          let inside = poly;
          for (const { n, d } of bs) {
            if (inside.length < 3) break;
            const ds = inside.map((p) => p.dot(n) - d);
            if (ds.every((x) => Math.abs(x) < eps)) {
              if (n.dot(outward) > eps && k > i) return [...outside, inside];
              continue;
            }
            if (ds.every((x) => x >= -eps)) return [...outside, inside];
            if (ds.some((x) => x > eps)) {
              const piece = clip(inside, n.clone().negate(), -d);
              if (piece.length >= 3) outside.push(piece);
            }
            inside = clip(inside, n, d);
          }
          return outside;
        });
      });
      return pieces.map((p) =>
        normal(p).dot(outward) < 0 ? [...p].reverse() : p,
      );
    }),
  );
}

export function massProperties(faces: V[][]) {
  let volume = 0;
  const c = new V();
  for (const face of faces)
    for (let j = 1; j + 1 < face.length; j++) {
      const [a, b, d] = [face[0], face[j], face[j + 1]],
        w = a.dot(b.clone().cross(d)) / 6;
      volume += w;
      c.addScaledVector(a.clone().add(b).add(d), w / 4);
    }
  if (Math.abs(volume) < 1e-8) throw Error("Khối không có thể tích.");
  return { volume: Math.abs(volume), center: c.divideScalar(volume) };
}

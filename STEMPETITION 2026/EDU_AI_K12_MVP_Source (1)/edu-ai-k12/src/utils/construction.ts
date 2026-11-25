import { Vector3 as V } from "three";
import type { SolidPreset } from "./mathGeometry";
export { V };
export type Kind = "point" | "line" | "face" | "solid";
export interface Item {
  id: string;
  kind: Kind;
  vertices: V[];
  color: string;
  label?: string;
  facets?: V[][];
  volume?: number;
  center?: V;
  area?: number;
  curved?: boolean;
  radius?: number;
}
export const EPS = 1e-7;
export const same = (a: V, b: V) => a.distanceTo(b) < EPS;
export const mean = (v: V[]) =>
  v.reduce((s, p) => s.add(p), new V()).divideScalar(v.length);
export function normal(v: V[]) {
  return v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));
}
export function triangles(f: V[]) {
  return f.slice(2).map((p, i) => [f[0], f[i + 1], p]);
}
export function measure(o: Item) {
  if (o.kind === "face")
    return (
      o.area ??
      triangles(o.vertices).reduce((s, t) => s + normal(t).length() / 2, 0)
    );
  if (o.volume !== undefined) return o.volume;
  const c = mean(o.vertices);
  return o
    .facets!.flatMap(triangles)
    .reduce((s, t) => s + Math.abs(normal(t).dot(c.clone().sub(t[0]))) / 6, 0);
}
export function center(o: Item) {
  if (o.center) return o.center;
  const c = mean(o.vertices);
  if (o.kind === "line" || o.kind === "point") return c;
  const result = new V();
  let total = 0;
  for (const t of (o.facets ?? [o.vertices]).flatMap(triangles)) {
    const w =
      o.kind === "solid"
        ? Math.abs(normal(t).dot(c.clone().sub(t[0])))
        : normal(t).length();
    result.addScaledVector(mean(o.kind === "solid" ? [...t, c] : t), w);
    total += w;
  }
  return total ? result.divideScalar(total) : c;
}
export const make = (
  kind: Kind,
  vertices: V[],
  color: string,
  extra: Partial<Item> = {},
): Item => ({ kind, vertices, color, id: crypto.randomUUID(), ...extra });
export function initial(p: SolidPreset) {
  const coords = new Map(p.points.map((a) => [a.id, new V(a.x, a.y, a.z)]));
  const facets = p.faces.map((f) => f.map((id) => coords.get(id)!));
  const vertices = [...new Set(facets.flat())];
  const items: Item[] = [],
    r = p.round;
  for (const a of p.points) {
    if (
      r &&
      !(r.radius
        ? ["P0", "P265"].includes(a.id) ||
          same(coords.get(a.id)!, new V(2, 2, 0))
        : ["P1", "P1′", "S"].includes(a.id))
    )
      continue;
    items.push(
      make("point", [coords.get(a.id)!], "#38bdf8", { label: a.label }),
    );
  }
  if (r)
    items.push(
      make("point", [new V(0, r.radius ?? 0, 0)], "#38bdf8", { label: "O" }),
    );
  for (const e of p.segments) {
    if (!r)
      items.push(
        make("line", [coords.get(e.fromId)!, coords.get(e.toId)!], "#ffffff"),
      );
  }
  facets.forEach((v, i) => {
    if (!r || (!r.radius && v.length > 4))
      items.push(
        make(
          "face",
          v,
          "#38bdf8",
          r
            ? {
                label: i ? "Đáy trên" : "Đáy dưới",
                area: Math.PI * (i ? r.top! : r.bottom!) ** 2,
              }
            : {},
        ),
      );
  });
  const o = make("solid", vertices, "#38bdf8", {
    facets,
    label:
      p.id === "math-pyramid"
        ? "S.ABCD"
        : p.id === "math-tetrahedron"
          ? "A.BCD"
          : p.id === "math-prism"
            ? "ABC.A′B′C′"
            : p.id === "math-cuboid"
              ? "ABCD.A′B′C′D′"
              : !r &&
                  p.faces[0].length >= 3 &&
                  p.id !== "math-octa" &&
                  p.id !== "math-icosa" &&
                  p.id !== "math-dodeca"
                ? p.points.at(-1)?.id === "S"
                  ? "S." + p.faces[0].join("")
                  : p.faces[0].join("") + "." + p.faces[1].join("")
                : p.name,
  });
  if (r) {
    o.curved = true;
    o.radius = r.radius;
    const R = r.bottom ?? 0,
      t = r.top ?? 0,
      h = r.height ?? 0;
    o.volume = r.radius
      ? (4 * Math.PI * r.radius ** 3) / 3
      : (Math.PI * h * (R * R + R * t + t * t)) / 3;
    o.center = new V(
      0,
      r.radius ??
        (h * (R * R + 2 * R * t + 3 * t * t)) / (4 * (R * R + R * t + t * t)),
      0,
    );
  }
  items.push(o);
  return items;
}
export function validate(v: V[]) {
  if (v.some((a, i) => v.slice(0, i).some((b) => same(a, b))))
    throw Error("Các điểm đã chọn trùng nhau.");
  if (v.length >= 3 && normal(v).length() < EPS)
    throw Error("3 điểm đã chọn không hợp lệ vì thẳng hàng.");
  if (
    v.length === 4 &&
    Math.abs(normal(v).normalize().dot(v[3].clone().sub(v[0]))) < EPS
  )
    throw Error("4 điểm đồng phẳng, không tạo được hình khối.");
}
export function intersectPoint(a: Item, b: Item): V {
  if (a.kind === "face") return intersectLinePlane(b, a);
  if (b.kind === "face") return intersectLinePlane(a, b);
  const [p, q] = a.vertices,
    [r, s] = b.vertices,
    u = q.clone().sub(p),
    v = s.clone().sub(r),
    w = r.clone().sub(p),
    n = u.clone().cross(v);
  if (n.lengthSq() < EPS ** 2 || Math.abs(w.dot(n.clone().normalize())) > EPS)
    throw Error("Hai đường không có giao điểm duy nhất.");
  return p.clone().addScaledVector(u, w.cross(v).dot(n) / n.lengthSq());
}
function intersectLinePlane(l: Item, f: Item) {
  if (l.kind !== "line") throw Error("Hãy chọn ít nhất một đường thẳng.");
  const [a, b] = l.vertices,
    u = b.clone().sub(a),
    n = normal(f.vertices).normalize(),
    d = n.dot(u);
  if (Math.abs(d) < EPS)
    throw Error("Đường thẳng và mặt phẳng không có giao điểm duy nhất.");
  return a.clone().addScaledVector(u, n.dot(f.vertices[0].clone().sub(a)) / d);
}
export function planeLine(a: Item, b: Item) {
  const n = normal(a.vertices).normalize(),
    m = normal(b.vertices).normalize(),
    u = n.clone().cross(m);
  if (u.lengthSq() < EPS ** 2)
    throw Error("Hai mặt phẳng song song hoặc trùng nhau.");
  const x = m
    .clone()
    .cross(u)
    .multiplyScalar(n.dot(a.vertices[0]))
    .add(u.clone().cross(n).multiplyScalar(m.dot(b.vertices[0])))
    .divideScalar(u.lengthSq());
  u.normalize();
  const hits: V[] = [];
  for (const [first, second] of [
    [a, b],
    [b, a],
  ])
    first.vertices.forEach((p, i) => {
      const q = first.vertices[(i + 1) % first.vertices.length];
      try {
        const h = intersectLinePlane(make("line", [p, q], ""), second);
        if (!hits.some((v) => same(v, h))) hits.push(h);
      } catch {
        /* parallel edge */
      }
    });
  hits.sort((p, q) => p.dot(u) - q.dot(u));
  const ends =
    hits.length >= 2
      ? [hits[0], hits.at(-1)!]
      : [x.clone().addScaledVector(u, -2), x.clone().addScaledVector(u, 2)];
  if (ends.some((p) => p.length() > 100) || ends[0].distanceTo(ends[1]) > 100)
    throw Error("Giao tuyến vượt giới hạn 100 đơn vị.");
  return ends;
}
export function section(s: Item, f: Item) {
  const n = normal(f.vertices).normalize(),
    hits: V[] = [];
  if (s.radius && s.center) {
    const distance = n.dot(s.center.clone().sub(f.vertices[0])),
      rr = s.radius ** 2 - distance ** 2;
    if (rr <= EPS) throw Error("Mặt phẳng không cắt khối cầu thành hình tròn.");
    const c = s.center.clone().addScaledVector(n, -distance),
      u = f.vertices[1].clone().sub(f.vertices[0]).normalize(),
      v = n.clone().cross(u);
    return Array.from({ length: 48 }, (_, i) => {
      const a = (2 * Math.PI * i) / 48;
      return c
        .clone()
        .addScaledVector(u, Math.sqrt(rr) * Math.cos(a))
        .addScaledVector(v, Math.sqrt(rr) * Math.sin(a));
    });
  }
  function add(p: V) {
    if (!hits.some((q) => same(p, q))) hits.push(p);
  }
  for (const face of s.facets!)
    face.forEach((a, i) => {
      const b = face[(i + 1) % face.length],
        d = n.dot(a.clone().sub(f.vertices[0])),
        e = n.dot(b.clone().sub(f.vertices[0]));
      if (Math.abs(d) < EPS) add(a);
      if (d * e < 0) add(a.clone().lerp(b, d / (d - e)));
    });
  if (hits.length < 3)
    throw Error("Mặt phẳng không cắt khối thành một thiết diện có diện tích.");
  const c = mean(hits),
    u = hits[0].clone().sub(c).normalize(),
    v = n.clone().cross(u);
  const angle = (p: V) =>
    Math.atan2(v.dot(p.clone().sub(c)), u.dot(p.clone().sub(c)));
  const poly = hits.sort((a, b) => angle(a) - angle(b));
  if (triangles(poly).every((t) => normal(t).length() < EPS))
    throw Error("Thiết diện suy biến.");
  return poly;
}

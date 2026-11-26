import { Eye, EyeOff, RotateCcw, Palette } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { V, same, type Item } from "../../utils/construction";
type P = { x: number; y: number; z: number };
const cross = (x: number, y: number, u: number, v: number) => x * v - y * u;
function obscured(a: P, b: P, f: P[]) {
  const p = f[0],
    q = f[1],
    r = f[2],
    det = cross(q.x - p.x, q.y - p.y, r.x - p.x, r.y - p.y);
  if (Math.abs(det) < 1e-7) return null;
  let lo = 0,
    hi = 1;
  function clip(s: number, t: number) {
    if (s < 0 && t < 0) {
      hi = -1;
      return;
    }
    if (s < 0) lo = Math.max(lo, s / (s - t));
    else if (t < 0) hi = Math.min(hi, s / (s - t));
  }
  for (let i = 0; i < f.length && lo < hi; i++) {
    const u = f[i],
      v = f[(i + 1) % f.length],
      side = (h: P) =>
        Math.sign(det) * cross(v.x - u.x, v.y - u.y, h.x - u.x, h.y - u.y);
    clip(side(a), side(b));
  }
  const depth = (h: P) =>
    p.z +
    ((q.z - p.z) * cross(h.x - p.x, h.y - p.y, r.x - p.x, r.y - p.y) +
      (r.z - p.z) * cross(q.x - p.x, q.y - p.y, h.x - p.x, h.y - p.y)) /
      det -
    h.z -
    1e-6;
  clip(depth(a), depth(b));
  return hi - lo > 1e-6 ? [lo, hi] : null;
}
export function GeometryStage({
  items,
  skin,
  selected,
  pick,
  recolor,
}: {
  items: Item[];
  skin: Item | null;
  selected: string;
  recolor: (color: string) => void;
  pick: (i?: Item) => void;
}) {
  const home = [0.74, 0.43, 52],
    [view, setView] = useState(home),
    [labels, setLabels] = useState(true),
    [faces, setFaces] = useState(true);
  const svg = useRef<SVGSVGElement>(null),
    start = useRef<{
      x: number;
      y: number;
      a: number;
      b: number;
      moved: boolean;
    } | null>(null);
  useEffect(() => {
    const el = svg.current!;
    function wheel(e: WheelEvent) {
      e.preventDefault();
      setView(([a, b, z]) => [
        a,
        b,
        Math.min(3000, Math.max(4, z * Math.exp(-e.deltaY * 0.001))),
      ]);
    }
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  const scene = useMemo(() => {
    const [a, b, z] = view,
      eye = new V(
        Math.sin(a) * Math.cos(b),
        Math.sin(b),
        Math.cos(a) * Math.cos(b),
      ),
      right = new V(Math.cos(a), 0, -Math.sin(a)),
      up = eye.clone().cross(right);
    const project = (v: V): P => ({
      x: 300 + right.dot(v) * z,
      y: 215 - (up.dot(v) - 1.5 * up.y) * z,
      z: eye.dot(v),
    });
    const drawn = items
      .filter((i) => i.kind === "face")
      .map((i) => ({ id: i.id, color: i.color, v: i.vertices.map(project) }));
    if (skin)
      for (const f of skin.facets!)
        if (f.length <= 4)
          drawn.push({ id: "", color: skin.color, v: f.map(project) });
    drawn.sort((a, b) => meanDepth(a.v) - meanDepth(b.v));
    const covers = items
      .filter((i) => i.kind === "solid")
      .flatMap((i) => i.facets!.map((f) => f.map(project)));
    const lines = items
      .filter((i) => i.kind === "line")
      .map((item) => {
        const [a, b] = item.vertices.map(project),
          ranges = covers
            .map((f) => obscured(a, b, f))
            .filter((v): v is number[] => !!v)
            .sort((a, b) => a[0] - b[0]);
        const merged: number[][] = [];
        for (const r of ranges) {
          const prev = merged.at(-1);
          if (prev && r[0] <= prev[1] + 1e-6) prev[1] = Math.max(prev[1], r[1]);
          else merged.push(r);
        }
        const spans: { s: number; t: number; hidden: boolean }[] = [];
        let t = 0;
        for (const [s, e] of merged) {
          if (s > t) spans.push({ s: t, t: s, hidden: false });
          spans.push({ s, t: e, hidden: true });
          t = e;
        }
        if (t < 1) spans.push({ s: t, t: 1, hidden: false });
        return { item, a, b, spans };
      });
    return {
      project,
      drawn,
      lines,
      points: items
        .filter((i) => i.kind === "point")
        .map((i) => ({ i, p: project(i.vertices[0]) }))
        .sort((a, b) => a.p.z - b.p.z),
      right,
      up,
    };
  }, [items, skin, view]);
  const active = items.find((i) => i.id === selected);
  function on(i: Item) {
    if (!active) return false;
    if (active === i) return true;
    if (i.kind === "point")
      return active.vertices.some((p) => same(p, i.vertices[0]));
    if (i.kind === "line" && active.kind === "face")
      return active.vertices.some((a, j) => {
        const b = active.vertices[(j + 1) % active.vertices.length];
        return i.vertices.every((p) => same(p, a) || same(p, b));
      });
    return false;
  }
  const hue = (color: string, chosen: boolean, property: string) =>
    chosen
      ? {
          animation: "geometry-hue 12s linear infinite",
          [property]: "currentColor",
        }
      : { [property]: color };
  return (
    <div
      onDragStart={(e) => e.preventDefault()}
      className="select-none relative rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 overflow-hidden"
    >
      <style>
        {
          "@keyframes geometry-hue{0%,100%{color:#ff668a}17%{color:#ffbb45}34%{color:#99e85b}50%{color:#35ded5}67%{color:#679aff}84%{color:#de77ff}}"
        }
      </style>
      <svg
        ref={svg}
        viewBox="0 0 600 430"
        aria-label="Mô hình hình học tương tác"
        className="w-full h-[clamp(300px,52vh,550px)] touch-none cursor-grab"
        onPointerDown={(e) => {
          start.current = {
            x: e.clientX,
            y: e.clientY,
            a: view[0],
            b: view[1],
            moved: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const x = e.clientX - s.x,
            y = e.clientY - s.y;
          if (Math.hypot(x, y) > 3) s.moved = true;
          if (s.moved)
            setView([
              s.a - x * 0.01,
              Math.max(-1.57, Math.min(1.57, s.b + y * 0.01)),
              view[2],
            ]);
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
        onPointerUp={(e) => {
          if (start.current && !start.current.moved) {
            const id = document
              .elementFromPoint(e.clientX, e.clientY)
              ?.closest("[data-object]")
              ?.getAttribute("data-object");
            pick(items.find((i) => i.id === id));
          }
          start.current = null;
        }}
      >
        <g pointerEvents="none" stroke="#526184" opacity=".48">
          {Array.from({ length: 25 }, (_, i) => i - 12)
            .flatMap((k) => [
              [new V(k, 0, -12), new V(k, 0, 12)],
              [new V(-12, 0, k), new V(12, 0, k)],
            ])
            .map(([u, v], i) => {
              const a = scene.project(u),
                b = scene.project(v);
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
        </g>
        {faces &&
          scene.drawn.map((f, j) => (
            <polygon
              key={f.id || j}
              data-object={f.id}
              points={f.v.map((p) => p.x + "," + p.y).join(" ")}
              fillOpacity={0.18}
              stroke={f.id ? "none" : "#52a6ca"}
              strokeOpacity={0.12}
              style={hue(f.color, !!f.id && f.id === selected, "fill")}
            />
          ))}
        {scene.lines.map(({ item, a, b, spans }) => (
          <g
            key={item.id}
            data-object={item.id}
            style={hue(item.color, on(item), "stroke")}
          >
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="transparent"
              strokeWidth={10}
            />
            {spans.map(({ s, t, hidden }, i) => (
              <line
                key={i}
                x1={a.x + (b.x - a.x) * s}
                y1={a.y + (b.y - a.y) * s}
                x2={a.x + (b.x - a.x) * t}
                y2={a.y + (b.y - a.y) * t}
                strokeWidth={2}
                strokeDasharray={hidden ? "5 4" : undefined}
              />
            ))}
          </g>
        ))}
        {scene.points.map(({ i, p }) => (
          <g key={i.id} data-object={i.id} style={hue(i.color, on(i), "fill")}>
            <circle cx={p.x} cy={p.y} r={5} />
            <circle cx={p.x} cy={p.y} r={9} fill="transparent" />
            {labels && (
              <g pointerEvents="none">
                <rect
                  x={p.x + 5}
                  y={p.y - 21}
                  width={Math.max(18, i.label!.length * 8 + 8)}
                  height={17}
                  rx={5}
                  fill={on(i) ? "currentColor" : "#303848"}
                />
                <text x={p.x + 9} y={p.y - 9} fontSize={12} fill="white">
                  {i.label}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <svg
        viewBox="-42 -42 84 84"
        className="absolute right-2 top-2 w-20 rounded-xl bg-slate-900/80"
        aria-label="Định hướng XYZ"
      >
        {[0, 1, 2].flatMap((axis) =>
          [-1, 1].map((sign) => {
            const n = new V().setComponent(axis, sign),
              depth = scene.right.clone().cross(scene.up).dot(n);
            if (depth <= 0.001) return null;
            const verts = [
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([u, v]) =>
              n
                .clone()
                .setComponent((axis + 1) % 3, u)
                .setComponent((axis + 2) % 3, v),
            );
            return (
              <polygon
                key={axis}
                points={verts
                  .map((p) =>
                    [10 * scene.right.dot(p), -10 * scene.up.dot(p)].join(","),
                  )
                  .join(" ")}
                fill={["#593843", "#254c45", "#304962"][axis]}
                stroke="#a4b9ce"
                strokeWidth={0.8}
                className="cursor-pointer"
                onClick={() =>
                  setView([
                    axis === 0
                      ? (sign * Math.PI) / 2
                      : axis === 2 && sign < 0
                        ? Math.PI
                        : 0,
                    axis === 1 ? (sign * Math.PI) / 2 : 0,
                    view[2],
                  ])
                }
              />
            );
          }),
        )}
        {["X", "Y", "Z"].map((k, j) => {
          const x = scene.right.getComponent(j) * 32,
            y = -scene.up.getComponent(j) * 32,
            c = ["#ff8997", "#8ae89e", "#7dcfff"][j];
          return (
            <g
              key={k}
              role="button"
              tabIndex={0}
              aria-label={"Nhìn theo trục " + k}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  setView([
                    [Math.PI / 2, 0, 0][j],
                    [0, Math.PI / 2, 0][j],
                    view[2],
                  ]);
              }}
              onClick={() =>
                setView([
                  [Math.PI / 2, 0, 0][j],
                  [0, Math.PI / 2, 0][j],
                  view[2],
                ])
              }
              className="cursor-pointer"
            >
              <line x2={x} y2={y} stroke={c} strokeWidth={2} />
              <text
                x={x}
                y={y}
                fill={c}
                style={{
                  paintOrder: "stroke",
                  stroke: "#101827",
                  strokeWidth: 2,
                }}
                textAnchor="middle"
                fontSize={12}
              >
                {k}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center gap-2 text-xs text-white [&_button]:flex [&_button]:items-center [&_button]:gap-1 [&_button]:rounded-xl [&_button]:border [&_button]:border-slate-600 [&_button]:bg-slate-900/90 [&_button]:px-3 [&_button]:py-2">
        <button onClick={() => setLabels(!labels)}>
          {labels ? <Eye size={15} /> : <EyeOff size={15} />}{" "}
          {labels ? "Ẩn" : "Hiện"} nhãn
        </button>
        <button onClick={() => setFaces(!faces)}>
          {faces ? "Ẩn" : "Hiện"} mặt
        </button>
        {active && (
          <label className="relative flex items-center gap-1 rounded-xl border border-slate-600 bg-slate-900/90 p-2 cursor-pointer">
            <Palette size={15} />
            Màu
            <input
              aria-label="Màu đối tượng đang chọn"
              type="color"
              value={active.color}
              onChange={(e) => recolor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        )}
        <button className="ml-auto" onClick={() => setView(home)}>
          <RotateCcw size={15} className="text-amber-400" />
          Đặt lại góc nhìn
        </button>
      </div>
    </div>
  );
}
function meanDepth(v: P[]) {
  return v.reduce((s, p) => s + p.z, 0) / v.length;
}

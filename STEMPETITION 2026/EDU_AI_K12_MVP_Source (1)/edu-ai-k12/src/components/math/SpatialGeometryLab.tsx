import {
  outline,
  hull,
  unique,
  unionFaces,
  planes,
  massProperties,
} from "../../utils/spatialHull";
import { useState, useEffect, useMemo } from "react";
import { Plus, Shapes, X, Ruler } from "lucide-react";
import { MATH_SOLIDS, type SolidPreset } from "../../utils/mathGeometry";
import {
  V,
  type Item,
  type Kind,
  make,
  mean,
  same,
  validate,
  initial,
  center,
  measure,
  intersectPoint,
  planeLine,
  section,
} from "../../utils/construction";
import { GeometryStage } from "./GeometryStage";
import { KatexFormula } from "../common/KatexFormula";

const modes = [
  [
    "Thêm điểm trên đoạn thẳng",
    "Thêm trọng tâm mặt phẳng",
    "Thêm trọng tâm hình khối",
  ],
  ["Tạo đường thẳng", "Tạo mặt phẳng", "Tạo hình khối"],
  [
    "Tìm giao điểm của 2 đối tượng",
    "Tìm giao tuyến giữa 2 đối tượng",
    "Tìm thiết diện giữa 2 đối tượng",
  ],
];
const types: Record<Kind, string> = {
  point: "Điểm",
  line: "Đường thẳng",
  face: "Mặt phẳng",
  solid: "Hình khối",
};
const field =
  "min-w-0 w-full rounded-lg border border-violet-200 bg-white px-2 py-2 text-sm";
const card = "space-y-3 rounded-xl border border-violet-100 bg-white p-4";
const submit =
  "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 text-sm font-semibold";
const palette = [
  "#ffffff",
  "#cbd5e1",
  "#94a3b8",
  "#ef4444",
  "#fb7185",
  "#f97316",
  "#fbbf24",
  "#bef264",
  "#22c55e",
  "#14b8a6",
  "#38bdf8",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];
export function SpatialGeometryLab({
  initialSolidId,
}: {
  initialSolidId?: string;
}) {
  const [id, setId] = useState(initialSolidId);
  useEffect(() => setId(initialSolidId), [initialSolidId]);
  const preset = MATH_SOLIDS.find((p) => p.id === id) ?? MATH_SOLIDS[0];
  return (
    <section className="rounded-2xl border border-violet-200 bg-white/95 p-4 sm:p-6 space-y-4">
      <label className="flex flex-wrap items-center gap-3 text-sm font-bold">
        Mô hình Toán học 3D
        <select
          className={field + " sm:max-w-sm"}
          value={preset.id}
          onChange={(e) => setId(e.target.value)}
        >
          {MATH_SOLIDS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <Workshop key={preset.id} preset={preset} />
    </section>
  );
}
function Workshop({ preset }: { preset: SolidPreset }) {
  const base = useMemo(
      () =>
        initial(preset).sort(
          (a, b) => Number(b.label === "S") - Number(a.label === "S"),
        ),
      [preset],
    ),
    [items, setItems] = useState(base),
    [selected, select] = useState("");
  const [mode, setMode] = useState([0, 0, 0]),
    [menu, setMenu] = useState(-1),
    [open, setOpen] = useState("");
  useEffect(() => {
    if (!open && menu < 0) return;
    function outside(e: PointerEvent) {
      const t = e.target as Element;
      if (!t.closest("[data-geo-menu]")) setMenu(-1);
      if (!t.closest("[data-geo-picker], [data-geo-stage]")) setOpen("");
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(-1);
        setOpen("");
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, menu]);
  const [values, setValues] = useState<Record<string, string>>({}),
    [bad, setBad] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({});
  const [ratio, setRatio] = useState("1:2"),
    [names, setNames] = useState(["N", "M"]),
    [coords, setCoords] = useState(["0", "2.25", "1"]),
    [colors, setColors] = useState(["#ffffff", "#ffffff"]);
  const [knownLabels, setKnownLabels] = useState(
    () =>
      new Map(
        base
          .filter((i) => i.kind === "point")
          .map((i) => [i.vertices[0].toArray().join(","), i.label!]),
      ),
  );
  const points = items.filter((o) => o.kind === "point");
  const pointAt = (v: V) => points.find((p) => same(v, p.vertices[0]));
  function name(o: Item) {
    if (o.label) return o.label;
    const sorted = [...o.vertices].sort(
      (a, b) => points.indexOf(pointAt(a)!) - points.indexOf(pointAt(b)!),
    );
    const letters = sorted
      .slice(0, o.kind === "face" ? 3 : sorted.length)
      .map(
        (v) =>
          pointAt(v)?.label ?? knownLabels.get(v.toArray().join(",")) ?? "·",
      )
      .join("");
    return o.kind === "face" ? "(" + letters + ")" : letters;
  }
  const tableData = useMemo(
    () =>
      new Map(
        items.map((i) => [
          i.id,
          {
            name: name(i),
            coords: center(i)
              .toArray()
              .map((n) => n.toFixed(2))
              .join(", "),
          },
        ]),
      ),
    [items, knownLabels],
  );
  function choices(key: string): Kind[] {
    if (key.startsWith("p") || key.startsWith("c")) {
      const m = mode[key[0] === "p" ? 0 : 1];
      return m === 0
        ? key[0] === "p"
          ? ["point", "line"]
          : ["point"]
        : m === 1
          ? ["point", "line", "face"]
          : ["point", "line", "face", "solid"];
    }
    if (key === "area") return ["face", "solid"];
    if (key.startsWith("i"))
      return mode[2] === 0
        ? ["line", "face"]
        : mode[2] === 1
          ? ["face"]
          : key === "i0"
            ? ["face"]
            : ["solid"];
    return ["point"];
  }
  function get(key: string) {
    const kind = choices(key);
    const defaultIndex = Number(key.slice(1)) || 0;
    const list = items.filter((i) => kind.includes(i.kind));
    return values[key] !== undefined
      ? list.find((i) => i.id === values[key])
      : /^[pc]/.test(key)
        ? undefined
        : list[defaultIndex % Math.max(1, list.length)];
  }
  function inputs(prefix: string) {
    return Object.keys(values)
      .filter((k) => k.startsWith(prefix) && get(k))
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
      .map((k) => get(k)!);
  }
  function locked(key: string) {
    if (!key.startsWith("p") || get(key)) return false;
    const objs = inputs("p");
    return (
      objs.some((o) => o.kind === ["line", "face", "solid"][mode[0]]) ||
      unique(objs.flatMap((o) => o.vertices)).length >= mode[0] + 2
    );
  }
  function forbidden(key: string, o: Item) {
    if (key.startsWith("p") || key.startsWith("c")) {
      const group = key[0];
      const count = mode[group === "p" ? 0 : 1] + 2;
      return Array.from({ length: count }, (_, i) => group + i).some(
        (other) => other !== key && get(other)?.id === o.id,
      );
    }
    if (!key.startsWith("i")) return false;
    const other = get(key === "i0" ? "i1" : "i0");
    return (
      other?.id === o.id ||
      (mode[2] === 0 && other?.kind === "face" && o.kind === "face")
    );
  }
  function choose(key: string, o: Item) {
    if (locked(key) || !choices(key).includes(o.kind) || forbidden(key, o)) {
      setBad(key);
      return;
    }
    setValues((v) => ({ ...v, [key]: o.id }));
    setOpen("");
    setBad("");
  }
  function picker(key: string, label: string) {
    const current = get(key);
    return (
      <div data-geo-picker key={key} className="relative min-w-0">
        <span className="text-xs text-slate-600">{label}</span>
        <button
          type="button"
          disabled={locked(key)}
          aria-expanded={open === key}
          onClick={() => {
            setOpen(open === key ? "" : key);
            setBad("");
            setMenu(-1);
          }}
          className={
            field +
            " text-left truncate " +
            (bad === key ? "!border-red-500 text-red-700" : "")
          }
        >
          {bad === key
            ? "Không hợp lệ"
            : current
              ? name(current)
              : "Chọn đối tượng"}{" "}
          ▾
        </button>
        {open === key && (
          <div className="absolute z-20 top-full left-0 w-max min-w-full max-w-64 max-h-48 overflow-auto bg-white border rounded-lg shadow-lg">
            {/^[pc]/.test(key) && (
              <button
                className="block p-2 text-xs"
                onClick={() => {
                  setValues((v) => {
                    const n = { ...v };
                    delete n[key];
                    return n;
                  });
                  setOpen("");
                }}
              >
                Bỏ chọn
              </button>
            )}
            {items
              .filter((i) => choices(key).includes(i.kind))
              .map((i) => (
                <button
                  key={i.id}
                  disabled={forbidden(key, i)}
                  onClick={() => choose(key, i)}
                  className="flex w-full gap-3 justify-between px-3 py-2 hover:bg-violet-50 disabled:opacity-35 text-sm"
                >
                  <span>{name(i)}</span>
                  <small className="text-slate-500 whitespace-nowrap">
                    {types[i.kind]}
                  </small>
                </button>
              ))}
          </div>
        )}
      </div>
    );
  }
  function header(g: number) {
    return (
      <div data-geo-menu className="relative">
        <button
          className="flex items-center gap-2 text-left font-bold text-sm"
          aria-expanded={menu === g}
          onClick={() => {
            setOpen("");
            setMenu(menu === g ? -1 : g);
          }}
        >
          <Plus
            className="rounded-md p-1 bg-indigo-600 text-white shrink-0"
            size={25}
          />
          {modes[g][mode[g]]}
        </button>
        {menu === g && (
          <div className="absolute z-20 top-full bg-white shadow-lg border rounded-lg p-1">
            {modes[g].map((s, i) => (
              <button
                key={s}
                className="block text-left w-full text-sm p-2 hover:bg-violet-50"
                onClick={() => {
                  if (g < 2)
                    setValues((v) =>
                      Object.fromEntries(
                        Object.entries(v).filter(
                          ([k]) => !k.startsWith(g ? "c" : "p"),
                        ),
                      ),
                    );
                  setMode(mode.map((n, j) => (j === g ? i : n)));
                  setMenu(-1);
                  setErrors((e) => ({ ...e, [g]: "" }));
                  if (g === 2) setValues(({ i0, i1, ...rest }) => rest);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  function color(j: number) {
    return (
      <label className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        Màu{" "}
        <input
          aria-label="Chọn màu"
          type="color"
          value={colors[j]}
          list="geo-colors"
          onChange={(e) =>
            setColors(colors.map((c, k) => (k === j ? e.target.value : c)))
          }
        />
      </label>
    );
  }
  function run(g: number) {
    const next = [...items],
      col = colors[g === 2 ? 1 : 0];
    let result: Item | undefined;
    const reserved = new Set([...points.map((p) => p.label), ...names]);
    function auto() {
      let n = 1;
      while (reserved.has("P" + n)) n++;
      reserved.add("P" + n);
      return "P" + n;
    }
    function put(kind: Kind, v: V[], extras: Partial<Item> = {}) {
      const index = next.findIndex(
        (o) =>
          o.kind === kind &&
          o.vertices.length === v.length &&
          v.every((p) => o.vertices.some((q) => same(p, q))),
      );
      const obj =
        index < 0
          ? make(kind, v, col, extras)
          : { ...next[index], color: col, ...extras };
      if (index >= 0 && (kind !== "point" || g === 2)) next[index] = obj;
      else {
        if (index >= 0) next.splice(index, 1);
        next.push(obj);
      }
      return obj;
    }
    function point(v: V, label?: string) {
      const old = next.find(
        (o) => o.kind === "point" && same(v, o.vertices[0]),
      );
      const n = label?.trim() || old?.label || auto();
      if (next.some((p) => p.kind === "point" && p.label === n && p !== old))
        throw Error("Tên điểm đã được dùng.");
      return put("point", [v], { label: n });
    }
    function polygon(v: V[]) {
      v.forEach((a, i) => put("line", [a, v[(i + 1) % v.length]]));
      return put("face", v);
    }
    try {
      if ((g === 0 || g === 3) && !names[g === 3 ? 1 : 0].trim())
        throw Error("Hãy nhập tên điểm.");
      if (g === 3) {
        if (coords.some((t) => !t.trim() || !Number.isFinite(Number(t))))
          throw Error("Hãy nhập đủ ba tọa độ hữu hạn.");
        result = point(
          new V(...(coords.map(Number) as [number, number, number])),
          names[1],
        );
      } else if (g < 2) {
        const objects = inputs(g ? "c" : "p"),
          m = mode[g];
        if (!objects.length) throw Error("Hãy chọn đối tượng.");
        let pts = unique(objects.flatMap((o) => o.vertices));
        if (!g && objects.length === 1 && objects[0].kind === "line")
          pts.sort(
            (a, b) => points.indexOf(pointAt(a)!) - points.indexOf(pointAt(b)!),
          );
        const entity = objects.find(
          (o) => o.kind === (m === 1 ? "face" : "solid"),
        );
        if (g === 0 && m > 0 && entity && objects.length === 1)
          result = point(center(entity), names[0]);
        else if (m === 0) {
          if (pts.length !== 2) throw Error("Cần hai điểm phân biệt.");
          if (g) result = put("line", pts);
          else {
            const parts = ratio.split(":").map(Number);
            if (
              parts.length !== 2 ||
              parts.some((x) => !Number.isFinite(x) || x <= 0) ||
              parts[0] > parts[1]
            )
              throw Error("Tỉ lệ AM:AB phải lớn hơn 0 và không vượt quá 1.");
            result = point(
              pts[0].clone().lerp(pts[1], parts[0] / parts[1]),
              names[0],
            );
          }
        } else if (m === 1) {
          const face = polygon(outline(pts));
          result = g ? face : point(center(face), names[0]);
        } else {
          const onlySolids = objects.every((o) => o.kind === "solid");
          if (g && onlySolids && objects.length === 1)
            throw Error("Chọn thêm đối tượng để kết hợp.");
          const cells = onlySolids
            ? objects.flatMap((o) => o.cells ?? [o.facets!])
            : [hull(pts)];
          const facets = cells.length === 1 ? cells[0] : unionFaces(cells);
          if (!facets.length) throw Error("Không tạo được biên khối.");
          const verts = unique(facets.flat());
          const participants = new Set(objects.flatMap((o) => o.vertices));
          for (let i = next.length - 1; i >= 0; i--) {
            const o = next[i];
            if (objects.includes(o) && o.kind === "solid") {
              next.splice(i, 1);
              continue;
            }
            if (!o.vertices.every((p) => participants.has(p))) continue;
            if (
              o.kind === "face" &&
              !facets.some(
                (f) =>
                  f.length === o.vertices.length &&
                  f.every((p) => o.vertices.some((q) => same(p, q))),
              )
            )
              next.splice(i, 1);
            else if (
              o.kind === "line" &&
              !facets.some((f) =>
                f.some((p, j) =>
                  o.vertices.every(
                    (q) => same(q, p) || same(q, f[(j + 1) % f.length]),
                  ),
                ),
              )
            )
              next.splice(i, 1);
          }
          for (const v of verts)
            if (!next.some((o) => o.kind === "point" && same(o.vertices[0], v)))
              point(v);
          if (cells.length > 1) {
            const bounds = cells.map(planes);
            for (const edge of [...next].filter((o) => o.kind === "line")) {
              const [a, b] = edge.vertices,
                cuts = [0, 1];
              for (const cell of bounds)
                for (const { n, d } of cell) {
                  const x = n.dot(a) - d,
                    y = n.dot(b) - d;
                  if (x * y < 0) {
                    const t = x / (x - y),
                      p = a.clone().lerp(b, t);
                    if (cell.every((h) => h.n.dot(p) <= h.d + 1e-7))
                      cuts.push(t);
                  }
                }
              cuts.sort((a, b) => a - b);
              const keep: V[][] = [];
              for (let j = 1; j < cuts.length; j++) {
                if (cuts[j] - cuts[j - 1] < 1e-7) continue;
                const m = a.clone().lerp(b, (cuts[j] + cuts[j - 1]) / 2);
                if (
                  !bounds.some((cell) =>
                    cell.every((h) => h.n.dot(m) < h.d - 1e-7),
                  )
                )
                  keep.push([
                    a.clone().lerp(b, cuts[j - 1]),
                    a.clone().lerp(b, cuts[j]),
                  ]);
              }
              if (
                keep.length === 1 &&
                same(keep[0][0], a) &&
                same(keep[0][1], b)
              )
                continue;
              next.splice(next.indexOf(edge), 1);
              for (const pair of keep) {
                for (const p of pair)
                  if (
                    !next.some(
                      (i) => i.kind === "point" && same(i.vertices[0], p),
                    )
                  )
                    point(p);
                put("line", pair, { color: edge.color });
              }
            }
          }
          facets.forEach(polygon);
          const solid = put("solid", verts, {
            ...(cells.length > 1 ? massProperties(facets) : {}),
            facets,
            cells,
            label:
              "Khối " +
              verts
                .slice(0, 8)
                .map(
                  (v) =>
                    next.find(
                      (o) => o.kind === "point" && same(o.vertices[0], v),
                    )?.label,
                )
                .join(""),
          });
          result = g ? solid : point(center(solid), names[0]);
        }
      } else {
        const a = get("i0"),
          b = get("i1");
        if (!a || !b || a.id === b.id)
          throw Error("Hãy chọn hai đối tượng khác nhau.");
        if (mode[2] === 0) {
          const hit = intersectPoint(a, b);
          if (hit.length() > 100)
            throw Error("Giao điểm vượt giới hạn 100 đơn vị.");
          result = point(hit);
        } else if (mode[2] === 1) {
          const ends = planeLine(a, b);
          ends.forEach((v) => point(v));
          result = put("line", ends);
        } else {
          const v = section(b, a);
          v.forEach((p) => point(p));
          result = polygon(v);
          if (b.radius && b.center) {
            const radius = mean(v).distanceTo(v[0]);
            result.area = Math.PI * radius ** 2;
          }
        }
      }
      setKnownLabels((old) => {
        const labels = new Map(old);
        for (const p of next)
          if (p.kind === "point")
            labels.set(p.vertices[0].toArray().join(","), p.label!);
        return labels;
      });
      setItems(next);
      select(result.id);
      setOpen("");
      if (g === 0 || g === 3) {
        const k = g === 3 ? 1 : 0;
        setNames(names.map((s, i) => (i === k ? auto() : s)));
      }
      setErrors((e) => ({ ...e, [g]: "" }));
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [g]: e instanceof Error ? e.message : "Đối tượng không hợp lệ.",
      }));
    }
  }
  const action = (g: number, text: string) => (
    <>
      {errors[g] && (
        <p role="alert" className="text-red-700 text-xs">
          {errors[g]}
        </p>
      )}
      <button onClick={() => run(g)} className={submit}>
        {text}
      </button>
    </>
  );
  function pointFields(g: number) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from(
          {
            length:
              g && mode[g] > 0
                ? Math.max(
                    mode[g] + 2,
                    ...Object.keys(values)
                      .filter((k) => k.startsWith("c"))
                      .map((k) => Number(k.slice(1)) + 2),
                  )
                : mode[g] + 2,
          },
          (_, j) => picker((g ? "c" : "p") + j, "Đối tượng " + (j + 1)),
        )}
      </div>
    );
  }
  const nm = (i: number) => (
    <label className="text-xs text-slate-600">
      Tên điểm
      <input
        aria-label="Tên điểm mới"
        placeholder="Tên điểm"
        className={field}
        value={names[i]}
        onChange={(e) =>
          setNames(names.map((v, j) => (i === j ? e.target.value : v)))
        }
      />
    </label>
  );
  const a = get("d0"),
    b = get("d2"),
    v = get("d1"),
    obj = get("area");
  const u = a && v ? a.vertices[0].clone().sub(v.vertices[0]) : null,
    w = b && v ? b.vertices[0].clone().sub(v.vertices[0]) : null;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(290px,2fr)] items-start">
      <div className="space-y-4 min-w-0 lg:sticky lg:top-24">
        <div data-geo-stage>
          <GeometryStage
            recolor={(color) =>
              setItems((old) =>
                old.map((i) => (i.id === selected ? { ...i, color } : i)),
              )
            }
            items={items}
            skin={base.find((o) => o.curved) ?? null}
            selected={selected}
            pick={(i) => {
              select(i?.id ?? "");
              if (open && i) choose(open, i);
              else if (!i) {
                setOpen("");
                setBad("");
              }
            }}
          />
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-violet-50 via-white to-violet-50/70 !border-violet-200 shadow-sm"
          }
        >
          <h3 className="font-bold">{preset.name}</h3>
          {preset.description && (
            <p className="text-sm">{preset.description}</p>
          )}
          {preset.formulasLatex.map((f) => (
            <KatexFormula key={f} latex={f} />
          ))}
        </div>
      </div>
      <div className="space-y-3 min-w-0">
        <datalist id="geo-colors">
          {palette.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div
          className={
            card +
            " bg-gradient-to-br from-sky-50 via-white to-sky-50/70 !border-sky-200 shadow-sm"
          }
        >
          {header(0)}
          {pointFields(0)}
          <div className="grid grid-cols-2 gap-2">
            {nm(0)}
            {mode[0] === 0 && (
              <label className="text-xs text-slate-600">
                Tỉ lệ AM:AB
                <input
                  className={field}
                  value={ratio}
                  placeholder="x:y"
                  aria-label="Tỉ lệ chia đoạn x:y"
                  onChange={(e) => setRatio(e.target.value)}
                />
              </label>
            )}
          </div>
          {action(0, "Tạo điểm")}
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-violet-50 via-white to-violet-50/70 !border-violet-200 shadow-sm"
          }
        >
          <h3 className="font-bold text-sm">Thêm điểm theo tọa độ</h3>
          <div className="grid grid-cols-4 gap-1">
            {nm(1)}
            {coords.map((c, i) => (
              <label key={i} className="text-xs text-slate-600">
                Tọa độ {"XYZ"[i]}
                <input
                  type="number"
                  step="any"
                  aria-label={"Tọa độ " + "XYZ"[i]}
                  value={c}
                  onChange={(e) =>
                    setCoords(
                      coords.map((n, j) => (i === j ? e.target.value : n)),
                    )
                  }
                  className={field}
                />
              </label>
            ))}
          </div>
          {action(3, "Đặt điểm")}
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-amber-50 via-white to-amber-50/70 !border-amber-200 shadow-sm"
          }
        >
          {header(1)}
          {pointFields(1)}
          {color(0)}
          {action(1, modes[1][mode[1]])}
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-indigo-50 via-white to-indigo-50/70 !border-indigo-200 shadow-sm"
          }
        >
          {header(2)}
          <div className="grid grid-cols-2 gap-2">
            {picker("i0", mode[2] === 2 ? "Mặt cắt" : "Đối tượng 1")}
            {picker("i1", mode[2] === 2 ? "Hình khối" : "Đối tượng 2")}
          </div>
          {color(1)}
          {action(2, "Tìm giao")}
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 !border-emerald-200 shadow-sm"
          }
        >
          <h3 className="flex items-center gap-2 font-bold text-sm">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 inline-flex items-center justify-center">
              <Ruler className="w-3.5 h-3.5" />
            </span>
            Đo khoảng cách & góc không gian
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {picker("d0", "Điểm 1")}
            {picker("d1", "Đỉnh góc")}
            {picker("d2", "Điểm 2")}
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-sm">
            Độ dài đường nối điểm {a?.label ?? "…"} và {b?.label ?? "…"}{" "}
            <b>
              {a && b
                ? a.vertices[0].distanceTo(b.vertices[0]).toFixed(3)
                : "—"}{" "}
              đv
            </b>
            <br />
            Góc tại {v?.label ?? "…"}{" "}
            <b>
              {u?.length() && w?.length()
                ? ((u.angleTo(w) * 180) / Math.PI).toFixed(2) + "°"
                : "—"}
            </b>
          </div>
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-teal-50 via-white to-teal-50/70 !border-teal-200 shadow-sm"
          }
        >
          <h3 className="flex gap-2 items-center font-bold text-sm">
            <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 inline-flex items-center justify-center">
              <Shapes size={15} />
            </span>
            Đo diện tích & thể tích
          </h3>
          {picker("area", "Mặt hoặc khối")}
          {obj && (
            <div className="bg-teal-50 rounded-xl p-3 text-sm">
              {obj.kind === "face" ? "Diện tích" : "Thể tích"}{" "}
              <b>
                {measure(obj).toFixed(3)} đv{obj.kind === "face" ? "²" : "³"}
              </b>
            </div>
          )}
        </div>
        <div
          className={
            card +
            " bg-gradient-to-br from-purple-50 via-white to-purple-50/70 !border-purple-200 shadow-sm"
          }
        >
          <h3 className="font-bold text-sm">
            Bảng các đối tượng ({items.length})
          </h3>
          <div className="max-h-72 overflow-auto overscroll-contain [contain:strict] h-72">
            {Object.keys(types).flatMap((k) =>
              items
                .filter((i) => i.kind === k)
                .map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center gap-2 border-b py-1 text-xs [content-visibility:auto] [contain-intrinsic-size:auto_28px]"
                  >
                    <span
                      title={tableData.get(i.id)!.name}
                      className="min-w-0 flex-1 truncate"
                    >
                      {tableData.get(i.id)!.name}
                    </span>
                    <small>{types[i.kind]}</small>
                    <span className="tabular-nums">
                      ({tableData.get(i.id)!.coords})
                    </span>
                    <button
                      aria-label={"Xóa " + tableData.get(i.id)!.name}
                      className="text-red-600 p-1"
                      onClick={() => {
                        setItems(items.filter((o) => o !== i));
                        if (selected === i.id) select("");
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

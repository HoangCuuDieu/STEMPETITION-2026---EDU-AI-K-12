import { test } from "node:test";
import assert from "node:assert/strict";
import { MATH_SOLIDS } from "./mathGeometry";
import {
  V,
  make,
  initial,
  measure,
  center,
  intersectPoint,
  planeLine,
  section,
  validate,
} from "./construction";
const xyz = (x: number, y: number, z: number) => new V(x, y, z);
const xy = make("face", [xyz(0, 0, 0), xyz(1, 0, 0), xyz(0, 1, 0)], "");
const xz = make("face", [xyz(0, 0, 0), xyz(1, 0, 0), xyz(0, 0, 1)], "");
test("all solids have finite centroids and positive volume", () => {
  for (const p of MATH_SOLIDS) {
    const solid = initial(p).at(-1)!;
    assert.ok(measure(solid) > 0, p.name);
    assert.ok(center(solid).toArray().every(Number.isFinite), p.name);
  }
});
test("line and plane intersections distinguish degeneracies", () => {
  const vertical = make("line", [xyz(1, 1, -2), xyz(1, 1, 2)], "");
  assert.ok(intersectPoint(vertical, xy).distanceTo(xyz(1, 1, 0)) < 1e-7);
  assert.throws(() =>
    intersectPoint(vertical, make("line", [xyz(0, 2, 0), xyz(1, 2, 0)], "")),
  );
  assert.throws(() => planeLine(xy, xy));
  assert.throws(() => validate([...xy.vertices, xyz(2, 2, 0)]));
  for (const p of planeLine(xy, xz))
    assert.ok(Math.abs(p.y) + Math.abs(p.z) < 1e-7);
});
test("a horizontal section through the cube has square area", () => {
  const cube = initial(MATH_SOLIDS.find((s) => s.id === "math-cube")!).at(-1)!;
  const cut = section(
    cube,
    make(
      "face",
      xz.vertices.map((p) => p.clone().add(xyz(0, 1, 0))),
      "",
    ),
  );
  assert.equal(cut.length, 4);
  assert.ok(Math.abs(measure(make("face", cut, "")) - 8) < 1e-7);
  assert.ok(Math.abs(measure(cube) - Math.sqrt(8) ** 3) < 1e-7);
});

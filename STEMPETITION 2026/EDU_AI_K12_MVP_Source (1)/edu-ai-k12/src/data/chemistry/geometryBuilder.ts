import type { Atom3D, Bond3D, LatticeData } from '../../types/chemistry';

export const ATOMIC_NUMBER: Record<string, number> = {
  H: 1,
  He: 2,
  B: 5,
  C: 6,
  N: 7,
  O: 8,
  F: 9,
  Ne: 10,
  Na: 11,
  Mg: 12,
  Al: 13,
  Si: 14,
  P: 15,
  S: 16,
  Cl: 17,
  Ar: 18,
  K: 19,
  Ca: 20,
  Fe: 26,
  Cu: 29,
  Br: 35,
  I: 53,
};

export const ATOMIC_MASS: Record<string, number> = {
  H: 1.008,
  He: 4.003,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Ar: 39.948,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Br: 79.904,
  I: 126.904,
};

type Vec3 = [number, number, number];

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
function norm(a: Vec3): Vec3 {
  const len = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / len, a[1] / len, a[2] / len];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function round3(v: number): number {
  return Math.round(v * 10000) / 10000;
}

export class MoleculeBuilder {
  public atoms: Atom3D[] = [];
  public bonds: Bond3D[] = [];

  public addAtom(
    element: string,
    x: number,
    y: number,
    z: number,
    formalCharge?: number,
  ): number {
    const id = this.atoms.length + 1;
    this.atoms.push({
      id,
      element,
      atomicNumber: ATOMIC_NUMBER[element] ?? 6,
      x: round3(x),
      y: round3(y),
      z: round3(z),
      ...(formalCharge !== undefined ? { formalCharge } : {}),
    });
    return id;
  }

  public addBond(
    fromAtomId: number,
    toAtomId: number,
    order: 1 | 2 | 3 | 1.5 = 1,
    type: Bond3D['type'] = 'covalent',
  ): void {
    this.bonds.push({ fromAtomId, toAtomId, order, type });
  }

  public pos(atomId: number): Vec3 {
    const a = this.atoms[atomId - 1];
    return [a.x, a.y, a.z];
  }

  public neighbors(atomId: number): Vec3[] {
    const res: Vec3[] = [];
    for (const b of this.bonds) {
      if (b.fromAtomId === atomId) res.push(this.pos(b.toAtomId));
      else if (b.toAtomId === atomId) res.push(this.pos(b.fromAtomId));
    }
    return res;
  }

  // Place tetrahedral hydrogens or substituents on an sp3 atom given existing bonded positions
  public fillTetrahedralH(centerId: number, bondLen = 1.09, count?: number): number[] {
    const c = this.pos(centerId);
    const existing = this.neighbors(centerId).map((p) => norm(sub(p, c)));
    const dirs: Vec3[] = [];
    const tetAngle = (109.4712 * Math.PI) / 180;

    if (existing.length === 0) {
      const k = 1 / Math.sqrt(3);
      dirs.push([k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k]);
    } else if (existing.length === 1) {
      const u = existing[0];
      const ref: Vec3 = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const v1 = norm(cross(u, ref));
      const v2 = norm(cross(u, v1));
      const cosT = Math.cos(tetAngle);
      const sinT = Math.sin(tetAngle);
      for (let i = 0; i < 3; i++) {
        const phi = (i * 2 * Math.PI) / 3;
        const perp = add(scale(v1, Math.cos(phi)), scale(v2, Math.sin(phi)));
        dirs.push(norm(add(scale(u, cosT), scale(perp, sinT))));
      }
    } else if (existing.length === 2) {
      const u1 = existing[0];
      const u2 = existing[1];
      const bis = norm(add(u1, u2));
      const out = scale(bis, -1);
      const perp = norm(cross(u1, u2));
      const halfAngle = (54.7356 * Math.PI) / 180;
      dirs.push(
        norm(add(scale(out, Math.cos(halfAngle)), scale(perp, Math.sin(halfAngle)))),
        norm(add(scale(out, Math.cos(halfAngle)), scale(perp, -Math.sin(halfAngle)))),
      );
    } else if (existing.length === 3) {
      const sumDir = add(add(existing[0], existing[1]), existing[2]);
      dirs.push(norm(scale(sumDir, -1)));
    }

    const needed = count ?? 4 - existing.length;
    const created: number[] = [];
    for (let i = 0; i < Math.min(needed, dirs.length); i++) {
      const p = add(c, scale(dirs[i], bondLen));
      const hid = this.addAtom('H', p[0], p[1], p[2]);
      this.addBond(centerId, hid, 1);
      created.push(hid);
    }
    return created;
  }

  public fillTrigonalH(centerId: number, normal: Vec3 = [0, 0, 1], bondLen = 1.08, count?: number): number[] {
    const c = this.pos(centerId);
    const existing = this.neighbors(centerId).map((p) => norm(sub(p, c)));
    const n = norm(normal);
    const dirs: Vec3[] = [];
    if (existing.length === 2) {
      dirs.push(norm(scale(add(existing[0], existing[1]), -1)));
    } else if (existing.length === 1) {
      const u = existing[0];
      const perp = norm(cross(n, u));
      const cos120 = -0.5;
      const sin120 = Math.sqrt(3) / 2;
      dirs.push(
        norm(add(scale(u, cos120), scale(perp, sin120))),
        norm(add(scale(u, cos120), scale(perp, -sin120))),
      );
    }
    const needed = count ?? 3 - existing.length;
    const created: number[] = [];
    for (let i = 0; i < Math.min(needed, dirs.length); i++) {
      const p = add(c, scale(dirs[i], bondLen));
      const hid = this.addAtom('H', p[0], p[1], p[2]);
      this.addBond(centerId, hid, 1);
      created.push(hid);
    }
    return created;
  }

  public centerGeometry(): void {
    if (this.atoms.length === 0) return;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const a of this.atoms) {
      sx += a.x;
      sy += a.y;
      sz += a.z;
    }
    const cx = sx / this.atoms.length;
    const cy = sy / this.atoms.length;
    const cz = sz / this.atoms.length;
    for (const a of this.atoms) {
      a.x = round3(a.x - cx);
      a.y = round3(a.y - cy);
      a.z = round3(a.z - cz);
    }
  }
}

export function buildLinearChain(
  n: number,
  bondLen = 1.54,
  angleDeg = 109.5,
): Vec3[] {
  const halfStep = ((180 - angleDeg) / 2) * (Math.PI / 180);
  const dx = bondLen * Math.cos(halfStep);
  const dy = bondLen * Math.sin(halfStep);
  const pts: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    pts.push([round3(i * dx), round3(i % 2 === 0 ? 0 : dy), 0]);
  }
  return pts;
}

export function buildBCCUnitCell(
  element: string,
  a: number,
): { atoms: Atom3D[]; bonds: Bond3D[]; lattice: LatticeData } {
  const mb = new MoleculeBuilder();
  const h = a / 2;
  const corners: number[] = [];
  for (const x of [-h, h]) {
    for (const y of [-h, h]) {
      for (const z of [-h, h]) {
        corners.push(mb.addAtom(element, x, y, z));
      }
    }
  }
  const center = mb.addAtom(element, 0, 0, 0);
  for (const cid of corners) {
    mb.addBond(center, cid, 1, 'metallic');
  }
  return {
    atoms: mb.atoms,
    bonds: mb.bonds,
    lattice: {
      crystalSystem: 'cubic',
      bravaisType: 'I',
      a,
      b: a,
      c: a,
      alpha: 90,
      beta: 90,
      gamma: 90,
      cellRepresentationNote: `Minh họa 1 ô cơ sở lập phương tâm khối (BCC, a = ${a} Å) trích xuất từ mạng tinh thể kim loại 3D tuần hoàn.`,
    },
  };
}

export function buildFCCUnitCell(
  element: string,
  a: number,
): { atoms: Atom3D[]; bonds: Bond3D[]; lattice: LatticeData } {
  const mb = new MoleculeBuilder();
  const h = a / 2;
  const corners: number[] = [];
  for (const x of [-h, h]) {
    for (const y of [-h, h]) {
      for (const z of [-h, h]) {
        corners.push(mb.addAtom(element, x, y, z));
      }
    }
  }
  const fXM = mb.addAtom(element, -h, 0, 0);
  const fXP = mb.addAtom(element, h, 0, 0);
  const fYM = mb.addAtom(element, 0, -h, 0);
  const fYP = mb.addAtom(element, 0, h, 0);
  const fZM = mb.addAtom(element, 0, 0, -h);
  const fZP = mb.addAtom(element, 0, 0, h);
  const faces = [fXM, fXP, fYM, fYP, fZM, fZP];
  // Connect each face-centered atom to its 4 corner neighbors
  for (const fid of faces) {
    const fp = mb.pos(fid);
    for (const cid of corners) {
      const cp = mb.pos(cid);
      const d = Math.hypot(fp[0] - cp[0], fp[1] - cp[1], fp[2] - cp[2]);
      if (d < a * 0.75) mb.addBond(fid, cid, 1, 'metallic');
    }
  }
  return {
    atoms: mb.atoms,
    bonds: mb.bonds,
    lattice: {
      crystalSystem: 'cubic',
      bravaisType: 'F',
      a,
      b: a,
      c: a,
      alpha: 90,
      beta: 90,
      gamma: 90,
      cellRepresentationNote: `Minh họa 1 ô cơ sở lập phương tâm mặt (FCC, a = ${a} Å, 8 đỉnh + 6 tâm mặt) trích xuất từ mạng tinh thể kim loại.`,
    },
  };
}

export function buildRocksalt3x3x3(
  cation: string,
  anion: string,
  a: number,
  cationCharge = 1,
  anionCharge = -1,
): { atoms: Atom3D[]; bonds: Bond3D[]; lattice: LatticeData } {
  const mb = new MoleculeBuilder();
  const half = a / 2;
  const grid = new Map<string, number>();

  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        const isCat = Math.abs(ix + iy + iz) % 2 === 0;
        const id = mb.addAtom(
          isCat ? cation : anion,
          ix * half,
          iy * half,
          iz * half,
          isCat ? cationCharge : anionCharge,
        );
        grid.set(`${ix},${iy},${iz}`, id);
      }
    }
  }
  const dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        const u = grid.get(`${ix},${iy},${iz}`)!;
        for (const [dx, dy, dz] of dirs) {
          const v = grid.get(`${ix + dx},${iy + dy},${iz + dz}`);
          if (v) mb.addBond(u, v, 1, 'ionic-coordination');
        }
      }
    }
  }
  return {
    atoms: mb.atoms,
    bonds: mb.bonds,
    lattice: {
      crystalSystem: 'cubic',
      bravaisType: 'F',
      a,
      b: a,
      c: a,
      alpha: 90,
      beta: 90,
      gamma: 90,
      cellRepresentationNote: `Khối mạng tinh thể ion kiểu rocksalt 3×3×3 (27 ion, a = ${a} Å, phối trí 6:6) đại diện cho tinh thể tuần hoàn, không phải phân tử đơn lẻ.`,
    },
  };
}

export function computeMolarMass(atoms: Atom3D[]): number {
  let sum = 0;
  for (const a of atoms) {
    sum += ATOMIC_MASS[a.element] ?? 0;
  }
  return Math.round(sum * 100) / 100;
}

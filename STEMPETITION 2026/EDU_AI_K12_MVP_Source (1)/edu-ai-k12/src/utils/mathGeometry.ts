import { extraSolids } from './solidPresets';
export interface Point3D {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  isCustom?: boolean;
}

export interface Segment3D {
  id: string;
  fromId: string;
  toId: string;
  dashed?: boolean;
  isCustom?: boolean;
}

export interface SolidPreset {
  id: string;
  round?: {radius?:number;bottom?:number;top?:number;height?:number};
  name: string;
  subtitle: string;
  description: string;
  formulasLatex: string[];
  points: Point3D[];
  segments: Segment3D[];
  faces: string[][];
}

export const MATH_SOLIDS: SolidPreset[] = [
  {
    id: 'math-pyramid',
    name: 'Hình chóp S.ABCD',
    subtitle: 'Chóp tứ giác đều đáy vuông cạnh a = 4, đường cao SO = 4.5',
    description:
      'Hình chóp S.ABCD có đáy ABCD là hình vuông tâm O nằm trong mặt phẳng Oxz, đỉnh S nằm trên trục Oy sao cho SO vuông góc với đáy.',
    formulasLatex: [
      'V = \\frac{1}{3} S_{\\text{ABCD}} \\cdot SO = \\frac{1}{3} a^2 h',
      'SO \\perp (ABCD) \\Rightarrow \\widehat{(SB, (ABCD))} = \\widehat{SBO}',
    ],
    points: [
      { id: 'A', label: 'A', x: -2, y: 0, z: -2 },
      { id: 'B', label: 'B', x: 2, y: 0, z: -2 },
      { id: 'C', label: 'C', x: 2, y: 0, z: 2 },
      { id: 'D', label: 'D', x: -2, y: 0, z: 2 },
      { id: 'O', label: 'O', x: 0, y: 0, z: 0 },
      { id: 'S', label: 'S', x: 0, y: 4.5, z: 0 },
    ],
    segments: [
      { id: 'AB', fromId: 'A', toId: 'B' },
      { id: 'BC', fromId: 'B', toId: 'C' },
      { id: 'CD', fromId: 'C', toId: 'D' },
      { id: 'DA', fromId: 'D', toId: 'A' },
      { id: 'SA', fromId: 'S', toId: 'A' },
      { id: 'SB', fromId: 'S', toId: 'B' },
      { id: 'SC', fromId: 'S', toId: 'C' },
      { id: 'SD', fromId: 'S', toId: 'D' },
      { id: 'AC', fromId: 'A', toId: 'C', dashed: true },
      { id: 'BD', fromId: 'B', toId: 'D', dashed: true },
      { id: 'SO', fromId: 'S', toId: 'O', dashed: true },
    ],
    faces: [
      ['A', 'B', 'C', 'D'],
      ['S', 'A', 'B'],
      ['S', 'B', 'C'],
      ['S', 'C', 'D'],
      ['S', 'D', 'A'],
    ],
  },
  {
    id: 'math-prism',
    name: 'Hình lăng trụ tam giác ABC.A′B′C′',
    subtitle: 'Lăng trụ đứng đáy tam giác đều cạnh 3.6, chiều cao h = 4.2',
    description:
      'Hai đáy ABC và A′B′C′ song song và bằng nhau; các cạnh bên AA′, BB′, CC′ song song và vuông góc với hai đáy.',
    formulasLatex: [
      'V = S_{\\triangle ABC} \\cdot h, \\quad S_{\\text{xq}} = (AB + BC + CA) \\cdot h',
    ],
    points: [
      { id: 'A', label: 'A', x: -1.8, y: 0, z: 1.2 },
      { id: 'B', label: 'B', x: 1.8, y: 0, z: 1.2 },
      { id: 'C', label: 'C', x: 0, y: 0, z: -1.9 },
      { id: 'A1', label: "A'", x: -1.8, y: 4.2, z: 1.2 },
      { id: 'B1', label: "B'", x: 1.8, y: 4.2, z: 1.2 },
      { id: 'C1', label: "C'", x: 0, y: 4.2, z: -1.9 },
    ],
    segments: [
      { id: 'AB', fromId: 'A', toId: 'B' },
      { id: 'BC', fromId: 'B', toId: 'C' },
      { id: 'CA', fromId: 'C', toId: 'A', dashed: true },
      { id: 'A1B1', fromId: 'A1', toId: 'B1' },
      { id: 'B1C1', fromId: 'B1', toId: 'C1' },
      { id: 'C1A1', fromId: 'C1', toId: 'A1' },
      { id: 'AA1', fromId: 'A', toId: 'A1' },
      { id: 'BB1', fromId: 'B', toId: 'B1' },
      { id: 'CC1', fromId: 'C', toId: 'C1' },
    ],
    faces: [
      ['A', 'B', 'C'],
      ['A1', 'B1', 'C1'],
      ['A', 'B', 'B1', 'A1'],
      ['B', 'C', 'C1', 'B1'],
      ['C', 'A', 'A1', 'C1'],
    ],
  },
  {
    id: 'math-cuboid',
    name: 'Hình hộp chữ nhật ABCD.A′B′C′D′',
    subtitle: 'Kích thước 4 × 3 × 3.5 với đường chéo không gian AC′',
    description:
      'Hai mặt kề nhau vuông góc; đường chéo không gian AC′ thỏa định lý Pythagore mở rộng.',
    formulasLatex: [
      'V = a \\cdot b \\cdot c, \\quad AC\' = \\sqrt{a^2 + b^2 + c^2}',
    ],
    points: [
      { id: 'A', label: 'A', x: -2, y: 0, z: -1.5 },
      { id: 'B', label: 'B', x: 2, y: 0, z: -1.5 },
      { id: 'C', label: 'C', x: 2, y: 0, z: 1.5 },
      { id: 'D', label: 'D', x: -2, y: 0, z: 1.5 },
      { id: 'A1', label: "A'", x: -2, y: 3.5, z: -1.5 },
      { id: 'B1', label: "B'", x: 2, y: 3.5, z: -1.5 },
      { id: 'C1', label: "C'", x: 2, y: 3.5, z: 1.5 },
      { id: 'D1', label: "D'", x: -2, y: 3.5, z: 1.5 },
    ],
    segments: [
      { id: 'AB', fromId: 'A', toId: 'B' },
      { id: 'BC', fromId: 'B', toId: 'C' },
      { id: 'CD', fromId: 'C', toId: 'D' },
      { id: 'DA', fromId: 'D', toId: 'A' },
      { id: 'A1B1', fromId: 'A1', toId: 'B1' },
      { id: 'B1C1', fromId: 'B1', toId: 'C1' },
      { id: 'C1D1', fromId: 'C1', toId: 'D1' },
      { id: 'D1A1', fromId: 'D1', toId: 'A1' },
      { id: 'AA1', fromId: 'A', toId: 'A1' },
      { id: 'BB1', fromId: 'B', toId: 'B1' },
      { id: 'CC1', fromId: 'C', toId: 'C1' },
      { id: 'DD1', fromId: 'D', toId: 'D1' },
      { id: 'AC1', fromId: 'A', toId: 'C1', dashed: true },
    ],
    faces: [
      ['A', 'B', 'C', 'D'],
      ['A1', 'B1', 'C1', 'D1'],
      ['A', 'B', 'B1', 'A1'],
      ['B', 'C', 'C1', 'B1'],
      ['C', 'D', 'D1', 'C1'],
      ['D', 'A', 'A1', 'D1'],
    ],
  },
  {
    id: 'math-tetrahedron',
    name: 'Hình tứ diện đều ABCD',
    subtitle: '4 mặt tam giác đều bằng nhau, cạnh a = 4.2',
    description:
      'Tứ diện đều có 6 cạnh bằng nhau, các cặp cạnh đối diện vuông góc với nhau từng đôi một (AB ⊥ CD, AC ⊥ BD, AD ⊥ BC).',
    formulasLatex: [
      'h = a\\sqrt{\\frac{2}{3}}, \\quad V = \\frac{a^3\\sqrt{2}}{12}',
    ],
    points: [
      { id: 'A', label: 'A', x: 0, y: 3.43, z: 0 },
      { id: 'B', label: 'B', x: -2.1, y: 0, z: 1.21 },
      { id: 'C', label: 'C', x: 2.1, y: 0, z: 1.21 },
      { id: 'D', label: 'D', x: 0, y: 0, z: -2.42 },
      { id: 'G', label: 'G', x: 0, y: 0, z: 0 },
    ],
    segments: [
      { id: 'AB', fromId: 'A', toId: 'B' },
      { id: 'AC', fromId: 'A', toId: 'C' },
      { id: 'AD', fromId: 'A', toId: 'D' },
      { id: 'BC', fromId: 'B', toId: 'C' },
      { id: 'CD', fromId: 'C', toId: 'D', dashed: true },
      { id: 'DB', fromId: 'D', toId: 'B', dashed: true },
      { id: 'AG', fromId: 'A', toId: 'G', dashed: true },
    ],
    faces: [
      ['B', 'C', 'D'],
      ['A', 'B', 'C'],
      ['A', 'C', 'D'],
      ['A', 'D', 'B'],
    ],
  },
  ...extraSolids,
];

export function distanceBetween(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function midpointOf(p1: Point3D, p2: Point3D, label: string): Point3D {
  return {
    id: `pt-${label}-${Date.now()}`,
    label,
    x: Number(((p1.x + p2.x) / 2).toFixed(3)),
    y: Number(((p1.y + p2.y) / 2).toFixed(3)),
    z: Number(((p1.z + p2.z) / 2).toFixed(3)),
    isCustom: true,
  };
}

export function angleDegreesAtVertex(
  p1: Point3D,
  vertex: Point3D,
  p2: Point3D,
): number | null {
  const u = { x: p1.x - vertex.x, y: p1.y - vertex.y, z: p1.z - vertex.z };
  const v = { x: p2.x - vertex.x, y: p2.y - vertex.y, z: p2.z - vertex.z };
  const magU = Math.hypot(u.x, u.y, u.z);
  const magV = Math.hypot(v.x, v.y, v.z);
  if (magU < 1e-6 || magV < 1e-6) return null;
  const cos = Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y + u.z * v.z) / (magU * magV)));
  return (Math.acos(cos) * 180) / Math.PI;
}

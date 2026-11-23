import type { ChemicalModel, LatticeData } from '../../types/chemistry';
import {
  MoleculeBuilder,
  buildRocksalt3x3x3,
  computeMolarMass,
} from './geometryBuilder';

const DEG = Math.PI / 180;

function makeBent(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  centerEl: string,
  sideEl: string,
  d: number,
  angleDeg: number,
  bondOrder: 1 | 2 | 1.5,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const half = (angleDeg / 2) * DEG;
  const c = mb.addAtom(centerEl, 0, 0.25, 0);
  const s1 = mb.addAtom(sideEl, d * Math.sin(half), 0.25 - d * Math.cos(half), 0);
  const s2 = mb.addAtom(sideEl, -d * Math.sin(half), 0.25 - d * Math.cos(half), 0);
  mb.addBond(c, s1, bondOrder);
  mb.addBond(c, s2, bondOrder);
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'inorganic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
  };
}

function makeLinear2(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  el1: string,
  el2: string,
  d: number,
  order: 1 | 2 | 3,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const a1 = mb.addAtom(el1, -d / 2, 0, 0);
  const a2 = mb.addAtom(el2, d / 2, 0, 0);
  mb.addBond(a1, a2, order);
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'inorganic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
  };
}

function makeLinear3(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  leftEl: string,
  midEl: string,
  rightEl: string,
  d1: number,
  d2: number,
  o1: 1 | 2 | 3,
  o2: 1 | 2 | 3,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const l = mb.addAtom(leftEl, -d1, 0, 0);
  const m = mb.addAtom(midEl, 0, 0, 0);
  const r = mb.addAtom(rightEl, d2, 0, 0);
  mb.addBond(l, m, o1);
  mb.addBond(m, r, o2);
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'inorganic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
  };
}

function makeTrigonalPlanar(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  centerEl: string,
  sideEl: string,
  d: number,
  order: 1 | 2,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const c = mb.addAtom(centerEl, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3;
    const s = mb.addAtom(sideEl, d * Math.cos(phi), d * Math.sin(phi), 0);
    mb.addBond(c, s, order);
  }
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'inorganic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
  };
}

function makePyramidal(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  centerEl: string,
  sideEl: string,
  d: number,
  angleDeg: number,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  // Cone half-angle theta from symmetric bond angle alpha: sin(theta) = 2/sqrt(3) * sin(alpha/2)
  const sinTheta = (2 / Math.sqrt(3)) * Math.sin((angleDeg / 2) * DEG);
  const cosTheta = Math.sqrt(Math.max(0.01, 1 - sinTheta * sinTheta));
  const rXY = d * sinTheta;
  const dy = -d * cosTheta;

  const mb = new MoleculeBuilder();
  const c = mb.addAtom(centerEl, 0, 0.25, 0);
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3;
    const s = mb.addAtom(sideEl, rXY * Math.cos(phi), 0.25 + dy, rXY * Math.sin(phi));
    mb.addBond(c, s, 1);
  }
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'inorganic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
  };
}

// Complex inorganic molecules
function buildH2O2(): ChemicalModel {
  // Non-planar skew conformation: d(O-O)=1.475 Å, d(O-H)=0.95 Å, angle H-O-O=94.8°, dihedral=111.5°
  const mb = new MoleculeBuilder();
  const o1 = mb.addAtom('O', -0.7375, 0, 0);
  const o2 = mb.addAtom('O', 0.7375, 0, 0);
  const h1 = mb.addAtom('H', -0.817, 0.947, 0);
  const dihed = 111.5 * DEG;
  const h2 = mb.addAtom('H', 0.817, 0.947 * Math.cos(dihed), 0.947 * Math.sin(dihed));
  mb.addBond(o1, o2, 1);
  mb.addBond(o1, h1, 1);
  mb.addBond(o2, h2, 1);
  mb.centerGeometry();
  return {
    id: 'chem-022', orderNumber: 22, formula: 'H₂O₂', nameVi: 'Hydrogen peroxide', nameEn: 'Hydrogen peroxide',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 34.01,
    geometryDescription: 'Cấu trúc gấp khúc không đồng phẳng (góc nhị diện H–O–O–H = 111.5°, d(O–O) = 1.475 Å).',
    properties: ['Chất lỏng không màu, dễ phân hủy thành H₂O và O₂', 'Có cả tính oxi hóa và tính khử'],
    applications: ['Nước oxi già sát trùng y tế', 'Chất tẩy trắng thân thiện môi trường'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildN2O4(): ChemicalModel {
  // Planar D2h: d(N-N)=1.782 Å, d(N-O)=1.190 Å, angle O-N-O=135.4°
  const mb = new MoleculeBuilder();
  const n1 = mb.addAtom('N', -0.891, 0, 0);
  const n2 = mb.addAtom('N', 0.891, 0, 0);
  const half = (135.4 / 2) * DEG;
  const dNO = 1.19;
  const o1 = mb.addAtom('O', -0.891 - dNO * Math.cos(half), dNO * Math.sin(half), 0);
  const o2 = mb.addAtom('O', -0.891 - dNO * Math.cos(half), -dNO * Math.sin(half), 0);
  const o3 = mb.addAtom('O', 0.891 + dNO * Math.cos(half), dNO * Math.sin(half), 0);
  const o4 = mb.addAtom('O', 0.891 + dNO * Math.cos(half), -dNO * Math.sin(half), 0);
  mb.addBond(n1, n2, 1);
  mb.addBond(n1, o1, 1.5); mb.addBond(n1, o2, 1.5);
  mb.addBond(n2, o3, 1.5); mb.addBond(n2, o4, 1.5);
  return {
    id: 'chem-036', orderNumber: 36, formula: 'N₂O₄', nameVi: 'Dinitrogen tetroxide', nameEn: 'Dinitrogen tetroxide',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 92.01,
    geometryDescription: 'Phân tử phẳng đối xứng D2h gồm 2 nhóm –NO₂ liên kết qua liên kết N–N dài 1.782 Å.',
    properties: ['Cân bằng thuận nghịch với khí NO₂ màu nâu đỏ (2NO₂ ⇌ N₂O₄)', 'Chất oxi hóa mạnh'],
    applications: ['Chất oxi hóa nhiên liệu tên lửa', 'Nghiên cứu cân bằng hóa học'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildHNO3(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const n = mb.addAtom('N', 0, 0, 0);
  const oTerm1 = mb.addAtom('O', 0.65, 1.02, 0);
  const oTerm2 = mb.addAtom('O', 0.65, -1.02, 0);
  const oH = mb.addAtom('O', -1.40, 0, 0);
  const h = mb.addAtom('H', -1.80, 0.88, 0);
  mb.addBond(n, oTerm1, 1.5);
  mb.addBond(n, oTerm2, 1.5);
  mb.addBond(n, oH, 1);
  mb.addBond(oH, h, 1);
  mb.centerGeometry();
  return {
    id: 'chem-037', orderNumber: 37, formula: 'HNO₃', nameVi: 'Nitric acid', nameEn: 'Nitric acid',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 63.01,
    geometryDescription: 'Nguyên tử N trung tâm lai hóa sp² phẳng tam giác liên kết với 2 O đầu mạch (1.21 Å) và 1 nhóm –OH (1.41 Å).',
    properties: ['Acid mạnh, có tính oxi hóa rất mạnh', 'Dễ bị phân hủy bởi ánh sáng tạo NO₂'],
    applications: ['Sản xuất phân đạm NH₄NO₃', 'Chế tạo thuốc nổ, khắc kim loại'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildH2SO4(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const s = mb.addAtom('S', 0, 0, 0);
  const o1 = mb.addAtom('O', 0, 1.15, 0.85);
  const o2 = mb.addAtom('O', 0, -1.15, 0.85);
  const oh1 = mb.addAtom('O', 1.25, 0, -0.95);
  const oh2 = mb.addAtom('O', -1.25, 0, -0.95);
  const h1 = mb.addAtom('H', 1.85, 0.72, -1.15);
  const h2 = mb.addAtom('H', -1.85, -0.72, -1.15);
  mb.addBond(s, o1, 2); mb.addBond(s, o2, 2);
  mb.addBond(s, oh1, 1); mb.addBond(s, oh2, 1);
  mb.addBond(oh1, h1, 1); mb.addBond(oh2, h2, 1);
  mb.centerGeometry();
  return {
    id: 'chem-038', orderNumber: 38, formula: 'H₂SO₄', nameVi: 'Sulfuric acid', nameEn: 'Sulfuric acid',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 98.08,
    geometryDescription: 'Nguyên tử S trung tâm có phối trí tứ diện biến dạng với 2 liên kết S=O (1.42 Å) và 2 nhóm –OH (1.57 Å).',
    properties: ['Chất lỏng sánh không màu, hút ẩm rất mạnh', 'Acid hai nấc mạnh; H₂SO₄ đặc oxi hóa mạnh và gây bỏng nặng'],
    applications: ['Hóa chất công nghiệp hàng đầu: sản xuất phân bón, ắc quy chì', 'Xử lý bề mặt kim loại, tổng hợp hữu cơ'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildH3PO4(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const p = mb.addAtom('P', 0, 0, 0);
  const oTop = mb.addAtom('O', 0, 1.47, 0);
  const r = 1.48;
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3;
    const o = mb.addAtom('O', r * Math.cos(phi), -0.52, r * Math.sin(phi));
    const h = mb.addAtom('H', (r + 0.78) * Math.cos(phi + 0.35), -0.98, (r + 0.78) * Math.sin(phi + 0.35));
    mb.addBond(p, o, 1);
    mb.addBond(o, h, 1);
  }
  mb.addBond(p, oTop, 2);
  mb.centerGeometry();
  return {
    id: 'chem-039', orderNumber: 39, formula: 'H₃PO₄', nameVi: 'Phosphoric acid', nameEn: 'Phosphoric acid',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 98.0,
    geometryDescription: 'Nguyên tử P trung tâm có cấu trúc tứ diện gồm 1 liên kết P=O (1.47 Å) và 3 nhóm –OH.',
    properties: ['Acid ba nấc có độ mạnh trung bình', 'Không có tính oxi hóa mạnh như HNO₃'],
    applications: ['Sản xuất phân supephosphat', 'Chất điều chỉnh độ chua thực phẩm, xử lý gỉ sét'], source: 'NIST', validationStatus: 'verified',
  };
}

function buildH2CO3(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const c = mb.addAtom('C', 0, 0, 0);
  const oTop = mb.addAtom('O', 0, 1.22, 0);
  const oL = mb.addAtom('O', -1.16, -0.67, 0);
  const oR = mb.addAtom('O', 1.16, -0.67, 0);
  const hL = mb.addAtom('H', -1.92, -0.10, 0);
  const hR = mb.addAtom('H', 1.92, -0.10, 0);
  mb.addBond(c, oTop, 2);
  mb.addBond(c, oL, 1);
  mb.addBond(c, oR, 1);
  mb.addBond(oL, hL, 1);
  mb.addBond(oR, hR, 1);
  mb.centerGeometry();
  return {
    id: 'chem-040', orderNumber: 40, formula: 'H₂CO₃', nameVi: 'Carbonic acid', nameEn: 'Carbonic acid',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 62.03,
    geometryDescription: 'Phân tử phẳng tam giác quanh nguyên tử C sp² (C=O và 2 nhóm –OH).',
    properties: ['Acid yếu không bền, dễ phân hủy thành CO₂ và H₂O', 'Đóng vai trò hệ đệm quan trọng trong máu và đại dương'],
    applications: ['Nước giải khát có ga', 'Hệ đệm sinh hóa HCO₃⁻ / H₂CO₃'], source: 'NIST', validationStatus: 'verified',
  };
}

function buildPCl5(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const p = mb.addAtom('P', 0, 0, 0);
  const ax1 = mb.addAtom('Cl', 0, 2.12, 0);
  const ax2 = mb.addAtom('Cl', 0, -2.12, 0);
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3;
    const eq = mb.addAtom('Cl', 2.02 * Math.cos(phi), 0, 2.02 * Math.sin(phi));
    mb.addBond(p, eq, 1);
  }
  mb.addBond(p, ax1, 1);
  mb.addBond(p, ax2, 1);
  return {
    id: 'chem-043', orderNumber: 43, formula: 'PCl₅', nameVi: 'Phosphorus pentachloride (pha khí)', nameEn: 'Phosphorus pentachloride',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 208.24,
    geometryDescription: 'Hình lưỡng tháp tam giác (D3h): 3 Cl xích đạo (2.02 Å, góc 120°) và 2 Cl trục (2.12 Å, góc 180°).',
    properties: ['Ở pha khí tồn tại dạng phân tử rời rạc PCl₅; thủy phân mạnh trong nước tạo H₃PO₄ và HCl'],
    applications: ['Tác nhân clo hóa trong tổng hợp hữu cơ'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildSF6(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const s = mb.addAtom('S', 0, 0, 0);
  const d = 1.564;
  const coords: [number, number, number][] = [[d,0,0],[-d,0,0],[0,d,0],[0,-d,0],[0,0,d],[0,0,-d]];
  for (const [x, y, z] of coords) {
    const f = mb.addAtom('F', x, y, z);
    mb.addBond(s, f, 1);
  }
  return {
    id: 'chem-044', orderNumber: 44, formula: 'SF₆', nameVi: 'Sulfur hexafluoride', nameEn: 'Sulfur hexafluoride',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 146.06,
    geometryDescription: 'Hình bát diện đều (Oh), 6 liên kết S–F bằng nhau (1.564 Å), mọi góc kề đều bằng 90°.',
    properties: ['Khí rất nặng, trơ về mặt hóa học và cách điện cực tốt', 'Khí nhà kính có tiềm năng làm nóng toàn cầu cao'],
    applications: ['Khí cách điện trong thiết bị đóng cắt cao thế'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildSiH4(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const si = mb.addAtom('Si', 0, 0, 0);
  const k = 1.48 / Math.sqrt(3);
  for (const [sx, sy, sz] of [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]) {
    const h = mb.addAtom('H', sx * k, sy * k, sz * k);
    mb.addBond(si, h, 1);
  }
  return {
    id: 'chem-045', orderNumber: 45, formula: 'SiH₄', nameVi: 'Silane', nameEn: 'Silane',
    category: 'inorganic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 32.12,
    geometryDescription: 'Cấu trúc tứ diện đều (Td), d(Si–H) = 1.480 Å, góc H–Si–H = 109.47°.',
    properties: ['Khí không màu, tự bốc cháy trong không khí tạo SiO₂ và H₂O'],
    applications: ['Lắng đọng màng mỏng silic trong công nghiệp bán dẫn và pin mặt trời'], source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

// Ionic Crystal Builders (representative multi-ion lattice blocks, never single isolated ion pairs)
function buildRocksaltModel(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  cat: string, an: string, a: number, props: string[], apps: string[],
): ChemicalModel {
  const rs = buildRocksalt3x3x3(cat, an, a, 1, -1);
  return {
    id, orderNumber, formula, nameVi, nameEn,
    category: 'inorganic', structureType: 'ionic-crystal',
    atoms: rs.atoms, bonds: rs.bonds, lattice: rs.lattice,
    molarMass: cat === 'Na' && an === 'Cl' ? 58.44 : cat === 'K' ? 74.55 : 41.99,
    geometryDescription: `Mạng tinh thể ion lập phương kiểu rocksalt (a = ${a} Å), mỗi cation phối trí 6 với anion và ngược lại.`,
    properties: props, applications: apps, source: 'COD', validationStatus: 'verified',
  };
}

function buildFluoriteCaF2(): ChemicalModel {
  // CaF2 fluorite: Ca at FCC corners & faces, F at tetrahedral 1/4 positions
  const a = 5.463;
  const h = a / 2;
  const q = a / 4;
  const mb = new MoleculeBuilder();
  const caIds: number[] = [];
  for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) caIds.push(mb.addAtom('Ca', x, y, z, 2));
  for (const [x, y, z] of [[-h,0,0],[h,0,0],[0,-h,0],[0,h,0],[0,0,-h],[0,0,h]]) caIds.push(mb.addAtom('Ca', x, y, z, 2));
  const fIds: number[] = [];
  for (const x of [-q, q]) for (const y of [-q, q]) for (const z of [-q, q]) fIds.push(mb.addAtom('F', x, y, z, -1));
  for (const fid of fIds) {
    const fp = mb.pos(fid);
    for (const cid of caIds) {
      const cp = mb.pos(cid);
      if (Math.hypot(fp[0]-cp[0], fp[1]-cp[1], fp[2]-cp[2]) < a * 0.48) {
        mb.addBond(fid, cid, 1, 'ionic-coordination');
      }
    }
  }
  const lattice: LatticeData = {
    crystalSystem: 'cubic', bravaisType: 'F', a, b: a, c: a, alpha: 90, beta: 90, gamma: 90,
    cellRepresentationNote: 'Ô cơ sở mạng tinh thể fluorite (a = 5.463 Å): Ca²⁺ chiếm nút FCC (phối trí 8), F⁻ chiếm 8 hốc tứ diện (phối trí 4).',
  };
  return {
    id: 'chem-054', orderNumber: 54, formula: 'CaF₂', nameVi: 'Calcium fluoride', nameEn: 'Calcium fluoride (fluorite)',
    category: 'inorganic', structureType: 'ionic-crystal', atoms: mb.atoms, bonds: mb.bonds, lattice, molarMass: 78.07,
    geometryDescription: 'Mạng tinh thể fluorite lập phương: tỉ lệ phối trí Ca²⁺ : F⁻ = 8 : 4.',
    properties: ['Khoáng vật fluorit bền vững, ít tan trong nước', 'Trong suốt từ vùng tử ngoại đến hồng ngoại'],
    applications: ['Nguyên liệu sản xuất HF', 'Thấu kính quang học đặc biệt, chất trợ dung luyện thép'],
    source: 'COD', validationStatus: 'verified',
  };
}

function buildDihalideCrystal(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  metal: string, a: number, c: number, molarMass: number, note: string, props: string[], apps: string[],
): ChemicalModel {
  // Representative 2x2 layered/rutile coordination block showing 6-coordinated metal octahedra
  const mb = new MoleculeBuilder();
  const mIds: number[] = [];
  for (const ix of [-1, 1]) {
    for (const iz of [-1, 1]) {
      mIds.push(mb.addAtom(metal, ix * (a * 0.55), 0, iz * (a * 0.55), 2));
    }
  }
  const clIds: number[] = [];
  for (const ix of [-1.5, 0, 1.5]) {
    for (const iz of [-1.5, 0, 1.5]) {
      clIds.push(mb.addAtom('Cl', ix * (a * 0.48), c * 0.28, iz * (a * 0.48), -1));
      clIds.push(mb.addAtom('Cl', ix * (a * 0.48), -c * 0.28, iz * (a * 0.48), -1));
    }
  }
  for (const mid of mIds) {
    const mp = mb.pos(mid);
    for (const cid of clIds) {
      const cp = mb.pos(cid);
      if (Math.hypot(mp[0]-cp[0], mp[1]-cp[1], mp[2]-cp[2]) < 3.1) {
        mb.addBond(mid, cid, 1, 'ionic-coordination');
      }
    }
  }
  return {
    id, orderNumber, formula, nameVi, nameEn,
    category: 'inorganic', structureType: 'ionic-crystal',
    atoms: mb.atoms, bonds: mb.bonds,
    lattice: { crystalSystem: 'orthorhombic', bravaisType: 'P', a, b: a, c, alpha: 90, beta: 90, gamma: 90, cellRepresentationNote: note },
    molarMass,
    geometryDescription: `Khối đại diện mạng tinh thể ion ${formula}, ion ${metal}²⁺ nằm ở tâm bát diện phối trí với 6 ion Cl⁻.`,
    properties: props, applications: apps, source: 'COD', validationStatus: 'verified',
  };
}

function buildHydroxideCrystal(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  metal: string, charge: 1 | 2, a: number, molarMass: number, props: string[], apps: string[],
): ChemicalModel {
  // Representative 2x2x1 lattice block of metal cations and OH- ions
  const mb = new MoleculeBuilder();
  const mIds: number[] = [];
  for (const ix of [-1, 1]) {
    for (const iz of [-1, 1]) {
      mIds.push(mb.addAtom(metal, ix * (a * 0.5), 0, iz * (a * 0.5), charge));
    }
  }
  const oIds: number[] = [];
  for (const [ox, oy, oz] of [[0, 1.4, 0], [0, -1.4, 0], [-a*0.95, 1.4, 0], [a*0.95, -1.4, 0], [0, 1.4, a*0.95], [0, -1.4, -a*0.95]]) {
    const oid = mb.addAtom('O', ox, oy, oz, -1);
    const hid = mb.addAtom('H', ox, oy + (oy > 0 ? 0.96 : -0.96), oz);
    mb.addBond(oid, hid, 1, 'covalent');
    oIds.push(oid);
  }
  for (const mid of mIds) {
    const mp = mb.pos(mid);
    for (const oid of oIds) {
      const op = mb.pos(oid);
      if (Math.hypot(mp[0]-op[0], mp[1]-op[1], mp[2]-op[2]) < 3.4) {
        mb.addBond(mid, oid, 1, 'ionic-coordination');
      }
    }
  }
  return {
    id, orderNumber, formula, nameVi, nameEn,
    category: 'inorganic', structureType: 'ionic-crystal',
    atoms: mb.atoms, bonds: mb.bonds,
    lattice: {
      crystalSystem: 'tetragonal', bravaisType: 'P', a, b: a, c: 5.0, alpha: 90, beta: 90, gamma: 90,
      cellRepresentationNote: `Khối đại diện mạng tinh thể bazơ kiềm/kiềm thổ ${formula}: chứa cả mạng cation ${metal}${charge > 1 ? '²⁺' : '⁺'} và nhóm cộng hóa trị OH⁻.`,
    },
    molarMass,
    geometryDescription: `Mạng tinh thể ion phân lớp gồm cation ${metal} phối trí với nguyên tử O của các nhóm OH⁻.`,
    properties: props, applications: apps, source: 'COD', validationStatus: 'verified',
  };
}

function buildCarbonateCrystal(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  metal: string, hasH: boolean, molarMass: number, props: string[], apps: string[],
): ChemicalModel {
  // Representative crystal block showing planar trigonal CO3^2- (or HCO3-) groups coordinated by metal cations
  const mb = new MoleculeBuilder();
  const centers: [number, number, number][] = [[-2.2, 0, 0], [2.2, 0, 0]];
  const oxygens: number[] = [];
  centers.forEach(([cx, cy, cz], idx) => {
    const c = mb.addAtom('C', cx, cy, cz);
    for (let k = 0; k < 3; k++) {
      const phi = (k * 2 * Math.PI) / 3 + idx * 0.4;
      const ox = cx + 1.28 * Math.cos(phi);
      const oz = cz + 1.28 * Math.sin(phi);
      const oid = mb.addAtom('O', ox, cy, oz);
      mb.addBond(c, oid, k === 0 && hasH ? 1 : 1.5, 'covalent');
      oxygens.push(oid);
      if (hasH && k === 0) {
        const hid = mb.addAtom('H', ox + 0.96 * Math.cos(phi + 0.4), cy, oz + 0.96 * Math.sin(phi + 0.4));
        mb.addBond(oid, hid, 1, 'covalent');
      }
    }
  });
  const catPos: [number, number, number][] = [[0, 1.9, 0], [0, -1.9, 0], [-3.8, 1.6, 0], [3.8, -1.6, 0]];
  for (const [mx, my, mz] of catPos) {
    const mid = mb.addAtom(metal, mx, my, mz, metal === 'Ca' ? 2 : 1);
    const mp = mb.pos(mid);
    for (const oid of oxygens) {
      const op = mb.pos(oid);
      if (Math.hypot(mp[0]-op[0], mp[1]-op[1], mp[2]-op[2]) < 3.6) {
        mb.addBond(mid, oid, 1, 'ionic-coordination');
      }
    }
  }
  return {
    id, orderNumber, formula, nameVi, nameEn,
    category: 'inorganic', structureType: 'ionic-crystal',
    atoms: mb.atoms, bonds: mb.bonds,
    lattice: {
      crystalSystem: 'trigonal', bravaisType: 'P', a: 4.99, b: 4.99, c: 17.06, alpha: 90, beta: 90, gamma: 120,
      cellRepresentationNote: `Khối mạng tinh thể muối ${formula}: thể hiện các nhóm phẳng tam giác ${hasH ? 'HCO₃⁻' : 'CO₃²⁻'} phối trí với cation ${metal} trong tinh thể.`,
    },
    molarMass,
    geometryDescription: `Tinh thể ion chứa nhóm ${hasH ? 'HCO₃⁻' : 'CO₃²⁻'} phẳng (C lai hóa sp², góc 120°) liên kết ion với mạng ${metal}.`,
    properties: props, applications: apps, source: 'COD', validationStatus: 'verified',
  };
}

export const INORGANIC_40: ChemicalModel[] = [
  makeBent('chem-021', 21, 'H₂O', 'Nước', 'Water', 'O', 'H', 0.9584, 104.45, 1, 'Phân tử dạng chữ V (góc H–O–H = 104.45°, d(O–H) = 0.958 Å).', ['Phân tử phân cực mạnh, tạo mạng liên kết hydrogen', 'Dung môi phân cực phổ biến nhất'], ['Sinh học, nông nghiệp, công nghiệp', 'Chất tải nhiệt và dung môi hóa học']),
  buildH2O2(),
  makeLinear2('chem-023', 23, 'CO', 'Carbon monoxide', 'Carbon monoxide', 'C', 'O', 1.1283, 3, 'Phân tử thẳng có liên kết ba (1 liên kết cho–nhận), d(C≡O) = 1.128 Å.', ['Khí không màu, không mùi, rất độc do gắn chặt hemoglobin', 'Tính khử mạnh ở nhiệt độ cao'], ['Khử oxit kim loại trong luyện kim', 'Tổng hợp hữu cơ (khí tổng hợp CO + H₂)']),
  makeLinear3('chem-024', 24, 'CO₂', 'Carbon dioxide', 'Carbon dioxide', 'O', 'C', 'O', 1.162, 1.162, 2, 2, 'Phân tử thẳng đối xứng (góc 180°, không phân cực), d(C=O) = 1.162 Å.', ['Khí nặng hơn không khí, không duy trì sự cháy', 'Chất khí gây hiệu ứng nhà kính'], ['Chữa cháy, bảo quản lạnh (nước đá khô)', 'Sản xuất nước giải khát có ga, quang hợp thực vật']),
  makePyramidal('chem-025', 25, 'NH₃', 'Ammonia', 'Ammonia', 'N', 'H', 1.012, 106.7, 'Hình chóp tam giác (góc H–N–H = 106.7°, d(N–H) = 1.012 Å).', ['Khí mùi khai, tan rất tốt trong nước tạo môi trường bazơ yếu', 'Có tính khử'], ['Sản xuất phân đạm, acid HNO₃', 'Chất làm lạnh công nghiệp']),
  makeLinear2('chem-026', 26, 'HCl', 'Hydrogen chloride', 'Hydrogen chloride', 'H', 'Cl', 1.2745, 1, 'Phân tử hai nguyên tử phân cực, d(H–Cl) = 1.275 Å.', ['Khí mùi xốc, tan rất nhiều trong nước tạo acid mạnh HCl'], ['Sản xuất acid clohidric, tẩy gỉ thép', 'Tổng hợp PVC và hóa chất vô cơ']),
  makeLinear2('chem-027', 27, 'HF', 'Hydrogen fluoride', 'Hydrogen fluoride', 'H', 'F', 0.9168, 1, 'Phân tử phân cực rất mạnh, d(H–F) = 0.917 Å.', ['Dung dịch HF là acid yếu nhưng ăn mòn thủy tinh (SiO₂)'], ['Khắc thủy tinh, làm sạch wafer bán dẫn']),
  makeLinear2('chem-028', 28, 'HBr', 'Hydrogen bromide', 'Hydrogen bromide', 'H', 'Br', 1.4144, 1, 'Phân tử hai nguyên tử thẳng, d(H–Br) = 1.414 Å.', ['Dung dịch HBr là acid mạnh hơn HCl, dễ bị oxi hóa'], ['Tổng hợp bromua hữu cơ, chất xúc tác']),
  makeLinear2('chem-029', 29, 'HI', 'Hydrogen iodide', 'Hydrogen iodide', 'H', 'I', 1.609, 1, 'Phân tử hai nguyên tử thẳng, d(H–I) = 1.609 Å.', ['Dung dịch HI là acid mạnh nhất trong dãy HX và có tính khử mạnh'], ['Chất khử mạnh trong tổng hợp hữu cơ']),
  makeBent('chem-030', 30, 'H₂S', 'Hydrogen sulfide', 'Hydrogen sulfide', 'S', 'H', 1.336, 92.1, 1, 'Phân tử dạng chữ V (góc H–S–H = 92.1°, d(S–H) = 1.336 Å).', ['Khí mùi trứng thối, rất độc', 'Tính khử mạnh, cháy trong oxi'], ['Thuốc thử nhận biết ion kim loại nặng (Cu²⁺, Pb²⁺)']),
  makeBent('chem-031', 31, 'SO₂', 'Sulfur dioxide', 'Sulfur dioxide', 'S', 'O', 1.431, 119.3, 1.5, 'Phân tử dạng chữ V (góc O–S–O = 119.3°, d(S–O) = 1.431 Å).', ['Khí mùi hắc, độc, là oxit acid', 'Có cả tính khử và tính oxi hóa; gây mưa acid'], ['Sản xuất acid H₂SO₄', 'Tẩy trắng bột giấy, bảo quản hoa quả sấy']),
  makeTrigonalPlanar('chem-032', 32, 'SO₃', 'Sulfur trioxide', 'Sulfur trioxide', 'S', 'O', 1.42, 2, 'Phân tử phẳng tam giác đều D3h (góc 120°, d(S=O) = 1.420 Å).', ['Tác dụng mãnh liệt với nước tạo H₂SO₄'], ['Sản xuất công nghiệp acid sulfuric (oleum)']),
  makeLinear2('chem-033', 33, 'NO', 'Nitrogen monoxide', 'Nitric oxide', 'N', 'O', 1.1508, 2, 'Phân tử hai nguyên tử thẳng (gốc tự do 11 electron hóa trị), d(N–O) = 1.151 Å.', ['Khí không màu, dễ kết hợp với O₂ tạo NO₂ màu nâu đỏ'], ['Chất truyền tin sinh học điều hòa mạch máu']),
  makeBent('chem-034', 34, 'NO₂', 'Nitrogen dioxide', 'Nitrogen dioxide', 'N', 'O', 1.197, 134.1, 1.5, 'Phân tử dạng chữ V (góc O–N–O = 134.1°, d(N–O) = 1.197 Å).', ['Khí màu nâu đỏ, mùi hắc, độc; dễ đime hóa thành N₂O₄'], ['Sản xuất acid nitric HNO₃']),
  makeLinear3('chem-035', 35, 'N₂O', 'Dinitrogen monoxide', 'Nitrous oxide', 'N', 'N', 'O', 1.128, 1.184, 3, 1, 'Phân tử thẳng bất đối xứng N≡N–O (180°), d(N–N) = 1.128 Å, d(N–O) = 1.184 Å.', ['Khí không màu, duy trì sự cháy mạnh hơn không khí khi đun nóng'], ['Gây mê trong nha khoa/y tế (khi được kiểm soát), chất đẩy thực phẩm']),
  buildN2O4(),
  buildHNO3(),
  buildH2SO4(),
  buildH3PO4(),
  buildH2CO3(),
  makeTrigonalPlanar('chem-041', 41, 'BF₃', 'Boron trifluoride', 'Boron trifluoride', 'B', 'F', 1.313, 1, 'Phân tử phẳng tam giác đều (D3h, góc 120°, d(B–F) = 1.313 Å).', ['Acid Lewis mạnh do nguyên tử B thiếu octet (6e)'], ['Chất xúc tác phản ứng Friedel–Crafts và trùng hợp']),
  makePyramidal('chem-042', 42, 'PCl₃', 'Phosphorus trichloride', 'Phosphorus trichloride', 'P', 'Cl', 2.043, 100.3, 'Hình chóp tam giác (góc Cl–P–Cl = 100.3°, d(P–Cl) = 2.043 Å).', ['Chất lỏng bốc khói trong không khí ẩm, thủy phân tạo H₃PO₃ và HCl'], ['Nguyên liệu sản xuất thuốc trừ sâu, chất hóa dẻo']),
  buildPCl5(),
  buildSF6(),
  buildSiH4(),
  makePyramidal('chem-046', 46, 'PH₃', 'Phosphine', 'Phosphine', 'P', 'H', 1.421, 93.3, 'Hình chóp tam giác (góc H–P–H = 93.3°, d(P–H) = 1.421 Å).', ['Khí rất độc, mùi tỏi thối; tạp chất P₂H₄ gây tự cháy ("ma trơi")'], ['Pha tạp chất n-type trong bán dẫn, chất xông khử trùng kho hạt']),
  makeLinear3('chem-047', 47, 'CS₂', 'Carbon disulfide', 'Carbon disulfide', 'S', 'C', 'S', 1.553, 1.553, 2, 2, 'Phân tử thẳng đối xứng (180°, d(C=S) = 1.553 Å).', ['Chất lỏng dễ bay hơi, rất dễ cháy, hòa tan tốt lưu huỳnh và photpho trắng'], ['Dung môi công nghiệp, sản xuất tơ visco và CCl₄']),
  makeLinear3('chem-048', 48, 'OCS', 'Carbonyl sulfide', 'Carbonyl sulfide', 'O', 'C', 'S', 1.157, 1.56, 2, 2, 'Phân tử thẳng bất đối xứng O=C=S (180°).', ['Khí có cực nhẹ, thủy phân chậm tạo CO₂ và H₂S'], ['Chất trung gian trong chu trình lưu huỳnh khí quyển']),
  buildRocksaltModel('chem-049', 49, 'NaCl', 'Sodium chloride', 'Sodium chloride (rocksalt)', 'Na', 'Cl', 5.64, ['Tinh thể ion màu trắng, dễ tan trong nước', 'Nhiệt độ nóng chảy cao (801 °C), dẫn điện khi nóng chảy/dung dịch'], ['Muối ăn, bảo quản thực phẩm', 'Điện phân sản xuất NaOH, Cl₂, Na']),
  buildRocksaltModel('chem-050', 50, 'KCl', 'Potassium chloride', 'Potassium chloride (rocksalt)', 'K', 'Cl', 6.292, ['Tinh thể trắng vị hơi đắng, tan tốt trong nước', 'Đốt trên ngọn lửa cho màu tím'], ['Phân kali cung cấp K cho cây trồng', 'Bổ sung điện giải trong y tế']),
  buildDihalideCrystal('chem-051', 51, 'CaCl₂', 'Calcium chloride', 'Calcium chloride', 'Ca', 6.24, 4.2, 110.98, 'Khối mạng tinh thể CaCl₂ (cấu trúc kiểu rutile biến dạng, Ca²⁺ phối trí bát diện 6 Cl⁻).', ['Chất rắn trắng hút ẩm cực mạnh', 'Hòa tan tỏa nhiệt lớn'], ['Chất hút ẩm công nghiệp, làm tan băng trên đường']),
  buildDihalideCrystal('chem-052', 52, 'MgCl₂', 'Magnesium chloride', 'Magnesium chloride', 'Mg', 3.63, 5.9, 95.21, 'Khối mạng tinh thể phân lớp kiểu CdCl₂ (Mg²⁺ phối trí 6 Cl⁻ trong mỗi lớp Cl–Mg–Cl).', ['Tinh thể trắng, dễ chảy rữa trong không khí ẩm', 'Có nhiều trong nước biển'], ['Điện phân nóng chảy điều chế Mg kim loại', 'Làm chất đông tụ đậu phụ (nigari)']),
  buildRocksaltModel('chem-053', 53, 'NaF', 'Sodium fluoride', 'Sodium fluoride (rocksalt)', 'Na', 'F', 4.634, ['Tinh thể ion kiểu NaCl, tan vừa trong nước'], ['Thành phần chống sâu răng trong kem đánh răng', 'Chất bảo quản gỗ']),
  buildFluoriteCaF2(),
  buildHydroxideCrystal('chem-055', 55, 'NaOH', 'Sodium hydroxide', 'Sodium hydroxide', 'Na', 1, 3.4, 40.0, ['Kiềm mạnh (xút ăn da), hút ẩm mạnh và ăn mòn da, vải', 'Hấp thụ CO₂ tạo muối cacbonat'], ['Sản xuất xà phòng, giấy, tơ nhân tạo', 'Tinh chế quặng bauxite (Al₂O₃)']),
  buildHydroxideCrystal('chem-056', 56, 'KOH', 'Potassium hydroxide', 'Potassium hydroxide', 'K', 1, 3.95, 56.11, ['Bazơ kiềm rất mạnh, dễ tan trong nước và cồn'], ['Sản xuất xà phòng mềm, chất điện phân pin kiềm', 'Hấp thụ khí CO₂ trong phòng thí nghiệm']),
  buildHydroxideCrystal('chem-057', 57, 'Ca(OH)₂', 'Calcium hydroxide', 'Calcium hydroxide (portlandite)', 'Ca', 2, 3.59, 74.09, ['Chất rắn trắng ít tan trong nước (nước vôi trong)', 'Hấp thụ CO₂ tạo kết tủa trắng CaCO₃'], ['Vật liệu xây dựng (vữa vôi), khử chua đất trồng trọt']),
  buildCarbonateCrystal('chem-058', 58, 'Na₂CO₃', 'Sodium carbonate', 'Sodium carbonate', 'Na', false, 105.99, ['Muối trung hòa dễ tan, dung dịch có môi trường kiềm do thủy phân'], ['Sản xuất thủy tinh, xà phòng, làm mềm nước cứng']),
  buildCarbonateCrystal('chem-059', 59, 'NaHCO₃', 'Sodium hydrogen carbonate', 'Sodium bicarbonate', 'Na', true, 84.01, ['Muối lưỡng tính (tác dụng cả acid và kiềm)', 'Bị nhiệt phân ở ~100–200 °C giải phóng khí CO₂'], ['Bột nở làm bánh (baking soda)', 'Thuốc giảm đau dạ dày do dư acid']),
  buildCarbonateCrystal('chem-060', 60, 'CaCO₃', 'Calcium carbonate', 'Calcium carbonate (calcite)', 'Ca', false, 100.09, ['Chất rắn trắng không tan trong nước, tan trong dung dịch chứa CO₂ hoặc acid', 'Nhiệt phân tạo vôi sống CaO và CO₂'], ['Đá vôi sản xuất xi măng, vôi sống', 'Chất độn sơn, nhựa, giấy']),
];

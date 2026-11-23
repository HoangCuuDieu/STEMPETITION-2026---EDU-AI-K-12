import type { Atom3D, Bond3D, ChemicalModel, LatticeData } from '../../types/chemistry';
import {
  ATOMIC_NUMBER,
  MoleculeBuilder,
  buildBCCUnitCell,
  buildFCCUnitCell,
  computeMolarMass,
} from './geometryBuilder';

function diatomic(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  el: string,
  bondLen: number,
  bondOrder: 1 | 2 | 3,
  geometryDescription: string,
  properties: string[],
  applications: string[],
): ChemicalModel {
  const half = Math.round((bondLen / 2) * 10000) / 10000;
  const z = ATOMIC_NUMBER[el];
  const atoms: Atom3D[] = [
    { id: 1, element: el, atomicNumber: z, x: -half, y: 0, z: 0 },
    { id: 2, element: el, atomicNumber: z, x: half, y: 0, z: 0 },
  ];
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'element',
    structureType: 'molecule',
    atoms,
    bonds: [{ fromAtomId: 1, toAtomId: 2, order: bondOrder, type: 'covalent' }],
    molarMass: computeMolarMass(atoms),
    geometryDescription,
    properties,
    applications,
    source: 'NIST CCCBDB / CRC Handbook',
    validationStatus: 'verified',
  };
}

function monatomic(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  properties: string[],
  applications: string[],
): ChemicalModel {
  const atoms: Atom3D[] = [
    { id: 1, element: formula, atomicNumber: ATOMIC_NUMBER[formula], x: 0, y: 0, z: 0 },
  ];
  return {
    id,
    orderNumber,
    nameVi,
    nameEn,
    formula,
    category: 'element',
    structureType: 'monatomic',
    atoms,
    bonds: [],
    molarMass: computeMolarMass(atoms),
    geometryDescription: 'Nguyên tử đơn lẻ (khí hiếm có lớp vỏ electron ngoài cùng bão hòa bền vững).',
    properties,
    applications,
    source: 'IUPAC / CRC Handbook',
    validationStatus: 'verified',
  };
}

function buildP4(): { atoms: Atom3D[]; bonds: Bond3D[] } {
  // Regular tetrahedron with d(P-P) = 2.21 Å => a = 2.21 / (2*sqrt(2)) = 0.7814
  const a = 0.7814;
  const mb = new MoleculeBuilder();
  const p1 = mb.addAtom('P', a, a, a);
  const p2 = mb.addAtom('P', a, -a, -a);
  const p3 = mb.addAtom('P', -a, a, -a);
  const p4 = mb.addAtom('P', -a, -a, a);
  mb.addBond(p1, p2, 1);
  mb.addBond(p1, p3, 1);
  mb.addBond(p1, p4, 1);
  mb.addBond(p2, p3, 1);
  mb.addBond(p2, p4, 1);
  mb.addBond(p3, p4, 1);
  return { atoms: mb.atoms, bonds: mb.bonds };
}

function buildS8(): { atoms: Atom3D[]; bonds: Bond3D[] } {
  // Crown D4d ring: R = 1.69 Å, z = ±0.49 Å => d(S-S) ≈ 2.05 Å, angle ≈ 108°
  const mb = new MoleculeBuilder();
  const R = 1.69;
  const zAmp = 0.49;
  const ids: number[] = [];
  for (let i = 0; i < 8; i++) {
    const phi = (i * Math.PI) / 4;
    const z = i % 2 === 0 ? zAmp : -zAmp;
    ids.push(mb.addAtom('S', R * Math.cos(phi), R * Math.sin(phi), z));
  }
  for (let i = 0; i < 8; i++) {
    mb.addBond(ids[i], ids[(i + 1) % 8], 1);
  }
  return { atoms: mb.atoms, bonds: mb.bonds };
}

function buildMgHCP(): { atoms: Atom3D[]; bonds: Bond3D[]; lattice: LatticeData } {
  const a = 3.209;
  const c = 5.211;
  const mb = new MoleculeBuilder();
  // Bottom layer A
  const botCenter = mb.addAtom('Mg', 0, -c / 2, 0);
  const botRing: number[] = [];
  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    botRing.push(mb.addAtom('Mg', a * Math.cos(ang), -c / 2, a * Math.sin(ang)));
  }
  // Middle layer B (3 atoms)
  const rMid = a / Math.sqrt(3);
  const midIds: number[] = [];
  for (let k = 0; k < 3; k++) {
    const ang = (k * 2 * Math.PI) / 3 + Math.PI / 6;
    midIds.push(mb.addAtom('Mg', rMid * Math.cos(ang), 0, rMid * Math.sin(ang)));
  }
  // Top layer A
  const topCenter = mb.addAtom('Mg', 0, c / 2, 0);
  const topRing: number[] = [];
  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    topRing.push(mb.addAtom('Mg', a * Math.cos(ang), c / 2, a * Math.sin(ang)));
  }

  for (let i = 0; i < 6; i++) {
    mb.addBond(botCenter, botRing[i], 1, 'metallic');
    mb.addBond(botRing[i], botRing[(i + 1) % 6], 1, 'metallic');
    mb.addBond(topCenter, topRing[i], 1, 'metallic');
    mb.addBond(topRing[i], topRing[(i + 1) % 6], 1, 'metallic');
  }
  for (const mId of midIds) {
    mb.addBond(mId, botCenter, 1, 'metallic');
    mb.addBond(mId, topCenter, 1, 'metallic');
  }
  return {
    atoms: mb.atoms,
    bonds: mb.bonds,
    lattice: {
      crystalSystem: 'hexagonal',
      bravaisType: 'P',
      a,
      b: a,
      c,
      alpha: 90,
      beta: 90,
      gamma: 120,
      cellRepresentationNote:
        'Khối đại diện mạng tinh thể lục phương chặt (HCP, xếp lớp ABAB, a = 3.209 Å, c = 5.211 Å) trích từ tinh thể Mg.',
    },
  };
}

const p4 = buildP4();
const s8 = buildS8();
const naBCC = buildBCCUnitCell('Na', 4.291);
const mgHCP = buildMgHCP();
const alFCC = buildFCCUnitCell('Al', 4.05);
const feBCC = buildBCCUnitCell('Fe', 2.866);
const cuFCC = buildFCCUnitCell('Cu', 3.615);

export const ELEMENTS_20: ChemicalModel[] = [
  diatomic('chem-001', 1, 'H₂', 'Hydrogen', 'Hydrogen', 'H', 0.7414, 1, 'Phân tử hai nguyên tử thẳng, d(H–H) = 0.741 Å.', ['Khí không màu, nhẹ nhất trong các chất khí', 'Tính khử ở nhiệt độ cao'], ['Nhiên liệu tên lửa, pin nhiên liệu', 'Tổng hợp NH₃ và luyện kim']),
  diatomic('chem-002', 2, 'O₂', 'Oxygen', 'Oxygen', 'O', 1.2075, 2, 'Phân tử hai nguyên tử thẳng, liên kết đôi d(O=O) = 1.208 Å.', ['Khí không màu, duy trì sự cháy và hô hấp', 'Chất oxi hóa mạnh'], ['Y tế, hô hấp', 'Luyện thép, hàn cắt kim loại']),
  {
    id: 'chem-003',
    orderNumber: 3,
    nameVi: 'Ozone',
    nameEn: 'Ozone',
    formula: 'O₃',
    category: 'element',
    structureType: 'molecule',
    atoms: [
      { id: 1, element: 'O', atomicNumber: 8, x: 0, y: 0.35, z: 0 },
      { id: 2, element: 'O', atomicNumber: 8, x: 1.0885, y: -0.3197, z: 0 },
      { id: 3, element: 'O', atomicNumber: 8, x: -1.0885, y: -0.3197, z: 0 },
    ],
    bonds: [
      { fromAtomId: 1, toAtomId: 2, order: 1.5, type: 'covalent' },
      { fromAtomId: 1, toAtomId: 3, order: 1.5, type: 'covalent' },
    ],
    molarMass: 48.0,
    geometryDescription: 'Phân tử dạng chữ V (góc O–O–O = 116.8°, d(O–O) = 1.278 Å, liên kết cộng hưởng bậc 1.5).',
    properties: ['Khí màu xanh nhạt, mùi hắc', 'Tính oxi hóa rất mạnh'],
    applications: ['Hấp thụ tia cực tím ở tầng bình lưu', 'Khử trùng nước và không khí'],
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
  },
  diatomic('chem-004', 4, 'N₂', 'Nitrogen', 'Nitrogen', 'N', 1.0977, 3, 'Phân tử hai nguyên tử với liên kết ba N≡N rất bền (945 kJ/mol), d = 1.098 Å.', ['Khí không màu, kém hoạt động ở nhiệt độ thường', 'Chiếm 78% thể tích khí quyển'], ['Tổng hợp amonia (NH₃)', 'Khí trơ bảo quản thực phẩm và linh kiện']),
  diatomic('chem-005', 5, 'F₂', 'Fluorine', 'Fluorine', 'F', 1.4119, 1, 'Phân tử hai nguyên tử thẳng, d(F–F) = 1.412 Å.', ['Khí màu lục nhạt, độc', 'Phi kim có tính oxi hóa mạnh nhất'], ['Sản xuất nhựa PTFE (Teflon)', 'Làm giàu nhiên liệu hạt nhân UF₆']),
  diatomic('chem-006', 6, 'Cl₂', 'Chlorine', 'Chlorine', 'Cl', 1.9879, 1, 'Phân tử hai nguyên tử thẳng, d(Cl–Cl) = 1.988 Å.', ['Khí màu vàng lục, mùi xốc, độc', 'Tan vừa phải trong nước'], ['Khử trùng nước sinh hoạt', 'Sản xuất nhựa PVC, chất tẩy rửa']),
  diatomic('chem-007', 7, 'Br₂', 'Bromine', 'Bromine', 'Br', 2.281, 1, 'Phân tử hai nguyên tử thẳng, d(Br–Br) = 2.281 Å.', ['Chất lỏng màu nâu đỏ dễ bay hơi ở điều kiện thường', 'Gây bỏng nặng khi tiếp xúc da'], ['Sản xuất chất chống cháy', 'Tổng hợp dược phẩm và thuốc thử hữu cơ']),
  diatomic('chem-008', 8, 'I₂', 'Iodine', 'Iodine', 'I', 2.666, 1, 'Phân tử hai nguyên tử thẳng, d(I–I) = 2.666 Å.', ['Tinh thể màu đen tím có ánh kim, dễ thăng hoa', 'Làm hồ tinh bột hóa xanh tím'], ['Sát trùng vết thương (cồn iốt)', 'Bổ sung vi lượng phòng bướu cổ']),
  {
    id: 'chem-009',
    orderNumber: 9,
    nameVi: 'Phosphorus trắng',
    nameEn: 'White phosphorus',
    formula: 'P₄',
    category: 'element',
    structureType: 'molecule',
    atoms: p4.atoms,
    bonds: p4.bonds,
    molarMass: 123.9,
    geometryDescription: 'Phân tử tứ diện đều 4 đỉnh P, góc liên kết P–P–P = 60° (sức căng vòng lớn), d(P–P) = 2.21 Å.',
    properties: ['Chất rắn sáp trắng/vàng nhạt, rất độc', 'Tự bốc cháy trong không khí ở ~40 °C, phát quang trong bóng tối'],
    applications: ['Sản xuất acid H₃PO₄ tinh khiết', 'Nghiên cứu hóa học vô cơ'],
    source: 'NIST / Crystallography',
    validationStatus: 'verified',
  },
  {
    id: 'chem-010',
    orderNumber: 10,
    nameVi: 'Sulfur vòng 8 nguyên tử',
    nameEn: 'Cyclooctasulfur',
    formula: 'S₈',
    category: 'element',
    structureType: 'molecule',
    atoms: s8.atoms,
    bonds: s8.bonds,
    molarMass: 256.48,
    geometryDescription: 'Vòng 8 nguyên tử dạng vương miện (đối xứng D4d), d(S–S) = 2.05 Å, góc S–S–S ≈ 108°.',
    properties: ['Chất rắn tinh thể màu vàng chanh', 'Không tan trong nước, tan trong CS₂'],
    applications: ['Sản xuất acid H₂SO₄', 'Lưu hóa cao su, sản xuất diêm'],
    source: 'COD / Greenwood & Earnshaw',
    validationStatus: 'verified',
  },
  monatomic('chem-011', 11, 'He', 'Helium', 'Helium', ['Khí hiếm nhẹ nhất, không màu, không mùi', 'Không tham gia phản ứng hóa học ở điều kiện thường'], ['Làm lạnh sâu trong máy MRI', 'Bơm bóng thám không, khí bảo vệ hàn']),
  monatomic('chem-012', 12, 'Ne', 'Neon', 'Neon', ['Khí hiếm trơ hoàn toàn', 'Phát ánh sáng đỏ cam đặc trưng khi phóng điện'], ['Đèn neon quảng cáo', 'Laser He–Ne, chỉ thị cao áp']),
  monatomic('chem-013', 13, 'Ar', 'Argon', 'Argon', ['Chiếm ~0.93% thể tích không khí', 'Trơ về mặt hóa học'], ['Khí bảo vệ trong hàn hồ quang', 'Bơm bóng đèn sợi đốt tránh oxi hóa dây tóc']),
  {
    id: 'chem-014',
    orderNumber: 14,
    nameVi: 'Kim cương (Carbon)',
    nameEn: 'Diamond',
    formula: 'C',
    category: 'element',
    structureType: 'covalent-network',
    atoms: [
      [-1.7835, -1.7835, -1.7835], [-1.7835, -1.7835, 1.7835], [-1.7835, 0, 0], [-1.7835, 1.7835, -1.7835],
      [-1.7835, 1.7835, 1.7835], [-0.8918, -0.8918, -0.8918], [-0.8918, 0.8918, 0.8918], [0, -1.7835, 0],
      [0, 0, -1.7835], [0, 0, 1.7835], [0, 1.7835, 0], [0.8918, -0.8918, 0.8918],
      [0.8918, 0.8918, -0.8918], [1.7835, -1.7835, -1.7835], [1.7835, -1.7835, 1.7835], [1.7835, 0, 0],
      [1.7835, 1.7835, -1.7835], [1.7835, 1.7835, 1.7835],
    ].map(([x, y, z], i) => ({ id: i + 1, element: 'C', atomicNumber: 6, x, y, z })),
    bonds: [
      [0, 5], [2, 5], [2, 6], [4, 6], [5, 7], [5, 8], [6, 9], [6, 10],
      [7, 11], [8, 12], [9, 11], [10, 12], [11, 14], [11, 15], [12, 15], [12, 16],
    ].map(([a, b]) => ({ fromAtomId: a + 1, toAtomId: b + 1, order: 1 as const, type: 'covalent' as const })),
    lattice: {
      crystalSystem: 'cubic',
      bravaisType: 'F',
      a: 3.567,
      b: 3.567,
      c: 3.567,
      alpha: 90,
      beta: 90,
      gamma: 90,
      cellRepresentationNote: 'Minh họa 1 ô cơ sở mạng tinh thể kim cương (a = 3.567 Å, d(C–C) = 1.545 Å) trích từ mạng cộng hóa trị 3D vô hạn.',
    },
    molarMass: 12.01,
    geometryDescription: 'Mạng tinh thể cộng hóa trị sp³, mỗi nguyên tử C liên kết tứ diện đều với 4 nguyên tử C lân cận (góc 109.5°).',
    properties: ['Cứng nhất trong tự nhiên (10 Mohs)', 'Không dẫn điện, chiết suất ánh sáng cao'],
    applications: ['Mũi khoan, lưỡi cắt kính và vật liệu siêu cứng', 'Trang sức'],
    source: 'Crystallography Open Database',
    validationStatus: 'verified',
    isomerGroup: 'carbon-allotropes',
  },
  {
    id: 'chem-015',
    orderNumber: 15,
    nameVi: 'Graphite (Than chì)',
    nameEn: 'Graphite',
    formula: 'C',
    category: 'element',
    structureType: 'covalent-network',
    atoms: [
      [0, 0.7105, -1.677], [-1.2306, 1.421, -1.677], [-2.4612, 0.7105, -1.677], [-2.4612, -0.7105, -1.677],
      [-1.2306, -1.421, -1.677], [0, -0.7105, -1.677], [2.4612, 0.7105, -1.677], [1.2306, 1.421, -1.677],
      [1.2306, -1.421, -1.677], [2.4612, -0.7105, -1.677], [0, 2.1315, 1.677], [-1.2306, 2.842, 1.677],
      [-2.4612, 2.1315, 1.677], [-2.4612, 0.7105, 1.677], [-1.2306, 0, 1.677], [0, 0.7105, 1.677],
      [2.4612, 2.1315, 1.677], [1.2306, 2.842, 1.677], [1.2306, 0, 1.677], [2.4612, 0.7105, 1.677],
    ].map(([x, y, z], i) => ({ id: i + 1, element: 'C', atomicNumber: 6, x, y, z })),
    bonds: [
      [0, 1], [0, 5], [0, 7], [1, 2], [2, 3], [3, 4], [4, 5], [5, 8], [6, 7], [6, 9], [8, 9],
      [10, 11], [10, 15], [10, 17], [11, 12], [12, 13], [13, 14], [14, 15], [15, 18], [16, 17], [16, 19], [18, 19],
    ].map(([a, b]) => ({ fromAtomId: a + 1, toAtomId: b + 1, order: 1.5 as const, type: 'aromatic' as const })),
    lattice: {
      crystalSystem: 'hexagonal',
      bravaisType: 'P',
      a: 2.461,
      b: 2.461,
      c: 6.708,
      alpha: 90,
      beta: 90,
      gamma: 120,
      cellRepresentationNote: 'Minh họa 2 lớp lục giác phẳng xếp kiểu AB (khoảng cách giữa hai lớp = 3.354 Å, d(C–C) trong lớp = 1.421 Å).',
    },
    molarMass: 12.01,
    geometryDescription: 'Mạng cộng hóa trị phân lớp sp², mỗi nguyên tử C liên kết với 3 C trong cùng lớp tạo vòng lục giác đều (góc 120°); các lớp tương tác yếu dễ trượt lên nhau.',
    properties: ['Màu xám đen, mềm, để lại vệt trên giấy', 'Dẫn điện và dẫn nhiệt tốt theo mặt lớp'],
    applications: ['Ruột bút chì, điện cực điện phân', 'Chất bôi trơn chịu nhiệt, vật liệu pin Li-ion'],
    source: 'Crystallography Open Database',
    validationStatus: 'verified',
    isomerGroup: 'carbon-allotropes',
  },
  {
    id: 'chem-016',
    orderNumber: 16,
    nameVi: 'Sodium kim loại',
    nameEn: 'Sodium metal (BCC)',
    formula: 'Na',
    category: 'element',
    structureType: 'metal-crystal',
    atoms: naBCC.atoms,
    bonds: naBCC.bonds,
    lattice: naBCC.lattice,
    molarMass: 22.99,
    geometryDescription: 'Mạng tinh thể lập phương tâm khối (BCC, số phối trí 8).',
    properties: ['Kim loại kiềm mềm, nhẹ hơn nước, màu trắng bạc', 'Phản ứng mãnh liệt với nước tạo NaOH và H₂'],
    applications: ['Chất truyền nhiệt trong lò phản ứng hạt nhân', 'Đèn hơi natri, tổng hợp hữu cơ'],
    source: 'COD',
    validationStatus: 'verified',
  },
  {
    id: 'chem-017',
    orderNumber: 17,
    nameVi: 'Magnesium kim loại',
    nameEn: 'Magnesium metal (HCP)',
    formula: 'Mg',
    category: 'element',
    structureType: 'metal-crystal',
    atoms: mgHCP.atoms,
    bonds: mgHCP.bonds,
    lattice: mgHCP.lattice,
    molarMass: 24.31,
    geometryDescription: 'Mạng tinh thể lục phương chặt (HCP, số phối trí 12).',
    properties: ['Kim loại kiềm thổ nhẹ màu trắng bạc', 'Cháy sáng chói trong không khí'],
    applications: ['Hợp kim siêu nhẹ cho hàng không, ô tô', 'Pháo sáng và chất khử trong luyện kim'],
    source: 'COD',
    validationStatus: 'verified',
  },
  {
    id: 'chem-018',
    orderNumber: 18,
    nameVi: 'Aluminium kim loại',
    nameEn: 'Aluminium metal (FCC)',
    formula: 'Al',
    category: 'element',
    structureType: 'metal-crystal',
    atoms: alFCC.atoms,
    bonds: alFCC.bonds,
    lattice: alFCC.lattice,
    molarMass: 26.98,
    geometryDescription: 'Mạng tinh thể lập phương tâm mặt (FCC, số phối trí 12, độ đặc khít 74%).',
    properties: ['Kim loại nhẹ, bền nhờ màng oxit Al₂O₃ bảo vệ', 'Dẫn điện và dẫn nhiệt tốt'],
    applications: ['Vật liệu xây dựng, vỏ máy bay', 'Dây dẫn điện cao thế, bao bì'],
    source: 'COD',
    validationStatus: 'verified',
  },
  {
    id: 'chem-019',
    orderNumber: 19,
    nameVi: 'Iron kim loại (α-Fe)',
    nameEn: 'Iron metal (BCC α-Fe)',
    formula: 'Fe',
    category: 'element',
    structureType: 'metal-crystal',
    atoms: feBCC.atoms,
    bonds: feBCC.bonds,
    lattice: feBCC.lattice,
    molarMass: 55.85,
    geometryDescription: 'Mạng tinh thể lập phương tâm khối (BCC α-Fe, số phối trí 8, d(Fe–Fe) = 2.482 Å).',
    properties: ['Kim loại có tính sắt từ dưới 770 °C', 'Dễ rèn, độ bền cơ học cao khi tạo hợp kim thép'],
    applications: ['Sản xuất gang, thép kết cấu', 'Lõi từ máy biến áp và động cơ điện'],
    source: 'COD',
    validationStatus: 'verified',
  },
  {
    id: 'chem-020',
    orderNumber: 20,
    nameVi: 'Copper kim loại',
    nameEn: 'Copper metal (FCC)',
    formula: 'Cu',
    category: 'element',
    structureType: 'metal-crystal',
    atoms: cuFCC.atoms,
    bonds: cuFCC.bonds,
    lattice: cuFCC.lattice,
    molarMass: 63.55,
    geometryDescription: 'Mạng tinh thể lập phương tâm mặt (FCC, số phối trí 12).',
    properties: ['Kim loại màu đỏ cam, rất dẻo', 'Độ dẫn điện và dẫn nhiệt đứng hàng đầu'],
    applications: ['Lõi dây dẫn điện, cuộn dây động cơ', 'Hợp kim đồng thau (Cu–Zn), đồng thanh (Cu–Sn)'],
    source: 'COD',
    validationStatus: 'verified',
  },
];

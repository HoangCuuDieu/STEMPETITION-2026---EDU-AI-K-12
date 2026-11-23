import type { ChemicalModel } from '../../types/chemistry';
import {
  MoleculeBuilder,
  buildLinearChain,
  computeMolarMass,
} from './geometryBuilder';

const DEG = Math.PI / 180;

function makeAlkane(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  nCarbons: number,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const chain = buildLinearChain(nCarbons, 1.54, 109.5);
  const cIds = chain.map(([x, y, z]) => mb.addAtom('C', x, y, z));
  for (let i = 0; i < cIds.length - 1; i++) {
    mb.addBond(cIds[i], cIds[i + 1], 1);
  }
  for (const cid of cIds) {
    mb.fillTetrahedralH(cid, 1.09);
  }
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    formula,
    nameVi,
    nameEn,
    category: 'organic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB / PubChem',
    validationStatus: 'verified',
  };
}

function makeAlkene(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  nCarbons: number,
  geomDesc: string,
  props: string[],
  apps: string[],
  isomerGroup?: string,
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const c1 = mb.addAtom('C', -0.6695, 0, 0);
  const c2 = mb.addAtom('C', 0.6695, 0, 0);
  mb.addBond(c1, c2, 2);

  const extraCs: number[] = [];
  let prev = c2;
  let px = 0.6695 + 1.50 * Math.cos(60 * DEG);
  let py = 1.50 * Math.sin(60 * DEG);
  for (let i = 2; i < nCarbons; i++) {
    const cid = mb.addAtom('C', px, py, 0);
    mb.addBond(prev, cid, 1);
    extraCs.push(cid);
    prev = cid;
    px += 1.54 * Math.cos(35.25 * DEG);
    py += i % 2 === 0 ? -1.54 * Math.sin(35.25 * DEG) : 1.54 * Math.sin(35.25 * DEG);
  }

  mb.fillTrigonalH(c1, [0, 0, 1], 1.085, 2);
  mb.fillTrigonalH(c2, [0, 0, 1], 1.085, nCarbons === 2 ? 2 : 1);
  for (const cid of extraCs) {
    mb.fillTetrahedralH(cid, 1.09);
  }
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    formula,
    nameVi,
    nameEn,
    category: 'organic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc,
    properties: props,
    applications: apps,
    source: 'NIST CCCBDB',
    validationStatus: 'verified',
    ...(isomerGroup ? { isomerGroup } : {}),
  };
}

function makeAlkyne(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  hasMethyl: boolean,
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const c1 = mb.addAtom('C', -0.6015, 0, 0);
  const c2 = mb.addAtom('C', 0.6015, 0, 0);
  mb.addBond(c1, c2, 3);
  const h1 = mb.addAtom('H', -1.6625, 0, 0);
  mb.addBond(c1, h1, 1);
  if (hasMethyl) {
    const c3 = mb.addAtom('C', 0.6015 + 1.46, 0, 0);
    mb.addBond(c2, c3, 1);
    mb.fillTetrahedralH(c3, 1.09);
  } else {
    const h2 = mb.addAtom('H', 1.6625, 0, 0);
    mb.addBond(c2, h2, 1);
  }
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    formula,
    nameVi,
    nameEn,
    category: 'organic',
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

function makeAromatic(
  id: string,
  orderNumber: number,
  formula: string,
  nameVi: string,
  nameEn: string,
  substituent: 'H' | 'CH3' | 'C2H5' | 'OH',
  geomDesc: string,
  props: string[],
  apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const rCC = 1.397;
  const rCH = 1.087;
  const ringIds: number[] = [];
  for (let i = 0; i < 6; i++) {
    const phi = (i * Math.PI) / 3;
    ringIds.push(mb.addAtom('C', rCC * Math.cos(phi), rCC * Math.sin(phi), 0));
  }
  for (let i = 0; i < 6; i++) {
    mb.addBond(ringIds[i], ringIds[(i + 1) % 6], 1.5, 'aromatic');
  }
  // H on positions 1..5
  for (let i = 1; i < 6; i++) {
    const phi = (i * Math.PI) / 3;
    const hid = mb.addAtom('H', (rCC + rCH) * Math.cos(phi), (rCC + rCH) * Math.sin(phi), 0);
    mb.addBond(ringIds[i], hid, 1);
  }
  // Substituent at position 0 (x = +rCC, y = 0)
  if (substituent === 'H') {
    const hid = mb.addAtom('H', rCC + rCH, 0, 0);
    mb.addBond(ringIds[0], hid, 1);
  } else if (substituent === 'CH3') {
    const cMe = mb.addAtom('C', rCC + 1.51, 0, 0);
    mb.addBond(ringIds[0], cMe, 1);
    mb.fillTetrahedralH(cMe, 1.09);
  } else if (substituent === 'C2H5') {
    const cAlpha = mb.addAtom('C', rCC + 1.51, 0, 0);
    mb.addBond(ringIds[0], cAlpha, 1);
    const cBeta = mb.addAtom('C', rCC + 1.51 + 1.54 * Math.cos(70.5 * DEG), 0, 1.54 * Math.sin(70.5 * DEG));
    mb.addBond(cAlpha, cBeta, 1);
    mb.fillTetrahedralH(cAlpha, 1.09);
    mb.fillTetrahedralH(cBeta, 1.09);
  } else if (substituent === 'OH') {
    const o = mb.addAtom('O', rCC + 1.37, 0, 0);
    mb.addBond(ringIds[0], o, 1);
    const h = mb.addAtom('H', rCC + 1.37 + 0.96 * Math.cos(71 * DEG), 0.96 * Math.sin(71 * DEG), 0);
    mb.addBond(o, h, 1);
  }
  mb.centerGeometry();
  return {
    id,
    orderNumber,
    formula,
    nameVi,
    nameEn,
    category: 'organic',
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

function buildCyclohexaneChair(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const R = 1.45;
  const zOff = 0.25;
  const cIds: number[] = [];
  for (let i = 0; i < 6; i++) {
    const phi = (i * Math.PI) / 3;
    const z = i % 2 === 0 ? zOff : -zOff;
    cIds.push(mb.addAtom('C', R * Math.cos(phi), R * Math.sin(phi), z));
  }
  for (let i = 0; i < 6; i++) {
    mb.addBond(cIds[i], cIds[(i + 1) % 6], 1);
  }
  for (const cid of cIds) {
    mb.fillTetrahedralH(cid, 1.09);
  }
  mb.centerGeometry();
  return {
    id: 'chem-075', orderNumber: 75, formula: 'C₆H₁₂', nameVi: 'Cyclohexane (dạng ghế)', nameEn: 'Cyclohexane (chair)',
    category: 'organic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 84.16,
    geometryDescription: 'Cấu dạng ghế (D3d) bền nhất không sức căng vòng: 6 liên kết C–H trục (axial) và 6 liên kết C–H xích đạo (equatorial).',
    properties: ['Chất lỏng không màu, không tan trong nước', 'Tham gia phản ứng thế tương tự alkane'],
    applications: ['Nguyên liệu sản xuất nylon-6,6 (adipic acid, caprolactam)', 'Dung môi công nghiệp'],
    source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function buildCyclopropane(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const r = 1.51 / Math.sqrt(3);
  const cIds: number[] = [];
  for (let i = 0; i < 3; i++) {
    const phi = (i * 2 * Math.PI) / 3;
    cIds.push(mb.addAtom('C', r * Math.cos(phi), r * Math.sin(phi), 0));
  }
  mb.addBond(cIds[0], cIds[1], 1);
  mb.addBond(cIds[1], cIds[2], 1);
  mb.addBond(cIds[2], cIds[0], 1);
  for (const cid of cIds) mb.fillTetrahedralH(cid, 1.09);
  mb.centerGeometry();
  return {
    id: 'chem-076', orderNumber: 76, formula: 'C₃H₆', nameVi: 'Cyclopropane', nameEn: 'Cyclopropane',
    category: 'organic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 42.08,
    geometryDescription: 'Vòng 3 cạnh tam giác đều (góc C–C–C = 60°), có sức căng vòng lớn (đồng phân mạch vòng của propene).',
    properties: ['Khí dễ cháy, dễ tham gia phản ứng cộng mở vòng với H₂, Br₂, HBr'],
    applications: ['Nghiên cứu sức căng vòng trong hóa hữu cơ'], source: 'NIST CCCBDB', validationStatus: 'verified', isomerGroup: 'C3H6',
  };
}

function makeAlcohol(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  nCarbons: number, ohPositions: number[], geomDesc: string, props: string[], apps: string[], isomerGroup?: string,
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const chain = buildLinearChain(nCarbons, 1.53, 109.5);
  const cIds = chain.map(([x, y, z]) => mb.addAtom('C', x, y, z));
  for (let i = 0; i < cIds.length - 1; i++) mb.addBond(cIds[i], cIds[i + 1], 1);

  for (const idx of ohPositions) {
    const cPos = mb.pos(cIds[idx]);
    // Place OH cleanly off-plane or along extension
    const dirY = idx % 2 === 0 ? -1 : 1;
    const o = mb.addAtom('O', cPos[0] + (idx === 0 && nCarbons === 1 ? 1.43 : 0), cPos[1] + (nCarbons === 1 ? 0 : 1.43 * dirY), idx === 1 && nCarbons === 3 ? 0.6 : 0);
    mb.addBond(cIds[idx], o, 1);
    const oPos = mb.pos(o);
    const h = mb.addAtom('H', oPos[0] + 0.85, oPos[1] + 0.45 * dirY, oPos[2]);
    mb.addBond(o, h, 1);
  }
  for (const cid of cIds) mb.fillTetrahedralH(cid, 1.09);
  mb.centerGeometry();
  return {
    id, orderNumber, formula, nameVi, nameEn, category: 'organic', structureType: 'molecule',
    atoms: mb.atoms, bonds: mb.bonds, molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc, properties: props, applications: apps, source: 'PubChem / NIST', validationStatus: 'verified',
    ...(isomerGroup ? { isomerGroup } : {}),
  };
}

function makeCarbonyl(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  kind: 'methanal' | 'ethanal' | 'acetone' | 'formic' | 'acetic' | 'propionic' | 'methyl-acetate' | 'ethyl-acetate' | 'urea',
  geomDesc: string, props: string[], apps: string[], isomerGroup?: string,
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const c0 = mb.addAtom('C', 0, 0, 0);
  const oCarb = mb.addAtom('O', 0, 1.21, 0);
  mb.addBond(c0, oCarb, 2);

  if (kind === 'methanal') {
    mb.fillTrigonalH(c0, [0, 0, 1], 1.1, 2);
  } else if (kind === 'ethanal') {
    const cMe = mb.addAtom('C', -1.30, -0.75, 0);
    mb.addBond(c0, cMe, 1);
    mb.fillTrigonalH(c0, [0, 0, 1], 1.1, 1);
    mb.fillTetrahedralH(cMe, 1.09);
  } else if (kind === 'acetone') {
    const cL = mb.addAtom('C', -1.30, -0.75, 0);
    const cR = mb.addAtom('C', 1.30, -0.75, 0);
    mb.addBond(c0, cL, 1);
    mb.addBond(c0, cR, 1);
    mb.fillTetrahedralH(cL, 1.09);
    mb.fillTetrahedralH(cR, 1.09);
  } else if (kind === 'formic' || kind === 'acetic' || kind === 'propionic') {
    const oOH = mb.addAtom('O', 1.17, -0.68, 0);
    mb.addBond(c0, oOH, 1);
    const hOH = mb.addAtom('H', 1.95, -0.11, 0);
    mb.addBond(oOH, hOH, 1);
    if (kind === 'formic') {
      mb.fillTrigonalH(c0, [0, 0, 1], 1.1, 1);
    } else if (kind === 'acetic') {
      const cMe = mb.addAtom('C', -1.30, -0.75, 0);
      mb.addBond(c0, cMe, 1);
      mb.fillTetrahedralH(cMe, 1.09);
    } else {
      const c2 = mb.addAtom('C', -1.30, -0.75, 0);
      const c3 = mb.addAtom('C', -2.55, 0.13, 0);
      mb.addBond(c0, c2, 1);
      mb.addBond(c2, c3, 1);
      mb.fillTetrahedralH(c2, 1.09);
      mb.fillTetrahedralH(c3, 1.09);
    }
  } else if (kind === 'methyl-acetate' || kind === 'ethyl-acetate') {
    const cMe = mb.addAtom('C', -1.30, -0.75, 0);
    mb.addBond(c0, cMe, 1);
    mb.fillTetrahedralH(cMe, 1.09);
    const oEst = mb.addAtom('O', 1.17, -0.68, 0);
    mb.addBond(c0, oEst, 1);
    const cAlk1 = mb.addAtom('C', 2.40, 0.05, 0);
    mb.addBond(oEst, cAlk1, 1);
    if (kind === 'ethyl-acetate') {
      const cAlk2 = mb.addAtom('C', 3.65, -0.82, 0);
      mb.addBond(cAlk1, cAlk2, 1);
      mb.fillTetrahedralH(cAlk2, 1.09);
    }
    mb.fillTetrahedralH(cAlk1, 1.09);
  } else if (kind === 'urea') {
    const n1 = mb.addAtom('N', -1.17, -0.68, 0);
    const n2 = mb.addAtom('N', 1.17, -0.68, 0);
    mb.addBond(c0, n1, 1);
    mb.addBond(c0, n2, 1);
    mb.fillTrigonalH(n1, [0, 0, 1], 1.01, 2);
    mb.fillTrigonalH(n2, [0, 0, 1], 1.01, 2);
  }

  mb.centerGeometry();
  return {
    id, orderNumber, formula, nameVi, nameEn, category: 'organic', structureType: 'molecule',
    atoms: mb.atoms, bonds: mb.bonds, molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc, properties: props, applications: apps, source: 'NIST CCCBDB', validationStatus: 'verified',
    ...(isomerGroup ? { isomerGroup } : {}),
  };
}

function makeEther(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  ethyl: boolean, geomDesc: string, props: string[], apps: string[], isomerGroup?: string,
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const o = mb.addAtom('O', 0, 0.3, 0);
  const cL = mb.addAtom('C', -1.18, -0.49, 0);
  const cR = mb.addAtom('C', 1.18, -0.49, 0);
  mb.addBond(o, cL, 1);
  mb.addBond(o, cR, 1);
  if (ethyl) {
    const cL2 = mb.addAtom('C', -2.44, 0.36, 0);
    const cR2 = mb.addAtom('C', 2.44, 0.36, 0);
    mb.addBond(cL, cL2, 1);
    mb.addBond(cR, cR2, 1);
    mb.fillTetrahedralH(cL2, 1.09);
    mb.fillTetrahedralH(cR2, 1.09);
  }
  mb.fillTetrahedralH(cL, 1.09);
  mb.fillTetrahedralH(cR, 1.09);
  mb.centerGeometry();
  return {
    id, orderNumber, formula, nameVi, nameEn, category: 'organic', structureType: 'molecule',
    atoms: mb.atoms, bonds: mb.bonds, molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc, properties: props, applications: apps, source: 'NIST CCCBDB', validationStatus: 'verified',
    ...(isomerGroup ? { isomerGroup } : {}),
  };
}

function makeAmine(
  id: string, orderNumber: number, formula: string, nameVi: string, nameEn: string,
  ethyl: boolean, geomDesc: string, props: string[], apps: string[],
): ChemicalModel {
  const mb = new MoleculeBuilder();
  const c1 = mb.addAtom('C', 0, 0, 0);
  const n = mb.addAtom('N', 1.47, 0, 0);
  mb.addBond(c1, n, 1);
  const hN1 = mb.addAtom('H', 1.82, 0.85, 0.42);
  const hN2 = mb.addAtom('H', 1.82, 0.1, -0.94);
  mb.addBond(n, hN1, 1);
  mb.addBond(n, hN2, 1);
  if (ethyl) {
    const c2 = mb.addAtom('C', -0.52, 1.44, 0);
    mb.addBond(c1, c2, 1);
    mb.fillTetrahedralH(c2, 1.09);
  }
  mb.fillTetrahedralH(c1, 1.09);
  mb.centerGeometry();
  return {
    id, orderNumber, formula, nameVi, nameEn, category: 'organic', structureType: 'molecule',
    atoms: mb.atoms, bonds: mb.bonds, molarMass: computeMolarMass(mb.atoms),
    geometryDescription: geomDesc, properties: props, applications: apps, source: 'NIST CCCBDB', validationStatus: 'verified',
  };
}

function makeAminoAcid(isAlanine: boolean): ChemicalModel {
  const mb = new MoleculeBuilder();
  const cAlpha = mb.addAtom('C', 0, 0, 0);
  const n = mb.addAtom('N', -1.25, -0.78, 0.15);
  const cCarb = mb.addAtom('C', 1.25, -0.68, 0);
  mb.addBond(cAlpha, n, 1);
  mb.addBond(cAlpha, cCarb, 1);
  const oDouble = mb.addAtom('O', 1.35, -1.89, 0);
  const oOH = mb.addAtom('O', 2.38, 0.05, 0);
  const hOH = mb.addAtom('H', 3.12, -0.55, 0);
  mb.addBond(cCarb, oDouble, 2);
  mb.addBond(cCarb, oOH, 1);
  mb.addBond(oOH, hOH, 1);

  const hN1 = mb.addAtom('H', -1.4, -1.45, -0.58);
  const hN2 = mb.addAtom('H', -2.04, -0.16, 0.25);
  mb.addBond(n, hN1, 1);
  mb.addBond(n, hN2, 1);

  if (isAlanine) {
    const cMe = mb.addAtom('C', -0.1, 1.05, 1.1);
    mb.addBond(cAlpha, cMe, 1);
    mb.fillTetrahedralH(cMe, 1.09);
  }
  mb.fillTetrahedralH(cAlpha, 1.09);
  mb.centerGeometry();

  return {
    id: isAlanine ? 'chem-096' : 'chem-095',
    orderNumber: isAlanine ? 96 : 95,
    formula: isAlanine ? 'C₃H₇NO₂' : 'NH₂CH₂COOH',
    nameVi: isAlanine ? 'Alanine (L-Alanine)' : 'Glycine',
    nameEn: isAlanine ? 'L-Alanine' : 'Glycine',
    category: 'organic',
    structureType: 'molecule',
    atoms: mb.atoms,
    bonds: mb.bonds,
    molarMass: computeMolarMass(mb.atoms),
    geometryDescription: isAlanine
      ? 'α-amino acid có nguyên tử Cα bất đối (cấu hình L), mang đồng thời nhóm –NH₂, –COOH và –CH₃.'
      : 'α-amino acid đơn giản nhất (không có tính quang hoạt), chứa nhóm –NH₂ và –COOH gắn trên cùng Cα.',
    properties: ['Chất rắn kết tinh trắng, vị ngọt nhẹ, tan tốt trong nước', 'Có tính lưỡng tính'],
    applications: ['Đơn vị cấu tạo protein', 'Sản xuất dược phẩm và phụ gia dinh dưỡng'],
    source: 'PubChem',
    validationStatus: 'verified',
  };
}

function addGlucoseCore(mb: MoleculeBuilder, offsetX = 0, omitAnomericH = false): { c1: number; anomericO: number } {
  // Chair pyranose ring: C1, C2, C3, C4, C5, O5
  const R = 1.42;
  const ringPts: [string, number, number, number][] = [
    ['C', R, 0, 0.22], // C1 (anomeric)
    ['C', R * 0.5, R * 0.866, -0.22], // C2
    ['C', -R * 0.5, R * 0.866, 0.22], // C3
    ['C', -R, 0, -0.22], // C4
    ['C', -R * 0.5, -R * 0.866, 0.22], // C5
    ['O', R * 0.5, -R * 0.866, -0.22], // O5
  ];
  const rIds = ringPts.map(([el, x, y, z]) => mb.addAtom(el, x + offsetX, y, z));
  for (let i = 0; i < 6; i++) mb.addBond(rIds[i], rIds[(i + 1) % 6], 1);

  const [c1, c2, c3, c4, c5] = rIds;
  // C1: alpha-OH axial down (-z)
  const o1 = mb.addAtom('O', offsetX + R + 0.2, -0.1, -1.18);
  mb.addBond(c1, o1, 1);
  if (!omitAnomericH) {
    const ho1 = mb.addAtom('H', offsetX + R + 0.9, -0.1, -1.8);
    mb.addBond(o1, ho1, 1);
  }
  // C2, C3, C4 equatorial OH
  const o2 = mb.addAtom('O', offsetX + 1.1, 2.25, -0.65);
  mb.addBond(c2, o2, 1);
  mb.addBond(o2, mb.addAtom('H', offsetX + 1.85, 2.75, -0.85), 1);

  const o3 = mb.addAtom('O', offsetX - 1.1, 2.25, 0.65);
  mb.addBond(c3, o3, 1);
  mb.addBond(o3, mb.addAtom('H', offsetX - 1.85, 2.75, 0.85), 1);

  const o4 = mb.addAtom('O', offsetX - 2.65, 0.0, -0.55);
  mb.addBond(c4, o4, 1);
  mb.addBond(o4, mb.addAtom('H', offsetX - 3.35, -0.55, -0.8), 1);

  // C5 -> C6H2OH equatorial
  const c6 = mb.addAtom('C', offsetX - 1.25, -2.35, 0.85);
  mb.addBond(c5, c6, 1);
  const o6 = mb.addAtom('O', offsetX - 2.45, -2.85, 0.3);
  mb.addBond(c6, o6, 1);
  mb.addBond(o6, mb.addAtom('H', offsetX - 3.1, -2.2, 0.05), 1);

  // Fill remaining sp3 hydrogens on C1..C6
  for (const cid of [c1, c2, c3, c4, c5, c6]) {
    mb.fillTetrahedralH(cid, 1.09);
  }
  return { c1, anomericO: o1 };
}

function addFructoseCore(mb: MoleculeBuilder, offsetX = 0, linkFromO?: number): void {
  // 5-membered furanose ring: C2, C3, C4, C5, O5
  const R = 1.22;
  const ringPts: [string, number, number, number][] = [
    ['C', -R, 0, 0.15], // C2 (anomeric)
    ['C', -R * 0.31, R * 0.95, -0.18], // C3
    ['C', R * 0.81, R * 0.59, 0.18], // C4
    ['C', R * 0.81, -R * 0.59, -0.15], // C5
    ['O', -R * 0.31, -R * 0.95, 0.0], // O5
  ];
  const rIds = ringPts.map(([el, x, y, z]) => mb.addAtom(el, x + offsetX, y, z));
  for (let i = 0; i < 5; i++) mb.addBond(rIds[i], rIds[(i + 1) % 5], 1);
  const [c2, c3, c4, c5] = rIds;

  // C2 substituents: C1H2OH + beta-OH (or glycosidic O)
  const c1 = mb.addAtom('C', offsetX - 1.25, -0.55, 1.42);
  mb.addBond(c2, c1, 1);
  const o1 = mb.addAtom('O', offsetX - 1.75, -1.75, 1.95);
  mb.addBond(c1, o1, 1);
  mb.addBond(o1, mb.addAtom('H', offsetX - 2.45, -1.55, 2.55), 1);

  if (linkFromO !== undefined) {
    mb.addBond(c2, linkFromO, 1);
  } else {
    const o2 = mb.addAtom('O', offsetX - 2.2, 0.75, -0.75);
    mb.addBond(c2, o2, 1);
    mb.addBond(o2, mb.addAtom('H', offsetX - 2.95, 1.25, -1.05), 1);
  }

  // C3, C4 OH
  const o3 = mb.addAtom('O', offsetX - 0.65, 2.35, -0.75);
  mb.addBond(c3, o3, 1);
  mb.addBond(o3, mb.addAtom('H', offsetX - 1.4, 2.85, -1.05), 1);

  const o4 = mb.addAtom('O', offsetX + 2.1, 1.4, 0.65);
  mb.addBond(c4, o4, 1);
  mb.addBond(o4, mb.addAtom('H', offsetX + 2.85, 1.85, 0.9), 1);

  // C5 -> C6H2OH
  const c6 = mb.addAtom('C', offsetX + 2.15, -1.45, -0.65);
  mb.addBond(c5, c6, 1);
  const o6 = mb.addAtom('O', offsetX + 3.25, -0.95, -1.4);
  mb.addBond(c6, o6, 1);
  mb.addBond(o6, mb.addAtom('H', offsetX + 3.9, -1.65, -1.55), 1);

  for (const cid of [c1, c2, c3, c4, c5, c6]) {
    mb.fillTetrahedralH(cid, 1.09);
  }
}

function buildAlphaGlucose(): ChemicalModel {
  const mb = new MoleculeBuilder();
  addGlucoseCore(mb, 0, false);
  mb.centerGeometry();
  return {
    id: 'chem-097', orderNumber: 97, formula: 'C₆H₁₂O₆', nameVi: 'Glucose (α-D-glucopyranose)', nameEn: 'α-D-Glucopyranose',
    category: 'organic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 180.16,
    geometryDescription: 'Vòng pyranose 6 cạnh dạng ghế: nhóm –OH bán acetal tại C1 hướng trục (α) xuống dưới, các nhóm –OH tại C2, C3, C4 và –CH₂OH tại C5 ở vị trí xích đạo.',
    properties: ['Đường đơn vị ngọt, dễ tan trong nước', 'Tham gia phản ứng tráng bạc (khi mở vòng) và lên men tạo ethanol'],
    applications: ['Nguồn năng lượng chính của tế bào', 'Truyền dịch y tế, sản xuất vitamin C'],
    source: 'PubChem / PDB', validationStatus: 'verified', isomerGroup: 'C6H12O6',
  };
}

function buildBetaFructose(): ChemicalModel {
  const mb = new MoleculeBuilder();
  addFructoseCore(mb, 0);
  mb.centerGeometry();
  return {
    id: 'chem-098', orderNumber: 98, formula: 'C₆H₁₂O₆', nameVi: 'Fructose (β-D-fructofuranose)', nameEn: 'β-D-Fructofuranose',
    category: 'organic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 180.16,
    geometryDescription: 'Vòng furanose 5 cạnh (4 C + 1 O) dạng phong bì: C2 mang nhóm –CH₂OH và nhóm –OH anomer cấu hình β (đồng phân chức năng của glucose).',
    properties: ['Đường có vị ngọt cao nhất trong tự nhiên (có nhiều trong mật ong)', 'Dễ tan trong nước'],
    applications: ['Chất tạo ngọt tự nhiên trong thực phẩm', 'Chuyển hóa năng lượng sinh học'],
    source: 'PubChem / PDB', validationStatus: 'verified', isomerGroup: 'C6H12O6',
  };
}

function buildSucrose(): ChemicalModel {
  const mb = new MoleculeBuilder();
  const glu = addGlucoseCore(mb, -2.25, true);
  addFructoseCore(mb, 2.35, glu.anomericO);
  mb.centerGeometry();
  return {
    id: 'chem-099', orderNumber: 99, formula: 'C₁₂H₂₂O₁₁', nameVi: 'Sucrose', nameEn: 'Sucrose',
    category: 'organic', structureType: 'molecule', atoms: mb.atoms, bonds: mb.bonds, molarMass: 342.3,
    geometryDescription: 'Disaccharide gồm 1 gốc α-D-glucopyranose nối với 1 gốc β-D-fructofuranose qua cầu nối glycoside α(1→2)β.',
    properties: ['Tinh thể trắng vị ngọt (đường mía), không có phản ứng tráng bạc', 'Thủy phân trong môi trường acid tạo glucose và fructose'],
    applications: ['Đường thực phẩm phổ biến nhất', 'Công nghiệp bánh kẹo, đồ uống, dược phẩm'],
    source: 'PubChem / Crystallography', validationStatus: 'verified',
  };
}

export const ORGANIC_40: ChemicalModel[] = [
  makeAlkane('chem-061', 61, 'CH₄', 'Methane', 'Methane', 1, 'Cấu trúc tứ diện đều (góc H–C–H = 109.47°, d(C–H) = 1.09 Å).', ['Khí không màu, nhẹ hơn không khí, ít tan trong nước', 'Thành phần chính của khí thiên nhiên và biogas'], ['Nhiên liệu sạch', 'Sản xuất H₂, methanol, đen carbon']),
  makeAlkane('chem-062', 62, 'C₂H₆', 'Ethane', 'Ethane', 2, 'Hai nhóm –CH₃ tứ diện nối qua liên kết đơn C–C (1.54 Å), cấu dạng xen kẽ.', ['Khí không màu, cháy tỏa nhiều nhiệt'], ['Nguyên liệu cracking sản xuất ethene (C₂H₄)']),
  makeAlkane('chem-063', 63, 'C₃H₈', 'Propane', 'Propane', 3, 'Mạch 3 carbon gấp khúc góc C–C–C ≈ 109.5°, các H phân bố tứ diện.', ['Khí dễ hóa lỏng dưới áp suất'], ['Thành phần khí gas hóa lỏng (LPG) dùng trong đun nấu']),
  makeAlkane('chem-064', 64, 'C₄H₁₀', 'n-Butane', 'n-Butane', 4, 'Mạch thẳng không nhánh 4 carbon (zigzag sp³), góc liên kết ~109.5°.', ['Khí không màu, dễ hóa lỏng'], ['Khí bật lửa, nhiên liệu LPG']),
  makeAlkane('chem-065', 65, 'C₅H₁₂', 'n-Pentane', 'n-Pentane', 5, 'Mạch thẳng 5 carbon sp³ dạng zigzag.', ['Chất lỏng dễ bay hơi (nhiệt độ sôi 36.1 °C)'], ['Dung môi phòng thí nghiệm, chất tạo xốp polystyrene']),
  makeAlkane('chem-066', 66, 'C₆H₁₄', 'n-Hexane', 'n-Hexane', 6, 'Mạch thẳng 6 carbon sp³ dạng zigzag.', ['Chất lỏng không màu, không phân cực, nhẹ hơn nước'], ['Dung môi trích ly dầu thực vật, chất chuẩn sắc ký']),
  makeAlkene('chem-067', 67, 'C₂H₄', 'Ethene', 'Ethene', 2, 'Phân tử đồng phẳng (C lai hóa sp²), d(C=C) = 1.339 Å, góc H–C–H ≈ 120°.', ['Khí không màu, làm mất màu dung dịch Br₂', 'Kích thích quả chín'], ['Sản xuất nhựa polyethylene (PE), ethanol, ethylene glycol']),
  makeAlkene('chem-068', 68, 'C₃H₆', 'Propene', 'Propene', 3, 'Nhóm C=C phẳng sp² gắn với nhóm –CH₃ tứ diện (đồng phân mạch hở của cyclopropane).', ['Khí không màu, tham gia phản ứng cộng và trùng hợp'], ['Sản xuất nhựa polypropylene (PP), acetone'], 'C3H6'),
  makeAlkene('chem-069', 69, 'C₄H₈', 'But-1-ene', 'But-1-ene', 4, 'Liên kết đôi C=C ở đầu mạch (C1=C2 phẳng) nối với nhóm ethyl –CH₂CH₃.', ['Khí không màu, phản ứng cộng tuân theo quy tắc Markovnikov'], ['Đồng trùng hợp tạo nhựa LLDPE và cao su butyl']),
  makeAlkyne('chem-070', 70, 'C₂H₂', 'Ethyne', 'Ethyne (Acetylene)', false, 'Phân tử thẳng (C lai hóa sp, góc 180°), liên kết ba d(C≡C) = 1.203 Å.', ['Khí không màu, cháy trong O₂ cho ngọn lửa nhiệt độ ~3000 °C', 'Tạo kết tủa vàng nhạt với AgNO₃/NH₃'], ['Đèn xì hàn cắt kim loại', 'Tổng hợp PVC, vinyl acetate']),
  makeAlkyne('chem-071', 71, 'C₃H₄', 'Propyne', 'Propyne', true, 'Mạch C≡C–C thẳng hàng (180°) gắn nhóm –CH₃ tứ diện.', ['Alkyne đầu mạch, có phản ứng thế ion bạc tạo kết tủa'], ['Tổng hợp hữu cơ và nhiên liệu hàn chuyên dụng']),
  makeAromatic('chem-072', 72, 'C₆H₆', 'Benzene', 'Benzene', 'H', 'Vòng lục giác đều phẳng (D6h), 6 liên kết C–C thơm đồng nhất 1.397 Å.', ['Chất lỏng mùi thơm đặc trưng, không tan trong nước', 'Dễ thế, khó cộng, bền với KMnO₄'], ['Dung môi hữu cơ, sản xuất styrene, phenol, aniline']),
  makeAromatic('chem-073', 73, 'C₇H₈', 'Toluene', 'Toluene', 'CH3', 'Vòng benzene phẳng gắn nhóm thế methyl –CH₃ tứ diện.', ['Chất lỏng không màu, dễ thế vào vị trí ortho/para và làm mất màu KMnO₄ đun nóng'], ['Dung môi sơn, tổng hợp TNT và benzoic acid']),
  makeAromatic('chem-074', 74, 'C₈H₁₀', 'Ethylbenzene', 'Ethylbenzene', 'C2H5', 'Vòng thơm phẳng gắn nhóm ethyl –CH₂CH₃.', ['Chất lỏng không màu, dễ tách hydro thành styrene'], ['Nguyên liệu chủ yếu sản xuất styrene (nhựa PS)']),
  buildCyclohexaneChair(),
  buildCyclopropane(),
  makeAlcohol('chem-077', 77, 'CH₃OH', 'Methanol', 'Methanol', 1, [0], 'Cấu trúc tứ diện quanh C và góc C–O–H ≈ 108.5°.', ['Chất lỏng không màu, rất độc (gây mù lòa), tan vô hạn trong nước'], ['Dung môi, sản xuất formaldehyde, nhiên liệu sinh học']),
  makeAlcohol('chem-078', 78, 'C₂H₅OH', 'Ethanol', 'Ethanol', 2, [1], 'Mạch 2 carbon sp³ gắn nhóm –OH ở C2 (đồng phân nhóm chức của dimethyl ether).', ['Chất lỏng dễ bay hơi, tan vô hạn trong nước, tác dụng Na giải phóng H₂'], ['Dung môi, sát trùng y tế 70°, pha xăng sinh học E5/E10'], 'C2H6O'),
  makeAlcohol('chem-079', 79, 'C₃H₈O', 'Propan-1-ol', 'Propan-1-ol', 3, [2], 'Alcohol bậc I: nhóm –OH gắn ở carbon đầu mạch (đồng phân vị trí của propan-2-ol).', ['Chất lỏng tan tốt trong nước, oxi hóa nhẹ cho propanal'], ['Dung môi mực in, dược phẩm, tổng hợp propyl ester'], 'C3H8O'),
  makeAlcohol('chem-080', 80, 'C₃H₈O', 'Propan-2-ol', 'Propan-2-ol', 3, [1], 'Alcohol bậc II: nhóm –OH gắn ở carbon giữa C2 (đồng phân vị trí của propan-1-ol).', ['Chất lỏng bay hơi nhanh, oxi hóa cho propanone (acetone)'], ['Cồn sát trùng, dung môi tẩy rửa linh kiện điện tử'], 'C3H8O'),
  makeAlcohol('chem-081', 81, 'C₃H₈O₃', 'Glycerol', 'Glycerol', 3, [0, 1, 2], 'Alcohol đa chức có 3 nhóm –OH gắn liên tiếp trên 3 nguyên tử carbon mạch thẳng.', ['Chất lỏng sánh, vị ngọt, hút ẩm mạnh, hòa tan Cu(OH)₂ thành dung dịch xanh lam thẫm'], ['Mỹ phẩm giữ ẩm, công nghiệp thực phẩm, sản xuất nitroglycerin']),
  makeCarbonyl('chem-082', 82, 'CH₂O', 'Methanal (Formaldehyde)', 'Methanal', 'methanal', 'Phân tử phẳng tam giác sp² (góc ~120°, d(C=O) = 1.21 Å).', ['Khí mùi xốc, tan rất tốt trong nước (dung dịch 37–40% gọi là formol)'], ['Sản xuất nhựa phenol-formaldehyde, bảo quản mẫu sinh học']),
  makeCarbonyl('chem-083', 83, 'C₂H₄O', 'Ethanal (Acetaldehyde)', 'Ethanal', 'ethanal', 'Nhóm –CHO phẳng sp² gắn với nhóm –CH₃ tứ diện.', ['Chất lỏng dễ bay hơi, tham gia phản ứng tráng bạc và cộng H₂'], ['Sản xuất acetic acid, ethyl acetate']),
  makeCarbonyl('chem-084', 84, 'C₃H₆O', 'Propanone (Acetone)', 'Propanone', 'acetone', 'Nhóm carbonyl C=O phẳng ở giữa gắn hai nhóm –CH₃ đối xứng.', ['Chất lỏng không màu, mùi đặc trưng, tan vô hạn trong nước, không tráng bạc'], ['Dung môi tẩy sơn móng tay, dung môi công nghiệp nhựa và sơn']),
  makeCarbonyl('chem-085', 85, 'HCOOH', 'Formic acid', 'Formic acid', 'formic', 'Nhóm –COOH phẳng; vừa mang nhóm carboxyl vừa mang nhóm –CHO nên có tính khử.', ['Chất lỏng mùi hắc, ăn mòn da, mạnh nhất trong dãy carboxylic acid no đơn chức'], ['Công nghiệp dệt nhuộm, thuộc da, cao su']),
  makeCarbonyl('chem-086', 86, 'CH₃COOH', 'Acetic acid', 'Acetic acid', 'acetic', 'Nhóm –COOH phẳng sp² gắn với nhóm –CH₃ tứ diện.', ['Chất lỏng vị chua, tan vô hạn trong nước; dung dịch 2–5% là giấm ăn'], ['Gia vị thực phẩm, sản xuất tơ acetate, PVA, dung môi']),
  makeCarbonyl('chem-087', 87, 'C₂H₅COOH', 'Propionic acid', 'Propionic acid', 'propionic', 'Acid no đơn chức 3 carbon (đồng phân với methyl acetate).', ['Acid yếu có mùi hắc đặc trưng'], ['Chất bảo quản chống nấm mốc trong bánh mì và thức ăn chăn nuôi'], 'C3H6O2'),
  makeCarbonyl('chem-088', 88, 'CH₃COOCH₃', 'Methyl acetate', 'Methyl acetate', 'methyl-acetate', 'Ester phẳng tại nhóm –COO– nối với gốc –CH₃ hai bên (đồng phân với propionic acid).', ['Chất lỏng mùi thơm dễ chịu, ít tan trong nước, dễ bay hơi'], ['Dung môi sơn, keo dán nhanh khô'], 'C3H6O2'),
  makeCarbonyl('chem-089', 89, 'CH₃COOC₂H₅', 'Ethyl acetate', 'Ethyl acetate', 'ethyl-acetate', 'Ester phẳng tại nhóm chức –COO– liên kết với nhóm methyl và ethyl.', ['Chất lỏng mùi thơm trái cây, sôi ở 77 °C, thủy phân trong kiềm tạo muối và ethanol'], ['Dung môi phổ biến trong sơn, tách chiết hữu cơ, hương liệu']),
  makeEther('chem-090', 90, 'CH₃OCH₃', 'Dimethyl ether', 'Dimethyl ether', false, 'Cấu trúc gấp khúc tại nguyên tử O (góc C–O–C ≈ 111.7°, đồng phân nhóm chức của ethanol).', ['Khí không màu ở điều kiện thường, không tác dụng Na'], ['Chất đẩy bình xịt, nhiên liệu thay thế diesel sạch'], 'C2H6O'),
  makeEther('chem-091', 91, 'C₂H₅OC₂H₅', 'Diethyl ether', 'Diethyl ether', true, 'Hai gốc ethyl –C₂H₅ đối xứng nối qua cầu –O– góc ~112°.', ['Chất lỏng rất dễ bay hơi (sôi 34.6 °C), rất dễ cháy'], ['Dung môi chiết tách hữu cơ không phân cực']),
  makeAmine('chem-092', 92, 'CH₃NH₂', 'Methylamine', 'Methylamine', false, 'Cấu trúc chóp tam giác tại N và tứ diện tại C.', ['Khí mùi khai tanh giống amonia, tính bazơ mạnh hơn NH₃'], ['Tổng hợp thuốc trừ sâu, dược phẩm, chất hoạt động bề mặt']),
  makeAmine('chem-093', 93, 'C₂H₅NH₂', 'Ethylamine', 'Ethylamine', true, 'Nhóm ethyl –C₂H₅ gắn với nhóm –NH₂ hình chóp.', ['Chất lỏng/khí dễ tan trong nước, làm xanh quỳ tím ẩm'], ['Tổng hợp phẩm nhuộm, nhựa, dược phẩm']),
  makeCarbonyl('chem-094', 94, 'CO(NH₂)₂', 'Urea', 'Urea', 'urea', 'Phân tử phẳng (nhóm C=O liên hợp với 2 nhóm –NH₂).', ['Tinh thể trắng, chứa hàm lượng đạm cao (~46.6% N), dễ tan trong nước'], ['Phân đạm nông nghiệp quan trọng nhất', 'Sản xuất nhựa urea-formaldehyde']),
  makeAminoAcid(false),
  makeAminoAcid(true),
  buildAlphaGlucose(),
  buildBetaFructose(),
  buildSucrose(),
  makeAromatic('chem-100', 100, 'C₆H₅OH', 'Phenol', 'Phenol', 'OH', 'Vòng benzene phẳng gắn trực tiếp nhóm hydroxyl –OH (góc C–O–H ≈ 109°).', ['Tinh thể không màu dễ hóa hồng ngoài không khí, ít tan nước lạnh, có tính acid yếu', 'Tạo kết tủa trắng với nước brom'], ['Sản xuất nhựa phenol-formaldehyde, thuốc sát trùng, bisphenol A']),
];

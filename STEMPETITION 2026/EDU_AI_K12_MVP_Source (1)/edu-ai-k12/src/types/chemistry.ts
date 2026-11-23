export interface Atom3D {
  id: number;
  element: string;
  atomicNumber: number;
  x: number; // Ångström (Å)
  y: number;
  z: number;
  formalCharge?: number;
  label?: string;
}

export interface Bond3D {
  fromAtomId: number;
  toAtomId: number;
  order: 1 | 2 | 3 | 1.5;
  type: 'covalent' | 'ionic-coordination' | 'metallic' | 'aromatic';
}

export interface LatticeData {
  crystalSystem:
    | 'cubic'
    | 'hexagonal'
    | 'tetragonal'
    | 'orthorhombic'
    | 'monoclinic'
    | 'trigonal';
  bravaisType: 'P' | 'I' | 'F' | 'C';
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  cellRepresentationNote: string;
}

export type ChemistryCategory = 'element' | 'inorganic' | 'organic';

export type ChemistryStructureType =
  | 'molecule'
  | 'monatomic'
  | 'ionic-crystal'
  | 'metal-crystal'
  | 'covalent-network';

export interface ChemicalModel {
  id: string;
  orderNumber: number;
  nameVi: string;
  nameEn: string;
  formula: string;
  category: ChemistryCategory;
  structureType: ChemistryStructureType;
  atoms: Atom3D[];
  bonds: Bond3D[];
  lattice?: LatticeData;
  molarMass?: number;
  geometryDescription?: string;
  properties: string[];
  applications: string[];
  source?: string;
  validationStatus: 'verified' | 'pending';
  isomerGroup?: string;
}

export interface ChemicalCatalogItem {
  id: string;
  orderNumber: number;
  nameVi: string;
  nameEn: string;
  formula: string;
  category: ChemistryCategory;
  structureType: ChemistryStructureType;
  molarMass: number;
  validationStatus: 'verified' | 'pending';
  isomerGroup?: string;
}

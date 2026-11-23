import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHEMISTRY_CATALOG } from './catalog100.ts';
import { loadChemistryCategory, loadChemicalModelById } from './loader.ts';
import type { ChemicalModel } from '../../types/chemistry.ts';

function parseMolecularFormula(formula: string): Record<string, number> | null {
  // Normalize subscript digits
  const subMap: Record<string, string> = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  };
  const ascii = formula.replace(/[₀-₉]/g, (c) => subMap[c] ?? c);

  // Recursive parser for formulas with parentheses like CO(NH2)2
  let idx = 0;
  function parseGroup(): Record<string, number> {
    const counts: Record<string, number> = {};
    while (idx < ascii.length) {
      const ch = ascii[idx];
      if (ch === '(') {
        idx++;
        const inner = parseGroup();
        let numStr = '';
        while (idx < ascii.length && /\d/.test(ascii[idx])) {
          numStr += ascii[idx++];
        }
        const mult = numStr ? Number(numStr) : 1;
        for (const [el, c] of Object.entries(inner)) {
          counts[el] = (counts[el] ?? 0) + c * mult;
        }
      } else if (ch === ')') {
        idx++;
        return counts;
      } else if (/[A-Z]/.test(ch)) {
        let sym = ascii[idx++];
        while (idx < ascii.length && /[a-z]/.test(ascii[idx])) {
          sym += ascii[idx++];
        }
        let numStr = '';
        while (idx < ascii.length && /\d/.test(ascii[idx])) {
          numStr += ascii[idx++];
        }
        const count = numStr ? Number(numStr) : 1;
        counts[sym] = (counts[sym] ?? 0) + count;
      } else {
        idx++;
      }
    }
    return counts;
  }

  return parseGroup();
}

function countAtoms(model: ChemicalModel): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of model.atoms) {
    counts[a.element] = (counts[a.element] ?? 0) + 1;
  }
  return counts;
}

describe('Chemistry 3D Lab — 100 models verification', () => {
  it('catalog contains exactly 100 unique substances (20 elements, 40 inorganic, 40 organic)', () => {
    assert.equal(CHEMISTRY_CATALOG.length, 100);
    const ids = new Set(CHEMISTRY_CATALOG.map((c) => c.id));
    assert.equal(ids.size, 100);

    assert.equal(CHEMISTRY_CATALOG.filter((c) => c.category === 'element').length, 20);
    assert.equal(CHEMISTRY_CATALOG.filter((c) => c.category === 'inorganic').length, 40);
    assert.equal(CHEMISTRY_CATALOG.filter((c) => c.category === 'organic').length, 40);
  });

  it('validates geometry, bonds, distances, and atom counts across all 100 3D models', async () => {
    const elements = await loadChemistryCategory('element');
    const inorganic = await loadChemistryCategory('inorganic');
    const organic = await loadChemistryCategory('organic');

    assert.equal(elements.length, 20);
    assert.equal(inorganic.length, 40);
    assert.equal(organic.length, 40);

    const allModels = [...elements, ...inorganic, ...organic];

    for (const model of allModels) {
      assert.ok(model.atoms.length >= 1, `${model.id} must have at least 1 atom`);
      assert.ok(model.properties.length >= 1, `${model.id} must have properties`);
      assert.ok(model.applications.length >= 1, `${model.id} must have applications`);
      assert.equal(model.validationStatus, 'verified', `${model.id} should be verified`);

      const atomIds = new Set(model.atoms.map((a) => a.id));
      assert.equal(atomIds.size, model.atoms.length, `${model.id} has duplicate atom IDs`);

      // Check every bond connects two valid distinct atoms
      for (const b of model.bonds) {
        assert.ok(atomIds.has(b.fromAtomId), `${model.id} invalid bond fromAtomId ${b.fromAtomId}`);
        assert.ok(atomIds.has(b.toAtomId), `${model.id} invalid bond toAtomId ${b.toAtomId}`);
        assert.notEqual(b.fromAtomId, b.toAtomId, `${model.id} self-bond detected`);
      }

      // Check minimum interatomic spacing (> 0.5 Å) to prevent overlapping atoms
      for (let i = 0; i < model.atoms.length; i++) {
        const a = model.atoms[i];
        assert.ok(
          Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z),
          `${model.id} atom ${a.id} has non-finite coordinates`,
        );
        for (let j = i + 1; j < model.atoms.length; j++) {
          const b = model.atoms[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
          assert.ok(
            d > 0.5,
            `${model.id} (${model.formula}) overlapping atoms ${a.element}#${a.id} and ${b.element}#${b.id}: d=${d.toFixed(3)} Å`,
          );
        }
      }

      // Check structureType rules
      if (model.structureType === 'monatomic') {
        assert.equal(model.atoms.length, 1, `${model.id} monatomic must have 1 atom`);
        assert.equal(model.bonds.length, 0, `${model.id} monatomic must have 0 bonds`);
      } else if (model.structureType === 'ionic-crystal' || model.structureType === 'metal-crystal') {
        assert.ok(model.lattice, `${model.id} crystal must include LatticeData`);
      } else if (model.structureType === 'molecule') {
        const expected = parseMolecularFormula(model.formula);
        const actual = countAtoms(model);
        assert.deepEqual(
          actual,
          expected,
          `${model.id} (${model.nameVi} / ${model.formula}) atom count mismatch`,
        );
      }
    }
  });

  it('distinguishes isomers cleanly (Propene vs Cyclopropane, Ethanol vs Dimethyl ether, Glucose vs Fructose)', async () => {
    const propene = await loadChemicalModelById('chem-068');
    const cyclopropane = await loadChemicalModelById('chem-076');
    const ethanol = await loadChemicalModelById('chem-078');
    const dme = await loadChemicalModelById('chem-090');
    const glucose = await loadChemicalModelById('chem-097');
    const fructose = await loadChemicalModelById('chem-098');

    assert.ok(propene && cyclopropane && ethanol && dme && glucose && fructose);
    assert.equal(propene.isomerGroup, 'C3H6');
    assert.equal(cyclopropane.isomerGroup, 'C3H6');
    assert.notDeepEqual(propene.bonds, cyclopropane.bonds);
    assert.notDeepEqual(ethanol.bonds, dme.bonds);
    assert.notDeepEqual(glucose.atoms, fructose.atoms);
  });
});

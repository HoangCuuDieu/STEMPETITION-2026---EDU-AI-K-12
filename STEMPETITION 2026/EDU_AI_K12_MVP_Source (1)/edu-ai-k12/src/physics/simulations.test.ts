import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICS_CATALOG, PHYSICS_GROUPS } from './catalog.ts';
import { loadPhysicsGroup, loadPhysicsSimulationById } from './loader.ts';
import type { PhysicsGroupId } from '../types/physics.ts';

function createMockCanvas2DContext(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    ellipse: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    rect: noop,
    fill: noop,
    stroke: noop,
    fillText: noop,
    strokeText: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    setLineDash: noop,
    measureText: (text: string) => ({ width: text.length * 7 } as TextMetrics),
    createLinearGradient: () => ({ addColorStop: noop } as unknown as CanvasGradient),
    createRadialGradient: () => ({ addColorStop: noop } as unknown as CanvasGradient),
  } as unknown as CanvasRenderingContext2D;
}

describe('Physics Lab — 50 simulations verification', () => {
  it('catalog contains exactly 50 unique simulations across 10 groups (5 each)', () => {
    assert.equal(PHYSICS_GROUPS.length, 10);
    assert.equal(PHYSICS_CATALOG.length, 50);

    const ids = new Set(PHYSICS_CATALOG.map((item) => item.id));
    assert.equal(ids.size, 50);

    for (const g of PHYSICS_GROUPS) {
      const count = PHYSICS_CATALOG.filter((item) => item.groupId === g.id).length;
      assert.equal(count, 5, `Group ${g.id} must have exactly 5 simulations`);
    }
  });

  it('lazy loader loads all 50 simulations with real equations, parameters, formulas, and finite outputs', async () => {
    const ctx = createMockCanvas2DContext();
    const groups: PhysicsGroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    let totalLoaded = 0;

    for (const groupId of groups) {
      const sims = await loadPhysicsGroup(groupId);
      assert.equal(sims.length, 5, `Loaded group ${groupId} should contain 5 simulations`);
      for (const sim of sims) {
        totalLoaded += 1;
        assert.ok(sim.parameters.length >= 2, `${sim.id} should have at least 2 parameters`);
        assert.ok(sim.formulasLatex.length >= 1, `${sim.id} should have LaTeX formulas`);
        assert.ok(sim.explanationVi.length > 20, `${sim.id} should have Vietnamese explanation`);
        assert.ok(sim.assumptionsAndLimits.length >= 1, `${sim.id} should document limits`);

        const defaultParams: Record<string, number> = {};
        for (const p of sim.parameters) {
          defaultParams[p.key] = p.defaultValue;
        }

        const res0 = sim.stepAndRender(ctx, 720, 420, 0, defaultParams, []);
        const res1 = sim.stepAndRender(ctx, 720, 420, 1.1, defaultParams, []);

        assert.ok(res0.readings.length >= 2, `${sim.id} must return telemetry readings`);
        for (const reading of res1.readings) {
          assert.ok(
            !reading.value.includes('NaN') && !reading.value.includes('Infinity'),
            `${sim.id} reading "${reading.label}" produced invalid value: ${reading.value}`,
          );
        }

        // Verify parameter change produces different simulation output or different telemetry
        const firstParam = sim.parameters[0];
        const modifiedParams = {
          ...defaultParams,
          [firstParam.key]:
            firstParam.defaultValue === firstParam.max ? firstParam.min : firstParam.max,
        };
        const resMod = sim.stepAndRender(ctx, 720, 420, 1.1, modifiedParams, []);
        const sigDefault = JSON.stringify(res1.readings);
        const sigMod = JSON.stringify(resMod.readings);
        assert.notEqual(
          sigDefault,
          sigMod,
          `${sim.id} telemetry did not respond when changing ${firstParam.key}`,
        );
      }
    }

    assert.equal(totalLoaded, 50);
  });

  it('loads individual simulation by id', async () => {
    const sim = await loadPhysicsSimulationById('phys-05');
    assert.ok(sim);
    assert.equal(sim.orderNumber, 5);
    assert.match(sim.name, /ném xiên/i);
  });
});

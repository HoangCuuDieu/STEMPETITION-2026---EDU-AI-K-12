import { observationTime, interferenceAt } from './experimentMath.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICS_CATALOG, PHYSICS_GROUPS } from './catalog.ts';
import { loadPhysicsGroup, loadPhysicsSimulationById } from './loader.ts';
import type { PhysicsGroupId } from '../types/physics.ts';

function createMockCanvas2DContext(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    putImageData: noop,
    createImageData: (width: number, height: number) => ({width, height, data: new Uint8ClampedArray(width*height*4)}),
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

  it('ends Newton motion at the visible boundary and an inclined slide at the foot', () => {
    const stop = observationTime('phys-06', {F: 24, m: 4}, 760);
    assert.ok(Math.abs(54 + 3.5 * 3 * stop**2 - (760-185)) < 1e-8);
    assert.equal(observationTime('phys-07', {alpha: 5, mu: 0.7}, 760), 0);
    assert.ok(Math.abs(observationTime('phys-07', {alpha: 30, mu: 0}, 760) ** 2 * 2.45 - 14) < 1e-8);
  });

  it('preserves two-source symmetry and separates displacement from amplitude', () => {
    for (const cycles of [0, 0.25, 2.5, 30]) {
      const center = interferenceAt(0, 1, 3.5, 1, cycles);
      assert.equal(center.amplitude, 2);
      assert.ok(Math.abs(center.u) <= center.amplitude);
      const node = interferenceAt(0.25, 0, 3.5, 1, cycles);
      assert.ok(Math.abs(node.u) < 1e-10);
    }
  });

  it('animates the orbit after 12 s and the pendulum after 25 s', async () => {
    for (const [id, time] of [['phys-20', 14], ['phys-22', 26]] as const) {
      const sim = await loadPhysicsSimulationById(id);
      assert.ok(sim);
      const ctx = createMockCanvas2DContext();
      let position = '';
      ctx.arc = (x, y) => { position = x + ',' + y; };
      sim.stepAndRender(ctx, 760, 420, time, {}, []);
      const previous = position;
      sim.stepAndRender(ctx, 760, 420, time + 0.5, {}, []);
      assert.notEqual(position, previous);
    }
  });

  it('keeps the fixed end at equilibrium and moves the free end continuously', async () => {
    const sim = await loadPhysicsSimulationById('phys-28');
    assert.ok(sim);
    const ctx = createMockCanvas2DContext();
    let y = 0;
    ctx.arc = (_x, currentY) => { y = currentY; };
    const equilibrium = 420*0.55;
    for (const offset of [0, 10, 20]) {
      const time = (660-offset)/225;
      sim.stepAndRender(ctx, 760, 420, time, {fixedEnd: 1, speed: 3}, []);
      assert.equal(y, equilibrium);
      sim.stepAndRender(ctx, 760, 420, time, {fixedEnd: 0, speed: 3}, []);
      assert.ok(Math.abs(equilibrium-y-120*Math.exp(-(offset**2)/600)) < 1e-8);
    }
  });

  it('loads individual simulation by id', async () => {
    const sim = await loadPhysicsSimulationById('phys-05');
    assert.ok(sim);
    assert.equal(sim.orderNumber, 5);
    assert.match(sim.name, /ném xiên/i);
  });
});

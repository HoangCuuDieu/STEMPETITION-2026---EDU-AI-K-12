import type { PhysicsGroupId, PhysicsSimulationSpec } from '../types/physics';

const groupCache = new Map<PhysicsGroupId, PhysicsSimulationSpec[]>();

export async function loadPhysicsGroup(
  groupId: PhysicsGroupId,
): Promise<PhysicsSimulationSpec[]> {
  const cached = groupCache.get(groupId);
  if (cached) return cached;

  let sims: PhysicsSimulationSpec[];
  switch (groupId) {
    case 'A':
      sims = (await import('./groupA_kinematics')).GROUP_A_SIMULATIONS;
      break;
    case 'B':
      sims = (await import('./groupB_dynamics')).GROUP_B_SIMULATIONS;
      break;
    case 'C':
      sims = (await import('./groupC_energyMomentum')).GROUP_C_SIMULATIONS;
      break;
    case 'D':
      sims = (await import('./groupD_circularGravity')).GROUP_D_SIMULATIONS;
      break;
    case 'E':
      sims = (await import('./groupE_oscillations')).GROUP_E_SIMULATIONS;
      break;
    case 'F':
      sims = (await import('./groupF_wavesAcoustics')).GROUP_F_SIMULATIONS;
      break;
    case 'G':
      sims = (await import('./groupG_thermo')).GROUP_G_SIMULATIONS;
      break;
    case 'H':
      sims = (await import('./groupH_electricity')).GROUP_H_SIMULATIONS;
      break;
    case 'I':
      sims = (await import('./groupI_magnetism')).GROUP_I_SIMULATIONS;
      break;
    case 'J':
      sims = (await import('./groupJ_optics')).GROUP_J_SIMULATIONS;
      break;
  }

  groupCache.set(groupId, sims);
  return sims;
}

export async function loadPhysicsSimulationById(
  id: string,
  groupId?: PhysicsGroupId,
): Promise<PhysicsSimulationSpec | undefined> {
  if (groupId) {
    const group = await loadPhysicsGroup(groupId);
    return group.find((s) => s.id === id);
  }
  const allGroups: PhysicsGroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (const g of allGroups) {
    const sims = await loadPhysicsGroup(g);
    const found = sims.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}

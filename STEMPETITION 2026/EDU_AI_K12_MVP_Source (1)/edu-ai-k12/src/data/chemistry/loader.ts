import type { ChemicalModel, ChemistryCategory } from '../../types/chemistry';

const categoryCache = new Map<ChemistryCategory, ChemicalModel[]>();

export async function loadChemistryCategory(
  category: ChemistryCategory,
): Promise<ChemicalModel[]> {
  const cached = categoryCache.get(category);
  if (cached) return cached;

  let list: ChemicalModel[];
  switch (category) {
    case 'element':
      list = (await import('./elements20')).ELEMENTS_20;
      break;
    case 'inorganic':
      list = (await import('./inorganic40')).INORGANIC_40;
      break;
    case 'organic':
      list = (await import('./organic40')).ORGANIC_40;
      break;
  }
  categoryCache.set(category, list);
  return list;
}

export async function loadChemicalModelById(
  id: string,
  category?: ChemistryCategory,
): Promise<ChemicalModel | undefined> {
  if (category) {
    const list = await loadChemistryCategory(category);
    return list.find((m) => m.id === id);
  }
  for (const cat of ['element', 'inorganic', 'organic'] as ChemistryCategory[]) {
    const list = await loadChemistryCategory(cat);
    const found = list.find((m) => m.id === id);
    if (found) return found;
  }
  return undefined;
}

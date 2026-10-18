import {
  ELEMENT_BY_ID,
  RECIPE_BY_PAIR,
  RECIPES_BY_RESULT,
  getUses,
  pairKey,
} from "./recipes.js";

export function inferCraftedPairs(discovered) {
  const known = new Set(discovered || []);
  const pairs = new Set();
  for (const id of known) {
    for (const [a, b] of RECIPES_BY_RESULT.get(id) || []) {
      if (known.has(a) && known.has(b)) pairs.add(pairKey(a, b));
    }
  }
  return [...pairs];
}

export function normalizeCraftedPairs(value, discovered) {
  if (!Array.isArray(value)) return inferCraftedPairs(discovered);
  const pairs = new Set();
  for (const key of value) {
    if (typeof key === "string" && RECIPE_BY_PAIR.has(key)) pairs.add(key);
  }
  return [...pairs];
}

export function buildCraftedPartnerMap(state, selectedIds = []) {
  const selected = new Set(selectedIds);
  const discovered = new Set(state.discovered || []);
  const crafted = new Set(state.craftedPairs || []);
  const partners = new Map();
  if (!selected.size || !crafted.size) return partners;

  for (const sourceId of selected) {
    const source = ELEMENT_BY_ID.get(sourceId);
    if (!source) continue;
    for (const { result, recipe } of getUses(sourceId)) {
      const partnerId = recipe[0] === sourceId ? recipe[1] : recipe[0];
      if (partnerId === sourceId || selected.has(partnerId) || !discovered.has(partnerId)) {
        continue;
      }
      if (!discovered.has(result)) continue;
      if (!crafted.has(pairKey(sourceId, partnerId))) continue;
      let entry = partners.get(partnerId);
      if (!entry) {
        entry = { partnerId, links: [] };
        partners.set(partnerId, entry);
      }
      if (!entry.links.some((link) => link.sourceId === sourceId)) {
        entry.links.push({
          sourceId,
          sourceName: source.name,
          resultName: ELEMENT_BY_ID.get(result)?.name || result,
        });
      }
    }
  }

  return partners;
}

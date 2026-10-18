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

export function normalizeFailedPairs(value) {
  if (!Array.isArray(value)) return [];
  const pairs = new Set();
  for (const key of value) {
    if (typeof key !== "string" || RECIPE_BY_PAIR.has(key)) continue;
    const parts = key.split("+");
    if (parts.length !== 2) continue;
    if (parts.every((part) => ELEMENT_BY_ID.has(part))) pairs.add(key);
  }
  return [...pairs];
}

export function buildPairHistoryMap(state, selectedIds = []) {
  const selected = new Set(selectedIds);
  const discovered = new Set(state.discovered || []);
  const crafted = new Set(state.craftedPairs || []);
  const failed = new Set(state.failedPairs || []);
  const partners = new Map();
  if (!selected.size) return partners;

  const add = (source, partnerId, kind, resultId) => {
    if (!source) return;
    if (partnerId === source.id || selected.has(partnerId) || !discovered.has(partnerId)) return;
    let entry = partners.get(partnerId);
    if (!entry) {
      entry = { partnerId, crafted: [], failed: [] };
      partners.set(partnerId, entry);
    }
    const links = kind === "crafted" ? entry.crafted : entry.failed;
    if (links.some((link) => link.sourceId === source.id)) return;
    links.push({
      sourceId: source.id,
      sourceName: source.name,
      resultName: kind === "crafted" ? ELEMENT_BY_ID.get(resultId)?.name || resultId : null,
    });
  };

  for (const sourceId of selected) {
    const source = ELEMENT_BY_ID.get(sourceId);
    if (!source) continue;
    for (const { result, recipe } of getUses(sourceId)) {
      const partnerId = recipe[0] === sourceId ? recipe[1] : recipe[0];
      if (!discovered.has(result)) continue;
      if (!crafted.has(pairKey(sourceId, partnerId))) continue;
      add(source, partnerId, "crafted", result);
    }
  }

  for (const key of failed) {
    const [a, b] = key.split("+");
    if (!a || !b) continue;
    if (selected.has(a)) add(ELEMENT_BY_ID.get(a), b, "failed");
    if (selected.has(b)) add(ELEMENT_BY_ID.get(b), a, "failed");
  }

  return partners;
}

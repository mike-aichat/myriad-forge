import { ELEMENTS } from "../data/elements/index.js";
import { BASE_IDS, GRANTED_IDS, ROOT_IDS, ENDGAME_IDS } from "../data/schema.js";

export const ELEMENT_BY_ID = new Map(ELEMENTS.map((element) => [element.id, element]));
export const ELEMENT_BY_NAME = new Map(ELEMENTS.map((element) => [element.name, element]));

export const RECIPE_BY_PAIR = new Map();
export const RECIPES_BY_RESULT = new Map();
export const RECIPES_BY_INGREDIENT = new Map();

export function pairKey(a, b) {
  return [a, b].sort().join("+");
}

for (const element of ELEMENTS) {
  if (!element.recipe) continue;
  const recipes = Array.isArray(element.recipe[0]) ? element.recipe : [element.recipe];
  RECIPES_BY_RESULT.set(element.id, recipes);
  for (const recipe of recipes) {
    const [a, b] = recipe;
    const key = pairKey(a, b);
    if (RECIPE_BY_PAIR.has(key)) {
      throw new Error(`配方冲突：${key} → ${element.id} 与 ${RECIPE_BY_PAIR.get(key)}`);
    }
    RECIPE_BY_PAIR.set(key, element.id);
    for (const ingredient of recipe) {
      if (!RECIPES_BY_INGREDIENT.has(ingredient)) RECIPES_BY_INGREDIENT.set(ingredient, []);
      RECIPES_BY_INGREDIENT.get(ingredient).push({ result: element.id, recipe });
    }
  }
}

export const ELEMENT_DEPTH = new Map(ROOT_IDS.map((id) => [id, 0]));

let depthChanged = true;
while (depthChanged) {
  depthChanged = false;
  for (const element of ELEMENTS) {
    if (ELEMENT_DEPTH.has(element.id)) continue;
    let best = Infinity;
    for (const [a, b] of RECIPES_BY_RESULT.get(element.id) || []) {
      if (ELEMENT_DEPTH.has(a) && ELEMENT_DEPTH.has(b)) {
        best = Math.min(best, 1 + Math.max(ELEMENT_DEPTH.get(a), ELEMENT_DEPTH.get(b)));
      }
    }
    if (Number.isFinite(best)) {
      ELEMENT_DEPTH.set(element.id, best);
      depthChanged = true;
    }
  }
}

export function findResult(a, b) {
  if (!a || !b) return null;
  return RECIPE_BY_PAIR.get(pairKey(a, b)) || null;
}

export function getResultRecipes(id) {
  return RECIPES_BY_RESULT.get(id) || [];
}

export function getUses(id) {
  return RECIPES_BY_INGREDIENT.get(id) || [];
}

export const STARTING_ELEMENTS = [...BASE_IDS];
export const GRANTED_ELEMENTS = [...GRANTED_IDS];
export const ENDGAME_ELEMENTS = new Set(ENDGAME_IDS);

export function isEndgame(id) {
  return ENDGAME_ELEMENTS.has(id);
}

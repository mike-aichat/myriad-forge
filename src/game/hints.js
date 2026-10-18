import { ELEMENT_BY_ID, findResult } from "./recipes.js";

export function pickInspirationPair(state) {
  const discovered = [...new Set(state.discovered || [])].filter((id) => ELEMENT_BY_ID.has(id));
  if (discovered.length < 2) return null;

  const discoveredSet = new Set(discovered);
  const pairs = [];
  for (let i = 0; i < discovered.length; i += 1) {
    for (let j = i + 1; j < discovered.length; j += 1) {
      const result = findResult(discovered[i], discovered[j]);
      if (result && !discoveredSet.has(result)) {
        pairs.push([discovered[i], discovered[j]]);
      }
    }
  }
  if (!pairs.length) return null;

  const [aId, bId] = pairs[Math.floor(Math.random() * pairs.length)];
  return [ELEMENT_BY_ID.get(aId), ELEMENT_BY_ID.get(bId)];
}

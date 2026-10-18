import { currentChapter } from "./progress.js";
import { ELEMENT_BY_ID, ELEMENT_LEVEL, findResult } from "./recipes.js";

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function toPair(candidate) {
  return candidate.ingredients.map((id) => ELEMENT_BY_ID.get(id));
}

function levelSum(candidate) {
  return candidate.ingredients.reduce(
    (total, id) => total + (ELEMENT_LEVEL.get(id) ?? Infinity),
    0
  );
}

function buildCandidates(discovered, discoveredSet) {
  const candidates = [];
  for (let i = 0; i < discovered.length; i += 1) {
    for (let j = i + 1; j < discovered.length; j += 1) {
      const result = findResult(discovered[i], discovered[j]);
      if (result && !discoveredSet.has(result)) {
        candidates.push({ ingredients: [discovered[i], discovered[j]], result });
      }
    }
  }
  return candidates;
}

function prioritize(candidates, state, discoveredSet) {
  const openTargets = currentChapter(state).objectives
    .map((objective) => objective.target)
    .filter((id) => !discoveredSet.has(id));

  const targetSet = new Set(openTargets);
  const direct = candidates.filter((candidate) => targetSet.has(candidate.result));
  if (direct.length) return pickRandom(direct);

  let lowestLevel = Infinity;
  for (const candidate of candidates) {
    lowestLevel = Math.min(lowestLevel, ELEMENT_LEVEL.get(candidate.result) ?? Infinity);
  }
  const lowest = candidates.filter(
    (candidate) => (ELEMENT_LEVEL.get(candidate.result) ?? Infinity) === lowestLevel
  );
  let lowestSum = Infinity;
  for (const candidate of lowest) {
    lowestSum = Math.min(lowestSum, levelSum(candidate));
  }
  const cheapest = lowest.filter((candidate) => levelSum(candidate) === lowestSum);
  return pickRandom(cheapest);
}

export function pickInspirationPair(state, focusId = null) {
  const discovered = [...new Set(state.discovered || [])].filter((id) => ELEMENT_BY_ID.has(id));
  if (discovered.length < 2) return null;

  const discoveredSet = new Set(discovered);
  const candidates = buildCandidates(discovered, discoveredSet);
  if (!candidates.length) return null;

  if (focusId && discoveredSet.has(focusId)) {
    const focused = candidates.filter((candidate) =>
      candidate.ingredients.includes(focusId)
    );
    if (focused.length) return toPair(prioritize(focused, state, discoveredSet));
  }

  return toPair(prioritize(candidates, state, discoveredSet));
}

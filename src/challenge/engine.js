import { ELEMENT_BY_ID } from "../game/recipes.js";
import { CHALLENGE_ELEMENT_BY_ID } from "../data/challenges.js";

export function resolveChallengeElement(id) {
  return ELEMENT_BY_ID.get(id) || CHALLENGE_ELEMENT_BY_ID.get(id) || null;
}

export function isMainElement(id) {
  return ELEMENT_BY_ID.has(id);
}

export function challengeFamily(challenge) {
  return challenge.family === "puzzle" ? "puzzle" : "ember";
}

export function isPuzzle(challenge) {
  return challengeFamily(challenge) === "puzzle";
}

export function hasStepLimit(challenge) {
  return Number.isFinite(challenge.stepLimit) && challenge.stepLimit > 0;
}

export function recipeKey(a, b) {
  return [a, b].sort().join("+");
}

export function buildRecipeMap(challenge) {
  const map = new Map();
  for (const recipe of challenge.recipes) {
    map.set(recipeKey(recipe.a, recipe.b), recipe.result);
  }
  return map;
}

export function challengeUniverse(challenge) {
  const ids = new Set(challenge.starterIds);
  for (const recipe of challenge.recipes) {
    ids.add(recipe.a);
    ids.add(recipe.b);
    ids.add(recipe.result);
  }
  return ids;
}

export function minimumSteps(challenge) {
  const starters = new Set(challenge.starterIds);
  const required = new Set();

  const visit = (id) => {
    if (starters.has(id) || required.has(id)) return;
    required.add(id);
    const recipe = challenge.recipes.find((item) => item.result === id);
    if (!recipe) return;
    visit(recipe.a);
    visit(recipe.b);
  };

  visit(challenge.targetId);
  return required.size;
}

export function createRun(challenge) {
  return {
    discovered: [...challenge.starterIds],
    stepsUsed: 0,
    status: "playing",
    beats: [],
  };
}

export function fuseRun(challenge, run, a, b) {
  if (run.status !== "playing") {
    return { run, result: null, isNew: false, won: false, lost: false };
  }
  const next = {
    ...run,
    stepsUsed: run.stepsUsed + 1,
    beats: [...run.beats],
  };
  const resultId = buildRecipeMap(challenge).get(recipeKey(a, b));
  const limited = hasStepLimit(challenge);

  if (!resultId) {
    if (limited && next.stepsUsed >= challenge.stepLimit) next.status = "lost";
    return {
      run: next,
      result: null,
      isNew: false,
      won: false,
      lost: next.status === "lost",
    };
  }

  const isNew = !next.discovered.includes(resultId);
  if (isNew) {
    next.discovered = [...next.discovered, resultId];
    const beat = challenge.beats[resultId];
    if (beat) next.beats = [...next.beats, { id: resultId, text: beat }];
  }

  if (resultId === challenge.targetId) {
    next.status = "won";
  } else if (limited && next.stepsUsed >= challenge.stepLimit) {
    next.status = "lost";
  }

  return {
    run: next,
    result: resolveChallengeElement(resultId),
    isNew,
    won: next.status === "won",
    lost: next.status === "lost",
  };
}

export function attemptsLeft(challenge, run) {
  if (!hasStepLimit(challenge)) return null;
  return Math.max(0, challenge.stepLimit - run.stepsUsed);
}

export function parRating(challenge, stepsUsed) {
  const par = minimumSteps(challenge);
  if (!Number.isFinite(par)) return 1;
  if (stepsUsed <= par) return 3;
  if (stepsUsed <= par + 2) return 2;
  return 1;
}

import { CHAPTERS } from "../data/chapters.js";
import { ELEMENTS } from "../data/elements/index.js";
import { ROOT_IDS } from "../data/schema.js";
import { ELEMENT_BY_ID, RECIPES_BY_RESULT, isEndgame } from "./recipes.js";
import { currentChapter } from "./progress.js";

const CHAPTER_INDEX = new Map(CHAPTERS.map((chapter, index) => [chapter.id, index]));

function buildDepths() {
  const depth = new Map(ROOT_IDS.map((id) => [id, 0]));
  let moving = true;
  while (moving) {
    moving = false;
    for (const element of ELEMENTS) {
      if (depth.has(element.id)) continue;
      let best = Infinity;
      for (const recipe of RECIPES_BY_RESULT.get(element.id) || []) {
        const [a, b] = recipe;
        if (depth.has(a) && depth.has(b)) {
          best = Math.min(best, 1 + Math.max(depth.get(a), depth.get(b)));
        }
      }
      if (Number.isFinite(best)) {
        depth.set(element.id, best);
        moving = true;
      }
    }
  }
  return depth;
}

const DEPTH = buildDepths();

function chapterIndexOfTarget(targetId) {
  for (const chapter of CHAPTERS) {
    if (chapter.objectives.some((objective) => objective.target === targetId)) {
      return CHAPTER_INDEX.get(chapter.id);
    }
  }
  return 99;
}

export function hintCandidates(state) {
  const discovered = new Set(state.discovered);
  const current = currentChapter(state);
  const currentIndex = CHAPTER_INDEX.get(current.id) ?? 0;
  const candidates = [];

  for (const element of ELEMENTS) {
    if (discovered.has(element.id)) continue;
    const recipes = (RECIPES_BY_RESULT.get(element.id) || []).filter(
      ([a, b]) => discovered.has(a) && discovered.has(b)
    );
    if (!recipes.length) continue;
    const chapterIndex = chapterIndexOfTarget(element.id);
    let priority = 40 + chapterIndex;
    if (chapterIndex === currentIndex) priority = 0;
    else if (chapterIndex !== 99) priority = 10 + chapterIndex;
    else if (isEndgame(element.id)) priority = 4;
    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    candidates.push({
      targetId: element.id,
      recipe,
      priority,
      depth: DEPTH.get(element.id) ?? 99,
      chapterIndex,
    });
  }

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return Math.random() - 0.5;
  });
  return candidates;
}

export function drawHint(state) {
  const candidates = hintCandidates(state);
  if (!candidates.length) return null;
  const pool = candidates.slice(0, Math.min(4, candidates.length));
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return {
    target: ELEMENT_BY_ID.get(choice.targetId),
    ingredients: choice.recipe.map((id) => ELEMENT_BY_ID.get(id)),
  };
}

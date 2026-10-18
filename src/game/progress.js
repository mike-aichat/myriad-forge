import { CHAPTERS } from "../data/chapters.js";
import { BASE_IDS, ENDGAME_IDS, state as schema } from "../data/schema.js";
import { ELEMENT_BY_ID, findResult } from "./recipes.js";

export const SAVE_KEY = schema.storageKey;
export const SAVE_VERSION = schema.version;

export function createInitialState() {
  return {
    version: SAVE_VERSION,
    discovered: [...BASE_IDS],
    order: [...BASE_IDS].reverse(),
    completedChapters: [],
    insight: 3,
    fusions: 0,
    successes: 0,
    failures: 0,
    consecutiveFailures: 0,
    hintsUsed: 0,
    introSeen: false,
    endingSeen: false,
    sound: false,
  };
}

function normalizeLoadedState(raw) {
  const base = createInitialState();
  if (!raw || typeof raw !== "object") return base;
  const discovered = Array.isArray(raw.discovered)
    ? [...new Set(raw.discovered.filter((id) => ELEMENT_BY_ID.has(id)))]
    : [];
  for (const id of BASE_IDS) if (!discovered.includes(id)) discovered.push(id);
  const order = Array.isArray(raw.order)
    ? raw.order.filter((id) => discovered.includes(id))
    : [...discovered];
  for (const id of discovered) if (!order.includes(id)) order.push(id);
  const completedChapters = Array.isArray(raw.completedChapters)
    ? raw.completedChapters.filter((id) => CHAPTERS.some((chapter) => chapter.id === id))
    : [];
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    discovered,
    order,
    completedChapters,
    insight: Number.isFinite(raw.insight) ? Math.max(0, Math.floor(raw.insight)) : base.insight,
    fusions: Number.isFinite(raw.fusions) ? Math.max(0, raw.fusions) : 0,
    successes: Number.isFinite(raw.successes) ? Math.max(0, raw.successes) : 0,
    failures: Number.isFinite(raw.failures) ? Math.max(0, raw.failures) : 0,
    consecutiveFailures: Number.isFinite(raw.consecutiveFailures) ? Math.max(0, raw.consecutiveFailures) : 0,
    hintsUsed: Number.isFinite(raw.hintsUsed) ? Math.max(0, raw.hintsUsed) : 0,
    introSeen: Boolean(raw.introSeen),
    endingSeen: Boolean(raw.endingSeen),
    sound: Boolean(raw.sound),
  };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // A game should keep running even if storage is unavailable.
  }
}

export function resetState() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return createInitialState();
}

export function currentChapter(state) {
  return (
    CHAPTERS.find((chapter) => !state.completedChapters.includes(chapter.id)) ||
    CHAPTERS[CHAPTERS.length - 1]
  );
}

export function chapterIsUnlocked(state, chapter) {
  const index = CHAPTERS.findIndex((item) => item.id === chapter.id);
  if (index <= 0) return true;
  return state.completedChapters.includes(CHAPTERS[index - 1].id);
}

export function chapterProgress(state, chapter) {
  const done = chapter.objectives.filter((objective) => state.discovered.includes(objective.target)).length;
  return { done, total: chapter.objectives.length, complete: done === chapter.objectives.length };
}

export function completedChaptersCount(state) {
  return state.completedChapters.length;
}

export function currentObjectives(state) {
  return currentChapter(state).objectives;
}

function grantElement(state, id) {
  if (state.discovered.includes(id)) return { state, granted: false };
  return {
    state: {
      ...state,
      discovered: [...state.discovered, id],
      order: [...state.order, id],
    },
    granted: true,
  };
}

export function checkChapters(inputState) {
  let state = inputState;
  const events = [];
  let guard = 0;
  while (guard < CHAPTERS.length + 1) {
    guard += 1;
    const chapter = currentChapter(state);
    if (!chapter || state.completedChapters.includes(chapter.id)) break;
    const progress = chapterProgress(state, chapter);
    if (!progress.complete) break;
    const unlocked = [];
    state = {
      ...state,
      completedChapters: [...state.completedChapters, chapter.id],
      insight: state.insight + (chapter.reward?.insight || 0),
      endingSeen: chapter.ending ? true : state.endingSeen,
    };
    for (const id of chapter.reward?.unlock || []) {
      const result = grantElement(state, id);
      state = result.state;
      if (result.granted) unlocked.push(id);
    }
    events.push({
      chapter,
      unlocked,
      insight: chapter.reward?.insight || 0,
    });
  }
  return { state, events };
}

function insightMilestone(previousCount, nextCount) {
  return Math.floor(nextCount / 10) > Math.floor(previousCount / 10);
}

export function fuseElements(inputState, a, b) {
  const resultId = findResult(a, b);
  let state = { ...inputState, fusions: inputState.fusions + 1 };
  if (!resultId) {
    state = {
      ...state,
      failures: state.failures + 1,
      consecutiveFailures: state.consecutiveFailures + 1,
    };
    let bonusInsight = 0;
    if (state.consecutiveFailures >= 8) {
      state = {
        ...state,
        insight: state.insight + 1,
        consecutiveFailures: 0,
      };
      bonusInsight = 1;
    }
    return {
      state,
      resultId: null,
      isNew: false,
      bonusInsight,
      milestone: false,
      chapterEvents: [],
    };
  }

  state = {
    ...state,
    successes: state.successes + 1,
    consecutiveFailures: 0,
  };
  const isNew = !state.discovered.includes(resultId);
  let milestone = false;
  let bonusInsight = 0;
  if (isNew) {
    const previousCount = state.discovered.length;
    state = {
      ...state,
      discovered: [...state.discovered, resultId],
      order: [...state.order, resultId],
    };
    if (insightMilestone(previousCount, state.discovered.length)) {
      state = { ...state, insight: state.insight + 1 };
      milestone = true;
      bonusInsight = 1;
    }
  }
  const chapterResult = checkChapters(state);
  state = chapterResult.state;
  return {
    state,
    resultId,
    isNew,
    bonusInsight,
    milestone,
    chapterEvents: chapterResult.events,
  };
}

export function grantChapterRewards(state, chapter) {
  let next = state;
  const granted = [];
  for (const id of chapter.reward?.unlock || []) {
    const result = grantElement(next, id);
    next = result.state;
    if (result.granted) granted.push(id);
  }
  return { state: next, granted };
}

export function stats(state) {
  return {
    discovered: state.discovered.length,
    total: ELEMENT_BY_ID.size,
    fusions: state.fusions,
    failures: state.failures,
    successes: state.successes,
    rate: state.fusions ? Math.round((state.successes / state.fusions) * 100) : 0,
    chapters: state.completedChapters.length,
    totalChapters: CHAPTERS.length,
  };
}

export function finalChapterReached(state) {
  return state.completedChapters.includes(CHAPTERS[CHAPTERS.length - 1].id);
}

export function nextEndgameTargets(state) {
  return ENDGAME_IDS.filter((id) => !state.discovered.includes(id));
}

import { ELEMENTS } from "../src/data/elements/index.js";
import { CATEGORIES } from "../src/data/categories.js";
import { CHAPTERS } from "../src/data/chapters.js";
import { BASE_IDS, GRANTED_IDS, ROOT_IDS, ENDGAME_IDS } from "../src/data/schema.js";
import { resolveShapeName } from "../src/art/shapes.js";
import { createInitialState, fuseElements } from "../src/game/progress.js";
import { RECIPES_BY_RESULT, findResult } from "../src/game/recipes.js";
import { drawHint } from "../src/game/hints.js";
import { CHALLENGES, CHALLENGE_ELEMENTS } from "../src/data/challenges.js";
import {
  challengeFamily,
  createRun,
  fuseRun,
  hasStepLimit,
  isPuzzle,
  minimumSteps,
  recipeKey,
  resolveChallengeElement,
} from "../src/challenge/engine.js";

const errors = [];
const warnings = [];
const byId = new Map();
const byName = new Map();
const pairOwners = new Map();
const categoryIds = new Set(CATEGORIES.map((category) => category.id));

function fail(message) {
  errors.push(message);
}

function normalizeRecipes(element) {
  if (!element.recipe) return [];
  return Array.isArray(element.recipe[0]) ? element.recipe : [element.recipe];
}

for (const element of ELEMENTS) {
  if (byId.has(element.id)) fail(`重复 ID：${element.id}`);
  if (byName.has(element.name)) fail(`重复名称：${element.name}（${byId.get(byName.get(element.name))?.id}）`);
  byId.set(element.id, element);
  byName.set(element.name, element.id);
  if (!categoryIds.has(element.category)) fail(`${element.id} 的类型不存在：${element.category}`);
  if (!element.description || element.description.trim().length < 8) {
    fail(`${element.id} 的描述太短或为空`);
  }
  if (!element.shape) fail(`${element.id} 缺少像素图形`);
  if (!resolveShapeName(element.shape)) fail(`${element.id} 的像素图形没有绘制：${element.shape}`);
}

for (const element of ELEMENTS) {
  const recipes = normalizeRecipes(element);
  if (!ROOT_IDS.includes(element.id) && recipes.length === 0) {
    fail(`${element.id} 既不是源初要素，也没有配方`);
  }
  for (const recipe of recipes) {
    if (!Array.isArray(recipe) || recipe.length !== 2) {
      fail(`${element.id} 的配方格式错误`);
      continue;
    }
    const [a, b] = recipe;
    if (a === b) fail(`${element.id} 的配方不能自我合成（${a}）`);
    if (!byId.has(a)) fail(`${element.id} 的配方引用了不存在的要素：${a}`);
    if (!byId.has(b)) fail(`${element.id} 的配方引用了不存在的要素：${b}`);
    const key = [a, b].sort().join("+");
    if (pairOwners.has(key) && pairOwners.get(key) !== element.id) {
      fail(`配方冲突：${pairOwners.get(key)} 与 ${element.id} 都使用 ${a} + ${b}`);
    }
    pairOwners.set(key, element.id);
  }
}

const depth = new Map();
for (const id of ROOT_IDS) depth.set(id, 0);

let changed = true;
let guard = 0;
while (changed && guard < 1000) {
  changed = false;
  guard += 1;
  for (const element of ELEMENTS) {
    if (depth.has(element.id)) continue;
    const recipes = normalizeRecipes(element);
    let best = Infinity;
    for (const [a, b] of recipes) {
      if (depth.has(a) && depth.has(b)) {
        best = Math.min(best, 1 + Math.max(depth.get(a), depth.get(b)));
      }
    }
    if (Number.isFinite(best)) {
      depth.set(element.id, best);
      changed = true;
    }
  }
}

for (const element of ELEMENTS) {
  if (!depth.has(element.id)) fail(`${element.id} 无法从源初要素抵达`);
}

const endgameDepths = [];
for (const id of ENDGAME_IDS) {
  const value = depth.get(id);
  const element = byId.get(id);
  if (!element) {
    fail(`终局要素不存在：${id}`);
    continue;
  }
  endgameDepths.push([element.name, value]);
  if (value === undefined || value < 6) {
    fail(`终局要素 ${element.name}（${id}）深度不足 6：${value}`);
  }
}

if (ELEMENTS.length <= 300) fail(`要素数量必须大于 300，目前 ${ELEMENTS.length}`);
if (new Set(ELEMENTS.map((element) => element.category)).size !== CATEGORIES.length) {
  fail("有类型没有任何要素");
}
for (const id of BASE_IDS) {
  if (!byId.has(id)) fail(`缺少基础要素：${id}`);
}
for (const id of GRANTED_IDS) {
  if (!byId.has(id)) fail(`缺少馈赠要素：${id}`);
}

const counts = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0]));
for (const element of ELEMENTS) counts[element.category] += 1;

function computeDepth(roots) {
  const result = new Map(roots.map((id) => [id, 0]));
  let moving = true;
  while (moving) {
    moving = false;
    for (const element of ELEMENTS) {
      if (result.has(element.id)) continue;
      let best = Infinity;
      for (const [a, b] of normalizeRecipes(element)) {
        if (result.has(a) && result.has(b)) {
          best = Math.min(best, 1 + Math.max(result.get(a), result.get(b)));
        }
      }
      if (Number.isFinite(best)) {
        result.set(element.id, best);
        moving = true;
      }
    }
  }
  return result;
}

if (CHAPTERS.length < 6) fail(`章节数量不足：${CHAPTERS.length}`);
const chapterTargets = new Set();
let unlockedRoots = [...BASE_IDS];
for (const [index, chapter] of CHAPTERS.entries()) {
  if (chapter.order !== index) fail(`章节 ${chapter.id} 的序号不连续`);
  if (!chapter.objectives?.length) fail(`章节 ${chapter.id} 没有任务`);
  const depthAtChapter = computeDepth(unlockedRoots);
  const localTargets = new Set();
  for (const objective of chapter.objectives || []) {
    if (!byId.has(objective.target)) {
      fail(`章节「${chapter.title}」引用了不存在的要素：${objective.target}`);
      continue;
    }
    if (localTargets.has(objective.target)) fail(`章节「${chapter.title}」重复任务：${objective.target}`);
    localTargets.add(objective.target);
    chapterTargets.add(objective.target);
    if (!depthAtChapter.has(objective.target)) {
      fail(`章节「${chapter.title}」的任务 ${byId.get(objective.target).name} 在当前解锁阶段无法抵达`);
    }
  }
  const finalChapter = index === CHAPTERS.length - 1;
  if (finalChapter) {
    const endgamesInFinal = (chapter.objectives || []).filter((objective) => ENDGAME_IDS.includes(objective.target));
    if (endgamesInFinal.length < 5) {
      fail(`终章只包含 ${endgamesInFinal.length} 个终局要素，少于 5 个`);
    }
  }
  for (const id of chapter.reward?.unlock || []) {
    if (!byId.has(id)) fail(`章节「${chapter.title}」的解锁奖励不存在：${id}`);
    if (!unlockedRoots.includes(id)) unlockedRoots = [...unlockedRoots, id];
  }
}

const deepest = [...depth.entries()]
  .map(([id, value]) => [byId.get(id).name, value])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12);

// 完整逻辑试玩：从四种源初开始，按任意可合成顺序一路熔炼到结局。
let simulated = { ...createInitialState(), introSeen: true };
let simulationSteps = 0;
let simulationGuard = 0;
while (simulated.discovered.length < ELEMENTS.length && simulationGuard < ELEMENTS.length * 4) {
  simulationGuard += 1;
  const have = new Set(simulated.discovered);
  let candidate = null;
  for (const element of ELEMENTS) {
    if (have.has(element.id)) continue;
    const recipe = (RECIPES_BY_RESULT.get(element.id) || []).find(
      ([a, b]) => have.has(a) && have.has(b)
    );
    if (recipe) {
      candidate = { element, recipe };
      break;
    }
  }
  if (!candidate) break;
  simulated = fuseElements(simulated, candidate.recipe[0], candidate.recipe[1]).state;
  simulationSteps += 1;
}

if (simulated.discovered.length !== ELEMENTS.length) {
  fail(`完整试玩只抵达 ${simulated.discovered.length}/${ELEMENTS.length} 个要素`);
}
if (simulated.completedChapters.length !== CHAPTERS.length) {
  fail(`完整试玩只完成 ${simulated.completedChapters.length}/${CHAPTERS.length} 章`);
}
if (!simulated.endingSeen) fail("完整试玩未触发结局标记");
for (const id of ENDGAME_IDS) {
  if (!simulated.discovered.includes(id)) fail(`完整试玩缺少终局要素：${byId.get(id)?.name || id}`);
}
if (simulationSteps !== ELEMENTS.length - ROOT_IDS.length) {
  fail(`完整试玩熔炼次数异常：${simulationSteps}`);
}

// 失败分支与灵光提示的烟雾测试。
let failurePair = null;
for (const a of simulated.discovered) {
  for (const b of simulated.discovered) {
    if (a !== b && !findResult(a, b)) {
      failurePair = [a, b];
      break;
    }
  }
  if (failurePair) break;
}
if (!failurePair) {
  fail("找不到任何不会产生结果的组合，无法测试失败分支");
} else {
  const failed = fuseElements(simulated, failurePair[0], failurePair[1]);
  if (failed.resultId !== null || failed.state.failures !== simulated.failures + 1) {
    fail("失败熔炼没有正确记录失败次数");
  }
}

const smokeHint = drawHint(createInitialState());
if (!smokeHint || !smokeHint.ingredients.every((ingredient) => createInitialState().discovered.includes(ingredient.id))) {
  fail("灵光提示没有返回一对已拥有的要素");
}

// 炉外试炼：独立牌堆、故事节拍、目标与最少熔炼次数。
const challengeIds = new Set();
let mainTargetCount = 0;
let challengeOnlyTargetCount = 0;
const challengeSummaries = [];

const challengeElementIds = new Set();
const challengeElementNames = new Set();
for (const element of CHALLENGE_ELEMENTS) {
  if (byId.has(element.id)) fail(`试炼要素与主线要素 ID 冲突：${element.id}`);
  if (challengeElementIds.has(element.id)) fail(`试炼要素 ID 重复：${element.id}`);
  challengeElementIds.add(element.id);
  if (!element.name || !element.description || element.description.trim().length < 8) {
    fail(`试炼要素 ${element.id} 缺少名称或描述`);
  }
  if (challengeElementNames.has(element.name)) fail(`试炼要素名称重复：${element.name}`);
  challengeElementNames.add(element.name);
  if (!categoryIds.has(element.category)) fail(`试炼要素 ${element.id} 的类型不存在：${element.category}`);
  if (!resolveShapeName(element.shape)) fail(`试炼要素 ${element.id} 的像素图形没有绘制：${element.shape}`);
}

if (!CHALLENGES.length) fail("没有任何炉外试炼");

for (const challenge of CHALLENGES) {
  if (challengeIds.has(challenge.id)) fail(`试炼 ID 重复：${challenge.id}`);
  challengeIds.add(challenge.id);
  const family = challengeFamily(challenge);
  const puzzle = isPuzzle(challenge);
  if (challenge.family !== undefined && !["puzzle", "ember"].includes(challenge.family)) {
    fail(`试炼「${challenge.id}」的 family 无效：${challenge.family}`);
  }
  for (const field of ["title", "subtitle", "quote", "intro", "objective", "clue", "opening", "outro", "fail"]) {
    if (!challenge[field] || !String(challenge[field]).trim()) {
      fail(`试炼「${challenge.id}」缺少故事字段：${field}`);
    }
  }
  if (!Array.isArray(challenge.starterIds) || challenge.starterIds.length < 2) {
    fail(`试炼「${challenge.title}」起始要素不足`);
  }
  if (new Set(challenge.starterIds).size !== challenge.starterIds.length) {
    fail(`试炼「${challenge.title}」起始要素重复`);
  }
  if (puzzle) {
    if (hasStepLimit(challenge)) fail(`谜题「${challenge.title}」不应有余烬上限`);
    if (!Array.isArray(challenge.hints) || challenge.hints.length < 3) {
      fail(`谜题「${challenge.title}」至少需要 3 条提示`);
    } else if (challenge.hints.some((hint) => !String(hint).trim())) {
      fail(`谜题「${challenge.title}」存在空提示`);
    }
    if (challenge.starterIds.length < 5) {
      fail(`谜题「${challenge.title}」至少需要 5 种起始要素`);
    }
  } else if (!hasStepLimit(challenge)) {
    fail(`燃尽试炼「${challenge.title}」缺少有效的余烬上限`);
  }
  const targetElement = resolveChallengeElement(challenge.targetId);
  if (!targetElement) fail(`试炼「${challenge.title}」的目标不存在：${challenge.targetId}`);
  if (challenge.starterIds.includes(challenge.targetId)) {
    fail(`试炼「${challenge.title}」的目标不能是起始要素`);
  }
  const isMainTarget = byId.has(challenge.targetId);
  if (isMainTarget) mainTargetCount += 1;
  else challengeOnlyTargetCount += 1;

  for (const id of challenge.starterIds) {
    if (!resolveChallengeElement(id)) fail(`试炼「${challenge.title}」的起始要素不存在：${id}`);
  }

  if (puzzle) {
    const mainStarters = challenge.starterIds.filter((id) => byId.has(id));
    if (mainStarters.length) {
      fail(`谜题「${challenge.title}」的起始要素必须全部来自主线之外：${mainStarters.join(", ")}`);
    }
    if (!(challenge.recipes || []).some((recipe) => recipe.optional)) {
      fail(`谜题「${challenge.title}」至少需要一条可选或诱饵配方`);
    }
  }

  const pairSet = new Set();
  for (const recipe of challenge.recipes || []) {
    if (!recipe || !recipe.a || !recipe.b || !recipe.result) {
      fail(`试炼「${challenge.title}」存在格式错误的配方`);
      continue;
    }
    if (recipe.a === recipe.b) fail(`试炼「${challenge.title}」的配方不能自我合成：${recipe.a}`);
    if (!resolveChallengeElement(recipe.a)) fail(`试炼「${challenge.title}」配方引用不存在的要素：${recipe.a}`);
    if (!resolveChallengeElement(recipe.b)) fail(`试炼「${challenge.title}」配方引用不存在的要素：${recipe.b}`);
    if (!resolveChallengeElement(recipe.result)) fail(`试炼「${challenge.title}」配方结果不存在：${recipe.result}`);
    if (puzzle && [recipe.a, recipe.b, recipe.result].some((id) => byId.has(id))) {
      fail(`谜题「${challenge.title}」的配方不能引用主线要素：${recipe.a} + ${recipe.b} → ${recipe.result}`);
    }
    const key = recipeKey(recipe.a, recipe.b);
    if (pairSet.has(key)) fail(`试炼「${challenge.title}」重复配方：${recipe.a} + ${recipe.b}`);
    pairSet.add(key);
  }

  const reachable = new Set(challenge.starterIds);
  let moving = true;
  while (moving) {
    moving = false;
    for (const recipe of challenge.recipes || []) {
      if (reachable.has(recipe.a) && reachable.has(recipe.b) && !reachable.has(recipe.result)) {
        reachable.add(recipe.result);
        moving = true;
      }
    }
  }
  for (const recipe of challenge.recipes || []) {
    for (const id of [recipe.a, recipe.b, recipe.result]) {
      if (!reachable.has(id)) fail(`试炼「${challenge.title}」的配方链超出了限定牌堆：${id}`);
    }
  }
  for (const result of reachable) {
    if (!challenge.starterIds.includes(result) && !challenge.beats?.[result]) {
      fail(`试炼「${challenge.title}」的要素 ${resolveChallengeElement(result)?.name || result} 没有故事节拍`);
    }
  }

  const best = minimumSteps(challenge);
  if (!Number.isFinite(best)) fail(`试炼「${challenge.title}」的目标无法从起始要素抵达`);
  if (hasStepLimit(challenge) && best > challenge.stepLimit) {
    fail(`试炼「${challenge.title}」最少需要 ${best} 次熔炼，但余烬上限只有 ${challenge.stepLimit}`);
  }

  if (puzzle) {
    let wrongPair = null;
    for (let i = 0; i < challenge.starterIds.length && !wrongPair; i += 1) {
      for (let j = i + 1; j < challenge.starterIds.length; j += 1) {
        const key = recipeKey(challenge.starterIds[i], challenge.starterIds[j]);
        if (!pairSet.has(key)) {
          wrongPair = [challenge.starterIds[i], challenge.starterIds[j]];
          break;
        }
      }
    }
    if (!wrongPair) {
      fail(`谜题「${challenge.title}」没有可用于测试的无效组合`);
    } else {
      const failed = fuseRun(challenge, createRun(challenge), wrongPair[0], wrongPair[1]);
      if (failed.lost || failed.result || failed.run.status !== "playing") {
        fail(`谜题「${challenge.title}」的无效组合不应导致失败`);
      }
    }
  }

  // 用实际试炼引擎跑一次路线，确保完成判定与余烬结算可用。
  let simulatedChallenge = createRun(challenge);
  let guard = 0;
  const guardLimit = hasStepLimit(challenge)
    ? challenge.stepLimit + 2
    : (challenge.recipes || []).length + best + 6;
  while (!simulatedChallenge.discovered.includes(challenge.targetId) && guard < guardLimit) {
    guard += 1;
    const known = new Set(simulatedChallenge.discovered);
    const nextRecipe = (challenge.recipes || []).find(
      (recipe) => known.has(recipe.a) && known.has(recipe.b) && !known.has(recipe.result)
    );
    if (!nextRecipe) break;
    const outcome = fuseRun(challenge, simulatedChallenge, nextRecipe.a, nextRecipe.b);
    simulatedChallenge = outcome.run;
    if (outcome.won) break;
  }
  if (!simulatedChallenge.discovered.includes(challenge.targetId) || simulatedChallenge.status !== "won") {
    fail(`试炼「${challenge.title}」的试炼引擎无法完成目标`);
  }
  challengeSummaries.push({
    name: challenge.title,
    target: targetElement?.name || challenge.targetId,
    targetKind: isMainTarget ? "主线" : "限定",
    steps: Number.isFinite(best) ? best : "?",
    limit: hasStepLimit(challenge) ? challenge.stepLimit : null,
    family,
  });
}

const puzzleCount = CHALLENGES.filter((challenge) => isPuzzle(challenge)).length;
const emberCount = CHALLENGES.length - puzzleCount;
if (CHALLENGES.length !== 8) fail(`试炼数量应为 8（4 谜题 + 4 燃尽），目前 ${CHALLENGES.length}`);
if (puzzleCount !== 4) fail(`谜题数量应为 4，目前 ${puzzleCount}`);
if (emberCount !== 4) fail(`燃尽试炼数量应为 4，目前 ${emberCount}`);
if (mainTargetCount < 1) fail("至少需要一个以主线要素为目标的试炼");
if (challengeOnlyTargetCount < 1) fail("至少需要一个以试炼限定要素为目标的试炼");

if (errors.length) {
  console.error(`✕ 数据校验失败（${errors.length} 项）`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log("✓ 数据校验通过");
}

console.log(`\n要素总数：${ELEMENTS.length}`);
console.log(`配方数：${pairOwners.size}`);
console.log("类型分布：");
for (const category of CATEGORIES) console.log(`  ${category.name.padEnd(3, "　")} ${counts[category.id]}`);
console.log("\n终局要素深度：");
for (const [name, value] of endgameDepths) console.log(`  ${name}：${value}`);
console.log("\n最深要素：");
for (const [name, value] of deepest) console.log(`  ${name}：${value}`);
console.log(
  `\n完整试玩：${simulationSteps} 次熔炼 · ${simulated.discovered.length} 个要素 · ${simulated.completedChapters.length} 章 · 结局${simulated.endingSeen ? "已触发" : "未触发"}`
);
console.log(
  `\n炉外试炼：${CHALLENGES.length} 则 · 谜题 ${puzzleCount} · 燃尽 ${emberCount} · 主线目标 ${mainTargetCount} · 限定目标 ${challengeOnlyTargetCount}`
);
for (const summary of challengeSummaries) {
  const rule =
    summary.family === "puzzle"
      ? `无步数限制 · Par ${summary.steps} 步`
      : `最少 ${summary.steps} 次 / 余烬 ${summary.limit} 次`;
  console.log(
    `  ${summary.family === "puzzle" ? "谜题" : "燃尽"} · ${summary.name}：${summary.target}（${summary.targetKind}）· ${rule}`
  );
}
if (warnings.length) {
  console.log("\n提醒：");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

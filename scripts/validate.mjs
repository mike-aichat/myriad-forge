import { ELEMENTS } from "../src/data/elements/index.js";
import { CATEGORIES } from "../src/data/categories.js";
import { CHAPTERS } from "../src/data/chapters.js";
import { BASE_IDS, GRANTED_IDS, ROOT_IDS, ENDGAME_IDS } from "../src/data/schema.js";
import { resolveShapeName } from "../src/art/shapes.js";
import { createInitialState, fuseElements } from "../src/game/progress.js";
import { RECIPES_BY_RESULT, findResult } from "../src/game/recipes.js";
import { drawHint } from "../src/game/hints.js";

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
if (warnings.length) {
  console.log("\n提醒：");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

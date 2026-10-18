import { ELEMENTS } from "../src/data/elements/index.js";
import { CATEGORIES } from "../src/data/categories.js";
import { CHAPTERS } from "../src/data/chapters.js";
import { BASE_IDS, GRANTED_IDS, ROOT_IDS, ENDGAME_IDS } from "../src/data/schema.js";
import { resolveShapeName } from "../src/art/shapes.js";
import { createInitialState, fuseElements } from "../src/game/progress.js";
import { buildPairHistoryMap, inferCraftedPairs, normalizeCraftedPairs, normalizeFailedPairs } from "../src/game/craftedPairs.js";
import { ELEMENT_LEVEL, RECIPES_BY_RESULT, findResult, pairKey } from "../src/game/recipes.js";
import { buildElementUseStatus } from "../src/game/recipeStatus.js";
import { pickInspirationPair } from "../src/game/hints.js";
import { buildTreeLayout } from "../src/tree/layout.js";
import { CHALLENGES, CHALLENGE_ELEMENTS } from "../src/data/challenges.js";
import { QUESTS, QUEST_ELEMENTS } from "../src/data/quests.js";
import {
  ARTIFACTS,
  ARTIFACT_FRAGMENTS,
  ARTIFACT_TIERS,
  MISIDENTIFIED,
} from "../src/data/artifacts.js";
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
import {
  availableRecipeMap,
  chooseQuestOption,
  createQuestRun,
  fuseQuest,
  questRecipeKey,
  questUniverse,
} from "../src/quest/engine.js";
import {
  artifactComplete,
  artifactHint,
  artifactKey,
  buildFakeMap,
  buildTrueMap,
  createArtifactRun,
  curatorStage,
  forgeArtifact,
  tierProgress,
} from "../src/artifact/engine.js";
import { buildCollection } from "../src/challenge/collection.js";

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
  if (element.id.includes("+")) fail(`要素 ID 不能包含用于配对键的加号：${element.id}`);
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
const initialStatus = buildElementUseStatus(createInitialState());
if (initialStatus.get("life")?.kind !== "unknown") fail("未发现要素不应显示材料用途标记");
if (initialStatus.get("fire")?.kind !== "active") fail("初始的火应能作为材料造出新要素");
if (initialStatus.get("water")?.kind !== "active") fail("初始的水应能作为材料造出新要素");

const afterSteam = fuseElements(createInitialState(), "fire", "water").state;
const afterSteamStatus = buildElementUseStatus(afterSteam);
if (afterSteamStatus.get("steam")?.kind !== "idle") {
  fail("蒸汽只有铁这一条用途，铁未发现时应标记为“当前无新结果”");
}
if (afterSteamStatus.get("fire")?.kind !== "active") {
  fail("蒸汽发现后，火仍应能与其他已发现要素造出新要素");
}

const allKnownStatus = buildElementUseStatus({
  ...createInitialState(),
  discovered: ELEMENTS.map((element) => element.id),
});
if (![...allKnownStatus.values()].every((status) => status.kind === "exhausted")) {
  fail("全部要素发现后，所有材料都应标记为“已无新结果”");
}

// 配对历史：成功记产物，失败记无果；选中材料后在图鉴里标出两类旧搭档。
const freshState = createInitialState();
if (freshState.craftedPairs.length !== 0 || freshState.failedPairs.length !== 0) {
  fail("初始存档不应带有配对历史");
}
const craftedSteam = fuseElements(freshState, "fire", "water");
if (!craftedSteam.state.craftedPairs.includes("fire+water")) {
  fail("成功熔炼没有记录配对：fire+water");
}
if (craftedSteam.state.craftedPairs.length !== 1) {
  fail(`首次成功熔炼应只记录一对，目前 ${craftedSteam.state.craftedPairs.length}`);
}
const firePartners = buildPairHistoryMap(craftedSteam.state, ["fire"]);
if (!firePartners.has("water")) fail("选中火时，图鉴没有标出已经熔过的水");
if (firePartners.get("water")?.crafted?.[0]?.resultName !== "蒸汽") {
  fail("已熔配对的提示没有带上当时的产物");
}
const waterPartners = buildPairHistoryMap(craftedSteam.state, ["water"]);
if (!waterPartners.has("fire")) fail("选中水时，图鉴没有标出已经熔过的火");
const bothSelected = buildPairHistoryMap(craftedSteam.state, ["fire", "water"]);
if (bothSelected.size !== 0) fail("已经放进熔炉的搭档不应再重复加配对标记");

const failedSteam = fuseElements(craftedSteam.state, "fire", "steam");
if (failedSteam.resultId !== null) fail("火 + 蒸汽不应产生结果");
if (!failedSteam.state.failedPairs.includes("fire+steam")) {
  fail("失败熔炼没有记录无果配对：fire+steam");
}
if (failedSteam.state.craftedPairs.length !== 1) {
  fail("失败熔炼不应该写入已熔配对");
}
const fireHistory = buildPairHistoryMap(failedSteam.state, ["fire"]);
if (!fireHistory.get("steam")?.failed?.length) fail("选中火时，图鉴没有标出试过无果的蒸汽");
if (!fireHistory.get("water")?.crafted?.length) fail("失败记录不能覆盖已经熔过的水");
const failedAgain = fuseElements(failedSteam.state, "fire", "steam").state;
if (failedAgain.failedPairs.filter((key) => key === "fire+steam").length !== 1) {
  fail("重复失败同一对要素时，无果配对被重复记录");
}
const replayedSteam = fuseElements(craftedSteam.state, "fire", "water").state;
if (replayedSteam.craftedPairs.filter((key) => key === "fire+water").length !== 1) {
  fail("重复熔炼同一对要素时，已熔配对被重复记录");
}
const inferredPairs = inferCraftedPairs(["fire", "water", "steam"]);
if (!inferredPairs.includes("fire+water")) fail("旧存档迁移没有从已发现图鉴补出已熔配对");
const migratedPairs = normalizeCraftedPairs(undefined, ["fire", "water", "steam"]);
if (!migratedPairs.includes("fire+water")) fail("缺少 craftedPairs 字段的旧存档没有补出已熔配对");
const migratedFailed = normalizeFailedPairs(undefined);
if (migratedFailed.length !== 0) fail("缺少 failedPairs 字段的旧存档不应凭空补出失败记录");
const sanitizedFailed = normalizeFailedPairs(["fire+steam", "fire+water"]);
if (sanitizedFailed.length !== 1 || sanitizedFailed[0] !== "fire+steam") {
  fail("失败记录不应接受会产生结果的配对");
}
if (simulated.craftedPairs.length !== simulationSteps) {
  fail(`完整试玩后已熔配对数 ${simulated.craftedPairs.length} 与熔炼次数 ${simulationSteps} 不一致`);
}
if (simulated.failedPairs.length !== 0) {
  fail(`完整试玩不应产生失败配对，目前 ${simulated.failedPairs.length}`);
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
  if (failed.state.craftedPairs.length !== simulated.craftedPairs.length) {
    fail("失败熔炼不应该写入已熔配对");
  }
  const failedKey = pairKey(failurePair[0], failurePair[1]);
  if (!failed.state.failedPairs.includes(failedKey)) {
    fail("失败熔炼没有写入无果配对");
  }
  if (failed.state.failedPairs.length !== simulated.failedPairs.length + 1) {
    fail("失败熔炼写入无果配对的数量不正确");
  }
}

for (const id of ROOT_IDS) {
  if (ELEMENT_LEVEL.get(id) !== 0) fail(`源初或馈赠要素不是 Lv0：${id}`);
}
for (const element of ELEMENTS) {
  if (ELEMENT_LEVEL.get(element.id) !== depth.get(element.id)) {
    fail(`要素等级与校验深度不一致：${element.id}`);
  }
  if (element.recipe) {
    const recipes = Array.isArray(element.recipe[0]) ? element.recipe : [element.recipe];
    const expected = Math.min(
      ...recipes.map(([a, b]) => 1 + Math.max(ELEMENT_LEVEL.get(a), ELEMENT_LEVEL.get(b)))
    );
    if (ELEMENT_LEVEL.get(element.id) !== expected) {
      fail(`要素等级不符合“较高材料等级 + 1”：${element.id}`);
    }
  }
}

const inspirationState = createInitialState();
const prologueTargets = new Set(CHAPTERS[0].objectives.map((objective) => objective.target));
for (let i = 0; i < 50; i += 1) {
  const inspiration = pickInspirationPair(inspirationState);
  if (
    !inspiration ||
    inspiration[0].id === inspiration[1].id ||
    !inspiration.every((element) => inspirationState.discovered.includes(element.id))
  ) {
    fail("灵光没有返回一对不同的已拥有要素");
  }
  const inspirationResult = findResult(inspiration[0].id, inspiration[1].id);
  if (!inspirationResult || inspirationState.discovered.includes(inspirationResult)) {
    fail("灵光挑中的组合不能熔出未发现的新要素");
  }
  if (!prologueTargets.has(inspirationResult)) {
    fail("灵光没有优先完成当前手记目标");
  }
}
const onlyPairState = {
  ...createInitialState(),
  discovered: ["fire", "water"],
};
const onlyPair = pickInspirationPair(onlyPairState);
if (!onlyPair || pairKey(onlyPair[0].id, onlyPair[1].id) !== "fire+water") {
  fail("灵光没有在只有一种可行组合时选中它");
}
if (pickInspirationPair({ ...onlyPairState, discovered: ["fire", "water", "steam"] }) !== null) {
  fail("灵光不应该在可行组合的产物都已发现时继续挑选");
}
const shallowState = {
  ...createInitialState(),
  discovered: ["fire", "water", "earth", "air", "steam", "smoke", "mud", "lava", "dust"],
};
const shallowPair = pickInspirationPair(shallowState);
if (!shallowPair || pairKey(shallowPair[0].id, shallowPair[1].id) !== "air+water") {
  fail("灵光没有在无任务可推进时选择等级最低的新要素");
}
const cappedState = {
  ...createInitialState(),
  discovered: ELEMENTS.filter((element) => ELEMENT_LEVEL.get(element.id) < 4).map(
    (element) => element.id
  ),
};
const cappedPair = pickInspirationPair(cappedState);
if (!cappedPair) {
  fail("灵光没有在结果等级并列时返回组合");
}
const cappedSum = cappedPair.reduce(
  (total, element) => total + ELEMENT_LEVEL.get(element.id),
  0
);
if (cappedSum !== 3) {
  fail("灵光在结果等级相同的组合里没有优先材料等级和最低的");
}
const focusedIce = pickInspirationPair(cappedState, "ice");
if (!focusedIce || pairKey(focusedIce[0].id, focusedIce[1].id) !== "air+ice") {
  fail("灵光为已选要素找搭档时没有优先材料等级和最低的");
}
const focusedEarth = pickInspirationPair(inspirationState, "earth");
if (!focusedEarth || pairKey(focusedEarth[0].id, focusedEarth[1].id) !== "earth+water") {
  fail("灵光没有为已选要素优先找能完成手记目标的搭档");
}
for (let i = 0; i < 30; i += 1) {
  const focusedFire = pickInspirationPair(inspirationState, "fire");
  if (!focusedFire || !focusedFire.some((element) => element.id === "fire")) {
    fail("灵光没有保留已选中的要素");
  }
  const focusedResult = findResult(focusedFire[0].id, focusedFire[1].id);
  if (focusedResult !== "steam" && focusedResult !== "smoke") {
    fail("灵光为已选要素找搭档时没有优先当前手记目标");
  }
}
const focusWithoutPartner = pickInspirationPair(shallowState, "steam");
if (!focusWithoutPartner || pairKey(focusWithoutPartner[0].id, focusWithoutPartner[1].id) !== "air+water") {
  fail("已选要素没有可用搭档时，灵光没有回退到普通挑选");
}
const allDiscoveredState = {
  ...createInitialState(),
  discovered: ELEMENTS.map((element) => element.id),
};
if (pickInspirationPair(allDiscoveredState) !== null) {
  fail("灵光不应该在全图鉴完成后返回配对");
}

const freshTree = buildTreeLayout(createInitialState().discovered);
if (freshTree.nodes.length !== ELEMENTS.length) fail("谱系没有列出全部要素");
if (freshTree.edges.length !== 0) fail("初始谱系不应该画出来源线");
if (!(freshTree.stageWidth > 0 && freshTree.stageHeight > 0)) fail("谱系画布尺寸无效");
const freshTreeIds = new Set(freshTree.nodes.map((node) => node.element.id));
if (freshTreeIds.size !== ELEMENTS.length) fail("谱系里有重复要素");
for (const node of freshTree.nodes) {
  if (node.level !== ELEMENT_LEVEL.get(node.element.id)) {
    fail(`谱系层级与要素等级不一致：${node.element.id}`);
  }
}
const fullTree = buildTreeLayout(ELEMENTS.map((element) => element.id));
const expectedTreeEdges = ELEMENTS.reduce((total, element) => {
  if (!element.recipe) return total;
  const recipes = Array.isArray(element.recipe[0]) ? element.recipe : [element.recipe];
  return total + recipes.length * 2;
}, 0);
if (fullTree.edges.length !== expectedTreeEdges) fail("完整谱系没有画出全部配方来源线");
const treeNodeById = new Map(fullTree.nodes.map((node) => [node.element.id, node]));
for (const edge of fullTree.edges) {
  const parent = treeNodeById.get(edge.parentId);
  const result = treeNodeById.get(edge.resultId);
  if (!parent || !result) fail("谱系来源线引用了不存在的要素");
  if (parent.level >= result.level) fail("谱系来源线没有从低等级指向高等级");
}
const partialTree = buildTreeLayout(["fire", "water", "earth", "air", "steam"]);
if (partialTree.edges.length !== 2 || !partialTree.edges.every((edge) => edge.resultId === "steam")) {
  fail("未发现的结果不应该出现来源线");
}
const halfRecipeTree = buildTreeLayout(["fire", "water", "earth", "air", "stone"]);
if (halfRecipeTree.edges.length !== 0) {
  fail("材料没齐的配方不应该画出半截来源线");
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

// ---------------------------------------------------------------------------
// 炉外任务：三幕、选择、四个结局、可选目标与真实引擎试玩。
// ---------------------------------------------------------------------------

const questIds = new Set();
const questElementIds = new Set();
const questElementNames = new Set();
const questSummaries = [];

for (const element of QUEST_ELEMENTS) {
  if (byId.has(element.id)) fail(`任务要素与主线要素 ID 冲突：${element.id}`);
  if (challengeElementIds.has(element.id)) fail(`任务要素与试炼要素 ID 冲突：${element.id}`);
  if (questElementIds.has(element.id)) fail(`任务要素 ID 重复：${element.id}`);
  questElementIds.add(element.id);
  if (!element.name || !element.description || element.description.trim().length < 8) {
    fail(`任务要素 ${element.id} 缺少名称或描述`);
  }
  if (questElementNames.has(element.name)) fail(`任务要素名称重复：${element.name}`);
  questElementNames.add(element.name);
  if (!categoryIds.has(element.category)) fail(`任务要素 ${element.id} 的类型不存在：${element.category}`);
  if (!resolveShapeName(element.shape)) fail(`任务要素 ${element.id} 的像素图形没有绘制：${element.shape}`);
}

if (QUESTS.length !== 3) fail(`任务数量应为 3，目前 ${QUESTS.length}`);

function questRecipeAvailableForRun(quest, run, recipe) {
  if ((recipe.act || 1) > run.actIndex + 1) return false;
  if (recipe.requiresFlag && !run.flags.includes(recipe.requiresFlag)) return false;
  return true;
}

function nextQuestRecipe(quest, run, allowOptional) {
  const map = availableRecipeMap(quest, run);
  for (const recipe of map.values()) {
    if (recipe.result === quest.finalTargetId) continue;
    if (!allowOptional && recipe.optional) continue;
    if (!questRecipeAvailableForRun(quest, run, recipe)) continue;
    if (run.discovered.includes(recipe.a) && run.discovered.includes(recipe.b) && !run.discovered.includes(recipe.result)) {
      return recipe;
    }
  }
  return null;
}

function driveQuest(quest, optionId, allowOptional) {
  let run = createQuestRun(quest);
  let guard = 0;
  while (run.status === "playing" && !run.pendingChoice && guard < 80) {
    guard += 1;
    const recipe = nextQuestRecipe(quest, run, allowOptional);
    if (!recipe) break;
    run = fuseQuest(quest, run, recipe.a, recipe.b).run;
  }
  if (!run.pendingChoice) {
    return { run, error: "没有在第二幕末尾触发选择" };
  }
  const choice = quest.choices[0];
  const chosen = chooseQuestOption(quest, run, choice.id, optionId);
  run = chosen.run;
  guard = 0;
  while (run.status === "playing" && guard < 80) {
    guard += 1;
    const recipe = nextQuestRecipe(quest, run, allowOptional);
    if (!recipe) break;
    run = fuseQuest(quest, run, recipe.a, recipe.b).run;
  }
  const finalRecipe = [...availableRecipeMap(quest, run).values()].find(
    (recipe) => recipe.result === quest.finalTargetId && run.discovered.includes(recipe.a) && run.discovered.includes(recipe.b)
  );
  if (!finalRecipe) return { run, error: "第三幕终点无法抵达" };
  run = fuseQuest(quest, run, finalRecipe.a, finalRecipe.b).run;
  return { run, error: run.status === "won" ? null : "终点造出后没有结算" };
}

for (const quest of QUESTS) {
  if (questIds.has(quest.id)) fail(`任务 ID 重复：${quest.id}`);
  questIds.add(quest.id);
  if (quest.family !== "quest") fail(`任务「${quest.id}」的 family 不是 quest`);
  for (const field of ["title", "subtitle", "quote", "intro", "opening"]) {
    if (!quest[field] || !String(quest[field]).trim()) fail(`任务「${quest.id}」缺少故事字段：${field}`);
  }
  if (!Array.isArray(quest.starterIds) || quest.starterIds.length !== 6) {
    fail(`任务「${quest.title}」必须有 6 个专属起始要素`);
  }
  if (new Set(quest.starterIds).size !== quest.starterIds.length) fail(`任务「${quest.title}」起始要素重复`);
  const startersMain = quest.starterIds.filter((id) => byId.has(id));
  if (startersMain.length) fail(`任务「${quest.title}」的起始要素不能来自主线：${startersMain.join(", ")}`);
  if (!quest.acts || quest.acts.length < 3) fail(`任务「${quest.title}」不足 3 幕`);
  if (quest.acts?.[quest.acts.length - 1]?.targetId !== quest.finalTargetId) {
    fail(`任务「${quest.title}」的最后一幕目标必须等于 finalTargetId`);
  }
  if (quest.endings.length !== 4) fail(`任务「${quest.title}」应有 4 个结局，目前 ${quest.endings.length}`);
  if (quest.optionalObjectives.length !== 2) fail(`任务「${quest.title}」应有 2 个可选目标`);
  if (!quest.choices.length) fail(`任务「${quest.title}」没有幕间选择`);

  const trueEnding = quest.endings[0];
  if (!trueEnding || !trueEnding.condition?.flag) fail(`任务「${quest.title}」的真结局必须带 flag 条件`);
  if (!trueEnding?.condition?.optional || trueEnding.condition.optional.length < 2) {
    fail(`任务「${quest.title}」的真结局必须依赖至少两个可选目标`);
  }
  const endingIds = new Set();
  for (const ending of quest.endings) {
    if (endingIds.has(ending.id)) fail(`任务「${quest.title}」结局 ID 重复：${ending.id}`);
    endingIds.add(ending.id);
    if (!ending.title || !ending.outro) fail(`任务「${quest.title}」的结局 ${ending.id} 缺少文本`);
    if (ending.condition?.flag && !quest.choices.some((choice) => choice.options.some((option) => option.flag === ending.condition.flag))) {
      fail(`任务「${quest.title}」的结局 ${ending.id} 引用了不存在的选择旗标`);
    }
  }

  const actTargets = new Set();
  for (const act of quest.acts) {
    if (!act.id || !act.title || !act.objective || !act.targetId) fail(`任务「${quest.title}」存在字段缺失的幕`);
    if (actTargets.has(act.targetId)) fail(`任务「${quest.title}」重复使用幕目标：${act.targetId}`);
    actTargets.add(act.targetId);
    if (!resolveChallengeElement(act.targetId)) fail(`任务「${quest.title}」的幕目标不存在：${act.targetId}`);
    if (!Array.isArray(act.hints) || act.hints.length < 3) fail(`任务「${quest.title}」第${act.numeral}幕至少需要 3 条提示`);
    if (act.hints?.some((hint) => !String(hint).trim())) fail(`任务「${quest.title}」第${act.numeral}幕存在空提示`);
  }

  const choiceFlags = new Set();
  for (const choice of quest.choices) {
    if (!quest.acts.some((act) => act.id === choice.actId)) fail(`任务「${quest.title}」的选择不在任何一幕中`);
    if (!choice.prompt || !choice.description) fail(`任务「${quest.title}」的选择缺少文本`);
    if (choice.options.length !== 3) fail(`任务「${quest.title}」的选择应有 3 个选项`);
    for (const option of choice.options) {
      if (choiceFlags.has(option.flag)) fail(`任务「${quest.title}」选择旗标重复：${option.flag}`);
      choiceFlags.add(option.flag);
      if (!option.label || !option.description || !option.outcome) fail(`任务「${quest.title}」的选项 ${option.id} 缺少文本`);
      for (const id of option.unlockIds || []) {
        if (!resolveChallengeElement(id)) fail(`任务「${quest.title}」解锁了不存在的要素：${id}`);
      }
    }
  }

  const pairSet = new Set();
  for (const recipe of quest.recipes) {
    if (!recipe.a || !recipe.b || !recipe.result) {
      fail(`任务「${quest.title}」存在格式错误的配方`);
      continue;
    }
    if (recipe.a === recipe.b) fail(`任务「${quest.title}」的配方不能自我合成：${recipe.a}`);
    for (const id of [recipe.a, recipe.b, recipe.result]) {
      if (!resolveChallengeElement(id)) fail(`任务「${quest.title}」的配方引用了不存在的要素：${id}`);
      if (byId.has(id)) fail(`任务「${quest.title}」的配方不能引用主线要素：${id}`);
    }
    if (recipe.act !== undefined && ![1, 2, 3].includes(recipe.act)) {
      fail(`任务「${quest.title}」的配方幕号无效：${recipe.act}`);
    }
    if (recipe.requiresFlag && !choiceFlags.has(recipe.requiresFlag)) {
      fail(`任务「${quest.title}」的配方引用了不存在的选择旗标：${recipe.requiresFlag}`);
    }
    const key = questRecipeKey(recipe.a, recipe.b);
    if (pairSet.has(key)) fail(`任务「${quest.title}」重复配方：${recipe.a} + ${recipe.b}`);
    pairSet.add(key);
  }

  const universe = questUniverse(quest);
  const reachable = new Set([
    ...quest.starterIds,
    ...quest.choices.flatMap((choice) => choice.options.flatMap((option) => option.unlockIds || [])),
  ]);
  let moving = true;
  while (moving) {
    moving = false;
    for (const recipe of quest.recipes) {
      if (reachable.has(recipe.a) && reachable.has(recipe.b) && !reachable.has(recipe.result)) {
        reachable.add(recipe.result);
        moving = true;
      }
    }
  }
  for (const id of universe) {
    if (!reachable.has(id)) fail(`任务「${quest.title}」的要素无法从起始牌堆抵达：${id}`);
  }
  for (const id of reachable) {
    if (!quest.starterIds.includes(id) && !quest.beats?.[id]) {
      fail(`任务「${quest.title}」的要素 ${resolveChallengeElement(id)?.name || id} 没有故事节拍`);
    }
  }
  for (const objective of quest.optionalObjectives) {
    if (!objective.label || !objective.description || !objective.hint) {
      fail(`任务「${quest.title}」的可选目标 ${objective.id} 缺少文本`);
    }
    for (const id of objective.targetIds) {
      if (!reachable.has(id)) fail(`任务「${quest.title}」的可选目标 ${objective.id} 无法抵达：${id}`);
    }
  }

  if (quest.stepLimit !== undefined && quest.stepLimit !== null) {
    fail(`任务「${quest.title}」不应设置步数或余烬上限`);
  }
  const smoke = createQuestRun(quest);
  let wrongPair = null;
  for (let i = 0; i < quest.starterIds.length && !wrongPair; i += 1) {
    for (let j = i + 1; j < quest.starterIds.length; j += 1) {
      const key = questRecipeKey(quest.starterIds[i], quest.starterIds[j]);
      if (!pairSet.has(key)) {
        wrongPair = [quest.starterIds[i], quest.starterIds[j]];
        break;
      }
    }
  }
  if (!wrongPair) {
    fail(`任务「${quest.title}」没有可用于测试的无效组合`);
  } else {
    const invalid = fuseQuest(quest, smoke, wrongPair[0], wrongPair[1]);
    if (invalid.run.status !== "playing" || invalid.result || invalid.run.lost) {
      fail(`任务「${quest.title}」的无效组合不应失败或结束`);
    }
  }

  for (const option of quest.choices[0].options) {
    const normal = driveQuest(quest, option.id, false);
    if (normal.error) {
      fail(`任务「${quest.title}」选项 ${option.label} 的普通结局无法抵达：${normal.error}`);
      continue;
    }
    const expected = quest.endings.find(
      (ending) => ending.id !== trueEnding.id && ending.condition?.flag === option.flag
    );
    if (!expected) fail(`任务「${quest.title}」的选项 ${option.label} 没有对应结局`);
    if (expected && normal.run.endingId !== expected.id) {
      fail(`任务「${quest.title}」选项 ${option.label} 应抵达 ${expected.id}，实际 ${normal.run.endingId}`);
    }
    if (normal.run.optional.length) {
      fail(`任务「${quest.title}」的普通结局路线不应依赖可选目标`);
    }
  }

  const trueOption = quest.choices[0].options.find((option) => option.flag === trueEnding.condition.flag);
  if (!trueOption) {
    fail(`任务「${quest.title}」的真结局引用了不存在的选项旗标`);
  } else {
    const truth = driveQuest(quest, trueOption.id, true);
    if (truth.error) {
      fail(`任务「${quest.title}」的真结局无法抵达：${truth.error}`);
    } else {
      if (truth.run.endingId !== trueEnding.id) {
        fail(`任务「${quest.title}」真结局应抵达 ${trueEnding.id}，实际 ${truth.run.endingId}`);
      }
      for (const id of trueEnding.condition.optional || []) {
        if (!truth.run.optional.includes(id)) fail(`任务「${quest.title}」真结局路线没有完成可选目标：${id}`);
      }
    }
  }

  questSummaries.push({
    name: quest.title,
    starters: quest.starterIds.length,
    acts: quest.acts.length,
    endings: quest.endings.length,
    optional: quest.optionalObjectives.length,
    recipes: quest.recipes.length,
  });
}

// ---------------------------------------------------------------------------
// 失物招领博物馆：26 碎片、8 真品、24 件赝品与三槽鉴定引擎。
// ---------------------------------------------------------------------------

const fragmentIds = new Set();
const fragmentNames = new Set();
const fragmentById = new Map();
for (const fragment of ARTIFACT_FRAGMENTS) {
  if (byId.has(fragment.id)) fail(`碎片与主线要素 ID 冲突：${fragment.id}`);
  if (fragmentIds.has(fragment.id)) fail(`碎片 ID 重复：${fragment.id}`);
  fragmentIds.add(fragment.id);
  fragmentById.set(fragment.id, fragment);
  if (fragmentNames.has(fragment.name)) fail(`碎片名称重复：${fragment.name}`);
  fragmentNames.add(fragment.name);
  if (!fragment.description || fragment.description.trim().length < 8) fail(`碎片 ${fragment.id} 缺少描述`);
  if (!Array.isArray(fragment.tags) || fragment.tags.length < 2) fail(`碎片 ${fragment.id} 至少需要 2 个标签`);
  if (!fragment.testimony || fragment.testimony.trim().length < 6) fail(`碎片 ${fragment.id} 缺少证词`);
  if (!resolveShapeName(fragment.shape)) fail(`碎片 ${fragment.id} 的像素图形没有绘制：${fragment.shape}`);
  if (!categoryIds.has(fragment.category)) fail(`碎片 ${fragment.id} 的类型不存在：${fragment.category}`);
}
if (ARTIFACT_FRAGMENTS.length !== 26) fail(`碎片数量应为 26，目前 ${ARTIFACT_FRAGMENTS.length}`);

const artifactNames = new Set();
const artifactIngredientUse = new Set();
for (const artifact of ARTIFACTS) {
  if (byId.has(artifact.id)) fail(`真品与主线要素 ID 冲突：${artifact.id}`);
  if (artifactNames.has(artifact.name)) fail(`遗物名称重复：${artifact.name}`);
  artifactNames.add(artifact.name);
  if (!artifact.description || !artifact.story || !artifact.curatorNote) fail(`真品 ${artifact.id} 缺少展签文本`);
  if (!Array.isArray(artifact.clues) || artifact.clues.length !== 3) fail(`真品 ${artifact.id} 需要 3 条证词`);
  if (!Array.isArray(artifact.ingredients) || artifact.ingredients.length !== 3) {
    fail(`真品 ${artifact.id} 需要 3 个材料`);
  }
  for (const id of artifact.ingredients) {
    if (!fragmentById.has(id)) fail(`真品 ${artifact.id} 引用了不存在的碎片：${id}`);
    artifactIngredientUse.add(id);
  }
  if (!resolveShapeName(artifact.shape)) fail(`真品 ${artifact.id} 的像素图形没有绘制：${artifact.shape}`);
}

const fakeTierCounts = { almost: 0, misunderstood: 0, abandoned: 0 };
for (const exhibit of MISIDENTIFIED) {
  if (byId.has(exhibit.id)) fail(`赝品与主线要素 ID 冲突：${exhibit.id}`);
  if (artifactNames.has(exhibit.name)) fail(`遗物名称重复：${exhibit.name}`);
  artifactNames.add(exhibit.name);
  if (!ARTIFACT_TIERS[exhibit.tier]) fail(`赝品 ${exhibit.id} 的 tier 无效：${exhibit.tier}`);
  else fakeTierCounts[exhibit.tier] += 1;
  if (!exhibit.description || !exhibit.curatorNote || !exhibit.visitorReview) fail(`赝品 ${exhibit.id} 缺少展签文本`);
  if (!exhibit.hint || exhibit.hint.trim().length < 8) fail(`赝品 ${exhibit.id} 缺少可用提示`);
  if (!Array.isArray(exhibit.ingredients) || exhibit.ingredients.length !== 3) {
    fail(`赝品 ${exhibit.id} 需要 3 个材料`);
  }
  for (const id of exhibit.ingredients) {
    if (!fragmentById.has(id)) fail(`赝品 ${exhibit.id} 引用了不存在的碎片：${id}`);
    artifactIngredientUse.add(id);
  }
  if (!resolveShapeName(exhibit.shape)) fail(`赝品 ${exhibit.id} 的像素图形没有绘制：${exhibit.shape}`);
}
if (MISIDENTIFIED.length !== 24) fail(`赝品数量应为 24，目前 ${MISIDENTIFIED.length}`);
for (const [tier, count] of Object.entries(fakeTierCounts)) {
  if (count !== 8) fail(`赝品档位 ${tier} 应为 8 件，目前 ${count}`);
}
for (const id of fragmentIds) {
  if (!artifactIngredientUse.has(id)) fail(`碎片 ${fragmentById.get(id)?.name || id} 没有被任何展品使用`);
}

const trueMap = buildTrueMap();
const fakeMap = buildFakeMap();
if (trueMap.size !== 8) fail(`真品组合应为 8，目前 ${trueMap.size}`);
if (fakeMap.size !== 24) fail(`赝品组合应为 24，目前 ${fakeMap.size}`);
const allArtifactKeys = new Set([...trueMap.keys(), ...fakeMap.keys()]);
if (allArtifactKeys.size !== 32) fail(`32 条遗物配方的组合键必须互不重叠，目前 ${allArtifactKeys.size}`);

for (const artifact of ARTIFACTS) {
  const run = createArtifactRun();
  const outcome = forgeArtifact(run, artifact.ingredients);
  if (outcome.type !== "true" || outcome.artifact?.id !== artifact.id) {
    fail(`真品 ${artifact.id} 无法通过三槽引擎鉴定`);
  }
}
for (const exhibit of MISIDENTIFIED) {
  const run = createArtifactRun();
  const outcome = forgeArtifact(run, exhibit.ingredients);
  if (outcome.type !== "fake" || outcome.exhibit?.id !== exhibit.id) {
    fail(`赝品 ${exhibit.id} 无法通过三槽引擎鉴定`);
  }
}

let noneCombo = null;
for (let i = 0; i < ARTIFACT_FRAGMENTS.length && !noneCombo; i += 1) {
  for (let j = i + 1; j < ARTIFACT_FRAGMENTS.length && !noneCombo; j += 1) {
    for (let k = j + 1; k < ARTIFACT_FRAGMENTS.length; k += 1) {
      const ids = [ARTIFACT_FRAGMENTS[i].id, ARTIFACT_FRAGMENTS[j].id, ARTIFACT_FRAGMENTS[k].id];
      if (!allArtifactKeys.has(artifactKey(ids))) {
        noneCombo = ids;
        break;
      }
    }
  }
}
if (!noneCombo) {
  fail("找不到任何未命中的三碎片组合，无法测试馆长吐槽");
} else {
  let run = createArtifactRun();
  let autoHint = null;
  for (let i = 0; i < 3; i += 1) {
    const outcome = forgeArtifact(run, noneCombo);
    run = outcome.run;
    if (outcome.type !== "none") fail("未命中组合没有返回 none");
    if (outcome.autoHint) autoHint = outcome.autoHint;
  }
  if (!autoHint) fail("连续三次未命中后没有触发馆长提示");
  if (run.attempts !== 3 || run.missStreak !== 0) fail("未命中次数或连续未命中状态异常");
}

const completeRun = createArtifactRun({
  trueIds: ARTIFACTS.map((item) => item.id),
  fakeIds: MISIDENTIFIED.map((item) => item.id),
  attempts: 32,
});
if (!artifactComplete(completeRun)) fail("集齐 8 真品 + 24 赝品后没有触发收尾条件");
if (curatorStage(0).at !== 0 || curatorStage(8).at !== 8 || curatorStage(16).at !== 16 || curatorStage(24).at !== 24) {
  fail("馆长阶段台词没有覆盖 0 / 8 / 16 / 24 四档");
}
const hintRun = createArtifactRun({ fakeIds: MISIDENTIFIED.map((item) => item.id) });
const finalHint = artifactHint(hintRun);
if (!finalHint.artifact) fail("赝品全收集后提示没有转向真品厅");
const tierSummary = tierProgress(createArtifactRun());
for (const tier of tierSummary) {
  if (tier.total !== 8) fail(`误会厅档位 ${tier.tier} 的进度总数不是 8`);
}

// ---------------------------------------------------------------------------
// M5 收藏总览：四族进度、徽章与结局图鉴。
// ---------------------------------------------------------------------------

const emptyCollection = buildCollection(
  { completed: {} },
  { version: 1, quests: {} },
  { trueIds: [], fakeIds: [], attempts: 0 }
);
if (emptyCollection.stats.overallPercent !== 0 || emptyCollection.badgeUnlocked !== 0) {
  fail("空存档的收藏总览不应有任何进度或徽章");
}
if (emptyCollection.badges.length !== 14) {
  fail(`徽章数量应为 14，目前 ${emptyCollection.badges.length}`);
}

const completeChallengeProgress = {
  completed: Object.fromEntries(
    CHALLENGES.map((challenge) => [challenge.id, { bestSteps: minimumSteps(challenge) }])
  ),
};
const completeQuestProgress = {
  version: 1,
  quests: Object.fromEntries(
    QUESTS.map((quest) => [
      quest.id,
      {
        endings: quest.endings.map((ending) => ending.id),
        optional: quest.optionalObjectives.map((objective) => objective.id),
        bestSteps: 10,
        checkpoint: null,
      },
    ])
  ),
};
const completeArtifactRun = createArtifactRun({
  trueIds: ARTIFACTS.map((artifact) => artifact.id),
  fakeIds: MISIDENTIFIED.map((exhibit) => exhibit.id),
  attempts: 32,
});
const completeCollection = buildCollection(
  completeChallengeProgress,
  completeQuestProgress,
  completeArtifactRun
);
if (completeCollection.stats.overallPercent !== 100) {
  fail(`全收集的完成度应为 100%，目前 ${completeCollection.stats.overallPercent}%`);
}
if (completeCollection.badgeUnlocked !== completeCollection.badges.length) {
  fail(`全收集时仍有徽章未解锁：${completeCollection.badges.filter((badge) => !badge.unlocked).map((badge) => badge.name).join("、")}`);
}
if (!completeCollection.stats.museumComplete) fail("全收集时博物馆收尾条件未触发");
if (completeCollection.stats.endingsSeen !== 12) fail("全收集时任务结局数量不是 12");
if (completeCollection.stats.optionalDone !== 6) fail("全收集时可选目标数量不是 6");
if (completeCollection.stats.parPuzzles !== 4) fail("全收集时 Par 谜题数量不是 4");

const oneChallengeCollection = buildCollection(
  { completed: { [CHALLENGES[0].id]: { bestSteps: minimumSteps(CHALLENGES[0]) } } },
  { version: 1, quests: {} },
  { trueIds: [], fakeIds: [], attempts: 0 }
);
if (oneChallengeCollection.badgeUnlocked !== 1 || !oneChallengeCollection.badges[0].unlocked) {
  fail("完成第一则试炼后应只点亮「第一簇炉外火」");
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
console.log(
  `\n炉外任务：${QUESTS.length} 则 · 全部 ${QUESTS.reduce((sum, quest) => sum + quest.acts.length, 0)} 幕 · ${QUESTS.reduce((sum, quest) => sum + quest.endings.length, 0)} 个结局 · ${QUESTS.reduce((sum, quest) => sum + quest.optionalObjectives.length, 0)} 个可选目标`
);
for (const summary of questSummaries) {
  console.log(
    `  任务 · ${summary.name}：${summary.acts} 幕 / ${summary.endings} 结局 / ${summary.optional} 可选 / ${summary.starters} 起始 / ${summary.recipes} 配方`
  );
}
console.log(
  `\n失物招领博物馆：${ARTIFACT_FRAGMENTS.length} 碎片 · 真品 ${ARTIFACTS.length} · 赝品 ${MISIDENTIFIED.length}（8 / 8 / 8）· ${allArtifactKeys.size} 条有效组合`
);
console.log(
  `收藏总览：${completeCollection.badges.length} 枚徽章 · 空存档 ${emptyCollection.stats.overallPercent}% · 全收集 ${completeCollection.stats.overallPercent}%`
);
const initialStatusCounts = [...initialStatus.values()].reduce(
  (counts, status) => ({ ...counts, [status.kind]: (counts[status.kind] || 0) + 1 }),
  {}
);
const allKnownStatusCounts = [...allKnownStatus.values()].reduce(
  (counts, status) => ({ ...counts, [status.kind]: (counts[status.kind] || 0) + 1 }),
  {}
);
console.log(
  `材料标记：初始 闲 ${initialStatusCounts.idle || 0} · 尽 ${initialStatusCounts.exhausted || 0}；全收集 闲 ${allKnownStatusCounts.idle || 0} · 尽 ${allKnownStatusCounts.exhausted || 0}`
);
console.log(
  `已熔配对：初始 ${freshState.craftedPairs.length} · 完整试玩 ${simulated.craftedPairs.length}；无果配对：初始 ${freshState.failedPairs.length} · 完整试玩 ${simulated.failedPairs.length}`
);
if (warnings.length) {
  console.log("\n提醒：");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

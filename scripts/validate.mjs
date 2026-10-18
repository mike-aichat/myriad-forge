import { ELEMENTS } from "../src/data/elements/index.js";
import { CATEGORIES } from "../src/data/categories.js";
import { BASE_IDS, GRANTED_IDS, ROOT_IDS, ENDGAME_IDS } from "../src/data/schema.js";

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

const deepest = [...depth.entries()]
  .map(([id, value]) => [byId.get(id).name, value])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12);

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
if (warnings.length) {
  console.log("\n提醒：");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

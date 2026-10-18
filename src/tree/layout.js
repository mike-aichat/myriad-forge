import { ELEMENTS } from "../data/elements/index.js";
import { ELEMENT_LEVEL, getResultRecipes } from "../game/recipes.js";

export const TREE_NODE_WIDTH = 92;
export const TREE_NODE_HEIGHT = 58;

const GAP_X = 18;
const ROW_GAP = 52;
const ROW_HEIGHT = TREE_NODE_HEIGHT + ROW_GAP;
const PAD_X = 92;
const PAD_TOP = 48;
const PAD_BOTTOM = 30;

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function parentCenters(resultId, positions) {
  const centers = [];
  for (const recipe of getResultRecipes(resultId)) {
    for (const parentId of recipe) {
      const parent = positions.get(parentId);
      if (parent) centers.push(parent.centerX);
    }
  }
  return centers;
}

export function buildTreeLayout(discovered) {
  const discoveredSet = new Set(discovered);
  const groups = new Map();

  for (const [index, element] of ELEMENTS.entries()) {
    const level = ELEMENT_LEVEL.get(element.id) ?? 0;
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level).push({
      element,
      index,
      level,
      discovered: discoveredSet.has(element.id),
    });
  }

  const maxLevel = Math.max(0, ...groups.keys());
  const counts = [];
  for (let level = 0; level <= maxLevel; level += 1) {
    counts[level] = (groups.get(level) || []).length;
  }
  const widest = Math.max(1, ...counts);
  const stageWidth = PAD_X * 2 + widest * (TREE_NODE_WIDTH + GAP_X) - GAP_X;
  const stageHeight = PAD_TOP + (maxLevel + 1) * ROW_HEIGHT + PAD_BOTTOM;

  const positions = new Map();
  const nodes = [];
  const rows = [];

  for (let level = 0; level <= maxLevel; level += 1) {
    const items = groups.get(level) || [];
    const rowWidth = items.length * (TREE_NODE_WIDTH + GAP_X) - GAP_X;
    const offsetX = (stageWidth - rowWidth) / 2;
    const y = PAD_TOP + level * ROW_HEIGHT;

    items.sort((a, b) => {
      if (level === 0) return a.index - b.index;
      const aCenters = a.discovered ? parentCenters(a.element.id, positions) : [];
      const bCenters = b.discovered ? parentCenters(b.element.id, positions) : [];
      if (aCenters.length && bCenters.length) {
        const difference = average(aCenters) - average(bCenters);
        if (Math.abs(difference) > 0.5) return difference;
      }
      if (aCenters.length !== bCenters.length) return aCenters.length ? -1 : 1;
      return a.index - b.index;
    });

    items.forEach((item, index) => {
      const x = offsetX + index * (TREE_NODE_WIDTH + GAP_X);
      const node = {
        ...item,
        x,
        y,
        centerX: x + TREE_NODE_WIDTH / 2,
      };
      positions.set(item.element.id, node);
      nodes.push(node);
    });

    rows.push({
      level,
      y,
      offsetX,
      width: rowWidth,
      count: items.length,
    });
  }

  const edges = [];
  let edgeIndex = 0;
  for (const node of nodes) {
    if (!node.discovered) continue;
    for (const recipe of getResultRecipes(node.element.id)) {
      if (!recipe.every((parentId) => discoveredSet.has(parentId))) continue;
      for (const parentId of recipe) {
        const parent = positions.get(parentId);
        if (!parent || !parent.discovered) continue;
        edges.push({
          id: `${parentId}-${node.element.id}-${edgeIndex}`,
          parentId,
          resultId: node.element.id,
          x1: parent.centerX,
          y1: parent.y + TREE_NODE_HEIGHT,
          x2: node.centerX,
          y2: node.y,
        });
        edgeIndex += 1;
      }
    }
  }

  return { stageWidth, stageHeight, nodes, rows, edges, maxLevel };
}

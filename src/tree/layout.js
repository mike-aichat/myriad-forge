import { ELEMENTS } from "../data/elements/index.js";
import { ELEMENT_LEVEL, getResultRecipes } from "../game/recipes.js";

export const TREE_NODE_WIDTH = 92;
export const TREE_NODE_HEIGHT = 58;
export const TREE_MAX_PER_ROW = 20;

const GAP_X = 18;
const SUBROW_GAP = 18;
const LEVEL_GAP = 40;
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

function splitRows(items, rowCount) {
  const base = Math.floor(items.length / rowCount);
  const extra = items.length % rowCount;
  const rows = [];
  let cursor = 0;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const size = base + (rowIndex < extra ? 1 : 0);
    rows.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return rows;
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
  const columns = Math.min(TREE_MAX_PER_ROW, Math.max(1, ...counts));
  const stageWidth = PAD_X * 2 + columns * (TREE_NODE_WIDTH + GAP_X) - GAP_X;

  const levels = [];
  let cursorY = PAD_TOP;
  for (let level = 0; level <= maxLevel; level += 1) {
    const items = groups.get(level) || [];
    const rowCount = Math.max(1, Math.ceil(items.length / TREE_MAX_PER_ROW));
    const height = rowCount * TREE_NODE_HEIGHT + (rowCount - 1) * SUBROW_GAP;
    levels.push({
      level,
      items,
      count: items.length,
      rowCount,
      y: cursorY,
      height,
      labelX: stageWidth / 2,
    });
    cursorY += height + LEVEL_GAP;
  }
  const stageHeight = cursorY - LEVEL_GAP + PAD_BOTTOM;

  const positions = new Map();
  const nodes = [];
  const rows = [];

  for (const levelInfo of levels) {
    const { level, items, rowCount, y } = levelInfo;

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

    const chunks = splitRows(items, rowCount);
    chunks.forEach((chunk, rowIndex) => {
      const rowWidth = chunk.length * (TREE_NODE_WIDTH + GAP_X) - GAP_X;
      const offsetX = (stageWidth - rowWidth) / 2;
      const rowY = y + rowIndex * (TREE_NODE_HEIGHT + SUBROW_GAP);

      chunk.forEach((item, index) => {
        const x = offsetX + index * (TREE_NODE_WIDTH + GAP_X);
        const node = {
          ...item,
          x,
          y: rowY,
          centerX: x + TREE_NODE_WIDTH / 2,
        };
        positions.set(item.element.id, node);
        nodes.push(node);
      });

      rows.push({
        level,
        rowIndex,
        y: rowY,
        offsetX,
        width: rowWidth,
        count: chunk.length,
      });
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

  return { stageWidth, stageHeight, nodes, rows, levels, edges, maxLevel };
}

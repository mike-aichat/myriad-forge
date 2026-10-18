import { getResultRecipes } from "../game/recipes.js";

export function getObjectiveHint(targetId, discoveredSet) {
  if (discoveredSet.has(targetId)) {
    return { kind: "done", label: "已写下", title: "这个目标已经完成。" };
  }
  const ready = getResultRecipes(targetId).some(
    ([a, b]) => discoveredSet.has(a) && discoveredSet.has(b)
  );
  if (ready) {
    return {
      kind: "ready",
      label: "现在可合",
      title: "现有的两种材料已经能合出它。",
    };
  }
  return {
    kind: "missing",
    label: "缺材料",
    title: "现有的要素里还没有能合出它的组合。",
  };
}

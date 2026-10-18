import { ELEMENTS } from "../data/elements/index.js";
import { getUses, pairKey } from "./recipes.js";

function uniqueUses(elementId) {
  const seen = new Set();
  return getUses(elementId).filter(({ result, recipe }) => {
    const key = `${result}:${pairKey(recipe[0], recipe[1])}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function statusFor(element, discovered) {
  if (!discovered.has(element.id)) {
    return {
      kind: "unknown",
      label: null,
      title: "",
      known: false,
      uses: 0,
      currentResults: 0,
      remainingResults: 0,
    };
  }

  const uses = uniqueUses(element.id);
  if (!uses.length) {
    return {
      kind: "exhausted",
      label: "尽",
      title: "没有配方会用到它",
      known: true,
      uses: 0,
      currentResults: 0,
      remainingResults: 0,
    };
  }

  const unseen = uses.filter(({ result }) => !discovered.has(result));
  const remainingResults = new Set(unseen.map(({ result }) => result));
  const current = unseen.filter(({ recipe }) => {
    const other = recipe[0] === element.id ? recipe[1] : recipe[0];
    return discovered.has(other);
  });
  const currentResults = new Set(current.map(({ result }) => result));

  if (!unseen.length) {
    return {
      kind: "exhausted",
      label: "尽",
      title: "会用到它的配方结果都已发现",
      known: true,
      uses: uses.length,
      currentResults: 0,
      remainingResults: 0,
    };
  }

  if (!current.length) {
    return {
      kind: "idle",
      label: "闲",
      title: "当前没有已发现的搭档能造出新要素",
      known: true,
      uses: uses.length,
      currentResults: 0,
      remainingResults: remainingResults.size,
    };
  }

  return {
    kind: "active",
    label: null,
    title: `当前可与已发现要素合成 ${currentResults.size} 个新要素`,
    known: true,
    uses: uses.length,
    currentResults: currentResults.size,
    remainingResults: remainingResults.size,
  };
}

export function getElementUseStatus(state, element) {
  return statusFor(element, new Set(state.discovered || []));
}

export function buildElementUseStatus(state) {
  const discovered = new Set(state.discovered || []);
  const statusByElement = new Map();
  for (const element of ELEMENTS) {
    statusByElement.set(element.id, statusFor(element, discovered));
  }
  return statusByElement;
}

export function countElementUseStatus(statusByElement) {
  const counts = { idle: 0, exhausted: 0, active: 0 };
  for (const status of statusByElement.values()) {
    if (status.kind === "idle" || status.kind === "exhausted") counts[status.kind] += 1;
    else if (status.kind === "active") counts.active += 1;
  }
  return counts;
}

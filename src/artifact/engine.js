import {
  ARTIFACTS,
  ARTIFACT_FRAGMENTS,
  ARTIFACT_QUIPS,
  ARTIFACT_TIERS,
  CURATOR_STAGES,
  MISIDENTIFIED,
} from "../data/artifacts.js";

export function artifactKey(ids) {
  return [...ids].sort().join("+");
}

export function buildTrueMap(artifacts = ARTIFACTS) {
  return new Map(artifacts.map((artifact) => [artifactKey(artifact.ingredients), artifact]));
}

export function buildFakeMap(exhibits = MISIDENTIFIED) {
  return new Map(exhibits.map((exhibit) => [artifactKey(exhibit.ingredients), exhibit]));
}

export const TRUE_MAP = buildTrueMap();
export const FAKE_MAP = buildFakeMap();
export const FRAGMENT_BY_ID = new Map(ARTIFACT_FRAGMENTS.map((fragment) => [fragment.id, fragment]));
export const TRUE_BY_ID = new Map(ARTIFACTS.map((artifact) => [artifact.id, artifact]));
export const FAKE_BY_ID = new Map(MISIDENTIFIED.map((exhibit) => [exhibit.id, exhibit]));

export function createArtifactRun(data = {}) {
  return {
    trueIds: Array.isArray(data.trueIds) ? [...new Set(data.trueIds.filter((id) => TRUE_BY_ID.has(id)))] : [],
    fakeIds: Array.isArray(data.fakeIds) ? [...new Set(data.fakeIds.filter((id) => FAKE_BY_ID.has(id)))] : [],
    attempts: Number.isFinite(data.attempts) ? Math.max(0, Math.floor(data.attempts)) : 0,
    missStreak: 0,
  };
}

export function forgeArtifact(run, ids) {
  if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3) {
    return { run, type: "invalid", artifact: null, exhibit: null, quip: "三个槽位，三块不同的碎片。馆方不接受重复。" };
  }
  if (!ids.every((id) => FRAGMENT_BY_ID.has(id))) {
    return { run, type: "invalid", artifact: null, exhibit: null, quip: "有一块碎片不在本馆的收藏范围内。" };
  }

  const key = artifactKey(ids);
  const next = { ...run, attempts: run.attempts + 1 };

  const artifact = TRUE_MAP.get(key);
  if (artifact) {
    const isNew = !next.trueIds.includes(artifact.id);
    next.trueIds = isNew ? [...next.trueIds, artifact.id] : next.trueIds;
    next.missStreak = 0;
    return { run: next, type: "true", artifact, exhibit: null, isNew, quip: null };
  }

  const exhibit = FAKE_MAP.get(key);
  if (exhibit) {
    const isNew = !next.fakeIds.includes(exhibit.id);
    next.fakeIds = isNew ? [...next.fakeIds, exhibit.id] : next.fakeIds;
    next.missStreak = 0;
    return { run: next, type: "fake", artifact: null, exhibit, isNew, quip: null };
  }

  next.missStreak = (run.missStreak || 0) + 1;
  let autoHint = null;
  if (next.missStreak >= 3) {
    autoHint = artifactHint(next);
    next.missStreak = 0;
  }
  const quip = ARTIFACT_QUIPS[next.attempts % ARTIFACT_QUIPS.length];
  return { run: next, type: "none", artifact: null, exhibit: null, quip, autoHint };
}

export function artifactHint(run) {
  const missing = MISIDENTIFIED.filter((exhibit) => !run.fakeIds.includes(exhibit.id));
  if (!missing.length) {
    const trueMissing = ARTIFACTS.filter((artifact) => !run.trueIds.includes(artifact.id));
    if (!trueMissing.length) {
      return { exhibit: null, artifact: null, text: "两座展厅都满了。老白把辞职信压在柜台下面，说：自己拿吧。" };
    }
    const artifact = trueMissing[0];
    return {
      exhibit: null,
      artifact,
      text: `真品厅还缺一件。它和这些词有关：${artifact.clues[0].replace(/。$/, "")}。`,
    };
  }
  const exhibit = missing[Math.floor(Math.random() * missing.length)];
  return {
    exhibit,
    artifact: null,
    text: `误会厅还缺一件「${ARTIFACT_TIERS[exhibit.tier].name}」。老白翻了翻登记簿：${exhibit.hint}`,
  };
}

export function curatorStage(fakeCount) {
  let stage = CURATOR_STAGES[0];
  for (const item of CURATOR_STAGES) {
    if (fakeCount >= item.at) stage = item;
  }
  return stage;
}

export function artifactComplete(run) {
  return run.trueIds.length >= ARTIFACTS.length && run.fakeIds.length >= MISIDENTIFIED.length;
}

export function artifactCounts(run) {
  return {
    trueCount: run.trueIds.length,
    fakeCount: run.fakeIds.length,
    trueTotal: ARTIFACTS.length,
    fakeTotal: MISIDENTIFIED.length,
    total: run.trueIds.length + run.fakeIds.length,
    totalMax: ARTIFACTS.length + MISIDENTIFIED.length,
  };
}

export function tierProgress(run) {
  return Object.keys(ARTIFACT_TIERS).map((tier) => {
    const list = MISIDENTIFIED.filter((exhibit) => exhibit.tier === tier);
    return {
      tier,
      ...ARTIFACT_TIERS[tier],
      found: list.filter((exhibit) => run.fakeIds.includes(exhibit.id)).length,
      total: list.length,
    };
  });
}

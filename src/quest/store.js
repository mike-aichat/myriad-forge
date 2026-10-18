export const QUEST_SAVE_KEY = "myriad-forge.quests.v1";
export const QUEST_SAVE_VERSION = 1;

export function createEmptyQuestProgress() {
  return { version: QUEST_SAVE_VERSION, quests: {} };
}

function emptyQuestRecord() {
  return { endings: [], optional: [], bestSteps: null, checkpoint: null };
}

export function loadQuestProgress() {
  if (typeof window === "undefined") return createEmptyQuestProgress();
  try {
    const raw = window.localStorage.getItem(QUEST_SAVE_KEY);
    if (!raw) return createEmptyQuestProgress();
    const parsed = JSON.parse(raw);
    const quests = {};
    for (const [id, record] of Object.entries(parsed?.quests || {})) {
      if (!record || typeof record !== "object") continue;
      quests[id] = {
        endings: Array.isArray(record.endings) ? [...new Set(record.endings)] : [],
        optional: Array.isArray(record.optional) ? [...new Set(record.optional)] : [],
        bestSteps: Number.isFinite(record.bestSteps) ? Math.max(1, Math.floor(record.bestSteps)) : null,
        checkpoint: record.checkpoint && typeof record.checkpoint === "object" ? record.checkpoint : null,
      };
    }
    return { version: QUEST_SAVE_VERSION, quests };
  } catch {
    return createEmptyQuestProgress();
  }
}

export function saveQuestProgress(progress) {
  if (typeof window === "undefined") return progress;
  try {
    window.localStorage.setItem(QUEST_SAVE_KEY, JSON.stringify(progress));
  } catch {
    // A quest should still be playable when storage is unavailable.
  }
  return progress;
}

export function questRecord(progress, questId) {
  return progress.quests[questId] || emptyQuestRecord();
}

export function saveQuestCheckpoint(progress, questId, checkpoint) {
  const record = questRecord(progress, questId);
  const next = {
    ...progress,
    quests: {
      ...progress.quests,
      [questId]: { ...record, checkpoint },
    },
  };
  return saveQuestProgress(next);
}

export function clearQuestCheckpoint(progress, questId) {
  const record = questRecord(progress, questId);
  if (!record.checkpoint) return progress;
  const next = {
    ...progress,
    quests: {
      ...progress.quests,
      [questId]: { ...record, checkpoint: null },
    },
  };
  return saveQuestProgress(next);
}

export function recordQuestEnding(progress, questId, run) {
  const record = questRecord(progress, questId);
  const endings = run.endingId
    ? [...new Set([...record.endings, run.endingId])]
    : record.endings;
  const optional = [...new Set([...record.optional, ...run.optional])];
  const bestSteps =
    record.bestSteps === null ? run.stepsUsed : Math.min(record.bestSteps, run.stepsUsed);
  const next = {
    ...progress,
    quests: {
      ...progress.quests,
      [questId]: { endings, optional, bestSteps, checkpoint: null },
    },
  };
  return saveQuestProgress(next);
}

export function questEndingCount(progress) {
  return Object.values(progress.quests).reduce((sum, record) => sum + record.endings.length, 0);
}

export function questCompletedCount(progress, quests) {
  return quests.filter((quest) => questRecord(progress, quest.id).endings.length > 0).length;
}

export function questSeenEndings(progress, questId) {
  return questRecord(progress, questId).endings;
}

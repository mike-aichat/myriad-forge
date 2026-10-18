export const CHALLENGE_SAVE_KEY = "myriad-forge.challenges.v1";
export const CHALLENGE_SAVE_VERSION = 1;

export function createEmptyProgress() {
  return {
    version: CHALLENGE_SAVE_VERSION,
    completed: {},
  };
}

export function loadChallengeProgress() {
  try {
    const raw = window.localStorage.getItem(CHALLENGE_SAVE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw);
    const completed = {};
    for (const [id, record] of Object.entries(parsed?.completed || {})) {
      if (record && Number.isFinite(record.bestSteps)) {
        completed[id] = { bestSteps: Math.max(1, Math.floor(record.bestSteps)) };
      }
    }
    return { version: CHALLENGE_SAVE_VERSION, completed };
  } catch {
    return createEmptyProgress();
  }
}

export function saveChallengeProgress(progress) {
  try {
    window.localStorage.setItem(CHALLENGE_SAVE_KEY, JSON.stringify(progress));
  } catch {
    // A challenge should still be playable without local storage.
  }
}

export function recordChallengeWin(progress, challengeId, stepsUsed) {
  const previous = progress.completed[challengeId];
  const bestSteps =
    previous && previous.bestSteps <= stepsUsed ? previous.bestSteps : Math.max(1, stepsUsed);
  const next = {
    ...progress,
    completed: {
      ...progress.completed,
      [challengeId]: { bestSteps },
    },
  };
  saveChallengeProgress(next);
  return next;
}

export function challengeCompletedCount(progress) {
  return Object.keys(progress.completed).length;
}

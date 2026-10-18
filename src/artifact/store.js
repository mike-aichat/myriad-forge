import { createArtifactRun } from "./engine.js";

export const ARTIFACT_SAVE_KEY = "myriad-forge.artifacts.v1";
export const ARTIFACT_SAVE_VERSION = 1;

export function createEmptyArtifactProgress() {
  return { version: ARTIFACT_SAVE_VERSION, trueIds: [], fakeIds: [], attempts: 0 };
}

export function loadArtifactProgress() {
  if (typeof window === "undefined") return createArtifactRun(createEmptyArtifactProgress());
  try {
    const raw = window.localStorage.getItem(ARTIFACT_SAVE_KEY);
    if (!raw) return createArtifactRun(createEmptyArtifactProgress());
    const parsed = JSON.parse(raw);
    return createArtifactRun({
      trueIds: parsed?.trueIds,
      fakeIds: parsed?.fakeIds,
      attempts: parsed?.attempts,
    });
  } catch {
    return createArtifactRun(createEmptyArtifactProgress());
  }
}

export function saveArtifactProgress(run) {
  if (typeof window === "undefined") return run;
  try {
    window.localStorage.setItem(
      ARTIFACT_SAVE_KEY,
      JSON.stringify({
        version: ARTIFACT_SAVE_VERSION,
        trueIds: run.trueIds,
        fakeIds: run.fakeIds,
        attempts: run.attempts,
      })
    );
  } catch {
    // The museum remains open without local storage.
  }
  return run;
}

export function recordArtifactRun(run) {
  saveArtifactProgress(run);
  return run;
}

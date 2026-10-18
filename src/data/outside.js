import { ELEMENT_BY_ID } from "../game/recipes.js";
import { CHALLENGE_ELEMENTS, CHALLENGE_ELEMENT_BY_ID } from "./challenges.js";
import { QUEST_ELEMENTS, QUEST_ELEMENT_BY_ID } from "./quests.js";
import { ARTIFACT_FRAGMENTS, ARTIFACTS, MISIDENTIFIED } from "./artifacts.js";

export const OUTSIDE_ELEMENTS = [
  ...CHALLENGE_ELEMENTS,
  ...QUEST_ELEMENTS,
  ...ARTIFACT_FRAGMENTS,
  ...ARTIFACTS,
  ...MISIDENTIFIED,
];

export const OUTSIDE_ELEMENT_BY_ID = new Map([
  ...CHALLENGE_ELEMENT_BY_ID,
  ...QUEST_ELEMENT_BY_ID,
  ...ARTIFACT_FRAGMENTS.map((item) => [item.id, item]),
  ...ARTIFACTS.map((item) => [item.id, item]),
  ...MISIDENTIFIED.map((item) => [item.id, item]),
]);

export function resolveOutsideElement(id) {
  return ELEMENT_BY_ID.get(id) || OUTSIDE_ELEMENT_BY_ID.get(id) || null;
}

export function isMainElementId(id) {
  return ELEMENT_BY_ID.has(id);
}

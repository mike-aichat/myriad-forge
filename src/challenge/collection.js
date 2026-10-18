import { CHALLENGES } from "../data/challenges.js";
import { QUESTS } from "../data/quests.js";
import { ARTIFACTS, MISIDENTIFIED } from "../data/artifacts.js";
import { artifactComplete, artifactCounts, curatorStage } from "../artifact/engine.js";
import { questRecord } from "../quest/store.js";
import { challengeFamily, isPuzzle, minimumSteps, parRating } from "./engine.js";

const CHALLENGE_TOTAL = CHALLENGES.length;
const ENDING_TOTAL = QUESTS.reduce((sum, quest) => sum + quest.endings.length, 0);
const ARTIFACT_TOTAL = ARTIFACTS.length + MISIDENTIFIED.length;
const OVERALL_TOTAL = CHALLENGE_TOTAL + ENDING_TOTAL + ARTIFACT_TOTAL;

export const BADGES = [
  {
    id: "first-outside-fire",
    name: "第一簇炉外火",
    sigil: "初",
    note: "完成任意一则谜题或燃尽故事。",
    goal: 1,
    progress: (stats) => stats.challengeCompleted,
    done: (stats) => stats.challengeCompleted >= 1,
  },
  {
    id: "first-goodbye",
    name: "第一声再见",
    sigil: "别",
    note: "抵达任意一则任务的第一个结局。",
    goal: 1,
    progress: (stats) => stats.endingsSeen,
    done: (stats) => stats.endingsSeen >= 1,
  },
  {
    id: "first-exhibit",
    name: "第一件馆藏",
    sigil: "藏",
    note: "鉴定出任意一件真品或赝品。",
    goal: 1,
    progress: (stats) => stats.artifactsFound,
    done: (stats) => stats.artifactsFound >= 1,
  },
  {
    id: "four-puzzles",
    name: "四页谜题",
    sigil: "谜",
    note: "解开全部四则无步数限制的谜题。",
    goal: 4,
    progress: (stats) => stats.puzzleCompleted,
    done: (stats) => stats.puzzleCompleted >= 4,
  },
  {
    id: "four-embers",
    name: "四盏余烬",
    sigil: "烬",
    note: "走完全部四则燃尽故事。",
    goal: 4,
    progress: (stats) => stats.emberCompleted,
    done: (stats) => stats.emberCompleted >= 4,
  },
  {
    id: "three-arrivals",
    name: "三次抵达",
    sigil: "渡",
    note: "三则任务各走到至少一个结局。",
    goal: 3,
    progress: (stats) => stats.questsWithEnding,
    done: (stats) => stats.questsWithEnding >= 3,
  },
  {
    id: "twelve-goodbyes",
    name: "十二种告别",
    sigil: "别",
    note: "集齐三则任务的全部十二个结局。",
    goal: 12,
    progress: (stats) => stats.endingsSeen,
    done: (stats) => stats.endingsSeen >= 12,
  },
  {
    id: "three-truths",
    name: "三次真结局",
    sigil: "真",
    note: "集齐三则任务的真结局。",
    goal: 3,
    progress: (stats) => stats.trueEndingsSeen,
    done: (stats) => stats.trueEndingsSeen >= 3,
  },
  {
    id: "six-choice-hearts",
    name: "六个可选",
    sigil: "愿",
    note: "完成全部六个任务可选目标。",
    goal: 6,
    progress: (stats) => stats.optionalDone,
    done: (stats) => stats.optionalDone >= 6,
  },
  {
    id: "par-calibrated",
    name: "四次校准",
    sigil: "准",
    note: "四则谜题全部达到 Par。",
    goal: 4,
    progress: (stats) => stats.parPuzzles,
    done: (stats) => stats.parPuzzles >= 4,
  },
  {
    id: "true-hall",
    name: "真品厅",
    sigil: "真",
    note: "把八件无人认领的真品全部归位。",
    goal: 8,
    progress: (stats) => stats.trueArtifacts,
    done: (stats) => stats.trueArtifacts >= 8,
  },
  {
    id: "misunderstanding-hall",
    name: "误会万岁",
    sigil: "误",
    note: "把二十四件赝品全部收进误会厅。",
    goal: 24,
    progress: (stats) => stats.fakeArtifacts,
    done: (stats) => stats.fakeArtifacts >= 24,
  },
  {
    id: "resignation-letter",
    name: "辞职信",
    sigil: "辞",
    note: "真品 8 + 赝品 24，让老白交出辞职信。",
    goal: 32,
    progress: (stats) => stats.artifactsFound,
    done: (stats) => stats.artifactsFound >= 32,
  },
  {
    id: "outside-complete",
    name: "炉外全书",
    sigil: "全",
    note: "八页试炼、十二个结局与三十二件馆藏全部完成。",
    goal: OVERALL_TOTAL,
    progress: (stats) => stats.overallCurrent,
    done: (stats) => stats.overallCurrent >= OVERALL_TOTAL,
  },
];

function safeChallengeRecord(progress, id) {
  return progress?.completed?.[id] || null;
}

export function buildCollection(challengeProgress, questProgress, artifactRun) {
  const challengeList = CHALLENGES.map((challenge) => {
    const family = challengeFamily(challenge);
    const record = safeChallengeRecord(challengeProgress, challenge.id);
    const completed = Boolean(record);
    const par = isPuzzle(challenge) ? minimumSteps(challenge) : null;
    return {
      ...challenge,
      family,
      completed,
      bestSteps: record?.bestSteps ?? null,
      par,
      rating: completed && par ? parRating(challenge, record.bestSteps) : 0,
    };
  });

  const puzzleChallenges = challengeList.filter((challenge) => challenge.family === "puzzle");
  const emberChallenges = challengeList.filter((challenge) => challenge.family === "ember");
  const challengeCompleted = challengeList.filter((challenge) => challenge.completed).length;
  const puzzleCompleted = puzzleChallenges.filter((challenge) => challenge.completed).length;
  const emberCompleted = emberChallenges.filter((challenge) => challenge.completed).length;
  const parPuzzles = puzzleChallenges.filter(
    (challenge) => challenge.completed && challenge.bestSteps <= challenge.par
  ).length;

  const safeQuestProgress = questProgress || { version: 1, quests: {} };
  const questList = QUESTS.map((quest) => {
    const record = questRecord(safeQuestProgress, quest.id);
    const endings = quest.endings.map((ending, index) => {
      const flag = ending.condition?.flag;
      const option = quest.choices
        .flatMap((choice) => choice.options)
        .find((item) => item.flag === flag);
      return {
        ...ending,
        isTrue: index === 0,
        seen: record.endings.includes(ending.id),
        optionLabel: index === 0 ? null : option?.label || null,
      };
    });
    const optionals = quest.optionalObjectives.map((objective) => ({
      ...objective,
      done: record.optional.includes(objective.id),
    }));
    return {
      ...quest,
      endings,
      optionals,
      endingsSeen: endings.filter((ending) => ending.seen).length,
      optionalsDone: optionals.filter((objective) => objective.done).length,
      checkpoint: record.checkpoint,
      bestSteps: record.bestSteps,
      trueSeen: endings[0]?.seen || false,
    };
  });

  const questsWithEnding = questList.filter((quest) => quest.endingsSeen > 0).length;
  const endingsSeen = questList.reduce((sum, quest) => sum + quest.endingsSeen, 0);
  const trueEndingsSeen = questList.filter((quest) => quest.trueSeen).length;
  const optionalDone = questList.reduce((sum, quest) => sum + quest.optionalsDone, 0);
  const optionalTotal = QUESTS.reduce((sum, quest) => sum + quest.optionalObjectives.length, 0);

  const artifactCountsNow = artifactCounts(artifactRun || { trueIds: [], fakeIds: [], attempts: 0 });
  const trueItems = ARTIFACTS.map((artifact) => ({
    ...artifact,
    found: artifactRun?.trueIds?.includes(artifact.id) || false,
  }));
  const fakeItems = MISIDENTIFIED.map((exhibit) => ({
    ...exhibit,
    found: artifactRun?.fakeIds?.includes(exhibit.id) || false,
  }));
  const artifactsFound = artifactCountsNow.trueCount + artifactCountsNow.fakeCount;

  const stats = {
    challengeCompleted,
    challengeTotal: CHALLENGE_TOTAL,
    puzzleCompleted,
    puzzleTotal: puzzleChallenges.length,
    emberCompleted,
    emberTotal: emberChallenges.length,
    parPuzzles,
    questsWithEnding,
    questTotal: QUESTS.length,
    endingsSeen,
    endingTotal: ENDING_TOTAL,
    trueEndingsSeen,
    trueEndingTotal: QUESTS.length,
    optionalDone,
    optionalTotal,
    trueArtifacts: artifactCountsNow.trueCount,
    trueArtifactTotal: ARTIFACTS.length,
    fakeArtifacts: artifactCountsNow.fakeCount,
    fakeArtifactTotal: MISIDENTIFIED.length,
    artifactsFound,
    artifactTotal: ARTIFACT_TOTAL,
    overallCurrent: challengeCompleted + endingsSeen + artifactsFound,
    overallTotal: OVERALL_TOTAL,
    overallPercent: Math.round(((challengeCompleted + endingsSeen + artifactsFound) / OVERALL_TOTAL) * 100),
    museumComplete: artifactComplete(artifactRun || { trueIds: [], fakeIds: [], attempts: 0 }),
  };

  const badges = BADGES.map((badge) => {
    const current = Math.max(0, Math.min(badge.goal, badge.progress(stats)));
    return {
      ...badge,
      current,
      unlocked: badge.done(stats),
      percent: Math.round((current / badge.goal) * 100),
    };
  });

  return {
    stats,
    badges,
    badgeUnlocked: badges.filter((badge) => badge.unlocked).length,
    challenges: challengeList,
    puzzles: challengeList.filter((challenge) => challenge.family === "puzzle"),
    embers: challengeList.filter((challenge) => challenge.family === "ember"),
    quests: questList,
    trueItems,
    fakeItems,
    curatorStage: curatorStage(artifactCountsNow.fakeCount),
  };
}

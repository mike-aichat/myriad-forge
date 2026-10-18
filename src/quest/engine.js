import { resolveOutsideElement } from "../data/outside.js";

export function questRecipeKey(a, b) {
  return [a, b].sort().join("+");
}

export function currentAct(quest, run) {
  return quest.acts[run.actIndex] || quest.acts[quest.acts.length - 1];
}

export function findChoice(quest, choiceId) {
  return quest.choices.find((choice) => choice.id === choiceId) || null;
}

export function createQuestRun(quest) {
  return {
    discovered: [...quest.starterIds],
    stepsUsed: 0,
    actIndex: 0,
    flags: [],
    optional: [],
    pendingChoice: null,
    selectedOptions: [],
    endingId: null,
    status: "playing",
    beats: [],
  };
}

export function questUniverse(quest) {
  const ids = new Set(quest.starterIds);
  for (const recipe of quest.recipes) {
    ids.add(recipe.a);
    ids.add(recipe.b);
    ids.add(recipe.result);
  }
  return ids;
}

export function recipeAvailable(quest, run, recipe) {
  if ((recipe.act || 1) > run.actIndex + 1) return false;
  if (recipe.requiresFlag && !run.flags.includes(recipe.requiresFlag)) return false;
  return true;
}

export function availableRecipeMap(quest, run) {
  const map = new Map();
  for (const recipe of quest.recipes) {
    if (!recipeAvailable(quest, run, recipe)) continue;
    map.set(questRecipeKey(recipe.a, recipe.b), recipe);
  }
  return map;
}

export function syncOptional(quest, run) {
  const done = quest.optionalObjectives
    .filter((objective) =>
      objective.targetIds.every((id) => run.discovered.includes(id))
    )
    .map((objective) => objective.id);
  const changed =
    done.length !== run.optional.length ||
    done.some((id) => !run.optional.includes(id));
  return changed ? { ...run, optional: done } : run;
}

function advanceAfterTarget(quest, run) {
  const act = currentAct(quest, run);
  const choice = quest.choices.find((item) => item.actId === act.id);
  if (choice) {
    return { ...run, pendingChoice: choice.id };
  }
  if (run.actIndex < quest.acts.length - 1) {
    return { ...run, actIndex: run.actIndex + 1 };
  }
  const endingId = resolveQuestEnding(quest, run);
  return { ...run, status: "won", endingId };
}

export function fuseQuest(quest, run, aId, bId) {
  if (run.status !== "playing" || run.pendingChoice) {
    return { run, result: null, isNew: false, ended: false, blocked: true };
  }

  let next = {
    ...run,
    stepsUsed: run.stepsUsed + 1,
    beats: [...run.beats],
  };

  const recipe = availableRecipeMap(quest, run).get(questRecipeKey(aId, bId));
  if (!recipe) {
    return { run: next, result: null, isNew: false, ended: false, blocked: false };
  }

  const isNew = !next.discovered.includes(recipe.result);
  if (isNew) {
    next.discovered = [...next.discovered, recipe.result];
    const beat = quest.beats[recipe.result];
    if (beat) {
      const element = resolveOutsideElement(recipe.result);
      next.beats = [...next.beats, { id: recipe.result, text: beat, name: element?.name || recipe.result }];
    }
  }

  next = syncOptional(quest, next);

  const targetId = currentAct(quest, next).targetId;
  if (isNew && recipe.result === targetId) {
    next = advanceAfterTarget(quest, next);
  }

  return {
    run: next,
    result: resolveOutsideElement(recipe.result),
    isNew,
    ended: next.status === "won",
    blocked: false,
  };
}

export function chooseQuestOption(quest, run, choiceId, optionId) {
  if (run.status !== "playing" || run.pendingChoice !== choiceId) {
    return { run, choice: null, option: null };
  }
  const choice = findChoice(quest, choiceId);
  const option = choice?.options.find((item) => item.id === optionId);
  if (!choice || !option) return { run, choice, option: null };

  let next = {
    ...run,
    flags: run.flags.includes(option.flag) ? [...run.flags] : [...run.flags, option.flag],
    selectedOptions: [
      ...run.selectedOptions.filter((item) => item.choiceId !== choiceId),
      { choiceId, optionId, label: option.label, flag: option.flag },
    ],
    pendingChoice: null,
    beats: [...run.beats],
  };

  for (const id of option.unlockIds || []) {
    if (next.discovered.includes(id)) continue;
    next.discovered = [...next.discovered, id];
    const beat = quest.beats[id];
    if (beat) {
      const element = resolveOutsideElement(id);
      next.beats = [...next.beats, { id, text: beat, name: element?.name || id }];
    }
  }

  next = syncOptional(quest, next);
  if (next.actIndex < quest.acts.length - 1) {
    next.actIndex += 1;
  }
  return { run: next, choice, option };
}

export function endingMatches(ending, run) {
  if (!ending.condition) return true;
  const { flag, optional } = ending.condition;
  if (flag && !run.flags.includes(flag)) return false;
  if (optional && !optional.every((id) => run.optional.includes(id))) return false;
  return true;
}

export function resolveQuestEnding(quest, run) {
  const ending = quest.endings.find((item) => endingMatches(item, run));
  return ending?.id || quest.endings[quest.endings.length - 1].id;
}

export function optionalProgress(quest, run) {
  return quest.optionalObjectives.map((objective) => {
    const found = objective.targetIds.filter((id) => run.discovered.includes(id));
    return {
      ...objective,
      found: found.length,
      total: objective.targetIds.length,
      done: found.length === objective.targetIds.length,
    };
  });
}

export function createCheckpoint(quest, run) {
  return {
    actIndex: run.actIndex,
    flags: [...run.flags],
    optional: [...run.optional],
    selectedOptions: [...run.selectedOptions],
    discovered: [...run.discovered],
    stepsUsed: run.stepsUsed,
  };
}

export function resumeQuestRun(quest, checkpoint) {
  const base = createQuestRun(quest);
  if (!checkpoint) return base;
  const universe = questUniverse(quest);
  const discovered = [...new Set([...quest.starterIds, ...(checkpoint.discovered || [])])].filter((id) =>
    universe.has(id)
  );
  const actIndex = Math.max(0, Math.min(quest.acts.length - 1, Math.floor(checkpoint.actIndex || 0)));
  let run = {
    ...base,
    discovered,
    actIndex,
    stepsUsed: Math.max(0, Math.floor(checkpoint.stepsUsed || 0)),
    flags: (checkpoint.flags || []).filter((flag) =>
      quest.choices.some((choice) => choice.options.some((option) => option.flag === flag))
    ),
    selectedOptions: (checkpoint.selectedOptions || []).filter((item) =>
      quest.choices.some((choice) => choice.options.some((option) => option.optionId === item.optionId))
    ),
  };
  run = syncOptional(quest, run);
  return run;
}

export function questActProgress(quest, run) {
  return quest.acts.map((act, index) => ({
    ...act,
    state:
      index < run.actIndex
        ? "done"
        : index === run.actIndex
          ? run.status === "won"
            ? "done"
            : "current"
          : "locked",
  }));
}

export function questMinimumSteps(quest) {
  const starters = new Set(quest.starterIds);
  const required = new Set();

  const visit = (id) => {
    if (starters.has(id) || required.has(id)) return;
    required.add(id);
    const recipe = quest.recipes.find((item) => item.result === id);
    if (!recipe) return;
    visit(recipe.a);
    visit(recipe.b);
  };

  visit(quest.finalTargetId);
  return required.size;
}

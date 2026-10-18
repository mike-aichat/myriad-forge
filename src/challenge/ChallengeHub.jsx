import React from "react";
import { CHALLENGES } from "../data/challenges.js";
import { QUESTS } from "../data/quests.js";
import { ARTIFACT_FRAGMENTS, ARTIFACTS, MISIDENTIFIED } from "../data/artifacts.js";
import { CATEGORY_MAP } from "../data/categories.js";
import { Sprite } from "../ui/Sprite.jsx";
import {
  challengeFamily,
  isMainElement,
  minimumSteps,
  resolveChallengeElement,
} from "../challenge/engine.js";
import { questRecord } from "../quest/store.js";
import { artifactCounts, curatorStage } from "../artifact/engine.js";

const FAMILY_META = {
  puzzle: {
    name: "谜题",
    kicker: "PUZZLES · 四则小物件",
    blurb: "没有余烬，没有失败。起始要素全部来自主图鉴之外，试错免费，卡住可以翻提示。",
  },
  ember: {
    name: "燃尽",
    kicker: "EMBER TRIALS · 四则旧故事",
    blurb: "成功与失败都会消耗余烬。它们仍在炉边，等你把最后一点火用完。",
  },
};

function ChallengeCard({ challenge, progress, onOpen }) {
  const family = challengeFamily(challenge);
  const isPuzzle = family === "puzzle";
  const target = resolveChallengeElement(challenge.targetId);
  const category = CATEGORY_MAP[target.category];
  const starters = challenge.starterIds.map((id) => resolveChallengeElement(id)).filter(Boolean);
  const completed = progress.completed[challenge.id];
  const isNewTarget = !isMainElement(challenge.targetId);
  const par = isPuzzle ? minimumSteps(challenge) : null;
  const stateLabel = completed
    ? `${isPuzzle ? "已解开" : "已写完"} · 最佳 ${completed.bestSteps} ${isPuzzle ? "步" : "次"}`
    : isPuzzle
      ? "未解开"
      : "未写完";

  return (
    <article
      className={`challenge-card panel ${completed ? "is-complete" : ""} ${isPuzzle ? "is-puzzle" : "is-ember"}`}
      style={{ "--challenge-accent": challenge.accent }}
    >
      <div className="challenge-card__topline">
        <span className="challenge-card__numeral">{challenge.numeral}</span>
        <span className="challenge-card__family">{isPuzzle ? "谜题" : "燃尽"}</span>
        <span className="challenge-card__state">{stateLabel}</span>
      </div>

      <h3>{challenge.title}</h3>
      <p className="challenge-card__subtitle">{challenge.subtitle}</p>
      <blockquote>{challenge.quote}</blockquote>

      <div className="challenge-card__goal">
        <div className="challenge-card__target-sprite">
          <Sprite element={target} size={66} />
        </div>
        <div className="challenge-card__target-copy">
          <span className="eyebrow">最终要素</span>
          <b>{target.name}</b>
          <span className="challenge-kind" data-new={isNewTarget ? "true" : "false"}>
            {isNewTarget ? "试炼限定" : "主线要素"}
          </span>
          <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
        </div>
      </div>

      <div className="challenge-card__starters">
        <span className="eyebrow">
          {isPuzzle ? `挑战专属起始要素 · ${starters.length} 种` : `起始要素 · ${starters.length} 种`}
        </span>
        <div className="challenge-card__starter-row">
          {starters.map((element) => (
            <span key={element.id} className={`challenge-starter ${isPuzzle ? "is-exclusive" : ""}`} title={element.description}>
              <Sprite element={element} size={24} />
              <i>{element.name}</i>
            </span>
          ))}
        </div>
      </div>

      <div className="challenge-card__footer">
        <span className="challenge-ember-count">
          {isPuzzle ? `✦ 无步数限制 · Par ${par}` : `✦ 余烬 ${challenge.stepLimit} 次`}
        </span>
        <button
          type="button"
          className="primary-button challenge-open"
          onClick={() => onOpen(challenge)}
          aria-label={`${completed ? (isPuzzle ? "再解一次" : "再走一遍") : isPuzzle ? "解开" : "翻开"}「${challenge.title}」`}
        >
          {completed ? (isPuzzle ? "再解一次" : "再走一遍") : isPuzzle ? "解开这一页" : "翻开这一页"}
        </button>
      </div>
    </article>
  );
}

function QuestCard({ quest, progress, onOpen }) {
  const record = questRecord(progress, quest.id);
  const finalTarget = resolveChallengeElement(quest.finalTargetId);
  const category = CATEGORY_MAP[finalTarget.category];
  const starters = quest.starterIds.map((id) => resolveChallengeElement(id)).filter(Boolean);
  const optionalDone = record.optional.length;
  const checkpoint = record.checkpoint;
  const act = checkpoint ? quest.acts[checkpoint.actIndex] : null;
  const started = record.endings.length > 0 || Boolean(checkpoint);

  return (
    <article className="quest-card panel" style={{ "--challenge-accent": quest.accent }}>
      <div className="quest-card__topline">
        <span className="challenge-card__numeral">{quest.numeral}</span>
        <span className="challenge-card__family">任务</span>
        <span className="challenge-card__state">
          {checkpoint
            ? `停在第${act.numeral}幕开头`
            : record.endings.length > 0
              ? `已见 ${record.endings.length} / ${quest.endings.length} 个结局`
              : "未走进"}
        </span>
      </div>

      <h3>{quest.title}</h3>
      <p className="quest-card__subtitle">{quest.subtitle}</p>
      <blockquote>{quest.quote}</blockquote>

      <div className="quest-card__goal">
        <div className="quest-card__sprite">
          <span aria-hidden="true" />
          <Sprite element={finalTarget} size={82} />
        </div>
        <div>
          <span className="eyebrow">任务终点</span>
          <b>{finalTarget.name}</b>
          <div>
            <span className="challenge-kind" data-new="true">任务限定</span>
            <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
          </div>
          <p>{quest.acts.length} 幕 · {quest.endings.length} 个结局 · {quest.optionalObjectives.length} 个可选目标</p>
        </div>
      </div>

      <ol className="quest-card__acts">
        {quest.acts.map((item) => (
          <li key={item.id}>
            <span>{item.numeral}</span>
            <b>{item.title}</b>
            <em>{item.objective}</em>
          </li>
        ))}
      </ol>

      <div className="challenge-card__starters">
        <span className="eyebrow">任务专属起始要素 · {starters.length} 种 · 全部来自主图鉴之外</span>
        <div className="challenge-card__starter-row">
          {starters.map((element) => (
            <span key={element.id} className="challenge-starter is-exclusive" title={element.description}>
              <Sprite element={element} size={24} />
              <i>{element.name}</i>
            </span>
          ))}
        </div>
      </div>

      <div className="quest-card__record">
        <span>结局 {record.endings.length} / {quest.endings.length}</span>
        <span>可选目标 {optionalDone} / {quest.optionalObjectives.length}</span>
        <span>{started ? "选择会改变第三幕" : "没有余烬 · 不会失败"}</span>
      </div>

      <div className="challenge-card__footer">
        <span className="challenge-ember-count">✦ 无步数限制 · 3 幕 · 4 结局</span>
        <button type="button" className="primary-button challenge-open" onClick={() => onOpen(quest)}>
          {checkpoint ? "继续这一则" : record.endings.length > 0 ? "再走一遍" : "走进这一则"}
        </button>
      </div>
    </article>
  );
}

function ArtifactCard({ run, onOpen }) {
  const counts = artifactCounts(run);
  const stage = curatorStage(run.fakeIds.length);
  const fragmentPreview = ARTIFACT_FRAGMENTS.slice(0, 9);

  return (
    <article className="artifact-card-feature panel">
      <div className="artifact-card-feature__copy">
        <p className="eyebrow">炉外机构 · LOST & FOUND MUSEUM</p>
        <h3>失物招领博物馆</h3>
        <p>
          真品厅收藏 {ARTIFACTS.length} 件无人认领的遗物，误会厅收藏 {MISIDENTIFIED.length} 件被认真登记的赝品。
          三块碎片，顺序无关；选错不会失败，只会多一件有展签的误会。
        </p>
        <div className="artifact-card-feature__stats">
          <span><b>{counts.trueCount}</b> / {counts.trueTotal} 真品</span>
          <span><b>{counts.fakeCount}</b> / {counts.fakeTotal} 误会</span>
          <span><b>{fragmentPreview.length > 0 ? ARTIFACT_FRAGMENTS.length : 0}</b> 块碎片</span>
        </div>
        <blockquote>{stage.line}</blockquote>
        <div className="artifact-card-feature__actions">
          <button type="button" className="primary-button" onClick={onOpen}>
            {counts.total > 0 ? "继续整理馆藏" : "进入失物招领馆"}
          </button>
          <span>馆长老白 · 已故 · 仍在打卡</span>
        </div>
      </div>
      <div className="artifact-card-feature__preview" aria-hidden="true">
        {fragmentPreview.map((fragment, index) => (
          <span key={fragment.id} style={{ "--i": index }}>
            <Sprite element={fragment} size={34} />
          </span>
        ))}
        <i className="artifact-card-feature__seal">真</i>
      </div>
    </article>
  );
}

export function ChallengeHub({ progress, questProgress, artifactRun, onOpen, onOpenQuest, onOpenArtifacts }) {
  const completed = Object.keys(progress.completed).length;
  const total = CHALLENGES.length;
  const puzzleChallenges = CHALLENGES.filter((challenge) => challengeFamily(challenge) === "puzzle");
  const emberChallenges = CHALLENGES.filter((challenge) => challengeFamily(challenge) === "ember");
  const questsDone = QUESTS.filter((quest) => questRecord(questProgress, quest.id).endings.length > 0).length;
  const endingsSeen = QUESTS.reduce(
    (sum, quest) => sum + questRecord(questProgress, quest.id).endings.length,
    0
  );
  const endingsTotal = QUESTS.reduce((sum, quest) => sum + quest.endings.length, 0);
  const artifactCountsNow = artifactCounts(artifactRun);
  const exclusiveStarterCount = new Set(
    puzzleChallenges.flatMap((challenge) => challenge.starterIds).filter((id) => !isMainElement(id))
  ).size;

  const renderFamily = (family) => {
    const list = CHALLENGES.filter((challenge) => challengeFamily(challenge) === family);
    if (!list.length) return null;
    const meta = FAMILY_META[family];
    const done = list.filter((challenge) => progress.completed[challenge.id]).length;
    return (
      <section className="challenge-family" key={family}>
        <div className="challenge-family__head">
          <div>
            <p className="eyebrow">{meta.kicker}</p>
            <h3>{meta.name}</h3>
          </div>
          <div className="challenge-family__meta">
            <span>{done} / {list.length} 已完成</span>
            <p>{meta.blurb}</p>
          </div>
        </div>
        <div className="challenge-grid">
          {list.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} progress={progress} onOpen={onOpen} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <main className="challenge-hub">
      <section className="challenge-hero panel">
        <div className="challenge-hero__copy">
          <p className="eyebrow">炉外总目录 · STORIES OUTSIDE THE FORGE</p>
          <h2>主线之外，还有八页试炼、三则任务和一座失物招领馆</h2>
          <p>
            谜题和燃尽是旧的炉外故事；任务有幕、有选择、有四个结局；失物招领馆把错误鉴定也收进展厅。
            三族试炼都不继承主图鉴，任务和遗物各自独立保存。
          </p>
          <div className="challenge-hero__stats">
            <span><b>{completed}</b> / {total} 页试炼</span>
            <span><b>{questsDone}</b> / {QUESTS.length} 则任务</span>
            <span><b>{endingsSeen}</b> / {endingsTotal} 个任务结局</span>
            <span><b>{exclusiveStarterCount}</b> 种谜题专属起始</span>
            <span><b>{artifactCountsNow.total}</b> / {artifactCountsNow.totalMax} 件馆藏</span>
          </div>
        </div>
        <div className="challenge-hero__sigil" aria-hidden="true">
          <span className="challenge-hero__ring" />
          <span className="challenge-hero__ring challenge-hero__ring--inner" />
          <span className="challenge-hero__mark">外</span>
        </div>
      </section>

      <div className="challenge-rules">
        <span><b>自由试错</b>谜题没有余烬，错误组合不会失败。</span>
        <span><b>任务选择</b>三则任务各有 3 幕、4 个结局，选择不可撤销。</span>
        <span><b>燃尽模式</b>旧四则仍有有限余烬，成功失败都扣。</span>
        <span><b>错误也有展签</b>遗物馆的 24 件赝品不是失败，是馆藏。</span>
      </div>

      {renderFamily("puzzle")}

      <section className="challenge-family challenge-family--quests">
        <div className="challenge-family__head">
          <div>
            <p className="eyebrow">QUESTS · 三则多幕任务</p>
            <h3>任务</h3>
          </div>
          <div className="challenge-family__meta">
            <span>{questsDone} / {QUESTS.length} 已完成 · {endingsSeen} / {endingsTotal} 个结局</span>
            <p>每一则都有三幕、一次不可撤销的选择和四个结局。没有余烬，没有步数上限，也不会失败；真结局需要可选的真相。</p>
          </div>
        </div>
        <div className="quest-grid">
          {QUESTS.map((quest) => (
            <QuestCard key={quest.id} quest={quest} progress={questProgress} onOpen={onOpenQuest} />
          ))}
        </div>
      </section>

      {renderFamily("ember")}

      <section className="challenge-family challenge-family--artifacts">
        <div className="challenge-family__head">
          <div>
            <p className="eyebrow">ARTIFACTS · 失物招领与误会厅</p>
            <h3>遗物</h3>
          </div>
          <div className="challenge-family__meta">
            <span>{artifactCountsNow.trueCount} / {artifactCountsNow.trueTotal} 真品 · {artifactCountsNow.fakeCount} / {artifactCountsNow.fakeTotal} 误会</span>
            <p>读失物档案，挑三块碎片。命中真品会归位；命中赝品会被认真登记；两者都不是，馆长老白会给你一句吐槽。</p>
          </div>
        </div>
        <ArtifactCard run={artifactRun} onOpen={onOpenArtifacts} />
      </section>

      {completed === total && questsDone === QUESTS.length && (
        <div className="challenge-hub__complete">
          <span aria-hidden="true">✦</span>
          八页试炼和三则任务都写完了。遗物馆还亮着灯，主线也还在炉边等你。
        </div>
      )}
    </main>
  );
}

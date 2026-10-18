import React from "react";
import { CHALLENGES } from "../data/challenges.js";
import { CATEGORY_MAP } from "../data/categories.js";
import { Sprite } from "../ui/Sprite.jsx";
import {
  challengeFamily,
  isMainElement,
  minimumSteps,
  resolveChallengeElement,
} from "./engine.js";

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
      className={`challenge-card panel ${completed ? "is-complete" : ""} ${
        isPuzzle ? "is-puzzle" : "is-ember"
      }`}
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
            <span
              key={element.id}
              className={`challenge-starter ${isPuzzle ? "is-exclusive" : ""}`}
              title={element.description}
            >
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

export function ChallengeHub({ progress, onOpen }) {
  const completed = Object.keys(progress.completed).length;
  const total = CHALLENGES.length;
  const puzzleChallenges = CHALLENGES.filter((challenge) => challengeFamily(challenge) === "puzzle");
  const emberChallenges = CHALLENGES.filter((challenge) => challengeFamily(challenge) === "ember");
  const exclusiveStarterCount = new Set(
    puzzleChallenges
      .flatMap((challenge) => challenge.starterIds)
      .filter((id) => !isMainElement(id))
  ).size;

  return (
    <main className="challenge-hub">
      <section className="challenge-hero panel">
        <div className="challenge-hero__copy">
          <p className="eyebrow">炉外试炼 · STORIES OUTSIDE THE FORGE</p>
          <h2>主线之外，还有八页没写完的故事</h2>
          <p>
            四页是新的谜题：起始要素全部来自主图鉴之外，没有余烬，试错免费。
            四页是旧的燃尽故事：火有限，选择也有限。两族都不继承主图鉴，各自独立保存进度。
          </p>
          <div className="challenge-hero__stats">
            <span><b>{completed}</b> / {total} 页</span>
            <span><b>{puzzleChallenges.length}</b> 则自由谜题</span>
            <span><b>{exclusiveStarterCount}</b> 种专属起始要素</span>
            <span><b>{emberChallenges.length}</b> 则燃尽故事</span>
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
        <span><b>专属牌堆</b>谜题的起始要素全部不在主图鉴里。</span>
        <span><b>燃尽模式</b>旧四则仍有有限余烬，成功失败都扣。</span>
      </div>

      {["puzzle", "ember"].map((family) => {
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
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  progress={progress}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        );
      })}

      {completed === total && (
        <div className="challenge-hub__complete">
          <span aria-hidden="true">✦</span>
          八页炉外故事都写完了。主线还在炉边等你。
        </div>
      )}
    </main>
  );
}

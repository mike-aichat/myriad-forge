import React from "react";
import { CHALLENGES } from "../data/challenges.js";
import { CATEGORY_MAP } from "../data/categories.js";
import { Sprite } from "../ui/Sprite.jsx";
import { isMainElement, resolveChallengeElement } from "./engine.js";

function ChallengeCard({ challenge, progress, onOpen }) {
  const target = resolveChallengeElement(challenge.targetId);
  const category = CATEGORY_MAP[target.category];
  const starters = challenge.starterIds.map((id) => resolveChallengeElement(id)).filter(Boolean);
  const completed = progress.completed[challenge.id];
  const isNewTarget = !isMainElement(challenge.targetId);

  return (
    <article
      className={`challenge-card panel ${completed ? "is-complete" : ""}`}
      style={{ "--challenge-accent": challenge.accent }}
    >
      <div className="challenge-card__topline">
        <span className="challenge-card__numeral">{challenge.numeral}</span>
        <span className="challenge-card__state">
          {completed ? `已写完 · 最佳 ${completed.bestSteps} 次` : "未写完"}
        </span>
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
        <span className="eyebrow">起始要素 · {starters.length} 种</span>
        <div className="challenge-card__starter-row">
          {starters.map((element) => (
            <span key={element.id} className="challenge-starter" title={element.name}>
              <Sprite element={element} size={24} />
              <i>{element.name}</i>
            </span>
          ))}
        </div>
      </div>

      <div className="challenge-card__footer">
        <span className="challenge-ember-count">✦ 余烬 {challenge.stepLimit} 次</span>
        <button
          type="button"
          className="primary-button challenge-open"
          onClick={() => onOpen(challenge)}
          aria-label={`${completed ? "再走一遍" : "翻开"}「${challenge.title}」`}
        >
          {completed ? "再走一遍" : "翻开这一页"}
        </button>
      </div>

    </article>
  );
}

export function ChallengeHub({ progress, onOpen }) {
  const completed = Object.keys(progress.completed).length;
  const total = CHALLENGES.length;
  return (
    <main className="challenge-hub">
      <section className="challenge-hero panel">
        <div className="challenge-hero__copy">
          <p className="eyebrow">炉外试炼 · STORIES OUTSIDE THE FORGE</p>
          <h2>主线之外，还有四页没写完的故事</h2>
          <p>
            主炉负责创造世界。这里只负责把一些没能说完的故事做完。每则试炼只给你一小把要素，以及有限的余烬。
            造出最终要素，故事才会合上。
          </p>
          <div className="challenge-hero__stats">
            <span><b>{completed}</b> / {total} 则故事</span>
            <span><b>{CHALLENGES.filter((challenge) => !isMainElement(challenge.targetId)).length}</b> 个试炼限定最终要素</span>
            <span><b>{CHALLENGES.length}</b> 段独立叙事</span>
          </div>
        </div>
        <div className="challenge-hero__sigil" aria-hidden="true">
          <span className="challenge-hero__ring" />
          <span className="challenge-hero__ring challenge-hero__ring--inner" />
          <span className="challenge-hero__mark">外</span>
        </div>
      </section>

      <div className="challenge-rules">
        <span><b>固定牌堆</b>起始要素不能替换，也不继承主图鉴。</span>
        <span><b>有限余烬</b>成功与失败都会消耗一次余烬。</span>
        <span><b>故事会变</b>每造出一个新要素，故事就多写一行。</span>
      </div>

      <div className="challenge-grid">
        {CHALLENGES.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            progress={progress}
            onOpen={onOpen}
          />
        ))}
      </div>

      {completed === total && (
        <div className="challenge-hub__complete">
          <span aria-hidden="true">✦</span>
          四页炉外故事都写完了。主线还在炉边等你。
        </div>
      )}
    </main>
  );
}

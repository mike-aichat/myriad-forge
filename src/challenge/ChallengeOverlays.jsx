import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_MAP } from "../data/categories.js";
import { Sprite } from "../ui/Sprite.jsx";
import { isMainElement, isPuzzle, minimumSteps, parRating, resolveChallengeElement } from "./engine.js";

function useChallengeOverlay(onBack) {
  const ref = useRef(null);
  const backRef = useRef(onBack);

  useEffect(() => {
    backRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    const previous = document.activeElement;
    document.body.classList.add("is-locked");
    const timer = window.setTimeout(() => {
      const target = ref.current?.querySelector("[data-autofocus]") || ref.current;
      target?.focus?.({ preventScroll: true });
    }, 40);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        backRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !ref.current) return;
      const nodes = [
        ...ref.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ];
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-locked");
      previous?.focus?.();
    };
  }, []);

  return ref;
}

export function ChallengeIntroOverlay({ challenge, target, onStart, onBack }) {
  const ref = useChallengeOverlay(onBack);
  const category = CATEGORY_MAP[target.category];
  const targetIsNew = !isMainElement(challenge.targetId);
  const puzzle = isPuzzle(challenge);
  const par = puzzle ? minimumSteps(challenge) : null;
  const starters = challenge.starterIds.map((id) => resolveChallengeElement(id)).filter(Boolean);

  return createPortal(
    <div className="overlay challenge-intro-overlay" role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <article
        className="challenge-intro-card"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-intro-title"
        style={{ "--challenge-accent": challenge.accent }}
      >
        <div className="challenge-intro-card__number">{challenge.numeral}</div>
        <button
          type="button"
          className="challenge-intro-close"
          onClick={onBack}
          aria-label="返回炉外目录"
        >
          ×
        </button>
        <p className="overlay-kicker">
          {puzzle ? "炉外谜题" : "炉外试炼"} · 第{challenge.numeral}则
        </p>
        <h2 id="challenge-intro-title">{challenge.title}</h2>
        <p className="challenge-intro-card__subtitle">{challenge.subtitle}</p>
        <blockquote>{challenge.quote}</blockquote>

        <div className="challenge-intro-grid">
          <div className="challenge-intro-copy">
            <p className="eyebrow">故事是这样开始的</p>
            <p className="challenge-intro-story">{challenge.intro}</p>
            <p className="challenge-clue">
              <span>炉边老话</span>
              {challenge.clue}
            </p>
          </div>

          <div className="challenge-intro-target">
            <p className="eyebrow">最终要素</p>
            <div className="challenge-intro-target__sprite">
              <span aria-hidden="true" />
              <Sprite element={target} size={90} />
            </div>
            <h3>{target.name}</h3>
            <div className="challenge-intro-target__chips">
              <span className="challenge-kind" data-new={targetIsNew ? "true" : "false"}>
                {targetIsNew ? (puzzle ? "谜题限定" : "试炼限定") : "主线要素"}
              </span>
              <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
            </div>
            <p>{challenge.objective}</p>
          </div>
        </div>

        <div className="challenge-intro-starters">
          <div className="challenge-intro-starters__head">
            <span className="eyebrow">
              {puzzle ? "挑战专属起始要素" : "你手里的起始要素"} · {starters.length} 种
            </span>
            <span className="challenge-ember-count">
              {puzzle ? `✦ 无步数限制 · Par ${par}` : `✦ 余烬 ${challenge.stepLimit} 次`}
            </span>
          </div>
          <div className="challenge-intro-starters__row">
            {starters.map((element) => (
              <span key={element.id} title={element.description}>
                <Sprite element={element} size={30} />
                {element.name}
              </span>
            ))}
          </div>
        </div>

        <p className="challenge-intro-rule">
          {puzzle
            ? "只可用本页配方。错误组合不会失败，也没有步数限制；卡住就翻提示。离开会从头开始。"
            : "只可用本页配方。成功和失败都会烧掉一枚余烬；离开后余烬重燃，故事从头开始。"}
        </p>

        <div className="challenge-intro-actions">
          <button type="button" className="primary-button primary-button--wide" onClick={onStart} data-autofocus>
            {puzzle ? "开始解谜" : "点燃余烬"}
          </button>
          <button type="button" className="text-button" onClick={onBack}>
            回到试炼目录
          </button>
        </div>
      </article>
    </div>,
    document.body
  );
}

export function ChallengeResultOverlay({ challenge, target, record, nextChallenge, onRetry, onNext, onBack }) {
  const ref = useChallengeOverlay(onBack);
  const category = CATEGORY_MAP[target.category];
  const targetIsNew = !isMainElement(challenge.targetId);
  const won = record.type === "won";
  const puzzle = isPuzzle(challenge);
  const par = puzzle ? minimumSteps(challenge) : null;
  const rating = won && puzzle ? parRating(challenge, record.stepsUsed) : 0;
  const remaining = puzzle ? null : Math.max(0, challenge.stepLimit - record.stepsUsed);

  return createPortal(
    <div className={`overlay challenge-result-overlay ${won ? "is-win" : "is-loss"}`} role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <article
        className="challenge-result-card"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-result-title"
        style={{ "--challenge-accent": challenge.accent }}
      >
        <p className="overlay-kicker">
          {won
            ? puzzle
              ? "谜题解开 · PUZZLE SOLVED"
              : "试炼完成 · STORY COMPLETE"
            : "余烬熄灭 · THE FIRE FADES"}
        </p>
        <div className={`challenge-result-sigil ${won ? "is-win" : "is-loss"}`}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <Sprite element={target} size={won ? 144 : 112} />
        </div>
        <h2 id="challenge-result-title">
          {won ? `${puzzle ? "你解开了" : "你造出了"}「${target.name}」` : "故事停在这里"}
        </h2>
        <div className="challenge-result-chips">
          <span className="challenge-kind" data-new={targetIsNew ? "true" : "false"}>
            {targetIsNew ? (puzzle ? "谜题限定" : "试炼限定") : "主线要素"}
          </span>
          <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
        </div>
        {won && puzzle && (
          <div
            className="challenge-result-stars"
            aria-label={rating === 3 ? "三星，达到 Par" : rating === 2 ? "二星" : "一星"}
          >
            {[1, 2, 3].map((star) => (
              <span key={star} className={star <= rating ? "is-lit" : ""} aria-hidden="true">✦</span>
            ))}
          </div>
        )}

        {won ? (
          <>
            <p className="challenge-result-description">{target.description}</p>
            <p className="challenge-result-copy">{challenge.outro}</p>
          </>
        ) : (
          <p className="challenge-result-copy">{challenge.fail}</p>
        )}

        <div className="challenge-result-stats">
          {puzzle ? (
            <>
              <div>
                <span>本次步数</span>
                <b>{record.stepsUsed} 步</b>
              </div>
              <div>
                <span>Par</span>
                <b>{par} 步</b>
              </div>
              <div>
                <span>最佳记录</span>
                <b>{record.bestSteps} 步</b>
              </div>
            </>
          ) : (
            <>
              <div>
                <span>{won ? "本次熔炼" : "用到余烬"}</span>
                <b>{won ? record.stepsUsed : challenge.stepLimit} 次</b>
              </div>
              <div>
                <span>{won ? "最佳记录" : "剩余余烬"}</span>
                <b>{won ? `${record.bestSteps} 次` : "0 枚"}</b>
              </div>
              <div>
                <span>{won ? "剩余余烬" : "最终目标"}</span>
                <b>{won ? `${remaining} 枚` : target.name}</b>
              </div>
            </>
          )}
        </div>

        <div className="challenge-result-actions">
          {won ? (
            <>
              <button type="button" className="primary-button" onClick={onRetry} data-autofocus>
                {puzzle ? "再解一次" : "再走一遍"}
              </button>
              {nextChallenge && (
                <button type="button" className="primary-button primary-button--ghost" onClick={onNext}>
                  {puzzle ? "下一则谜题" : "下一则故事"}
                </button>
              )}
              <button type="button" className="text-button" onClick={onBack}>
                回到试炼目录
              </button>
            </>
          ) : (
            <>
              <button type="button" className="primary-button" onClick={onRetry} data-autofocus>
                再点一次火
              </button>
              <button type="button" className="text-button" onClick={onBack}>
                回到试炼目录
              </button>
            </>
          )}
        </div>
        {won && (
          <p className="challenge-result-foot">
            {puzzle
              ? "已记入炉外手记。起始要素不会改变，但每次可以换一条更短的路。"
              : "已记入炉外手记。起始要素不会改变，但每次可以选择不同的顺序。"}
          </p>
        )}
      </article>
    </div>,
    document.body
  );
}

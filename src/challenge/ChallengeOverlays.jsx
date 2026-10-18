import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_MAP } from "../data/categories.js";
import { Sprite } from "../ui/Sprite.jsx";
import { isMainElement, resolveChallengeElement } from "./engine.js";

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
      target?.focus?.();
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
        <p className="overlay-kicker">炉外试炼 · 第{challenge.numeral}则</p>
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
                {targetIsNew ? "试炼限定" : "主线要素"}
              </span>
              <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
            </div>
            <p>{challenge.objective}</p>
          </div>
        </div>

        <div className="challenge-intro-starters">
          <div className="challenge-intro-starters__head">
            <span className="eyebrow">你手里的起始要素 · {starters.length} 种</span>
            <span className="challenge-ember-count">✦ 余烬 {challenge.stepLimit} 次</span>
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
          只可使用本页中的配方。成功和失败都会消耗一枚余烬；离开试炼会重燃余烬，故事从头开始。
        </p>

        <div className="challenge-intro-actions">
          <button type="button" className="primary-button primary-button--wide" onClick={onStart} data-autofocus>
            点燃余烬
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
  const remaining = Math.max(0, challenge.stepLimit - record.stepsUsed);

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
          {won ? "试炼完成 · STORY COMPLETE" : "余烬熄灭 · THE FIRE FADES"}
        </p>
        <div className={`challenge-result-sigil ${won ? "is-win" : "is-loss"}`}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <Sprite element={target} size={won ? 144 : 112} />
        </div>
        <h2 id="challenge-result-title">{won ? `你造出了「${target.name}」` : "故事停在这里"}</h2>
        <div className="challenge-result-chips">
          <span className="challenge-kind" data-new={targetIsNew ? "true" : "false"}>
            {targetIsNew ? "试炼限定" : "主线要素"}
          </span>
          <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
        </div>

        {won ? (
          <>
            <p className="challenge-result-description">{target.description}</p>
            <p className="challenge-result-copy">{challenge.outro}</p>
          </>
        ) : (
          <p className="challenge-result-copy">{challenge.fail}</p>
        )}

        <div className="challenge-result-stats">
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
        </div>

        <div className="challenge-result-actions">
          {won ? (
            <>
              <button type="button" className="primary-button" onClick={onRetry} data-autofocus>
                再走一遍
              </button>
              {nextChallenge && (
                <button type="button" className="primary-button primary-button--ghost" onClick={onNext}>
                  下一则故事
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
        {won && <p className="challenge-result-foot">已记入炉外手记。起始要素不会改变，但每次可以选择不同的顺序。</p>}
      </article>
    </div>,
    document.body
  );
}

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_MAP } from "../data/categories.js";
import { Sprite } from "../ui/Sprite.jsx";
import { resolveOutsideElement } from "../data/outside.js";
import { optionalProgress, questMinimumSteps } from "./engine.js";
import { questRecord } from "./store.js";

function useQuestOverlay(onBack) {
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

export function QuestIntroOverlay({ quest, progress, onStart, onRestart, onBack }) {
  const ref = useQuestOverlay(onBack);
  const record = questRecord(progress, quest.id);
  const checkpoint = record.checkpoint;
  const finalTarget = resolveOutsideElement(quest.finalTargetId);
  const category = CATEGORY_MAP[finalTarget.category];
  const starters = quest.starterIds.map((id) => resolveOutsideElement(id)).filter(Boolean);
  const par = questMinimumSteps(quest);
  const act = checkpoint ? quest.acts[checkpoint.actIndex] : null;

  return createPortal(
    <div className="overlay challenge-intro-overlay quest-intro-overlay" role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <article
        className="challenge-intro-card quest-intro-card"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-intro-title"
        style={{ "--challenge-accent": quest.accent }}
      >
        <div className="challenge-intro-card__number">{quest.numeral}</div>
        <p className="overlay-kicker">炉外任务 · QUEST · 第{quest.numeral}则</p>
        <h2 id="quest-intro-title">{quest.title}</h2>
        <p className="challenge-intro-card__subtitle">{quest.subtitle}</p>
        <blockquote>{quest.quote}</blockquote>

        <div className="challenge-intro-grid">
          <div className="challenge-intro-copy">
            <p className="eyebrow">故事是这样开始的</p>
            <p className="challenge-intro-story">{quest.intro}</p>
            <div className="quest-intro-acts">
              {quest.acts.map((item, index) => (
                <div key={item.id} className={checkpoint && index < checkpoint.actIndex ? "is-done" : ""}>
                  <span>第{item.numeral}幕</span>
                  <b>{item.title}</b>
                  <em>{item.objective}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="challenge-intro-target">
            <p className="eyebrow">任务终点</p>
            <div className="challenge-intro-target__sprite">
              <span aria-hidden="true" />
              <Sprite element={finalTarget} size={90} />
            </div>
            <h3>{finalTarget.name}</h3>
            <div className="challenge-intro-target__chips">
              <span className="challenge-kind" data-new="true">任务限定</span>
              <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
            </div>
            <p>3 幕 · 4 个结局 · 2 个可选目标。没有余烬，没有步数上限，也不会失败。</p>
          </div>
        </div>

        <div className="challenge-intro-starters">
          <div className="challenge-intro-starters__head">
            <span className="eyebrow">任务专属起始要素 · {starters.length} 种</span>
            <span className="challenge-ember-count">✦ 无失败 · 无余烬 · 参考 Par {par} 步</span>
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
          只可使用本任务中的配方。幕与幕之间会要求你做出选择；选择不可撤销，并会改变第三幕的配方和结局。
          中途离开会从当前幕开头的检查点继续。已见结局与可选目标永久保存。
        </p>

        {checkpoint && act && (
          <p className="quest-checkpoint">
            检测到检查点：第{act.numeral}幕「{act.title}」开头。当前已见结局 {record.endings.length} / {quest.endings.length}。
          </p>
        )}

        <div className="challenge-intro-actions">
          {checkpoint ? (
            <>
              <button type="button" className="primary-button primary-button--wide" onClick={onStart} data-autofocus>
                从第{act.numeral}幕继续
              </button>
              <button type="button" className="text-button" onClick={onRestart}>
                从头重走
              </button>
              <button type="button" className="text-button" onClick={onBack}>
                回到任务目录
              </button>
            </>
          ) : (
            <>
              <button type="button" className="primary-button primary-button--wide" onClick={onStart} data-autofocus>
                走进这则任务
              </button>
              <button type="button" className="text-button" onClick={onBack}>
                回到任务目录
              </button>
            </>
          )}
        </div>
      </article>
    </div>,
    document.body
  );
}

export function QuestChoiceOverlay({ quest, choice, onChoose, onBack }) {
  const ref = useQuestOverlay(onBack);
  return createPortal(
    <div className="overlay quest-choice-overlay" role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <article
        className="quest-choice-card"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-choice-title"
        style={{ "--challenge-accent": quest.accent }}
      >
        <p className="overlay-kicker">幕间选择 · A CHOICE IS MADE</p>
        <h2 id="quest-choice-title">{choice.prompt}</h2>
        <p className="quest-choice-card__copy">{choice.description}</p>
        <div className="quest-choice-options">
          {choice.options.map((option, index) => {
            const unlock = option.unlockIds.map((id) => resolveOutsideElement(id)).filter(Boolean);
            return (
              <button
                key={option.id}
                type="button"
                className="quest-choice-option"
                onClick={() => onChoose(option.id)}
                data-autofocus={index === 0 ? "" : undefined}
              >
                <span className="quest-choice-option__index">{index + 1}</span>
                <b>{option.label}</b>
                <p>{option.description}</p>
                <span className="quest-choice-option__unlock">
                  解锁
                  {unlock.map((element) => (
                    <i key={element.id}>
                      <Sprite element={element} size={22} />
                      {element.name}
                    </i>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <p className="quest-choice-card__warning">选择一旦做出，不会撤销。没有上船、没有被打开的那一边，会在结局里继续等。</p>
      </article>
    </div>,
    document.body
  );
}

export function QuestResultOverlay({ quest, run, ending, progress, nextQuest, onRetry, onNext, onBack }) {
  const ref = useQuestOverlay(onBack);
  const record = questRecord(progress, quest.id);
  const optional = optionalProgress(quest, run);
  const finalTarget = resolveOutsideElement(quest.finalTargetId);
  const isTrueEnding = ending.id === quest.endings[0].id;

  return createPortal(
    <div className={`overlay challenge-result-overlay quest-result-overlay ${isTrueEnding ? "is-true-ending" : "is-win"}`} role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <article
        className="challenge-result-card quest-result-card"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-result-title"
        style={{ "--challenge-accent": quest.accent }}
      >
        <p className="overlay-kicker">{ending.kicker} · {isTrueEnding ? "TRUE ENDING" : "ENDING"}</p>
        <div className={`challenge-result-sigil ${isTrueEnding ? "is-true" : "is-win"}`}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <Sprite element={finalTarget} size={isTrueEnding ? 144 : 112} />
        </div>
        <h2 id="quest-result-title">{ending.title}</h2>
        <p className="quest-result-card__subtitle">「{quest.title}」第{quest.numeral}则任务</p>
        <p className="challenge-result-copy">{ending.outro}</p>

        <div className="challenge-result-stats">
          <div>
            <span>本次步数</span>
            <b>{run.stepsUsed} 步</b>
          </div>
          <div>
            <span>已见结局</span>
            <b>{record.endings.length} / {quest.endings.length}</b>
          </div>
          <div>
            <span>可选目标</span>
            <b>{optional.filter((item) => item.done).length} / {optional.length}</b>
          </div>
        </div>

        <div className="quest-result-optionals">
          {optional.map((item) => (
            <span key={item.id} className={item.done ? "is-done" : ""}>
              {item.done ? "✦" : "·"} {item.label}
              <em>{item.found} / {item.total}</em>
            </span>
          ))}
        </div>

        <div className="challenge-result-actions">
          <button type="button" className="primary-button" onClick={onRetry} data-autofocus>
            换一个选择重走
          </button>
          {nextQuest && (
            <button type="button" className="primary-button primary-button--ghost" onClick={onNext}>
              下一则任务
            </button>
          )}
          <button type="button" className="text-button" onClick={onBack}>
            回到任务目录
          </button>
        </div>
        <p className="challenge-result-foot">
          {isTrueEnding
            ? "真结局已记入任务图鉴。你和这则任务之间，已经没有没走过的路。"
            : `结局已记入任务图鉴。还有 ${quest.endings.length - record.endings.length} 个结局没有走到，也可以回头补完可选目标。`}
        </p>
      </article>
    </div>,
    document.body
  );
}

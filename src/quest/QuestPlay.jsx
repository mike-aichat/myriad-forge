import React, { useEffect, useMemo, useRef, useState } from "react";
import { CrucibleCanvas } from "../art/CrucibleCanvas.jsx";
import { resolveOutsideElement } from "../data/outside.js";
import { CATEGORY_MAP } from "../data/categories.js";
import { audio } from "../audio.js";
import { Sprite } from "../ui/Sprite.jsx";
import {
  chooseQuestOption,
  currentAct,
  findChoice,
  fuseQuest,
  optionalProgress,
  questActProgress,
  questMinimumSteps,
  resolveQuestEnding,
} from "./engine.js";
import { QuestChoiceOverlay } from "./QuestOverlays.jsx";

const EMPTY_LINES = [
  "什么也没有发生。两样东西礼貌地错开了。",
  "炉火眨了一下眼，没有接话。",
  "它们凑近看了看彼此，又分开了。",
  "炉底传来一声很轻的“不”。",
  "这一页暂时没有属于它们的句子。",
];

function QuestSlot({ index, element, onRemove, disabled }) {
  return (
    <div className={`challenge-slot ${element ? "is-filled" : ""}`}>
      <span className="challenge-slot__roman" aria-hidden="true">{index === 0 ? "I" : "II"}</span>
      {element ? (
        <>
          <button
            type="button"
            className="challenge-slot__remove"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`取出${element.name}`}
            title="取出"
          >
            ×
          </button>
          <div className="challenge-slot__body">
            <Sprite element={element} size={50} />
            <span>{element.name}</span>
          </div>
        </>
      ) : (
        <div className="challenge-slot__empty">
          <span aria-hidden="true">+</span>
          <i>置入要素</i>
        </div>
      )}
    </div>
  );
}

export function QuestPlay({ quest, initialRun, reducedMotion, onCheckpoint, onFinish, onBack }) {
  const [run, setRun] = useState(initialRun);
  const [selected, setSelected] = useState([]);
  const [isFusing, setIsFusing] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [message, setMessage] = useState({
    tone: "idle",
    text: "选两种要素放入熔炉。任务没有步数上限，错误组合不会失败。",
  });
  const [lastDiscovery, setLastDiscovery] = useState(null);

  const fusingRef = useRef(false);
  const fuseTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const fuseButtonRef = useRef(null);
  const logRef = useRef(null);
  const actIndexRef = useRef(run.actIndex);

  const act = currentAct(quest, run);
  const actProgress = useMemo(() => questActProgress(quest, run), [quest, run]);
  const optionals = useMemo(() => optionalProgress(quest, run), [quest, run]);
  const choice = run.pendingChoice ? findChoice(quest, run.pendingChoice) : null;
  const selectedElements = selected.map((id) => resolveOutsideElement(id)).filter(Boolean);
  const par = useMemo(() => questMinimumSteps(quest), [quest]);
  const starterSet = useMemo(() => new Set(quest.starterIds), [quest]);
  const optionalIds = useMemo(
    () => new Set(quest.optionalObjectives.flatMap((objective) => objective.targetIds)),
    [quest]
  );
  const trayElements = run.discovered
    .map((id) => resolveOutsideElement(id))
    .filter(Boolean)
    .map((element) => ({
      element,
      starter: starterSet.has(element.id),
      optional: optionalIds.has(element.id),
      unlockedByChoice: !starterSet.has(element.id) && !quest.recipes.some((recipe) => recipe.result === element.id),
    }));

  useEffect(() => {
    return () => {
      if (fuseTimerRef.current) window.clearTimeout(fuseTimerRef.current);
      if (resultTimerRef.current) window.clearTimeout(resultTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selected.length === 2 && run.status === "playing" && !run.pendingChoice && !isFusing) {
      fuseButtonRef.current?.focus();
    }
  }, [selected.length, run.status, run.pendingChoice, isFusing]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [run.beats.length]);

  useEffect(() => {
    if (actIndexRef.current !== run.actIndex) {
      actIndexRef.current = run.actIndex;
      setHintIndex(0);
      setSelected([]);
    }
  }, [run.actIndex]);

  const handleSelect = (id) => {
    if (isFusing || run.status !== "playing" || run.pendingChoice) return;
    const element = resolveOutsideElement(id);
    if (!element) return;
    if (selected.includes(id)) {
      audio.click();
      setSelected(selected.filter((item) => item !== id));
      setMessage({ tone: "idle", text: `把${element.name}放回了桌上。` });
      return;
    }
    if (selected.length >= 2) {
      audio.fail();
      setMessage({ tone: "fail", text: "炉里已经有两个要素了。先熔炼，或者取回一个。" });
      return;
    }
    audio.select();
    const next = [...selected, id];
    setSelected(next);
    setMessage({
      tone: "idle",
      text:
        next.length === 1
          ? `「${element.name}」已经就位。再选一样。`
          : `${resolveOutsideElement(next[0])?.name || "它"}和${element.name}就位。按下熔炼。`,
    });
  };

  const handleRemove = (index) => {
    if (isFusing) return;
    audio.click();
    setSelected(selected.filter((_, itemIndex) => itemIndex !== index));
    setMessage({ tone: "idle", text: "一个位置空了出来。" });
  };

  const handleFuse = () => {
    if (fusingRef.current || run.status !== "playing" || run.pendingChoice || selected.length !== 2) return;
    fusingRef.current = true;
    const [aId, bId] = selected;
    const outcome = fuseQuest(quest, run, aId, bId);
    const previousAct = run.actIndex;
    setRun(outcome.run);
    setIsFusing(true);
    audio.fuse();
    setMessage({ tone: "idle", text: "炉火正在翻动这一页……" });

    if (fuseTimerRef.current) window.clearTimeout(fuseTimerRef.current);
    fuseTimerRef.current = window.setTimeout(() => {
      setIsFusing(false);
      setSelected([]);
      fusingRef.current = false;

      if (!outcome.result) {
        audio.fail();
        setLastDiscovery(null);
        setMessage({
          tone: "idle",
          text: `${EMPTY_LINES[Math.floor(Math.random() * EMPTY_LINES.length)]}（任务没有步数上限，再试一次）`,
        });
        return;
      }

      if (outcome.isNew) {
        audio.discover();
        setLastDiscovery(outcome.result);
        setMessage({
          tone: "success",
          text: `「${outcome.result.name}」从炉底浮了上来，记下来了。`,
        });
      } else {
        audio.select();
        setLastDiscovery(null);
        setMessage({ tone: "idle", text: `又是「${outcome.result.name}」。这一行已经写过了。` });
      }

      if (outcome.run.actIndex > previousAct) {
        onCheckpoint(outcome.run);
        const nextAct = quest.acts[outcome.run.actIndex];
        if (nextAct) {
          setMessage({
            tone: "success",
            text: `第${nextAct.numeral}幕「${nextAct.title}」开始了。目标：${nextAct.objective}。`,
          });
        }
      }

      if (outcome.run.pendingChoice) {
        audio.chapter();
        setMessage({ tone: "idle", text: "炉火停了一下。有人在等你做决定。" });
      }

      if (outcome.ended) {
        resultTimerRef.current = window.setTimeout(() => {
          const ending = quest.endings.find((item) => item.id === (outcome.run.endingId || resolveQuestEnding(quest, outcome.run)));
          onFinish(outcome.run, ending);
        }, 780);
      }
    }, 560);
  };

  const handleChoose = (optionId) => {
    const result = chooseQuestOption(quest, run, run.pendingChoice, optionId);
    if (!result.run) return;
    setRun(result.run);
    setSelected([]);
    setLastDiscovery(null);
    onCheckpoint(result.run);
    audio.chapter();
    const nextAct = quest.acts[result.run.actIndex];
    setMessage({
      tone: "success",
      text: `${result.option?.outcome || "选择已经做出。"}${nextAct ? ` 第${nextAct.numeral}幕「${nextAct.title}」开始。` : ""}`,
    });
  };

  const handleClear = () => {
    if (isFusing) return;
    setSelected([]);
    setMessage({ tone: "idle", text: "熔炉清空了。" });
    audio.click();
  };

  const revealedHints = act.hints.slice(0, hintIndex);

  return (
    <main className="challenge-play quest-play">
      <section className="challenge-forge panel" aria-labelledby="quest-forge-title">
        <div className="challenge-play__head">
          <div>
            <p className="eyebrow">任务 · {quest.numeral} · 第{act.numeral}幕</p>
            <h2 id="quest-forge-title">{quest.title}</h2>
            <p>{quest.subtitle}</p>
          </div>
          <div className="challenge-ember-readout is-par quest-step-readout">
            <span>步数</span>
            <b>{run.stepsUsed}</b>
            <em>无上限</em>
            <span className="challenge-par-readout__par">参考 Par {par}</span>
          </div>
        </div>

        <ol className="quest-act-rail" aria-label="任务幕进度">
          {actProgress.map((item, index) => (
            <li key={item.id} className={`is-${item.state}`}>
              <span>{index + 1}</span>
              <div>
                <b>{item.title}</b>
                <em>{item.objective}</em>
              </div>
            </li>
          ))}
        </ol>

        <div className={`challenge-stage ${isFusing ? "is-fusing" : ""}`}>
          <CrucibleCanvas selectedCount={selectedElements.length} fusing={isFusing} reducedMotion={reducedMotion} />
          <div className="challenge-slots">
            <QuestSlot index={0} element={selectedElements[0]} onRemove={() => handleRemove(0)} disabled={isFusing} />
            <div className="challenge-slots__center" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>
            <QuestSlot index={1} element={selectedElements[1]} onRemove={() => handleRemove(1)} disabled={isFusing} />
          </div>
          <div className="challenge-fuse">
            <button
              ref={fuseButtonRef}
              type="button"
              className="fuse-button"
              onClick={handleFuse}
              disabled={selectedElements.length !== 2 || isFusing || run.status !== "playing" || Boolean(run.pendingChoice)}
            >
              <span className="fuse-button__spark" aria-hidden="true">✦</span>
              <span>熔炼</span>
              <span className="fuse-button__spark" aria-hidden="true">✦</span>
            </button>
            <span className="challenge-fuse__hint">
              {run.pendingChoice
                ? "先在右侧做出选择。"
                : selectedElements.length === 2
                  ? `${selectedElements[0].name} ＋ ${selectedElements[1].name}`
                  : "没有余烬，没有步数上限，错误组合不会失败。"}
            </span>
          </div>
          <button type="button" className="challenge-clear" onClick={handleClear} disabled={!selected.length || isFusing}>
            清空
          </button>
        </div>

        <div className="challenge-message" data-tone={message.tone} aria-live="polite">
          <span aria-hidden="true">✦</span>
          <p>{message.text}</p>
        </div>

        {lastDiscovery && (
          <div className="challenge-discovery" aria-live="polite">
            <Sprite element={lastDiscovery} size={40} />
            <div>
              <b>{lastDiscovery.name}</b>
              <p>{lastDiscovery.description}</p>
            </div>
          </div>
        )}

        <div className="challenge-tray">
          <div className="challenge-tray__head">
            <span className="eyebrow">炉中的要素 · {run.discovered.length} 种</span>
            <span>起始要素全部来自主图鉴之外，新要素会加入牌堆</span>
          </div>
          <div className="challenge-tray__grid quest-tray__grid">
            {trayElements.map(({ element, starter, optional, unlockedByChoice }) => {
              const selectedIndex = selected.indexOf(element.id);
              return (
                <button
                  type="button"
                  key={element.id}
                  className={`challenge-element ${selectedIndex >= 0 ? "is-selected" : ""} ${
                    lastDiscovery?.id === element.id ? "is-recent" : ""
                  } ${optional ? "is-optional" : ""}`}
                  onClick={() => handleSelect(element.id)}
                  disabled={isFusing || run.status !== "playing" || Boolean(run.pendingChoice)}
                  aria-label={`选择${element.name}放入任务熔炉`}
                  aria-pressed={selectedIndex >= 0}
                  title={element.description}
                >
                  <span className="challenge-element__kind">
                    {starter ? "始" : optional ? "支" : unlockedByChoice ? "选" : "新"}
                  </span>
                  {selectedIndex >= 0 && (
                    <span className="challenge-element__mark">{selectedIndex === 0 ? "I" : "II"}</span>
                  )}
                  <Sprite element={element} size={40} />
                  <span className="challenge-element__name">{element.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="challenge-story panel quest-story" aria-labelledby="quest-story-title">
        <div className="challenge-story__head">
          <p className="eyebrow">第{act.numeral}幕 · 当前目标</p>
          <h2 id="quest-story-title">{act.objective}</h2>
          <p>{act.story}</p>
        </div>

        <div className="challenge-target quest-target">
          <div className="challenge-target__sprite">
            <span aria-hidden="true" />
            <Sprite element={resolveOutsideElement(act.targetId)} size={78} />
          </div>
          <div className="challenge-target__copy">
            <span className="eyebrow">本幕造物</span>
            <b>{resolveOutsideElement(act.targetId)?.name}</b>
            <div>
              <span className="challenge-kind" data-new="true">任务限定</span>
              <span className="category-chip" style={{ "--cat": CATEGORY_MAP[resolveOutsideElement(act.targetId).category].color }}>
                {CATEGORY_MAP[resolveOutsideElement(act.targetId).category].name}
              </span>
            </div>
            <p>{resolveOutsideElement(act.targetId)?.description}</p>
          </div>
        </div>

        <div className="quest-optionals">
          <div className="quest-optionals__head">
            <span className="eyebrow">可选目标 · 不影响通关，只影响结局</span>
            <b>{optionals.filter((item) => item.done).length} / {optionals.length}</b>
          </div>
          {optionals.map((item) => (
            <div key={item.id} className={`quest-optional ${item.done ? "is-done" : ""}`}>
              <span aria-hidden="true">{item.done ? "✦" : "·"}</span>
              <div>
                <b>{item.label}</b>
                <p>{item.description}</p>
                <em>{item.found} / {item.total}</em>
              </div>
            </div>
          ))}
        </div>

        {run.selectedOptions.length > 0 && (
          <div className="quest-decisions">
            <span className="eyebrow">已经做出的选择</span>
            {run.selectedOptions.map((item) => (
              <span key={item.choiceId} className="quest-decision">
                <b>{item.label}</b>
                <em>不可撤销</em>
              </span>
            ))}
          </div>
        )}

        <div className="challenge-hints quest-hints">
          <div className="challenge-hints__head">
            <span className="eyebrow">本幕提示 · {hintIndex} / {act.hints.length}</span>
            <button
              type="button"
              className="challenge-hints__button"
              onClick={() => {
                if (hintIndex >= act.hints.length) return;
                audio.select();
                setHintIndex((value) => value + 1);
              }}
              disabled={hintIndex >= act.hints.length}
            >
              {hintIndex === 0 ? "翻一点提示" : hintIndex >= act.hints.length ? "提示用完了" : "再翻一点"}
            </button>
          </div>
          {hintIndex === 0 ? (
            <p className="challenge-hints__empty">卡住的时候，可以让炉边老话再说一句。提示不会计入步数。</p>
          ) : (
            <ol className="challenge-hints__list">
              {revealedHints.map((hint) => <li key={hint}>{hint}</li>)}
            </ol>
          )}
        </div>

        <details className="challenge-opening">
          <summary>重读这则任务的开头</summary>
          <p>{quest.intro}</p>
        </details>

        <div className="challenge-log quest-log" ref={logRef} aria-live="polite">
          <div className="challenge-log__opening">
            <span aria-hidden="true">“</span>
            <p>{quest.opening}</p>
          </div>
          {run.beats.map((beat, index) => {
            const element = resolveOutsideElement(beat.id);
            return (
              <div className="challenge-beat" key={`${beat.id}-${index}`}>
                <div className="challenge-beat__icon">{element && <Sprite element={element} size={28} />}</div>
                <div>
                  {element && <b>{element.name}</b>}
                  <p>{beat.text}</p>
                </div>
              </div>
            );
          })}
          {!run.beats.length && <p className="challenge-log__empty">每造出一个新要素，这个故事就会多写一行。</p>}
        </div>

        <button type="button" className="text-button challenge-leave" onClick={onBack}>
          离开这则任务 <span aria-hidden="true">→</span>
        </button>
      </aside>

      {choice && (
        <QuestChoiceOverlay
          quest={quest}
          choice={choice}
          onChoose={handleChoose}
          onBack={() => {}}
        />
      )}
    </main>
  );
}

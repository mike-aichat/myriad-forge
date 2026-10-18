import React, { useEffect, useMemo, useRef, useState } from "react";
import { CrucibleCanvas } from "../art/CrucibleCanvas.jsx";
import { CATEGORY_MAP } from "../data/categories.js";
import { audio } from "../audio.js";
import { Sprite } from "../ui/Sprite.jsx";
import {
  attemptsLeft,
  createRun,
  fuseRun,
  isMainElement,
  isPuzzle,
  minimumSteps,
  resolveChallengeElement,
} from "./engine.js";

const EMBER_EMPTY_LINES = [
  "炉火没有回应。余烬少了一枚。",
  "两种存在礼貌地错开了。",
  "有东西一闪而过，但没来得及成为故事。",
  "灰烬翻了个身，继续睡。",
];

const PUZZLE_EMPTY_LINES = [
  "什么也没有发生。两样东西礼貌地错开了。",
  "炉火眨了一下眼，没有接话。",
  "它们凑近看了看彼此，又分开了。",
  "炉底传来一声很轻的“不”。",
];

function ChallengeSlot({ index, element, onRemove, disabled }) {
  return (
    <div className={`challenge-slot ${element ? "is-filled" : ""}`}>
      <span className="challenge-slot__roman" aria-hidden="true">
        {index === 0 ? "I" : "II"}
      </span>
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

function EmberPips({ total, remaining }) {
  return (
    <span className="ember-pips" aria-label={`剩余 ${remaining} 次熔炼，共 ${total} 次`}>
      {Array.from({ length: total }).map((_, index) => (
        <i key={index} className={index < remaining ? "is-lit" : ""} />
      ))}
    </span>
  );
}

export function ChallengePlay({ challenge, reducedMotion, onWin, onLose, onBack }) {
  const target = useMemo(() => resolveChallengeElement(challenge.targetId), [challenge]);
  const targetCategory = CATEGORY_MAP[target.category];
  const targetIsNew = !isMainElement(challenge.targetId);
  const puzzle = isPuzzle(challenge);
  const par = useMemo(() => minimumSteps(challenge), [challenge]);
  const [run, setRun] = useState(() => createRun(challenge));
  const [selected, setSelected] = useState([]);
  const [isFusing, setIsFusing] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [message, setMessage] = useState({
    tone: "idle",
    text: puzzle
      ? "选两种要素放入熔炉。没有步数限制，错误组合不会失败。"
      : "选两种要素放入熔炉。每次熔炼都会烧掉一枚余烬。",
  });
  const [lastDiscovery, setLastDiscovery] = useState(null);

  const fusingRef = useRef(false);
  const fuseTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const fuseButtonRef = useRef(null);
  const logRef = useRef(null);

  const selectedElements = selected.map((id) => resolveChallengeElement(id)).filter(Boolean);
  const remaining = attemptsLeft(challenge, run);
  const trayElements = run.discovered
    .map((id) => resolveChallengeElement(id))
    .filter(Boolean)
    .map((element, index) => ({ element, starter: index < challenge.starterIds.length }));

  useEffect(() => {
    return () => {
      if (fuseTimerRef.current) window.clearTimeout(fuseTimerRef.current);
      if (resultTimerRef.current) window.clearTimeout(resultTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selected.length === 2 && run.status === "playing" && !isFusing) {
      fuseButtonRef.current?.focus();
    }
  }, [selected.length, run.status, isFusing]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [run.beats.length]);

  const handleSelect = (id) => {
    if (isFusing || run.status !== "playing") return;
    const element = resolveChallengeElement(id);
    if (!element) return;
    if (selected.includes(id)) {
      audio.click();
      setSelected(selected.filter((item) => item !== id));
      setMessage({
        tone: "idle",
        text: puzzle ? `把${element.name}放回了桌上。` : `把${element.name}放回了余烬里。`,
      });
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
          : `${selectedElements[0]?.name || "它"}和${element.name}就位。按下熔炼。`,
    });
  };

  const handleRemove = (index) => {
    if (isFusing) return;
    audio.click();
    setSelected(selected.filter((_, itemIndex) => itemIndex !== index));
    setMessage({ tone: "idle", text: "一个位置空了出来。" });
  };

  const handleFuse = () => {
    if (fusingRef.current || run.status !== "playing" || selected.length !== 2) return;
    fusingRef.current = true;
    const [aId, bId] = selected;
    const a = resolveChallengeElement(aId);
    const b = resolveChallengeElement(bId);
    const outcome = fuseRun(challenge, run, aId, bId);
    setRun(outcome.run);
    setIsFusing(true);
    audio.fuse();
    setMessage({ tone: "idle", text: "余烬正在翻动这一页……" });

    if (fuseTimerRef.current) window.clearTimeout(fuseTimerRef.current);
    fuseTimerRef.current = window.setTimeout(() => {
      setIsFusing(false);
      setSelected([]);
      fusingRef.current = false;

      if (!outcome.result) {
        audio.fail();
        setLastDiscovery(null);
        const emptyLines = puzzle ? PUZZLE_EMPTY_LINES : EMBER_EMPTY_LINES;
        const emptyLine = emptyLines[Math.floor(Math.random() * emptyLines.length)];
        setMessage({
          tone: puzzle ? "idle" : "fail",
          text: puzzle ? `${emptyLine}（再试一次）` : `${emptyLine}（余烬 -1）`,
        });
        if (outcome.lost) {
          setMessage({ tone: "fail", text: "余烬用完了。目标还没有出现。" });
          resultTimerRef.current = window.setTimeout(() => onLose(outcome.run.stepsUsed), 650);
        }
        return;
      }

      if (outcome.isNew) {
        audio.discover();
        setLastDiscovery(outcome.result);
        setMessage({
          tone: "success",
          text: `「${outcome.result.name}」从炉底浮了上来。${puzzle ? "谜面亮了一格。" : "故事多了一行。"}`,
        });
      } else {
        audio.select();
        setLastDiscovery(null);
        setMessage({
          tone: "idle",
          text: `又是「${outcome.result.name}」。这一行已经写过了。`,
        });
      }

      if (outcome.won) {
        resultTimerRef.current = window.setTimeout(() => onWin(outcome.run.stepsUsed), 700);
      } else if (outcome.lost) {
        setMessage({ tone: "fail", text: "余烬刚好用完。还差最后一点。" });
        resultTimerRef.current = window.setTimeout(() => onLose(outcome.run.stepsUsed), 700);
      }
    }, 560);
  };

  const targetKind = targetIsNew ? (puzzle ? "谜题限定" : "试炼限定") : "主线要素";

  return (
    <main className="challenge-play">
      <section className="challenge-forge panel" aria-labelledby="challenge-forge-title">
        <div className="challenge-play__head">
          <div>
            <p className="eyebrow">试炼 · {challenge.numeral}</p>
            <h2 id="challenge-forge-title">{challenge.title}</h2>
            <p>{challenge.subtitle}</p>
          </div>
          <div className={`challenge-ember-readout ${puzzle ? "is-par" : ""}`}>
            <span>{puzzle ? "步数" : "余烬"}</span>
            <b>{puzzle ? run.stepsUsed : remaining}</b>
            <em>{puzzle ? "无限制" : `/ ${challenge.stepLimit}`}</em>
            {puzzle ? (
              <span className="challenge-par-readout__par">Par {par}</span>
            ) : (
              <EmberPips total={challenge.stepLimit} remaining={remaining} />
            )}
          </div>
        </div>

        <div className={`challenge-stage ${isFusing ? "is-fusing" : ""}`}>
          <CrucibleCanvas
            selectedCount={selectedElements.length}
            fusing={isFusing}
            reducedMotion={reducedMotion}
          />
          <div className="challenge-slots">
            <ChallengeSlot
              index={0}
              element={selectedElements[0]}
              onRemove={() => handleRemove(0)}
              disabled={isFusing}
            />
            <div className="challenge-slots__center" aria-hidden="true">
              <span />
              <i />
              <span />
            </div>
            <ChallengeSlot
              index={1}
              element={selectedElements[1]}
              onRemove={() => handleRemove(1)}
              disabled={isFusing}
            />
          </div>
          <div className="challenge-fuse">
            <button
              ref={fuseButtonRef}
              type="button"
              className="fuse-button"
              onClick={handleFuse}
              disabled={selectedElements.length !== 2 || isFusing || run.status !== "playing"}
            >
              <span className="fuse-button__spark" aria-hidden="true">✦</span>
              <span>熔炼</span>
              <span className="fuse-button__spark" aria-hidden="true">✦</span>
            </button>
            <span className="challenge-fuse__hint">
              {selectedElements.length === 2
                ? `${selectedElements[0].name} ＋ ${selectedElements[1].name}`
                : puzzle
                  ? "没有步数限制。试错不会失败。"
                  : "每一次熔炼都会烧掉一枚余烬"}
            </span>
          </div>
          <button
            type="button"
            className="challenge-clear"
            onClick={() => {
              if (isFusing) return;
              setSelected([]);
              setMessage({ tone: "idle", text: "熔炉清空了。" });
              audio.click();
            }}
            disabled={!selected.length || isFusing}
          >
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
            <span>
              {puzzle
                ? "起始要素全部来自主图鉴之外，新要素会加入牌堆"
                : "起始要素不可替换，新要素会加入余烬"}
            </span>
          </div>
          <div className="challenge-tray__grid">
            {trayElements.map(({ element, starter }) => {
              const selectedIndex = selected.indexOf(element.id);
              return (
                <button
                  type="button"
                  key={element.id}
                  className={`challenge-element ${selectedIndex >= 0 ? "is-selected" : ""} ${
                    lastDiscovery?.id === element.id ? "is-recent" : ""
                  }`}
                  onClick={() => handleSelect(element.id)}
                  disabled={isFusing || run.status !== "playing"}
                  aria-label={`选择${element.name}放入试炼熔炉`}
                  aria-pressed={selectedIndex >= 0}
                  title={element.description}
                >
                  <span className="challenge-element__kind">{starter ? "始" : "新"}</span>
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

      <aside className="challenge-story panel" aria-labelledby="challenge-story-title">
        <div className="challenge-story__head">
          <p className="eyebrow">这一页的故事</p>
          <h2 id="challenge-story-title">目标：{target.name}</h2>
          <p>{challenge.objective}</p>
        </div>

        <div className="challenge-target">
          <div className="challenge-target__sprite">
            <span aria-hidden="true" />
            <Sprite element={target} size={82} />
          </div>
          <div className="challenge-target__copy">
            <span className="eyebrow">最终要素</span>
            <b>{target.name}</b>
            <div>
              <span className="challenge-kind" data-new={targetIsNew ? "true" : "false"}>{targetKind}</span>
              <span className="category-chip" style={{ "--cat": targetCategory.color }}>
                {targetCategory.name}
              </span>
            </div>
            <p>
              {targetIsNew
                ? `主图鉴里没有它。只有这${puzzle ? "页谜题" : "则试炼"}会记得。`
                : "它也在主炉的图鉴里，但这一次，只能用手边的余烬把它做出来。"}
            </p>
          </div>
        </div>

        <div className="challenge-constraints">
          <div>
            <span>起始要素</span>
            <b>{challenge.starterIds.length} 种</b>
          </div>
          <div>
            <span>{puzzle ? "步数" : "余烬"}</span>
            <b>{puzzle ? "无限制" : `${remaining} / ${challenge.stepLimit}`}</b>
          </div>
          <div>
            <span>{puzzle ? "Par" : "熔炼配方"}</span>
            <b>{puzzle ? `${par} 步` : "仅限本页"}</b>
          </div>
        </div>

        <p className="challenge-clue">
          <span>炉边老话</span>
          {challenge.clue}
        </p>

        {puzzle && challenge.hints?.length > 0 && (
          <div className="challenge-hints">
            <div className="challenge-hints__head">
              <span className="eyebrow">提示 · {hintIndex} / {challenge.hints.length}</span>
              <button
                type="button"
                className="challenge-hints__button"
                onClick={() => {
                  if (hintIndex >= challenge.hints.length) return;
                  audio.select();
                  setHintIndex((value) => value + 1);
                }}
                disabled={hintIndex >= challenge.hints.length}
              >
                {hintIndex === 0
                  ? "翻一点提示"
                  : hintIndex >= challenge.hints.length
                    ? "提示用完了"
                    : "再翻一点"}
              </button>
            </div>
            {hintIndex === 0 ? (
              <p className="challenge-hints__empty">
                卡住的时候，可以让炉边老话再说一句。提示不会计入步数。
              </p>
            ) : (
              <ol className="challenge-hints__list">
                {challenge.hints.slice(0, hintIndex).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ol>
            )}
          </div>
        )}

        <details className="challenge-opening">
          <summary>重读这一页的开头</summary>
          <p>{challenge.intro}</p>
        </details>

        <div className="challenge-log" ref={logRef} aria-live="polite">
          <div className="challenge-log__opening">
            <span aria-hidden="true">“</span>
            <p>{challenge.opening}</p>
          </div>
          {run.beats.map((beat, index) => {
            const element = resolveChallengeElement(beat.id);
            return (
              <div className="challenge-beat" key={`${beat.id}-${index}`}>
                <div className="challenge-beat__icon">
                  {element && <Sprite element={element} size={28} />}
                </div>
                <div>
                  {element && <b>{element.name}</b>}
                  <p>{beat.text}</p>
                </div>
              </div>
            );
          })}
          {!run.beats.length && (
            <p className="challenge-log__empty">每造出一个新要素，这个故事就会多写一行。</p>
          )}
        </div>

        <button type="button" className="text-button challenge-leave" onClick={onBack}>
          {puzzle ? "离开这页谜题" : "离开这次试炼"} <span aria-hidden="true">→</span>
        </button>
      </aside>
    </main>
  );
}

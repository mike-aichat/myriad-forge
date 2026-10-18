import React, { useMemo } from "react";
import { ELEMENT_BY_ID } from "../game/recipes.js";
import { chapterProgress } from "../game/progress.js";
import { Sprite } from "./Sprite.jsx";
import { getObjectiveHint } from "./objectiveHint.js";

export function Journal({
  chapter,
  state,
  onOpenStory,
  onOpenElement,
  allComplete,
  stats,
}) {
  const discoveredSet = useMemo(() => new Set(state.discovered), [state.discovered]);
  const progress = chapterProgress(state, chapter);
  const completed = state.completedChapters.includes(chapter.id);
  const unlockElements = (chapter.reward?.unlock || [])
    .map((id) => ELEMENT_BY_ID.get(id))
    .filter(Boolean);

  if (allComplete) {
    return (
      <aside className="journal panel journal--complete" aria-labelledby="journal-title">
        <div className="panel__topline">
          <div>
            <p className="eyebrow">创世手记</p>
            <h2 id="journal-title">手记完成</h2>
          </div>
          <span className="journal-page-mark">终</span>
        </div>
        <div className="journal-seal" aria-hidden="true">
          <span>✦</span>
        </div>
        <p className="journal-complete-title">全部要素已收录。</p>
        <p className="journal-intro">
          七页手记、{stats.discovered} 个要素，以及许多次没有结果的熔炼。进度已自动保存，你可以继续合成。
        </p>
        <div className="journal-complete-stats">
          <div>
            <b>{stats.fusions}</b>
            <span>次熔炼</span>
          </div>
          <div>
            <b>{stats.chapters}</b>
            <span>页手记</span>
          </div>
          <div>
            <b>{stats.rate}%</b>
            <span>成功率</span>
          </div>
        </div>
        <button type="button" className="text-button" onClick={onOpenStory}>
          回看全部手记 <span aria-hidden="true">→</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="journal panel" aria-labelledby="journal-title">
      <div className="panel__topline">
        <div>
          <p className="eyebrow">创世手记</p>
          <h2 id="journal-title">{chapter.order === 0 ? "序章" : `第${chapter.numeral}页`}</h2>
        </div>
        <span className="journal-page-mark">{chapter.numeral}</span>
      </div>

      <div className="journal-heading">
        <p className="journal-kicker">
          {completed ? "已记入书页" : "正在书写"} · {progress.done}/{progress.total}
        </p>
        <h3>{chapter.title}</h3>
        <p className="journal-subtitle">{chapter.subtitle}</p>
      </div>

      <div className="chapter-track" aria-hidden="true">
        {chapter.objectives.map((objective, index) => (
          <span
            key={objective.target}
            className={state.discovered.includes(objective.target) ? "is-done" : ""}
            style={{ "--track-index": index }}
          />
        ))}
      </div>

      <p className="journal-intro">{chapter.intro}</p>

      <ol className="journal-tasks">
        {chapter.objectives.map((objective, index) => {
          const element = ELEMENT_BY_ID.get(objective.target);
          const done = state.discovered.includes(objective.target);
          const hint = getObjectiveHint(objective.target, discoveredSet);
          return (
            <li key={objective.target} className={done ? "is-done" : ""}>
              <span className="task-index" aria-hidden="true">
                {done ? "◆" : String(index + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="task-sprite"
                onClick={() => onOpenElement?.(element)}
                disabled={!done}
                title={done ? `查看${element.name}` : "尚未发现"}
              >
                <Sprite element={element} size={30} silhouette={!done} alt={done ? element.name : "未发现"} />
              </button>
              <div className="task-copy">
                <span>{objective.prompt}</span>
                <b>{done ? element.name : "？？？"}</b>
              </div>
              <span className={`task-state is-${hint.kind}`} title={hint.title}>
                {hint.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="journal-reward">
        <div className="journal-reward__copy">
          <span className="eyebrow">本页奖励</span>
          <div className="journal-reward__items">
            {chapter.reward?.insight > 0 && <span>✦ 灵光 +{chapter.reward.insight}</span>}
            {unlockElements.map((element) => (
              <span key={element.id} className="reward-unlock">
                <Sprite element={element} size={20} />
                {element.name}
              </span>
            ))}
            {!chapter.reward?.insight && !unlockElements.length && <span>一段被记住的话</span>}
          </div>
        </div>
        <span className="journal-reward__seal" aria-hidden="true">记</span>
      </div>

      <button type="button" className="text-button" onClick={onOpenStory}>
        翻阅全部手记 <span aria-hidden="true">→</span>
      </button>
    </aside>
  );
}

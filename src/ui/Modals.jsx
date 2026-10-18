import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHAPTERS } from "../data/chapters.js";
import { CATEGORY_MAP } from "../data/categories.js";
import {
  ELEMENT_BY_ID,
  ELEMENT_LEVEL,
  getResultRecipes,
  isEndgame,
} from "../game/recipes.js";
import { getElementUseStatus } from "../game/recipeStatus.js";
import {
  chapterIsUnlocked,
  chapterProgress,
  currentChapter,
  stats as getStats,
} from "../game/progress.js";
import { Sprite } from "./Sprite.jsx";
import { getObjectiveHint } from "./objectiveHint.js";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, kicker, title, onClose, children, className = "", size = "normal" }) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    document.body.classList.add("is-locked");
    const timer = window.setTimeout(() => {
      const target =
        panelRef.current?.querySelector("[data-autofocus]") ||
        panelRef.current?.querySelector(FOCUSABLE) ||
        panelRef.current;
      target?.focus?.();
    }, 40);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)];
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
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={panelRef}
      >
        <header className="modal-head">
          <div>
            {kicker && <p className="eyebrow">{kicker}</p>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭面板">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function ElementDetailModal({ element, state, selected, onAdd, onClose }) {
  if (!element) return null;
  const category = CATEGORY_MAP[element.category];
  const level = ELEMENT_LEVEL.get(element.id) ?? 0;
  const recipes = getResultRecipes(element.id);
  const found = state.discovered.includes(element.id);
  const useStatus = getElementUseStatus(state, element);
  const orderIndex = state.order.indexOf(element.id);
  const endgame = isEndgame(element.id);
  const inSlots = selected.includes(element.id);
  const full = selected.length >= 2;

  return (
    <Modal
      open
      kicker={endgame ? "终焉之作" : "要素档案"}
      title={element.name}
      onClose={onClose}
      className={`detail-modal ${endgame ? "is-endgame" : ""}`}
    >
      <div className="detail-hero">
        <div className="detail-sprite">
          <span className="detail-sprite__ring" aria-hidden="true" />
          <Sprite element={element} size={116} alt={element.name} />
        </div>
        <div className="detail-hero__copy">
          <div className="detail-tags">
            <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
            <span
              className="quiet-chip"
              title="熔炼等级：源初与馈赠为 Lv0，合成品为材料中较高等级 + 1"
            >
              Lv{level}
            </span>
            {endgame && <span className="special-chip">终局要素</span>}
            {found && <span className="quiet-chip">第 {orderIndex + 1} 个发现</span>}
            {useStatus.kind === "idle" && <span className="quiet-chip">当前无新结果</span>}
            {useStatus.kind === "exhausted" && <span className="quiet-chip">已无新结果</span>}
          </div>
          <p className="detail-description">{element.description}</p>
          <p className="detail-note">{category.note}</p>
        </div>
      </div>

      <div className="detail-grid">
        <section className="detail-section">
          <h3>它从何而来</h3>
          {recipes.length ? (
            <div className="recipe-list">
              {recipes.map((recipe, index) => (
                <div className="recipe-row" key={`${recipe[0]}-${recipe[1]}-${index}`}>
                  {recipe.map((id, ingredientIndex) => {
                    const ingredient = ELEMENT_BY_ID.get(id);
                    return (
                      <React.Fragment key={id}>
                        {ingredientIndex > 0 && <span className="recipe-plus">＋</span>}
                        <span className="ingredient-chip">
                          <Sprite element={ingredient} size={26} />
                          {ingredient.name}
                        </span>
                      </React.Fragment>
                    );
                  })}
                  <span className="recipe-arrow" aria-hidden="true">→</span>
                  <span className="recipe-result">{element.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="detail-muted">它是源初或馈赠要素，没有配方。</p>
          )}
        </section>
        <section className="detail-section detail-section--aside">
          <div className="detail-fact">
            <b>{useStatus.uses}</b>
            <span>条已知配方会用到它</span>
          </div>
          <p className="detail-use-status" data-kind={useStatus.kind}>
            {useStatus.kind === "active" &&
              `当前可与已发现要素合成 ${useStatus.currentResults} 个新要素；还有 ${useStatus.remainingResults} 个结果未发现。`}
            {useStatus.kind === "idle" &&
              `当前没有已发现的搭档能造出新要素；还有 ${useStatus.remainingResults} 个结果未发现。`}
            {useStatus.kind === "exhausted" &&
              (useStatus.uses ? "会用到它的配方结果都已发现。" : "没有配方会用到它。")}
          </p>
          {endgame && (
            <p className="detail-muted">
              它需要一条至少六层深的熔炼链，才会从炉底浮上来。
            </p>
          )}
        </section>
      </div>

      <footer className="modal-actions">
        <button
          type="button"
          className="primary-button"
          disabled={inSlots || full}
          onClick={() => onAdd(element.id)}
        >
          {inSlots ? "已在炉中" : full ? "熔炉已满" : "投入熔炉"}
        </button>
        <button type="button" className="text-button" onClick={onClose}>
          合上档案
        </button>
      </footer>
    </Modal>
  );
}

export function StoryModal({ state, onClose, onOpenElement }) {
  const active = currentChapter(state);
  const [selectedId, setSelectedId] = useState(active.id);
  const selected = CHAPTERS.find((chapter) => chapter.id === selectedId) || active;
  const progress = chapterProgress(state, selected);
  const completed = state.completedChapters.includes(selected.id);
  const unlocked = chapterIsUnlocked(state, selected);
  const stats = getStats(state);
  const discoveredSet = useMemo(() => new Set(state.discovered), [state.discovered]);

  return (
    <Modal
      open
      kicker="创世手记 · 全七页"
      title="世界是怎样被写下的"
      onClose={onClose}
      size="wide"
      className="story-modal"
    >
      <div className="story-layout">
        <nav className="story-nav" aria-label="章节列表">
          <div className="story-nav__summary">
            <span>已合上</span>
            <b>{stats.chapters} / {stats.totalChapters}</b>
          </div>
          {CHAPTERS.map((chapter) => {
            const isDone = state.completedChapters.includes(chapter.id);
            const isCurrent = chapter.id === active.id;
            const isUnlocked = chapterIsUnlocked(state, chapter);
            return (
              <button
                key={chapter.id}
                type="button"
                className={`story-nav__item ${chapter.id === selected.id ? "is-active" : ""} ${
                  isDone ? "is-done" : ""
                } ${isUnlocked ? "" : "is-locked"}`}
                onClick={() => setSelectedId(chapter.id)}
              >
                <span className="story-nav__numeral">{chapter.numeral}</span>
                <span className="story-nav__label">
                  <b>{chapter.title}</b>
                  <em>
                    {isDone ? "已写完" : isCurrent ? "正在书写" : isUnlocked ? "待书写" : "尚未解锁"}
                  </em>
                </span>
                <span className="story-nav__state" aria-hidden="true">
                  {isDone ? "◆" : isCurrent ? "◈" : "·"}
                </span>
              </button>
            );
          })}
        </nav>

        <article className="story-page">
          <div className="story-page__head">
            <span className="story-page__numeral">{selected.numeral}</span>
            <div>
              <p className="eyebrow">
                {completed ? "这一页已经写完" : unlocked ? "墨迹未干" : "这一页还是空白"}
              </p>
              <h3>{selected.title}</h3>
              <p>{selected.subtitle}</p>
            </div>
          </div>

          {!unlocked ? (
            <div className="story-locked">
              <span aria-hidden="true">◇</span>
              <p>这一页要等前面的故事写完，才会显字。先去完成当前的手记吧。</p>
            </div>
          ) : (
            <>
              <p className="story-copy">{selected.intro}</p>
              {completed && <p className="story-outro">{selected.outro}</p>}

              <div className="story-objectives">
                <div className="story-objectives__head">
                  <span className="eyebrow">本页需要写下</span>
                  <span>{progress.done} / {progress.total}</span>
                </div>
                {selected.objectives.map((objective, index) => {
                  const element = ELEMENT_BY_ID.get(objective.target);
                  const done = state.discovered.includes(objective.target);
                  const hint = getObjectiveHint(objective.target, discoveredSet);
                  return (
                    <div className={`story-objective ${done ? "is-done" : ""}`} key={objective.target}>
                      <span className="story-objective__index">{done ? "◆" : String(index + 1).padStart(2, "0")}</span>
                      <button
                        type="button"
                        className="story-objective__sprite"
                        disabled={!done}
                        onClick={() => onOpenElement(element)}
                        title={done ? "查看要素" : "尚未发现"}
                      >
                        <Sprite element={element} size={32} silhouette={!done} alt={done ? element.name : "未发现"} />
                      </button>
                      <div>
                        <p>{objective.prompt}</p>
                        <span className="story-objective__meta">
                          <span>{done ? element.name : "？？？"}</span>
                          {!done && (
                            <em className={`story-objective__hint is-${hint.kind}`} title={hint.title}>
                              {hint.label}
                            </em>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="story-reward">
                <span className="eyebrow">写完此页</span>
                <div>
                  {selected.reward?.insight > 0 && <span>✦ 灵光 +{selected.reward.insight}</span>}
                  {(selected.reward?.unlock || []).map((id) => {
                    const element = ELEMENT_BY_ID.get(id);
                    return (
                      <span key={id} className="reward-unlock">
                        <Sprite element={element} size={22} /> 解锁 {element.name}
                      </span>
                    );
                  })}
                  {!selected.reward?.insight && !(selected.reward?.unlock || []).length && (
                    <span>一个结局</span>
                  )}
                </div>
              </div>
            </>
          )}
        </article>
      </div>
    </Modal>
  );
}

export function HelpModal({ state, sound, onToggleSound, onClose, onReset }) {
  const [armed, setArmed] = useState(false);
  const stats = getStats(state);
  return (
    <Modal open kicker="指南" title="玩法与规则" onClose={onClose} className="help-modal">
      <div className="help-grid">
        <section>
          <h3>怎么玩</h3>
          <ol className="help-list">
            <li>从要素库点选两种要素，把它们放进熔炉。</li>
            <li>按下「熔炼」或 Enter。成功会永久收录新要素；失败不会损失任何东西。</li>
            <li>每个要素都有一段描述。小写的 i 可以打开它的档案。</li>
            <li>要素也分等级：源初和馈赠是 Lv0，合成品的等级取两种材料中较高的等级再加一。</li>
            <li>右侧「创世手记」会给出目标。写满当前页，就会解锁馈赠和新的故事。</li>
            <li>卡住时点要素库标题旁的「灵光」，或按 R。它会先凑当前手记的目标；没有目标可合时，先挑等级最低的新要素，等级一样就选材料等级和最低的组合。炉里只放了一个要素时，会先给这个要素找搭档。</li>
          </ol>
        </section>
        <section>
          <h3>快捷键</h3>
          <dl className="shortcut-list">
            <div><dt><kbd>Enter</kbd></dt><dd>熔炼已选好的两种要素</dd></div>
            <div><dt><kbd>/</kbd></dt><dd>聚焦要素搜索</dd></div>
            <div><dt><kbd>R</kbd></dt><dd>灵光：随机熔炼一对能产出新要素的组合</dd></div>
            <div><dt><kbd>M</kbd></dt><dd>开关声音</dd></div>
            <div><dt><kbd>Esc</kbd></dt><dd>关闭当前面板或取出要素</dd></div>
          </dl>
        </section>
      </div>

      <section className="help-about">
        <h3>关于本作</h3>
        <p>
          {stats.total} 个要素、{stats.chapters} / {stats.totalChapters} 页手记已经写下。
          所有要素图案与音效均为本作原创。
        </p>
        <p>
          主炉之外的故事都在顶栏「试炼」里：谜题、任务、燃尽故事和失物招领博物馆。
        </p>
        <p className="help-credit">
          玩法参考 Little Alchemy 与 Doodle God。字体为方舟像素字体（SIL OFL 1.1）。
        </p>
        <div className="help-sound-row">
          <span>声音</span>
          <button type="button" className={`small-toggle ${sound ? "is-on" : ""}`} onClick={onToggleSound}>
            {sound ? "已打开" : "已关闭"}
          </button>
        </div>
      </section>

      <section className="danger-zone">
        <div>
          <h3>重置进度</h3>
          <p>清空图鉴、手记和所有记录，回到四种源初要素。</p>
        </div>
        <button
          type="button"
          className={`danger-button ${armed ? "is-armed" : ""}`}
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            onReset();
          }}
        >
          {armed ? "再按一次，确认清空" : "重置全部进度"}
        </button>
      </section>

      <div className="modal-actions">
        <button type="button" className="text-button" onClick={onClose}>
          合上指南
        </button>
        <span className="help-version">万象熔炉 · v1.0</span>
      </div>
    </Modal>
  );
}

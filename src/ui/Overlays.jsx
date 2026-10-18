import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_MAP } from "../data/categories.js";
import { ELEMENT_BY_ID } from "../game/recipes.js";
import { Sprite } from "./Sprite.jsx";

function useOverlayFocus(onClose, autoFocus = true) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement;
    document.body.classList.add("is-locked");
    if (autoFocus) {
      const timer = window.setTimeout(() => {
        const target = ref.current?.querySelector("[data-autofocus]") || ref.current;
        target?.focus?.();
      }, 50);
      return () => {
        window.clearTimeout(timer);
        document.body.classList.remove("is-locked");
        previous?.focus?.();
      };
    }
    return () => {
      document.body.classList.remove("is-locked");
      previous?.focus?.();
    };
  }, [autoFocus]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") closeRef.current?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return ref;
}

export function DiscoveryOverlay({ overlay, onClose, discoveredCount }) {
  const ref = useOverlayFocus(onClose);
  const { element, recipeNames = [], endgame = false, milestone = false } = overlay;
  const category = CATEGORY_MAP[element.category];
  return createPortal(
    <div className={`overlay discovery-overlay ${endgame ? "is-endgame" : ""}`} role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <div className="discovery-card" ref={ref} role="dialog" aria-modal="true" aria-labelledby="discovery-name">
        <div className="discovery-ritual" aria-hidden="true">
          <span className="discovery-ritual__ring" />
          <span className="discovery-ritual__ring discovery-ritual__ring--inner" />
          <span className="discovery-ritual__spark discovery-ritual__spark--a">✦</span>
          <span className="discovery-ritual__spark discovery-ritual__spark--b">✦</span>
          <span className="discovery-ritual__spark discovery-ritual__spark--c">∙</span>
        </div>
        <p className="overlay-kicker">{endgame ? "终焉之作 · ENDGAME" : "炉中新生 · NEW ELEMENT"}</p>
        <div className="discovery-sprite">
          <Sprite element={element} size={148} alt={element.name} />
        </div>
        <div className="discovery-name-row">
          <h2 id="discovery-name">{element.name}</h2>
          <span className="category-chip" style={{ "--cat": category.color }}>{category.name}</span>
        </div>
        <p className="discovery-description">{element.description}</p>
        {recipeNames.length > 0 && (
          <p className="discovery-formula">
            <span>{recipeNames.join(" ＋ ")}</span>
            <i aria-hidden="true">→</i>
            <span>{element.name}</span>
          </p>
        )}
        <div className="discovery-meta">
          <span>第 {discoveredCount} 个要素</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>{milestone ? "灵光 +1" : "已收入要素库"}</span>
        </div>
        <button type="button" className="primary-button" onClick={onClose} data-autofocus>
          {endgame ? "收下" : "收入图鉴"}
        </button>
      </div>
    </div>,
    document.body
  );
}

export function ChapterOverlay({ overlay, onClose }) {
  const ref = useOverlayFocus(onClose);
  const { chapter, unlocked = [], insight = 0 } = overlay;
  return createPortal(
    <div className="overlay chapter-overlay" role="presentation">
      <div className="overlay__stars" aria-hidden="true" />
      <div className="chapter-card" ref={ref} role="dialog" aria-modal="true" aria-labelledby="chapter-overlay-title">
        <p className="overlay-kicker">手记又翻过一页 · CHAPTER COMPLETE</p>
        <div className="chapter-card__numeral" aria-hidden="true">{chapter.numeral}</div>
        <h2 id="chapter-overlay-title">{chapter.title}</h2>
        <p className="chapter-card__subtitle">{chapter.subtitle}</p>
        <p className="chapter-card__outro">{chapter.outro}</p>
        <div className="chapter-card__reward">
          {insight > 0 && <span>✦ 灵光 +{insight}</span>}
          {unlocked.map((id) => {
            const element = ELEMENT_BY_ID.get(id);
            return (
              <span key={id} className="chapter-unlock">
                <Sprite element={element} size={28} />
                解锁源初 · {element.name}
              </span>
            );
          })}
          {insight === 0 && unlocked.length === 0 && <span>这一页已被记住。</span>}
        </div>
        <button type="button" className="primary-button" onClick={onClose} data-autofocus>
          继续合成
        </button>
      </div>
    </div>,
    document.body
  );
}

export function EndingOverlay({ onClose, stats }) {
  const ref = useOverlayFocus(onClose);
  const element = ELEMENT_BY_ID.get("allinone");
  return createPortal(
    <div className="overlay ending-overlay" role="presentation">
      <div className="ending-aurora" aria-hidden="true" />
      <div className="ending-stars" aria-hidden="true" />
      <div className="ending-card" ref={ref} role="dialog" aria-modal="true" aria-labelledby="ending-title">
        <p className="overlay-kicker">终章 · 万物归一</p>
        <div className="ending-sigil" aria-hidden="true">
          <span />
          <span />
          <Sprite element={element} size={156} alt="万象归一" />
        </div>
        <h2 id="ending-title">所有要素都已收录</h2>
        <p className="ending-copy">
          你把生命、时间、王冠、世界与神谕放进了同一句话里。炉火安静下来。
        </p>
        <p className="ending-copy ending-copy--small">
          你还可以继续合成，把还没命名的东西造出来。
        </p>
        <div className="ending-stats">
          <div><b>{stats.discovered}</b><span>要素</span></div>
          <div><b>{stats.fusions}</b><span>次熔炼</span></div>
          <div><b>{stats.rate}%</b><span>成功率</span></div>
          <div><b>{stats.chapters}</b><span>页手记</span></div>
        </div>
        <button type="button" className="primary-button primary-button--wide" onClick={onClose} data-autofocus>
          继续游戏
        </button>
      </div>
    </div>,
    document.body
  );
}

export function IntroOverlay({ onStart }) {
  const ref = useOverlayFocus(null, true);
  const base = ["fire", "water", "earth", "air"].map((id) => ELEMENT_BY_ID.get(id));
  return createPortal(
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-aurora" aria-hidden="true" />
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-card" ref={ref}>
        <p className="intro-kicker">要素合成游戏</p>
        <h2 id="intro-title">万象熔炉</h2>
        <p className="intro-latin">MYRIAD FORGE</p>
        <p className="intro-copy">
          你在一张没有字的书页上醒来。火、水、土、风在掌心留下四种温度。把它们放在一起，看看能造出什么。
        </p>
        <div className="intro-elements" aria-label="四种源初要素">
          {base.map((element) => (
            <div className="intro-element" key={element.id}>
              <Sprite element={element} size={56} />
              <span>{element.name}</span>
            </div>
          ))}
        </div>
        <div className="intro-instructions">
          <span>点选两种要素</span>
          <i aria-hidden="true">✦</i>
          <span>投入熔炉</span>
          <i aria-hidden="true">✦</i>
          <span>收录新要素</span>
        </div>
        <button type="button" className="primary-button primary-button--wide" onClick={onStart} data-autofocus>
          开始游戏
        </button>
        <p className="intro-foot">进度保存在浏览器中 · 建议使用桌面浏览器</p>
      </div>
    </div>,
    document.body
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.tone || "info"}`} role="status" aria-live="polite">
      <span className="toast__mark" aria-hidden="true">{toast.tone === "insight" ? "✦" : "◆"}</span>
      <p>{toast.text}</p>
    </div>
  );
}

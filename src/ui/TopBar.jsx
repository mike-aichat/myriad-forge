import React from "react";

export function TopBar({
  stats,
  chapter,
  sound,
  onStory,
  onToggleSound,
  onHelp,
  onChallenges,
  onTree,
}) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="brand-sigil" aria-hidden="true">
          <span className="brand-sigil__core" />
          <span className="brand-sigil__orbit" />
        </span>
        <div className="brand-type">
          <h1>万象熔炉</h1>
          <p>MYRIAD FORGE</p>
        </div>
      </div>

      <div className="topbar__gauges" aria-label="游戏统计">
        <div className="gauge">
          <span className="gauge__label">要素</span>
          <span className="gauge__value">
            {stats.discovered}
            <em>/ {stats.total}</em>
          </span>
          <span className="gauge__bar" aria-hidden="true">
            <span style={{ width: `${(stats.discovered / stats.total) * 100}%` }} />
          </span>
        </div>
        <div className="gauge gauge--small">
          <span className="gauge__label">熔炼</span>
          <span className="gauge__value">{stats.fusions}</span>
        </div>
        <div className="gauge gauge--small">
          <span className="gauge__label">手记</span>
          <span className="gauge__value">
            {stats.chapters}
            <em>/ {stats.totalChapters}</em>
          </span>
        </div>
        <div className="gauge gauge--chapter">
          <span className="gauge__label">此刻</span>
          <span className="gauge__chapter">
            {chapter.numeral} · {chapter.title}
          </span>
        </div>
      </div>

      <nav className="topbar__actions" aria-label="游戏菜单">
        <button
          className="plate-button plate-button--challenge"
          type="button"
          onClick={onChallenges}
          title="离开主炉，进入独立的试炼故事"
        >
          <span className="plate-button__mark" aria-hidden="true">外</span>
          <span>试炼</span>
        </button>
        <button className="plate-button" type="button" onClick={onStory} title="翻阅创世手记">
          <span className="plate-button__mark" aria-hidden="true">册</span>
          <span>手记</span>
        </button>
        <button
          className="plate-button plate-button--tree"
          type="button"
          onClick={onTree}
          title="查看要素谱系与合成来源"
        >
          <span className="plate-button__mark" aria-hidden="true">谱</span>
          <span>谱系</span>
        </button>
        <button
          className={`icon-button ${sound ? "is-on" : ""}`}
          type="button"
          onClick={onToggleSound}
          aria-pressed={sound}
          title={sound ? "关闭声音（M）" : "打开声音（M）"}
        >
          <span className="sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="icon-button__text">{sound ? "有声" : "静音"}</span>
        </button>
        <button className="icon-button" type="button" onClick={onHelp} title="玩法与快捷键">
          <span className="help-glyph" aria-hidden="true">?</span>
          <span className="icon-button__text">指南</span>
        </button>
      </nav>
    </header>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { ELEMENTS } from "../data/elements/index.js";
import { CATEGORIES, CATEGORY_MAP } from "../data/categories.js";
import { buildPairHistoryMap } from "../game/craftedPairs.js";
import { ELEMENT_BY_ID } from "../game/recipes.js";
import { buildElementUseStatus, countElementUseStatus } from "../game/recipeStatus.js";
import { Sprite } from "./Sprite.jsx";

function pairHistoryNote(entry) {
  if (!entry) return "";
  const notes = [];
  for (const link of entry.crafted) {
    notes.push(`与「${link.sourceName}」熔过，产物是「${link.resultName}」`);
  }
  for (const link of entry.failed) {
    notes.push(`与「${link.sourceName}」试过，没有结果`);
  }
  return notes.join("；");
}

function ElementCard({
  element,
  discovered,
  selectedIndex,
  onSelect,
  onInfo,
  onUnknown,
  status,
  pairEntry,
  isInspiring,
}) {
  const category = CATEGORY_MAP[element.category];
  const markKind = pairEntry?.crafted.length
    ? "crafted"
    : pairEntry?.failed.length
      ? "failed"
      : null;
  const pairNote = pairHistoryNote(pairEntry);
  const statusBadge = status?.label ? (
    <span
      className={`element-card__status is-${status.kind}`}
      title={status.title}
      aria-label={status.title}
    >
      {status.label}
    </span>
  ) : null;

  if (!discovered) {
    return (
      <button
        type="button"
        className="element-card element-card--unknown"
        style={{ "--cat": category.color }}
        onClick={onUnknown}
        title={status?.title || "尚未发现"}
      >
        <div className="element-card__sprite">
          <Sprite element={element} size={46} silhouette alt="未发现的要素" />
          <span className="element-card__question" aria-hidden="true">?</span>
        </div>
        <span className="element-card__name">？？？</span>
        <span className="element-card__cat" style={{ background: category.color }} aria-hidden="true" />
        {statusBadge}
      </button>
    );
  }

  return (
    <div
      className={`element-card ${selectedIndex >= 0 ? "is-selected" : ""} ${isInspiring && selectedIndex >= 0 ? "is-inspired" : ""} ${markKind === "crafted" ? "is-crafted-pair" : ""} ${markKind === "failed" ? "is-failed-pair" : ""}`}
      style={{ "--cat": category.color }}
    >
      <button
        type="button"
        className="element-card__select"
        onClick={() => onSelect(element.id)}
        title={`${element.name} · ${category.name}${pairNote ? ` · ${pairNote}` : ""}`}
        aria-label={`选择${element.name}放入熔炉${pairNote ? `；${pairNote}` : ""}`}
      >
        <div className="element-card__sprite">
          <Sprite element={element} size={46} />
        </div>
        <span className="element-card__name">{element.name}</span>
        <span className="element-card__cat" style={{ background: category.color }} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="element-card__info"
        onClick={() => onInfo(element)}
        aria-label={`查看${element.name}的详情`}
        title="查看详情"
      >
        i
      </button>
      {selectedIndex >= 0 ? (
        <span className="element-card__slot-mark" aria-hidden="true">
          {selectedIndex === 0 ? "I" : "II"}
        </span>
      ) : markKind ? (
        <span className={`element-card__pair-mark is-${markKind}`} aria-hidden="true">
          {markKind === "crafted" ? "已" : "空"}
        </span>
      ) : null}
      {statusBadge}
    </div>
  );
}

export function Library({
  state,
  selected,
  onSelect,
  onInfo,
  onUnknown,
  query,
  setQuery,
  category,
  setCategory,
  showUnknown,
  setShowUnknown,
  searchRef,
  insight,
  onInspire,
  inspireDisabled,
  isInspiring,
}) {
  const discoveredSet = useMemo(() => new Set(state.discovered), [state.discovered]);
  const [markFilters, setMarkFilters] = useState([]);
  const [markInvert, setMarkInvert] = useState(false);
  useEffect(() => {
    if (!selected.length) {
      setMarkFilters((current) => {
        const next = current.filter((filter) => filter !== "crafted" && filter !== "failed");
        return next.length === current.length ? current : next;
      });
    }
  }, [selected.length]);
  const useStatus = useMemo(() => buildElementUseStatus(state), [state]);
  const statusCounts = useMemo(() => countElementUseStatus(useStatus), [useStatus]);
  const orderIndex = useMemo(() => {
    const map = new Map();
    state.order.forEach((id, index) => map.set(id, index));
    return map;
  }, [state.order]);
  const pairHistory = useMemo(
    () => buildPairHistoryMap(state, selected),
    [state, selected]
  );
  const pairCounts = useMemo(() => {
    let crafted = 0;
    let failed = 0;
    for (const entry of pairHistory.values()) {
      if (entry.crafted.length) crafted += 1;
      if (entry.failed.length) failed += 1;
    }
    return { crafted, failed };
  }, [pairHistory]);
  const selectedNames = useMemo(
    () => selected.map((id) => ELEMENT_BY_ID.get(id)?.name).filter(Boolean),
    [selected]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map();
    for (const categoryItem of CATEGORIES) {
      map.set(categoryItem.id, { discovered: 0, total: 0 });
    }
    for (const element of ELEMENTS) {
      const entry = map.get(element.category);
      entry.total += 1;
      if (discoveredSet.has(element.id)) entry.discovered += 1;
    }
    return map;
  }, [discoveredSet]);

  const clearMarkFilters = () => {
    setMarkFilters([]);
    setMarkInvert(false);
  };

  const toggleMarkFilter = (value) => {
    setMarkFilters((current) =>
      current.includes(value)
        ? current.filter((filter) => filter !== value)
        : [...current, value]
    );
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchesMark = (element) => {
      if (!markFilters.length) return true;
      if (!discoveredSet.has(element.id)) return false;
      const marks = [];
      const status = useStatus.get(element.id);
      if (status?.kind === "idle" || status?.kind === "exhausted") {
        marks.push(status.kind);
      }
      const entry = pairHistory.get(element.id);
      if (entry?.crafted.length) {
        marks.push("crafted");
      } else if (entry?.failed.length) {
        marks.push("failed");
      }
      const hasMark = markFilters.some((filter) => marks.includes(filter));
      return markInvert ? !hasMark : hasMark;
    };
    const list = ELEMENTS.filter((element) => {
      if (category !== "all" && element.category !== category) return false;
      if (!matchesMark(element)) return false;
      if (needle) {
        return (
          discoveredSet.has(element.id) &&
          (element.name.toLowerCase().includes(needle) ||
            element.description.toLowerCase().includes(needle))
        );
      }
      return discoveredSet.has(element.id) || showUnknown;
    });
    return list.sort((a, b) => {
      const ad = discoveredSet.has(a.id);
      const bd = discoveredSet.has(b.id);
      if (ad !== bd) return ad ? -1 : 1;
      if (ad && bd) {
        return (orderIndex.get(b.id) ?? 0) - (orderIndex.get(a.id) ?? 0);
      }
      return ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b);
    });
  }, [category, query, discoveredSet, markFilters, markInvert, orderIndex, pairHistory, showUnknown, useStatus]);

  const foundInCategory =
    category === "all"
      ? state.discovered.length
      : categoryCounts.get(category)?.discovered || 0;
  const totalInCategory =
    category === "all" ? ELEMENTS.length : categoryCounts.get(category)?.total || 0;

  return (
    <section className="library panel" aria-labelledby="library-title">
      <div className="library-head">
        <div className="library-title">
          <div className="library-title__name">
            <p className="eyebrow">标本柜</p>
            <div className="library-title__row">
              <h2 id="library-title">要素库</h2>
              <button
                type="button"
                className={`library-insight ${isInspiring ? "is-casting" : ""}`}
                onClick={onInspire}
                disabled={inspireDisabled || insight < 1}
                title={
                  insight < 1
                    ? "灵光用尽了。发现新要素、写完手记，或者连续失败都会让灵光重新聚起来。"
                    : "花 1 点灵光，随机挑一对还没试过的要素直接熔炼"
                }
                aria-label={`灵光 ${insight} 点，随机熔炼一对要素`}
              >
                <span className="library-insight__mark" aria-hidden="true">✦</span>
                <span>灵光</span>
                <b>{insight}</b>
              </button>
            </div>
          </div>
          <div className="library-count">
            <b>{foundInCategory}</b>
            <span>/ {totalInCategory}</span>
            <small>{category === "all" ? "全部要素" : CATEGORY_MAP[category].name}</small>
          </div>
        </div>

        <div className="library-controls">
          <label className="search-box">
            <span className="search-box__icon" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜寻要素或描述…"
              aria-label="搜寻要素"
            />
            <kbd>/</kbd>
          </label>
          <button
            type="button"
            className={`unknown-toggle ${showUnknown ? "is-on" : ""}`}
            onClick={() => setShowUnknown((value) => !value)}
            aria-pressed={showUnknown}
            title="显示尚未发现的要素轮廓"
          >
            <span className="unknown-toggle__switch" aria-hidden="true" />
            显示未解
          </button>
        </div>
      </div>

      <div className="category-tabs" role="tablist" aria-label="按类型筛选">
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          className={`category-tab ${category === "all" ? "is-active" : ""}`}
          onClick={() => setCategory("all")}
        >
          <span className="category-tab__dot" style={{ background: "var(--brass)" }} />
          全部
          <em>{state.discovered.length}/{ELEMENTS.length}</em>
        </button>
        {CATEGORIES.map((categoryItem) => {
          const counts = categoryCounts.get(categoryItem.id);
          return (
            <button
              key={categoryItem.id}
              type="button"
              role="tab"
              aria-selected={category === categoryItem.id}
              className={`category-tab ${category === categoryItem.id ? "is-active" : ""}`}
              onClick={() => setCategory(categoryItem.id)}
            >
              <span className="category-tab__dot" style={{ background: categoryItem.color }} />
              {categoryItem.name}
              <em>{counts.discovered}/{counts.total}</em>
            </button>
          );
        })}
      </div>

      <div
        className="library-status-legend"
        role="group"
        aria-label="按图鉴标记筛选"
        title="可多选标记；反选可排除选中的标记"
      >
        <span className="library-status-legend__title">图鉴标记</span>
        <button
          type="button"
          className={`library-status-legend__filter ${!markFilters.length && !markInvert ? "is-active" : ""}`}
          onClick={clearMarkFilters}
          aria-pressed={!markFilters.length && !markInvert}
          title="清除标记筛选"
        >
          全部
        </button>
        <button
          type="button"
          className={`library-status-legend__filter library-status-legend__invert ${markInvert ? "is-active" : ""}`}
          onClick={() => setMarkInvert((value) => !value)}
          aria-pressed={markInvert}
          title={markInvert ? "关闭反选，改为只看选中标记" : "打开反选，排除选中的标记"}
        >
          反选
        </button>
        <button
          type="button"
          className={`library-status-legend__filter ${markFilters.includes("idle") ? "is-active" : ""}`}
          data-kind="idle"
          onClick={() => toggleMarkFilter("idle")}
          aria-pressed={markFilters.includes("idle")}
          title="当前无法造出新要素的材料"
        >
          <i data-kind="idle">闲</i>当前无新结果 {statusCounts.idle}
        </button>
        <button
          type="button"
          className={`library-status-legend__filter ${markFilters.includes("exhausted") ? "is-active" : ""}`}
          data-kind="exhausted"
          onClick={() => toggleMarkFilter("exhausted")}
          aria-pressed={markFilters.includes("exhausted")}
          title="配方结果都已发现的材料"
        >
          <i data-kind="exhausted">尽</i>已无新结果 {statusCounts.exhausted}
        </button>
        {selected.length > 0 && (
          <>
            <button
              type="button"
              className={`library-status-legend__filter library-status-legend__pair ${markFilters.includes("crafted") ? "is-active" : ""}`}
              data-kind="crafted"
              onClick={() => toggleMarkFilter("crafted")}
              aria-pressed={markFilters.includes("crafted")}
              title="与所选要素成功熔过的搭档"
            >
              <i data-kind="crafted">已</i>
              与{selectedNames.map((name) => `「${name}」`).join("")}熔过 {pairCounts.crafted}
            </button>
            <button
              type="button"
              className={`library-status-legend__filter library-status-legend__pair is-failed ${markFilters.includes("failed") ? "is-active" : ""}`}
              data-kind="failed"
              onClick={() => toggleMarkFilter("failed")}
              aria-pressed={markFilters.includes("failed")}
              title="与所选要素试过但没有结果的搭档"
            >
              <i data-kind="failed">空</i>
              与{selectedNames.map((name) => `「${name}」`).join("")}无果 {pairCounts.failed}
            </button>
          </>
        )}
        <span className="library-status-legend__note">
          {markFilters.length
            ? markInvert
              ? `反向筛选 ${markFilters.length} 个标记 · 剩 ${visible.length} 个要素`
              : `已筛选 ${markFilters.length} 个标记 · ${visible.length} 个要素`
            : markInvert
              ? "反选已开 · 选一个标记开始排除"
              : selected.length
                ? "试过的组合已标出，结果不会变。"
                : "选中一项后，会标出已经试过的搭档。"}
        </span>
      </div>

      <div className="library-grid-wrap">
        {visible.length > 0 ? (
          <div className="element-grid">
            {visible.map((element) => {
              const index = selected.indexOf(element.id);
              const pairEntry = index < 0 ? pairHistory.get(element.id) : null;
              return (
                <ElementCard
                  key={element.id}
                  element={element}
                  discovered={discoveredSet.has(element.id)}
                  selectedIndex={index}
                  onSelect={onSelect}
                  onInfo={onInfo}
                  onUnknown={onUnknown}
                  status={useStatus.get(element.id)}
                  pairEntry={pairEntry}
                  isInspiring={isInspiring}
                />
              );
            })}
          </div>
        ) : (
          <div className="library-empty">
            <span className="library-empty__mark" aria-hidden="true">◇</span>
            <p>
              {query
                ? "没有找到这样的要素。换一个词，或者先去熔炉里碰碰运气。"
                : markFilters.length
                  ? "当前筛选下没有要素。清掉标记，或换个类型。"
                  : "这一格还是空的。"}
            </p>
          </div>
        )}
      </div>

      <div className="library-foot">
        <p>
          {query
            ? "搜索只翻动已经写下的页。"
            : showUnknown
              ? "未解要素只显示轮廓。把它们从黑暗里熔出来。"
              : "点选要素放入熔炉，点击角落的小 i 查看它的来历。"}
        </p>
        <span className="library-foot__count">
          {state.discovered.length} / {ELEMENTS.length} 已收录
        </span>
      </div>
    </section>
  );
}

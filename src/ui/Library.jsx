import React, { useMemo } from "react";
import { ELEMENTS } from "../data/elements/index.js";
import { CATEGORIES, CATEGORY_MAP } from "../data/categories.js";
import { buildCraftedPartnerMap } from "../game/craftedPairs.js";
import { ELEMENT_BY_ID } from "../game/recipes.js";
import { buildElementUseStatus, countElementUseStatus } from "../game/recipeStatus.js";
import { Sprite } from "./Sprite.jsx";

function craftedPairNote(links) {
  return links
    .map((link) => `与「${link.sourceName}」熔过，产物是「${link.resultName}」`)
    .join("；");
}

function ElementCard({
  element,
  discovered,
  selectedIndex,
  onSelect,
  onInfo,
  onUnknown,
  status,
  craftedLinks,
}) {
  const category = CATEGORY_MAP[element.category];
  const craftedNote = craftedLinks?.length ? craftedPairNote(craftedLinks) : "";
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
      className={`element-card ${selectedIndex >= 0 ? "is-selected" : ""} ${craftedLinks ? "is-crafted-pair" : ""}`}
      style={{ "--cat": category.color }}
    >
      <button
        type="button"
        className="element-card__select"
        onClick={() => onSelect(element.id)}
        title={`${element.name} · ${category.name}${craftedNote ? ` · ${craftedNote}` : ""}`}
        aria-label={`选择${element.name}放入熔炉${craftedNote ? `；${craftedNote}` : ""}`}
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
      ) : craftedLinks ? (
        <span className="element-card__pair-mark" aria-hidden="true">
          已
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
}) {
  const discoveredSet = useMemo(() => new Set(state.discovered), [state.discovered]);
  const useStatus = useMemo(() => buildElementUseStatus(state), [state]);
  const statusCounts = useMemo(() => countElementUseStatus(useStatus), [useStatus]);
  const orderIndex = useMemo(() => {
    const map = new Map();
    state.order.forEach((id, index) => map.set(id, index));
    return map;
  }, [state.order]);
  const craftedPartners = useMemo(
    () => buildCraftedPartnerMap(state, selected),
    [state, selected]
  );
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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = ELEMENTS.filter((element) => {
      if (category !== "all" && element.category !== category) return false;
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
  }, [category, query, discoveredSet, showUnknown, orderIndex]);

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
          <div>
            <p className="eyebrow">标本柜</p>
            <h2 id="library-title">要素库</h2>
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

      <div className="library-status-legend" title="只统计已发现的要素">
        <span className="library-status-legend__title">图鉴标记</span>
        <span title="当前没有已发现的搭档能造出新要素"><i data-kind="idle">闲</i>当前无新结果 {statusCounts.idle}</span>
        <span title="会用到它的配方结果都已发现"><i data-kind="exhausted">尽</i>已无新结果 {statusCounts.exhausted}</span>
        {selected.length > 0 && (
          <span className="library-status-legend__pair">
            <i data-kind="crafted">已</i>
            与{selectedNames.map((name) => `「${name}」`).join("")}熔过的搭档 {craftedPartners.size}
          </span>
        )}
        <span className="library-status-legend__note">
          {selected.length
            ? "再熔一遍，只会翻回旧页。"
            : "选中一项后，会标出已经和它熔过的搭档。"}
        </span>
      </div>

      <div className="library-grid-wrap">
        {visible.length > 0 ? (
          <div className="element-grid">
            {visible.map((element) => {
              const index = selected.indexOf(element.id);
              const craftedEntry = index < 0 ? craftedPartners.get(element.id) : null;
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
                  craftedLinks={craftedEntry?.links}
                />
              );
            })}
          </div>
        ) : (
          <div className="library-empty">
            <span className="library-empty__mark" aria-hidden="true">◇</span>
            <p>{query ? "没有找到这样的要素。换一个词，或者先去熔炉里碰碰运气。" : "这一格还是空的。"}</p>
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

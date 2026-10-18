import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORY_MAP } from "../data/categories.js";
import { ELEMENTS } from "../data/elements/index.js";
import { Sprite } from "../ui/Sprite.jsx";
import { buildTreeLayout, TREE_NODE_HEIGHT, TREE_NODE_WIDTH } from "./layout.js";
import "./tree.css";

const MIN_SCALE = 0.08;
const MAX_SCALE = 2.4;
const LEVEL_FOCUS_SCALE = 0.9;

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

const TreeCanvas = React.memo(function TreeCanvas({ layout, selectedId, relation, onNodeSelect }) {
  return (
    <>
      <svg
        className="tree-edges"
        width={layout.stageWidth}
        height={layout.stageHeight}
        aria-hidden="true"
      >
        {layout.edges.map((edge) => {
          const midY = (edge.y1 + edge.y2) / 2;
          const edgeState = !relation
            ? ""
            : relation.incomingEdges.has(edge.id)
              ? "is-incoming"
              : relation.outgoingEdges.has(edge.id)
                ? "is-outgoing"
                : "is-dimmed";
          return (
            <path
              key={edge.id}
              className={edgeState}
              d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
            />
          );
        })}
      </svg>

      {layout.levels.map((levelInfo) => (
        <React.Fragment key={levelInfo.level}>
          <div
            className={`tree-band ${levelInfo.level % 2 ? "is-alt" : ""}`}
            style={{
              top: levelInfo.y - 10,
              width: layout.stageWidth,
              height: levelInfo.height + 20,
            }}
            aria-hidden="true"
          />
          <span
            className="tree-level-label"
            style={{ top: levelInfo.y - 20, left: levelInfo.labelX }}
          >
            Lv{levelInfo.level}
            <b>{levelInfo.count}</b>
          </span>
        </React.Fragment>
      ))}

      {layout.nodes.map((node) => {
        const category = CATEGORY_MAP[node.element.category];
        const isSelected = node.element.id === selectedId;
        const isParent = relation?.parentIds.has(node.element.id) ?? false;
        const isChild = relation?.childIds.has(node.element.id) ?? false;
        const stateClass = !relation
          ? ""
          : isSelected
            ? "is-selected"
            : isParent
              ? "is-parent"
              : isChild
                ? "is-child"
                : "is-dimmed";
        return (
          <div
            key={node.element.id}
            className={`tree-node ${node.discovered ? "is-found" : "is-unknown"} ${stateClass}`}
            style={{
              left: node.x,
              top: node.y,
              width: TREE_NODE_WIDTH,
              height: TREE_NODE_HEIGHT,
              "--cat": category.color,
            }}
            title={
              node.discovered
                ? `${node.element.name} · Lv${node.level}`
                : `未发现 · Lv${node.level}`
            }
            data-element-id={node.discovered ? node.element.id : undefined}
            onKeyDown={
              node.discovered
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onNodeSelect(event, node);
                    }
                  }
                : undefined
            }
            role={node.discovered ? "button" : undefined}
            tabIndex={node.discovered ? 0 : undefined}
            aria-pressed={node.discovered ? isSelected : undefined}
            aria-label={node.discovered ? `${node.element.name}，Lv${node.level}` : undefined}
          >
            <div className="tree-node__sprite">
              <Sprite
                element={node.element}
                size={32}
                silhouette={!node.discovered}
                alt={node.discovered ? node.element.name : ""}
              />
            </div>
            <span className="tree-node__name">
              {node.discovered ? node.element.name : "？？？"}
            </span>
          </div>
        );
      })}
    </>
  );
});

export function CraftTree({ state, onExit }) {
  const viewportRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [focusLevel, setFocusLevel] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const layout = useMemo(() => buildTreeLayout(state.discovered), [state.discovered]);

  const selectedNode = useMemo(
    () => layout.nodes.find((node) => node.element.id === selectedId) || null,
    [layout, selectedId]
  );

  const relation = useMemo(() => {
    if (!selectedId) return null;
    const node = layout.nodes.find((item) => item.element.id === selectedId);
    if (!node || !node.discovered) return null;
    const parentIds = new Set();
    const childIds = new Set();
    const incomingEdges = new Set();
    const outgoingEdges = new Set();
    for (const edge of layout.edges) {
      if (edge.resultId === selectedId) {
        parentIds.add(edge.parentId);
        incomingEdges.add(edge.id);
      }
      if (edge.parentId === selectedId) {
        childIds.add(edge.resultId);
        outgoingEdges.add(edge.id);
      }
    }
    return { parentIds, childIds, incomingEdges, outgoingEdges };
  }, [layout, selectedId]);

  const updateView = useCallback((next) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    const scale = clampScale(
      Math.min((width - 32) / layout.stageWidth, (height - 32) / layout.stageHeight, 1)
    );
    updateView({
      x: (width - layout.stageWidth * scale) / 2,
      y: (height - layout.stageHeight * scale) / 2,
      scale,
    });
    setFocusLevel("");
  }, [layout.stageWidth, layout.stageHeight, updateView]);

  const focusTop = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scale = clampScale(LEVEL_FOCUS_SCALE);
    updateView({
      x: (viewport.clientWidth - layout.stageWidth * scale) / 2,
      y: 26,
      scale,
    });
    setFocusLevel("0");
  }, [layout.stageWidth, updateView]);

  useEffect(() => {
    focusTop();
    const onResize = () => fitToScreen();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [focusTop, fitToScreen]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event) => {
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const current = viewRef.current;
      const scale = clampScale(current.scale * Math.exp(-event.deltaY * 0.0015));
      updateView({
        x: pointerX - ((pointerX - current.x) / current.scale) * scale,
        y: pointerY - ((pointerY - current.y) / current.scale) * scale,
        scale,
      });
      setFocusLevel("");
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [updateView]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (selectedId) {
        setSelectedId(null);
        return;
      }
      onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit, selectedId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const zoomAt = useCallback(
    (pointerX, pointerY, factor) => {
      const current = viewRef.current;
      const scale = clampScale(current.scale * factor);
      updateView({
        x: pointerX - ((pointerX - current.x) / current.scale) * scale,
        y: pointerY - ((pointerY - current.y) / current.scale) * scale,
        scale,
      });
    },
    [updateView]
  );

  const zoomBy = (factor) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, factor);
    setFocusLevel("");
  };

  const jumpToLevel = (level) => {
    const viewport = viewportRef.current;
    const levelInfo = layout.levels.find((item) => item.level === level);
    if (!viewport || !levelInfo) return;
    const scale = clampScale(LEVEL_FOCUS_SCALE);
    updateView({
      x: (viewport.clientWidth - layout.stageWidth * scale) / 2,
      y: viewport.clientHeight / 2 - (levelInfo.y + levelInfo.height / 2) * scale,
      scale,
    });
    setFocusLevel(String(level));
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      const bounds = event.currentTarget.getBoundingClientRect();
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        centerX: (a.x + b.x) / 2 - bounds.left,
        centerY: (a.y + b.y) / 2 - bounds.top,
        view: viewRef.current,
      };
      dragRef.current = null;
      movedRef.current = true;
      setDragging(false);
      setFocusLevel("");
      return;
    }

    movedRef.current = false;
    const nodeElement = event.target.closest?.(".tree-node");
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewRef.current.x,
      originY: viewRef.current.y,
      nodeId: nodeElement?.dataset.elementId || null,
    };
    setDragging(true);
    setFocusLevel("");
  };

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (!pinch.distance) return;
      const scale = clampScale(pinch.view.scale * (distance / pinch.distance));
      updateView({
        x: pinch.centerX - ((pinch.centerX - pinch.view.x) / pinch.view.scale) * scale,
        y: pinch.centerY - ((pinch.centerY - pinch.view.y) / pinch.view.scale) * scale,
        scale,
      });
      movedRef.current = true;
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (
      Math.abs(event.clientX - drag.startX) > 4 ||
      Math.abs(event.clientY - drag.startY) > 4
    ) {
      movedRef.current = true;
    }
    updateView({
      ...viewRef.current,
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const cancelDrag = (event) => {
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    movedRef.current = false;
    if (dragRef.current && dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const endDrag = (event) => {
    const wasPinching = Boolean(pinchRef.current);
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;

    const drag = dragRef.current;
    if (drag && drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);

    if (wasPinching || movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (!drag) return;
    if (drag.nodeId) {
      setSelectedId((current) => (current === drag.nodeId ? null : drag.nodeId));
    } else {
      setSelectedId(null);
    }
  };

  const handleNodeSelect = useCallback((event, node) => {
    event.stopPropagation();
    setSelectedId((current) => (current === node.element.id ? null : node.element.id));
  }, []);

  const discoveredCount = layout.nodes.filter((node) => node.discovered).length;
  const zoomPercent = Math.round(view.scale * 100);

  return (
    <div className="tree-mode">
      <header className="tree-header">
        <button
          type="button"
          className="tree-back"
          onClick={onExit}
          title="返回主炉（Esc）"
        >
          <span aria-hidden="true">←</span> 返回主炉
        </button>
        <div className="tree-heading">
          <p className="eyebrow">源流总览</p>
          <h1>要素谱系</h1>
          <p>从源初向下生长。未发现的要素只留剪影，不画来源线。</p>
        </div>
        <div className="tree-summary">
          <span>
            已发现 <b>{discoveredCount}</b> / {ELEMENTS.length}
          </span>
          <span>Lv0–Lv{layout.maxLevel}</span>
        </div>
      </header>

      <div className="tree-toolbar">
        <div className="tree-zoom" role="group" aria-label="缩放">
          <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="缩小">
            −
          </button>
          <span>{zoomPercent}%</span>
          <button type="button" onClick={() => zoomBy(1.25)} aria-label="放大">
            ＋
          </button>
          <button type="button" className="tree-fit" onClick={fitToScreen}>
            适应屏幕
          </button>
        </div>

        <label className="tree-jump">
          <span>跳到等级</span>
          <select
            value={focusLevel}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) {
                setFocusLevel("");
                return;
              }
              jumpToLevel(Number(value));
            }}
          >
            <option value="">选择</option>
            {layout.levels.map((levelInfo) => (
              <option key={levelInfo.level} value={levelInfo.level}>
                Lv{levelInfo.level} · {levelInfo.count} 个
                {levelInfo.rowCount > 1 ? ` · ${levelInfo.rowCount} 行` : ""}
              </option>
            ))}
          </select>
        </label>

        <p className={`tree-hint ${selectedNode ? "is-selected" : ""}`}>
          {selectedNode
            ? `已选「${selectedNode.element.name}」· Lv${selectedNode.level} · 绿线来源 / 金线产物 · 再点取消`
            : "滚轮缩放 · 拖动画布 · 点已发现要素查看来源"}
        </p>
      </div>

      <div
        ref={viewportRef}
        className={`tree-viewport ${dragging ? "is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      >
        <div
          className={`tree-stage ${relation ? "has-selection" : ""}`}
          style={{
            width: layout.stageWidth,
            height: layout.stageHeight,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
        >
          <TreeCanvas
            layout={layout}
            selectedId={selectedId}
            relation={relation}
            onNodeSelect={handleNodeSelect}
          />
        </div>
      </div>
    </div>
  );
}

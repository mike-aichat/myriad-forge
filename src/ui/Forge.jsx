import React from "react";
import { CrucibleCanvas } from "../art/CrucibleCanvas.jsx";
import { Sprite } from "./Sprite.jsx";

function Slot({ index, element, onRemove, onOpenInfo, disabled }) {
  return (
    <div className={`forge-slot ${element ? "is-filled" : ""}`} style={{ "--slot-index": index }}>
      <span className="forge-slot__roman" aria-hidden="true">
        {index === 0 ? "I" : "II"}
      </span>
      {element ? (
        <>
          <button
            type="button"
            className="forge-slot__remove"
            onClick={onRemove}
            aria-label={`从熔炉中取出${element.name}`}
            title="取出"
            disabled={disabled}
          >
            ×
          </button>
          <button
            type="button"
            className="forge-slot__body"
            onClick={onOpenInfo}
            title={`查看${element.name}`}
            disabled={disabled}
          >
            <Sprite element={element} size={54} />
            <span className="forge-slot__name">{element.name}</span>
          </button>
        </>
      ) : (
        <div className="forge-slot__empty">
          <span className="forge-slot__plus" aria-hidden="true">+</span>
          <span>置入要素</span>
        </div>
      )}
    </div>
  );
}

export function Forge({
  selectedElements,
  onRemove,
  onClear,
  onFuse,
  onOpenInfo,
  isFusing,
  isInspiring,
  message,
  stats,
  reducedMotion,
  fuseButtonRef,
  sectionRef,
}) {
  const ready = selectedElements.length === 2;
  const busy = isFusing || isInspiring;
  return (
    <section
      ref={sectionRef}
      className={`forge panel ${isFusing ? "is-fusing" : ""} ${isInspiring ? "is-inspiring" : ""}`}
      aria-labelledby="forge-title"
    >
      <div className="panel__topline">
        <div>
          <p className="eyebrow">熔炉台</p>
          <h2 id="forge-title">选择两种要素</h2>
        </div>
        <div className="forge-counter" aria-live="polite">
          <span>已置入</span>
          <strong>{selectedElements.length} / 2</strong>
        </div>
      </div>

      <div className="forge-stage">
        <CrucibleCanvas
          selectedCount={selectedElements.length}
          fusing={isFusing}
          reducedMotion={reducedMotion}
        />
        <div className="forge-stage__constellation" aria-hidden="true">
          <span className="constellation-line constellation-line--left" />
          <span className="constellation-line constellation-line--right" />
        </div>
        <div className="forge-stage__slots">
          <Slot
            index={0}
            element={selectedElements[0]}
            onRemove={() => onRemove(0)}
            onOpenInfo={() => selectedElements[0] && onOpenInfo(selectedElements[0])}
            disabled={busy}
          />
          <div className="forge-stage__center-mark" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
          <Slot
            index={1}
            element={selectedElements[1]}
            onRemove={() => onRemove(1)}
            onOpenInfo={() => selectedElements[1] && onOpenInfo(selectedElements[1])}
            disabled={busy}
          />
        </div>

        <div className="forge-fuse">
          <button
            ref={fuseButtonRef}
            type="button"
            className="fuse-button"
            onClick={onFuse}
            disabled={!ready || busy}
          >
            <span className="fuse-button__spark" aria-hidden="true">✦</span>
            <span>{ready ? "熔炼" : "选择两种要素"}</span>
            <span className="fuse-button__spark" aria-hidden="true">✦</span>
          </button>
          <div className="forge-fuse__hint">
            {selectedElements.length === 2 ? (
              <span>{selectedElements[0].name} ＋ {selectedElements[1].name}</span>
            ) : (
              <>
                <span className="forge-hint--keys">从要素库点选，或按 Enter 熔炼</span>
                <span className="forge-hint--touch">从要素库点选两样东西</span>
              </>
            )}
          </div>
        </div>

        {selectedElements.length > 0 && (
          <button type="button" className="forge-clear" onClick={onClear} disabled={busy}>
            清空熔炉
          </button>
        )}
      </div>

      <div className="forge-message" data-tone={message.tone} aria-live="polite">
        <span className="forge-message__mark" aria-hidden="true">✦</span>
        <p>{message.text}</p>
      </div>

      <div className="forge-foot">
        <div className="forge-foot__readout">
          <span>熔炼 {stats.fusions} 次</span>
          <span className="readout-divider" aria-hidden="true" />
          <span>成功率 {stats.rate}%</span>
        </div>
        <p>失败不会影响进度，可以继续试。</p>
      </div>
    </section>
  );
}

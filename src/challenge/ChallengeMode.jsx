import React, { useEffect, useState } from "react";
import { CHALLENGES } from "../data/challenges.js";
import { audio } from "../audio.js";
import { ChallengeHub } from "./ChallengeHub.jsx";
import { ChallengePlay } from "./ChallengePlay.jsx";
import { ChallengeIntroOverlay, ChallengeResultOverlay } from "./ChallengeOverlays.jsx";
import { challengeFamily, resolveChallengeElement } from "./engine.js";
import { challengeCompletedCount, loadChallengeProgress, recordChallengeWin } from "./store.js";
import "./challenge.css";

function ChallengeHeader({ view, active, completed, total, sound, onToggleSound, onBackToHub, onExit }) {
  return (
    <header className="challenge-topbar">
      <div className="topbar__brand">
        <span className="brand-sigil challenge-brand-sigil" aria-hidden="true">
          <span className="brand-sigil__core" />
          <span className="brand-sigil__orbit" />
        </span>
        <div className="brand-type">
          <h1>炉外试炼</h1>
          <p>OUTSIDE THE FORGE</p>
        </div>
      </div>

      <div className="challenge-topbar__center">
        <span className="challenge-topbar__overline">挑战进度</span>
        <span className="challenge-topbar__count">
          {completed}<em>/ {total}</em>
        </span>
        {view === "play" && active && (
          <span className="challenge-topbar__active">
            {challengeFamily(active) === "puzzle" ? "谜题" : "燃尽"} {active.numeral} · {active.title}
          </span>
        )}
      </div>

      <nav className="challenge-topbar__actions" aria-label="试炼菜单">
        {view === "play" && (
          <button type="button" className="plate-button" onClick={onBackToHub} title="返回试炼目录">
            <span className="plate-button__mark" aria-hidden="true">册</span>
            <span>试炼目录</span>
          </button>
        )}
        <button
          className={`icon-button ${sound ? "is-on" : ""}`}
          type="button"
          onClick={onToggleSound}
          aria-pressed={sound}
          title={sound ? "关闭声音" : "打开声音"}
        >
          <span className="sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="icon-button__text">{sound ? "有声" : "静音"}</span>
        </button>
        <button type="button" className="plate-button challenge-exit" onClick={onExit} title="回到主炉">
          <span className="plate-button__mark" aria-hidden="true">炉</span>
          <span>回到主炉</span>
        </button>
      </nav>
    </header>
  );
}

export function ChallengeMode({ onExit, sound, onToggleSound, reducedMotion }) {
  const [progress, setProgress] = useState(loadChallengeProgress);
  const [view, setView] = useState("hub");
  const [activeId, setActiveId] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [runRecord, setRunRecord] = useState(null);

  const active = CHALLENGES.find((challenge) => challenge.id === activeId) || null;
  const target = active ? resolveChallengeElement(active.targetId) : null;
  const completed = challengeCompletedCount(progress);
  const familyChallenges = active
    ? CHALLENGES.filter((challenge) => challengeFamily(challenge) === challengeFamily(active))
    : [];
  const activeIndex = active
    ? familyChallenges.findIndex((challenge) => challenge.id === active.id)
    : -1;
  const nextChallenge = activeIndex >= 0 ? familyChallenges[activeIndex + 1] || null : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view, activeId]);

  const openChallenge = (challenge) => {
    audio.click();
    setActiveId(challenge.id);
    setView("play");
    setRunRecord(null);
    setOverlay("intro");
    setRunKey((key) => key + 1);
  };

  const startRun = () => {
    audio.select();
    setOverlay(null);
    setRunKey((key) => key + 1);
  };

  const backToHub = () => {
    audio.click();
    setOverlay(null);
    setView("hub");
    setActiveId(null);
    setRunRecord(null);
  };

  const handleWin = (stepsUsed) => {
    const next = recordChallengeWin(progress, active.id, stepsUsed);
    setProgress(next);
    setRunRecord({
      type: "won",
      stepsUsed,
      bestSteps: next.completed[active.id]?.bestSteps ?? stepsUsed,
    });
    setOverlay("result");
    audio.chapter();
  };

  const handleLose = (stepsUsed) => {
    setRunRecord({ type: "lost", stepsUsed });
    setOverlay("result");
    audio.fail();
  };

  const retry = () => {
    audio.click();
    setOverlay("intro");
    setRunKey((key) => key + 1);
    setRunRecord(null);
  };

  const goNext = () => {
    if (!nextChallenge) {
      backToHub();
      return;
    }
    audio.click();
    setActiveId(nextChallenge.id);
    setOverlay("intro");
    setRunRecord(null);
    setRunKey((key) => key + 1);
  };

  return (
    <div className="challenge-mode">
      <ChallengeHeader
        view={view}
        active={active}
        completed={completed}
        total={CHALLENGES.length}
        sound={sound}
        onToggleSound={onToggleSound}
        onBackToHub={backToHub}
        onExit={onExit}
      />

      {view === "hub" ? (
        <ChallengeHub progress={progress} onOpen={openChallenge} />
      ) : (
        active && overlay !== "intro" && (
          <ChallengePlay
            key={runKey}
            challenge={active}
            reducedMotion={reducedMotion}
            onWin={handleWin}
            onLose={handleLose}
            onBack={backToHub}
          />
        )
      )}

      {active && overlay === "intro" && (
        <ChallengeIntroOverlay
          challenge={active}
          target={target}
          onStart={startRun}
          onBack={backToHub}
        />
      )}

      {active && overlay === "result" && runRecord && (
        <ChallengeResultOverlay
          challenge={active}
          target={target}
          record={runRecord}
          nextChallenge={nextChallenge}
          onRetry={retry}
          onNext={goNext}
          onBack={backToHub}
        />
      )}

      <footer className="challenge-footer">
        <span>炉外试炼 · 四则谜题与四个被主线留在炉边的故事</span>
        <span>起始要素固定 · 谜题无步数限制 · 燃尽仍有次数</span>
      </footer>
    </div>
  );
}

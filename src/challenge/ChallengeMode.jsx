import React, { useEffect, useMemo, useState } from "react";
import { CHALLENGES } from "../data/challenges.js";
import { QUESTS } from "../data/quests.js";
import { audio } from "../audio.js";
import { ChallengeHub } from "./ChallengeHub.jsx";
import { CollectionOverview } from "./CollectionOverview.jsx";
import { buildCollection } from "./collection.js";
import { ChallengePlay } from "./ChallengePlay.jsx";
import { ChallengeIntroOverlay, ChallengeResultOverlay } from "./ChallengeOverlays.jsx";
import { challengeFamily, resolveChallengeElement } from "./engine.js";
import { challengeCompletedCount, loadChallengeProgress, recordChallengeWin } from "./store.js";
import {
  clearQuestCheckpoint,
  loadQuestProgress,
  questCompletedCount,
  questEndingCount,
  questRecord,
  recordQuestEnding,
  saveQuestCheckpoint,
} from "../quest/store.js";
import { createCheckpoint, createQuestRun, resumeQuestRun } from "../quest/engine.js";
import { QuestPlay } from "../quest/QuestPlay.jsx";
import { QuestIntroOverlay, QuestResultOverlay } from "../quest/QuestOverlays.jsx";
import { loadArtifactProgress, recordArtifactRun } from "../artifact/store.js";
import { artifactCounts } from "../artifact/engine.js";
import { ArtifactMode } from "../artifact/ArtifactMode.jsx";
import "./challenge.css";
import "./collection.css";
import "../quest/quest.css";
import "../artifact/artifact.css";

function ChallengeHeader({
  view,
  active,
  activeQuest,
  completed,
  total,
  questDone,
  questTotal,
  endingsSeen,
  endingsTotal,
  artifactCount,
  artifactTotal,
  sound,
  onToggleSound,
  onBackToHub,
  onExit,
}) {
  const activeLabel =
    view === "play" && active
      ? `${challengeFamily(active) === "puzzle" ? "谜题" : "燃尽"} ${active.numeral} · ${active.title}`
      : view === "quest" && activeQuest
        ? `任务 ${activeQuest.numeral} · ${activeQuest.title}`
        : view === "artifact"
          ? "失物招领博物馆"
          : view === "collection"
            ? "炉外收藏总览"
            : null;

  return (
    <header className="challenge-topbar">
      <div className="topbar__brand">
        <span className="brand-sigil challenge-brand-sigil" aria-hidden="true">
          <span className="brand-sigil__core" />
          <span className="brand-sigil__orbit" />
        </span>
        <div className="brand-type">
          <h1>炉外总目录</h1>
          <p>OUTSIDE THE FORGE</p>
        </div>
      </div>

      <div className="challenge-topbar__center">
        <div className="challenge-topbar__meters">
          <span>试炼 <b>{completed}</b><em>/ {total}</em></span>
          <span>任务 <b>{questDone}</b><em>/ {questTotal}</em></span>
          <span>结局 <b>{endingsSeen}</b><em>/ {endingsTotal}</em></span>
          <span>馆藏 <b>{artifactCount}</b><em>/ {artifactTotal}</em></span>
        </div>
        {activeLabel && <span className="challenge-topbar__active">{activeLabel}</span>}
      </div>

      <nav className="challenge-topbar__actions" aria-label="炉外菜单">
        {view !== "hub" && (
          <button type="button" className="plate-button" onClick={onBackToHub} title="返回炉外总目录">
            <span className="plate-button__mark" aria-hidden="true">册</span>
            <span>炉外目录</span>
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
  const [questProgress, setQuestProgress] = useState(loadQuestProgress);
  const [artifactRun, setArtifactRun] = useState(loadArtifactProgress);
  const [view, setView] = useState("hub");
  const [activeId, setActiveId] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [runRecord, setRunRecord] = useState(null);

  const [activeQuestId, setActiveQuestId] = useState(null);
  const [questOverlay, setQuestOverlay] = useState(null);
  const [questRunKey, setQuestRunKey] = useState(0);
  const [questInitialRun, setQuestInitialRun] = useState(null);
  const [questRunRecord, setQuestRunRecord] = useState(null);
  const [questEnding, setQuestEnding] = useState(null);

  const active = CHALLENGES.find((challenge) => challenge.id === activeId) || null;
  const activeQuest = QUESTS.find((quest) => quest.id === activeQuestId) || null;
  const target = active ? resolveChallengeElement(active.targetId) : null;
  const completed = challengeCompletedCount(progress);
  const questDone = questCompletedCount(questProgress, QUESTS);
  const endingsSeen = questEndingCount(questProgress);
  const endingsTotal = QUESTS.reduce((sum, quest) => sum + quest.endings.length, 0);
  const artifactNow = artifactCounts(artifactRun);
  const collection = useMemo(
    () => buildCollection(progress, questProgress, artifactRun),
    [progress, questProgress, artifactRun]
  );
  const familyChallenges = active
    ? CHALLENGES.filter((challenge) => challengeFamily(challenge) === challengeFamily(active))
    : [];
  const activeIndex = active
    ? familyChallenges.findIndex((challenge) => challenge.id === active.id)
    : -1;
  const nextChallenge = activeIndex >= 0 ? familyChallenges[activeIndex + 1] || null : null;
  const questIndex = activeQuest ? QUESTS.findIndex((quest) => quest.id === activeQuest.id) : -1;
  const nextQuest = questIndex >= 0 ? QUESTS[questIndex + 1] || null : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view, activeId, activeQuestId, questOverlay]);

  const backToHub = () => {
    audio.click();
    setOverlay(null);
    setQuestOverlay(null);
    setView("hub");
    setActiveId(null);
    setActiveQuestId(null);
    setRunRecord(null);
    setQuestRunRecord(null);
    setQuestEnding(null);
    setQuestInitialRun(null);
  };

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

  const openQuest = (quest) => {
    audio.click();
    setActiveQuestId(quest.id);
    setView("quest");
    setQuestOverlay("intro");
    setQuestRunRecord(null);
    setQuestEnding(null);
    setQuestInitialRun(null);
    setQuestRunKey((key) => key + 1);
  };

  const startQuest = (useCheckpoint) => {
    if (!activeQuest) return;
    audio.select();
    const record = questRecord(questProgress, activeQuest.id);
    let initial;
    if (useCheckpoint && record.checkpoint) {
      initial = resumeQuestRun(activeQuest, record.checkpoint);
    } else {
      initial = createQuestRun(activeQuest);
      const cleared = clearQuestCheckpoint(questProgress, activeQuest.id);
      setQuestProgress(cleared);
    }
    setQuestInitialRun(initial);
    setQuestRunRecord(null);
    setQuestEnding(null);
    setQuestOverlay(null);
    setQuestRunKey((key) => key + 1);
  };

  const handleQuestCheckpoint = (run) => {
    if (!activeQuest) return;
    const next = saveQuestCheckpoint(questProgress, activeQuest.id, createCheckpoint(activeQuest, run));
    setQuestProgress(next);
  };

  const handleQuestFinish = (run, ending) => {
    if (!activeQuest) return;
    const next = recordQuestEnding(questProgress, activeQuest.id, run);
    setQuestProgress(next);
    setQuestRunRecord(run);
    setQuestEnding(ending);
    setQuestOverlay("result");
    if (ending?.id === activeQuest.endings[0]?.id) audio.endgame();
    else audio.chapter();
  };

  const retryQuest = () => {
    audio.click();
    setQuestRunRecord(null);
    setQuestEnding(null);
    setQuestOverlay("intro");
  };

  const goNextQuest = () => {
    if (!nextQuest) {
      backToHub();
      return;
    }
    audio.click();
    setActiveQuestId(nextQuest.id);
    setQuestOverlay("intro");
    setQuestRunRecord(null);
    setQuestEnding(null);
    setQuestInitialRun(null);
    setQuestRunKey((key) => key + 1);
  };

  const openArtifacts = () => {
    audio.click();
    setView("artifact");
    setOverlay(null);
    setQuestOverlay(null);
  };

  const openCollection = () => {
    audio.click();
    setView("collection");
    setOverlay(null);
    setQuestOverlay(null);
  };

  const handleArtifactRun = (run) => {
    const next = recordArtifactRun(run);
    setArtifactRun(next);
  };

  return (
    <div className="challenge-mode">
      <ChallengeHeader
        view={view}
        active={active}
        activeQuest={activeQuest}
        completed={completed}
        total={CHALLENGES.length}
        questDone={questDone}
        questTotal={QUESTS.length}
        endingsSeen={endingsSeen}
        endingsTotal={endingsTotal}
        artifactCount={artifactNow.total}
        artifactTotal={artifactNow.totalMax}
        sound={sound}
        onToggleSound={onToggleSound}
        onBackToHub={backToHub}
        onExit={onExit}
      />

      {view === "hub" && (
        <ChallengeHub
          progress={progress}
          questProgress={questProgress}
          artifactRun={artifactRun}
          collection={collection}
          onOpen={openChallenge}
          onOpenQuest={openQuest}
          onOpenArtifacts={openArtifacts}
          onOpenCollection={openCollection}
        />
      )}

      {view === "collection" && (
        <CollectionOverview
          collection={collection}
          onBack={backToHub}
          onOpenChallenge={openChallenge}
          onOpenQuest={openQuest}
          onOpenArtifacts={openArtifacts}
        />
      )}

      {view === "play" && active && overlay !== "intro" && (
        <ChallengePlay
          key={runKey}
          challenge={active}
          reducedMotion={reducedMotion}
          onWin={handleWin}
          onLose={handleLose}
          onBack={backToHub}
        />
      )}

      {view === "quest" && activeQuest && questOverlay !== "intro" && questInitialRun && (
        <QuestPlay
          key={questRunKey}
          quest={activeQuest}
          initialRun={questInitialRun}
          reducedMotion={reducedMotion}
          onCheckpoint={handleQuestCheckpoint}
          onFinish={handleQuestFinish}
          onBack={backToHub}
        />
      )}

      {view === "artifact" && (
        <ArtifactMode run={artifactRun} onRunChange={handleArtifactRun} onBack={backToHub} />
      )}

      {view === "play" && active && overlay === "intro" && (
        <ChallengeIntroOverlay
          challenge={active}
          target={target}
          onStart={startRun}
          onBack={backToHub}
        />
      )}

      {view === "play" && active && overlay === "result" && runRecord && (
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

      {view === "quest" && activeQuest && questOverlay === "intro" && (
        <QuestIntroOverlay
          quest={activeQuest}
          progress={questProgress}
          onStart={() => startQuest(true)}
          onRestart={() => startQuest(false)}
          onBack={backToHub}
        />
      )}

      {view === "quest" && activeQuest && questOverlay === "result" && questRunRecord && questEnding && (
        <QuestResultOverlay
          quest={activeQuest}
          run={questRunRecord}
          ending={questEnding}
          progress={questProgress}
          nextQuest={nextQuest}
          onRetry={retryQuest}
          onNext={goNextQuest}
          onBack={backToHub}
        />
      )}

      <footer className="challenge-footer">
        <span>炉外总目录 · 谜题、任务、燃尽故事与失物招领博物馆</span>
        <span>谜题与任务无失败 · 燃尽仍有次数 · 遗物的赝品也是馆藏</span>
      </footer>
    </div>
  );
}

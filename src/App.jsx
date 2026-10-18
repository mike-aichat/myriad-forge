import React, { useEffect, useMemo, useRef, useState } from "react";
import { Skyfield } from "./art/Skyfield.jsx";
import { audio } from "./audio.js";
import { pickInspirationPair } from "./game/hints.js";
import {
  currentChapter,
  fuseElements,
  loadState,
  resetState,
  saveState,
  stats as getStats,
} from "./game/progress.js";
import { ELEMENT_BY_ID, isEndgame } from "./game/recipes.js";
import { Forge } from "./ui/Forge.jsx";
import { Journal } from "./ui/Journal.jsx";
import { Library } from "./ui/Library.jsx";
import { TopBar } from "./ui/TopBar.jsx";
import { ChapterOverlay, DiscoveryOverlay, EndingOverlay, IntroOverlay, Toast } from "./ui/Overlays.jsx";
import { ElementDetailModal, HelpModal, StoryModal } from "./ui/Modals.jsx";
import { ChallengeMode } from "./challenge/ChallengeMode.jsx";

const BOREDOM_LINES = [
  "它们互相看了一眼，决定不熟。",
  "炉底冒出一小股烟，什么也没留下。",
  "两种存在礼貌地错开了。",
  "熔炉打了个哈欠。",
  "有东西一闪而过，没留下任何东西。",
  "它们交换了秘密，然后各自散了。",
  "灰烬翻了个身，继续睡。",
];

function failureLine(a, b) {
  if (a && b && a.category === b.category) {
    return `${a.name}和${b.name}太像了，互相没有新鲜话可说。`;
  }
  return BOREDOM_LINES[Math.floor(Math.random() * BOREDOM_LINES.length)];
}

export default function App() {
  const [mode, setMode] = useState("main");
  const [game, setGame] = useState(() => loadState());
  const [selected, setSelected] = useState([]);
  const [overlayQueue, setOverlayQueue] = useState([]);
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showUnknown, setShowUnknown] = useState(false);
  const [toast, setToast] = useState(null);
  const [isFusing, setIsFusing] = useState(false);
  const [isInspiring, setIsInspiring] = useState(false);
  const [forgeMessage, setForgeMessage] = useState({
    tone: "idle",
    text: "从要素库里挑两样东西，放进熔炉。",
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  const fusingRef = useRef(false);
  const inspiringRef = useRef(false);
  const fuseTimerRef = useRef(null);
  const inspireTimerRef = useRef(null);
  const gameRef = useRef(game);
  const forgeRef = useRef(null);
  const searchRef = useRef(null);
  const fuseButtonRef = useRef(null);

  const chapter = useMemo(() => currentChapter(game), [game]);
  const stats = useMemo(() => getStats(game), [game]);
  const selectedElements = useMemo(
    () => selected.map((id) => ELEMENT_BY_ID.get(id)).filter(Boolean),
    [selected]
  );
  const allComplete = stats.chapters === stats.totalChapters;
  const overlay = overlayQueue[0] || null;
  const locked = Boolean(overlay || panel || !game.introSeen);

  const pushToast = (text, tone = "info") => {
    setToast({ id: Date.now(), text, tone });
  };

  useEffect(() => {
    if (mode === "main" && selected.length === 2 && !locked && !isFusing && !isInspiring) {
      fuseButtonRef.current?.focus();
    }
  }, [mode, selected.length, locked, isFusing, isInspiring]);

  useEffect(() => {
    gameRef.current = game;
    saveState(game);
  }, [game]);

  useEffect(() => {
    audio.setEnabled(game.sound);
  }, [game.sound]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    return () => {
      if (fuseTimerRef.current) window.clearTimeout(fuseTimerRef.current);
      if (inspireTimerRef.current) window.clearTimeout(inspireTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (mode !== "main") return;
      const tag = event.target?.tagName;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(tag) || event.target?.isContentEditable;
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleSound();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        if (panel || overlay) return;
        event.preventDefault();
        handleInspire();
        return;
      }
      if (event.key === "Escape") {
        if (panel) {
          setPanel(null);
          return;
        }
        if (!overlay && selected.length) {
          setSelected([]);
          setForgeMessage({ tone: "idle", text: "熔炉清空了。" });
        }
        return;
      }
      if (event.key === "Enter" && selected.length === 2 && !locked && !isInspiring) {
        const inAlchemyArea =
          event.target?.closest?.(".forge") || event.target?.closest?.(".element-grid");
        if (inAlchemyArea) {
          event.preventDefault();
          handleFuse();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const pushOverlay = (item) => setOverlayQueue((queue) => [...queue, item]);

  const openElement = (element) => {
    if (!element) return;
    setPanel({ type: "element", element });
  };

  const closePanel = () => {
    setPanel(null);
  };

  const handleSelect = (id) => {
    if (isFusing || locked || inspiringRef.current) return;
    const element = ELEMENT_BY_ID.get(id);
    if (!element || !game.discovered.includes(id)) return;
    if (selected.includes(id)) {
      audio.click();
      const next = selected.filter((item) => item !== id);
      setSelected(next);
      setForgeMessage({ tone: "idle", text: `把${element.name}从炉里取了出来。` });
      return;
    }
    if (selected.length >= 2) {
      pushToast("熔炉里已经有两种要素了。先熔炼，或者取出一个。", "warn");
      audio.fail();
      return;
    }
    audio.select();
    const next = [...selected, id];
    setSelected(next);
    setForgeMessage({
      tone: "idle",
      text:
        next.length === 1
          ? `「${element.name}」已经就位。再选一样。`
          : "两种要素就位。按下熔炼，或者按 Enter。",
    });
  };

  const handleRemove = (index) => {
    if (isFusing || inspiringRef.current) return;
    const next = selected.filter((_, itemIndex) => itemIndex !== index);
    setSelected(next);
    audio.click();
    setForgeMessage({ tone: "idle", text: next.length ? "一个位置空了出来。" : "熔炉清空了。" });
  };

  const handleClear = () => {
    if (isFusing || inspiringRef.current) return;
    setSelected([]);
    audio.click();
    setForgeMessage({ tone: "idle", text: "熔炉清空了。" });
  };

  const handleAddFromDetail = (id) => {
    if (locked || isFusing || inspiringRef.current) return;
    if (selected.includes(id)) {
      pushToast("它已经在炉里了。", "warn");
      return;
    }
    if (selected.length >= 2) {
      pushToast("熔炉已满，先熔炼或取出一个。", "warn");
      return;
    }
    const element = ELEMENT_BY_ID.get(id);
    setSelected([...selected, id]);
    audio.select();
    setPanel(null);
    setForgeMessage({ tone: "idle", text: `「${element.name}」被放进了熔炉。` });
  };

  const fusePair = (aId, bId) => {
    if (fusingRef.current || locked || mode !== "main" || !aId || !bId) return;
    fusingRef.current = true;
    const a = ELEMENT_BY_ID.get(aId);
    const b = ELEMENT_BY_ID.get(bId);
    const result = fuseElements(gameRef.current, aId, bId);
    setGame(result.state);
    setIsFusing(true);
    audio.fuse();
    setForgeMessage({ tone: "idle", text: "炉火正在翻动那一页……" });
    if (fuseTimerRef.current) window.clearTimeout(fuseTimerRef.current);
    fuseTimerRef.current = window.setTimeout(() => {
      fuseTimerRef.current = null;
      setIsFusing(false);
      setSelected([]);
      fusingRef.current = false;

      if (!result.resultId) {
        audio.fail();
        setForgeMessage({ tone: "fail", text: failureLine(a, b) });
        if (result.bonusInsight) {
          pushToast("连续失败让炉底闪了一下：灵光 +1", "insight");
        }
        return;
      }

      const element = ELEMENT_BY_ID.get(result.resultId);
      setForgeMessage({
        tone: "success",
        text: result.isNew
          ? `熔成了「${element.name}」。这是新的一页。`
          : `${a.name}和${b.name}再次熔成了「${element.name}」。这一页早已写过。`,
      });

      if (!result.isNew) {
        audio.select();
        return;
      }

      audio[isEndgame(element.id) ? "endgame" : "discover"]();
      if (result.milestone) pushToast("图鉴又厚了一页：灵光 +1", "insight");
      if (result.bonusInsight && !result.milestone) pushToast("炉底浮出一粒灵光：+1", "insight");

      pushOverlay({
        type: "discovery",
        element,
        endgame: isEndgame(element.id),
        milestone: result.milestone,
        recipeNames: [a.name, b.name],
      });

      for (const event of result.chapterEvents) {
        pushOverlay({
          type: "chapter",
          chapter: event.chapter,
          unlocked: event.unlocked,
          insight: event.insight,
        });
        if (event.chapter.ending) {
          pushOverlay({ type: "ending" });
        }
      }
    }, 620);
  };

  const handleFuse = () => {
    if (inspiringRef.current || selected.length !== 2) return;
    fusePair(selected[0], selected[1]);
  };

  const handleInspire = () => {
    if (locked || isFusing || inspiringRef.current) return;
    if (game.insight < 1) {
      pushToast("灵光用尽了。发现新要素、写完手记，或者连续失败都会让灵光重新聚起来。", "warn");
      return;
    }
    const pair = pickInspirationPair(game);
    if (!pair) {
      pushToast("现有的要素凑不出新东西了。去试炼里找找别的出路吧。", "warn");
      return;
    }
    const [a, b] = pair;
    inspiringRef.current = true;
    setIsInspiring(true);
    setGame((current) => ({ ...current, insight: current.insight - 1 }));
    setSelected([a.id, b.id]);
    setForgeMessage({
      tone: "idle",
      text: `灵光挑中了「${a.name}」和「${b.name}」。炉火正在把它们推到一处……`,
    });
    pushToast(`灵光挑中了「${a.name}」与「${b.name}」。`, "insight");
    audio.select();
    forgeRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
    if (inspireTimerRef.current) window.clearTimeout(inspireTimerRef.current);
    inspireTimerRef.current = window.setTimeout(() => {
      inspireTimerRef.current = null;
      inspiringRef.current = false;
      setIsInspiring(false);
      fusePair(a.id, b.id);
    }, 650);
  };

  const toggleSound = () => {
    const next = !game.sound;
    audio.setEnabled(next);
    setGame({ ...game, sound: next });
    if (next) audio.click();
  };

  const openStory = () => {
    audio.click();
    setPanel({ type: "story" });
  };

  const openHelp = () => {
    audio.click();
    setPanel({ type: "help" });
  };

  const handleUnknown = () => {
    audio.fail();
    pushToast("那一格还没有被熔出来。它的轮廓在等你。", "info");
  };

  const startGame = () => {
    audio.setEnabled(game.sound);
    if (game.sound) audio.select();
    setGame({ ...game, introSeen: true });
    setForgeMessage({ tone: "idle", text: "从要素库里挑两样东西，放进熔炉。" });
  };

  const handleReset = () => {
    if (fuseTimerRef.current) {
      window.clearTimeout(fuseTimerRef.current);
      fuseTimerRef.current = null;
    }
    if (inspireTimerRef.current) {
      window.clearTimeout(inspireTimerRef.current);
      inspireTimerRef.current = null;
    }
    fusingRef.current = false;
    inspiringRef.current = false;
    setIsFusing(false);
    setIsInspiring(false);
    setGame(resetState());
    setSelected([]);
    setPanel(null);
    setOverlayQueue([]);
    setToast(null);
    setQuery("");
    setCategory("all");
    setShowUnknown(false);
    setForgeMessage({ tone: "idle", text: "炉火重新点燃。进度回到四种源初要素。" });
  };

  const closeOverlay = () => {
    const next = overlayQueue[1];
    if (next?.type === "chapter") audio.chapter();
    if (next?.type === "ending") audio.endgame();
    setOverlayQueue((queue) => queue.slice(1));
  };

  const handleOpenElementFromStory = (element) => {
    setPanel({ type: "element", element });
  };

  const enterChallenges = () => {
    audio.click();
    if (inspireTimerRef.current) {
      window.clearTimeout(inspireTimerRef.current);
      inspireTimerRef.current = null;
    }
    inspiringRef.current = false;
    setIsInspiring(false);
    setSelected([]);
    setPanel(null);
    setOverlayQueue([]);
    setToast(null);
    setMode("challenges");
  };

  const exitChallenges = () => {
    audio.click();
    setMode("main");
  };

  return (
    <div className="app-shell">
      <Skyfield reducedMotion={reducedMotion} />
      <div className="ambient-grain" aria-hidden="true" />

      {mode === "challenges" ? (
        <ChallengeMode
          onExit={exitChallenges}
          sound={game.sound}
          onToggleSound={toggleSound}
          reducedMotion={reducedMotion}
        />
      ) : (
        <>
      <TopBar
        stats={stats}
        chapter={chapter}
        sound={game.sound}
        onStory={openStory}
        onToggleSound={toggleSound}
        onHelp={openHelp}
        onChallenges={enterChallenges}
      />

      <main className="game-layout">
        <Forge
          selectedElements={selectedElements}
          onRemove={handleRemove}
          onClear={handleClear}
          onFuse={handleFuse}
          onOpenInfo={openElement}
          isFusing={isFusing}
          isInspiring={isInspiring}
          message={forgeMessage}
          stats={stats}
          reducedMotion={reducedMotion}
          fuseButtonRef={fuseButtonRef}
          sectionRef={forgeRef}
        />

        <Journal
          chapter={chapter}
          state={game}
          onOpenStory={openStory}
          onOpenElement={openElement}
          allComplete={allComplete}
          stats={stats}
        />

        <Library
          state={game}
          selected={selected}
          onSelect={handleSelect}
          onInfo={openElement}
          onUnknown={handleUnknown}
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          showUnknown={showUnknown}
          setShowUnknown={setShowUnknown}
          searchRef={searchRef}
          insight={game.insight}
          onInspire={handleInspire}
          inspireDisabled={isFusing || isInspiring}
          isInspiring={isInspiring}
        />
      </main>

      <footer className="footer">
        <p>万象熔炉 · 要素合成游戏</p>
        <p className="footer__note">全部要素图案均为本作原创 · 进度自动保存在本地</p>
        <p className="footer__keys">
          <kbd>Enter</kbd> 熔炼 <span>·</span> <kbd>/</kbd> 搜索 <span>·</span> <kbd>M</kbd> 声音
        </p>
      </footer>

      {overlay?.type === "discovery" && (
        <DiscoveryOverlay
          overlay={overlay}
          onClose={closeOverlay}
          discoveredCount={game.discovered.length}
        />
      )}
      {overlay?.type === "chapter" && <ChapterOverlay overlay={overlay} onClose={closeOverlay} />}
      {overlay?.type === "ending" && <EndingOverlay onClose={closeOverlay} stats={stats} />}

      {!overlay && panel?.type === "element" && (
        <ElementDetailModal
          element={panel.element}
          state={game}
          selected={selected}
          onAdd={handleAddFromDetail}
          onClose={closePanel}
        />
      )}
      {!overlay && panel?.type === "story" && (
        <StoryModal state={game} onClose={closePanel} onOpenElement={handleOpenElementFromStory} />
      )}
      {!overlay && panel?.type === "help" && (
        <HelpModal
          state={game}
          sound={game.sound}
          onToggleSound={toggleSound}
          onClose={closePanel}
          onReset={handleReset}
        />
      )}

      {!game.introSeen && <IntroOverlay onStart={startGame} />}

      <Toast toast={toast} />
        </>
      )}
    </div>
  );
}

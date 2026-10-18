import React from "react";
import { CATEGORY_MAP } from "../data/categories.js";
import { ARTIFACT_TIERS } from "../data/artifacts.js";
import { Sprite } from "../ui/Sprite.jsx";
import { resolveChallengeElement } from "./engine.js";

function ProgressRow({ label, current, total, note }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="collection-progress__row">
      <div className="collection-progress__label">
        <span>{label}</span>
        <b>{current} <em>/ {total}</em></b>
      </div>
      <div className="collection-progress__bar">
        <i style={{ width: `${percent}%` }} />
      </div>
      {note && <p>{note}</p>}
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <article className={`collection-badge ${badge.unlocked ? "is-unlocked" : ""}`}>
      <span className="collection-badge__sigil" aria-hidden="true">{badge.unlocked ? badge.sigil : "？"}</span>
      <div className="collection-badge__copy">
        <span className="eyebrow">{badge.unlocked ? "已获得" : "未获得"}</span>
        <h3>{badge.name}</h3>
        <p>{badge.note}</p>
        <div className="collection-badge__progress">
          <div><i style={{ width: `${badge.percent}%` }} /></div>
          <span>{badge.current} / {badge.goal}</span>
        </div>
      </div>
    </article>
  );
}

function QuestEndingCard({ ending }) {
  if (!ending.seen) {
    return (
      <article className={`collection-ending is-locked ${ending.isTrue ? "is-true" : ""}`}>
        <span className="collection-ending__kind">{ending.isTrue ? "真结局" : "未抵达"}</span>
        <h4>？？？</h4>
        <p>
          {ending.isTrue
            ? "需要在做出选择之前完成两个可选目标。"
            : ending.optionLabel
              ? `选择「${ending.optionLabel}」之后可达。`
              : "还有一个结局没有走到。"}
        </p>
      </article>
    );
  }
  return (
    <article className={`collection-ending is-seen ${ending.isTrue ? "is-true" : ""}`}>
      <span className="collection-ending__kind">{ending.kicker}</span>
      <h4>{ending.title}</h4>
      <p>{ending.outro}</p>
      <span className="collection-ending__stamp">已收录</span>
    </article>
  );
}

function QuestCollection({ quest, onOpen }) {
  return (
    <article className="collection-quest panel" style={{ "--challenge-accent": quest.accent }}>
      <header className="collection-quest__head">
        <div>
          <p className="eyebrow">任务 · {quest.numeral}</p>
          <h3>{quest.title}</h3>
          <p>{quest.subtitle}</p>
        </div>
        <div className="collection-quest__stats">
          <span>结局 <b>{quest.endingsSeen} / {quest.endings.length}</b></span>
          <span>可选 <b>{quest.optionalsDone} / {quest.optionals.length}</b></span>
          <span>最佳 <b>{quest.bestSteps ? `${quest.bestSteps} 步` : "未记录"}</b></span>
        </div>
      </header>

      <div className="collection-ending-grid">
        {quest.endings.map((ending) => (
          <QuestEndingCard key={ending.id} ending={ending} />
        ))}
      </div>

      <div className="collection-quest__bottom">
        <div className="collection-optionals">
          {quest.optionals.map((objective) => (
            <span key={objective.id} className={objective.done ? "is-done" : ""}>
              {objective.done ? "✦" : "·"} {objective.label}
            </span>
          ))}
        </div>
        <button type="button" className="text-button" onClick={() => onOpen(quest)}>
          {quest.checkpoint ? "从检查点继续" : quest.endingsSeen ? "重走这一则" : "走进这一则"}
        </button>
      </div>
    </article>
  );
}

function TrialCard({ challenge, onOpen }) {
  const target = resolveChallengeElement(challenge.targetId);
  const category = target ? CATEGORY_MAP[target.category] : null;
  const family = challenge.family === "puzzle" ? "谜题" : "燃尽";
  return (
    <button type="button" className={`collection-trial ${challenge.completed ? "is-complete" : ""}`} onClick={() => onOpen(challenge)}>
      <div className="collection-trial__top">
        <span>{family} · {challenge.numeral}</span>
        <em>{challenge.completed ? (challenge.family === "puzzle" ? "已解开" : "已写完") : "未完成"}</em>
      </div>
      <div className="collection-trial__body">
        <div className="collection-trial__sprite">
          {target && <Sprite element={target} size={48} silhouette={!challenge.completed} />}
        </div>
        <div>
          <b>{challenge.title}</b>
          <span>{target?.name}</span>
          {category && <i style={{ "--cat": category.color }}>{category.name}</i>}
        </div>
      </div>
      <div className="collection-trial__foot">
        {challenge.completed ? (
          <>
            <span>最佳 {challenge.bestSteps} {challenge.family === "puzzle" ? "步" : "次"}</span>
            {challenge.family === "puzzle" ? (
              <span className="collection-trial__stars" aria-label={`${challenge.rating} 星`}>
                {[1, 2, 3].map((star) => (
                  <i key={star} className={star <= challenge.rating ? "is-lit" : ""}>✦</i>
                ))}
              </span>
            ) : (
              <span>余烬 {challenge.stepLimit}</span>
            )}
          </>
        ) : (
          <span>{challenge.family === "puzzle" ? `Par ${challenge.par}` : `余烬 ${challenge.stepLimit}`}</span>
        )}
      </div>
    </button>
  );
}

function MuseumCollections({ collection, onOpenArtifacts }) {
  const { stats, trueItems, fakeItems, curatorStage: stage } = collection;
  return (
    <section className="collection-museum panel">
      <header className="collection-section-head">
        <div>
          <p className="eyebrow">ARTIFACTS · 真品厅与误会厅</p>
          <h3>馆藏总览</h3>
          <p>{stage.line}</p>
        </div>
        <div className="collection-section-head__side">
          <span><b>{stats.trueArtifacts}</b> / {stats.trueArtifactTotal} 真品</span>
          <span><b>{stats.fakeArtifacts}</b> / {stats.fakeArtifactTotal} 误会</span>
          <button type="button" className="text-button" onClick={onOpenArtifacts}>进入失物招领馆 →</button>
        </div>
      </header>

      <div className="collection-museum__hall">
        <span className="eyebrow">真品厅 · {stats.trueArtifacts} / {stats.trueArtifactTotal}</span>
        <div className="collection-artifact-grid">
          {trueItems.map((artifact) => (
            <div key={artifact.id} className={`collection-artifact ${artifact.found ? "is-found" : ""}`}>
              <Sprite element={artifact} size={38} silhouette={!artifact.found} />
              <span>{artifact.found ? artifact.name : "？？？"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="collection-museum__hall">
        <span className="eyebrow">误会厅 · {stats.fakeArtifacts} / {stats.fakeArtifactTotal}</span>
        <div className="collection-artifact-grid collection-artifact-grid--fakes">
          {fakeItems.map((exhibit) => (
            <div key={exhibit.id} className={`collection-artifact ${exhibit.found ? "is-found" : ""}`}>
              <Sprite element={exhibit} size={34} silhouette={!exhibit.found} />
              <span>{exhibit.found ? exhibit.name : "尚未误会"}</span>
              {exhibit.found && <em>{ARTIFACT_TIERS[exhibit.tier].name}</em>}
            </div>
          ))}
        </div>
      </div>

      {stats.museumComplete && (
        <div className="collection-museum__final">
          <span aria-hidden="true">✦</span>
          <div>
            <b>馆长的辞职信（真品）</b>
            <p>这是本馆唯一一件不需要鉴定的东西。老白已经下班了。</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function CollectionOverview({ collection, onBack, onOpenChallenge, onOpenQuest, onOpenArtifacts }) {
  const { stats, badges, badgeUnlocked, quests, puzzles, embers } = collection;

  return (
    <main className="collection-overview">
      <section className="collection-hero panel">
        <div className="collection-hero__copy">
          <p className="eyebrow">COLLECTION OVERVIEW · 炉外收藏总览</p>
          <h2>收藏总览</h2>
          <p>
            这里统计八页试炼、三则任务的十二个结局、六个可选目标，以及失物招领博物馆的
            三十二件馆藏。没抵达的结局和没发现的展品只显示空位。
          </p>
          <div className="collection-hero__numbers">
            <span><b>{stats.overallPercent}%</b> 炉外完成度</span>
            <span><b>{badgeUnlocked}</b> / {badges.length} 徽章</span>
            <span><b>{stats.endingsSeen}</b> / {stats.endingTotal} 结局</span>
            <span><b>{stats.artifactsFound}</b> / {stats.artifactTotal} 馆藏</span>
          </div>
        </div>
        <div className="collection-hero__seal" aria-hidden="true">
          <span>{stats.overallPercent}</span>
          <em>%</em>
          <i>炉外</i>
        </div>
      </section>

      <section className="collection-progress panel">
        <div className="collection-section-head">
          <div>
            <p className="eyebrow">PROGRESS · 四族完成度</p>
            <h3>四族进度</h3>
          </div>
          <span className="collection-progress__overall">{stats.overallCurrent} / {stats.overallTotal} 总进度</span>
        </div>
        <div className="collection-progress__grid">
          <ProgressRow
            label="试炼"
            current={stats.challengeCompleted}
            total={stats.challengeTotal}
            note={`谜题 ${stats.puzzleCompleted}/${stats.puzzleTotal} · 燃尽 ${stats.emberCompleted}/${stats.emberTotal} · Par ${stats.parPuzzles}/${stats.puzzleTotal}`}
          />
          <ProgressRow
            label="任务结局"
            current={stats.endingsSeen}
            total={stats.endingTotal}
            note={`任务 ${stats.questsWithEnding}/${stats.questTotal} 已抵达 · 真结局 ${stats.trueEndingsSeen}/${stats.trueEndingTotal} · 可选 ${stats.optionalDone}/${stats.optionalTotal}`}
          />
          <ProgressRow
            label="馆藏"
            current={stats.artifactsFound}
            total={stats.artifactTotal}
            note={`真品 ${stats.trueArtifacts}/${stats.trueArtifactTotal} · 赝品 ${stats.fakeArtifacts}/${stats.fakeArtifactTotal}`}
          />
        </div>
      </section>

      <section className="collection-badges-section">
        <div className="collection-section-head">
          <div>
            <p className="eyebrow">BADGES · 完成度徽章</p>
            <h3>炉外徽章 · {badgeUnlocked} / {badges.length}</h3>
          </div>
          <p>未获得的徽章也会显示当前进度，不必一次做完。</p>
        </div>
        <div className="collection-badges">
          {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      </section>

      <section className="collection-endings-section">
        <div className="collection-section-head">
          <div>
            <p className="eyebrow">ENDINGS · 任务结局图鉴</p>
            <h3>十二个任务结局</h3>
          </div>
          <p>未抵达的结局只显示空位和条件方向；已抵达的结局会保留尾声。</p>
        </div>
        <div className="collection-quests">
          {quests.map((quest) => (
            <QuestCollection key={quest.id} quest={quest} onOpen={onOpenQuest} />
          ))}
        </div>
      </section>

      <section className="collection-trials-section">
        <div className="collection-section-head">
          <div>
            <p className="eyebrow">TRIALS · 八页试炼记录</p>
            <h3>谜题与燃尽</h3>
          </div>
          <p>谜题按最佳步数显示 Par 星级；燃尽记录最佳熔炼次数。</p>
        </div>
        <div className="collection-trials">
          {[...puzzles, ...embers].map((challenge) => (
            <TrialCard key={challenge.id} challenge={challenge} onOpen={onOpenChallenge} />
          ))}
        </div>
      </section>

      <MuseumCollections collection={collection} onOpenArtifacts={onOpenArtifacts} />

      <footer className="collection-footer">
        <button type="button" className="primary-button" onClick={onBack}>回到炉外总目录</button>
        <span>重走不会清掉收藏，徽章会随进度点亮。</span>
      </footer>
    </main>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sprite } from "../ui/Sprite.jsx";
import { audio } from "../audio.js";
import {
  ARTIFACTS,
  ARTIFACT_FRAGMENTS,
  ARTIFACT_TIERS,
  MISIDENTIFIED,
} from "../data/artifacts.js";
import {
  artifactCounts,
  artifactComplete,
  artifactHint,
  artifactKey,
  curatorStage,
  forgeArtifact,
  tierProgress,
  TRUE_BY_ID,
  FAKE_BY_ID,
  FRAGMENT_BY_ID,
} from "./engine.js";

const SLOT_LABELS = ["I", "II", "III"];

function FragmentButton({ fragment, selectedIndex, onClick }) {
  return (
    <button
      type="button"
      className={`artifact-fragment ${selectedIndex >= 0 ? "is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selectedIndex >= 0}
      title={`${fragment.testimony}\n标签：${fragment.tags.join(" / ")}`}
    >
      <span className="artifact-fragment__slot">{selectedIndex >= 0 ? SLOT_LABELS[selectedIndex] : ""}</span>
      <Sprite element={fragment} size={38} />
      <span className="artifact-fragment__name">{fragment.name}</span>
    </button>
  );
}

function CuratorNote({ run }) {
  const stage = curatorStage(run.fakeIds.length);
  return (
    <div className="artifact-curator__stage">
      <span className="artifact-curator__portrait" aria-hidden="true">白</span>
      <div>
        <b>馆长老白</b>
        <p>{stage.line}</p>
      </div>
    </div>
  );
}

function ResultCard({ result, onReset }) {
  if (!result) {
    return (
      <div className="artifact-result artifact-result--empty">
        <span className="eyebrow">本次鉴定</span>
        <p>把三块碎片放上鉴定台。顺序不重要，故事才重要。</p>
      </div>
    );
  }

  if (result.type === "none") {
    return (
      <div className="artifact-result artifact-result--none">
        <span className="eyebrow">未命中 · 馆长吐槽</span>
        <p>{result.quip}</p>
        {result.autoHint && (
          <div className="artifact-auto-hint">
            <b>连续三次未命中，老白主动开口：</b>
            <p>{result.autoHint.text}</p>
          </div>
        )}
        <button type="button" className="text-button" onClick={onReset}>再摆一次</button>
      </div>
    );
  }

  if (result.type === "true") {
    const item = result.artifact;
    return (
      <div className="artifact-result artifact-result--true">
        <span className="eyebrow">真品入馆 · TRUE ARTIFACT</span>
        <div className="artifact-result__head">
          <Sprite element={item} size={52} />
          <div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </div>
        </div>
        <p className="artifact-result__story">{item.story}</p>
        <blockquote>{item.curatorNote}</blockquote>
        <span className="artifact-result__state">{result.isNew ? "已收入真品厅" : "真品厅已有此件"}</span>
        <button type="button" className="text-button" onClick={onReset}>继续鉴定</button>
      </div>
    );
  }

  const item = result.exhibit;
  return (
    <div className="artifact-result artifact-result--fake">
      <span className="eyebrow">收入误会厅 · MISIDENTIFIED</span>
      <div className="artifact-result__head">
        <Sprite element={item} size={52} />
        <div>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      </div>
      <span className="artifact-tier" data-tier={item.tier}>{ARTIFACT_TIERS[item.tier].name}</span>
      <blockquote>{item.curatorNote}</blockquote>
      <p className="artifact-result__review">观众留言：{item.visitorReview}</p>
      <span className="artifact-result__state">{result.isNew ? "已收入误会厅" : "误会厅已有此件"}</span>
      <button type="button" className="text-button" onClick={onReset}>继续鉴定</button>
    </div>
  );
}

function TrueGallery({ run }) {
  return (
    <section className="artifact-gallery">
      <header className="artifact-gallery__head">
        <div>
          <p className="eyebrow">真品厅 · THE TRUE HALL</p>
          <h2>八件无人认领的遗物</h2>
          <p>每一件都有三条证词。先读档案，再决定它由哪三块碎片组成。</p>
        </div>
        <span className="artifact-gallery__count">{run.trueIds.length} / {ARTIFACTS.length}</span>
      </header>
      <div className="artifact-gallery__grid">
        {ARTIFACTS.map((artifact) => {
          const found = run.trueIds.includes(artifact.id);
          return (
            <article key={artifact.id} className={`artifact-card artifact-card--true ${found ? "is-found" : ""}`}>
              <div className="artifact-card__sprite">
                <Sprite element={artifact} size={76} silhouette={!found} />
              </div>
              <div className="artifact-card__copy">
                <span className="eyebrow">{found ? "已归位" : "档案未鉴定"}</span>
                <h3>{found ? artifact.name : "？？？"}</h3>
                {found ? (
                  <>
                    <p>{artifact.description}</p>
                    <p className="artifact-card__story">{artifact.story}</p>
                    <blockquote>{artifact.curatorNote}</blockquote>
                  </>
                ) : (
                  <>
                    <ul className="artifact-card__clues">
                      {artifact.clues.map((clue) => <li key={clue}>{clue}</li>)}
                    </ul>
                    <span className="artifact-card__materials">三块碎片 · 顺序无关</span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {artifactComplete(run) && (
        <article className="artifact-final">
          <span aria-hidden="true">✦</span>
          <div>
            <p className="eyebrow">最终展品 · 真品</p>
            <h2>馆长的辞职信</h2>
            <p>这是本馆唯一一件不需要鉴定的东西。信纸很旧，落款处写着：老白，于闭馆后。</p>
          </div>
          <span className="artifact-final__seal">真</span>
        </article>
      )}
    </section>
  );
}

function FakeGallery({ run }) {
  const tiers = tierProgress(run);
  return (
    <section className="artifact-gallery">
      <header className="artifact-gallery__head">
        <div>
          <p className="eyebrow">误会厅 · THE HALL OF MISUNDERSTANDING</p>
          <h2>二十四件被认真登记的赝品</h2>
          <p>错误不是失败。只要错得有形状，馆方就会给它一张展签。</p>
        </div>
        <span className="artifact-gallery__count">{run.fakeIds.length} / {MISIDENTIFIED.length}</span>
      </header>

      <div className="artifact-tier-progress">
        {tiers.map((tier) => (
          <div key={tier.tier} className="artifact-tier-progress__item">
            <span>{tier.name} · {tier.note}</span>
            <b>{tier.found} / {tier.total}</b>
          </div>
        ))}
      </div>

      <div className="artifact-gallery__grid artifact-gallery__grid--fakes">
        {MISIDENTIFIED.map((exhibit) => {
          const found = run.fakeIds.includes(exhibit.id);
          return (
            <article key={exhibit.id} className={`artifact-card artifact-card--fake ${found ? "is-found" : ""}`}>
              <div className="artifact-card__sprite">
                <Sprite element={exhibit} size={64} silhouette={!found} />
              </div>
              <div className="artifact-card__copy">
                <span className="artifact-tier" data-tier={exhibit.tier}>{ARTIFACT_TIERS[exhibit.tier].name}</span>
                <h3>{found ? exhibit.name : "尚未误会"}</h3>
                {found ? (
                  <>
                    <p>{exhibit.description}</p>
                    <blockquote>{exhibit.curatorNote}</blockquote>
                    <p className="artifact-result__review">观众留言：{exhibit.visitorReview}</p>
                  </>
                ) : (
                  <p className="artifact-card__silent">这件展品还在等一个不正确、但足够认真的组合。</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ArtifactMode({ run, onRunChange, onBack }) {
  const [view, setView] = useState("forge");
  const [caseId, setCaseId] = useState(ARTIFACTS[0]?.id || null);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(null);
  const [message, setMessage] = useState("先读一份失物档案，或者直接开始自由鉴定。三块碎片，顺序无关。");
  const [isForging, setIsForging] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const counts = useMemo(() => artifactCounts(run), [run]);
  const activeCase = ARTIFACTS.find((item) => item.id === caseId) || null;
  const selectedFragments = selected.map((id) => FRAGMENT_BY_ID.get(id)).filter(Boolean);
  const lastFragment = selectedFragments[selectedFragments.length - 1] || null;
  const stage = curatorStage(run.fakeIds.length);

  const openArtifact = TRUE_BY_ID.get(result?.artifact?.id) || null;
  const openFake = FAKE_BY_ID.get(result?.exhibit?.id) || null;

  const resetResult = () => {
    setResult(null);
    setSelected([]);
    setMessage("把三块碎片放上鉴定台。顺序不重要，故事才重要。");
  };

  const toggleFragment = (id) => {
    if (isForging) return;
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
      setMessage(`取下了「${FRAGMENT_BY_ID.get(id)?.name}」。`);
      audio.click();
      return;
    }
    if (selected.length >= 3) {
      setMessage("鉴定台只有三个槽位。先取下一块，再放新的。");
      audio.fail();
      return;
    }
    const next = [...selected, id];
    setSelected(next);
    const fragment = FRAGMENT_BY_ID.get(id);
    setMessage(`「${fragment.name}」已经就位。证词：${fragment.testimony}`);
    audio.select();
  };

  const handleForge = () => {
    if (isForging || selected.length !== 3) return;
    setIsForging(true);
    audio.fuse();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const outcome = forgeArtifact(run, selected);
      setResult(outcome);
      setIsForging(false);
      setSelected([]);
      onRunChange(outcome.run);
      if (outcome.type === "true") {
        audio.endgame();
        setCaseId(null);
        setMessage(`真品「${outcome.artifact.name}」归位。馆长把档案合上了。`);
      } else if (outcome.type === "fake") {
        audio.discover();
        setMessage(`「${outcome.exhibit.name}」被收入误会厅。馆方认为这是一次很完整的误会。`);
      } else if (outcome.type === "none") {
        audio.fail();
        setMessage(outcome.quip);
        if (outcome.autoHint) setHint(outcome.autoHint.text);
      } else {
        audio.fail();
        setMessage(outcome.quip);
      }
    }, 620);
  };

  const handleHint = () => {
    const next = artifactHint(run);
    setHint(next.text);
    if (next.exhibit) setCaseId(null);
    audio.select();
  };

  const selectCase = (artifact) => {
    setCaseId(artifact.id);
    setView("forge");
    setMessage(`打开了「${artifact.name}」的失物档案。三条证词都在左边。`);
    audio.click();
  };

  const slotElements = selectedFragments;
  const keyPreview = selected.length === 3 ? artifactKey(selected) : null;

  return (
    <main className="artifact-mode">
      <section className="artifact-hero panel">
        <div className="artifact-hero__copy">
          <p className="eyebrow">炉外机构 · LOST & FOUND MUSEUM</p>
          <h2>失物招领博物馆</h2>
          <p>
            真品厅收藏八件无人认领的遗物，误会厅收藏二十四件鉴定错误的赝品。
            馆长老白已经去世，但还在打卡。他坚持认为，错误也应该有展签。
          </p>
          <div className="artifact-hero__stats">
            <span><b>{counts.trueCount}</b> / {counts.trueTotal} 真品</span>
            <span><b>{counts.fakeCount}</b> / {counts.fakeTotal} 误会</span>
            <span><b>{counts.total}</b> / {counts.totalMax} 馆藏</span>
            <span><b>{run.attempts}</b> 次鉴定</span>
          </div>
        </div>
        <div className="artifact-hero__seal" aria-hidden="true">
          <span>真</span>
          <i>伪</i>
        </div>
      </section>

      <div className="artifact-tabs" role="tablist" aria-label="博物馆展厅">
        <button type="button" className={view === "forge" ? "is-active" : ""} onClick={() => setView("forge")} role="tab" aria-selected={view === "forge"}>
          鉴定台
          <em>{selected.length} / 3</em>
        </button>
        <button type="button" className={view === "true" ? "is-active" : ""} onClick={() => setView("true")} role="tab" aria-selected={view === "true"}>
          真品厅
          <em>{counts.trueCount} / {counts.trueTotal}</em>
        </button>
        <button type="button" className={view === "fake" ? "is-active" : ""} onClick={() => setView("fake")} role="tab" aria-selected={view === "fake"}>
          误会厅
          <em>{counts.fakeCount} / {counts.fakeTotal}</em>
        </button>
        <button type="button" className="artifact-tabs__back" onClick={onBack}>回到炉外总目录</button>
      </div>

      {view === "forge" && (
        <>
          <div className="artifact-layout">
            <aside className="artifact-cases panel">
              <div className="artifact-panel-head">
                <span className="eyebrow">失物档案 · {ARTIFACTS.length} 份</span>
                <p>选一份档案，读三条证词。</p>
              </div>
              <div className="artifact-case-list">
                {ARTIFACTS.map((artifact) => {
                  const found = run.trueIds.includes(artifact.id);
                  return (
                    <button
                      key={artifact.id}
                      type="button"
                      className={`artifact-case ${caseId === artifact.id ? "is-active" : ""} ${found ? "is-found" : ""}`}
                      onClick={() => selectCase(artifact)}
                    >
                      <Sprite element={artifact} size={30} silhouette={!found} />
                      <span>
                        <b>{artifact.name}</b>
                        <em>{found ? "已归位" : `${artifact.clues.length} 条证词`}</em>
                      </span>
                    </button>
                  );
                })}
              </div>
              {activeCase ? (
                <div className="artifact-case-detail">
                  <span className="eyebrow">档案 · {activeCase.name}</span>
                  <ol>
                    {activeCase.clues.map((clue) => <li key={clue}>{clue}</li>)}
                  </ol>
                  <p>把三条证词对上三块碎片。证词不一定直接说出材料的名字。</p>
                </div>
              ) : (
                <div className="artifact-case-detail">
                  <span className="eyebrow">自由鉴定</span>
                  <p>没有选档案。馆方允许你先乱来，再把结果登记成误会。</p>
                </div>
              )}
            </aside>

            <section className="artifact-bench panel">
              <div className="artifact-panel-head">
                <span className="eyebrow">三槽鉴定台 · 顺序无关</span>
                <p>每一块碎片都会说话。听它们说完，再决定留哪三块。</p>
              </div>
              <div className="artifact-slots">
                {[0, 1, 2].map((index) => {
                  const fragment = slotElements[index];
                  return (
                    <div key={index} className={`artifact-slot ${fragment ? "is-filled" : ""}`}>
                      <span className="artifact-slot__label">{SLOT_LABELS[index]}</span>
                      {fragment ? (
                        <>
                          <button
                            type="button"
                            className="artifact-slot__remove"
                            onClick={() => toggleFragment(fragment.id)}
                            aria-label={`取下${fragment.name}`}
                          >
                            ×
                          </button>
                          <Sprite element={fragment} size={46} />
                          <b>{fragment.name}</b>
                          <p>{fragment.testimony}</p>
                        </>
                      ) : (
                        <span className="artifact-slot__empty">放入碎片</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={`artifact-bench__action ${isForging ? "is-forging" : ""}`}>
                <button type="button" className="fuse-button" onClick={handleForge} disabled={selected.length !== 3 || isForging}>
                  <span className="fuse-button__spark" aria-hidden="true">✦</span>
                  <span>鉴定</span>
                  <span className="fuse-button__spark" aria-hidden="true">✦</span>
                </button>
                <span>{keyPreview ? "三块碎片已经就位。馆方正在翻登记簿……" : `还差 ${3 - selected.length} 块碎片。`}</span>
              </div>

              <div className="artifact-message" aria-live="polite">
                <span aria-hidden="true">✦</span>
                <p>{message}</p>
              </div>

              {hint && (
                <div className="artifact-hint">
                  <span className="eyebrow">馆长的提示</span>
                  <p>{hint}</p>
                  <button type="button" className="text-button" onClick={() => setHint(null)}>合上提示</button>
                </div>
              )}

              <ResultCard result={result} onReset={resetResult} />
            </section>

            <aside className="artifact-curator panel">
              <div className="artifact-panel-head">
                <span className="eyebrow">馆长办公室</span>
                <p>老白拒绝承认误会厅是主展厅。</p>
              </div>
              <CuratorNote run={run} />
              <div className="artifact-curator__meter">
                <span>误会厅进度</span>
                <b>{counts.fakeCount} / {counts.fakeTotal}</b>
                <div><i style={{ width: `${(counts.fakeCount / counts.fakeTotal) * 100}%` }} /></div>
              </div>
              <div className="artifact-curator__meter">
                <span>真品厅进度</span>
                <b>{counts.trueCount} / {counts.trueTotal}</b>
                <div><i style={{ width: `${(counts.trueCount / counts.trueTotal) * 100}%` }} /></div>
              </div>
              <button type="button" className="artifact-hint-button" onClick={handleHint}>
                馆长，给点提示
              </button>
              <button type="button" className="text-button" onClick={() => setView("true")}>去真品厅看看</button>
              <button type="button" className="text-button" onClick={() => setView("fake")}>去误会厅看看</button>

              <div className="artifact-detail">
                <span className="eyebrow">正在端详的碎片</span>
                {lastFragment ? (
                  <>
                    <div className="artifact-detail__head">
                      <Sprite element={lastFragment} size={34} />
                      <b>{lastFragment.name}</b>
                    </div>
                    <p>{lastFragment.description}</p>
                    <div className="artifact-detail__tags">
                      {lastFragment.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  </>
                ) : (
                  <p>从下面的碎片池里拿起一块，它会告诉你自己记得什么。</p>
                )}
              </div>
            </aside>
          </div>

          <section className="artifact-pool panel">
            <div className="artifact-panel-head">
              <span className="eyebrow">碎片池 · {ARTIFACT_FRAGMENTS.length} 块</span>
              <p>碎片不会消耗。选错了可以取下，也可以把同一个错误再犯一次。</p>
            </div>
            <div className="artifact-fragment-grid">
              {ARTIFACT_FRAGMENTS.map((fragment) => (
                <FragmentButton
                  key={fragment.id}
                  fragment={fragment}
                  selectedIndex={selected.indexOf(fragment.id)}
                  onClick={() => toggleFragment(fragment.id)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {view === "true" && <TrueGallery run={run} />}
      {view === "fake" && <FakeGallery run={run} />}

      <footer className="artifact-footer">
        <span>{stage.line}</span>
        <span>{openArtifact ? `刚刚归位：${openArtifact.name}` : openFake ? `刚刚误会：${openFake.name}` : "馆方提醒：赝品也是内容。"}</span>
      </footer>
    </main>
  );
}

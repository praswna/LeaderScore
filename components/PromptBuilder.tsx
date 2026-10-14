"use client";

import { useState } from "react";
import CopyButton from "./CopyButton.tsx";
import LeaderSelect from "./LeaderSelect.tsx";
import { buildPrompt, CRITERIA, parseResponse, type Weights } from "@/lib/prompt.ts";
import { formatScore, sumScores, tone } from "@/lib/scoring.ts";
import type { LeaderView } from "@/lib/types.ts";

const MAX_WEIGHT = 3;

export default function PromptBuilder({ leaders }: { leaders: LeaderView[] }) {
  const [leaderId, setLeaderId] = useState(leaders[0]?.id ?? "");
  const [weights, setWeights] = useState<Weights>({});
  const [extra, setExtra] = useState("");
  const [response, setResponse] = useState("");

  const leader = leaders.find((l) => l.id === leaderId);
  if (!leader) return <div className="page"><h1 className="title">AI 프롬프트</h1><p className="empty">채점된 지도자가 없습니다.</p></div>;

  // 칩 탭: 꺼짐 → ×1 → ×2 → ×3 → 꺼짐
  const cycle = (c: string) =>
    setWeights((w) => {
      const next = ((w[c] ?? 0) + 1) % (MAX_WEIGHT + 1);
      const { [c]: _, ...rest } = w;
      return next ? { ...rest, [c]: next } : rest;
    });

  const parsed = response.trim() ? parseResponse(response, leader.events.map((e) => e.id)) : null;

  return (
    <div className="page">
      <h1 className="title">AI 프롬프트</h1>
      <div className="form scroll-y">
        <LeaderSelect leaders={leaders} value={leaderId} onChange={(id) => { setLeaderId(id); setResponse(""); }} />

        <span className="label">평가 기준 <small>탭할 때마다 ×1 → ×2 → ×3 → 해제</small></span>
        <div className="chips">
          {CRITERIA.map((c) => (
            <button key={c} className={`chip ${weights[c] ? "on" : ""}`} onClick={() => cycle(c)}>
              {c}{weights[c] ? ` ×${weights[c]}` : ""}
            </button>
          ))}
        </div>
        <input className="input" placeholder="기준 직접 입력 (예: 전쟁 피해는 크게 감점)" value={extra} onChange={(e) => setExtra(e.target.value)} />

        <CopyButton text={buildPrompt(leader, weights, extra)} label="프롬프트 복사" />

        <textarea className="input paste" placeholder="AI 응답 붙여넣기" value={response} onChange={(e) => setResponse(e.target.value)} />

        {parsed && !parsed.ok && <p className="error">{parsed.error}</p>}
        {parsed?.ok && <Result leader={leader} scores={parsed.result.events} summary={parsed.result.summary} />}
      </div>
    </div>
  );
}

function Result({ leader, scores, summary }: {
  leader: LeaderView;
  scores: { id: string; score: number }[];
  summary: string;
}) {
  const mine = new Map(scores.map((s) => [s.id, s.score]));
  const after = sumScores(leader.events.map((e) => ({ ...e, score: mine.get(e.id)! })));
  return (
    <section className="result">
      <div className="row">
        <span className="sp muted">결과 (저장 안 됨)</span>
        <span className="big"><span className="muted">{formatScore(leader.total)} →</span> <b className={tone(after.total)}>{formatScore(after.total)}</b></span>
      </div>
      <div className="row muted small">
        <span className="sp">공 {formatScore(leader.merit)} → <span className="pos">{formatScore(after.merit)}</span></span>
        <span>과 {formatScore(leader.fault)} → <span className="neg">{formatScore(after.fault)}</span></span>
      </div>
      <div className="diff">
        {leader.events.map((e) => {
          const s = mine.get(e.id)!;
          return (
            <div key={e.id} className="row small">
              <span className="sp">{e.title}</span>
              <span className="muted">{formatScore(e.score!)} →</span>
              <span className={`${tone(s)} ${s !== e.score ? "changed" : ""}`}>{formatScore(s)}</span>
            </div>
          );
        })}
      </div>
      {summary && <p className="summary">{summary}</p>}
    </section>
  );
}

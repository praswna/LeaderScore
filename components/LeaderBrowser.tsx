"use client";

import { useEffect, useRef, useState } from "react";
import Seg from "./Seg.tsx";
import {
  countryOf, dynastiesOf, formatReign, formatScore, formatYear, sortCountries, sortEvents,
  sortLeadersByScore, sortLeadersByTime, tone,
} from "@/lib/scoring.ts";
import type { LeaderEvent, LeaderView } from "@/lib/types.ts";

type View = "card" | "list";
type Sort = "time" | "score";
export type Role = "all" | "ruler" | "official";

const NO_DYNASTY = "";

/** [전체|통치자|관료] 필터에 각 개수를 붙인다 */
export function roleOptions(leaders: LeaderView[]): [Role, string, number][] {
  const rulers = leaders.filter((l) => l.isRuler).length;
  return [["all", "전체", leaders.length], ["ruler", "통치자", rulers], ["official", "관료", leaders.length - rulers]];
}

export default function LeaderBrowser({ leaders }: { leaders: LeaderView[] }) {
  const countries = sortCountries(leaders.map(countryOf));

  const [country, setCountry] = useState(countries[0]);
  const [dynastyPick, setDynasty] = useState<string | null>(null);
  const [view, setView] = useState<View>("card");
  const [sort, setSort] = useState<Sort>("time");
  const [role, setRole] = useState<Role>("all");
  const [cardTarget, setCardTarget] = useState<string | undefined>();

  // 랭킹에서 /?leader=id 로 들어오면 그 지도자의 탭과 카드로 이동 (페이지는 정적이라 주소는 브라우저에서 읽는다)
  useEffect(() => {
    const focus = leaders.find((l) => l.id === new URLSearchParams(location.search).get("leader"));
    if (!focus) return;
    setCountry(countryOf(focus));
    setDynasty(focus.dynasty);
    setCardTarget(focus.id);
  }, [leaders]);

  const inCountry = leaders.filter((l) => countryOf(l) === country);
  const dynasties = dynastiesOf(leaders, country);
  if (dynasties.length && inCountry.some((l) => !l.dynasty)) dynasties.push(NO_DYNASTY);
  const dynasty = dynastyPick !== null && dynasties.includes(dynastyPick) ? dynastyPick : dynasties[0];
  const shown = dynasties.length ? inCountry.filter((l) => l.dynasty === dynasty) : inCountry;

  if (!leaders.length) return <p className="empty">아직 등록된 지도자가 없습니다.</p>;

  return (
    <div className="page">
      <div className="tabs-1 scroll-x">
        {countries.map((c) => (
          <button key={c} className={c === country ? "on" : ""} onClick={() => { setCountry(c); setDynasty(null); }}>
            {c}<span className="count">{leaders.filter((l) => countryOf(l) === c).length}</span>
          </button>
        ))}
      </div>
      {dynasties.length > 0 && (
        <div className="tabs-2 scroll-x">
          {dynasties.map((d) => (
            <button key={d || "-"} className={d === dynasty ? "on" : ""} onClick={() => setDynasty(d)}>
              {d || "기타"}<span className="count">{inCountry.filter((l) => l.dynasty === d).length}</span>
            </button>
          ))}
        </div>
      )}
      <div className="toolbar">
        <Seg options={[["card", "카드"], ["list", "리스트"]]} value={view} onChange={setView} />
        {view === "list" && <Seg options={roleOptions(shown)} value={role} onChange={setRole} />}
        <span className="sp" />
        <Seg options={[["time", "시간순"], ["score", "점수순"]]} value={sort} onChange={setSort} />
      </div>

      {view === "card" ? (
        <Cards key={`${country}/${dynasty ?? ""}`} leaders={sortLeadersByTime(shown)} sort={sort} targetId={cardTarget} />
      ) : (
        <List
          leaders={(sort === "time" ? sortLeadersByTime : sortLeadersByScore)(
            shown.filter((l) => role === "all" || (role === "ruler") === l.isRuler),
          )}
          onPick={(id) => { setCardTarget(id); setView("card"); }}
        />
      )}
    </div>
  );
}

function Cards({ leaders, sort, targetId }: { leaders: LeaderView[]; sort: Sort; targetId?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const ids = leaders.map((l) => l.id).join();

  useEffect(() => {
    const el = targetId && track.current?.querySelector<HTMLElement>(`[data-id="${targetId}"]`);
    if (el) el.scrollIntoView({ block: "nearest", inline: "start" });
    else track.current?.scrollTo({ left: 0 });
  }, [targetId, ids]);

  // 카드 한 장 너비(간격 포함)만큼 이동. 스와이프가 안 되는 PC용 버튼과 키보드 ← →
  const step = () => {
    const card = track.current?.querySelector<HTMLElement>(".card");
    return card ? card.offsetWidth + parseFloat(getComputedStyle(track.current!).columnGap || "0") : 0;
  };
  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!leaders.length) return <p className="empty">지도자가 없습니다.</p>;
  return (
    <div className="track-wrap">
      <div className="track" ref={track} onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / (step() || 1)))}>
        {leaders.map((l) => <Card key={l.id} leader={l} sort={sort} />)}
      </div>
      {index > 0 && <Chevron dir={-1} onClick={() => go(-1)} />}
      {index < leaders.length - 1 && <Chevron dir={1} onClick={() => go(1)} />}
    </div>
  );
}

function Chevron({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button className={`chevron ${dir > 0 ? "next" : "prev"}`} onClick={onClick} aria-label={dir > 0 ? "다음 지도자" : "이전 지도자"}>
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir > 0 ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
      </svg>
    </button>
  );
}

function Card({ leader: l, sort }: { leader: LeaderView; sort: Sort }) {
  const events = sortEvents(l.events, sort);
  return (
    <article className="card" data-id={l.id}>
      <div className="card-body">
        <header className="card-head">
          <div className="sp">
            <p className="meta">{l.role} · {formatReign(l.start, l.end)}</p>
            <h2 className="name">{l.name}</h2>
          </div>
          {l.scored ? <span className={`total ${tone(l.total)}`}>{formatScore(l.total)}</span> : <span className="meta">미채점</span>}
        </header>
        {l.scored ? (
          <>
            <Gauge merit={l.merit} fault={l.fault} />
            <div className="cols">
              <div className="col">{events.filter((e) => e.score! > 0).map((e) => <EventItem key={e.id} e={e} />)}</div>
              <div className="col">{events.filter((e) => e.score! < 0).map((e) => <EventItem key={e.id} e={e} />)}</div>
            </div>
          </>
        ) : (
          <div className="col">{events.map((e) => <EventItem key={e.id} e={e} />)}</div>
        )}
        {l.summary && <p className="summary">{l.summary}</p>}
      </div>
    </article>
  );
}

/** 공·과 비율 막대와 합계 */
function Gauge({ merit, fault }: { merit: number; fault: number }) {
  const sum = merit - fault || 1;
  return (
    <>
      <div className="gauge">
        <div className="pos-bg" style={{ width: `${(merit / sum) * 100}%` }} />
        <div className="neg-bg" style={{ width: `${(-fault / sum) * 100}%` }} />
      </div>
      <div className="gauge-label">
        <span className="pos">공 {formatScore(merit)}</span>
        <span className="neg">과 {formatScore(fault)}</span>
      </div>
    </>
  );
}

function EventItem({ e }: { e: LeaderEvent }) {
  const row = (
    <>
      <span className="ev-title">
        <small>{formatYear(e.year)}</small>
        {e.title}
        {e.score !== null && <i className={`bar ${tone(e.score)}-bg`} style={{ width: `${Math.abs(e.score) * 10}%` }} />}
      </span>
      {e.score !== null && <b className={tone(e.score)}>{formatScore(e.score)}</b>}
    </>
  );
  const more = [e.description, e.reason].filter(Boolean);
  if (!more.length) return <div className="item">{row}</div>;
  return (
    <details className="item">
      <summary>{row}</summary>
      {more.map((t, i) => <p key={i}>{t}</p>)}
    </details>
  );
}

function List({ leaders, onPick }: { leaders: LeaderView[]; onPick: (id: string) => void }) {
  if (!leaders.length) return <p className="empty">지도자가 없습니다.</p>;
  return (
    <div className="list scroll-y">
      <div className="li head-row">
        <span className="sp">이름 · 구분 · 재위</span><span className="num">공</span><span className="num">과</span><span className="num">종합</span>
      </div>
      {leaders.map((l) => (
        <button key={l.id} className="li" onClick={() => onPick(l.id)}>
          <span className="sp">{l.name} <small className="muted">{l.role} · {formatYear(l.start)}–</small></span>
          {l.scored ? (
            <>
              <span className={`num ${tone(l.merit)}`}>{formatScore(l.merit)}</span>
              <span className={`num ${tone(l.fault)}`}>{formatScore(l.fault)}</span>
              <b className={`num ${tone(l.total)}`}>{formatScore(l.total)}</b>
            </>
          ) : (
            <span className="muted">미채점</span>
          )}
        </button>
      ))}
    </div>
  );
}

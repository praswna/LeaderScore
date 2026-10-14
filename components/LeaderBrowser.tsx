"use client";

import { useEffect, useRef, useState } from "react";
import Seg from "./Seg.tsx";
import {
  countryOf, dynastiesOf, formatScore, formatYear, sortCountries, sortEvents,
  sortLeadersByScore, sortLeadersByTime,
} from "@/lib/scoring.ts";
import type { LeaderEvent, LeaderView } from "@/lib/types.ts";

type View = "card" | "list";
type Sort = "time" | "score";
type Role = "all" | "ruler" | "official";

const NO_DYNASTY = "";

export default function LeaderBrowser({ leaders, focusId }: { leaders: LeaderView[]; focusId?: string }) {
  const focus = leaders.find((l) => l.id === focusId);
  const countries = sortCountries(leaders.map(countryOf));

  const [country, setCountry] = useState(focus ? countryOf(focus) : countries[0]);
  const [dynastyPick, setDynasty] = useState<string | null>(focus ? focus.dynasty : null);
  const [view, setView] = useState<View>("card");
  const [sort, setSort] = useState<Sort>("time");
  const [role, setRole] = useState<Role>("all");
  const [cardTarget, setCardTarget] = useState<string | undefined>(focus?.id);

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
            {c}
          </button>
        ))}
      </div>
      {dynasties.length > 0 && (
        <div className="tabs-2 scroll-x">
          {dynasties.map((d) => (
            <button key={d || "-"} className={d === dynasty ? "on" : ""} onClick={() => setDynasty(d)}>
              {d || "기타"}
            </button>
          ))}
        </div>
      )}
      <div className="toolbar">
        <Seg options={[["card", "카드"], ["list", "리스트"]]} value={view} onChange={setView} />
        {view === "list" && <Seg options={[["all", "전체"], ["ruler", "통치자"], ["official", "관료"]]} value={role} onChange={setRole} />}
        <span className="sp" />
        <Seg options={[["time", "시간순"], ["score", "점수순"]]} value={sort} onChange={setSort} />
      </div>

      {view === "card" ? (
        <Cards leaders={sortLeadersByTime(shown)} sort={sort} targetId={cardTarget} />
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
  const ids = leaders.map((l) => l.id).join();
  useEffect(() => {
    const el = targetId && track.current?.querySelector<HTMLElement>(`[data-id="${targetId}"]`);
    if (el) el.scrollIntoView({ block: "nearest", inline: "start" });
    else track.current?.scrollTo({ left: 0 });
  }, [targetId, ids]);

  if (!leaders.length) return <p className="empty">지도자가 없습니다.</p>;
  return (
    <div className="track" ref={track}>
      {leaders.map((l) => <Card key={l.id} leader={l} sort={sort} />)}
    </div>
  );
}

function Card({ leader: l, sort }: { leader: LeaderView; sort: Sort }) {
  const events = sortEvents(l.events, sort);
  return (
    <article className="card" data-id={l.id}>
      <h2 className="name">{l.name}</h2>
      <p className="sub">
        <span className="muted">{l.role}</span>
        {l.scored ? <>종합 <b>{formatScore(l.total)}</b></> : <span className="muted">미채점</span>}
      </p>
      <div className="card-body">
        {l.scored ? (
          <div className="cols">
            <div className="col">
              <div className="head">공 {formatScore(l.merit)}</div>
              {events.filter((e) => e.score! > 0).map((e) => <EventItem key={e.id} e={e} />)}
            </div>
            <div className="col">
              <div className="head">과 {formatScore(l.fault)}</div>
              {events.filter((e) => e.score! < 0).map((e) => <EventItem key={e.id} e={e} />)}
            </div>
          </div>
        ) : (
          <div className="col">{events.map((e) => <EventItem key={e.id} e={e} />)}</div>
        )}
        {l.summary && <p className="summary">{l.summary}</p>}
      </div>
    </article>
  );
}

function EventItem({ e }: { e: LeaderEvent }) {
  const row = (
    <>
      <span className="ev-title"><small>{formatYear(e.year)}</small>{e.title}</span>
      <span>{e.score === null ? "" : formatScore(e.score)}</span>
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
              <span className="num">{formatScore(l.merit)}</span>
              <span className="num">{formatScore(l.fault)}</span>
              <span className="num">{formatScore(l.total)}</span>
            </>
          ) : (
            <span className="muted">미채점</span>
          )}
        </button>
      ))}
    </div>
  );
}

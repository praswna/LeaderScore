"use client";

import Link from "next/link";
import { useState } from "react";
import Seg from "./Seg.tsx";
import { countryOf, formatScore, sortCountries, tone } from "@/lib/scoring.ts";
import type { LeaderView } from "@/lib/types.ts";

type Role = "all" | "ruler" | "official";

export default function Ranking({ leaders }: { leaders: LeaderView[] }) {
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<Role>("all");

  const ranked = leaders
    .filter((l) => l.scored)
    .filter((l) => !country || countryOf(l) === country)
    .filter((l) => role === "all" || (role === "ruler") === l.isRuler)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="page">
      <h1 className="title">랭킹</h1>
      <div className="toolbar">
        <select className="select" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="국가">
          <option value="">전체 국가</option>
          {sortCountries(leaders.map(countryOf)).map((c) => <option key={c}>{c}</option>)}
        </select>
        <Seg options={[["all", "전체"], ["ruler", "통치자"], ["official", "관료"]]} value={role} onChange={setRole} />
      </div>
      <div className="list scroll-y">
        {ranked.length === 0 && <p className="empty">채점된 지도자가 없습니다.</p>}
        {ranked.map((l, i) => (
          <Link key={l.id} href={`/?leader=${encodeURIComponent(l.id)}`} className="li">
            <span className={`rank ${i < 3 ? "top" : ""}`}>{i + 1}</span>
            <span className="sp">{l.name} <small className="muted">{l.role} · {l.dynasty || countryOf(l)}</small></span>
            <b className={`num ${tone(l.total)}`}>{formatScore(l.total)}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { roleOptions, type Role } from "./LeaderBrowser.tsx";
import Seg from "./Seg.tsx";
import { countryOf, formatScore, sortCountries, tone } from "@/lib/scoring.ts";
import type { LeaderView } from "@/lib/types.ts";
import { useWeights } from "@/lib/useWeights.ts";
import { applyWeights, DEFAULT_WEIGHTS, describeWeights, isDefault } from "@/lib/weights.ts";

export default function Ranking({ leaders: baseLeaders }: { leaders: LeaderView[] }) {
  const [weights, setWeights] = useWeights();
  const leaders = useMemo(() => applyWeights(baseLeaders, weights), [baseLeaders, weights]);
  const [country, setCountry] = useState("");
  const [role, setRole] = useState<Role>("all");

  const scored = leaders.filter((l) => l.scored);
  const inCountry = scored.filter((l) => !country || countryOf(l) === country);
  const ranked = inCountry
    .filter((l) => role === "all" || (role === "ruler") === l.isRuler)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="page">
      <h1 className="title">랭킹</h1>
      <div className="toolbar">
        <select className="select" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="국가">
          <option value="">전체 국가 ({scored.length})</option>
          {sortCountries(scored.map(countryOf)).map((c) => (
            <option key={c} value={c}>{c} ({scored.filter((l) => countryOf(l) === c).length})</option>
          ))}
        </select>
        <Seg options={roleOptions(inCountry)} value={role} onChange={setRole} />
      </div>
      {!isDefault(weights) && (
        <div className="weights-banner">
          <span>보정치 적용 중 · {describeWeights(weights)}</span>
          <button onClick={() => setWeights(DEFAULT_WEIGHTS)}>초기화</button>
        </div>
      )}
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

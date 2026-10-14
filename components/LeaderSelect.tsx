"use client";

import { countryOf, sortCountries, sortLeadersByTime } from "@/lib/scoring.ts";
import type { LeaderView } from "@/lib/types.ts";

/** 국가별로 묶은 지도자 선택. label로 옵션 뒤에 상태를 붙일 수 있다 */
export default function LeaderSelect({
  leaders, value, onChange, label = () => "",
}: {
  leaders: LeaderView[];
  value: string;
  onChange: (id: string) => void;
  label?: (l: LeaderView) => string;
}) {
  return (
    <select className="select block" value={value} onChange={(e) => onChange(e.target.value)} aria-label="지도자">
      {sortCountries(leaders.map(countryOf)).map((c) => (
        <optgroup key={c} label={c}>
          {sortLeadersByTime(leaders.filter((l) => countryOf(l) === c)).map((l) => (
            <option key={l.id} value={l.id}>{l.name}{l.dynasty ? ` (${l.dynasty})` : ""}{label(l)}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

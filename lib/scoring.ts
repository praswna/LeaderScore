import type { Data, LeaderEvent, LeaderView } from "./types.ts";

export const COUNTRY_ORDER = ["한국", "중국", "일본", "미국", "유럽", "러시아"];
export const OTHER_COUNTRY = "기타";

const RULER_ROLES = new Set(["군주", "왕", "황제", "대통령", "총리", "수상", "실권자", "섭정"]);

export function isRuler(role: string): boolean {
  return RULER_ROLES.has(role.trim());
}

export function sumScores(events: LeaderEvent[]) {
  let merit = 0;
  let fault = 0;
  for (const e of events) {
    if (e.score === null) continue;
    if (e.score > 0) merit += e.score;
    else fault += e.score;
  }
  return { merit, fault, total: merit + fault };
}

export function buildViews(data: Data): LeaderView[] {
  const byLeader = new Map<string, LeaderEvent[]>();
  for (const e of data.events) {
    const list = byLeader.get(e.leaderId) ?? [];
    list.push(e);
    byLeader.set(e.leaderId, list);
  }
  return data.leaders.map((l) => {
    const events = byLeader.get(l.id) ?? [];
    return {
      ...l,
      events,
      ...sumScores(events),
      scored: events.length > 0 && events.every((e) => e.score !== null),
      isRuler: isRuler(l.role),
    };
  });
}

/** 고정 순서 → 목록에 없는 나라(등장 순) → 기타 */
export function sortCountries(countries: string[]): string[] {
  const unique = [...new Set(countries.map((c) => c || OTHER_COUNTRY))];
  const known = COUNTRY_ORDER.filter((c) => unique.includes(c));
  const unknown = unique.filter((c) => !COUNTRY_ORDER.includes(c) && c !== OTHER_COUNTRY);
  const other = unique.includes(OTHER_COUNTRY) ? [OTHER_COUNTRY] : [];
  return [...known, ...unknown, ...other];
}

export function countryOf(l: { country: string }): string {
  return l.country || OTHER_COUNTRY;
}

/** 왕조를 소속 지도자의 가장 이른 재위 시작 연도 순으로 정렬. 왕조가 하나도 없으면 빈 배열 */
export function dynastiesOf(leaders: LeaderView[], country: string): string[] {
  const first = new Map<string, number>();
  for (const l of leaders) {
    if (countryOf(l) !== country || !l.dynasty) continue;
    const y = l.start ?? Infinity;
    first.set(l.dynasty, Math.min(first.get(l.dynasty) ?? Infinity, y));
  }
  return [...first.entries()].sort((a, b) => a[1] - b[1]).map(([d]) => d);
}

const byYear = (a: number | null, b: number | null) => (a ?? Infinity) - (b ?? Infinity);

export function sortLeadersByTime(leaders: LeaderView[]): LeaderView[] {
  return [...leaders].sort((a, b) => byYear(a.start, b.start));
}

export function sortLeadersByScore(leaders: LeaderView[]): LeaderView[] {
  return [...leaders].sort((a, b) => Number(b.scored) - Number(a.scored) || b.total - a.total);
}

export function sortEvents(events: LeaderEvent[], by: "time" | "score"): LeaderEvent[] {
  return [...events].sort((a, b) =>
    by === "time" ? byYear(a.year, b.year) : Math.abs(b.score ?? 0) - Math.abs(a.score ?? 0),
  );
}

export function formatScore(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0";
}

export function formatYear(y: number | null): string {
  if (y === null) return "";
  return y < 0 ? `BC ${-y}` : String(y);
}

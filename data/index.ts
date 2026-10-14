import type { Data } from "../lib/types.ts";
import chinaJapan from "./china-japan.json" with { type: "json" };
import koreaAncient from "./korea-ancient.json" with { type: "json" };
import koreaJoseon from "./korea-joseon.json" with { type: "json" };
import koreaModern from "./korea-modern.json" with { type: "json" };
import russiaOther from "./russia-other.json" with { type: "json" };
import usEurope from "./us-europe.json" with { type: "json" };

// 지도자·사건 원본. DB 시드(supabase/seed.sql)와 DB 연결 전 샘플 모드가 모두 여기서 나온다.

export type ContentLeader = {
  id: string;
  name: string;
  country: string;
  dynasty: string;
  role: string;
  start: number | null;
  end: number | null;
  summary: string;
  events: { year: number | null; title: string; description: string; score: number | null; reason: string }[];
};

export const CONTENT_DATE = "2026-10-14";

export const CONTENT: ContentLeader[] = [
  ...koreaAncient, ...koreaJoseon, ...koreaModern, ...chinaJapan, ...usEurope, ...russiaOther,
] as ContentLeader[];

export function contentData(): Data {
  const data: Data = { leaders: [], events: [] };
  for (const { events, ...l } of CONTENT) {
    const scored = events.every((e) => e.score !== null);
    data.leaders.push({ ...l, dynasty: l.dynasty ?? "", summary: l.summary ?? "", scoredAt: scored ? CONTENT_DATE : "" });
    events.forEach((e, i) =>
      data.events.push({
        id: `${l.id}-${i + 1}`, leaderId: l.id, year: e.year, title: e.title,
        description: e.description ?? "", score: e.score, reason: e.reason ?? "",
      }),
    );
  }
  return data;
}

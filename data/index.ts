import type { Data } from "../lib/types.ts";
import china2 from "./china-2.json" with { type: "json" };
import chinaJapan from "./china-japan.json" with { type: "json" };
import europeModern from "./europe-modern.json" with { type: "json" };
import japan2 from "./japan-2.json" with { type: "json" };
import koreaAncient from "./korea-ancient.json" with { type: "json" };
import koreaAncient2 from "./korea-ancient-2.json" with { type: "json" };
import koreaColonial from "./korea-colonial.json" with { type: "json" };
import koreaJoseon from "./korea-joseon.json" with { type: "json" };
import koreaJoseon2 from "./korea-joseon-2.json" with { type: "json" };
import koreaModern from "./korea-modern.json" with { type: "json" };
import koreaModern2 from "./korea-modern-2.json" with { type: "json" };
import russiaOther from "./russia-other.json" with { type: "json" };
import russiaOther2 from "./russia-other-2.json" with { type: "json" };
import usEurope from "./us-europe.json" with { type: "json" };
import usEurope2 from "./us-europe-2.json" with { type: "json" };

// 지도자·사건 원본. 앱의 모든 내용이 여기서 나온다.

export type ContentLeader = {
  id: string;
  name: string;
  country: string;
  dynasty: string;
  role: string;
  start: number | null;
  end: number | null;
  summary: string;
  events: { year: number | null; title: string; description: string; score: number | null; reason: string; category: string }[];
};

export const CONTENT_DATE = "2026-10-14";

export const CONTENT: ContentLeader[] = [
  ...koreaAncient, ...koreaAncient2, ...koreaJoseon, ...koreaJoseon2, ...koreaColonial, ...koreaModern, ...koreaModern2,
  ...chinaJapan, ...china2, ...japan2, ...usEurope, ...usEurope2, ...europeModern, ...russiaOther, ...russiaOther2,
] as ContentLeader[];

export function contentData(): Data {
  const data: Data = { leaders: [], events: [] };
  for (const { events, ...l } of CONTENT) {
    const scored = events.every((e) => e.score !== null);
    data.leaders.push({ ...l, dynasty: l.dynasty ?? "", summary: l.summary ?? "", scoredAt: scored ? CONTENT_DATE : "" });
    events.forEach((e, i) =>
      data.events.push({
        id: `${l.id}-${i + 1}`, leaderId: l.id, year: e.year, title: e.title,
        description: e.description ?? "", score: e.score, reason: e.reason ?? "", category: e.category ?? "",
      }),
    );
  }
  return data;
}

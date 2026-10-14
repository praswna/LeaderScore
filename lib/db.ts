import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { contentData } from "@/data/index.ts";
import type { Data, Leader, LeaderEvent, ScoreResult } from "./types.ts";

type LeaderRow = {
  id: string; name: string; country: string; dynasty: string; role: string;
  start_year: number | null; end_year: number | null; summary: string; scored_at: string | null;
};
type EventRow = {
  id: string; leader_id: string; year: number | null; title: string;
  description: string; score: number | null; reason: string;
};

// 샘플 모드 데이터는 서버 메모리에 둔다. 페이지와 API 라우트는 번들이 달라 모듈 변수를 공유하지 못하므로 전역에 둔다.
const store = ((globalThis as { __leaderscore?: { sample: Data | null } }).__leaderscore ??= { sample: null });

export function isSampleMode(): boolean {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY;
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  return (client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}

export async function getData(): Promise<Data> {
  if (isSampleMode()) return (store.sample ??= contentData());
  const [leaders, events] = await Promise.all([
    selectAll<LeaderRow>("leaders", "id"),
    selectAll<EventRow>("events", "id"),
  ]);
  return {
    leaders: leaders.map((r): Leader => ({
      id: r.id, name: r.name, country: r.country, dynasty: r.dynasty, role: r.role,
      start: r.start_year, end: r.end_year, summary: r.summary, scoredAt: r.scored_at ?? "",
    })),
    events: events.map((r): LeaderEvent => ({
      id: r.id, leaderId: r.leader_id, year: r.year, title: r.title,
      description: r.description, score: r.score, reason: r.reason,
    })),
  };
}

/** 한 요청에 최대 1000행까지라 나눠 읽는다 */
async function selectAll<T>(table: string, orderBy: string): Promise<T[]> {
  const PAGE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db().from(table).select("*").order(orderBy).range(from, from + PAGE - 1);
    if (error) throw new Error(`DB 읽기 실패 (${table}): ${error.message}`);
    rows.push(...(data as T[]));
    if (data.length < PAGE) return rows;
  }
}

/** 검증을 마친 채점 결과를 기록한다 */
export async function saveScores(leaderId: string, result: ScoreResult): Promise<void> {
  if (isSampleMode()) {
    const data = (store.sample ??= contentData());
    for (const s of result.events) {
      const e = data.events.find((x) => x.id === s.id);
      if (e) Object.assign(e, { score: s.score, reason: s.reason });
    }
    const l = data.leaders.find((x) => x.id === leaderId);
    if (l) Object.assign(l, { summary: result.summary, scoredAt: new Date().toISOString().slice(0, 10) });
    return;
  }

  const { error } = await db().rpc("save_scores", {
    p_leader_id: leaderId,
    p_summary: result.summary,
    p_scores: result.events,
  });
  if (error) throw new Error(`DB 저장 실패: ${error.message}`);
}

import { formatYear } from "./scoring.ts";
import type { LeaderView, ScoreResult } from "./types.ts";
import { CATEGORIES } from "./weights.ts";

export const CRITERIA: readonly string[] = CATEGORIES;

export type Weights = Record<string, number>;

export function buildPrompt(leader: LeaderView, weights: Weights = {}, extra = ""): string {
  const reign = [formatYear(leader.start), formatYear(leader.end)].filter(Boolean).join("–");
  const header = [leader.country, leader.dynasty, leader.role, reign].filter(Boolean).join(", ");
  const events = leader.events
    .map((e) => `${e.id} | ${formatYear(e.year)} | ${e.title}${e.description ? ` | ${e.description}` : ""}`)
    .join("\n");

  const chosen = CRITERIA.filter((c) => weights[c]);
  const criteria: string[] = chosen.map((c) => `- ${c}: ${weights[c]}배 중요하게 본다`);
  if (extra.trim()) criteria.push(`- ${extra.trim()}`);
  const criteriaBlock = criteria.length
    ? `\n[평가 기준]\n${criteria.join("\n")}\n가중치는 점수 범위를 넓히라는 뜻이 아니다. 해당 분야와 관련된 사건을 더 비중 있게, 더 엄격하게 판단하라는 뜻이다.\n`
    : "";

  return `너는 역사 평가자다. 아래 지도자의 사건마다 나라와 백성에게 끼친 영향을 평가해 점수를 매겨라.

[지도자]
${leader.name} (${header})

[사건] id | 연도 | 제목 | 설명
${events}

[채점 규칙]
- 점수는 -10 ~ +10 정수. 0은 쓰지 않는다 (+는 공, -는 과)
- 당대의 영향과 장기적 영향을 함께 고려한다
- 모든 사건을 빠짐없이 채점한다
${criteriaBlock}
[응답 형식]
아래 JSON만 출력하라. 다른 설명은 쓰지 않는다.
{"events":[{"id":"사건id","score":7,"reason":"한 문장 근거"}],"summary":"2~3문장 총평"}`;
}

export type ParseResult = { ok: true; result: ScoreResult } | { ok: false; error: string };

/** 붙여넣은 AI 응답에서 JSON을 꺼내 사건 ID, 점수 범위, 누락을 검사한다 */
export function parseResponse(text: string, eventIds: string[]): ParseResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return { ok: false, error: "JSON을 찾을 수 없습니다" };

  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { ok: false, error: "JSON 형식이 올바르지 않습니다" };
  }

  const obj = raw as { events?: unknown; summary?: unknown };
  if (!Array.isArray(obj.events)) return { ok: false, error: "events 목록이 없습니다" };

  const known = new Set(eventIds);
  const seen = new Set<string>();
  const events: ScoreResult["events"] = [];
  for (const item of obj.events as { id?: unknown; score?: unknown; reason?: unknown }[]) {
    const id = String(item?.id ?? "");
    if (!known.has(id)) return { ok: false, error: `알 수 없는 사건 ID: ${id || "(없음)"}` };
    if (seen.has(id)) return { ok: false, error: `사건 ID 중복: ${id}` };
    const score = Number(item.score);
    if (!Number.isInteger(score) || score < -10 || score > 10 || score === 0) {
      return { ok: false, error: `${id} 점수가 −10~+10 정수(0 제외)가 아닙니다: ${String(item.score)}` };
    }
    seen.add(id);
    events.push({ id, score, reason: typeof item.reason === "string" ? item.reason : "" });
  }

  const missing = eventIds.filter((id) => !seen.has(id));
  if (missing.length) return { ok: false, error: `채점되지 않은 사건: ${missing.join(", ")}` };

  return { ok: true, result: { events, summary: typeof obj.summary === "string" ? obj.summary : "" } };
}

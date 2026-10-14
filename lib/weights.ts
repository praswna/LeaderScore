import { sumScores } from "./scoring.ts";
import type { LeaderView } from "./types.ts";

/** 사건 분야. 보정치 슬라이더와 AI 프롬프트 칩이 같은 목록을 쓴다 */
export const CATEGORIES = ["경제", "군사·안보", "인권·민생", "문화·학문", "외교", "정치·제도"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Weights = Record<Category, number>;

export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 3;
export const WEIGHT_STEP = 0.5;

export const DEFAULT_WEIGHTS: Weights = Object.fromEntries(CATEGORIES.map((c) => [c, 1])) as Weights;

export function isDefault(w: Weights): boolean {
  return CATEGORIES.every((c) => w[c] === 1);
}

/** "경제 ×2 · 인권·민생 ×0.5" — 기본값(×1)이 아닌 분야만 */
export function describeWeights(w: Weights): string {
  const changed = CATEGORIES.filter((c) => w[c] !== 1).map((c) => `${c} ×${w[c]}`);
  return changed.length ? changed.join(" · ") : "기본값";
}

/** 저장된 값에서 알 수 없는 분야·범위 밖 값은 버리고 기본값으로 채운다 */
export function sanitizeWeights(raw: unknown): Weights {
  const w = { ...DEFAULT_WEIGHTS };
  if (raw && typeof raw === "object") {
    for (const c of CATEGORIES) {
      const v = (raw as Record<string, unknown>)[c];
      if (typeof v === "number" && v >= WEIGHT_MIN && v <= WEIGHT_MAX) w[c] = Math.round(v / WEIGHT_STEP) * WEIGHT_STEP;
    }
  }
  return w;
}

/**
 * 분야별 비중을 곱한 점수로 공·과·종합을 다시 계산한다.
 * 사건의 원래 점수는 baseScore에 남기고, score에는 보정된 값(소수 가능)이 들어간다.
 */
export function applyWeights(leaders: LeaderView[], w: Weights): LeaderView[] {
  if (isDefault(w)) return leaders;
  return leaders.map((l) => {
    const events = l.events.map((e) => ({
      ...e,
      baseScore: e.score,
      score: e.score === null ? null : e.score * (w[e.category as Category] ?? 1),
    }));
    return { ...l, events, base: { merit: l.merit, fault: l.fault, total: l.total }, ...sumScores(events) };
  });
}

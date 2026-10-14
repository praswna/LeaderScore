export type Leader = {
  id: string;
  name: string;
  country: string;
  dynasty: string;
  role: string;
  start: number | null;
  end: number | null;
  summary: string;
  scoredAt: string;
};

export type LeaderEvent = {
  id: string;
  leaderId: string;
  year: number | null;
  title: string;
  description: string;
  score: number | null;
  reason: string;
  category: string;
  /** 보정치를 적용했을 때 원래 점수 */
  baseScore?: number | null;
};

export type Data = {
  leaders: Leader[];
  events: LeaderEvent[];
};

export type LeaderView = Leader & {
  events: LeaderEvent[];
  merit: number;
  fault: number;
  total: number;
  scored: boolean;
  isRuler: boolean;
  group: "ruler" | "official" | "thinker";
  /** 보정치를 적용했을 때 원래 공·과·종합 */
  base?: { merit: number; fault: number; total: number };
};

export type ScoreResult = {
  events: { id: string; score: number; reason: string }[];
  summary: string;
};

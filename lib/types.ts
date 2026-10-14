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
};

export type ScoreResult = {
  events: { id: string; score: number; reason: string }[];
  summary: string;
};

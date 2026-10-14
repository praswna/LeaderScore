import "server-only";
import { createSign } from "node:crypto";
import { sampleData } from "./sample.ts";
import type { Data, Leader, LeaderEvent, ScoreResult } from "./types.ts";

const LEADER_COLS = {
  id: "id", name: "이름", country: "국가", dynasty: "왕조", role: "구분",
  start: "재위시작", end: "재위끝", summary: "총평", scoredAt: "채점일",
} as const;
const EVENT_COLS = {
  id: "id", leaderId: "지도자id", year: "연도", title: "제목",
  description: "설명", score: "점수", reason: "근거",
} as const;

const CACHE_MS = 60_000;

// 페이지와 API 라우트는 번들이 달라 모듈 변수를 공유하지 못한다. 저장 직후 캐시를 비우려면 전역에 둔다.
const store = ((globalThis as { __leaderscore?: Store }).__leaderscore ??= { cache: null, sample: null, token: null });
type Store = {
  cache: { data: Data; at: number } | null;
  sample: Data | null;
  token: { value: string; exp: number } | null;
};

export function isSampleMode(): boolean {
  return !process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

export async function getData(): Promise<Data> {
  if (isSampleMode()) return (store.sample ??= sampleData());
  if (store.cache && Date.now() - store.cache.at < CACHE_MS) return store.cache.data;
  const { leaders, events } = await readSheet();
  store.cache = { data: { leaders: leaders.map((r) => r.item), events: events.map((r) => r.item) }, at: Date.now() };
  return store.cache.data;
}

/** 검증을 마친 채점 결과를 시트에 기록한다 */
export async function saveScores(leaderId: string, result: ScoreResult): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  if (isSampleMode()) {
    const data = (store.sample ??= sampleData());
    for (const s of result.events) {
      const e = data.events.find((x) => x.id === s.id);
      if (e) Object.assign(e, { score: s.score, reason: s.reason });
    }
    const l = data.leaders.find((x) => x.id === leaderId);
    if (l) Object.assign(l, { summary: result.summary, scoredAt: today });
    return;
  }

  const { leaders, events, leaderHeader, eventHeader } = await readSheet();
  const updates: { range: string; values: (string | number)[][] }[] = [];
  const cell = (tab: string, header: string[], col: string, row: number, value: string | number) =>
    updates.push({ range: `${tab}!${columnLetter(header.indexOf(col))}${row}`, values: [[value]] });

  for (const s of result.events) {
    const row = events.find((r) => r.item.id === s.id)?.row;
    if (!row) throw new Error(`시트에서 사건을 찾을 수 없습니다: ${s.id}`);
    cell("events", eventHeader, EVENT_COLS.score, row, s.score);
    cell("events", eventHeader, EVENT_COLS.reason, row, s.reason);
  }
  const leaderRow = leaders.find((r) => r.item.id === leaderId)?.row;
  if (!leaderRow) throw new Error(`시트에서 지도자를 찾을 수 없습니다: ${leaderId}`);
  cell("leaders", leaderHeader, LEADER_COLS.summary, leaderRow, result.summary);
  cell("leaders", leaderHeader, LEADER_COLS.scoredAt, leaderRow, today);

  await sheetsFetch("/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "RAW", data: updates }),
  });
  store.cache = null;
}

// ── 시트 읽기 ──────────────────────────────────────────

type Rows<T> = { item: T; row: number }[];

async function readSheet(): Promise<{
  leaders: Rows<Leader>; events: Rows<LeaderEvent>; leaderHeader: string[]; eventHeader: string[];
}> {
  // 서식(천 단위 쉼표 등)과 무관하게 원래 값을 읽는다
  const res = await sheetsFetch("/values:batchGet?ranges=leaders&ranges=events&valueRenderOption=UNFORMATTED_VALUE");
  const [lv, ev] = ((await res.json()) as { valueRanges: { values?: unknown[][] }[] }).valueRanges;
  const [leaderHeader, ...leaderRows] = (lv.values ?? [[]]).map((r) => r.map((v) => String(v ?? "")));
  const [eventHeader, ...eventRows] = (ev.values ?? [[]]).map((r) => r.map((v) => String(v ?? "")));
  requireColumns("leaders", leaderHeader, Object.values(LEADER_COLS));
  requireColumns("events", eventHeader, Object.values(EVENT_COLS));

  const get = (header: string[], row: string[], col: string) => (row[header.indexOf(col)] ?? "").trim();
  const num = (s: string) => (s === "" || Number.isNaN(Number(s)) ? null : Number(s));

  const leaders = leaderRows.flatMap((r, i) => {
    const g = (c: string) => get(leaderHeader, r, c);
    if (!g(LEADER_COLS.id)) return [];
    return [{
      row: i + 2,
      item: {
        id: g(LEADER_COLS.id), name: g(LEADER_COLS.name), country: g(LEADER_COLS.country),
        dynasty: g(LEADER_COLS.dynasty), role: g(LEADER_COLS.role),
        start: num(g(LEADER_COLS.start)), end: num(g(LEADER_COLS.end)),
        summary: g(LEADER_COLS.summary), scoredAt: g(LEADER_COLS.scoredAt),
      },
    }];
  });
  const events = eventRows.flatMap((r, i) => {
    const g = (c: string) => get(eventHeader, r, c);
    if (!g(EVENT_COLS.id)) return [];
    return [{
      row: i + 2,
      item: {
        id: g(EVENT_COLS.id), leaderId: g(EVENT_COLS.leaderId), year: num(g(EVENT_COLS.year)),
        title: g(EVENT_COLS.title), description: g(EVENT_COLS.description),
        score: num(g(EVENT_COLS.score)), reason: g(EVENT_COLS.reason),
      },
    }];
  });
  return { leaders, events, leaderHeader, eventHeader };
}

function requireColumns(tab: string, header: string[], cols: string[]) {
  const missing = cols.filter((c) => !header.includes(c));
  if (missing.length) throw new Error(`시트 '${tab}' 탭에 열이 없습니다: ${missing.join(", ")}`);
}

function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ── Google 인증 (서비스 계정 JWT) ───────────────────────

function serviceAccountKey(): { client_email: string; private_key: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
  // .env에서 큰따옴표로 감싸면 키 안의 \n이 실제 줄바꿈으로 바뀌어 JSON이 깨진다. 한 번 되돌려 본다.
  for (const text of [raw, raw.replace(/\n/g, "\\n")]) {
    try {
      return JSON.parse(text);
    } catch {}
  }
  throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY가 올바른 JSON이 아닙니다");
}

async function accessToken(): Promise<string> {
  if (store.token && Date.now() < store.token.exp - 60_000) return store.token.value;
  const key = serviceAccountKey();
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google 인증 실패 (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  store.token = { value: body.access_token, exp: Date.now() + body.expires_in * 1000 };
  return store.token.value;
}

async function sheetsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`시트 요청 실패 (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res;
}

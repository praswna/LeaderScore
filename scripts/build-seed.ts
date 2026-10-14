// data/*.json → supabase/seed.sql
// 실행: npm run seed
import { writeFileSync } from "node:fs";
import { CONTENT_DATE, contentData } from "../data/index.ts";

const q = (v: string | number | null) =>
  v === null ? "null" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`;

const { leaders, events } = contentData();

const leaderRows = leaders.map((l) =>
  `(${[l.id, l.name, l.country, l.dynasty, l.role, l.start, l.end, l.summary].map(q).join(", ")}, ${l.scoredAt ? q(l.scoredAt) : "null"})`,
);
const eventRows = events.map((e) =>
  `(${[e.id, e.leaderId, e.year, e.title, e.description, e.score, e.reason].map(q).join(", ")})`,
);

const sql = `-- 자동 생성 파일 (npm run seed). 직접 고치지 말고 data/*.json을 고친 뒤 다시 생성한다.
-- 내용 기준일 ${CONTENT_DATE} · 지도자 ${leaders.length}명 · 사건 ${events.length}개
-- schema.sql을 먼저 실행한 뒤 SQL Editor에 붙여넣고 Run. 다시 실행하면 같은 id의 내용·점수를 덮어쓴다.

begin;

insert into leaders (id, name, country, dynasty, role, start_year, end_year, summary, scored_at) values
${leaderRows.join(",\n")}
on conflict (id) do update set
  name = excluded.name, country = excluded.country, dynasty = excluded.dynasty, role = excluded.role,
  start_year = excluded.start_year, end_year = excluded.end_year,
  summary = excluded.summary, scored_at = excluded.scored_at;

insert into events (id, leader_id, year, title, description, score, reason) values
${eventRows.join(",\n")}
on conflict (id) do update set
  leader_id = excluded.leader_id, year = excluded.year, title = excluded.title,
  description = excluded.description, score = excluded.score, reason = excluded.reason;

commit;
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`supabase/seed.sql: 지도자 ${leaders.length}명, 사건 ${events.length}개`);

-- LeaderScore 스키마. Supabase 대시보드 → SQL Editor에 붙여넣고 Run.
-- 여러 번 실행해도 안전하다.

create table if not exists leaders (
  id          text primary key,
  name        text not null,
  country     text not null default '',
  dynasty     text not null default '',
  role        text not null default '',
  start_year  int,
  end_year    int,
  summary     text not null default '',
  scored_at   date
);

create table if not exists events (
  id           text primary key,
  leader_id    text not null references leaders(id) on delete cascade,
  year         int,
  title        text not null,
  description  text not null default '',
  score        int check (score between -10 and 10 and score <> 0),
  reason       text not null default ''
);

create index if not exists events_leader_id on events(leader_id);

-- 앱은 서버에서 secret 키로만 접근한다. 브라우저용 공개 키로는 아무것도 못 하게 막아 둔다.
alter table leaders enable row level security;
alter table events enable row level security;

-- 채점 저장: 사건 점수·근거와 지도자 총평·채점일을 한 트랜잭션으로 기록
create or replace function save_scores(p_leader_id text, p_summary text, p_scores jsonb)
returns void
language plpgsql
set search_path = public
as $$
begin
  update events e
     set score = (s->>'score')::int,
         reason = coalesce(s->>'reason', '')
    from jsonb_array_elements(p_scores) s
   where e.id = s->>'id' and e.leader_id = p_leader_id;

  update leaders
     set summary = p_summary, scored_at = current_date
   where id = p_leader_id;
end;
$$;

revoke execute on function save_scores(text, text, jsonb) from public, anon, authenticated;

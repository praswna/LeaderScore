import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTENT, contentData } from "./index.ts";
import { COUNTRY_ORDER, OTHER_COUNTRY, isRuler } from "../lib/scoring.ts";
import { CATEGORIES } from "../lib/weights.ts";

const OTHER_ROLES = new Set(["재상", "장군", "관료", "통감", "총독", "총리대신", "사상가", "독립운동가", "혁명가", "운동가"]);

test("지도자 id가 고유하고 형식이 맞다", () => {
  const ids = CONTENT.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, `중복: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test("국가와 구분 값이 정해진 목록 안에 있다", () => {
  for (const l of CONTENT) {
    assert.ok([...COUNTRY_ORDER, OTHER_COUNTRY].includes(l.country), `${l.id}: 국가 ${l.country}`);
    assert.ok(isRuler(l.role) || OTHER_ROLES.has(l.role), `${l.id}: 구분 ${l.role}`);
    assert.ok(l.name && l.summary, `${l.id}: 이름·총평`);
    assert.equal(typeof l.start, "number", `${l.id}: 재위시작`);
  }
});

test("사건은 3~8개, 점수는 −10~+10 정수(0 제외)", () => {
  for (const l of CONTENT) {
    assert.ok(l.events.length >= 3 && l.events.length <= 8, `${l.id}: 사건 ${l.events.length}개`);
    for (const e of l.events) {
      assert.ok(e.title && e.reason, `${l.id}: 제목·근거`);
      assert.equal(typeof e.year, "number", `${l.id} ${e.title}: 연도`);
      assert.ok((CATEGORIES as readonly string[]).includes(e.category), `${l.id} ${e.title}: 분야 ${e.category}`);
      assert.ok(Number.isInteger(e.score) && e.score! >= -10 && e.score! <= 10 && e.score !== 0, `${l.id} ${e.title}: ${e.score}`);
    }
  }
});

test("모든 지도자가 채점된 상태로 나온다", () => {
  const { leaders, events } = contentData();
  assert.ok(leaders.every((l) => l.scoredAt));
  assert.equal(new Set(events.map((e) => e.id)).size, events.length);
});

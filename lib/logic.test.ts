import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt, parseResponse } from "./prompt.ts";
import { sampleData } from "./sample.ts";
import { buildViews, dynastiesOf, formatScore, isRuler, sortCountries } from "./scoring.ts";

const views = buildViews(sampleData());
const sejong = views.find((l) => l.id === "sejong")!;

test("공·과·종합은 사건 점수 합", () => {
  assert.equal(sejong.merit, 33);
  assert.equal(sejong.fault, -3);
  assert.equal(sejong.total, 30);
  assert.equal(sejong.scored, true);
});

test("점수가 빈 사건이 있으면 미채점", () => {
  assert.equal(views.find((l) => l.id === "munjong")!.scored, false);
});

test("통치자/관료 구분", () => {
  assert.equal(isRuler("군주"), true);
  assert.equal(isRuler("대통령"), true);
  assert.equal(isRuler("재상"), false);
  assert.equal(isRuler("총리대신"), false);
});

test("국가는 고정 순서, 모르는 나라는 기타 앞", () => {
  assert.deepEqual(sortCountries(["기타", "유럽", "몽골", "한국", "미국"]), ["한국", "미국", "유럽", "몽골", "기타"]);
});

test("왕조는 가장 이른 재위 시작 순", () => {
  assert.deepEqual(dynastiesOf(views, "한국"), ["삼국", "고려", "조선", "대한제국"]);
  assert.deepEqual(dynastiesOf(views, "미국"), []);
});

test("점수 표기", () => {
  assert.equal(formatScore(23), "+23");
  assert.equal(formatScore(-5), "−5");
});

test("프롬프트에 사건 ID와 가중치가 들어간다", () => {
  const p = buildPrompt(sejong, { 경제: 2 }, "전쟁 피해는 감점");
  assert.match(p, /sejong-1 \| 1420 \| 집현전 확대/);
  assert.match(p, /경제: 2배/);
  assert.match(p, /전쟁 피해는 감점/);
  assert.doesNotMatch(buildPrompt(sejong), /평가 기준/);
});

const ids = ["a", "b"];

test("코드 블록에 감싼 JSON도 읽는다", () => {
  const r = parseResponse('```json\n{"events":[{"id":"a","score":3,"reason":"x"},{"id":"b","score":-2}],"summary":"s"}\n```', ids);
  assert.ok(r.ok);
  assert.deepEqual(r.result.events.map((e) => e.score), [3, -2]);
  assert.equal(r.result.summary, "s");
});

test("잘못된 응답은 이유와 함께 거부", () => {
  const bad = (t: string) => { const r = parseResponse(t, ids); assert.ok(!r.ok); return r.error; };
  assert.match(bad("그냥 글"), /JSON을 찾을 수 없습니다/);
  assert.match(bad('{"events": [}'), /형식/);
  assert.match(bad('{"events":[{"id":"z","score":1}]}'), /알 수 없는 사건 ID: z/);
  assert.match(bad('{"events":[{"id":"a","score":11},{"id":"b","score":1}]}'), /a 점수/);
  assert.match(bad('{"events":[{"id":"a","score":0},{"id":"b","score":1}]}'), /0 제외/);
  assert.match(bad('{"events":[{"id":"a","score":2.5},{"id":"b","score":1}]}'), /a 점수/);
  assert.match(bad('{"events":[{"id":"a","score":1}]}'), /채점되지 않은 사건: b/);
  assert.match(bad('{"events":[{"id":"a","score":1},{"id":"a","score":1}]}'), /중복/);
});

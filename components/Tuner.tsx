"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useWeights } from "@/lib/useWeights.ts";
import { CATEGORIES, DEFAULT_WEIGHTS, describeWeights, isDefault, WEIGHT_MAX, WEIGHT_MIN, WEIGHT_STEP } from "@/lib/weights.ts";

const OPEN_KEY = "leaderscore:tuner-open";
const OPEN_EVENT = "leaderscore:tuner-open";

/** 펼침 여부도 기억한다. 한 카드에서 펼치면 다른 카드도 펼쳐진 상태로 보인다 */
function useTunerOpen(): [boolean, (open: boolean) => void] {
  const [open, setLocal] = useState(false);
  useEffect(() => {
    try {
      setLocal(localStorage.getItem(OPEN_KEY) === "1");
    } catch {}
    const sync = (e: Event) => setLocal((e as CustomEvent<boolean>).detail);
    window.addEventListener(OPEN_EVENT, sync);
    return () => window.removeEventListener(OPEN_EVENT, sync);
  }, []);
  const set = (v: boolean) => {
    try {
      localStorage.setItem(OPEN_KEY, v ? "1" : "0");
    } catch {}
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: v }));
  };
  return [open, set];
}

/** 카드 아래에 붙는 보정치 막대. 현재 값 요약만 보이고, 누르면 TunerPanel 이 막대 아래로 열린다 */
export default function Tuner() {
  const [weights] = useWeights();
  const [open, setOpen] = useTunerOpen();
  return (
    <button className={`tuner-bar ${open ? "open" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="tuner-title">보정치</span>
      <span className={`tuner-sum ${isDefault(weights) ? "" : "on"}`}>{describeWeights(weights)}</span>
      <svg className="tuner-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );
}

/**
 * 분야별 보정치 슬라이더. 값은 모든 카드·랭킹에 공통이라 카드 묶음마다 하나만 둔다.
 * 카드는 넘치는 부분을 잘라내므로, 화면에 보이는 카드의 막대 바로 아래에 고정 위치로 띄워
 * 하단 메뉴를 덮으며 아래로 열린다.
 */
export function TunerPanel() {
  const [weights, setWeights] = useWeights();
  const [open] = useTunerOpen();
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const bar = [...document.querySelectorAll<HTMLElement>(".tuner-bar")]
        .map((el) => el.getBoundingClientRect())
        .find((r) => r.left >= 0 && r.right <= window.innerWidth);
      setBox(bar ? { top: bar.bottom, left: bar.left, width: bar.width } : null);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  if (!open || !box) return null;
  return (
    <div className="tuner-panel" style={{ top: box.top, left: box.left, width: box.width }}>
      {CATEGORIES.map((c) => (
        <label key={c} className="tuner-row">
          <span>{c}</span>
          <input
            type="range"
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            step={WEIGHT_STEP}
            value={weights[c]}
            onChange={(e) => setWeights({ ...weights, [c]: Number(e.target.value) })}
          />
          <output className={weights[c] === 1 ? "" : "on"}>×{weights[c]}</output>
        </label>
      ))}
      <button className="tuner-reset" onClick={() => setWeights(DEFAULT_WEIGHTS)} disabled={isDefault(weights)}>
        초기화
      </button>
    </div>
  );
}

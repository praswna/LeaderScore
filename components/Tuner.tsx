"use client";

import { useEffect, useState } from "react";
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

/**
 * 분야별 보정치. 접어 두면 현재 값 요약 막대만 보이고, 누르면 슬라이더가 막대 위로 열린다.
 * 값은 모든 카드·랭킹에 공통이라 카드 묶음에 하나만 둔다.
 */
export default function Tuner() {
  const [weights, setWeights] = useWeights();
  const [open, setOpen] = useTunerOpen();
  return (
    <div className={`tuner ${open ? "open" : ""}`}>
      {open && (
        <div className="tuner-panel">
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
      )}
      <button className="tuner-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="tuner-title">보정치</span>
        <span className={`tuner-sum ${isDefault(weights) ? "" : "on"}`}>{describeWeights(weights)}</span>
        <svg className="tuner-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
      </button>
    </div>
  );
}

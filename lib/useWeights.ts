"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_WEIGHTS, sanitizeWeights, type Weights } from "./weights.ts";

const KEY = "leaderscore:weights";
const EVENT = "leaderscore:weights";

function load(): Weights {
  try {
    return sanitizeWeights(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

/**
 * 보정치는 모든 화면에 공통이고 브라우저에 기억된다.
 * 한 카드에서 바꾸면 같은 화면의 다른 카드·리스트에도 바로 반영된다.
 */
export function useWeights(): [Weights, (w: Weights) => void] {
  const [weights, setLocal] = useState<Weights>(DEFAULT_WEIGHTS);

  useEffect(() => {
    setLocal(load());
    const fromPage = (e: Event) => setLocal((e as CustomEvent<Weights>).detail);
    const fromOtherTab = () => setLocal(load());
    window.addEventListener(EVENT, fromPage);
    window.addEventListener("storage", fromOtherTab);
    return () => {
      window.removeEventListener(EVENT, fromPage);
      window.removeEventListener("storage", fromOtherTab);
    };
  }, []);

  const set = useCallback((w: Weights) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(w));
    } catch {
      // 저장이 막힌 환경(시크릿 모드 등)에서는 이번 화면에서만 적용
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: w }));
  }, []);

  return [weights, set];
}

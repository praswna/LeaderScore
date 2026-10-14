"use client";

import { useState } from "react";

/** 클립보드 복사. 복사가 막힌 환경에서는 프롬프트를 펼쳐 직접 선택하게 한다 */
export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("failed");
    }
  }

  return (
    <>
      <button className="btn" onClick={copy}>{state === "done" ? "복사됨 ✓" : label}</button>
      <details className="prompt-preview" open={state === "failed"}>
        <summary>{state === "failed" ? "복사가 막혔습니다. 아래 내용을 직접 복사하세요" : "프롬프트 보기"}</summary>
        <textarea readOnly value={text} onFocus={(e) => e.currentTarget.select()} />
      </details>
    </>
  );
}

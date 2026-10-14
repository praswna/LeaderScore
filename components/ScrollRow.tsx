"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 옆으로 넘기는 칩 줄. 터치는 기본 스와이프, 마우스는 끌기·휠·양끝 화살표로 넘긴다.
 * activeKey가 바뀌면 선택된 칩(.on)이 보이도록 스크롤한다.
 */
export default function ScrollRow({ className, activeKey, children }: {
  className: string;
  activeKey: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = () => {
    const el = ref.current;
    if (el) setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  };

  useEffect(() => {
    const ro = new ResizeObserver(update);
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    ref.current?.querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "nearest" });
    update();
  }, [activeKey]);

  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });

  return (
    <div className="scroll-row">
      <div
        ref={ref}
        className={`${className} scroll-x`}
        onScroll={update}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) ref.current!.scrollLeft += e.deltaY;
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") drag.current = { x: e.clientX, left: ref.current!.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (Math.abs(e.clientX - d.x) > 4) d.moved = true;
          ref.current!.scrollLeft = d.left - (e.clientX - d.x);
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => (drag.current = null)}
        // 끌어서 넘긴 경우에는 손을 뗄 때 칩이 눌리지 않게 한다
        onClickCapture={(e) => {
          if (drag.current?.moved) e.stopPropagation();
        }}
      >
        {children}
      </div>
      {edges.start && (
        <button className="row-chev prev" onClick={() => scrollBy(-1)} aria-label="앞으로">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      {edges.end && (
        <button className="row-chev next" onClick={() => scrollBy(1)} aria-label="뒤로">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}

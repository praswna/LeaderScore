"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "지도자", icon: "M4 20c0-4 4-6 8-6s8 2 8 6M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
  { href: "/ranking", label: "랭킹", icon: "M5 20V12M12 20V5M19 20v-5" },
  { href: "/prompt", label: "AI 프롬프트", icon: "M4 5h16v11H9l-5 4zM8 9h8M8 12h5" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => {
        const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : ""}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

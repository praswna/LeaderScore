import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav.tsx";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeaderScore",
  description: "지도자의 공과를 점수로 평가합니다",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="app">
          <main>{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

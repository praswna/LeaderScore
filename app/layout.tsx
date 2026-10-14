import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import BottomNav from "@/components/BottomNav.tsx";
import "./globals.css";

const sans = Noto_Sans_KR({ weight: ["400", "500", "700", "900"], subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LeaderScore",
  description: "지도자의 공과를 점수로 평가합니다",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e1014",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={sans.variable}>
      <body>
        <div className="app">
          <main>{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

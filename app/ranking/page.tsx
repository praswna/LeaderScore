import Ranking from "@/components/Ranking.tsx";
import { LEADERS } from "@/lib/data.ts";

export default function RankingPage() {
  // 랭킹은 사건 문구가 필요 없다. 보정치 계산에 쓰는 점수·분야만 남겨 페이지를 가볍게 한다
  const slim = LEADERS.map((l) => ({
    ...l,
    summary: "",
    events: l.events.map((e) => ({ ...e, title: "", description: "", reason: "" })),
  }));
  return <Ranking leaders={slim} />;
}

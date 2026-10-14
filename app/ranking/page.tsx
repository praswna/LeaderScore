import Ranking from "@/components/Ranking.tsx";
import { LEADERS } from "@/lib/data.ts";

export default function RankingPage() {
  // 랭킹에는 사건 목록이 필요 없어 빼고 넘긴다
  return <Ranking leaders={LEADERS.map((l) => ({ ...l, events: [] }))} />;
}

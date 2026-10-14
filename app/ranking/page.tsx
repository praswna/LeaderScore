import Ranking from "@/components/Ranking.tsx";
import { buildViews } from "@/lib/scoring.ts";
import { getData } from "@/lib/db.ts";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  return <Ranking leaders={buildViews(await getData())} />;
}

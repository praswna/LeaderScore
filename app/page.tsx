import LeaderBrowser from "@/components/LeaderBrowser.tsx";
import { buildViews } from "@/lib/scoring.ts";
import { getData } from "@/lib/sheets.ts";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ leader?: string }> }) {
  const [data, { leader }] = await Promise.all([getData(), searchParams]);
  return <LeaderBrowser leaders={buildViews(data)} focusId={leader} />;
}

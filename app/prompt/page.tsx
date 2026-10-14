import PromptBuilder from "@/components/PromptBuilder.tsx";
import { buildViews } from "@/lib/scoring.ts";
import { getData } from "@/lib/db.ts";

export const dynamic = "force-dynamic";

export default async function PromptPage() {
  return <PromptBuilder leaders={buildViews(await getData()).filter((l) => l.scored)} />;
}

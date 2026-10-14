import PromptBuilder from "@/components/PromptBuilder.tsx";
import { LEADERS } from "@/lib/data.ts";

export default function PromptPage() {
  return <PromptBuilder leaders={LEADERS.filter((l) => l.scored)} />;
}

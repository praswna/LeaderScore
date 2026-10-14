import LeaderBrowser from "@/components/LeaderBrowser.tsx";
import { LEADERS } from "@/lib/data.ts";

export default function Home() {
  return <LeaderBrowser leaders={LEADERS} />;
}

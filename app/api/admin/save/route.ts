import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth.ts";
import { parseResponse } from "@/lib/prompt.ts";
import { getData, saveScores } from "@/lib/sheets.ts";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "관리자 로그인이 필요합니다" }, { status: 401 });

  const { leaderId, response } = (await req.json().catch(() => ({}))) as { leaderId?: string; response?: string };
  const data = await getData();
  if (!data.leaders.some((l) => l.id === leaderId)) {
    return NextResponse.json({ error: "지도자를 찾을 수 없습니다" }, { status: 400 });
  }

  const eventIds = data.events.filter((e) => e.leaderId === leaderId).map((e) => e.id);
  const parsed = parseResponse(String(response ?? ""), eventIds);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await saveScores(leaderId!, parsed.result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CopyButton from "./CopyButton.tsx";
import LeaderSelect from "./LeaderSelect.tsx";
import { buildPrompt } from "@/lib/prompt.ts";
import type { LeaderView } from "@/lib/types.ts";

export default function AdminPanel({ admin, leaders }: { admin: boolean; leaders: LeaderView[] }) {
  return admin ? <Scoring leaders={leaders} /> : <Login />;
}

function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    if (res.ok) router.refresh();
    else setError(((await res.json()) as { error: string }).error);
  }

  return (
    <form onSubmit={submit} className="form-group">
      <span className="label">관리자</span>
      <div className="row">
        <input className="input sp" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn">확인</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function Scoring({ leaders }: { leaders: LeaderView[] }) {
  const router = useRouter();
  // 미채점 지도자부터 고르기 쉽게 첫 미채점을 기본값으로
  const [leaderId, setLeaderId] = useState((leaders.find((l) => !l.scored) ?? leaders[0])?.id ?? "");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const leader = leaders.find((l) => l.id === leaderId);

  async function save() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/save", { method: "POST", body: JSON.stringify({ leaderId, response }) });
    const body = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) return setStatus({ ok: false, text: body.error ?? "저장 실패" });
    setStatus({ ok: true, text: `${leader?.name} 저장 완료` });
    setResponse("");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="form-group">
      <div className="row">
        <span className="label sp">채점</span>
        <button className="link" onClick={logout}>로그아웃</button>
      </div>
      {leader ? (
        <>
          <LeaderSelect
            leaders={leaders}
            value={leaderId}
            onChange={(id) => { setLeaderId(id); setResponse(""); setStatus(null); }}
            label={(l) => (l.scored ? "" : " · 미채점")}
          />
          <CopyButton text={buildPrompt(leader)} label="채점 프롬프트 복사" />
          <textarea className="input paste" placeholder="AI 응답 붙여넣기" value={response} onChange={(e) => setResponse(e.target.value)} />
          <button className="btn strong" onClick={save} disabled={!response.trim() || saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </>
      ) : (
        <p className="empty">사건이 등록된 지도자가 없습니다.</p>
      )}
      {status && <p className={status.ok ? "ok" : "error"}>{status.text}</p>}
    </div>
  );
}

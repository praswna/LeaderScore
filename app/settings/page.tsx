import AdminPanel from "@/components/AdminPanel.tsx";
import { isAdmin } from "@/lib/auth.ts";
import { buildViews } from "@/lib/scoring.ts";
import { getData, isSampleMode } from "@/lib/sheets.ts";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await isAdmin();
  const leaders = admin ? buildViews(await getData()).filter((l) => l.events.length > 0) : [];
  return (
    <div className="page">
      <h1 className="title">설정</h1>
      <div className="form scroll-y">
        {isSampleMode() && (
          <p className="notice">샘플 데이터 모드입니다. 구글시트를 연결하기 전이라 저장은 서버 메모리에만 남습니다. 비밀번호를 설정하지 않았다면 admin으로 로그인됩니다.</p>
        )}
        <AdminPanel admin={admin} leaders={leaders} />
      </div>
    </div>
  );
}

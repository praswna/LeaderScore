import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isSampleMode } from "./sheets.ts";

export const ADMIN_COOKIE = "ls_admin";

/** 샘플 모드에서는 비밀번호가 없으면 "admin"으로 체험할 수 있다 */
function password(): string | null {
  return process.env.ADMIN_PASSWORD || (isSampleMode() ? "admin" : null);
}

function tokenFor(pw: string): string {
  return createHash("sha256").update(`leaderscore:${pw}`).digest("hex");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string): string | null {
  const pw = password();
  return pw && same(input, pw) ? tokenFor(pw) : null;
}

export async function isAdmin(): Promise<boolean> {
  const pw = password();
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!pw && !!value && same(value, tokenFor(pw));
}

import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

/** Returns the current session or null. Never throws for "not configured". */
export async function getSession() {
  try {
    return await getAuth().api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

/** Data Access Layer guard: use in every protected server component / route. */
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireAdmin() {
  const s = await requireSession();
  const role = (s.user as { role?: string }).role;
  if (role !== "admin" && role !== "super_admin") redirect("/dashboard");
  return s;
}

import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Forgot password" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <ForgotPasswordForm emailConfigured={features.email} />;
}

import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <RegisterForm providers={{ google: features.google, github: features.github, linkedin: features.linkedin }} emailVerification={features.email} />;
}

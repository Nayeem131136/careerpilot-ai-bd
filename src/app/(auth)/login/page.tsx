import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/auth-forms";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <Suspense><LoginForm providers={{ google: features.google, github: features.github, linkedin: features.linkedin }} /></Suspense>;
}

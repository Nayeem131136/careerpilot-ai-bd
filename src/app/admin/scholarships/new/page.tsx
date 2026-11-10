import Link from "next/link";
import { EMPTY, ScholarshipForm } from "@/components/admin/scholarship-form";

export const metadata = { title: "Admin: add scholarship" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div><Link href="/admin/scholarships" className="text-sm text-primary hover:underline">← Scholarships</Link><h1 className="mt-1 text-2xl font-extrabold">Add a scholarship</h1>
        <p className="mt-1 text-sm text-muted">Copy details from the official page only. It goes to the review queue first.</p></div>
      <ScholarshipForm id={null} initial={EMPTY} />
    </div>
  );
}

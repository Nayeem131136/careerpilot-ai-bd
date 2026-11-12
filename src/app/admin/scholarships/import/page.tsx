import Link from "next/link";
import { ScholarshipBulk } from "@/components/admin/scholarship-bulk";

export const metadata = { title: "Admin: bulk import scholarships" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div><Link href="/admin/scholarships" className="text-sm text-primary hover:underline">← Scholarships</Link><h1 className="mt-1 text-2xl font-extrabold">Bulk import</h1></div>
      <ScholarshipBulk />
    </div>
  );
}

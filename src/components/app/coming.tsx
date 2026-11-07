import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";

export function Coming({ title, phase, children }: { title: string; phase: number; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <div className="mt-6">
        <EmptyState icon={<Hammer size={30} />} title={`Arrives in Phase ${phase}`}>{children}</EmptyState>
      </div>
    </div>
  );
}

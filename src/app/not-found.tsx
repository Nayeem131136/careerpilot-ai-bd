import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-extrabold">404</p>
      <h1 className="mt-3 text-xl font-bold">We could not find that page</h1>
      <p className="mt-2 text-sm text-muted">The link may be old or mistyped.</p>
      <div className="mt-6 flex gap-4 text-sm"><Link href="/" className="text-primary hover:underline">Home</Link><Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link></div>
    </main>
  );
}

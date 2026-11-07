import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const cols = [
  { title: "Product", links: [["Features", "/features"], ["How it works", "/how-it-works"], ["Explore careers", "/explore-careers"], ["Job categories", "/job-categories"], ["Pricing", "/pricing"]] },
  { title: "Company", links: [["About", "/about"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"]] },
];

export function Footer() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">Your Skills. Your Opportunities. Your Future. You review and send every application yourself.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-bold">{c.title}</h3>
            <ul className="mt-3 space-y-2">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="text-sm text-muted transition hover:text-fg">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} CareerPilot AI. Job matches are guidance, not a guarantee of any outcome.</div>
    </footer>
  );
}

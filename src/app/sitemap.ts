import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

const PAGES = ["", "/features", "/how-it-works", "/explore-careers", "/job-categories", "/pricing", "/about", "/contact", "/privacy", "/terms", "/cookies"];
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${appUrl}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.5 }));
}

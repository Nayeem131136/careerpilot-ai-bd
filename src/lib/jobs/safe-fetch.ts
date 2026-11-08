import "server-only";
import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";

const MAX_BYTES = 1_500_000;
const UA = "CareerPilotAI/1.0 (job discovery; respects robots.txt)";

export class FetchBlocked extends Error {}

export function isPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 168 || (b === 0 && ip.startsWith("192.0.0.")))) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
    if (a === 198 && (b === 18 || b === 19)) return false;
    return true;
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe8") || l.startsWith("fe9") || l.startsWith("fea") || l.startsWith("feb")) return false;
    const m = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return m ? isPublicIp(m[1]) : true;
  }
  return false;
}

async function resolvePublic(host: string): Promise<{ address: string; family: number }> {
  if (net.isIP(host) || host.startsWith("[")) throw new FetchBlocked("Links with raw IP addresses are not allowed.");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new FetchBlocked("That address is not allowed.");
  const addrs = await dns.lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => !isPublicIp(a.address))) throw new FetchBlocked("That address is not allowed.");
  return addrs[0];
}

function once(u: URL, ip: { address: string; family: number }, accept: string): Promise<{ status: number; location?: string; type: string; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      protocol: "https:", hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: "GET", servername: u.hostname, timeout: 10_000,
      headers: { "user-agent": UA, accept, "accept-language": "bn,en;q=0.8" },
      // Pin the connection to the IP we validated, so DNS cannot change between the check and the request.
      lookup: (_h, _o, cb) => cb(null, ip.address, ip.family),
    }, (res) => {
      const chunks: Buffer[] = []; let size = 0;
      res.on("data", (c: Buffer) => { size += c.length; if (size > MAX_BYTES) { req.destroy(); reject(new Error("page too large")); } else chunks.push(c); });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, location: res.headers.location, type: String(res.headers["content-type"] ?? ""), body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
    req.end();
  });
}

/** Fetches one public HTTPS page. Blocks private/internal addresses, follows at most 3 redirects, caps size and time. */
export async function fetchPublicPage(raw: string, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5"): Promise<{ url: string; body: string; type: string }> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new FetchBlocked("That is not a valid link."); }
  for (let hop = 0; hop < 4; hop++) {
    if (u.protocol !== "https:") throw new FetchBlocked("Only https links are supported.");
    if (u.username || u.password) throw new FetchBlocked("That link is not allowed.");
    if (u.port && u.port !== "443") throw new FetchBlocked("That link is not allowed.");
    const ip = await resolvePublic(u.hostname);
    const r = await once(u, ip, accept);
    if (r.status >= 300 && r.status < 400 && r.location) { u = new URL(r.location, u); continue; }
    if (r.status < 200 || r.status >= 300) throw new Error(`HTTP ${r.status}`);
    if (!/html|xml|text|json/i.test(r.type)) throw new Error("unsupported page type");
    return { url: u.toString(), body: r.body, type: r.type };
  }
  throw new Error("too many redirects");
}

/** Minimal robots.txt check for our crawler (User-agent: * and our name). Fails open only when robots.txt is absent. */
export async function allowedByRobots(pageUrl: string): Promise<boolean> {
  const u = new URL(pageUrl);
  try {
    const r = await fetchPublicPage(`${u.origin}/robots.txt`, "text/plain");
    let applies = false; const disallow: string[] = []; const allow: string[] = [];
    for (const line of r.body.split(/\r?\n/)) {
      const [kRaw, ...rest] = line.split("#")[0].split(":");
      const k = kRaw?.trim().toLowerCase(); const v = rest.join(":").trim();
      if (k === "user-agent") applies = v === "*" || /careerpilot/i.test(v);
      else if (applies && k === "disallow" && v) disallow.push(v);
      else if (applies && k === "allow" && v) allow.push(v);
    }
    const path = u.pathname + u.search;
    const dl = Math.max(0, ...disallow.filter((d) => path.startsWith(d)).map((d) => d.length));
    const al = Math.max(0, ...allow.filter((a) => path.startsWith(a)).map((a) => a.length));
    return dl === 0 || al >= dl;
  } catch (e) {
    return !(e instanceof FetchBlocked) && !(e instanceof Error && /HTTP (401|403)/.test(e.message));
  }
}

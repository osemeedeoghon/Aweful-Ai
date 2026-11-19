// Checks every link in content/awful-ai.md (with content/link-fixes.json applied) and writes link-report.json.
// Usage: node scripts/check-links.mjs   (or npm run check-links)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { applyLinkFixes } from "./link-fixes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = applyLinkFixes(readFileSync(join(root, "content/awful-ai.md"), "utf8"), join(root, "content/link-fixes.json"));

// Collect links with the entry (table row's first cell) they appear in.
const links = new Map();
for (const line of md.split(/\r?\n/)) {
  const entry = line.trim().startsWith("|") ? line.split("|")[1]?.trim().replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") : "(intro)";
  for (const m of line.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    const url = m[2];
    if (!/^https?:\/\//.test(url)) continue;
    if (!links.has(url)) links.set(url, { url, label: m[1], entries: new Set() });
    links.get(url).entries.add(entry);
  }
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, {
        method, redirect: "follow", signal: AbortSignal.timeout(20000),
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*;q=0.8", "accept-language": "en" },
      });
      res.body?.cancel().catch(() => {});
      // Some servers reject HEAD; retry those with GET.
      if (method === "HEAD" && (res.status >= 400 || res.status === 0)) continue;
      return { status: res.status, finalUrl: res.url };
    } catch (e) {
      if (method === "HEAD") continue;
      return { status: 0, error: (e.cause?.code || e.name || String(e)) };
    }
  }
}

const classify = (r) =>
  r.status >= 200 && r.status < 400 ? "ok"
  : [401, 403, 429, 999].includes(r.status) ? "blocked"   // bot protection; page likely exists
  : r.status === 404 || r.status === 410 ? "dead"
  : r.status === 0 ? "error"
  : "other";

const list = [...links.values()];
const results = [];
let i = 0;
await Promise.all(Array.from({ length: 12 }, async () => {
  while (i < list.length) {
    const l = list[i++];
    const r = await check(l.url);
    results.push({ ...l, entries: [...l.entries], ...r, verdict: classify(r) });
  }
}));

results.sort((a, b) => a.verdict.localeCompare(b.verdict) || a.url.localeCompare(b.url));
writeFileSync(join(root, "link-report.json"), JSON.stringify(results, null, 2));
const tally = results.reduce((t, r) => ((t[r.verdict] = (t[r.verdict] || 0) + 1), t), {});
console.log(`Checked ${results.length} unique links:`, tally);
for (const r of results.filter((r) => r.verdict !== "ok"))
  console.log(`${r.verdict.padEnd(8)} ${String(r.status || r.error).padEnd(14)} ${r.url}  [${r.entries.join("; ")}]`);

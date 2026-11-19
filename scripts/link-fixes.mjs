// Applies content/link-fixes.json to the README markdown. Shared by build.mjs and check-links.mjs.
import { readFileSync } from "node:fs";

export function applyLinkFixes(md, fixesPath) {
  const { replace } = JSON.parse(readFileSync(fixesPath, "utf8"));
  const unused = [];
  for (const [from, to] of Object.entries(replace)) {
    const target = `](${from})`;
    if (!md.includes(target)) { unused.push(from); continue; }
    if (to) {
      md = md.split(target).join(`](${to})`);
    } else {
      // Drop the whole [label](url) along with one neighbouring ", " separator.
      const q = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      md = md.replace(new RegExp(`\\[[^\\]]*\\]\\(${q}\\),\\s*`, "g"), "")
             .replace(new RegExp(`,\\s*\\[[^\\]]*\\]\\(${q}\\)`, "g"), "")
             .replace(new RegExp(`\\[[^\\]]*\\]\\(${q}\\)`, "g"), "");
    }
  }
  if (unused.length) console.warn(`link-fixes: ${unused.length} entries no longer match the README (safe to delete):\n  ${unused.join("\n  ")}`);
  return md;
}

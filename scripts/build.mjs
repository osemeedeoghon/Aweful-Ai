// Builds public/index.html from content/awful-ai.md (the upstream Awful AI README).
// No dependencies: run with `node scripts/build.mjs` or `npm run build`.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { applyLinkFixes } from "./link-fixes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "content/awful-ai.md");
const OUT = join(root, "public/index.html");

const REPO_URL = "https://github.com/daviddao/awful-ai";
const ZENODO_CONCEPT_DOI = "10.5281/zenodo.5855971"; // always resolves to the latest version
const ZENODO_V1_DOI = "10.5281/zenodo.5855972"; // v1.0.0 "2021 Edition", 2022-01-16

// Display config for each README section, keyed by its heading (lowercased).
const SECTIONS = {
  "discrimination": { id: "discrimination", title: "Discrimination", group: "awful" },
  "influencing, disinformation, and fakes": { id: "disinformation", title: "Influencing, Disinformation & Fakes", group: "awful" },
  "surveillance": { id: "surveillance", title: "Surveillance", group: "awful" },
  "data crimes": { id: "data-crimes", title: "Data Crimes", group: "awful" },
  "social credit systems": { id: "social-credit", title: "Social Credit Systems", group: "awful" },
  "misleading platforms, and scams": { id: "scams", title: "Misleading Platforms & Scams", group: "awful" },
  "accelerating the climate emergency": { id: "climate", title: "Accelerating the Climate Emergency", group: "awful" },
  "autonomous weapon systems and military": { id: "military", title: "Autonomous Weapons & Military", group: "awful" },
  "contestational research": { id: "contestational-research", title: "Contestational Research", group: "counter" },
  "contestational tech projects": { id: "contestational-tech", title: "Contestational Tech Projects", group: "counter" },
};

// ---------- tiny markdown helpers ----------

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slug = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
};

const extLink = (url, label) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`;

/** Inline markdown -> HTML: links, **bold**, *italic*. Everything else is escaped. */
function inline(md) {
  const out = [];
  const re = /\[([^\]]*)\]\(([^)\s]*)\)/g;
  let last = 0, m;
  while ((m = re.exec(md))) {
    out.push(emphasis(esc(md.slice(last, m.index))));
    const label = emphasis(esc(m[1]));
    out.push(m[2] ? extLink(m[2], label) : label);
    last = re.lastIndex;
  }
  out.push(emphasis(esc(md.slice(last))));
  return out.join("");
}
const emphasis = (s) => s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");

/** "[A](u1), [B](u2)" -> [{label, url}] */
function links(md) {
  return [...md.matchAll(/\[([^\]]*)\]\(([^)\s]*)\)/g)].map((m) => ({ label: m[1].trim(), url: m[2] })).filter((l) => l.url);
}

const cells = (line) => {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
};

const stripDetails = (s) =>
  s.replace(/^<details>\s*<summary>.*?<\/summary>/i, "").replace(/<\/details>\s*$/i, "").trim();

// ---------- parse README ----------

const md = applyLinkFixes(readFileSync(SOURCE, "utf8"), join(root, "content/link-fixes.json"));
const lines = md.split(/\r?\n/);

let h1 = null;
let current = null;
const sections = [];
let awardIntro = "";
const awards = [];
let headerRow = null;

for (const raw of lines) {
  const line = raw.trimEnd();
  if (/^# /.test(line)) { h1 = line.slice(2).trim().toLowerCase(); current = null; continue; }
  if (/^## /.test(line)) {
    const key = line.slice(3).trim().toLowerCase();
    current = SECTIONS[key] ? { ...SECTIONS[key], intro: "", entries: [] } : { key, ignored: true };
    if (!current.ignored) sections.push(current);
    headerRow = null;
    continue;
  }
  if (/^> /.test(line)) {
    const text = line.slice(2).trim();
    if (h1 === "annual awful ai award" && !current) awardIntro = text;
    else if (current && !current.ignored) current.intro = text;
    continue;
  }
  if (!line.trim().startsWith("|")) continue;
  const c = cells(line);
  if (c.every((x) => /^-+$/.test(x))) continue; // separator row
  if (!headerRow) { headerRow = c.map((x) => x.toLowerCase()); continue; }

  if (h1 === "annual awful ai award" && headerRow[0] === "year") {
    const [year, winner, category, laudation] = c;
    awards.push({ year, winner, category: category.replace(/[🥇']/gu, "").trim(), laudation });
  } else if (current && !current.ignored && headerRow[0] === "application") {
    const [name, summary, details, refs] = c;
    current.entries.push({ name, summary, details: stripDetails(details || ""), refs: links(refs || "") });
  }
}

const awful = sections.filter((s) => s.group === "awful");
const counter = sections.filter((s) => s.group === "counter");
const count = (arr) => arr.reduce((n, s) => n + s.entries.length, 0);
const totalAwful = count(awful);
const totalCounter = count(counter);
const sourceCount = sections.reduce((n, s) => n + s.entries.reduce((k, e) => k + e.refs.length, 0), 0);

if (awful.length !== 8 || counter.length !== 2 || !awards.length) {
  console.warn(`Warning: parsed ${awful.length} categories, ${counter.length} counter sections, ${awards.length} awards. The README structure may have changed.`);
}

// ---------- render ----------

function renderEntry(e, section, i) {
  const id = `${section.id}--${slug(e.name) || i}`;
  const sources = e.refs.length
    ? `<div class="sources"><span class="sources__label">Sources</span><ul>${e.refs
        .map((r) => `<li>${extLink(r.url, esc(r.label))}${hostOf(r.url) ? ` <span class="host">${esc(hostOf(r.url))}</span>` : ""}</li>`)
        .join("")}</ul></div>`
    : "";
  return `
        <article class="entry" id="${id}">
          <h4 class="entry__name"><a class="anchor" href="#${id}" aria-label="Link to ${esc(e.name)}">#</a>${inline(e.name)}</h4>
          <p class="entry__summary">${inline(e.summary)}</p>
          ${e.details ? `<details class="entry__details"><summary>Read the details</summary><div class="entry__body"><p>${inline(e.details)}</p></div></details>` : ""}
          ${sources}
        </article>`;
}

function renderSection(s, num) {
  return `
      <section class="category category--${s.group}" id="${s.id}" aria-labelledby="${s.id}-title" data-section>
        <header class="category__head">
          <p class="category__num">${num}</p>
          <h3 id="${s.id}-title">${esc(s.title)}</h3>
          <p class="category__intro">${inline(s.intro)}</p>
          <p class="category__count"><span data-count>${s.entries.length}</span> ${s.group === "counter" ? "efforts" : "cases"}</p>
        </header>
        <div class="entries">${s.entries.map((e, i) => renderEntry(e, s, i)).join("")}
        </div>
      </section>`;
}

const tocItem = (s, num) =>
  `<li><a href="#${s.id}" data-toc="${s.id}"><span class="toc__num">${num}</span><span class="toc__title">${esc(s.title)}</span><span class="toc__count" data-toc-count="${s.id}">${s.entries.length}</span></a></li>`;

const renderAward = (a) => `
          <li class="award">
            <p class="award__year">${esc(a.year)}</p>
            <div class="award__main">
              <p class="award__category">${esc(a.category)}</p>
              <h4 class="award__winner">${inline(a.winner)}</h4>
              <details><summary>Read the laudation</summary><p>${inline(a.laudation)}</p></details>
            </div>
          </li>`;

const bibtex = `@software{dao_awful_ai,
  author    = {Dao, David and contributors},
  title     = {Awful AI: a curated list to track current scary usages of AI},
  publisher = {Zenodo},
  doi       = {${ZENODO_CONCEPT_DOI}},
  url       = {https://doi.org/${ZENODO_CONCEPT_DOI}}
}`;

const builtOn = new Date().toISOString().slice(0, 10);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Awful AI: scary real-world uses of AI</title>
  <meta name="description" content="Awful AI is a curated list of current, real-world misuses of artificial intelligence: discrimination, disinformation, surveillance, data crimes, social credit, scams, climate harm and military use, plus the research and tools fighting back.">
  <meta property="og:title" content="Awful AI">
  <meta property="og:description" content="A curated list tracking scary real-world uses of AI, to raise awareness of its misuse in society.">
  <meta property="og:type" content="website">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23b3261e'/%3E%3Cpath d='M16 7 26 25H6Z' fill='none' stroke='white' stroke-width='2.5' stroke-linejoin='round'/%3E%3Cpath d='M16 14v5' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='22' r='1.4' fill='white'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>

  <header class="hero">
    <div class="wrap">
      <p class="eyebrow">A curated awareness list</p>
      <h1>Awful AI</h1>
      <p class="lede">A list tracking <em>current</em>, real-world uses of artificial intelligence that cause harm, from biased hiring tools and predictive policing to deepfakes, mass surveillance and autonomous weapons.</p>
      <div class="hero__body">
        <p>AI in its current state is ${extLink("https://github.com/rockita/criticalML", "unfair")}, ${extLink("http://www.cleverhans.io/security/privacy/ml/2016/12/16/breaking-things-is-easy.html", "easily attacked")} and notoriously difficult to control. Its predictions often ${extLink("https://twitter.com/kaiwei_chang/status/1274845029933084673", "amplify existing systemic biases")}, even when the data is balanced. Yet concerning uses keep appearing in the wild.</p>
        <p>This list documents them, so that people can recognise the patterns, talk about them, and build the tools and policies to push back.</p>
      </div>
      <dl class="stats">
        <div><dt>Documented cases</dt><dd>${totalAwful}</dd></div>
        <div><dt>Categories</dt><dd>${awful.length}</dd></div>
        <div><dt>Efforts fighting back</dt><dd>${totalCounter}</dd></div>
        <div><dt>Linked sources</dt><dd>${sourceCount}</dd></div>
      </dl>
      <p class="hero__actions">
        <a class="btn btn--primary" href="#categories">Read the list</a>
        <a class="btn" href="#fighting-back">See who is fighting back</a>
        <a class="btn" href="#cite">Cite this list</a>
      </p>
    </div>
  </header>

  <div class="layout wrap">
    <nav class="toc" aria-label="Table of contents">
      <details class="toc__mobile" open>
        <summary>Contents</summary>
        <div class="toc__inner">
          <p class="toc__group">1 · Awful AI</p>
          <ol>${awful.map((s, i) => tocItem(s, `1.${i + 1}`)).join("")}</ol>
          <p class="toc__group toc__group--counter">2 · Fighting back</p>
          <ol>${counter.map((s, i) => tocItem(s, `2.${i + 1}`)).join("")}</ol>
          <p class="toc__group">3 · More</p>
          <ol>
            <li><a href="#award" data-toc="award"><span class="toc__num">3.1</span><span class="toc__title">Annual Awful AI Award</span></a></li>
            <li><a href="#cite" data-toc="cite"><span class="toc__num">3.2</span><span class="toc__title">Cite &amp; contribute</span></a></li>
          </ol>
        </div>
      </details>
    </nav>

    <main id="main">
      <div class="toolbar" data-toolbar hidden>
        <label class="search">
          <span class="sr-only">Search the list</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input type="search" placeholder="Search cases, companies, sources…" autocomplete="off" data-search>
          <kbd aria-hidden="true">/</kbd>
        </label>
        <button type="button" class="btn btn--small" data-toggle-all aria-pressed="false">Expand all</button>
        <p class="toolbar__status" role="status" aria-live="polite" data-status></p>
      </div>

      <section id="categories" class="part" aria-labelledby="categories-title">
        <h2 id="categories-title" class="part__title"><span>1</span> Awful AI categories</h2>
        ${awful.map((s, i) => renderSection(s, `1.${i + 1}`)).join("")}
      </section>

      <section id="fighting-back" class="part part--counter" aria-labelledby="fighting-back-title">
        <h2 id="fighting-back-title" class="part__title"><span>2</span> Contestational AI efforts</h2>
        <p class="part__intro">Awareness is only half of it. These research directions and open-source projects try to make AI less awful: protecting privacy, measuring bias, documenting models, and giving people tools to resist tracking.</p>
        ${counter.map((s, i) => renderSection(s, `2.${i + 1}`)).join("")}
      </section>

      <section id="award" class="part part--award" aria-labelledby="award-title" data-section>
        <h2 id="award-title" class="part__title"><span>3</span> Annual Awful AI Award</h2>
        <p class="part__intro">${inline(awardIntro)}</p>
        <ol class="awards">${awards.map(renderAward).join("")}
        </ol>
      </section>

      <section id="cite" class="part part--cite" aria-labelledby="cite-title" data-section>
        <h2 id="cite-title" class="part__title"><span>&nbsp;</span> Cite &amp; contribute</h2>
        <div class="cite">
          <div>
            <h3>Cite the list</h3>
            <p>Awful AI is archived on Zenodo. The DOI below always points to the latest version. The first archived release (v1.0.0, “2021 Edition”) is <a href="https://doi.org/${ZENODO_V1_DOI}">${ZENODO_V1_DOI}</a>.</p>
            <p class="doi"><span>DOI</span> <a href="https://doi.org/${ZENODO_CONCEPT_DOI}">${ZENODO_CONCEPT_DOI}</a></p>
            <div class="code">
              <pre><code data-bibtex>${esc(bibtex)}</code></pre>
              <button type="button" class="btn btn--small" data-copy hidden>Copy BibTeX</button>
            </div>
          </div>
          <div>
            <h3>Suggest a case</h3>
            <p>The list is community curated on GitHub. Know of a harmful use of AI, a broken link, or a project that fights back? Open an issue or a pull request.</p>
            <p><a class="btn btn--primary" href="${REPO_URL}">Contribute on GitHub</a></p>
            <h3>A note on sources</h3>
            <p>Each entry summarises how the linked reporting and research described a system at the time. Some products have since changed or shut down, and some links may no longer work. Follow the sources and read them critically.</p>
          </div>
        </div>
      </section>
    </main>
  </div>

  <footer class="site-footer">
    <div class="wrap">
      <p>Content from <a href="${REPO_URL}">Awful AI</a> by David Dao and contributors, dedicated to the public domain under <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>.</p>
      <p class="muted">Page generated ${builtOn} from the project README.</p>
    </div>
  </footer>

  <script src="app.js" defer></script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`Built ${OUT.replace(root + "/", "")}: ${totalAwful} cases in ${awful.length} categories, ${totalCounter} counter-efforts, ${awards.length} awards, ${sourceCount} sources.`);

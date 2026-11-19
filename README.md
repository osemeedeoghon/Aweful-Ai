# Awful AI website

A static, dependency-free website for [Awful AI](https://github.com/daviddao/awful-ai), the curated list of scary real-world uses of AI.

All content comes from the upstream README (CC0). `scripts/build.mjs` parses it into a fully rendered `public/index.html`, so the page works without JavaScript. `public/app.js` adds search, expand/collapse all, an active table of contents and a copy-citation button on top.

## Commands

```bash
npm run update   # pull the latest upstream README, then rebuild
npm run build    # rebuild public/index.html from content/awful-ai.md
npm run serve    # preview at http://localhost:4173
npm run check-links  # check every link (fixes applied) and write link-report.json
```

## Structure

- `content/awful-ai.md`: copy of the upstream README (the only content source)
- `content/link-fixes.json`: replacements for dead or hijacked links, applied at build time so `npm run sync` doesn't undo them
- `scripts/build.mjs`: README parser and page template (section titles and ids live in `SECTIONS`)
- `public/`: the deployable site (`index.html`, `styles.css`, `app.js`)

## Deploying

`public/` is plain static files. It can be hosted on GitHub Pages, Netlify or Vercel (output directory `public`, build command `npm run build`).

# Link check report

> **Status: fixes applied 2026-11-19.** All 18 fixes and the 8 redirect updates below (26 entries) are in `content/link-fixes.json` and applied at build time. `deepfakes.club` and the removed YouTube video were dropped. A re-check found 162 working links, the same 27 bot-blocked ones and the unverifiable Facebook post, with nothing broken.

Checked 2026-11-19 with `npm run check-links`: 192 unique links in `content/awful-ai.md` (170 entry sources plus links inside details, the intro and award laudations).

| Result | Count |
|---|---|
| Working | 146 (8 of them via redirects, since updated) |
| **Broken or misleading** (below) | **18** (2 hijacked, 11 dead, 5 redirect to a generic page) |
| Bot-blocked, page very likely fine (403/401) | 27 |
| Can't verify without login (Facebook) | 1 |

## Hijacked domains (fix first)

These now show unrelated content, which is worse than a dead link on an awareness site.

| Entry | Link | Now shows | Suggested replacement |
|---|---|---|---|
| PredPol | `http://www.predpol.com/` | Football streaming spam site | http://web.archive.org/web/20191224114003/http://www.predpol.com/ |
| Cambridge Analytica | `https://cambridgeanalytica.org/` | Unrelated "CA Privacy Watch" site | http://web.archive.org/web/20180224094452/https://cambridgeanalytica.org/ |

## Dead (404 or domain gone)

| Entry | Link | Suggested replacement |
|---|---|---|
| Racist Auto Tag and Recognition | ABC News: Amazon face detection bias | http://web.archive.org/web/20191130054555/https://abcnews.go.com/Technology/wireStory/researchers-amazon-face-detection-technology-shows-bias-60630589 |
| Convincing Lies | Nabla: GPT-3 medical chatbot | http://web.archive.org/web/20201027122018/https://www.nabla.com/blog/gpt-3/ |
| Predicting Mass Protests | Vice/Motherboard: Pentagon protest prediction (domain gone) | http://web.archive.org/web/20190426030217/https://motherboard.vice.com/en_us/article/7x3g4x/pentagon-wants-to-predict-anti-trump-protests-using-social-media-surveillance |
| Predicting Mass Protests | IARPA: EMBERS project | http://web.archive.org/web/20190826100241/https://www.iarpa.gov/index.php/newsroom/iarpa-in-the-news/2015/461-the-embers-project-can-predict-the-future-with-twitter |
| Deep Fakes | `deepfakes.club` (domain gone) | Remove. It was a deepfake community site, so an archive link would send readers to the tool. |
| Increase fossil fuel production | ExxonMobil Permian press release | http://web.archive.org/web/20191117222339/https://corporate.exxonmobil.com/News/Newsroom/News-releases/2019/0305_ExxonMobil-to-increase-accelerate-Permian-output-to-1-million-barrels-per-day-by-2024 |
| Armed UAVs | Global Times: Ziyan drones | http://web.archive.org/web/20200111035407/http://www.globaltimes.cn:80/content/1149168.shtml |
| Automated Machine Gun | YouTube video (removed) | http://web.archive.org/web/20191231224526/https://www.youtube.com/watch?v=4OqmoHBvB0c (page only, the video may not play) or remove |
| BLM Privacy & Anonymous Camera | `github.com/StanfordMLGroup/blm` (repo deleted) | http://web.archive.org/web/20200828071036/https://github.com/stanfordmlgroup/blm |
| Center for Democracy & Technology | `cdt.info/ddtool/` | http://web.archive.org/web/20200310085547/https://cdt.info/ddtool/ |
| Award 2021 (Checkr) | Protocol: Checkr lawsuits (Protocol shut down) | http://web.archive.org/web/20200210170038/https://www.protocol.com/checkr-gig-economy-lawsuits |

## Redirect to a generic page (the original content is gone)

| Entry | Link | Lands on | Suggested replacement |
|---|---|---|---|
| Increase fossil fuel production | WEF oil and gas white paper (PDF) | weforum.org/publications | http://web.archive.org/web/20200430224030/http://reports.weforum.org/digital-transformation/wp-content/blogs.dir/94/mp/files/pages/files/white-paper-2017-dti-oil-gas.pdf |
| iBorderCtrl | European Commission article | A generic "success stories" page | http://web.archive.org/web/20200118014839/https://ec.europa.eu/research/infocentre/article_en.cfm?artid=49726 |
| Adversarial Machine Learning | OpenAI blog: adversarial examples | openai.com/news | http://web.archive.org/web/20190306215358/https://blog.openai.com/adversarial-example-research/ |
| SenseTime & Megvii | SenseTime intelligent video page | SenseTime homepage (Chinese) | http://web.archive.org/web/20190319194444/https://www.sensetime.com/intelligentVideo/84 |
| COMPAS | Equivant product page | A different product's page | Fine to keep, or point to equivant.com |

## Working but worth updating

These still work through redirects. Updating them avoids depending on the redirect.

- `tvm.ai/2018/10/09/ml-in-tees.html` → https://tvm.apache.org/2018/10/09/ml-in-tees
- `ai.googleblog.com/...model-card-toolkit` → https://research.google/blog/introducing-the-model-card-toolkit-for-easier-model-transparency-reporting/
- `openai.com/blog/improving-factual-accuracy/` → https://openai.com/index/webgpt/
- `cs.nyu.edu/trackmenot/` → https://www.trackmenot.io/
- `prisma-ai.com/lensa` → https://lensa.app/
- `anyvision.co` → https://oosto.com/ (AnyVision renamed itself Oosto)
- `github.com/dreamnettech/dreampower` → now `sukebenet/dreampower`
- `citeseerx.ist.psu.edu/...` → already redirects to a Wayback copy

## Bot-blocked (not broken)

These 27 links returned 403 or 401 to an automated checker. The sites are paywalled or protected (NYT, Reuters, Forbes, FT, The Atlantic, Fast Company, PetaPixel, Inc., GeekWire, Marshall Project, National Interest, Midjourney, Character.AI, Vitality and the Dutch court ruling). They load normally in a browser. Run `npm run check-links` to regenerate the full list in `link-report.json`.

The Facebook post by Yann LeCun (Misleading Show Robots) returns 400 without a login, so I couldn't verify it.

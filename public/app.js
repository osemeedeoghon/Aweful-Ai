// Progressive enhancement: the page is fully readable without this file.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const toolbar = $("[data-toolbar]");
  const input = $("[data-search]");
  const status = $("[data-status]");
  const toggleAll = $("[data-toggle-all]");
  const items = $$(".entry, .award");
  const entryDetails = $$(".entry__details, .award details");
  toolbar.hidden = false;

  // Precompute searchable text for every card.
  const index = items.map((el) => ({
    el,
    head: (el.querySelector("h4")?.textContent + " " + (el.querySelector(".entry__summary, .award__category")?.textContent || "")).toLowerCase(),
    all: el.textContent.toLowerCase().replace(/\s+/g, " "),
    details: el.querySelector("details"),
  }));

  // ---------- search ----------
  const noResults = document.createElement("p");
  noResults.className = "no-results";
  noResults.hidden = true;
  $("#categories").before(noResults);

  let openedBySearch = new Set();

  function applySearch() {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    openedBySearch.forEach((d) => (d.open = false));
    openedBySearch = new Set();

    let shown = 0;
    for (const it of index) {
      const match = terms.every((t) => it.all.includes(t));
      it.el.toggleAttribute("data-hidden", !match);
      if (match) shown++;
      // If the match is only inside the collapsed details, open them so the reader sees why.
      if (match && terms.length && it.details && !it.details.open && !terms.every((t) => it.head.includes(t))) {
        it.details.open = true;
        openedBySearch.add(it.details);
      }
    }

    // Hide sections and parts with nothing left; update counts in the TOC.
    for (const sec of $$("[data-section]")) {
      const cards = $$(".entry, .award", sec);
      const visible = cards.filter((c) => !c.hasAttribute("data-hidden")).length;
      const hide = terms.length > 0 && (cards.length ? visible === 0 : true);
      sec.toggleAttribute("data-hidden", hide);
      const count = $("[data-count]", sec);
      if (count) count.textContent = terms.length ? `${visible} of ${cards.length}` : cards.length;
      const tocCount = $(`[data-toc-count="${sec.id}"]`);
      if (tocCount) tocCount.textContent = terms.length ? visible : cards.length;
      $(`[data-toc="${sec.id}"]`)?.classList.toggle("is-empty", hide);
    }
    for (const part of $$(".part")) {
      if (part.hasAttribute("data-section")) continue;
      part.toggleAttribute("data-hidden", terms.length > 0 && $$("[data-section]:not([data-hidden])", part).length === 0);
    }

    if (!terms.length) status.textContent = "";
    else status.textContent = `${shown} ${shown === 1 ? "entry matches" : "entries match"} “${input.value.trim()}”`;
    noResults.hidden = !(terms.length && shown === 0);
    noResults.textContent = `Nothing matches “${input.value.trim()}”. Try a company name, a place, or a broader word.`;
  }

  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(applySearch, 120); });
  input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; applySearch(); } });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
  });

  // ---------- expand / collapse all ----------
  const syncToggle = () => {
    const allOpen = entryDetails.every((d) => d.open);
    toggleAll.textContent = allOpen ? "Collapse all" : "Expand all";
    toggleAll.setAttribute("aria-pressed", String(allOpen));
  };
  toggleAll.addEventListener("click", () => {
    const open = !entryDetails.every((d) => d.open);
    entryDetails.forEach((d) => (d.open = open));
    openedBySearch = new Set();
    syncToggle();
  });
  entryDetails.forEach((d) => d.addEventListener("toggle", syncToggle));

  // ---------- open the targeted entry when arriving via a link ----------
  const openTarget = () => {
    const el = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const d = el?.classList.contains("entry") && el.querySelector("details");
    if (d) d.open = true;
  };
  window.addEventListener("hashchange", openTarget);
  openTarget();

  // ---------- table of contents: highlight current section ----------
  const tocLinks = new Map($$("[data-toc]").map((a) => [a.dataset.toc, a]));
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      tocLinks.forEach((a) => a.classList.remove("is-active"));
      tocLinks.get(e.target.id)?.classList.add("is-active");
    }
  }, { rootMargin: "-20% 0px -70% 0px" });
  $$("[data-section]").forEach((s) => observer.observe(s));

  // On small screens, close the mobile contents after picking a section.
  const mobileToc = $(".toc__mobile");
  const mq = matchMedia("(max-width: 999px)");
  if (mq.matches) mobileToc.open = false;
  mobileToc.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    // A section hidden by the current search can't be scrolled to, so clear the search first.
    const target = document.getElementById(a.hash.slice(1));
    if (target?.closest("[data-hidden]")) { input.value = ""; applySearch(); }
    if (mq.matches) mobileToc.open = false;
  });

  // ---------- copy citation ----------
  const copyBtn = $("[data-copy]");
  if (navigator.clipboard) {
    copyBtn.hidden = false;
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText($("[data-bibtex]").textContent);
        copyBtn.textContent = "Copied";
      } catch {
        copyBtn.textContent = "Copy failed";
      }
      setTimeout(() => (copyBtn.textContent = "Copy BibTeX"), 2000);
    });
  }
})();

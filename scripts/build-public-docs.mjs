import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const websiteDir = path.join(root, "website");
const outRoot = path.join(websiteDir, "dist", "docs");
const stylesPath = path.join(websiteDir, "styles.css");
const css = fs.readFileSync(stylesPath, "utf8");

const docs = [
  {
    slug: "executive-brief",
    title: "Executive Brief",
    source: path.join(root, "SELF_DOCS", "public", "executives", "EXECUTIVE-BRIEF.md"),
  },
  {
    slug: "pricing",
    title: "Pricing",
    source: path.join(root, "SELF_DOCS", "public", "business", "SELF-PRICING.md"),
  },
  {
    slug: "buy-sell-agreement",
    title: "Commercial Licensing Agreement (Escrow)",
    source: path.join(root, "SELF_DOCS", "public", "buyers", "BUY-SELL-AGREEMENT-ESCROW.md"),
  },
];

function escapeHtml(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(md) {
  let s = escapeHtml(md);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let inCode = false;
  let codeFence = "```";
  let codeLang = "";
  let listMode = null; // "ul" | "ol"
  let tableMode = false;
  let tableBuf = [];

  const closeList = () => {
    if (listMode) out.push(`</${listMode}>`);
    listMode = null;
  };

  const flushTable = () => {
    if (!tableMode) return;
    const block = tableBuf.join("\n");
    out.push(`<pre class="table"><code>${escapeHtml(block)}</code></pre>`);
    tableMode = false;
    tableBuf = [];
  };

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      flushTable();
      closeList();
      if (!inCode) {
        inCode = true;
        codeFence = line.slice(0, 3);
        codeLang = line.slice(3).trim();
        out.push(`<pre><code class="lang-${escapeHtml(codeLang)}">`);
      } else {
        inCode = false;
        out.push("</code></pre>");
      }
      i += 1;
      continue;
    }

    if (inCode) {
      out.push(escapeHtml(line) + "\n");
      i += 1;
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushTable();
      closeList();
      i += 1;
      continue;
    }

    if (trimmed === "---" || trimmed === "—" || trimmed === "–––") {
      flushTable();
      closeList();
      out.push("<hr />");
      i += 1;
      continue;
    }

    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushTable();
      closeList();
      const level = h[1].length;
      out.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // Detect markdown table (very rough): line with | then a separator line next.
    if (!tableMode && trimmed.includes("|")) {
      const next = (lines[i + 1] || "").trim();
      if (next && /^[\s|\-:]+$/.test(next) && next.includes("-") && next.includes("|")) {
        tableMode = true;
        tableBuf.push(line);
        tableBuf.push(lines[i + 1]);
        i += 2;
        continue;
      }
    }

    if (tableMode) {
      if (!trimmed || !trimmed.includes("|")) {
        flushTable();
        continue;
      }
      tableBuf.push(line);
      i += 1;
      continue;
    }

    const ul = trimmed.match(/^- (.*)$/);
    if (ul) {
      if (listMode !== "ul") {
        closeList();
        listMode = "ul";
        out.push("<ul>");
      }
      out.push(`<li>${renderInline(ul[1])}</li>`);
      i += 1;
      continue;
    }

    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listMode !== "ol") {
        closeList();
        listMode = "ol";
        out.push("<ol>");
      }
      out.push(`<li>${renderInline(ol[1])}</li>`);
      i += 1;
      continue;
    }

    flushTable();
    closeList();
    out.push(`<p>${renderInline(trimmed)}</p>`);
    i += 1;
  }

  flushTable();
  closeList();
  return out.join("\n");
}

function pageShell({ title, content, navHtml }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} — SELF Docs</title>
    <meta name="color-scheme" content="dark light" />
    <style>
${css}
    </style>
  </head>
  <body>
    <header class="header">
      <div class="container header-inner">
        <a class="brand" href="/" aria-label="SELF home">
          <span class="brand-mark" aria-hidden="true">SELF</span>
          <span class="brand-sub">Public Docs</span>
        </a>
        <div class="header-cta">
          <a class="btn btn-ghost" href="/docs/">Docs index</a>
          <a class="btn btn-primary" href="mailto:Kevin@governedbyself.com">Contact</a>
        </div>
      </div>
    </header>
    <main>
      <section class="section">
        <div class="container doc-layout">
          <aside class="doc-nav">
            <div class="panel">
              <h3>Docs</h3>
              ${navHtml}
            </div>
          </aside>
          <article class="doc">
            ${content}
          </article>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFileSafe(fp, text) {
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, text, "utf8");
}

const nav = `<ul class="bullets">
${docs
  .map((d) => `<li><a href="/docs/${d.slug}/">${escapeHtml(d.title)}</a></li>`)
  .join("\n")}
</ul>`;

const indexContent = `
<h1>SELF Public Docs</h1>
<p class="muted">Read the public-facing docs for pricing, licensing, and executive overview.</p>
${nav}
`;

writeFileSafe(path.join(outRoot, "index.html"), pageShell({ title: "Docs", content: indexContent, navHtml: nav }));

for (const doc of docs) {
  const md = fs.readFileSync(doc.source, "utf8");
  const rendered = renderMarkdown(md);
  const wrapped = `<h1>${escapeHtml(doc.title)}</h1>\n<div class="doc-body">\n${rendered}\n</div>`;
  writeFileSafe(
    path.join(outRoot, doc.slug, "index.html"),
    pageShell({ title: doc.title, content: wrapped, navHtml: nav }),
  );
}

console.log(`[build-public-docs] wrote ${docs.length + 1} pages under website/dist/docs/`);


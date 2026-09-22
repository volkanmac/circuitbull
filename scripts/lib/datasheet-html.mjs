/** Shared A4 catalog datasheet HTML for R2 CDN upload (Node scripts). */

function escape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function list(arr) {
  return (arr || []).map((x) => `<li>${escape(x)}</li>`).join("");
}

function deriveSlogan(content) {
  const explicit = String(content.slogan || "").trim();
  if (explicit) return explicit;
  const pitch = String(content.summary || content.description || "").trim();
  if (!pitch) return "Military-grade mission systems";
  const sentence = pitch.split(/(?<=[.!?])\s+/)[0] || pitch;
  return sentence.length > 140 ? `${sentence.slice(0, 137).trim()}…` : sentence;
}

const LABELS = {
  en: {
    meta: "Circuitbull® mission catalog",
    benefits: "Key Benefits",
    overview: "Overview",
    applications: "Applications",
    specs: "Technical Specification",
    description: "Description",
    footer: "Quoted & supported by Circuitbull® (Volls Global Inc)",
  },
  tr: {
    meta: "Circuitbull® görev kataloğu",
    benefits: "Temel Faydalar",
    overview: "Genel Bakış",
    applications: "Uygulamalar",
    specs: "Teknik Özellikler",
    description: "Açıklama",
    footer: "Circuitbull® (Volls Global Inc) tarafından desteklenir",
  },
};

function specRows(specs) {
  return Object.entries(specs || {})
    .map(([k, v]) => {
      const code = String(k).toLowerCase().replace(/\s+/g, "_");
      return `<tr><th>${escape(k)}<span class="code">${escape(code)}</span></th><td>${escape(v)}</td></tr>`;
    })
    .join("");
}

/**
 * A4 catalog-format datasheet HTML for CDN.
 * @param {object} content - { name, model, summary, description, slogan, benefits, overview, applications, specs, smartId, image }
 * @param {string} lang
 */
export function buildDatasheetHtml(content, lang = "en") {
  const name = content.name || "Product";
  const model = content.model || "—";
  const smartId = content.smartId || content.sku || "";
  const benefits = content.benefits || [];
  const overview = content.overview || [];
  const applications = content.applications || [];
  const specs = content.specs || {};
  const description = content.description || content.summary || "";
  const slogan = deriveSlogan(content);
  const image = content.image || "";
  const L = LABELS[lang] || LABELS.en;

  return `<!DOCTYPE html>
<html lang="${escape(lang)}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escape(name)} Datasheet | Circuitbull®</title>
<style>
:root{--sand:#F4F3EF;--sand-warm:#EDE6D4;--fg:#2B261F;--muted:#5C564C;--line:rgba(43,38,31,.16);--brand:#4B5320;--coyote:#A67C52}
*{box-sizing:border-box}
body{margin:0;background:#d8d2c4;color:var(--fg);font-family:"IBM Plex Sans",system-ui,sans-serif}
.sheet{display:flex;flex-direction:column;align-items:center;gap:1.25rem;padding:1.25rem}
.page{width:min(100%,210mm);min-height:297mm;background:var(--sand);padding:14mm;box-shadow:0 12px 40px rgba(43,38,31,.18);page-break-after:always;display:flex;flex-direction:column}
.chrome{display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted)}
.chrome-top{border-bottom:1px solid var(--line);padding-bottom:.5rem;margin-bottom:.9rem}
.chrome-bot{margin-top:auto;border-top:1px solid var(--line);padding-top:.5rem}
.brand{font-family:"Barlow Condensed",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--fg)}
.brand span{color:var(--brand)}
.hero{display:grid;grid-template-rows:1.1fr 1fr;gap:1rem;flex:1}
.visual{background:var(--sand-warm);border:1px solid var(--line);overflow:hidden;display:flex;align-items:center;justify-content:center}
.visual img{width:100%;height:100%;object-fit:cover}
h1{font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:2.4rem;line-height:1.05;text-transform:uppercase;margin:.2rem 0}
.slogan{font-weight:600;color:var(--brand);font-size:1.05rem;max-width:36ch}
.kicker{font-family:"IBM Plex Mono",monospace;font-size:.72rem;color:var(--coyote);text-transform:uppercase;letter-spacing:.08em}
h2{font-family:"Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--brand);font-size:1.05rem;margin:1rem 0 .45rem}
ul{padding-left:1.1rem;margin:0;line-height:1.45}
table{border-collapse:collapse;width:100%;font-size:.78rem}
th,td{border-bottom:1px solid var(--line);padding:.42rem .35rem;text-align:left;vertical-align:top}
th{width:42%;font-weight:600}.code{display:block;font-family:"IBM Plex Mono",monospace;font-size:.65rem;color:var(--coyote);font-weight:400;text-transform:lowercase}
@page{size:A4;margin:0}
@media print{body{background:#fff}.sheet{padding:0;gap:0}.page{box-shadow:none;width:210mm;height:297mm}}
</style>
</head>
<body>
<main class="sheet">
<article class="page">
  <div class="chrome chrome-top"><div class="brand">Circuit<span>bull</span>®</div><div>${escape(smartId)} · ${escape(name)}</div></div>
  <div class="hero">
    <div class="visual">${image ? `<img src="${escape(image)}" alt="${escape(name)}"/>` : "Circuitbull®"}</div>
    <div>
      <p class="kicker">${escape(L.meta)} · ${escape(smartId || model)}</p>
      <h1>${escape(name)}</h1>
      <p class="slogan">${escape(slogan)}</p>
      ${model ? `<p class="kicker">${escape(model)}</p>` : ""}
      ${benefits.length ? `<h2>${escape(L.benefits)}</h2><ul>${list(benefits)}</ul>` : ""}
    </div>
  </div>
  <div class="chrome chrome-bot"><span>${escape(L.footer)}</span><span>1</span></div>
</article>
<article class="page">
  <div class="chrome chrome-top"><div class="brand">Circuit<span>bull</span>®</div><div>${escape(smartId)} · ${escape(name)}</div></div>
  ${description ? `<h2>${escape(L.description)}</h2><p>${escape(description)}</p>` : ""}
  ${overview.length ? `<h2>${escape(L.overview)}</h2><ul>${list(overview)}</ul>` : ""}
  ${applications.length ? `<h2>${escape(L.applications)}</h2><ul>${list(applications)}</ul>` : ""}
  ${Object.keys(specs).length ? `<h2>${escape(L.specs)}</h2><table>${specRows(specs)}</table>` : ""}
  <div class="chrome chrome-bot"><span>${escape(L.footer)}</span><span>2</span></div>
</article>
</main>
</body>
</html>`;
}

export function stripHtmlToText(html, max = 28000) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/(h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, max);
}

export { deriveSlogan };

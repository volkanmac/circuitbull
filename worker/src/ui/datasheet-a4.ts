/** A4 multi-page catalog datasheet renderer (print + PDF friendly). */

import { displaySku, groupFactsForDisplay } from "../i18n/facts";
import { DEFAULT_LANG, datasheetPath as localeDatasheetPath, productPath, SITE_LOCALES } from "../i18n/locales";
import { cdnUrl, datasheetNameSlug, escapeHtml } from "./shell";
import { inlineMarkSvg } from "./brand-assets";

export type DatasheetCopy = {
  lang: string;
  name: string;
  summary: string;
  description: string;
  slogan: string;
  benefits: string[];
  overview: string[];
  applications: string[];
  specs: Record<string, string>;
  translated?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

const LABELS: Record<string, Record<string, string>> = {
  en: {
    catalog: "Mission catalog",
    keyBenefits: "Key benefits",
    overview: "Overview",
    applications: "Applications",
    specs: "Technical specification",
    description: "Description",
    download: "Download PDF",
    print: "Print PDF",
    back: "Back to product",
    page: "Page",
    of: "of",
    model: "Model",
    sku: "SKU",
    footer: "Quoted & supported by Circuitbull® (Volls Global Inc)",
    printHint: "Download saves a PDF file · Print opens the print dialog",
  },
  tr: {
    catalog: "Görev kataloğu",
    keyBenefits: "Temel faydalar",
    overview: "Genel bakış",
    applications: "Uygulamalar",
    specs: "Teknik özellikler",
    description: "Açıklama",
    download: "PDF indir",
    print: "PDF yazdır",
    back: "Ürüne dön",
    page: "Sayfa",
    of: "/",
    model: "Model",
    sku: "SKU",
    footer: "Circuitbull® (Volls Global Inc) tarafından desteklenir",
    printHint: "İndir PDF dosyası kaydeder · Yazdır yazdırma penceresini açar",
  },
  de: {
    catalog: "Missionskatalog",
    keyBenefits: "Wichtigste Vorteile",
    overview: "Überblick",
    applications: "Anwendungen",
    specs: "Technische Daten",
    description: "Beschreibung",
    download: "PDF herunterladen",
    print: "PDF drucken",
    back: "Zum Produkt",
    page: "Seite",
    of: "von",
    model: "Modell",
    sku: "SKU",
    footer: "Angeboten & unterstützt von Circuitbull® (Volls Global Inc)",
    printHint: "Download speichert eine PDF-Datei · Drucken öffnet den Druckdialog",
  },
  fr: {
    catalog: "Catalogue mission",
    keyBenefits: "Avantages clés",
    overview: "Aperçu",
    applications: "Applications",
    specs: "Spécifications techniques",
    description: "Description",
    download: "Télécharger PDF",
    print: "Imprimer PDF",
    back: "Retour produit",
    page: "Page",
    of: "sur",
    model: "Modèle",
    sku: "SKU",
    footer: "Proposé et supporté par Circuitbull® (Volls Global Inc)",
    printHint: "Télécharger enregistre un fichier PDF · Imprimer ouvre la boîte de dialogue",
  },
  es: {
    catalog: "Catálogo de misión",
    keyBenefits: "Beneficios clave",
    overview: "Resumen",
    applications: "Aplicaciones",
    specs: "Especificaciones técnicas",
    description: "Descripción",
    download: "Descargar PDF",
    print: "Imprimir PDF",
    back: "Volver al producto",
    page: "Página",
    of: "de",
    model: "Modelo",
    sku: "SKU",
    footer: "Cotizado y soportado por Circuitbull® (Volls Global Inc)",
    printHint: "Descargar guarda un archivo PDF · Imprimir abre el diálogo de impresión",
  },
  ar: {
    catalog: "كتالوج المهام",
    keyBenefits: "الفوائد الرئيسية",
    overview: "نظرة عامة",
    applications: "التطبيقات",
    specs: "المواصفات الفنية",
    description: "الوصف",
    download: "تنزيل PDF",
    print: "طباعة PDF",
    back: "العودة للمنتج",
    page: "صفحة",
    of: "من",
    model: "الطراز",
    sku: "SKU",
    footer: "مدعوم من Circuitbull® (Volls Global Inc)",
    printHint: "التنزيل يحفظ ملف PDF · الطباعة تفتح مربع حوار الطباعة",
  },
  ru: {
    catalog: "Каталог миссий",
    keyBenefits: "Ключевые преимущества",
    overview: "Обзор",
    applications: "Применения",
    specs: "Технические характеристики",
    description: "Описание",
    download: "Скачать PDF",
    print: "Печать PDF",
    back: "К продукту",
    page: "Стр.",
    of: "из",
    model: "Модель",
    sku: "SKU",
    footer: "Поддержка Circuitbull® (Volls Global Inc)",
    printHint: "Скачать сохраняет PDF-файл · Печать открывает диалог печати",
  },
  it: {
    catalog: "Catalogo mission",
    keyBenefits: "Vantaggi chiave",
    overview: "Panoramica",
    applications: "Applicazioni",
    specs: "Specifiche tecniche",
    description: "Descrizione",
    download: "Scarica PDF",
    print: "Stampa PDF",
    back: "Torna al prodotto",
    page: "Pagina",
    of: "di",
    model: "Modello",
    sku: "SKU",
    footer: "Supportato da Circuitbull® (Volls Global Inc)",
    printHint: "Scarica salva un file PDF · Stampa apre la finestra di stampa",
  },
  ko: {
    catalog: "미션 카탈로그",
    keyBenefits: "주요 이점",
    overview: "개요",
    applications: "적용 분야",
    specs: "기술 사양",
    description: "설명",
    download: "PDF 다운로드",
    print: "PDF 인쇄",
    back: "제품으로",
    page: "페이지",
    of: "/",
    model: "모델",
    sku: "SKU",
    footer: "Circuitbull® (Volls Global Inc) 지원",
    printHint: "다운로드는 PDF 파일을 저장합니다 · 인쇄는 인쇄 대화상자를 엽니다",
  },
  "zh-Hant": {
    catalog: "任務型錄",
    keyBenefits: "主要優勢",
    overview: "概述",
    applications: "應用",
    specs: "技術規格",
    description: "說明",
    download: "下載 PDF",
    print: "列印 PDF",
    back: "返回產品",
    page: "頁",
    of: "/",
    model: "型號",
    sku: "SKU",
    footer: "由 Circuitbull® (Volls Global Inc) 支援",
    printHint: "下載會儲存 PDF 檔案 · 列印會開啟列印對話框",
  },
};

function L(lang: string) {
  return LABELS[lang] || LABELS.en;
}

/** Slogan from explicit field or short pitch derived from summary. */
export function deriveSlogan(p: any, copy: { slogan?: string; summary?: string; description?: string }) {
  const explicit = String(copy.slogan || p?.slogan || p?.i18n?.en?.slogan || "").trim();
  if (explicit) return explicit;
  const pitch = String(copy.summary || copy.description || p?.summary || "").trim();
  if (!pitch) return "Military-grade mission systems";
  const sentence = pitch.split(/(?<=[.!?])\s+/)[0] || pitch;
  return sentence.length > 140 ? `${sentence.slice(0, 137).trim()}…` : sentence;
}

/** Benefits with sensible fallbacks from overview when empty. */
export function deriveBenefits(copy: DatasheetCopy): string[] {
  if (copy.benefits?.length) return copy.benefits.slice(0, 8);
  if (copy.overview?.length) return copy.overview.slice(0, 6);
  return [];
}

const ROWS_PER_PAGE = 18;

function chunkRows<T>(rows: T[], size: number): T[][] {
  if (!rows.length) return [];
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

function pageHeader(sku: string, name: string) {
  return `<header class="a4-chrome a4-chrome-top">
    <div class="a4-brand">${inlineMarkSvg()}<span>Circuit<span class="bull">bull</span>®</span></div>
    <div class="a4-chrome-meta">${escapeHtml(sku)} · ${escapeHtml(name)}</div>
  </header>`;
}

function pageFooter(labels: Record<string, string>, pageNum: number, totalPages: number) {
  return `<footer class="a4-chrome a4-chrome-bot">
    <span>${escapeHtml(labels.footer)}</span>
    <span>${escapeHtml(labels.page)} ${pageNum} ${escapeHtml(labels.of)} ${totalPages}</span>
  </footer>`;
}

type SpecRow = { label: string; code: string; value: string; groupLabel?: string };

function collectSpecRows(p: any, copy: DatasheetCopy, lang: string): SpecRow[] {
  const factGroups = groupFactsForDisplay(p.facts || [], lang);
  if (factGroups.length) {
    const rows: SpecRow[] = [];
    for (const g of factGroups) {
      for (const it of g.items) {
        rows.push({
          label: it.label,
          code: (it.factCode || String(it.id || "")).toLowerCase(),
          value: it.value,
          groupLabel: g.label,
        });
      }
    }
    return rows;
  }
  return Object.entries(copy.specs || {}).map(([k, v]) => ({
    label: k,
    code: String(k).toLowerCase().replace(/\s+/g, "_"),
    value: String(v),
  }));
}

function specTable(rows: SpecRow[], showGroup: boolean) {
  let lastGroup = "";
  const body = rows
    .map((r) => {
      let groupRow = "";
      if (showGroup && r.groupLabel && r.groupLabel !== lastGroup) {
        lastGroup = r.groupLabel;
        groupRow = `<tr class="a4-group"><th colspan="2">${escapeHtml(r.groupLabel)}</th></tr>`;
      }
      return `${groupRow}<tr>
        <th scope="row">${escapeHtml(r.label)}</th>
        <td>${escapeHtml(r.value)}</td>
      </tr>`;
    })
    .join("");
  return `<table class="a4-spec"><tbody>${body}</tbody></table>`;
}

export function datasheetPath(lang: string, slug: string) {
  return localeDatasheetPath(lang, slug);
}

export function datasheetPdfPath(lang: string, slug: string) {
  return `${datasheetPath(lang, slug)}.pdf`;
}

/** R2 / CDN key for catalog PDF (not scraped source PDFs). */
export function catalogPdfKey(mediaSlug: string, lang: string) {
  const l = lang || DEFAULT_LANG;
  if (l === DEFAULT_LANG) return `products/${mediaSlug}.pdf`;
  return `products/${mediaSlug}-${l}.pdf`;
}

/** Sanitize a product display name into a download basename (no extension). */
export function pdfDownloadBasename(displayName: unknown, fallbackSlug = "datasheet") {
  const strip = (s: string) =>
    String(s || "")
      .replace(/[\x00-\x1f\x7f]/g, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\.+$/g, "");
  const utf8 = strip(String(displayName || "")).slice(0, 180);
  const ascii = strip(
    String(displayName || "")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
  ).slice(0, 180);
  const slugAscii = strip(String(fallbackSlug || "").replace(/[^\x20-\x7E]/g, "")) || "datasheet";
  return {
    utf8: utf8 || ascii || slugAscii,
    ascii: ascii || slugAscii,
  };
}

/** Content-Disposition for a real PDF attachment (ASCII filename + UTF-8 filename*). */
export function pdfContentDisposition(displayName: unknown, fallbackSlug = "datasheet") {
  const { utf8, ascii } = pdfDownloadBasename(displayName, fallbackSlug);
  const asciiFile = `${ascii}.pdf`.replace(/"/g, "");
  const utf8File = `${utf8}.pdf`;
  return `attachment; filename="${asciiFile}"; filename*=UTF-8''${encodeURIComponent(utf8File)}`;
}

/** True when bytes look like a PDF (%PDF). */
export function looksLikePdf(bytes: ArrayBuffer | Uint8Array | null | undefined) {
  if (!bytes) return false;
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return u8.length >= 4 && u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46;
}

export function renderA4Datasheet(opts: {
  product: any;
  copy: DatasheetCopy;
  lang: string;
  autoPrint?: boolean;
}): string {
  const { product: p, copy, lang, autoPrint } = opts;
  const labels = L(lang);
  const sku = displaySku(p);
  const slogan = deriveSlogan(p, copy);
  const benefits = deriveBenefits(copy);
  const hero = cdnUrl(p.image);
  const productHref = productPath(lang, p.slug);
  const pdfHref = datasheetPdfPath(lang, p.slug);
  const mediaSlug = p.cdn?.slug || p.slug || "";
  const nameSlug = p.cdn?.datasheetSlugs?.[lang] || p.cdn?.datasheetSlugs?.en || datasheetNameSlug(copy.name);
  const downloadBase = pdfDownloadBasename(copy.name || p.model || nameSlug, nameSlug).ascii;
  const dir = lang === "ar" ? ' dir="rtl"' : "";

  const specRows = collectSpecRows(p, copy, lang);
  const hasDesc = Boolean(copy.description && copy.description !== copy.summary);
  const extraSections: string[] = [];

  if (hasDesc) {
    extraSections.push(`
      <section class="a4-block">
        <h2>${escapeHtml(labels.description)}</h2>
        <p class="a4-prose">${escapeHtml(copy.description)}</p>
      </section>`);
  }
  if (copy.overview?.length && !(benefits.length && !copy.benefits?.length)) {
    extraSections.push(`
      <section class="a4-block">
        <h2>${escapeHtml(labels.overview)}</h2>
        <ul class="a4-list">${copy.overview.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </section>`);
  }
  if (copy.applications?.length) {
    extraSections.push(`
      <section class="a4-block">
        <h2>${escapeHtml(labels.applications)}</h2>
        <ul class="a4-list">${copy.applications.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </section>`);
  }

  // Build page bodies first, then wrap with chrome + correct page numbers
  const bodies: string[] = [];

  bodies.push(`
  <div class="a4-hero-grid">
    <div class="a4-hero-visual">
      ${hero ? `<img src="${escapeHtml(hero)}" alt="${escapeHtml(copy.name)}"/>` : `<div class="a4-hero-placeholder">Circuitbull®</div>`}
    </div>
    <div class="a4-hero-copy">
      <p class="a4-kicker">${escapeHtml(labels.catalog)} · ${escapeHtml(sku)}</p>
      <h1 class="a4-title">${escapeHtml(copy.name)}</h1>
      <p class="a4-slogan">${escapeHtml(slogan)}</p>
      ${p.model ? `<p class="a4-model">${escapeHtml(labels.model)} ${escapeHtml(p.model)}</p>` : ""}
      ${
        benefits.length
          ? `<div class="a4-benefits">
        <h2>${escapeHtml(labels.keyBenefits)}</h2>
        <ul>${benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
      </div>`
          : ""
      }
    </div>
  </div>`);

  const showGroup = Boolean((p.facts || []).length);
  const firstSpecBudget = Math.max(8, ROWS_PER_PAGE - (extraSections.length ? 6 : 0));
  const remaining = [...specRows];
  const firstBatch = remaining.splice(0, firstSpecBudget);
  const continuation = chunkRows(remaining, ROWS_PER_PAGE);

  if (firstBatch.length || extraSections.length) {
    bodies.push(`
  <div class="a4-body">
    ${extraSections.join("")}
    ${
      firstBatch.length
        ? `<section class="a4-block">
      <h2>${escapeHtml(labels.specs)}</h2>
      ${specTable(firstBatch, showGroup)}
    </section>`
        : ""
    }
  </div>`);
  }

  for (const batch of continuation) {
    bodies.push(`
  <div class="a4-body">
    <section class="a4-block">
      <h2>${escapeHtml(labels.specs)}</h2>
      ${specTable(batch, showGroup)}
    </section>
  </div>`);
  }

  const totalPages = bodies.length;
  const hdr = pageHeader(sku, copy.name);
  const finalPages = bodies.map((body, i) => {
    const cls = i === 0 ? "a4-page a4-hero-page" : "a4-page";
    return `<article class="${cls}">
  ${hdr}
  ${body}
  ${pageFooter(labels, i + 1, totalPages)}
</article>`;
  });

  const hreflang = SITE_LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="https://circuitbull.com${datasheetPath(l, p.slug)}"/>`
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}"${dir}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(copy.name)} · Datasheet | Circuitbull®</title>
<meta name="description" content="${escapeHtml((copy.seoDescription || slogan).slice(0, 170))}"/>
<link rel="canonical" href="https://circuitbull.com${datasheetPath(lang, p.slug)}"/>
${hreflang}
<meta name="robots" content="index,follow"/>
<meta name="theme-color" content="#F4F3EF"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
${A4_CSS}
</style>
</head>
<body class="a4-doc${autoPrint ? " a4-autoprint" : ""}" data-slug="${escapeHtml(p.slug)}" data-lang="${escapeHtml(lang)}" data-media-slug="${escapeHtml(mediaSlug)}">
<div class="a4-toolbar no-print">
  <a class="a4-tb-back" href="${escapeHtml(productHref)}">${escapeHtml(labels.back)}</a>
  <div class="a4-tb-actions">
    <button type="button" class="a4-tb-btn a4-tb-print" id="a4-print">${escapeHtml(labels.print)}</button>
    <a class="a4-tb-btn a4-tb-download" id="a4-download" href="${escapeHtml(pdfHref)}" download="${escapeHtml(downloadBase)}.pdf">${escapeHtml(labels.download)}</a>
  </div>
  <p class="a4-tb-hint">${escapeHtml(labels.printHint)}</p>
</div>
<main class="a4-sheet">
${finalPages.join("\n")}
</main>
<script>
(function(){
  var printBtn=document.getElementById('a4-print');
  if(printBtn) printBtn.addEventListener('click', function(){ window.print(); });
  // Download is a real <a download> to /…/datasheet.pdf (Content-Disposition: attachment). Never call print().
  if(document.body.classList.contains('a4-autoprint')){
    setTimeout(function(){ window.print(); }, 400);
  }
})();
</script>
</body>
</html>`;
}

const A4_CSS = `
:root {
  --sand: #F4F3EF;
  --sand-warm: #EDE6D4;
  --fg: #2B261F;
  --muted: #5C564C;
  --line: rgba(43, 38, 31, .16);
  --brand: #4B5320;
  --coyote: #A67C52;
  --cta: #D96B27;
  --font-display: "Barlow Condensed", sans-serif;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --a4-w: 210mm;
  --a4-h: 297mm;
  --a4-pad: 14mm;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #d8d2c4; color: var(--fg); font-family: var(--font-body); }
.a4-toolbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1rem;
  padding: .75rem 1.1rem; background: rgba(244,243,239,.96);
  border-bottom: 1px solid var(--line); backdrop-filter: blur(8px);
}
.a4-tb-back { color: var(--brand); font-weight: 600; text-decoration: none; font-size: .9rem; }
.a4-tb-actions { display: flex; gap: .5rem; margin-left: auto; }
.a4-tb-btn {
  appearance: none; border: 1px solid var(--line); background: #fff;
  color: var(--fg); font: 600 .85rem var(--font-body);
  padding: .45rem .85rem; border-radius: 2px; cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center;
}
.a4-tb-print {
  background: transparent; color: var(--fg); border-color: var(--line);
}
.a4-tb-print:hover { border-color: var(--brand); color: var(--brand); }
.a4-tb-download {
  background: var(--brand); color: #F4F3EF; border-color: var(--brand);
}
.a4-tb-download:hover { background: var(--cta); border-color: var(--cta); color: #fff; }
.a4-tb-hint { width: 100%; margin: 0; font-size: .75rem; color: var(--muted); }
.a4-sheet {
  display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
  padding: 1.25rem 1rem 3rem;
}
.a4-page {
  position: relative;
  width: min(100%, var(--a4-w));
  min-height: var(--a4-h);
  background: var(--sand);
  color: var(--fg);
  box-shadow: 0 12px 40px rgba(43,38,31,.18);
  padding: var(--a4-pad);
  display: flex; flex-direction: column;
  page-break-after: always;
  break-after: page;
}
.a4-chrome {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .68rem; color: var(--muted); letter-spacing: .02em;
}
.a4-chrome-top { padding-bottom: .55rem; border-bottom: 1px solid var(--line); margin-bottom: .9rem; }
.a4-chrome-bot {
  margin-top: auto; padding-top: .55rem; border-top: 1px solid var(--line);
}
.a4-brand {
  display: inline-flex; align-items: center; gap: .4rem;
  font-family: var(--font-display); font-weight: 700; font-size: .95rem;
  text-transform: uppercase; color: var(--fg); letter-spacing: .04em;
}
.a4-brand svg { width: 1.1rem; height: 1.1rem; }
.a4-brand .bull { color: var(--brand); }
.a4-chrome-meta { font-family: var(--font-mono); max-width: 55%; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.a4-hero-grid {
  flex: 1; display: grid; grid-template-rows: 1.15fr 1fr; gap: 1rem; min-height: 0;
}
.a4-hero-visual {
  background: var(--sand-warm); border: 1px solid var(--line); overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.a4-hero-visual img { width: 100%; height: 100%; object-fit: cover; display: block; }
.a4-hero-placeholder {
  font-family: var(--font-display); font-size: 2rem; font-weight: 700;
  color: var(--brand); letter-spacing: .06em; text-transform: uppercase;
}
.a4-hero-copy { display: flex; flex-direction: column; gap: .55rem; min-height: 0; }
.a4-kicker {
  margin: 0; font-family: var(--font-mono); font-size: .72rem;
  color: var(--coyote); text-transform: uppercase; letter-spacing: .08em;
}
.a4-title {
  margin: 0; font-family: var(--font-display); font-weight: 800;
  font-size: clamp(1.85rem, 4.2vw, 2.65rem); line-height: 1.05;
  text-transform: uppercase; letter-spacing: .02em; color: var(--fg);
}
.a4-slogan {
  margin: 0; font-size: 1.05rem; font-weight: 600; color: var(--brand);
  line-height: 1.35; max-width: 36ch;
}
.a4-model { margin: 0; font-family: var(--font-mono); font-size: .8rem; color: var(--muted); }
.a4-benefits h2, .a4-block h2 {
  margin: 0 0 .45rem; font-family: var(--font-display); font-weight: 700;
  font-size: 1.05rem; text-transform: uppercase; letter-spacing: .05em; color: var(--brand);
}
.a4-benefits ul, .a4-list {
  margin: 0; padding-left: 1.1rem; color: var(--fg); font-size: .92rem; line-height: 1.45;
}
.a4-benefits li, .a4-list li { margin: .28rem 0; }
.a4-body { flex: 1; display: flex; flex-direction: column; gap: 1rem; min-height: 0; }
.a4-block { break-inside: avoid; }
.a4-prose { margin: 0; font-size: .9rem; line-height: 1.5; color: var(--fg); }
.a4-spec { width: 100%; border-collapse: collapse; font-size: .78rem; }
.a4-spec th, .a4-spec td {
  border-bottom: 1px solid var(--line); padding: .42rem .35rem; vertical-align: top; text-align: left;
}
.a4-spec th { width: 42%; font-weight: 600; color: var(--fg); }
.a4-spec td { color: var(--muted); }
.a4-group th {
  background: var(--sand-warm); color: var(--brand);
  font-family: var(--font-display); text-transform: uppercase; letter-spacing: .04em;
  font-size: .82rem; border-bottom: 1px solid var(--line); padding: .55rem .35rem;
}
.a4-fact-label { display: grid; gap: .12rem; }
.a4-fact-code {
  font-family: var(--font-mono); font-size: .65rem; font-weight: 400;
  color: var(--coyote); text-transform: lowercase; letter-spacing: .02em;
}
@media screen and (max-width: 720px) {
  .a4-page { min-height: auto; }
  .a4-hero-grid { grid-template-rows: auto auto; }
  .a4-hero-visual { aspect-ratio: 4/3; }
}
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  .no-print { display: none !important; }
  .a4-sheet { padding: 0; gap: 0; }
  .a4-page {
    width: var(--a4-w); height: var(--a4-h); min-height: var(--a4-h);
    box-shadow: none; margin: 0; page-break-after: always; break-after: page;
  }
  .a4-page:last-child { page-break-after: auto; break-after: auto; }
}
`;

/** G2G / EPC+F investment manifesto — homepage #invest and /invest pitch page. */

import { CALL_SWITCHBOARD_URL, HQ_PHONE_DISPLAY, contactPath } from "../i18n/locales";
import { escapeHtml } from "./shell";

export type InvestCopy = {
  kicker: string;
  title: string;
  lede: string;
  ctaScope: string;
  ctaG2g: string;
  manifestoKicker: string;
  manifestoTitle: string;
  manifestoQuote: string;
  ruleLead: string;
  pillars: { code: string; title: string; body: string }[];
  techKicker: string;
  techTitle: string;
  tech: { code: string; title: string; body: string }[];
  epcKicker: string;
  epcTitle: string;
  epcLead: string;
  epc: { code: string; title: string; body: string }[];
  closeKicker: string;
  closeQuote: string;
  protocolOffice: string;
  protocolLine: string;
  ministryKicker: string;
  ministryTitle: string;
  ministryLead: string;
  ministries: { code: string; title: string; body: string }[];
  offsetKicker: string;
  offsetTitle: string;
  offsetLead: string;
  offset: { code: string; title: string; body: string }[];
  ndaCta: string;
  pageTitle: string;
  pageDescription: string;
};

const EN: InvestCopy = {
  kicker: "Corporate & diplomatic launchpad · EPC+F",
  title: "Looking for an investor?",
  lede: "When your country’s budget cannot cover a qualified defense or industrial program, Circuitbull invests in you. Equipment is delivered and the keys are yours — you repay in structured installments under a clear B2B financing partnership.",
  ctaScope: "Define your strategic investment envelope",
  ctaG2g: "Request a direct inter-state briefing",
  manifestoKicker: "Investment partnership",
  manifestoTitle: "We invest. You take delivery. You pay in installments.",
  manifestoQuote:
    "A state that cannot protect its borders today cannot protect its future. Classic supply chains, tender cycles, and years of financing approvals leave dangerous gaps. Circuitbull® — Made in USA under Volls Global — steps in as the investor when local capital falls short.",
  ruleLead: "In inter-state defense cooperation, the partnership works like this:",
  pillars: [
    {
      code: "We invest",
      title: "Capital when budgets fall short",
      body: "Qualified defense and industrial programs need not wait for a full appropriation cycle. We fund the envelope so the mission can start.",
    },
    {
      code: "Keys yours",
      title: "Equipment delivered to you",
      body: "Hardware ships, installs, and hands over turnkey. Title and operational control stay with you — not with a lease held hostage.",
    },
    {
      code: "Installments",
      title: "Structured repayment",
      body: "You repay on an agreed installment schedule. Corporate B2B financing — not consumer credit, not predatory terms.",
    },
  ],
  techKicker: "Core technologies",
  techTitle: "Intelligence that sees beyond the line",
  tech: [
    {
      code: "MWIR",
      title: "Cooled mid-wave infrared",
      body: "Dewar-cooler thermal cores that discriminate human and vehicle movement at 40+ km — night, fog, dust storm, and jamming conditions.",
    },
    {
      code: "UAV",
      title: "Tactical UAV & swarm ISR",
      body: "Persistent endurance, autonomous return under comms blackout (anti-jamming), and AI real-time target track across the border belt.",
    },
    {
      code: "C4ISR",
      title: "Border intelligence nerve",
      body: "A command fabric that fuses every sensor in milliseconds and cues deterrent elements on incursion — with or without a human in the loop.",
    },
  ],
  epcKicker: "EPC+F advantage",
  epcTitle: "You request it. We invest. You take the keys.",
  epcLead:
    "For finance and defense ministries that must raise national security without waiting for a full budget line — we finance, deliver, and you repay in installments.",
  epc: [
    {
      code: "E",
      title: "Engineering",
      body: "Topographic and geopolitical survey of your border. Blind spots mapped with AI simulation before steel hits soil.",
    },
    {
      code: "P+C",
      title: "Procurement & construction",
      body: "Military-class hardware, shortest path to the field, installed turnkey. One contractor, one schedule, one handover — keys in your hands.",
    },
    {
      code: "F",
      title: "Financing",
      body: "We carry the capital load. You receive the capability and repay on a structured installment plan aligned to sovereign cash flow.",
    },
  ],
  closeKicker: "Direct message to decision-makers",
  closeQuote:
    "Your country’s border security is not a cost line. It is an existence guarantee. If local budgets fall short and you need an investor who delivers equipment, hands you the keys, and structures installment repayment — you are in the right room.",
  protocolOffice: "Direct Directorate of Strategic Projects & State Relations",
  protocolLine: "Protocol line · info@circuitbull.com · +1 276 600 2052",
  ministryKicker: "Duty products · ministries",
  ministryTitle: "Water, Interior, Defence, National Security",
  ministryLead:
    "Ministries of water, interior, defence, and national security need Circuitbull® products. Appropriation is often missing. That does not stop an official program.",
  ministries: [
    {
      code: "Need",
      title: "The mission is real",
      body: "Water systems, interior security, defence bases, and national-security borders are duty products — not optional catalog items.",
    },
    {
      code: "Budget",
      title: "Appropriation is often missing",
      body: "Classic tender cycles wait for a budget line that may never land. The gap is operational, not technical.",
    },
    {
      code: "NDA",
      title: "Official session first",
      body: "We open a ministry session under NDA: we listen to your project, or we present a solution. Volls Global Inc / Circuitbull® — G2G–B2G, not informal barter.",
    },
  ],
  offsetKicker: "Commodity-backed repayment · official offset",
  offsetTitle: "Any country’s minerals and commodities — most welcome.",
  offsetLead:
    "Repayment can be structured as official G2G/B2B offset under NDA — not informal barter. Underground minerals, natural resources, and commodity products from any country are most welcome. Quantities and prices are set in the NDA session; they are never invented on this page or by ChatGPT.",
  offset: [
    {
      code: "ALL",
      title: "Any country — resource-backed",
      body: "Oil, gas, gold, metals, or other underground minerals and commodity products. Official offset under NDA — most welcome from any state that wants to structure repayment this way.",
    },
    {
      code: "EX",
      title: "Examples — oil & gold",
      body: "Structured programs have included Iraq oil-backed and selected Africa gold-backed offsets. These are examples of how an official offset can look — not the only path.",
    },
    {
      code: "F",
      title: "No cash yet — EPC+F",
      body: "When cash is missing, installment EPC+F or inter-state G2G still works. The program can start once the protocol is signed.",
    },
  ],
  ndaCta: "Official NDA session — we listen to your project or present a solution",
  pageTitle: "Looking for an Investor? | Circuitbull® EPC+F",
  pageDescription:
    "Circuitbull invests when ministry budgets fall short. Official NDA session; resource- and commodity-backed G2G offset from any country — not informal barter.",
};

const TR: InvestCopy = {
  kicker: "Kurumsal & diplomatik sıçrama tahtası · EPC+F",
  title: "Yatırımcı mı arıyorsunuz?",
  lede: "Ülkenizin bütçesi nitelikli bir savunma veya endüstriyel programı karşılayamıyorsa, Circuitbull size yatırım yapar. Ekipman teslim edilir, anahtar sizde kalır — geri ödemeyi net bir B2B finansman ortaklığı altında taksitlerle yaparsınız.",
  ctaScope: "Stratejik yatırım kapsamınızı belirleyin",
  ctaG2g: "Devletler arası doğrudan görüşme talep edin",
  manifestoKicker: "Yatırım ortaklığı",
  manifestoTitle: "Biz yatırırız. Siz teslim alırsınız. Taksitle ödersiniz.",
  manifestoQuote:
    "Bugün sınırlarını koruyamayan hiçbir devlet, geleceğini de koruyamaz. Klasik tedarik zincirleri, ihale süreçleri ve yıllar süren finansman onayları tehlikeli boşluklar bırakır. Circuitbull® — Volls Global altında Made in USA — yerel sermaye yetmediğinde yatırımcı olarak devreye girer.",
  ruleLead: "Devletlerarası savunma iş birliklerinde ortaklık şöyle işler:",
  pillars: [
    {
      code: "Biz yatırırız",
      title: "Bütçe yetmediğinde sermaye",
      body: "Nitelikli savunma ve endüstriyel programlar tam ödenek döngüsünü beklemek zorunda değildir. Görevin başlaması için kapsamı biz finanse ederiz.",
    },
    {
      code: "Anahtar sizde",
      title: "Ekipman size teslim",
      body: "Donanım sevk edilir, kurulur, anahtar teslim edilir. Mülkiyet ve operasyonel kontrol sizde kalır — rehinli kira değil.",
    },
    {
      code: "Taksit",
      title: "Yapılandırılmış geri ödeme",
      body: "Anlaşılmış taksit planıyla geri ödersiniz. Kurumsal B2B finansman — tüketici kredisi değil, yağmacı şartlar değil.",
    },
  ],
  techKicker: "Çekirdek teknolojiler",
  techTitle: "Sınırın ötesini gören akıl",
  tech: [
    {
      code: "MWIR",
      title: "Soğutulmuş orta dalga kızılötesi",
      body: "Gece, sis, toz fırtınası ve elektronik harp koşullarında 40+ km’den insan ve araç hareketini ayırt eden Dewar-cooler termal çekirdekler.",
    },
    {
      code: "İHA",
      title: "Taktiksel İHA ve sürü ISR",
      body: "Kesintisiz havada kalış, haberleşme karartmasına (anti-jamming) karşı otonom dönüş ve yapay zeka ile gerçek zamanlı hedef takibi.",
    },
    {
      code: "C4ISR",
      title: "Sınır zekâsı sinir ağı",
      body: "Hat üzerindeki tüm sensör verisini milisaniyede işler; ihlali caydırıcı unsurlara, insan müdahalesi olsa da olmasa da, bildirir.",
    },
  ],
  epcKicker: "EPC+F üstünlüğü",
  epcTitle: "Siz isteyin. Biz yatırırız. Anahtar sizde.",
  epcLead:
    "Tam bütçe kalemini beklemeden ulusal güvenliği yükseltmek isteyen Maliye ve Savunma bakanlıkları için — biz finanse eder, teslim ederiz; siz taksitle ödersiniz.",
  epc: [
    {
      code: "E",
      title: "Mühendislik",
      body: "Sınır hattının topoğrafik ve jeopolitik analizi. Kör noktalar, çelik sahaya inmeden yapay zeka simülasyonuyla haritalanır.",
    },
    {
      code: "P+C",
      title: "Tedarik ve kurulum",
      body: "Askeri sınıf donanım, en kısa yoldan sahaya, anahtar teslim. Tek müteahhit, tek takvim, tek teslim — anahtar sizin elinizde.",
    },
    {
      code: "F",
      title: "Finansman",
      body: "Sermaye yükünü biz taşırız. Siz yeteneği alırsınız; egemen nakit akışına uygun yapılandırılmış taksit planıyla geri ödersiniz.",
    },
  ],
  closeKicker: "Karar alıcılara doğrudan mesaj",
  closeQuote:
    "Ülkenizin sınır güvenliği bir maliyet kalemi değil, varoluş teminatıdır. Yerel bütçe yetmiyorsa; ekipmanı teslim eden, anahtarı size veren ve taksitli geri ödemeyi yapılandıran bir yatırımcı arıyorsanız — doğru yerdesiniz.",
  protocolOffice: "Doğrudan Stratejik Projeler ve Devlet İlişkileri Direktörlüğü",
  protocolLine: "Protokol hattı · info@circuitbull.com · +1 276 600 2052",
  ministryKicker: "Görev ürünleri · bakanlıklar",
  ministryTitle: "Su, İçişleri, Savunma, Milli güvenlik",
  ministryLead:
    "Su, içişleri, savunma ve milli güvenlik bakanlıklarının Circuitbull® ürünlerine ihtiyacı vardır. Ödenek çoğu zaman yoktur. Resmi program yine başlayabilir.",
  ministries: [
    {
      code: "İhtiyaç",
      title: "Görev gerçek",
      body: "Su sistemleri, iç güvenlik, savunma üsleri ve milli güvenlik sınırları görev ürünüdür — isteğe bağlı katalog kalemi değil.",
    },
    {
      code: "Ödenek",
      title: "Bütçe çoğu zaman yok",
      body: "Klasik ihale döngüleri hiç gelmeyebilecek bir bütçe kalemini bekler. Boşluk teknik değil, operasyoneldir.",
    },
    {
      code: "NDA",
      title: "Önce resmi oturum",
      body: "Bakanlık oturumunu NDA ile açarız: projenizi dinleriz veya çözümü sunarız. Volls Global Inc / Circuitbull® — G2G–B2G, informal takas değil.",
    },
  ],
  offsetKicker: "Emtia teminatlı geri ödeme · resmi offset",
  offsetTitle: "Her ülkenin madenleri ve emtiaları — en çok hoş karşılanır.",
  offsetLead:
    "Geri ödeme NDA altında resmi G2G/B2B offset olarak yapılandırılabilir — informal takas değil. Yeraltı madenleri, doğal kaynaklar ve emtia ürünleriyle geri ödeme isteyen her ülke en çok hoş karşılanır. Miktar ve fiyat NDA oturumunda belirlenir; bu sayfada veya ChatGPT tarafından uydurulmaz.",
  offset: [
    {
      code: "ALL",
      title: "Her ülke — kaynak teminatlı",
      body: "Petrol, gaz, altın, metaller veya diğer yeraltı madenleri ve emtia ürünleri. NDA altında resmi offset — bu şekilde geri ödeme yapılandırmak isteyen her devlet en çok hoş karşılanır.",
    },
    {
      code: "ÖR",
      title: "Örnekler — petrol ve altın",
      body: "Yapılandırılmış programlarda Irak petrol teminatlı ve seçilmiş Afrika altın teminatlı offset örnekleri vardır. Bunlar yolun nasıl görünebileceğine dair örneklerdir — tek yol değildir.",
    },
    {
      code: "F",
      title: "Nakit yoksa — EPC+F",
      body: "Nakit yoksa taksitli EPC+F veya devletler arası G2G yine çalışır. Protokol imzalanınca program başlayabilir.",
    },
  ],
  ndaCta: "NDA ile resmi oturum — projenizi dinleyelim veya çözümü sunalım",
  pageTitle: "Yatırımcı mı Arıyorsunuz? | Circuitbull® EPC+F",
  pageDescription:
    "Bakanlık bütçesi yetmediğinde Circuitbull yatırım yapar. Resmi NDA oturumu; her ülkeden kaynak ve emtia teminatlı G2G offset — informal takas değil.",
};

export function investCopy(lang: string): InvestCopy {
  return lang === "tr" ? TR : EN;
}

function cells(items: { code: string; title: string; body: string }[]) {
  return items
    .map(
      (x) => `<div class="cell">
      <div class="code">${escapeHtml(x.code)}</div>
      <h3>${escapeHtml(x.title)}</h3>
      <p>${escapeHtml(x.body)}</p>
    </div>`
    )
    .join("");
}

export function investManifestoHtml(lang: string, opts?: { page?: boolean }) {
  const t = investCopy(lang);
  const Heading = opts?.page ? "h1" : "h2";
  const pageClass = opts?.page ? " invest-page" : "";
  const contact = contactPath(lang);
  return `<section class="section invest-manifesto${pageClass}" id="invest">
  <div class="wrap">
    <p class="kicker">${escapeHtml(t.kicker)}</p>
    <${Heading} class="invest-title">${escapeHtml(t.title)}</${Heading}>
    <p class="invest-lede">${escapeHtml(t.lede)}</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="${contact}?interest=g2g-nda">${escapeHtml(t.ndaCta)}</a>
      <a class="btn btn-ghost" href="${contact}?interest=epc-f">${escapeHtml(t.ctaScope)}</a>
      <a class="btn btn-ghost" href="${contact}?interest=g2g">${escapeHtml(t.ctaG2g)}</a>
    </div>

    <div class="invest-quote hud-corners">
      <p class="kicker">${escapeHtml(t.manifestoKicker)}</p>
      <h3>${escapeHtml(t.manifestoTitle)}</h3>
      <blockquote>${escapeHtml(t.manifestoQuote)}</blockquote>
      <p class="invest-rule">${escapeHtml(t.ruleLead)}</p>
    </div>
    <div class="rail">${cells(t.pillars)}</div>

    <div class="section-head invest-band-head">
      <p class="kicker">${escapeHtml(t.techKicker)}</p>
      <h2>${escapeHtml(t.techTitle)}</h2>
    </div>
    <div class="rail">${cells(t.tech)}</div>

    <div class="section-head invest-band-head">
      <p class="kicker">${escapeHtml(t.epcKicker)}</p>
      <h2>${escapeHtml(t.epcTitle)}</h2>
      <p>${escapeHtml(t.epcLead)}</p>
    </div>
    <div class="rail">${cells(t.epc)}</div>

    <div class="section-head invest-band-head">
      <p class="kicker">${escapeHtml(t.ministryKicker)}</p>
      <h2>${escapeHtml(t.ministryTitle)}</h2>
      <p>${escapeHtml(t.ministryLead)}</p>
    </div>
    <div class="rail">${cells(t.ministries)}</div>

    <div class="section-head invest-band-head">
      <p class="kicker">${escapeHtml(t.offsetKicker)}</p>
      <h2>${escapeHtml(t.offsetTitle)}</h2>
      <p>${escapeHtml(t.offsetLead)}</p>
    </div>
    <div class="rail">${cells(t.offset)}</div>

    <div class="invest-close hud-corners">
      <p class="kicker">${escapeHtml(t.closeKicker)}</p>
      <blockquote>${escapeHtml(t.closeQuote)}</blockquote>
      <p class="invest-office">${escapeHtml(t.protocolOffice)}</p>
      <p class="invest-protocol">${escapeHtml(t.protocolLine)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${contact}?interest=g2g-nda">${escapeHtml(t.ndaCta)}</a>
        <a class="btn btn-ghost" href="${contact}?interest=g2g">${escapeHtml(t.ctaG2g)}</a>
        <a class="btn btn-ghost" href="${contact}?interest=offset-commodity">${escapeHtml(t.offset[0].title)}</a>
        <a class="btn btn-ghost" href="${contact}?interest=epc-f">${escapeHtml(t.offset[2].title)}</a>
        <a class="btn btn-ghost" href="mailto:info@circuitbull.com?subject=${encodeURIComponent("G2G / NDA / offset briefing")}">info@circuitbull.com</a>
        <a class="btn btn-ghost" href="${CALL_SWITCHBOARD_URL}">${HQ_PHONE_DISPLAY}</a>
      </div>
    </div>
  </div>
</section>`;
}

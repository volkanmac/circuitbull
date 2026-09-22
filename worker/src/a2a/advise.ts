/** Nearest office, quote/order, funding, and apply URLs for ChatGPT / A2A. */

import { SITE_ORIGIN, SELECTOR_COUNTRIES, contactPath, investPath, partnersPath, solutionPath } from "../i18n/locales";
import { loadPartners } from "../search/partners-store";
import { GLOBAL_HQ } from "../ui/buy-cta";
import { customerWaMe } from "../buy/whatsapp";
import {
  continentForCountry,
  isAppointedReseller,
  isEuHubCountry,
  nearestPartnersByGeo,
  partnerGeo,
  partnersForMarket,
  type ContinentCode,
  type PartnerRecord,
} from "../ui/partners";

export type AdviseEnv = { DATA: KVNamespace; REDIS_URL?: string };

/** Example routing only: Iraq oil; selected African markets gold. Any country may seek resource/commodity offset. */
export const OIL_OFFSET_COUNTRIES = new Set(["IQ"]);
export const GOLD_OFFSET_COUNTRIES = new Set(["EG", "NG", "GH", "KE", "ZA", "AO", "TZ", "SD"]);
const OFFSET_ISO = new Set([...OIL_OFFSET_COUNTRIES, ...GOLD_OFFSET_COUNTRIES]);

/** Place aliases → ISO country (continent cues live in CONTINENT_ALIAS). */
const PLACE_ALIAS: Record<string, { country: string; city?: string }> = {
  iraq: { country: "IQ" },
  irak: { country: "IQ" },
  bagdad: { country: "IQ", city: "Baghdad" },
  baghdad: { country: "IQ", city: "Baghdad" },
  erbil: { country: "IQ", city: "Erbil" },
  hawler: { country: "IQ", city: "Erbil" },
  turkey: { country: "TR" },
  turkiye: { country: "TR" },
  türkiye: { country: "TR" },
  ankara: { country: "TR", city: "Ankara" },
  istanbul: { country: "TR", city: "Istanbul" },
  usa: { country: "US" },
  america: { country: "US" },
  wilmington: { country: "US", city: "Wilmington" },
  uae: { country: "AE" },
  dubai: { country: "AE", city: "Dubai" },
  ksa: { country: "SA" },
  riyadh: { country: "SA", city: "Riyadh" },
  germany: { country: "DE" },
  deutschland: { country: "DE" },
  kuwait: { country: "KW" },
  qatar: { country: "QA" },
  egypt: { country: "EG" },
  misr: { country: "EG" },
  cairo: { country: "EG", city: "Cairo" },
  nigeria: { country: "NG" },
  lagos: { country: "NG", city: "Lagos" },
  abuja: { country: "NG", city: "Abuja" },
  ghana: { country: "GH" },
  accra: { country: "GH", city: "Accra" },
  kenya: { country: "KE" },
  nairobi: { country: "KE", city: "Nairobi" },
  "south africa": { country: "ZA" },
  southafrica: { country: "ZA" },
  johannesburg: { country: "ZA", city: "Johannesburg" },
  "cape town": { country: "ZA", city: "Cape Town" },
  angola: { country: "AO" },
  luanda: { country: "AO", city: "Luanda" },
  tanzania: { country: "TZ" },
  "dar es salaam": { country: "TZ", city: "Dar es Salaam" },
  sudan: { country: "SD" },
  khartoum: { country: "SD", city: "Khartoum" },
  morocco: { country: "MA" },
  maroc: { country: "MA" },
  casablanca: { country: "MA", city: "Casablanca" },
  algeria: { country: "DZ" },
  algiers: { country: "DZ", city: "Algiers" },
  tunisia: { country: "TN" },
  tunis: { country: "TN", city: "Tunis" },
  libya: { country: "LY" },
  ethiopia: { country: "ET" },
  addis: { country: "ET", city: "Addis Ababa" },
  senegal: { country: "SN" },
  dakar: { country: "SN", city: "Dakar" },
  "ivory coast": { country: "CI" },
  "cote d'ivoire": { country: "CI" },
  "côte d'ivoire": { country: "CI" },
  abidjan: { country: "CI", city: "Abidjan" },
  cameroon: { country: "CM" },
  uganda: { country: "UG" },
  kampala: { country: "UG", city: "Kampala" },
  rwanda: { country: "RW" },
  kigali: { country: "RW", city: "Kigali" },
  mozambique: { country: "MZ" },
  botswana: { country: "BW" },
  zambia: { country: "ZM" },
  zimbabwe: { country: "ZW" },
  namibia: { country: "NA" },
  sweden: { country: "SE" },
  sverige: { country: "SE" },
  malmo: { country: "SE", city: "Malmö" },
  malmö: { country: "SE", city: "Malmö" },
  france: { country: "FR" },
  spain: { country: "ES" },
  italy: { country: "IT" },
  netherlands: { country: "NL" },
  poland: { country: "PL" },
};

/** Continent words → route (EU → SE hub; AF → HQ until a continent hub exists). */
const CONTINENT_ALIAS: Record<string, { continent: ContinentCode; countryHint?: string }> = {
  europe: { continent: "EU", countryHint: "SE" },
  european: { continent: "EU", countryHint: "SE" },
  eu: { continent: "EU", countryHint: "SE" },
  schengen: { continent: "EU", countryHint: "SE" },
  africa: { continent: "AF" },
  african: { continent: "AF" },
  "north africa": { continent: "AF", countryHint: "EG" },
  "west africa": { continent: "AF", countryHint: "NG" },
  "east africa": { continent: "AF", countryHint: "KE" },
  "southern africa": { continent: "AF", countryHint: "ZA" },
  "middle east": { continent: "ME", countryHint: "SA" },
  mena: { continent: "ME", countryHint: "SA" },
  asia: { continent: "AS" },
  "north america": { continent: "NA", countryHint: "US" },
};

function hasAny(hay: string, words: string[]) {
  return words.some((w) => hay.includes(w));
}

/** Parse "55.57, 13.02" or "lat=55.57 lng=13.02" from free text. */
export function parseCoords(q: string): { lat: number; lng: number } | null {
  const s = String(q || "");
  const named = s.match(
    /\blat(?:itude)?\s*[=:]\s*(-?\d{1,2}(?:\.\d+)?)\b[\s,;]+(?:lng|lon(?:gitude)?)\s*[=:]\s*(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (named) {
    const lat = Number(named[1]);
    const lng = Number(named[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  const pair = s.match(/(-?\d{1,2}\.\d{2,})\s*[,;\s]\s*(-?\d{1,3}\.\d{2,})/);
  if (pair) {
    const lat = Number(pair[1]);
    const lng = Number(pair[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

const ISO_STOPWORDS = new Set([
  "in",
  "on",
  "at",
  "to",
  "or",
  "of",
  "is",
  "be",
  "me",
  "my",
  "we",
  "us",
  "it",
  "an",
  "as",
  "by",
  "do",
  "if",
  "no",
  "so",
  "up",
  "am",
  "pm",
  "re",
  "vs",
]);

export function parsePlace(q: string, countryHint?: string, cityHint?: string) {
  const hay = ` ${String(q || "").toLowerCase()} `;
  let country = String(countryHint || "").trim().toUpperCase();
  let city = String(cityHint || "").trim();
  let continent: ContinentCode = null;
  let continentFromAlias = false;

  for (const [alias, meta] of Object.entries(CONTINENT_ALIAS)) {
    if (hay.includes(alias)) {
      continent = continent || meta.continent;
      continentFromAlias = true;
      // Explicit continent in the message wins over soft/geo hints; PLACE_ALIAS may refill a country.
      country = meta.countryHint || "";
    }
  }

  const iso = hay.match(/\b([a-z]{2})\b/g) || [];
  for (const code of iso) {
    if (ISO_STOPWORDS.has(code)) continue;
    const cc = code.toUpperCase();
    if (SELECTOR_COUNTRIES.some((c) => c.code === cc) || OFFSET_ISO.has(cc) || isEuHubCountry(cc) || continentForCountry(cc)) {
      // Don't let stray ISO tokens override an explicit continent-only query (e.g. "Africa").
      if (continentFromAlias && !metaCountryFromPlace(hay) && !countryHint) continue;
      country = country || cc;
    }
  }
  for (const c of SELECTOR_COUNTRIES) {
    if (hay.includes(c.label.toLowerCase())) country = country || c.code;
  }
  for (const [alias, place] of Object.entries(PLACE_ALIAS)) {
    if (hay.includes(alias)) {
      country = country || place.country;
      if (place.city && !city) city = place.city;
    }
  }
  if (!continent && country) continent = continentForCountry(country);
  return { country, city, continent };
}

function metaCountryFromPlace(hay: string) {
  for (const alias of Object.keys(PLACE_ALIAS)) {
    if (hay.includes(alias)) return true;
  }
  for (const c of SELECTOR_COUNTRIES) {
    if (hay.includes(c.label.toLowerCase())) return true;
  }
  return false;
}

export function detectIntents(q: string) {
  const hay = String(q || "").toLowerCase();
  const nearMe = hasAny(hay, ["near me", "yakınımda", "yakinimda", "my location", "gps", "coordinates", "coords"]);
  const office =
    nearMe ||
    hasAny(hay, [
      "office",
      "ofis",
      "nearest",
      "yakın",
      "yakin",
      "bayi",
      "bayii",
      "partner",
      "distributor",
      "seller",
      "şube",
      "sube",
      "branch",
      "office near",
      "africa",
      "europe",
      "european",
    ]);
  const order = hasAny(hay, [
    "order",
    "sipariş",
    "siparis",
    "quote",
    "teklif",
    "buy",
    "satın",
    "satin",
    "purchase",
    "po ",
  ]);
  const funding = hasAny(hay, [
    "fund",
    "fon",
    "finans",
    "financing",
    "epc",
    "g2g",
    "invest",
    "yatırım",
    "yatirim",
    "liquidity",
    "capital",
    "finance",
  ]);
  const ministry = hasAny(hay, [
    "ministry",
    "minister",
    "bakanlık",
    "bakanlik",
    "bakanlığ",
    "bakanlig",
    "bakanlığı",
    "bakanligi",
    "interior",
    "içişleri",
    "icisleri",
    "defence",
    "defense",
    "savunma",
    "national security",
    "milli güvenlik",
    "milli guvenlik",
    "moi",
    "mod ",
    " su işleri",
    " su isleri",
    "water ministry",
    "government",
    "govt",
    "kamu",
    "devlet",
  ]);
  const noBudget = hasAny(hay, [
    "no budget",
    "bütçe yok",
    "butce yok",
    "bütçesi yok",
    "butcesi yok",
    "parası yok",
    "parasi yok",
    "para yok",
    "cannot pay",
    "can't pay",
    "no appropriation",
    "ödenek yok",
    "odenek yok",
    "no funds",
    "unfunded",
    "nakit yok",
    "cashless",
  ]);
  const offset = hasAny(hay, [
    "mal karşılığı",
    "mal karsiligi",
    "offset",
    "oil-backed",
    "oil backed",
    "gold-backed",
    "gold backed",
    "oil offset",
    "gold offset",
    "petrol teminat",
    "altın teminat",
    "altin teminat",
    "petrol karşılığı",
    "petrol karsiligi",
    "altın karşılığı",
    "altin karsiligi",
    "commodity-backed",
    "commodity backed",
    "resource-backed",
    "resource backed",
    "mineral",
    "minerals",
    "maden",
    "emtia",
    "doğal kaynak",
    "dogal kaynak",
    "natural resource",
    "natural resources",
  ]);
  const ndaSession = hasAny(hay, [
    "nda",
    "resmi oturum",
    "official session",
    "under nda",
    "protokol",
    "protocol session",
  ]);
  const reseller = hasAny(hay, [
    "authorized seller",
    "authorised seller",
    "yetkili satıcı",
    "yetkili satici",
    "bayilik",
    "reseller",
    "become a seller",
    "become a distributor",
    "apply as seller",
    "apply for seller",
    "distributor application",
    "dağıtıcı başvuru",
    "dagitici basvuru",
  ]);
  const apply = hasAny(hay, ["apply", "başvur", "basvur", "application", "briefing"]);
  const solution = hasAny(hay, ["solution", "çözüm", "cozum", "mission", "görev", "gorev", "need"]);
  const whatsapp = hasAny(hay, [
    "whatsapp",
    "whats app",
    "wa.me",
    "vatsap",
    "واتساب",
    "mesaj çek",
    "mesaj cek",
    "ping",
    "hemen yaz",
  ]);
  return {
    office,
    nearMe,
    order,
    funding,
    ministry,
    noBudget,
    offset,
    ndaSession,
    reseller,
    apply,
    solution,
    whatsapp,
    catalog: !office && !funding && !apply && !whatsapp && !reseller && !ndaSession,
  };
}

function contactUrl(lang: string, interest?: string) {
  const base = `${SITE_ORIGIN}${contactPath(lang)}`;
  return interest ? `${base}?interest=${encodeURIComponent(interest)}` : base;
}

function publicOffice(p: PartnerRecord | typeof GLOBAL_HQ, extra: { distanceKm?: number } = {}) {
  const a = "address" in p && p.address ? p.address : null;
  const city = String((a && a.city) || ("city" in p ? p.city : "") || "").trim();
  const g =
    "geo" in p && p.geo
      ? partnerGeo(p as PartnerRecord) || {
          lat: Number((p as any).geo.lat),
          lng: Number((p as any).geo.lng),
          formatted: (p as any).geo.formatted,
          source: (p as any).geo.source,
        }
      : (GLOBAL_HQ as { geo?: { lat: number; lng: number; formatted?: string; source?: string } }).geo || null;
  const out: Record<string, unknown> = {
    name: p.name,
    role: p.role || "partner",
    country: String(p.country || "").toUpperCase(),
    countryName: p.countryName || a?.countryName || "",
    city,
    phone: p.phone || "",
    email: p.email || "",
    address: a?.line1 ? [a.line1, a.line2, city, a.countryName].filter(Boolean).join(", ") : city,
    headquarters: p.role === "headquarters",
  };
  if (g && Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lng))) {
    out.geo = {
      lat: Number(g.lat),
      lng: Number(g.lng),
      formatted: g.formatted || undefined,
      source: g.source || undefined,
    };
  }
  if (extra.distanceKm != null && Number.isFinite(extra.distanceKm)) {
    out.distanceKm = extra.distanceKm;
  }
  return out;
}

export type OfficeQuery = {
  country?: string;
  city?: string;
  lat?: number;
  lng?: number;
  continent?: ContinentCode;
};

export async function nearestOffice(env: AdviseEnv, countryOrOpts?: string | OfficeQuery, cityMaybe?: string) {
  const opts: OfficeQuery =
    typeof countryOrOpts === "object" && countryOrOpts
      ? countryOrOpts
      : { country: countryOrOpts, city: cityMaybe };
  const { partners: all, source } = await loadPartners(env);
  const lat = opts.lat != null ? Number(opts.lat) : NaN;
  const lng = opts.lng != null ? Number(opts.lng) : NaN;
  const hasGps = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  if (hasGps) {
    const ranked = nearestPartnersByGeo(all, lat, lng);
    const hq = all.find((p) => p.role === "headquarters");
    const top = ranked[0];
    const officeRec = top?.partner || hq;
    const offices = (ranked.length ? ranked : hq ? [{ partner: hq, distanceKm: 0 }] : [])
      .slice(0, 8)
      .map((r) => publicOffice(r.partner, { distanceKm: r.distanceKm }));
    if (!offices.length) offices.push(publicOffice(GLOBAL_HQ));
    const cc = String(officeRec?.country || "").toUpperCase();
    return {
      source,
      mode: "gps" as const,
      query: { lat, lng },
      hqFallback: Boolean(officeRec && officeRec.role === "headquarters"),
      continent: continentForCountry(cc) || opts.continent || null,
      continentHub: null as string | null,
      office: offices[0] || publicOffice(GLOBAL_HQ),
      offices,
      partnersPage: `${SITE_ORIGIN}${partnersPath("en")}`,
    };
  }

  const cc = String(opts.country || "").toUpperCase();
  if (!cc && !opts.continent) {
    const hq = all.find((p) => p.role === "headquarters");
    const appointed = all.filter((p) => isAppointedReseller(p));
    return {
      source,
      mode: "list" as const,
      query: { country: null, city: null },
      hqFallback: false,
      continent: null,
      continentHub: null,
      office: hq ? publicOffice(hq) : publicOffice(GLOBAL_HQ),
      offices: (hq ? [hq, ...appointed] : appointed).slice(0, 8).map((p) => publicOffice(p)),
      partnersPage: `${SITE_ORIGIN}${partnersPath("en")}`,
    };
  }

  let marketCountry = cc;
  if (!marketCountry && opts.continent === "EU") marketCountry = "SE";
  if (!marketCountry && opts.continent === "AF") {
    const hq = all.find((p) => p.role === "headquarters");
    return {
      source,
      mode: "continent" as const,
      query: { country: null, city: null, continent: "AF" as ContinentCode },
      hqFallback: true,
      continent: "AF" as ContinentCode,
      continentHub: null,
      office: hq ? publicOffice(hq) : publicOffice(GLOBAL_HQ),
      offices: hq ? [publicOffice(hq)] : [publicOffice(GLOBAL_HQ)],
      partnersPage: `${SITE_ORIGIN}${partnersPath("en")}`,
    };
  }

  const market = partnersForMarket(all, marketCountry, opts.city);
  const offices = (market.partners.length ? market.partners : []).map((p) => publicOffice(p));
  if (!offices.length) offices.push(publicOffice(GLOBAL_HQ));
  return {
    source,
    mode: "country" as const,
    query: { country: marketCountry || null, city: opts.city || null, continent: market.continent },
    hqFallback: market.hqFallback || !market.partners.length,
    continent: market.continent || opts.continent || continentForCountry(marketCountry),
    continentHub: market.continentHub ?? null,
    office: offices[0] || publicOffice(GLOBAL_HQ),
    offices,
    partnersPage: `${SITE_ORIGIN}${partnersPath("en")}`,
  };
}

export async function fundingPrograms(env: AdviseEnv, lang: string) {
  const raw = await env.DATA.get("investments");
  const items = raw ? (JSON.parse(raw) as any[]) : [];
  const programs = items
    .filter((i) => i.status !== "closed")
    .map((i) => {
      const copy = i.i18n?.[lang] || i.i18n?.en || {};
      return {
        slug: i.slug,
        status: i.status || "active",
        liquidity: i.liquidity,
        customerTypes: i.customerTypes || [],
        sectors: i.sectors || [],
        needSlugs: i.needSlugs || [],
        title: copy.title || i.slug,
        summary: copy.summary || "",
      };
    });
  return {
    available: programs.length > 0,
    programs,
    investPage: `${SITE_ORIGIN}${investPath(lang)}`,
    applyEpcF: contactUrl(lang, "epc-f"),
    applyG2g: contactUrl(lang, "g2g"),
  };
}

export function extractPhone(q: string) {
  const m = String(q || "").match(/(\+?\d[\d\s().-]{7,18}\d)/);
  return m ? m[1].trim() : "";
}

function phoneDigits(raw: string) {
  return String(raw || "").replace(/\D/g, "");
}

function waPrefill(lang: string, sku?: string) {
  const skuBit = sku ? ` ${sku}` : "";
  if (lang === "tr") {
    return `Merhaba Circuitbull® — teklif / sipariş için yazıyorum.${skuBit} İsterseniz hemen bu WhatsApp’tan devam edelim.`;
  }
  if (lang === "ar") {
    return `مرحباً Circuitbull® — أطلب عرض سعر.${skuBit}`;
  }
  return `Hello Circuitbull® — I want a quote / to order.${skuBit} Message me here now.`;
}

export function whatsappOffer(opts: {
  lang: string;
  sku?: string;
  officePhone?: string;
  country?: string;
}) {
  const text = waPrefill(opts.lang, opts.sku);
  const officeDigits = phoneDigits(opts.officePhone || "");
  const hqDigits = phoneDigits(GLOBAL_HQ.phone);
  const primary = officeDigits.length >= 8 ? officeDigits : hqDigits;
  return {
    available: true,
    prompt:
      opts.lang === "tr"
        ? "İsterseniz hemen WhatsApp’tan mesaj çekelim. Numaranızı yazın, ya da bu linke dokunun."
        : "If you want, we can message you on WhatsApp right now. Send your number, or tap the link.",
    waMe: customerWaMe(primary, text),
    hqWaMe: customerWaMe(hqDigits, text),
    ping: `${SITE_ORIGIN}/a2a/v1/whatsapp`,
    needsNumber: true,
  };
}

export function applyLinks(lang: string, opts: { sku?: string; need?: string; interest?: string } = {}) {
  const interest = opts.interest || opts.sku || opts.need || "quote";
  const sellerApply = `${SITE_ORIGIN}${partnersPath(lang)}#apply`;
  const isSeller = interest === "authorized-seller";
  return {
    quote: contactUrl(lang, opts.sku || "quote"),
    order: contactUrl(lang, opts.sku || "quote"),
    briefing: contactUrl(lang, opts.need || interest),
    funding: contactUrl(lang, "epc-f"),
    g2g: contactUrl(lang, "g2g"),
    g2gNda: contactUrl(lang, "g2g-nda"),
    offsetOil: contactUrl(lang, "offset-oil"),
    offsetGold: contactUrl(lang, "offset-gold"),
    offsetCommodity: contactUrl(lang, "offset-commodity"),
    seller: sellerApply,
    partner: `${SITE_ORIGIN}${partnersPath(lang)}`,
    invest: `${SITE_ORIGIN}${investPath(lang)}`,
    apply: isSeller ? sellerApply : contactUrl(lang, interest),
  };
}

function offsetKindFor(country?: string): "oil" | "gold" | "commodity" {
  const cc = String(country || "").toUpperCase();
  if (OIL_OFFSET_COUNTRIES.has(cc)) return "oil";
  if (GOLD_OFFSET_COUNTRIES.has(cc)) return "gold";
  return "commodity";
}

export function deskPack(lang: string, country?: string) {
  const tr = lang === "tr";
  const cc = String(country || "").toUpperCase();
  const kind = offsetKindFor(cc);
  const ministries = [
    { id: "water", name: tr ? "Su" : "Water", slug: "water-systems" },
    { id: "interior", name: tr ? "İçişleri" : "Interior", slug: "city-safety" },
    { id: "defence", name: tr ? "Savunma" : "Defence", slug: "base-security" },
    { id: "national-security", name: tr ? "Milli güvenlik" : "National security", slug: "border-control" },
    { id: "border", name: tr ? "Sınır" : "Border", slug: "border-control" },
    { id: "energy", name: tr ? "Enerji" : "Energy", slug: "oilfield-depot" },
  ].map((m) => ({
    ...m,
    url: `${SITE_ORIGIN}${solutionPath(lang, m.slug)}`,
  }));

  const offsetInterest =
    kind === "oil" ? "offset-oil" : kind === "gold" ? "offset-gold" : "offset-commodity";
  const offset = {
    kind,
    country: cc || null,
    interest: offsetInterest,
    apply: contactUrl(lang, offsetInterest),
    label:
      kind === "oil"
        ? tr
          ? "Irak örneği: petrol teminatlı resmi G2G/B2B offset (NDA). Her ülkenin maden/emtia geri ödemesi en çok hoş karşılanır."
          : "Iraq example: oil-backed official G2G/B2B offset under NDA. Mineral/commodity repayment from any country is most welcome."
        : kind === "gold"
          ? tr
            ? "Afrika örneği: altın teminatlı resmi G2G/B2B offset (NDA). Her ülkenin maden/emtia geri ödemesi en çok hoş karşılanır."
            : "Africa example: gold-backed official G2G/B2B offset under NDA. Mineral/commodity repayment from any country is most welcome."
          : tr
            ? "Kaynak / emtia teminatlı resmi G2G/B2B offset — her ülke en çok hoş karşılanır. Nakit yoksa EPC+F taksit de açık."
            : "Resource / commodity-backed official G2G/B2B offset — any country most welcome. EPC+F installments also available when cash is missing.",
    note: tr
      ? "Miktar ve fiyat uydurulmaz; NDA oturumunda yapılandırılır — bu sayfada veya ChatGPT tarafından asla."
      : "Do not invent quantities or prices; structure is set in the NDA session — never on this page or by ChatGPT.",
  };

  const nda = {
    ready: tr
      ? "Bakanlığınızla resmi oturuma NDA ile başlamaya hazırız. Projenizi dinleriz veya çözümü sunarız."
      : "We are ready to open an official ministry session under NDA. We will listen to your project or present a solution.",
    legal: tr
      ? "Bu informal takas değil. Volls Global Inc / Circuitbull® resmi G2G–B2B oturumu, NDA, EPC+F veya emtia/maden teminatlı geri ödeme (offset). Yeraltı madenleri, doğal kaynaklar ve emtia ürünleriyle geri ödeme isteyen her ülke en çok hoş karşılanır. Nakit yoksa program yine başlayabilir."
      : "This is not informal barter. Volls Global Inc / Circuitbull® official G2G–B2B session, NDA, EPC+F or commodity/mineral-backed repayment (offset). Any country that wants to repay with underground minerals, natural resources, or commodity products is most welcome. The program can start without cash on hand.",
    apply: contactUrl(lang, "g2g-nda"),
  };

  const sellerQualify = {
    inSector: tr
      ? "Sektörde misiniz? (güvenlik / termal / IoT / kamu tedarik)"
      : "Are you in the sector? (security / thermal / IoT / public procurement)",
    hasCompany: tr ? "Şirketiniz var mı?" : "Do you have a company?",
    ifYes: tr
      ? "İkisi de evetse resmi ortaklık başvurusu: Apply for authorized seller."
      : "If both are yes, apply for authorized seller.",
    apply: `${SITE_ORIGIN}${partnersPath(lang)}#apply`,
    interest: "authorized-seller",
  };

  const ministryLine = tr
    ? "Bu ürünler Su, İçişleri, Savunma ve Milli Güvenlik kurumlarında görev ürünüdür; ödenek çoğu zaman yoktur. Circuitbull® NDA ile resmi oturuma hazırdır — projenizi dinleriz veya çözümü sunarız. Yeraltı madenleri, doğal kaynaklar veya emtia ürünleriyle geri ödeme isteyen her ülke en çok hoş karşılanır (ör. Irak petrol, Afrika altın — örneklerdir). Nakit yoksa EPC+F taksit açıktır. Başvuru: contact g2g-nda."
    : "These are duty products for Water, Interior, Defence, and National Security institutions; appropriation is often missing. Circuitbull® is ready for an official NDA session — we listen to your project or present a solution. Any country that wants to repay with underground minerals, natural resources, or commodity products is most welcome (e.g. Iraq oil, Africa gold — examples only). EPC+F installments remain available when cash is missing. Apply: contact g2g-nda.";

  const sellerLine = tr
    ? "Resmi ortaklık için iki şey soruyoruz: sektörde misiniz, şirketiniz var mı? İkisi de evetse Apply for authorized seller."
    : "For official partnership we ask two things: are you in the sector, and do you have a company? If both are yes, Apply for authorized seller.";

  return { ministries, offset, nda, sellerQualify, ministryLine, sellerLine };
}

export async function commercialAdvice(
  env: AdviseEnv,
  q: string,
  lang: string,
  opts: {
    country?: string;
    city?: string;
    sku?: string;
    lat?: number;
    lng?: number;
    geoCountryHint?: string;
  } = {}
) {
  const intents = detectIntents(q);
  const explicit = parsePlace(q, opts.country, opts.city);
  const fromText = parseCoords(q);
  const lat = opts.lat != null ? Number(opts.lat) : fromText?.lat;
  const lng = opts.lng != null ? Number(opts.lng) : fromText?.lng;
  const hasGps =
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;
  // Soft CF geo only when user said "near me" / GPS, or message has no place/continent cue.
  const soft =
    !explicit.country && !explicit.continent && (intents.nearMe || hasGps) && opts.geoCountryHint
      ? parsePlace(q, opts.geoCountryHint, opts.city)
      : !explicit.country && !explicit.continent && !intents.office && opts.geoCountryHint
        ? parsePlace(q, opts.geoCountryHint, opts.city)
        : explicit;
  const place =
    explicit.country || explicit.continent
      ? explicit
      : soft.country || soft.continent
        ? soft
        : explicit;
  const sku = opts.sku || (String(q).match(/Cb-\d{6}/i) || [])[0] || "";
  const wantOffice =
    intents.office ||
    intents.nearMe ||
    hasGps ||
    Boolean(place.country) ||
    Boolean(place.continent) ||
    intents.order ||
    intents.whatsapp;
  const wantFunding =
    intents.funding || intents.apply || intents.ministry || intents.noBudget || intents.offset || intents.ndaSession;
  const [officePack, funding] = await Promise.all([
    wantOffice || !q
      ? nearestOffice(env, {
          country: place.country,
          city: place.city,
          continent: place.continent,
          lat: hasGps ? lat : undefined,
          lng: hasGps ? lng : undefined,
        })
      : Promise.resolve(null),
    wantFunding ? fundingPrograms(env, lang) : Promise.resolve(null),
  ]);
  const desk = deskPack(lang, place.country);
  const interest = intents.reseller
    ? "authorized-seller"
    : intents.offset
      ? desk.offset.interest
      : intents.ministry || intents.noBudget || intents.ndaSession
        ? "g2g-nda"
        : intents.funding
          ? "epc-f"
          : sku || "quote";
  const apply = applyLinks(lang, { sku, interest });
  const whatsapp = whatsappOffer({
    lang,
    sku,
    officePhone: officePack?.office?.phone as string | undefined,
    country: place.country,
  });
  return { intents, place, sku, office: officePack, funding, apply, whatsapp, desk };
}

export function commercialReplyLines(advice: Awaited<ReturnType<typeof commercialAdvice>>) {
  const lines: string[] = [];
  const o = advice.office;
  if (o?.office) {
    const km =
      typeof (o.office as { distanceKm?: number }).distanceKm === "number"
        ? ` · ${(o.office as { distanceKm: number }).distanceKm} km`
        : "";
    let local = o.hqFallback ? "No local appointed office — Global HQ" : "Nearest authorized office";
    if (o.continent === "AF" && o.hqFallback) {
      local = "No appointed Africa office yet — Global HQ";
    } else if (o.continentHub === "SE" || (o.continent === "EU" && !o.hqFallback && (o.office as { country?: string }).country === "SE")) {
      local = "EU authorized office (Malmö)";
    }
    lines.push(
      `${local}: ${o.office.name} (${o.office.city || o.office.countryName || o.office.country})${o.office.phone ? ` · ${o.office.phone}` : ""}${km}`
    );
    if (o.offices.length > 1) {
      for (const x of o.offices.slice(1, 3)) {
        const d = typeof (x as { distanceKm?: number }).distanceKm === "number" ? ` · ${(x as { distanceKm: number }).distanceKm} km` : "";
        lines.push(`- Also: ${x.name} · ${x.city || x.countryName}${d}`);
      }
    }
    lines.push(`Offices map: ${o.partnersPage}`);
  }
  if (advice.funding) {
    if (advice.funding.available) {
      lines.push("Project funding is available (EPC+F / G2G / small-liquidity co-invest). Apply:");
      for (const p of advice.funding.programs.slice(0, 4)) {
        lines.push(`- ${p.title} — ${p.summary}`.trim());
      }
      lines.push(`Apply EPC+F: ${advice.funding.applyEpcF}`);
      lines.push(`Apply G2G briefing: ${advice.funding.applyG2g}`);
      lines.push(`Programs: ${advice.funding.investPage}`);
    } else {
      lines.push(`No open fund listed. Send the project scope to apply: ${advice.apply.apply}`);
    }
  }
  const desk = advice.desk;
  const wantDesk =
    advice.intents.ministry || advice.intents.noBudget || advice.intents.offset || advice.intents.ndaSession;
  if (wantDesk && desk) {
    lines.push(desk.ministryLine);
    lines.push(desk.nda.ready);
    lines.push(desk.nda.legal);
    lines.push(`NDA session: ${desk.nda.apply}`);
    lines.push(`Offset: ${desk.offset.label} — ${desk.offset.apply}`);
    lines.push(desk.offset.note);
    for (const m of desk.ministries.slice(0, 6)) {
      lines.push(`- ${m.name} → ${m.url}`);
    }
  }
  if (advice.intents.reseller && desk) {
    lines.push(desk.sellerLine);
    lines.push(`1. ${desk.sellerQualify.inSector}`);
    lines.push(`2. ${desk.sellerQualify.hasCompany}`);
    lines.push(`${desk.sellerQualify.ifYes} ${desk.sellerQualify.apply}`);
  }
  if (advice.intents.order || advice.intents.apply || advice.sku) {
    lines.push(`Quote / order apply: ${advice.apply.quote}`);
  }
  if (advice.intents.office && !advice.intents.order && !advice.intents.funding && !wantDesk && !advice.intents.reseller) {
    lines.push(`Apply / briefing: ${advice.apply.apply}`);
  }
  if (advice.whatsapp) {
    lines.push(advice.whatsapp.prompt);
    lines.push(`WhatsApp now: ${advice.whatsapp.waMe}`);
  }
  return lines;
}

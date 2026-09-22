/** Canonical mission solutions (product Applications). Keep in sync with scripts/lib/solutions.mjs */

export const SOLUTION_SLUGS = [
  "seaport-airport",
  "water-systems",
  "storage",
  "base-security",
  "oilfield-depot",
  "fire-prevention",
  "ecological",
  "border-control",
  "urban-anti-uav",
  "highway-railway",
  "city-safety",
  "stadium-plaza",
  "lake-river",
] as const;

export const SOLUTION_REDIRECTS: Record<string, string> = {
  "airport-security": "seaport-airport",
  "coastal-surveillance": "border-control",
  "anti-uav": "urban-anti-uav",
  "forest-fire": "fire-prevention",
  aquaculture: "lake-river",
  industrial: "oilfield-depot",
  surveillance: "city-safety",
  "vehicle-mounted": "border-control",
};

const EXACT: Record<string, string> = {
  "seaport and airport monitoring": "seaport-airport",
  "water system monitoring": "water-systems",
  "storage monitoring": "storage",
  "base security monitoring": "base-security",
  "oilfield and oil depot security": "oilfield-depot",
  "oilfield oil depot security": "oilfield-depot",
  "fire source prevention and monitoring": "fire-prevention",
  "ecological and environmental monitoring": "ecological",
  "border and coastal defense": "border-control",
  "urban security and anti uav applications": "urban-anti-uav",
  "highway and railway monitoring": "highway-railway",
  "highways and railways monitoring": "highway-railway",
  "city safety": "city-safety",
  "stadium plaza and scenic spot monitoring": "stadium-plaza",
  "lake and river monitoring": "lake-river",
};

const RULES: { slug: string; re: RegExp }[] = [
  { slug: "seaport-airport", re: /\b(seaport|airport|airfield|harbor|harbour|runway)\b/i },
  { slug: "water-systems", re: /\b(water system|reservoir|dam|potable|drinking water)\b/i },
  { slug: "storage", re: /\b(storage|warehouse|warehousing|logistics)\b/i },
  { slug: "base-security", re: /\b(base security|military base|barracks|airbase)\b/i },
  { slug: "oilfield-depot", re: /\b(oilfield|oil field|oil depot|oil and gas|petrochemical|oil industry|oil safety)\b/i },
  { slug: "fire-prevention", re: /\b(fire source|forest fire|fire detection|fire warning|fire prevention|fire alarm)\b/i },
  { slug: "ecological", re: /\b(ecological|environmental monitoring)\b/i },
  { slug: "border-control", re: /\b(border|coastal defense|coastal surveillance|perimeter|homeland)\b/i },
  { slug: "urban-anti-uav", re: /\b(anti-?uav|anti-?drone|c-uas|uav|drone|urban security)\b/i },
  { slug: "highway-railway", re: /\b(highway|railway|railroad|expressway|traffic|subway station|railway station)\b/i },
  { slug: "city-safety", re: /\b(city safety|safe city|urban safety)\b/i },
  { slug: "stadium-plaza", re: /\b(stadium|plaza|square|scenic)\b/i },
  { slug: "lake-river", re: /\b(lake|river|aquaculture|fishery|maritime|marine|offshore)\b/i },
];

export function isCanonicalSolution(slug: string) {
  return (SOLUTION_SLUGS as readonly string[]).includes(slug);
}

export function canonicalizeSolutionSlug(slug: string) {
  const s = String(slug || "").trim();
  if (isCanonicalSolution(s)) return s;
  return SOLUTION_REDIRECTS[s] || "";
}

export function normalizeAppLabel(label: string) {
  return String(label || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchSolutionSlug(label: string) {
  const exact = EXACT[normalizeAppLabel(label)];
  if (exact) return exact;
  const t = String(label || "");
  for (const rule of RULES) {
    if (rule.re.test(t)) return rule.slug;
  }
  return "";
}

export type SolutionFilterCopy = {
  kicker?: string;
  title?: string;
  sub?: string;
  recommend?: string;
  placeholder?: string;
  listTitle?: string;
  query?: string;
  chips?: string[];
  facetPriority?: string[];
};

export function solutionCopy(need: any, lang: string) {
  const block = need?.i18n?.[lang] || need?.i18n?.en || {};
  const filter = (block.filter || need?.i18n?.en?.filter || {}) as SolutionFilterCopy;
  const caps = block.caps && typeof block.caps === "object" ? block.caps : {};
  return {
    title: block.title || need?.slug || "Solution",
    problem: block.problem || "",
    lead: block.lead || block.description || block.problem || "",
    description: block.description || block.lead || "",
    capabilities: Array.isArray(block.capabilities) ? block.capabilities : [],
    seoTitle: block.seoTitle || "",
    seoDescription: block.seoDescription || "",
    caps,
    code: need?.code || "SOL",
    filter,
  };
}

export function solutionFilterKey(slug: string, lang: string) {
  return `solution:filter:${slug}:${lang || "en"}`;
}

/** Curated Pexels full-bleed scene for each mission. */
export type SolutionScene = {
  key: string;
  alt: string;
  altTr: string;
  photographer: string;
  pexelsUrl: string;
  objectPosition?: string;
};

export const SOLUTION_SCENES: Record<(typeof SOLUTION_SLUGS)[number], SolutionScene> = {
  "seaport-airport": {
    key: "solutions/seaport-airport.jpg",
    alt: "Aerial cargo ships and stacked containers at a seaport",
    altTr: "Limanda kuşbakışı konteyner gemileri ve istiflenmiş konteynerler",
    photographer: "Tom Fisk",
    pexelsUrl: "https://www.pexels.com/photo/2226458/",
    objectPosition: "50% 58%",
  },
  "water-systems": {
    key: "solutions/water-systems.jpg",
    alt: "Aerial view of a concrete dam and reservoir in a desert canyon",
    altTr: "Çöl kanyonunda kuşbakışı baraj ve rezervuar",
    photographer: "Pexels",
    pexelsUrl: "https://www.pexels.com/photo/aerial-view-of-hoover-dam-8304058/",
    objectPosition: "48% 42%",
  },
  storage: {
    key: "solutions/storage.jpg",
    alt: "Empty industrial warehouse hall with overhead cranes",
    altTr: "Tavan vinçli boş endüstriyel depo holü",
    photographer: "Pixabay",
    pexelsUrl: "https://www.pexels.com/photo/236705/",
    objectPosition: "50% 55%",
  },
  "base-security": {
    key: "solutions/base-security.jpg",
    alt: "Airport runway and control towers under a clear sky",
    altTr: "Açık gökyüzünde pist ve kontrol kuleleri",
    photographer: "Garrison Gao",
    pexelsUrl: "https://www.pexels.com/photo/aerial-view-of-airport-runway-on-clear-day-35118086/",
    objectPosition: "50% 72%",
  },
  "oilfield-depot": {
    key: "solutions/oilfield-depot.jpg",
    alt: "Aerial oil storage tanks at a fuel depot",
    altTr: "Akaryakıt deposunda kuşbakışı petrol tankları",
    photographer: "Diego F. Parra",
    pexelsUrl: "https://www.pexels.com/photo/silos-near-cargo-train-cars-24244233/",
    objectPosition: "72% 45%",
  },
  "fire-prevention": {
    key: "solutions/fire-prevention.jpg",
    alt: "Night bushfire advancing across a hillside beside a rural road",
    altTr: "Kırsal yol kenarında gece ilerleyen orman yangını",
    photographer: "Dane Amacher",
    pexelsUrl: "https://www.pexels.com/photo/forest-fire-in-australia-21706241/",
    objectPosition: "50% 28%",
  },
  ecological: {
    key: "solutions/ecological.jpg",
    alt: "Aerial canopy of a dense pine forest",
    altTr: "Sık çam ormanının kuşbakışı örtüsü",
    photographer: "Pixabay",
    pexelsUrl: "https://www.pexels.com/photo/green-pine-trees-1179229/",
    objectPosition: "50% 40%",
  },
  "border-control": {
    key: "solutions/border-control-scene.jpg",
    alt: "Open sand dunes on a desert frontier",
    altTr: "Sınır düzlüğünde açık çöl kumulları",
    photographer: "Greg Gulik",
    pexelsUrl: "https://www.pexels.com/photo/green-grasses-on-sahara-desert-1001435/",
    objectPosition: "50% 55%",
  },
  "urban-anti-uav": {
    key: "solutions/urban-anti-uav.jpg",
    alt: "Night skyline of illuminated skyscrapers",
    altTr: "Aydınlatılmış gökdelenlerin gece silüeti",
    photographer: "Peng LIU",
    pexelsUrl: "https://www.pexels.com/photo/raised-building-frame-169647/",
    objectPosition: "50% 42%",
  },
  "highway-railway": {
    key: "solutions/highway-railway.jpg",
    alt: "Aerial cloverleaf highway interchange",
    altTr: "Kuşbakışı yonca tipi otoyol kavşağı",
    photographer: "Aleksejs Bergmanis",
    pexelsUrl: "https://www.pexels.com/photo/aerial-photo-of-buildings-and-roads-681335/",
    objectPosition: "50% 48%",
  },
  "city-safety": {
    key: "solutions/city-safety.jpg",
    alt: "Aerial downtown streets and towers at dusk",
    altTr: "Alacakaranlıkta kuşbakışı şehir merkezi",
    photographer: "Pixabay",
    pexelsUrl: "https://www.pexels.com/photo/aerial-architectural-design-architecture-buildings-373912/",
    objectPosition: "50% 45%",
  },
  "stadium-plaza": {
    key: "solutions/stadium-plaza.jpg",
    alt: "Aerial view of a large stadium in a dense city",
    altTr: "Yoğun kent dokusunda kuşbakışı stadyum",
    photographer: "Victor Barbosa",
    pexelsUrl: "https://www.pexels.com/photo/maracana-in-rio-de-janeiro-15926254/",
    objectPosition: "50% 48%",
  },
  "lake-river": {
    key: "solutions/lake-river.jpg",
    alt: "Alpine lake reflecting forested mountains at sunrise",
    altTr: "Gün doğumunda ormanlı dağları yansıtan dağ gölü",
    photographer: "James Wheeler",
    pexelsUrl: "https://www.pexels.com/photo/lake-and-mountain-417074/",
    objectPosition: "50% 52%",
  },
};

export function solutionScene(slug: string): SolutionScene | null {
  return SOLUTION_SCENES[slug as (typeof SOLUTION_SLUGS)[number]] || null;
}

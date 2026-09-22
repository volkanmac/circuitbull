/** Products flying-dock chrome. Category keys stay stable; labels are locale-native. */

import { DEFAULT_LANG, normalizeLang } from "./locales";

export type CatalogDockCopy = {
  aria: string;
  searchLabel: string;
  searchPlaceholder: string;
  category: string;
  solution: string;
  allCategories: string;
  allSolutions: string;
  clear: string;
  countOne: string;
  countTwo?: string;
  countFew?: string;
  countMany: string;
  /** Plural rule for the live count. */
  plural?: "en" | "ru" | "ar";
  empty: string;
  categories: Record<string, string>;
};

const CATS: Record<string, Record<string, string>> = {
  en: {
    "long-range": "Long range thermal",
    "ptz-multi": "PTZ multi-sensor",
    "ptz-dual": "PTZ dual-sensor",
    cooled: "Cooled thermal",
    "vehicle-thermal": "Vehicle thermal",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Anti-drone radar",
    "anti-drone-camera": "Anti-drone camera",
    "anti-drone-jammer": "Anti-drone jammer",
    "other-thermal": "Other thermal",
    "mid-laser": "Mid-range PTZ laser",
    handheld: "Handheld monocular",
    "vehicle-laser": "Vehicle laser",
    "temp-detect": "Temperature detection",
  },
  tr: {
    "long-range": "Uzun menzil termal",
    "ptz-multi": "PTZ çoklu sensör",
    "ptz-dual": "PTZ çift sensör",
    cooled: "Soğutmalı termal",
    "vehicle-thermal": "Araç üstü termal",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Anti-drone radar",
    "anti-drone-camera": "Anti-drone kamera",
    "anti-drone-jammer": "Anti-drone jammer",
    "other-thermal": "Diğer termal",
    "mid-laser": "Orta menzil PTZ lazer",
    handheld: "El tipi monoküler",
    "vehicle-laser": "Araç üstü lazer",
    "temp-detect": "Sıcaklık tespiti",
  },
  ar: {
    "long-range": "حراري بعيد المدى",
    "ptz-multi": "PTZ متعدد المستشعرات",
    "ptz-dual": "PTZ ثنائي المستشعر",
    cooled: "حراري مبرّد",
    "vehicle-thermal": "حراري على مركبة",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "رادار مضاد للدرون",
    "anti-drone-camera": "كاميرا مضادة للدرون",
    "anti-drone-jammer": "تشويش مضاد للدرون",
    "other-thermal": "حراري آخر",
    "mid-laser": "PTZ ليزر متوسط المدى",
    handheld: "منظار يدوي",
    "vehicle-laser": "ليزر على مركبة",
    "temp-detect": "كشف درجة الحرارة",
  },
  es: {
    "long-range": "Térmica de largo alcance",
    "ptz-multi": "PTZ multisensor",
    "ptz-dual": "PTZ doble sensor",
    cooled: "Térmica refrigerada",
    "vehicle-thermal": "Térmica vehicular",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Radar anti-dron",
    "anti-drone-camera": "Cámara anti-dron",
    "anti-drone-jammer": "Inhibidor anti-dron",
    "other-thermal": "Otra térmica",
    "mid-laser": "PTZ láser de medio alcance",
    handheld: "Monocular de mano",
    "vehicle-laser": "Láser vehicular",
    "temp-detect": "Detección de temperatura",
  },
  de: {
    "long-range": "Langstrecken-Thermal",
    "ptz-multi": "PTZ-Multisensor",
    "ptz-dual": "PTZ-Doppelsensor",
    cooled: "Gekühlte Thermal",
    "vehicle-thermal": "Fahrzeug-Thermal",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Anti-Drohnen-Radar",
    "anti-drone-camera": "Anti-Drohnen-Kamera",
    "anti-drone-jammer": "Anti-Drohnen-Störer",
    "other-thermal": "Weitere Thermal",
    "mid-laser": "PTZ-Laser Mittelstrecke",
    handheld: "Handmonokular",
    "vehicle-laser": "Fahrzeug-Laser",
    "temp-detect": "Temperaturerkennung",
  },
  fr: {
    "long-range": "Thermique longue portée",
    "ptz-multi": "PTZ multi-capteurs",
    "ptz-dual": "PTZ double capteur",
    cooled: "Thermique refroidie",
    "vehicle-thermal": "Thermique véhicule",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Radar anti-drone",
    "anti-drone-camera": "Caméra anti-drone",
    "anti-drone-jammer": "Brouilleur anti-drone",
    "other-thermal": "Autre thermique",
    "mid-laser": "PTZ laser moyenne portée",
    handheld: "Monoculaire portable",
    "vehicle-laser": "Laser véhicule",
    "temp-detect": "Détection de température",
  },
  ru: {
    "long-range": "Тепловизор дальнего действия",
    "ptz-multi": "PTZ мультисенсор",
    "ptz-dual": "PTZ два сенсора",
    cooled: "Охлаждаемый тепловизор",
    "vehicle-thermal": "Тепловизор на технике",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Антидрон-радар",
    "anti-drone-camera": "Антидрон-камера",
    "anti-drone-jammer": "Антидрон-подавитель",
    "other-thermal": "Прочий тепловизор",
    "mid-laser": "PTZ-лазер средней дальности",
    handheld: "Ручной монокуляр",
    "vehicle-laser": "Лазер на технике",
    "temp-detect": "Контроль температуры",
  },
  "zh-Hant": {
    "long-range": "長距熱像",
    "ptz-multi": "PTZ 多感測",
    "ptz-dual": "PTZ 雙感測",
    cooled: "製冷熱像",
    "vehicle-thermal": "車載熱像",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "反無人機雷達",
    "anti-drone-camera": "反無人機相機",
    "anti-drone-jammer": "反無人機干擾",
    "other-thermal": "其他熱像",
    "mid-laser": "中距 PTZ 雷射",
    handheld: "手持單筒",
    "vehicle-laser": "車載雷射",
    "temp-detect": "溫度偵測",
  },
  it: {
    "long-range": "Termica a lungo raggio",
    "ptz-multi": "PTZ multisensore",
    "ptz-dual": "PTZ doppio sensore",
    cooled: "Termica raffreddata",
    "vehicle-thermal": "Termica veicolare",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "Radar anti-drone",
    "anti-drone-camera": "Camera anti-drone",
    "anti-drone-jammer": "Jammer anti-drone",
    "other-thermal": "Altra termica",
    "mid-laser": "PTZ laser medio raggio",
    handheld: "Monoculare portatile",
    "vehicle-laser": "Laser veicolare",
    "temp-detect": "Rilevamento temperatura",
  },
  ko: {
    "long-range": "장거리 열화상",
    "ptz-multi": "PTZ 멀티센서",
    "ptz-dual": "PTZ 듀얼센서",
    cooled: "냉각 열화상",
    "vehicle-thermal": "차량 열화상",
    "eo-ir": "EO/IR",
    "anti-drone-radar": "안티드론 레이더",
    "anti-drone-camera": "안티드론 카메라",
    "anti-drone-jammer": "안티드론 재머",
    "other-thermal": "기타 열화상",
    "mid-laser": "중거리 PTZ 레이저",
    handheld: "휴대용 단안",
    "vehicle-laser": "차량 레이저",
    "temp-detect": "온도 탐지",
  },
};

const UI: Record<string, Omit<CatalogDockCopy, "categories">> = {
  en: {
    aria: "Filter products",
    searchLabel: "Search",
    searchPlaceholder: "Any language — name, SKU, mission…",
    category: "Category",
    solution: "Solution",
    allCategories: "All categories",
    allSolutions: "All solutions",
    clear: "Clear",
    countOne: "{n} product",
    countMany: "{n} products",
    empty: "No products match these filters.",
  },
  tr: {
    aria: "Ürünleri filtrele",
    searchLabel: "Ara",
    searchPlaceholder: "Her dilde — ad, SKU, görev…",
    category: "Kategori",
    solution: "Çözüm",
    allCategories: "Tüm kategoriler",
    allSolutions: "Tüm çözümler",
    clear: "Temizle",
    countOne: "{n} ürün",
    countMany: "{n} ürün",
    empty: "Bu filtrelere uyan ürün yok.",
  },
  ar: {
    aria: "تصفية المنتجات",
    searchLabel: "بحث",
    searchPlaceholder: "بأي لغة — الاسم أو SKU أو المهمة…",
    category: "الفئة",
    solution: "الحل",
    allCategories: "كل الفئات",
    allSolutions: "كل الحلول",
    clear: "مسح",
    countOne: "منتج واحد",
    countTwo: "منتجان",
    countFew: "{n} منتجات",
    countMany: "{n} منتجًا",
    plural: "ar",
    empty: "لا توجد منتجات تطابق هذه التصفية.",
  },
  es: {
    aria: "Filtrar productos",
    searchLabel: "Buscar",
    searchPlaceholder: "Cualquier idioma — nombre, SKU…",
    category: "Categoría",
    solution: "Solución",
    allCategories: "Todas las categorías",
    allSolutions: "Todas las soluciones",
    clear: "Limpiar",
    countOne: "{n} producto",
    countMany: "{n} productos",
    empty: "Ningún producto coincide con estos filtros.",
  },
  de: {
    aria: "Produkte filtern",
    searchLabel: "Suche",
    searchPlaceholder: "Jede Sprache — Name, SKU, Einsatz…",
    category: "Kategorie",
    solution: "Lösung",
    allCategories: "Alle Kategorien",
    allSolutions: "Alle Lösungen",
    clear: "Zurücksetzen",
    countOne: "{n} Produkt",
    countMany: "{n} Produkte",
    empty: "Keine Produkte passen zu diesen Filtern.",
  },
  fr: {
    aria: "Filtrer les produits",
    searchLabel: "Recherche",
    searchPlaceholder: "Toute langue — nom, SKU, mission…",
    category: "Catégorie",
    solution: "Solution",
    allCategories: "Toutes les catégories",
    allSolutions: "Toutes les solutions",
    clear: "Effacer",
    countOne: "{n} produit",
    countMany: "{n} produits",
    empty: "Aucun produit ne correspond à ces filtres.",
  },
  ru: {
    aria: "Фильтр продуктов",
    searchLabel: "Поиск",
    searchPlaceholder: "На любом языке — название, SKU…",
    category: "Категория",
    solution: "Решение",
    allCategories: "Все категории",
    allSolutions: "Все решения",
    clear: "Сбросить",
    countOne: "{n} продукт",
    countFew: "{n} продукта",
    countMany: "{n} продуктов",
    plural: "ru",
    empty: "Нет продуктов по этим фильтрам.",
  },
  "zh-Hant": {
    aria: "篩選產品",
    searchLabel: "搜尋",
    searchPlaceholder: "任何語言 — 名稱、SKU、任務…",
    category: "類別",
    solution: "解決方案",
    allCategories: "全部類別",
    allSolutions: "全部解決方案",
    clear: "清除",
    countOne: "{n} 項產品",
    countMany: "{n} 項產品",
    empty: "沒有符合這些篩選的產品。",
  },
  it: {
    aria: "Filtra prodotti",
    searchLabel: "Cerca",
    searchPlaceholder: "Qualsiasi lingua — nome, SKU…",
    category: "Categoria",
    solution: "Soluzione",
    allCategories: "Tutte le categorie",
    allSolutions: "Tutte le soluzioni",
    clear: "Azzera",
    countOne: "{n} prodotto",
    countMany: "{n} prodotti",
    empty: "Nessun prodotto corrisponde a questi filtri.",
  },
  ko: {
    aria: "제품 필터",
    searchLabel: "검색",
    searchPlaceholder: "모든 언어 — 이름, SKU, 임무…",
    category: "카테고리",
    solution: "솔루션",
    allCategories: "모든 카테고리",
    allSolutions: "모든 솔루션",
    clear: "지우기",
    countOne: "제품 {n}개",
    countMany: "제품 {n}개",
    empty: "이 필터와 맞는 제품이 없습니다.",
  },
};

export function catalogDock(lang: string): CatalogDockCopy {
  const l = normalizeLang(lang);
  const ui = UI[l] || UI[DEFAULT_LANG];
  const categories = CATS[l] || CATS[DEFAULT_LANG];
  return { ...ui, categories };
}

const CATEGORY_RULES: { re: RegExp; key: string }[] = [
  { re: /^eo ir\b/, key: "eo-ir" },
  { re: /long range thermal/, key: "long-range" },
  { re: /ptz multi sensor/, key: "ptz-multi" },
  { re: /ptz dual sensor/, key: "ptz-dual" },
  { re: /anti drone radar/, key: "anti-drone-radar" },
  { re: /cooled sensor thermal/, key: "cooled" },
  { re: /vehicle mounted thermal/, key: "vehicle-thermal" },
  { re: /anti drone camera/, key: "anti-drone-camera" },
  { re: /anti drone jammer/, key: "anti-drone-jammer" },
  { re: /other thermal/, key: "other-thermal" },
  { re: /middle distance ptz laser/, key: "mid-laser" },
  { re: /handheld monocular/, key: "handheld" },
  { re: /vehicle mounted laser/, key: "vehicle-laser" },
  { re: /temperature detection/, key: "temp-detect" },
];

/** Case-fold for catalog search. Same steps run in the dock script. Idempotent. */
export function foldSearch(value: unknown) {
  return String(value ?? "")
    .replace(/\u0130/g, "i")
    .replace(/\u0131/g, "i")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function categoryKey(label: string) {
  const norm = String(label || "")
    .toLowerCase()
    .replace(/[（）()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return "";
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(norm)) return rule.key;
  }
  return norm.replace(/\s+/g, "-");
}

export function productCategoryLabels(product: { category?: unknown }) {
  const raw = product?.category;
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  return list.map((item) => String(item || "").trim()).filter(Boolean);
}

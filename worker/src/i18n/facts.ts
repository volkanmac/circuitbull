/** Ontology facts display + local search helpers (Worker). */

export type FactI18n = {
  groupLabel?: string;
  label?: string;
  value?: string;
  translated?: boolean;
  lang?: string;
};

export type ProductFact = {
  id: string;
  groupId?: string;
  groupKey?: string;
  propertyId?: string;
  propertyKey?: string;
  valueId?: string;
  value?: string;
  i18n?: Record<string, FactI18n>;
};

/** Preferred SpecGroup order for smart filter (first row = Housing). */
export const FACET_GROUP_ORDER = [
  "housing",
  "ptz",
  "enhancements",
  "thermal",
  "thermal_camera",
  "sensor",
  "lens",
  "detection",
  "recognition",
  "identification",
  "power",
  "environment",
  "interface",
  "network",
  "laser",
  "visible_camera",
  "optical",
  "ir",
  "dimensions",
  "weight",
  "general",
];

/** LLM/scrape junk group keys & labels — never show as SpecGroup titles. */
const GARBAGE_GROUP_RE =
  /^(items?|data|value|values|properties|property|specs?|spec|null|undefined|n\/?a|misc|other|row|rows|list|table|section|untitled|unknown|general_?items?)$/i;

/** Property keys/labels that are exploded table artifacts ("Item 1", item_2). */
const GARBAGE_PROP_RE = /^(item[_\s-]?\d*|items?|value|values|n\/?a|null|undefined|-|—)$/i;

export type FacetValueAgg = { value: string; count: number };
export type FacetPropertyAgg = {
  propertyId?: string;
  propertyKey: string;
  label: string;
  count: number;
  values: FacetValueAgg[];
  /** When property has parseable numbers across catalog */
  numeric?: { min: number; max: number; unit: string; count: number } | null;
};
export type FacetGroupAgg = {
  groupId?: string;
  groupKey: string;
  label: string;
  count: number;
  properties: FacetPropertyAgg[];
  topValues: FacetValueAgg[];
};
export type FacetIndex = {
  lang: string;
  factCount: number;
  groupCount: number;
  groups: FacetGroupAgg[];
  builtAt: string;
};

export function isGarbageGroup(keyOrLabel: string | undefined | null): boolean {
  const s = String(keyOrLabel || "").trim();
  if (!s) return true;
  if (GARBAGE_GROUP_RE.test(s)) return true;
  if (GARBAGE_GROUP_RE.test(s.replace(/[\s_-]+/g, ""))) return true;
  return false;
}

export function isGarbageProperty(keyOrLabel: string | undefined | null): boolean {
  const s = String(keyOrLabel || "").trim();
  if (!s) return true;
  if (GARBAGE_PROP_RE.test(s)) return true;
  const leaf = s.includes(".") ? s.split(".").pop() || s : s;
  if (GARBAGE_PROP_RE.test(leaf)) return true;
  if (/^item[_\s-]?\d+$/i.test(leaf)) return true;
  return false;
}

/** Human-readable SpecGroup title from key or raw label. */
export function humanizeGroupLabel(raw: string | undefined | null, fallbackKey?: string): string {
  const src = String(raw || fallbackKey || "").trim();
  if (!src || isGarbageGroup(src)) {
    const fk = String(fallbackKey || "").trim();
    if (!fk || isGarbageGroup(fk)) return "";
    return titleCaseKey(fk);
  }
  if (/[a-z]/.test(src) && /[A-Z]/.test(src) && !src.includes("_")) return src;
  return titleCaseKey(src);
}

export function titleCaseKey(key: string) {
  return String(key || "")
    .replace(/[_/]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse a datasheet value into a primary number (+ unit).
 * Handles "16400m", "13km", "30~180mm", "min 40W, max 120W".
 */
export function parseNumericValue(raw: string | undefined | null): { value: number; min: number; max: number; unit: string } | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  const nums: { n: number; unit: string }[] = [];
  const re = /([\d]+(?:\.\d+)?)\s*(km|mm|m|°|deg|w|v|hz|fps|kg|g|%|mrad)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    let n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    let unit = (m[2] || "").toLowerCase();
    if (unit === "km") {
      n *= 1000;
      unit = "m";
    }
    if (unit === "deg") unit = "°";
    nums.push({ n, unit });
  }
  if (!nums.length) return null;
  const unit = nums.find((x) => x.unit)?.unit || "";
  const values = nums.map((x) => x.n);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { value: max, min, max, unit };
}

/** Aggregate SpecGroups / properties / common values across all product facts. */
export function buildFacetIndex(products: any[], lang = "en", opts?: { maxGroups?: number; maxProps?: number; maxValues?: number }): FacetIndex {
  const maxGroups = opts?.maxGroups ?? 24;
  const maxProps = opts?.maxProps ?? 14;
  const maxValues = opts?.maxValues ?? 12;
  const groupMap = new Map<
    string,
    {
      groupId?: string;
      groupKey: string;
      label: string;
      count: number;
      valueCounts: Map<string, number>;
      props: Map<
        string,
        {
          propertyId?: string;
          propertyKey: string;
          label: string;
          count: number;
          valueCounts: Map<string, number>;
          nums: number[];
          unit: string;
        }
      >;
    }
  >();
  let factCount = 0;

  for (const p of products || []) {
    for (const raw of p.facts || []) {
      const f = localizeFact(raw, lang);
      const gKey = f.groupKey || "general";
      if (isGarbageGroup(gKey) || isGarbageGroup(f.groupLabel)) continue;
      if (isGarbageProperty(f.propertyKey) || isGarbageProperty(f.label)) continue;

      factCount += 1;
      const label = humanizeGroupLabel(f.groupLabel, gKey) || titleCaseKey(gKey);
      if (!groupMap.has(gKey)) {
        groupMap.set(gKey, {
          groupId: f.groupId,
          groupKey: gKey,
          label,
          count: 0,
          valueCounts: new Map(),
          props: new Map(),
        });
      }
      const g = groupMap.get(gKey)!;
      g.count += 1;
      if (label && label !== gKey) g.label = label;
      const val = String(f.value || "").trim();
      if (val && val.length <= 64) g.valueCounts.set(val, (g.valueCounts.get(val) || 0) + 1);

      const pKey = f.propertyKey || `${gKey}.value`;
      if (!g.props.has(pKey)) {
        g.props.set(pKey, {
          propertyId: f.propertyId,
          propertyKey: pKey,
          label: f.label || titleCaseKey(pKey.split(".").pop() || pKey),
          count: 0,
          valueCounts: new Map(),
          nums: [],
          unit: "",
        });
      }
      const prop = g.props.get(pKey)!;
      prop.count += 1;
      if (f.label && !isGarbageProperty(f.label)) prop.label = f.label;
      if (val && val.length <= 64) prop.valueCounts.set(val, (prop.valueCounts.get(val) || 0) + 1);
      const parsed = parseNumericValue(val);
      if (parsed) {
        prop.nums.push(parsed.min, parsed.max);
        if (parsed.unit && !prop.unit) prop.unit = parsed.unit;
      }
    }
  }

  const orderIdx = (key: string) => {
    const i = FACET_GROUP_ORDER.indexOf(key);
    return i >= 0 ? i : 1000 + key.charCodeAt(0);
  };

  const toSortedValues = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, maxValues)
      .map(([value, count]) => ({ value, count }));

  const groups = [...groupMap.values()]
    .filter((g) => g.count > 0 && g.label && !isGarbageGroup(g.groupKey) && !isGarbageGroup(g.label))
    .sort((a, b) => orderIdx(a.groupKey) - orderIdx(b.groupKey) || b.count - a.count)
    .slice(0, maxGroups)
    .map((g) => ({
      groupId: g.groupId,
      groupKey: g.groupKey,
      label: humanizeGroupLabel(g.label, g.groupKey),
      count: g.count,
      topValues: toSortedValues(g.valueCounts),
      properties: [...g.props.values()]
        .filter((p) => !isGarbageProperty(p.propertyKey) && !isGarbageProperty(p.label))
        .sort((a, b) => b.count - a.count)
        .slice(0, maxProps)
        .map((p) => {
          const numeric =
            p.nums.length >= 2
              ? {
                  min: Math.min(...p.nums),
                  max: Math.max(...p.nums),
                  unit: p.unit || "",
                  count: p.nums.length,
                }
              : null;
          return {
            propertyId: p.propertyId,
            propertyKey: p.propertyKey,
            label: p.label,
            count: p.count,
            values: toSortedValues(p.valueCounts),
            numeric: numeric && numeric.max > numeric.min ? numeric : numeric,
          };
        }),
    }));

  return {
    lang,
    factCount,
    groupCount: groups.length,
    groups,
    builtAt: new Date().toISOString(),
  };
}

export function groupFactsForDisplay(facts: ProductFact[] | undefined, lang = "en") {
  const map = new Map<
    string,
    {
      groupId?: string;
      groupKey: string;
      label: string;
      items: {
        id: string;
        propertyId?: string;
        propertyKey?: string;
        label: string;
        value: string;
        translated: boolean;
        factCode: string;
      }[];
    }
  >();
  for (const f of facts || []) {
    const block = f.i18n?.[lang] || f.i18n?.en || {};
    const gKey = f.groupKey || "general";
    const rawLabel = block.groupLabel || gKey;
    if (isGarbageGroup(gKey) || isGarbageGroup(rawLabel)) continue;
    const propLabel = block.label || f.propertyKey || "";
    if (isGarbageProperty(f.propertyKey) || isGarbageProperty(propLabel)) continue;
    const value = String(block.value || f.value || "").trim();
    if (!value) continue;

    const label = humanizeGroupLabel(rawLabel, gKey);
    if (!label) continue;

    if (!map.has(gKey)) {
      map.set(gKey, {
        groupId: f.groupId,
        groupKey: gKey,
        label,
        items: [],
      });
    }
    const factCode = String(f.id || f.propertyKey || "").toLowerCase();
    map.get(gKey)!.items.push({
      id: f.id,
      propertyId: f.propertyId,
      propertyKey: f.propertyKey,
      label: propLabel || "Value",
      value,
      translated: Boolean(block.translated),
      factCode,
    });
  }
  return [...map.values()].filter((g) => g.items.length > 0);
}

export function localizeFact(f: ProductFact, lang: string) {
  const block = f.i18n?.[lang] || f.i18n?.en || {};
  return {
    id: f.id,
    groupId: f.groupId,
    groupKey: f.groupKey,
    propertyId: f.propertyId,
    propertyKey: f.propertyKey,
    valueId: f.valueId,
    value: block.value || f.value,
    groupLabel: humanizeGroupLabel(block.groupLabel || f.groupKey, f.groupKey),
    label: block.label || f.propertyKey,
    translated: Boolean(block.translated),
    lang,
    factCode: String(f.id || f.propertyKey || "").toLowerCase(),
  };
}

/** Display SKU (Cb-xxxxxx); never surface SMARTID wording. */
export function displaySku(p: { smartId?: string; sku?: string; model?: string } | null | undefined): string {
  const raw = String(p?.sku || p?.smartId || "").trim();
  if (!raw) return p?.model || "SKU";
  if (/^SMARTID-/i.test(raw)) {
    const m = raw.match(/(\d{6})$/);
    if (m) return `Cb-${m[1]}`;
  }
  return raw;
}

/** Keyword fallback search across KV product facts */
export function searchFactsLocal(products: any[], q: string, lang: string, limit = 20) {
  const needle = q.toLowerCase().trim();
  if (!needle) return [];
  const hits: any[] = [];
  for (const p of products) {
    for (const f of p.facts || []) {
      if (isGarbageGroup(f.groupKey) || isGarbageProperty(f.propertyKey)) continue;
      const loc = localizeFact(f, lang);
      const sku = displaySku(p);
      const hay = `${loc.groupLabel} ${loc.label} ${loc.value} ${sku} ${p.smartId || ""} ${p.model || ""} ${p.name || ""}`.toLowerCase();
      if (!hay.includes(needle) && !needle.split(/\s+/).every((w) => hay.includes(w))) continue;
      hits.push({
        score: hay.includes(needle) ? 1 : 0.6,
        smartId: p.smartId,
        sku,
        slug: p.slug,
        productName: p.name,
        fact: loc,
      });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}

/** Match a fact value against optional numeric min/max bounds. */
export function factMatchesRange(value: string | undefined, min?: number | null, max?: number | null): boolean {
  if (min == null && max == null) return true;
  const parsed = parseNumericValue(value);
  if (!parsed) return false;
  if (min != null && parsed.max < min) return false;
  if (max != null && parsed.min > max) return false;
  return true;
}

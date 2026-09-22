/**
 * Circuitbull unified property ontology helpers.
 * IDs: GROUP-*, PROP-*, VAL-*, FACT-*
 */
import { createHash } from "crypto";

export function slugifyKey(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[^\w\s./-]+/g, "")
    .replace(/[\s./]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
    .slice(0, 64);
}

export function groupId(groupKey) {
  return `GROUP-${slugifyKey(groupKey)}`;
}

export function propertyId(groupKey, propKey) {
  const g = slugifyKey(groupKey);
  const p = slugifyKey(propKey).replace(new RegExp(`^${g}_?`), "");
  return `PROP-${g}-${p || "value"}`;
}

export function propertyKey(groupKey, propKey) {
  const g = slugifyKey(groupKey);
  const p = slugifyKey(propKey).replace(new RegExp(`^${g}_?`), "");
  return `${g}.${p || "value"}`;
}

export function valueId(canonical) {
  const h = createHash("sha1").update(String(canonical || "").trim().toLowerCase()).digest("hex").slice(0, 12);
  return `VAL-${h}`;
}

export function factId(productSourceId, index) {
  return `FACT-${productSourceId}-${String(index).padStart(3, "0")}`;
}

/** Normalize LLM groups → Mongo facts[] */
export function groupsToFacts(groups, product) {
  const sourceId = product.sourceId || String(product._id || "").replace(/^product:/, "");
  const facts = [];
  let n = 0;
  for (const g of groups || []) {
    const gKey = slugifyKey(g.key || g.label || "general") || "general";
    const gLabel = String(g.label || g.key || "General").trim();
    const props = g.properties || g.facts || [];
    for (const prop of props) {
      const pKeyRaw = prop.key || prop.label || "value";
      const label = String(prop.label || prop.key || "Value").trim();
      const value = String(prop.value ?? "").replace(/\s+/g, " ").trim();
      if (!value) continue;
      n += 1;
      const pId = propertyId(gKey, pKeyRaw);
      const vId = valueId(value);
      const fId = factId(sourceId, n);
      facts.push({
        id: fId,
        groupId: groupId(gKey),
        groupKey: gKey,
        propertyId: pId,
        propertyKey: propertyKey(gKey, pKeyRaw),
        valueId: vId,
        value,
        i18n: {
          en: {
            groupLabel: gLabel,
            label,
            value,
            translated: false,
            lang: "en",
          },
        },
      });
    }
  }
  return facts;
}

/** Group facts for UI rendering */
export function groupFactsForDisplay(facts, lang = "en") {
  const map = new Map();
  for (const f of facts || []) {
    const block = f.i18n?.[lang] || f.i18n?.en || {};
    const gKey = f.groupKey || "general";
    if (!map.has(gKey)) {
      map.set(gKey, {
        groupId: f.groupId,
        groupKey: gKey,
        label: block.groupLabel || gKey,
        items: [],
      });
    }
    map.get(gKey).items.push({
      id: f.id,
      propertyId: f.propertyId,
      propertyKey: f.propertyKey,
      label: block.label || f.propertyKey,
      value: block.value || f.value,
      translated: Boolean(block.translated),
    });
  }
  return [...map.values()];
}

export const KNOWN_GROUP_HINTS = [
  "housing",
  "ptz",
  "enhancements",
  "thermal",
  "sensor",
  "lens",
  "detection",
  "recognition",
  "identification",
  "power",
  "consumption",
  "weight",
  "interface",
  "network",
  "environment",
  "dimensions",
  "general",
  "optical",
  "laser",
  "visible",
  "ir",
];

/**
 * Deterministic datasheet → ontology facts parser (no LLM required).
 * Splits Housing/PTZ/Enhancements numbered lists and semicolon blobs into atomic facts.
 */
import { groupsToFacts, slugifyKey } from "./ontology.mjs";

const GROUP_ALIASES = [
  [/hous|shell|enclosure|material/i, "housing", "Housing"],
  [/ptz|pan.?tilt|pt.?structure|pt.?position|pt.?load|turntable/i, "ptz", "PTZ"],
  [/enhance|option/i, "enhancements", "Enhancements"],
  [/sensor|detector|ufpa|vox|netd|thermal.?sens/i, "sensor", "Sensor"],
  [/lens|focal|zoom|fov|optical|ifov/i, "lens", "Lens"],
  [/detect|recognition|identif|range/i, "detection", "Detection"],
  [/consum|power|weight|voltage/i, "power", "Power"],
  [/interface|network|protocol|onvif|rj45|video.?out/i, "interface", "Interface"],
  [/environ|temperat|humidity|protect|ip\d/i, "environment", "Environment"],
  [/image|process|agc|pseudo|color/i, "image", "Image Processing"],
  [/laser|illumin/i, "laser", "Laser"],
  [/track|patrol|scan|preset/i, "tracking", "Tracking"],
  [/dimension|size/i, "dimensions", "Dimensions"],
];

function resolveGroup(specKey) {
  for (const [re, key, label] of GROUP_ALIASES) {
    if (re.test(specKey)) return { key, label };
  }
  const k = slugifyKey(specKey) || "general";
  return { key: k, label: String(specKey).trim() || "General" };
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&deg;/gi, "°")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitNumbered(text) {
  const t = decodeEntities(text);
  if (!/\d+\s*\.\.?/.test(t)) return null;
  const parts = t.split(/(?=(?:^|\s)\d+\s*\.\.?)/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const items = [];
  for (const part of parts) {
    const m = part.match(/^\d+\s*\.\.?\s*(.+)$/);
    const body = (m ? m[1] : part).trim();
    if (!body || body.length < 2) continue;
    const kv = body.match(/^([^:]{2,60}?)\s*[:：]\s*(.+)$/);
    if (kv) items.push({ label: kv[1].trim(), value: kv[2].trim() });
    else items.push({ label: null, value: body });
  }
  return items.length ? items : null;
}

function splitSemicolon(text) {
  const t = decodeEntities(text);
  if (!/;/.test(t) && !t.includes("；")) return null;
  const parts = t.split(/[;；]/).map((x) => x.trim()).filter((x) => x.length > 1);
  if (parts.length < 2) return null;
  return parts.map((body) => {
    const kv = body.match(/^([^:]{2,50}?)\s*[:：]\s*(.+)$/);
    if (kv) return { label: kv[1].trim(), value: kv[2].trim() };
    return { label: null, value: body };
  });
}

function inferLabelFromValue(groupKey, value, index) {
  const v = value.toLowerCase();
  if (groupKey === "housing") {
    if (/^ip\d{2}/i.test(value) || (/\bip\d{2}\b/i.test(value) && value.length < 12)) return "Sealing / IP rating";
    if (/aluminum|alloy|steel|plastic|material/i.test(v) && v.length < 80) return "Material";
    if (/pta|coating|corrosion|seawater/i.test(v)) return "Coating";
    if (/temperature.?control|heater|defrost/i.test(v)) return "Temperature control";
    if (/connector|aviation|waterproof.?connect/i.test(v)) return "Connector";
    if (/integral|single.?window|window|structure|shell/i.test(v)) return "Structure";
  }
  if (groupKey === "ptz") {
    if (/\d+\s*kg/i.test(v) && /load/i.test(v)) return "Load capacity";
    if (/^pan|pan\s*[:0]/i.test(v) || /pan\s*0/i.test(v)) return "Pan range";
    if (/tilt/i.test(v)) return "Tilt range";
    if (/speed/i.test(v)) return "Speed";
    if (/preset/i.test(v)) return "Presets";
    if (/scan/i.test(v)) return "Scan modes";
  }
  if (groupKey === "power") {
    if (/consum/i.test(v) || /\d+\s*w\b/i.test(v)) return "Consumption";
    if (/weight|kg/i.test(v)) return "Weight";
  }
  return `Item ${index + 1}`;
}

function pushProp(bucket, group, label, value) {
  const val = decodeEntities(value);
  if (!val || val.length < 1 || val.length > 500) return;
  const propLabel = (label || "Value").replace(/\s+/g, " ").trim().slice(0, 80);
  const propKey = slugifyKey(propLabel) || `item_${bucket.length + 1}`;
  bucket.push({
    groupKey: group.key,
    groupLabel: group.label,
    key: propKey,
    label: propLabel,
    value: val,
  });
}

export function parseSpecsToGroups(product) {
  const specs = product.specs || product.datasheet?.specs || {};
  const groupMap = new Map();

  const ensure = (g) => {
    if (!groupMap.has(g.key)) groupMap.set(g.key, { key: g.key, label: g.label, properties: [] });
    return groupMap.get(g.key);
  };

  for (const [rawKey, rawVal] of Object.entries(specs)) {
    if (rawVal == null || String(rawVal).trim() === "") continue;
    const group = resolveGroup(rawKey);
    const g = ensure(group);
    const text = decodeEntities(rawVal);

    const numbered = splitNumbered(text);
    const semis = !numbered ? splitSemicolon(text) : null;
    const items = numbered || semis;

    if (items && items.length >= 2) {
      items.forEach((it, i) => {
        const label = it.label || inferLabelFromValue(group.key, it.value, i);
        pushProp(g.properties, group, label, it.value);
      });
    } else {
      pushProp(g.properties, group, String(rawKey).replace(/\s*\(Optional\)\s*/i, "").trim(), text);
    }
  }

  for (const g of groupMap.values()) {
    if (g.key !== "housing") continue;
    const hasIp = g.properties.some((p) => /ip\d{2}/i.test(p.value) && p.value.length <= 10);
    if (hasIp) continue;
    for (const p of [...g.properties]) {
      const m = p.value.match(/\b(IP\d{2}(?:\/IP\d{2})?)\b/i);
      if (m && p.value.length > 20) {
        pushProp(g.properties, { key: "housing", label: "Housing" }, "Sealing / IP rating", m[1].toUpperCase());
      }
    }
  }

  return [...groupMap.values()].filter((g) => g.properties.length > 0);
}

export function extractFactsDeterministic(product) {
  let groups = parseSpecsToGroups(product);
  if (!groups.length) {
    groups = parseSpecsToGroups({
      ...product,
      specs: { ...(product.specs || {}), Model: product.model || product.name || "unknown" },
    });
  }
  return groupsToFacts(groups, product);
}

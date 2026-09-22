/**
 * Canonical mission solutions — product Applications map 1:1 onto these pages.
 * Graph: (:Product)-[:SERVES_NEED]->(:Need)-[:SATISFIED_BY]->(:Solution)
 */

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
];

/** Old scrape slugs → canonical solution */
export const SOLUTION_REDIRECTS = {
  "airport-security": "seaport-airport",
  "coastal-surveillance": "border-control",
  "anti-uav": "urban-anti-uav",
  "forest-fire": "fire-prevention",
  aquaculture: "lake-river",
  industrial: "oilfield-depot",
  surveillance: "city-safety",
  "vehicle-mounted": "border-control",
};

const RULES = [
  { slug: "seaport-airport", re: /\b(seaport|airport|airfield|harbor|harbour|runway|avian|air port)\b/i },
  { slug: "water-systems", re: /\b(water system|reservoir|dam|potable|drinking water|waterworks|pump station)\b/i },
  { slug: "storage", re: /\b(storage|warehouse|warehousing|logistics|depot(?!\s+security)|stockpile)\b/i },
  { slug: "base-security", re: /\b(base security|military base|barracks|camp security|airbase)\b/i },
  { slug: "oilfield-depot", re: /\b(oilfield|oil field|oil depot|oil and gas|petrochemical|refin|oil industry|oil safety|natural gas|coal min|smelting|chemical plant|flammable|explosive|hazardous)\b/i },
  { slug: "fire-prevention", re: /\b(fire source|forest fire|fire detection|fire warning|fire prevention|fire alarm|charging facilit)\b/i },
  { slug: "ecological", re: /\b(ecological|environmental monitoring|ecology)\b/i },
  { slug: "border-control", re: /\b(border|coastal defense|coastal surveillance|coastal and|perimeter|homeland|sea warning|sea surface)\b/i },
  { slug: "urban-anti-uav", re: /\b(anti-?uav|anti-?drone|c-uas|uav|drone|urban security)\b/i },
  { slug: "highway-railway", re: /\b(highway|railway|railroad|expressway|traffic|road safety|subway station|passenger station|railway station)\b/i },
  { slug: "city-safety", re: /\b(city safety|safe city|urban safety|city project)\b/i },
  { slug: "stadium-plaza", re: /\b(stadium|plaza|square|scenic)\b/i },
  { slug: "lake-river", re: /\b(lake|river|aquaculture|fishery|ship(board)?|maritime|marine|harbor|offshore|water area|bridge collision)\b/i },
];

export const SOLUTIONS = {
  "seaport-airport": {
    slug: "seaport-airport",
    code: "SAP",
    i18n: {
      en: {
        title: "Seaport and airport monitoring",
        problem: "Long-range detection on runways, aprons, and harbor approaches — one stack for air and sea gates.",
        lead: "Airports and seaports need day/night eyes on perimeters, taxiways, and channel traffic. We field thermal and EO/IR platforms that pick up people, vehicles, and small craft before they reach the fence.",
        capabilities: [
          "Runway and apron thermal coverage in fog and night",
          "Harbor channel and berth approach tracking",
          "Perimeter breach alert with PTZ handoff",
          "Quote-ready SKUs with datasheets and range figures",
        ],
      },
      tr: {
        title: "Liman ve havalimanı izleme",
        problem: "Pist, apron ve liman yaklaşımlarında uzun menzil tespit — hava ve deniz kapıları için tek yığın.",
        lead: "Havalimanı ve liman perimetresi, taksi yolları ve kanal trafiği gece-gündüz izlenir. Çit hattına gelmeden insan, araç ve küçük tekne tespiti.",
        capabilities: [
          "Sis ve gece pist / apron termal kapsama",
          "Liman kanalı ve rıhtım yaklaşma takibi",
          "Perimetre ihlalinde PTZ devri",
          "Teklife hazır SKU ve menzil verileri",
        ],
      },
    },
  },
  "water-systems": {
    slug: "water-systems",
    code: "WTR",
    i18n: {
      en: {
        title: "Water system monitoring",
        problem: "Protect reservoirs, plants, and pipelines with sensors that work in weather and at night.",
        lead: "Water infrastructure is spread out and poorly lit. Thermal and multi-sensor cameras watch intake, treatment, and storage so operators see intrusion and heat events early.",
        capabilities: [
          "Reservoir and plant perimeter watch",
          "Night and fog imaging on open water",
          "Heat-event cueing at pumps and transformers",
          "Pair with Circuitbull® IoT / SCADA live monitoring",
        ],
      },
      tr: {
        title: "Su sistemi izleme",
        problem: "Rezervuar, tesis ve hatları gece ve kötü havada çalışan sensörlerle koruyun.",
        lead: "Su altyapısı dağınık ve karanlıktır. Termal kameralar giriş, arıtma ve depolamayı izler; izinsiz giriş ve ısı olayları erken görülür.",
        capabilities: [
          "Rezervuar ve tesis perimetresi",
          "Açık suda gece / sis görüntüleme",
          "Pompa ve transformatörde ısı uyarısı",
          "Circuitbull® IoT / SCADA ile canlı izleme",
        ],
      },
    },
  },
  storage: {
    slug: "storage",
    code: "STG",
    i18n: {
      en: {
        title: "Storage monitoring",
        problem: "Warehouses, yards, and depots need wide-area thermal coverage and a short quote path.",
        lead: "Storage sites are large, dark, and easy to cut through. We recommend PTZ and multi-sensor units that cover yards, loading docks, and outdoor stock without a light show.",
        capabilities: [
          "Yard and dock thermal coverage",
          "Outdoor stockpile and fence line watch",
          "Low-light identification for patrol handoff",
          "Datasheet-backed SKUs ready to specify",
        ],
      },
      tr: {
        title: "Depo izleme",
        problem: "Depo, saha ve stok alanları için geniş alan termal kapsama ve kısa teklif yolu.",
        lead: "Depolama sahaları geniş ve karanlıktır. Avlu, rampa ve açık stoku ışık göstermeden izleyen PTZ ve çoklu-sensör üniteler.",
        capabilities: [
          "Avlu ve rampa termal kapsama",
          "Açık stok ve çit hattı izleme",
          "Devriye devri için düşük ışık tanımlama",
          "Şartnameye hazır SKU ve datasheet",
        ],
      },
    },
  },
  "base-security": {
    slug: "base-security",
    code: "BAS",
    i18n: {
      en: {
        title: "Base security monitoring",
        problem: "Military and government bases need long-range eyes on the wire, gates, and approach roads.",
        lead: "A base is a perimeter plus critical pads. We field rugged thermal / EO-IR platforms for fence lines, vehicle gates, and stand-off detection so the TOC sees the approach, not just the breach.",
        capabilities: [
          "Fence-line and approach-road detection",
          "Gate and pad overwatch, day and night",
          "Rugged housings for dust, salt, and heat",
          "Mission brief and quantity quote in one request",
        ],
      },
      tr: {
        title: "Üs güvenliği izleme",
        problem: "Askeri ve kamu üslerinde tel, kapı ve yaklaşma yollarında uzun menzil göz.",
        lead: "Üs = perimetre + kritik padler. Çit, araç kapısı ve durdurma mesafesi için dayanıklı termal / EO-IR; TOC ihlali değil yaklaşmayı görür.",
        capabilities: [
          "Çit hattı ve yaklaşma yolu tespiti",
          "Kapı ve pad üst gözetimi",
          "Toz, tuz ve ısıya dayanıklı gövde",
          "Görev brifingi ve adetli teklif",
        ],
      },
    },
  },
  "oilfield-depot": {
    slug: "oilfield-depot",
    code: "OIL",
    i18n: {
      en: {
        title: "Oilfield and oil depot security",
        problem: "Well pads, tank farms, and depots need explosion-aware sensors and stand-off thermal watch.",
        lead: "Oil sites mix people, vehicles, heat, and hazardous zones. We recommend thermal cameras — including explosion-proof options — so you see tank-farm perimeters, flare stacks, and approach roads without walking the line.",
        capabilities: [
          "Tank farm and well-pad perimeter watch",
          "Explosion-proof housings where the zone requires it",
          "Heat and flame cueing for early warning",
          "Specify by SKU, range, and rating — then quote",
        ],
      },
      tr: {
        title: "Petrol sahası ve depo güvenliği",
        problem: "Kuyu padleri, tank çiftlikleri ve depolar için patlama farkındalıklı sensör ve durdurma mesafeli termal izleme.",
        lead: "Petrol sahasında insan, araç, ısı ve tehlikeli bölgeler bir arada. Tank perimetresi, flare ve yaklaşma yolları hat yürümeden görülür.",
        capabilities: [
          "Tank çiftliği ve kuyu pad perimetresi",
          "Bölge gerektiriyorsa patlamaya dayanıklı gövde",
          "Erken uyarı için ısı ve alev ipucu",
          "SKU, menzil ve sınıf ile şartname → teklif",
        ],
      },
    },
  },
  "fire-prevention": {
    slug: "fire-prevention",
    code: "FIR",
    i18n: {
      en: {
        title: "Fire source prevention and monitoring",
        problem: "Spot heat before it becomes a fire — forest edge, tank farm, or charging yard.",
        lead: "Thermal sensors see a hot spot when the eye still sees nothing. We field cameras for forest belts, industrial yards, and large outdoor sites so you get an alarm while you can still put it out.",
        capabilities: [
          "Hot-spot detection at stand-off range",
          "Forest edge and industrial yard coverage",
          "Day/night imaging that does not need floodlight",
          "Pair alerts with Circuitbull® live monitoring",
        ],
      },
      tr: {
        title: "Yangın kaynağı önleme ve izleme",
        problem: "Isıyı yangın olmadan yakalayın — orman kenarı, tank sahası veya şarj alanı.",
        lead: "Termal sensör gözün görmediği sıcak noktayı görür. Orman kuşağı, sanayi sahası ve açık alanlarda alarm, söndürme şansı varken gelir.",
        capabilities: [
          "Durdurma mesafesinde sıcak nokta tespiti",
          "Orman kenarı ve sanayi sahası kapsama",
          "Projektör gerektirmeyen gece/gündüz görüntü",
          "Circuitbull® canlı izleme ile alarm",
        ],
      },
    },
  },
  ecological: {
    slug: "ecological",
    code: "ECO",
    i18n: {
      en: {
        title: "Ecological and environmental monitoring",
        problem: "Watch protected land and water without lighting the habitat.",
        lead: "Environmental sites need quiet, long-range sensing — wildlife corridors, wetlands, and restricted land. Thermal and EO/IR let you count, track, and deter without a floodlight grid.",
        capabilities: [
          "Low-impact night imaging",
          "Wetland and corridor coverage",
          "Long-range observation without patrol density",
          "Catalog SKUs with clear detection figures",
        ],
      },
      tr: {
        title: "Ekolojik ve çevresel izleme",
        problem: "Korunan kara ve suyu habitatı aydınlatmadan izleyin.",
        lead: "Yaban koridoru, sulak alan ve kısıtlı arazide sessiz, uzun menzil algılama. Termal / EO-IR, projektör ızgarası olmadan sayım ve takip.",
        capabilities: [
          "Düşük etkili gece görüntüleme",
          "Sulak alan ve koridor kapsama",
          "Yoğun devriye olmadan uzun menzil",
          "Net tespit rakamlı katalog SKU",
        ],
      },
    },
  },
  "border-control": {
    slug: "border-control",
    code: "BDR",
    i18n: {
      en: {
        title: "Border and coastal defense",
        problem: "Long-range detection, tracking, and command for land borders and the coast.",
        lead: "Borders and coasts are measured in kilometers, not cameras. We field thermal and EO/IR platforms that detect vehicles, people, and small craft at stand-off range, then hand off to your command stack.",
        capabilities: [
          "Vehicle and human detection at multi-kilometer range",
          "Coastal craft and shoreline tracking",
          "PTZ handoff from radar or cue",
          "Made-in-USA IoT / SCADA layer on the same mission",
        ],
      },
      tr: {
        title: "Sınır ve kıyı savunması",
        problem: "Kara sınırları ve kıyı için uzun menzil tespit, takip ve komuta.",
        lead: "Sınır ve kıyı kilometre ile ölçülür. Araç, insan ve küçük tekneyi durdurma mesafesinde gören termal / EO-IR; komuta yığınına devir.",
        capabilities: [
          "Çok kilometrelik araç ve insan tespiti",
          "Kıyı tekne ve sahil takibi",
          "Radar veya ipucundan PTZ devri",
          "Aynı görevde ABD üretimi IoT / SCADA katmanı",
        ],
      },
    },
  },
  "urban-anti-uav": {
    slug: "urban-anti-uav",
    code: "UAV",
    i18n: {
      en: {
        title: "Urban security and anti-UAV",
        problem: "City airspace and streets — detect drones and ground threats in the same picture.",
        lead: "Urban sites mix rooftops, crowds, and cheap UAVs. We recommend multi-sensor and thermal platforms that cue on small air targets and still cover the street and plaza.",
        capabilities: [
          "Small UAV thermal / daylight cueing",
          "Street and plaza overwatch",
          "EO/IR stacks that pair with radar cue",
          "Quote by SKU for city and venue programs",
        ],
      },
      tr: {
        title: "Kentsel güvenlik ve anti-İHA",
        problem: "Şehir hava sahası ve sokak — drone ve yer tehdidini aynı resimde görün.",
        lead: "Kentte çatı, kalabalık ve ucuz İHA bir arada. Küçük hava hedeflerine ipucu veren, sokak ve meydanı da kapsayan çoklu-sensör / termal.",
        capabilities: [
          "Küçük İHA termal / gündüz ipucu",
          "Sokak ve meydan üst gözetimi",
          "Radar ipucu ile EO/IR yığını",
          "Kent ve mekan programları için SKU teklifi",
        ],
      },
    },
  },
  "highway-railway": {
    slug: "highway-railway",
    code: "HWY",
    i18n: {
      en: {
        title: "Highway and railway monitoring",
        problem: "Corridors, stations, and right-of-way — see incidents and intrusion at range.",
        lead: "Highways and rail lines are linear and dark. Thermal PTZ and corridor cameras watch tracks, stations, and shoulders so operators see a stopped vehicle or a walker before it becomes an incident.",
        capabilities: [
          "Right-of-way and shoulder coverage",
          "Station and yard overwatch",
          "Night imaging without continuous lighting",
          "Specify range and PTZ load from the datasheet",
        ],
      },
      tr: {
        title: "Otoyol ve demiryolu izleme",
        problem: "Koridor, istasyon ve güzergâh — olay ve izinsiz girişi menzilde görün.",
        lead: "Otoyol ve ray hattı doğrusal ve karanlıktır. Termal PTZ duran araç veya yayayı olay olmadan önce gösterir.",
        capabilities: [
          "Güzergâh ve banket kapsama",
          "İstasyon ve saha üst gözetimi",
          "Sürekli aydınlatmasız gece görüntü",
          "Datasheet’ten menzil ve PTZ yükü",
        ],
      },
    },
  },
  "city-safety": {
    slug: "city-safety",
    code: "CTY",
    i18n: {
      en: {
        title: "City safety",
        problem: "Municipal programs that need military-grade sensors, not consumer CCTV.",
        lead: "Safe-city work still needs real detection range and weather performance. We quote thermal and EO/IR platforms that sit on towers and rooftops and feed your existing command room.",
        capabilities: [
          "Tower and rooftop long-range watch",
          "Weather-capable imaging for municipal ops",
          "SKU-level specs for tender packages",
          "Support and quote through Circuitbull®",
        ],
      },
      tr: {
        title: "Kent güvenliği",
        problem: "Tüketici CCTV değil, askeri sınıf sensör isteyen belediye programları.",
        lead: "Güvenli kent işi gerçek menzil ve hava performansı ister. Kule ve çatıdaki termal / EO-IR, mevcut komuta odasına beslenir.",
        capabilities: [
          "Kule ve çatı uzun menzil izleme",
          "Belediye operasyonu için hava dayanımı",
          "İhale dosyası için SKU şartnamesi",
          "Circuitbull® üzerinden teklif ve destek",
        ],
      },
    },
  },
  "stadium-plaza": {
    slug: "stadium-plaza",
    code: "STD",
    i18n: {
      en: {
        title: "Stadium, plaza, and scenic spots",
        problem: "Crowds and open ground — see the edge of the venue, not just the bowl.",
        lead: "Stadiums, plazas, and scenic sites need wide coverage and a clean identification shot. We recommend multi-sensor PTZ units that watch approaches, parking, and the crowd edge.",
        capabilities: [
          "Approach and parking overwatch",
          "Crowd-edge and perimeter coverage",
          "Day/night PTZ for identification",
          "Fast quote for event and venue programs",
        ],
      },
      tr: {
        title: "Stadyum, meydan ve gezi alanları",
        problem: "Kalabalık ve açık zemin — sadece tribünü değil, mekanın kenarını görün.",
        lead: "Stadyum, meydan ve gezi alanı geniş kapsama ve net tanımlama ister. Yaklaşım, otopark ve kalabalık kenarını izleyen çoklu-sensör PTZ.",
        capabilities: [
          "Yaklaşım ve otopark üst gözetimi",
          "Kalabalık kenarı ve perimetre",
          "Tanımlama için gece/gündüz PTZ",
          "Etkinlik ve mekan programları için hızlı teklif",
        ],
      },
    },
  },
  "lake-river": {
    slug: "lake-river",
    code: "LKR",
    i18n: {
      en: {
        title: "Lake and river monitoring",
        problem: "Inland water — fisheries, bridges, and channels that need night and fog eyes.",
        lead: "Lakes and rivers hide small craft and bank activity. Thermal and maritime-capable cameras watch channels, bridges, and aquaculture so operators see a boat or a heat source without lighting the water.",
        capabilities: [
          "Channel and bank thermal coverage",
          "Bridge and collision-prevention watch",
          "Aquaculture and fishery overwatch",
          "Pair sensors with Circuitbull® live monitoring",
        ],
      },
      tr: {
        title: "Göl ve nehir izleme",
        problem: "İç su — balıkçılık, köprü ve kanallar için gece ve sis gözü.",
        lead: "Göl ve nehirde küçük tekne ve kıyı hareketi gizlenir. Kanal, köprü ve su ürünleri termal ile izlenir; suyu aydınlatmadan.",
        capabilities: [
          "Kanal ve kıyı termal kapsama",
          "Köprü ve çarpışma önleme izleme",
          "Su ürünleri ve balıkçılık üst gözetimi",
          "Circuitbull® canlı izleme ile eşleme",
        ],
      },
    },
  },
};

export function isCanonicalSlug(slug) {
  return SOLUTION_SLUGS.includes(String(slug || ""));
}

export function canonicalizeSlug(slug) {
  const s = String(slug || "").trim();
  if (isCanonicalSlug(s)) return s;
  return SOLUTION_REDIRECTS[s] || "";
}

export function normalizeAppLabel(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugsFromText(text) {
  const t = String(text || "");
  const found = [];
  for (const rule of RULES) {
    if (rule.re.test(t) && !found.includes(rule.slug)) found.push(rule.slug);
  }
  return found;
}

export function slugsFromApplications(list) {
  const out = [];
  for (const item of list || []) {
    for (const slug of slugsFromText(item)) {
      if (!out.includes(slug)) out.push(slug);
    }
  }
  return out;
}

export function productApplicationList(product) {
  const block = product?.i18n?.en || {};
  const ds = product?.datasheet || {};
  const lists = [block.applications, product.applications, ds.applications, ds.i18n?.en?.applications];
  const out = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const s = String(item || "").trim();
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}

export function matchSolutionSlug(label) {
  const hits = slugsFromText(label);
  if (hits.length === 1) return hits[0];
  const n = normalizeAppLabel(label);
  const exact = {
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
  return exact[n] || hits[0] || "";
}

export const solutionFilterKey = (slug, lang) => `solution:filter:${slug}:${lang || "en"}`;
export const solutionFilterIndexKey = (lang) => `solutions:filter:${lang || "en"}`;

export function needDocument(slug, extra = {}) {
  const def = SOLUTIONS[slug];
  if (!def) return null;
  return {
    slug,
    type: "need",
    solutionSlug: slug,
    code: def.code,
    i18n: def.i18n,
    catalog: true,
    ...extra,
    updatedAt: new Date(),
  };
}

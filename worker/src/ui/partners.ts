/** Authorized seller finder + apply form for /partners */

import { SELECTOR_COUNTRIES, contactPath, partnersPath } from "../i18n/locales";
import { pageCopy } from "../i18n/page-copy";
import { escapeHtml } from "./shell";

export type PartnerGeo = {
  lat: number;
  lng: number;
  formatted?: string;
  /** street | neighborhood | city_centroid | country_centroid */
  source?: string;
};

export type PartnerRecord = {
  _id?: string;
  name: string;
  role?: string;
  country?: string;
  countryName?: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    countryName?: string;
  } | null;
  geo?: PartnerGeo | null;
  activities?: string[];
  labels?: string[];
  status?: string;
};

/** EU-27 ISO codes — markets covered by Sweden authorized office when no local seller. */
export const EU_HUB_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

/**
 * African ISO codes for continent routing (no local Africa hub yet → HQ).
 * Local-language copy slots can key off continent "AF" later.
 */
export const AFRICA_COUNTRIES = new Set([
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CM",
  "CV",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
]);

export type ContinentCode = "AF" | "EU" | "AS" | "NA" | "SA" | "OC" | "ME" | null;

export function continentForCountry(country?: string | null): ContinentCode {
  const cc = String(country || "").trim().toUpperCase();
  if (!cc) return null;
  if (EU_HUB_COUNTRIES.has(cc) || cc === "GB" || cc === "CH" || cc === "NO" || cc === "IS" || cc === "XK" || cc === "BA" || cc === "RS" || cc === "ME" || cc === "AL" || cc === "MK" || cc === "MD" || cc === "UA" || cc === "BY") {
    return "EU";
  }
  if (AFRICA_COUNTRIES.has(cc)) return "AF";
  if (["US", "CA", "MX"].includes(cc)) return "NA";
  if (["BR", "AR", "CL", "CO", "PE", "VE", "UY", "PY", "BO", "EC", "GY", "SR"].includes(cc)) return "SA";
  if (["AU", "NZ", "FJ", "PG"].includes(cc)) return "OC";
  if (["SA", "AE", "QA", "KW", "BH", "OM", "YE", "JO", "LB", "SY", "IQ", "IR", "IL", "PS"].includes(cc)) return "ME";
  if (["TR", "CN", "TW", "HK", "KR", "JP", "IN", "PK", "BD", "ID", "MY", "SG", "TH", "VN", "PH", "RU"].includes(cc)) {
    return "AS";
  }
  return null;
}

export function isAppointedReseller(p: { role?: string; status?: string } | null | undefined) {
  if (!p) return false;
  if (p.role === "headquarters") return false;
  if (p.status === "pipeline") return false;
  return true;
}

export function isEuHubCountry(country?: string | null) {
  return EU_HUB_COUNTRIES.has(String(country || "").trim().toUpperCase());
}

export function isAfricaCountry(country?: string | null) {
  return AFRICA_COUNTRIES.has(String(country || "").trim().toUpperCase());
}

export function headquartersPartner(partners: PartnerRecord[]) {
  return (partners || []).find((p) => p.role === "headquarters") || null;
}

export function euHubPartner(partners: PartnerRecord[]) {
  return (
    (partners || []).find((p) => String(p.country || "").toUpperCase() === "SE" && isAppointedReseller(p)) || null
  );
}

export function partnerGeo(p: PartnerRecord | null | undefined): PartnerGeo | null {
  if (!p?.geo) return null;
  const lat = Number(p.geo.lat);
  const lng = Number(p.geo.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { ...p.geo, lat, lng };
}

/** Haversine distance in km. */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Nearest appointed office by GPS among partners with geo; HQ always included as candidate.
 * Returns sorted by distanceKm ascending.
 */
export function nearestPartnersByGeo(
  partners: PartnerRecord[],
  lat: number,
  lng: number
): { partner: PartnerRecord; distanceKm: number }[] {
  const origin = { lat, lng };
  const hq = headquartersPartner(partners);
  const candidates = [
    ...partners.filter((p) => isAppointedReseller(p) && partnerGeo(p)),
    ...(hq && partnerGeo(hq) ? [hq] : []),
  ];
  const seen = new Set<string>();
  const scored: { partner: PartnerRecord; distanceKm: number }[] = [];
  for (const p of candidates) {
    const id = p._id || `${p.name}:${p.country}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const g = partnerGeo(p);
    if (!g) continue;
    scored.push({ partner: p, distanceKm: Math.round(haversineKm(origin, g) * 10) / 10 });
  }
  return scored.sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Country/city filter: local appointed → EU SE hub → Africa HQ → Global HQ. */
export function partnersForMarket(
  partners: PartnerRecord[],
  country?: string,
  city?: string
): { partners: PartnerRecord[]; hqFallback: boolean; continent: ContinentCode; continentHub?: string | null } {
  const list = partners || [];
  const cc = String(country || "").trim().toUpperCase();
  const needle = String(city || "").trim().toLowerCase();
  const continent = continentForCountry(cc);
  if (!cc) return { partners: list, hqFallback: false, continent: null };

  const local = list.filter((p) => String(p.country || "").toUpperCase() === cc && isAppointedReseller(p));
  if (local.length) {
    if (!needle) return { partners: local, hqFallback: false, continent };
    const cityHits = local.filter((p) => String(p.city || p.address?.city || "").toLowerCase() === needle);
    return {
      partners: cityHits.length ? cityHits : local,
      hqFallback: false,
      continent,
    };
  }
  if (isEuHubCountry(cc) || continent === "EU") {
    const se = euHubPartner(list);
    if (se) return { partners: [se], hqFallback: false, continent: "EU", continentHub: "SE" };
  }
  // Africa: no appointed hub yet — structure returns continent AF + HQ for later local-language copy.
  const hq = headquartersPartner(list);
  return {
    partners: hq ? [hq] : [],
    hqFallback: Boolean(hq),
    continent,
    continentHub: continent === "AF" ? null : continent === "EU" ? "SE" : null,
  };
}

function roleLabel(role?: string) {
  if (role === "headquarters") return "Headquarters";
  if (role === "authorized_distributor") return "Authorized distributor";
  if (role === "authorized_sales") return "Authorized seller";
  return role || "Partner";
}

function addressLines(p: PartnerRecord) {
  const a = p.address || {};
  return [a.line1, a.line2, [a.district, a.city || p.city].filter(Boolean).join(", "), a.countryName || p.countryName]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

function partnerCard(p: PartnerRecord) {
  const city = p.city || p.address?.city || "";
  const lines = addressLines(p);
  const acts = (p.activities || []).filter(Boolean);
  const tel = p.phone ? `<p><a href="tel:${escapeHtml(p.phone.replace(/\s+/g, ""))}">${escapeHtml(p.phone)}</a></p>` : "";
  const mail = p.email ? `<p><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></p>` : "";
  const code = `${(p.country || "").toUpperCase()}${city ? ` · ${city}` : ""} · ${roleLabel(p.role)}`;
  return `<article class="partner-card" data-country="${escapeHtml((p.country || "").toUpperCase())}" data-city="${escapeHtml(city)}" data-role="${escapeHtml(p.role || "partner")}" data-status="${escapeHtml(p.status || "active")}">
    <p class="code" data-default-code="${escapeHtml(code)}">${escapeHtml(code)}</p>
    <h3>${escapeHtml(p.name)}</h3>
    ${lines.length ? `<address>${lines.map((l) => escapeHtml(l)).join("<br/>")}</address>` : ""}
    ${tel}${mail}
    ${acts.length ? `<p><strong>Main activities:</strong> ${escapeHtml(acts.join(", "))}</p>` : ""}
  </article>`;
}

export function partnersPageBody(opts: { partners: PartnerRecord[]; sent?: boolean; err?: boolean; lang?: string }) {
  const { partners, sent, err } = opts;
  const lang = opts.lang || "en";
  const t = pageCopy(lang).partners;
  const banner = sent
    ? `<div class="form-ok">${escapeHtml(t.sent)}</div>`
    : err
      ? `<div class="form-err">${escapeHtml(t.sendError)}</div>`
      : "";

  const countryOpts = [
    `<option value="">${escapeHtml(t.allCountries)}</option>`,
    ...SELECTOR_COUNTRIES.map(
      (c) => `<option value="${escapeHtml(c.code)}">${escapeHtml(c.label)}</option>`
    ),
  ].join("");

  const bootstrap = partners.map((p) => ({
    country: String(p.country || "").toUpperCase(),
    city: p.city || p.address?.city || "",
    role: p.role || "partner",
    status: p.status || "active",
    geo: p.geo && Number.isFinite(Number(p.geo.lat)) && Number.isFinite(Number(p.geo.lng))
      ? { lat: Number(p.geo.lat), lng: Number(p.geo.lng), source: p.geo.source || null }
      : null,
  }));

  return `
<section class="section section-flush" id="find">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(t.kicker)}</p>
      <h2>${escapeHtml(t.title)}</h2>
      <p>${escapeHtml(t.lead)}</p>
    </div>
    <div class="partner-filters" id="partner-filters">
      <label>${escapeHtml(t.country)}
        <select id="partner-country" aria-label="${escapeHtml(t.country)}">${countryOpts}</select>
      </label>
      <label>${escapeHtml(t.city)}
        <select id="partner-city" aria-label="${escapeHtml(t.city)}">
          <option value="">${escapeHtml(t.allCities)}</option>
        </select>
      </label>
    </div>
    <p class="form-note" id="partner-status" aria-live="polite"></p>
    <div class="partner-grid" id="partner-grid">
      ${partners.map(partnerCard).join("") || `<p class="partner-empty">${escapeHtml(t.empty)}</p>`}
    </div>
  </div>
</section>

<section class="section partner-apply" id="apply">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">${escapeHtml(t.applyKicker)}</p>
      <h2>${escapeHtml(t.applyTitle)}</h2>
      <p>${escapeHtml(t.applyLead)}</p>
    </div>
    ${banner}
    <form class="form-grid" method="post" action="/api/v1/leads" id="partner-apply-form" style="margin-top:1.25rem">
      <input type="hidden" name="source" value="authorized-seller"/>
      <input type="hidden" name="interest" value="authorized-seller"/>
      <div class="row2">
        <label>${escapeHtml(t.name)}<input name="name" required autocomplete="name"/></label>
        <label>${escapeHtml(t.email)}<input name="email" type="email" required autocomplete="email"/></label>
      </div>
      <div class="row2">
        <label>${escapeHtml(t.phone)}<input name="phone" autocomplete="tel"/></label>
        <label>${escapeHtml(t.company)}<input name="company" required autocomplete="organization"/></label>
      </div>
      <div class="row2">
        <label>${escapeHtml(t.country)} *
          <select name="country" id="apply-country" required>
            <option value="">${escapeHtml(t.allCountries)}</option>
            ${SELECTOR_COUNTRIES.map((c) => `<option value="${escapeHtml(c.code)}">${escapeHtml(c.label)}</option>`).join("")}
          </select>
        </label>
        <label>${escapeHtml(t.city)}<input name="city" autocomplete="address-level2"/></label>
      </div>
      <fieldset class="form-bool">
        <legend>${escapeHtml(t.inSector)}</legend>
        <div class="form-bool-opts">
          <label><input type="radio" name="inSector" value="yes" required/> ${escapeHtml(t.qualifyYes)}</label>
          <label><input type="radio" name="inSector" value="no"/> ${escapeHtml(t.qualifyNo)}</label>
        </div>
      </fieldset>
      <fieldset class="form-bool">
        <legend>${escapeHtml(t.hasCompany)}</legend>
        <div class="form-bool-opts">
          <label><input type="radio" name="hasCompany" value="yes" required/> ${escapeHtml(t.qualifyYes)}</label>
          <label><input type="radio" name="hasCompany" value="no"/> ${escapeHtml(t.qualifyNo)}</label>
        </div>
      </fieldset>
      <label>${escapeHtml(t.coverage)}
        <textarea name="message" rows="6" required></textarea>
      </label>
      <div class="cta-row">
        <button class="btn btn-primary" type="submit">${escapeHtml(t.submit)}</button>
        <a class="btn btn-ghost" href="${contactPath(lang)}">${escapeHtml(t.contactHq)}</a>
      </div>
      <p class="form-note">Volls Global Inc · Wilmington, DE · Circuitbull®</p>
    </form>
  </div>
</section>
<script type="application/json" id="partner-bootstrap">${JSON.stringify(bootstrap).replace(/</g, "\\u003c")}</script>
<script>
(function(){
  var grid=document.getElementById('partner-grid');
  var ccSel=document.getElementById('partner-country');
  var citySel=document.getElementById('partner-city');
  var status=document.getElementById('partner-status');
  var bootEl=document.getElementById('partner-bootstrap');
  var meta=[];
  try { meta=JSON.parse(bootEl&&bootEl.textContent||'[]'); } catch(e){}
  var cards=grid?Array.prototype.slice.call(grid.querySelectorAll('.partner-card')):[];

  var EU_HUB={AT:1,BE:1,BG:1,HR:1,CY:1,CZ:1,DK:1,EE:1,FI:1,FR:1,DE:1,GR:1,HU:1,IE:1,IT:1,LV:1,LT:1,LU:1,MT:1,NL:1,PL:1,PT:1,RO:1,SK:1,SI:1,ES:1,SE:1};
  function isAppointed(p){
    if(!p) return false;
    if(p.role==='headquarters') return false;
    if(p.status==='pipeline') return false;
    return true;
  }
  function citiesFor(cc){
    var set={};
    meta.forEach(function(p){
      if(!p.city) return;
      if(!isAppointed(p)) return;
      if(cc && p.country!==cc) return;
      set[p.city]=1;
    });
    return Object.keys(set).sort();
  }
  function fillCities(){
    var cc=(ccSel&&ccSel.value||'').toUpperCase();
    var current=citySel?citySel.value:'';
    var list=citiesFor(cc);
    if(!citySel) return;
    citySel.innerHTML='<option value="">${escapeHtml(t.allCities)}</option>'+list.map(function(c){
      return '<option value="'+c.replace(/"/g,'&quot;')+'"'+(c===current?' selected':'')+'>'+c+'</option>';
    }).join('');
  }
  function apply(){
    var cc=(ccSel&&ccSel.value||'').toUpperCase();
    var city=citySel?citySel.value:'';
    var hq=null;
    var seHub=null;
    var appointedInCountry=0;
    cards.forEach(function(card){
      if(card.getAttribute('data-role')==='headquarters') hq=card;
      if(isAppointed({role:card.getAttribute('data-role'),status:card.getAttribute('data-status')}) && (card.getAttribute('data-country')||'')==='SE') seHub=card;
      if(cc && isAppointed({role:card.getAttribute('data-role'),status:card.getAttribute('data-status')}) && (card.getAttribute('data-country')||'')===cc) appointedInCountry++;
    });
    var euHubFallback=Boolean(cc && appointedInCountry===0 && EU_HUB[cc] && seHub);
    var hqFallback=Boolean(cc && appointedInCountry===0 && !euHubFallback && hq);
    var n=0;
    cards.forEach(function(card){
      var codeEl=card.querySelector('.code');
      var def=codeEl && codeEl.getAttribute('data-default-code');
      if(codeEl && def) codeEl.textContent=def;
      card.classList.remove('is-hq-fallback');
      var ok=true;
      if(euHubFallback){
        ok=card===seHub;
        if(ok && codeEl && cc!=='SE') codeEl.textContent='EU office · Malmö, Sweden';
        if(ok) card.classList.add('is-hq-fallback');
      } else if(hqFallback){
        ok=card===hq;
        if(ok && codeEl && cc!=='US') codeEl.textContent='Global HQ · default';
        if(ok) card.classList.add('is-hq-fallback');
      } else if(cc || city){
        if(cc && (card.getAttribute('data-country')||'')!==cc) ok=false;
        if(cc && !isAppointed({role:card.getAttribute('data-role'),status:card.getAttribute('data-status')})) ok=false;
        if(city && (card.getAttribute('data-city')||'')!==city) ok=false;
      }
      card.hidden=!ok;
      if(ok) n++;
    });
    if(status){
      if(euHubFallback) status.textContent=cc==='SE'?(${JSON.stringify(t.locations)}.replace('{n}', String(n))):'EU authorized office — Malmö, Sweden.';
      else if(hqFallback) status.textContent=cc==='US'?${JSON.stringify(t.hqUs)}:${JSON.stringify(t.hqFallback)};
      else if(!cc && !city) status.textContent=${JSON.stringify(t.locations)}.replace('{n}', String(n));
      else status.textContent=n?(${JSON.stringify(t.locations)}.replace('{n}', String(n))):${JSON.stringify(t.noneCity)};
    }
  }
  if(ccSel) ccSel.addEventListener('change', function(){ fillCities(); apply(); });
  if(citySel) citySel.addEventListener('change', apply);
  fillCities();
  var params=new URLSearchParams(location.search);
  var qcc=(params.get('country')||'').toUpperCase();
  if(qcc && ccSel){ ccSel.value=qcc; fillCities(); }
  var qcity=params.get('city')||'';
  if(qcity && citySel) citySel.value=qcity;
  apply();

  var form=document.getElementById('partner-apply-form');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var btn=form.querySelector('button[type=submit]');
    if(btn){ btn.disabled=true; btn.textContent=${JSON.stringify(t.sending)}; }
    try {
      var fd=new FormData(form);
      var res=await fetch('/api/v1/leads', { method:'POST', body: fd });
      var data=await res.json();
      if(!res.ok) throw new Error(data.error||'failed');
      location.href=${JSON.stringify(partnersPath(lang)+"?sent=1#apply")};
    } catch (err) {
      location.href=${JSON.stringify(partnersPath(lang)+"?error=1#apply")};
    }
  });
})();
</script>`;
}

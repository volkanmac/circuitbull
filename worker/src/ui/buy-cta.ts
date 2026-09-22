/** Product Buy CTA — country → WhatsApp ping → authorized sellers (HQ fallback). */

import { COUNTRY_DIAL } from "../buy/whatsapp";
import { SELECTOR_COUNTRIES } from "../i18n/locales";
import type { PartnerRecord } from "./partners";
import { euHubPartner, isEuHubCountry } from "./partners";
import { escapeHtml } from "./shell";

export const GLOBAL_HQ = {
  name: "Volls Global Inc",
  role: "headquarters",
  country: "US",
  countryName: "United States",
  city: "Wilmington",
  phone: "+12766002052",
  email: "info@circuitbull.com",
  status: "active",
  lines: ["1207 Delaware Ave #5352", "Wilmington, DE 19806", "United States of America"],
  geo: {
    lat: 39.7537808,
    lng: -75.5574801,
    formatted: "1207 Delaware Ave, Wilmington, DE 19806, USA",
    source: "street",
  },
};

export type BuyPartner = {
  name: string;
  role: string;
  country: string;
  countryName: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  lines: string[];
};

function compactPartner(p: PartnerRecord): BuyPartner {
  const a = p.address || {};
  const city = String(a.city || p.city || "").trim();
  const region = [city, [a.state, a.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const lines = [a.line1, a.line2, a.district && a.district !== city ? a.district : "", region, a.countryName || p.countryName]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  const uniq: string[] = [];
  for (const l of lines) {
    if (!uniq.includes(l)) uniq.push(l);
  }
  return {
    name: p.name,
    role: p.role || "partner",
    country: String(p.country || "").toUpperCase(),
    countryName: p.countryName || a.countryName || "",
    city,
    phone: p.phone || "",
    email: p.email || "",
    status: p.status || "active",
    lines: uniq,
  };
}

export function buyPartnersPayload(partners: PartnerRecord[]): BuyPartner[] {
  const out = (partners || []).map(compactPartner).filter((p) => p.name && p.country);
  if (!out.some((p) => p.role === "headquarters")) out.unshift({ ...GLOBAL_HQ });
  return out;
}

export function buyChannelForCountry(
  partners: PartnerRecord[],
  country: string
): { seller: BuyPartner; hqFallback: boolean } {
  const cc = String(country || "").toUpperCase();
  const list = buyPartnersPayload(partners);
  const local = list.filter((p) => p.country === cc && p.role !== "headquarters" && p.status !== "pipeline");
  if (local.length) return { seller: local[0], hqFallback: false };
  if (isEuHubCountry(cc)) {
    const se = euHubPartner(partners);
    if (se) return { seller: compactPartner(se), hqFallback: false };
  }
  const hq = list.find((p) => p.role === "headquarters") || GLOBAL_HQ;
  return { seller: hq, hqFallback: true };
}

export function buyCtaMarkup(opts: {
  partners: PartnerRecord[];
  countryHint?: string;
  quoteHref: string;
  sku: string;
  productName: string;
  path?: string;
  image?: string;
}) {
  const hint = String(opts.countryHint || "").toUpperCase();
  const countries = SELECTOR_COUNTRIES.map(
    (c) =>
      `<option value="${escapeHtml(c.code)}"${c.code === hint ? " selected" : ""}>${escapeHtml(c.label)}</option>`
  ).join("");
  const payload = {
    hq: GLOBAL_HQ,
    partners: buyPartnersPayload(opts.partners),
    quoteHref: opts.quoteHref,
    sku: opts.sku,
    productName: opts.productName,
    path: opts.path || "",
    image: opts.image || "",
    dials: COUNTRY_DIAL,
  };
  const hasImg = Boolean(opts.image);
  const productStrip = `
    <aside class="buy-product" id="buy-product"${opts.sku || opts.productName ? "" : " hidden"}>
      ${hasImg ? `<img id="buy-product-img" src="${escapeHtml(opts.image || "")}" alt="" width="72" height="72"/>` : `<span class="buy-product-ph" id="buy-product-ph" aria-hidden="true"></span>`}
      <div class="buy-product-copy">
        <p class="buy-product-sku" id="buy-product-sku">${escapeHtml(opts.sku || "")}</p>
        <p class="buy-product-name" id="buy-product-name">${escapeHtml(opts.productName || "")}</p>
        ${opts.path ? `<a class="buy-product-link" id="buy-product-link" href="${escapeHtml(opts.path)}">View product</a>` : `<a class="buy-product-link" id="buy-product-link" hidden href="#">View product</a>`}
      </div>
    </aside>`;

  return `
<div class="buy-root" id="buy-root" hidden>
  <button type="button" class="buy-backdrop" data-buy-close tabindex="-1" aria-label="Close"></button>
  <div class="buy-dialog" role="dialog" aria-modal="true" aria-labelledby="buy-title">
    <div class="buy-head">
      <div>
        <p class="buy-kicker" id="buy-kicker">Buy · ${escapeHtml(opts.sku)}</p>
        <h4 id="buy-title">Authorized seller</h4>
      </div>
      <button type="button" class="buy-close" data-buy-close aria-label="Close">×</button>
    </div>
    ${productStrip}
    <label class="buy-country-label" for="buy-country">
      <span>Your country</span>
      <select id="buy-country" autocomplete="country">
        <option value="">Select country</option>
        ${countries}
      </select>
    </label>
    <form class="buy-wa" id="buy-wa" hidden>
      <label class="buy-country-label" for="buy-wa-input">
        <span>WhatsApp</span>
      </label>
      <div class="buy-wa-row">
        <span class="buy-wa-dial" id="buy-wa-dial" aria-hidden="true">+</span>
        <input id="buy-wa-input" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="mobile number" />
        <button type="submit" class="btn btn-primary" id="buy-wa-send">Ping me</button>
      </div>
      <p class="buy-wa-hint" id="buy-wa-hint">Leave the number — the Circuitbull agent messages you immediately.</p>
    </form>
    <p class="buy-status" id="buy-status" aria-live="polite">Select a country to list the appointed seller.</p>
    <div class="buy-list" id="buy-list"></div>
  </div>
</div>
<script type="application/json" id="buy-bootstrap">${JSON.stringify(payload).replace(/</g, "\\u003c")}</script>
<script>
(function(){
  var root=document.getElementById('buy-root');
  if(!root) return;
  var sel=document.getElementById('buy-country');
  var list=document.getElementById('buy-list');
  var status=document.getElementById('buy-status');
  var boot={hq:null,partners:[],quoteHref:'/contact',sku:'',productName:'',path:'',image:'',dials:{}};
  try { boot=JSON.parse((document.getElementById('buy-bootstrap')||{}).textContent||'{}'); } catch(e){}
  var hq=boot.hq||{};
  var partners=boot.partners||[];
  var dials=boot.dials||{};
  var waWrap=document.getElementById('buy-wa');
  var waInput=document.getElementById('buy-wa-input');
  var waDial=document.getElementById('buy-wa-dial');
  var waBtn=document.getElementById('buy-wa-send');
  var waHint=document.getElementById('buy-wa-hint');
  var productEl=document.getElementById('buy-product');
  var productImg=document.getElementById('buy-product-img');
  var productPh=document.getElementById('buy-product-ph');
  var productSku=document.getElementById('buy-product-sku');
  var productNameEl=document.getElementById('buy-product-name');
  var productLink=document.getElementById('buy-product-link');
  var kicker=document.getElementById('buy-kicker');
  var lastFocus=null;
  var pinging=false;
  var pinged='';
  var lastCountry='';

  var EU_HUB={AT:1,BE:1,BG:1,HR:1,CY:1,CZ:1,DK:1,EE:1,FI:1,FR:1,DE:1,GR:1,HU:1,IE:1,IT:1,LV:1,LT:1,LU:1,MT:1,NL:1,PL:1,PT:1,RO:1,SK:1,SI:1,ES:1,SE:1};
  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function roleLabel(role){
    if(role==='headquarters') return 'Headquarters';
    if(role==='authorized_distributor') return 'Authorized distributor';
    if(role==='authorized_sales') return 'Authorized seller';
    return 'Authorized seller';
  }
  function isAppointed(p){
    if(!p) return false;
    if(p.role==='headquarters') return false;
    if(p.status==='pipeline') return false;
    return true;
  }
  function applyProduct(ctx){
    if(!ctx) return;
    if(ctx.sku!=null) boot.sku=String(ctx.sku||'');
    if(ctx.productName!=null) boot.productName=String(ctx.productName||'');
    if(ctx.path!=null) boot.path=String(ctx.path||'');
    if(ctx.image!=null) boot.image=String(ctx.image||'');
    if(ctx.quoteHref) boot.quoteHref=String(ctx.quoteHref);
    syncProduct();
  }
  function syncProduct(){
    var sku=boot.sku||'';
    var name=boot.productName||'';
    var path=boot.path||'';
    var image=boot.image||'';
    if(kicker) kicker.textContent=sku?('Buy · '+sku):'Buy';
    if(productSku) productSku.textContent=sku;
    if(productNameEl) productNameEl.textContent=name||sku||'Selected platform';
    if(productLink){
      if(path){ productLink.href=path; productLink.hidden=false; }
      else { productLink.hidden=true; }
    }
    if(productImg){
      if(image){ productImg.src=image; productImg.hidden=false; }
      else { productImg.removeAttribute('src'); productImg.hidden=true; }
    }
    if(productPh) productPh.hidden=!!image;
    if(productEl) productEl.hidden=!(sku||name||path||image);
  }
  function quoteUrl(cc){
    var u=boot.quoteHref||'/contact';
    try {
      var abs=/^https?:/i.test(u);
      var parsed=abs?new URL(u):new URL(u, location.origin);
      if(boot.sku) parsed.searchParams.set('sku', boot.sku);
      if(boot.path){
        var slug=(boot.path||'').replace(/\\/$/,'').split('/').pop();
        if(slug) parsed.searchParams.set('product', slug);
      }
      if(boot.productName) parsed.searchParams.set('productName', boot.productName);
      if(cc) parsed.searchParams.set('country', cc);
      return abs?parsed.toString():(parsed.pathname+parsed.search);
    } catch(e){
      if(!cc) return u;
      return u+(u.indexOf('?')>=0?'&':'?')+'country='+encodeURIComponent(cc);
    }
  }
  function cardHtml(p, badge){
    var tel=p.phone?('<a class="btn btn-ghost" href="tel:'+esc(String(p.phone).replace(/\\s+/g,''))+'">Call</a>'):'';
    var mail=p.email?('<a class="btn btn-ghost" href="mailto:'+esc(p.email)+'">Email</a>'):'';
    var lines=(p.lines||[]).map(function(l){ return esc(l); }).join('<br/>');
    return '<article class="buy-card">'+
      '<p class="code">'+esc(badge||roleLabel(p.role))+'</p>'+
      '<h3>'+esc(p.name)+'</h3>'+
      (lines?('<address>'+lines+'</address>'):'')+
      (p.phone?('<p><a href="tel:'+esc(String(p.phone).replace(/\\s+/g,''))+'">'+esc(p.phone)+'</a></p>'):'')+
      (p.email?('<p><a href="mailto:'+esc(p.email)+'">'+esc(p.email)+'</a></p>'):'')+
      '<div class="cta-row buy-card-actions">'+
        tel+mail+
        '<a class="btn btn-primary" href="'+esc(quoteUrl(p.country||''))+'">Request quote</a>'+
      '</div></article>';
  }
  function showWa(on){
    if(!waWrap) return;
    if(on){ waWrap.hidden=false; waWrap.classList.add('is-on'); }
    else { waWrap.hidden=true; waWrap.classList.remove('is-on'); }
  }
  function syncWa(focusInput){
    var cc=((sel&&sel.value)||'').toUpperCase();
    if(!cc){
      showWa(false);
      return;
    }
    showWa(true);
    var d=dials[cc]||'';
    if(waDial) waDial.textContent=d?('+'+d):'+';
    if(cc!==lastCountry){
      lastCountry=cc;
      pinged='';
      pinging=false;
      if(waInput) waInput.dataset.sent='';
      if(waBtn){ waBtn.disabled=false; waBtn.textContent='Ping me'; }
      if(waHint) waHint.textContent='Leave the number — the Circuitbull agent messages you immediately.';
    }
    if(focusInput && waInput){
      try { waInput.focus(); waInput.select && waInput.select(); } catch(e){}
    }
  }
  function pingNow(){
    var cc=((sel&&sel.value)||'').toUpperCase();
    var raw=waInput?String(waInput.value||''):'';
    var digits=raw.replace(/\\D/g,'');
    if(!cc || !digits || pinging) return;
    if(pinged && lastCountry===cc && String(waInput&&waInput.dataset.sent||'')===digits) return;
    pinging=true;
    if(waBtn){ waBtn.disabled=true; waBtn.textContent='Sending…'; }
    if(waHint) waHint.textContent='Agent is messaging you…';
    fetch('/api/v1/buy/whatsapp',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        country:cc,
        whatsapp:raw,
        sku:boot.sku||'',
        productName:boot.productName||'',
        path:boot.path||'',
        image:boot.image||''
      }),
      keepalive:true
    }).then(function(r){
      return r.json().then(function(j){ return {ok:r.ok,j:j||{}}; }).catch(function(){ return {ok:r.ok,j:{}}; });
    }).then(function(res){
      pinging=false;
      if(!res.ok){
        if(waBtn){ waBtn.disabled=false; waBtn.textContent='Ping me'; }
        if(waHint) waHint.textContent=res.j.error==='invalid_whatsapp'?'Need a full WhatsApp mobile number.':'Could not send — try again.';
        return;
      }
      pinged=res.j.e164||raw;
      if(waInput) waInput.dataset.sent=digits;
      if(waBtn){ waBtn.disabled=true; waBtn.textContent='Pinged'; }
      if(waHint) waHint.textContent='Agent messaged +'+pinged+'. Seller below.';
    }).catch(function(){
      pinging=false;
      if(waBtn){ waBtn.disabled=false; waBtn.textContent='Ping me'; }
      if(waHint) waHint.textContent='Could not send — try again.';
    });
  }
  function render(opts){
    opts=opts||{};
    var cc=((sel&&sel.value)||'').toUpperCase();
    syncWa(!!opts.focusWa);
    if(!cc){
      if(list) list.innerHTML='';
      if(status) status.textContent='Select a country — we ask for WhatsApp next.';
      return;
    }
    var local=partners.filter(function(p){ return p.country===cc && isAppointed(p); });
    var hqCard=partners.filter(function(p){ return p.role==='headquarters'; })[0]||hq;
    var seCard=partners.filter(function(p){ return p.country==='SE' && isAppointed(p); })[0];
    if(local.length){
      if(status) status.textContent=local.length+' authorized seller'+(local.length===1?'':'s')+' in this market.';
      if(list) list.innerHTML=local.map(function(p){ return cardHtml(p); }).join('');
      return;
    }
    if(EU_HUB[cc] && seCard){
      if(status) status.textContent=cc==='SE'?'Authorized distributor — Malmö, Sweden.':'EU authorized office — Malmö, Sweden.';
      if(list) list.innerHTML=cardHtml(seCard, cc==='SE'?'Authorized distributor':'EU office · Malmö');
      return;
    }
    var us=cc==='US';
    if(status) status.textContent=us?'Circuitbull® Headquarters — Wilmington, DE.':'No appointed seller in this country — Circuitbull® HQ.';
    if(list) list.innerHTML=cardHtml(hqCard, us?'Headquarters':'Global HQ · default');
  }
  function openBuy(ctx){
    if(ctx) applyProduct(ctx);
    else syncProduct();
    lastFocus=document.activeElement;
    root.hidden=false;
    document.documentElement.classList.add('buy-open');
    if(sel && sel.value){ render({focusWa:true}); }
    else if(sel){ sel.focus(); render(); }
    else render();
  }
  function closeBuy(){
    if(root.hidden) return;
    root.hidden=true;
    document.documentElement.classList.remove('buy-open');
    if(lastFocus&&lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} }
  }
  function ctxFromEl(el){
    if(!el||!el.getAttribute) return null;
    var sku=el.getAttribute('data-sku')||el.getAttribute('data-buy-sku');
    var productName=el.getAttribute('data-product-name')||el.getAttribute('data-buy-name');
    var path=el.getAttribute('data-product-path')||el.getAttribute('data-buy-path');
    var image=el.getAttribute('data-product-image')||el.getAttribute('data-buy-image');
    if(!sku&&!productName&&!path&&!image) return null;
    return {sku:sku||'',productName:productName||'',path:path||'',image:image||''};
  }
  document.addEventListener('click', function(e){
    var t=e.target;
    if(!t||!t.closest) return;
    if(t.closest('[data-buy-close]')){ e.preventDefault(); closeBuy(); return; }
    var openEl=t.closest('[data-open-buy]');
    if(openEl){ e.preventDefault(); openBuy(ctxFromEl(openEl)); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'&&!root.hidden){ e.preventDefault(); closeBuy(); }
  });
  if(sel) sel.addEventListener('change', function(){ render({focusWa:true}); });
  if(waWrap) waWrap.addEventListener('submit', function(e){ e.preventDefault(); pingNow(); });
  if(waInput){
    waInput.addEventListener('blur', function(){ if(String(waInput.value||'').trim()) pingNow(); });
    waInput.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); pingNow(); } });
  }
  window.__cbOpenBuy=openBuy;
  syncProduct();
  if(sel&&sel.value) render();
})();
</script>`;
}

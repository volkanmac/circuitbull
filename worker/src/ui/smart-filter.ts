/** Spotify / macOS Spotlight–style popover smart filter for Products catalog */

import { escapeHtml } from "./shell";

export type FacetValue = { value: string; count: number };
export type FacetProperty = {
  propertyId?: string;
  propertyKey: string;
  label: string;
  count: number;
  values: FacetValue[];
  numeric?: { min: number; max: number; unit: string; count: number } | null;
};
export type FacetGroup = {
  groupId?: string;
  groupKey: string;
  label: string;
  count: number;
  properties: FacetProperty[];
  topValues: FacetValue[];
};
export type FacetIndex = {
  lang: string;
  factCount: number;
  groups: FacetGroup[];
};

export type CatalogCard = {
  slug: string;
  smartId: string;
  sku?: string;
  name: string;
  summary: string;
  image: string;
  path: string;
  /** Pipe-separated category keys for the products flying dock. */
  cats?: string;
  /** Pipe-separated solution slugs for the products flying dock. */
  needs?: string;
  /** Pipe-separated application / use-area labels for product peek. */
  apps?: string;
  /** Pipe-separated need/area titles for product peek. */
  areas?: string;
  /** Lowercase search blob for the products flying dock. */
  q?: string;
};

function titleCaseKey(key: string) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function cardSku(p: CatalogCard) {
  return p.sku || p.smartId || "SKU";
}

function peekImgAttrs(p: CatalogCard) {
  if (!p.image) return "";
  return (
    `src="${escapeHtml(p.image)}" data-full="${escapeHtml(p.image)}" data-lightbox data-product-peek ` +
    `data-sku="${escapeHtml(cardSku(p))}" data-product-name="${escapeHtml(p.name)}" ` +
    `data-summary="${escapeHtml((p.summary || "").slice(0, 220))}" data-product-path="${escapeHtml(p.path)}" ` +
    `data-apps="${escapeHtml(p.apps || "")}" data-areas="${escapeHtml(p.areas || "")}" ` +
    `alt="${escapeHtml(p.name)}" loading="lazy"`
  );
}

/** Render ontology-driven Spotify-style filter + product grid */
export type FilterCopy = {
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

export function smartFilterMarkup(
  facets: FacetIndex,
  cards: CatalogCard[],
  lang: string,
  opts?: { lazyNeed?: string; lazyFacets?: boolean; copy?: FilterCopy }
) {
  const groups = facets.groups || [];
  const lazyNeed = opts?.lazyNeed || "";
  const lazyFacets = Boolean(opts?.lazyFacets || lazyNeed);
  const copy = opts?.copy || {};
  const kicker = copy.kicker || "Catalog filter";
  const title = copy.title || "Find the right sensor";
  const sub = copy.sub || "Filter by range, rating, housing, and SKU";
  const placeholder = copy.placeholder || "Search specs, range, SKU…";
  const listTitle = copy.listTitle || "All platforms";
  const chips = Array.isArray(copy.chips) ? copy.chips.filter(Boolean).slice(0, 6) : [];
  const chipHtml = chips
    .map(
      (chip) =>
        `<button type="button" class="sf-hint" data-action="hint" data-q="${escapeHtml(chip)}">${escapeHtml(chip)}</button>`
    )
    .join("");
  const rows = lazyFacets
    ? `<p class="sf-empty">Open filters to refine by range and rating</p>`
    : groups
        .map(
          (g) => `<button type="button" class="sf-row" data-action="open-group" data-group="${escapeHtml(g.groupKey)}" data-label="${escapeHtml(g.label)}" role="listitem" aria-pressed="false">
      <span class="sf-group-name">${escapeHtml(g.label || titleCaseKey(g.groupKey))}</span>
      <span class="sf-group-meta">${g.count}</span>
      <span class="sf-chev" aria-hidden="true">›</span>
    </button>`
        )
        .join("");

  const cardHtml = cards
    .map(
      (p) => `<a class="product" href="${escapeHtml(p.path)}" data-slug="${escapeHtml(p.slug)}" data-cats="${escapeHtml(p.cats || "")}" data-needs="${escapeHtml(p.needs || "")}" data-q="${escapeHtml(p.q || "")}">
      <div class="media">${p.image ? `<img ${peekImgAttrs(p)}/>` : ""}</div>
      <div class="body">
        <div class="model">${escapeHtml(cardSku(p))}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml((p.summary || "").slice(0, 140))}</p>
      </div>
    </a>`
    )
    .join("");

  const bootstrap = { lang, facets, catalog: cards, lazyNeed, lazyFacets, copy };

  return `
<aside class="smart-filter is-collapsed" id="smart-filter" aria-label="Smart product filter">
  <div class="smart-filter-head">
    <div>
      <p class="kicker">${escapeHtml(kicker)}</p>
      <h3 id="product-list-title">${escapeHtml(listTitle)}</h3>
      <p class="sf-sub" id="product-list-count">${cards.length} platform${cards.length === 1 ? "" : "s"}</p>
    </div>
    <div class="sf-actions">
      <button type="button" class="btn btn-ghost sf-toggle" id="sf-toggle" aria-expanded="false" aria-controls="sf-fold-body">Show filters</button>
      <button type="button" class="btn btn-ghost sf-clear" data-action="clear" hidden>Clear</button>
      <span class="sf-status" id="sf-status" aria-live="polite"></span>
    </div>
  </div>
  <div class="sf-fold-body" id="sf-fold-body" hidden>
  <p class="sf-fold-lead">${escapeHtml(title)} — ${escapeHtml(sub)}</p>
  ${copy.recommend ? `<p class="sf-recommend">${escapeHtml(copy.recommend)}</p>` : ""}
  <div class="sf-spotify" id="sf-spotify">
    <label class="sf-search-wrap" for="sf-q">
      <span class="sf-search-icon" aria-hidden="true">⌕</span>
      <input type="search" id="sf-q" class="sf-search" placeholder="${escapeHtml(placeholder)}" autocomplete="off" enterkeyhint="search" />
      <button type="button" class="sf-search-clear" id="sf-q-clear" hidden aria-label="Clear search">×</button>
    </label>
    <div class="sf-live" id="sf-live" hidden>
      <p class="sf-live-label" id="sf-live-label"></p>
      <div class="sf-live-list" id="sf-live-list" role="listbox"></div>
    </div>
  </div>

  ${chipHtml ? `<div class="sf-hints" aria-label="Suggested filters">${chipHtml}</div>` : ""}
  <div class="sf-rows" role="list">${rows || `<p class="sf-empty">Loading filters…</p>`}</div>
  </div>
</aside>

<div class="sf-popover-root" id="sf-popover-root" hidden>
  <div class="sf-popover-backdrop" data-action="close-pop" tabindex="-1"></div>
  <div class="sf-popover" id="sf-popover" role="dialog" aria-modal="true" aria-labelledby="sf-pop-title">
    <div class="sf-pop-head">
      <div>
        <p class="sf-pop-kicker" id="sf-pop-kicker">Filter</p>
        <h4 id="sf-pop-title">Filter</h4>
      </div>
      <button type="button" class="sf-pop-close" data-action="close-pop" aria-label="Close">×</button>
    </div>
    <div class="sf-pop-body" id="sf-pop-body"></div>
    <div class="sf-pop-results">
      <p class="sf-live-label" id="sf-pop-result-label">Matching platforms</p>
      <div class="sf-live-list" id="sf-pop-result-list"></div>
    </div>
  </div>
</div>

<div class="sf-result-bar" id="sf-result-bar" hidden>
  <p id="sf-result-label"></p>
</div>
<div class="product-grid" id="product-grid">${cardHtml}</div>
<script type="application/json" id="sf-bootstrap">${JSON.stringify(bootstrap).replace(/</g, "\\u003c")}</script>
${smartFilterScript()}`;
}

function smartFilterScript() {
  return `<script>
(function(){
  var bootEl=document.getElementById('sf-bootstrap');
  if(!bootEl) return;
  var boot;
  try { boot=JSON.parse(bootEl.textContent||'{}'); } catch(e){ return; }
  var lang=boot.lang||'en';
  var catalog=boot.catalog||[];
  var facets=boot.facets||{groups:[]};
  var bySlug={}; catalog.forEach(function(p){ bySlug[p.slug]=p; });
  var byGroup={}; (facets.groups||[]).forEach(function(g){ byGroup[g.groupKey]=g; });
  var lazyNeed=boot.lazyNeed||'';
  var lazyFacets=!!boot.lazyFacets || !!lazyNeed;
  var copy=boot.copy||{};
  var listTitleDefault=copy.listTitle||'All platforms';
  var facetPriority=copy.facetPriority||[];
  var facetsReady=!lazyFacets;

  var filter=document.getElementById('smart-filter');
  var foldBody=document.getElementById('sf-fold-body');
  var toggleBtn=document.getElementById('sf-toggle');
  var grid=document.getElementById('product-grid');
  var status=document.getElementById('sf-status');
  var resultBar=document.getElementById('sf-result-bar');
  var resultLabel=document.getElementById('sf-result-label');
  var clearBtn=filter&&filter.querySelector('[data-action="clear"]');
  var qInput=document.getElementById('sf-q');
  var qClear=document.getElementById('sf-q-clear');
  var live=document.getElementById('sf-live');
  var liveLabel=document.getElementById('sf-live-label');
  var liveList=document.getElementById('sf-live-list');
  var popRoot=document.getElementById('sf-popover-root');
  var popBody=document.getElementById('sf-pop-body');
  var popTitle=document.getElementById('sf-pop-title');
  var popKicker=document.getElementById('sf-pop-kicker');
  var popResLabel=document.getElementById('sf-pop-result-label');
  var popResList=document.getElementById('sf-pop-result-list');

  var state={ group:'', property:'', value:'', q:'', min:null, max:null, active:false };
  var timer=null;
  var openGroupKey='';

  function setStatus(t){ if(status) status.textContent=t||''; }
  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function skuOf(p){ return p.sku||p.smartId||'SKU'; }
  function peekAttrs(p){
    var src=bySlug[p.slug]||p;
    if(!p.image) return '';
    return 'src="'+esc(p.image)+'" data-full="'+esc(p.image)+'" data-lightbox data-product-peek '+
      'data-sku="'+esc(skuOf(p))+'" data-product-name="'+esc(p.name)+'" '+
      'data-summary="'+esc((p.summary||'').slice(0,220))+'" data-product-path="'+esc(p.path)+'" '+
      'data-apps="'+esc(src.apps||p.apps||'')+'" data-areas="'+esc(src.areas||p.areas||'')+'" '+
      'alt="'+esc(p.name)+'" loading="lazy"';
  }

  function cardHtml(p){
    var src=bySlug[p.slug]||p;
    return '<a class="product" href="'+esc(p.path)+'" data-slug="'+esc(p.slug)+'" data-cats="'+esc(src.cats||'')+'" data-needs="'+esc(src.needs||'')+'" data-q="'+esc(src.q||'')+'">'+
      '<div class="media">'+(p.image?'<img '+peekAttrs(p)+'/>':'')+'</div>'+
      '<div class="body"><div class="model">'+esc(skuOf(p))+'</div>'+
      '<h3>'+esc(p.name)+'</h3><p>'+esc((p.summary||'').slice(0,140))+'</p></div></a>';
  }

  function liveItemHtml(p){
    return '<a class="sf-hit" href="'+esc(p.path)+'" role="option">'+
      (p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy"/>':'<span class="sf-hit-ph"></span>')+
      '<span class="sf-hit-body"><span class="sf-hit-sku">'+esc(skuOf(p))+'</span>'+
      '<span class="sf-hit-name">'+esc(p.name)+'</span></span></a>';
  }

  function setListFold(open, count, title){
    var countEl=document.getElementById('product-list-count');
    var titleEl=document.getElementById('product-list-title');
    var n=typeof count==='number'?count:catalog.length;
    if(titleEl) titleEl.textContent=title||(state.active||state.q?'Matching platforms':listTitleDefault);
    if(countEl) countEl.textContent=n+' platform'+(n===1?'':'s');
  }

  function renderGrid(list, label, similar){
    if(!grid) return;
    var shown=0;
    if(!list.length){
      if(similar && similar.length){
        shown=similar.length;
        grid.innerHTML='<p class="sf-related-label">No exact match — similar platforms</p>'+similar.map(cardHtml).join('');
      } else {
        shown=0;
        grid.innerHTML='<p class="sf-empty-grid">No platforms match this filter.</p>';
      }
    } else {
      shown=list.length;
      grid.innerHTML=list.map(cardHtml).join('');
    }
    if(resultBar&&resultLabel){
      resultBar.hidden=!state.active;
      resultLabel.textContent=label||(list.length+' platforms');
    }
    if(clearBtn) clearBtn.hidden=!state.active;
    setListFold(true, shown);
    document.dispatchEvent(new CustomEvent('cb-catalog-rendered'));
  }

  function renderLiveLists(list, label){
    var html=list.slice(0,12).map(liveItemHtml).join('')||'<p class="sf-empty">No matches</p>';
    if(liveList) liveList.innerHTML=html;
    if(liveLabel) liveLabel.textContent=label||(list.length+' matches');
    if(live) live.hidden=!state.active && !(state.q&&state.q.length);
    if(popResList) popResList.innerHTML=html;
    if(popResLabel) popResLabel.textContent=label||(list.length+' matching platforms');
  }

  function productsFromResponse(data){
    var out=[];
    var seen={};
    (data.products||[]).forEach(function(p){
      if(!p.slug||seen[p.slug]) return; seen[p.slug]=1;
      out.push(p);
    });
    if(!out.length){
      (data.hits||[]).forEach(function(h){
        if(!h.slug||seen[h.slug]) return; seen[h.slug]=1;
        if(bySlug[h.slug]) out.push(bySlug[h.slug]);
      });
    }
    if(lazyNeed){
      out=out.filter(function(p){ return !!bySlug[p.slug]; });
    }
    return out;
  }

  function buildUrl(){
    var onlyQ=!!(state.q) && !state.group && !state.property && !state.value && state.min==null && state.max==null;
    var u=new URL(onlyQ?'/api/v1/platforms/search':'/api/v1/search', location.origin);
    if(!onlyQ) u.searchParams.set('mode','hybrid');
    u.searchParams.set('lang', lang);
    u.searchParams.set('limit','48');
    if(state.q) u.searchParams.set('q', state.q);
    if(lazyNeed) u.searchParams.set('need', lazyNeed);
    if(state.group) u.searchParams.set('group', state.group);
    if(state.property) u.searchParams.set('property', state.property);
    if(state.value) u.searchParams.set('value', state.value);
    if(state.min!=null && state.min!=='') u.searchParams.set('min', String(state.min));
    if(state.max!=null && state.max!=='') u.searchParams.set('max', String(state.max));
    return u;
  }

  function runSearch(immediate){
    if(timer) clearTimeout(timer);
    var go=function(){
      var has=!!(state.q||state.group||state.property||state.value||state.min!=null||state.max!=null);
      state.active=has;
      if(!has){
        renderGrid(catalog, '');
        if(live) live.hidden=true;
        if(resultBar) resultBar.hidden=true;
        if(clearBtn) clearBtn.hidden=true;
        setStatus('');
        return;
      }
      setStatus('Searching…');
      fetch(buildUrl().toString(), { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(data){
        var list=productsFromResponse(data);
        var parts=[];
        if(state.group) parts.push(state.group);
        if(state.property) parts.push(state.property);
        if(state.value) parts.push(state.value);
        if(state.min!=null||state.max!=null){
          parts.push((state.min!=null?state.min:'…')+'–'+(state.max!=null?state.max:'…'));
        }
        var label=list.length+' platforms · '+(data.source||data.mode||'hybrid')+(parts.length?' · '+parts.join(' / '):'');
        if(state.q) label+=' · “'+state.q+'"';
        if(list.length){
          renderGrid(list, label);
          renderLiveLists(list, label);
          setStatus(list.length+' live'+(data.source?' · '+data.source:''));
          return;
        }
        var q=state.q||[state.group,state.property,state.value].filter(Boolean).join(' ');
        if(!q){ renderGrid([], label); renderLiveLists([], label); setStatus('0 live'); return; }
        setStatus('Finding similar…');
        fetch('/api/v1/similar?lang='+encodeURIComponent(lang)+'&limit=8&q='+encodeURIComponent(q), {cache:'no-store'})
          .then(function(r){ return r.json(); })
          .then(function(sim){
            var rel=sim.products||[];
            var similarLabel=(rel.length?rel.length+' similar · '+(sim.mode||'semantic'):'0 platforms')+(state.q?' · “'+state.q+'"':'');
            renderGrid([], similarLabel, rel);
            renderLiveLists(rel.length?rel:[], similarLabel);
            setStatus(rel.length?'similar · '+(sim.mode||'semantic'):'0 live');
          })
          .catch(function(){ renderGrid([], label); renderLiveLists([], label); setStatus('0 live'); });
      }).catch(function(){ setStatus('Search failed'); });
    };
    if(immediate) go(); else timer=setTimeout(go, 90);
  }

  function setActiveRow(groupKey){
    if(!filter) return;
    filter.querySelectorAll('.sf-row').forEach(function(row){
      var g=row.getAttribute('data-group');
      var on=g===groupKey;
      row.classList.toggle('is-active', on);
      row.classList.toggle('is-bold', on);
      row.setAttribute('aria-pressed', on?'true':'false');
    });
  }

  function closePop(){
    if(popRoot) popRoot.hidden=true;
    document.documentElement.classList.remove('sf-pop-open');
  }

  function openPop(groupKey){
    var g=byGroup[groupKey];
    if(!g||!popRoot||!popBody) return;
    openGroupKey=groupKey;
    setActiveRow(groupKey);
    state.group=groupKey;
    if(popTitle) popTitle.textContent=g.label||groupKey;
    if(popKicker) popKicker.textContent=g.label||groupKey;

    var props=(g.properties||[]).map(function(p){
      var num=p.numeric;
      var chips=(p.values||[]).slice(0,8).map(function(v){
        return '<button type="button" class="sf-chip" data-action="value" data-group="'+esc(g.groupKey)+'" data-property="'+esc(p.propertyKey)+'" data-value="'+esc(v.value)+'">'+esc(v.value)+' <span>'+v.count+'</span></button>';
      }).join('');
      var slider='';
      if(num && num.max>num.min){
        var mid=Math.round((num.min+num.max)/2);
        var step=num.max-num.min>1000?10:num.max-num.min>100?1:0.1;
        slider='<div class="sf-range" data-property="'+esc(p.propertyKey)+'">'+
          '<div class="sf-range-labels"><span>'+esc(p.label)+'</span>'+
          '<span class="sf-range-val" id="sf-rv-'+esc(p.propertyKey)+'">'+mid+(num.unit?(' '+num.unit):'')+'</span></div>'+
          '<input type="range" class="sf-slider" min="'+num.min+'" max="'+num.max+'" step="'+step+'" value="'+mid+'"'+
          ' data-action="range" data-group="'+esc(g.groupKey)+'" data-property="'+esc(p.propertyKey)+'" data-unit="'+esc(num.unit||'')+'"'+
          ' data-rmin="'+num.min+'" data-rmax="'+num.max+'" aria-label="'+esc(p.label)+' range"/>'+
          '<div class="sf-range-ends"><span>'+num.min+(num.unit?num.unit:'')+'</span><span>'+num.max+(num.unit?num.unit:'')+'</span></div>'+
          '</div>';
      }
      return '<div class="sf-prop">'+
        '<button type="button" class="sf-prop-btn" data-action="property" data-group="'+esc(g.groupKey)+'" data-property="'+esc(p.propertyKey)+'">'+
        '<span class="sf-prop-label">'+esc(p.label)+'</span><span class="sf-prop-count">'+p.count+'</span></button>'+
        slider+
        '<div class="sf-values">'+chips+'</div></div>';
    }).join('');

    var top=(g.topValues||[]).slice(0,10).map(function(v){
      return '<button type="button" class="sf-chip" data-action="value" data-group="'+esc(g.groupKey)+'" data-value="'+esc(v.value)+'">'+esc(v.value)+' <span>'+v.count+'</span></button>';
    }).join('');

    popBody.innerHTML=
      '<p class="sf-panel-kicker">Pick a value or drag a range</p>'+
      '<div class="sf-top-values">'+(top||'<span class="sf-empty">No common options</span>')+'</div>'+
      '<div class="sf-props">'+(props||'<span class="sf-empty">No filters in this group</span>')+'</div>';

    popRoot.hidden=false;
    document.documentElement.classList.add('sf-pop-open');
    state.property='';
    state.value='';
    state.min=null;
    state.max=null;
    if(qInput&&!state.q){ /* keep typed q */ }
    runSearch(true);
  }

  function clearFilter(){
    state={ group:'', property:'', value:'', q:'', min:null, max:null, active:false };
    if(qInput) qInput.value='';
    if(qClear) qClear.hidden=true;
    if(live) live.hidden=true;
    if(resultBar) resultBar.hidden=true;
    if(clearBtn) clearBtn.hidden=true;
    setStatus('');
    closePop();
    if(grid) grid.innerHTML=catalog.map(cardHtml).join('');
    setListFold(true, catalog.length, listTitleDefault);
    setActiveRow('');
  }

  function applyHint(q){
    if(!q) return;
    state.q=q;
    if(qInput) qInput.value=q;
    if(qClear) qClear.hidden=false;
    runSearch(true);
  }

  function onAction(el){
    var action=el.getAttribute('data-action');
    if(!action) return;
    if(action==='clear'){ clearFilter(); return; }
    if(action==='hint'){ applyHint(el.getAttribute('data-q')||el.textContent||''); return; }
    if(action==='close-pop'){ closePop(); return; }
    if(action==='open-group'){
      openPop(el.getAttribute('data-group')||'');
      return;
    }
    var group=el.getAttribute('data-group')||state.group||'';
    var property=el.getAttribute('data-property')||'';
    var value=el.getAttribute('data-value')||'';

    if(action==='property'){
      state.group=group; state.property=property; state.value='';
      state.min=null; state.max=null;
      if(!state.q) state.q='';
      runSearch(true);
      return;
    }
    if(action==='value'){
      state.group=group; state.property=property; state.value=value;
      state.min=null; state.max=null;
      runSearch(true);
      return;
    }
    if(action==='range'){
      var v=Number(el.value);
      var unit=el.getAttribute('data-unit')||'';
      var rmin=Number(el.getAttribute('data-rmin'));
      var rmax=Number(el.getAttribute('data-rmax'));
      // Window around thumb: ±25% of span, clamped — "approx N"
      var span=Math.max(1, rmax-rmin);
      var pad=span*0.18;
      state.group=group;
      state.property=property;
      state.value='';
      state.min=Math.max(rmin, v-pad);
      state.max=Math.min(rmax, v+pad);
      var lab=document.getElementById('sf-rv-'+property);
      if(lab) lab.textContent=Math.round(v*10)/10+(unit?(' '+unit):'');
      runSearch(false);
      return;
    }
  }

  if(filter){
    filter.addEventListener('click', function(e){
      var el=e.target&&e.target.closest('[data-action]');
      if(!el||!filter.contains(el)) return;
      e.preventDefault();
      onAction(el);
    });
  }
  if(popRoot){
    popRoot.addEventListener('click', function(e){
      var el=e.target&&e.target.closest('[data-action]');
      if(!el) return;
      e.preventDefault();
      onAction(el);
    });
    popRoot.addEventListener('input', function(e){
      var t=e.target;
      if(t&&t.getAttribute&&t.getAttribute('data-action')==='range'){
        onAction(t);
      }
    });
  }

  if(qInput){
    qInput.addEventListener('input', function(){
      state.q=qInput.value.trim();
      if(qClear) qClear.hidden=!state.q;
      if(live) live.hidden=false;
      runSearch(false);
    });
  }
  if(qClear){
    qClear.addEventListener('click', function(){
      if(qInput) qInput.value='';
      state.q='';
      qClear.hidden=true;
      runSearch(true);
    });
  }

  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') closePop();
  });

  function orderGroups(groups){
    if(!facetPriority.length) return groups||[];
    var rank={};
    facetPriority.forEach(function(k,i){ rank[k]=i; });
    return (groups||[]).slice().sort(function(a,b){
      var ra=rank[a.groupKey]; var rb=rank[b.groupKey];
      if(ra==null && rb==null) return 0;
      if(ra==null) return 1;
      if(rb==null) return -1;
      return ra-rb;
    });
  }

  function renderGroupRows(groups){
    var rowsEl=filter&&filter.querySelector('.sf-rows');
    if(!rowsEl) return;
    groups=orderGroups(groups);
    byGroup={};
    (groups||[]).forEach(function(g){ byGroup[g.groupKey]=g; });
    facets.groups=groups||[];
    rowsEl.innerHTML=(groups||[]).map(function(g){
      return '<button type="button" class="sf-row" data-action="open-group" data-group="'+esc(g.groupKey)+'" data-label="'+esc(g.label)+'" role="listitem" aria-pressed="false">'+
        '<span class="sf-group-name">'+esc(g.label||g.groupKey)+'</span>'+
        '<span class="sf-group-meta">'+g.count+'</span>'+
        '<span class="sf-chev" aria-hidden="true">›</span></button>';
    }).join('') || '<p class="sf-empty">No filters for this mission</p>';
  }

  function loadFacets(){
    if(facetsReady || !lazyFacets) return;
    var rowsEl=filter&&filter.querySelector('.sf-rows');
    if(rowsEl) rowsEl.innerHTML='<p class="sf-empty">Loading filters…</p>';
    var url='/api/v1/facets?lang='+encodeURIComponent(lang);
    if(lazyNeed) url+='&need='+encodeURIComponent(lazyNeed);
    fetch(url, {cache:'default'})
      .then(function(r){ return r.json(); })
      .then(function(data){
        facetsReady=true;
        renderGroupRows(data.groups||[]);
      })
      .catch(function(){
        if(rowsEl) rowsEl.innerHTML='<p class="sf-empty">Filters unavailable.</p>';
      });
  }

  function setFiltersOpen(open){
    if(!foldBody) return;
    foldBody.hidden=!open;
    if(filter) filter.classList.toggle('is-collapsed', !open);
    if(toggleBtn){
      toggleBtn.setAttribute('aria-expanded', open?'true':'false');
      toggleBtn.textContent=open?'Hide filters':'Show filters';
    }
    if(open) loadFacets();
  }

  if(foldBody) foldBody.hidden=true;
  if(filter) filter.classList.add('is-collapsed');
  if(toggleBtn){
    toggleBtn.addEventListener('click', function(){
      setFiltersOpen(!!foldBody.hidden);
    });
  }
})();
</script>`;
}

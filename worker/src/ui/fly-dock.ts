/** Sticky flying dock — category, solution, and a bold search. Filters the product grid instantly. */

import type { CatalogDockCopy } from "../i18n/catalog-dock";
import { escapeHtml } from "./shell";

export type DockOption = { value: string; label: string };

function optionsHtml(allLabel: string, items: DockOption[]) {
  const head = `<option value="">${escapeHtml(allLabel)}</option>`;
  const rest = items
    .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
    .join("");
  return head + rest;
}

export function flyDockMarkup(opts: {
  copy: CatalogDockCopy;
  categories: DockOption[];
  solutions: DockOption[];
}) {
  const copy = opts.copy;
  const boot = {
    countOne: copy.countOne,
    countTwo: copy.countTwo || "",
    countFew: copy.countFew || "",
    countMany: copy.countMany,
    plural: copy.plural || "en",
    empty: copy.empty,
  };

  return `
<div class="fly-dock-sentinel" id="fly-dock-sentinel" aria-hidden="true"></div>
<form class="fly-dock" id="fly-dock" role="search" aria-label="${escapeHtml(copy.aria)}" aria-controls="product-grid">
  <div class="fly-dock-grid">
    <label class="fly-field fly-field-search">
      <span class="fly-label" id="fly-search-label">${escapeHtml(copy.searchLabel)}</span>
      <input type="search" id="fly-q" class="fly-search" name="q" placeholder="${escapeHtml(copy.searchPlaceholder)}" aria-labelledby="fly-search-label" autocomplete="off" enterkeyhint="search" />
    </label>
    <label class="fly-field">
      <span class="fly-label" id="fly-cat-label">${escapeHtml(copy.category)}</span>
      <select id="fly-cat" class="fly-select" name="cat" aria-labelledby="fly-cat-label">
        ${optionsHtml(copy.allCategories, opts.categories)}
      </select>
    </label>
    <label class="fly-field">
      <span class="fly-label" id="fly-need-label">${escapeHtml(copy.solution)}</span>
      <select id="fly-need" class="fly-select" name="need" aria-labelledby="fly-need-label">
        ${optionsHtml(copy.allSolutions, opts.solutions)}
      </select>
    </label>
    <div class="fly-meta">
      <p class="fly-count" id="fly-count" aria-live="polite"></p>
      <button type="button" class="fly-clear" id="fly-clear" hidden>${escapeHtml(copy.clear)}</button>
    </div>
  </div>
  <p class="fly-empty" id="fly-empty" hidden>${escapeHtml(copy.empty)}</p>
</form>
<script type="application/json" id="fly-dock-boot">${JSON.stringify(boot).replace(/</g, "\\u003c")}</script>
<script>
(function(){
  function boot(){
    var form=document.getElementById('fly-dock');
    var grid=document.getElementById('product-grid');
    if(!form||!grid) return;
    var dataEl=document.getElementById('fly-dock-boot');
    var copy={countOne:'{n}',countTwo:'',countFew:'',countMany:'{n}',plural:'en',empty:''};
    try { copy=JSON.parse((dataEl&&dataEl.textContent)||'{}'); } catch(e){}
    var qInput=document.getElementById('fly-q');
    var catSel=document.getElementById('fly-cat');
    var needSel=document.getElementById('fly-need');
    var countEl=document.getElementById('fly-count');
    var clearBtn=document.getElementById('fly-clear');
    var emptyEl=document.getElementById('fly-empty');

    function hasOption(sel, value){
      if(!sel||!value) return false;
      for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===value) return true; }
      return false;
    }
    function readUrl(){
      var params=new URLSearchParams(location.search);
      if(qInput) qInput.value=params.get('q')||'';
      if(catSel) catSel.value=hasOption(catSel, params.get('cat')||'')?(params.get('cat')||''):'';
      if(needSel) needSel.value=hasOption(needSel, params.get('need')||'')?(params.get('need')||''):'';
    }
    function writeUrl(){
      var params=new URLSearchParams(location.search);
      var q=(qInput&&qInput.value||'').trim();
      var cat=catSel?catSel.value:'';
      var need=needSel?needSel.value:'';
      if(q) params.set('q', q); else params.delete('q');
      if(cat) params.set('cat', cat); else params.delete('cat');
      if(need) params.set('need', need); else params.delete('need');
      var next=params.toString();
      var url=location.pathname+(next?('?'+next):'')+location.hash;
      history.replaceState(null, '', url);
    }
    function tokens(el, attr){
      return String(el.getAttribute(attr)||'').split('|').filter(Boolean);
    }
    function countText(n){
      var mode=copy.plural||'en';
      var tpl=copy.countMany;
      var n10=n%10, n100=n%100;
      if(mode==='ru'){
        if(n10===1 && n100!==11) tpl=copy.countOne;
        else if(n10>=2 && n10<=4 && (n100<12 || n100>14)) tpl=copy.countFew||copy.countMany;
      } else if(mode==='ar'){
        if(n===1) tpl=copy.countOne;
        else if(n===2) tpl=copy.countTwo||copy.countFew||copy.countMany;
        else if(n>=3 && n<=10) tpl=copy.countFew||copy.countMany;
      } else if(n===1) tpl=copy.countOne||copy.countMany;
      return String(tpl||'{n}').replace('{n}', String(n));
    }
    function fold(s){
      return String(s||'')
        .replace(/\u0130/g,'i')
        .replace(/\u0131/g,'i')
        .toLowerCase()
        .replace(/\u00df/g,'ss')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/\s+/g,' ')
        .trim();
    }
    function apply(){
      var words=fold(qInput&&qInput.value||'').split(' ').filter(Boolean);
      var cat=catSel?catSel.value:'';
      var need=needSel?needSel.value:'';
      var cards=grid.querySelectorAll('.product');
      var n=0;
      cards.forEach(function(el){
        var ok=true;
        if(cat && tokens(el,'data-cats').indexOf(cat)<0) ok=false;
        if(need && tokens(el,'data-needs').indexOf(need)<0) ok=false;
        if(words.length){
          var hay=fold(el.getAttribute('data-q')||'');
          for(var i=0;i<words.length;i++){
            if(hay.indexOf(words[i])<0){ ok=false; break; }
          }
        }
        el.classList.toggle('is-out', !ok);
        el.hidden=!ok;
        if(ok) n++;
      });
      var active=!!(words.length||cat||need);
      form.classList.toggle('is-filtering', active);
      if(catSel) catSel.classList.toggle('is-set', !!cat);
      if(needSel) needSel.classList.toggle('is-set', !!need);
      if(qInput) qInput.classList.toggle('is-set', !!words.length);
      if(countEl) countEl.textContent=countText(n);
      var listCount=document.getElementById('product-list-count');
      if(listCount) listCount.textContent=countText(n);
      if(clearBtn) clearBtn.hidden=!active;
      if(emptyEl){
        emptyEl.hidden=n!==0;
        if(grid.nextElementSibling!==emptyEl) grid.insertAdjacentElement('afterend', emptyEl);
      }
      writeUrl();
    }
    form.addEventListener('submit', function(e){ e.preventDefault(); apply(); });
    if(qInput) qInput.addEventListener('input', apply);
    if(catSel) catSel.addEventListener('change', apply);
    if(needSel) needSel.addEventListener('change', apply);
    if(clearBtn) clearBtn.addEventListener('click', function(){
      if(qInput) qInput.value='';
      if(catSel) catSel.value='';
      if(needSel) needSel.value='';
      apply();
      if(qInput) qInput.focus();
    });
    document.addEventListener('cb-catalog-rendered', apply);
    var sentinel=document.getElementById('fly-dock-sentinel');
    if(sentinel && 'IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        form.classList.toggle('is-stuck', !entries[0].isIntersecting);
      }, { rootMargin: '-64px 0px 0px 0px', threshold: 0 });
      io.observe(sentinel);
    }
    readUrl();
    apply();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
</script>`;
}

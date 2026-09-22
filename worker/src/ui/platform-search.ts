/** Site-wide Ctrl/Cmd+K Find platforms palette — same hit list as catalog search. */

export function platformSearchMarkup(lang: string) {
  const l = String(lang || "en").replace(/[^\w-]/g, "");
  return `
<div class="ps-root" id="ps-root" hidden data-lang="${l}">
  <button type="button" class="ps-backdrop" data-ps-close tabindex="-1" aria-label="Close search"></button>
  <div class="ps-dialog" role="dialog" aria-modal="true" aria-labelledby="ps-title">
    <div class="ps-head">
      <div>
        <p class="ps-kicker">Find platforms</p>
        <h4 id="ps-title">Search catalog</h4>
      </div>
      <kbd class="ps-kbd" data-ps-kbd>Ctrl K</kbd>
      <button type="button" class="ps-close" data-ps-close aria-label="Close">×</button>
    </div>
    <label class="sf-search-wrap ps-search-wrap" for="ps-q">
      <span class="sf-search-icon" aria-hidden="true">⌕</span>
      <input type="search" id="ps-q" class="sf-search" placeholder="SKU, thermal, range, model…" autocomplete="off" enterkeyhint="search" aria-controls="ps-list"/>
      <button type="button" class="sf-search-clear" id="ps-q-clear" hidden aria-label="Clear search">×</button>
    </label>
    <p class="sf-live-label" id="ps-label">Type to list platforms</p>
    <div class="sf-live-list ps-list" id="ps-list" role="listbox" aria-label="Matching platforms"></div>
  </div>
</div>
<script>
(function(){
  var root=document.getElementById('ps-root');
  if(!root) return;
  var lang=root.getAttribute('data-lang')||'en';
  var input=document.getElementById('ps-q');
  var clearBtn=document.getElementById('ps-q-clear');
  var listEl=document.getElementById('ps-list');
  var labelEl=document.getElementById('ps-label');
  var lastFocus=null;
  var items=[];
  var source='';
  var loading=null;
  var active=-1;
  var timer=null;
  var CACHE='cb:platforms:'+lang;

  function isApple(){
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform||'') ||
      ((navigator.userAgentData&&navigator.userAgentData.platform||'')==='macOS');
  }
  var kbd=isApple()?'⌘K':'Ctrl K';
  document.querySelectorAll('[data-ps-kbd], .nav-search-kbd, .hero-find-kbd').forEach(function(el){
    el.textContent=kbd;
  });

  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function hayOf(p){
    return (p.hay||[p.sku,p.name,p.summary,p.slug,p.model].join(' ')).toLowerCase();
  }
  function score(p, needle, words){
    var sku=String(p.sku||'').toLowerCase();
    var skuC=sku.replace(/[^a-z0-9]/g,'');
    var nC=needle.replace(/[^a-z0-9]/g,'');
    var name=String(p.name||'').toLowerCase();
    var hay=hayOf(p);
    if(sku===needle||(nC&&skuC===nC)) return 100;
    if(sku.indexOf(needle)===0||(nC&&skuC.indexOf(nC)===0)) return 92;
    if(sku.indexOf(needle)>=0) return 88;
    if(name.indexOf(needle)===0) return 80;
    if(name.indexOf(needle)>=0) return 68;
    if(hay.indexOf(needle)>=0) return 52;
    if(words.length>1){
      for(var i=0;i<words.length;i++){ if(hay.indexOf(words[i])<0) return 0; }
      return 40;
    }
    return 0;
  }
  function filterLocal(q, limit){
    var needle=String(q||'').trim().toLowerCase();
    var cap=limit||12;
    if(!needle) return items.slice(0, cap);
    var words=needle.split(/\\s+/).filter(Boolean);
    var scored=[];
    for(var i=0;i<items.length;i++){
      var s=score(items[i], needle, words);
      if(s>0) scored.push({s:s,p:items[i]});
    }
    scored.sort(function(a,b){ return b.s-a.s; });
    return scored.slice(0, cap).map(function(x){ return x.p; });
  }
  function hitHtml(p, i){
    return '<a class="sf-hit" role="option" id="ps-opt-'+i+'" href="'+esc(p.path)+'" data-i="'+i+'">'+
      (p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy"/>':'<span class="sf-hit-ph"></span>')+
      '<span class="sf-hit-body"><span class="sf-hit-sku">'+esc(p.sku||p.smartId||'')+'</span>'+
      '<span class="sf-hit-name">'+esc(p.name)+'</span></span></a>';
  }
  function setActive(i){
    var hits=listEl?listEl.querySelectorAll('.sf-hit'):[];
    if(!hits.length){ active=-1; return; }
    if(i<0) i=hits.length-1;
    if(i>=hits.length) i=0;
    active=i;
    for(var n=0;n<hits.length;n++){
      hits[n].classList.toggle('is-active', n===active);
      if(n===active) hits[n].scrollIntoView({block:'nearest'});
    }
  }
  function render(list, msg){
    if(!listEl) return;
    if(!list.length){
      listEl.innerHTML='<p class="sf-empty">Finding similar platforms…</p>';
      active=-1;
      var q=(input&&input.value||'').trim();
      if(q){
        fetch('/api/v1/similar?lang='+encodeURIComponent(lang)+'&limit=8&q='+encodeURIComponent(q), {cache:'no-store'})
          .then(function(r){ return r.json(); })
          .then(function(sim){
            var rel=sim.products||[];
            if(!rel.length){
              listEl.innerHTML='<p class="sf-empty">No platforms match.</p>';
              if(labelEl) labelEl.textContent='No match';
              return;
            }
            listEl.innerHTML=rel.map(hitHtml).join('');
            setActive(0);
            if(labelEl) labelEl.textContent=rel.length+' similar'+(sim.mode?' · '+sim.mode:'');
          })
          .catch(function(){
            listEl.innerHTML='<p class="sf-empty">No platforms match.</p>';
          });
      } else {
        listEl.innerHTML='<p class="sf-empty">No platforms match.</p>';
      }
    } else {
      listEl.innerHTML=list.map(hitHtml).join('');
      setActive(0);
    }
    if(labelEl) labelEl.textContent=msg||(list.length+' platforms'+(source?' · '+source:''));
  }

  function cacheGet(){
    try{
      var raw=sessionStorage.getItem(CACHE);
      if(!raw) return null;
      var o=JSON.parse(raw);
      if(!o||!o.items||Date.now()-o.at>5*60*1000) return null;
      return o;
    }catch(e){ return null; }
  }
  function cacheSet(data){
    try{ sessionStorage.setItem(CACHE, JSON.stringify({at:Date.now(), items:data.items, source:data.source})); }catch(e){}
  }

  function prefetch(){
    if(items.length) return Promise.resolve(items);
    var cached=cacheGet();
    if(cached&&cached.items&&cached.items.length){
      items=cached.items;
      source=cached.source||'cache';
      return Promise.resolve(items);
    }
    if(loading) return loading;
    loading=fetch('/api/v1/platforms/index?lang='+encodeURIComponent(lang), {cache:'default'})
      .then(function(r){ return r.json(); })
      .then(function(data){
        items=data.items||data.products||[];
        source=data.source||'redis';
        if(items.length) cacheSet({items:items, source:source});
        loading=null;
        return items;
      })
      .catch(function(){ loading=null; return []; });
    return loading;
  }

  function run(q){
    var needle=String(q||'').trim();
    if(clearBtn) clearBtn.hidden=!needle;
    if(!needle){
      render([], 'Type to list platforms');
      return;
    }
    if(items.length){
      var list=filterLocal(needle, 12);
      var msg=list.length+' platforms'+(source?' · '+source:'');
      render(list, msg);
      return;
    }
    if(labelEl) labelEl.textContent='Searching…';
    var u=new URL('/api/v1/platforms/search', location.origin);
    u.searchParams.set('lang', lang);
    u.searchParams.set('limit','12');
    if(needle) u.searchParams.set('q', needle);
    fetch(u.toString(), {cache:'no-store'}).then(function(r){ return r.json(); }).then(function(data){
      source=data.source||source;
      render(data.products||[], (data.products||[]).length+' platforms'+(source?' · '+source:''));
    }).catch(function(){ render([], 'Search failed'); });
  }

  function openPs(){
    lastFocus=document.activeElement;
    root.hidden=false;
    document.documentElement.classList.add('ps-open');
    if(input){
      input.value=input.value||'';
      input.focus();
      input.select();
    }
    prefetch().then(function(){ run(input?input.value:''); });
  }
  function closePs(){
    if(root.hidden) return;
    root.hidden=true;
    document.documentElement.classList.remove('ps-open');
    active=-1;
    if(lastFocus&&lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} }
  }
  function isOpen(){ return !root.hidden; }

  document.addEventListener('click', function(e){
    var t=e.target;
    if(!t||!t.closest) return;
    if(t.closest('[data-ps-close]')){ e.preventDefault(); closePs(); return; }
    if(t.closest('[data-open-platform-search]')){
      e.preventDefault();
      openPs();
    }
  });
  document.addEventListener('keydown', function(e){
    if(e.isComposing) return;
    if((e.metaKey||e.ctrlKey)&&!e.altKey&&(e.key==='k'||e.key==='K')){
      e.preventDefault();
      if(isOpen()){ if(input) input.focus(); }
      else openPs();
      return;
    }
    if(e.key==='Escape'&&isOpen()){
      e.preventDefault();
      e.stopImmediatePropagation();
      closePs();
    }
  }, true);
  document.addEventListener('keydown', function(e){
    if(!isOpen()||e.isComposing) return;
    if(e.key==='ArrowDown'){ e.preventDefault(); setActive(active+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); setActive(active-1); }
    else if(e.key==='Enter'&&active>=0){
      var hit=listEl&&listEl.querySelector('.sf-hit.is-active');
      if(hit){ e.preventDefault(); hit.click(); }
    }
  });

  if(input){
    input.addEventListener('input', function(){
      var q=input.value;
      if(timer) clearTimeout(timer);
      if(items.length) run(q);
      else timer=setTimeout(function(){ run(q); }, 40);
    });
  }
  if(clearBtn){
    clearBtn.addEventListener('click', function(){
      if(input) input.value='';
      run('');
      if(input) input.focus();
    });
  }
  prefetch();
})();
</script>`;
}

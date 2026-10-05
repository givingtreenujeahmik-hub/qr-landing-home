const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync('nj-ga.js', 'utf8');
function storage(seed = {}, blocked = false) {
  return { data: seed, getItem(k) { if(blocked) throw Error('blocked'); return this.data[k] || null; },
    setItem(k,v) { if(blocked) throw Error('blocked'); this.data[k] = v; } };
}
function visit(url, opts = {}) {
  const local = opts.local || storage(), session = opts.session || storage();
  const scripts = [], listeners = {}, timers = [];
  const docListeners = {};
  const document = { addEventListener: (n,f) => {docListeners[n]=f;}, referrer: opts.referrer || '', hidden: false, hasFocus: () => true,
    documentElement: {scrollHeight: 2000}, body: {scrollHeight: 2000},
    head: {appendChild: s => scripts.push(s)}, createElement: () => ({}) };
  const w = { localStorage: local, sessionStorage: session, dataLayer: [], innerHeight: 800, scrollY: 0,
    performance: {getEntriesByType: () => [{type: opts.navigation || 'navigate'}]},
    addEventListener: (n,f) => { listeners[n] = f; }, setInterval: f => {timers.push(f); return timers.length;}, clearInterval() {} };
  const ctx = {window:w, location:new URL(url), document, URL, URLSearchParams, Date, console};
  vm.runInNewContext(code,ctx);
  return {w,docListeners,local,session,scripts,listeners,timers,document,ctx,
    events: name => w.dataLayer.filter(a=>a[0]==='event' && (!name || a[1]===name)),
    config: () => w.dataLayer.find(a=>a[0]==='config')?.[2]};
}
const base = 'https://givingtreenujeahmik-hub.github.io/qr-landing-home/';
const direct = visit(base,{local:storage({nj_store:'yeonbang'})});
assert.equal(direct.w.njAnalytics.context().store,'unknown');
assert.equal(direct.w.njAnalytics.context().entry_source,'unclassified');
assert.equal(direct.events('qr_landing').length,0);
assert.equal(direct.scripts.length,1);
assert.equal(direct.w.dataLayer.filter(a=>a[0]==='config').length,1);
vm.runInNewContext(code,direct.ctx); assert.equal(direct.scripts.length,1);
const tagged = visit(base+'?qr=yeonbang_moru&email=secret@example.com', {referrer:'https://example.com/?secret=1'});
assert.equal(tagged.events('qr_landing').length,1);
assert.equal(tagged.w.njAnalytics.context().store,'yeonbang');
assert.equal(tagged.w.njAnalytics.context().qr_entry,'moru');
assert.equal(tagged.config().campaign_medium,'offline');
assert.ok(!tagged.config().page_location.includes('secret'));
assert.equal(tagged.config().page_referrer,'https://example.com/');
const reload = visit(base+'?qr=yeonbang_moru', {session:tagged.session,referrer:'https://example.com/',navigation:'reload'});
assert.equal(reload.events('qr_landing').length,0);
const next = visit(base+'moru.html?store=yeonbang&lang=jp', {session:tagged.session,local:tagged.local,referrer:base});
assert.equal(next.w.njAnalytics.context().qr_id,'yeonbang_moru');
assert.equal(next.events('view_category').length,1);
next.w.gtag('event','select_language',{language:'en',source:'switcher',question_text:'secret@example.com'});
let e = next.events('select_language')[0][2];
assert.equal(e.site_lang,'en'); assert.equal(e.interaction_source,'switcher');
assert.ok(!('source' in e)); assert.ok(!('question_text' in e));
next.w.gtag('event','select_category',{category:'cuff'});
next.w.gtag('event','select_category',{category:'cuff'});
assert.equal(next.events('select_category').length,1);
assert.equal(next.events('select_category')[0][2].category,'earcuff');
next.w.gtag('event','custom_summary',{items:'a,b',total:5000,item_count:2});
e=next.events('custom_summary')[0][2];assert.equal(e.selected_items,'a,b');assert.equal(e.estimated_value,5000);assert.ok(!('items' in e));
next.w.scrollY=500;next.listeners.scroll();next.listeners.scroll();
assert.equal(next.events('scroll_depth').length,2);
next.document.hidden=true;for(let i=0;i<40;i++)next.timers[0]();assert.equal(next.events('engaged_read').length,0);
next.document.hidden=false;for(let i=0;i<31;i++)next.timers[0]();assert.equal(next.events('engaged_read').length,1);
const test = visit(base+'?nj_test=1');test.w.gtag('event','chatbot_open');
assert.equal(test.scripts.length,0);assert.equal(test.w.dataLayer.length,0);
const testNext=visit(base+'home.html',{local:test.local});assert.equal(testNext.scripts.length,0);
assert.equal(visit(base+'?nj_test=0',{local:test.local}).scripts.length,1);
const privateVisit = visit(base+'?qr=main_ring',{local:storage({},true),session:storage({},true)});
assert.equal(privateVisit.events('qr_landing').length,1);
const expired = JSON.parse(tagged.session.data.nj_analytics_visit); expired.last = Date.now()-31*60*1000;
const stale = visit(base+'home.html',{session:storage({nj_analytics_visit:JSON.stringify(expired)})});
assert.equal(stale.w.njAnalytics.context().qr_id,'unmarked');
assert.equal(visit(base+'?qr=invalid_value').events('qr_landing').length,0);
const debug=visit(base+'?ga_debug=1');assert.equal(debug.config().debug_mode,true);assert.equal(debug.w.njAnalytics.context().traffic_role,'developer');
const custom=visit(base+'custom.html');
custom.w.gtag('event','custom_summary',{doll:'bear',items:'a,b',item_count:2,total:5000});
custom.w.gtag('event','custom_shop_click',{doll:'bear',items:'a,b',item_count:2,total:5000});
assert.equal(custom.events('custom_shop_click')[0][2].destination,'smartstore');
assert.equal(custom.events('custom_shop_click')[0][2].journey_stage,'custom_summary');
function clickLink(v,href){v.docListeners.click({target:{closest:()=>({href})}});}
clickLink(custom,'https://smartstore.naver.com/nujeahmik/products/13763791593');
assert.equal(custom.events('outbound_click')[0][2].journey_stage,'custom_summary');
const out=visit(base+'home.html');
out.w.gtag('event','outbound_click',{from:'home',link:'website'});
clickLink(out,'https://www.nujeahmik.com/');
assert.equal(out.events('outbound_click').length,1);
clickLink(out,'https://www.instagram.com/nuj_eahmik');
clickLink(out,'https://smartstore.naver.com/nujeahmik');
assert.deepEqual(out.events('outbound_click').map(e=>e[2].destination),['official_website','instagram','smartstore']);
clickLink(out,'https://nujeahmik.com.evil.example/');assert.equal(out.events('outbound_click').length,3);
console.log('PASS: attribution, QR reload deduplication, language, sanitization, test exclusion, storage failure, expiry, scroll and engagement.');

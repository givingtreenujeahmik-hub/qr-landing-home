/* nujeahmik GA4 v2 — one loader, bounded context, no free-text analytics.
   ?nj_test=1 disables collection on this browser; ?nj_test=0 restores it.
   ?ga_debug=1 enables DebugView for this tab (these events are labelled developer).
   Tagged QR links use ?qr=main_home or ?qr=yeonbang_home, etc. See ANALYTICS.md. */
(function(){
  'use strict';
  if (window.__njGA) return;
  window.__njGA = true;
  var GA_ID = 'G-H4GJZ6ZSWX', VERSION = '2';
  function get(kind, key){ try { return window[kind].getItem(key); } catch (_) { return null; } }
  function set(kind, key, value){ try { window[kind].setItem(key, value); } catch (_) {} }
  function member(value, values, fallback){ return values.indexOf(value) >= 0 ? value : fallback; }
  var q = new URLSearchParams(location.search);
  if (q.has('nj_test')) {
    var nextTest = q.get('nj_test') === '1' ? '1' : '0';
    if (get('localStorage', 'nj_analytics_test') !== nextTest) set('sessionStorage', 'nj_analytics_visit', '');
    set('localStorage', 'nj_analytics_test', nextTest);
  }
  if (q.has('ga_debug')) set('sessionStorage', 'nj_analytics_debug', q.get('ga_debug') === '1' ? '1' : '0');
  var testing = q.get('nj_test') === '1' || get('localStorage', 'nj_analytics_test') === '1';
  var debug = q.get('ga_debug') === '1' || get('sessionStorage', 'nj_analytics_debug') === '1';
  var stores = ['main', 'yeonbang'], langs = ['ko', 'en', 'cn', 'jp'];
  var categories = ['home', 'moru', 'ring', 'earring', 'earcuff'];
  var page = member((location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/, ''),
    ['index', 'home', 'moru', 'ring', 'earring', 'earcuff', 'custom', 'chat'], 'other');
  function language(){ var l = q.get('lang') || get('localStorage', 'nj_lang'); return member(l === 'tw' ? 'cn' : l, langs, 'ko'); }
  var ref = null;
  try { ref = document.referrer ? new URL(document.referrer) : null; } catch (_) {}
  var internal = !!(ref && ref.origin === location.origin && ref.pathname.indexOf('/qr-landing-home/') === 0);
  var context = null, now = Date.now();
  try { context = JSON.parse(get('sessionStorage', 'nj_analytics_visit')); } catch (_) {}
  if (!context || !context.last || now - context.last > 30 * 60 * 1000) context = null;
  var qr = q.get('qr') || '', parts = qr.split('_');
  var tagged = parts.length === 2 && stores.indexOf(parts[0]) >= 0 && categories.indexOf(parts[1]) >= 0;
  // External arrivals begin a new journey. Refresh/back/internal navigation retain it.
  var nav = window.performance && window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation')[0] : null;
  var restored = nav && (nav.type === 'reload' || nav.type === 'back_forward');
  var fresh = !context || (ref && !internal && !restored) || (tagged && context.qr_id !== qr);
  if (fresh) {
    context = {
      store: tagged ? parts[0] : (internal ? 'unknown' : member(q.get('store'), stores, 'unknown')),
      qr_entry: tagged ? parts[1] : 'unknown',
      qr_id: tagged ? qr : 'unmarked',
      entry_source: tagged ? 'qr_tagged' : (ref && !internal ? 'referral' : 'unclassified'),
      qr_recorded: false, last: now
    };
  }
  // Never infer an arrival's store from a previous visitor preference.
  if (tagged) context.store = parts[0];
  if (internal && context.store !== 'unknown' && !tagged) context.store = member(q.get('store'), stores, context.store);
  function save(){ context.last = Date.now(); set('sessionStorage', 'nj_analytics_visit', JSON.stringify(context)); }
  save();
  function defaults(){ return {
    store: context.store, site_lang: language(), qr_entry: context.qr_entry,
    qr_id: context.qr_id, entry_source: context.entry_source, page_name: page,
    traffic_role: debug ? 'developer' : 'visitor', analytics_version: VERSION
  }; }
  function token(v){ return typeof v === 'string' && /^[a-zA-Z0-9_.,-]{1,100}$/.test(v) ? v : null; }
  function clean(p){
    var result = {}, numbers = ['item_count', 'estimated_value', 'depth_percent', 'visible_seconds'];
    var strings = ['language', 'interaction_source', 'category', 'to', 'link', 'from', 'card',
      'question_id', 'question_cat', 'chat_lang', 'chat_store', 'doll', 'item', 'selected_items', 'destination', 'journey_stage'];
    p = p || {};
    if (p.source && !p.interaction_source) p = Object.assign({}, p, { interaction_source: p.source });
    if (typeof p.items === 'string') p = Object.assign({}, p, { selected_items: p.items });
    if (typeof p.total === 'number') p = Object.assign({}, p, { estimated_value: p.total });
    strings.forEach(function(k){ var v = token(p[k]); if (v !== null) result[k] = v; });
    numbers.forEach(function(k){ if (typeof p[k] === 'number' && isFinite(p[k]) && p[k] >= 0) result[k] = p[k]; });
    if (result.category === 'cuff') result.category = 'earcuff';
    // No question_text, URLs, user input, product display names, or reserved source/items.
    return result;
  }
  var events = ['select_language', 'select_category', 'outbound_click', 'open_custom', 'view_store_map',
    'chatbot_open', 'chatbot_close', 'chatbot_card', 'chatbot_question', 'chatbot_to_custom', 'chatbot_no_answer',
    'custom_doll', 'custom_item', 'custom_summary', 'custom_shop_click', 'qr_landing', 'view_category',
    'custom_view', 'scroll_depth', 'engaged_read'];
  var lastEvent = {}, lastSummary = null, raw = window.gtag;
  function destination(href){
    try {
      var host = new URL(href, location.href).hostname.toLowerCase();
      if (host === 'smartstore.naver.com') return 'smartstore';
      if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
      if (host === 'nujeahmik.com' || host.endsWith('.nujeahmik.com')) return 'official_website';
    } catch (_) {}
    return null;
  }
  window.dataLayer = window.dataLayer || [];
  if (!raw) raw = function(){ window.dataLayer.push(arguments); };
  function track(name, p){
    if (testing || events.indexOf(name) < 0) return;
    var params = clean(p), stamp = Date.now();
    if (name === 'custom_summary') lastSummary = params;
    if (name === 'outbound_click') {
      params.link = ({website:'official_website', 'site-ring':'official_website'})[params.link] || params.link;
      params.destination = params.link || 'other';
      params.from = params.from || page;
      params.journey_stage = params.journey_stage || (page === 'custom' && lastSummary ? 'custom_summary' : 'browse');
    }
    if (name === 'custom_shop_click') {
      params.destination = 'smartstore'; params.from = 'custom'; params.journey_stage = 'custom_summary';
    }
    var key = name + JSON.stringify(Object.keys(params).sort().map(function(k){ return [k, params[k]]; }));
    // Collapse accidental double taps, not independent actions or GA automatic events.
    if (lastEvent[key] && stamp - lastEvent[key] < 700) return;
    lastEvent[key] = stamp;
    if (name === 'select_language') {
      var l = member(params.language, langs, language());
      set('localStorage', 'nj_lang', l);
      q.set('lang', l);
    }
    save();
    var all = Object.assign(defaults(), params, { transport_type: 'beacon' });
    raw('set', defaults());
    raw('event', name, all);
  }
  // Compatibility for all existing page and same-origin chatbot call sites.
  window.gtag = function(){
    if (testing) return;
    if (arguments[0] === 'event') return track(arguments[1], arguments[2]);
    return raw.apply(null, arguments);
  };
  window.njAnalytics = { track: track, context: defaults, disabled: testing };
  if (testing) return;
  var cleanURL = new URL(location.origin + location.pathname);
  if (context.store !== 'unknown') cleanURL.searchParams.set('store', context.store);
  if (q.has('lang')) cleanURL.searchParams.set('lang', language());
  if (tagged) cleanURL.searchParams.set('qr', qr);
  var config = { page_location: cleanURL.href, page_referrer: ref ? ref.origin + ref.pathname : '',
    allow_google_signals: false, allow_ad_personalization_signals: false };
  if (debug) config.debug_mode = true;
  if (tagged && fresh) Object.assign(config, { campaign_source: 'qr', campaign_medium: 'offline', campaign_name: 'store_qr' });
  raw('set', defaults());
  raw('js', new Date());
  // Exactly one automatic page_view. Do not also send a manual page_view.
  raw('config', GA_ID, config);
  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(loader);
  if (tagged && !context.qr_recorded) { track('qr_landing'); context.qr_recorded = true; save(); }
  if (categories.indexOf(page) >= 0 && page !== 'home') track('view_category', { category: page });
  if (page === 'custom') track('custom_view');
  // Covers every matching anchor, including links added dynamically to a recap.
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var target = destination(a.href);
    if (target) {
      var params = { link: target, from: page };
      if (a.dataset && a.dataset.moruCard) params.card = a.dataset.moruCard;
      track('outbound_click', params);
    }
  });
  var depths = {}, maxDepth = 0, seconds = 0, engaged = false;
  function reading(){
    if (document.hidden) return;
    var height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    // Short pages don't count as scrolled until the user actually scrolls.
    if (height <= window.innerHeight + 2 || window.scrollY <= 0) return;
    maxDepth = Math.max(maxDepth, Math.min(100, Math.round((window.scrollY + window.innerHeight) / height * 100)));
    [25, 50, 75, 90].forEach(function(d){
      if (maxDepth >= d && !depths[d]) { depths[d] = true; track('scroll_depth', { depth_percent: d }); }
    });
  }
  if (['moru', 'ring', 'earring', 'earcuff'].indexOf(page) >= 0) {
    window.addEventListener('scroll', reading, { passive: true });
    var ticker;
    function pulse(){
      if (document.hidden || (document.hasFocus && !document.hasFocus())) return;
      seconds += 1;
      if (!engaged && seconds >= 30 && maxDepth >= 50) {
        engaged = true; track('engaged_read', { category: page, visible_seconds: seconds });
        window.clearInterval(ticker);
      }
    }
    function startTicker(){ if (!engaged) ticker = window.setInterval(pulse, 1000); }
    startTicker();
    window.addEventListener('pagehide', function(){ window.clearInterval(ticker); });
    window.addEventListener('pageshow', function(e){ if (e.persisted) startTicker(); });
  }
})();

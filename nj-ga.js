/* nujeahmik — Google Analytics 4 (GA4)
   ★ 측정 ID는 이 파일의 GA_ID 한 줄만 바꾸면 됩니다 (G-로 시작하는 번호).
   - 사이트 주소(도메인·경로)가 바뀌어도 이 번호가 같으면 같은 GA 속성으로 계속 쌓입니다.
   - 번호가 자리표시자(G-XXXXXXXXXX)인 동안에는 아무것도 전송하지 않습니다.
   - 주소 끝에 ?ga_debug=1 을 붙이면 GA 관리 화면의 DebugView 에서 실시간으로 확인할 수 있습니다.

   모든 이벤트에 자동으로 붙는 값
     store     어느 매장 QR 로 들어왔는지 (main 본점 / yeonbang 연방점)
     site_lang 고른 언어 (ko / en / cn / jp)
     qr_entry  어느 품목 QR 로 들어왔는지 (moru / ring / earring / earcuff / home)
     page_name 지금 페이지 (index / home / moru / ring / earring / earcuff / custom) */
(function(){
  var GA_ID = 'G-H4GJZ6ZSWX';

  function get(s, k){ try{ return s.getItem(k); }catch(_){ return null; } }
  function set(s, k, v){ try{ s.setItem(k, v); }catch(_){} }
  var q = new URLSearchParams(location.search);
  var store = q.get('store') || get(localStorage, 'nj_store') || 'main';
  var lang  = q.get('lang')  || get(localStorage, 'nj_lang')  || 'ko';
  if (lang === 'tw') lang = 'cn';
  var page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/, '') || 'index';

  /* QR 입구: 언어 선택 화면(index)의 <body data-start="moru.html"> 로 품목 QR 을 구분합니다.
     한 번 들어오면 그 방문(탭)이 끝날 때까지 유지됩니다. */
  var entry;
  if (document.querySelector('[data-lang]')) {
    var ds = document.body && document.body.getAttribute('data-start');
    entry = ds ? ds.replace(/\.html?$/, '') : 'home';
    set(sessionStorage, 'nj_qr', entry);
  } else {
    entry = get(sessionStorage, 'nj_qr') || 'direct';
  }

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('set', { store: store, site_lang: lang, qr_entry: entry, page_name: page });

  if (/^G-X+$/.test(GA_ID) || window.__njGA) return;
  window.__njGA = true;
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, q.get('ga_debug') ? { debug_mode: true } : {});
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();

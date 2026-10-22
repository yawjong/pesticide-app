// 安裝到手機桌面的引導
// Android（Chrome、Edge、Samsung）：一鍵安裝
// iPhone（Safari）：圖示步驟「分享 → 加入主畫面」
// LINE 內建瀏覽器：自動改用手機瀏覽器開啟（LINE 裡無法加入主畫面）
(function () {
  var ua = navigator.userAgent || '';
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isStandalone) return;

  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isLine = /\bLine\//i.test(ua);
  var isFbIg = /FBAN|FBAV|Instagram/i.test(ua);
  var isIOSSafari = isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|GSA\//i.test(ua) && !isLine && !isFbIg;

  // LINE：加參數讓 LINE 自動用外部瀏覽器開啟
  if (isLine && !/openExternalBrowser=1/.test(location.search)) {
    var sep = location.search ? '&' : '?';
    location.replace(location.origin + location.pathname + location.search + sep + 'openExternalBrowser=1' + location.hash);
    return;
  }

  var DISMISS_KEY = 'install-dismissed-at';
  function dismissedRecently() {
    try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < 3 * 24 * 3600 * 1000; } catch (e) { return false; }
  }
  function remember() { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {} }

  var css = '' +
    '.ins-bar{position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--surface,#fff);border-top:1px solid var(--line,#dde3d6);' +
    'box-shadow:0 -6px 24px rgba(0,0,0,.12);padding:14px max(16px,env(safe-area-inset-right,0px)) calc(14px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));' +
    'font-family:var(--f-body,system-ui,sans-serif);color:var(--ink,#1d2419)}' +
    '.ins-in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px}' +
    '.ins-top{display:flex;align-items:center;gap:12px}' +
    '.ins-top img{width:44px;height:44px;border-radius:10px;flex:none}' +
    '.ins-top div{flex:1;min-width:0}' +
    '.ins-top b{display:block;font-size:16px}' +
    '.ins-top span{font-size:13px;color:var(--muted,#5d6857)}' +
    '.ins-x{border:0;background:transparent;font-size:22px;line-height:1;padding:6px;color:var(--muted,#5d6857);cursor:pointer}' +
    '.ins-go{border:0;border-radius:12px;background:var(--accent,#2f6b3a);color:#fff;font:inherit;font-size:17px;font-weight:700;padding:13px;cursor:pointer;width:100%}' +
    ':root[data-theme="dark"] .ins-go{color:#10200f}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ins-go{color:#10200f}}' +
    '.ins-steps{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-size:15px}' +
    '.ins-steps li{display:flex;align-items:center;gap:10px}' +
    '.ins-n{flex:none;width:24px;height:24px;border-radius:50%;background:var(--accent-soft,#e3eedf);color:var(--accent,#2f6b3a);font-weight:700;font-size:13px;display:grid;place-items:center}' +
    '.ins-ic{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:7px;background:var(--chip,#eef1ea);vertical-align:middle;margin:0 2px}' +
    '.ins-ic svg{width:18px;height:18px;stroke:#2f7cf6;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.ins-arrow{align-self:center;width:28px;height:28px;color:var(--accent,#2f6b3a);animation:insb 1.2s ease-in-out infinite}' +
    '@keyframes insb{50%{transform:translateY(6px)}}' +
    '@media (prefers-reduced-motion:reduce){.ins-arrow{animation:none}}' +
    '.ins-note{font-size:13px;color:var(--muted,#5d6857)}' +
    '.ins-url{display:flex;gap:8px}' +
    '.ins-url input{flex:1;min-width:0;font:inherit;font-size:14px;padding:9px 10px;border:1px solid var(--line,#dde3d6);border-radius:10px;background:var(--bg,#f3f5ef);color:inherit}' +
    '.ins-url button{border:1px solid var(--line,#dde3d6);background:var(--bg,#f3f5ef);border-radius:10px;padding:0 14px;font:inherit;cursor:pointer;color:inherit}' +
    'body.ins-open main{padding-bottom:220px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var shareIcon = '<span class="ins-ic"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg></span>';
  var addIcon = '<span class="ins-ic"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg></span>';
  var dotsIcon = '<span class="ins-ic"><svg viewBox="0 0 24 24" style="stroke:currentColor"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg></span>';

  var bar = null;
  function show(inner) {
    if (bar) bar.remove();
    bar = document.createElement('div');
    bar.className = 'ins-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', '安裝到手機桌面');
    bar.innerHTML = '<div class="ins-in"><div class="ins-top"><img src="icons/icon-192.png" alt="">' +
      '<div><b>把「農藥查詢」裝到桌面</b><span>之後像 App 一樣打開，沒有網路也能查</span></div>' +
      '<button class="ins-x" aria-label="先不要">×</button></div>' + inner + '</div>';
    document.body.appendChild(bar);
    document.body.classList.add('ins-open');
    bar.querySelector('.ins-x').onclick = hide;
    return bar;
  }
  function hide() {
    remember();
    if (bar) bar.remove();
    bar = null;
    document.body.classList.remove('ins-open');
  }

  function cleanUrl() { return location.origin + location.pathname; }
  function copyBox() {
    return '<div class="ins-url"><input id="ins-link" readonly value="' + cleanUrl() + '"><button id="ins-copy">複製</button></div>';
  }
  function bindCopy(b) {
    var btn = b.querySelector('#ins-copy'); if (!btn) return;
    btn.onclick = function () {
      var inp = b.querySelector('#ins-link');
      var done = function () { btn.textContent = '已複製'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(inp.value).then(done, function () { inp.select(); });
      } else { inp.select(); try { document.execCommand('copy'); done(); } catch (e) {} }
    };
  }

  // Android / 電腦 Chrome：系統安裝視窗
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (dismissedRecently()) return;
    var b = show('<button class="ins-go" id="ins-go">安裝到手機桌面</button>');
    b.querySelector('#ins-go').onclick = function () {
      deferred.prompt();
      deferred.userChoice.then(function (r) { if (r.outcome === 'accepted') { if (bar) bar.remove(); bar = null; document.body.classList.remove('ins-open'); } });
      deferred = null;
    };
  });
  window.addEventListener('appinstalled', function () { if (bar) bar.remove(); bar = null; document.body.classList.remove('ins-open'); });

  if (dismissedRecently()) return;

  window.addEventListener('load', function () {
    if (isIOSSafari) {
      show('<ol class="ins-steps">' +
        '<li><span class="ins-n">1</span><span>點螢幕下方的分享按鈕 ' + shareIcon + '</span></li>' +
        '<li><span class="ins-n">2</span><span>往下滑，點「加入主畫面」' + addIcon + '</span></li>' +
        '<li><span class="ins-n">3</span><span>點右上角「加入」就完成了</span></li></ol>' +
        '<svg class="ins-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16M5 13l7 7 7-7"/></svg>');
    } else if (isIOS) {
      var b1 = show('<div class="ins-note">iPhone 要用 <b>Safari</b> 才能裝到桌面。請複製下面的網址，打開 Safari 貼上。</div>' + copyBox());
      bindCopy(b1);
    } else if (isFbIg) {
      var b2 = show('<div class="ins-note">請點右上角「⋯」，選「用瀏覽器開啟」，再安裝。或複製網址到 Chrome 開啟：</div>' + copyBox());
      bindCopy(b2);
    } else if (isAndroid) {
      // 等 2 秒，若瀏覽器沒有一鍵安裝，就顯示手動步驟
      setTimeout(function () {
        if (deferred || bar) return;
        show('<ol class="ins-steps">' +
          '<li><span class="ins-n">1</span><span>點右上角的選單 ' + dotsIcon + '</span></li>' +
          '<li><span class="ins-n">2</span><span>點「加到主畫面」或「安裝應用程式」</span></li>' +
          '<li><span class="ins-n">3</span><span>再點「安裝」就完成了</span></li></ol>');
      }, 2000);
    }
  });
})();

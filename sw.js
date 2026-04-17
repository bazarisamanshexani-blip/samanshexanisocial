const CACHE = 'bazari-saman-v6';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>بازاڕی سامان — بێ ئینتەرنێت</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Tajawal","Geeza Pro",Arial,sans-serif;background:#060f1f;color:#e8f0ff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
.wrap{max-width:320px}
.ico{font-size:4rem;margin-bottom:20px;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
h1{font-size:1.3rem;font-weight:900;margin-bottom:10px;background:linear-gradient(135deg,#5aa3ff,#b8d9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
p{font-size:.82rem;color:rgba(184,217,255,.55);line-height:1.7;margin-bottom:24px}
button{background:linear-gradient(135deg,#2a6bc9,#5aa3ff);border:none;border-radius:100px;padding:11px 28px;font-family:"Tajawal","Geeza Pro",Arial,sans-serif;font-size:.85rem;font-weight:700;color:#fff;cursor:pointer}
</style>
</head>
<body>
<div class="wrap">
  <div class="ico">📶</div>
  <h1>پەیوەندی نییە</h1>
  <p>ئینتەرنێتت پەیوەندی نییە.<br>تکایە چێکی کەبڵ یان وایفایەکەت بکەرەوە.</p>
  <button onclick="location.reload()">دووبارە هەوڵبدەوە</button>
</div>
</body>
</html>`;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Supabase — network only
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', {headers:{'Content-Type':'application/json'}})));
    return;
  }

  // Navigation requests — offline fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('./index.html').then(r => r || new Response(OFFLINE_HTML, {headers:{'Content-Type':'text/html;charset=utf-8'}}))
      )
    );
    return;
  }

  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || new Response(OFFLINE_HTML, {headers:{'Content-Type':'text/html;charset=utf-8'}}));
      return cached || networkFetch;
    })
  );
});
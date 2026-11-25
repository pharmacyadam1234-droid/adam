// Service Worker — صيدلية آدم
// غيّر رقم النسخة عند كل تحديث كبير لإجبار المتصفح على تحميل الجديد
const CACHE = "adam-pharmacy-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // لا نتدخل بطلبات Firebase / Gemini / Cloudinary وغيرها من خارج الموقع
  if (url.origin !== self.location.origin) return;
  // الصفحة: الشبكة أولاً (لتصل التحديثات) ثم الكاش عند انقطاع الإنترنت
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // باقي الملفات: الكاش أولاً
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});

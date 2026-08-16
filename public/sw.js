const CACHE_NAME="pronostics-ia-v15-1";
const APP_SHELL=["/","/index.html","/manifest.webmanifest","/logo-pronostics-ia-pro.png","/icons/icon-192.png","/icons/icon-512.png","/icons/maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>Promise.all(APP_SHELL.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=="GET")return;
 if(u.origin===self.location.origin&&u.pathname.startsWith("/api/")){e.respondWith(fetch(r));return;}
 if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE_NAME).then(c=>c.put("/index.html",cp)).catch(()=>{});return res}).catch(()=>caches.match("/index.html")));return;}
 if(u.origin===self.location.origin){e.respondWith(fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(CACHE_NAME).then(c=>c.put(r,cp)).catch(()=>{})}return res}).catch(()=>caches.match(r)));}
});

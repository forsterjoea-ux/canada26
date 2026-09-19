/* Offline shell. Bump VERSION whenever index.html changes. */
const VERSION="ca26-app-v2", TILES="ca26-tiles";
const SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("ca26-app")&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url); if(e.request.method!=="GET")return;
  if(u.hostname==="tile.openstreetmap.org"){ /* street tiles you have looked at stay available offline */
    e.respondWith(caches.open(TILES).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;
      try{const r=await fetch(e.request);if(r.ok||r.type==="opaque"){c.put(e.request,r.clone());c.keys().then(k=>{if(k.length>1500)k.slice(0,200).forEach(x=>c.delete(x))})}return r}catch(err){return new Response("",{status:504})}}));return}
  if(u.origin!==location.origin)return; /* weather and routing go straight to the network */
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r.ok)caches.open(VERSION).then(c=>c.put(e.request,r.clone()));return r}).catch(()=>hit||caches.match("index.html"));
    return hit||net}));
});

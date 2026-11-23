// sw.js — service worker do app instalável (PWA)
// ------------------------------------------------------------------------
// Objetivo: o app abrir sem internet. Os dados já ficam no aparelho
// (localStorage + fila do nuvem.js); aqui só guardamos os ARQUIVOS do app.
//
// Estratégias (pensadas para não reviver o "a mudança não aparece"):
//  - Página (index.html): rede primeiro; sem rede, a última cópia guardada.
//  - Arquivos com ?v=N (js/css): cache primeiro. O ?v muda a cada versão,
//    então a URL nova nunca bate com a velha: atualização garantida.
//  - Outros arquivos do app (ícones, manifesto): cache, atualizando por trás.
//  - Bibliotecas e fontes de CDN: cache primeiro (versões fixas).
//  - /api/* e Supabase: NUNCA passam pelo cache (dados e IA são sempre ao vivo).
//
// Ao trocar a lógica deste arquivo, mude VERSAO: o cache antigo é apagado.
const VERSAO = 'v1';
const CACHE = 'financeiro-' + VERSAO;
const BASE = self.registration.scope;               // funciona na Vercel e no GitHub Pages
const INDEX = new URL('index.html', BASE).href;
const CDNS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];

// Na instalação, guarda a página e tudo que ela referencia com ?v= (lido do
// próprio index.html), para o primeiro uso offline já funcionar.
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try {
      const r = await fetch(INDEX, { cache: 'no-store' });
      if (r.ok) {
        const html = await r.clone().text();
        await c.put(INDEX, r);
        const urls = [...html.matchAll(/(?:src|href)="([^"]+\?v=\d+)"/g)].map((m) => new URL(m[1], BASE).href);
        urls.push(new URL('manifest.json', BASE).href, new URL('icones/icon-192.png', BASE).href);
        await Promise.all(urls.map((u) => c.add(u).catch(() => {})));
      }
    } catch (err) { /* sem rede na instalação: o cache enche no uso */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((n) => n.startsWith('financeiro-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function redePrimeiro(req) {
  const c = await caches.open(CACHE);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(INDEX, r.clone());
    return r;
  } catch (err) {
    return (await c.match(INDEX)) || Response.error();
  }
}

async function cachePrimeiro(req) {
  const c = await caches.open(CACHE);
  const achado = await c.match(req);
  if (achado) return achado;
  const r = await fetch(req);
  if (r.ok || r.type === 'opaque') c.put(req, r.clone());
  return r;
}

async function cacheAtualizando(req) {
  const c = await caches.open(CACHE);
  const achado = await c.match(req);
  const rede = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
  return achado || (await rede) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);

  if (u.origin === self.location.origin) {
    if (u.pathname.includes('/api/')) return;               // ao vivo
    if (req.mode === 'navigate') return e.respondWith(redePrimeiro(req));
    if (u.searchParams.has('v')) return e.respondWith(cachePrimeiro(req));
    return e.respondWith(cacheAtualizando(req));
  }
  if (CDNS.includes(u.hostname)) return e.respondWith(cachePrimeiro(req));
  // Supabase e qualquer outro domínio: direto na rede.
});

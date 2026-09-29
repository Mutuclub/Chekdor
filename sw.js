/* Checador Virtual — service worker mínimo.
   No guarda copias de la app: siempre carga la versión más reciente de GitHub.
   Solo muestra un aviso cuando el celular no tiene internet. */
const VERSION = 'chv-sw-1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return; // Supabase, imágenes, etc.: sin tocar
  e.respondWith(
    fetch(e.request).catch(() => new Response(
      '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Sin conexión</title></head>' +
      '<body style="margin:0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;' +
      'align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;color:#1A1D21">' +
      '<div><h1 style="font-size:22px;margin:0 0 12px">Sin conexión a internet</h1>' +
      '<p style="margin:0 0 20px;line-height:1.5">El checador necesita internet para registrar tu asistencia. ' +
      'Revisa tus datos móviles o el wifi e intenta de nuevo.</p>' +
      '<button onclick="location.reload()" style="font-size:16px;padding:12px 20px;border:0;' +
      'border-radius:8px;background:#1C2B45;color:#fff">Intentar de nuevo</button></div></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    ))
  );
});

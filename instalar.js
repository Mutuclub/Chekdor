/* Checador Virtual — instalación en el celular.
   Muestra una barra "Instalar en mi celular" solo en teléfonos y solo si la app
   todavía no está instalada. En iPhone muestra las instrucciones de Safari.
   Para volver a mostrarla desde un botón de la app: chvMostrarInstalacion() */
(function () {
  var COLOR = '#1C2B45';
  var CLAVE_OCULTO = 'chv_instalar_oculto_hasta';
  var ua = navigator.userAgent || '';
  var esIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var esAndroid = /Android/i.test(ua);
  var esSafariIOS = esIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|WhatsApp/i.test(ua);
  var esWebviewAndroid = esAndroid && (/; wv\)/.test(ua) || /FBAN|FBAV|Instagram|WhatsApp/i.test(ua));
  var promptDiferido = null;

  function instalada() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function leerOculto() { try { return Number(localStorage.getItem(CLAVE_OCULTO) || 0); } catch (e) { return 0; } }
  function ocultarPorDias(d) { try { localStorage.setItem(CLAVE_OCULTO, String(Date.now() + d * 864e5)); } catch (e) {} }

  // Registrar el service worker (necesario para que Android ofrezca "Instalar")
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptDiferido = e;
    if (!barra && (esAndroid || esIOS) && leerOculto() < Date.now()) mostrar();
    else if (barra) pintar();
  });
  window.addEventListener('appinstalled', function () { cerrar(); promptDiferido = null; });

  var estilos = '' +
    '#chv-inst{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#fff;color:#1A1D21;' +
    'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;border-top:3px solid ' + COLOR + ';' +
    'box-shadow:0 -6px 20px rgba(0,0,0,.18);padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));}' +
    '#chv-inst .fila{display:flex;gap:12px;align-items:flex-start;max-width:560px;margin:0 auto}' +
    '#chv-inst img{width:48px;height:48px;border-radius:11px;flex:none}' +
    '#chv-inst h2{font-size:17px;margin:0 0 4px;line-height:1.3}' +
    '#chv-inst p{font-size:15px;margin:0;line-height:1.45}' +
    '#chv-inst ol{font-size:15px;margin:6px 0 0;padding-left:20px;line-height:1.5}' +
    '#chv-inst .botones{display:flex;gap:10px;justify-content:flex-end;max-width:560px;margin:14px auto 0}' +
    '#chv-inst button{font:inherit;font-size:16px;min-height:44px;padding:0 18px;border-radius:8px;cursor:pointer}' +
    '#chv-inst .prim{background:' + COLOR + ';color:#fff;border:0;font-weight:600}' +
    '#chv-inst .sec{background:#fff;color:#1A1D21;border:1px solid #9AA3AB}' +
    '#chv-inst svg{vertical-align:-3px}';

  var icoCompartir = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + COLOR +
    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Compartir"><path d="M12 3v12"/>' +
    '<path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 002 2h10a2 2 0 002-2v-8"/></svg>';

  var barra = null;

  function contenido() {
    if (esIOS && !esSafariIOS) {
      return { t: 'Abre el checador en Safari',
        c: '<p>Para agregarlo a tu pantalla de inicio, copia el enlace y ábrelo en <b>Safari</b>.</p>',
        b: '<button class="prim" data-acc="copiar">Copiar enlace</button>' };
    }
    if (esIOS) {
      return { t: 'Agrega el checador a tu inicio',
        c: '<ol><li>Toca el botón Compartir ' + icoCompartir + ' abajo en Safari.</li>' +
           '<li>Elige <b>Agregar a pantalla de inicio</b>.</li><li>Toca <b>Agregar</b>.</li></ol>', b: '' };
    }
    if (promptDiferido) {
      return { t: 'Instala el checador en tu celular',
        c: '<p>Te quedará un ícono en la pantalla de inicio para abrirlo sin buscar el enlace.</p>',
        b: '<button class="prim" data-acc="instalar">Instalar</button>' };
    }
    if (esWebviewAndroid) {
      return { t: 'Abre el checador en Chrome',
        c: '<p>Toca el menú <b>⋮</b> de arriba y elige <b>Abrir en Chrome</b>. Ahí podrás instalarlo.</p>',
        b: '<button class="prim" data-acc="copiar">Copiar enlace</button>' };
    }
    return { t: 'Agrega el checador a tu inicio',
      c: '<ol><li>Toca el menú <b>⋮</b> de Chrome, arriba a la derecha.</li>' +
         '<li>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li><li>Confirma.</li></ol>', b: '' };
  }

  function pintar() {
    if (!barra) return;
    var k = contenido();
    barra.innerHTML = '<div class="fila"><img src="icon-192.png" alt=""><div><h2>' + k.t + '</h2>' + k.c +
      '</div></div><div class="botones"><button class="sec" data-acc="luego">Ahora no</button>' + k.b + '</div>';
  }

  function mostrar() {
    if (instalada() || barra) return;
    if (!document.getElementById('chv-inst-css')) {
      var s = document.createElement('style'); s.id = 'chv-inst-css'; s.textContent = estilos;
      document.head.appendChild(s);
    }
    barra = document.createElement('div');
    barra.id = 'chv-inst'; barra.setAttribute('role', 'dialog'); barra.setAttribute('aria-label', 'Instalar Checador Virtual');
    pintar();
    barra.addEventListener('click', function (e) {
      var acc = e.target.closest && e.target.closest('[data-acc]');
      if (!acc) return;
      acc = acc.getAttribute('data-acc');
      if (acc === 'luego') { ocultarPorDias(3); cerrar(); }
      if (acc === 'instalar' && promptDiferido) {
        promptDiferido.prompt();
        promptDiferido.userChoice.then(function (r) {
          promptDiferido = null;
          if (r.outcome === 'accepted') cerrar(); else pintar();
        });
      }
      if (acc === 'copiar') {
        var url = location.origin + location.pathname;
        var hecho = function () { acc = barra.querySelector('[data-acc="copiar"]'); if (acc) acc.textContent = 'Enlace copiado'; };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(hecho, function () { prompt('Copia este enlace:', url); });
        else prompt('Copia este enlace:', url);
      }
    });
    document.body.appendChild(barra);
  }

  function cerrar() { if (barra) { barra.remove(); barra = null; } }

  window.chvMostrarInstalacion = function () {
    if (instalada()) { alert('El Checador Virtual ya está instalado en este celular.'); return; }
    cerrar(); mostrar();
  };

  // Mostrar automáticamente solo en celulares, si no está instalada y no la pospusieron
  window.addEventListener('load', function () {
    if (instalada() || !(esAndroid || esIOS) || leerOculto() > Date.now()) return;
    // En Android esperamos un momento a que Chrome avise que se puede instalar
    setTimeout(mostrar, esAndroid ? 2500 : 800);
  });
})();

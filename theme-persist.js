// theme-persist.js v1 — Persistência independente do tema de cor e design pack
// Garante que tema sobrevive a expiração de sessão e recargas
(function(){
'use strict';

var THEME_KEY = 'finApp_theme_persist';
var PACK_KEY  = 'finApp_pack_persist';

// ================================================================
// SALVAR: interceptar setTheme e setDesignPack
// ================================================================

// Hook no setTheme (definido no index.html)
var _waitSetTheme = setInterval(function(){
  if(typeof window.setTheme !== 'function') return;
  clearInterval(_waitSetTheme);

  var _origSetTheme = window.setTheme;
  window.setTheme = function(t){
    _origSetTheme(t);
    // Salvar direto no localStorage (independente da sessão/S/cloud)
    try { localStorage.setItem(THEME_KEY, t); } catch(e){}
  };
}, 100);

// Hook no setDesignPack (definido no design-packs.js)
var _waitSetPack = setInterval(function(){
  if(typeof window.setDesignPack !== 'function') return;
  clearInterval(_waitSetPack);

  var _origSetPack = window.setDesignPack;
  window.setDesignPack = function(p){
    _origSetPack(p);
    try { localStorage.setItem(PACK_KEY, p); } catch(e){}
  };
}, 100);

// Timeout: parar de esperar após 10s
setTimeout(function(){
  clearInterval(_waitSetTheme);
  clearInterval(_waitSetPack);
}, 10000);

// ================================================================
// RESTAURAR: aplicar tema/pack IMEDIATAMENTE ao carregar
// ================================================================
function restoreTheme(){
  var savedTheme = null;
  var savedPack = null;

  // 1. Tentar localStorage direto (mais confiável)
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch(e){}
  try { savedPack = localStorage.getItem(PACK_KEY); } catch(e){}

  // 2. Fallback: tentar S.config (pode já existir se auth.js carregou)
  if(!savedTheme && typeof S !== 'undefined' && S && S.config && S.config.theme){
    savedTheme = S.config.theme;
  }
  if(!savedPack && typeof S !== 'undefined' && S && S.config && S.config.designPack){
    savedPack = S.config.designPack;
  }

  // Aplicar tema de cor
  if(savedTheme){
    // Remover todos os temas existentes
    var temas = ['dark','light','midnight','forest','wine','coffee'];
    temas.forEach(function(t){
      document.body.classList.remove('theme-' + t);
    });
    document.body.classList.add('theme-' + savedTheme);

    // Sincronizar com S se possível
    if(typeof S !== 'undefined' && S && S.config){
      S.config.theme = savedTheme;
    }
  }

  // Aplicar design pack
  if(savedPack && savedPack !== 'classic'){
    var packs = ['neon','glass','minimal','gradient'];
    packs.forEach(function(p){
      document.body.classList.remove('pack-' + p);
    });
    document.body.classList.add('pack-' + savedPack);

    if(typeof S !== 'undefined' && S && S.config){
      S.config.designPack = savedPack;
    }
  }
}

// Aplicar imediatamente
restoreTheme();

// Também após delays (para cobrir cenários onde auth.js carrega depois)
setTimeout(restoreTheme, 500);
setTimeout(restoreTheme, 1500);
setTimeout(restoreTheme, 3000);

// Quando S mudar (após login/sync), restaurar novamente
var _origRenderAll2 = window.renderAll;
if(_origRenderAll2){
  window.renderAll = function(){
    _origRenderAll2.apply(this, arguments);
    // Após renderAll, o tema pode ter sido resetado — reaplicar
    setTimeout(restoreTheme, 100);
  };
}

// Observer: quando o auth overlay desaparece (login concluído)
var _authOvCheck = setInterval(function(){
  var ov = document.getElementById('authOverlay');
  if(!ov) return;
  clearInterval(_authOvCheck);
  var obs = new MutationObserver(function(){
    if(ov.classList.contains('hiding')){
      setTimeout(restoreTheme, 300);
      setTimeout(restoreTheme, 800);
      // Também salvar o que está no S para o localStorage
      setTimeout(function(){
        if(typeof S !== 'undefined' && S && S.config){
          if(S.config.theme) try { localStorage.setItem(THEME_KEY, S.config.theme); } catch(e){}
          if(S.config.designPack) try { localStorage.setItem(PACK_KEY, S.config.designPack); } catch(e){}
        }
      }, 1500);
    }
  });
  obs.observe(ov, { attributes: true });
}, 200);
setTimeout(function(){ clearInterval(_authOvCheck); }, 15000);

console.log('[Financeiro Pro] theme-persist.js v1 — Tema persistente carregado.');
})();

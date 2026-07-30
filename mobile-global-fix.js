// mobile-global-fix.js v1 — Correção global de zoom mobile para TODAS as telas
// Adicionar como último <script> no index.html
// NÃO precisa alterar nenhum outro arquivo.
(function(){
'use strict';

// ================================================================
// 1. CSS GLOBAL — Anti-zoom + Responsividade Planejamento + Lançamentos
// ================================================================
// CSS movido para app.css (bloco 1 deste arquivo)


// ================================================================
// 2. JS: Interceptar renderAll / addLanc para corrigir zoom pós-ação
// ================================================================
// O zoom acontece porque após renderAll() ou addLanc(), um elemento
// pode momentaneamente exceder a viewport antes do CSS ser aplicado.
// Forçamos um reset de scroll após cada render.

function resetMobileScroll() {
  if (window.innerWidth > 768) return;
  // Garantir que o body não ficou expandido
  requestAnimationFrame(function() {
    if (document.documentElement.scrollLeft > 0) {
      document.documentElement.scrollLeft = 0;
    }
    if (document.body.scrollLeft > 0) {
      document.body.scrollLeft = 0;
    }
    // Forçar reflow controlado
    var main = document.querySelector('.main');
    if (main && main.scrollWidth > main.clientWidth) {
      main.style.overflow = 'hidden';
      void main.offsetHeight; // force reflow
      main.style.overflow = '';
    }
  });
}

// Interceptar renderAll
var _origRenderAll = window.renderAll;
if (_origRenderAll) {
  window.renderAll = function() {
    _origRenderAll.apply(this, arguments);
    resetMobileScroll();
  };
}

// Interceptar addLanc — esse é o principal causador do zoom pós-lançamento
var _origAddLanc = window.addLanc;
if (_origAddLanc) {
  window.addLanc = function() {
    _origAddLanc.apply(this, arguments);
    // Delay duplo: o addLanc chama renderAll que chama renderLancs com setTimeout
    setTimeout(resetMobileScroll, 50);
    setTimeout(resetMobileScroll, 200);
    setTimeout(resetMobileScroll, 500);
  };
}

// Interceptar addCompra
var _origAddCompra = window.addCompra;
if (_origAddCompra) {
  window.addCompra = function() {
    _origAddCompra.apply(this, arguments);
    setTimeout(resetMobileScroll, 50);
    setTimeout(resetMobileScroll, 200);
  };
}

// Interceptar addContrato
var _origAddContrato = window.addContrato;
if (_origAddContrato) {
  window.addContrato = function() {
    _origAddContrato.apply(this, arguments);
    setTimeout(resetMobileScroll, 50);
    setTimeout(resetMobileScroll, 200);
  };
}

// Interceptar addPlan
var _origAddPlan2 = window.addPlan;
if (_origAddPlan2) {
  window.addPlan = function() {
    _origAddPlan2.apply(this, arguments);
    setTimeout(resetMobileScroll, 50);
    setTimeout(resetMobileScroll, 200);
  };
}

// Ao trocar de tela, resetar scroll — via hook do registro, sem embrulhar nav()
if (typeof onNavigate === 'function') {
  onNavigate(function(){
    setTimeout(resetMobileScroll, 50);
    setTimeout(resetMobileScroll, 150);
  });
}


// ================================================================
// 3. OBSERVER: vigilância contínua contra overflow
// ================================================================
// Em último caso, se qualquer mutação causar overflow, corrigimos automaticamente
if (window.innerWidth <= 768) {
  var overflowGuard = null;
  var mo = new MutationObserver(function() {
    if (overflowGuard) clearTimeout(overflowGuard);
    overflowGuard = setTimeout(function() {
      if (document.body.scrollWidth > window.innerWidth) {
        resetMobileScroll();
      }
    }, 100);
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

// ================================================================
// 4. IMPEDIR ZOOM POR DOUBLE-TAP acidental no iOS
// ================================================================
// O touch-action: manipulation já impede double-tap zoom no CSS moderno
// CSS movido para app.css (bloco 2 deste arquivo)


console.log('[Financeiro Pro] mobile-global-fix.js v1 — Anti-zoom global carregado.');
})();

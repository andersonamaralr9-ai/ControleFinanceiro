// mobile-global-fix.js v1 — Correção global de zoom mobile para TODAS as telas
// Adicionar como último <script> no index.html
// NÃO precisa alterar nenhum outro arquivo.
(function(){
'use strict';

// ================================================================
// 1. CSS GLOBAL — Anti-zoom + Responsividade Planejamento + Lançamentos
// ================================================================
var sty = document.createElement('style');
sty.textContent = `

/* ╔══════════════════════════════════════════╗
   ║  ANTI-ZOOM GLOBAL                        ║
   ╚══════════════════════════════════════════╝ */

@media (max-width: 768px) {

  /* === REGRA MESTRE: impedir qualquer overflow horizontal === */
  html, body {
    overflow-x: hidden !important;
    max-width: 100vw !important;
  }
  .main {
    overflow-x: hidden !important;
    max-width: 100vw !important;
    width: 100% !important;
  }
  .page {
    overflow-x: hidden !important;
    max-width: 100% !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  /* Garantir que page-title não force zoom */
  .page-title {
    font-size: 1.1em !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }

  /* === FORMULÁRIOS: impedir input zoom no iOS (font-size < 16px = zoom) === */
  input[type="text"],
  input[type="number"],
  input[type="date"],
  input[type="month"],
  input[type="password"],
  select,
  textarea,
  .form-control {
    font-size: 16px !important;
  }

  /* === TOAST (se existir) — não pode exceder viewport === */
  .toast, [class*="toast"] {
    max-width: calc(100vw - 32px) !important;
    word-break: break-word !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  PLANEJAMENTO — MOBILE                   ║
     ╚══════════════════════════════════════════╝ */

  /* Summary cards: 2 colunas compactas */
  .pl-summary {
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }
  .pl-scard {
    padding: 10px 8px !important;
  }
  .pl-scard .pl-scard-label {
    font-size: .6em !important;
    letter-spacing: .5px !important;
  }
  .pl-scard .pl-scard-value {
    font-size: .95em !important;
  }

  /* Category cards: 1 coluna, mais compactos */
  .pl-cats-grid {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }
  .pl-cat-card {
    padding: 12px !important;
  }
  .pl-cat-card-header h4 {
    font-size: .85em !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    min-width: 0 !important;
  }
  .pl-cat-card-info {
    font-size: .75em !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
  }
  .pl-cat-card-info span {
    min-width: 0 !important;
    flex: 1 !important;
  }
  .pl-cat-card-info .pl-val {
    font-size: .85em !important;
    word-break: break-all !important;
  }
  .pl-cat-card-actions {
    margin-top: 8px !important;
  }
  .pl-cat-card-actions .btn {
    padding: 5px 10px !important;
    font-size: .7em !important;
  }

  /* Botão copiar mês anterior */
  .pl-btn-copy .btn {
    width: 100% !important;
    text-align: center !important;
    display: block !important;
    font-size: .8em !important;
    padding: 10px !important;
  }

  /* Despesas sem orçamento */
  .pl-no-budget {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }
  .pl-no-budget-item {
    flex-wrap: wrap !important;
    gap: 6px !important;
    padding: 10px 12px !important;
  }
  .pl-no-budget-item .pl-nb-cat {
    flex: 1 1 100% !important;
    font-size: .82em !important;
    min-width: 0 !important;
    word-break: break-word !important;
  }
  .pl-no-budget-item .pl-nb-val {
    font-size: .8em !important;
    margin: 0 !important;
  }
  .pl-no-budget-item .btn {
    font-size: .7em !important;
    padding: 5px 10px !important;
    flex-shrink: 0 !important;
  }

  /* Tabela comparativa 3 meses — scroll horizontal controlado */
  .pl-section {
    padding: 12px !important;
    overflow-x: hidden !important;
  }
  .pl-section h3 {
    font-size: .85em !important;
  }
  .pl-section > div[style*="overflow-x"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    margin-left: -12px !important;
    margin-right: -12px !important;
    padding: 0 12px !important;
  }
  .pl-comp-table {
    min-width: 580px !important;
    font-size: .68em !important;
  }
  .pl-comp-table th,
  .pl-comp-table td {
    padding: 5px 4px !important;
    white-space: nowrap !important;
  }
  .pl-comp-table .pl-comp-cat {
    max-width: 80px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  LANÇAMENTOS — FIX ZOOM PÓS-ADICIONAR   ║
     ╚══════════════════════════════════════════╝ */

  /* Mobile cards do lançamento/extrato/compras — impedir overflow */
  .mc {
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  .mc-desc {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
    max-width: 100% !important;
  }
  .mc-top {
    max-width: 100% !important;
    overflow: hidden !important;
  }
  .mc-val {
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    max-width: 45% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    font-size: .95em !important;
  }
  .mc-date {
    flex-shrink: 0 !important;
    max-width: 50% !important;
  }
  .mc-meta {
    max-width: 100% !important;
    overflow: hidden !important;
  }
  .mc-left {
    min-width: 0 !important;
    overflow: hidden !important;
    flex: 1 !important;
  }
  .mc-left .badge {
    flex-shrink: 0 !important;
    max-width: 70px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .mc-obs {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }

  /* Formulário de lançamento */
  #pg-lancs .form-section,
  #pg-compras .form-section,
  #pg-contratos .form-section,
  #pg-cartoes .form-section {
    max-width: 100% !important;
    overflow: hidden !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  CONTRATOS & ASSINATURAS — OVERFLOW FIX  ║
     ╚══════════════════════════════════════════╝ */

  .sub-grid {
    max-width: 100% !important;
    overflow: hidden !important;
  }
  .sub-box {
    max-width: 100% !important;
    overflow: hidden !important;
  }
  .sub-box-header {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
  }
  .sub-box-body p {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }
  .sub-valor {
    word-break: break-all !important;
  }
  .sub-box-actions {
    flex-wrap: wrap !important;
    gap: 4px !important;
  }
  .sub-box-actions .btn {
    font-size: .7em !important;
    padding: 5px 8px !important;
  }

  /* Filtros de contratos/assinaturas */
  .filter-sub {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 6px !important;
    max-width: 100% !important;
  }
  .filter-sub .form-control {
    max-width: 100% !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  CARTÕES — CC GRID                       ║
     ╚══════════════════════════════════════════╝ */

  .cc-grid {
    grid-template-columns: 1fr !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }
  .cc-card {
    max-width: 100% !important;
    overflow: hidden !important;
    word-break: break-word !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  EXTRATO CATEGORIZADO — COMP ROWS        ║
     ╚══════════════════════════════════════════╝ */

  .cat-row {
    grid-template-columns: minmax(0, 1fr) 80px 80px !important;
    padding: 8px 10px !important;
    max-width: 100% !important;
  }
  .cat-row .cat-name {
    font-size: .78em !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  .cat-row .cat-val {
    font-size: .75em !important;
    padding: 2px 4px !important;
    word-break: break-all !important;
  }

  .comp-row {
    grid-template-columns: minmax(0, 1fr) 70px 70px 70px !important;
    padding: 6px 8px !important;
    font-size: .72em !important;
    max-width: 100% !important;
  }
  .comp-row span {
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .comp-val {
    font-size: .72em !important;
    word-break: break-all !important;
  }
  .comp-diff {
    font-size: .65em !important;
    word-break: break-all !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  INVESTIMENTOS                            ║
     ╚══════════════════════════════════════════╝ */

  #pg-investimentos {
    overflow-x: hidden !important;
    max-width: 100% !important;
  }
  #pg-investimentos * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  BALANCETE                                ║
     ╚══════════════════════════════════════════╝ */

  #pg-balancete {
    overflow-x: hidden !important;
  }
  #balArea {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    max-width: 100% !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  MODAIS — IMPEDIR OVERFLOW               ║
     ╚══════════════════════════════════════════╝ */

  .modal-content {
    max-width: 98vw !important;
    overflow-x: hidden !important;
  }
  .modal-body {
    overflow-x: hidden !important;
    word-break: break-word !important;
  }
  .modal-body * {
    max-width: 100% !important;
  }

  /* ╔══════════════════════════════════════════╗
     ║  HISTÓRICO MODAL — melhorias.js           ║
     ╚══════════════════════════════════════════╝ */

  .hist-item {
    font-size: .78em !important;
    padding: 6px 8px !important;
    flex-wrap: wrap !important;
    gap: 4px !important;
  }
  .hist-item .hist-vigencia {
    font-size: .65em !important;
  }
  .hist-item .hist-diff {
    font-size: .68em !important;
    margin-left: 0 !important;
  }

} /* end max-width:768px */


/* === ULTRA-SMALL SCREENS === */
@media (max-width: 380px) {
  .pl-summary {
    grid-template-columns: 1fr !important;
    gap: 6px !important;
  }
  .pl-scard .pl-scard-value {
    font-size: .85em !important;
  }
  .cat-row {
    grid-template-columns: minmax(0, 1fr) 65px 65px !important;
  }
  .comp-row {
    grid-template-columns: minmax(0, 1fr) 55px 55px 55px !important;
    font-size: .65em !important;
  }
  .mc-val {
    font-size: .85em !important;
  }
  .sub-box-header {
    font-size: .82em !important;
  }
}

`; // end CSS
document.head.appendChild(sty);


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

// Interceptar nav — ao trocar de tela, resetar scroll
var _origNav2 = window.nav;
if (_origNav2) {
  window.nav = function() {
    _origNav2.apply(this, arguments);
    setTimeout(resetMobileScroll, 50);
    setTimeout(resetMobileScroll, 150);
  };
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
var metaFix = document.createElement('style');
metaFix.textContent = '* { touch-action: manipulation; }';
document.head.appendChild(metaFix);


console.log('[Financeiro Pro] mobile-global-fix.js v1 — Anti-zoom global carregado.');
})();

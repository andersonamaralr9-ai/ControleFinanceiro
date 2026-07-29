// design-system.js v1 — Identidade visual unificada (neobank)
// Carregado POR ÚLTIMO: vence a cascata dos demais arquivos que injetam <style>.
// Cobre desktop + mobile, todas as páginas.
(function(){
'use strict';

// ================================================================
// 1. TOKENS + CSS GLOBAL
// ================================================================
var sty = document.createElement('style');
sty.id = 'designSystemCSS';
sty.textContent = `
/* ─────────── TOKENS (tema escuro padrão) ─────────── */
:root{
  --bg:#14151d; --bg2:#1e2029; --bg3:#282a35; --bg4:#343643;
  --tx:#f5f5f8; --tx2:#a8abbd; --tx3:#7d7f92;
  --pri:#8b5cf6; --pri2:#a78bfa;
  --priG:linear-gradient(135deg,#8b5cf6,#6d28d9);
  --ok:#2fd480; --ok2:#5ee5a0;
  --dn:#e8384f; --dn2:#ff5c72;
  --wn:#ffbe5c; --inf:#5aa8ff; --inf2:#7ec2ff;
  --rad:18px;
  --sh:0 2px 16px rgba(0,0,0,.28);
}

/* ─────────── SENTENÇA no lugar de CAIXA ALTA ───────────
   Mantém uppercase só onde o layout aprovado pede:
   grupos da sidebar e o rótulo do card de saldo (hero).      */
.card .card-label,
.rc6-lbl,
.chart-box h3,
.ih-title,
.ih-lbl,
.inv-klbl,
.inv-pkl,
.inv-clbl,
.inv-ifrm-lbl,
.inv-hist-sec-lbl,
.top-cat-hdr,
.rm-sh{
  text-transform:none !important;
  letter-spacing:.1px !important;
}
.card .card-label{ font-size:.8em !important; color:var(--tx2) !important; font-weight:600 !important; }
.rc6-lbl{ font-size:.8em !important; color:var(--tx2) !important; font-weight:600 !important; }
.chart-box h3{ font-size:.85em !important; color:var(--tx) !important; font-weight:700 !important; }
.ih-title{ font-size:.85em !important; color:var(--tx) !important; font-weight:700 !important; }
.ih-lbl{ font-size:.76em !important; color:var(--tx3) !important; }
.inv-klbl{ font-size:.74em !important; color:var(--tx2) !important; }
.inv-pkl{ font-size:.72em !important; color:var(--tx2) !important; }

/* ─────────── CABEÇALHO DA PÁGINA (título + nav de mês em pílula) ─────────── */
.pg-head{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:16px; margin-bottom:22px; flex-wrap:wrap;
}
.pg-head-left{ min-width:0; }
.pg-head .page-title{ margin-bottom:3px !important; }
.pg-head .page-subtitle{ margin-bottom:0 !important; }
.pg-head .month-nav{ margin-bottom:0 !important; flex-shrink:0; }

.month-nav{
  background:var(--bg2); border:1px solid var(--bg4);
  border-radius:12px; padding:5px 6px; gap:2px !important;
}
.month-nav .btn,
.month-nav .btn-outline{
  background:none !important; border:none !important;
  color:var(--tx2) !important; padding:5px 10px !important;
  font-size:.95em !important; min-width:auto !important;
}
.month-nav .btn:hover{ color:var(--pri2) !important; background:var(--bg3) !important; }
.month-nav .mes-label{
  font-size:.86em !important; font-weight:700 !important;
  min-width:auto !important; padding:0 6px; white-space:nowrap;
}

/* ─────────── SIDEBAR: marca + ícones geométricos ─────────── */
.sidebar-profile{ display:none !important; }

.ds-brand{
  display:flex; align-items:center; gap:11px;
  padding:20px 18px 20px; margin-bottom:6px;
}
.ds-brand-logo{
  width:34px; height:34px; border-radius:11px;
  background:var(--priG); color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:.9rem; flex-shrink:0;
}
.ds-brand-name{ font-size:.95em; font-weight:700; color:var(--tx); letter-spacing:-.2px; }

.sidebar .group-label{
  padding:14px 18px 5px !important;
  font-size:.63em !important; letter-spacing:1.6px !important;
  color:var(--tx3) !important; font-weight:700 !important;
}
.sidebar .sep{ display:none !important; }

.sidebar a{
  gap:11px !important; padding:9px 18px !important; margin:1px 0 !important;
  border-radius:0 !important; font-size:.85em !important;
  color:var(--tx2) !important; font-weight:500 !important;
  position:relative;
}
.sidebar a:hover{ background:rgba(255,255,255,.04) !important; color:var(--tx) !important; }
.sidebar a.active{
  color:var(--tx) !important; font-weight:700 !important;
  background:rgba(139,92,246,.10) !important;
}
.sidebar a.active::before{
  content:''; position:absolute; left:0; top:6px; bottom:6px;
  width:3px; background:var(--pri2); border-radius:0 3px 3px 0;
}
.ds-ic{
  display:inline-block; width:18px; text-align:center;
  font-size:1em; opacity:.85; flex-shrink:0;
}
.sidebar a.active .ds-ic{ opacity:1; color:var(--pri2); }

/* ─────────── CARD DE INVESTIMENTOS: ícone em quadrado ─────────── */
.ih-title{ display:flex !important; align-items:center; gap:9px; }
.ih-title::before{
  content:'\\2197';
  width:26px; height:26px; border-radius:9px;
  background:rgba(139,92,246,.18); color:var(--pri2);
  display:flex; align-items:center; justify-content:center;
  font-size:.85em; flex-shrink:0;
}

/* ─────────── SUPERFÍCIES ─────────── */
.card, .chart-box, .form-section, .table-wrap, .rc6, .ih-card{
  border-color:rgba(255,255,255,.07) !important;
}
.card:hover{ transform:none !important; }

/* ─────────── TABELAS ─────────── */
th{ font-size:.7em !important; color:var(--tx3) !important; letter-spacing:.8px !important; }
td{ font-size:.86em !important; }

/* ─────────── MOBILE ─────────── */
@media(max-width:768px){
  .pg-head{ flex-direction:column; align-items:stretch; gap:10px; margin-bottom:14px; }
  .pg-head .month-nav{ width:100%; justify-content:center; }
  .ds-brand{ padding:16px 16px 14px; }
  .sidebar a{ padding:11px 16px !important; font-size:.88em !important; }
  .sidebar .group-label{ padding:12px 16px 4px !important; }
  .card .card-label{ font-size:.74em !important; }
  .rc6-lbl{ font-size:.76em !important; }
  .chart-box h3{ font-size:.82em !important; }
  .mobile-header .mob-title{
    background:none !important; -webkit-text-fill-color:var(--tx) !important;
    color:var(--tx) !important;
  }
}
`;
document.head.appendChild(sty);

// ================================================================
// 2. ÍCONES DA NAVEGAÇÃO (geométricos, no lugar dos emoji)
// ================================================================
var ICONES = {
  'nav-resumo':        '▦', // ▦
  'nav-lancs':         '↕', // ↕
  'nav-contratos':     '▤', // ▤
  'nav-extrato':       '☰', // ☰
  'nav-extratoCat':    '▧', // ▧
  'nav-balancete':     '▥', // ▥
  'nav-checkpag':      '✓', // ✓
  'nav-cartoes':       '▭', // ▭
  'nav-compras':       '⊞', // ⊞
  'nav-assinaturas':   '↻', // ↻
  'nav-planejamento':  '◎', // ◎
  'nav-investimentos': '↗', // ↗
  'nav-patrimonio':    '⌂', // ⌂
  'nav-relatorios':    '◫', // ◫
  'nav-config':        '⚙', // ⚙
  'nav-backup':        '☁'  // ☁
};

// Remove emoji/simbolo inicial do texto, preservando o rotulo.
// Faixas: espacos, simbolos U+2000-U+32FF, pares substitutos (emoji U+1F000+)
// e seletores de variacao. Letras acentuadas permanecem intactas.
var RE_SIMBOLO_INICIAL = /^(?:[\s ]|[ -㋿]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[︀-️])+/;

function limpaRotulo(txt){
  return (txt || '').replace(RE_SIMBOLO_INICIAL, '').trim();
}

function aplicaIcones(){
  Object.keys(ICONES).forEach(function(id){
    var a = document.getElementById(id);
    if(!a || a.dataset.dsIcon === '1') return;
    var rotulo = limpaRotulo(a.textContent);
    a.innerHTML = '<span class="ds-ic">' + ICONES[id] + '</span><span>' + rotulo + '</span>';
    a.dataset.dsIcon = '1';
  });
}

// ================================================================
// 3. MARCA NA SIDEBAR (substitui avatar + nome do usuário)
// ================================================================
function aplicaMarca(){
  var sb = document.getElementById('sidebar');
  if(!sb || document.getElementById('dsBrand')) return;
  var brand = document.createElement('div');
  brand.id = 'dsBrand';
  brand.className = 'ds-brand';
  brand.innerHTML = '<div class="ds-brand-logo">$</div><div class="ds-brand-name">Financeiro</div>';
  sb.insertBefore(brand, sb.firstChild);
}

// ================================================================
// 4. CABEÇALHO DAS PÁGINAS (título à esquerda, mês em pílula à direita)
// ================================================================
function montaCabecalhos(){
  document.querySelectorAll('.page').forEach(function(pg){
    if(pg.querySelector('.pg-head')) return;
    var titulo = pg.querySelector('.page-title');
    if(!titulo) return;

    // tira emoji do título
    if(titulo.dataset.dsClean !== '1'){
      titulo.textContent = limpaRotulo(titulo.textContent);
      titulo.dataset.dsClean = '1';
    }

    var sub  = pg.querySelector('.page-subtitle');
    var mes  = pg.querySelector('.month-nav');

    var head = document.createElement('div');
    head.className = 'pg-head';
    var left = document.createElement('div');
    left.className = 'pg-head-left';

    titulo.parentNode.insertBefore(head, titulo);
    left.appendChild(titulo);
    if(sub) left.appendChild(sub);
    head.appendChild(left);
    if(mes) head.appendChild(mes);
  });
}

// ================================================================
// 5. APLICAR (e reaplicar quando outros scripts injetam itens)
// ================================================================
// Remove emoji do início de títulos de painel em qualquer página
function limpaTitulosPainel(){
  document.querySelectorAll('.chart-box h3, .sub-box-header, .rm-sh').forEach(function(el){
    if(el.dataset.dsClean === '1' || el.children.length) return;
    var limpo = limpaRotulo(el.textContent);
    if(limpo && limpo !== el.textContent) el.textContent = limpo;
    el.dataset.dsClean = '1';
  });
}

function aplicaTudo(){
  aplicaMarca();
  aplicaIcones();
  montaCabecalhos();
  limpaTitulosPainel();
}

aplicaTudo();

// Outros arquivos injetam links de menu e páginas depois — observa e reaplica.
var sb = document.getElementById('sidebar');
if(sb && window.MutationObserver){
  new MutationObserver(function(){ aplicaIcones(); })
    .observe(sb, { childList:true });
}
var main = document.querySelector('.main');
if(main && window.MutationObserver){
  new MutationObserver(function(){ montaCabecalhos(); })
    .observe(main, { childList:true });
}
document.addEventListener('DOMContentLoaded', aplicaTudo);
setTimeout(aplicaTudo, 300);
setTimeout(aplicaTudo, 1200);

console.log('[Financeiro Pro] Design System v1 — identidade unificada aplicada.');
})();

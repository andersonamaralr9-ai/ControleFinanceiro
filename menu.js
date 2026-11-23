// menu.js v1 — Menu lateral em 5 áreas (aprovado em 23/11/2026)
// ------------------------------------------------------------------------
// Eram 18 itens em grupos que misturavam assuntos ("Lançamentos" tinha
// Extrato e Balancete; "Planejamento" tinha Investimentos). Agora:
//   Início · Movimentos · Planejar · Patrimônio · Relatórios · (Sistema)
// Nenhuma tela mudou: só a ordem e os títulos do menu.
//
// Vários itens são criados pelos próprios módulos (Check de Pagamentos,
// Extrato Categorizado, Relatórios, Lixeira, Assistente), alguns depois do
// carregamento. Por isso a organização é por id, idempotente, e roda de novo
// quando um item novo aparece no menu. Página nova: ponha o id do link em
// AREAS; se esquecer, ela cai em "Outros", antes de Sistema (nunca some).
(function(){
'use strict';

var AREAS = [
  { titulo: 'Início',      ids: ['nav-resumo', 'nav-ia'] },
  { titulo: 'Movimentos',  ids: ['nav-lancs', 'nav-checkpag', 'nav-cartoes', 'nav-compras', 'nav-assinaturas', 'nav-contratos'] },
  { titulo: 'Planejar',    ids: ['nav-planejamento'] },
  { titulo: 'Patrimônio',  ids: ['nav-investimentos', 'nav-patrimonio'] },
  { titulo: 'Relatórios',  ids: ['nav-extrato', 'nav-extratoCat', 'nav-balancete', 'nav-relatorios'] },
  { titulo: 'Outros',      ids: [] },   // preenchido com o que não estiver listado
  { titulo: 'Sistema',     ids: ['nav-config', 'nav-lixeira', 'nav-backup'] }
];

var ocupado = false;

function organizar(){
  var sb = document.getElementById('sidebar');
  if(!sb || ocupado) return;
  ocupado = true;
  try {
    var fim = sb.querySelector('.sync-bar');          // tudo entra antes da barra de sincronização
    var conhecidos = {};
    AREAS.forEach(function(a){ a.ids.forEach(function(id){ conhecidos[id] = 1; }); });
    var soltos = Array.prototype.filter.call(sb.querySelectorAll('a[id^="nav-"]'), function(a){ return !conhecidos[a.id]; });

    // Títulos antigos saem; os novos são marcados para não duplicar.
    Array.prototype.forEach.call(sb.querySelectorAll('.group-label'), function(g){ g.remove(); });

    AREAS.forEach(function(area){
      var links = area.titulo === 'Outros' ? soltos :
        area.ids.map(function(id){ return document.getElementById(id); }).filter(Boolean);
      if(!links.length) return;
      var t = document.createElement('div');
      t.className = 'group-label';
      t.setAttribute('data-menu', '1');
      t.textContent = area.titulo;
      sb.insertBefore(t, fim);
      links.forEach(function(a){ sb.insertBefore(a, fim); });
    });
  } finally {
    ocupado = false;
  }
}

// Reorganiza quando um módulo acrescenta um link depois (ex.: relatorios.js).
function observar(){
  var sb = document.getElementById('sidebar');
  if(!sb || !window.MutationObserver) return;
  new MutationObserver(function(muts){
    if(ocupado) return;
    var novo = muts.some(function(m){
      return Array.prototype.some.call(m.addedNodes, function(n){
        return n.nodeType === 1 && n.tagName === 'A' && /^nav-/.test(n.id || '') && !n.__menuVisto;
      });
    });
    if(novo){
      Array.prototype.forEach.call(sb.querySelectorAll('a[id^="nav-"]'), function(a){ a.__menuVisto = 1; });
      organizar();
    }
  }).observe(sb, { childList: true });
}

function iniciar(){
  organizar();
  var sb = document.getElementById('sidebar');
  if(sb) Array.prototype.forEach.call(sb.querySelectorAll('a[id^="nav-"]'), function(a){ a.__menuVisto = 1; });
  observar();
}

window.organizarMenu = organizar;
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
window.addEventListener('load', organizar);
})();

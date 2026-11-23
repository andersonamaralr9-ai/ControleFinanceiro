// alertas.js v1 — Avisos no app (nov/2026)
// ------------------------------------------------------------------------
// Calcula, sempre para o MÊS ATUAL (o de hoje, não o navegado):
//  - Orçamento: categoria com limite a partir de 80% (aviso) ou acima de 100%.
//  - Contas: contrato ou fatura de cartão vencendo em até 5 dias, ou atrasada,
//    que ainda não foi marcada no Check de Pagamentos; lançamento futuro
//    (data marcada para os próximos 5 dias) ainda não pago.
//  - Mês no vermelho: despesas do mês maiores que as receitas.
//  - Metas: prazo vencido sem atingir, ou vencendo neste mês.
// Mostra no topo do Resumo e marca o número no "Início" da barra inferior e no
// menu. Cada aviso pode ser dispensado; volta se piorar (ex.: de 80% para
// estourado) ou no mês seguinte. Dispensados ficam só neste aparelho.
//
// "Pago" segue a mesma chave do checkpagamentos.js (origem|desc|valor).
(function(){
'use strict';

var DIAS_ANTES = 5;
var CHAVE_DISP = 'finApp_alertasDispensados';
var aberto = false;

function ic(n){ return typeof iconeSVG === 'function' ? iconeSVG(n) : ''; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function chaveCheck(e){ return (e.origem || '') + '|' + (e.desc || '') + '|' + (Number(e.valor) || 0).toFixed(2); }
function hoje0(){ var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function diasAte(iso){ var p = String(iso).split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return Math.round((d - hoje0()) / 86400000); }
function quando(n){ return n < 0 ? 'venceu há ' + (-n) + ' dia' + (n === -1 ? '' : 's') : n === 0 ? 'vence hoje' : n === 1 ? 'vence amanhã' : 'vence em ' + n + ' dias'; }

function lerDisp(){ try{ return JSON.parse(localStorage.getItem(CHAVE_DISP) || '{}') || {}; }catch(e){ return {}; } }
function gravarDisp(o){ try{ localStorage.setItem(CHAVE_DISP, JSON.stringify(o)); }catch(e){} }

function calcular(){
  if(typeof S === 'undefined' || !S || typeof allEntries !== 'function') return [];
  var mes = mesAtual(), out = [];
  var E = allEntries(mes), pagos = (S.checkPagamentos && S.checkPagamentos[mes]) || {};
  var hj = hoje0();

  // Orçamento
  var lim = (S.planejamento && S.planejamento[mes]) || {}, gastos = {};
  E.forEach(function(e){ if(e.tipo === 'despesa') gastos[e.cat] = (gastos[e.cat] || 0) + (Number(e.valor) || 0); });
  var estouradas = [], perto = [];
  Object.keys(lim).forEach(function(c){
    var l = Number(lim[c]) || 0, gs = gastos[c] || 0; if(!l) return;
    var p = Math.round(gs / l * 100);
    if(p > 100) estouradas.push({ c: c, l: l, gs: gs, p: p });
    else if(p >= 80) perto.push({ c: c, l: l, gs: gs, p: p });
  });
  // Até 2 categorias: um aviso para cada. Mais que isso vira um aviso só,
  // senão o orçamento abafa o resto (vencimento de conta, por exemplo).
  function nomes(lista){
    var n = lista.map(function(x){ return x.c; });
    return n.length > 3 ? n.slice(0, 3).join(', ') + ' e mais ' + (n.length - 3) : n.join(', ');
  }
  estouradas.sort(function(a, b){ return b.p - a.p; }); perto.sort(function(a, b){ return b.p - a.p; });
  if(estouradas.length > 2) out.push({ id: 'orcg|' + mes + '|dn|' + estouradas.length, nivel: 'dn', ir: 'planejamento',
    titulo: estouradas.length + ' categorias passaram do limite', det: nomes(estouradas) });
  else estouradas.forEach(function(x){ out.push({ id: 'orc|' + mes + '|' + x.c + '|dn', nivel: 'dn', ir: 'planejamento',
    titulo: x.c + ' passou do limite', det: fmtV(x.gs) + ' de ' + fmtV(x.l) + ' (' + x.p + '%)' }); });
  if(perto.length > 2) out.push({ id: 'orcg|' + mes + '|wn|' + perto.length, nivel: 'wn', ir: 'planejamento',
    titulo: perto.length + ' categorias perto do limite', det: nomes(perto) });
  else perto.forEach(function(x){ out.push({ id: 'orc|' + mes + '|' + x.c + '|wn', nivel: 'wn', ir: 'planejamento',
    titulo: x.c + ' em ' + x.p + '% do limite', det: 'Restam ' + fmtV(x.l - x.gs) + ' de ' + fmtV(x.l) }); });

  // Contratos a pagar (têm dia de vencimento de verdade)
  E.forEach(function(e){
    if(e.origem !== 'Contrato' || e.tipo !== 'despesa' || pagos[chaveCheck(e)]) return;
    var n = diasAte(e.data); if(n > DIAS_ANTES) return;
    out.push({ id: 'ctr|' + mes + '|' + chaveCheck(e) + '|' + (n < 0 ? 'dn' : 'wn'), nivel: n < 0 ? 'dn' : 'wn', ir: 'checkpag',
      titulo: String(e.desc).replace(/ \(Contrato\)$/, '') + ' ' + quando(n), det: fmtV(e.valor) + ' · ainda não marcado como pago' });
  });

  // Faturas: parcelas e assinaturas do cartão somadas por cartão; paga quando
  // todos os itens dela estão marcados no Check.
  (S.cartoes || []).forEach(function(cart){
    var itens = E.filter(function(e){ return e.isCC && (e.origem === 'Cartão ' + cart.nome || e.origem === 'Assinatura ' + cart.nome); });
    if(!itens.length) return;
    var total = itens.reduce(function(s, e){ return s + (Number(e.valor) || 0); }, 0);
    if(itens.every(function(e){ return pagos[chaveCheck(e)]; })) return;
    var ultimo = new Date(hj.getFullYear(), hj.getMonth() + 1, 0).getDate();
    var dia = Math.min(Math.max(1, parseInt(cart.vencimento, 10) || ultimo), ultimo);
    var venc = mes + '-' + String(dia).padStart(2, '0'), n = diasAte(venc);
    if(n > DIAS_ANTES) return;
    out.push({ id: 'fat|' + mes + '|' + cart.id + '|' + (n < 0 ? 'dn' : 'wn'), nivel: n < 0 ? 'dn' : 'wn', ir: 'checkpag',
      titulo: 'Fatura ' + cart.nome + ' ' + quando(n), det: fmtV(total) + ' · marque no Check quando pagar' });
  });

  // Lançamentos com data marcada para os próximos dias
  E.forEach(function(e){
    if(!e.isManual || e.tipo !== 'despesa' || pagos[chaveCheck(e)]) return;
    var n = diasAte(e.data); if(n < 1 || n > DIAS_ANTES) return;
    out.push({ id: 'lan|' + mes + '|' + chaveCheck(e), nivel: 'info', ir: 'checkpag',
      titulo: e.desc + ' ' + quando(n), det: fmtV(e.valor) });
  });

  // Mês no vermelho
  var rec = 0, des = 0;
  E.forEach(function(e){ if(e.tipo === 'receita') rec += Number(e.valor) || 0; else if(e.tipo === 'despesa') des += Number(e.valor) || 0; });
  if(des > rec && rec + des > 0) out.push({ id: 'saldo|' + mes, nivel: 'wn', ir: 'resumo',
    titulo: 'Despesas do mês passam as receitas', det: 'Diferença de ' + fmtV(des - rec) + ' em ' + mesNomeFull(mes) });

  // Metas
  var ms = typeof window.planMetas === 'function' ? window.planMetas() : [];
  ms.forEach(function(m){
    var falta = (Number(m.alvo) || 0) - (Number(m.guardado) || 0);
    if(falta <= 0 || !m.prazo) return;
    if(m.prazo < mes) out.push({ id: 'meta|' + m.id + '|' + mes, nivel: 'wn', ir: 'planejamento',
      titulo: 'Meta "' + m.nome + '": prazo passou', det: 'Faltam ' + fmtV(falta) + ' · ajuste o prazo ou o valor' });
    else if(m.prazo === mes) out.push({ id: 'meta|' + m.id + '|' + mes, nivel: 'info', ir: 'planejamento',
      titulo: 'Meta "' + m.nome + '" vence este mês', det: 'Faltam ' + fmtV(falta) });
  });

  var peso = { dn: 0, wn: 1, info: 2 };
  out.sort(function(a, b){ return peso[a.nivel] - peso[b.nivel]; });
  var disp = lerDisp();
  return out.filter(function(a){ return !disp[a.id]; });
}

// ---------------------------------------------------------------- tela
function caixa(){
  var c = document.getElementById('alertasBox');
  if(!c){
    var cards = document.getElementById('resumoCards'); if(!cards) return null;
    c = document.createElement('section'); c.id = 'alertasBox'; c.className = 'al-box'; c.setAttribute('aria-live', 'polite');
    cards.parentNode.insertBefore(c, cards);
    c.addEventListener('click', function(e){
      var x = e.target.closest('[data-dispensar]');
      if(x){ e.stopPropagation(); var d = lerDisp(); d[x.getAttribute('data-dispensar')] = Date.now(); gravarDisp(d); atualizar(); return; }
      if(e.target.closest('#alMais')){ aberto = !aberto; atualizar(); return; }
      var it = e.target.closest('[data-ir]'); if(it) nav(it.getAttribute('data-ir'));
    });
  }
  return c;
}

function render(lista){
  var c = caixa(); if(!c) return;
  if(!lista.length){ c.hidden = true; c.innerHTML = ''; return; }
  c.hidden = false;
  var mostrar = aberto ? lista : lista.slice(0, 3);
  c.innerHTML = '<div class="al-top"><h3>' + ic('alerta') + ' Avisos <span class="al-n">' + lista.length + '</span></h3></div>' +
    '<ul class="al-lista">' + mostrar.map(function(a){
      return '<li class="al-item al-' + a.nivel + '"><button type="button" class="al-ir" data-ir="' + esc(a.ir) + '">' +
        '<span class="al-ponto" aria-hidden="true"></span><span class="al-txt"><strong>' + esc(a.titulo) + '</strong><small>' + esc(a.det) + '</small></span></button>' +
        '<button type="button" class="al-x" data-dispensar="' + esc(a.id) + '" aria-label="Dispensar aviso: ' + esc(a.titulo) + '" title="Dispensar">&times;</button></li>';
    }).join('') + '</ul>' +
    (lista.length > 3 ? '<button type="button" class="al-mais" id="alMais">' + (aberto ? 'Mostrar menos' : 'Ver todos (' + lista.length + ')') + '</button>' : '');
}

// Número no "Início" da barra inferior e no Resumo do menu: só aviso e
// urgente (o informativo não marca).
function marcar(lista){
  var n = lista.filter(function(a){ return a.nivel !== 'info'; }).length;
  [document.querySelector('.bi-aba[data-aba="resumo"]'), document.getElementById('nav-resumo')].forEach(function(el){
    if(!el) return;
    var b = el.querySelector('.al-badge');
    if(!n){ if(b) b.remove(); return; }
    if(!b){ b = document.createElement('span'); b.className = 'al-badge'; el.appendChild(b); }
    b.textContent = n > 9 ? '9+' : String(n);
    b.setAttribute('aria-label', n + ' aviso' + (n === 1 ? '' : 's'));
  });
}

var pendente = null;
function atualizar(){
  clearTimeout(pendente);
  pendente = setTimeout(function(){
    var lista; try{ lista = calcular(); }catch(e){ console.warn('[alertas]', e); return; }
    render(lista); marcar(lista);
  }, 60);
}
window.atualizarAlertas = atualizar;
window.calcularAlertas = calcular;   // para inspecionar/testar

function observarResumo(){
  var cards = document.getElementById('resumoCards');
  if(!cards || !window.MutationObserver) return;
  new MutationObserver(function(){ atualizar(); }).observe(cards, { childList: true });
}

onNavigate(function(){ atualizar(); });
document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'visible') atualizar(); });
function iniciar(){ observarResumo(); atualizar(); setTimeout(atualizar, 1500); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

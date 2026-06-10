// investimentos-enhanced.js v2 — Navegação por período + UI inteligente
(function(){
'use strict';

// ================================================================
// CSS ADICIONAL
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── INVESTIMENTOS ENHANCED v2 ── */

/* Nav de período */
.inv-period-nav {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg2); border: 1px solid var(--bg4); border-radius: var(--rad);
  padding: 10px 16px; margin-bottom: 14px; gap: 12px;
}
.inv-period-nav .ipn-center {
  flex: 1; text-align: center;
}
.inv-period-nav .ipn-label {
  font-size: .78em; font-weight: 700; color: var(--tx2); display: block;
}
.inv-period-nav .ipn-sub {
  font-size: .64em; color: var(--tx3); margin-top: 2px; display: block;
}
.inv-period-nav .ipn-btn {
  background: var(--bg3); border: 1px solid var(--bg4); color: var(--tx2);
  border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: .78em;
  font-weight: 600; transition: all .15s; white-space: nowrap;
}
.inv-period-nav .ipn-btn:hover { border-color: var(--pri); color: var(--pri2); }
.inv-period-nav .ipn-btn:disabled { opacity: .35; cursor: default; }
.inv-period-nav .ipn-today {
  font-size: .7em; color: var(--pri2); cursor: pointer; padding: 4px 8px;
  border-radius: 6px; border: 1px solid transparent; transition: all .15s;
  white-space: nowrap;
}
.inv-period-nav .ipn-today:hover { border-color: var(--pri); background: rgba(108,92,231,.08); }

/* Tabela histórico unificada */
.inv-hist-box {
  background: var(--bg2); border: 1px solid var(--bg4); border-radius: var(--rad);
  box-shadow: var(--sh); margin-bottom: 24px; overflow: hidden;
}
.inv-hist-box-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px 12px; border-bottom: 1px solid var(--bg4);
}
.inv-hist-box-header h3 { font-size: .88em; color: var(--tx2); font-weight: 600; margin: 0; }
.inv-hist-legend { display: flex; gap: 12px; font-size: .62em; color: var(--tx3); }
.inv-hist-legend span { display: flex; align-items: center; gap: 4px; }
.inv-hist-legend .leg-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

/* Tabela */
.inv-hist-table { width: 100%; border-collapse: collapse; }
.inv-hist-table thead tr { background: var(--bg3); }
.inv-hist-table thead th {
  font-size: .63em; color: var(--tx3); text-transform: uppercase; letter-spacing: .8px;
  font-weight: 700; padding: 8px 14px; text-align: right;
}
.inv-hist-table thead th:first-child { text-align: left; }
.inv-hist-table tbody tr {
  border-bottom: 1px solid var(--bg3); cursor: pointer; transition: background .1s;
}
.inv-hist-table tbody tr:hover { background: rgba(255,255,255,.03); }
.inv-hist-table tbody tr.iht-acum {
  background: var(--bg3); border-top: 2px solid var(--bg4); cursor: default;
  font-weight: 700;
}
.inv-hist-table tbody tr.iht-acum:hover { background: var(--bg3); }
.inv-hist-table td {
  padding: 10px 14px; font-size: .82em; text-align: right; vertical-align: middle;
}
.inv-hist-table td:first-child { text-align: left; }
.iht-mes { font-weight: 700; color: var(--tx2); font-size: .8em; }
.iht-mes-sub { font-size: .64em; color: var(--tx3); margin-top: 1px; }
.iht-val-pos { color: var(--ok); font-weight: 600; }
.iht-val-neg { color: var(--dn2); font-weight: 600; }
.iht-val-zero { color: var(--tx3); }
.iht-rent-bar { height: 3px; background: var(--bg4); border-radius: 2px; margin-top: 3px; overflow: hidden; }
.iht-rent-bar-fill { height: 100%; border-radius: 2px; }

/* KPIs no topo da tabela */
.inv-hist-kpis {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  border-bottom: 1px solid var(--bg4);
}
.inv-hist-kpi {
  padding: 12px 16px; border-right: 1px solid var(--bg4); text-align: center;
}
.inv-hist-kpi:last-child { border-right: none; }
.inv-hist-kpi .ihk-lbl { font-size: .62em; color: var(--tx3); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 4px; }
.inv-hist-kpi .ihk-val { font-size: 1em; font-weight: 700; }

/* Rent. mensal com % (mantido para compat) */
.inv-rent-cell .irc-pct { font-size:.68em; color:var(--tx3); margin-top:2px; }
.inv-rent-cell .irc-pct.pos { color:var(--ok); }
.inv-rent-cell .irc-pct.neg { color:var(--dn2); }

/* Summary cards extras */
.inv-summary-extra .card { padding:16px 14px; }
.inv-summary-extra .card .card-value { font-size:1.05em; }
.inv-summary-extra .card .card-sub { font-size:.68em; color:var(--tx3); margin-top:2px; }

/* Modal detalhe mov mensal */
.inv-mov-detail-list { max-height:400px; overflow-y:auto; }
.inv-mov-detail-item { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid var(--bg3); font-size:.88em; transition:background .1s; }
.inv-mov-detail-item:hover { background:var(--bg3); }
.inv-mov-detail-item:last-child { border:none; }
.inv-mov-detail-item .imd-name { font-weight:600; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inv-mov-detail-item .imd-tipo { font-size:.72em; padding:2px 8px; border-radius:10px; margin-left:8px; flex-shrink:0; }
.inv-mov-detail-item .imd-tipo.aporte { background:rgba(0,206,201,.15); color:var(--ok); }
.inv-mov-detail-item .imd-tipo.resgate { background:rgba(214,48,49,.15); color:var(--dn2); }
.inv-mov-detail-item .imd-val { font-weight:700; flex-shrink:0; margin-left:12px; }
.inv-mov-detail-total { display:flex; justify-content:space-between; padding:12px; font-weight:700; font-size:.95em; border-top:2px solid var(--bg4); margin-top:4px; }
.inv-mov-detail-empty { text-align:center; padding:30px; color:var(--tx3); font-size:.88em; }

@media(max-width:768px){
  .inv-hist-kpis { grid-template-columns: repeat(2, 1fr); }
  .inv-hist-kpi { padding: 10px 12px; }
  .inv-hist-table td, .inv-hist-table th { padding: 8px 10px; }
  .inv-period-nav .ipn-btn { padding: 5px 8px; font-size: .72em; }
  .inv-hist-table { font-size: .9em; }
}
@media(max-width:480px){
  .inv-hist-kpis { grid-template-columns: repeat(2, 1fr); }
  .inv-hist-legend { display: none; }
  .inv-hist-table td.hide-mob, .inv-hist-table th.hide-mob { display: none; }
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL DE DETALHAMENTO DE MOVIMENTAÇÕES DO MÊS
// ================================================================
if(!document.getElementById('modalMovMesDetail')){
  var modalMovDetail = document.createElement('div');
  modalMovDetail.className = 'modal';
  modalMovDetail.id = 'modalMovMesDetail';
  modalMovDetail.innerHTML = '<div class="modal-content"><div class="modal-header">' +
    '<h3 id="movMesDetailTitle">Movimentações do Mês</h3>' +
    '<span class="modal-close" onclick="closeM(\'modalMovMesDetail\')">&times;</span>' +
    '</div><div class="modal-body" id="movMesDetailBody"></div></div>';
  document.body.appendChild(modalMovDetail);
}

// ================================================================
// NAVEGAÇÃO DE PERÍODO
// ================================================================
if(typeof window.invMesRef === 'undefined') window.invMesRef = null;

window._invNavPrev = function(){
  window.invMesRef = addMes(window.invMesRef || mesAtual(), -1);
  renderInvest();
};
window._invNavNext = function(){
  var cur = window.invMesRef || mesAtual();
  var next = addMes(cur, 1);
  if(next > mesAtual()) return;
  window.invMesRef = next;
  renderInvest();
};
window._invNavReset = function(){
  window.invMesRef = null;
  renderInvest();
};

// ================================================================
// HELPERS
// ================================================================
function fmt(v){
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtShort(v){
  var abs = Math.abs(v || 0);
  if(abs >= 1000000) return 'R$ ' + (v/1000000).toFixed(1).replace('.',',') + 'M';
  if(abs >= 1000) return 'R$ ' + (v/1000).toFixed(1).replace('.',',') + 'k';
  return 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR');
}

function getInvRentTotal(inv){
  return (inv.rentabilidade || []).reduce(function(s, r){ return s + (Number(r.valor) || 0); }, 0);
}
function getInvRentMes(inv, mes){
  var found = (inv.rentabilidade || []).find(function(r){ return r.mes === mes; });
  return found ? (Number(found.valor) || 0) : 0;
}
function getCapitalInicioMes(inv, mes){
  var base = Number(inv.valor) || 0;
  var movs = inv.movimentacoes || [];
  movs.forEach(function(m){
    var mMes = (m.data || '').substring(0, 7);
    if(mMes && mMes < mes){
      var v = Number(m.valor) || 0;
      if(m.tipo === 'resgate') base -= v; else base += v;
    }
  });
  movs.forEach(function(m){
    var mMes = (m.data || '').substring(0, 7);
    if(mMes === mes){
      var v = Number(m.valor) || 0;
      if(m.tipo === 'resgate') base -= v; else base += v;
    }
  });
  (inv.rentabilidade || []).forEach(function(r){
    if(r.mes && r.mes < mes) base += Number(r.valor) || 0;
  });
  return base;
}
function getAportesMes(inv, mes){
  var total = 0;
  (inv.movimentacoes || []).forEach(function(m){
    if(m.tipo === 'aporte' && (m.data || '').substring(0, 7) === mes) total += Number(m.valor) || 0;
  });
  return total;
}
function getResgatesMes(inv, mes){
  var total = 0;
  (inv.movimentacoes || []).forEach(function(m){
    if(m.tipo === 'resgate' && (m.data || '').substring(0, 7) === mes) total += Number(m.valor) || 0;
  });
  return total;
}
function getInvestInicial(inv, mes){
  var dataMes = (inv.data || '').substring(0, 7);
  if(dataMes === mes) return Number(inv.valor) || 0;
  return 0;
}
// Saldo real da carteira ao final de um mês (capital + movimentações + rentabilidade acumulada até esse mês)
function getPortfolioSaldoAtMes(invs, mes){
  var total = 0;
  invs.forEach(function(inv){
    var invStart = (inv.data || '').substring(0, 7);
    if(invStart && invStart > mes) return; // investimento ainda não existia
    var val = Number(inv.valor) || 0;
    (inv.movimentacoes || []).forEach(function(m){
      var mMes = (m.data || '').substring(0, 7);
      if(mMes && mMes <= mes){
        var v = Number(m.valor) || 0;
        if(m.tipo === 'resgate') val -= v; else val += v;
      }
    });
    (inv.rentabilidade || []).forEach(function(r){
      if(r.mes && r.mes <= mes) val += Number(r.valor) || 0;
    });
    total += val;
  });
  return total;
}

// ================================================================
// MODAL DE DETALHAMENTO
// ================================================================
window._invOpenMovMesDetail = function(mes){
  var invs = S.investimentos || [];
  var mesLabel = typeof mesNomeFull === 'function' ? mesNomeFull(mes) : mes;
  document.getElementById('movMesDetailTitle').textContent = 'Detalhes — ' + mesLabel;

  var items = [], totalAportes = 0, totalResgates = 0, totalInicial = 0, totalRent = 0;
  invs.forEach(function(inv){
    var ap = getAportesMes(inv, mes);
    var re = getResgatesMes(inv, mes);
    var ini = getInvestInicial(inv, mes);
    var rent = getInvRentMes(inv, mes);
    if(ini > 0){ items.push({ nome: inv.nome || '-', tipo: 'inicial', valor: ini }); totalInicial += ini; }
    if(ap > 0){ items.push({ nome: inv.nome || '-', tipo: 'aporte', valor: ap }); totalAportes += ap; }
    if(re > 0){ items.push({ nome: inv.nome || '-', tipo: 'resgate', valor: re }); totalResgates += re; }
    if(rent !== 0) totalRent += rent;
  });
  items.sort(function(a, b){ return b.valor - a.valor; });

  var h = '';
  if(!items.length && totalRent === 0){
    h += '<div class="inv-mov-detail-empty">Nenhuma movimentação em ' + mesLabel + '.</div>';
  } else {
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">';
    if(totalInicial > 0){
      h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px"><div style="font-size:.63em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Novos Investimentos</div><div style="font-weight:700;color:var(--inf2)">' + fmt(totalInicial) + '</div></div>';
    }
    h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px"><div style="font-size:.63em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Aportes</div><div style="font-weight:700;color:var(--ok)">' + fmt(totalAportes) + '</div></div>';
    h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px"><div style="font-size:.63em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Resgates</div><div style="font-weight:700;color:var(--dn2)">' + fmt(totalResgates) + '</div></div>';
    if(totalRent !== 0){
      h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px"><div style="font-size:.63em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Rentabilidade</div><div style="font-weight:700;color:' + (totalRent>=0?'var(--ok)':'var(--dn2)') + '">' + (totalRent>0?'+ ':'') + fmt(totalRent) + '</div></div>';
    }
    h += '</div>';
    if(items.length){
      h += '<div class="inv-mov-detail-list">';
      items.forEach(function(item){
        var tipoLabel = item.tipo === 'inicial' ? 'Investimento' : (item.tipo === 'aporte' ? 'Aporte' : 'Resgate');
        var tipoClass = item.tipo === 'resgate' ? 'resgate' : 'aporte';
        var color = item.tipo === 'resgate' ? 'var(--dn2)' : 'var(--ok)';
        var prefix = item.tipo === 'resgate' ? '- ' : '+ ';
        h += '<div class="inv-mov-detail-item"><span class="imd-name">' + item.nome + '</span><span class="imd-tipo ' + tipoClass + '">' + tipoLabel + '</span><span class="imd-val" style="color:' + color + '">' + prefix + fmt(item.valor) + '</span></div>';
      });
      h += '</div>';
    }
  }
  document.getElementById('movMesDetailBody').innerHTML = h;
  openM('modalMovMesDetail');
};

// ================================================================
// OVERRIDE renderInvest
// ================================================================
var _origRenderInvest = window.renderInvest;

window.renderInvest = function(){
  _origRenderInvest();

  var invs = S.investimentos || [];
  var area = document.getElementById('invDynamicArea');
  if(!area) return;

  var ma = window.invMesRef || mesAtual();
  var isCurrentPeriod = (ma === mesAtual());

  // ===== 1. INJETAR BARRA DE NAVEGAÇÃO DE PERÍODO =====
  var pgEl = document.getElementById('pg-investimentos');
  if(pgEl && !pgEl.querySelector('.inv-period-nav')){
    var startMes = addMes(ma, -5);
    var endMes = ma;

    function mesAbrev(m){
      return typeof mesNome === 'function' ? mesNome(m) : m;
    }
    var periodLabel = mesAbrev(startMes) + '/' + startMes.split('-')[0] + ' — ' + mesAbrev(endMes) + '/' + endMes.split('-')[0];
    var navBar = document.createElement('div');
    navBar.className = 'inv-period-nav';
    var nextDisabled = isCurrentPeriod ? ' disabled' : '';
    navBar.innerHTML = '<button class="ipn-btn" onclick="window._invNavPrev()">&#8592; Anterior</button>' +
      '<div class="ipn-center">' +
        '<span class="ipn-label">' + periodLabel + '</span>' +
        '<span class="ipn-sub">6 meses</span>' +
      '</div>' +
      '<button class="ipn-btn"' + nextDisabled + ' onclick="window._invNavNext()">Próximo &#8594;</button>' +
      (!isCurrentPeriod ? '<span class="ipn-today" onclick="window._invNavReset()">Hoje</span>' : '');
    area.parentNode.insertBefore(navBar, area);
  } else if(pgEl){
    // Atualizar label sem reinserir
    var nb = pgEl.querySelector('.inv-period-nav');
    if(nb){
      var startM = addMes(ma, -5);
      function ma2(m){ return typeof mesNome === 'function' ? mesNome(m) : m; }
      var pl = ma2(startM) + '/' + startM.split('-')[0] + ' — ' + ma2(ma) + '/' + ma.split('-')[0];
      var lbl = nb.querySelector('.ipn-label'); if(lbl) lbl.textContent = pl;
      var nextBtn = nb.querySelectorAll('.ipn-btn')[1];
      if(nextBtn) nextBtn.disabled = isCurrentPeriod;
      var todayBtn = nb.querySelector('.ipn-today');
      if(isCurrentPeriod && todayBtn) todayBtn.remove();
      if(!isCurrentPeriod && !nb.querySelector('.ipn-today')){
        var td = document.createElement('span'); td.className='ipn-today'; td.textContent='Hoje'; td.onclick=window._invNavReset; nb.appendChild(td);
      }
    }
  }

  // ===== 2. ADICIONAR % NAS CÉLULAS DE RENTABILIDADE MENSAL =====
  var rentGrid = area.querySelector('.inv-rent-grid');
  if(rentGrid){
    var cells = rentGrid.querySelectorAll('.inv-rent-cell:not(.acum)');
    var cellIndex = 0;
    for(var mi = -5; mi <= 0; mi++){
      var mes = addMes(ma, mi);
      var rentMes = 0, capitalBase = 0;
      invs.forEach(function(inv){
        rentMes += getInvRentMes(inv, mes);
        capitalBase += getCapitalInicioMes(inv, mes);
      });
      var pctMes = capitalBase > 0 ? ((rentMes / capitalBase) * 100) : 0;
      if(cells[cellIndex] && !cells[cellIndex].querySelector('.irc-pct')){
        var pctDiv = document.createElement('div');
        pctDiv.className = 'irc-pct ' + (pctMes > 0 ? 'pos' : (pctMes < 0 ? 'neg' : ''));
        pctDiv.textContent = (pctMes > 0 ? '+' : '') + pctMes.toFixed(2) + '%';
        var valEl = cells[cellIndex].querySelector('.irc-val');
        if(valEl) valEl.parentNode.insertBefore(pctDiv, valEl.nextSibling || null);
      }
      cellIndex++;
    }
    var acumCell = rentGrid.querySelector('.inv-rent-cell.acum');
    if(acumCell && !acumCell.querySelector('.irc-pct')){
      var totalRent6 = 0, capitalBase6 = 0;
      var mesInicio6 = addMes(ma, -5);
      invs.forEach(function(inv){
        capitalBase6 += getCapitalInicioMes(inv, mesInicio6);
        for(var j = -5; j <= 0; j++) totalRent6 += getInvRentMes(inv, addMes(ma, j));
      });
      var pctAcum = capitalBase6 > 0 ? ((totalRent6 / capitalBase6) * 100) : 0;
      var pctAcumDiv = document.createElement('div');
      pctAcumDiv.className = 'irc-pct ' + (pctAcum > 0 ? 'pos' : (pctAcum < 0 ? 'neg' : ''));
      pctAcumDiv.textContent = (pctAcum > 0 ? '+' : '') + pctAcum.toFixed(2) + '%';
      var valAcum = acumCell.querySelector('.irc-val');
      if(valAcum) valAcum.parentNode.insertBefore(pctAcumDiv, valAcum.nextSibling || null);
    }
  }

  // ===== 3. SUBSTITUIR SEÇÃO "APORTES & RESGATES" POR TABELA UNIFICADA =====
  var rentBox = area.querySelector('.inv-rent-box');
  if(!rentBox) return;

  // Remover invMovBox antigo se existir
  var oldBox = document.getElementById('invMovBox');
  if(oldBox) oldBox.remove();

  // Calcular dados por mês
  var meses = [];
  var acumRent = 0, acumAporte = 0, acumResgate = 0, acumInicial = 0;
  var maxRent = 0;

  for(var mi2 = -5; mi2 <= 0; mi2++){
    var m = addMes(ma, mi2);
    var rentM = 0, aporteM = 0, resgateM = 0, inicialM = 0, capitalM = 0;
    invs.forEach(function(inv){
      rentM += getInvRentMes(inv, m);
      aporteM += getAportesMes(inv, m);
      resgateM += getResgatesMes(inv, m);
      inicialM += getInvestInicial(inv, m);
      capitalM += getCapitalInicioMes(inv, m);
    });
    var entradaM = inicialM + aporteM;
    acumRent += rentM;
    acumAporte += aporteM;
    acumResgate += resgateM;
    acumInicial += inicialM;
    if(Math.abs(rentM) > maxRent) maxRent = Math.abs(rentM);
    meses.push({ mes: m, rent: rentM, aporte: entradaM, resgate: resgateM, capital: capitalM });
  }

  var totalEntrada = acumInicial + acumAporte;
  var saldoMov = totalEntrada - acumResgate;

  // Saldo real da carteira ao final do período
  var saldoCarteira = getPortfolioSaldoAtMes(invs, ma);
  var rentColor = acumRent >= 0 ? 'var(--ok)' : 'var(--dn2)';
  var saldoCarteiraColor = saldoCarteira > 0 ? 'var(--ok)' : 'var(--dn2)';

  var h = '<div class="inv-hist-box" id="invMovBox">';
  h += '<div class="inv-hist-box-header">';
  h += '<h3>&#128200; Resumo do Período</h3>';
  h += '<div class="inv-hist-legend">';
  h += '<span><span class="leg-dot" style="background:var(--ok)"></span>Rentabilidade</span>';
  h += '<span><span class="leg-dot" style="background:var(--inf2)"></span>Aportes</span>';
  h += '<span><span class="leg-dot" style="background:var(--dn2)"></span>Resgates</span>';
  h += '</div></div>';

  // KPIs — saldo da carteira bate com o donut
  h += '<div class="inv-hist-kpis">';
  h += '<div class="inv-hist-kpi"><div class="ihk-lbl">Rentabilidade acum.</div><div class="ihk-val" style="color:' + rentColor + '">' + (acumRent > 0 ? '+' : '') + fmtShort(acumRent) + '</div></div>';
  h += '<div class="inv-hist-kpi"><div class="ihk-lbl">Aportes acum.</div><div class="ihk-val" style="color:var(--inf2)">' + fmtShort(totalEntrada) + '</div></div>';
  h += '<div class="inv-hist-kpi"><div class="ihk-lbl">Resgates acum.</div><div class="ihk-val" style="color:var(--dn2)">' + (acumResgate > 0 ? '-' : '') + fmtShort(acumResgate) + '</div></div>';
  h += '<div class="inv-hist-kpi"><div class="ihk-lbl">Saldo da Carteira</div><div class="ihk-val" style="color:' + saldoCarteiraColor + '">' + fmtShort(saldoCarteira) + '</div></div>';
  h += '</div>';

  // Tabela
  h += '<table class="inv-hist-table">';
  h += '<thead><tr>';
  h += '<th style="text-align:left">Mês</th>';
  h += '<th>Rentabilidade</th>';
  h += '<th class="hide-mob">Aportes</th>';
  h += '<th class="hide-mob">Resgates</th>';
  h += '<th>Saldo Carteira</th>';
  h += '</tr></thead><tbody>';

  meses.forEach(function(row){
    var saldoMesCarteira = getPortfolioSaldoAtMes(invs, row.mes);
    var saldoCls = saldoMesCarteira > 0 ? 'iht-val-pos' : (saldoMesCarteira < 0 ? 'iht-val-neg' : 'iht-val-zero');
    var rentCls = row.rent > 0 ? 'iht-val-pos' : (row.rent < 0 ? 'iht-val-neg' : 'iht-val-zero');
    var barW = maxRent > 0 ? Math.round(Math.abs(row.rent) / maxRent * 100) : 0;
    var barColor = row.rent >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var mesEsc = row.mes.replace(/'/g, "\\'");
    h += '<tr onclick="window._invOpenMovMesDetail(\'' + mesEsc + '\')">';
    h += '<td><div class="iht-mes">' + (typeof mesNomeFull === 'function' ? mesNomeFull(row.mes) : row.mes) + '</div></td>';
    h += '<td><div class="' + rentCls + '">' + (row.rent > 0 ? '+' : '') + fmt(row.rent) + '</div>';
    if(barW > 0) h += '<div class="iht-rent-bar"><div class="iht-rent-bar-fill" style="width:' + barW + '%;background:' + barColor + '"></div></div>';
    h += '</td>';
    h += '<td class="hide-mob">' + (row.aporte > 0 ? '<span class="iht-val-pos">+' + fmt(row.aporte) + '</span>' : '<span class="iht-val-zero">—</span>') + '</td>';
    h += '<td class="hide-mob">' + (row.resgate > 0 ? '<span class="iht-val-neg">-' + fmt(row.resgate) + '</span>' : '<span class="iht-val-zero">—</span>') + '</td>';
    h += '<td><span class="' + saldoCls + '">' + fmt(saldoMesCarteira) + '</span></td>';
    h += '</tr>';
  });

  // Linha acumulado — saldo bate com o donut
  var acRentCls = acumRent > 0 ? 'iht-val-pos' : (acumRent < 0 ? 'iht-val-neg' : 'iht-val-zero');
  var acSaldoCls = saldoCarteira > 0 ? 'iht-val-pos' : (saldoCarteira < 0 ? 'iht-val-neg' : 'iht-val-zero');
  h += '<tr class="iht-acum">';
  h += '<td>Saldo atual</td>';
  h += '<td><span class="' + acRentCls + '">' + (acumRent > 0 ? '+' : '') + fmt(acumRent) + '</span></td>';
  h += '<td class="hide-mob"><span style="color:var(--inf2)">' + fmt(totalEntrada) + '</span></td>';
  h += '<td class="hide-mob"><span style="color:var(--dn2)">' + (acumResgate > 0 ? '-' : '') + fmt(acumResgate) + '</span></td>';
  h += '<td><span class="' + acSaldoCls + '" title="Igual ao valor no gráfico de pizza">' + fmt(saldoCarteira) + '</span></td>';
  h += '</tr>';
  h += '</tbody></table></div>';

  var newBox = document.createElement('div');
  newBox.innerHTML = h;
  rentBox.parentNode.insertBefore(newBox.firstChild, rentBox.nextSibling);

  // ===== 4. CARDS EXTRAS NO RESUMO (Rent. % Mês + Aporte Mês + Resgate Mês) =====
  var summary = area.querySelector('.inv-summary');
  if(!summary || summary.querySelector('.enh-added')) return;

  var rentMesAtual = 0, capitalBaseMesAtual = 0;
  invs.forEach(function(inv){
    rentMesAtual += getInvRentMes(inv, ma);
    capitalBaseMesAtual += getCapitalInicioMes(inv, ma);
  });
  var rentPctMes = capitalBaseMesAtual > 0 ? ((rentMesAtual / capitalBaseMesAtual) * 100) : 0;

  var aportesMesAtual = 0, resgatesMesAtual = 0;
  invs.forEach(function(inv){
    aportesMesAtual += getAportesMes(inv, ma);
    resgatesMesAtual += getResgatesMes(inv, ma);
  });

  var cards = summary.querySelectorAll('.card');
  cards.forEach(function(card){
    var label = card.querySelector('.card-label');
    if(label && label.textContent.indexOf('Rent.') >= 0 && label.textContent.indexOf('M') >= 0 && label.textContent.indexOf('%') < 0){
      var val = card.querySelector('.card-value');
      if(val && !card.querySelector('.card-sub')){
        var sub = document.createElement('div');
        sub.className = 'card-sub enh-added';
        sub.style.cssText = 'font-size:.72em;color:var(--tx3);margin-top:3px;';
        sub.textContent = (rentPctMes > 0 ? '+' : '') + rentPctMes.toFixed(2) + '% do capital';
        card.appendChild(sub);
      }
    }
  });

  var aporteCard = document.createElement('div');
  aporteCard.className = 'card enh-added';
  aporteCard.innerHTML = '<div class="card-label">Aporte Mês</div><div class="card-value ' + (aportesMesAtual > 0 ? 'green' : 'blue') + '">' + (aportesMesAtual > 0 ? '+ ' : '') + fmt(aportesMesAtual) + '</div>';
  summary.appendChild(aporteCard);

  var resgateCard = document.createElement('div');
  resgateCard.className = 'card enh-added';
  resgateCard.innerHTML = '<div class="card-label">Resgate Mês</div><div class="card-value ' + (resgatesMesAtual > 0 ? 'red' : 'blue') + '">' + (resgatesMesAtual > 0 ? '- ' : '') + fmt(resgatesMesAtual) + '</div>';
  summary.appendChild(resgateCard);
};

console.log('[Financeiro Pro] Investimentos Enhanced v2 — Navegação período + Tabela unificada + % rentabilidade.');
})();

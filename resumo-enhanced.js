// resumo-enhanced.js v3 — Resumo melhorado + layout mobile otimizado
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── RESUMO ENHANCED v3 ── */

/* === QUICK ACTIONS === */
.res-quick-row{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.res-quick-btn{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:10px 16px;font-size:.78em;color:var(--tx2);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;font-weight:600;}
.res-quick-btn:hover{border-color:var(--pri);color:var(--pri2);transform:translateY(-1px);}

/* === CARDS PRINCIPAIS (3 col desktop) === */
.res-cards-main{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
.res-cards-secondary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;}

/* === CARD BASE === */
.res-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:18px 16px;box-shadow:var(--sh);transition:transform .2s;}
.res-card:hover{transform:translateY(-3px);}
.res-card .rc-label{font-size:.68em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:flex;align-items:center;}
.res-card .rc-icon{margin-right:4px;}
.res-card .rc-value{font-size:1.3em;font-weight:700;margin-bottom:8px;word-break:break-word;}
.res-card .rc-sub{display:flex;justify-content:space-between;align-items:center;font-size:.76em;padding:4px 0;border-top:1px solid var(--bg3);gap:4px;}
.res-card .rc-sub-label{color:var(--tx3);flex-shrink:0;}
.res-card .rc-sub-val{font-weight:600;text-align:right;word-break:break-word;}
.res-card .rc-badge{display:inline-block;font-size:.62em;padding:2px 7px;border-radius:10px;font-weight:700;margin-left:4px;}
.res-card .rc-badge.ok{background:rgba(0,206,201,.15);color:var(--ok);}
.res-card .rc-badge.pend{background:rgba(253,203,110,.15);color:var(--wn);}

/* === CORES DE BORDA === */
.res-card.card-receita{border-top:3px solid var(--ok);}
.res-card.card-despesa{border-top:3px solid var(--dn2);}
.res-card.card-saldo{border-top:3px solid var(--inf2);}
.res-card.card-cartao{border-top:3px solid #e65100;}
.res-card.card-contrato{border-top:3px solid var(--pri);}
.res-card.card-assinatura{border-top:3px solid var(--wn);}

/* === CLICÁVEL === */
.res-clickable{cursor:pointer;transition:opacity .15s;}
.res-clickable:hover{opacity:.85;}

/* === MODAL DETALHAMENTO === */
.res-det-list{max-height:400px;overflow-y:auto;}
.res-det-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:.85em;gap:8px;}
.res-det-item:hover{background:var(--bg3);}
.res-det-item:last-child{border:none;}
.res-det-item .rdi-desc{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}
.res-det-item .rdi-meta{font-size:.72em;color:var(--tx3);flex-shrink:0;}
.res-det-item .rdi-val{font-weight:700;flex-shrink:0;}
.res-det-total{display:flex;justify-content:space-between;padding:12px;font-weight:700;font-size:.95em;border-top:2px solid var(--bg4);margin-top:4px;}
.res-det-empty{text-align:center;padding:30px;color:var(--tx3);font-size:.88em;}

/* ============================================================ */
/* MOBILE — tudo coluna única, compacto, sem overflow            */
/* ============================================================ */
@media(max-width:768px){
  /* Quick actions: scroll horizontal, sem quebrar */
  .res-quick-row{
    display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;
    padding-bottom:6px;margin-bottom:14px;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .res-quick-row::-webkit-scrollbar{display:none;}
  .res-quick-btn{
    flex-shrink:0;padding:8px 12px;font-size:.72em;
    border-radius:8px;white-space:nowrap;
  }

  /* Cards: coluna única */
  .res-cards-main,
  .res-cards-secondary{
    grid-template-columns:1fr!important;
    gap:10px;margin-bottom:14px;
  }

  /* Card compacto */
  .res-card{
    padding:14px 12px;
    border-radius:10px;
  }
  .res-card .rc-label{font-size:.65em;margin-bottom:4px;letter-spacing:.8px;}
  .res-card .rc-value{font-size:1.15em;margin-bottom:6px;}

  /* Sub-valores em mini-grid 2 colunas lado a lado */
  .res-card .rc-subs-row{
    display:grid;grid-template-columns:1fr 1fr;gap:0;
    border-top:1px solid var(--bg3);
  }
  .res-card .rc-subs-row .rc-sub{
    border-top:none;
    flex-direction:column;
    align-items:flex-start;
    padding:6px 4px;
    gap:2px;
  }
  .res-card .rc-subs-row .rc-sub:first-child{
    border-right:1px solid var(--bg3);
    padding-right:8px;
  }
  .res-card .rc-subs-row .rc-sub:last-child{
    padding-left:8px;
  }
  .res-card .rc-subs-row .rc-sub-label{font-size:.65em;}
  .res-card .rc-subs-row .rc-sub-val{font-size:.82em;}
  .res-card .rc-badge{font-size:.58em;padding:1px 5px;margin-left:3px;}

  /* Sub simples (contratos, assinaturas, cartão) */
  .res-card .rc-sub{font-size:.72em;padding:5px 0;}
  .res-card .rc-sub-val{font-size:.78em;}

  /* Modal mobile */
  .res-det-item{padding:8px 10px;font-size:.8em;flex-wrap:wrap;}
  .res-det-item .rdi-desc{font-size:.82em;white-space:normal;word-break:break-word;}
  .res-det-item .rdi-meta{font-size:.65em;}
  .res-det-item .rdi-val{font-size:.82em;}
  .res-det-total{font-size:.88em;padding:10px;}
}

/* Telas bem pequenas (< 380px) */
@media(max-width:380px){
  .res-card .rc-value{font-size:1.05em;}
  .res-card .rc-subs-row .rc-sub-val{font-size:.76em;}
  .res-quick-btn{font-size:.68em;padding:6px 10px;}
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL DETALHAMENTO
// ================================================================
var modalResDet = document.createElement('div');
modalResDet.className = 'modal';
modalResDet.id = 'modalResDet';
modalResDet.innerHTML = '<div class="modal-content" style="max-width:580px"><div class="modal-header">' +
  '<h3 id="resDetTitle">Detalhes</h3>' +
  '<span class="modal-close" onclick="closeM(\'modalResDet\')">&times;</span>' +
  '</div><div class="modal-body" id="resDetBody"></div></div>';
document.body.appendChild(modalResDet);

// ================================================================
// HELPERS
// ================================================================
function getCheckStatus(mes){
  if(!S.checkPagamentos || !S.checkPagamentos[mes]) return {};
  return S.checkPagamentos[mes];
}

function buildItemKey(entry){
  return (entry.origem||'') + '|' + (entry.desc||'') + '|' + (entry.valor||0).toFixed(2);
}

function showDetail(title, items, colorClass){
  document.getElementById('resDetTitle').textContent = title;
  var h = '';
  if(!items.length){
    h = '<div class="res-det-empty">Nenhum item encontrado.</div>';
  } else {
    h = '<div class="res-det-list">';
    var total = 0;
    items.forEach(function(e){
      total += e.valor;
      var cor = colorClass === 'green' ? 'color:var(--ok)' : (colorClass === 'red' ? 'color:var(--dn2)' : 'color:var(--tx)');
      h += '<div class="res-det-item">' +
        '<span class="rdi-desc">' + (e.desc || '-') + '</span>' +
        '<span class="rdi-meta">' + (e.origem || '') + (e.cat ? ' \u00b7 ' + e.cat : '') + '</span>' +
        '<span class="rdi-val" style="' + cor + '">' + fmtV(e.valor) + '</span>' +
        '</div>';
    });
    h += '</div>';
    var corTotal = colorClass === 'green' ? 'var(--ok)' : (colorClass === 'red' ? 'var(--dn2)' : 'var(--tx)');
    h += '<div class="res-det-total"><span>Total</span><span style="color:' + corTotal + '">' + fmtV(total) + '</span></div>';
  }
  document.getElementById('resDetBody').innerHTML = h;
  openM('modalResDet');
}

// Helper: sub-valores lado a lado no mobile (grid 2 cols)
function subsRow(sub1Label, sub1Val, sub1Style, sub1Badge, sub2Label, sub2Val, sub2Style, sub2Badge){
  return '<div class="rc-subs-row">' +
    '<div class="rc-sub"><span class="rc-sub-label">' + sub1Label + '</span><span class="rc-sub-val" style="' + sub1Style + '">' + sub1Val + (sub1Badge ? ' <span class="rc-badge ' + sub1Badge.cls + '">' + sub1Badge.txt + '</span>' : '') + '</span></div>' +
    '<div class="rc-sub"><span class="rc-sub-label">' + sub2Label + '</span><span class="rc-sub-val" style="' + sub2Style + '">' + sub2Val + (sub2Badge ? ' <span class="rc-badge ' + sub2Badge.cls + '">' + sub2Badge.txt + '</span>' : '') + '</span></div>' +
    '</div>';
}

// Helper: sub simples (fallback desktop e cards secundários)
function subLine(label, val, style){
  return '<div class="rc-sub"><span class="rc-sub-label">' + label + '</span><span class="rc-sub-val" style="' + style + '">' + val + '</span></div>';
}

// ================================================================
// OVERRIDE renderResumo
// ================================================================
window.renderResumo = function(){
  g('mesLabel').textContent = mesNomeFull(curMes);

  var E = allEntries(curMes);
  var checks = getCheckStatus(curMes);

  // ===== CÁLCULOS =====
  var rec = 0, desp = 0;
  var recConf = 0, recPend = 0, recConfCount = 0, recPendCount = 0;
  var despConf = 0, despPend = 0, despConfCount = 0, despPendCount = 0;
  var recItems = [], despItems = [];
  var recConfItems = [], recPendItems = [], despConfItems = [], despPendItems = [];

  E.forEach(function(e){
    var isPago = !!checks[buildItemKey(e)];
    if(e.tipo === 'receita'){
      rec += e.valor; recItems.push(e);
      if(isPago){ recConf += e.valor; recConfCount++; recConfItems.push(e); }
      else { recPend += e.valor; recPendCount++; recPendItems.push(e); }
    } else {
      desp += e.valor; despItems.push(e);
      if(isPago){ despConf += e.valor; despConfCount++; despConfItems.push(e); }
      else { despPend += e.valor; despPendCount++; despPendItems.push(e); }
    }
  });
  var saldo = rec - desp;
  var saldoConf = recConf - despConf;

  // Fatura
  var fatItens = typeof faturaCC === 'function' ? faturaCC(curMes) : [];
  var fatTotal = fatItens.reduce(function(s,i){ return s + (Number(i.valor)||0); }, 0);
  var fatPorCartao = {};
  fatItens.forEach(function(i){
    var n = i.cartao || 'Sem cart\u00e3o';
    if(!fatPorCartao[n]) fatPorCartao[n] = 0;
    fatPorCartao[n] += Number(i.valor)||0;
  });

  // Contratos
  var contAtivos = S.contratos.filter(function(c){ return !c.encerradoEm; }).length;
  var contRecMes = 0, contDespMes = 0;
  E.forEach(function(e){
    if(e.origem === 'Contrato'){
      if(e.tipo === 'receita') contRecMes += e.valor;
      else contDespMes += e.valor;
    }
  });

  // Assinaturas
  var assAtivas = S.assinaturas.filter(function(s){ return !s.encerradaEm; }).length;
  var totalAssMes = 0;
  E.forEach(function(e){
    if(e.origem && e.origem.indexOf('Assinatura') === 0) totalAssMes += e.valor;
  });

  // ===== HTML =====
  var h = '';

  // Quick actions
  h += '<div class="res-quick-row">';
  h += '<div class="res-quick-btn" onclick="nav(\'checkpag\')">&#9989; Check Pagamentos</div>';
  h += '<div class="res-quick-btn" onclick="nav(\'extratoCat\')">&#128202; Extrato Categorizado</div>';
  h += '<div class="res-quick-btn" onclick="nav(\'lancs\')">&#128221; Novo Lan\u00e7amento</div>';
  h += '</div>';

  // ── LINHA 1: Receitas, Despesas, Saldo ──
  h += '<div class="res-cards-main">';

  // Receitas
  h += '<div class="res-card card-receita res-clickable" onclick="window._resShowRecAll()">';
  h += '<div class="rc-label"><span class="rc-icon">&#128200;</span>Receitas</div>';
  h += '<div class="rc-value" style="color:var(--ok)">' + fmtV(rec) + '</div>';
  h += subsRow(
    'Recebido', fmtV(recConf), 'color:var(--ok)', {cls:'ok', txt:recConfCount},
    'Pendente', fmtV(recPend), 'color:var(--wn)', {cls:'pend', txt:recPendCount}
  );
  h += '</div>';

  // Despesas
  h += '<div class="res-card card-despesa res-clickable" onclick="window._resShowDespAll()">';
  h += '<div class="rc-label"><span class="rc-icon">&#128201;</span>Despesas</div>';
  h += '<div class="rc-value" style="color:var(--dn2)">' + fmtV(desp) + '</div>';
  h += subsRow(
    'Pagas', fmtV(despConf), 'color:var(--ok)', {cls:'ok', txt:despConfCount},
    'Pendentes', fmtV(despPend), 'color:var(--wn)', {cls:'pend', txt:despPendCount}
  );
  h += '</div>';

  // Saldo
  h += '<div class="res-card card-saldo">';
  h += '<div class="rc-label"><span class="rc-icon">&#128176;</span>Saldo</div>';
  h += '<div class="rc-value" style="color:' + (saldo >= 0 ? 'var(--inf2)' : 'var(--dn2)') + '">' + fmtV(saldo) + '</div>';
  h += subsRow(
    'Confirmado', fmtV(saldoConf), 'color:' + (saldoConf >= 0 ? 'var(--ok)' : 'var(--dn2)'), null,
    'Projetado', fmtV(saldo), 'color:' + (saldo >= 0 ? 'var(--inf2)' : 'var(--dn2)'), null
  );
  h += '</div>';

  h += '</div>';

  // ── LINHA 2: Cartão, Contratos, Assinaturas ──
  h += '<div class="res-cards-secondary">';

  // Fatura Cartão
  h += '<div class="res-card card-cartao res-clickable" onclick="window._resShowFatura()">';
  h += '<div class="rc-label"><span class="rc-icon">&#128179;</span>Fatura Cart\u00e3o</div>';
  h += '<div class="rc-value" style="color:#e65100">' + fmtV(fatTotal) + '</div>';
  var cNames = Object.keys(fatPorCartao);
  if(cNames.length){
    cNames.forEach(function(n){ h += subLine(n, fmtV(fatPorCartao[n]), 'color:#e65100'); });
  } else {
    h += subLine('Nenhuma compra', '-', 'color:var(--tx3)');
  }
  h += '</div>';

  // Contratos
  h += '<div class="res-card card-contrato res-clickable" onclick="nav(\'contratos\')">';
  h += '<div class="rc-label"><span class="rc-icon">&#128196;</span>Contratos</div>';
  h += '<div class="rc-value" style="color:var(--pri2)">' + contAtivos + ' <small style="font-size:.5em;color:var(--tx3)">ativos</small></div>';
  if(contRecMes > 0) h += subLine('Receita', fmtV(contRecMes), 'color:var(--ok)');
  if(contDespMes > 0) h += subLine('Despesa', fmtV(contDespMes), 'color:var(--dn2)');
  if(!contRecMes && !contDespMes) h += subLine('Total no m\u00eas', 'R$ 0,00', 'color:var(--tx3)');
  h += '</div>';

  // Assinaturas
  h += '<div class="res-card card-assinatura res-clickable" onclick="nav(\'assinaturas\')">';
  h += '<div class="rc-label"><span class="rc-icon">&#128257;</span>Assinaturas</div>';
  h += '<div class="rc-value" style="color:var(--wn)">' + assAtivas + ' <small style="font-size:.5em;color:var(--tx3)">ativas</small></div>';
  h += subLine('Total no m\u00eas', fmtV(totalAssMes), 'color:var(--wn)');
  h += '</div>';

  h += '</div>';

  g('resumoCards').innerHTML = h;

  // ===== GRÁFICOS =====
  var meses = [];
  for(var i = -5; i <= 0; i++) meses.push(addMes(curMes, i));
  var data = meses.map(function(m){
    var e = allEntries(m), r = 0, d = 0;
    e.forEach(function(x){ if(x.tipo === 'receita') r += x.valor; else d += x.valor; });
    return {m:m, r:r, d:d};
  });
  var gMax = Math.max.apply(null, data.map(function(x){ return Math.max(x.r, x.d); }).concat([1]));
  g('barChart').innerHTML = data.map(function(x){
    return '<div class="bar-group">' +
      '<div class="bar-top-val g">' + fmtI(x.r) + '</div>' +
      '<div class="bar-top-val r">' + fmtI(x.d) + '</div>' +
      '<div class="bar-bars">' +
        '<div class="bar rec" style="height:' + Math.max((x.r / gMax) * 160, 4) + 'px"></div>' +
        '<div class="bar desp" style="height:' + Math.max((x.d / gMax) * 160, 4) + 'px"></div>' +
      '</div>' +
      '<div class="bar-bottom"><div class="bar-label">' + mesNome(x.m) + '</div></div>' +
    '</div>';
  }).join('');

  var catMap = {};
  E.filter(function(e){ return e.tipo === 'despesa'; }).forEach(function(e){
    catMap[e.cat] = (catMap[e.cat] || 0) + e.valor;
  });
  var top = Object.entries(catMap).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 6);
  var maxC = top.length ? top[0][1] : 1;
  g('topCats').innerHTML = top.length ? top.map(function(t){
    return '<div class="top-cat-item"><div class="top-cat-hdr"><span>' + t[0] + '</span><span style="font-weight:700">' + fmtV(t[1]) + '</span></div>' +
      '<div class="top-cat-bar"><div class="top-cat-fill" style="width:' + (t[1] / maxC) * 100 + '%"></div></div></div>';
  }).join('') : '<p style="color:var(--tx3)">Sem despesas</p>';

  // Dados para modais
  window._resData = {
    recItems: recItems, despItems: despItems,
    recConfItems: recConfItems, recPendItems: recPendItems,
    despConfItems: despConfItems, despPendItems: despPendItems,
    fatItens: fatItens, fatTotal: fatTotal
  };
};

// ================================================================
// MODAIS
// ================================================================
window._resShowRecAll = function(){
  showDetail('Receitas \u2014 ' + mesNomeFull(curMes), (window._resData||{}).recItems || [], 'green');
};
window._resShowDespAll = function(){
  showDetail('Despesas \u2014 ' + mesNomeFull(curMes), (window._resData||{}).despItems || [], 'red');
};
window._resShowFatura = function(){
  var d = window._resData || {};
  var fatItens = d.fatItens || [];
  document.getElementById('resDetTitle').textContent = 'Fatura Cart\u00e3o \u2014 ' + mesNomeFull(curMes);
  var h = '';
  if(!fatItens.length){
    h = '<div class="res-det-empty">Nenhuma compra no cart\u00e3o neste m\u00eas.</div>';
  } else {
    var porCartao = {};
    fatItens.forEach(function(i){
      var n = i.cartao || 'Sem cart\u00e3o';
      if(!porCartao[n]) porCartao[n] = [];
      porCartao[n].push(i);
    });
    h = '<div class="res-det-list">';
    Object.keys(porCartao).forEach(function(cartao){
      var itens = porCartao[cartao];
      var sub = itens.reduce(function(s,i){ return s + (Number(i.valor)||0); }, 0);
      h += '<div style="padding:10px 12px;background:var(--bg3);font-weight:700;font-size:.85em;border-bottom:1px solid var(--bg4);">&#128179; ' + cartao + ' <span style="float:right;color:#e65100">' + fmtV(sub) + '</span></div>';
      itens.forEach(function(item){
        h += '<div class="res-det-item"><span class="rdi-desc">' + (item.desc||'-') + '</span><span class="rdi-meta">' + (item.tipo||'') + (item.cat ? ' \u00b7 '+item.cat : '') + '</span><span class="rdi-val" style="color:#e65100">' + fmtV(item.valor) + '</span></div>';
      });
    });
    h += '</div>';
    h += '<div class="res-det-total"><span>Total Fatura</span><span style="color:#e65100">' + fmtV(d.fatTotal||0) + '</span></div>';
  }
  document.getElementById('resDetBody').innerHTML = h;
  openM('modalResDet');
};

console.log('[Financeiro Pro] Resumo Enhanced v3 \u2014 Layout mobile otimizado, cards coluna \u00fanica, subs lado a lado.');
})();

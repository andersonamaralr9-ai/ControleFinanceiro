// resumo-enhanced.js v1 — Tela de Resumo Melhorada
// Adiciona: Compras pagas/pendentes, Valores a receber, Fatura do cartão
// Substitua ou adicione este arquivo no index.html antes de </body>
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── RESUMO ENHANCED v1 ── */

/* Nova grade de cards: 3 colunas principais */
.res-cards-main{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
.res-cards-secondary{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px;}

/* Card com sub-valores */
.res-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:18px 16px;box-shadow:var(--sh);transition:transform .2s;}
.res-card:hover{transform:translateY(-3px);}
.res-card .rc-label{font-size:.68em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
.res-card .rc-value{font-size:1.3em;font-weight:700;margin-bottom:8px;}
.res-card .rc-sub{display:flex;justify-content:space-between;align-items:center;font-size:.76em;padding:4px 0;border-top:1px solid var(--bg3);}
.res-card .rc-sub-label{color:var(--tx3);}
.res-card .rc-sub-val{font-weight:600;}
.res-card .rc-badge{display:inline-block;font-size:.62em;padding:2px 7px;border-radius:10px;font-weight:700;margin-left:6px;}
.res-card .rc-badge.ok{background:rgba(0,206,201,.15);color:var(--ok);}
.res-card .rc-badge.pend{background:rgba(253,203,110,.15);color:var(--wn);}

/* Card destaque com borda */
.res-card.card-receita{border-top:3px solid var(--ok);}
.res-card.card-despesa{border-top:3px solid var(--dn2);}
.res-card.card-saldo{border-top:3px solid var(--inf2);}
.res-card.card-cartao{border-top:3px solid #e65100;}
.res-card.card-contrato{border-top:3px solid var(--pri);}
.res-card.card-assinatura{border-top:3px solid var(--wn);}

/* Ícone no label */
.res-card .rc-icon{margin-right:4px;}

/* Seção de gráficos */
.res-chart-section{display:grid;grid-template-columns:5fr 3fr;gap:20px;margin-bottom:24px;}
.res-chart-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:20px;box-shadow:var(--sh);}
.res-chart-box h3{font-size:.9em;margin-bottom:16px;color:var(--tx2);font-weight:600;}

/* Quick actions */
.res-quick-row{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.res-quick-btn{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:10px 16px;font-size:.78em;color:var(--tx2);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;font-weight:600;}
.res-quick-btn:hover{border-color:var(--pri);color:var(--pri2);transform:translateY(-1px);}

/* Clicável */
.res-clickable{cursor:pointer;transition:opacity .15s;}
.res-clickable:hover{opacity:.8;}

/* Modal detalhamento */
.res-det-list{max-height:400px;overflow-y:auto;}
.res-det-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:.85em;}
.res-det-item:hover{background:var(--bg3);}
.res-det-item:last-child{border:none;}
.res-det-item .rdi-desc{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}
.res-det-item .rdi-meta{font-size:.72em;color:var(--tx3);margin-left:8px;flex-shrink:0;}
.res-det-item .rdi-val{font-weight:700;flex-shrink:0;margin-left:12px;}
.res-det-total{display:flex;justify-content:space-between;padding:12px;font-weight:700;font-size:.95em;border-top:2px solid var(--bg4);margin-top:4px;}
.res-det-empty{text-align:center;padding:30px;color:var(--tx3);font-size:.88em;}

@media(max-width:768px){
  .res-cards-main{grid-template-columns:1fr 1fr;gap:10px;}
  .res-cards-secondary{grid-template-columns:1fr 1fr;gap:10px;}
  .res-card{padding:12px 10px;}
  .res-card .rc-value{font-size:1.05em;}
  .res-card .rc-sub{font-size:.7em;}
  .res-chart-section{grid-template-columns:1fr;gap:14px;}
  .res-quick-row{gap:6px;}
  .res-quick-btn{padding:8px 10px;font-size:.72em;}
}
@media(max-width:380px){
  .res-cards-main{grid-template-columns:1fr;}
  .res-cards-secondary{grid-template-columns:1fr;}
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
        '<span class="rdi-meta">' + (e.origem || '') + '</span>' +
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

// ================================================================
// OVERRIDE renderResumo
// ================================================================
var _origRenderResumo = window.renderResumo;

window.renderResumo = function(){
  g('mesLabel').textContent = mesNomeFull(curMes);

  var E = allEntries(curMes);
  var checks = getCheckStatus(curMes);

  // ===== CÁLCULOS PRINCIPAIS =====
  var rec = 0, desp = 0;
  var recConf = 0, recPend = 0, recConfCount = 0, recPendCount = 0;
  var despConf = 0, despPend = 0, despConfCount = 0, despPendCount = 0;
  var recItems = [], despItems = [];
  var recConfItems = [], recPendItems = [], despConfItems = [], despPendItems = [];

  E.forEach(function(e){
    var isPago = !!checks[buildItemKey(e)];
    if(e.tipo === 'receita'){
      rec += e.valor;
      recItems.push(e);
      if(isPago){ recConf += e.valor; recConfCount++; recConfItems.push(e); }
      else { recPend += e.valor; recPendCount++; recPendItems.push(e); }
    } else {
      desp += e.valor;
      despItems.push(e);
      if(isPago){ despConf += e.valor; despConfCount++; despConfItems.push(e); }
      else { despPend += e.valor; despPendCount++; despPendItems.push(e); }
    }
  });

  var saldo = rec - desp;

  // ===== FATURA CARTÃO =====
  var fatItens = typeof faturaCC === 'function' ? faturaCC(curMes) : [];
  var fatTotal = fatItens.reduce(function(s, i){ return s + (Number(i.valor) || 0); }, 0);

  // Agrupar por cartão
  var fatPorCartao = {};
  fatItens.forEach(function(i){
    var nome = i.cartao || 'Sem cartão';
    if(!fatPorCartao[nome]) fatPorCartao[nome] = 0;
    fatPorCartao[nome] += Number(i.valor) || 0;
  });

    // Card Contratos — separar receita e despesa
  var contRecMes = 0, contDespMes = 0;
  E.forEach(function(e){
    if(e.origem === 'Contrato'){
      if(e.tipo === 'receita') contRecMes += e.valor;
      else contDespMes += e.valor;
    }
  });

  html += '<div class="res-card card-contrato res-clickable" onclick="nav(\'contratos\')">';
  html += '<div class="rc-label"><span class="rc-icon">&#128196;</span>Contratos</div>';
  html += '<div class="rc-value" style="color:var(--pri2)">' + contAtivos + ' <small style="font-size:.5em;color:var(--tx3)">ativos</small></div>';
  if(contRecMes > 0) html += '<div class="rc-sub"><span class="rc-sub-label">Receita</span><span class="rc-sub-val" style="color:var(--ok)">' + fmtV(contRecMes) + '</span></div>';
  if(contDespMes > 0) html += '<div class="rc-sub"><span class="rc-sub-label">Despesa</span><span class="rc-sub-val" style="color:var(--dn2)">' + fmtV(contDespMes) + '</span></div>';
  if(!contRecMes && !contDespMes) html += '<div class="rc-sub"><span class="rc-sub-label">Total no m\u00eas</span><span class="rc-sub-val" style="color:var(--tx3)">R$ 0,00</span></div>';
  html += '</div>';


  // ===== HTML CARDS PRINCIPAIS =====
  var html = '';

  // Atalhos rápidos
  html += '<div class="res-quick-row">';
  html += '<div class="res-quick-btn" onclick="nav(\'checkpag\')">&#9989; Check Pagamentos</div>';
  html += '<div class="res-quick-btn" onclick="nav(\'extratoCat\')">&#128202; Extrato Categorizado</div>';
  html += '<div class="res-quick-btn" onclick="nav(\'lancs\')">&#128221; Novo Lançamento</div>';
  html += '</div>';

  // Linha 1: Receitas, Despesas, Saldo (3 colunas)
  html += '<div class="res-cards-main">';

  // Card Receitas
  html += '<div class="res-card card-receita res-clickable" onclick="window._resShowRecAll()">';
  html += '<div class="rc-label"><span class="rc-icon">&#128200;</span>Receitas</div>';
  html += '<div class="rc-value" style="color:var(--ok)">' + fmtV(rec) + '</div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Recebido</span><span class="rc-sub-val" style="color:var(--ok)">' + fmtV(recConf) + ' <span class="rc-badge ok">' + recConfCount + '</span></span></div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Pendente</span><span class="rc-sub-val" style="color:var(--wn)">' + fmtV(recPend) + ' <span class="rc-badge pend">' + recPendCount + '</span></span></div>';
  html += '</div>';

  // Card Despesas
  html += '<div class="res-card card-despesa res-clickable" onclick="window._resShowDespAll()">';
  html += '<div class="rc-label"><span class="rc-icon">&#128201;</span>Despesas</div>';
  html += '<div class="rc-value" style="color:var(--dn2)">' + fmtV(desp) + '</div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Pagas</span><span class="rc-sub-val" style="color:var(--ok)">' + fmtV(despConf) + ' <span class="rc-badge ok">' + despConfCount + '</span></span></div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Pendentes</span><span class="rc-sub-val" style="color:var(--wn)">' + fmtV(despPend) + ' <span class="rc-badge pend">' + despPendCount + '</span></span></div>';
  html += '</div>';

  // Card Saldo
  html += '<div class="res-card card-saldo">';
  html += '<div class="rc-label"><span class="rc-icon">&#128176;</span>Saldo</div>';
  html += '<div class="rc-value" style="color:' + (saldo >= 0 ? 'var(--inf2)' : 'var(--dn2)') + '">' + fmtV(saldo) + '</div>';
  var saldoConf = recConf - despConf;
  var saldoPend = recPend - despPend;
  html += '<div class="rc-sub"><span class="rc-sub-label">Confirmado</span><span class="rc-sub-val" style="color:' + (saldoConf >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldoConf) + '</span></div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Projetado</span><span class="rc-sub-val" style="color:' + (saldo >= 0 ? 'var(--inf2)' : 'var(--dn2)') + '">' + fmtV(saldo) + '</span></div>';
  html += '</div>';

  html += '</div>';

  // Linha 2: Cartão, Contratos, Assinaturas
  html += '<div class="res-cards-secondary">';

  // Card Cartão de Crédito
  html += '<div class="res-card card-cartao res-clickable" onclick="window._resShowFatura()">';
  html += '<div class="rc-label"><span class="rc-icon">&#128179;</span>Fatura Cart\u00e3o</div>';
  html += '<div class="rc-value" style="color:#e65100">' + fmtV(fatTotal) + '</div>';
  var cartNames = Object.keys(fatPorCartao);
  if(cartNames.length){
    cartNames.forEach(function(nome){
      html += '<div class="rc-sub"><span class="rc-sub-label">' + nome + '</span><span class="rc-sub-val" style="color:#e65100">' + fmtV(fatPorCartao[nome]) + '</span></div>';
    });
  } else {
    html += '<div class="rc-sub"><span class="rc-sub-label">Nenhuma compra</span><span class="rc-sub-val" style="color:var(--tx3)">-</span></div>';
  }
  html += '</div>';

  // Card Contratos
  html += '<div class="res-card card-contrato res-clickable" onclick="nav(\'contratos\')">';
  html += '<div class="rc-label"><span class="rc-icon">&#128196;</span>Contratos</div>';
  html += '<div class="rc-value" style="color:var(--pri2)">' + contAtivos + ' <small style="font-size:.5em;color:var(--tx3)">ativos</small></div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Total no mês</span><span class="rc-sub-val" style="color:var(--pri2)">' + fmtV(totalContMes) + '</span></div>';
  html += '</div>';

  // Card Assinaturas
  html += '<div class="res-card card-assinatura res-clickable" onclick="nav(\'assinaturas\')">';
  html += '<div class="rc-label"><span class="rc-icon">&#128257;</span>Assinaturas</div>';
  html += '<div class="rc-value" style="color:var(--wn)">' + assAtivas + ' <small style="font-size:.5em;color:var(--tx3)">ativas</small></div>';
  html += '<div class="rc-sub"><span class="rc-sub-label">Total no mês</span><span class="rc-sub-val" style="color:var(--wn)">' + fmtV(totalAssMes) + '</span></div>';
  html += '</div>';

  html += '</div>';

  g('resumoCards').innerHTML = html;

  // ===== GRÁFICOS (manter bar chart e top categorias) =====
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

  // ===== ARMAZENAR DADOS PARA MODAIS =====
  window._resData = {
    recItems: recItems, despItems: despItems,
    recConfItems: recConfItems, recPendItems: recPendItems,
    despConfItems: despConfItems, despPendItems: despPendItems,
    fatItens: fatItens, fatTotal: fatTotal
  };
};

// ================================================================
// MODAIS DE DETALHAMENTO
// ================================================================
window._resShowRecAll = function(){
  var d = window._resData || {};
  showDetail('Receitas \u2014 ' + mesNomeFull(curMes), d.recItems || [], 'green');
};
window._resShowDespAll = function(){
  var d = window._resData || {};
  showDetail('Despesas \u2014 ' + mesNomeFull(curMes), d.despItems || [], 'red');
};
window._resShowFatura = function(){
  var d = window._resData || {};
  var fatItens = d.fatItens || [];
  document.getElementById('resDetTitle').textContent = 'Fatura Cart\u00e3o \u2014 ' + mesNomeFull(curMes);

  var h = '';
  if(!fatItens.length){
    h = '<div class="res-det-empty">Nenhuma compra no cart\u00e3o neste m\u00eas.</div>';
  } else {
    // Agrupar por cartão
    var porCartao = {};
    fatItens.forEach(function(i){
      var nome = i.cartao || 'Sem cart\u00e3o';
      if(!porCartao[nome]) porCartao[nome] = [];
      porCartao[nome].push(i);
    });

    h = '<div class="res-det-list">';
    Object.keys(porCartao).forEach(function(cartao){
      var itens = porCartao[cartao];
      var subtotal = itens.reduce(function(s, i){ return s + (Number(i.valor) || 0); }, 0);
      h += '<div style="padding:10px 12px;background:var(--bg3);font-weight:700;font-size:.85em;border-bottom:1px solid var(--bg4);">' +
        '&#128179; ' + cartao + ' <span style="float:right;color:#e65100">' + fmtV(subtotal) + '</span></div>';
      itens.forEach(function(item){
        h += '<div class="res-det-item">' +
          '<span class="rdi-desc">' + (item.desc || '-') + '</span>' +
          '<span class="rdi-meta">' + (item.tipo || '') + (item.cat ? ' \u00b7 ' + item.cat : '') + '</span>' +
          '<span class="rdi-val" style="color:#e65100">' + fmtV(item.valor) + '</span>' +
          '</div>';
      });
    });
    h += '</div>';
    h += '<div class="res-det-total"><span>Total Fatura</span><span style="color:#e65100">' + fmtV(d.fatTotal || 0) + '</span></div>';
  }

  document.getElementById('resDetBody').innerHTML = h;
  openM('modalResDet');
};

console.log('[Financeiro Pro] Resumo Enhanced v1 \u2014 Despesas pagas/pendentes, Receitas confirmadas/pendentes, Fatura cart\u00e3o.');
})();

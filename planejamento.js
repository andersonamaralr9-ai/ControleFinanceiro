// planejamento.js v1 — Planejamento Mensal Gerencial
// Substitui o renderPlan original com UI visual + comparativo + despesas sem orçamento
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── PLANEJAMENTO GERENCIAL ── */
.pl-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:24px;}
.pl-scard{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:18px;box-shadow:var(--sh);text-align:center;transition:transform .2s;}
.pl-scard:hover{transform:translateY(-3px);}
.pl-scard .pl-scard-label{font-size:.7em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px;font-weight:700;}
.pl-scard .pl-scard-value{font-size:1.3em;font-weight:700;}
.pl-scard .pl-scard-value.green{color:var(--ok);}
.pl-scard .pl-scard-value.red{color:var(--dn2);}
.pl-scard .pl-scard-value.blue{color:var(--inf2);}
.pl-scard .pl-scard-value.yellow{color:var(--wn);}
.pl-scard .pl-scard-value.purple{color:var(--pri2);}

.pl-cats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-bottom:28px;}
.pl-cat-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:18px;box-shadow:var(--sh);transition:transform .2s;}
.pl-cat-card:hover{transform:translateY(-2px);}
.pl-cat-card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.pl-cat-card-header h4{font-size:.95em;font-weight:700;margin:0;}
.pl-cat-card-header .pl-pct{font-size:.85em;font-weight:700;padding:3px 10px;border-radius:20px;}
.pl-pct-ok{background:rgba(0,206,201,.15);color:var(--ok);}
.pl-pct-warn{background:rgba(253,203,110,.15);color:var(--wn);}
.pl-pct-danger{background:rgba(214,48,49,.15);color:var(--dn2);}
.pl-bar-wrap{background:var(--bg3);border-radius:6px;height:14px;overflow:hidden;margin-bottom:10px;}
.pl-bar-fill{height:100%;border-radius:6px;transition:width .5s ease;}
.pl-bar-ok{background:var(--okG);}
.pl-bar-warn{background:var(--wnG);}
.pl-bar-danger{background:var(--dnG);}
.pl-cat-card-info{display:flex;justify-content:space-between;font-size:.82em;color:var(--tx2);}
.pl-cat-card-info span{display:flex;flex-direction:column;align-items:center;gap:2px;}
.pl-cat-card-info .pl-val{font-weight:700;font-size:1em;color:var(--tx);}
.pl-cat-card-actions{margin-top:12px;display:flex;gap:6px;justify-content:flex-end;}
.pl-cat-card .pl-icon-alert{font-size:1.1em;margin-right:4px;}

.pl-section{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:20px;box-shadow:var(--sh);margin-bottom:24px;}
.pl-section h3{font-size:.95em;margin-bottom:14px;color:var(--tx2);font-weight:600;}

.pl-no-budget{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;}
.pl-no-budget-item{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:8px;border-left:3px solid var(--wn);}
.pl-no-budget-item .pl-nb-cat{font-size:.88em;font-weight:600;}
.pl-no-budget-item .pl-nb-val{font-size:.82em;color:var(--dn2);font-weight:700;margin:0 10px;}
.pl-no-budget-item .btn{flex-shrink:0;}

.pl-comp-table{width:100%;border-collapse:collapse;margin-top:10px;}
.pl-comp-table th{background:var(--bg3);padding:10px 12px;text-align:left;font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;}
.pl-comp-table td{padding:9px 12px;border-bottom:1px solid var(--bg3);font-size:.82em;}
.pl-comp-table tr:hover td{background:rgba(108,92,231,.03);}
.pl-comp-table .pl-comp-cat{font-weight:600;}
.pl-comp-val-ok{color:var(--ok);font-weight:700;}
.pl-comp-val-dn{color:var(--dn2);font-weight:700;}
.pl-comp-val-tx{color:var(--tx2);}

.pl-btn-copy{margin-bottom:20px;}

@media(max-width:768px){
  .pl-summary{grid-template-columns:1fr 1fr;gap:10px;}
  .pl-scard{padding:12px;}
  .pl-scard .pl-scard-value{font-size:1.05em;}
  .pl-cats-grid{grid-template-columns:1fr;}
  .pl-no-budget{grid-template-columns:1fr;}
  .pl-comp-table{font-size:.75em;}
  .pl-comp-table th,.pl-comp-table td{padding:7px 8px;}
}
`;
document.head.appendChild(sty);

// ================================================================
// HELPER: Buscar gasto real de uma categoria em um mês
// Usa allEntries (que inclui lançamentos, contratos, cartões, assinaturas)
// ================================================================
function plGetGasto(cat, mes){
  var E = allEntries(mes);
  var total = 0;
  for(var i = 0; i < E.length; i++){
    if(E[i].tipo === 'despesa' && E[i].cat === cat){
      total += E[i].valor;
    }
  }
  return total;
}

// ================================================================
// HELPER: Todas as categorias com gasto no mês (despesas)
// ================================================================
function plGetCatsComGasto(mes){
  var E = allEntries(mes);
  var map = {};
  for(var i = 0; i < E.length; i++){
    if(E[i].tipo === 'despesa'){
      map[E[i].cat] = (map[E[i].cat] || 0) + E[i].valor;
    }
  }
  return map;
}

// ================================================================
// COPIAR MÊS ANTERIOR
// ================================================================
window._plCopyPrev = function(){
  var prev = addMes(planMes, -1);
  var pm = S.planejamento[prev];
  if(!pm || !Object.keys(pm).length){
    toast('Nenhum limite definido em ' + mesNomeFull(prev), 'error');
    return;
  }
  if(!S.planejamento[planMes]) S.planejamento[planMes] = {};
  var added = 0;
  var cats = Object.keys(pm);
  for(var i = 0; i < cats.length; i++){
    if(!S.planejamento[planMes][cats[i]]){
      S.planejamento[planMes][cats[i]] = pm[cats[i]];
      added++;
    }
  }
  if(added === 0){
    toast('Todas as categorias já possuem limite neste mês.', 'info');
  } else {
    salvar();
    toast(added + ' limite(s) copiado(s) de ' + mesNomeFull(prev), 'success');
    renderPlan();
  }
};

// ================================================================
// ADICIONAR LIMITE PARA CATEGORIA SEM ORÇAMENTO
// ================================================================
window._plAddLimitCat = function(cat){
  var val = prompt('Definir limite para "' + cat + '" em ' + mesNomeFull(planMes) + ':\n\nValor (R$):');
  if(!val) return;
  var n = parseN(val);
  if(!n || n <= 0){
    alert('Valor inválido.');
    return;
  }
  if(!S.planejamento[planMes]) S.planejamento[planMes] = {};
  S.planejamento[planMes][cat] = n;
  salvar();
  toast('Limite de ' + fmtV(n) + ' definido para ' + cat, 'success');
  renderPlan();
};

// ================================================================
// EDITAR LIMITE
// ================================================================
window._plEditLimit = function(cat){
  var pm = S.planejamento[planMes] || {};
  var atual = pm[cat] || 0;
  var val = prompt('Editar limite de "' + cat + '":\n\nValor atual: ' + fmtV(atual) + '\nNovo valor (R$):');
  if(val === null) return;
  var n = parseN(val);
  if(!n || n <= 0){
    alert('Valor inválido.');
    return;
  }
  if(!S.planejamento[planMes]) S.planejamento[planMes] = {};
  S.planejamento[planMes][cat] = n;
  salvar();
  toast('Limite atualizado para ' + fmtV(n), 'success');
  renderPlan();
};

// ================================================================
// DELETAR LIMITE
// ================================================================
window._plDelLimit = function(cat){
  if(!confirm('Remover limite de "' + cat + '"?')) return;
  if(S.planejamento[planMes]){
    delete S.planejamento[planMes][cat];
  }
  salvar();
  toast('Limite removido', 'success');
  renderPlan();
};

// ================================================================
// OVERRIDE: renderPlan
// ================================================================
var _origRenderPlan = window.renderPlan;

window.renderPlan = function(){
  // Atualizar label do mês e select de categorias (como o original)
  var planLabel = document.getElementById('planMesLabel');
  if(planLabel) planLabel.textContent = mesNomeFull(planMes);

  var sc = document.getElementById('planCat');
  if(sc){
    sc.innerHTML = '';
    getCats('despesa').forEach(function(c){
      sc.innerHTML += '<option>' + c + '</option>';
    });
  }

  // Dados do planejamento
  var pm = S.planejamento[planMes] || {};
  var cats = Object.keys(pm);
  var gastosMap = plGetCatsComGasto(planMes);

  // Cálculos globais
  var totalOrc = 0, totalGasto = 0;
  var alertCount = 0;
  for(var i = 0; i < cats.length; i++){
    var lim = pm[cats[i]] || 0;
    var gasto = plGetGasto(cats[i], planMes);
    totalOrc += lim;
    totalGasto += gasto;
    var pct = lim ? Math.round(gasto / lim * 100) : 0;
    if(pct > 80) alertCount++;
  }
  var totalDisp = totalOrc - totalGasto;
  var totalPct = totalOrc ? Math.round(totalGasto / totalOrc * 100) : 0;

  // Despesas sem orçamento
  var semOrc = [];
  var gastoKeys = Object.keys(gastosMap);
  for(var j = 0; j < gastoKeys.length; j++){
    if(!pm[gastoKeys[j]]){
      semOrc.push({cat: gastoKeys[j], valor: gastosMap[gastoKeys[j]]});
    }
  }
  semOrc.sort(function(a, b){ return b.valor - a.valor; });

  // ── MONTAR HTML ──

  // Container dinâmico
  var container = document.getElementById('plGerencialArea');
  if(!container){
    container = document.createElement('div');
    container.id = 'plGerencialArea';
    var tbWrap = document.querySelector('#pg-planejamento .table-wrap');
    if(tbWrap) tbWrap.parentNode.insertBefore(container, tbWrap);
  }

  // Esconder tabela original
  var tbWrapOrig = document.querySelector('#pg-planejamento .table-wrap');
  if(tbWrapOrig) tbWrapOrig.style.display = 'none';

  var h = '';

  // ── BOTÃO COPIAR MÊS ANTERIOR ──
  h += '<div class="pl-btn-copy">';
  h += '<button class="btn btn-outline" onclick="window._plCopyPrev()" title="Copiar limites do mês anterior">&#128203; Copiar Mês Anterior</button>';
  h += '</div>';

  // ── SUMMARY CARDS ──
  var pctColor = totalPct > 100 ? 'red' : totalPct > 80 ? 'yellow' : 'green';
  h += '<div class="pl-summary">';
  h += '<div class="pl-scard"><div class="pl-scard-label">Orçamento Total</div><div class="pl-scard-value blue">' + fmtV(totalOrc) + '</div></div>';
  h += '<div class="pl-scard"><div class="pl-scard-label">Total Gasto</div><div class="pl-scard-value red">' + fmtV(totalGasto) + '</div></div>';
  h += '<div class="pl-scard"><div class="pl-scard-label">Disponível</div><div class="pl-scard-value ' + (totalDisp >= 0 ? 'green' : 'red') + '">' + fmtV(totalDisp) + '</div></div>';
  h += '<div class="pl-scard"><div class="pl-scard-label">% Consumido</div><div class="pl-scard-value ' + pctColor + '">' + totalPct + '%</div></div>';
  h += '<div class="pl-scard"><div class="pl-scard-label">Categorias</div><div class="pl-scard-value purple">' + cats.length + '</div></div>';
  h += '<div class="pl-scard"><div class="pl-scard-label">Em Alerta</div><div class="pl-scard-value ' + (alertCount > 0 ? 'red' : 'green') + '">' + alertCount + '</div></div>';
  h += '</div>';

  // ── CATEGORY CARDS ──
  if(cats.length){
    // Ordenar categorias: estouradas primeiro, depois por % decrescente
    var catData = cats.map(function(cat){
      var lim = pm[cat] || 0;
      var gasto = plGetGasto(cat, planMes);
      var disp = lim - gasto;
      var pct = lim ? Math.round(gasto / lim * 100) : 0;
      return {cat: cat, lim: lim, gasto: gasto, disp: disp, pct: pct};
    });
    catData.sort(function(a, b){ return b.pct - a.pct; });

    h += '<div class="pl-cats-grid">';
    for(var k = 0; k < catData.length; k++){
      var cd = catData[k];
      var barClass, pctClass, icon;
      if(cd.pct > 100){
        barClass = 'pl-bar-danger';
        pctClass = 'pl-pct-danger';
        icon = '<span class="pl-icon-alert">&#9888;&#65039;</span>';
      } else if(cd.pct > 80){
        barClass = 'pl-bar-warn';
        pctClass = 'pl-pct-warn';
        icon = '<span class="pl-icon-alert">&#9888;</span>';
      } else {
        barClass = 'pl-bar-ok';
        pctClass = 'pl-pct-ok';
        icon = '';
      }
      var catEsc = cd.cat.replace(/'/g, "\\'");

      h += '<div class="pl-cat-card">';
      h += '<div class="pl-cat-card-header">';
      h += '<h4>' + icon + cd.cat + '</h4>';
      h += '<span class="pl-pct ' + pctClass + '">' + cd.pct + '%</span>';
      h += '</div>';
      h += '<div class="pl-bar-wrap"><div class="pl-bar-fill ' + barClass + '" style="width:' + Math.min(cd.pct, 100) + '%"></div></div>';
      h += '<div class="pl-cat-card-info">';
      h += '<span>Limite<br><span class="pl-val">' + fmtV(cd.lim) + '</span></span>';
      h += '<span>Gasto<br><span class="pl-val" style="color:var(--dn2)">' + fmtV(cd.gasto) + '</span></span>';
      h += '<span>Disponível<br><span class="pl-val" style="color:' + (cd.disp >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(cd.disp) + '</span></span>';
      h += '</div>';
      h += '<div class="pl-cat-card-actions">';
      h += '<button class="btn btn-sm btn-outline" onclick="window._plEditLimit(\'' + catEsc + '\')" title="Editar limite">&#9998;</button>';
      h += '<button class="btn btn-sm btn-danger" onclick="window._plDelLimit(\'' + catEsc + '\')" title="Remover limite">&#128465;</button>';
      h += '</div>';
      h += '</div>';
    }
    h += '</div>';
  } else {
    h += '<div class="pl-section"><p style="text-align:center;color:var(--tx3);padding:20px">Nenhum limite definido para este mês. Use o formulário acima para adicionar ou clique em "Copiar Mês Anterior".</p></div>';
  }

  // ── DESPESAS SEM ORÇAMENTO ──
  if(semOrc.length){
    h += '<div class="pl-section">';
    h += '<h3>&#9888; Despesas sem Orçamento (' + semOrc.length + ')</h3>';
    h += '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Categorias com gastos neste mês, mas sem limite definido.</p>';
    h += '<div class="pl-no-budget">';
    for(var n = 0; n < semOrc.length; n++){
      var so = semOrc[n];
      var soEsc = so.cat.replace(/'/g, "\\'");
      h += '<div class="pl-no-budget-item">';
      h += '<span class="pl-nb-cat">' + so.cat + '</span>';
      h += '<span class="pl-nb-val">' + fmtV(so.valor) + '</span>';
      h += '<button class="btn btn-sm btn-primary" onclick="window._plAddLimitCat(\'' + soEsc + '\')">Definir Limite</button>';
      h += '</div>';
    }
    h += '</div>';
    h += '</div>';
  }

  // ── COMPARATIVO 3 MESES ──
  var meses3 = [addMes(planMes, -2), addMes(planMes, -1), planMes];
  // Coleta todas as categorias que aparecem em qualquer um dos 3 meses
  var allCats3 = {};
  for(var m = 0; m < meses3.length; m++){
    var pmM = S.planejamento[meses3[m]] || {};
    var catsM = Object.keys(pmM);
    for(var c = 0; c < catsM.length; c++) allCats3[catsM[c]] = true;
    var gastosM = plGetCatsComGasto(meses3[m]);
    var gKeys = Object.keys(gastosM);
    for(var gc = 0; gc < gKeys.length; gc++) allCats3[gKeys[gc]] = true;
  }
  var allCats3Arr = Object.keys(allCats3).sort();

  if(allCats3Arr.length){
    h += '<div class="pl-section">';
    h += '<h3>&#128200; Comparativo — Últimos 3 Meses</h3>';
    h += '<div style="overflow-x:auto">';
    h += '<table class="pl-comp-table">';
    h += '<thead><tr><th>Categoria</th>';
    for(var mi = 0; mi < meses3.length; mi++){
      h += '<th colspan="2" style="text-align:center">' + mesNome(meses3[mi]) + '</th>';
    }
    h += '</tr>';
    h += '<tr><th></th>';
    for(var mj = 0; mj < meses3.length; mj++){
      h += '<th style="text-align:right">Limite</th><th style="text-align:right">Gasto</th>';
    }
    h += '</tr></thead>';
    h += '<tbody>';
    for(var ci = 0; ci < allCats3Arr.length; ci++){
      var catName = allCats3Arr[ci];
      h += '<tr><td class="pl-comp-cat">' + catName + '</td>';
      for(var mk = 0; mk < meses3.length; mk++){
        var limM = (S.planejamento[meses3[mk]] || {})[catName] || 0;
        var gastoM = plGetGasto(catName, meses3[mk]);
        var pctM = limM ? Math.round(gastoM / limM * 100) : 0;
        var corGasto = pctM > 100 ? 'pl-comp-val-dn' : pctM > 80 ? 'pl-comp-val-dn' : 'pl-comp-val-ok';
        h += '<td style="text-align:right" class="pl-comp-val-tx">' + (limM ? fmtV(limM) : '-') + '</td>';
        h += '<td style="text-align:right" class="' + (gastoM ? corGasto : 'pl-comp-val-tx') + '">' + (gastoM ? fmtV(gastoM) : '-');
        if(limM && gastoM){
          h += ' <small style="opacity:.7">(' + pctM + '%)</small>';
        }
        h += '</td>';
      }
      h += '</tr>';
    }
    // Totais
    h += '<tr style="background:var(--bg3);font-weight:700"><td>TOTAL</td>';
    for(var mt = 0; mt < meses3.length; mt++){
      var tLim = 0, tGas = 0;
      for(var ct = 0; ct < allCats3Arr.length; ct++){
        tLim += (S.planejamento[meses3[mt]] || {})[allCats3Arr[ct]] || 0;
        tGas += plGetGasto(allCats3Arr[ct], meses3[mt]);
      }
      var tPct = tLim ? Math.round(tGas / tLim * 100) : 0;
      h += '<td style="text-align:right;color:var(--inf2)">' + (tLim ? fmtV(tLim) : '-') + '</td>';
      h += '<td style="text-align:right;color:' + (tPct > 100 ? 'var(--dn2)' : 'var(--ok)') + '">' + (tGas ? fmtV(tGas) : '-');
      if(tLim && tGas) h += ' <small style="opacity:.7">(' + tPct + '%)</small>';
      h += '</td>';
    }
    h += '</tr>';
    h += '</tbody></table></div>';
    h += '</div>';
  }

  container.innerHTML = h;
};

// ================================================================
// GARANTIR QUE addPlan e delPlan CHAMEM O NOVO renderPlan
// ================================================================
// addPlan e delPlan já existem no index.html, mas para garantir
// que renderPlan() é chamado após, fazemos wrapping se necessário.
var _origAddPlan = window.addPlan;
if(_origAddPlan){
  window.addPlan = function(){
    _origAddPlan();
    renderPlan();
  };
}

var _origDelPlan = window.delPlan;
if(_origDelPlan){
  window.delPlan = function(cat){
    _origDelPlan(cat);
    renderPlan();
  };
}

console.log('[Financeiro Pro] Planejamento Gerencial v1 carregado.');

})();

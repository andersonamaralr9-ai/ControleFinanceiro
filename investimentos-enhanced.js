// investimentos-enhanced.js v1 — Adiciona % na rentabilidade mensal + Card de Aportes/Resgates mensais
// Carrega DEPOIS de investimentos.js — faz override apenas do renderInvest
(function(){
'use strict';

// ================================================================
// CSS ADICIONAL
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── INVESTIMENTOS ENHANCED ── */

/* Rent. mensal com % */
.inv-rent-cell .irc-pct{
  font-size:.68em;color:var(--tx3);margin-top:2px;
}
.inv-rent-cell .irc-pct.pos{color:var(--ok);}
.inv-rent-cell .irc-pct.neg{color:var(--dn2);}

/* Card Aportes/Resgates mensal */
.inv-mov-box{
  background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);
  padding:18px 20px;box-shadow:var(--sh);margin-bottom:24px;
}
.inv-mov-box h3{font-size:.88em;margin-bottom:14px;color:var(--tx2);font-weight:600;}
.inv-mov-grid{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;
}
.inv-mov-cell{
  text-align:center;padding:14px 10px;background:var(--bg3);border-radius:10px;
  transition:transform .15s,box-shadow .15s;cursor:pointer;user-select:none;
}
.inv-mov-cell:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.25);}
.inv-mov-cell:active{transform:translateY(0);}
.inv-mov-cell .imc-mes{font-size:.68em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
.inv-mov-cell .imc-aporte{font-size:.88em;font-weight:700;color:var(--ok);}
.inv-mov-cell .imc-resgate{font-size:.88em;font-weight:700;color:var(--dn2);}
.inv-mov-cell .imc-saldo{font-size:.78em;font-weight:600;margin-top:4px;padding-top:4px;border-top:1px solid var(--bg4);}
.inv-mov-cell .imc-saldo.pos{color:var(--ok);}
.inv-mov-cell .imc-saldo.neg{color:var(--dn2);}
.inv-mov-cell .imc-saldo.zero{color:var(--tx3);}
.inv-mov-cell .imc-hint{font-size:.55em;color:var(--tx3);margin-top:4px;opacity:.6;}
.inv-mov-cell.total{background:var(--bg4);cursor:default;}
.inv-mov-cell.total:hover{transform:none;box-shadow:none;}
.inv-mov-cell.total .imc-mes{color:var(--pri2);}

/* Summary cards extras */
.inv-summary-extra .card{padding:16px 14px;}
.inv-summary-extra .card .card-value{font-size:1.05em;}
.inv-summary-extra .card .card-sub{font-size:.68em;color:var(--tx3);margin-top:2px;}

/* Modal detalhe mov mensal */
.inv-mov-detail-list{max-height:400px;overflow-y:auto;}
.inv-mov-detail-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:.88em;transition:background .1s;}
.inv-mov-detail-item:hover{background:var(--bg3);}
.inv-mov-detail-item:last-child{border:none;}
.inv-mov-detail-item .imd-name{font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.inv-mov-detail-item .imd-tipo{font-size:.72em;padding:2px 8px;border-radius:10px;margin-left:8px;flex-shrink:0;}
.inv-mov-detail-item .imd-tipo.aporte{background:rgba(0,206,201,.15);color:var(--ok);}
.inv-mov-detail-item .imd-tipo.resgate{background:rgba(214,48,49,.15);color:var(--dn2);}
.inv-mov-detail-item .imd-val{font-weight:700;flex-shrink:0;margin-left:12px;}
.inv-mov-detail-total{display:flex;justify-content:space-between;padding:12px;font-weight:700;font-size:.95em;border-top:2px solid var(--bg4);margin-top:4px;}
.inv-mov-detail-empty{text-align:center;padding:30px;color:var(--tx3);font-size:.88em;}

@media(max-width:768px){
  .inv-mov-grid{grid-template-columns:repeat(3,1fr);}
  .inv-mov-cell .imc-aporte,.inv-mov-cell .imc-resgate{font-size:.78em;}
  .inv-mov-cell .imc-saldo{font-size:.7em;}
}
@media(max-width:380px){
  .inv-mov-grid{grid-template-columns:repeat(2,1fr);}
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL DE DETALHAMENTO DE MOVIMENTAÇÕES DO MÊS
// ================================================================
var modalMovDetail = document.createElement('div');
modalMovDetail.className = 'modal';
modalMovDetail.id = 'modalMovMesDetail';
modalMovDetail.innerHTML = '<div class="modal-content"><div class="modal-header">' +
  '<h3 id="movMesDetailTitle">Movimentações do Mês</h3>' +
  '<span class="modal-close" onclick="closeM(\'modalMovMesDetail\')">&times;</span>' +
  '</div><div class="modal-body" id="movMesDetailBody"></div></div>';
document.body.appendChild(modalMovDetail);

// ================================================================
// HELPERS (reutilizando as do investimentos.js via window)
// ================================================================
function fmt(v){
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function getInvRentTotal(inv){
  return (inv.rentabilidade || []).reduce(function(s, r){ return s + (Number(r.valor) || 0); }, 0);
}
function getInvMovTotal(inv){
  return (inv.movimentacoes || []).reduce(function(s, m){
    var v = Number(m.valor) || 0;
    return s + (m.tipo === 'resgate' ? -v : v);
  }, 0);
}
function getInvCapitalAtual(inv){
  return (Number(inv.valor) || 0) + getInvMovTotal(inv);
}
function getInvSaldoAtual(inv){
  return getInvCapitalAtual(inv) + getInvRentTotal(inv);
}
function getInvRentMes(inv, mes){
  var found = (inv.rentabilidade || []).find(function(r){ return r.mes === mes; });
  return found ? (Number(found.valor) || 0) : 0;
}

// Capital no INÍCIO do mês (para calcular % rentabilidade)
// = valor original + aportes/resgates feitos ANTES do mês
function getCapitalInicioMes(inv, mes){
  var base = Number(inv.valor) || 0;
  var movs = inv.movimentacoes || [];
  var rentAcum = 0;
  
  // Somar movimentações anteriores ao mês
  movs.forEach(function(m){
    var mMes = (m.data || '').substring(0, 7);
    if(mMes && mMes < mes){
      var v = Number(m.valor) || 0;
      if(m.tipo === 'resgate') base -= v; else base += v;
    }
  });
  
  // Somar movimentações DO próprio mês (considerar como base)
  movs.forEach(function(m){
    var mMes = (m.data || '').substring(0, 7);
    if(mMes === mes){
      var v = Number(m.valor) || 0;
      if(m.tipo === 'resgate') base -= v; else base += v;
    }
  });
  
  // Somar rentabilidades anteriores ao mês
  (inv.rentabilidade || []).forEach(function(r){
    if(r.mes && r.mes < mes){
      rentAcum += Number(r.valor) || 0;
    }
  });
  
  return base + rentAcum;
}

// Aportes de um investimento em um mês específico
function getAportesMes(inv, mes){
  var total = 0;
  (inv.movimentacoes || []).forEach(function(m){
    if(m.tipo === 'aporte' && (m.data || '').substring(0, 7) === mes){
      total += Number(m.valor) || 0;
    }
  });
  return total;
}

// Resgates de um investimento em um mês específico
function getResgatesMes(inv, mes){
  var total = 0;
  (inv.movimentacoes || []).forEach(function(m){
    if(m.tipo === 'resgate' && (m.data || '').substring(0, 7) === mes){
      total += Number(m.valor) || 0;
    }
  });
  return total;
}

// Investimento inicial de um ativo em um mês específico (se a data de criação é desse mês)
function getInvestInicial(inv, mes){
  var dataMes = (inv.data || '').substring(0, 7);
  if(dataMes === mes) return Number(inv.valor) || 0;
  return 0;
}

// ================================================================
// ABRIR DETALHAMENTO DE MOVIMENTAÇÕES DO MÊS
// ================================================================
window._invOpenMovMesDetail = function(mes){
  var invs = S.investimentos || [];
  var mesLabel = typeof mesNomeFull === 'function' ? mesNomeFull(mes) : mesNome(mes);
  
  document.getElementById('movMesDetailTitle').textContent = 'Movimentações — ' + mesLabel;
  
  var items = [];
  var totalAportes = 0, totalResgates = 0, totalInicial = 0;
  
  invs.forEach(function(inv){
    var ap = getAportesMes(inv, mes);
    var re = getResgatesMes(inv, mes);
    var ini = getInvestInicial(inv, mes);
    
    if(ini > 0){
      items.push({ nome: inv.nome || '-', tipo: 'inicial', valor: ini });
      totalInicial += ini;
    }
    if(ap > 0){
      items.push({ nome: inv.nome || '-', tipo: 'aporte', valor: ap });
      totalAportes += ap;
    }
    if(re > 0){
      items.push({ nome: inv.nome || '-', tipo: 'resgate', valor: re });
      totalResgates += re;
    }
  });
  
  items.sort(function(a, b){ return b.valor - a.valor; });
  
  var totalEntrada = totalInicial + totalAportes;
  var saldoMov = totalEntrada - totalResgates;
  
  var h = '';
  
  if(!items.length){
    h += '<div class="inv-mov-detail-empty">Nenhuma movimentação em ' + mesLabel + '.</div>';
  } else {
    // Mini-resumo
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">';
    if(totalInicial > 0){
      h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px">';
      h += '<div style="font-size:.68em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Novos Investimentos</div>';
      h += '<div style="font-weight:700;color:var(--inf2)">' + fmt(totalInicial) + '</div></div>';
    }
    h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px">';
    h += '<div style="font-size:.68em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Aportes</div>';
    h += '<div style="font-weight:700;color:var(--ok)">' + fmt(totalAportes) + '</div></div>';
    h += '<div style="text-align:center;padding:10px;background:var(--bg3);border-radius:8px">';
    h += '<div style="font-size:.68em;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Resgates</div>';
    h += '<div style="font-weight:700;color:var(--dn2)">' + fmt(totalResgates) + '</div></div>';
    h += '</div>';
    
    h += '<div class="inv-mov-detail-list">';
    items.forEach(function(item){
      var tipoLabel = item.tipo === 'inicial' ? 'Investimento' : (item.tipo === 'aporte' ? 'Aporte' : 'Resgate');
      var tipoClass = item.tipo === 'resgate' ? 'resgate' : 'aporte';
      var color = item.tipo === 'resgate' ? 'var(--dn2)' : 'var(--ok)';
      var prefix = item.tipo === 'resgate' ? '- ' : '+ ';
      h += '<div class="inv-mov-detail-item">';
      h += '<span class="imd-name">' + item.nome + '</span>';
      h += '<span class="imd-tipo ' + tipoClass + '">' + tipoLabel + '</span>';
      h += '<span class="imd-val" style="color:' + color + '">' + prefix + fmt(item.valor) + '</span>';
      h += '</div>';
    });
    h += '</div>';
    
    var saldoColor = saldoMov >= 0 ? 'var(--ok)' : 'var(--dn2)';
    h += '<div class="inv-mov-detail-total">';
    h += '<span>Saldo Movimentações</span>';
    h += '<span style="color:' + saldoColor + '">' + (saldoMov > 0 ? '+ ' : '') + fmt(saldoMov) + '</span>';
    h += '</div>';
  }
  
  document.getElementById('movMesDetailBody').innerHTML = h;
  openM('modalMovMesDetail');
};

// ================================================================
// OVERRIDE renderInvest — Adiciona % na rent. mensal + seção Aportes/Resgates
// ================================================================
var _origRenderInvest = window.renderInvest;

window.renderInvest = function(){
  // Chamar original para criar toda a UI base
  _origRenderInvest();
  
  var invs = S.investimentos || [];
  var area = document.getElementById('invDynamicArea');
  if(!area) return;
  
  var ma = mesAtual();
  
  // ===== 1. ADICIONAR % NAS CÉLULAS DE RENTABILIDADE MENSAL =====
  var rentGrid = area.querySelector('.inv-rent-grid');
  if(rentGrid){
    var cells = rentGrid.querySelectorAll('.inv-rent-cell:not(.acum)');
    var cellIndex = 0;
    for(var mi = -5; mi <= 0; mi++){
      var mes = addMes(ma, mi);
      var rentMes = 0;
      var capitalBase = 0;
      
      invs.forEach(function(inv){
        rentMes += getInvRentMes(inv, mes);
        capitalBase += getCapitalInicioMes(inv, mes);
      });
      
      // Calcular percentual
      var pctMes = capitalBase > 0 ? ((rentMes / capitalBase) * 100) : 0;
      
      if(cells[cellIndex]){
        // Verificar se já tem o .irc-pct para não duplicar
        if(!cells[cellIndex].querySelector('.irc-pct')){
          var pctDiv = document.createElement('div');
          pctDiv.className = 'irc-pct ' + (pctMes > 0 ? 'pos' : (pctMes < 0 ? 'neg' : ''));
          pctDiv.textContent = (pctMes > 0 ? '+' : '') + pctMes.toFixed(2) + '%';
          // Inserir DEPOIS do .irc-val
          var valEl = cells[cellIndex].querySelector('.irc-val');
          if(valEl && valEl.nextSibling){
            valEl.parentNode.insertBefore(pctDiv, valEl.nextSibling);
          } else if(valEl){
            valEl.parentNode.appendChild(pctDiv);
          }
        }
      }
      cellIndex++;
    }
    
    // Adicionar % no acumulado também
    var acumCell = rentGrid.querySelector('.inv-rent-cell.acum');
    if(acumCell && !acumCell.querySelector('.irc-pct')){
      var totalRent6 = 0;
      var capitalBase6meses = 0;
      
      // Para acumulado, pegar o capital no início dos 6 meses
      var mesInicio6 = addMes(ma, -5);
      invs.forEach(function(inv){
        capitalBase6meses += getCapitalInicioMes(inv, mesInicio6);
        for(var j = -5; j <= 0; j++){
          totalRent6 += getInvRentMes(inv, addMes(ma, j));
        }
      });
      
      var pctAcum = capitalBase6meses > 0 ? ((totalRent6 / capitalBase6meses) * 100) : 0;
      var pctDivAcum = document.createElement('div');
      pctDivAcum.className = 'irc-pct ' + (pctAcum > 0 ? 'pos' : (pctAcum < 0 ? 'neg' : ''));
      pctDivAcum.textContent = (pctAcum > 0 ? '+' : '') + pctAcum.toFixed(2) + '%';
      var valElAcum = acumCell.querySelector('.irc-val');
      if(valElAcum && valElAcum.nextSibling){
        valElAcum.parentNode.insertBefore(pctDivAcum, valElAcum.nextSibling);
      } else if(valElAcum){
        valElAcum.parentNode.appendChild(pctDivAcum);
      }
    }
  }
  
  // ===== 2. ADICIONAR CARD DE APORTES/RESGATES MENSAIS =====
  // Criar o card APÓS a seção de rentabilidade mensal
  var rentBox = area.querySelector('.inv-rent-box');
  if(!rentBox) return;
  
  // Verificar se já existe para não duplicar
  if(document.getElementById('invMovBox')) return;
  
  var movBox = document.createElement('div');
  movBox.className = 'inv-mov-box';
  movBox.id = 'invMovBox';
  
  var h = '<h3>\uD83D\uDCB0 Aportes & Resgates Mensais</h3>';
  h += '<div class="inv-mov-grid">';
  
  var totalAp6 = 0, totalRe6 = 0, totalIni6 = 0;
  
  for(var mi = -5; mi <= 0; mi++){
    var mes = addMes(ma, mi);
    var aportesMes = 0, resgatesMes = 0, inicialMes = 0;
    
    invs.forEach(function(inv){
      aportesMes += getAportesMes(inv, mes);
      resgatesMes += getResgatesMes(inv, mes);
      inicialMes += getInvestInicial(inv, mes);
    });
    
    var entradaMes = inicialMes + aportesMes;
    totalAp6 += aportesMes;
    totalRe6 += resgatesMes;
    totalIni6 += inicialMes;
    var saldoMes = entradaMes - resgatesMes;
    var saldoClass = saldoMes > 0 ? 'pos' : (saldoMes < 0 ? 'neg' : 'zero');
    
    var mesEsc = mes.replace(/'/g, "\\'");
    h += '<div class="inv-mov-cell" onclick="window._invOpenMovMesDetail(\'' + mesEsc + '\')">';
    h += '<div class="imc-mes">' + mesNome(mes) + '</div>';
    if(entradaMes > 0){
      h += '<div class="imc-aporte">+ ' + fmt(entradaMes) + '</div>';
    } else {
      h += '<div class="imc-aporte" style="color:var(--tx3)">-</div>';
    }
    if(resgatesMes > 0){
      h += '<div class="imc-resgate">- ' + fmt(resgatesMes) + '</div>';
    } else {
      h += '<div class="imc-resgate" style="color:var(--tx3)">-</div>';
    }
    h += '<div class="imc-saldo ' + saldoClass + '">' + (saldoMes > 0 ? '+ ' : '') + fmt(saldoMes) + '</div>';
    h += '<div class="imc-hint">clique para detalhar</div>';
    h += '</div>';
  }
  
  // Célula acumulado
  var totalEntrada6 = totalIni6 + totalAp6;
  var saldo6 = totalEntrada6 - totalRe6;
  var saldo6Class = saldo6 > 0 ? 'pos' : (saldo6 < 0 ? 'neg' : 'zero');
  
  h += '<div class="inv-mov-cell total">';
  h += '<div class="imc-mes">Acumulado</div>';
  h += '<div class="imc-aporte">+ ' + fmt(totalEntrada6) + '</div>';
  h += '<div class="imc-resgate">' + (totalRe6 > 0 ? '- ' + fmt(totalRe6) : '-') + '</div>';
  h += '<div class="imc-saldo ' + saldo6Class + '">' + (saldo6 > 0 ? '+ ' : '') + fmt(saldo6) + '</div>';
  h += '</div>';
  
  h += '</div>';
  
  movBox.innerHTML = h;
  
  // Inserir APÓS a seção de rentabilidade mensal
  rentBox.parentNode.insertBefore(movBox, rentBox.nextSibling);
  
  // ===== 3. ADICIONAR CARDS EXTRAS NO RESUMO (Rent. % Mês + Aporte Mês + Resgate Mês) =====
  var summary = area.querySelector('.inv-summary');
  if(!summary) return;
  
  // Verificar se já adicionou
  if(summary.querySelector('.enh-added')) return;
  
  // Calcular rent % do mês atual
  var rentMesAtual = 0, capitalBaseMesAtual = 0;
  invs.forEach(function(inv){
    rentMesAtual += getInvRentMes(inv, ma);
    capitalBaseMesAtual += getCapitalInicioMes(inv, ma);
  });
  var rentPctMes = capitalBaseMesAtual > 0 ? ((rentMesAtual / capitalBaseMesAtual) * 100) : 0;
  
  // Calcular aportes e resgates do mês atual
  var aportesMesAtual = 0, resgatesMesAtual = 0;
  invs.forEach(function(inv){
    aportesMesAtual += getAportesMes(inv, ma);
    resgatesMesAtual += getResgatesMes(inv, ma);
  });
  
  // Atualizar card "Rent. Mês" existente para incluir %
  var cards = summary.querySelectorAll('.card');
  cards.forEach(function(card){
    var label = card.querySelector('.card-label');
    if(label && label.textContent.indexOf('Rent.') >= 0 && label.textContent.indexOf('M') >= 0 && label.textContent.indexOf('%') < 0){
      // Este é o card "Rent. Mês" — adicionar % abaixo
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
  
  // Adicionar cards de Aporte Mês e Resgate Mês
  var aporteCard = document.createElement('div');
  aporteCard.className = 'card enh-added';
  aporteCard.innerHTML = '<div class="card-label">Aporte Mês</div>' +
    '<div class="card-value ' + (aportesMesAtual > 0 ? 'green' : 'blue') + '">' + 
    (aportesMesAtual > 0 ? '+ ' : '') + fmt(aportesMesAtual) + '</div>';
  summary.appendChild(aporteCard);
  
  var resgateCard = document.createElement('div');
  resgateCard.className = 'card enh-added';
  resgateCard.innerHTML = '<div class="card-label">Resgate Mês</div>' +
    '<div class="card-value ' + (resgatesMesAtual > 0 ? 'red' : 'blue') + '">' + 
    (resgatesMesAtual > 0 ? '- ' : '') + fmt(resgatesMesAtual) + '</div>';
  summary.appendChild(resgateCard);
};

console.log('[Financeiro Pro] Investimentos Enhanced v1 — % rentabilidade + Aportes/Resgates mensais carregados.');
})();

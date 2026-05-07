// investimentos.js v6 — Rent. clicável + seções colapsáveis + centavos (exceto centro donut)
// Substitua o arquivo inteiro
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── INVESTIMENTOS v6 ── */

.inv-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px;margin-bottom:24px;}
.inv-summary .card{padding:16px 14px;}
.inv-summary .card .card-value{font-size:1.15em;}

.inv-alloc-unified{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:24px;box-shadow:var(--sh);margin-bottom:24px;}
.inv-alloc-unified h3{font-size:.92em;margin-bottom:20px;color:var(--tx2);font-weight:600;}
.inv-alloc-content{display:flex;gap:32px;align-items:flex-start;}
.inv-alloc-chart{flex-shrink:0;}

.inv-donut-svg-wrap{position:relative;width:220px;height:220px;}
.inv-donut-svg-wrap svg{width:100%;height:100%;transform:rotate(-90deg);}
.inv-donut-center-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;}
.inv-donut-center-label .inv-dc-val{font-size:1.2em;font-weight:800;color:var(--ok);display:block;line-height:1.2;}
.inv-donut-center-label .inv-dc-sub{font-size:.65em;color:var(--tx3);display:block;margin-top:2px;}

.inv-alloc-details{flex:1;min-width:0;}
.inv-detail-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bg3);transition:background .15s;}
.inv-detail-row:hover{background:var(--bg3);border-radius:6px;padding-left:8px;padding-right:8px;margin:0 -8px;}
.inv-detail-row:last-child{border:none;}
.inv-detail-dot{width:16px;height:16px;border-radius:5px;flex-shrink:0;}
.inv-detail-info{flex:1;min-width:0;}
.inv-detail-name{font-size:.88em;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.inv-detail-sub{font-size:.72em;color:var(--tx3);margin-top:2px;}
.inv-detail-vals{text-align:right;flex-shrink:0;}
.inv-detail-pct{font-size:.95em;font-weight:800;color:var(--pri2);}
.inv-detail-amt{font-size:.78em;color:var(--tx2);display:block;margin-top:1px;}
.inv-detail-rent{font-size:.7em;display:block;margin-top:1px;}
.inv-detail-bar{height:6px;background:var(--bg3);border-radius:4px;margin-top:6px;overflow:hidden;}
.inv-detail-bar-fill{height:100%;border-radius:4px;transition:width .6s ease;}

.inv-rent-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:18px 20px;box-shadow:var(--sh);margin-bottom:24px;}
.inv-rent-box h3{font-size:.88em;margin-bottom:14px;color:var(--tx2);font-weight:600;}
.inv-rent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;}
.inv-rent-cell{text-align:center;padding:12px 8px;background:var(--bg3);border-radius:10px;transition:transform .15s,box-shadow .15s;cursor:pointer;user-select:none;}
.inv-rent-cell:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.25);}
.inv-rent-cell:active{transform:translateY(0);}
.inv-rent-cell .irc-mes{font-size:.68em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.inv-rent-cell .irc-val{font-size:1em;font-weight:700;}
.inv-rent-cell .irc-val.pos{color:var(--ok);}
.inv-rent-cell .irc-val.neg{color:var(--dn2);}
.inv-rent-cell .irc-val.zero{color:var(--tx3);}
.inv-rent-cell.acum{background:var(--bg4);cursor:default;}
.inv-rent-cell.acum:hover{transform:none;box-shadow:none;}
.inv-rent-cell .irc-hint{font-size:.58em;color:var(--tx3);margin-top:4px;opacity:.6;}
.inv-rent-cell.acum .irc-mes{color:var(--pri2);}

.inv-rent-detail-list{max-height:400px;overflow-y:auto;}
.inv-rent-detail-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:.88em;transition:background .1s;}
.inv-rent-detail-item:hover{background:var(--bg3);}
.inv-rent-detail-item:last-child{border:none;}
.inv-rent-detail-item .ird-name{font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.inv-rent-detail-item .ird-tipo{font-size:.72em;color:var(--tx3);margin-left:8px;flex-shrink:0;}
.inv-rent-detail-item .ird-val{font-weight:700;flex-shrink:0;margin-left:12px;}
.inv-rent-detail-total{display:flex;justify-content:space-between;padding:12px;font-weight:700;font-size:.95em;border-top:2px solid var(--bg4);margin-top:4px;}
.inv-rent-detail-empty{text-align:center;padding:30px;color:var(--tx3);font-size:.88em;}

.inv-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-bottom:24px;}
.inv-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);box-shadow:var(--sh);overflow:hidden;transition:transform .2s;}
.inv-card:hover{transform:translateY(-2px);}
.inv-card-header{padding:14px 18px;background:var(--bg3);display:flex;justify-content:space-between;align-items:center;}
.inv-card-header strong{font-size:.95em;}
.inv-card-body{padding:14px 18px;}
.inv-card-body .inv-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:.84em;}
.inv-card-body .inv-row .inv-label{color:var(--tx2);}
.inv-card-body .inv-row .inv-val{font-weight:700;}
.inv-card-actions{padding:10px 18px 14px;display:flex;gap:6px;flex-wrap:wrap;}

.inv-card-section{border-top:1px solid var(--bg4);}
.inv-section-toggle{display:flex;justify-content:space-between;align-items:center;padding:10px 18px;cursor:pointer;user-select:none;transition:background .15s;}
.inv-section-toggle:hover{background:var(--bg3);}
.inv-section-toggle-title{font-size:.72em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;font-weight:600;}
.inv-section-toggle-icon{font-size:.72em;color:var(--tx3);transition:transform .25s;}
.inv-section-toggle-icon.open{transform:rotate(180deg);}
.inv-section-toggle-badge{font-size:.65em;background:var(--pri2);color:#fff;border-radius:10px;padding:1px 7px;margin-left:8px;font-weight:700;}
.inv-section-body{max-height:0;overflow:hidden;transition:max-height .3s ease;padding:0 18px;}
.inv-section-body.expanded{max-height:500px;padding:0 18px 12px;}
.inv-section-body .inv-hist-list{max-height:160px;overflow-y:auto;}

.inv-hist-item{display:flex;justify-content:space-between;align-items:center;font-size:.78em;padding:4px 0;border-bottom:1px solid var(--bg3);}
.inv-hist-item:last-child{border:none;}

.btn-info{background:linear-gradient(135deg,#0984e3,#74b9ff);color:#fff;border:none;cursor:pointer;border-radius:8px;padding:6px 12px;font-size:.78em;font-weight:600;transition:all .2s;}
.btn-info:hover{opacity:.85;transform:translateY(-1px);}

@media(max-width:768px){
  .inv-alloc-content{flex-direction:column;align-items:center;gap:20px;}
  .inv-alloc-chart{width:100%;display:flex;justify-content:center;}
  .inv-alloc-details{width:100%;}
  .inv-cards-grid{grid-template-columns:1fr;}
  .inv-summary{grid-template-columns:1fr 1fr;}
  .inv-donut-svg-wrap{width:180px;height:180px;}
  .inv-donut-center-label .inv-dc-val{font-size:1em;}
  .inv-rent-grid{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:380px){
  .inv-rent-grid{grid-template-columns:repeat(2,1fr);}
  .inv-summary{grid-template-columns:1fr;}
  .inv-donut-svg-wrap{width:150px;height:150px;}
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAIS
// ================================================================
var modalRentDetail = document.createElement('div');
modalRentDetail.className = 'modal';
modalRentDetail.id = 'modalRentDetail';
modalRentDetail.innerHTML = '<div class="modal-content"><div class="modal-header">' +
  '<h3 id="rentDetailTitle">Rentabilidade do M\u00eas</h3>' +
  '<span class="modal-close" onclick="closeM(\'modalRentDetail\')">&times;</span>' +
  '</div><div class="modal-body" id="rentDetailBody"></div></div>';
document.body.appendChild(modalRentDetail);

var modalEdit = document.createElement('div');
modalEdit.className = 'modal';
modalEdit.id = 'modalEditInvest';
modalEdit.innerHTML = '<div class="modal-content"><div class="modal-header"><h3>Editar Investimento</h3>'+
  '<span class="modal-close" onclick="closeM(\'modalEditInvest\')">&times;</span></div><div class="modal-body">'+
  '<div class="form-group" style="margin-bottom:12px"><label>Nome</label><input id="eiNome" class="form-control"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Tipo</label><select id="eiTipo" class="form-control"></select></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Valor Investido (R$)</label><input id="eiValor" class="form-control"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Data</label><input type="date" id="eiData" class="form-control"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Observa\u00e7\u00e3o</label><input id="eiObs" class="form-control"></div>'+
  '<input type="hidden" id="eiId">'+
  '<button class="btn btn-primary" onclick="window._invUpdate()" style="width:100%;margin-top:8px">Salvar</button>'+
  '</div></div>';
document.body.appendChild(modalEdit);

var modalRent = document.createElement('div');
modalRent.className = 'modal';
modalRent.id = 'modalRentInvest';
modalRent.innerHTML = '<div class="modal-content"><div class="modal-header"><h3 id="rentTitle">Lan\u00e7ar Rentabilidade</h3>'+
  '<span class="modal-close" onclick="closeM(\'modalRentInvest\')">&times;</span></div><div class="modal-body">'+
  '<div class="form-group" style="margin-bottom:12px"><label>M\u00eas</label><input type="month" id="riMes" class="form-control"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Valor (R$)</label><input id="riValor" class="form-control" placeholder="150,00 ou -50,00"></div>'+
  '<p style="font-size:.75em;color:var(--tx3);margin-bottom:12px">Positivo = ganho, negativo = perda.</p>'+
  '<input type="hidden" id="riId">'+
  '<button class="btn btn-primary" onclick="window._invAddRent()" style="width:100%;margin-top:8px">Lan\u00e7ar</button>'+
  '<div id="riRentList" style="margin-top:16px"></div>'+
  '</div></div>';
document.body.appendChild(modalRent);

var modalMov = document.createElement('div');
modalMov.className = 'modal';
modalMov.id = 'modalMovInvest';
modalMov.innerHTML = '<div class="modal-content"><div class="modal-header"><h3 id="movTitle">Aporte / Resgate</h3>'+
  '<span class="modal-close" onclick="closeM(\'modalMovInvest\')">&times;</span></div><div class="modal-body">'+
  '<div class="form-group" style="margin-bottom:12px"><label>Tipo</label>'+
    '<select id="miTipo" class="form-control"><option value="aporte">Aporte</option><option value="resgate">Resgate</option></select></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Valor (R$)</label><input id="miValor" class="form-control" placeholder="500,00"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Data</label><input type="date" id="miData" class="form-control"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Obs (opcional)</label><input id="miObs" class="form-control"></div>'+
  '<input type="hidden" id="miId">'+
  '<button class="btn btn-primary" onclick="window._invAddMov()" style="width:100%;margin-top:8px">Confirmar</button>'+
  '<div id="miMovList" style="margin-top:16px"></div>'+
  '</div></div>';
document.body.appendChild(modalMov);

// ================================================================
// CORES
// ================================================================
var COLORS = ['#6c5ce7','#00b894','#0984e3','#fdcb6e','#e17055','#d63031','#00cec9','#e84393','#636e72','#2d3436'];
function getColor(i){ return COLORS[i % COLORS.length]; }

// ================================================================
// FORMATAÇÃO
// ================================================================
// COM centavos — usado em tudo
function fmt(v){
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
// SEM centavos — SOMENTE centro do donut
function fmtInt(v){
  return 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR');
}

// ================================================================
// HELPERS
// ================================================================
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

// ================================================================
// SVG DONUT
// ================================================================
function buildDonutSVG(segments, totalValue, size){
  size = size || 220;
  var cx = size / 2, cy = size / 2;
  var outerR = size / 2 - 4;
  var innerR = outerR * 0.62;
  var gap = 0.008;

  if(!segments.length || totalValue <= 0){
    return '<svg viewBox="0 0 '+size+' '+size+'" xmlns="http://www.w3.org/2000/svg">'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+outerR+'" fill="none" stroke="var(--bg4)" stroke-width="'+(outerR-innerR)+'"/>'+
      '</svg>';
  }

  var paths = '';
  var startAngle = 0;
  var totalGap = gap * segments.length;
  var availableAngle = Math.PI * 2 - totalGap;

  for(var i = 0; i < segments.length; i++){
    var seg = segments[i];
    var fraction = seg.value / totalValue;
    var angle = fraction * availableAngle;
    if(angle < 0.01) continue;
    var endAngle = startAngle + angle;
    var x1 = cx + outerR * Math.cos(startAngle);
    var y1 = cy + outerR * Math.sin(startAngle);
    var x2 = cx + outerR * Math.cos(endAngle);
    var y2 = cy + outerR * Math.sin(endAngle);
    var x3 = cx + innerR * Math.cos(endAngle);
    var y3 = cy + innerR * Math.sin(endAngle);
    var x4 = cx + innerR * Math.cos(startAngle);
    var y4 = cy + innerR * Math.sin(startAngle);
    var largeArc = angle > Math.PI ? 1 : 0;
    var d = 'M '+x1.toFixed(2)+' '+y1.toFixed(2)+
            ' A '+outerR+' '+outerR+' 0 '+largeArc+' 1 '+x2.toFixed(2)+' '+y2.toFixed(2)+
            ' L '+x3.toFixed(2)+' '+y3.toFixed(2)+
            ' A '+innerR+' '+innerR+' 0 '+largeArc+' 0 '+x4.toFixed(2)+' '+y4.toFixed(2)+
            ' Z';
    paths += '<path d="'+d+'" fill="'+seg.color+'" opacity=".9"><title>'+seg.label+': '+fmt(seg.value)+'</title></path>';
    startAngle = endAngle + gap;
  }

  return '<svg viewBox="0 0 '+size+' '+size+'" xmlns="http://www.w3.org/2000/svg">'+paths+'</svg>';
}

// ================================================================
// ABRIR DETALHAMENTO RENT. MENSAL
// ================================================================
window._invOpenRentDetail = function(mes){
  var invs = S.investimentos || [];
  var mesLabel = typeof mesNomeFull === 'function' ? mesNomeFull(mes) : mesNome(mes);

  document.getElementById('rentDetailTitle').textContent = 'Rentabilidade \u2014 ' + mesLabel;

  var items = [];
  var total = 0;

  invs.forEach(function(inv){
    var rentVal = getInvRentMes(inv, mes);
    if(rentVal !== 0){
      items.push({ nome: inv.nome || '-', tipo: inv.tipo || 'Outro', valor: rentVal });
      total += rentVal;
    }
  });

  items.sort(function(a, b){ return Math.abs(b.valor) - Math.abs(a.valor); });

  var h = '';

  if(!items.length){
    h += '<div class="inv-rent-detail-empty">Nenhum investimento teve rentabilidade em ' + mesLabel + '.</div>';
  } else {
    h += '<div class="inv-rent-detail-list">';
    items.forEach(function(item){
      var color = item.valor >= 0 ? 'var(--ok)' : 'var(--dn2)';
      var prefix = item.valor > 0 ? '+ ' : '';
      h += '<div class="inv-rent-detail-item">';
      h += '<span class="ird-name">' + item.nome + '</span>';
      h += '<span class="ird-tipo">' + item.tipo + '</span>';
      h += '<span class="ird-val" style="color:' + color + '">' + prefix + fmt(item.valor) + '</span>';
      h += '</div>';
    });
    h += '</div>';

    var semRent = invs.filter(function(inv){ return getInvRentMes(inv, mes) === 0; });
    if(semRent.length){
      h += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--bg4)">';
      h += '<div style="font-size:.72em;color:var(--tx3);margin-bottom:6px">' + semRent.length + ' ativo(s) sem rentabilidade no m\u00eas:</div>';
      h += '<div style="font-size:.78em;color:var(--tx3)">';
      h += semRent.map(function(inv){ return inv.nome || '-'; }).join(', ');
      h += '</div></div>';
    }

    var totalColor = total >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var totalPrefix = total > 0 ? '+ ' : '';
    h += '<div class="inv-rent-detail-total">';
    h += '<span>Total do m\u00eas</span>';
    h += '<span style="color:' + totalColor + '">' + totalPrefix + fmt(total) + '</span>';
    h += '</div>';
  }

  document.getElementById('rentDetailBody').innerHTML = h;
  openM('modalRentDetail');
};

// ================================================================
// TOGGLE SEÇÕES COLAPSÁVEIS
// ================================================================
window._invToggleSection = function(btn){
  var section = btn.closest('.inv-card-section');
  if(!section) return;
  var body = section.querySelector('.inv-section-body');
  var icon = btn.querySelector('.inv-section-toggle-icon');
  if(!body) return;
  if(body.classList.contains('expanded')){
    body.classList.remove('expanded');
    if(icon) icon.classList.remove('open');
  } else {
    body.classList.add('expanded');
    if(icon) icon.classList.add('open');
  }
};

// ================================================================
// OVERRIDE renderInvest
// ================================================================
window.renderInvest = function(){
  var st = g('invTipo');
  if(st){
    st.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){
      st.innerHTML += '<option>' + c + '</option>';
    });
  }

  var invs = S.investimentos || [];
  var pgEl = document.getElementById('pg-investimentos');
  if(!pgEl) return;

  var existing = document.getElementById('invDynamicArea');
  if(existing) existing.remove();

  var area = document.createElement('div');
  area.id = 'invDynamicArea';

  // ===== CÁLCULOS =====
  var totalInvestido = 0, totalCapital = 0, totalRent = 0, totalSaldo = 0;
  var porTipo = {};

  invs.forEach(function(inv){
    var vOriginal = Number(inv.valor) || 0;
    var capital = getInvCapitalAtual(inv);
    var rent = getInvRentTotal(inv);
    var saldo = capital + rent;
    totalInvestido += vOriginal;
    totalCapital += capital;
    totalRent += rent;
    totalSaldo += saldo;

    var tipo = inv.tipo || 'Outro';
    if(!porTipo[tipo]) porTipo[tipo] = { investido: 0, capital: 0, rent: 0, saldo: 0, count: 0 };
    porTipo[tipo].investido += vOriginal;
    porTipo[tipo].capital += capital;
    porTipo[tipo].rent += rent;
    porTipo[tipo].saldo += saldo;
    porTipo[tipo].count++;
  });

  var rentPct = totalCapital > 0 ? ((totalRent / totalCapital) * 100) : 0;
  var ma = mesAtual();
  var rentMesAtual = 0;
  invs.forEach(function(inv){ rentMesAtual += getInvRentMes(inv, ma); });

  var html = '';

  // ===== RESUMO =====
  html += '<div class="inv-summary">';
  html += '<div class="card"><div class="card-label">Capital Investido</div><div class="card-value blue">' + fmt(totalCapital) + '</div></div>';
  html += '<div class="card"><div class="card-label">Rentabilidade</div><div class="card-value ' + (totalRent >= 0 ? 'green' : 'red') + '">' + (totalRent > 0 ? '+ ' : '') + fmt(totalRent) + '</div></div>';
  html += '<div class="card"><div class="card-label">Saldo Total</div><div class="card-value ' + (totalSaldo >= 0 ? 'green' : 'red') + '">' + fmt(totalSaldo) + '</div></div>';
  html += '<div class="card"><div class="card-label">Rent. %</div><div class="card-value ' + (rentPct >= 0 ? 'green' : 'red') + '">' + (rentPct > 0 ? '+' : '') + rentPct.toFixed(1) + '%</div></div>';
  html += '<div class="card"><div class="card-label">Rent. M\u00eas</div><div class="card-value ' + (rentMesAtual >= 0 ? 'green' : 'red') + '">' + (rentMesAtual > 0 ? '+ ' : '') + fmt(rentMesAtual) + '</div></div>';
  html += '<div class="card"><div class="card-label">Ativos</div><div class="card-value purple">' + invs.length + '</div></div>';
  html += '</div>';

  // ===== ALOCAÇÃO UNIFICADA =====
  var tipos = Object.keys(porTipo).sort(function(a, b){ return porTipo[b].saldo - porTipo[a].saldo; });

  html += '<div class="inv-alloc-unified"><h3>\uD83D\uDCCA Distribui\u00e7\u00e3o da Carteira</h3>';

  if(!tipos.length){
    html += '<p style="color:var(--tx3);text-align:center;padding:40px">Nenhum investimento cadastrado.</p>';
  } else {
    var segments = [];
    tipos.forEach(function(tipo, idx){
      segments.push({ label: tipo, value: Math.max(porTipo[tipo].saldo, 0), color: getColor(idx) });
    });

    html += '<div class="inv-alloc-content">';

    // Donut — centro SEM centavos (fmtInt)
    html += '<div class="inv-alloc-chart"><div class="inv-donut-svg-wrap">';
    html += buildDonutSVG(segments, Math.max(totalSaldo, 1));
    html += '<div class="inv-donut-center-label">';
    html += '<span class="inv-dc-val">' + fmtInt(totalSaldo) + '</span>';
    html += '<span class="inv-dc-sub">Saldo Total</span>';
    html += '</div></div></div>';

    // Detalhes — COM centavos (fmt)
    html += '<div class="inv-alloc-details">';
    tipos.forEach(function(tipo, idx){
      var data = porTipo[tipo];
      var pct = totalSaldo > 0 ? ((data.saldo / totalSaldo) * 100) : 0;
      var rentColor = data.rent >= 0 ? 'var(--ok)' : 'var(--dn2)';
      var rentSign = data.rent > 0 ? '+' : '';

      html += '<div class="inv-detail-row">';
      html += '<div class="inv-detail-dot" style="background:' + getColor(idx) + '"></div>';
      html += '<div class="inv-detail-info">';
      html += '<div class="inv-detail-name">' + tipo + '</div>';
      html += '<div class="inv-detail-sub">' + data.count + ' ativo' + (data.count !== 1 ? 's' : '') + ' \u00b7 Capital: ' + fmt(data.capital) + '</div>';
      html += '<div class="inv-detail-bar"><div class="inv-detail-bar-fill" style="width:' + Math.max(pct, 3) + '%;background:' + getColor(idx) + '"></div></div>';
      html += '</div>';
      html += '<div class="inv-detail-vals">';
      html += '<div class="inv-detail-pct">' + pct.toFixed(1) + '%</div>';
      html += '<div class="inv-detail-amt">' + fmt(data.saldo) + '</div>';
      html += '<div class="inv-detail-rent" style="color:' + rentColor + '">' + rentSign + fmt(data.rent) + '</div>';
      html += '</div></div>';
    });
    html += '</div></div>';
  }

  html += '</div>';

  // ===== RENTABILIDADE MENSAL (clicável) =====
  html += '<div class="inv-rent-box"><h3>\uD83D\uDCC8 Rentabilidade Mensal</h3>';
  html += '<div class="inv-rent-grid">';
  var acum6 = 0;
  for(var mi = -5; mi <= 0; mi++){
    var mes = addMes(ma, mi);
    var rentMes = 0;
    invs.forEach(function(inv){ rentMes += getInvRentMes(inv, mes); });
    acum6 += rentMes;
    var cls = rentMes > 0 ? 'pos' : (rentMes < 0 ? 'neg' : 'zero');
    var prefix = rentMes > 0 ? '+ ' : '';
    var mesEsc = mes.replace(/'/g, "\\'");
    html += '<div class="inv-rent-cell" onclick="window._invOpenRentDetail(\'' + mesEsc + '\')">';
    html += '<div class="irc-mes">' + mesNome(mes) + '</div>';
    html += '<div class="irc-val ' + cls + '">' + prefix + fmt(rentMes) + '</div>';
    html += '<div class="irc-hint">clique para detalhar</div>';
    html += '</div>';
  }
  var clsAcum = acum6 > 0 ? 'pos' : (acum6 < 0 ? 'neg' : 'zero');
  html += '<div class="inv-rent-cell acum">';
  html += '<div class="irc-mes">Acumulado</div>';
  html += '<div class="irc-val ' + clsAcum + '">' + (acum6 > 0 ? '+ ' : '') + fmt(acum6) + '</div>';
  html += '</div>';
  html += '</div></div>';

  // ===== CARDS DOS INVESTIMENTOS =====
  html += '<div class="inv-cards-grid">';
  if(!invs.length){
    html += '<p style="color:var(--tx3);grid-column:1/-1;text-align:center;padding:30px">Nenhum investimento cadastrado.</p>';
  } else {
    var sorted = invs.slice().sort(function(a, b){ return getInvSaldoAtual(b) - getInvSaldoAtual(a); });
    sorted.forEach(function(inv){
      var vOriginal = Number(inv.valor) || 0;
      var capital = getInvCapitalAtual(inv);
      var rent = getInvRentTotal(inv);
      var saldo = capital + rent;
      var rentPctI = capital > 0 ? ((rent / capital) * 100) : 0;
      var pctAlloc = totalSaldo > 0 ? ((saldo / totalSaldo) * 100) : 0;
      var movs = (inv.movimentacoes || []).slice().sort(function(a, b){ return (b.data || '').localeCompare(a.data || ''); });
      var rents = (inv.rentabilidade || []).slice().sort(function(a, b){ return (b.mes || '').localeCompare(a.mes || ''); });

      var totalAportesI = 0, totalResgatesI = 0;
      movs.forEach(function(m){
        var v = Number(m.valor) || 0;
        if(m.tipo === 'aporte') totalAportesI += v; else totalResgatesI += v;
      });

      var idEsc = inv.id.replace(/'/g, "\\'");

      html += '<div class="inv-card">';
      html += '<div class="inv-card-header"><strong>' + (inv.nome || '-') + '</strong><span class="badge badge-info">' + (inv.tipo || 'Outro') + '</span></div>';
      html += '<div class="inv-card-body">';
      html += '<div class="inv-row"><span class="inv-label">Investido</span><span class="inv-val" style="color:var(--inf2)">' + fmt(vOriginal) + '</span></div>';
      if(totalAportesI > 0) html += '<div class="inv-row"><span class="inv-label">+ Aportes</span><span class="inv-val" style="color:var(--ok)">+ ' + fmt(totalAportesI) + '</span></div>';
      if(totalResgatesI > 0) html += '<div class="inv-row"><span class="inv-label">- Resgates</span><span class="inv-val" style="color:var(--dn2)">- ' + fmt(totalResgatesI) + '</span></div>';
      html += '<div class="inv-row"><span class="inv-label">Capital</span><span class="inv-val" style="color:var(--inf2)">' + fmt(capital) + '</span></div>';
      html += '<div class="inv-row"><span class="inv-label">Rentabilidade</span><span class="inv-val" style="color:' + (rent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rent > 0 ? '+ ' : '') + fmt(rent) + ' <small>(' + (rentPctI > 0 ? '+' : '') + rentPctI.toFixed(1) + '%)</small></span></div>';
      html += '<div class="inv-row" style="padding-top:6px;border-top:1px solid var(--bg4);margin-top:4px"><span class="inv-label" style="font-weight:700">Saldo</span><span class="inv-val" style="font-size:1.1em;color:' + (saldo >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmt(saldo) + '</span></div>';
      html += '<div class="inv-row"><span class="inv-label">Aloca\u00e7\u00e3o</span><span class="inv-val" style="color:var(--pri2)">' + pctAlloc.toFixed(1) + '%</span></div>';
      if(inv.obs) html += '<div class="inv-row"><span class="inv-label">Obs</span><span class="inv-val" style="color:var(--tx3);font-weight:400;font-size:.82em">' + inv.obs + '</span></div>';
      html += '</div>';

      // ===== SEÇÃO RENTABILIDADE — colapsável =====
      if(rents.length){
        var rentTotal = rents.reduce(function(s,r){ return s + (Number(r.valor)||0); }, 0);
        html += '<div class="inv-card-section">';
        html += '<div class="inv-section-toggle" onclick="window._invToggleSection(this)">';
        html += '<span class="inv-section-toggle-title">Rentabilidade <span class="inv-section-toggle-badge">' + rents.length + '</span></span>';
        html += '<span class="inv-section-toggle-icon">\u25BC</span>';
        html += '</div>';
        html += '<div class="inv-section-body"><div class="inv-hist-list">';
        rents.forEach(function(r){
          var rv = Number(r.valor) || 0;
          var mesEscR = r.mes.replace(/'/g, "\\'");
          html += '<div class="inv-hist-item">';
          html += '<span style="color:var(--tx2)">' + mesNome(r.mes) + '</span>';
          html += '<span style="font-weight:700;color:' + (rv >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rv > 0 ? '+ ' : '') + fmt(rv) + '</span>';
          html += '<button class="btn btn-sm btn-danger" style="padding:1px 5px;font-size:.6em" onclick="window._invDelRent(\'' + idEsc + '\',\'' + mesEscR + '\')">&#128465;</button>';
          html += '</div>';
        });
        html += '</div>';
        html += '<div style="text-align:right;font-weight:700;margin-top:6px;padding-top:6px;border-top:1px solid var(--bg3);font-size:.82em;color:' + (rentTotal >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">Total: ' + (rentTotal > 0 ? '+ ' : '') + fmt(rentTotal) + '</div>';
        html += '</div></div>';
      }

      // ===== SEÇÃO MOVIMENTAÇÕES — colapsável =====
      if(movs.length){
        html += '<div class="inv-card-section">';
        html += '<div class="inv-section-toggle" onclick="window._invToggleSection(this)">';
        html += '<span class="inv-section-toggle-title">Movimenta\u00e7\u00f5es <span class="inv-section-toggle-badge">' + movs.length + '</span></span>';
        html += '<span class="inv-section-toggle-icon">\u25BC</span>';
        html += '</div>';
        html += '<div class="inv-section-body"><div class="inv-hist-list">';
        movs.forEach(function(m){
          var mv = Number(m.valor) || 0;
          var movIdEsc = (m.id || '').replace(/'/g, "\\'");
          html += '<div class="inv-hist-item">';
          html += '<span style="color:var(--tx2)">' + fmtD(m.data) + '</span>';
          html += '<span style="font-size:.7em;color:var(--tx3)">' + (m.tipo === 'aporte' ? 'Aporte' : 'Resgate') + '</span>';
          html += '<span style="font-weight:600;color:' + (m.tipo === 'aporte' ? 'var(--ok)' : 'var(--dn2)') + '">' + (m.tipo === 'aporte' ? '+ ' : '- ') + fmt(mv) + '</span>';
          html += '<button class="btn btn-sm btn-danger" style="padding:1px 5px;font-size:.6em" onclick="window._invDelMovById(\'' + idEsc + '\',\'' + movIdEsc + '\')">&#128465;</button>';
          html += '</div>';
        });
        html += '</div></div></div>';
      }

      html += '<div class="inv-card-actions">';
      html += '<button class="btn btn-sm btn-outline" onclick="window._invEdit(\'' + idEsc + '\')">&#9998; Editar</button>';
      html += '<button class="btn btn-sm btn-info" onclick="window._invOpenMov(\'' + idEsc + '\',\'aporte\')">&#128260; Movimentar</button>';
      html += '<button class="btn btn-sm btn-info" onclick="window._invOpenRent(\'' + idEsc + '\')">&#128200; Rent.</button>';
      html += '<button class="btn btn-sm btn-danger" onclick="delInvest(\'' + idEsc + '\')">&#128465;</button>';
      html += '</div></div>';
    });
  }
  html += '</div>';

  area.innerHTML = html;

  var tbWrap = pgEl.querySelector('.table-wrap');
  if(tbWrap) tbWrap.style.display = 'none';
  pgEl.appendChild(area);
};

// ================================================================
// EDITAR
// ================================================================
window._invEdit = function(id){
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;
  var st = document.getElementById('eiTipo');
  st.innerHTML = '';
  (S.cats.investimento || ['Outro']).forEach(function(c){ st.innerHTML += '<option>' + c + '</option>'; });
  document.getElementById('eiId').value = id;
  document.getElementById('eiNome').value = inv.nome || '';
  document.getElementById('eiTipo').value = inv.tipo || '';
  document.getElementById('eiValor').value = (Number(inv.valor) || 0).toFixed(2).replace('.', ',');
  document.getElementById('eiData').value = inv.data || '';
  document.getElementById('eiObs').value = inv.obs || '';
  openM('modalEditInvest');
};
window._invUpdate = function(){
  var id = document.getElementById('eiId').value;
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;
  inv.nome = document.getElementById('eiNome').value.trim();
  inv.tipo = document.getElementById('eiTipo').value;
  inv.valor = parseN(document.getElementById('eiValor').value);
  inv.data = document.getElementById('eiData').value;
  inv.obs = document.getElementById('eiObs').value.trim();
  salvar(); closeM('modalEditInvest'); renderInvest();
};

// ================================================================
// MOVIMENTAÇÕES
// ================================================================
window._invOpenMov = function(id, tipo){
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;
  document.getElementById('movTitle').textContent = (tipo === 'aporte' ? 'Aporte' : 'Resgate') + ' \u2014 ' + (inv.nome || '-');
  document.getElementById('miId').value = id;
  document.getElementById('miTipo').value = tipo || 'aporte';
  document.getElementById('miValor').value = '';
  document.getElementById('miData').value = hojeStr();
  document.getElementById('miObs').value = '';
  _invRenderMovList(inv);
  openM('modalMovInvest');
};
window._invAddMov = function(){
  var id = document.getElementById('miId').value;
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;
  var tipo = document.getElementById('miTipo').value;
  var valor = parseN(document.getElementById('miValor').value);
  var data = document.getElementById('miData').value;
  var obs = document.getElementById('miObs').value.trim();
  if(!valor || valor <= 0) return alert('Valor inv\u00e1lido.');
  if(!data) return alert('Informe a data.');
  if(tipo === 'resgate'){
    var saldoAtual = getInvSaldoAtual(inv);
    if(valor > saldoAtual) return alert('Valor excede o saldo (' + fmtV(saldoAtual) + ').');
  }
  if(!Array.isArray(inv.movimentacoes)) inv.movimentacoes = [];
  inv.movimentacoes.push({ tipo: tipo, valor: valor, data: data, obs: obs, id: uid() });
  salvar();
  document.getElementById('miValor').value = '';
  document.getElementById('miObs').value = '';
  _invRenderMovList(inv); renderInvest();
};
function _invRenderMovList(inv){
  var el = document.getElementById('miMovList'); if(!el) return;
  var movs = (inv.movimentacoes || []).slice().sort(function(a, b){ return (b.data || '').localeCompare(a.data || ''); });
  if(!movs.length){ el.innerHTML = '<p style="color:var(--tx3);text-align:center;font-size:.85em">Nenhuma movimenta\u00e7\u00e3o.</p>'; return; }
  var h = '<div style="font-size:.82em;font-weight:700;margin-bottom:8px;color:var(--tx2)">Hist\u00f3rico</div><div style="max-height:200px;overflow-y:auto">';
  movs.forEach(function(m){
    var mv = Number(m.valor) || 0;
    var invIdEsc = inv.id.replace(/'/g, "\\'");
    var movIdEsc = (m.id || '').replace(/'/g, "\\'");
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bg3);font-size:.82em">' +
      '<span>' + fmtD(m.data) + '</span>' +
      '<span style="font-weight:600;color:' + (m.tipo === 'aporte' ? 'var(--ok)' : 'var(--dn2)') + '">' + (m.tipo === 'aporte' ? '+ ' : '- ') + fmt(mv) + '</span>' +
      '<button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.7em" onclick="window._invDelMovById(\'' + invIdEsc + '\',\'' + movIdEsc + '\')">&#128465;</button></div>';
  });
  h += '</div>';
  el.innerHTML = h;
}
window._invDelMovById = function(invId, movId){
  if(!confirm('Remover movimenta\u00e7\u00e3o?')) return;
  var inv = S.investimentos.find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.movimentacoes = (inv.movimentacoes || []).filter(function(m){ return m.id !== movId; });
  salvar(); _invRenderMovList(inv); renderInvest();
};

// ================================================================
// RENTABILIDADE
// ================================================================
window._invOpenRent = function(id){
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;
  document.getElementById('rentTitle').textContent = 'Rentabilidade \u2014 ' + (inv.nome || '-');
  document.getElementById('riId').value = id;
  document.getElementById('riMes').value = mesAtual();
  document.getElementById('riValor').value = '';
  _invRenderRentList(inv);
  openM('modalRentInvest');
};
window._invAddRent = function(){
  var id = document.getElementById('riId').value;
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;
  var mes = document.getElementById('riMes').value;
  var valor = parseN(document.getElementById('riValor').value);
  if(!mes) return alert('Selecione o m\u00eas.');
  if(valor === 0) return alert('Informe o valor.');
  if(!Array.isArray(inv.rentabilidade)) inv.rentabilidade = [];
  var existing = inv.rentabilidade.find(function(r){ return r.mes === mes; });
  if(existing){
    if(!confirm('Substituir valor de ' + mesNome(mes) + '?')) return;
    existing.valor = valor;
  } else {
    inv.rentabilidade.push({ mes: mes, valor: valor });
  }
  salvar();
  document.getElementById('riValor').value = '';
  _invRenderRentList(inv); renderInvest();
};
function _invRenderRentList(inv){
  var el = document.getElementById('riRentList'); if(!el) return;
  var rents = (inv.rentabilidade || []).slice().sort(function(a, b){ return (b.mes || '').localeCompare(a.mes || ''); });
  if(!rents.length){ el.innerHTML = '<p style="color:var(--tx3);text-align:center;font-size:.85em">Nenhuma rentabilidade.</p>'; return; }
  var totalR = rents.reduce(function(s, r){ return s + (Number(r.valor) || 0); }, 0);
  var h = '<div style="font-size:.82em;font-weight:700;margin-bottom:8px;color:var(--tx2)">Hist\u00f3rico</div><div style="max-height:200px;overflow-y:auto">';
  rents.forEach(function(r){
    var rv = Number(r.valor) || 0;
    var idEsc = inv.id.replace(/'/g, "\\'");
    var mesEsc = r.mes.replace(/'/g, "\\'");
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bg3);font-size:.82em">' +
      '<span>' + mesNome(r.mes) + '</span>' +
      '<span style="font-weight:700;color:' + (rv >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rv > 0 ? '+ ' : '') + fmt(rv) + '</span>' +
      '<button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.7em" onclick="window._invDelRent(\'' + idEsc + '\',\'' + mesEsc + '\')">&#128465;</button></div>';
  });
  h += '</div>';
  h += '<div style="text-align:right;font-weight:700;margin-top:8px;color:' + (totalR >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">Total: ' + (totalR > 0 ? '+ ' : '') + fmt(totalR) + '</div>';
  el.innerHTML = h;
}
window._invDelRent = function(invId, mes){
  if(!confirm('Remover rentabilidade de ' + mesNome(mes) + '?')) return;
  var inv = S.investimentos.find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.rentabilidade = (inv.rentabilidade || []).filter(function(r){ return r.mes !== mes; });
  salvar(); _invRenderRentList(inv); renderInvest();
};

console.log('[Financeiro Pro] Investimentos v6 \u2014 Centavos em tudo, donut center sem centavos, rent. clic\u00e1vel, se\u00e7\u00f5es colaps\u00e1veis.');
})();

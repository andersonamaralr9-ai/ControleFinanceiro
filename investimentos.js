// investimentos.js — Melhorias na tela de Investimentos
// Resumo superior, edição, rentabilidade mensal, alocação por tipo
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* Resumo Investimentos */
.inv-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px;}
.inv-summary .card .card-value{font-size:1.2em;}

/* Alocação */
.inv-alloc{display:grid;grid-template-columns:5fr 3fr;gap:20px;margin-bottom:24px;}
.inv-alloc-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:20px;box-shadow:var(--sh);}
.inv-alloc-box h3{font-size:.88em;margin-bottom:16px;color:var(--tx2);font-weight:600;}
.inv-alloc-item{margin-bottom:12px;}
.inv-alloc-hdr{display:flex;justify-content:space-between;font-size:.84em;margin-bottom:4px;}
.inv-alloc-hdr .inv-alloc-pct{font-weight:700;color:var(--pri2);}
.inv-alloc-bar{background:var(--bg3);border-radius:5px;height:10px;overflow:hidden;}
.inv-alloc-fill{height:100%;border-radius:5px;transition:width .5s;}

/* Cores para categorias */
.inv-color-0{background:linear-gradient(135deg,#6c5ce7,#a29bfe);}
.inv-color-1{background:linear-gradient(135deg,#00b894,#55efc4);}
.inv-color-2{background:linear-gradient(135deg,#0984e3,#74b9ff);}
.inv-color-3{background:linear-gradient(135deg,#fdcb6e,#ffeaa7);}
.inv-color-4{background:linear-gradient(135deg,#e17055,#fab1a0);}
.inv-color-5{background:linear-gradient(135deg,#d63031,#ff7675);}
.inv-color-6{background:linear-gradient(135deg,#00cec9,#81ecec);}
.inv-color-7{background:linear-gradient(135deg,#e84393,#fd79a8);}

/* Donut simples com CSS */
.inv-donut-wrap{display:flex;justify-content:center;align-items:center;min-height:200px;}
.inv-donut{position:relative;width:180px;height:180px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.inv-donut-center{position:absolute;width:100px;height:100px;border-radius:50%;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;}
.inv-donut-center .inv-dc-val{font-size:1em;font-weight:700;color:var(--ok);}
.inv-donut-center .inv-dc-label{font-size:.65em;color:var(--tx3);}
.inv-donut-legend{margin-top:12px;}
.inv-legend-item{display:flex;align-items:center;gap:8px;font-size:.8em;margin-bottom:6px;}
.inv-legend-dot{width:12px;height:12px;border-radius:3px;flex-shrink:0;}

/* Tabela investimentos */
.inv-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-bottom:24px;}
.inv-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);box-shadow:var(--sh);overflow:hidden;transition:transform .2s;}
.inv-card:hover{transform:translateY(-2px);}
.inv-card-header{padding:14px 18px;background:var(--bg3);display:flex;justify-content:space-between;align-items:center;}
.inv-card-header strong{font-size:.95em;}
.inv-card-body{padding:14px 18px;}
.inv-card-body .inv-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:.84em;}
.inv-card-body .inv-row .inv-label{color:var(--tx2);}
.inv-card-body .inv-row .inv-val{font-weight:700;}
.inv-card-actions{padding:10px 18px 14px;display:flex;gap:6px;flex-wrap:wrap;}
.inv-rent-section{border-top:1px solid var(--bg4);padding:10px 18px;margin-top:0;}
.inv-rent-title{font-size:.72em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
.inv-rent-list{max-height:120px;overflow-y:auto;}
.inv-rent-item{display:flex;justify-content:space-between;font-size:.78em;padding:3px 0;border-bottom:1px solid var(--bg3);}
.inv-rent-item:last-child{border:none;}
.inv-rent-item .inv-rent-mes{color:var(--tx2);}
.inv-rent-item .inv-rent-val{font-weight:700;}
.inv-rent-item .inv-rent-val.pos{color:var(--ok);}
.inv-rent-item .inv-rent-val.neg{color:var(--dn2);}

/* Rentabilidade resumo */
.inv-rent-summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;}
.inv-rent-summary .inv-rs-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 18px;flex:1;min-width:200px;box-shadow:var(--sh);}
.inv-rs-card h4{font-size:.72em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}

@media(max-width:768px){
  .inv-alloc{grid-template-columns:1fr;}
  .inv-cards-grid{grid-template-columns:1fr;}
  .inv-summary{grid-template-columns:1fr 1fr;}
  .inv-rent-summary{flex-direction:column;}
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAIS
// ================================================================
// Modal Editar Investimento
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

// Modal Lançar Rentabilidade
var modalRent = document.createElement('div');
modalRent.className = 'modal';
modalRent.id = 'modalRentInvest';
modalRent.innerHTML = '<div class="modal-content"><div class="modal-header"><h3 id="rentTitle">Lan\u00e7ar Rentabilidade</h3>'+
  '<span class="modal-close" onclick="closeM(\'modalRentInvest\')">&times;</span></div><div class="modal-body">'+
  '<div class="form-group" style="margin-bottom:12px"><label>M\u00eas de Refer\u00eancia</label><input type="month" id="riMes" class="form-control"></div>'+
  '<div class="form-group" style="margin-bottom:12px"><label>Valor da Rentabilidade (R$)</label><input id="riValor" class="form-control" placeholder="Ex: 150,00 ou -50,00"></div>'+
  '<p style="font-size:.75em;color:var(--tx3);margin-bottom:12px">Use valor positivo para ganho e negativo para perda.</p>'+
  '<input type="hidden" id="riId">'+
  '<button class="btn btn-primary" onclick="window._invAddRent()" style="width:100%;margin-top:8px">Lan\u00e7ar</button>'+
  '<div id="riRentList" style="margin-top:16px"></div>'+
  '</div></div>';
document.body.appendChild(modalRent);

// ================================================================
// CORES PARA GRÁFICO
// ================================================================
var COLORS = ['#6c5ce7','#00b894','#0984e3','#fdcb6e','#e17055','#d63031','#00cec9','#e84393','#636e72','#2d3436'];

function getColor(i){ return COLORS[i % COLORS.length]; }

// ================================================================
// HELPERS
// ================================================================
function getInvRentTotal(inv){
  var rents = inv.rentabilidade || [];
  return rents.reduce(function(s, r){ return s + (Number(r.valor) || 0); }, 0);
}

function getInvSaldoAtual(inv){
  return (Number(inv.valor) || 0) + getInvRentTotal(inv);
}

function getInvRentMes(inv, mes){
  var rents = inv.rentabilidade || [];
  var found = rents.find(function(r){ return r.mes === mes; });
  return found ? (Number(found.valor) || 0) : 0;
}

// ================================================================
// OVERRIDE renderInvest
// ================================================================
var _origRenderInvest = window.renderInvest;

window.renderInvest = function(){
  // Popular o select de tipo do form original
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

  // Remover conteúdo dinâmico anterior (mantém o form e o título)
  var existing = document.getElementById('invDynamicArea');
  if(existing) existing.remove();

  var area = document.createElement('div');
  area.id = 'invDynamicArea';

  // ===== CÁLCULOS =====
  var totalInvestido = 0, totalRent = 0, totalSaldo = 0;
  var porTipo = {};

  invs.forEach(function(inv){
    var v = Number(inv.valor) || 0;
    var rent = getInvRentTotal(inv);
    var saldo = v + rent;
    totalInvestido += v;
    totalRent += rent;
    totalSaldo += saldo;

    var tipo = inv.tipo || 'Outro';
    if(!porTipo[tipo]) porTipo[tipo] = { investido: 0, rent: 0, saldo: 0, count: 0 };
    porTipo[tipo].investido += v;
    porTipo[tipo].rent += rent;
    porTipo[tipo].saldo += saldo;
    porTipo[tipo].count++;
  });

  var rentPct = totalInvestido > 0 ? ((totalRent / totalInvestido) * 100) : 0;

  // Rentabilidade do mês atual
  var ma = mesAtual();
  var rentMesAtual = 0;
  invs.forEach(function(inv){ rentMesAtual += getInvRentMes(inv, ma); });

  // ===== RESUMO =====
  var html = '<div class="inv-summary">' +
    '<div class="card"><div class="card-label">Total Investido</div><div class="card-value blue">' + fmtV(totalInvestido) + '</div></div>' +
    '<div class="card"><div class="card-label">Rentabilidade Total</div><div class="card-value ' + (totalRent >= 0 ? 'green' : 'red') + '">' + fmtV(totalRent) + '</div></div>' +
    '<div class="card"><div class="card-label">Saldo Atual</div><div class="card-value ' + (totalSaldo >= 0 ? 'green' : 'red') + '">' + fmtV(totalSaldo) + '</div></div>' +
    '<div class="card"><div class="card-label">Rentabilidade %</div><div class="card-value ' + (rentPct >= 0 ? 'green' : 'red') + '">' + rentPct.toFixed(2) + '%</div></div>' +
    '<div class="card"><div class="card-label">Rent. M\u00eas Atual</div><div class="card-value ' + (rentMesAtual >= 0 ? 'green' : 'red') + '">' + fmtV(rentMesAtual) + '</div></div>' +
    '<div class="card"><div class="card-label">Ativos</div><div class="card-value purple">' + invs.length + '</div></div>' +
  '</div>';

  // ===== ALOCAÇÃO POR TIPO =====
  var tipos = Object.keys(porTipo).sort(function(a, b){ return porTipo[b].saldo - porTipo[a].saldo; });

  html += '<div class="inv-alloc">';

  // Barras
  html += '<div class="inv-alloc-box"><h3>&#128202; Aloca\u00e7\u00e3o por Tipo</h3>';
  if(!tipos.length){
    html += '<p style="color:var(--tx3)">Nenhum investimento</p>';
  } else {
    tipos.forEach(function(tipo, idx){
      var data = porTipo[tipo];
      var pct = totalSaldo > 0 ? ((data.saldo / totalSaldo) * 100) : 0;
      html += '<div class="inv-alloc-item">' +
        '<div class="inv-alloc-hdr"><span>' + tipo + ' (' + data.count + ')</span>' +
        '<span><span class="inv-alloc-pct">' + pct.toFixed(1) + '%</span> \u2022 ' + fmtV(data.saldo) + '</span></div>' +
        '<div class="inv-alloc-bar"><div class="inv-alloc-fill inv-color-' + (idx % 8) + '" style="width:' + Math.max(pct, 2) + '%"></div></div>' +
      '</div>';
    });
  }
  html += '</div>';

  // Donut
  html += '<div class="inv-alloc-box"><h3>&#128176; Distribui\u00e7\u00e3o</h3>';
  if(!tipos.length){
    html += '<p style="color:var(--tx3);text-align:center;padding:40px">Nenhum dado</p>';
  } else {
    // Gerar conic-gradient
    var gradParts = [];
    var cumPct = 0;
    tipos.forEach(function(tipo, idx){
      var pct = totalSaldo > 0 ? ((porTipo[tipo].saldo / totalSaldo) * 100) : 0;
      gradParts.push(getColor(idx) + ' ' + cumPct + '% ' + (cumPct + pct) + '%');
      cumPct += pct;
    });
    var gradStr = 'conic-gradient(' + gradParts.join(', ') + ')';

    html += '<div class="inv-donut-wrap"><div>' +
      '<div class="inv-donut" style="background:' + gradStr + '">' +
        '<div class="inv-donut-center"><span class="inv-dc-val">' + fmtV(totalSaldo) + '</span><span class="inv-dc-label">Saldo Total</span></div>' +
      '</div>' +
      '<div class="inv-donut-legend">';
    tipos.forEach(function(tipo, idx){
      var pct = totalSaldo > 0 ? ((porTipo[tipo].saldo / totalSaldo) * 100) : 0;
      html += '<div class="inv-legend-item"><div class="inv-legend-dot" style="background:' + getColor(idx) + '"></div>' +
        '<span>' + tipo + ' \u2022 ' + pct.toFixed(1) + '%</span></div>';
    });
    html += '</div></div></div>';
  }
  html += '</div>';

  // ===== RENTABILIDADE POR MÊS (últimos 6 meses) =====
  html += '<div class="inv-rent-summary">';
  for(var mi = -5; mi <= 0; mi++){
    var mes = addMes(ma, mi);
    var rentMes = 0;
    invs.forEach(function(inv){ rentMes += getInvRentMes(inv, mes); });
    var corMes = rentMes > 0 ? 'var(--ok)' : (rentMes < 0 ? 'var(--dn2)' : 'var(--tx3)');
    html += '<div class="inv-rs-card"><h4>' + mesNome(mes) + '</h4>' +
      '<div style="font-size:1.05em;font-weight:700;color:' + corMes + '">' + (rentMes > 0 ? '+' : '') + fmtV(rentMes) + '</div></div>';
  }
  html += '</div>';

  // ===== CARDS DE INVESTIMENTOS =====
  html += '<div class="inv-cards-grid">';
  if(!invs.length){
    html += '<p style="color:var(--tx3);grid-column:1/-1;text-align:center;padding:30px">Nenhum investimento cadastrado.</p>';
  } else {
    // Ordenar por saldo desc
    var sorted = invs.slice().sort(function(a, b){ return getInvSaldoAtual(b) - getInvSaldoAtual(a); });
    sorted.forEach(function(inv){
      var v = Number(inv.valor) || 0;
      var rent = getInvRentTotal(inv);
      var saldo = v + rent;
      var rentPctI = v > 0 ? ((rent / v) * 100) : 0;
      var pctAlloc = totalSaldo > 0 ? ((saldo / totalSaldo) * 100) : 0;
      var rents = (inv.rentabilidade || []).slice().sort(function(a, b){ return (b.mes || '').localeCompare(a.mes || ''); });

      var idEsc = inv.id.replace(/'/g, "\\'");

      html += '<div class="inv-card">' +
        '<div class="inv-card-header"><strong>' + (inv.nome || '-') + '</strong><span class="badge badge-info">' + (inv.tipo || 'Outro') + '</span></div>' +
        '<div class="inv-card-body">' +
          '<div class="inv-row"><span class="inv-label">Investido</span><span class="inv-val" style="color:var(--inf2)">' + fmtV(v) + '</span></div>' +
          '<div class="inv-row"><span class="inv-label">Rentabilidade</span><span class="inv-val" style="color:' + (rent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rent > 0 ? '+' : '') + fmtV(rent) + '</span></div>' +
          '<div class="inv-row"><span class="inv-label">Saldo Atual</span><span class="inv-val" style="color:' + (saldo >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldo) + '</span></div>' +
          '<div class="inv-row"><span class="inv-label">Rent. %</span><span class="inv-val" style="color:' + (rentPctI >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + rentPctI.toFixed(2) + '%</span></div>' +
          '<div class="inv-row"><span class="inv-label">Aloca\u00e7\u00e3o</span><span class="inv-val" style="color:var(--pri2)">' + pctAlloc.toFixed(1) + '%</span></div>' +
          '<div class="inv-row"><span class="inv-label">Data</span><span class="inv-val" style="color:var(--tx2)">' + fmtD(inv.data) + '</span></div>' +
          (inv.obs ? '<div class="inv-row"><span class="inv-label">Obs</span><span class="inv-val" style="color:var(--tx3);font-weight:400;font-size:.82em">' + inv.obs + '</span></div>' : '') +
        '</div>';

      // Histórico de rentabilidade
      if(rents.length){
        html += '<div class="inv-rent-section"><div class="inv-rent-title">Hist\u00f3rico de Rentabilidade</div><div class="inv-rent-list">';
        rents.forEach(function(r){
          var rv = Number(r.valor) || 0;
          html += '<div class="inv-rent-item"><span class="inv-rent-mes">' + mesNome(r.mes) + '</span>' +
            '<span class="inv-rent-val ' + (rv >= 0 ? 'pos' : 'neg') + '">' + (rv > 0 ? '+' : '') + fmtV(rv) + '</span></div>';
        });
        html += '</div></div>';
      }

      html += '<div class="inv-card-actions">' +
        '<button class="btn btn-sm btn-outline" onclick="window._invEdit(\'' + idEsc + '\')">&#9998; Editar</button>' +
        '<button class="btn btn-sm btn-success" onclick="window._invOpenRent(\'' + idEsc + '\')">&#128200; Rentabilidade</button>' +
        '<button class="btn btn-sm btn-danger" onclick="delInvest(\'' + idEsc + '\')">&#128465;</button>' +
      '</div></div>';
    });
  }
  html += '</div>';

  area.innerHTML = html;

  // Inserir após a tabela original (escondendo-a)
  var tbWrap = pgEl.querySelector('.table-wrap');
  if(tbWrap) tbWrap.style.display = 'none';
  pgEl.appendChild(area);
};

// ================================================================
// EDITAR INVESTIMENTO
// ================================================================
window._invEdit = function(id){
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;

  var st = document.getElementById('eiTipo');
  st.innerHTML = '';
  (S.cats.investimento || ['Outro']).forEach(function(c){
    st.innerHTML += '<option>' + c + '</option>';
  });

  document.getElementById('eiId').value = id;
  document.getElementById('eiNome').value = inv.nome || '';
  document.getElementById('eiTipo').value = inv.tipo || '';
  document.getElementById('eiValor').value = (inv.valor || 0).toFixed(2).replace('.', ',');
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

  salvar();
  closeM('modalEditInvest');
  renderInvest();
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
  if(valor === 0) return alert('Informe o valor da rentabilidade.');

  if(!Array.isArray(inv.rentabilidade)) inv.rentabilidade = [];

  // Verificar se já existe lançamento nesse mês
  var existing = inv.rentabilidade.find(function(r){ return r.mes === mes; });
  if(existing){
    if(!confirm('J\u00e1 existe rentabilidade em ' + mesNome(mes) + ' (' + fmtV(existing.valor) + '). Substituir?')) return;
    existing.valor = valor;
  } else {
    inv.rentabilidade.push({ mes: mes, valor: valor });
  }

  salvar();
  document.getElementById('riValor').value = '';
  _invRenderRentList(inv);
  renderInvest();
};

function _invRenderRentList(inv){
  var el = document.getElementById('riRentList');
  if(!el) return;
  var rents = (inv.rentabilidade || []).slice().sort(function(a, b){ return (b.mes || '').localeCompare(a.mes || ''); });

  if(!rents.length){
    el.innerHTML = '<p style="color:var(--tx3);text-align:center;font-size:.85em">Nenhuma rentabilidade lan\u00e7ada.</p>';
    return;
  }

  var totalR = rents.reduce(function(s, r){ return s + (Number(r.valor) || 0); }, 0);
  var h = '<div style="font-size:.82em;font-weight:700;margin-bottom:8px;color:var(--tx2)">Hist\u00f3rico</div>';
  h += '<div style="max-height:200px;overflow-y:auto">';
  rents.forEach(function(r){
    var rv = Number(r.valor) || 0;
    var idEsc = inv.id.replace(/'/g, "\\'");
    var mesEsc = r.mes.replace(/'/g, "\\'");
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bg3);font-size:.82em">' +
      '<span>' + mesNome(r.mes) + '</span>' +
      '<span style="font-weight:700;color:' + (rv >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rv > 0 ? '+' : '') + fmtV(rv) + '</span>' +
      '<button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.7em" onclick="window._invDelRent(\'' + idEsc + '\',\'' + mesEsc + '\')">&#128465;</button>' +
    '</div>';
  });
  h += '</div>';
  h += '<div style="text-align:right;font-weight:700;margin-top:8px;color:' + (totalR >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">Total: ' + (totalR > 0 ? '+' : '') + fmtV(totalR) + '</div>';
  el.innerHTML = h;
}

window._invDelRent = function(invId, mes){
  if(!confirm('Remover rentabilidade de ' + mesNome(mes) + '?')) return;
  var inv = S.investimentos.find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.rentabilidade = (inv.rentabilidade || []).filter(function(r){ return r.mes !== mes; });
  salvar();
  _invRenderRentList(inv);
  renderInvest();
};

console.log('[Financeiro Pro] Investimentos melhorado carregado.');
})();

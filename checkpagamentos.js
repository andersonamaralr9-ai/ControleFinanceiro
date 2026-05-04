// checkpagamentos.js v3 — Layout duas colunas (Receitas | Despesas) + resumo expandido
(function(){
'use strict';

// ================================================================
// PERSISTÊNCIA — dentro de S (sincroniza com Gist)
// ================================================================
function ensureCheckObj(){
  if(!S.checkPagamentos || typeof S.checkPagamentos !== 'object' || Array.isArray(S.checkPagamentos)){
    S.checkPagamentos = {};
  }
}
function loadChecks(mes){
  ensureCheckObj();
  return S.checkPagamentos[mes] || {};
}
function saveChecks(mes, checks){
  ensureCheckObj();
  S.checkPagamentos[mes] = checks;
  salvar();
}

// mergeState override
var _origMerge = window.mergeState;
if(_origMerge){
  window.mergeState = function(d){
    var st = _origMerge(d);
    if(d.checkPagamentos && typeof d.checkPagamentos === 'object' && !Array.isArray(d.checkPagamentos)){
      if(!st.checkPagamentos) st.checkPagamentos = {};
      Object.keys(d.checkPagamentos).forEach(function(mes){
        if(!st.checkPagamentos[mes]) st.checkPagamentos[mes] = {};
        Object.keys(d.checkPagamentos[mes]).forEach(function(key){
          st.checkPagamentos[mes][key] = d.checkPagamentos[mes][key];
        });
      });
    }
    if(!st.checkPagamentos) st.checkPagamentos = {};
    return st;
  };
}
if(typeof S !== 'undefined') ensureCheckObj();

// ================================================================
// ESTADO
// ================================================================
var checkMes = mesAtual();

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* === RESUMO: 2 linhas — quantidades + valores === */
.check-summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;}
.check-summary-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 16px;text-align:center;box-shadow:var(--sh);}
.check-summary-card .cs-label{font-size:.68em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:4px;}
.check-summary-card .cs-value{font-size:1.15em;font-weight:700;}
.check-summary-divider{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.check-summary-group{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px;box-shadow:var(--sh);}
.check-summary-group h4{font-size:.78em;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid var(--bg4);}
.check-summary-group h4.rec-title{color:var(--ok);}
.check-summary-group h4.desp-title{color:var(--dn2);}
.csg-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:.84em;}
.csg-row .csg-label{color:var(--tx2);}
.csg-row .csg-val{font-weight:700;}

/* === PROGRESS === */
.check-progress{background:var(--bg3);border-radius:8px;height:14px;overflow:hidden;margin-bottom:20px;position:relative;}
.check-progress-fill{height:100%;border-radius:8px;background:var(--okG);transition:width .4s ease;}
.check-progress-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.68em;font-weight:700;color:var(--tx);text-shadow:0 1px 2px rgba(0,0,0,.4);}

/* === SALDO === */
.check-saldo-bar{display:flex;justify-content:center;align-items:center;gap:24px;margin-bottom:20px;padding:14px;background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);box-shadow:var(--sh);}
.check-saldo-bar .csb-item{text-align:center;}
.check-saldo-bar .csb-label{font-size:.68em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:2px;}
.check-saldo-bar .csb-val{font-size:1.1em;font-weight:700;}

/* === AÇÕES E FILTROS === */
.check-actions-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
.check-filter-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.check-filter-bar .form-control{max-width:180px;}
.check-filter-bar .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}

/* === DUAS COLUNAS === */
.check-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.check-col-header{font-size:.9em;font-weight:700;padding:12px 16px;border-radius:var(--rad);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;}
.check-col-header.rec{background:rgba(0,206,201,.08);border:1px solid rgba(0,206,201,.2);color:var(--ok);}
.check-col-header.desp{background:rgba(214,48,49,.08);border:1px solid rgba(214,48,49,.2);color:var(--dn2);}

.check-section{margin-bottom:16px;}
.check-section-title{font-size:.82em;font-weight:700;padding:8px 14px;background:var(--bg3);border-radius:var(--rad) var(--rad) 0 0;color:var(--tx2);border:1px solid var(--bg4);border-bottom:none;display:flex;justify-content:space-between;align-items:center;}
.check-section-total{font-weight:700;color:var(--pri2);font-size:.85em;}

.check-list{background:var(--bg2);border:1px solid var(--bg4);border-radius:0 0 var(--rad) var(--rad);overflow:hidden;box-shadow:var(--sh);}

.check-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--bg3);transition:background .15s,opacity .15s;cursor:pointer;-webkit-user-select:none;user-select:none;}
.check-item:last-child{border-bottom:none;}
.check-item:hover{background:var(--bg3);}
.check-item.checked{opacity:.55;}
.check-item.checked .check-desc{text-decoration:line-through;color:var(--tx3);}
.check-item.checked .check-valor{text-decoration:line-through;}

.check-box{width:20px;height:20px;border-radius:6px;border:2px solid var(--bg4);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:.72em;color:transparent;}
.check-item.checked .check-box{background:var(--ok);border-color:var(--ok);color:#fff;}

.check-info{flex:1;min-width:0;}
.check-desc{font-size:.84em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.check-detail{font-size:.68em;color:var(--tx3);margin-top:2px;}

.check-valor{font-weight:700;font-size:.85em;text-align:right;white-space:nowrap;min-width:80px;}
.check-valor.rec{color:var(--ok);}
.check-valor.desp{color:var(--dn2);}

.check-origem{font-size:.64em;padding:2px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0;}
.check-origem.contrato{background:rgba(108,92,231,.15);color:var(--pri2);}
.check-origem.assinatura{background:rgba(253,203,110,.15);color:var(--wn);}
.check-origem.lancamento{background:rgba(9,132,227,.15);color:var(--inf2);}
.check-origem.cartao{background:rgba(230,81,0,.12);color:#e65100;}

.check-empty{padding:30px;text-align:center;color:var(--tx3);font-size:.85em;}

@media(max-width:768px){
  .check-columns{grid-template-columns:1fr;}
  .check-summary-row{grid-template-columns:1fr 1fr 1fr;}
  .check-summary-divider{grid-template-columns:1fr;}
  .check-item{padding:9px 10px;gap:8px;}
  .check-desc{font-size:.78em;}
  .check-valor{font-size:.78em;min-width:65px;}
  .check-origem{font-size:.58em;padding:2px 5px;}
  .check-filter-bar{flex-direction:column;align-items:stretch;}
  .check-filter-bar .form-control{max-width:100%;}
  .check-filter-bar .filter-count{margin-left:0;text-align:center;}
  .check-saldo-bar{flex-direction:column;gap:10px;}
}
@media(max-width:380px){
  .check-summary-row{grid-template-columns:1fr 1fr;}
}
`;
document.head.appendChild(sty);

// ================================================================
// MENU
// ================================================================
var sidebar = document.getElementById('sidebar');
if(!sidebar) return;
var balLink = document.getElementById('nav-balancete');
if(!balLink) return;

var newLink = document.createElement('a');
newLink.id = 'nav-checkpag';
newLink.onclick = function(){ nav('checkpag'); };
newLink.innerHTML = '<span>&#9989; Check Pagamentos</span>';
balLink.parentNode.insertBefore(newLink, balLink.nextSibling);

// ================================================================
// PÁGINA
// ================================================================
var mainDiv = document.querySelector('.main');
if(!mainDiv) return;

var pgDiv = document.createElement('div');
pgDiv.className = 'page';
pgDiv.id = 'pg-checkpag';
pgDiv.innerHTML =
  '<h2 class="page-title">&#9989; Check de Pagamentos do M\u00eas</h2>' +
  '<div class="month-nav">' +
    '<button class="btn btn-outline" onclick="chgCheckM(-1)">&#9664;</button>' +
    '<span class="mes-label" id="checkMesLabel"></span>' +
    '<button class="btn btn-outline" onclick="chgCheckM(1)">&#9654;</button>' +
  '</div>' +
  '<div id="checkSummaryArea"></div>' +
  '<div id="checkProgress"></div>' +
  '<div id="checkSaldoBar"></div>' +
  '<div class="check-actions-bar">' +
    '<button class="btn btn-sm btn-success" onclick="checkMarcarTodos()">&#9989; Marcar Todos</button>' +
    '<button class="btn btn-sm btn-outline" onclick="checkDesmarcarTodos()">Desmarcar Todos</button>' +
  '</div>' +
  '<div class="check-filter-bar">' +
    '<select id="checkFiltroOrigem" class="form-control" onchange="renderCheckPag()">' +
      '<option value="">Todas as origens</option>' +
      '<option value="Lan\u00e7amento">Lan\u00e7amentos</option>' +
      '<option value="Contrato">Contratos</option>' +
      '<option value="Assinatura">Assinaturas</option>' +
      '<option value="Cart\u00e3o">Cart\u00e3o</option>' +
    '</select>' +
    '<select id="checkFiltroStatus" class="form-control" onchange="renderCheckPag()">' +
      '<option value="">Todos</option>' +
      '<option value="pendente">Pendentes</option>' +
      '<option value="pago">J\u00e1 pagos</option>' +
    '</select>' +
    '<span class="filter-count" id="checkFilterCount"></span>' +
  '</div>' +
  '<div id="checkArea" class="check-columns"></div>';
mainDiv.appendChild(pgDiv);

// ================================================================
// NAVEGAÇÃO DE MÊS
// ================================================================
window.chgCheckM = function(dir){
  checkMes = addMes(checkMes, dir);
  renderCheckPag();
};

// ================================================================
// TOGGLE / MARCAR / DESMARCAR
// ================================================================
window.toggleCheck = function(itemKey){
  var checks = loadChecks(checkMes);
  if(checks[itemKey]) delete checks[itemKey];
  else checks[itemKey] = true;
  saveChecks(checkMes, checks);
  renderCheckPag();
};

window.checkMarcarTodos = function(){
  var entries = allEntries(checkMes);
  var checks = loadChecks(checkMes);
  entries.forEach(function(e){ checks[buildItemKey(e)] = true; });
  saveChecks(checkMes, checks);
  renderCheckPag();
};

window.checkDesmarcarTodos = function(){
  if(!confirm('Desmarcar todos os pagamentos do m\u00eas?')) return;
  saveChecks(checkMes, {});
  renderCheckPag();
};

// ================================================================
// HELPERS
// ================================================================
function buildItemKey(entry){
  return (entry.origem||'') + '|' + (entry.desc||'') + '|' + (entry.valor||0).toFixed(2);
}

function getOrigemSimples(entry){
  var o = entry.origem || '';
  if(o === 'Contrato') return 'Contrato';
  if(o.startsWith('Assinatura')) return 'Assinatura';
  if(o.startsWith('Cart\u00e3o') || entry.isCC) return 'Cart\u00e3o';
  return 'Lan\u00e7amento';
}
function getOrigemClass(orig){
  if(orig === 'Contrato') return 'contrato';
  if(orig === 'Assinatura') return 'assinatura';
  if(orig === 'Cart\u00e3o') return 'cartao';
  return 'lancamento';
}
function getGrupoIcon(g){
  if(g === 'Contrato') return '&#128196;';
  if(g === 'Assinatura') return '&#128257;';
  if(g === 'Cart\u00e3o') return '&#128179;';
  return '&#128221;';
}
function getGrupoLabel(g){
  if(g === 'Contrato') return 'Contratos';
  if(g === 'Assinatura') return 'Assinaturas';
  if(g === 'Cart\u00e3o') return 'Cart\u00e3o de Cr\u00e9dito';
  return 'Lan\u00e7amentos';
}

// Renderizar uma lista de itens agrupados por origem
function renderColItems(items, checks){
  var ordemGrupos = ['Contrato', 'Assinatura', 'Cart\u00e3o', 'Lan\u00e7amento'];
  var grupos = {};
  items.forEach(function(e){
    var orig = getOrigemSimples(e);
    if(!grupos[orig]) grupos[orig] = [];
    grupos[orig].push(e);
  });

  var html = '';
  ordemGrupos.forEach(function(gNome){
    var gItems = grupos[gNome];
    if(!gItems || !gItems.length) return;

    var grupoTotal = gItems.reduce(function(s, e){ return s + e.valor; }, 0);
    var grupoPagos = gItems.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;

    html += '<div class="check-section">';
    html += '<div class="check-section-title">' +
      '<span>' + getGrupoIcon(gNome) + ' ' + getGrupoLabel(gNome) + ' (' + grupoPagos + '/' + gItems.length + ')</span>' +
      '<span class="check-section-total">' + fmtV(grupoTotal) + '</span></div>';
    html += '<div class="check-list">';

    gItems.forEach(function(e){
      var key = buildItemKey(e);
      var isPago = !!checks[key];
      var keyEsc = key.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');

      html += '<div class="check-item ' + (isPago ? 'checked' : '') + '" onclick="toggleCheck(\'' + keyEsc + '\')">' +
        '<div class="check-box">' + (isPago ? '&#10003;' : '') + '</div>' +
        '<div class="check-info">' +
          '<div class="check-desc">' + (e.desc || '-') + '</div>' +
          '<div class="check-detail">' + (e.cat || '') +
            (e.data ? ' \u2022 ' + fmtD(e.data) : '') +
            (e.obs ? ' \u2022 ' + e.obs : '') +
          '</div>' +
        '</div>' +
        '<span class="check-origem ' + getOrigemClass(getOrigemSimples(e)) + '">' + (e.origem || 'Manual') + '</span>' +
        '<div class="check-valor ' + (e.tipo === 'receita' ? 'rec' : 'desp') + '">' +
          fmtV(e.valor) +
        '</div></div>';
    });

    html += '</div></div>';
  });

  if(!items.length){
    html = '<div class="check-empty">Nenhum item</div>';
  }

  return html;
}

// ================================================================
// RENDER PRINCIPAL
// ================================================================
window.renderCheckPag = function(){
  document.getElementById('checkMesLabel').textContent = mesNomeFull(checkMes);

  var entries = allEntries(checkMes);
  var checks = loadChecks(checkMes);

  // Separar receitas e despesas
  var receitas = [], despesas = [];
  entries.forEach(function(e){
    if(e.tipo === 'receita') receitas.push(e);
    else despesas.push(e);
  });

  // Ordenar por valor desc
  receitas.sort(function(a,b){ return b.valor - a.valor; });
  despesas.sort(function(a,b){ return b.valor - a.valor; });

  // Filtros (sem filtro de tipo — a separação em colunas já resolve)
  var filtroOrigem = (document.getElementById('checkFiltroOrigem') || {}).value || '';
  var filtroStatus = (document.getElementById('checkFiltroStatus') || {}).value || '';

  function applyFilter(list){
    return list.filter(function(e){
      if(filtroOrigem && getOrigemSimples(e) !== filtroOrigem) return false;
      if(filtroStatus){
        var isPago = !!checks[buildItemKey(e)];
        if(filtroStatus === 'pendente' && isPago) return false;
        if(filtroStatus === 'pago' && !isPago) return false;
      }
      return true;
    });
  }

  var filteredRec = applyFilter(receitas);
  var filteredDesp = applyFilter(despesas);

  // Estatísticas (sobre TODOS, não filtrados)
  var totalRec = 0, totalDesp = 0;
  var pagosRec = 0, pagosDesp = 0;
  var pagosCountRec = 0, pagosCountDesp = 0;

  receitas.forEach(function(e){
    totalRec += e.valor;
    if(checks[buildItemKey(e)]){ pagosRec += e.valor; pagosCountRec++; }
  });
  despesas.forEach(function(e){
    totalDesp += e.valor;
    if(checks[buildItemKey(e)]){ pagosDesp += e.valor; pagosCountDesp++; }
  });

  var totalCount = entries.length;
  var pagosCount = pagosCountRec + pagosCountDesp;
  var pct = totalCount ? Math.round(pagosCount / totalCount * 100) : 0;

  // ===== RESUMO: Quantidades + Valores em duas seções =====
  var summaryHtml =
    // Linha 1: Quantidades
    '<div class="check-summary-row">' +
      '<div class="check-summary-card"><div class="cs-label">Total Itens</div><div class="cs-value" style="color:var(--pri2)">' + totalCount + '</div></div>' +
      '<div class="check-summary-card"><div class="cs-label">Validados</div><div class="cs-value" style="color:var(--ok)">' + pagosCount + '</div></div>' +
      '<div class="check-summary-card"><div class="cs-label">Pendentes</div><div class="cs-value" style="color:' + ((totalCount - pagosCount) > 0 ? 'var(--dn2)' : 'var(--ok)') + '">' + (totalCount - pagosCount) + '</div></div>' +
    '</div>' +
    // Linha 2: Receitas x Despesas lado a lado
    '<div class="check-summary-divider">' +
      // Coluna Receitas
      '<div class="check-summary-group">' +
        '<h4 class="rec-title">&#128200; Receitas (' + receitas.length + ' itens)</h4>' +
        '<div class="csg-row"><span class="csg-label">Total</span><span class="csg-val" style="color:var(--ok)">' + fmtV(totalRec) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Confirmadas</span><span class="csg-val" style="color:var(--ok)">' + fmtV(pagosRec) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pendentes</span><span class="csg-val" style="color:' + ((totalRec - pagosRec) > 0 ? 'var(--wn)' : 'var(--ok)') + '">' + fmtV(totalRec - pagosRec) + '</span></div>' +
      '</div>' +
      // Coluna Despesas
      '<div class="check-summary-group">' +
        '<h4 class="desp-title">&#128201; Despesas (' + despesas.length + ' itens)</h4>' +
        '<div class="csg-row"><span class="csg-label">Total</span><span class="csg-val" style="color:var(--dn2)">' + fmtV(totalDesp) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pagas</span><span class="csg-val" style="color:var(--dn2)">' + fmtV(pagosDesp) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pendentes</span><span class="csg-val" style="color:' + ((totalDesp - pagosDesp) > 0 ? 'var(--wn)' : 'var(--ok)') + '">' + fmtV(totalDesp - pagosDesp) + '</span></div>' +
      '</div>' +
    '</div>';

  document.getElementById('checkSummaryArea').innerHTML = summaryHtml;

  // Barra de progresso
  document.getElementById('checkProgress').innerHTML =
    '<div class="check-progress">' +
      '<div class="check-progress-fill" style="width:' + pct + '%;' + (pct === 100 ? 'background:var(--ok)' : '') + '"></div>' +
      '<div class="check-progress-text">' + pct + '% conclu\u00eddo (' + pagosCount + '/' + totalCount + ')</div>' +
    '</div>';

  // Barra de saldo
  var saldo = totalRec - totalDesp;
  var saldoConf = pagosRec - pagosDesp;
  document.getElementById('checkSaldoBar').innerHTML =
    '<div class="check-saldo-bar">' +
      '<div class="csb-item"><div class="csb-label">Saldo Previsto</div><div class="csb-val" style="color:' + (saldo >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldo) + '</div></div>' +
      '<div class="csb-item"><div class="csb-label">Saldo Confirmado</div><div class="csb-val" style="color:' + (saldoConf >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldoConf) + '</div></div>' +
    '</div>';

  // ===== DUAS COLUNAS: Receitas | Despesas =====
  var recCount = filteredRec.length;
  var despCount = filteredDesp.length;
  var recPagos = filteredRec.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;
  var despPagos = filteredDesp.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;
  var recTotal = filteredRec.reduce(function(s,e){ return s+e.valor; },0);
  var despTotal = filteredDesp.reduce(function(s,e){ return s+e.valor; },0);

  var colHtml =
    // Coluna Receitas
    '<div class="check-col">' +
      '<div class="check-col-header rec">' +
        '<span>&#128200; Receitas (' + recPagos + '/' + recCount + ')</span>' +
        '<span>' + fmtV(recTotal) + '</span>' +
      '</div>' +
      renderColItems(filteredRec, checks) +
    '</div>' +
    // Coluna Despesas
    '<div class="check-col">' +
      '<div class="check-col-header desp">' +
        '<span>&#128201; Despesas (' + despPagos + '/' + despCount + ')</span>' +
        '<span>' + fmtV(despTotal) + '</span>' +
      '</div>' +
      renderColItems(filteredDesp, checks) +
    '</div>';

  document.getElementById('checkArea').innerHTML = colHtml;

  // Filter count
  var fc = document.getElementById('checkFilterCount');
  if(fc) fc.textContent = (recCount + despCount) + ' de ' + totalCount + ' item(ns)';
};

// ================================================================
// HOOK NAVEGAÇÃO
// ================================================================
var _origNav = window.nav;
window.nav = function(pg){
  _origNav(pg);
  var el = document.getElementById('nav-checkpag');
  if(el) el.classList[pg === 'checkpag' ? 'add' : 'remove']('active');
  var pgEl = document.getElementById('pg-checkpag');
  if(pgEl){
    if(pg === 'checkpag'){ pgEl.classList.add('active'); renderCheckPag(); }
    else pgEl.classList.remove('active');
  }
};

console.log('[Financeiro Pro] Check de Pagamentos v3 (duas colunas) carregado.');
})();

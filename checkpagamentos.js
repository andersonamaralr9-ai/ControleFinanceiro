// checkpagamentos.js v5 — Mobile: zero zoom, overflow protegido
(function(){
'use strict';

// ================================================================
// PERSISTÊNCIA
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

var checkMes = mesAtual();

// ================================================================
// CSS
// ================================================================
// CSS movido para app.css (bloco 1 deste arquivo)

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
newLink.innerHTML = '<span class="nav-ic">&#10003;</span><span>Check Pagamentos</span>';
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
  '<h2 class="page-title">Check de Pagamentos</h2>' +
  '<div class="month-nav">' +
    '<button class="btn btn-outline" onclick="chgCheckM(-1)">&#9664;</button>' +
    '<span class="mes-label" id="checkMesLabel"></span>' +
    '<button class="btn btn-outline" onclick="chgCheckM(1)">&#9654;</button>' +
  '</div>' +
  '<div id="ckSummary"></div>' +
  '<div id="ckProgress"></div>' +
  '<div id="ckSaldo"></div>' +
  '<div class="ck-actions">' +
    '<button class="btn btn-sm btn-success" onclick="checkMarcarTodos()">&#9989; Marcar Todos</button>' +
    '<button class="btn btn-sm btn-outline" onclick="checkDesmarcarTodos()">Desmarcar Todos</button>' +
  '</div>' +
  '<div class="ck-filters">' +
    '<select id="ckFiltroOrigem" class="form-control" onchange="renderCheckPag()">' +
      '<option value="">Todas as origens</option>' +
      '<option value="Lan\u00e7amento">Lan\u00e7amentos</option>' +
      '<option value="Contrato">Contratos</option>' +
      '<option value="Assinatura">Assinaturas</option>' +
      '<option value="Cart\u00e3o">Cart\u00e3o</option>' +
    '</select>' +
    '<select id="ckFiltroStatus" class="form-control" onchange="renderCheckPag()">' +
      '<option value="">Todos</option>' +
      '<option value="pendente">Pendentes</option>' +
      '<option value="pago">J\u00e1 pagos</option>' +
    '</select>' +
    '<span class="filter-count" id="ckFilterCount"></span>' +
  '</div>' +
  '<div id="ckArea" class="ck-columns"></div>';
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
  if(g === 'Cart\u00e3o') return 'Cart\u00e3o';
  return 'Lan\u00e7amentos';
}

// Valor compacto para mobile
function fmtVm(v){
  if(window.innerWidth > 768) return fmtV(v);
  var n = Number(v) || 0;
  if(n >= 10000) return 'R$ ' + (n/1000).toFixed(1).replace('.',',') + 'k';
  return fmtV(n);
}

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

    html += '<div class="ck-section">';
    html += '<div class="ck-sec-title">' +
      '<span>' + getGrupoIcon(gNome) + ' ' + getGrupoLabel(gNome) + ' (' + grupoPagos + '/' + gItems.length + ')</span>' +
      '<span class="ck-sec-total">' + fmtVm(grupoTotal) + '</span></div>';
    html += '<div class="ck-list">';

    gItems.forEach(function(e){
      var key = buildItemKey(e);
      var isPago = !!checks[key];
      var keyEsc = key.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');

      // Origem curta: truncar no badge CSS via max-width
      var origTxt = e.origem || 'Manual';

      html += '<div class="ck-item ' + (isPago ? 'checked' : '') + '" onclick="toggleCheck(\'' + keyEsc + '\')">' +
        '<div class="ck-box">' + (isPago ? '&#10003;' : '') + '</div>' +
        '<div class="ck-desc">' + (e.desc || '-') + '</div>' +
        '<div class="ck-val ' + (e.tipo === 'receita' ? 'rec' : 'desp') + '">' + fmtV(e.valor) + '</div>' +
        '<div class="ck-meta">' +
          '<span class="ck-origem ' + getOrigemClass(getOrigemSimples(e)) + '">' + origTxt + '</span>' +
          '<span>' + (e.cat || '') + '</span>' +
          (e.data ? '<span>' + fmtD(e.data) + '</span>' : '') +
        '</div>' +
      '</div>';
    });

    html += '</div></div>';
  });

  if(!items.length){
    html = '<div class="ck-empty">Nenhum item</div>';
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

  var receitas = [], despesas = [];
  entries.forEach(function(e){
    if(e.tipo === 'receita') receitas.push(e);
    else despesas.push(e);
  });

  receitas.sort(function(a,b){ return b.valor - a.valor; });
  despesas.sort(function(a,b){ return b.valor - a.valor; });

  var filtroOrigem = (document.getElementById('ckFiltroOrigem') || {}).value || '';
  var filtroStatus = (document.getElementById('ckFiltroStatus') || {}).value || '';

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

  var totalRec = 0, totalDesp = 0, pagosRec = 0, pagosDesp = 0, pagosCountRec = 0, pagosCountDesp = 0;
  receitas.forEach(function(e){ totalRec += e.valor; if(checks[buildItemKey(e)]){ pagosRec += e.valor; pagosCountRec++; } });
  despesas.forEach(function(e){ totalDesp += e.valor; if(checks[buildItemKey(e)]){ pagosDesp += e.valor; pagosCountDesp++; } });

  var totalCount = entries.length;
  var pagosCount = pagosCountRec + pagosCountDesp;
  var pct = totalCount ? Math.round(pagosCount / totalCount * 100) : 0;

  // Summary
  document.getElementById('ckSummary').innerHTML =
    '<div class="ck-sum-row">' +
      '<div class="ck-sum-card"><div class="cs-label">Total</div><div class="cs-value" style="color:var(--pri2)">' + totalCount + '</div></div>' +
      '<div class="ck-sum-card"><div class="cs-label">Validados</div><div class="cs-value" style="color:var(--ok)">' + pagosCount + '</div></div>' +
      '<div class="ck-sum-card"><div class="cs-label">Pendentes</div><div class="cs-value" style="color:' + ((totalCount - pagosCount) > 0 ? 'var(--dn2)' : 'var(--ok)') + '">' + (totalCount - pagosCount) + '</div></div>' +
    '</div>' +
    '<div class="ck-sum-div">' +
      '<div class="ck-sum-grp"><h4 class="rec-t">&#128200; Receitas (' + receitas.length + ')</h4>' +
        '<div class="csg-row"><span class="csg-label">Total</span><span class="csg-val" style="color:var(--ok)">' + fmtVm(totalRec) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Confirmadas</span><span class="csg-val" style="color:var(--ok)">' + fmtVm(pagosRec) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pendentes</span><span class="csg-val" style="color:' + ((totalRec - pagosRec) > 0 ? 'var(--wn)' : 'var(--ok)') + '">' + fmtVm(totalRec - pagosRec) + '</span></div>' +
      '</div>' +
      '<div class="ck-sum-grp"><h4 class="desp-t">&#128201; Despesas (' + despesas.length + ')</h4>' +
        '<div class="csg-row"><span class="csg-label">Total</span><span class="csg-val" style="color:var(--dn2)">' + fmtVm(totalDesp) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pagas</span><span class="csg-val" style="color:var(--dn2)">' + fmtVm(pagosDesp) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pendentes</span><span class="csg-val" style="color:' + ((totalDesp - pagosDesp) > 0 ? 'var(--wn)' : 'var(--ok)') + '">' + fmtVm(totalDesp - pagosDesp) + '</span></div>' +
      '</div>' +
    '</div>';

  document.getElementById('ckProgress').innerHTML =
    '<div class="ck-progress">' +
      '<div class="ck-progress-fill" style="width:' + pct + '%;' + (pct === 100 ? 'background:var(--ok)' : '') + '"></div>' +
      '<div class="ck-progress-text">' + pct + '% (' + pagosCount + '/' + totalCount + ')</div>' +
    '</div>';

  var saldo = totalRec - totalDesp;
  var saldoConf = pagosRec - pagosDesp;
  document.getElementById('ckSaldo').innerHTML =
    '<div class="ck-saldo">' +
      '<div class="csb-item"><div class="csb-label">Saldo Previsto</div><div class="csb-val" style="color:' + (saldo >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtVm(saldo) + '</div></div>' +
      '<div class="csb-item"><div class="csb-label">Saldo Confirmado</div><div class="csb-val" style="color:' + (saldoConf >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtVm(saldoConf) + '</div></div>' +
    '</div>';

  var recCount = filteredRec.length, despCount = filteredDesp.length;
  var recPagos = filteredRec.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;
  var despPagos = filteredDesp.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;
  var recTotal = filteredRec.reduce(function(s,e){ return s+e.valor; },0);
  var despTotal = filteredDesp.reduce(function(s,e){ return s+e.valor; },0);

  document.getElementById('ckArea').innerHTML =
    '<div class="ck-col">' +
      '<div class="ck-col-hdr rec"><span>&#128200; Rec (' + recPagos + '/' + recCount + ')</span><span>' + fmtVm(recTotal) + '</span></div>' +
      renderColItems(filteredRec, checks) +
    '</div>' +
    '<div class="ck-col">' +
      '<div class="ck-col-hdr desp"><span>&#128201; Desp (' + despPagos + '/' + despCount + ')</span><span>' + fmtVm(despTotal) + '</span></div>' +
      renderColItems(filteredDesp, checks) +
    '</div>';

  var fc = document.getElementById('ckFilterCount');
  if(fc) fc.textContent = (recCount + despCount) + ' de ' + totalCount;
};

// ================================================================
// HOOK NAVEGAÇÃO
// ================================================================
// Declara a pagina no registro do index.html, em vez de embrulhar nav().
if(typeof registerPage === 'function') registerPage('checkpag', function(){ renderCheckPag(); });

console.log('[Financeiro Pro] Check de Pagamentos v5 — Mobile zero zoom.');
})();

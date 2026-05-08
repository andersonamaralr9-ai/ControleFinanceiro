// checkpagamentos.js v4 — Mobile-first: layout compacto sem zoom
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

// ================================================================
// ESTADO
// ================================================================
var checkMes = mesAtual();

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* === CHECK PAGAMENTOS v4 === */

/* Resumo: 3 cards inline */
.ck-sum-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;}
.ck-sum-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 16px;text-align:center;box-shadow:var(--sh);}
.ck-sum-card .cs-label{font-size:.68em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:4px;}
.ck-sum-card .cs-value{font-size:1.15em;font-weight:700;}

/* Resumo receitas/despesas */
.ck-sum-div{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.ck-sum-grp{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px;box-shadow:var(--sh);}
.ck-sum-grp h4{font-size:.78em;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid var(--bg4);}
.ck-sum-grp h4.rec-t{color:var(--ok);}
.ck-sum-grp h4.desp-t{color:var(--dn2);}
.csg-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:.84em;}
.csg-row .csg-label{color:var(--tx2);}
.csg-row .csg-val{font-weight:700;}

/* Progress */
.ck-progress{background:var(--bg3);border-radius:8px;height:14px;overflow:hidden;margin-bottom:20px;position:relative;}
.ck-progress-fill{height:100%;border-radius:8px;background:var(--okG);transition:width .4s ease;}
.ck-progress-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.68em;font-weight:700;color:var(--tx);text-shadow:0 1px 2px rgba(0,0,0,.4);}

/* Saldo */
.ck-saldo{display:flex;justify-content:center;align-items:center;gap:24px;margin-bottom:20px;padding:14px;background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);box-shadow:var(--sh);}
.ck-saldo .csb-item{text-align:center;}
.ck-saldo .csb-label{font-size:.68em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:2px;}
.ck-saldo .csb-val{font-size:1.1em;font-weight:700;}

/* Ações e Filtros */
.ck-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
.ck-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.ck-filters .form-control{max-width:180px;}
.ck-filters .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}

/* Duas colunas */
.ck-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.ck-col-hdr{font-size:.9em;font-weight:700;padding:12px 16px;border-radius:var(--rad);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;}
.ck-col-hdr.rec{background:rgba(0,206,201,.08);border:1px solid rgba(0,206,201,.2);color:var(--ok);}
.ck-col-hdr.desp{background:rgba(214,48,49,.08);border:1px solid rgba(214,48,49,.2);color:var(--dn2);}

.ck-section{margin-bottom:16px;}
.ck-sec-title{font-size:.82em;font-weight:700;padding:8px 14px;background:var(--bg3);border-radius:var(--rad) var(--rad) 0 0;color:var(--tx2);border:1px solid var(--bg4);border-bottom:none;display:flex;justify-content:space-between;align-items:center;}
.ck-sec-total{font-weight:700;color:var(--pri2);font-size:.85em;}

.ck-list{background:var(--bg2);border:1px solid var(--bg4);border-radius:0 0 var(--rad) var(--rad);overflow:hidden;box-shadow:var(--sh);}

/* ═══ ITEM — layout que NÃO estoura no mobile ═══ */
.ck-item{
  display:grid;
  grid-template-columns:24px 1fr auto;
  grid-template-rows:auto auto;
  gap:0 8px;
  padding:10px 14px;
  border-bottom:1px solid var(--bg3);
  cursor:pointer;
  -webkit-user-select:none;user-select:none;
  transition:background .15s,opacity .15s;
  align-items:center;
}
.ck-item:last-child{border-bottom:none;}
.ck-item:hover{background:var(--bg3);}
.ck-item.checked{opacity:.55;}
.ck-item.checked .ck-desc{text-decoration:line-through;color:var(--tx3);}
.ck-item.checked .ck-val{text-decoration:line-through;}

/* Checkbox — col 1, row 1-2 */
.ck-box{
  grid-column:1;grid-row:1/3;
  width:20px;height:20px;border-radius:6px;border:2px solid var(--bg4);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:all .2s;font-size:.72em;color:transparent;
  align-self:center;
}
.ck-item.checked .ck-box{background:var(--ok);border-color:var(--ok);color:#fff;}

/* Linha 1: descrição + valor */
.ck-desc{
  grid-column:2;grid-row:1;
  font-size:.84em;font-weight:600;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  min-width:0;
}
.ck-val{
  grid-column:3;grid-row:1;
  font-weight:700;font-size:.85em;text-align:right;white-space:nowrap;
}
.ck-val.rec{color:var(--ok);}
.ck-val.desp{color:var(--dn2);}

/* Linha 2: meta (categoria, data, origem) */
.ck-meta{
  grid-column:2/4;grid-row:2;
  display:flex;align-items:center;gap:6px;
  font-size:.66em;color:var(--tx3);margin-top:1px;
  flex-wrap:wrap;
  min-width:0;
}
.ck-origem{
  padding:1px 6px;border-radius:8px;white-space:nowrap;flex-shrink:0;font-size:.92em;
}
.ck-origem.contrato{background:rgba(108,92,231,.15);color:var(--pri2);}
.ck-origem.assinatura{background:rgba(253,203,110,.15);color:var(--wn);}
.ck-origem.lancamento{background:rgba(9,132,227,.15);color:var(--inf2);}
.ck-origem.cartao{background:rgba(230,81,0,.12);color:#e65100;}

.ck-empty{padding:30px;text-align:center;color:var(--tx3);font-size:.85em;}

/* ═══ MOBILE ═══ */
@media(max-width:768px){
  /* Colunas viram uma só */
  .ck-columns{grid-template-columns:1fr !important;}

  /* Summary: 3 cards mini */
  .ck-sum-row{grid-template-columns:repeat(3,1fr);gap:6px;}
  .ck-sum-card{padding:8px 6px;}
  .ck-sum-card .cs-label{font-size:.55em;letter-spacing:.5px;}
  .ck-sum-card .cs-value{font-size:.9em;}

  /* Resumo rec/desp empilhado */
  .ck-sum-div{grid-template-columns:1fr;gap:8px;margin-bottom:12px;}
  .ck-sum-grp{padding:10px 12px;}
  .ck-sum-grp h4{font-size:.68em;margin-bottom:6px;padding-bottom:6px;}
  .csg-row{font-size:.75em;padding:3px 0;}

  /* Progress menor */
  .ck-progress{height:12px;margin-bottom:12px;}
  .ck-progress-text{font-size:.6em;}

  /* Saldo compacto */
  .ck-saldo{flex-direction:row;gap:16px;padding:10px;margin-bottom:12px;}
  .ck-saldo .csb-label{font-size:.58em;}
  .ck-saldo .csb-val{font-size:.85em;}

  /* Ações */
  .ck-actions .btn{font-size:.7em;padding:6px 10px;}

  /* Filtros */
  .ck-filters{flex-direction:column;align-items:stretch;gap:6px;}
  .ck-filters .form-control{max-width:100%;font-size:.82em;padding:8px 10px;}
  .ck-filters .filter-count{margin-left:0;text-align:center;font-size:.7em;}

  /* Col header */
  .ck-col-hdr{font-size:.75em;padding:8px 10px;margin-bottom:8px;flex-wrap:wrap;gap:4px;}

  /* Seção */
  .ck-sec-title{font-size:.72em;padding:6px 10px;}
  .ck-sec-total{font-size:.72em;}

  /* Item — mais compacto */
  .ck-item{
    grid-template-columns:20px 1fr auto;
    gap:0 6px;
    padding:8px 10px;
  }
  .ck-box{width:18px;height:18px;border-radius:5px;font-size:.65em;}
  .ck-desc{font-size:.75em;}
  .ck-val{font-size:.75em;}
  .ck-meta{font-size:.58em;gap:4px;}
  .ck-origem{font-size:.88em;padding:1px 5px;}
}

@media(max-width:380px){
  .ck-sum-row{grid-template-columns:1fr 1fr 1fr;gap:4px;}
  .ck-sum-card .cs-value{font-size:.8em;}
  .ck-sum-card .cs-label{font-size:.5em;}
  .ck-saldo{flex-direction:column;gap:8px;}
  .ck-item{padding:7px 8px;gap:0 5px;}
  .ck-desc{font-size:.7em;}
  .ck-val{font-size:.7em;}
  .ck-meta{font-size:.54em;}
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
  '<h2 class="page-title">&#9989; Check de Pagamentos</h2>' +
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

// Abreviar origem para mobile
function getOrigemCurta(entry){
  var o = entry.origem || 'Manual';
  if(o.length > 14 && window.innerWidth <= 768){
    // "Assinatura - Netflix" → "Assin."
    if(o.startsWith('Assinatura')) return 'Assin.';
    if(o.startsWith('Cart\u00e3o')) return 'Cart\u00e3o';
    return o.substring(0, 10) + '\u2026';
  }
  return o;
}

// Renderizar itens agrupados
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
      '<span class="ck-sec-total">' + fmtV(grupoTotal) + '</span></div>';
    html += '<div class="ck-list">';

    gItems.forEach(function(e){
      var key = buildItemKey(e);
      var isPago = !!checks[key];
      var keyEsc = key.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');

      html += '<div class="ck-item ' + (isPago ? 'checked' : '') + '" onclick="toggleCheck(\'' + keyEsc + '\')">' +
        '<div class="ck-box">' + (isPago ? '&#10003;' : '') + '</div>' +
        '<div class="ck-desc">' + (e.desc || '-') + '</div>' +
        '<div class="ck-val ' + (e.tipo === 'receita' ? 'rec' : 'desp') + '">' + fmtV(e.valor) + '</div>' +
        '<div class="ck-meta">' +
          '<span class="ck-origem ' + getOrigemClass(getOrigemSimples(e)) + '">' + getOrigemCurta(e) + '</span>' +
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

  // Estatísticas globais
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

  // Summary
  document.getElementById('ckSummary').innerHTML =
    '<div class="ck-sum-row">' +
      '<div class="ck-sum-card"><div class="cs-label">Total</div><div class="cs-value" style="color:var(--pri2)">' + totalCount + '</div></div>' +
      '<div class="ck-sum-card"><div class="cs-label">Validados</div><div class="cs-value" style="color:var(--ok)">' + pagosCount + '</div></div>' +
      '<div class="ck-sum-card"><div class="cs-label">Pendentes</div><div class="cs-value" style="color:' + ((totalCount - pagosCount) > 0 ? 'var(--dn2)' : 'var(--ok)') + '">' + (totalCount - pagosCount) + '</div></div>' +
    '</div>' +
    '<div class="ck-sum-div">' +
      '<div class="ck-sum-grp"><h4 class="rec-t">&#128200; Receitas (' + receitas.length + ')</h4>' +
        '<div class="csg-row"><span class="csg-label">Total</span><span class="csg-val" style="color:var(--ok)">' + fmtV(totalRec) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Confirmadas</span><span class="csg-val" style="color:var(--ok)">' + fmtV(pagosRec) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pendentes</span><span class="csg-val" style="color:' + ((totalRec - pagosRec) > 0 ? 'var(--wn)' : 'var(--ok)') + '">' + fmtV(totalRec - pagosRec) + '</span></div>' +
      '</div>' +
      '<div class="ck-sum-grp"><h4 class="desp-t">&#128201; Despesas (' + despesas.length + ')</h4>' +
        '<div class="csg-row"><span class="csg-label">Total</span><span class="csg-val" style="color:var(--dn2)">' + fmtV(totalDesp) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pagas</span><span class="csg-val" style="color:var(--dn2)">' + fmtV(pagosDesp) + '</span></div>' +
        '<div class="csg-row"><span class="csg-label">Pendentes</span><span class="csg-val" style="color:' + ((totalDesp - pagosDesp) > 0 ? 'var(--wn)' : 'var(--ok)') + '">' + fmtV(totalDesp - pagosDesp) + '</span></div>' +
      '</div>' +
    '</div>';

  // Progress
  document.getElementById('ckProgress').innerHTML =
    '<div class="ck-progress">' +
      '<div class="ck-progress-fill" style="width:' + pct + '%;' + (pct === 100 ? 'background:var(--ok)' : '') + '"></div>' +
      '<div class="ck-progress-text">' + pct + '% (' + pagosCount + '/' + totalCount + ')</div>' +
    '</div>';

  // Saldo
  var saldo = totalRec - totalDesp;
  var saldoConf = pagosRec - pagosDesp;
  document.getElementById('ckSaldo').innerHTML =
    '<div class="ck-saldo">' +
      '<div class="csb-item"><div class="csb-label">Saldo Previsto</div><div class="csb-val" style="color:' + (saldo >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldo) + '</div></div>' +
      '<div class="csb-item"><div class="csb-label">Saldo Confirmado</div><div class="csb-val" style="color:' + (saldoConf >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldoConf) + '</div></div>' +
    '</div>';

  // Colunas
  var recCount = filteredRec.length;
  var despCount = filteredDesp.length;
  var recPagos = filteredRec.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;
  var despPagos = filteredDesp.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;
  var recTotal = filteredRec.reduce(function(s,e){ return s+e.valor; },0);
  var despTotal = filteredDesp.reduce(function(s,e){ return s+e.valor; },0);

  document.getElementById('ckArea').innerHTML =
    '<div class="ck-col">' +
      '<div class="ck-col-hdr rec"><span>&#128200; Receitas (' + recPagos + '/' + recCount + ')</span><span>' + fmtV(recTotal) + '</span></div>' +
      renderColItems(filteredRec, checks) +
    '</div>' +
    '<div class="ck-col">' +
      '<div class="ck-col-hdr desp"><span>&#128201; Despesas (' + despPagos + '/' + despCount + ')</span><span>' + fmtV(despTotal) + '</span></div>' +
      renderColItems(filteredDesp, checks) +
    '</div>';

  var fc = document.getElementById('ckFilterCount');
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

console.log('[Financeiro Pro] Check de Pagamentos v4 — Mobile sem zoom.');
})();

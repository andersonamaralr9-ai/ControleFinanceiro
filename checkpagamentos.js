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
var sty = document.createElement('style');
sty.textContent = `
/* === CHECK PAGAMENTOS v5 — MOBILE ZERO ZOOM === */

/* ══ PROTEÇÃO GLOBAL DE OVERFLOW ══ */
#pg-checkpag {
  overflow-x: hidden !important;
  max-width: 100% !important;
  word-break: break-word;
}
#pg-checkpag * {
  max-width: 100%;
  box-sizing: border-box;
}

/* Summary: 3 cards */
.ck-sum-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px;}
.ck-sum-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 16px;text-align:center;box-shadow:var(--sh);overflow:hidden;}
.ck-sum-card .cs-label{font-size:.68em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:4px;}
.ck-sum-card .cs-value{font-size:1.15em;font-weight:700;}

/* Resumo rec/desp */
.ck-sum-div{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
.ck-sum-grp{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px;box-shadow:var(--sh);overflow:hidden;}
.ck-sum-grp h4{font-size:.78em;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid var(--bg4);}
.ck-sum-grp h4.rec-t{color:var(--ok);}
.ck-sum-grp h4.desp-t{color:var(--dn2);}
.csg-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:.84em;gap:4px;}
.csg-row .csg-label{color:var(--tx2);flex-shrink:0;}
.csg-row .csg-val{font-weight:700;text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* Progress */
.ck-progress{background:var(--bg3);border-radius:8px;height:14px;overflow:hidden;margin-bottom:20px;position:relative;}
.ck-progress-fill{height:100%;border-radius:8px;background:var(--okG);transition:width .4s ease;}
.ck-progress-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.68em;font-weight:700;color:var(--tx);text-shadow:0 1px 2px rgba(0,0,0,.4);}

/* Saldo */
.ck-saldo{display:flex;justify-content:center;align-items:center;gap:24px;margin-bottom:20px;padding:14px;background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);box-shadow:var(--sh);overflow:hidden;}
.ck-saldo .csb-item{text-align:center;min-width:0;}
.ck-saldo .csb-label{font-size:.68em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:2px;}
.ck-saldo .csb-val{font-size:1.1em;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* Ações e Filtros */
.ck-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
.ck-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.ck-filters .form-control{max-width:180px;}
.ck-filters .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}

/* Duas colunas */
.ck-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.ck-col-hdr{font-size:.9em;font-weight:700;padding:12px 16px;border-radius:var(--rad);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;overflow:hidden;gap:6px;}
.ck-col-hdr span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ck-col-hdr.rec{background:rgba(0,206,201,.08);border:1px solid rgba(0,206,201,.2);color:var(--ok);}
.ck-col-hdr.desp{background:rgba(214,48,49,.08);border:1px solid rgba(214,48,49,.2);color:var(--dn2);}

.ck-section{margin-bottom:16px;overflow:hidden;}
.ck-sec-title{font-size:.82em;font-weight:700;padding:8px 14px;background:var(--bg3);border-radius:var(--rad) var(--rad) 0 0;color:var(--tx2);border:1px solid var(--bg4);border-bottom:none;display:flex;justify-content:space-between;align-items:center;gap:6px;overflow:hidden;}
.ck-sec-title span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ck-sec-total{font-weight:700;color:var(--pri2);font-size:.85em;flex-shrink:0;}

.ck-list{background:var(--bg2);border:1px solid var(--bg4);border-radius:0 0 var(--rad) var(--rad);overflow:hidden;box-shadow:var(--sh);}

/* ═══ ITEM — grid 2 linhas, nunca estoura ═══ */
.ck-item{
  display:grid;
  grid-template-columns:24px minmax(0,1fr) auto;
  grid-template-rows:auto auto;
  gap:0 8px;
  padding:10px 14px;
  border-bottom:1px solid var(--bg3);
  cursor:pointer;
  -webkit-user-select:none;user-select:none;
  transition:background .15s,opacity .15s;
  align-items:center;
  overflow:hidden;
}
.ck-item:last-child{border-bottom:none;}
.ck-item:hover{background:var(--bg3);}
.ck-item.checked{opacity:.55;}
.ck-item.checked .ck-desc{text-decoration:line-through;color:var(--tx3);}
.ck-item.checked .ck-val{text-decoration:line-through;}

.ck-box{
  grid-column:1;grid-row:1/3;
  width:20px;height:20px;border-radius:6px;border:2px solid var(--bg4);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:all .2s;font-size:.72em;color:transparent;
  align-self:center;
}
.ck-item.checked .ck-box{background:var(--ok);border-color:var(--ok);color:#fff;}

.ck-desc{
  grid-column:2;grid-row:1;
  font-size:.84em;font-weight:600;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  min-width:0;
}
.ck-val{
  grid-column:3;grid-row:1;
  font-weight:700;font-size:.85em;text-align:right;white-space:nowrap;
  flex-shrink:0;
}
.ck-val.rec{color:var(--ok);}
.ck-val.desp{color:var(--dn2);}

.ck-meta{
  grid-column:2/4;grid-row:2;
  display:flex;align-items:center;gap:6px;
  font-size:.66em;color:var(--tx3);margin-top:1px;
  flex-wrap:wrap;
  min-width:0;
  overflow:hidden;
}
.ck-origem{
  padding:1px 6px;border-radius:8px;flex-shrink:0;font-size:.92em;
  max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.ck-origem.contrato{background:rgba(108,92,231,.15);color:var(--pri2);}
.ck-origem.assinatura{background:rgba(253,203,110,.15);color:var(--wn);}
.ck-origem.lancamento{background:rgba(9,132,227,.15);color:var(--inf2);}
.ck-origem.cartao{background:rgba(230,81,0,.12);color:#e65100;}

.ck-empty{padding:30px;text-align:center;color:var(--tx3);font-size:.85em;}

/* ═══════════════ MOBILE ═══════════════ */
@media(max-width:768px){

  /* Página: overflow bloqueado */
  #pg-checkpag {
    overflow-x: hidden !important;
    width: 100% !important;
    max-width: 100vw !important;
  }

  /* Colunas → uma só */
  .ck-columns{grid-template-columns:1fr !important;gap:10px !important;}

  /* Summary compacto */
  .ck-sum-row{grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;}
  .ck-sum-card{padding:8px 4px;}
  .ck-sum-card .cs-label{font-size:.5em;letter-spacing:.3px;}
  .ck-sum-card .cs-value{font-size:.85em;}

  .ck-sum-div{grid-template-columns:1fr;gap:6px;margin-bottom:10px;}
  .ck-sum-grp{padding:8px 10px;}
  .ck-sum-grp h4{font-size:.62em;margin-bottom:5px;padding-bottom:5px;letter-spacing:1px;}
  .csg-row{font-size:.7em;padding:2px 0;}

  .ck-progress{height:10px;margin-bottom:10px;}
  .ck-progress-text{font-size:.55em;}

  .ck-saldo{gap:12px;padding:8px 10px;margin-bottom:10px;}
  .ck-saldo .csb-label{font-size:.52em;letter-spacing:.5px;}
  .ck-saldo .csb-val{font-size:.78em;}

  .ck-actions{gap:6px;margin-bottom:10px;}
  .ck-actions .btn{font-size:.65em;padding:5px 8px;}

  .ck-filters{flex-direction:column;align-items:stretch;gap:5px;margin-bottom:10px;}
  .ck-filters .form-control{max-width:100%;font-size:.78em;padding:7px 8px;}
  .ck-filters .filter-count{margin-left:0;text-align:center;font-size:.65em;}

  .ck-col-hdr{font-size:.7em;padding:7px 10px;margin-bottom:6px;gap:4px;}

  .ck-sec-title{font-size:.68em;padding:5px 8px;gap:4px;}
  .ck-sec-total{font-size:.68em;}

  /* Item ultra-compacto */
  .ck-item{
    grid-template-columns:18px minmax(0,1fr) auto;
    gap:0 5px;
    padding:7px 8px;
  }
  .ck-box{width:16px;height:16px;border-radius:4px;font-size:.6em;border-width:1.5px;}
  .ck-desc{font-size:.72em;}
  .ck-val{font-size:.72em;}
  .ck-meta{font-size:.54em;gap:3px;margin-top:0;}
  .ck-origem{font-size:.85em;padding:1px 4px;max-width:90px;}

  /* Page title menor */
  #pg-checkpag .page-title{font-size:1em;margin-bottom:10px;padding-bottom:8px;}

  /* Month nav compacto */
  #pg-checkpag .month-nav{margin-bottom:10px;gap:8px;}
  #pg-checkpag .month-nav .mes-label{font-size:.85em;min-width:100px;}
}

@media(max-width:380px){
  .ck-sum-card{padding:6px 3px;}
  .ck-sum-card .cs-value{font-size:.75em;}
  .ck-sum-card .cs-label{font-size:.45em;}
  .ck-saldo{flex-direction:column;gap:6px;}
  .ck-item{padding:6px 6px;gap:0 4px;}
  .ck-box{width:15px;height:15px;}
  .ck-desc{font-size:.66em;}
  .ck-val{font-size:.66em;}
  .ck-meta{font-size:.5em;}
  .ck-origem{max-width:75px;}
  .csg-row{font-size:.65em;}
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

console.log('[Financeiro Pro] Check de Pagamentos v5 — Mobile zero zoom.');
})();

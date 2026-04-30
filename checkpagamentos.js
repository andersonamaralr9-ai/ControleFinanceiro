// checkpagamentos.js v2 — Check de Pagamentos do Mês (com cloud sync)
// Armazena os checks DENTRO de S (state principal) para sincronizar via Gist
(function(){
'use strict';

// ================================================================
// PERSISTÊNCIA — agora dentro de S (sincroniza com Gist)
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
  salvar(); // <-- grava no localStorage + scheduleSync() → Gist
}

// ================================================================
// GARANTIR QUE mergeState PRESERVE checkPagamentos
// ================================================================
var _origMerge = window.mergeState;
if(_origMerge){
  window.mergeState = function(d){
    var st = _origMerge(d);
    // Preservar checkPagamentos vindo do cloud
    if(d.checkPagamentos && typeof d.checkPagamentos === 'object' && !Array.isArray(d.checkPagamentos)){
      if(!st.checkPagamentos) st.checkPagamentos = {};
      // Merge: para cada mês, combinar checks (cloud ganha se ambos existem)
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

// Garantir que S já tenha o campo
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
.check-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;}
.check-summary-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px;text-align:center;box-shadow:var(--sh);}
.check-summary-card .cs-label{font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:4px;}
.check-summary-card .cs-value{font-size:1.2em;font-weight:700;}

.check-progress{background:var(--bg3);border-radius:8px;height:14px;overflow:hidden;margin-bottom:20px;position:relative;}
.check-progress-fill{height:100%;border-radius:8px;background:var(--okG);transition:width .4s ease;}
.check-progress-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.68em;font-weight:700;color:var(--tx);text-shadow:0 1px 2px rgba(0,0,0,.4);}

.check-filter-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.check-filter-bar .form-control{max-width:180px;}
.check-filter-bar .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}

.check-section{margin-bottom:20px;}
.check-section-title{font-size:.88em;font-weight:700;padding:10px 16px;background:var(--bg3);border-radius:var(--rad) var(--rad) 0 0;color:var(--tx2);border:1px solid var(--bg4);border-bottom:none;display:flex;justify-content:space-between;align-items:center;}
.check-section-total{font-weight:700;color:var(--pri2);}

.check-list{background:var(--bg2);border:1px solid var(--bg4);border-radius:0 0 var(--rad) var(--rad);overflow:hidden;box-shadow:var(--sh);}

.check-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--bg3);transition:background .15s,opacity .15s;cursor:pointer;-webkit-user-select:none;user-select:none;}
.check-item:last-child{border-bottom:none;}
.check-item:hover{background:var(--bg3);}
.check-item.checked{opacity:.6;}
.check-item.checked .check-desc{text-decoration:line-through;color:var(--tx3);}
.check-item.checked .check-valor{text-decoration:line-through;}

.check-box{width:22px;height:22px;border-radius:6px;border:2px solid var(--bg4);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:.75em;color:transparent;}
.check-item.checked .check-box{background:var(--ok);border-color:var(--ok);color:#fff;}

.check-info{flex:1;min-width:0;}
.check-desc{font-size:.88em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.check-detail{font-size:.72em;color:var(--tx3);margin-top:2px;}

.check-valor{font-weight:700;font-size:.9em;text-align:right;white-space:nowrap;min-width:90px;}
.check-valor.rec{color:var(--ok);}
.check-valor.desp{color:var(--dn2);}

.check-origem{font-size:.68em;padding:2px 8px;border-radius:10px;white-space:nowrap;flex-shrink:0;}
.check-origem.contrato{background:rgba(108,92,231,.15);color:var(--pri2);}
.check-origem.assinatura{background:rgba(253,203,110,.15);color:var(--wn);}
.check-origem.lancamento{background:rgba(9,132,227,.15);color:var(--inf2);}
.check-origem.cartao{background:rgba(230,81,0,.12);color:#e65100;}

.check-actions-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}

.check-empty{padding:40px;text-align:center;color:var(--tx3);font-size:.9em;}

@media(max-width:768px){
  .check-item{padding:10px 12px;gap:10px;}
  .check-desc{font-size:.82em;}
  .check-valor{font-size:.82em;min-width:70px;}
  .check-origem{font-size:.62em;padding:2px 6px;}
  .check-filter-bar{flex-direction:column;align-items:stretch;}
  .check-filter-bar .form-control{max-width:100%;}
  .check-filter-bar .filter-count{margin-left:0;text-align:center;}
  .check-summary{grid-template-columns:1fr 1fr;}
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
  '<div id="checkSummary" class="check-summary"></div>' +
  '<div id="checkProgress"></div>' +
  '<div class="check-actions-bar">' +
    '<button class="btn btn-sm btn-success" onclick="checkMarcarTodos()">&#9989; Marcar Todos</button>' +
    '<button class="btn btn-sm btn-outline" onclick="checkDesmarcarTodos()">Desmarcar Todos</button>' +
  '</div>' +
  '<div class="check-filter-bar">' +
    '<select id="checkFiltroTipo" class="form-control" onchange="renderCheckPag()">' +
      '<option value="">Todos os tipos</option>' +
      '<option value="receita">Receitas</option>' +
      '<option value="despesa">Despesas</option>' +
    '</select>' +
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
  '<div id="checkArea"></div>';
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
  if(checks[itemKey]){
    delete checks[itemKey]; // remove a chave ao desmarcar (mantém o JSON limpo)
  } else {
    checks[itemKey] = true;
  }
  saveChecks(checkMes, checks);
  renderCheckPag();
};

window.checkMarcarTodos = function(){
  var entries = allEntries(checkMes);
  var checks = loadChecks(checkMes);
  entries.forEach(function(e){
    checks[buildItemKey(e)] = true;
  });
  saveChecks(checkMes, checks);
  renderCheckPag();
};

window.checkDesmarcarTodos = function(){
  if(!confirm('Desmarcar todos os pagamentos do m\u00eas?')) return;
  saveChecks(checkMes, {});
  renderCheckPag();
};

// ================================================================
// CHAVE ÚNICA POR ITEM
// ================================================================
function buildItemKey(entry){
  return (entry.origem||'') + '|' + (entry.desc||'') + '|' + (entry.valor||0).toFixed(2);
}

// ================================================================
// ORIGEM SIMPLIFICADA
// ================================================================
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

// ================================================================
// RENDER
// ================================================================
window.renderCheckPag = function(){
  document.getElementById('checkMesLabel').textContent = mesNomeFull(checkMes);

  var entries = allEntries(checkMes);
  var checks = loadChecks(checkMes);

  entries.sort(function(a, b){
    if(a.tipo !== b.tipo) return a.tipo === 'despesa' ? -1 : 1;
    return b.valor - a.valor;
  });

  var filtroTipo = (document.getElementById('checkFiltroTipo') || {}).value || '';
  var filtroOrigem = (document.getElementById('checkFiltroOrigem') || {}).value || '';
  var filtroStatus = (document.getElementById('checkFiltroStatus') || {}).value || '';

  var filtered = entries.filter(function(e){
    if(filtroTipo && e.tipo !== filtroTipo) return false;
    if(filtroOrigem && getOrigemSimples(e) !== filtroOrigem) return false;
    if(filtroStatus){
      var isPago = !!checks[buildItemKey(e)];
      if(filtroStatus === 'pendente' && isPago) return false;
      if(filtroStatus === 'pago' && !isPago) return false;
    }
    return true;
  });

  var totalRec = 0, totalDesp = 0, pagosCount = 0, totalCount = entries.length;
  var pagosRec = 0, pagosDesp = 0;
  entries.forEach(function(e){
    var isPago = !!checks[buildItemKey(e)];
    if(e.tipo === 'receita'){ totalRec += e.valor; if(isPago) pagosRec += e.valor; }
    else { totalDesp += e.valor; if(isPago) pagosDesp += e.valor; }
    if(isPago) pagosCount++;
  });

  var pct = totalCount ? Math.round(pagosCount / totalCount * 100) : 0;

  document.getElementById('checkSummary').innerHTML =
    '<div class="check-summary-card"><div class="cs-label">Total Itens</div><div class="cs-value" style="color:var(--pri2)">' + totalCount + '</div></div>' +
    '<div class="check-summary-card"><div class="cs-label">Validados</div><div class="cs-value" style="color:var(--ok)">' + pagosCount + '</div></div>' +
    '<div class="check-summary-card"><div class="cs-label">Pendentes</div><div class="cs-value" style="color:' + ((totalCount - pagosCount) > 0 ? 'var(--dn2)' : 'var(--ok)') + '">' + (totalCount - pagosCount) + '</div></div>' +
    '<div class="check-summary-card"><div class="cs-label">Despesas Pagas</div><div class="cs-value" style="color:var(--dn2)">' + fmtV(pagosDesp) + '</div></div>' +
    '<div class="check-summary-card"><div class="cs-label">Despesas Pendentes</div><div class="cs-value" style="color:var(--wn)">' + fmtV(totalDesp - pagosDesp) + '</div></div>' +
    '<div class="check-summary-card"><div class="cs-label">Receitas Confirmadas</div><div class="cs-value" style="color:var(--ok)">' + fmtV(pagosRec) + '</div></div>';

  document.getElementById('checkProgress').innerHTML =
    '<div class="check-progress">' +
      '<div class="check-progress-fill" style="width:' + pct + '%;' + (pct === 100 ? 'background:var(--ok)' : '') + '"></div>' +
      '<div class="check-progress-text">' + pct + '% conclu\u00eddo (' + pagosCount + '/' + totalCount + ')</div>' +
    '</div>';

  var grupos = {};
  var ordemGrupos = ['Contrato', 'Assinatura', 'Cart\u00e3o', 'Lan\u00e7amento'];
  filtered.forEach(function(e){
    var orig = getOrigemSimples(e);
    if(!grupos[orig]) grupos[orig] = [];
    grupos[orig].push(e);
  });

  var html = '';
  var visivelCount = 0;

  if(!filtered.length){
    html = '<div class="check-empty">' +
      (totalCount === 0 ? 'Nenhum lan\u00e7amento neste m\u00eas.' : 'Nenhum item corresponde ao filtro.') +
      '</div>';
  } else {
    ordemGrupos.forEach(function(gNome){
      var items = grupos[gNome];
      if(!items || !items.length) return;

      var grupoTotal = items.reduce(function(s, e){ return s + e.valor; }, 0);
      var grupoPagos = items.filter(function(e){ return !!checks[buildItemKey(e)]; }).length;

      html += '<div class="check-section">';
      html += '<div class="check-section-title">' +
        '<span>' + getGrupoIcon(gNome) + ' ' + getGrupoLabel(gNome) + ' (' + grupoPagos + '/' + items.length + ')</span>' +
        '<span class="check-section-total">' + fmtV(grupoTotal) + '</span></div>';
      html += '<div class="check-list">';

      items.forEach(function(e){
        var key = buildItemKey(e);
        var isPago = !!checks[key];
        var keyEsc = key.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
        visivelCount++;

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
            (e.tipo === 'receita' ? '+' : '-') + fmtV(e.valor) +
          '</div></div>';
      });

      html += '</div></div>';
    });
  }

  document.getElementById('checkArea').innerHTML = html;
  var fc = document.getElementById('checkFilterCount');
  if(fc) fc.textContent = visivelCount + ' de ' + totalCount + ' item(ns)';
};

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
  return 'Lan\u00e7amentos Manuais';
}

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

console.log('[Financeiro Pro] Check de Pagamentos v2 (cloud sync) carregado.');
})();

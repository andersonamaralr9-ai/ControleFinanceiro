// contratos-enhanced.js v2 — Data Fim opcional + Resumo em caixas com totais
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
// CSS movido para app.css (bloco 1 deste arquivo)

// ================================================================
// Injetar campo "Data Fim" no formulario de contratos
// ================================================================
function injectFimField(){
  var formGrid = document.querySelector('#pg-contratos .form-grid');
  if(!formGrid || document.getElementById('contFim')) return;
  var obsGroup = null;
  var groups = formGrid.querySelectorAll('.form-group');
  for(var i = 0; i < groups.length; i++){
    var label = groups[i].querySelector('label');
    if(label && label.textContent.indexOf('Observa') >= 0){ obsGroup = groups[i]; break; }
  }
  var fimGroup = document.createElement('div');
  fimGroup.className = 'form-group';
  fimGroup.innerHTML = '<label>Data Fim (opcional)</label><input type="month" id="contFim" class="form-control">';
  if(obsGroup) formGrid.insertBefore(fimGroup, obsGroup);
  else { var btn = formGrid.querySelector('.form-group:last-child'); formGrid.insertBefore(fimGroup, btn); }
}

// ================================================================
// Injetar campo "Data Fim" no modal de edicao
// ================================================================
function injectFimFieldModal(){
  var modalBody = document.querySelector('#modalEditCont .modal-body');
  if(!modalBody || document.getElementById('ecFim')) return;
  var obsGroup = null;
  var groups = modalBody.querySelectorAll('.form-group');
  for(var i = 0; i < groups.length; i++){
    var label = groups[i].querySelector('label');
    if(label && label.textContent.indexOf('Obs') >= 0){ obsGroup = groups[i]; break; }
  }
  var fimGroup = document.createElement('div');
  fimGroup.className = 'form-group';
  fimGroup.style.marginBottom = '12px';
  fimGroup.innerHTML = '<label>Data Fim (opcional)</label><input type="month" id="ecFim" class="form-control">';
  if(obsGroup && obsGroup.nextSibling) modalBody.insertBefore(fimGroup, obsGroup.nextSibling);
  else { var hid = document.getElementById('ecId'); if(hid) modalBody.insertBefore(fimGroup, hid); }
}

// ================================================================
// Override addContrato
// ================================================================
window.addContrato = function(){
  var fimInput = document.getElementById('contFim');
  var dataFim = fimInput ? fimInput.value : '';
  var tipo = g('contTipo').value, desc = g('contDesc').value.trim(), cat = g('contCat').value;
  var valor = parseN(g('contValor').value), dia = parseInt(g('contDia').value) || 1;
  var inicio = g('contInicio').value, obs = g('contObs').value.trim();
  if(!desc || !valor || !inicio) return alert('Preencha tudo.');
  S.contratos.push({ id: uid(), tipo: tipo, desc: desc, categoria: cat, valor: valor, dia: dia, inicio: inicio, obs: obs, historico: [{de: inicio, valor: valor}], encerradoEm: null, dataFim: dataFim || null });
  salvar();
  g('contDesc').value = ''; g('contValor').value = ''; g('contObs').value = '';
  if(fimInput) fimInput.value = '';
  renderContratos();
};

// ================================================================
// Override editCont
// ================================================================
var _origEditCont = window.editCont;
window.editCont = function(id){
  _origEditCont(id);
  var c = S.contratos.find(function(x){ return x.id === id; });
  if(!c) return;
  var fimInput = document.getElementById('ecFim');
  if(fimInput) fimInput.value = c.dataFim || '';
};

// ================================================================
// Override updateContrato
// ================================================================
window.updateContrato = function(){
  var id = g('ecId').value, c = S.contratos.find(function(x){ return x.id === id; });
  if(!c) return;
  var nv = parseN(g('ecValor').value);
  if(nv !== c.valor){ c.historico.push({de: mesAtual(), valor: nv}); c.valor = nv; }
  c.tipo = g('ecTipo').value; c.desc = g('ecDesc').value.trim();
  c.categoria = g('ecCat').value; c.dia = parseInt(g('ecDia').value) || 1;
  c.obs = g('ecObs').value.trim();
  var fimInput = document.getElementById('ecFim');
  if(fimInput) c.dataFim = fimInput.value || null;
  salvar(); closeM('modalEditCont'); renderContratos(); renderResumo();
};

// ================================================================
// Navegacao de mes
// ================================================================
var ceResumoMes = mesAtual();
window._ceChgMes = function(n){ ceResumoMes = addMes(ceResumoMes, n); renderContratos(); };

// ================================================================
// Override renderContratos — RESUMO EM CAIXAS COM TOTAIS
// ================================================================
window.renderContratos = function(){
  if(typeof updContCats === 'function') updContCats();
  injectFimField();
  injectFimFieldModal();

  var contGrid = g('contGrid');
  var pgContratos = document.getElementById('pg-contratos');
  if(!pgContratos) return;

  var mes = ceResumoMes;
  var ativos = 0, inativos = 0, despMes = 0, recMes = 0;
  var novos = [], encerrados = [], ajustes = [], vencendo = [];
  var totalGeral = 0;

  S.contratos.forEach(function(c){
    var inicio = (c.inicio || '').substring(0, 7);
    var isAtivo = !c.encerradoEm || c.encerradoEm >= mes;
    var isIniciado = inicio && inicio <= mes;
    if(c.dataFim && c.dataFim < mes) isAtivo = false;
    if(c.encerradoEm && c.encerradoEm < mes) isAtivo = false;

    if(isAtivo && isIniciado){
      var val = Number(c.valor) || 0;
      var hist = (c.historico || []).slice();
      for(var i = 0; i < hist.length; i++){
        var hd = (hist[i].de || '').substring(0, 7);
        if(hd && mes >= hd) val = Number(hist[i].valor) || 0;
      }
      if(c.tipo === 'receita') recMes += val; else despMes += val;
      ativos++;
      totalGeral += val;
    }

    if(c.encerradoEm){
      var encMes = c.encerradoEm.substring(0, 7);
      if(encMes === mes) encerrados.push(c);
      if(encMes < mes) inativos++;
    }
    if(inicio === mes) novos.push(c);
    (c.historico || []).forEach(function(h){
      var hd = (h.de || '').substring(0, 7);
      if(hd === mes && c.historico.length > 1 && hd !== inicio){
        ajustes.push({contrato: c, novoValor: h.valor});
      }
    });
    if(c.dataFim){
      var fimMes = c.dataFim.substring(0, 7);
      if(fimMes === mes) vencendo.push(c);
    }
  });

  var saldoMes = recMes - despMes;

  // ---- Construir resumo ----
  var resumoId = 'ce-resumo-area';
  var existingResumo = document.getElementById(resumoId);
  if(!existingResumo){
    existingResumo = document.createElement('div');
    existingResumo.id = resumoId;
    var formSec = pgContratos.querySelector('.form-section');
    if(formSec) pgContratos.insertBefore(existingResumo, formSec);
    else pgContratos.insertBefore(existingResumo, contGrid);
  }

  var mesLabel = mesNomeFull(mes);
  var html = '';

  // Nav mes
  html += '<div class="ce-month-nav">';
  html += '<button class="btn btn-outline btn-sm" onclick="_ceChgMes(-1)">&#9664;</button>';
  html += '<span class="ce-mes-label">' + mesLabel + '</span>';
  html += '<button class="btn btn-outline btn-sm" onclick="_ceChgMes(1)">&#9654;</button>';
  html += '</div>';

  // Caixas de totais principais
  html += '<div class="ce-totals">';
  html += '<div class="ce-total-card desp"><div class="ct-label">Total Despesas Fixas</div><div class="ct-value" style="color:var(--dn2)">' + fmtV(despMes) + '</div><div class="ct-sub">' + S.contratos.filter(function(c){ return (c.tipo||'despesa')!=='receita' && !c.encerradoEm && (!c.dataFim || c.dataFim >= mes); }).length + ' contratos de despesa</div></div>';
  html += '<div class="ce-total-card rec"><div class="ct-label">Total Receitas Fixas</div><div class="ct-value" style="color:var(--ok)">' + fmtV(recMes) + '</div><div class="ct-sub">' + S.contratos.filter(function(c){ return c.tipo==='receita' && !c.encerradoEm && (!c.dataFim || c.dataFim >= mes); }).length + ' contratos de receita</div></div>';
  html += '<div class="ce-total-card saldo"><div class="ct-label">Saldo Contratos</div><div class="ct-value" style="color:' + (saldoMes >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(saldoMes) + '</div><div class="ct-sub">Receita fixa - Despesa fixa</div></div>';
  html += '<div class="ce-total-card info"><div class="ct-label">Total Geral</div><div class="ct-value" style="color:var(--inf2)">' + fmtV(totalGeral) + '</div><div class="ct-sub">' + ativos + ' ativos / ' + inativos + ' encerrados</div></div>';
  html += '</div>';

  // Cards de contagem
  html += '<div class="ce-resumo-grid">';
  html += '<div class="ce-card"><div class="ce-label">Ativos</div><div class="ce-value blue">' + ativos + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Novos</div><div class="ce-value green">' + novos.length + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Encerrados</div><div class="ce-value red">' + encerrados.length + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Ajustes</div><div class="ce-value purple">' + ajustes.length + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Vencendo</div><div class="ce-value orange">' + vencendo.length + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Total Geral</div><div class="ce-value">' + S.contratos.length + '</div></div>';
  html += '</div>';

  // Chips de eventos (compacto)
  var chips = [];
  novos.forEach(function(c){ chips.push('<span class="ce-ev-chip"><span class="ce-ev-dot new"></span>Novo: ' + c.desc + '</span>'); });
  encerrados.forEach(function(c){ chips.push('<span class="ce-ev-chip"><span class="ce-ev-dot end"></span>Encerrado: ' + c.desc + '</span>'); });
  ajustes.forEach(function(a){
    var valAnt = 0;
    var hist = (a.contrato.historico || []).slice().sort(function(x,y){ return (x.de||'').localeCompare(y.de||''); });
    for(var i = 0; i < hist.length; i++){
      if((hist[i].de||'').substring(0,7) === mes && i > 0){ valAnt = Number(hist[i-1].valor)||0; break; }
    }
    var diff = a.novoValor - valAnt;
    var pctV = valAnt ? ((diff/valAnt)*100).toFixed(1) : '0';
    chips.push('<span class="ce-ev-chip"><span class="ce-ev-dot adj"></span>' + a.contrato.desc + ': ' + fmtV(valAnt) + ' &rarr; ' + fmtV(a.novoValor) + ' (' + (diff>=0?'+':'') + pctV + '%)</span>');
  });
  vencendo.forEach(function(c){ chips.push('<span class="ce-ev-chip"><span class="ce-ev-dot warn"></span>Vencendo: ' + c.desc + '</span>'); });

  if(chips.length > 0){
    html += '<div class="ce-events-bar">' + chips.join('') + '</div>';
  }

  existingResumo.innerHTML = html;

  // ---- Grid de contratos (sub-box com dataFim + histórico) ----
  contGrid.innerHTML = S.contratos.length ? S.contratos.map(function(c){
    var at = !c.encerradoEm;
    var vencido = c.dataFim && c.dataFim < mesAtual();

    var bdHtml;
    if(!at) bdHtml = '<span class="badge badge-danger">Encerrado</span>';
    else if(vencido) bdHtml = '<span class="badge badge-warning">Vencido</span>';
    else bdHtml = '<span class="badge badge-success">Ativo</span>';

    var fimInfo = c.dataFim ? '<p>&#128197; Fim: ' + mesNome(c.dataFim) + '</p>' : '';

    // Histórico agora abre em modal (mesmo padrão das assinaturas), com
    // editar/excluir por lançamento. Antes era uma seção expansível no card.
    var hist = (c.historico || []);
    var histBtn = hist.length ?
      '<button class="btn btn-sm btn-outline" onclick="abrirHistorico(\'contrato\',\'' + c.id + '\')">' +
        '&#128197; Hist&oacute;rico <span class="ce-hist-badge">' + hist.length + '</span></button>' : '';

    return '<div class="sub-box">' +
      '<div class="sub-box-header"><strong>' + c.desc + '</strong>' + bdHtml + '</div>' +
      '<div class="sub-box-body">' +
        '<p>' + (c.tipo === 'receita' ? '&#128200; Receita' : '&#128201; Despesa') + ' &bull; ' + (c.categoria || 'Outros') + '</p>' +
        '<p class="sub-valor">' + _ceValorNoMes(c) + '</p>' +
        '<p>Dia ' + (c.dia || 1) + ' &bull; In&iacute;cio: ' + (c.inicio ? mesNome(c.inicio) : '-') + '</p>' +
        fimInfo +
        (c.obs ? '<p class="sub-obs">' + c.obs + '</p>' : '') +
      '</div>' +
      '<div class="sub-box-actions">' +
        histBtn +
        '<button class="btn btn-sm btn-outline" onclick="editCont(\'' + c.id + '\')">&#9998;</button>' +
        (at && !vencido ?
          '<button class="btn btn-sm btn-warning" onclick="ajCont(\'' + c.id + '\')">Ajustar</button>' +
          '<button class="btn btn-sm btn-danger" onclick="encCont(\'' + c.id + '\')">Encerrar</button>'
          :
          '<button class="btn btn-sm btn-success" onclick="reatCont(\'' + c.id + '\')">Reativar</button>'
        ) +
        '<button class="btn btn-sm btn-danger" onclick="delCont(\'' + c.id + '\')">&#128465;</button>' +
      '</div></div>';
  }).join('') : '<p style="color:var(--tx3)">Nenhum contrato.</p>';

  // ── Sincroniza a barra de filtros ──────────────────────────────
  // Esta etapa vinha de um wrapper em melhorias.js que nunca executava:
  // este arquivo carrega depois e substitui renderContratos por completo,
  // sem encadear o anterior. Resultado: o seletor de categoria ficava
  // vazio e os filtros salvos não eram reaplicados.
  _ceSincronizaFiltros();
};

// Mostra o valor que vigora no mes exibido, e nao apenas o ultimo cadastrado.
// (Tambem vinha do wrapper morto em melhorias.js.)
function _ceValorNoMes(c){
  var base = Number(c.valor) || 0;
  if(typeof valorVigenteMes !== 'function') return fmtV(base) + '/m&ecirc;s';
  var vig = valorVigenteMes(c, ceResumoMes);
  var txt = fmtV(vig) + '/m&ecirc;s';
  if(Math.abs(vig - base) > 0.01){
    txt += ' <span class="vigente-info">(vigente em ' + mesNome(ceResumoMes) + ')</span>';
  }
  return txt;
}

function _ceSincronizaFiltros(){
  var selCat = document.getElementById('fContCat');
  if(selCat){
    var atual = selCat.value || (typeof lerFiltro === 'function' ? lerFiltro('contCat','') : '');
    var cats = {};
    S.contratos.forEach(function(c){ if(c.categoria) cats[c.categoria] = 1; });
    selCat.innerHTML = '<option value="">Todas as categorias</option>' +
      Object.keys(cats).sort().map(function(c){
        return '<option value="' + c + '">' + c + '</option>';
      }).join('');
    selCat.value = atual;
  }
  if(typeof lerFiltro === 'function'){
    var tipoEl = document.getElementById('fContTipo');
    if(tipoEl && !tipoEl._restored){ tipoEl.value = lerFiltro('contTipo',''); tipoEl._restored = true; }
    var buscaEl = document.getElementById('fContBusca');
    if(buscaEl && !buscaEl._restored){ buscaEl.value = lerFiltro('contBusca',''); buscaEl._restored = true; }
  }
  if(typeof filtrarContratos === 'function') filtrarContratos();
}

// ================================================================
// Override allEntries para respeitar dataFim
// ================================================================
var _origAllEntries = window.allEntries;
window.allEntries = function(mes){
  var entries = _origAllEntries(mes);
  return entries.filter(function(e){
    if(e.origem !== 'Contrato') return true;
    var descBase = (e.desc || '').replace(' (Contrato)', '');
    var cont = S.contratos.find(function(c){ return c.desc === descBase; });
    if(cont && cont.dataFim && mes > cont.dataFim) return false;
    return true;
  });
};

// toggle histórico colapsável
window.ceTglHist = function(id, toggleEl){
  var body = document.getElementById(id);
  if(!body) return;
  var icon = toggleEl ? toggleEl.querySelector('.ce-hist-icon') : null;
  var expanded = body.classList.toggle('expanded');
  if(icon) icon.classList.toggle('open', expanded);
};

console.log('[Financeiro Pro] Contratos Enhanced v2 carregado.');
})();

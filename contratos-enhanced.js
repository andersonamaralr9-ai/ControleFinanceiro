// contratos-enhanced.js v1 — Data Fim opcional + Resumo mensal no topo
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* === CONTRATOS ENHANCED v1 === */

/* Resumo mensal */
.ce-resumo-wrap{margin-bottom:20px;}
.ce-resumo-title{font-size:.88em;color:var(--tx2);font-weight:600;margin-bottom:10px;}
.ce-resumo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;}
.ce-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 16px;text-align:center;box-shadow:var(--sh);}
.ce-card .ce-label{font-size:.65em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:4px;}
.ce-card .ce-value{font-size:1.15em;font-weight:700;}
.ce-card .ce-value.green{color:var(--ok);}
.ce-card .ce-value.red{color:var(--dn2);}
.ce-card .ce-value.blue{color:var(--inf2);}
.ce-card .ce-value.purple{color:var(--pri2);}
.ce-card .ce-value.orange{color:var(--wn);}

/* Eventos do m&ecirc;s */
.ce-events{margin-bottom:16px;}
.ce-events-title{font-size:.78em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:600;}
.ce-event-item{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--bg2);border:1px solid var(--bg4);border-radius:8px;margin-bottom:6px;font-size:.82em;}
.ce-event-icon{font-size:1.1em;flex-shrink:0;}
.ce-event-desc{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ce-event-badge{padding:2px 8px;border-radius:12px;font-size:.72em;font-weight:700;flex-shrink:0;}
.ce-event-badge.new{background:rgba(0,206,201,.15);color:var(--ok);}
.ce-event-badge.end{background:rgba(214,48,49,.15);color:var(--dn2);}
.ce-event-badge.adj{background:rgba(108,92,231,.15);color:var(--pri2);}

/* Navegacao de mes */
.ce-month-nav{display:flex;align-items:center;gap:12px;margin-bottom:16px;justify-content:center;}
.ce-month-nav .ce-mes-label{font-size:1em;font-weight:600;min-width:160px;text-align:center;}

/* Responsive */
@media(max-width:768px){
  .ce-resumo-grid{grid-template-columns:1fr 1fr;gap:8px;}
  .ce-card{padding:10px 8px;}
  .ce-card .ce-label{font-size:.55em;}
  .ce-card .ce-value{font-size:.9em;}
  .ce-event-item{font-size:.75em;padding:5px 8px;}
  .ce-event-badge{font-size:.65em;}
  .ce-month-nav .ce-mes-label{font-size:.85em;min-width:120px;}
}
@media(max-width:380px){
  .ce-resumo-grid{grid-template-columns:1fr 1fr;}
  .ce-card .ce-value{font-size:.8em;}
}
`;
document.head.appendChild(sty);

// ================================================================
// Injetar campo "Data Fim" no formul&aacute;rio de contratos
// ================================================================
function injectFimField(){
  var formGrid = document.querySelector('#pg-contratos .form-grid');
  if(!formGrid) return;

  // Verificar se j&aacute; existe
  if(document.getElementById('contFim')) return;

  // Encontrar o campo Observa&ccedil;&atilde;o e inserir antes
  var obsGroup = null;
  var groups = formGrid.querySelectorAll('.form-group');
  for(var i = 0; i < groups.length; i++){
    var label = groups[i].querySelector('label');
    if(label && (label.textContent.indexOf('Observa') >= 0)){
      obsGroup = groups[i];
      break;
    }
  }

  var fimGroup = document.createElement('div');
  fimGroup.className = 'form-group';
  fimGroup.innerHTML = '<label>Data Fim (opcional)</label><input type="month" id="contFim" class="form-control" placeholder="Sem data fim">';

  if(obsGroup){
    formGrid.insertBefore(fimGroup, obsGroup);
  } else {
    // Inserir antes do bot&atilde;o
    var btnGroup = formGrid.querySelector('.form-group:last-child');
    formGrid.insertBefore(fimGroup, btnGroup);
  }
}

// ================================================================
// Injetar campo "Data Fim" no modal de edi&ccedil;&atilde;o
// ================================================================
function injectFimFieldModal(){
  var modalBody = document.querySelector('#modalEditCont .modal-body');
  if(!modalBody || document.getElementById('ecFim')) return;

  // Inserir depois do campo Obs
  var obsGroup = null;
  var groups = modalBody.querySelectorAll('.form-group');
  for(var i = 0; i < groups.length; i++){
    var label = groups[i].querySelector('label');
    if(label && label.textContent.indexOf('Obs') >= 0){
      obsGroup = groups[i];
      break;
    }
  }

  var fimGroup = document.createElement('div');
  fimGroup.className = 'form-group';
  fimGroup.style.marginBottom = '12px';
  fimGroup.innerHTML = '<label>Data Fim (opcional)</label><input type="month" id="ecFim" class="form-control" placeholder="Sem data fim">';

  if(obsGroup && obsGroup.nextSibling){
    modalBody.insertBefore(fimGroup, obsGroup.nextSibling);
  } else {
    // Inserir antes do hidden + bot&atilde;o
    var hidden = document.getElementById('ecId');
    if(hidden) modalBody.insertBefore(fimGroup, hidden);
  }
}

// ================================================================
// Override addContrato para incluir dataFim
// ================================================================
var _origAddContrato = window.addContrato;
window.addContrato = function(){
  var fimInput = document.getElementById('contFim');
  var dataFim = fimInput ? fimInput.value : '';

  var tipo = g('contTipo').value;
  var desc = g('contDesc').value.trim();
  var cat = g('contCat').value;
  var valor = parseN(g('contValor').value);
  var dia = parseInt(g('contDia').value) || 1;
  var inicio = g('contInicio').value;
  var obs = g('contObs').value.trim();

  if(!desc || !valor || !inicio) return alert('Preencha tudo.');

  S.contratos.push({
    id: uid(),
    tipo: tipo,
    desc: desc,
    categoria: cat,
    valor: valor,
    dia: dia,
    inicio: inicio,
    obs: obs,
    historico: [{de: inicio, valor: valor}],
    encerradoEm: null,
    dataFim: dataFim || null
  });

  salvar();
  g('contDesc').value = '';
  g('contValor').value = '';
  g('contObs').value = '';
  if(fimInput) fimInput.value = '';
  renderContratos();
};

// ================================================================
// Override editCont para preencher campo dataFim
// ================================================================
var _origEditCont = window.editCont;
window.editCont = function(id){
  _origEditCont(id);
  // Preencher dataFim no modal
  var c = S.contratos.find(function(x){ return x.id === id; });
  if(!c) return;
  var fimInput = document.getElementById('ecFim');
  if(fimInput){
    fimInput.value = c.dataFim || '';
  }
};

// ================================================================
// Override updateContrato para salvar dataFim
// ================================================================
var _origUpdateContrato = window.updateContrato;
window.updateContrato = function(){
  var id = g('ecId').value;
  var c = S.contratos.find(function(x){ return x.id === id; });
  if(!c) return;

  var nv = parseN(g('ecValor').value);
  if(nv !== c.valor){
    c.historico.push({de: mesAtual(), valor: nv});
    c.valor = nv;
  }
  c.tipo = g('ecTipo').value;
  c.desc = g('ecDesc').value.trim();
  c.categoria = g('ecCat').value;
  c.dia = parseInt(g('ecDia').value) || 1;
  c.obs = g('ecObs').value.trim();

  var fimInput = document.getElementById('ecFim');
  if(fimInput){
    c.dataFim = fimInput.value || null;
  }

  salvar();
  closeM('modalEditCont');
  renderContratos();
  renderResumo();
};

// ================================================================
// Vari&aacute;vel de m&ecirc;s para navega&ccedil;&atilde;o no resumo de contratos
// ================================================================
var ceResumoMes = mesAtual();
window._ceChgMes = function(n){
  ceResumoMes = addMes(ceResumoMes, n);
  renderContratos();
};

// ================================================================
// Override renderContratos para adicionar resumo e mostrar dataFim
// ================================================================
var _origRenderContratos = window.renderContratos;
window.renderContratos = function(){
  // Chamar original primeiro para popular selects
  if(typeof updContCats === 'function') updContCats();

  // Injetar campos
  injectFimField();
  injectFimFieldModal();

  var contGrid = g('contGrid');
  var pgContratos = document.getElementById('pg-contratos');
  if(!pgContratos) return;

  // ---- Calcular dados do m&ecirc;s ----
  var mes = ceResumoMes;
  var totalAtivos = 0;
  var totalInativos = 0;
  var totalValorDespMes = 0;
  var totalValorRecMes = 0;
  var novosNoMes = [];
  var encerradosNoMes = [];
  var ajustesNoMes = [];
  var vencendoNoMes = []; // contratos com dataFim neste m&ecirc;s

  S.contratos.forEach(function(c){
    var inicio = (c.inicio || '').substring(0, 7);
    var isAtivo = !c.encerradoEm || c.encerradoEm >= mes;
    var isIniciado = inicio && inicio <= mes;

    // Verificar se dataFim j&aacute; passou
    if(c.dataFim && c.dataFim < mes) isAtivo = false;
    if(c.encerradoEm && c.encerradoEm < mes) isAtivo = false;

    if(isAtivo && isIniciado){
      // Calcular valor vigente
      var val = Number(c.valor) || 0;
      var hist = (c.historico || []).slice();
      for(var i = 0; i < hist.length; i++){
        var hd = (hist[i].de || '').substring(0, 7);
        if(hd && mes >= hd) val = Number(hist[i].valor) || 0;
      }

      if(c.tipo === 'receita'){
        totalValorRecMes += val;
        totalAtivos++;
      } else {
        totalValorDespMes += val;
        totalAtivos++;
      }
    }

    if(c.encerradoEm){
      var encMes = c.encerradoEm.substring(0, 7);
      if(encMes === mes) encerradosNoMes.push(c);
      if(encMes < mes) totalInativos++;
    }

    // Novo no m&ecirc;s
    if(inicio === mes) novosNoMes.push(c);

    // Ajustes no m&ecirc;s
    (c.historico || []).forEach(function(h){
      var hd = (h.de || '').substring(0, 7);
      if(hd === mes){
        // Verificar se &eacute; o primeiro registro (cria&ccedil;&atilde;o) ou ajuste
        if(c.historico.length > 1 && hd !== inicio){
          ajustesNoMes.push({contrato: c, novoValor: h.valor});
        }
      }
    });

    // Vencendo (dataFim) neste m&ecirc;s
    if(c.dataFim){
      var fimMes = c.dataFim.substring(0, 7);
      if(fimMes === mes) vencendoNoMes.push(c);
    }
  });

  // ---- Construir resumo HTML ----
  var resumoId = 'ce-resumo-area';
  var existingResumo = document.getElementById(resumoId);
  if(!existingResumo){
    existingResumo = document.createElement('div');
    existingResumo.id = resumoId;
    // Inserir antes do form-section
    var formSec = pgContratos.querySelector('.form-section');
    if(formSec){
      pgContratos.insertBefore(existingResumo, formSec);
    } else {
      pgContratos.insertBefore(existingResumo, contGrid);
    }
  }

  var mesLabel = mesNomeFull(mes);
  var html = '';

  // Navega&ccedil;&atilde;o de m&ecirc;s
  html += '<div class="ce-month-nav">';
  html += '<button class="btn btn-outline btn-sm" onclick="_ceChgMes(-1)">&#9664;</button>';
  html += '<span class="ce-mes-label">' + mesLabel + '</span>';
  html += '<button class="btn btn-outline btn-sm" onclick="_ceChgMes(1)">&#9654;</button>';
  html += '</div>';

  // Cards resumo
  html += '<div class="ce-resumo-grid">';
  html += '<div class="ce-card"><div class="ce-label">Ativos</div><div class="ce-value blue">' + totalAtivos + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Desp. Mensal</div><div class="ce-value red">' + fmtV(totalValorDespMes) + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Rec. Mensal</div><div class="ce-value green">' + fmtV(totalValorRecMes) + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Novos</div><div class="ce-value purple">' + novosNoMes.length + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Encerrados</div><div class="ce-value orange">' + encerradosNoMes.length + '</div></div>';
  html += '<div class="ce-card"><div class="ce-label">Ajustes</div><div class="ce-value purple">' + ajustesNoMes.length + '</div></div>';
  html += '</div>';

  // Eventos do m&ecirc;s
  var events = [];
  novosNoMes.forEach(function(c){
    events.push({icon: '&#128994;', desc: 'Novo: ' + c.desc + ' &mdash; ' + fmtV(c.valor) + '/m&ecirc;s', badge: 'new', badgeText: 'Novo'});
  });
  encerradosNoMes.forEach(function(c){
    events.push({icon: '&#128308;', desc: 'Encerrado: ' + c.desc, badge: 'end', badgeText: 'Encerrado'});
  });
  ajustesNoMes.forEach(function(a){
    var valAnterior = 0;
    var hist = (a.contrato.historico || []).slice().sort(function(x,y){ return (x.de||'').localeCompare(y.de||''); });
    for(var i = 0; i < hist.length; i++){
      if((hist[i].de || '').substring(0,7) === mes && i > 0){
        valAnterior = Number(hist[i-1].valor) || 0;
        break;
      }
    }
    var diff = a.novoValor - valAnterior;
    var pct = valAnterior ? ((diff / valAnterior) * 100).toFixed(1) : '0';
    var sinal = diff >= 0 ? '+' : '';
    events.push({
      icon: '&#128260;',
      desc: 'Ajuste: ' + a.contrato.desc + ' &mdash; ' + fmtV(valAnterior) + ' &rarr; ' + fmtV(a.novoValor) + ' (' + sinal + pct + '%)',
      badge: 'adj',
      badgeText: sinal + pct + '%'
    });
  });
  vencendoNoMes.forEach(function(c){
    events.push({icon: '&#9888;', desc: 'Vencimento: ' + c.desc + ' &mdash; fim em ' + mesNome(c.dataFim), badge: 'end', badgeText: 'Vencendo'});
  });

  if(events.length > 0){
    html += '<div class="ce-events">';
    html += '<div class="ce-events-title">Eventos do M&ecirc;s</div>';
    events.forEach(function(ev){
      html += '<div class="ce-event-item">';
      html += '<span class="ce-event-icon">' + ev.icon + '</span>';
      html += '<span class="ce-event-desc">' + ev.desc + '</span>';
      html += '<span class="ce-event-badge ' + ev.badge + '">' + ev.badgeText + '</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  existingResumo.innerHTML = html;

  // ---- Renderizar grid de contratos (com dataFim) ----
  contGrid.innerHTML = S.contratos.length ? S.contratos.map(function(c){
    var at = !c.encerradoEm;
    // Verificar se ultrapassou dataFim
    var vencido = false;
    if(c.dataFim && c.dataFim < mesAtual()) vencido = true;
    if(vencido && at){
      // Contrato venceu pela data fim
    }

    var bdHtml;
    if(!at){
      bdHtml = '<span class="badge badge-danger">Encerrado</span>';
    } else if(vencido){
      bdHtml = '<span class="badge badge-warning">Vencido</span>';
    } else {
      bdHtml = '<span class="badge badge-success">Ativo</span>';
    }

    var fimInfo = '';
    if(c.dataFim){
      fimInfo = '<p>&#128197; Fim: ' + mesNome(c.dataFim) + '</p>';
    }

    return '<div class="sub-box">' +
      '<div class="sub-box-header"><strong>' + c.desc + '</strong>' + bdHtml + '</div>' +
      '<div class="sub-box-body">' +
        '<p>' + (c.tipo === 'receita' ? '&#128200; Receita' : '&#128201; Despesa') + ' &bull; ' + (c.categoria || 'Outros') + '</p>' +
        '<p class="sub-valor">' + fmtV(c.valor) + '/m&ecirc;s</p>' +
        '<p>Dia ' + (c.dia || 1) + ' &bull; In&iacute;cio: ' + (c.inicio ? mesNome(c.inicio) : '-') + '</p>' +
        fimInfo +
        (c.obs ? '<p class="sub-obs">' + c.obs + '</p>' : '') +
      '</div>' +
      '<div class="sub-box-actions">' +
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
};

// ================================================================
// Override allEntries para respeitar dataFim
// ================================================================
var _origAllEntries = window.allEntries;
window.allEntries = function(mes){
  var entries = _origAllEntries(mes);
  // Filtrar contratos que passaram da dataFim
  return entries.filter(function(e){
    if(e.origem !== 'Contrato') return true;
    // Encontrar o contrato original
    var descBase = (e.desc || '').replace(' (Contrato)', '');
    var cont = S.contratos.find(function(c){ return c.desc === descBase; });
    if(cont && cont.dataFim && mes > cont.dataFim) return false;
    return true;
  });
};

console.log('[Financeiro Pro] Contratos Enhanced v1 carregado.');
})();

// melhorias.js v4 — REESCRITA TOTAL baseada no código real do index.html
// Usa as estruturas reais: historico[] com {de,valor}, editCont/ecId, ajSub/ajSubId, etc.
(function(){
'use strict';

// ================================================================
// 0. REFERÊNCIAS AO SISTEMA ORIGINAL
// ================================================================
// O index.html usa:
//   - S.contratos[].historico = [{de:"YYYY-MM", valor:N}, ...]
//   - S.assinaturas[].historico = [{de:"YYYY-MM", valor:N}, ...]
//   - editCont(id) → modal modalEditCont, campo ecId, ecValor
//   - updateContrato() → lê ecId, ecValor; se mudou, faz c.historico.push({de:mesAtual(),valor:nv})
//   - ajCont(id) → modal modalAjCont, campo ajContId, ajContVal, ajContMes
//   - saveAjCont() → lê ajContId, ajContVal, ajContMes; faz c.historico.push({de:m,valor:v})
//   - ajSub(id) → modal modalAjSub, campo ajSubId, ajSubVal, ajSubMes
//   - saveAjSub() → lê ajSubId, ajSubVal, ajSubMes; faz s.historico.push({de:m,valor:v})
//   - allEntries(mes) → usa historico[] para valor vigente
//   - salvar() → localStorage
//   - fmtD, fmtV, mesNome, mesNomeFull, addMes, mesAtual, getMes

// ================================================================
// 0a. HELPER: Valor vigente usando historico[] nativo
// ================================================================
function valorVigenteMes(item, mesAno){
  // mesAno = "YYYY-MM"
  // item tem .valor (último) e .historico (array de {de:"YYYY-MM", valor:N})
  var hist = (item.historico || []).slice();
  if(!hist.length) return Number(item.valor) || 0;
  
  // Ordenar por data
  hist.sort(function(a,b){
    return (a.de||'').localeCompare(b.de||'');
  });
  
  // Encontrar o valor vigente no mesAno
  var vigente = hist[0].valor; // valor mais antigo como base
  for(var i = 0; i < hist.length; i++){
    var hde = hist[i].de || '';
    if(hde <= mesAno){
      vigente = Number(hist[i].valor) || 0;
    } else {
      break;
    }
  }
  return vigente;
}
window.valorVigenteMes = valorVigenteMes;

// ================================================================
// 0b. PERSISTÊNCIA DE FILTROS
// ================================================================
var FILTROS_KEY = 'finApp_filtros';
function salvarFiltro(nome, valor){
  var f = JSON.parse(localStorage.getItem(FILTROS_KEY) || '{}');
  f[nome] = valor;
  localStorage.setItem(FILTROS_KEY, JSON.stringify(f));
}
function lerFiltro(nome, padrao){
  var f = JSON.parse(localStorage.getItem(FILTROS_KEY) || '{}');
  return f[nome] !== undefined ? f[nome] : padrao;
}

// ================================================================
// 0c. HELPERS
// ================================================================
var MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function nomeMesBR(mesAno){
  if(!mesAno) return '-';
  var p = mesAno.split('-');
  return MESES_FULL[parseInt(p[1])-1] + ' ' + p[0];
}
function mesSeguinte(y,m){ m++; if(m>12){m=1;y++;} return {y:y,m:m}; }
function _mesAtual(){
  var h = new Date();
  return h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0');
}

// ================================================================
// 0d. FORÇAR FORMATO DE DATA BRASILEIRO
// ================================================================
// O fmtD original no index.html já retorna dd/mm/aaaa.
// Mas vamos garantir que qualquer chamada fmtD funcione corretamente
// e também que datas em formato ISO sejam convertidas.
var _origFmtD = window.fmtD;
window.fmtD = function(d){
  if(!d) return '-';
  var s = String(d);
  // Se já é dd/mm/aaaa, retornar
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // Se é yyyy-mm-dd
  var p = s.split('-');
  if(p.length === 3 && p[0].length === 4) return p[2]+'/'+p[1]+'/'+p[0];
  // Se é yyyy-mm
  if(p.length === 2 && p[0].length === 4) return p[1]+'/'+p[0];
  // Fallback
  if(_origFmtD) return _origFmtD(d);
  return d;
};

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
.filter-sub{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.filter-sub .form-control{max-width:180px;}
.filter-sub .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}
@media(max-width:768px){
  .filter-sub{flex-direction:column;align-items:stretch;}
  .filter-sub .form-control{max-width:100%;}
  .filter-sub .filter-count{margin-left:0;text-align:center;}
}
.hist-timeline{margin:12px 0;max-height:280px;overflow-y:auto;}
.hist-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-left:3px solid var(--pri);margin-bottom:6px;background:var(--bg3);border-radius:0 8px 8px 0;font-size:.84em;flex-wrap:wrap;}
.hist-item .hist-data{color:var(--tx3);font-size:.78em;min-width:80px;}
.hist-item .hist-vigencia{font-size:.72em;color:var(--inf2);background:rgba(9,132,227,.1);padding:2px 8px;border-radius:10px;}
.hist-item .hist-valor{font-weight:700;color:var(--pri2);}
.hist-item .hist-diff{font-size:.75em;margin-left:auto;}
.hist-item .hist-diff.up{color:var(--dn2);}
.hist-item .hist-diff.down{color:var(--ok);}
.hist-item .hist-diff.zero{color:var(--tx3);}
.hist-orig{border-left-color:var(--tx3)!important;opacity:.7;}
.vigente-info{font-size:.72em;color:var(--inf2);margin-left:4px;}
.cat-row{display:grid;grid-template-columns:1fr 120px 120px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bg4);transition:background .15s;cursor:default;}
.cat-row:hover{background:var(--bg3);}
.cat-row-header{background:var(--bg3);font-size:.73em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;cursor:default;}
.cat-row-header:hover{background:var(--bg3);}
.cat-row .cat-name{font-weight:600;font-size:.88em;}
.cat-row .cat-val{font-weight:700;text-align:right;font-size:.9em;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background .15s;}
.cat-row .cat-val:hover{background:var(--bg4);}
.cat-row .cat-val.green{color:var(--ok);}
.cat-row .cat-val.red{color:var(--dn2);}
.cat-total-row{background:var(--bg3);font-weight:700;border-top:2px solid var(--bg4);}
.cat-total-row .cat-name{font-size:.9em;}
.comp-container{margin-top:20px;}
.comp-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
.comp-header label{font-size:.8em;color:var(--tx2);font-weight:600;}
.comp-row{display:grid;grid-template-columns:1fr 110px 110px 110px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--bg4);font-size:.85em;}
.comp-row-header{background:var(--bg3);font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;}
.comp-val{text-align:right;font-weight:700;}
.comp-diff{text-align:right;font-weight:700;font-size:.82em;}
.comp-diff.up{color:var(--dn2);}.comp-diff.down{color:var(--ok);}.comp-diff.zero{color:var(--tx3);}
.comp-section-title{font-size:.85em;font-weight:700;padding:12px 16px 6px;color:var(--tx2);border-bottom:2px solid var(--bg4);}
.comp-total-row{background:var(--bg3);font-weight:700;border-top:2px solid var(--bg4);}
.det-list{max-height:350px;overflow-y:auto;}
.det-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--bg4);font-size:.85em;}
.det-item .det-desc{flex:1;}
.det-item .det-data{color:var(--tx3);font-size:.78em;min-width:80px;}
.det-item .det-val{font-weight:700;min-width:90px;text-align:right;}
.det-item .det-origem{font-size:.72em;color:var(--tx3);margin-left:8px;}
.det-total{padding:12px;background:var(--bg3);border-radius:8px;margin-top:8px;text-align:right;font-weight:700;font-size:.95em;}
@media(max-width:768px){
  .cat-row{grid-template-columns:1fr 90px 90px;padding:10px 12px;}
  .cat-row .cat-val{font-size:.8em;padding:3px 6px;}
  .comp-row{grid-template-columns:1fr 80px 80px 80px;padding:8px 12px;font-size:.78em;}
  .comp-header{flex-direction:column;align-items:stretch;}
}
`;
document.head.appendChild(sty);


// ================================================================
// 1. MODAL DE HISTÓRICO — usa historico[] nativo do sistema
// ================================================================
var modalHist = document.createElement('div');
modalHist.className = 'modal';
modalHist.id = 'modalHistorico';
modalHist.innerHTML = '<div class="modal-content" style="max-width:520px">'+
  '<div class="modal-header"><h3 id="histTitle">&#128197; Histórico de Valores</h3>'+
  '<span class="modal-close" onclick="document.getElementById(\'modalHistorico\').classList.remove(\'show\')">&times;</span></div>'+
  '<div class="modal-body" id="histBody"></div></div>';
document.body.appendChild(modalHist);

window.abrirHistorico = function(tipo, itemId){
  var item;
  if(tipo === 'contrato') item = S.contratos.find(function(c){return c.id === itemId;});
  else item = S.assinaturas.find(function(a){return a.id === itemId;});
  if(!item){ toast('Item não encontrado','error'); return; }

  var nome = item.desc || item.nome || '-';
  var ma = _mesAtual();
  var vigente = valorVigenteMes(item, ma);

  document.getElementById('histTitle').textContent = 'Histórico — ' + nome;

  var html = '<p style="margin-bottom:14px"><strong style="color:var(--tx);font-size:1.05em">'+nome+'</strong><br>'+
    '<span style="font-size:.85em;color:var(--tx2)">Valor vigente em '+nomeMesBR(ma)+': </span>'+
    '<strong style="font-size:1.1em;color:var(--ok)">'+fmtV(vigente)+'</strong><br>'+
    '<span style="font-size:.78em;color:var(--tx3)">Valor cadastrado (último ajuste): '+fmtV(item.valor)+'</span></p>';

  var hist = (item.historico || []).slice();
  
  if(!hist.length){
    html += '<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum histórico registrado.</p>';
  } else {
    // Ordenar do mais recente para o mais antigo
    hist.sort(function(a,b){
      return (b.de||'').localeCompare(a.de||'');
    });
    
    html += '<div class="hist-timeline">';
    for(var i = 0; i < hist.length; i++){
      var h = hist[i];
      var isFirst = (i === 0); // mais recente
      var isLast = (i === hist.length - 1); // mais antigo (original)
      
      // Calcular diferença com o anterior (que é o próximo no array, pois está em ordem decrescente)
      var diffHtml = '';
      if(!isLast && hist[i+1]){
        var diff = (Number(h.valor)||0) - (Number(hist[i+1].valor)||0);
        var diffClass = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'zero');
        var diffLabel = diff > 0 ? '▲ +'+fmtV(Math.abs(diff)) : (diff < 0 ? '▼ -'+fmtV(Math.abs(diff)) : '—');
        diffHtml = '<span class="hist-diff '+diffClass+'">'+diffLabel+'</span>';
      }
      
      var vigLabel = h.de ? '<span class="hist-vigencia">a partir de '+nomeMesBR(h.de)+'</span>' : '';
      var isAtualClass = isFirst ? 'style="color:var(--ok);font-weight:700"' : 'class="hist-valor"';
      
      html += '<div class="hist-item'+(isLast?' hist-orig':'')+'">'+
        vigLabel+
        '<span '+isAtualClass+'>'+fmtV(h.valor)+'</span>'+
        (isFirst ? ' <span style="font-size:.68em;color:var(--ok)">(atual)</span>' : '')+
        (isLast ? ' <span style="font-size:.68em;color:var(--tx3)">(original)</span>' : '')+
        diffHtml+
      '</div>';
    }
    html += '</div>';
  }

  document.getElementById('histBody').innerHTML = html;
  document.getElementById('modalHistorico').classList.add('show');
};


// ================================================================
// 2. OVERRIDE renderContratos — adicionar botão Histórico + valor vigente
// ================================================================
(function(){
  var _orig = window.renderContratos;
  if(!_orig) return;
  
  window.renderContratos = function(){
    _orig();
    
    var contGrid = document.getElementById('contGrid');
    if(!contGrid) return;
    var ma = _mesAtual();
    
    contGrid.querySelectorAll('.sub-box').forEach(function(box){
      var actions = box.querySelector('.sub-box-actions');
      if(!actions) return;
      
      // Encontrar o ID — procurar em QUALQUER botão com onclick que contenha o ID
      var allBtns = actions.querySelectorAll('button[onclick]');
      var contId = null;
      allBtns.forEach(function(btn){
        var oc = btn.getAttribute('onclick') || '';
        // Procurar padrões: editCont('xxx'), ajCont('xxx'), encCont('xxx'), delCont('xxx')
        var match = oc.match(/(?:editCont|ajCont|encCont|delCont|reatCont)\(['"](.+?)['"]\)/);
        if(match) contId = match[1];
      });
      if(!contId) return;
      
      var cont = S.contratos.find(function(c){return c.id === contId;});
      if(!cont) return;
      
      // Atualizar valor exibido para o vigente do mês atual
      var vigente = valorVigenteMes(cont, ma);
      var valorCadastrado = Number(cont.valor) || 0;
      var valorEl = box.querySelector('.sub-valor');
      if(valorEl){
        if(cont.historico && cont.historico.length > 1 && Math.abs(vigente - valorCadastrado) > 0.01){
          valorEl.innerHTML = fmtV(vigente)+'/mês <span class="vigente-info">(vigente em '+nomeMesBR(ma).split(' ')[0]+')</span>';
        } else {
          valorEl.innerHTML = fmtV(vigente)+'/mês';
        }
      }
      
      // Botão Histórico
      if(!actions.querySelector('.btn-hist')){
        var btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline btn-hist';
        btn.innerHTML = '&#128197; Histórico';
        btn.title = 'Ver histórico de valores';
        btn.onclick = function(){ abrirHistorico('contrato', contId); };
        actions.appendChild(btn);
      }
    });
    
    // Aplicar filtros se existirem
    if(typeof filtrarContratos === 'function') filtrarContratos();
  };
})();


// ================================================================
// 3. OVERRIDE renderAssinaturas (renderSubs) — adicionar botão Histórico + valor vigente
// ================================================================
(function(){
  // No index.html a função se chama renderAssinaturas mas é chamada como renderSubs? 
  // Verificando: sidebar chama nav('assinaturas'), ren() chama renderAssinaturas
  // Mas mobile-cards.js e melhorias anteriores overridam renderSubs...
  // O index.html define renderAssinaturas, não renderSubs!
  
  var _orig = window.renderAssinaturas;
  if(!_orig) return;
  
  window.renderAssinaturas = function(){
    _orig();
    
    var subGrid = document.getElementById('subGrid');
    if(!subGrid) return;
    var ma = _mesAtual();
    
    subGrid.querySelectorAll('.sub-box').forEach(function(box){
      var actions = box.querySelector('.sub-box-actions');
      if(!actions) return;
      
      var allBtns = actions.querySelectorAll('button[onclick]');
      var subId = null;
      allBtns.forEach(function(btn){
        var oc = btn.getAttribute('onclick') || '';
        var match = oc.match(/(?:ajSub|encSub|delSub|reatSub)\(['"](.+?)['"]\)/);
        if(match) subId = match[1];
      });
      if(!subId) return;
      
      var sub = S.assinaturas.find(function(a){return a.id === subId;});
      if(!sub) return;
      
      // Atualizar valor exibido para o vigente do mês atual
      var vigente = valorVigenteMes(sub, ma);
      var valorCadastrado = Number(sub.valor) || 0;
      var valorEl = box.querySelector('.sub-valor');
      if(valorEl){
        if(sub.historico && sub.historico.length > 1 && Math.abs(vigente - valorCadastrado) > 0.01){
          valorEl.innerHTML = fmtV(vigente)+'/mês <span class="vigente-info">(vigente em '+nomeMesBR(ma).split(' ')[0]+')</span>';
        } else {
          valorEl.innerHTML = fmtV(vigente)+'/mês';
        }
      }
      
      // Botão Histórico
      if(!actions.querySelector('.btn-hist')){
        var btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline btn-hist';
        btn.innerHTML = '&#128197; Histórico';
        btn.title = 'Ver histórico de valores';
        btn.onclick = function(){ abrirHistorico('assinatura', subId); };
        actions.appendChild(btn);
      }
    });
    
    // Aplicar filtros se existirem
    if(typeof filtrarSubs === 'function') filtrarSubs();
  };
})();


// ================================================================
// 4. FILTROS EM ASSINATURAS
// ================================================================
(function(){
  var pg = document.getElementById('pg-assinaturas');
  if(!pg) return;
  var subGrid = document.getElementById('subGrid');
  if(!subGrid) return;

  var filterDiv = document.createElement('div');
  filterDiv.className = 'filter-sub';
  filterDiv.id = 'filterSubs';
  filterDiv.innerHTML =
    '<select id="fSubCartao" class="form-control" onchange="filtrarSubs()"><option value="">Todos os cartões</option></select>'+
    '<select id="fSubCat" class="form-control" onchange="filtrarSubs()"><option value="">Todas as categorias</option></select>'+
    '<input id="fSubBusca" class="form-control" placeholder="Buscar nome..." oninput="filtrarSubs()" style="max-width:200px">'+
    '<span class="filter-count" id="fSubCount"></span>';
  subGrid.parentNode.insertBefore(filterDiv, subGrid);

  // Povoar filtros após cada render
  var _origRA = window.renderAssinaturas;
  var _wrappedRA = window.renderAssinaturas; // pode já ter sido wrapped acima
  // Adicionar povoamento de filtros ao final
  var _afterRender = window.renderAssinaturas;
  window.renderAssinaturas = function(){
    _afterRender();
    // Povoar selects
    var selCart = document.getElementById('fSubCartao');
    var selCat = document.getElementById('fSubCat');
    if(selCart){
      var cv = selCart.value || lerFiltro('subCartao','');
      selCart.innerHTML = '<option value="">Todos os cartões</option>';
      S.cartoes.forEach(function(c){ selCart.innerHTML += '<option value="'+c.id+'">'+c.nome+'</option>'; });
      selCart.value = cv;
    }
    if(selCat){
      var ccv = selCat.value || lerFiltro('subCat','');
      selCat.innerHTML = '<option value="">Todas as categorias</option>';
      var cats = {};
      S.assinaturas.forEach(function(a){ if(a.categoria) cats[a.categoria] = 1; });
      Object.keys(cats).sort().forEach(function(c){ selCat.innerHTML += '<option value="'+c+'">'+c+'</option>'; });
      selCat.value = ccv;
    }
    var buscaEl = document.getElementById('fSubBusca');
    if(buscaEl && !buscaEl._restored){ buscaEl.value = lerFiltro('subBusca',''); buscaEl._restored = true; }
  };

  window.filtrarSubs = function(){
    var cartFiltro = (document.getElementById('fSubCartao')||{}).value || '';
    var catFiltro = (document.getElementById('fSubCat')||{}).value || '';
    var busca = ((document.getElementById('fSubBusca')||{}).value || '').toLowerCase();
    salvarFiltro('subCartao', cartFiltro);
    salvarFiltro('subCat', catFiltro);
    salvarFiltro('subBusca', busca);
    var grid = document.getElementById('subGrid');
    if(!grid) return;
    var boxes = grid.querySelectorAll('.sub-box');
    var total = 0, visivel = 0;
    boxes.forEach(function(box){
      total++;
      var texto = box.textContent.toLowerCase();
      var ok = true;
      if(cartFiltro){
        var cart = S.cartoes.find(function(c){return c.id === cartFiltro;});
        if(cart) ok = texto.indexOf(cart.nome.toLowerCase()) >= 0;
        else ok = false;
      }
      if(ok && catFiltro) ok = texto.indexOf(catFiltro.toLowerCase()) >= 0;
      if(ok && busca) ok = texto.indexOf(busca) >= 0;
      box.style.display = ok ? '' : 'none';
      if(ok) visivel++;
    });
    var cnt = document.getElementById('fSubCount');
    if(cnt) cnt.textContent = visivel + ' de ' + total + ' assinatura(s)';
  };
})();


// ================================================================
// 5. FILTROS EM CONTRATOS
// ================================================================
(function(){
  var pg = document.getElementById('pg-contratos');
  if(!pg) return;
  var contGrid = document.getElementById('contGrid');
  if(!contGrid) return;

  var filterDiv = document.createElement('div');
  filterDiv.className = 'filter-sub';
  filterDiv.id = 'filterContratos';
  filterDiv.innerHTML =
    '<select id="fContTipo" class="form-control" onchange="filtrarContratos()"><option value="">Todos os tipos</option><option value="receita">Receita</option><option value="despesa">Despesa</option></select>'+
    '<select id="fContCat" class="form-control" onchange="filtrarContratos()"><option value="">Todas as categorias</option></select>'+
    '<input id="fContBusca" class="form-control" placeholder="Buscar..." oninput="filtrarContratos()" style="max-width:200px">'+
    '<span class="filter-count" id="fContCount"></span>';
  contGrid.parentNode.insertBefore(filterDiv, contGrid);

  var _afterRenderC = window.renderContratos;
  window.renderContratos = function(){
    _afterRenderC();
    var selCat = document.getElementById('fContCat');
    if(selCat){
      var ccv = selCat.value || lerFiltro('contCat','');
      selCat.innerHTML = '<option value="">Todas as categorias</option>';
      var cats = {};
      S.contratos.forEach(function(c){ if(c.categoria) cats[c.categoria] = 1; });
      Object.keys(cats).sort().forEach(function(c){ selCat.innerHTML += '<option value="'+c+'">'+c+'</option>'; });
      selCat.value = ccv;
    }
    var tipoEl = document.getElementById('fContTipo');
    if(tipoEl && !tipoEl._restored){ tipoEl.value = lerFiltro('contTipo',''); tipoEl._restored = true; }
    var buscaEl = document.getElementById('fContBusca');
    if(buscaEl && !buscaEl._restored){ buscaEl.value = lerFiltro('contBusca',''); buscaEl._restored = true; }
  };

  window.filtrarContratos = function(){
    var tipoFiltro = (document.getElementById('fContTipo')||{}).value || '';
    var catFiltro = (document.getElementById('fContCat')||{}).value || '';
    var busca = ((document.getElementById('fContBusca')||{}).value || '').toLowerCase();
    salvarFiltro('contTipo', tipoFiltro);
    salvarFiltro('contCat', catFiltro);
    salvarFiltro('contBusca', busca);
    var grid = document.getElementById('contGrid');
    if(!grid) return;
    var boxes = grid.querySelectorAll('.sub-box');
    var total = 0, visivel = 0;
    boxes.forEach(function(box){
      total++;
      var texto = box.textContent.toLowerCase();
      var ok = true;
      if(tipoFiltro) ok = texto.indexOf(tipoFiltro) >= 0;
      if(ok && catFiltro) ok = texto.indexOf(catFiltro.toLowerCase()) >= 0;
      if(ok && busca) ok = texto.indexOf(busca) >= 0;
      box.style.display = ok ? '' : 'none';
      if(ok) visivel++;
    });
    var cnt = document.getElementById('fContCount');
    if(cnt) cnt.textContent = visivel + ' de ' + total + ' contrato(s)';
  };
})();


// ================================================================
// 6. PERSISTIR FILTROS DO EXTRATO E BALANCETE
// ================================================================
(function(){
  var _origRE = window.renderExtrato;
  if(_origRE){
    setTimeout(function(){
      var de = document.getElementById('extDe');
      var ate = document.getElementById('extAte');
      var tipo = document.getElementById('extTipo');
      if(de && lerFiltro('extDe','')) de.value = lerFiltro('extDe','');
      if(ate && lerFiltro('extAte','')) ate.value = lerFiltro('extAte','');
      if(tipo && lerFiltro('extTipo','')) tipo.value = lerFiltro('extTipo','');
    }, 300);
    window.renderExtrato = function(){
      var de = document.getElementById('extDe');
      var ate = document.getElementById('extAte');
      var tipo = document.getElementById('extTipo');
      var cat = document.getElementById('extCat');
      if(de) salvarFiltro('extDe', de.value);
      if(ate) salvarFiltro('extAte', ate.value);
      if(tipo) salvarFiltro('extTipo', tipo.value);
      if(cat) salvarFiltro('extCat', cat.value);
      _origRE();
    };
  }
})();
(function(){
  setTimeout(function(){
    var de = document.getElementById('balDe');
    var ate = document.getElementById('balAte');
    if(de && lerFiltro('balDe','')) de.value = lerFiltro('balDe','');
    if(ate && lerFiltro('balAte','')) ate.value = lerFiltro('balAte','');
  }, 300);
  var _origRB = window.renderBalancete;
  if(!_origRB) return;
  window.renderBalancete = function(){
    var de = document.getElementById('balDe');
    var ate = document.getElementById('balAte');
    if(de) salvarFiltro('balDe', de.value);
    if(ate) salvarFiltro('balAte', ate.value);
    _origRB();
  };
})();


// ================================================================
// 7. EXTRATO POR CATEGORIA — USA allEntries() DO SISTEMA ORIGINAL
//    Isso garante que os valores batam com Resumo e Balancete!
// ================================================================
(function(){
  var sidebar = document.getElementById('sidebar');
  if(!sidebar) return;
  var extLink = document.getElementById('nav-extrato');
  if(!extLink) return;

  // Adicionar link no menu
  var newLink = document.createElement('a');
  newLink.id = 'nav-extratoCat';
  newLink.onclick = function(){ nav('extratoCat'); };
  newLink.innerHTML = '<span>&#128202; Extrato Categorizado</span>';
  extLink.parentNode.insertBefore(newLink, extLink.nextSibling);

  // Criar página
  var mainDiv = document.querySelector('.main');
  if(!mainDiv) return;
  var pgDiv = document.createElement('div');
  pgDiv.className = 'page';
  pgDiv.id = 'pg-extratoCat';
  pgDiv.innerHTML =
    '<h2 class="page-title">&#128202; Extrato por Categoria</h2>'+
    '<div class="month-nav"><button class="btn btn-outline" onclick="chgECM(-1)">&#9664;</button>'+
    '<span class="mes-label" id="ecMesLabel"></span>'+
    '<button class="btn btn-outline" onclick="chgECM(1)">&#9654;</button></div>'+
    '<div id="ecArea"></div>'+
    '<div class="comp-container" id="ecCompContainer">'+
    '<div class="comp-header"><label>&#128200; Comparar com:</label>'+
    '<input type="month" id="ecCompMes" class="form-control" style="max-width:180px" onchange="renderExtratoCat()">'+
    '<button class="btn btn-sm btn-outline" onclick="document.getElementById(\'ecCompMes\').value=\'\';renderExtratoCat()">Limpar</button></div>'+
    '<div id="ecCompArea"></div></div>';
  mainDiv.appendChild(pgDiv);

  // Estado do mês
  var ecMesVal = lerFiltro('ecMes','') || _mesAtual();

  window.chgECM = function(dir){
    ecMesVal = addMes(ecMesVal, dir);
    salvarFiltro('ecMes', ecMesVal);
    renderExtratoCat();
  };

  function agrupar(entries){
    var receitas = {}, despesas = {};
    entries.forEach(function(e){
      var cat = e.cat || 'Sem categoria';
      var tipo = e.tipo || 'despesa';
      var val = Number(e.valor) || 0;
      if(tipo === 'receita'){
        if(!receitas[cat]) receitas[cat] = {total:0, items:[]};
        receitas[cat].total += val; receitas[cat].items.push(e);
      } else {
        if(!despesas[cat]) despesas[cat] = {total:0, items:[]};
        despesas[cat].total += val; despesas[cat].items.push(e);
      }
    });
    return {receitas: receitas, despesas: despesas};
  }

  // Modal detalhes
  var modalDet = document.createElement('div');
  modalDet.className = 'modal';
  modalDet.id = 'modalDetCategoria';
  modalDet.innerHTML = '<div class="modal-content" style="max-width:540px">'+
    '<div class="modal-header"><h3 id="detCatTitle">Detalhes</h3>'+
    '<span class="modal-close" onclick="document.getElementById(\'modalDetCategoria\').classList.remove(\'show\')">&times;</span></div>'+
    '<div class="modal-body" id="detCatBody"></div></div>';
  document.body.appendChild(modalDet);

  window.abrirDetCategoria = function(cat, tipo, mesStr){
    // USA allEntries() do sistema original — MESMA fonte de dados do Resumo/Balancete
    var entries = allEntries(mesStr);
    var filtrados = entries.filter(function(e){
      return e.cat === cat && e.tipo === tipo;
    });
    filtrados.sort(function(a,b){ return a.data.localeCompare(b.data); });
    var total = filtrados.reduce(function(a,e){ return a + (Number(e.valor)||0); }, 0);
    var corTotal = tipo === 'receita' ? 'var(--ok)' : 'var(--dn2)';

    document.getElementById('detCatTitle').textContent = cat + ' — ' + (tipo==='receita'?'Receitas':'Despesas') + ' — ' + mesNomeFull(mesStr);

    var html = '<div class="det-list">';
    if(!filtrados.length){
      html += '<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum lançamento</p>';
    } else {
      filtrados.forEach(function(e){
        var cor = tipo === 'receita' ? 'color:var(--ok)' : 'color:var(--dn2)';
        html += '<div class="det-item"><span class="det-data">'+fmtD(e.data)+'</span>'+
          '<span class="det-desc">'+(e.desc||'-')+'</span>'+
          '<span class="det-origem">'+(e.origem||'Manual')+'</span>'+
          '<span class="det-val" style="'+cor+'">'+fmtV(e.valor)+'</span></div>';
      });
    }
    html += '</div><div class="det-total" style="color:'+corTotal+'">Total: '+fmtV(total)+'</div>';
    document.getElementById('detCatBody').innerHTML = html;
    document.getElementById('modalDetCategoria').classList.add('show');
  };

  window.renderExtratoCat = function(){
    document.getElementById('ecMesLabel').textContent = mesNomeFull(ecMesVal);
    
    // *** USA allEntries() DO SISTEMA — GARANTE mesmos valores que Resumo/Balancete ***
    var entries = allEntries(ecMesVal);
    var grupos = agrupar(entries);

    var html = '<div class="chart-box" style="padding:0;overflow:hidden">';
    html += '<div class="cat-row cat-row-header"><span>Categoria</span><span style="text-align:right">Receita</span><span style="text-align:right">Despesa</span></div>';

    var allCats = {};
    Object.keys(grupos.receitas).forEach(function(c){ allCats[c] = 1; });
    Object.keys(grupos.despesas).forEach(function(c){ allCats[c] = 1; });
    var catList = Object.keys(allCats).sort();
    var totalRec = 0, totalDesp = 0;

    if(!catList.length){
      html += '<div style="padding:30px;text-align:center;color:var(--tx3)">Nenhum lançamento neste mês</div>';
    } else {
      catList.forEach(function(cat){
        var rec = (grupos.receitas[cat] || {}).total || 0;
        var desp = (grupos.despesas[cat] || {}).total || 0;
        totalRec += rec; totalDesp += desp;
        var esc = cat.replace(/'/g, "\\'");
        var recClick = rec > 0 ? 'onclick="abrirDetCategoria(\''+esc+'\',\'receita\',\''+ecMesVal+'\')" style="cursor:pointer"' : '';
        var despClick = desp > 0 ? 'onclick="abrirDetCategoria(\''+esc+'\',\'despesa\',\''+ecMesVal+'\')" style="cursor:pointer"' : '';
        html += '<div class="cat-row"><span class="cat-name">'+cat+'</span>'+
          '<span class="cat-val green" '+recClick+'>'+(rec > 0 ? fmtV(rec) : '-')+'</span>'+
          '<span class="cat-val red" '+despClick+'>'+(desp > 0 ? fmtV(desp) : '-')+'</span></div>';
      });
      html += '<div class="cat-row cat-total-row"><span class="cat-name">TOTAL</span>'+
        '<span class="cat-val green">'+fmtV(totalRec)+'</span>'+
        '<span class="cat-val red">'+fmtV(totalDesp)+'</span></div>';
      var saldo = totalRec - totalDesp;
      html += '<div class="cat-row" style="border-top:2px solid var(--pri)"><span class="cat-name" style="color:var(--pri2)">SALDO</span><span></span>'+
        '<span class="cat-val '+(saldo >= 0 ? 'green' : 'red')+'">'+fmtV(Math.abs(saldo))+(saldo < 0 ? ' (déficit)' : '')+'</span></div>';
    }
    html += '</div>';
    document.getElementById('ecArea').innerHTML = html;

    // COMPARAÇÃO
    var compMes = document.getElementById('ecCompMes').value;
    var compArea = document.getElementById('ecCompArea');
    if(!compMes){ compArea.innerHTML = ''; return; }

    var compEntries = allEntries(compMes);
    var compGrupos = agrupar(compEntries);
    var mesAtualLabel = mesNomeFull(ecMesVal);
    var compLabel = mesNomeFull(compMes);

    var allCatsComp = {};
    [grupos.receitas, grupos.despesas, compGrupos.receitas, compGrupos.despesas].forEach(function(g){
      Object.keys(g).forEach(function(c){ allCatsComp[c]=1; });
    });
    var allCatsList = Object.keys(allCatsComp).sort();

    var ch = '<div class="chart-box" style="padding:0;overflow:hidden;margin-top:16px">';
    ch += '<div style="padding:14px 16px;border-bottom:2px solid var(--bg4);font-weight:700;font-size:.9em;color:var(--pri2)">&#128200; '+mesAtualLabel+' vs '+compLabel+'</div>';

    // Despesas
    ch += '<div class="comp-section-title" style="color:var(--dn2)">Despesas</div>';
    ch += '<div class="comp-row comp-row-header"><span>Categoria</span><span style="text-align:right">Atual</span><span style="text-align:right">Comparado</span><span style="text-align:right">Diferença</span></div>';
    var tdA=0, tdC=0;
    allCatsList.forEach(function(cat){
      var a = (grupos.despesas[cat]||{}).total || 0;
      var c = (compGrupos.despesas[cat]||{}).total || 0;
      if(!a && !c) return;
      tdA += a; tdC += c;
      var d = a - c;
      var dc = d > 0 ? 'up' : (d < 0 ? 'down' : 'zero');
      var dl = d > 0 ? '▲ +'+fmtV(d) : (d < 0 ? '▼ '+fmtV(Math.abs(d)) : '-');
      ch += '<div class="comp-row"><span>'+cat+'</span><span class="comp-val" style="color:var(--dn2)">'+(a?fmtV(a):'-')+'</span><span class="comp-val" style="color:var(--dn2)">'+(c?fmtV(c):'-')+'</span><span class="comp-diff '+dc+'">'+dl+'</span></div>';
    });
    var dd=tdA-tdC,ddc=dd>0?'up':(dd<0?'down':'zero'),ddl=dd>0?'▲ +'+fmtV(dd):(dd<0?'▼ '+fmtV(Math.abs(dd)):'-');
    ch += '<div class="comp-row comp-total-row"><span>TOTAL DESPESAS</span><span class="comp-val" style="color:var(--dn2)">'+fmtV(tdA)+'</span><span class="comp-val" style="color:var(--dn2)">'+fmtV(tdC)+'</span><span class="comp-diff '+ddc+'">'+ddl+'</span></div>';

    // Receitas
    ch += '<div class="comp-section-title" style="color:var(--ok)">Receitas</div>';
    ch += '<div class="comp-row comp-row-header"><span>Categoria</span><span style="text-align:right">Atual</span><span style="text-align:right">Comparado</span><span style="text-align:right">Diferença</span></div>';
    var trA=0, trC=0;
    allCatsList.forEach(function(cat){
      var a = (grupos.receitas[cat]||{}).total || 0;
      var c = (compGrupos.receitas[cat]||{}).total || 0;
      if(!a && !c) return;
      trA += a; trC += c;
      var d = a - c;
      var dc = d > 0 ? 'down' : (d < 0 ? 'up' : 'zero');
      var dl = d > 0 ? '▲ +'+fmtV(d) : (d < 0 ? '▼ '+fmtV(Math.abs(d)) : '-');
      ch += '<div class="comp-row"><span>'+cat+'</span><span class="comp-val" style="color:var(--ok)">'+(a?fmtV(a):'-')+'</span><span class="comp-val" style="color:var(--ok)">'+(c?fmtV(c):'-')+'</span><span class="comp-diff '+dc+'">'+dl+'</span></div>';
    });
    var dr=trA-trC,drc=dr>0?'down':(dr<0?'up':'zero'),drl=dr>0?'▲ +'+fmtV(dr):(dr<0?'▼ '+fmtV(Math.abs(dr)):'-');
    ch += '<div class="comp-row comp-total-row"><span>TOTAL RECEITAS</span><span class="comp-val" style="color:var(--ok)">'+fmtV(trA)+'</span><span class="comp-val" style="color:var(--ok)">'+fmtV(trC)+'</span><span class="comp-diff '+drc+'">'+drl+'</span></div>';
    ch += '</div>';
    compArea.innerHTML = ch;
  };

  // Nav hook
  var _origNav = window.nav;
  window.nav = function(pg){
    _origNav(pg);
    var el = document.getElementById('nav-extratoCat');
    if(el) el.classList[pg === 'extratoCat' ? 'add' : 'remove']('active');
    var pgEl = document.getElementById('pg-extratoCat');
    if(pgEl){
      if(pg === 'extratoCat'){ pgEl.classList.add('active'); renderExtratoCat(); }
      else pgEl.classList.remove('active');
    }
  };
})();


// ================================================================
// 8. PERSISTIR MÊS DO LANÇAMENTO E RESUMO
// ================================================================
(function(){
  var _origChgLM = window.chgLM;
  if(_origChgLM){
    window.chgLM = function(dir){
      _origChgLM(dir);
      if(typeof lancMes !== 'undefined') salvarFiltro('lancMes', lancMes);
    };
  }
  setTimeout(function(){
    var saved = lerFiltro('lancMes','');
    if(saved && typeof lancMes !== 'undefined' && saved !== lancMes){
      lancMes = saved;
      if(typeof renderLancs === 'function') renderLancs();
    }
  }, 400);

  var _origChgM = window.chgM;
  if(_origChgM){
    window.chgM = function(dir){
      _origChgM(dir);
      if(typeof curMes !== 'undefined') salvarFiltro('resumoMes', curMes);
    };
  }
  setTimeout(function(){
    var saved = lerFiltro('resumoMes','');
    if(saved && typeof curMes !== 'undefined' && saved !== curMes){
      curMes = saved;
      if(typeof renderResumo === 'function') renderResumo();
    }
  }, 400);
})();


console.log('[Financeiro Pro] Melhorias v4 carregadas.');
})();

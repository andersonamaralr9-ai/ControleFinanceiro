// assinaturas-enhanced.js v1 — Resumo mensal + Editar assinatura
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ═══ RESUMO ASSINATURAS ═══ */
.as-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:18px;}
.as-resumo .card{text-align:center;}

/* ═══ MODAL EDITAR ASSINATURA ═══ */
#modalEditSub .form-group{margin-bottom:12px;}

@media(max-width:768px){
  .as-resumo{grid-template-columns:1fr 1fr;gap:8px;}
  .as-resumo .card{padding:10px 8px;}
  .as-resumo .card .card-label{font-size:.62em;}
  .as-resumo .card .card-value{font-size:.88em;}
}
@media(max-width:380px){
  .as-resumo{grid-template-columns:1fr!important;}
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL DE EDIÇÃO DE ASSINATURA
// ================================================================
if(!document.getElementById('modalEditSub')){
  var m = document.createElement('div');
  m.className = 'modal';
  m.id = 'modalEditSub';
  m.innerHTML = '<div class="modal-content"><div class="modal-header">' +
    '<h3>&#9998; Editar Assinatura</h3>' +
    '<span class="modal-close" onclick="closeM(\'modalEditSub\')">&times;</span></div>' +
    '<div class="modal-body">' +
      '<div class="form-group"><label>Nome</label><input id="esNome" class="form-control"></div>' +
      '<div class="form-group"><label>Valor/m\\u00eas (R$)</label><input id="esValor" class="form-control"></div>' +
      '<div class="form-group"><label>Cart\\u00e3o</label><select id="esCartao" class="form-control"></select></div>' +
      '<div class="form-group"><label>Categoria</label><select id="esCat" class="form-control"></select></div>' +
      '<div class="form-group"><label>In\\u00edcio</label><input type="month" id="esInicio" class="form-control"></div>' +
      '<input type="hidden" id="esId">' +
      '<button class="btn btn-primary" onclick="window._esSave()" style="width:100%;margin-top:8px">Salvar</button>' +
    '</div></div>';
  document.body.appendChild(m);
}

// ================================================================
// ABRIR MODAL EDITAR
// ================================================================
window.editSub = function(subId){
  var sub = S.assinaturas.find(function(s){ return s.id === subId; });
  if(!sub){ if(typeof toast === 'function') toast('Assinatura n\u00e3o encontrada','error'); return; }

  document.getElementById('esId').value = subId;
  document.getElementById('esNome').value = sub.nome || '';
  document.getElementById('esValor').value = sub.valor || '';
  document.getElementById('esInicio').value = sub.inicio || '';

  // Povoar cartões
  var selCart = document.getElementById('esCartao');
  selCart.innerHTML = '<option value="">Nenhum</option>';
  S.cartoes.forEach(function(c){
    selCart.innerHTML += '<option value="' + c.id + '"' + (c.id === sub.cartaoId ? ' selected' : '') + '>' + c.nome + '</option>';
  });

  // Povoar categorias
  var selCat = document.getElementById('esCat');
  selCat.innerHTML = '';
  var cats = (S.cats.assinatura || S.cats.despesa || []);
  cats.forEach(function(c){
    selCat.innerHTML += '<option' + (c === (sub.categoria || sub.cat) ? ' selected' : '') + '>' + c + '</option>';
  });

  openM('modalEditSub');
};

// ================================================================
// SALVAR EDIÇÃO
// ================================================================
window._esSave = function(){
  var subId = document.getElementById('esId').value;
  var sub = S.assinaturas.find(function(s){ return s.id === subId; });
  if(!sub) return;

  var nome = document.getElementById('esNome').value.trim();
  var valor = parseN(document.getElementById('esValor').value);
  var cartaoId = document.getElementById('esCartao').value;
  var categoria = document.getElementById('esCat').value;
  var inicio = document.getElementById('esInicio').value;

  if(!nome || !valor){
    alert('Preencha nome e valor.');
    return;
  }

  // Se o valor mudou, registrar no histórico
  var valorAntigo = Number(sub.valor) || 0;
  if(Math.abs(valor - valorAntigo) > 0.01){
    if(!Array.isArray(sub.historico)) sub.historico = [];
    var mesAtualStr = (function(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
    sub.historico.push({ de: mesAtualStr, valor: valor });
  }

  sub.nome = nome;
  sub.valor = valor;
  sub.cartaoId = cartaoId || '';
  sub.categoria = categoria;
  sub.cat = categoria;
  if(inicio) sub.inicio = inicio;

  salvar();
  closeM('modalEditSub');
  if(typeof toast === 'function') toast('Assinatura atualizada!', 'success');
  if(typeof renderAssinaturas === 'function') renderAssinaturas();
};

// ================================================================
// OVERRIDE renderAssinaturas — Adicionar resumo + botão editar
// ================================================================
var _origRenderAss = window.renderAssinaturas;

window.renderAssinaturas = function(){
  // Chamar o original (que já pode ter sido wrapped pelo melhorias.js)
  if(_origRenderAss) _origRenderAss();

  var pgEl = document.getElementById('pg-assinaturas');
  if(!pgEl) return;

  // ═══ 1. RESUMO MENSAL NO TOPO ═══
  var existingResumo = document.getElementById('asResumoArea');
  if(!existingResumo){
    existingResumo = document.createElement('div');
    existingResumo.id = 'asResumoArea';
    // Inserir depois do título e antes do formulário
    var formSection = pgEl.querySelector('.form-section');
    if(formSection){
      pgEl.insertBefore(existingResumo, formSection);
    } else {
      var subGrid = document.getElementById('subGrid');
      if(subGrid) pgEl.insertBefore(existingResumo, subGrid);
    }
  }

  // Calcular dados do mês atual
  var mesAtualStr = (function(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
  var mesLabel = mesNomeFull(mesAtualStr);

  var ativas = 0, encerradas = 0, totalValorMes = 0;
  var porCartao = {};

  S.assinaturas.forEach(function(s){
    if(s.encerradaEm){
      encerradas++;
      return;
    }
    // Verificar se estava ativa no mês atual
    var inicio = (s.inicio || '').substring(0,7);
    if(inicio && mesAtualStr < inicio) return;
    ativas++;

    // Valor vigente no mês
    var val = Number(s.valor) || 0;
    var hist = (s.historico || []);
    for(var i = 0; i < hist.length; i++){
      var hd = (hist[i].de || '').substring(0,7);
      if(hd && mesAtualStr >= hd) val = Number(hist[i].valor) || 0;
    }
    totalValorMes += val;

    // Por cartão
    var cart = S.cartoes.find(function(c){ return c.id === s.cartaoId; });
    var cartNome = cart ? cart.nome : 'Sem cart\u00e3o';
    porCartao[cartNome] = (porCartao[cartNome] || 0) + val;
  });

  // Maior cartão
  var maiorCartao = '-';
  var maiorCartaoVal = 0;
  Object.keys(porCartao).forEach(function(k){
    if(porCartao[k] > maiorCartaoVal){ maiorCartaoVal = porCartao[k]; maiorCartao = k; }
  });

  existingResumo.innerHTML =
    '<h3 style="font-size:.88em;color:var(--tx2);margin-bottom:10px;font-weight:600">&#128257; ' + mesLabel + '</h3>' +
    '<div class="as-resumo">' +
      '<div class="card"><div class="card-label">Ativas</div><div class="card-value green">' + ativas + '</div></div>' +
      '<div class="card"><div class="card-label">Total Mensal</div><div class="card-value red">' + fmtV(totalValorMes) + '</div></div>' +
      '<div class="card"><div class="card-label">Encerradas</div><div class="card-value purple">' + encerradas + '</div></div>' +
      '<div class="card"><div class="card-label">Maior Cart\\u00e3o</div><div class="card-value blue" style="font-size:.75em">' + maiorCartao + '</div></div>' +
    '</div>';

  // ═══ 2. ADICIONAR BOTÃO EDITAR EM CADA ASSINATURA ═══
  var subGrid = document.getElementById('subGrid');
  if(!subGrid) return;

  subGrid.querySelectorAll('.sub-box').forEach(function(box){
    var actions = box.querySelector('.sub-box-actions');
    if(!actions) return;

    // Encontrar o ID
    var allBtns = actions.querySelectorAll('button[onclick]');
    var subId = null;
    allBtns.forEach(function(btn){
      var oc = btn.getAttribute('onclick') || '';
      var match = oc.match(/(?:ajSub|encSub|delSub|reatSub)\(['"](.+?)['"]\)/);
      if(match) subId = match[1];
    });
    if(!subId) return;

    // Não adicionar duplicado
    if(actions.querySelector('.btn-edit-sub')) return;

    // Criar botão editar como PRIMEIRO botão
    var btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline btn-edit-sub';
    btn.innerHTML = '&#9998; Editar';
    btn.title = 'Editar assinatura';
    btn.onclick = function(){ editSub(subId); };
    actions.insertBefore(btn, actions.firstChild);
  });
};

console.log('[Financeiro Pro] Assinaturas Enhanced v1 — Resumo mensal + Editar.');
})();

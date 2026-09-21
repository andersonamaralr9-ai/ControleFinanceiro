// lixeira.js v1 — Lixeira de itens excluidos, com restauracao
//
// Antes, excluir era definitivo: as funcoes del* so chamavam markDeleted(id)
// (que guarda apenas o ID em _deletedIds, para o sync saber que o item
// morreu) e descartavam o objeto. O conteudo nao existia em lugar nenhum.
//
// Agora toda exclusao passa por lixeiraGuardar(), que arquiva o objeto
// inteiro em S.lixeira antes de remove-lo da colecao de origem.
//
// ATENCAO ao restaurar itens que tem tombstone. O merge em auth.js aplica:
//     if (map[id] && delIds[id] >= (map[id]._ts || 0)) delete map[id];
// Ou seja, o item volta a ser apagado se o carimbo de exclusao for MAIOR OU
// IGUAL ao _ts dele. E os tombstones sao unidos dos dois lados no merge, entao
// apagar o tombstone local nao o remove do outro dispositivo. Por isso
// restaurar forca _ts = agora (estritamente maior que o tombstone) alem de
// limpar o tombstone local. Sem isso o item reapareceria e sumiria de novo no
// proximo sync, em silencio.
(function(){
'use strict';

var RETENCAO_DIAS = 30;
var RETENCAO_MS = RETENCAO_DIAS * 24 * 60 * 60 * 1000;
window.LIXEIRA_RETENCAO_DIAS = RETENCAO_DIAS;

// Tipos que sao registros de topo: restaurar = devolver para a colecao.
// Apenas os sete primeiros participam do merge/tombstone em auth.js.
var COL_POR_TIPO = {
  lancamento:   'lancamentos',
  contrato:     'contratos',
  cartao:       'cartoes',
  compra:       'comprasCartao',
  assinatura:   'assinaturas',
  investimento: 'investimentos',
  patrimonio:   'patrimonios'
};

var ROTULO_TIPO = {
  lancamento:'Lançamento', contrato:'Contrato', cartao:'Cartão',
  compra:'Compra no cartão', assinatura:'Assinatura',
  investimento:'Investimento', patrimonio:'Patrimônio',
  'invest-mov':'Movimentação de investimento',
  'invest-rent':'Rentabilidade', historico:'Ajuste de histórico',
  planejamento:'Limite de orçamento', categoria:'Categoria'
};

function _uid(){
  return typeof uid === 'function' ? uid() : 'lx' + Date.now() + Math.random().toString(36).slice(2, 8);
}
function _fmtV(v){ return typeof fmtV === 'function' ? fmtV(v) : 'R$ ' + (v || 0); }
function _fmtD(d){ return typeof fmtD === 'function' ? fmtD(d) : (d || '-'); }
function _aviso(msg, tipo){
  if(typeof toast === 'function') return toast(msg, tipo || 'success');
  alert(msg);
}

// ================================================================
// GRAVAR NA LIXEIRA
// ================================================================
// Chamado pelas funcoes de exclusao ANTES de remover o item.
window.lixeiraGuardar = function(tipo, dados, ctx, rotulo, detalhe){
  if(typeof S === 'undefined' || !S || !dados) return;
  if(!Array.isArray(S.lixeira)) S.lixeira = [];
  S.lixeira.push({
    lixoId: _uid(),
    tipo: tipo,
    rotulo: rotulo || '',
    detalhe: detalhe || '',
    excluidoEm: Date.now(),
    dados: JSON.parse(JSON.stringify(dados)),
    ctx: ctx ? JSON.parse(JSON.stringify(ctx)) : {},
    purgado: false
  });
  window.lixeiraPurgar();
};

// Remove fisicamente o que passou da retencao. Como a regra e so de tempo,
// os dois dispositivos chegam ao mesmo resultado sem precisar sincronizar
// a remocao.
window.lixeiraPurgar = function(){
  if(typeof S === 'undefined' || !S || !Array.isArray(S.lixeira)) return 0;
  var limite = Date.now() - RETENCAO_MS;
  var antes = S.lixeira.length;
  S.lixeira = S.lixeira.filter(function(it){ return (it.excluidoEm || 0) > limite; });
  return antes - S.lixeira.length;
};

function _itensVisiveis(){
  if(typeof S === 'undefined' || !S || !Array.isArray(S.lixeira)) return [];
  return S.lixeira.filter(function(it){ return !it.purgado; })
    .sort(function(a, b){ return (b.excluidoEm || 0) - (a.excluidoEm || 0); });
}
window.lixeiraItens = _itensVisiveis;

// ================================================================
// RESTAURAR
// ================================================================
function _restauraTopo(it){
  var col = COL_POR_TIPO[it.tipo];
  if(!col) return 'Tipo desconhecido.';
  if(!Array.isArray(S[col])) S[col] = [];
  var id = it.dados && it.dados.id;
  if(id && S[col].some(function(x){ return x.id === id; }))
    return 'Já existe um item com esse ID na lista.';

  var item = JSON.parse(JSON.stringify(it.dados));
  // Precisa ser estritamente maior que o tombstone (regra `>=` no merge).
  item._ts = Date.now();
  S[col].push(item);
  if(id && S._deletedIds) delete S._deletedIds[id];
  return null;
}

function _restauraInvestFilho(it, campo, jaExiste){
  var inv = (S.investimentos || []).find(function(x){ return x.id === it.ctx.invId; });
  if(!inv) return 'O investimento desse item não existe mais. Restaure o investimento primeiro.';
  if(!Array.isArray(inv[campo])) inv[campo] = [];
  if(inv[campo].some(jaExiste)) return 'Esse item já está no investimento.';
  inv[campo].push(JSON.parse(JSON.stringify(it.dados)));
  inv._ts = Date.now();
  if(S._deletedIds) delete S._deletedIds[inv.id];
  return null;
}

function _restaura(it){
  if(COL_POR_TIPO[it.tipo]) return _restauraTopo(it);

  if(it.tipo === 'invest-mov'){
    var d = it.dados;
    return _restauraInvestFilho(it, 'movimentacoes', function(m){ return m.id === d.id; });
  }
  if(it.tipo === 'invest-rent'){
    var r = it.dados;
    return _restauraInvestFilho(it, 'rentabilidade', function(x){ return x.mes === r.mes; });
  }
  if(it.tipo === 'historico'){
    var alvo = it.ctx.alvo === 'contrato' ? (S.contratos || []) : (S.assinaturas || []);
    var pai = alvo.find(function(x){ return x.id === it.ctx.itemId; });
    if(!pai) return 'O ' + (it.ctx.alvo || 'item') + ' desse ajuste não existe mais. Restaure-o primeiro.';
    if(!Array.isArray(pai.historico)) pai.historico = [];
    if(pai.historico.some(function(h){ return h.de === it.dados.de; }))
      return 'Já existe um ajuste para ' + it.dados.de + '.';
    var pos = typeof it.ctx.idx === 'number' ? it.ctx.idx : pai.historico.length;
    pai.historico.splice(Math.min(pos, pai.historico.length), 0, JSON.parse(JSON.stringify(it.dados)));
    pai.historico.sort(function(a, b){ return (a.de || '').localeCompare(b.de || ''); });
    // Mantem item.valor igual ao ajuste mais recente (mesma regra do melhorias.js)
    var ult = pai.historico[pai.historico.length - 1];
    if(ult) pai.valor = Number(ult.valor) || 0;
    pai._ts = Date.now();
    if(S._deletedIds) delete S._deletedIds[pai.id];
    return null;
  }
  if(it.tipo === 'planejamento'){
    if(!S.planejamento || Array.isArray(S.planejamento)) S.planejamento = {};
    if(!S.planejamento[it.ctx.mes]) S.planejamento[it.ctx.mes] = {};
    if(S.planejamento[it.ctx.mes][it.ctx.cat] !== undefined)
      return 'Já existe um limite para "' + it.ctx.cat + '" nesse mês.';
    S.planejamento[it.ctx.mes][it.ctx.cat] = it.dados;
    return null;
  }
  if(it.tipo === 'categoria'){
    var t = it.ctx.catTipo;
    if(!S.cats) S.cats = {};
    if(!Array.isArray(S.cats[t])) S.cats[t] = [];
    if(S.cats[t].indexOf(it.dados) !== -1) return 'Essa categoria já existe.';
    S.cats[t].push(it.dados);
    return null;
  }
  return 'Tipo desconhecido.';
}

window.lixeiraRestaurar = function(lixoId){
  var it = (S.lixeira || []).find(function(x){ return x.lixoId === lixoId; });
  if(!it) return;
  var erro = _restaura(it);
  if(erro) return _aviso(erro, 'error');

  S.lixeira = S.lixeira.filter(function(x){ return x.lixoId !== lixoId; });
  salvar();
  if(typeof renderAll === 'function') renderAll();
  renderLixeira();
  _aviso((ROTULO_TIPO[it.tipo] || 'Item') + ' restaurado.');
};

// ================================================================
// EXCLUIR DEFINITIVAMENTE / ESVAZIAR
// ================================================================
// Marca purgado em vez de remover: o merge une as duas lixeiras por lixoId,
// entao uma remocao fisica local voltaria do outro dispositivo. A flag
// propaga (purgado vence dos dois lados) e a remocao fisica fica por conta
// da retencao de tempo, que e igual nos dois.
window.lixeiraExcluirDef = function(lixoId){
  var it = (S.lixeira || []).find(function(x){ return x.lixoId === lixoId; });
  if(!it) return;
  if(!confirm('Excluir definitivamente "' + (it.rotulo || 'este item') + '"?\nNão será possível restaurar.')) return;
  it.purgado = true;
  salvar();
  renderLixeira();
  _aviso('Item excluído definitivamente.');
};

window.lixeiraEsvaziar = function(){
  var n = _itensVisiveis().length;
  if(!n) return;
  if(!confirm('Esvaziar a lixeira?\n' + n + ' ite' + (n > 1 ? 'ns serão excluídos' : 'm será excluído') + ' definitivamente.')) return;
  (S.lixeira || []).forEach(function(it){ it.purgado = true; });
  salvar();
  renderLixeira();
  _aviso('Lixeira esvaziada.');
};

// ================================================================
// PAGINA
// ================================================================
function criarPagina(){
  if(document.getElementById('pg-lixeira')) return;
  var pg = document.createElement('div');
  pg.className = 'page';
  pg.id = 'pg-lixeira';
  pg.innerHTML = '<h2 class="page-title">Lixeira</h2><div id="lixConteudo"></div>';
  var main = document.querySelector('.main');
  if(main) main.appendChild(pg);
}

function addMenuLink(){
  var sidebar = document.getElementById('sidebar');
  if(!sidebar || document.getElementById('nav-lixeira')) return;
  var backup = document.getElementById('nav-backup');
  var a = document.createElement('a');
  a.id = 'nav-lixeira';
  a.setAttribute('onclick', "nav('lixeira')");
  a.innerHTML = '<span class="nav-ic">&#128465;</span><span>Lixeira</span>';
  if(backup) sidebar.insertBefore(a, backup);
  else sidebar.appendChild(a);
}

function _diasRestantes(it){
  var restam = Math.ceil(((it.excluidoEm || 0) + RETENCAO_MS - Date.now()) / 86400000);
  return restam > 0 ? restam : 0;
}

window.renderLixeira = function(){
  var el = document.getElementById('lixConteudo');
  if(!el) return;
  window.lixeiraPurgar();
  var itens = _itensVisiveis();

  var h = '';
  h += '<div class="lix-aviso">Itens exclu&iacute;dos ficam aqui por ' + RETENCAO_DIAS +
       ' dias e depois somem sozinhos.</div>';

  if(!itens.length){
    el.innerHTML = h + '<div class="lix-vazia"><div class="lix-vazia-ic">&#128465;</div>' +
      '<p>A lixeira est&aacute; vazia.</p></div>';
    return;
  }

  h += '<div class="lix-acoes"><span class="lix-conta">' + itens.length + ' ite' +
       (itens.length > 1 ? 'ns' : 'm') + '</span>' +
       '<button class="btn btn-danger btn-sm" onclick="lixeiraEsvaziar()">Esvaziar lixeira</button></div>';

  h += '<div class="lix-lista">';
  itens.forEach(function(it){
    var dias = _diasRestantes(it);
    h += '<div class="lix-item">';
    h += '<div class="lix-item-info">';
    h += '<div class="lix-item-top"><span class="lix-tag">' + (ROTULO_TIPO[it.tipo] || it.tipo) + '</span>';
    h += '<span class="lix-item-nome">' + (it.rotulo || '(sem descri&ccedil;&atilde;o)') + '</span></div>';
    if(it.detalhe) h += '<div class="lix-item-det">' + it.detalhe + '</div>';
    h += '<div class="lix-item-meta">Exclu&iacute;do em ' + _fmtD(new Date(it.excluidoEm).toISOString().slice(0, 10)) +
         ' &bull; some em ' + dias + ' dia' + (dias === 1 ? '' : 's') + '</div>';
    h += '</div>';
    h += '<div class="lix-item-btns">';
    h += '<button class="btn btn-success btn-sm" onclick="lixeiraRestaurar(\'' + it.lixoId + '\')">Restaurar</button>';
    h += '<button class="btn btn-outline btn-sm" onclick="lixeiraExcluirDef(\'' + it.lixoId + '\')">Excluir</button>';
    h += '</div>';
    h += '</div>';
  });
  h += '</div>';

  el.innerHTML = h;
};

// ================================================================
// Init
// ================================================================
addMenuLink();
criarPagina();
if(typeof registerPage === 'function') registerPage('lixeira', function(){ renderLixeira(); });
console.log('[Financeiro Pro] Lixeira v1 — retenção de ' + RETENCAO_DIAS + ' dias.');
})();

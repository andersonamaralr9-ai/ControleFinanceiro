// cartoes-fix.js v2 — Corrige cálculo + Adiciona edição de cartão
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
.cc-card-detail{font-size:.84em;color:var(--tx2);margin-bottom:4px;display:flex;justify-content:space-between;}
.cc-card-detail .cc-label{color:var(--tx3);font-size:.82em;}
.cc-card-detail .cc-val{font-weight:700;}
.cc-card-separator{height:1px;background:var(--bg4);margin:8px 0;}
.cc-bar-wrap{background:var(--bg3);border-radius:5px;height:8px;overflow:hidden;margin:8px 0 4px;}
.cc-bar-fill{height:100%;border-radius:5px;transition:width .5s;}
.cc-bar-ok{background:var(--okG);}
.cc-bar-warn{background:var(--wnG);}
.cc-bar-danger{background:var(--dnG);}
.cc-pct-label{font-size:.72em;color:var(--tx3);text-align:right;margin-bottom:6px;}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL DE EDIÇÃO DE CARTÃO
// ================================================================
var modalEditCC = document.createElement('div');
modalEditCC.className = 'modal';
modalEditCC.id = 'modalEditCartao';
modalEditCC.innerHTML =
  '<div class="modal-content"><div class="modal-header"><h3>Editar Cart\u00e3o</h3>' +
  '<span class="modal-close" onclick="closeM(\'modalEditCartao\')">&times;</span></div>' +
  '<div class="modal-body">' +
  '<div class="form-group" style="margin-bottom:12px"><label>Nome</label><input id="eccNome" class="form-control"></div>' +
  '<div class="form-group" style="margin-bottom:12px"><label>Bandeira</label><select id="eccBand" class="form-control">' +
  '<option>Mastercard</option><option>Visa</option><option>Elo</option><option>Amex</option><option>Outra</option></select></div>' +
  '<div class="form-group" style="margin-bottom:12px"><label>Limite (R$)</label><input id="eccLimite" class="form-control"></div>' +
  '<div class="form-group" style="margin-bottom:12px"><label>Dia Fechamento</label><input type="number" id="eccFecha" class="form-control" min="1" max="31"></div>' +
  '<div class="form-group" style="margin-bottom:12px"><label>Dia Vencimento</label><input type="number" id="eccVence" class="form-control" min="1" max="31"></div>' +
  '<input type="hidden" id="eccId">' +
  '<button class="btn btn-primary" onclick="window._updateCartao()" style="width:100%;margin-top:8px">Salvar</button>' +
  '</div></div>';
document.body.appendChild(modalEditCC);

// Abrir edição
window._editCartao = function(id){
  var c = S.cartoes.find(function(x){ return x.id === id; });
  if(!c) return;
  g('eccId').value = id;
  g('eccNome').value = c.nome || '';
  g('eccBand').value = c.bandeira || 'Mastercard';
  g('eccLimite').value = (c.limite || 0).toFixed(2).replace('.', ',');
  g('eccFecha').value = c.fechamento || 1;
  g('eccVence').value = c.vencimento || 10;
  openM('modalEditCartao');
};

// Salvar edição
window._updateCartao = function(){
  var id = g('eccId').value;
  var c = S.cartoes.find(function(x){ return x.id === id; });
  if(!c) return;
  c.nome = g('eccNome').value.trim();
  c.bandeira = g('eccBand').value;
  c.limite = parseN(g('eccLimite').value);
  c.fechamento = parseInt(g('eccFecha').value) || 1;
  c.vencimento = parseInt(g('eccVence').value) || 10;
  salvar();
  closeM('modalEditCartao');
  renderCartoes();
  if(typeof toast === 'function') toast('Cart\u00e3o atualizado!', 'success');
};

// ================================================================
// CÁLCULOS
// ================================================================
function calcSaldoDevedor(cid){
  var total = 0;
  var ma = mesAtual();
  S.comprasCartao.filter(function(c){ return c.cartaoId === cid; }).forEach(function(c){
    var p = c.parcelas || 1;
    var mC = getMes(c.data);
    var vp = (Number(c.valor) || 0) / p;
    for(var i = 0; i < p; i++){
      if(addMes(mC, i) >= ma) total += vp;
    }
  });
  return total;
}

function calcFaturaAtual(cid){
  var total = 0;
  var ma = mesAtual();
  S.comprasCartao.filter(function(c){ return c.cartaoId === cid; }).forEach(function(c){
    var p = c.parcelas || 1;
    var mC = getMes(c.data);
    var vp = (Number(c.valor) || 0) / p;
    for(var i = 0; i < p; i++){
      if(addMes(mC, i) === ma) total += vp;
    }
  });
  S.assinaturas.filter(function(s){
    return s.cartaoId === cid && !s.encerradaEm;
  }).forEach(function(s){
    var inicio = (s.inicio || '').substring(0, 7);
    if(inicio && ma < inicio) return;
    var val = Number(s.valor) || 0;
    var hist = Array.isArray(s.historico) ? s.historico : [];
    for(var h = 0; h < hist.length; h++){
      var hd = (hist[h].de || hist[h].desde || '').substring(0, 7);
      if(hd && ma >= hd) val = Number(hist[h].valor) || 0;
    }
    total += val;
  });
  return total;
}

function calcAssinaturasMensal(cid){
  var total = 0;
  var ma = mesAtual();
  S.assinaturas.filter(function(s){
    return s.cartaoId === cid && !s.encerradaEm;
  }).forEach(function(s){
    var inicio = (s.inicio || '').substring(0, 7);
    if(inicio && ma < inicio) return;
    var val = Number(s.valor) || 0;
    var hist = Array.isArray(s.historico) ? s.historico : [];
    for(var h = 0; h < hist.length; h++){
      var hd = (hist[h].de || hist[h].desde || '').substring(0, 7);
      if(hd && ma >= hd) val = Number(hist[h].valor) || 0;
    }
    total += val;
  });
  return total;
}

// ================================================================
// OVERRIDE: calcUsado
// ================================================================
window.calcUsado = function(cid){
  return calcSaldoDevedor(cid) + calcAssinaturasMensal(cid);
};

// ================================================================
// OVERRIDE: renderCartoes
// ================================================================
window.renderCartoes = function(){
  popCartSel();
  var ma = mesAtual();
  var html = '';

  if(S.cartoes.length){
    html = S.cartoes.map(function(c){
      var limite = Number(c.limite) || 0;
      var faturaAtual = calcFaturaAtual(c.id);
      var saldoDevedor = calcSaldoDevedor(c.id);
      var assinaturas = calcAssinaturasMensal(c.id);
      var usado = saldoDevedor + assinaturas;
      var disponivel = limite - usado;
      var pctUsado = limite ? Math.round(usado / limite * 100) : 0;

      var barClass = pctUsado > 90 ? 'cc-bar-danger' : pctUsado > 70 ? 'cc-bar-warn' : 'cc-bar-ok';
      var pctColor = pctUsado > 90 ? 'var(--dn2)' : pctUsado > 70 ? 'var(--wn)' : 'var(--ok)';

      // Compras ativas
      var comprasAtivas = 0;
      S.comprasCartao.filter(function(cp){ return cp.cartaoId === c.id; }).forEach(function(cp){
        var p = cp.parcelas || 1;
        var mC = getMes(cp.data);
        var ultimaParcela = addMes(mC, p - 1);
        if(ultimaParcela >= ma) comprasAtivas++;
      });

      var assinaturasAtivas = S.assinaturas.filter(function(s){
        return s.cartaoId === c.id && !s.encerradaEm;
      }).length;

      var r = '<div class="cc-card">';
      r += '<h4>' + c.nome + ' <small style="color:var(--tx3)">' + (c.bandeira || '') + '</small></h4>';

      // Limite
      r += '<div class="cc-card-detail"><span class="cc-label">Limite</span><span class="cc-val" style="color:var(--tx)">' + fmtV(limite) + '</span></div>';

      // Barra de uso
      r += '<div class="cc-bar-wrap"><div class="cc-bar-fill ' + barClass + '" style="width:' + Math.min(pctUsado, 100) + '%"></div></div>';
      r += '<div class="cc-pct-label" style="color:' + pctColor + '">' + pctUsado + '% utilizado</div>';

      r += '<div class="cc-card-separator"></div>';

      // Fatura Atual
      r += '<div class="cc-card-detail"><span class="cc-label">Fatura Atual (' + mesNome(ma) + ')</span><span class="cc-val" style="color:var(--wn)">' + fmtV(faturaAtual) + '</span></div>';

      // Parcelas restantes
      r += '<div class="cc-card-detail"><span class="cc-label">Parcelas Restantes</span><span class="cc-val" style="color:var(--dn2)">' + fmtV(saldoDevedor) + '</span></div>';

      // Assinaturas
      r += '<div class="cc-card-detail"><span class="cc-label">Assinaturas/m\u00eas</span><span class="cc-val" style="color:var(--pri2)">' + fmtV(assinaturas) + '</span></div>';

      r += '<div class="cc-card-separator"></div>';

      // Comprometido
      r += '<div class="cc-card-detail"><span class="cc-label"><strong>Comprometido Total</strong></span><span class="cc-val" style="color:var(--dn2)">' + fmtV(usado) + '</span></div>';

      // Disponível
      r += '<div class="cc-card-detail"><span class="cc-label"><strong>Dispon\u00edvel</strong></span><span class="cc-val" style="color:' + (disponivel >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(disponivel) + '</span></div>';

      r += '<div class="cc-card-separator"></div>';

      // Info
      r += '<p style="font-size:.78em;color:var(--tx3)">Fecha: dia ' + (c.fechamento || '-') + ' | Vence: dia ' + (c.vencimento || '-') + '</p>';
      r += '<p style="font-size:.78em;color:var(--tx3)">' + comprasAtivas + ' compra(s) ativa(s) | ' + assinaturasAtivas + ' assinatura(s)</p>';

      // AÇÕES: Editar + Excluir
      r += '<div style="margin-top:10px;display:flex;gap:6px">';
      r += '<button class="btn btn-sm btn-outline" onclick="window._editCartao(\'' + c.id + '\')" title="Editar cart\u00e3o">&#9998; Editar</button>';
      r += '<button class="btn btn-sm btn-danger" onclick="delCartao(\'' + c.id + '\')" title="Excluir cart\u00e3o">&#128465;</button>';
      r += '</div>';

      r += '</div>';
      return r;
    }).join('');
  } else {
    html = '<p style="color:var(--tx3)">Nenhum cart\u00e3o.</p>';
  }

  g('ccGrid').innerHTML = html;
};

console.log('[Financeiro Pro] Cart\u00f5es Fix v2 carregado.');

})();

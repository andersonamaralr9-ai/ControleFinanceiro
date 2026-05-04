// cartoes-fix.js — Corrige cálculo de "Usado" nos cartões de crédito
// Mostra: Fatura Atual (mês corrente), Saldo Devedor Total (parcelas restantes),
// e Disponível = Limite - Saldo Devedor
(function(){
'use strict';

// ================================================================
// NOVO CÁLCULO: Saldo devedor total do cartão
// Soma todas as parcelas RESTANTES (do mês atual em diante)
// + assinaturas ativas (1x mensal como compromisso)
// ================================================================
function calcSaldoDevedor(cid){
  var total = 0;
  var ma = mesAtual();

  S.comprasCartao.filter(function(c){ return c.cartaoId === cid; }).forEach(function(c){
    var p = c.parcelas || 1;
    var mC = getMes(c.data);
    var vp = (Number(c.valor) || 0) / p;

    for(var i = 0; i < p; i++){
      var mesParcela = addMes(mC, i);
      // Parcelas do mês atual em diante = saldo devedor
      if(mesParcela >= ma){
        total += vp;
      }
    }
  });

  return total;
}

// ================================================================
// NOVO CÁLCULO: Fatura do mês atual
// Parcelas que caem no mês corrente + assinaturas ativas
// ================================================================
function calcFaturaAtual(cid){
  var total = 0;
  var ma = mesAtual();

  S.comprasCartao.filter(function(c){ return c.cartaoId === cid; }).forEach(function(c){
    var p = c.parcelas || 1;
    var mC = getMes(c.data);
    var vp = (Number(c.valor) || 0) / p;

    for(var i = 0; i < p; i++){
      if(addMes(mC, i) === ma){
        total += vp;
      }
    }
  });

  // Assinaturas ativas no mês atual
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
// NOVO CÁLCULO: Total de compras brutas (valor original de todas as compras)
// ================================================================
function calcTotalCompras(cid){
  var total = 0;
  S.comprasCartao.filter(function(c){ return c.cartaoId === cid; }).forEach(function(c){
    total += Number(c.valor) || 0;
  });
  return total;
}

// ================================================================
// NOVO CÁLCULO: Total já pago (parcelas que já passaram)
// ================================================================
function calcJaPago(cid){
  var total = 0;
  var ma = mesAtual();

  S.comprasCartao.filter(function(c){ return c.cartaoId === cid; }).forEach(function(c){
    var p = c.parcelas || 1;
    var mC = getMes(c.data);
    var vp = (Number(c.valor) || 0) / p;

    for(var i = 0; i < p; i++){
      var mesParcela = addMes(mC, i);
      if(mesParcela < ma){
        total += vp;
      }
    }
  });

  return total;
}

// ================================================================
// CSS adicional para os cards melhorados
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
// OVERRIDE: calcUsado — agora retorna saldo devedor + assinaturas
// ================================================================
window.calcUsado = function(cid){
  var saldoDevedor = calcSaldoDevedor(cid);

  // Assinaturas ativas (valor mensal, como compromisso recorrente)
  var assinaturaMensal = 0;
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
    assinaturaMensal += val;
  });

  return saldoDevedor + assinaturaMensal;
};

// ================================================================
// OVERRIDE: renderCartoes — card com informações detalhadas
// ================================================================
var _origRenderCartoes = window.renderCartoes;

window.renderCartoes = function(){
  popCartSel();

  var html = '';
  if(S.cartoes.length){
    html = S.cartoes.map(function(c){
      var limite = Number(c.limite) || 0;
      var faturaAtual = calcFaturaAtual(c.id);
      var saldoDevedor = calcSaldoDevedor(c.id);
      var assinaturas = 0;
      var ma = mesAtual();

      S.assinaturas.filter(function(s){
        return s.cartaoId === c.id && !s.encerradaEm;
      }).forEach(function(s){
        var inicio = (s.inicio || '').substring(0, 7);
        if(inicio && ma < inicio) return;
        var val = Number(s.valor) || 0;
        var hist = Array.isArray(s.historico) ? s.historico : [];
        for(var h = 0; h < hist.length; h++){
          var hd = (hist[h].de || hist[h].desde || '').substring(0, 7);
          if(hd && ma >= hd) val = Number(hist[h].valor) || 0;
        }
        assinaturas += val;
      });

      var usado = saldoDevedor + assinaturas;
      var disponivel = limite - usado;
      var pctUsado = limite ? Math.round(usado / limite * 100) : 0;

      var barClass = pctUsado > 90 ? 'cc-bar-danger' : pctUsado > 70 ? 'cc-bar-warn' : 'cc-bar-ok';
      var pctColor = pctUsado > 90 ? 'var(--dn2)' : pctUsado > 70 ? 'var(--wn)' : 'var(--ok)';

      // Contar compras ativas (com parcelas restantes)
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

      // Saldo Devedor (parcelas restantes)
      r += '<div class="cc-card-detail"><span class="cc-label">Parcelas Restantes</span><span class="cc-val" style="color:var(--dn2)">' + fmtV(saldoDevedor) + '</span></div>';

      // Assinaturas mensais
      r += '<div class="cc-card-detail"><span class="cc-label">Assinaturas/mês</span><span class="cc-val" style="color:var(--pri2)">' + fmtV(assinaturas) + '</span></div>';

      r += '<div class="cc-card-separator"></div>';

      // Comprometido total (saldo devedor + assinaturas)
      r += '<div class="cc-card-detail"><span class="cc-label"><strong>Comprometido Total</strong></span><span class="cc-val" style="color:var(--dn2)">' + fmtV(usado) + '</span></div>';

      // Disponível
      r += '<div class="cc-card-detail"><span class="cc-label"><strong>Disponível</strong></span><span class="cc-val" style="color:' + (disponivel >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(disponivel) + '</span></div>';

      r += '<div class="cc-card-separator"></div>';

      // Info extra
      r += '<p style="font-size:.78em;color:var(--tx3)">Fecha: dia ' + (c.fechamento || '-') + ' | Vence: dia ' + (c.vencimento || '-') + '</p>';
      r += '<p style="font-size:.78em;color:var(--tx3)">' + comprasAtivas + ' compra(s) ativa(s) | ' + assinaturasAtivas + ' assinatura(s)</p>';

      // Ações
      r += '<div style="margin-top:10px"><button class="btn btn-sm btn-danger" onclick="delCartao(\'' + c.id + '\')">&#128465;</button></div>';
      r += '</div>';

      return r;
    }).join('');
  } else {
    html = '<p style="color:var(--tx3)">Nenhum cartão.</p>';
  }

  g('ccGrid').innerHTML = html;
};

console.log('[Financeiro Pro] Cartões Fix v1 carregado.');

})();

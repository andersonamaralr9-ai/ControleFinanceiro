// rent-saldo.js v1 — Lançar rentabilidade por VALOR ou por SALDO ATUAL
// Carrega DEPOIS de investimentos.js (e investimentos-enhanced.js se existir)
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── RENT SALDO ── */
.ri-mode-tabs{display:flex;gap:0;margin-bottom:16px;border-radius:8px;overflow:hidden;border:1px solid var(--bg4);}
.ri-mode-tab{flex:1;padding:10px 8px;text-align:center;cursor:pointer;font-size:.82em;font-weight:600;
  background:var(--bg3);color:var(--tx3);transition:all .2s;user-select:none;border:none;}
.ri-mode-tab:hover{color:var(--tx);}
.ri-mode-tab.active{background:var(--pri);color:#fff;}

.ri-calc-box{background:var(--bg3);border-radius:10px;padding:14px;margin-bottom:14px;display:none;}
.ri-calc-box.show{display:block;}
.ri-calc-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:.84em;}
.ri-calc-row .ri-calc-label{color:var(--tx2);}
.ri-calc-row .ri-calc-val{font-weight:700;}
.ri-calc-divider{border-top:1px solid var(--bg4);margin:6px 0;}
.ri-calc-result{font-size:1em;padding-top:6px;}
.ri-calc-result .ri-calc-val{font-size:1.1em;}

.ri-saldo-input-wrap{position:relative;}
.ri-saldo-input-wrap .ri-saldo-hint{
  position:absolute;right:12px;top:50%;transform:translateY(-50%);
  font-size:.72em;color:var(--tx3);pointer-events:none;
}

@media(max-width:768px){
  .ri-mode-tab{font-size:.75em;padding:10px 4px;}
}
`;
document.head.appendChild(sty);

// ================================================================
// HELPERS — replicar do investimentos.js (escopo IIFE)
// ================================================================
function fmt(v){
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function getInvRentTotal(inv){
  return (inv.rentabilidade || []).reduce(function(s,r){ return s + (Number(r.valor)||0); }, 0);
}
function getInvMovTotal(inv){
  return (inv.movimentacoes || []).reduce(function(s,m){
    var v = Number(m.valor) || 0;
    return s + (m.tipo === 'resgate' ? -v : v);
  }, 0);
}
function getInvCapitalAtual(inv){
  return (Number(inv.valor) || 0) + getInvMovTotal(inv);
}
function getInvSaldoAtual(inv){
  return getInvCapitalAtual(inv) + getInvRentTotal(inv);
}
function getInvRentMes(inv, mes){
  var found = (inv.rentabilidade || []).find(function(r){ return r.mes === mes; });
  return found ? (Number(found.valor) || 0) : 0;
}

// Saldo esperado do investimento ATÉ o mês selecionado (EXCLUINDO a rent desse mês)
// = valor original + todos os aportes/resgates + todas as rentabilidades de meses ANTERIORES
function calcSaldoEsperado(inv, mes){
  var base = Number(inv.valor) || 0;

  // Somar TODAS as movimentações (independente do mês)
  (inv.movimentacoes || []).forEach(function(m){
    var mMes = (m.data || '').substring(0,7);
    if(mMes && mMes <= mes){
      var v = Number(m.valor) || 0;
      if(m.tipo === 'resgate') base -= v; else base += v;
    }
  });

  // Somar rentabilidades de meses ANTERIORES ao mês selecionado
  (inv.rentabilidade || []).forEach(function(r){
    if(r.mes && r.mes < mes){
      base += Number(r.valor) || 0;
    }
  });

  return base;
}

// ================================================================
// SUBSTITUIR O MODAL DE RENTABILIDADE
// ================================================================
var modalEl = document.getElementById('modalRentInvest');
if(modalEl){
  var modalBody = modalEl.querySelector('.modal-body');
  if(modalBody){
    modalBody.innerHTML =
      // Abas de modo
      '<div class="ri-mode-tabs">' +
        '<button class="ri-mode-tab active" id="riTabValor" onclick="window._riSetMode(\'valor\')">Informar Rentabilidade</button>' +
        '<button class="ri-mode-tab" id="riTabSaldo" onclick="window._riSetMode(\'saldo\')">Informar Saldo Atual</button>' +
      '</div>' +

      // Campo mês (comum aos dois modos)
      '<div class="form-group" style="margin-bottom:12px">' +
        '<label>Mês de referência</label>' +
        '<input type="month" id="riMes" class="form-control" onchange="window._riRecalc()">' +
      '</div>' +

      // ===== MODO VALOR (original) =====
      '<div id="riModoValor">' +
        '<div class="form-group" style="margin-bottom:12px">' +
          '<label>Valor da Rentabilidade (R$)</label>' +
          '<input id="riValor" class="form-control" placeholder="150,00 ou -50,00">' +
        '</div>' +
        '<p style="font-size:.75em;color:var(--tx3);margin-bottom:12px">Positivo = ganho, negativo = perda.</p>' +
      '</div>' +

      // ===== MODO SALDO =====
      '<div id="riModoSaldo" style="display:none">' +
        // Caixa de cálculo (mostra saldo esperado)
        '<div class="ri-calc-box show" id="riCalcBox">' +
          '<div class="ri-calc-row"><span class="ri-calc-label">Capital investido</span><span class="ri-calc-val" id="riCalcCapital">-</span></div>' +
          '<div class="ri-calc-row"><span class="ri-calc-label">+ Aportes/Resgates</span><span class="ri-calc-val" id="riCalcMovs">-</span></div>' +
          '<div class="ri-calc-row"><span class="ri-calc-label">+ Rent. acumulada anterior</span><span class="ri-calc-val" id="riCalcRentAnt">-</span></div>' +
          '<div class="ri-calc-divider"></div>' +
          '<div class="ri-calc-row"><span class="ri-calc-label"><strong>Saldo esperado (sem rent. do mês)</strong></span><span class="ri-calc-val" style="color:var(--inf2)" id="riCalcEsperado">-</span></div>' +
        '</div>' +

        '<div class="form-group" style="margin-bottom:12px">' +
          '<label>Saldo Atual do Investimento (R$)</label>' +
          '<div class="ri-saldo-input-wrap">' +
            '<input id="riSaldoAtual" class="form-control" placeholder="Ex: 10.103,00" oninput="window._riRecalcSaldo()">' +
          '</div>' +
        '</div>' +

        // Resultado calculado
        '<div class="ri-calc-box show" id="riResultBox" style="border:1px solid var(--bg4)">' +
          '<div class="ri-calc-row ri-calc-result">' +
            '<span class="ri-calc-label"><strong>Rentabilidade calculada</strong></span>' +
            '<span class="ri-calc-val" id="riCalcResult" style="color:var(--tx3)">Informe o saldo</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<input type="hidden" id="riId">' +
      '<input type="hidden" id="riMode" value="valor">' +
      '<button class="btn btn-primary" onclick="window._invAddRent()" style="width:100%;margin-top:8px">Lançar</button>' +
      '<div id="riRentList" style="margin-top:16px"></div>';
  }
}

// ================================================================
// ESTADO DO MODO
// ================================================================
var currentMode = 'valor';

window._riSetMode = function(mode){
  currentMode = mode;
  var modeEl = document.getElementById('riMode');
  if(modeEl) modeEl.value = mode;

  var tabValor = document.getElementById('riTabValor');
  var tabSaldo = document.getElementById('riTabSaldo');
  var divValor = document.getElementById('riModoValor');
  var divSaldo = document.getElementById('riModoSaldo');

  if(mode === 'valor'){
    if(tabValor) tabValor.classList.add('active');
    if(tabSaldo) tabSaldo.classList.remove('active');
    if(divValor) divValor.style.display = '';
    if(divSaldo) divSaldo.style.display = 'none';
  } else {
    if(tabValor) tabValor.classList.remove('active');
    if(tabSaldo) tabSaldo.classList.add('active');
    if(divValor) divValor.style.display = 'none';
    if(divSaldo) divSaldo.style.display = '';
    window._riRecalc();
  }
};

// ================================================================
// RECALCULAR CAIXA DE INFORMAÇÃO (quando muda mês ou modo)
// ================================================================
window._riRecalc = function(){
  var id = (document.getElementById('riId') || {}).value;
  var mes = (document.getElementById('riMes') || {}).value;
  if(!id || !mes) return;

  var inv = (S.investimentos || []).find(function(x){ return x.id === id; });
  if(!inv) return;

  var capitalOriginal = Number(inv.valor) || 0;

  // Somar movimentações até o mês
  var totalMovs = 0;
  (inv.movimentacoes || []).forEach(function(m){
    var mMes = (m.data || '').substring(0,7);
    if(mMes && mMes <= mes){
      var v = Number(m.valor) || 0;
      if(m.tipo === 'resgate') totalMovs -= v; else totalMovs += v;
    }
  });

  // Somar rent anterior
  var rentAnterior = 0;
  (inv.rentabilidade || []).forEach(function(r){
    if(r.mes && r.mes < mes){
      rentAnterior += Number(r.valor) || 0;
    }
  });

  var esperado = capitalOriginal + totalMovs + rentAnterior;

  var elCap = document.getElementById('riCalcCapital');
  var elMovs = document.getElementById('riCalcMovs');
  var elRentAnt = document.getElementById('riCalcRentAnt');
  var elEsperado = document.getElementById('riCalcEsperado');

  if(elCap) elCap.textContent = fmt(capitalOriginal);
  if(elMovs){
    elMovs.textContent = (totalMovs >= 0 ? '+ ' : '') + fmt(totalMovs);
    elMovs.style.color = totalMovs >= 0 ? 'var(--ok)' : 'var(--dn2)';
  }
  if(elRentAnt){
    elRentAnt.textContent = (rentAnterior >= 0 ? '+ ' : '') + fmt(rentAnterior);
    elRentAnt.style.color = rentAnterior >= 0 ? 'var(--ok)' : 'var(--dn2)';
  }
  if(elEsperado) elEsperado.textContent = fmt(esperado);

  // Limpar resultado
  var elResult = document.getElementById('riCalcResult');
  if(elResult){
    elResult.textContent = 'Informe o saldo';
    elResult.style.color = 'var(--tx3)';
  }

  // Se já tem saldo preenchido, recalcular
  window._riRecalcSaldo();
};

// ================================================================
// RECALCULAR RENTABILIDADE A PARTIR DO SALDO (quando digita)
// ================================================================
window._riRecalcSaldo = function(){
  var id = (document.getElementById('riId') || {}).value;
  var mes = (document.getElementById('riMes') || {}).value;
  var saldoStr = (document.getElementById('riSaldoAtual') || {}).value;
  var elResult = document.getElementById('riCalcResult');

  if(!id || !mes || !saldoStr.trim()){
    if(elResult){
      elResult.textContent = 'Informe o saldo';
      elResult.style.color = 'var(--tx3)';
    }
    return;
  }

  var inv = (S.investimentos || []).find(function(x){ return x.id === id; });
  if(!inv) return;

  var saldoInformado = parseN(saldoStr);
  var esperado = calcSaldoEsperado(inv, mes);
  var rentCalculada = saldoInformado - esperado;

  if(elResult){
    var color = rentCalculada >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var prefix = rentCalculada > 0 ? '+ ' : '';
    elResult.textContent = prefix + fmt(rentCalculada);
    elResult.style.color = color;

    // Adicionar % se possível
    if(esperado > 0){
      var pct = (rentCalculada / esperado) * 100;
      elResult.textContent += '  (' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%)';
    }
  }
};

// ================================================================
// OVERRIDE _invOpenRent — resetar o modo e recalcular
// ================================================================
var _origOpenRent = window._invOpenRent;
window._invOpenRent = function(id){
  // Resetar para modo valor
  currentMode = 'valor';
  var modeEl = document.getElementById('riMode');
  if(modeEl) modeEl.value = 'valor';

  // Chamar original (que preenche riId, riMes, etc.)
  if(_origOpenRent) _origOpenRent(id);

  // Garantir que as abas estão certas
  window._riSetMode('valor');

  // Limpar campo saldo
  var saldoInput = document.getElementById('riSaldoAtual');
  if(saldoInput) saldoInput.value = '';

  // Preencher caixa de cálculo (para quando trocar para modo saldo)
  setTimeout(function(){ window._riRecalc(); }, 50);
};

// ================================================================
// OVERRIDE _invAddRent — usar modo correto
// ================================================================
window._invAddRent = function(){
  var id = (document.getElementById('riId') || {}).value;
  var inv = (S.investimentos || []).find(function(x){ return x.id === id; });
  if(!inv) return;

  var mes = (document.getElementById('riMes') || {}).value;
  if(!mes) return alert('Selecione o mês.');

  var mode = (document.getElementById('riMode') || {}).value || 'valor';
  var valor = 0;

  if(mode === 'saldo'){
    // Calcular a partir do saldo informado
    var saldoStr = (document.getElementById('riSaldoAtual') || {}).value;
    if(!saldoStr.trim()) return alert('Informe o saldo atual do investimento.');
    var saldoInformado = parseN(saldoStr);
    var esperado = calcSaldoEsperado(inv, mes);
    valor = saldoInformado - esperado;

    if(valor === 0){
      if(!confirm('A rentabilidade calculada é R$ 0,00. Deseja lançar mesmo assim?')) return;
    }
  } else {
    // Modo valor (original)
    valor = parseN((document.getElementById('riValor') || {}).value);
    if(valor === 0) return alert('Informe o valor.');
  }

  if(!Array.isArray(inv.rentabilidade)) inv.rentabilidade = [];
  var existing = inv.rentabilidade.find(function(r){ return r.mes === mes; });
  if(existing){
    if(!confirm('Substituir valor de ' + mesNome(mes) + '?\n\nAtual: ' + fmt(existing.valor) + '\nNovo: ' + fmt(valor))) return;
    existing.valor = valor;
  } else {
    inv.rentabilidade.push({ mes: mes, valor: valor });
  }

  salvar();

  // Limpar campos
  var riValor = document.getElementById('riValor');
  var riSaldo = document.getElementById('riSaldoAtual');
  if(riValor) riValor.value = '';
  if(riSaldo) riSaldo.value = '';

  // Atualizar lista e tela
  _invRenderRentListOverride(inv);
  renderInvest();
};

// ================================================================
// OVERRIDE _invRenderRentList (precisa replicar pois é closure)
// ================================================================
function _invRenderRentListOverride(inv){
  var el = document.getElementById('riRentList');
  if(!el) return;
  var rents = (inv.rentabilidade || []).slice().sort(function(a,b){ return (b.mes||'').localeCompare(a.mes||''); });
  if(!rents.length){
    el.innerHTML = '<p style="color:var(--tx3);text-align:center;font-size:.85em">Nenhuma rentabilidade.</p>';
    return;
  }
  var totalR = rents.reduce(function(s,r){ return s + (Number(r.valor)||0); }, 0);
  var h = '<div style="font-size:.82em;font-weight:700;margin-bottom:8px;color:var(--tx2)">Histórico</div><div style="max-height:200px;overflow-y:auto">';
  rents.forEach(function(r){
    var rv = Number(r.valor) || 0;
    var idEsc = inv.id.replace(/'/g, "\\'");
    var mesEsc = r.mes.replace(/'/g, "\\'");
    h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bg3);font-size:.82em">' +
      '<span>' + mesNome(r.mes) + '</span>' +
      '<span style="font-weight:700;color:' + (rv >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rv > 0 ? '+ ' : '') + fmt(rv) + '</span>' +
      '<button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:.7em" onclick="window._invDelRent(\'' + idEsc + '\',\'' + mesEsc + '\')">&#128465;</button></div>';
  });
  h += '</div>';
  h += '<div style="text-align:right;font-weight:700;margin-top:8px;color:' + (totalR >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">Total: ' + (totalR > 0 ? '+ ' : '') + fmt(totalR) + '</div>';
  el.innerHTML = h;
}

// Também overridar o _invOpenRent para usar nosso render de lista
var _origOpenRent2 = window._invOpenRent;
// (já overridamos acima, incluindo o render da lista — ok)

console.log('[Financeiro Pro] Rent-Saldo v1 — Lançar por valor ou saldo atual carregado.');
})();

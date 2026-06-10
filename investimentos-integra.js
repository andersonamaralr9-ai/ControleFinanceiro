// investimentos-integra.js v1 — Integração Investimentos ↔ Lançamentos
// Aportes geram lançamento de despesa "Investimento"
// Resgates geram lançamento de receita "Investimento"
// Painel de investimento acessível pela tela de Lançamentos
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── INTEGRAÇÃO INVEST ↔ LANÇ ── */

.inv-integ-btn{
  background:linear-gradient(135deg,#6c5ce7,#a29bfe);
  color:#fff;border:none;border-radius:8px;
  padding:10px 20px;font-size:.83em;font-weight:600;
  cursor:pointer;transition:all .2s;
  display:inline-flex;align-items:center;gap:6px;
}
.inv-integ-btn:hover{opacity:.9;transform:translateY(-1px);}

.inv-panel{
  background:var(--bg2);border:1px solid var(--bg4);
  border-radius:var(--rad);padding:20px;
  box-shadow:var(--sh);margin-bottom:24px;
  display:none;
}
.inv-panel.show{display:block;}
.inv-panel h3{font-size:.95em;margin-bottom:16px;color:var(--tx2);font-weight:600;}

.inv-panel-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:14px;
}

.inv-panel-card{
  background:var(--bg3);border:1px solid var(--bg4);
  border-radius:10px;padding:16px;transition:transform .15s;
}
.inv-panel-card:hover{transform:translateY(-2px);}
.inv-panel-card-header{
  display:flex;justify-content:space-between;align-items:center;
  margin-bottom:12px;
}
.inv-panel-card-header strong{font-size:.92em;}
.inv-panel-card-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:3px 0;font-size:.82em;
}
.inv-panel-card-row .lbl{color:var(--tx3);}
.inv-panel-card-row .val{font-weight:700;}

.inv-panel-form{
  display:flex;gap:10px;align-items:end;flex-wrap:wrap;
  margin-top:12px;padding-top:12px;
  border-top:1px solid var(--bg4);
}
.inv-panel-form .form-group{flex:1;min-width:100px;}
.inv-panel-form .form-group label{font-size:.7em;color:var(--tx3);font-weight:600;display:block;margin-bottom:3px;}
.inv-panel-form input,.inv-panel-form select{
  background:var(--bg2);border:1px solid var(--bg4);
  border-radius:6px;padding:8px 10px;color:var(--tx);
  font-size:.82em;width:100%;
}
.inv-panel-form input:focus,.inv-panel-form select:focus{
  outline:none;border-color:var(--pri);
}
.inv-panel-form .btn{white-space:nowrap;padding:8px 16px;font-size:.78em;}

.inv-panel-card .saldo-projecao{
  margin-top:8px;padding:8px 10px;
  background:var(--bg2);border-radius:8px;
  font-size:.78em;display:none;
}
.inv-panel-card .saldo-projecao.show{display:block;}
.inv-panel-card .saldo-projecao .proj-row{
  display:flex;justify-content:space-between;padding:2px 0;
}
.inv-panel-card .saldo-projecao .proj-row .proj-lbl{color:var(--tx3);}
.inv-panel-card .saldo-projecao .proj-row .proj-val{font-weight:700;}

.inv-lanc-badge{
  display:inline-block;padding:2px 8px;border-radius:12px;
  font-size:.65em;font-weight:700;margin-left:6px;
  background:rgba(108,92,231,.15);color:var(--pri2);
  vertical-align:middle;
}

/* Resumo na panel */
.inv-panel-summary{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
  gap:10px;margin-bottom:16px;
}
.inv-panel-summary .ips-card{
  background:var(--bg3);border-radius:8px;padding:12px;text-align:center;
}
.inv-panel-summary .ips-label{font-size:.68em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.inv-panel-summary .ips-val{font-size:1.05em;font-weight:700;}

@media(max-width:768px){
  .inv-panel-grid{grid-template-columns:1fr;}
  .inv-panel-form{flex-direction:column;}
  .inv-panel-form .form-group{min-width:100%;}
  .inv-panel-summary{grid-template-columns:1fr 1fr;}
}
`;
document.head.appendChild(sty);

// ================================================================
// HELPERS (reutiliza do investimentos.js via window)
// ================================================================
function _fmt(v){
  return 'R$ '+(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function _getCapital(inv){
  var base = Number(inv.valor)||0;
  (inv.movimentacoes||[]).forEach(function(m){
    var v = Number(m.valor)||0;
    base += m.tipo==='resgate'? -v : v;
  });
  return base;
}
function _getRent(inv){
  return (inv.rentabilidade||[]).reduce(function(s,r){return s+(Number(r.valor)||0);},0);
}
function _getSaldo(inv){
  return _getCapital(inv) + _getRent(inv);
}

// ================================================================
// CRIAR LANÇAMENTO AUTOMÁTICO
// ================================================================
function criarLancamentoInvestimento(tipo, valor, invNome, data, obs){
  // tipo: 'aporte' → despesa; 'resgate' → receita
  var lancTipo = tipo === 'aporte' ? 'despesa' : 'receita';
  var desc = tipo === 'aporte'
    ? 'Aporte - ' + invNome
    : 'Resgate - ' + invNome;

  S.lancamentos.push({
    id: uid(),
    tipo: lancTipo,
    desc: desc,
    categoria: 'Investimento',
    valor: valor,
    data: data,
    status: 'confirmado',
    obs: obs || '',
    origemInvest: true  // flag para identificar lançamentos automáticos
  });
}

// ================================================================
// OVERRIDE _invAddMov — interceptar para criar lançamento
// ================================================================
var _origInvAddMov = window._invAddMov;

window._invAddMov = function(){
  var id = document.getElementById('miId').value;
  var inv = S.investimentos.find(function(x){ return x.id === id; });
  if(!inv) return;

  var tipo = document.getElementById('miTipo').value;
  var valor = parseN(document.getElementById('miValor').value);
  var data = document.getElementById('miData').value;
  var obs = document.getElementById('miObs').value.trim();

  if(!valor || valor <= 0) return alert('Valor inválido.');
  if(!data) return alert('Informe a data.');

  if(tipo === 'resgate'){
    var saldoAtual = _getSaldo(inv);
    if(valor > saldoAtual) return alert('Valor excede o saldo ('+_fmt(saldoAtual)+').');
  }

  // Adiciona movimentação
  if(!Array.isArray(inv.movimentacoes)) inv.movimentacoes = [];
  inv.movimentacoes.push({tipo:tipo, valor:valor, data:data, obs:obs, id:uid()});

  // Lançamento: aporte pergunta, resgate sempre cria
  var gerarLanc = tipo === 'resgate' ||
    confirm('Deseja gerar um lançamento de despesa em "Investimento" para este aporte?');
  if(gerarLanc){
    criarLancamentoInvestimento(tipo, valor, inv.nome||'Investimento', data, obs);
  }

  salvar();
  document.getElementById('miValor').value = '';
  document.getElementById('miObs').value = '';

  // Atualiza UI
  if(typeof _invRenderMovList === 'function'){
    _invRenderMovList(inv);
  } else {
    var el = document.getElementById('miMovList');
    if(el) el.innerHTML = '<p style="color:var(--tx3);text-align:center;font-size:.85em">Movimentação adicionada.</p>';
  }
  if(typeof renderInvest === 'function') renderInvest();

  _invIntegToast(tipo === 'aporte'
    ? 'Aporte de '+_fmt(valor)+' registrado!' + (gerarLanc ? ' Lançamento de despesa criado.' : '')
    : 'Resgate de '+_fmt(valor)+' registrado + lançamento de receita criado!'
  );
};

// ================================================================
// OVERRIDE addInvest — investimento inicial também gera lançamento
// ================================================================
var _origAddInvest = window.addInvest;

window.addInvest = function(){
  var nome = document.getElementById('invNome').value.trim();
  var tipo = document.getElementById('invTipo').value;
  var valor = parseN(document.getElementById('invValor').value);
  var data = document.getElementById('invData').value;
  var obs = document.getElementById('invObs').value.trim();

  if(!nome || !valor || !data) return alert('Preencha tudo.');

  S.investimentos.push({
    id: uid(), nome:nome, tipo:tipo, valor:valor,
    data:data, obs:obs,
    movimentacoes:[], rentabilidade:[]
  });

  // Pergunta se deve gerar lançamento de despesa para o aporte inicial
  var gerarLanc = confirm('Deseja gerar um lançamento de despesa em "Investimento" para este aporte inicial de '+_fmt(valor)+'?');
  if(gerarLanc){
    criarLancamentoInvestimento('aporte', valor, nome, data, 'Investimento inicial'+(obs?' - '+obs:''));
  }

  salvar();
  document.getElementById('invNome').value='';
  document.getElementById('invValor').value='';
  document.getElementById('invObs').value='';
  if(typeof renderInvest === 'function') renderInvest();

  _invIntegToast('Investimento "'+nome+'" criado!' + (gerarLanc ? ' Lançamento de despesa gerado.' : ''));
};

// ================================================================
// PAINEL DE INVESTIMENTOS NA TELA DE LANÇAMENTOS
// ================================================================
function injectInvestPanel(){
  var pgLancs = document.getElementById('pg-lancs');
  if(!pgLancs) return;
  if(document.getElementById('invPanelLancs')) return; // já injetado

  // Botão toggle
  var btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;';
  btnWrap.innerHTML = '<button class="inv-integ-btn" onclick="window._toggleInvPanel()">'+
    '&#128184; Investir / Resgatar</button>';

  // Painel
  var panel = document.createElement('div');
  panel.id = 'invPanelLancs';
  panel.className = 'inv-panel';

  // Inserir após o formulário de lançamentos
  var formSection = pgLancs.querySelector('.form-section');
  if(formSection){
    formSection.parentNode.insertBefore(btnWrap, formSection.nextSibling);
    formSection.parentNode.insertBefore(panel, btnWrap.nextSibling);
  }
}

window._toggleInvPanel = function(){
  var panel = document.getElementById('invPanelLancs');
  if(!panel) return;
  panel.classList.toggle('show');
  if(panel.classList.contains('show')){
    _renderInvPanel();
  }
};

function _renderInvPanel(){
  var panel = document.getElementById('invPanelLancs');
  if(!panel) return;

  var invs = S.investimentos || [];
  var totalSaldo = 0, totalCapital = 0, totalRent = 0;

  invs.forEach(function(inv){
    totalCapital += _getCapital(inv);
    totalRent += _getRent(inv);
    totalSaldo += _getSaldo(inv);
  });

  var h = '';
  h += '<h3>&#128184; Investimentos — Aporte & Resgate Rápido</h3>';

  // Resumo
  h += '<div class="inv-panel-summary">';
  h += '<div class="ips-card"><div class="ips-label">Capital Total</div><div class="ips-val" style="color:var(--inf2)">'+_fmt(totalCapital)+'</div></div>';
  h += '<div class="ips-card"><div class="ips-label">Rentabilidade</div><div class="ips-val" style="color:'+(totalRent>=0?'var(--ok)':'var(--dn2)')+'">'+_fmt(totalRent)+'</div></div>';
  h += '<div class="ips-card"><div class="ips-label">Saldo Total</div><div class="ips-val" style="color:'+(totalSaldo>=0?'var(--ok)':'var(--dn2)')+'">'+_fmt(totalSaldo)+'</div></div>';
  h += '<div class="ips-card"><div class="ips-label">Ativos</div><div class="ips-val" style="color:var(--pri2)">'+invs.length+'</div></div>';
  h += '</div>';

  if(!invs.length){
    h += '<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum investimento cadastrado. Vá para a tela de Investimentos para criar um.</p>';
  } else {
    h += '<div class="inv-panel-grid">';
    invs.forEach(function(inv, idx){
      var saldo = _getSaldo(inv);
      var capital = _getCapital(inv);
      var rent = _getRent(inv);
      var rentPct = capital > 0 ? ((rent/capital)*100) : 0;
      var idEsc = inv.id.replace(/'/g,"\\'");

      h += '<div class="inv-panel-card" id="invPanelCard_'+inv.id+'">';
      h += '<div class="inv-panel-card-header">';
      h += '<strong>'+(inv.nome||'-')+'</strong>';
      h += '<span class="badge badge-info">'+(inv.tipo||'Outro')+'</span>';
      h += '</div>';

      h += '<div class="inv-panel-card-row"><span class="lbl">Capital</span><span class="val" style="color:var(--inf2)">'+_fmt(capital)+'</span></div>';
      h += '<div class="inv-panel-card-row"><span class="lbl">Rentabilidade</span><span class="val" style="color:'+(rent>=0?'var(--ok)':'var(--dn2)')+'">'+_fmt(rent)+' ('+(rentPct>0?'+':'')+rentPct.toFixed(1)+'%)</span></div>';
      h += '<div class="inv-panel-card-row" style="padding-top:4px;border-top:1px solid var(--bg4)"><span class="lbl" style="font-weight:700">Saldo Atual</span><span class="val" style="font-size:1.05em;color:'+(saldo>=0?'var(--ok)':'var(--dn2)')+'">'+_fmt(saldo)+'</span></div>';

      // Projeção (aparece ao digitar valor)
      h += '<div class="saldo-projecao" id="invProj_'+inv.id+'">';
      h += '<div class="proj-row"><span class="proj-lbl">Saldo após operação</span><span class="proj-val" id="invProjVal_'+inv.id+'">-</span></div>';
      h += '</div>';

      // Formulário rápido
      h += '<div class="inv-panel-form">';
      h += '<div class="form-group"><label>Tipo</label><select id="ipTipo_'+inv.id+'" onchange="window._invPanelCalcProj(\''+idEsc+'\')">';
      h += '<option value="aporte">Aporte</option><option value="resgate">Resgate</option></select></div>';
      h += '<div class="form-group"><label>Valor (R$)</label><input id="ipValor_'+inv.id+'" placeholder="0,00" oninput="window._invPanelCalcProj(\''+idEsc+'\')"></div>';
      h += '<div class="form-group"><label>Data</label><input type="date" id="ipData_'+inv.id+'" value="'+hojeStr()+'"></div>';
      h += '<button class="btn btn-primary btn-sm" onclick="window._invPanelConfirm(\''+idEsc+'\')">Confirmar</button>';
      h += '</div>';

      h += '</div>';
    });
    h += '</div>';
  }

  panel.innerHTML = h;
}

// Calcular projeção ao digitar valor
window._invPanelCalcProj = function(invId){
  var inv = S.investimentos.find(function(x){return x.id===invId;});
  if(!inv) return;

  var tipoEl = document.getElementById('ipTipo_'+invId);
  var valorEl = document.getElementById('ipValor_'+invId);
  var projDiv = document.getElementById('invProj_'+invId);
  var projValEl = document.getElementById('invProjVal_'+invId);

  if(!tipoEl || !valorEl || !projDiv || !projValEl) return;

  var tipo = tipoEl.value;
  var valor = parseN(valorEl.value);

  if(!valor || valor <= 0){
    projDiv.classList.remove('show');
    return;
  }

  var saldoAtual = _getSaldo(inv);
  var saldoApos = tipo === 'aporte' ? saldoAtual + valor : saldoAtual - valor;

  projDiv.classList.add('show');

  var corSaldo = saldoApos >= 0 ? 'var(--ok)' : 'var(--dn2)';
  var warn = '';
  if(tipo === 'resgate' && valor > saldoAtual){
    warn = '<div style="color:var(--dn2);font-size:.75em;margin-top:4px">⚠️ Valor excede o saldo!</div>';
  }

  projValEl.innerHTML = '<span style="color:'+corSaldo+'">'+_fmt(saldoApos)+'</span>'+warn;
};

// Confirmar aporte/resgate pelo painel
window._invPanelConfirm = function(invId){
  var inv = S.investimentos.find(function(x){return x.id===invId;});
  if(!inv) return;

  var tipo = document.getElementById('ipTipo_'+invId).value;
  var valor = parseN(document.getElementById('ipValor_'+invId).value);
  var data = document.getElementById('ipData_'+invId).value;

  if(!valor || valor <= 0) return alert('Informe o valor.');
  if(!data) return alert('Informe a data.');

  if(tipo === 'resgate'){
    var saldoAtual = _getSaldo(inv);
    if(valor > saldoAtual) return alert('Valor excede o saldo ('+_fmt(saldoAtual)+').');
  }

  // Adiciona movimentação no investimento
  if(!Array.isArray(inv.movimentacoes)) inv.movimentacoes = [];
  inv.movimentacoes.push({tipo:tipo, valor:valor, data:data, obs:'Via Lançamentos', id:uid()});

  // Lançamento: aporte pergunta, resgate sempre cria
  var gerarLanc = tipo === 'resgate' ||
    confirm('Deseja gerar um lançamento de despesa em "Investimento" para este aporte de '+_fmt(valor)+'?');
  if(gerarLanc){
    criarLancamentoInvestimento(tipo, valor, inv.nome||'Investimento', data, 'Via painel de lançamentos');
  }

  salvar();

  document.getElementById('ipValor_'+invId).value = '';
  var projDiv = document.getElementById('invProj_'+invId);
  if(projDiv) projDiv.classList.remove('show');

  _renderInvPanel();
  if(typeof renderLancs === 'function') renderLancs();
  if(typeof renderInvest === 'function') renderInvest();

  _invIntegToast(tipo === 'aporte'
    ? 'Aporte de '+_fmt(valor)+' em "'+inv.nome+'" confirmado!' + (gerarLanc ? ' Lançamento de despesa criado.' : '')
    : 'Resgate de '+_fmt(valor)+' de "'+inv.nome+'" confirmado! Lançamento de receita criado.'
  );
};

// ================================================================
// TOAST
// ================================================================
function _invIntegToast(msg){
  var existing = document.getElementById('invIntegToast');
  if(existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'invIntegToast';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--ok);color:#fff;'+
    'padding:14px 20px;border-radius:10px;font-size:.88em;font-weight:600;'+
    'box-shadow:0 8px 30px rgba(0,0,0,.3);z-index:9999;max-width:400px;'+
    'animation:invToastIn .3s ease;';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(function(){
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(function(){ toast.remove(); }, 300);
  }, 3500);
}

// Animação do toast
var toastAnim = document.createElement('style');
toastAnim.textContent = '@keyframes invToastIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}';
document.head.appendChild(toastAnim);

// ================================================================
// HOOK: injetar painel quando renderLancs é chamado
// ================================================================
var _origRenderLancs = window.renderLancs;
window.renderLancs = function(){
  if(_origRenderLancs) _origRenderLancs();
  injectInvestPanel();
  // Se o painel já estava aberto, manter aberto e atualizar
  var panel = document.getElementById('invPanelLancs');
  if(panel && panel.classList.contains('show')){
    _renderInvPanel();
  }
};

// ================================================================
// MARCAR LANÇAMENTOS AUTOMÁTICOS NA TABELA
// ================================================================
var _origAllEntries = window.allEntries;
if(_origAllEntries){
  // Não precisamos override aqui, mas podemos marcar os lançamentos
  // que vieram de investimento para exibição diferenciada
}

// ================================================================
// GARANTIR QUE CATEGORIA "Investimento" EXISTA
// ================================================================
function ensureInvestCat(){
  if(!S || !S.cats) return;
  ['receita','despesa'].forEach(function(tipo){
    if(!S.cats[tipo]) return;
    if(S.cats[tipo].indexOf('Investimento') === -1){
      S.cats[tipo].push('Investimento');
    }
  });
}

// ================================================================
// INIT
// ================================================================
var _origLoad = window.load;
var _initTimer = setInterval(function(){
  if(typeof S !== 'undefined' && S && S.cats){
    clearInterval(_initTimer);
    ensureInvestCat();
  }
}, 200);

// Também garante ao salvar
var _origSalvar = window.salvar;
if(_origSalvar){
  window.salvar = function(){
    ensureInvestCat();
    _origSalvar();
  };
}

console.log('[Financeiro Pro] Integração Investimentos ↔ Lançamentos v1 carregada.');
})();

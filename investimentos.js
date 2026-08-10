// investimentos.js v7 — redesign completo (mockup aprovado)
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
// CSS movido para app.css (bloco 1 deste arquivo)

// ================================================================
// INJETAR HTML (overlay panel + modal novo ativo)
// ================================================================
(function injectHTML(){
  if(document.getElementById('invOverlay')) return;

  var ov = document.createElement('div');
  ov.className = 'inv-overlay';
  ov.id = 'invOverlay';
  ov.onclick = function(e){ if(e.target === ov) invClosePanel(); };
  ov.innerHTML =
    '<div class="inv-panel">' +
      '<div class="inv-panel-head">' +
        '<div><div class="inv-panel-title" id="invPTitle"></div><div class="inv-panel-sub" id="invPSub"></div></div>' +
        '<button class="inv-px" onclick="invClosePanel()">&#10005;</button>' +
      '</div>' +
      '<div class="inv-panel-kpis" id="invPKpis"></div>' +
      '<div class="inv-pmn">' +
        '<button class="inv-pmn-btn" onclick="invChgPMes(-1)">&#9664;</button>' +
        '<span class="inv-pmn-label" id="invPMesLabel"></span>' +
        '<button class="inv-pmn-btn" onclick="invChgPMes(1)">&#9654;</button>' +
      '</div>' +
      '<div class="inv-panel-tabs">' +
        '<button class="inv-tab on" id="invTabRent" onclick="invSwitchTab(\'rent\')">&#128200; Rentabilidade</button>' +
        '<button class="inv-tab" id="invTabMov" onclick="invSwitchTab(\'mov\')">&#128260; Movimenta&ccedil;&otilde;es</button>' +
      '</div>' +
      '<div class="inv-panel-body">' +
        '<div class="inv-tp on" id="invTpRent">' +
          '<div id="invRentMesInfo"></div>' +
          '<div id="invRentHist"></div>' +
          '<div class="inv-ifrm">' +
            '<span class="inv-ifrm-lbl">&#65291; Lan&ccedil;ar rentabilidade</span>' +
            '<div class="inv-rmodo">' +
              '<button class="inv-rmodo-btn on" id="invRModoValBtn" onclick="invSetRModo(\'valor\')">Valor (R$)</button>' +
              '<button class="inv-rmodo-btn" id="invRModoSaldoBtn" onclick="invSetRModo(\'saldo\')">Saldo atual</button>' +
            '</div>' +
            '<div class="inv-ifrm-row">' +
              '<input class="inv-ii" type="month" id="invFiRMes" style="max-width:140px" oninput="invCalcRentPreview()">' +
              '<input class="inv-ii" placeholder="R$ rentabilidade" inputmode="decimal" id="invFiRVal">' +
              '<input class="inv-ii" placeholder="R$ saldo atual" inputmode="decimal" id="invFiRSaldo" style="display:none" oninput="invCalcRentPreview()">' +
              '<button class="inv-ib" onclick="invAddRent()">Salvar</button>' +
            '</div>' +
            '<div class="inv-rcalc" id="invFiRCalc"></div>' +
          '</div>' +
        '</div>' +
        '<div class="inv-tp" id="invTpMov">' +
          '<div id="invMovMesInfo"></div>' +
          '<div id="invMovHist"></div>' +
          '<div class="inv-ifrm">' +
            '<span class="inv-ifrm-lbl">&#65291; Aporte / Resgate</span>' +
            '<div class="inv-ifrm-row">' +
              '<select class="inv-ii" id="invFiMTipo" style="max-width:105px"><option value="aporte">Aporte</option><option value="resgate">Resgate</option></select>' +
              '<input class="inv-ii" type="date" id="invFiMData" style="max-width:135px">' +
              '<input class="inv-ii" placeholder="R$ valor" inputmode="decimal" id="invFiMVal">' +
              '<button class="inv-ib" onclick="invAddMov()">Salvar</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="inv-panel-acts">' +
        '<button class="inv-pa" onclick="invEditarAtivo()">&#9998; Editar</button>' +
        '<button class="inv-pa danger" onclick="invExcluirAtivo()">&#128465; Excluir</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  var mn = document.createElement('div');
  mn.className = 'inv-modal-ov';
  mn.id = 'invModalNovo';
  mn.onclick = function(e){ if(e.target === mn) invCloseNovoAtivo(); };
  mn.innerHTML =
    '<div class="inv-modal-box">' +
      '<div class="inv-modal-head">' +
        '<h3 id="invModalNovoTitle">&#65291; Novo Ativo</h3>' +
        '<button class="inv-px" onclick="invCloseNovoAtivo()">&#10005;</button>' +
      '</div>' +
      '<div class="inv-modal-body">' +
        '<div class="inv-fg"><label>Nome do ativo</label><input class="inv-fc" id="invNaNome" placeholder="Ex: Tesouro IPCA+ 2029"></div>' +
        '<div class="inv-fg-row">' +
          '<div class="inv-fg"><label>Tipo</label><select class="inv-fc" id="invNaTipo"></select></div>' +
          '<div class="inv-fg"><label>Valor inicial (R$)</label><input class="inv-fc" id="invNaValor" placeholder="0,00" inputmode="decimal"></div>' +
        '</div>' +
        '<div class="inv-fg"><label>Data de in&iacute;cio</label><input class="inv-fc" type="date" id="invNaData"></div>' +
        '<div class="inv-fg"><label>Observa&ccedil;&atilde;o (opcional)</label><input class="inv-fc" id="invNaObs" placeholder=""></div>' +
        '<input type="hidden" id="invNaEditId">' +
      '</div>' +
      '<div class="inv-modal-foot">' +
        '<button class="inv-mbtn inv-mbtn-sec" onclick="invCloseNovoAtivo()">Cancelar</button>' +
        '<button class="inv-mbtn inv-mbtn-pri" id="invNaSalvarBtn" onclick="invSalvarNovoAtivo()">Adicionar ativo</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(mn);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      invClosePanel();
      invCloseNovoAtivo();
    }
  });
})();

// ================================================================
// CONSTANTES
// ================================================================
var INV_CORES = ['#6c5ce7','#00b894','#0984e3','#fdcb6e','#e17055','#d63031','#00cec9','#e84393','#636e72','#2d3436'];
var INV_MESES_ABR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ================================================================
// ESTADO
// ================================================================
var _invMesSel = null;       // mês selecionado na tela (null = mês atual)
var _invPMesSel = null;      // mês selecionado no panel
var _invAtivoSel = null;     // objeto do ativo no panel
var _invActiveTab = 'rent';  // aba ativa no panel
var _invVistaAtual = 'lista';
var _invAcumPer = 'inicio';  // 'inicio' | '12m' | 'custom'
var _invRModo = 'valor';     // 'valor' | 'saldo'

function _invGetMes(){
  return _invMesSel || (typeof mesAtual === 'function' ? mesAtual() : '');
}

// ================================================================
// FORMATAÇÃO
// ================================================================
function _invFmt(v){
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Le um campo de dinheiro no formato brasileiro.
// Antes cada campo fazia parseFloat(txt.replace(',','.')), o que quebrava
// com separador de milhar: "1.050,00" virava "1.050.00" -> 1.05. Valores de
// investimento costumam ter milhar, entao aportes e saldos eram gravados
// mil vezes menores. Aqui reaproveitamos o parseN global (que trata o
// formato) e devolvemos NaN para campo vazio, porque as validacoes
// existentes usam isNaN().
function _invNum(txt){
  var s = String(txt == null ? '' : txt).trim();
  if(!s || !/\d/.test(s)) return NaN;
  return (typeof parseN === 'function') ? parseN(s)
                                        : parseFloat(s.replace(/\./g,'').replace(',','.'));
}
function _invFmtMes(m){
  var p = (m || '').split('-');
  if(p.length < 2) return m;
  return INV_MESES_ABR[+p[1]-1] + '/' + p[0].slice(2);
}
function _invFmtMesFull(m){
  if(typeof mesNomeFull === 'function') return mesNomeFull(m);
  if(typeof mesNome === 'function') return mesNome(m);
  var p = (m || '').split('-');
  if(p.length < 2) return m;
  var nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return nomes[+p[1]-1] + ' ' + p[0];
}
function _invAddMes(m, n){
  if(typeof addMes === 'function') return addMes(m, n);
  var p = (m || '').split('-').map(Number);
  var d = new Date(p[0], p[1]-1+n, 1);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}
function _invGetMesDe(data){ return (data || '').substring(0, 7); }

// ================================================================
// CÁLCULOS
// ================================================================
function _invCalcAtivo(inv, ma){
  var si = Number(inv.valor) || 0;
  var ap = 0, re = 0, rent = 0;
  (inv.movimentacoes || []).forEach(function(m){
    var mm = _invGetMesDe(m.data), v = Number(m.valor) || 0;
    if(mm && mm < ma){ si += m.tipo === 'resgate' ? -v : v; }
    else if(mm === ma){ if(m.tipo === 'aporte') ap += v; else re += v; }
  });
  (inv.rentabilidade || []).forEach(function(r){
    var v = Number(r.valor) || 0;
    if(r.mes < ma) si += v;
    else if(r.mes === ma) rent += v;
  });
  return { saldoInicial: si, aporte: ap, resgate: re, rent: rent, fechamento: si + ap - re + rent };
}

function _invCalcRentAcum(inv){
  var ma = _invGetMes();
  var rents = (inv.rentabilidade || []);
  if(_invAcumPer === '12m'){
    var lim = _invAddMes(ma, -11);
    rents = rents.filter(function(r){ return r.mes >= lim && r.mes <= ma; });
  } else if(_invAcumPer === 'custom'){
    var de = (document.getElementById('invAfDe') || {}).value;
    var ate = (document.getElementById('invAfAte') || {}).value || ma;
    rents = de ? rents.filter(function(r){ return r.mes >= de && r.mes <= ate; })
               : rents.filter(function(r){ return r.mes <= ma; });
  } else {
    rents = rents.filter(function(r){ return r.mes <= ma; });
  }
  var totalRent = rents.reduce(function(s, r){ return s + Number(r.valor||0); }, 0);
  var base = Number(inv.valor) || 1;
  return { valor: totalRent, pct: base ? totalRent / base * 100 : 0 };
}

// ================================================================
// RENDER PRINCIPAL
// ================================================================
window.renderInvest = function(){
  var invTipoSel = document.getElementById('invTipo');
  if(invTipoSel){
    invTipoSel.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){ invTipoSel.innerHTML += '<option>' + c + '</option>'; });
  }

  var invs = S.investimentos || [];
  var pgEl = document.getElementById('pg-investimentos');
  if(!pgEl) return;

  var existing = document.getElementById('invDynamicArea');
  if(existing) existing.remove();
  var tbWrap = pgEl.querySelector('.table-wrap');
  if(tbWrap) tbWrap.style.display = 'none';
  var oldForm = pgEl.querySelector('.form-section');
  if(oldForm) oldForm.style.display = 'none';

  var area = document.createElement('div');
  area.id = 'invDynamicArea';
  area.className = 'inv-wrap';

  var ma = _invGetMes();

  // cálculos agregados
  var tSI = 0, tAp = 0, tRe = 0, tRent = 0, tFec = 0;
  invs.forEach(function(inv){
    var c = _invCalcAtivo(inv, ma);
    tSI += c.saldoInicial; tAp += c.aporte; tRe += c.resgate; tRent += c.rent; tFec += c.fechamento;
  });

  var html = '';

  // ── topo ──
  html += '<div class="inv-top">' +
    '<div></div>' +
    '<div class="inv-top-actions">' +
      '<div class="inv-view-toggle">' +
        '<button class="ivt-btn' + (_invVistaAtual === 'lista' ? ' on' : '') + '" id="invBtnLista" onclick="invSetVista(\'lista\')">&#9776; Lista</button>' +
        '<button class="ivt-btn' + (_invVistaAtual === 'detalhe' ? ' on' : '') + '" id="invBtnDetalhe" onclick="invSetVista(\'detalhe\')">&#9635; Detalhado</button>' +
      '</div>' +
      '<button onclick="invOpenNovoAtivo()" style="background:var(--priG);border:none;color:#fff;border-radius:10px;padding:9px 16px;font-size:.8em;font-weight:700;cursor:pointer;">&#65291; Novo ativo</button>' +
    '</div>' +
  '</div>';

  // ── nav mês ──
  html += '<div class="inv-mes-nav">' +
    '<button class="inv-mn-btn" onclick="invChgMes(-1)">&#9664;</button>' +
    '<div class="inv-mn-center">' +
      '<span class="inv-mn-label">' + _invFmtMesFull(ma) + '</span>' +
      '<span class="inv-mn-sub" id="invMnSub">' + (ma === (typeof mesAtual === 'function' ? mesAtual() : '') ? 'Mês atual' : '') + '</span>' +
    '</div>' +
    '<span class="inv-mn-today" onclick="invGoToday()">Hoje</span>' +
    '<button class="inv-mn-btn" onclick="invChgMes(1)">&#9654;</button>' +
  '</div>';

  // ── kpi strip ──
  var rentPct = tSI > 0 ? (tRent / tSI * 100) : 0;
  var rentCls = tRent >= 0 ? 'color:var(--ok)' : 'color:var(--dn2)';
  html += '<div class="inv-kpi-strip">' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--tx3)"></span>Saldo Inicial</span><div class="inv-kval" style="color:var(--tx2)">' + _invFmt(tSI) + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--pri2)"></span>Aportes</span><div class="inv-kval" style="color:var(--pri2)">' + (tAp ? '+' + _invFmt(tAp) : '—') + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--dn2)"></span>Resgates</span><div class="inv-kval" style="color:var(--dn2)">' + (tRe ? '−' + _invFmt(tRe) : '—') + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:' + (tRent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '"></span>Rentabilidade</span><div class="inv-kval" style="' + rentCls + '">' + (tRent ? (tRent > 0 ? '+' : '') + _invFmt(tRent) : '—') + '</div><div class="inv-ksub">' + (tSI > 0 ? rentPct.toFixed(2) + '% a.m.' : '') + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--ok)"></span>Saldo Fechamento</span><div class="inv-kval" style="color:var(--ok)">' + _invFmt(tFec) + '</div></div>' +
  '</div>';

  // ── alocação ──
  var total = tFec || 1;
  html += '<div class="inv-alloc">' +
    '<div class="inv-alloc-head"><span style="font-size:.6em;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);font-weight:700">Alocação</span><span style="font-size:.72em;color:var(--tx3)">' + _invFmt(tFec) + '</span></div>' +
    '<div class="inv-alloc-track">' + invs.map(function(inv, i){ var c = _invCalcAtivo(inv, ma); return '<div class="inv-alloc-seg" style="width:' + Math.max(c.fechamento/total*100, 0.5).toFixed(1) + '%;background:' + INV_CORES[i % INV_CORES.length] + '" title="' + (inv.nome||'-') + '"></div>'; }).join('') + '</div>' +
    '<div class="inv-alloc-legs">' + invs.map(function(inv, i){ var c = _invCalcAtivo(inv, ma); return '<div class="inv-alloc-leg"><div class="inv-alloc-dot" style="background:' + INV_CORES[i % INV_CORES.length] + '"></div>' + (inv.nome||'-') + ' — ' + (c.fechamento/total*100).toFixed(0) + '%</div>'; }).join('') + '</div>' +
  '</div>';

  // ── filtro período acumulado ──
  html += '<div class="inv-acum-filter">' +
    '<span style="font-size:.6em;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);font-weight:700;flex-shrink:0">Rent. Acumulada:</span>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button class="inv-af-pill' + (_invAcumPer === 'inicio' ? ' on' : '') + '" onclick="invSetAcumPer(\'inicio\',event)">Desde o início</button>' +
      '<button class="inv-af-pill' + (_invAcumPer === '12m' ? ' on' : '') + '" onclick="invSetAcumPer(\'12m\',event)">Últimos 12m</button>' +
      '<button class="inv-af-pill' + (_invAcumPer === 'custom' ? ' on' : '') + '" onclick="invSetAcumPer(\'custom\',event)">Personalizado</button>' +
    '</div>' +
    '<div class="inv-af-inputs' + (_invAcumPer === 'custom' ? ' show' : '') + '" id="invAfCustomInputs">' +
      '<input type="month" id="invAfDe" class="inv-ii" style="max-width:130px" oninput="renderInvest()">' +
      '<span style="color:var(--tx3);font-size:.8em">até</span>' +
      '<input type="month" id="invAfAte" class="inv-ii" style="max-width:130px" oninput="renderInvest()">' +
    '</div>' +
  '</div>';

  // ── vistas ──
  if(_invVistaAtual === 'lista'){
    html += _invBuildLista(invs, ma);
  } else {
    html += _invBuildDetalhe(invs, ma);
  }

  area.innerHTML = html;
  pgEl.appendChild(area);
};

// ================================================================
// VISTA LISTA
// ================================================================
function _invBuildLista(invs, ma){
  var h = '';
  h += '<div class="inv-list-table">' +
    '<div class="inv-lth">' +
      '<span>Ativo</span>' +
      '<span>Rent. Acumulada</span>' +
      '<span>Aporte / Resgate</span>' +
      '<span>Rent. Mês</span>' +
      '<span>Saldo Fechamento</span>' +
      '<span></span>' +
    '</div>' +
    '<div id="invLRows">';

  var tRA = 0, tAp = 0, tRe = 0, tRent = 0, tFec = 0;
  invs.forEach(function(inv, i){
    var c = _invCalcAtivo(inv, ma);
    var ra = _invCalcRentAcum(inv);
    tRA += ra.valor; tAp += c.aporte; tRe += c.resgate; tRent += c.rent; tFec += c.fechamento;

    var rentCls = c.rent > 0 ? 'color:var(--ok)' : c.rent < 0 ? 'color:var(--dn2)' : 'color:var(--tx3)';
    var movNet = c.aporte - c.resgate;
    var movStr = movNet > 0 ? '<span style="color:var(--ok)">+' + _invFmt(movNet) + '</span>' :
                 movNet < 0 ? '<span style="color:var(--dn2)">−' + _invFmt(-movNet) + '</span>' :
                 '<span style="color:var(--tx3)">—</span>';
    var raStr = ra.valor ? (ra.valor > 0 ? '+' : '') + _invFmt(ra.valor) : '—';
    var raPctStr = ra.valor ? (ra.pct > 0 ? '+' : '') + ra.pct.toFixed(1) + '% acum.' : '';
    var rentStr = c.rent ? (c.rent > 0 ? '+' : '') + _invFmt(c.rent) : '—';
    var idEsc = (inv.id || '').replace(/'/g, "\\'");

    h += '<div class="inv-ltr">' +
      '<div class="inv-ltr-left" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<div class="inv-ltr-bar" style="background:' + INV_CORES[i % INV_CORES.length] + '"></div>' +
        '<div><div class="inv-ltr-name">' + (inv.nome||'-') + '</div><div class="inv-ltr-tipo">' + (inv.tipo||'Outro') + '</div></div>' +
      '</div>' +
      '<div class="inv-lcell clickable" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<span class="cv" style="color:var(--pri2)">' + raStr + '</span>' +
        '<span class="cs">' + raPctStr + '</span>' +
      '</div>' +
      '<div class="inv-lcell clickable" onclick="invOpenPanel(\'' + idEsc + '\',\'mov\')">' +
        '<span class="cv">' + movStr + '</span>' +
        '<span class="cs">' + (c.aporte && c.resgate ? 'aporte + resgate' : c.aporte ? 'aporte' : c.resgate ? 'resgate' : '') + '</span>' +
      '</div>' +
      '<div class="inv-lcell clickable" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<span class="cv" style="' + rentCls + '">' + rentStr + '</span>' +
      '</div>' +
      '<div class="inv-lcell" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<span class="cv" style="color:var(--ok)">' + _invFmt(c.fechamento) + '</span>' +
      '</div>' +
      '<div onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')"><div class="inv-ltr-arr">&rsaquo;</div></div>' +
    '</div>';
  });

  h += '</div>';

  var movTot = tAp - tRe;
  h += '<div class="inv-totals-row">' +
    '<span class="tl">Total</span>' +
    '<span class="tv" style="color:var(--pri2)">' + (tRA ? (tRA > 0 ? '+' : '') + _invFmt(tRA) : '—') + '</span>' +
    '<span class="tv" style="color:' + (movTot > 0 ? 'var(--ok)' : movTot < 0 ? 'var(--dn2)' : 'var(--tx3)') + '">' + (movTot ? (movTot > 0 ? '+' : '−') + _invFmt(Math.abs(movTot)) : '—') + '</span>' +
    '<span class="tv" style="color:' + (tRent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (tRent ? (tRent > 0 ? '+' : '') + _invFmt(tRent) : '—') + '</span>' +
    '<span class="tv" style="color:var(--ok)">' + _invFmt(tFec) + '</span>' +
    '<span></span>' +
  '</div>';

  h += '</div>';
  return h;
}

// ================================================================
// VISTA DETALHADA
// ================================================================
function _invBuildDetalhe(invs, ma){
  var meses6 = [];
  for(var i = -5; i <= 0; i++) meses6.push(_invAddMes(ma, i));
  var h = '<div class="inv-cards-grid">';

  invs.forEach(function(inv, idx){
    var c = _invCalcAtivo(inv, ma);
    var ra = _invCalcRentAcum(inv);
    var cor = INV_CORES[idx % INV_CORES.length];
    var movNet = c.aporte - c.resgate;
    var rentCls = c.rent > 0 ? 'var(--ok)' : c.rent < 0 ? 'var(--dn2)' : 'var(--tx3)';
    var idEsc = (inv.id || '').replace(/'/g, "\\'");

    // barras
    var dadosMes = meses6.map(function(m){ return { m: m, rent: _invCalcAtivo(inv, m).rent }; });
    var maxAbs = Math.max.apply(null, dadosMes.map(function(d){ return Math.abs(d.rent); }).concat([1]));
    var BAR_MAX = 44;
    var bars = dadosMes.map(function(d){
      var h2 = d.rent ? Math.max(Math.round(Math.abs(d.rent) / maxAbs * BAR_MAX), 5) : 3;
      var barCor = d.rent > 0 ? cor : d.rent < 0 ? 'var(--dn2)' : 'var(--bg4)';
      var opac = d.rent ? 1 : 0.35;
      var mo = +d.m.split('-')[1] - 1;
      var mesAbr = INV_MESES_ABR[mo];
      var valLbl = d.rent ? (d.rent > 0 ? '+' : '') + _invFmt(d.rent) : '';
      var valCls = d.rent > 0 ? 'color:var(--ok)' : d.rent < 0 ? 'color:var(--dn2)' : 'color:var(--tx3)';
      var isSel = d.m === ma;
      return '<div class="inv-bar-col">' +
        '<div class="inv-bar-val-lbl" style="' + valCls + (d.rent ? '' : ';opacity:.4') + '">' + valLbl + '</div>' +
        '<div class="inv-bar-track">' +
          '<div class="inv-bar-fill" style="height:' + h2 + 'px;background:' + barCor + ';opacity:' + opac + (isSel ? ';outline:2px solid ' + cor + ';outline-offset:2px' : '') + '"></div>' +
        '</div>' +
        '<div class="inv-bar-mes-lbl" style="' + (isSel ? 'color:var(--tx);font-weight:700' : '') + '">' + mesAbr + '</div>' +
      '</div>';
    }).join('');

    h += '<div class="inv-card2">' +
      '<div class="inv-card2-head">' +
        '<div class="inv-card2-strip" style="background:' + cor + '"></div>' +
        '<div style="flex:1;min-width:0"><div class="inv-card2-title">' + (inv.nome||'-') + '</div><div class="inv-card2-tipo">' + (inv.tipo||'Outro') + '</div></div>' +
        '<div style="text-align:right;flex-shrink:0"><div style="font-size:1em;font-weight:800;color:var(--ok);font-variant-numeric:tabular-nums">' + _invFmt(c.fechamento) + '</div><div style="font-size:.62em;color:var(--tx3);margin-top:2px">saldo fechamento</div></div>' +
      '</div>' +
      '<div class="inv-card2-body">' +
        '<div class="inv-card2-row"><span class="cl">Rent. Acumulada</span><span class="cr" style="color:var(--pri2)">' + (ra.valor ? (ra.valor > 0 ? '+' : '') + _invFmt(ra.valor) : '—') + '<small style="color:var(--tx3);font-weight:400"> ' + (ra.pct ? (ra.pct > 0 ? '+' : '') + ra.pct.toFixed(1) + '%' : '') + '</small></span></div>' +
        '<div class="inv-card2-row"><span class="cl">Rent. ' + _invFmtMes(ma) + '</span><span class="cr" style="color:' + rentCls + '">' + (c.rent ? (c.rent > 0 ? '+' : '') + _invFmt(c.rent) : '—') + '</span></div>' +
        '<div class="inv-card2-row"><span class="cl">Aporte / Resgate</span><span class="cr" style="color:' + (movNet > 0 ? 'var(--ok)' : movNet < 0 ? 'var(--dn2)' : 'var(--tx3)') + '">' + (movNet ? (movNet > 0 ? '+' : '−') + _invFmt(Math.abs(movNet)) : '—') + '</span></div>' +
        '<div class="inv-card2-row"><span class="cl">Saldo Inicial</span><span class="cr" style="color:var(--tx2)">' + _invFmt(c.saldoInicial) + '</span></div>' +
      '</div>' +
      '<div class="inv-mini-chart">' +
        '<span class="inv-clbl">Rentabilidade — últimos 6 meses</span>' +
        '<div class="inv-bar-chart">' + bars + '</div>' +
      '</div>' +
      '<div class="inv-card2-actions">' +
        '<button class="inv-ca" onclick="invOpenPanel(\'' + idEsc + '\',\'mov\')">&#128260; Movimentações</button>' +
        '<button class="inv-ca" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">&#128200; Rentabilidade</button>' +
        '<button class="inv-ca pri" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">Ver detalhe &rsaquo;</button>' +
      '</div>' +
    '</div>';
  });

  h += '</div>';
  return h;
}

// ================================================================
// PANEL
// ================================================================
window.invOpenPanel = function(id, tab){
  _invAtivoSel = (S.investimentos || []).find(function(x){ return x.id === id; });
  if(!_invAtivoSel) return;
  window._invAtivoSelId = id; // exposto p/ integrações externas (investimentos-integra.js)
  _invPMesSel = _invGetMes();
  invSwitchTab(tab || 'rent');
  _invRenderPanel();
  document.getElementById('invOverlay').classList.add('open');
};
window.invClosePanel = function(){
  var ov = document.getElementById('invOverlay');
  if(ov) ov.classList.remove('open');
};
window.invChgPMes = function(n){
  _invPMesSel = _invAddMes(_invPMesSel, n);
  _invRenderPanel();
};
window.invSwitchTab = function(id){
  _invActiveTab = id;
  ['Rent','Mov'].forEach(function(t){
    var btn = document.getElementById('invTab' + t);
    // Os paineis sao invTpRent / invTpMov. Antes isto usava
    // t.toLowerCase(), procurando invTprent / invTpmov: nao existem,
    // entao tp era null e o conteudo nunca trocava — so o botao ficava
    // marcado, dando a impressao de que a aba estava travada.
    var tp = document.getElementById('invTp' + t);
    var isOn = (id === t.toLowerCase());
    if(btn) btn.classList.toggle('on', isOn);
    if(tp) tp.classList.toggle('on', isOn);
  });
};

function _invRenderPanel(){
  var inv = _invAtivoSel;
  if(!inv) return;
  var c = _invCalcAtivo(inv, _invPMesSel);
  var ra = _invCalcRentAcum(inv);
  var rentCls = c.rent > 0 ? 'var(--ok)' : c.rent < 0 ? 'var(--dn2)' : 'var(--tx3)';

  document.getElementById('invPTitle').textContent = inv.nome || '-';
  document.getElementById('invPSub').textContent = (inv.tipo||'') + ' · saldo ' + _invFmt(c.fechamento);
  document.getElementById('invPMesLabel').textContent = _invFmtMesFull(_invPMesSel);
  var riMes = document.getElementById('invFiRMes');
  if(riMes) riMes.value = _invPMesSel;
  var miData = document.getElementById('invFiMData');
  if(miData) miData.value = _invPMesSel + '-10';

  document.getElementById('invPKpis').innerHTML =
    '<div class="inv-pk"><span class="inv-pkl"><span class="dot" style="background:var(--ok)"></span>Saldo Fechamento</span><div class="inv-pk-val" style="color:var(--ok)">' + _invFmt(c.fechamento) + '</div></div>' +
    '<div class="inv-pk"><span class="inv-pkl"><span class="dot" style="background:' + (c.rent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '"></span>Rent. Mês</span><div class="inv-pk-val" style="color:' + rentCls + '">' + (c.rent ? (c.rent > 0 ? '+' : '') + _invFmt(c.rent) : '—') + '</div></div>' +
    '<div class="inv-pk"><span class="inv-pkl"><span class="dot" style="background:var(--pri2)"></span>Rent. Acumulada</span><div class="inv-pk-val" style="color:var(--pri2)">' + (ra.valor ? (ra.valor > 0 ? '+' : '') + _invFmt(ra.valor) : '—') + '</div><div style="font-size:.6em;color:var(--tx3);margin-top:2px">' + (ra.pct ? (ra.pct > 0 ? '+' : '') + ra.pct.toFixed(1) + '% total' : '') + '</div></div>';

  // aba rent
  var rents = (inv.rentabilidade || []).slice().sort(function(a, b){ return b.mes.localeCompare(a.mes); });
  var rmv = rents.find(function(r){ return r.mes === _invPMesSel; });
  var idEsc = (inv.id || '').replace(/'/g, "\\'");

  document.getElementById('invRentMesInfo').innerHTML = rmv
    ? '<div class="inv-hi hl"><div class="inv-hi-left"><span class="inv-hi-mes">' + _invFmtMes(_invPMesSel) + '</span><span class="inv-chip inv-chip-a">mês selecionado</span></div><span class="inv-hi-val" style="color:' + (rmv.valor >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rmv.valor > 0 ? '+' : '') + _invFmt(rmv.valor) + '</span><button class="inv-hi-del" onclick="invDelRent(\'' + idEsc + '\',\'' + rmv.mes + '\')">&#10005;</button></div>'
    : '<div class="inv-hi-empty">Nenhuma rentabilidade em ' + _invFmtMesFull(_invPMesSel) + '</div>';

  var restRents = rents.filter(function(r){ return r.mes !== _invPMesSel; });
  document.getElementById('invRentHist').innerHTML = restRents.length
    ? '<span class="inv-hist-sec-lbl">Histórico completo</span>' + restRents.map(function(r){
        var rv = Number(r.valor) || 0;
        return '<div class="inv-hi"><div class="inv-hi-left"><span class="inv-hi-mes">' + _invFmtMes(r.mes) + '</span><span class="inv-chip ' + (rv >= 0 ? 'inv-chip-a' : 'inv-chip-n') + '">Rentabilidade</span></div>' +
          '<span class="inv-hi-val" style="color:' + (rv >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rv > 0 ? '+' : '') + _invFmt(rv) + '</span>' +
          '<button class="inv-hi-del" onclick="invDelRent(\'' + idEsc + '\',\'' + r.mes + '\')">&#10005;</button></div>';
      }).join('')
    : '';

  // aba mov
  var movs = (inv.movimentacoes || []).slice().sort(function(a, b){ return b.data.localeCompare(a.data); });
  var movsMes = movs.filter(function(m){ return _invGetMesDe(m.data) === _invPMesSel; });
  var movsRest = movs.filter(function(m){ return _invGetMesDe(m.data) !== _invPMesSel; });

  function movHtml(m){
    var mv = Number(m.valor) || 0;
    var movIdEsc = (m.id || '').replace(/'/g, "\\'");
    return '<div class="inv-hi" style="border:1px solid rgba(' + (m.tipo === 'aporte' ? '0,184,148' : '214,48,49') + ',.15)">' +
      '<div class="inv-hi-left"><span class="inv-hi-mes">' + (typeof fmtD === 'function' ? fmtD(m.data) : m.data) + '</span>' +
      '<span class="inv-chip ' + (m.tipo === 'aporte' ? 'inv-chip-p' : 'inv-chip-n') + '">' + m.tipo + '</span>' +
      (m.obs ? '<span class="inv-hi-obs">' + m.obs + '</span>' : '') + '</div>' +
      '<span class="inv-hi-val" style="color:' + (m.tipo === 'aporte' ? 'var(--ok)' : 'var(--dn2)') + '">' + (m.tipo === 'aporte' ? '+' : '−') + _invFmt(mv) + '</span>' +
      '<button class="inv-hi-del" onclick="invDelMovById(\'' + idEsc + '\',\'' + movIdEsc + '\')">&#10005;</button></div>';
  }

  document.getElementById('invMovMesInfo').innerHTML = movsMes.length
    ? '<span class="inv-hist-sec-lbl">' + _invFmtMesFull(_invPMesSel) + '</span>' + movsMes.map(movHtml).join('')
    : '<div class="inv-hi-empty">Nenhuma movimentação em ' + _invFmtMesFull(_invPMesSel) + '</div>';

  document.getElementById('invMovHist').innerHTML = movsRest.length
    ? '<span class="inv-hist-sec-lbl">Histórico</span>' + movsRest.map(movHtml).join('')
    : '';
}

// ================================================================
// RENTABILIDADE (panel)
// ================================================================
window.invSetRModo = function(m){
  _invRModo = m;
  var vEl = document.getElementById('invFiRVal');
  var sEl = document.getElementById('invFiRSaldo');
  var vBtn = document.getElementById('invRModoValBtn');
  var sBtn = document.getElementById('invRModoSaldoBtn');
  if(vEl) vEl.style.display = m === 'valor' ? '' : 'none';
  if(sEl) sEl.style.display = m === 'saldo' ? '' : 'none';
  if(vBtn) vBtn.classList.toggle('on', m === 'valor');
  if(sBtn) sBtn.classList.toggle('on', m === 'saldo');
  var calc = document.getElementById('invFiRCalc');
  if(calc) calc.style.display = 'none';
  if(m === 'saldo') invCalcRentPreview();
};
window.invCalcRentPreview = function(){
  if(_invRModo !== 'saldo' || !_invAtivoSel) return;
  var mes = (document.getElementById('invFiRMes') || {}).value;
  var saldo = _invNum((document.getElementById('invFiRSaldo') || {}).value);
  var el = document.getElementById('invFiRCalc');
  if(!el) return;
  if(!mes || isNaN(saldo)){ el.style.display = 'none'; return; }
  var c = _invCalcAtivo(_invAtivoSel, mes);
  var base = c.saldoInicial + c.aporte - c.resgate;
  var rent = saldo - base;
  el.textContent = 'Base: ' + _invFmt(base) + ' → Rent. calculada: ' + (rent >= 0 ? '+' : '') + _invFmt(rent);
  el.style.color = rent >= 0 ? 'var(--ok)' : 'var(--dn2)';
  el.style.display = 'block';
};
window.invAddRent = function(){
  if(!_invAtivoSel) return;
  var mes = (document.getElementById('invFiRMes') || {}).value;
  if(!mes) return alert('Selecione o mês.');
  var val;
  if(_invRModo === 'valor'){
    val = _invNum((document.getElementById('invFiRVal') || {}).value);
    if(isNaN(val)) return alert('Preencha o valor da rentabilidade.');
  } else {
    var saldo = _invNum((document.getElementById('invFiRSaldo') || {}).value);
    if(isNaN(saldo)) return alert('Preencha o saldo atual.');
    var c = _invCalcAtivo(_invAtivoSel, mes);
    val = saldo - (c.saldoInicial + c.aporte - c.resgate);
  }
  if(!Array.isArray(_invAtivoSel.rentabilidade)) _invAtivoSel.rentabilidade = [];
  _invAtivoSel.rentabilidade = _invAtivoSel.rentabilidade.filter(function(r){ return r.mes !== mes; });
  _invAtivoSel.rentabilidade.push({ mes: mes, valor: val });
  salvar();
  var vEl = document.getElementById('invFiRVal'); if(vEl) vEl.value = '';
  var sEl = document.getElementById('invFiRSaldo'); if(sEl) sEl.value = '';
  var cEl = document.getElementById('invFiRCalc'); if(cEl) cEl.style.display = 'none';
  _invRenderPanel(); renderInvest();
};
window.invDelRent = function(invId, mes){
  if(!confirm('Remover rentabilidade de ' + _invFmtMes(mes) + '?')) return;
  var inv = (S.investimentos || []).find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.rentabilidade = (inv.rentabilidade || []).filter(function(r){ return r.mes !== mes; });
  salvar(); _invRenderPanel(); renderInvest();
};

// ================================================================
// MOVIMENTAÇÕES (panel)
// ================================================================
window.invAddMov = function(){
  if(!_invAtivoSel) return;
  var tipo = (document.getElementById('invFiMTipo') || {}).value || 'aporte';
  var data = (document.getElementById('invFiMData') || {}).value;
  var val = _invNum((document.getElementById('invFiMVal') || {}).value);
  if(!data) return alert('Informe a data.');
  if(isNaN(val) || val <= 0) return alert('Informe um valor válido.');
  if(!Array.isArray(_invAtivoSel.movimentacoes)) _invAtivoSel.movimentacoes = [];
  _invAtivoSel.movimentacoes.push({ tipo: tipo, valor: val, data: data, obs: '', id: (typeof uid === 'function' ? uid() : Date.now() + '') });
  salvar();
  var vEl = document.getElementById('invFiMVal'); if(vEl) vEl.value = '';
  _invRenderPanel(); renderInvest();
};
window.invDelMovById = function(invId, movId){
  if(!confirm('Remover movimentação?')) return;
  var inv = (S.investimentos || []).find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.movimentacoes = (inv.movimentacoes || []).filter(function(m){ return m.id !== movId; });
  salvar(); _invRenderPanel(); renderInvest();
};

// ================================================================
// EDITAR / EXCLUIR (panel)
// ================================================================
window.invEditarAtivo = function(){
  if(!_invAtivoSel) return;
  var inv = _invAtivoSel;
  var nEl = document.getElementById('invNaNome'); if(nEl) nEl.value = inv.nome || '';
  var tEl = document.getElementById('invNaTipo');
  if(tEl){
    tEl.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){ tEl.innerHTML += '<option>' + c + '</option>'; });
    tEl.value = inv.tipo || '';
  }
  var vEl = document.getElementById('invNaValor'); if(vEl) vEl.value = Number(inv.valor||0).toFixed(2).replace('.',',');
  var dEl = document.getElementById('invNaData'); if(dEl) dEl.value = inv.data || inv.dataInicio || '';
  var oEl = document.getElementById('invNaObs'); if(oEl) oEl.value = inv.obs || '';
  var eEl = document.getElementById('invNaEditId'); if(eEl) eEl.value = inv.id || '';
  var tit = document.getElementById('invModalNovoTitle'); if(tit) tit.textContent = '✏️ Editar Ativo';
  var btn = document.getElementById('invNaSalvarBtn'); if(btn) btn.textContent = 'Salvar alterações';
  invClosePanel();
  document.getElementById('invModalNovo').classList.add('open');
};
window.invExcluirAtivo = function(){
  if(!_invAtivoSel) return;
  if(!confirm('Excluir "' + (_invAtivoSel.nome||'-') + '"?\nEsta ação não pode ser desfeita.')) return;
  S.investimentos = (S.investimentos || []).filter(function(x){ return x.id !== _invAtivoSel.id; });
  _invAtivoSel = null;
  salvar();
  invClosePanel();
  renderInvest();
};

// ================================================================
// NOVO ATIVO / EDITAR
// ================================================================
window.invOpenNovoAtivo = function(){
  var nEl = document.getElementById('invNaNome'); if(nEl) nEl.value = '';
  var tEl = document.getElementById('invNaTipo');
  if(tEl){
    tEl.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){ tEl.innerHTML += '<option>' + c + '</option>'; });
  }
  var vEl = document.getElementById('invNaValor'); if(vEl) vEl.value = '';
  var dEl = document.getElementById('invNaData'); if(dEl) dEl.value = typeof hojeStr === 'function' ? hojeStr() : '';
  var oEl = document.getElementById('invNaObs'); if(oEl) oEl.value = '';
  var eEl = document.getElementById('invNaEditId'); if(eEl) eEl.value = '';
  var tit = document.getElementById('invModalNovoTitle'); if(tit) tit.textContent = '＋ Novo Ativo';
  var btn = document.getElementById('invNaSalvarBtn'); if(btn) btn.textContent = 'Adicionar ativo';
  document.getElementById('invModalNovo').classList.add('open');
};
window.invCloseNovoAtivo = function(){
  var mn = document.getElementById('invModalNovo');
  if(mn) mn.classList.remove('open');
};
window.invSalvarNovoAtivo = function(){
  var nome = ((document.getElementById('invNaNome') || {}).value || '').trim();
  var tipo = (document.getElementById('invNaTipo') || {}).value || 'Outro';
  var val = _invNum((document.getElementById('invNaValor') || {}).value);
  var data = (document.getElementById('invNaData') || {}).value || '';
  var obs = ((document.getElementById('invNaObs') || {}).value || '').trim();
  var editId = (document.getElementById('invNaEditId') || {}).value || '';
  if(!nome || isNaN(val)) return alert('Preencha nome e valor inicial.');
  if(!Array.isArray(S.investimentos)) S.investimentos = [];
  if(editId){
    var inv = S.investimentos.find(function(x){ return x.id === editId; });
    if(inv){ inv.nome = nome; inv.tipo = tipo; inv.valor = val; inv.data = data; inv.obs = obs; }
  } else {
    S.investimentos.push({ id: typeof uid === 'function' ? uid() : 'i' + Date.now(), nome: nome, tipo: tipo, valor: val, data: data, obs: obs, rentabilidade: [], movimentacoes: [] });
  }
  salvar();
  invCloseNovoAtivo();
  renderInvest();
};

// ================================================================
// NAVEGAÇÃO MÊS / VISTA / FILTRO
// ================================================================
window.invChgMes = function(n){
  _invMesSel = _invAddMes(_invGetMes(), n);
  renderInvest();
};
window.invGoToday = function(){
  _invMesSel = null;
  renderInvest();
};
window.invSetVista = function(v){
  _invVistaAtual = v;
  renderInvest();
};
window.invSetAcumPer = function(p, e){
  _invAcumPer = p;
  document.querySelectorAll('.inv-af-pill').forEach(function(b){ b.classList.remove('on'); });
  if(e && e.target) e.target.classList.add('on');
  var ci = document.getElementById('invAfCustomInputs');
  if(ci) ci.classList.toggle('show', p === 'custom');
  if(p !== 'custom') renderInvest();
};

console.log('[Financeiro Pro] Investimentos v7 — redesign completo.');
})();

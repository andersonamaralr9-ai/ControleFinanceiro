// resumo-enhanced.js v6 — Mobile: layout lista compacta tipo app bancário
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ─── RESUMO ENHANCED v6 ─── */

/* Reset container — anula o .cards do index.html */
#resumoCards.cards {
  display: block !important;
  grid-template-columns: none !important;
  gap: 0 !important;
  margin-bottom: 0 !important;
  margin-top: 0 !important;
}

/* ═══ WRAPPER ═══ */
#resWrap { width: 100%; }

/* ═══ QUICK ACTIONS ═══ */
.rq-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.rq-btn { background: var(--bg2); border: 1px solid var(--bg4); border-radius: var(--rad); padding: 10px 16px; font-size: .78em; color: var(--tx2); cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 6px; font-weight: 600; white-space: nowrap; }
.rq-btn:hover { border-color: var(--pri); color: var(--pri2); transform: translateY(-1px); }

/* ═══ DESKTOP GRIDS ═══ */
.rg-main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
.rg-sec { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }

/* ═══ CARD BASE (desktop) ═══ */
.rc6 { background: var(--bg2); border: 1px solid var(--bg4); border-radius: var(--rad); padding: 16px 14px; box-shadow: var(--sh); transition: transform .2s; overflow: hidden; }
.rc6:hover { transform: translateY(-3px); }
.rc6-lbl { font-size: .66em; color: var(--tx3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
.rc6-ico { margin-right: 4px; }
.rc6-val { font-size: 1.25em; font-weight: 700; margin-bottom: 6px; word-break: break-all; }
.rc6-row { display: flex; justify-content: space-between; align-items: center; font-size: .74em; padding: 3px 0; border-top: 1px solid var(--bg3); gap: 4px; }
.rc6-rl { color: var(--tx3); flex-shrink: 0; }
.rc6-rv { font-weight: 600; text-align: right; }
.rc6-bdg { display: inline-block; font-size: .6em; padding: 1px 6px; border-radius: 8px; font-weight: 700; margin-left: 3px; }
.rc6-bdg.g { background: rgba(0,206,201,.15); color: var(--ok); }
.rc6-bdg.y { background: rgba(253,203,110,.15); color: var(--wn); }
.rc6.t-rec { border-top: 3px solid var(--ok); }
.rc6.t-desp { border-top: 3px solid var(--dn2); }
.rc6.t-sal { border-top: 3px solid var(--inf2); }
.rc6.t-cc { border-top: 3px solid #e65100; }
.rc6.t-cont { border-top: 3px solid var(--pri); }
.rc6.t-ass { border-top: 3px solid var(--wn); }
.rc6.clk { cursor: pointer; }
.rc6.clk:hover { opacity: .88; }

/* ═══ MODAL ═══ */
.rd-list { max-height: 400px; overflow-y: auto; }
.rd-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--bg3); font-size: .85em; gap: 8px; }
.rd-item:hover { background: var(--bg3); }
.rd-item:last-child { border: none; }
.rd-item .rd-d { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.rd-item .rd-m { font-size: .7em; color: var(--tx3); flex-shrink: 0; }
.rd-item .rd-v { font-weight: 700; flex-shrink: 0; }
.rd-tot { display: flex; justify-content: space-between; padding: 12px; font-weight: 700; font-size: .95em; border-top: 2px solid var(--bg4); margin-top: 4px; }
.rd-empty { text-align: center; padding: 30px; color: var(--tx3); font-size: .88em; }

/* ═══════════════════════════════ */
/* ═══ MOBILE — LISTA COMPACTA ═══ */
/* ═══════════════════════════════ */
@media (max-width: 768px) {

  /* Reset absoluto do container */
  #resumoCards.cards {
    display: block !important;
    grid-template-columns: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Esconder desktop grids */
  .rg-main, .rg-sec { display: none !important; }

  /* Quick actions — scroll horizontal minúsculo */
  .rq-row {
    flex-wrap: nowrap !important;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 6px;
    margin-bottom: 6px;
    padding-bottom: 2px;
  }
  .rq-row::-webkit-scrollbar { display: none; }
  .rq-btn { flex-shrink: 0; padding: 4px 8px; font-size: .62em; border-radius: 6px; }

  /* ─── Mobile list ─── */
  .rm-list {
    display: flex !important;
    flex-direction: column;
    gap: 0;
    background: var(--bg2);
    border: 1px solid var(--bg4);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  /* Linha individual */
  .rm-ln {
    display: flex;
    align-items: center;
    padding: 9px 10px;
    border-bottom: 1px solid var(--bg3);
    gap: 8px;
    cursor: pointer;
    transition: background .1s;
    min-height: 0;
  }
  .rm-ln:last-child { border-bottom: none; }
  .rm-ln:active { background: var(--bg3); }

  /* Ícone */
  .rm-ic { font-size: .9em; flex-shrink: 0; width: 20px; text-align: center; }

  /* Label */
  .rm-lb { font-size: .68em; color: var(--tx2); flex: 1; min-width: 0; font-weight: 600; }

  /* Valor principal */
  .rm-vl { font-size: .78em; font-weight: 700; text-align: right; white-space: nowrap; }

  /* Sub-info (badge ou texto menor) */
  .rm-sub { font-size: .5em; color: var(--tx3); display: flex; gap: 4px; align-items: center; margin-left: 4px; flex-shrink: 0; }
  .rm-sub .rm-b { padding: 1px 4px; border-radius: 4px; font-weight: 700; font-size: .9em; }
  .rm-sub .rm-b.g { background: rgba(0,206,201,.15); color: var(--ok); }
  .rm-sub .rm-b.y { background: rgba(253,203,110,.15); color: var(--wn); }

  /* Saldo destaque */
  .rm-sal { background: var(--bg3); padding: 10px; }
  .rm-sal .rm-vl { font-size: .95em; }

  /* Seção header */
  .rm-sh { padding: 6px 10px; font-size: .5em; color: var(--tx3); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; background: var(--bg3); }

  /* ─── Gráficos mobile ─── */
  .chart-row {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
    margin-bottom: 10px !important;
  }
  .chart-box {
    padding: 8px !important;
    overflow: hidden !important;
  }
  .chart-box h3 {
    font-size: .68em !important;
    margin-bottom: 6px !important;
  }

  /* Barras */
  .bar-chart {
    height: 90px !important;
    gap: 2px !important;
    overflow: hidden !important;
  }
  .bar-group { min-width: 0 !important; }
  .bar-top-val {
    font-size: .38em !important;
    min-height: auto !important;
    margin-bottom: 1px !important;
    line-height: 1 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  .bar-bars { gap: 1px !important; }
  .bar { max-width: 14px !important; }
  .bar-bottom { margin-top: 2px !important; }
  .bar-label { font-size: .42em !important; }

  /* Top categorias */
  .top-cat-item { margin-bottom: 5px !important; }
  .top-cat-hdr { font-size: .65em !important; }
  .top-cat-bar { height: 4px !important; }
}

/* Desktop: esconder mobile list */
.rm-list { display: none; }

@media (max-width: 380px) {
  .rm-vl { font-size: .7em; }
  .rm-lb { font-size: .62em; }
  .rq-btn { font-size: .56em; padding: 3px 6px; }
  .bar-chart { height: 70px !important; }
  .bar-top-val { font-size: .34em !important; }
  .bar-label { font-size: .38em !important; }
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL
// ================================================================
if (!document.getElementById('modalResDet')) {
  var m = document.createElement('div');
  m.className = 'modal';
  m.id = 'modalResDet';
  m.innerHTML = '<div class="modal-content" style="max-width:580px"><div class="modal-header"><h3 id="resDetTitle">Detalhes</h3><span class="modal-close" onclick="closeM(\'modalResDet\')">&times;</span></div><div class="modal-body" id="resDetBody"></div></div>';
  document.body.appendChild(m);
}

// ================================================================
// HELPERS
// ================================================================
function ck(mes) { return (S.checkPagamentos && S.checkPagamentos[mes]) ? S.checkPagamentos[mes] : {}; }
function bk(e) { return (e.origem || '') + '|' + (e.desc || '') + '|' + (e.valor || 0).toFixed(2); }
function fc(v) { return 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR'); }

function showDet(t, items, cc) {
  document.getElementById('resDetTitle').textContent = t;
  var h = '';
  if (!items.length) { h = '<div class="rd-empty">Nenhum item.</div>'; }
  else {
    h = '<div class="rd-list">'; var tot = 0;
    items.forEach(function(e) {
      tot += e.valor;
      var c = cc === 'g' ? 'color:var(--ok)' : (cc === 'r' ? 'color:var(--dn2)' : 'color:var(--tx)');
      h += '<div class="rd-item"><span class="rd-d">' + (e.desc || '-') + '</span><span class="rd-m">' + (e.origem || '') + (e.cat ? ' \u00b7 ' + e.cat : '') + '</span><span class="rd-v" style="' + c + '">' + fmtV(e.valor) + '</span></div>';
    });
    h += '</div>';
    var tc = cc === 'g' ? 'var(--ok)' : (cc === 'r' ? 'var(--dn2)' : 'var(--tx)');
    h += '<div class="rd-tot"><span>Total</span><span style="color:' + tc + '">' + fmtV(tot) + '</span></div>';
  }
  document.getElementById('resDetBody').innerHTML = h;
  openM('modalResDet');
}

// ================================================================
// RENDER RESUMO
// ================================================================
window.renderResumo = function() {
  g('mesLabel').textContent = mesNomeFull(curMes);
  var E = allEntries(curMes), chk = ck(curMes);

  // Cálculos
  var rec = 0, desp = 0, rcf = 0, rpn = 0, dcf = 0, dpn = 0, rcn = 0, rpnn = 0, dcn = 0, dpnn = 0;
  var rI = [], dI = [];
  E.forEach(function(e) {
    var p = !!chk[bk(e)];
    if (e.tipo === 'receita') { rec += e.valor; rI.push(e); if (p) { rcf += e.valor; rcn++; } else { rpn += e.valor; rpnn++; } }
    else { desp += e.valor; dI.push(e); if (p) { dcf += e.valor; dcn++; } else { dpn += e.valor; dpnn++; } }
  });
  var sal = rec - desp;

  var fI = typeof faturaCC === 'function' ? faturaCC(curMes) : [];
  var fT = fI.reduce(function(s, i) { return s + (Number(i.valor) || 0); }, 0);
  var fPC = {};
  fI.forEach(function(i) { var n = i.cartao || 'Sem cart\u00e3o'; fPC[n] = (fPC[n] || 0) + (Number(i.valor) || 0); });

  var cA = S.contratos.filter(function(c) { return !c.encerradoEm; }).length, cR = 0, cD = 0;
  E.forEach(function(e) { if (e.origem === 'Contrato') { if (e.tipo === 'receita') cR += e.valor; else cD += e.valor; } });

  var aA = S.assinaturas.filter(function(s) { return !s.encerradaEm; }).length, aT = 0;
  E.forEach(function(e) { if (e.origem && e.origem.indexOf('Assinatura') === 0) aT += e.valor; });

  // ═══ BUILD HTML ═══
  var h = '<div id="resWrap">';

  // Quick actions
  h += '<div class="rq-row">';
  h += '<div class="rq-btn" onclick="nav(\'checkpag\')">&#9989; Check</div>';
  h += '<div class="rq-btn" onclick="nav(\'extratoCat\')">&#128202; Categorias</div>';
  h += '<div class="rq-btn" onclick="nav(\'lancs\')">&#128221; Lan\u00e7ar</div>';
  h += '</div>';

  // ─── DESKTOP GRID: Main ───
  h += '<div class="rg-main">';
  // Receitas
  h += '<div class="rc6 t-rec clk" onclick="window._resRec()">';
  h += '<div class="rc6-lbl"><span class="rc6-ico">&#128200;</span>Receitas</div>';
  h += '<div class="rc6-val" style="color:var(--ok)">' + fmtV(rec) + '</div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Recebido</span><span class="rc6-rv" style="color:var(--ok)">' + fc(rcf) + ' <span class="rc6-bdg g">' + rcn + '</span></span></div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Pendente</span><span class="rc6-rv" style="color:var(--wn)">' + fc(rpn) + ' <span class="rc6-bdg y">' + rpnn + '</span></span></div>';
  h += '</div>';
  // Despesas
  h += '<div class="rc6 t-desp clk" onclick="window._resDesp()">';
  h += '<div class="rc6-lbl"><span class="rc6-ico">&#128201;</span>Despesas</div>';
  h += '<div class="rc6-val" style="color:var(--dn2)">' + fmtV(desp) + '</div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Pagas</span><span class="rc6-rv" style="color:var(--ok)">' + fc(dcf) + ' <span class="rc6-bdg g">' + dcn + '</span></span></div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Pendentes</span><span class="rc6-rv" style="color:var(--wn)">' + fc(dpn) + ' <span class="rc6-bdg y">' + dpnn + '</span></span></div>';
  h += '</div>';
  // Saldo
  h += '<div class="rc6 t-sal">';
  h += '<div class="rc6-lbl"><span class="rc6-ico">&#128176;</span>Saldo</div>';
  h += '<div class="rc6-val" style="color:' + (sal >= 0 ? 'var(--inf2)' : 'var(--dn2)') + '">' + fmtV(sal) + '</div>';
  h += '</div>';
  h += '</div>'; // rg-main

  // ─── DESKTOP GRID: Sec ───
  h += '<div class="rg-sec">';
  // Fatura
  h += '<div class="rc6 t-cc clk" onclick="window._resFat()">';
  h += '<div class="rc6-lbl"><span class="rc6-ico">&#128179;</span>Fatura Cart\u00e3o</div>';
  h += '<div class="rc6-val" style="color:#e65100">' + fmtV(fT) + '</div>';
  h += '</div>';
  // Contratos
  h += '<div class="rc6 t-cont clk" onclick="nav(\'contratos\')">';
  h += '<div class="rc6-lbl"><span class="rc6-ico">&#128196;</span>Contratos</div>';
  h += '<div class="rc6-val" style="color:var(--pri2)">' + cA + ' <small style="font-size:.55em;font-weight:400">ativos</small></div>';
  h += '</div>';
  // Assinaturas
  h += '<div class="rc6 t-ass clk" onclick="nav(\'assinaturas\')">';
  h += '<div class="rc6-lbl"><span class="rc6-ico">&#128257;</span>Assinaturas</div>';
  h += '<div class="rc6-val" style="color:var(--wn)">' + aA + ' <small style="font-size:.55em;font-weight:400">ativas</small></div>';
  h += '</div>';
  h += '</div>'; // rg-sec

  // ─── MOBILE LIST (hidden on desktop) ───
  h += '<div class="rm-list">';
  // Seção Principal
  h += '<div class="rm-sh">Principal</div>';
  // Receitas
  h += '<div class="rm-ln" onclick="window._resRec()">';
  h += '<span class="rm-ic">&#128200;</span>';
  h += '<span class="rm-lb">Receitas</span>';
  h += '<span class="rm-vl" style="color:var(--ok)">' + fc(rec) + '</span>';
  h += '<span class="rm-sub"><span class="rm-b g">' + rcn + '</span><span class="rm-b y">' + rpnn + '</span></span>';
  h += '</div>';
  // Despesas
  h += '<div class="rm-ln" onclick="window._resDesp()">';
  h += '<span class="rm-ic">&#128201;</span>';
  h += '<span class="rm-lb">Despesas</span>';
  h += '<span class="rm-vl" style="color:var(--dn2)">' + fc(desp) + '</span>';
  h += '<span class="rm-sub"><span class="rm-b g">' + dcn + '</span><span class="rm-b y">' + dpnn + '</span></span>';
  h += '</div>';
  // Saldo
  h += '<div class="rm-ln rm-sal">';
  h += '<span class="rm-ic">&#128176;</span>';
  h += '<span class="rm-lb">Saldo</span>';
  h += '<span class="rm-vl" style="color:' + (sal >= 0 ? 'var(--inf2)' : 'var(--dn2)') + '">' + fc(sal) + '</span>';
  h += '</div>';

  // Seção Secundária
  h += '<div class="rm-sh">Detalhes</div>';
  // Fatura
  h += '<div class="rm-ln" onclick="window._resFat()">';
  h += '<span class="rm-ic">&#128179;</span>';
  h += '<span class="rm-lb">Fatura Cart\u00e3o</span>';
  h += '<span class="rm-vl" style="color:#e65100">' + fc(fT) + '</span>';
  h += '</div>';
  // Contratos
  h += '<div class="rm-ln" onclick="nav(\'contratos\')">';
  h += '<span class="rm-ic">&#128196;</span>';
  h += '<span class="rm-lb">Contratos</span>';
  h += '<span class="rm-vl" style="color:var(--pri2)">' + cA + '</span>';
  h += '</div>';
  // Assinaturas
  h += '<div class="rm-ln" onclick="nav(\'assinaturas\')">';
  h += '<span class="rm-ic">&#128257;</span>';
  h += '<span class="rm-lb">Assinaturas</span>';
  h += '<span class="rm-vl" style="color:var(--wn)">' + fc(aT) + '</span>';
  h += '</div>';

  // Recebido / Pendente breakdown
  h += '<div class="rm-sh">Status pagamentos</div>';
  h += '<div class="rm-ln">';
  h += '<span class="rm-ic" style="color:var(--ok)">\u2713</span>';
  h += '<span class="rm-lb">Recebido</span>';
  h += '<span class="rm-vl" style="color:var(--ok)">' + fc(rcf) + '</span>';
  h += '</div>';
  h += '<div class="rm-ln">';
  h += '<span class="rm-ic" style="color:var(--wn)">\u23F3</span>';
  h += '<span class="rm-lb">A receber</span>';
  h += '<span class="rm-vl" style="color:var(--wn)">' + fc(rpn) + '</span>';
  h += '</div>';
  h += '<div class="rm-ln">';
  h += '<span class="rm-ic" style="color:var(--ok)">\u2713</span>';
  h += '<span class="rm-lb">Pago</span>';
  h += '<span class="rm-vl" style="color:var(--ok)">' + fc(dcf) + '</span>';
  h += '</div>';
  h += '<div class="rm-ln">';
  h += '<span class="rm-ic" style="color:var(--wn)">\u23F3</span>';
  h += '<span class="rm-lb">A pagar</span>';
  h += '<span class="rm-vl" style="color:var(--wn)">' + fc(dpn) + '</span>';
  h += '</div>';

  h += '</div>'; // rm-list

  h += '</div>'; // resWrap

  g('resumoCards').innerHTML = h;

  // ═══ GRÁFICOS ═══
  var ms = []; for (var i = -5; i <= 0; i++) ms.push(addMes(curMes, i));
  var dt = ms.map(function(m) {
    var e = allEntries(m), r = 0, d = 0;
    e.forEach(function(x) { if (x.tipo === 'receita') r += x.valor; else d += x.valor; });
    return { m: m, r: r, d: d };
  });
  var gM = Math.max.apply(null, dt.map(function(x) { return Math.max(x.r, x.d); }).concat([1]));

  var barH = 160; // desktop
  if (window.innerWidth <= 768) barH = 80;
  if (window.innerWidth <= 380) barH = 60;

  g('barChart').innerHTML = dt.map(function(x) {
    var rH = Math.max((x.r / gM) * barH, 3);
    var dH = Math.max((x.d / gM) * barH, 3);
    return '<div class="bar-group"><div class="bar-top-val g">' + fmtI(x.r) + '</div><div class="bar-top-val r">' + fmtI(x.d) + '</div><div class="bar-bars"><div class="bar rec" style="height:' + rH + 'px"></div><div class="bar desp" style="height:' + dH + 'px"></div></div><div class="bar-bottom"><div class="bar-label">' + mesNome(x.m) + '</div></div></div>';
  }).join('');

  // Top categorias
  var cM = {};
  E.filter(function(e) { return e.tipo === 'despesa'; }).forEach(function(e) { cM[e.cat] = (cM[e.cat] || 0) + e.valor; });
  var tp = Object.entries(cM).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
  var mC = tp.length ? tp[0][1] : 1;
  g('topCats').innerHTML = tp.length ? tp.map(function(t) {
    return '<div class="top-cat-item"><div class="top-cat-hdr"><span>' + t[0] + '</span><span style="font-weight:700">' + fmtV(t[1]) + '</span></div><div class="top-cat-bar"><div class="top-cat-fill" style="width:' + (t[1] / mC) * 100 + '%"></div></div></div>';
  }).join('') : '<p style="color:var(--tx3)">Sem despesas</p>';

  // Guardar dados para modais
  window._resData = { rI: rI, dI: dI, fI: fI, fT: fT };
};

// ================================================================
// MODAIS
// ================================================================
window._resRec = function() { showDet('Receitas \u2014 ' + mesNomeFull(curMes), (window._resData || {}).rI || [], 'g'); };
window._resDesp = function() { showDet('Despesas \u2014 ' + mesNomeFull(curMes), (window._resData || {}).dI || [], 'r'); };
window._resFat = function() {
  var d = window._resData || {}, fi = d.fI || [];
  document.getElementById('resDetTitle').textContent = 'Fatura Cart\u00e3o \u2014 ' + mesNomeFull(curMes);
  var h = '';
  if (!fi.length) { h = '<div class="rd-empty">Nenhuma compra.</div>'; }
  else {
    var pc = {};
    fi.forEach(function(i) { var n = i.cartao || 'Sem cart\u00e3o'; if (!pc[n]) pc[n] = []; pc[n].push(i); });
    h = '<div class="rd-list">';
    Object.keys(pc).forEach(function(c) {
      var it = pc[c], st = it.reduce(function(s, i) { return s + (Number(i.valor) || 0); }, 0);
      h += '<div style="padding:8px 10px;background:var(--bg3);font-weight:700;font-size:.8em;border-bottom:1px solid var(--bg4);">&#128179; ' + c + ' <span style="float:right;color:#e65100">' + fmtV(st) + '</span></div>';
      it.forEach(function(x) {
        h += '<div class="rd-item"><span class="rd-d">' + (x.desc || '-') + '</span><span class="rd-m">' + (x.tipo || '') + (x.cat ? ' \u00b7 ' + x.cat : '') + '</span><span class="rd-v" style="color:#e65100">' + fmtV(x.valor) + '</span></div>';
      });
    });
    h += '</div><div class="rd-tot"><span>Total</span><span style="color:#e65100">' + fmtV(d.fT || 0) + '</span></div>';
  }
  document.getElementById('resDetBody').innerHTML = h;
  openM('modalResDet');
};

console.log('[Financeiro Pro] Resumo Enhanced v6 \u2014 Mobile: lista compacta estilo app banc\u00e1rio.');
})();

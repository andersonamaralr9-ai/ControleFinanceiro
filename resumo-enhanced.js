// resumo-enhanced.js v6.1 — Fix: gráfico mobile não cobre rótulos
(function(){
'use strict';

// CSS movido para app.css (bloco 1 deste arquivo)

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

// Linha "Fechamento" do card de fatura (como no layout aprovado).
// So e exibida quando o dia e inequivoco: com cartoes de dias diferentes
// um unico numero seria enganoso, entao mostramos a quantidade de cartoes.
function _resLinhaFechamento(){
  var dias = {};
  (S.cartoes || []).forEach(function(c){
    var d = parseInt(c.fechamento, 10);
    if(d >= 1 && d <= 31) dias[d] = 1;
  });
  var lista = Object.keys(dias);
  if(!lista.length) return '';
  if(lista.length > 1){
    return '<div class="rc6-row"><span class="rc6-rl">Cartões</span>' +
           '<span class="rc6-rv">' + S.cartoes.length + '</span></div>';
  }
  var dia = String(lista[0]).padStart(2, '0');
  var mes = (curMes || '').split('-')[1] || '';
  return '<div class="rc6-row"><span class="rc6-rl">Fechamento</span>' +
         '<span class="rc6-rv">' + dia + (mes ? '/' + mes : '') + '</span></div>';
}

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
  var subtEl = g('resumoSubtitle');
  if (subtEl) subtEl.textContent = mesNomeFull(curMes);
  var E = allEntries(curMes), chk = ck(curMes);

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

  var h = '<div id="resWrap">';

  // Quick actions (discreet)
  h += '<div class="rq-row">';
  h += '<div class="rq-btn" onclick="nav(\'checkpag\')">&#9989; Check pagamentos</div>';
  // Abre direto o modal (o modal vive no body, nao dentro de #pg-lancs),
  // para lancar sem sair do Resumo.
  h += '<div class="rq-btn primary" onclick="abrirNovoLanc()">&#65291; Lançar</div>';
  h += '</div>';

  // --- SALDO HERO (destaque, estilo neobank) ---
  h += '<div class="r-hero">';
  h += '<div><div class="r-hero-lbl">Saldo do mes</div><div class="r-hero-val">' + fmtV(sal) + '</div>';
  h += '<div class="r-hero-sub">Receitas ' + fmtV(rec) + ' &minus; Despesas ' + fmtV(desp) + '</div></div>';
  h += '<div><span class="r-hero-tag">' + mesNome(curMes) + '</span></div>';
  h += '</div>';

  // --- DESKTOP GRID: Main ---
  h += '<div class="rg-main">';
  // Padrao neobank aprovado: o numero principal fica neutro (branco).
  // A cor aparece so no ponto do rotulo e nos valores de status ja
  // conciliados (recebido/pagas). Colorir o total tambem competia com eles.
  h += '<div class="rc6 t-rec clk" onclick="window._resRec()">';
  h += '<div class="rc6-lbl"><span class="rc6-dot" style="background:var(--ok)"></span>Receitas</div>';
  h += '<div class="rc6-val">' + fmtV(rec) + '</div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Recebido</span><span class="rc6-rv" style="color:var(--ok)">' + fc(rcf) + ' <span class="rc6-bdg g">' + rcn + '</span></span></div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Pendente</span><span class="rc6-rv">' + fc(rpn) + ' <span class="rc6-bdg y">' + rpnn + '</span></span></div>';
  h += '</div>';
  h += '<div class="rc6 t-desp clk" onclick="window._resDesp()">';
  h += '<div class="rc6-lbl"><span class="rc6-dot" style="background:var(--dn2)"></span>Despesas</div>';
  h += '<div class="rc6-val">' + fmtV(desp) + '</div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Pagas</span><span class="rc6-rv" style="color:var(--ok)">' + fc(dcf) + ' <span class="rc6-bdg g">' + dcn + '</span></span></div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Pendentes</span><span class="rc6-rv">' + fc(dpn) + ' <span class="rc6-bdg y">' + dpnn + '</span></span></div>';
  h += '</div>';
  h += '<div class="rc6 t-cc clk" onclick="window._resFat()">';
  h += '<div class="rc6-lbl"><span class="rc6-dot" style="background:var(--pri2)"></span>Fatura do cartão</div>';
  h += '<div class="rc6-val">' + fmtV(fT) + '</div>';
  h += '<div class="rc6-row"><span class="rc6-rl">Compras no mês</span><span class="rc6-rv">' + fI.length + '</span></div>';
  h += _resLinhaFechamento();
  h += '</div>';
  h += '</div>';

  // fatura/contratos/assinaturas movidos para #resumoFeed (ver renderResumoFeed)

  // ─── MOBILE LIST ───
  h += '<div class="rm-list">';
  h += '<div class="rm-sh">Principal</div>';
  h += '<div class="rm-ln" onclick="window._resRec()"><span class="rm-ic">&#128200;</span><span class="rm-lb">Receitas</span><span class="rm-vl" style="color:var(--ok)">' + fc(rec) + '</span><span class="rm-sub"><span class="rm-b g">' + rcn + '</span><span class="rm-b y">' + rpnn + '</span></span></div>';
  h += '<div class="rm-ln" onclick="window._resDesp()"><span class="rm-ic">&#128201;</span><span class="rm-lb">Despesas</span><span class="rm-vl" style="color:var(--dn2)">' + fc(desp) + '</span><span class="rm-sub"><span class="rm-b g">' + dcn + '</span><span class="rm-b y">' + dpnn + '</span></span></div>';
  h += '<div class="rm-ln rm-sal"><span class="rm-ic">&#128176;</span><span class="rm-lb">Saldo</span><span class="rm-vl" style="color:' + (sal >= 0 ? 'var(--inf2)' : 'var(--dn2)') + '">' + fc(sal) + '</span></div>';
  h += '<div class="rm-sh">Detalhes</div>';
  h += '<div class="rm-ln" onclick="window._resFat()"><span class="rm-ic">&#128179;</span><span class="rm-lb">Fatura Cart\u00e3o</span><span class="rm-vl" style="color:#e65100">' + fc(fT) + '</span></div>';
  h += '<div class="rm-ln" onclick="nav(\'contratos\')"><span class="rm-ic">&#128196;</span><span class="rm-lb">Contratos</span><span class="rm-vl" style="color:var(--pri2)">' + cA + '</span></div>';
  h += '<div class="rm-ln" onclick="nav(\'assinaturas\')"><span class="rm-ic">&#128257;</span><span class="rm-lb">Assinaturas</span><span class="rm-vl" style="color:var(--wn)">' + fc(aT) + '</span></div>';
  h += '<div class="rm-sh">Status pagamentos</div>';
  h += '<div class="rm-ln"><span class="rm-ic" style="color:var(--ok)">\u2713</span><span class="rm-lb">Recebido</span><span class="rm-vl" style="color:var(--ok)">' + fc(rcf) + '</span></div>';
  h += '<div class="rm-ln"><span class="rm-ic" style="color:var(--wn)">\u23F3</span><span class="rm-lb">A receber</span><span class="rm-vl" style="color:var(--wn)">' + fc(rpn) + '</span></div>';
  h += '<div class="rm-ln"><span class="rm-ic" style="color:var(--ok)">\u2713</span><span class="rm-lb">Pago</span><span class="rm-vl" style="color:var(--ok)">' + fc(dcf) + '</span></div>';
  h += '<div class="rm-ln"><span class="rm-ic" style="color:var(--wn)">\u23F3</span><span class="rm-lb">A pagar</span><span class="rm-vl" style="color:var(--wn)">' + fc(dpn) + '</span></div>';
  h += '</div>';

  h += '</div>';

  g('resumoCards').innerHTML = h;

  // ═══ GRÁFICOS ═══
  var ms = []; for (var i = -5; i <= 0; i++) ms.push(addMes(curMes, i));
  var dt = ms.map(function(m) {
    var e = allEntries(m), r = 0, d = 0;
    e.forEach(function(x) { if (x.tipo === 'receita') r += x.valor; else d += x.valor; });
    return { m: m, r: r, d: d };
  });
  var gM = Math.max.apply(null, dt.map(function(x) { return Math.max(x.r, x.d); }).concat([1]));

  // *** FIX: no desktop as barras usam % (preenchem a altura real do container,
  // que agora varia conforme o card lateral); no mobile mantém px fixo ***
  var isMob = window.innerWidth <= 768;
  var maxBarPx = isMob ? 55 : 160;
  if (window.innerWidth <= 380) maxBarPx = 40;

  g('barChart').innerHTML = dt.map(function(x) {
    var rUnit = isMob ? Math.max(Math.round((x.r / gM) * maxBarPx), 3) + 'px' : Math.max((x.r / gM) * 100, 2) + '%';
    var dUnit = isMob ? Math.max(Math.round((x.d / gM) * maxBarPx), 3) + 'px' : Math.max((x.d / gM) * 100, 2) + '%';
    // Mobile: formatar valores de forma mais curta
    var rv, dv;
    if (isMob) {
      rv = x.r >= 1000 ? Math.round(x.r / 1000) + 'k' : Math.round(x.r);
      dv = x.d >= 1000 ? Math.round(x.d / 1000) + 'k' : Math.round(x.d);
    } else {
      rv = fmtI(x.r);
      dv = fmtI(x.d);
    }
    return '<div class="bar-group">' +
      '<div class="bar-bars">' +
        '<div class="bar-stack"><div class="bar-top-val g">' + rv + '</div><div class="bar rec" style="height:' + rUnit + '"></div></div>' +
        '<div class="bar-stack"><div class="bar-top-val r">' + dv + '</div><div class="bar desp" style="height:' + dUnit + '"></div></div>' +
      '</div>' +
      '<div class="bar-bottom"><div class="bar-label">' + mesNome(x.m) + '</div></div>' +
    '</div>';
  }).join('');

  // Top categorias — linhas com ícone
  var catIcons = { 'Moradia': '🏠', 'Alimentação': '🛒', 'Transporte': '🚗', 'Saúde': '❤️', 'Assinaturas': '📺', 'Lazer': '🎉', 'Educação': '📚' };
  var catColors = ['#f87171', '#fbbf24', '#a78bfa', '#38bdf8', '#2dd4bf', '#e65100'];
  var cM = {};
  E.filter(function(e) { return e.tipo === 'despesa'; }).forEach(function(e) { cM[e.cat] = (cM[e.cat] || 0) + e.valor; });
  var tp = Object.entries(cM).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
  var mC = tp.length ? tp[0][1] : 1;
  g('topCats').innerHTML = tp.length ? tp.map(function(t, i) {
    var ic = catIcons[t[0]] || '💸';
    var cl = catColors[i % catColors.length];
    return '<div class="rc-item"><div class="rc-ic" style="background:' + cl + '22">' + ic + '</div>' +
      '<div class="rc-body"><div class="rc-top"><span class="rc-name">' + t[0] + '</span><span class="rc-val" style="color:' + cl + '">' + fmtV(t[1]) + '</span></div>' +
      '<div class="rc-bar-bg"><div class="rc-bar-fill" style="background:' + cl + ';width:' + (t[1] / mC) * 100 + '%"></div></div></div></div>';
  }).join('') : '<p style="color:var(--tx3)">Sem despesas</p>';

  // Feed: fatura / contratos / assinaturas
  var feedEl = g('resumoFeed');
  if (feedEl) {
    var fh = '';
    fh += '<div class="rf-item"><div class="rf-ic" style="background:#e6510022">💳</div><div class="rf-mid" onclick="window._resFat()"><div class="rf-name">Fatura Cartão</div><div class="rf-sub">' + fI.length + ' compra' + (fI.length === 1 ? '' : 's') + '</div></div><div class="rf-val" style="color:#e65100">' + fmtV(fT) + '</div></div>';
    fh += '<div class="rf-item"><div class="rf-ic" style="background:rgba(108,92,231,.15)">📄</div><div class="rf-mid" onclick="nav(\'contratos\')"><div class="rf-name">Contratos</div><div class="rf-sub">receita ' + fmtV(cR) + ' · despesa ' + fmtV(cD) + '</div></div><div class="rf-val" style="color:var(--pri2)">' + cA + ' ativos</div></div>';
    fh += '<div class="rf-item"><div class="rf-ic" style="background:rgba(253,203,110,.15)">🔁</div><div class="rf-mid" onclick="nav(\'assinaturas\')"><div class="rf-name">Assinaturas</div><div class="rf-sub">' + aA + ' ativa' + (aA === 1 ? '' : 's') + '</div></div><div class="rf-val" style="color:var(--wn)">' + fmtV(aT) + '</div></div>';
    feedEl.innerHTML = fh;
  }

  window._resData = { rI: rI, dI: dI, fI: fI, fT: fT };

  // Atualiza cards de investimento com o mês navegado
  setTimeout(function(){ if(typeof renderResumoInvest==='function') renderResumoInvest(); }, 10);
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

// ================================================================
// INVEST RESUMO \u2014 per-month metrics + mobile list
// ================================================================
window.renderResumoInvest = function() {
  var el = g('resumoInvest'); if (!el) return;
  var invs = S.investimentos || []; if (!invs.length) { el.innerHTML = ''; return; }
  var ma = (typeof curMes !== 'undefined' && curMes) ? curMes : mesAtual();

  var saldoInicial = 0, aporteMes = 0, resgateMes = 0, rentMes = 0;

  invs.forEach(function(inv) {
    var cap = Number(inv.valor) || 0;
    (inv.movimentacoes || []).forEach(function(m) {
      var mMes = getMes(m.data);
      var v = Number(m.valor) || 0;
      if (mMes < ma) {
        cap += m.tipo === 'resgate' ? -v : v;
      } else if (mMes === ma) {
        if (m.tipo === 'aporte') aporteMes += v;
        else resgateMes += v;
      }
    });
    (inv.rentabilidade || []).forEach(function(r) {
      var v = Number(r.valor) || 0;
      if (r.mes < ma) cap += v;
      else if (r.mes === ma) rentMes += v;
    });
    saldoInicial += cap;
  });

  var saldoFechamento = saldoInicial + aporteMes - resgateMes + rentMes;
  var diff = saldoFechamento - saldoInicial;
  var rentColor = rentMes > 0 ? 'var(--ok)' : (rentMes < 0 ? 'var(--dn2)' : 'var(--tx3)');
  var salColor = diff >= 0 ? 'var(--ok)' : 'var(--dn2)';

  // --- DESKTOP: hero card unico (ri-desk oculto no mobile via CSS) ---
  var dh = '<div class="ri-desk ih-card">';
  dh += '<div class="ih-top"><div class="ih-title">Investimentos &mdash; ' + mesNomeFull(ma) + '</div><div class="ih-link" onclick="nav(\'investimentos\')">Ver detalhes &rarr;</div></div>';
  dh += '<div class="ih-grid">';
  dh += '<div class="ih-item"><div class="ih-lbl">Saldo Inicial</div><div class="ih-val" style="color:var(--inf2)">' + fmtV(saldoInicial) + '</div><div class="ih-sub">Abertura de ' + mesNome(ma) + '</div></div>';
  dh += '<div class="ih-item"><div class="ih-lbl">Rentabilidade</div><div class="ih-val" style="color:' + rentColor + '">' + (rentMes >= 0 ? '+' : '') + fmtV(rentMes) + '</div><div class="ih-sub">Aportes ' + fmtV(aporteMes) + ' &middot; Resgates ' + fmtV(resgateMes) + '</div></div>';
  dh += '<div class="ih-item"><div class="ih-lbl">Saldo Fechamento</div><div class="ih-val" style="color:var(--pri2)">' + fmtV(saldoFechamento) + '</div><div class="ih-sub" style="color:' + salColor + '">' + (diff >= 0 ? '+' : '') + fmtV(diff) + ' no mes</div></div>';
  dh += '</div></div>';

  // \u2500\u2500\u2500 MOBILE: .rm-list (oculto no desktop via CSS .rm-list { display:none }) \u2500\u2500\u2500
  var mh = '<div class="rm-list">';
  mh += '<div class="rm-sh">Investimentos</div>';
  mh += '<div class="rm-ln"><span class="rm-ic">\ud83d\udcb0</span><span class="rm-lb">Saldo Inicial</span><span class="rm-vl" style="color:var(--inf2)">' + fc(saldoInicial) + '</span></div>';
  mh += '<div class="rm-ln"><span class="rm-ic">\ud83d\udcc8</span><span class="rm-lb">Rentabilidade</span><span class="rm-vl" style="color:' + rentColor + '">' + (rentMes >= 0 ? '+' : '') + fc(rentMes) + '</span></div>';
  mh += '<div class="rm-ln"><span class="rm-ic" style="color:var(--ok)">\u2191</span><span class="rm-lb">Aportes</span><span class="rm-vl" style="color:var(--ok)">' + fc(aporteMes) + '</span></div>';
  mh += '<div class="rm-ln"><span class="rm-ic" style="color:var(--dn2)">\u2193</span><span class="rm-lb">Resgates</span><span class="rm-vl" style="color:var(--dn2)">' + fc(resgateMes) + '</span></div>';
  mh += '<div class="rm-ln" onclick="nav(\'investimentos\')"><span class="rm-ic">\ud83d\udcb3</span><span class="rm-lb">Saldo Fechamento</span><span class="rm-vl" style="color:var(--pri2)">' + fc(saldoFechamento) + '</span></div>';
  mh += '</div>';

  el.innerHTML = dh + mh;
};

// Auto re-render ao carregar: garante layout enhanced mesmo no primeiro render (antes do initCloud)
if (document.body.classList.contains('page-resumo')) {
  window.renderResumo();
}

console.log('[Financeiro Pro] Resumo Enhanced v6.3 \u2014 invest por m\u00eas + mobile list.');
})();

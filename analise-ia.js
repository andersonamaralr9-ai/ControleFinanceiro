// analise-ia.js v3.0
(function () {
'use strict';

var aiMes = null;

window.initAnalise = function () {
  aiMes = (typeof curMes !== 'undefined' && curMes) ? curMes : mesAtual();
  _aiPopularSelect();
  g('aiMesBase').value = aiMes;
  g('aiResultado').style.display = 'none';
};

function _aiPopularSelect () {
  var sel = g('aiMesBase');
  if (!sel) return;
  sel.innerHTML = '';
  for (var i = -11; i <= 2; i++) {
    var m = addMes(mesAtual(), i);
    var op = document.createElement('option');
    op.value = m;
    op.textContent = mesNomeFull(m);
    sel.appendChild(op);
  }
}

function _fmt (v) {
  return 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _fmtI (v) {
  return 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
}

function _pct (v, total) {
  if (!total) return '0%';
  return ((v / total) * 100).toFixed(1) + '%';
}

function _delta (atual, media) {
  if (!media) return null;
  var d = ((atual - media) / media) * 100;
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
}

function _mesStats (mes) {
  var E = allEntries(mes);
  var rec = 0, desp = 0;
  E.forEach(function (e) {
    if (e.tipo === 'receita') rec += e.valor;
    else desp += e.valor;
  });
  return { rec: rec, desp: desp, sal: rec - desp, entries: E };
}

function _catMap (entries) {
  var map = {};
  entries.forEach(function (e) {
    if (e.tipo === 'despesa') map[e.cat] = (map[e.cat] || 0) + e.valor;
  });
  return map;
}

function _checkStatus (mes) {
  var chk = (S.checkPagamentos && S.checkPagamentos[mes]) ? S.checkPagamentos[mes] : {};
  var E = allEntries(mes);
  var recPago = 0, recPend = 0, despPago = 0, despPend = 0;
  E.forEach(function (e) {
    var key = (e.origem || '') + '|' + (e.desc || '') + '|' + (e.valor || 0).toFixed(2);
    var pago = !!chk[key];
    if (e.tipo === 'receita') { if (pago) recPago += e.valor; else recPend += e.valor; }
    else { if (pago) despPago += e.valor; else despPend += e.valor; }
  });
  return { recPago: recPago, recPend: recPend, despPago: despPago, despPend: despPend };
}

function _invStats (mes) {
  var invs = S.investimentos || [];
  if (!invs.length) return null;
  var saldoInicial = 0, aporteMes = 0, resgateMes = 0, rentMes = 0, rentAcum = 0;
  invs.forEach(function (inv) {
    var cap = Number(inv.valor) || 0;
    (inv.movimentacoes || []).forEach(function (m) {
      var mMes = getMes(m.data);
      var v = Number(m.valor) || 0;
      if (mMes < mes) cap += m.tipo === 'resgate' ? -v : v;
      else if (mMes === mes) { if (m.tipo === 'aporte') aporteMes += v; else resgateMes += v; }
    });
    (inv.rentabilidade || []).forEach(function (r) {
      var v = Number(r.valor) || 0;
      rentAcum += v;
      if (r.mes < mes) cap += v;
      else if (r.mes === mes) rentMes += v;
    });
    saldoInicial += cap;
  });
  return {
    count: invs.length,
    saldoInicial: saldoInicial,
    aporte: aporteMes,
    resgate: resgateMes,
    rent: rentMes,
    rentAcum: rentAcum,
    saldoFechamento: saldoInicial + aporteMes - resgateMes + rentMes
  };
}

function _parcelasAtivas (mes) {
  var lista = [];
  (S.comprasCartao || []).forEach(function (c) {
    var p = c.parcelas || 1;
    if (p <= 1) return;
    var mC = getMes(c.data);
    var cart = (S.cartoes || []).find(function (x) { return x.id === c.cartaoId; });
    var cartNome = cart ? cart.nome : 'Cartão';
    for (var i = 0; i < p; i++) {
      if (addMes(mC, i) === mes) {
        var vp = (Number(c.valor) || 0) / p;
        lista.push({
          desc: c.desc,
          cartao: cartNome,
          parcelaAtual: i + 1,
          totalParcelas: p,
          valorParcela: vp,
          mesTermino: addMes(mC, p - 1),
          restantes: p - (i + 1)
        });
        break;
      }
    }
  });
  return lista.sort(function (a, b) { return b.valorParcela - a.valorParcela; });
}

function _tendencia (histValido) {
  if (histValido.length < 2) return 'poucos dados (menos de 2 meses com registros)';
  var despesas = histValido.map(function (h) { return h.desp; });
  var diffs = [];
  for (var i = 1; i < despesas.length; i++) diffs.push(despesas[i] - despesas[i - 1]);
  var media = diffs.reduce(function (s, v) { return s + v; }, 0) / diffs.length;
  if (Math.abs(media) < 150) return 'estável';
  return media > 0 ? 'crescente (↑)' : 'decrescente (↓)';
}

window.gerarPromptIA = function () {
  var mes = g('aiMesBase').value || mesAtual();
  var incluirInv = g('aiIncluirInv').value === 'sim';
  var objetivos = (g('aiObjetivos').value || '').trim();

  // ── Dados base ──
  var atual = _mesStats(mes);
  var chk = _checkStatus(mes);

  // Histórico: últimos 3 meses, ignorando meses sem dados
  var histTodos = [];
  for (var i = -3; i <= -1; i++) {
    var hm = addMes(mes, i);
    var hs = _mesStats(hm);
    histTodos.push({ label: mesNomeFull(hm), mes: hm, rec: hs.rec, desp: hs.desp, sal: hs.sal, entries: hs.entries });
  }
  // Apenas meses com dados reais
  var hist = histTodos.filter(function (h) { return h.rec > 0 || h.desp > 0; });
  var nHist = hist.length || 1;

  var mediaRec  = hist.reduce(function (s, h) { return s + h.rec; }, 0) / nHist;
  var mediaDesp = hist.reduce(function (s, h) { return s + h.desp; }, 0) / nHist;
  var mediaSal  = mediaRec - mediaDesp;
  var taxaPoupanca = mediaRec > 0 ? ((mediaSal / mediaRec) * 100).toFixed(1) : '0';
  var tendencia = _tendencia(hist);
  var aviso3Meses = nHist < 3 ? ' (base: ' + nHist + ' mês' + (nHist > 1 ? 'es' : '') + ' com dados — meses sem registros foram excluídos da média)' : '';

  // Categorias: média apenas sobre meses com dados (mesmo nHist)
  var catHistSoma = {};
  hist.forEach(function (h) {
    var cm = _catMap(h.entries);
    Object.keys(cm).forEach(function (k) { catHistSoma[k] = (catHistSoma[k] || 0) + cm[k]; });
  });
  var catMediaMap = {};
  Object.keys(catHistSoma).forEach(function (k) { catMediaMap[k] = catHistSoma[k] / nHist; });
  var catAtual = _catMap(atual.entries);
  var todasCats = Object.keys(Object.assign({}, catAtual, catMediaMap))
    .map(function (k) { return { cat: k, atual: catAtual[k] || 0, media: catMediaMap[k] || 0 }; })
    .sort(function (a, b) { return b.atual - a.atual; }).slice(0, 10);

  // Fixos — somente contratos de despesa (excluir receita-contratos como salário)
  var contrDesp = (S.contratos || []).filter(function (c) { return !c.encerradoEm && c.tipo !== 'receita'; });
  var contrRec  = (S.contratos || []).filter(function (c) { return !c.encerradoEm && c.tipo === 'receita'; });
  var assAtivas = (S.assinaturas || []).filter(function (s) { return !s.encerradaEm; });
  var totalCont = contrDesp.reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);
  var totalAss  = assAtivas.reduce(function (s, a) { return s + (Number(a.valor) || 0); }, 0);
  var totalFixo = totalCont + totalAss;
  var pctFixo   = mediaRec > 0 ? ((totalFixo / mediaRec) * 100).toFixed(1) : '0';

  // Parcelas
  var parcelas = _parcelasAtivas(mes);
  var totalParcelas = parcelas.reduce(function (s, pc) { return s + pc.valorParcela; }, 0);
  var pctParc = mediaRec > 0 ? ((totalParcelas / mediaRec) * 100).toFixed(1) : '0';
  var pctComprometido = mediaRec > 0 ? (((totalFixo + totalParcelas) / mediaRec) * 100).toFixed(1) : '0';

  // Projeção futura
  var futuros = [];
  for (var j = 1; j <= 3; j++) {
    var fm = addMes(mes, j);
    var fs = _mesStats(fm);
    futuros.push({ label: mesNomeFull(fm), rec: fs.rec, desp: fs.desp, sal: fs.sal });
  }

  // Investimentos
  var inv = incluirInv ? _invStats(mes) : null;

  // ── Montar prompt ──
  var L = '\n';
  var SEP = '══════════════════════════════════════════' + L;
  var p = '';

  p += 'Você é um consultor financeiro pessoal especializado em finanças domésticas brasileiras.' + L;
  p += 'Analise o perfil financeiro completo abaixo e entregue um relatório detalhado conforme solicitado ao final.' + L;
  p += L + SEP;

  // 1. Perfil
  p += '## 1. PERFIL FINANCEIRO — ' + mesNomeFull(mes) + L;
  if (aviso3Meses) p += '⚠️ Nota: ' + aviso3Meses.trim() + L;
  p += L;
  p += 'Renda média mensal: ' + _fmtI(mediaRec) + L;
  p += 'Gasto médio mensal: ' + _fmtI(mediaDesp) + L;
  p += 'Saldo médio mensal: ' + _fmtI(mediaSal) + L;
  p += 'Taxa de poupança média: ' + taxaPoupanca + '%' + L;
  p += 'Tendência de gastos: ' + tendencia + L;
  p += L;
  p += 'Comprometimento fixo mensal (contratos despesa + assinaturas): ' + _fmtI(totalFixo) + '/mês = ' + pctFixo + '% da renda média' + L;
  p += 'Comprometimento com parcelas de cartão: ' + _fmtI(totalParcelas) + '/mês = ' + pctParc + '% da renda média' + L;
  p += 'Total comprometido: ' + _fmtI(totalFixo + totalParcelas) + '/mês = ' + pctComprometido + '% da renda média' + L;
  if (contrRec.length) {
    var totalContRec = contrRec.reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);
    p += '(Contratos de receita fixa — não incluídos no comprometimento: ' + _fmtI(totalContRec) + '/mês)' + L;
  }
  p += L;

  // 2. Situação do mês
  p += SEP;
  p += '## 2. SITUAÇÃO DO MÊS — ' + mesNomeFull(mes) + L + L;
  p += 'Receitas previstas: ' + _fmt(atual.rec) + L;
  p += '  → Recebido: ' + _fmt(chk.recPago) + ' | Pendente: ' + _fmt(chk.recPend) + L;
  p += 'Despesas previstas: ' + _fmt(atual.desp) + L;
  p += '  → Pago: ' + _fmt(chk.despPago) + ' (' + _pct(chk.despPago, atual.desp) + ') | A pagar: ' + _fmt(chk.despPend) + L;
  p += 'Saldo projetado: ' + _fmt(atual.sal) + L;
  if (nHist >= 1) {
    p += 'vs. média histórica: receita ' + (_delta(atual.rec, mediaRec) || '-') + ' | despesa ' + (_delta(atual.desp, mediaDesp) || '-') + L;
  }
  p += L;

  // 3. Histórico
  p += SEP;
  p += '## 3. HISTÓRICO — meses com registros (até 3 meses anteriores)' + L + L;
  if (hist.length === 0) {
    p += 'Nenhum mês anterior com dados registrados.' + L;
  } else {
    hist.forEach(function (h) {
      var tx = h.rec > 0 ? ((h.sal / h.rec) * 100).toFixed(1) + '%' : '-';
      p += h.label + ': Receita ' + _fmtI(h.rec) + ' | Despesa ' + _fmtI(h.desp) + ' | Saldo ' + _fmtI(h.sal) + ' | Poupança ' + tx + L;
    });
  }
  p += L;

  // 4. Categorias
  p += SEP;
  p += '## 4. GASTOS POR CATEGORIA — mês atual vs média histórica' + (nHist < 3 ? ' (' + nHist + ' mês(es) de histórico)' : '') + L + L;
  todasCats.forEach(function (c) {
    var dStr = nHist > 0 && c.media > 0 ? ' | Δ ' + _delta(c.atual, c.media) : '';
    var mediaStr = nHist > 0 ? ' | Média ' + _fmtI(c.media) : ' | sem histórico';
    p += '• ' + c.cat + ': ' + _fmtI(c.atual) + ' no mês' + mediaStr + dStr + L;
  });
  p += L;

  // 5. Comprometimentos fixos
  p += SEP;
  p += '## 5. COMPROMETIMENTOS FIXOS (' + _fmtI(totalFixo) + '/mês)' + L + L;
  if (contrDesp.length) {
    p += 'Contratos de despesa (' + contrDesp.length + ') — ' + _fmtI(totalCont) + '/mês:' + L;
    contrDesp.forEach(function (c) {
      p += '  • ' + c.desc + ': ' + _fmt(c.valor) + '/mês' + L;
    });
    p += L;
  }
  if (assAtivas.length) {
    p += 'Assinaturas ativas (' + assAtivas.length + ') — ' + _fmtI(totalAss) + '/mês:' + L;
    assAtivas.forEach(function (a) {
      p += '  • ' + a.nome + ': ' + _fmt(a.valor) + '/mês' + L;
    });
    p += L;
  }
  if (!contrDesp.length && !assAtivas.length) {
    p += 'Nenhum comprometimento fixo registrado.' + L + L;
  }

  // 6. Parcelas
  p += SEP;
  p += '## 6. PARCELAS DE CARTÃO EM ANDAMENTO (' + _fmtI(totalParcelas) + '/mês)' + L + L;
  if (parcelas.length) {
    parcelas.slice(0, 10).forEach(function (pc) {
      p += '• ' + pc.desc + ' [' + pc.cartao + ']: ' + _fmt(pc.valorParcela) + '/mês';
      p += ' — parcela ' + pc.parcelaAtual + '/' + pc.totalParcelas;
      p += ' — término em ' + mesNomeFull(pc.mesTermino);
      if (pc.restantes > 0) p += ' (' + pc.restantes + ' restante' + (pc.restantes > 1 ? 's' : '') + ')';
      p += L;
    });
  } else {
    p += 'Nenhuma compra parcelada ativa.' + L;
  }
  p += L;

  // 7. Projeção futura
  p += SEP;
  p += '## 7. PROJEÇÃO — próximos 3 meses (fixos + parcelas + contratos já conhecidos)' + L + L;
  futuros.forEach(function (f) {
    var alerta = f.sal < 0 ? ' ⚠️ SALDO NEGATIVO' : '';
    p += f.label + ': Receita ' + _fmtI(f.rec) + ' | Despesa prevista ' + _fmtI(f.desp) + ' | Saldo ' + _fmtI(f.sal) + alerta + L;
  });
  p += '(Despesas variáveis como lazer, mercado e alimentação são lançadas ao longo do mês — valores futuros refletem apenas compromissos já conhecidos.)' + L;
  p += L;

  // 8. Investimentos
  if (inv) {
    p += SEP;
    p += '## 8. INVESTIMENTOS — ' + mesNomeFull(mes) + L + L;
    p += 'Número de ativos: ' + inv.count + L;
    p += 'Saldo de abertura do mês: ' + _fmt(inv.saldoInicial) + L;
    p += 'Aportes no mês: ' + _fmt(inv.aporte) + (mediaRec > 0 ? ' (' + _pct(inv.aporte, mediaRec) + ' da renda)' : '') + L;
    p += 'Resgates no mês: ' + _fmt(inv.resgate) + L;
    p += 'Rentabilidade no mês: ' + _fmt(inv.rent) + (inv.saldoInicial > 0 ? ' (' + _pct(inv.rent, inv.saldoInicial) + ' do saldo)' : '') + L;
    p += 'Saldo de fechamento: ' + _fmt(inv.saldoFechamento) + L;
    p += 'Rentabilidade acumulada total: ' + _fmt(inv.rentAcum) + L;
    p += L;
  }

  // 9. Objetivos
  if (objetivos) {
    p += SEP;
    p += '## 9. OBJETIVOS E CONTEXTO DECLARADOS' + L + L;
    p += objetivos + L;
    p += L;
  }

  // Análise solicitada
  p += SEP;
  p += '## ANÁLISE SOLICITADA' + L + L;
  p += 'Com base em todos os dados acima, por favor:' + L + L;
  p += '1. Avalie a saúde financeira geral com uma nota de 0 a 10 e justifique com os números.' + L;
  p += '2. Identifique os 3 principais alertas ou riscos, citando valores específicos.' + L;
  p += '3. Analise os gastos por categoria: quais estão acima do padrão histórico e merecem revisão?' + L;
  p += '4. O comprometimento de ' + pctComprometido + '% da renda com fixos + parcelas está em nível saudável? Qual o limite recomendado?' + L;
  p += '5. Com base na projeção dos próximos 3 meses, há risco de aperto financeiro? Em qual mês?' + L;
  if (inv) {
    p += '6. A relação entre saldo investido e renda mensal está adequada? A estratégia de aportes faz sentido?' + L;
  }
  if (objetivos) {
    var qn = inv ? '7' : '6';
    p += qn + '. Considerando meus objetivos, o que preciso ajustar para alcançá-los? Em quanto tempo é realista?' + L;
  }
  p += L;
  p += 'Finalize com 3 ações práticas e prioritárias para os próximos 30 dias, ordenadas por impacto.' + L;
  p += L + SEP;

  g('aiPrompt').value = p;
  g('aiResultado').style.display = '';
  g('aiPrompt').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.copiarPromptIA = function () {
  var ta = g('aiPrompt');
  ta.select();
  ta.setSelectionRange(0, 99999);
  var btn = document.querySelector('#aiResultado .btn-copy');
  var feedback = function () {
    if (btn) { var o = btn.textContent; btn.textContent = '✓ Copiado!'; setTimeout(function () { btn.textContent = o; }, 2000); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ta.value).then(feedback);
  } else {
    document.execCommand('copy');
    feedback();
  }
};

})();

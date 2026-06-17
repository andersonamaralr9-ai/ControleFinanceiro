// analise-ia.js v1.0
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

function _catResume (entries) {
  var map = {};
  entries.forEach(function (e) {
    if (e.tipo === 'despesa') {
      map[e.cat] = (map[e.cat] || 0) + e.valor;
    }
  });
  return Object.entries(map).sort(function (a, b) { return b[1] - a[1]; });
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

function _invStats (mes) {
  var invs = S.investimentos || [];
  if (!invs.length) return null;
  var saldoInicial = 0, aporteMes = 0, resgateMes = 0, rentMes = 0;
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
    saldoFechamento: saldoInicial + aporteMes - resgateMes + rentMes
  };
}

window.gerarPromptIA = function () {
  var mes = g('aiMesBase').value || mesAtual();
  var incluirInv = g('aiIncluirInv').value === 'sim';
  var objetivos = (g('aiObjetivos').value || '').trim();

  // Mês atual
  var atual = _mesStats(mes);

  // Histórico 3 meses anteriores
  var hist = [];
  for (var i = -3; i <= -1; i++) {
    var hm = addMes(mes, i);
    var hs = _mesStats(hm);
    hist.push({ mes: hm, label: mesNomeFull(hm), rec: hs.rec, desp: hs.desp, sal: hs.sal, entries: hs.entries });
  }

  // Média de categorias nos 3 meses históricos
  var catSoma = {};
  hist.forEach(function (h) {
    _catResume(h.entries).forEach(function (kv) {
      catSoma[kv[0]] = (catSoma[kv[0]] || 0) + kv[1];
    });
  });
  var catMedia = Object.entries(catSoma).map(function (kv) {
    return [kv[0], kv[1] / 3];
  }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 8);

  // Projeção 3 meses futuros (contratos + assinaturas + parcelas)
  var futuros = [];
  for (var j = 1; j <= 3; j++) {
    var fm = addMes(mes, j);
    var fs = _mesStats(fm);
    futuros.push({ label: mesNomeFull(fm), rec: fs.rec, desp: fs.desp, sal: fs.sal });
  }

  // Investimentos
  var inv = incluirInv ? _invStats(mes) : null;

  // ─── Montar prompt ───
  var p = '';
  p += 'Você é um consultor financeiro pessoal. Analise os dados reais abaixo e forneça:\n';
  p += '1. Avaliação geral da saúde financeira\n';
  p += '2. Principais alertas ou riscos identificados\n';
  p += '3. Categorias de gastos que merecem atenção\n';
  p += '4. Projeção e riscos para os próximos meses\n';
  p += '5. Recomendações práticas e prioritárias\n';
  if (objetivos) p += '6. Como estou em relação aos meus objetivos declarados\n';
  p += '\nSeja direto, objetivo e use os números para embasar cada ponto.\n';
  p += '\n══════════════════════════════════════\n';

  p += '\n## SITUAÇÃO ATUAL — ' + mesNomeFull(mes) + '\n';
  p += '- Receitas previstas: ' + _fmt(atual.rec) + '\n';
  p += '- Despesas previstas: ' + _fmt(atual.desp) + '\n';
  p += '- Saldo previsto: ' + _fmt(atual.sal) + '\n';
  var catAtual = _catResume(atual.entries).slice(0, 6);
  if (catAtual.length) {
    p += '\nPrincipais categorias de despesa no mês:\n';
    catAtual.forEach(function (kv) { p += '  • ' + kv[0] + ': ' + _fmt(kv[1]) + '\n'; });
  }

  p += '\n## HISTÓRICO — últimos 3 meses\n';
  hist.forEach(function (h) {
    p += '- ' + h.label + ': Receita ' + _fmt(h.rec) + ' | Despesa ' + _fmt(h.desp) + ' | Saldo ' + _fmt(h.sal) + '\n';
  });

  p += '\n## MÉDIA DE GASTOS POR CATEGORIA (3 meses)\n';
  if (catMedia.length) {
    catMedia.forEach(function (kv) { p += '  • ' + kv[0] + ': ' + _fmt(kv[1]) + '/mês\n'; });
  } else {
    p += '  Sem dados suficientes.\n';
  }

  p += '\n## DESPESAS FUTURAS PREVISTAS (contratos + assinaturas + parcelas já lançadas)\n';
  futuros.forEach(function (f) {
    p += '- ' + f.label + ': Receita ' + _fmt(f.rec) + ' | Despesa ' + _fmt(f.desp) + ' | Saldo ' + _fmt(f.sal) + '\n';
  });

  if (inv) {
    p += '\n## INVESTIMENTOS — ' + mesNomeFull(mes) + '\n';
    p += '- Quantidade de ativos: ' + inv.count + '\n';
    p += '- Saldo inicial (abertura do mês): ' + _fmt(inv.saldoInicial) + '\n';
    p += '- Aportes no mês: ' + _fmt(inv.aporte) + '\n';
    p += '- Resgates no mês: ' + _fmt(inv.resgate) + '\n';
    p += '- Rentabilidade no mês: ' + _fmt(inv.rent) + '\n';
    p += '- Saldo de fechamento: ' + _fmt(inv.saldoFechamento) + '\n';
  }

  if (objetivos) {
    p += '\n## OBJETIVOS E CONTEXTO DECLARADOS\n';
    p += objetivos + '\n';
  }

  p += '\n══════════════════════════════════════\n';
  p += 'Com base em todos esses dados, forneça a análise solicitada acima.\n';

  g('aiPrompt').value = p;
  g('aiResultado').style.display = '';
  g('aiPrompt').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.copiarPromptIA = function () {
  var ta = g('aiPrompt');
  ta.select();
  ta.setSelectionRange(0, 99999);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ta.value).then(function () {
      _aiFeedback('✓ Copiado!');
    });
  } else {
    document.execCommand('copy');
    _aiFeedback('✓ Copiado!');
  }
};

function _aiFeedback (msg) {
  var btn = document.querySelector('#aiResultado .btn-copy');
  if (!btn) return;
  var orig = btn.textContent;
  btn.textContent = msg;
  setTimeout(function () { btn.textContent = orig; }, 2000);
}

})();

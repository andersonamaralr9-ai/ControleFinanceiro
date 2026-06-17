// patrimonio.js v2.0

var _patVinculandoId = null;
var _patSaldoId = null;

var _patTipoLabel = { imovel: '🏠 Imóvel', veiculo: '🚗 Veículo', outro: '📦 Outro' };

function _patFmt(v) {
  return 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function _patFmtI(v) {
  return 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
}
function _patN(v) {
  return Number(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;
}

// Valor do contrato em um determinado mês (respeitando histórico de ajustes)
function _contValorMes(c, mes) {
  var val = Number(c.valor) || 0;
  (c.historico || []).forEach(function(h) {
    var hd = (h.de || h.desde || '').substring(0, 7);
    if (hd && mes >= hd) val = Number(h.valor) || 0;
  });
  return val;
}

// Acumulado histórico de um patrimônio
function _acumuladoPatrimonio(pat) {
  var contratos = (S.contratos || []).filter(function(c) {
    return (pat.contratoIds || []).indexOf(c.id) >= 0;
  });
  if (!contratos.length) return { rec: 0, desp: 0, meses: 0 };
  var inicio = null;
  contratos.forEach(function(c) {
    var s = (c.inicio || '').substring(0, 7);
    if (s && (!inicio || s < inicio)) inicio = s;
  });
  if (!inicio) return { rec: 0, desp: 0, meses: 0 };
  var hoje = mesAtual();
  var rec = 0, desp = 0, meses = 0;
  var m = inicio;
  while (m <= hoje) {
    contratos.forEach(function(c) {
      var cInicio = (c.inicio || '').substring(0, 7);
      if (!cInicio || m < cInicio) return;
      if (c.encerradoEm && m > c.encerradoEm) return;
      var val = _contValorMes(c, m);
      if (c.tipo === 'receita') rec += val; else desp += val;
    });
    meses++;
    m = addMes(m, 1);
  }
  return { rec: rec, desp: desp, meses: meses };
}

// Fluxo mensal atual
function _fluxoMensalAtual(pat) {
  var mes = mesAtual();
  var contratos = (S.contratos || []).filter(function(c) {
    return (pat.contratoIds || []).indexOf(c.id) >= 0;
  });
  var rec = 0, desp = 0;
  contratos.forEach(function(c) {
    var cInicio = (c.inicio || '').substring(0, 7);
    if (!cInicio || mes < cInicio) return;
    if (c.encerradoEm && mes > c.encerradoEm) return;
    var val = _contValorMes(c, mes);
    if (c.tipo === 'receita') rec += val; else desp += val;
  });
  return { rec: rec, desp: desp, liquido: rec - desp };
}

// Saldo devedor atual (último registro do histórico)
function _saldoDevedor(pat) {
  var hist = (pat.finHistorico || []).slice().sort(function(a, b) {
    return a.mes < b.mes ? -1 : 1;
  });
  if (!hist.length) return null;
  return hist[hist.length - 1];
}

// ── ADD PATRIMÔNIO ──
window.addPatrimonio = function() {
  var nome = g('patNome').value.trim();
  if (!nome) return alert('Informe o nome do ativo.');
  var pat = {
    id: uid(),
    nome: nome,
    tipo: g('patTipo').value,
    valorAquisicao: _patN(g('patValor').value),
    dataAquisicao: g('patData').value || '',
    financiado: g('patFin').value === 'sim',
    obs: g('patObs').value.trim(),
    contratoIds: [],
    finHistorico: []
  };
  if (!Array.isArray(S.patrimonios)) S.patrimonios = [];
  S.patrimonios.push(pat);
  salvar();
  g('patNome').value = ''; g('patValor').value = '';
  g('patData').value = ''; g('patObs').value = '';
  renderPatrimonio();
};

window.editPatrimonio = function(id) {
  var pat = (S.patrimonios || []).find(function(p) { return p.id === id; });
  if (!pat) return;
  g('epId').value = id;
  g('epNome').value = pat.nome || '';
  g('epTipo').value = pat.tipo || 'imovel';
  g('epValor').value = pat.valorAquisicao ? pat.valorAquisicao.toFixed(2).replace('.', ',') : '';
  g('epData').value = pat.dataAquisicao || '';
  g('epFin').value = pat.financiado ? 'sim' : 'nao';
  g('epObs').value = pat.obs || '';
  openM('modalEditPat');
};

window.salvarEditPat = function() {
  var id = g('epId').value;
  var pat = (S.patrimonios || []).find(function(p) { return p.id === id; });
  if (!pat) return;
  var nome = g('epNome').value.trim();
  if (!nome) return alert('Informe o nome do ativo.');
  pat.nome = nome;
  pat.tipo = g('epTipo').value;
  pat.valorAquisicao = _patN(g('epValor').value);
  pat.dataAquisicao = g('epData').value || '';
  pat.financiado = g('epFin').value === 'sim';
  pat.obs = g('epObs').value.trim();
  salvar();
  closeM('modalEditPat');
  renderPatrimonio();
};

window.delPatrimonio = function(id) {
  if (!confirm('Remover este ativo?')) return;
  S.patrimonios = (S.patrimonios || []).filter(function(p) { return p.id !== id; });
  salvar();
  renderPatrimonio();
};

// ── VINCULAR CONTRATOS ──
window.abrirVinculo = function(id) {
  _patVinculandoId = id;
  var pat = (S.patrimonios || []).find(function(p) { return p.id === id; });
  if (!pat) return;
  var ocupados = {};
  (S.patrimonios || []).forEach(function(p) {
    if (p.id !== id) {
      (p.contratoIds || []).forEach(function(cid) { ocupados[cid] = p.nome; });
    }
  });
  var contratos = S.contratos || [];
  var h = '';
  if (!contratos.length) {
    h = '<p style="color:var(--tx3)">Nenhum contrato cadastrado.</p>';
  } else {
    contratos.forEach(function(c) {
      var vinculado = (pat.contratoIds || []).indexOf(c.id) >= 0;
      var ocupadoPor = ocupados[c.id];
      var disabled = ocupadoPor ? 'disabled' : '';
      var nota = ocupadoPor ? ' <span style="color:var(--tx3);font-size:.75em">(vinculado a ' + ocupadoPor + ')</span>' : '';
      var cor = c.tipo === 'receita' ? 'var(--ok)' : 'var(--dn2)';
      h += '<label style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--bg3);cursor:pointer">';
      h += '<input type="checkbox" data-cid="' + c.id + '" ' + (vinculado ? 'checked' : '') + ' ' + disabled + '>';
      h += '<span style="flex:1;font-size:.84em"><span style="color:' + cor + ';font-weight:700">' + (c.tipo === 'receita' ? '▲' : '▼') + '</span> ';
      h += c.desc + ' — ' + _patFmt(c.valor) + '/mês' + nota + '</span>';
      h += '</label>';
    });
  }
  g('patContrList').innerHTML = h;
  openM('modalPatContr');
};

window.salvarVinculoContr = function() {
  var pat = (S.patrimonios || []).find(function(p) { return p.id === _patVinculandoId; });
  if (!pat) return;
  var checks = g('patContrList').querySelectorAll('input[type=checkbox]:not(:disabled)');
  pat.contratoIds = [];
  checks.forEach(function(cb) { if (cb.checked) pat.contratoIds.push(cb.dataset.cid); });
  salvar();
  closeM('modalPatContr');
  renderPatrimonio();
};

// ── SALDO DEVEDOR ──
window.abrirSaldo = function(id) {
  _patSaldoId = id;
  var pat = (S.patrimonios || []).find(function(p) { return p.id === id; });
  if (!pat) return;

  // Preenche mês com mês atual
  g('sdMes').value = mesAtual();
  g('sdValor').value = '';

  // Monta histórico existente
  var hist = (pat.finHistorico || []).slice().sort(function(a, b) { return b.mes.localeCompare(a.mes); });
  var hh = '';
  if (hist.length) {
    hh = '<div style="margin-top:14px"><div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px">Histórico</div>';
    hist.forEach(function(e) {
      hh += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--bg3);font-size:.83em">';
      hh += '<span>' + e.mes.replace('-', '/') + '</span>';
      hh += '<span style="font-weight:700">' + _patFmt(e.valor) + '</span>';
      hh += '<button class="btn btn-sm btn-danger" onclick="delSaldo(\'' + id + '\',\'' + e.mes + '\')">✕</button>';
      hh += '</div>';
    });
    hh += '</div>';
  }
  g('sdHistorico').innerHTML = hh;
  openM('modalSaldo');
};

window.salvarSaldo = function() {
  var pat = (S.patrimonios || []).find(function(p) { return p.id === _patSaldoId; });
  if (!pat) return;
  var mes = g('sdMes').value;
  var valor = _patN(g('sdValor').value);
  if (!mes || !valor) return alert('Preencha mês e valor.');
  if (!Array.isArray(pat.finHistorico)) pat.finHistorico = [];
  // Substitui se já existe entrada para o mesmo mês
  pat.finHistorico = pat.finHistorico.filter(function(e) { return e.mes !== mes; });
  pat.finHistorico.push({ mes: mes, valor: valor });
  salvar();
  closeM('modalSaldo');
  renderPatrimonio();
};

window.delSaldo = function(patId, mes) {
  var pat = (S.patrimonios || []).find(function(p) { return p.id === patId; });
  if (!pat) return;
  pat.finHistorico = (pat.finHistorico || []).filter(function(e) { return e.mes !== mes; });
  salvar();
  closeM('modalSaldo');
  renderPatrimonio();
};

// ── RENDER PRINCIPAL ──
window.renderPatrimonio = function() {
  var pats = S.patrimonios || [];
  var el = g('patGrid');
  if (!el) return;

  // ── RESUMO DO TOPO ──
  var totalValor = 0, totalDivida = 0, totalRecMes = 0, totalDespMes = 0;
  var totalRecAcum = 0, totalDespAcum = 0;

  pats.forEach(function(pat) {
    totalValor += pat.valorAquisicao || 0;
    var sd = _saldoDevedor(pat);
    if (sd) totalDivida += sd.valor;
    var fl = _fluxoMensalAtual(pat);
    totalRecMes += fl.rec;
    totalDespMes += fl.desp;
    var ac = _acumuladoPatrimonio(pat);
    totalRecAcum += ac.rec;
    totalDespAcum += ac.desp;
  });

  var patrimonioLiquido = totalValor - totalDivida;
  var fluxoLiqMes = totalRecMes - totalDespMes;
  var fluxoLiqAcum = totalRecAcum - totalDespAcum;
  var liqMesColor = fluxoLiqMes >= 0 ? 'var(--ok)' : 'var(--dn2)';
  var liqAcumColor = fluxoLiqAcum >= 0 ? 'var(--ok)' : 'var(--dn2)';
  var patLiqColor = patrimonioLiquido >= 0 ? 'var(--pri2)' : 'var(--dn2)';

  var resumo = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">';

  resumo += '<div class="rc6" style="border-left-color:var(--inf2)!important">';
  resumo += '<div class="rc6-lbl">Valor dos Ativos</div>';
  resumo += '<div class="rc6-val" style="color:var(--inf2)">' + _patFmtI(totalValor) + '</div>';
  resumo += '<div class="rc6-row"><span class="rc6-rl">' + pats.length + ' ativo' + (pats.length !== 1 ? 's' : '') + '</span></div>';
  resumo += '</div>';

  resumo += '<div class="rc6" style="border-left-color:var(--dn2)!important">';
  resumo += '<div class="rc6-lbl">Saldo Devedor Total</div>';
  resumo += '<div class="rc6-val" style="color:var(--dn2)">' + _patFmtI(totalDivida) + '</div>';
  resumo += '<div class="rc6-row"><span class="rc6-rl" style="color:var(--tx3)">Ativos financiados</span></div>';
  resumo += '</div>';

  resumo += '<div class="rc6" style="border-left-color:' + patLiqColor + '!important">';
  resumo += '<div class="rc6-lbl">Patrimônio Líquido</div>';
  resumo += '<div class="rc6-val" style="color:' + patLiqColor + '">' + _patFmtI(patrimonioLiquido) + '</div>';
  resumo += '<div class="rc6-row"><span class="rc6-rl" style="color:var(--tx3)">Valor − Dívidas</span></div>';
  resumo += '</div>';

  resumo += '<div class="rc6" style="border-left-color:' + liqMesColor + '!important">';
  resumo += '<div class="rc6-lbl">Fluxo Líquido / Mês</div>';
  resumo += '<div class="rc6-val" style="color:' + liqMesColor + '">' + _patFmtI(fluxoLiqMes) + '</div>';
  resumo += '<div class="rc6-row"><span class="rc6-rl" style="color:var(--ok)">▲ ' + _patFmtI(totalRecMes) + '</span><span class="rc6-rl" style="color:var(--dn2)">▼ ' + _patFmtI(totalDespMes) + '</span></div>';
  resumo += '</div>';

  resumo += '<div class="rc6" style="border-left-color:' + liqAcumColor + '!important">';
  resumo += '<div class="rc6-lbl">Fluxo Acumulado</div>';
  resumo += '<div class="rc6-val" style="color:' + liqAcumColor + '">' + _patFmtI(fluxoLiqAcum) + '</div>';
  resumo += '<div class="rc6-row"><span class="rc6-rl" style="color:var(--ok)">▲ ' + _patFmtI(totalRecAcum) + '</span><span class="rc6-rl" style="color:var(--dn2)">▼ ' + _patFmtI(totalDespAcum) + '</span></div>';
  resumo += '</div>';

  resumo += '</div>';

  if (!pats.length) {
    el.innerHTML = resumo + '<p style="color:var(--tx3);margin-top:8px">Nenhum ativo cadastrado ainda.</p>';
    return;
  }

  // ── CARDS DOS ATIVOS ──
  var cards = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">';

  pats.forEach(function(pat) {
    var fluxo = _fluxoMensalAtual(pat);
    var acum  = _acumuladoPatrimonio(pat);
    var liqColor = fluxo.liquido >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var acumLiq = acum.rec - acum.desp;
    var acumColor = acumLiq >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var contrVinc = (S.contratos || []).filter(function(c) {
      return (pat.contratoIds || []).indexOf(c.id) >= 0;
    });

    // Saldo devedor
    var sdAtual = _saldoDevedor(pat);
    var sdInicial = null;
    if (pat.finHistorico && pat.finHistorico.length > 1) {
      var hist = pat.finHistorico.slice().sort(function(a, b) { return a.mes.localeCompare(b.mes); });
      sdInicial = hist[0];
    }
    var amortizado = (sdInicial && sdAtual) ? sdInicial.valor - sdAtual.valor : null;

    var c = '<div class="sub-box" style="display:flex;flex-direction:column;gap:0">';

    // Cabeçalho
    c += '<div class="sub-box-header" style="display:flex;justify-content:space-between;align-items:center">';
    c += '<div><strong>' + pat.nome + '</strong> <span style="font-size:.72em;color:var(--tx3)">' + (_patTipoLabel[pat.tipo] || pat.tipo) + '</span>';
    if (pat.financiado) c += ' <span class="badge badge-warning" style="font-size:.65em">Financiado</span>';
    c += '</div>';
    c += '<div style="display:flex;gap:6px">';
    c += '<button class="btn btn-sm btn-outline" onclick="editPatrimonio(\'' + pat.id + '\')">✏️</button>';
    c += '<button class="btn btn-sm btn-danger" onclick="delPatrimonio(\'' + pat.id + '\')">🗑</button>';
    c += '</div>';
    c += '</div>';

    c += '<div class="sub-box-body" style="padding-bottom:4px">';

    // Aquisição
    if (pat.valorAquisicao) {
      c += '<p style="font-size:.8em;color:var(--tx3)">Valor de aquisição: <strong style="color:var(--tx)">' + _patFmt(pat.valorAquisicao) + '</strong>';
      if (pat.dataAquisicao) c += ' &nbsp;·&nbsp; ' + pat.dataAquisicao.substring(0, 7).replace('-', '/');
      c += '</p>';
    }
    if (pat.obs) c += '<p style="font-size:.78em;color:var(--tx3)">' + pat.obs + '</p>';

    // Saldo devedor (financiados)
    if (pat.financiado) {
      c += '<div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:8px">';
      c += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px">Financiamento</div>';
      if (sdAtual) {
        c += '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:baseline">';
        c += '<span style="font-size:.88em">Saldo devedor: <strong style="color:var(--dn2)">' + _patFmt(sdAtual.valor) + '</strong></span>';
        c += '<span style="font-size:.72em;color:var(--tx3)">ref. ' + sdAtual.mes.replace('-', '/') + '</span>';
        c += '</div>';
        if (amortizado !== null && amortizado > 0) {
          c += '<div style="font-size:.78em;color:var(--ok);margin-top:4px">✓ Amortizado: ' + _patFmt(amortizado) + ' (desde ' + sdInicial.mes.replace('-', '/') + ')</div>';
        }
        if (pat.valorAquisicao && sdAtual.valor) {
          var equity = pat.valorAquisicao - sdAtual.valor;
          var equityColor = equity >= 0 ? 'var(--ok)' : 'var(--dn2)';
          c += '<div style="font-size:.78em;margin-top:4px">Patrimônio líquido do ativo: <strong style="color:' + equityColor + '">' + _patFmt(equity) + '</strong></div>';
        }
      } else {
        c += '<p style="font-size:.78em;color:var(--tx3)">Nenhum saldo devedor informado.</p>';
      }
      c += '<button class="btn btn-sm btn-outline" style="margin-top:8px" onclick="abrirSaldo(\'' + pat.id + '\')">📝 Atualizar saldo devedor</button>';
      c += '</div>';
    }

    // Fluxo mensal
    c += '<div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:8px">';
    c += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px">Fluxo Mensal Atual</div>';
    c += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
    c += '<span style="font-size:.82em">▲ <span style="color:var(--ok)">' + _patFmtI(fluxo.rec) + '</span></span>';
    c += '<span style="font-size:.82em">▼ <span style="color:var(--dn2)">' + _patFmtI(fluxo.desp) + '</span></span>';
    c += '<span style="font-size:.82em;font-weight:700">Líq: <span style="color:' + liqColor + '">' + _patFmtI(fluxo.liquido) + '</span></span>';
    c += '</div></div>';

    // Acumulado
    if (acum.meses > 0) {
      c += '<div style="margin-top:8px;padding:10px;background:var(--bg3);border-radius:8px">';
      c += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px">Acumulado (' + acum.meses + ' meses)</div>';
      c += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
      c += '<span style="font-size:.82em">▲ <span style="color:var(--ok)">' + _patFmtI(acum.rec) + '</span></span>';
      c += '<span style="font-size:.82em">▼ <span style="color:var(--dn2)">' + _patFmtI(acum.desp) + '</span></span>';
      c += '<span style="font-size:.82em;font-weight:700">Líq: <span style="color:' + acumColor + '">' + _patFmtI(acumLiq) + '</span></span>';
      c += '</div></div>';
    }

    // Contratos vinculados
    c += '<div style="margin-top:10px">';
    c += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:5px">Contratos vinculados</div>';
    if (contrVinc.length) {
      contrVinc.forEach(function(ct) {
        var cor = ct.tipo === 'receita' ? 'var(--ok)' : 'var(--dn2)';
        var enc = ct.encerradoEm ? ' <span style="color:var(--tx3)">(encerrado)</span>' : '';
        c += '<div style="font-size:.78em;padding:4px 0;border-bottom:1px solid var(--bg3)">';
        c += '<span style="color:' + cor + '">' + (ct.tipo === 'receita' ? '▲' : '▼') + '</span> ';
        c += ct.desc + ' — ' + _patFmt(ct.valor) + '/mês' + enc;
        c += '</div>';
      });
    } else {
      c += '<p style="font-size:.78em;color:var(--tx3)">Nenhum contrato vinculado.</p>';
    }
    c += '</div>';

    // Ações
    c += '<div class="sub-box-actions" style="margin-top:10px">';
    c += '<button class="btn btn-sm btn-outline" onclick="abrirVinculo(\'' + pat.id + '\')">🔗 Vincular contratos</button>';
    c += '</div>';

    c += '</div></div>';
    cards += c;
  });

  cards += '</div>';
  el.innerHTML = resumo + cards;
};

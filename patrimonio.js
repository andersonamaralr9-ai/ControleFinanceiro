// patrimonio.js v1.0

var _patVinculandoId = null;

var _patTipoLabel = { imovel: '🏠 Imóvel', veiculo: '🚗 Veículo', outro: '📦 Outro' };

function _patFmt(v) {
  return 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function _patFmtI(v) {
  return 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
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

// Acumulado histórico de um patrimônio: soma de todos os meses desde o contrato mais antigo
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

// Fluxo mensal atual (valor do contrato no mês corrente)
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

window.addPatrimonio = function() {
  var nome = g('patNome').value.trim();
  if (!nome) return alert('Informe o nome do ativo.');
  var pat = {
    id: uid(),
    nome: nome,
    tipo: g('patTipo').value,
    valorAquisicao: parseN(g('patValor').value),
    dataAquisicao: g('patData').value || '',
    financiado: g('patFin').value === 'sim',
    obs: g('patObs').value.trim(),
    contratoIds: []
  };
  if (!Array.isArray(S.patrimonios)) S.patrimonios = [];
  S.patrimonios.push(pat);
  salvar();
  g('patNome').value = ''; g('patValor').value = ''; g('patData').value = ''; g('patObs').value = '';
  renderPatrimonio();
};

window.delPatrimonio = function(id) {
  if (!confirm('Remover este ativo?')) return;
  S.patrimonios = (S.patrimonios || []).filter(function(p) { return p.id !== id; });
  salvar();
  renderPatrimonio();
};

window.abrirVinculo = function(id) {
  _patVinculandoId = id;
  var pat = (S.patrimonios || []).find(function(p) { return p.id === id; });
  if (!pat) return;

  // IDs já vinculados a OUTROS patrimônios (não pode duplicar)
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
      var label = c.desc + ' — ' + _patFmt(c.valor) + '/mês (' + (c.tipo === 'receita' ? 'receita' : 'despesa') + ')';
      h += '<label style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--bg3);cursor:pointer">';
      h += '<input type="checkbox" data-cid="' + c.id + '" ' + (vinculado ? 'checked' : '') + ' ' + disabled + '>';
      h += '<span style="flex:1;font-size:.84em"><span style="color:' + cor + ';font-weight:700">' + (c.tipo === 'receita' ? '▲' : '▼') + '</span> ' + label + nota + '</span>';
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

window.renderPatrimonio = function() {
  var pats = S.patrimonios || [];
  var el = g('patGrid');
  if (!el) return;

  if (!pats.length) {
    el.innerHTML = '<p style="color:var(--tx3);margin-top:16px">Nenhum ativo cadastrado ainda.</p>';
    return;
  }

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-top:16px">';

  pats.forEach(function(pat) {
    var fluxo = _fluxoMensalAtual(pat);
    var acum  = _acumuladoPatrimonio(pat);
    var liqColor = fluxo.liquido >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var acumColor = (acum.rec - acum.desp) >= 0 ? 'var(--ok)' : 'var(--dn2)';
    var contrVinc = (S.contratos || []).filter(function(c) {
      return (pat.contratoIds || []).indexOf(c.id) >= 0;
    });

    html += '<div class="sub-box" style="display:flex;flex-direction:column;gap:0">';

    // Cabeçalho
    html += '<div class="sub-box-header" style="display:flex;justify-content:space-between;align-items:center">';
    html += '<div><strong>' + pat.nome + '</strong> <span style="font-size:.72em;color:var(--tx3)">' + (_patTipoLabel[pat.tipo] || pat.tipo) + '</span>';
    if (pat.financiado) html += ' <span class="badge badge-warning" style="font-size:.65em">Financiado</span>';
    html += '</div>';
    html += '<button class="btn btn-sm btn-danger" onclick="delPatrimonio(\'' + pat.id + '\')">🗑</button>';
    html += '</div>';

    // Detalhes de aquisição
    html += '<div class="sub-box-body" style="padding-bottom:0">';
    if (pat.valorAquisicao) {
      html += '<p style="font-size:.8em;color:var(--tx3)">Valor de aquisição: <strong style="color:var(--tx)">' + _patFmt(pat.valorAquisicao) + '</strong>';
      if (pat.dataAquisicao) html += ' &nbsp;·&nbsp; ' + pat.dataAquisicao.substring(0, 7).replace('-', '/');
      html += '</p>';
    }
    if (pat.obs) html += '<p style="font-size:.78em;color:var(--tx3)">' + pat.obs + '</p>';

    // Fluxo mensal
    html += '<div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:8px">';
    html += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px">Fluxo Mensal Atual</div>';
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
    html += '<span style="font-size:.8em">▲ <span style="color:var(--ok)">' + _patFmtI(fluxo.rec) + '</span></span>';
    html += '<span style="font-size:.8em">▼ <span style="color:var(--dn2)">' + _patFmtI(fluxo.desp) + '</span></span>';
    html += '<span style="font-size:.8em;font-weight:700">Líq: <span style="color:' + liqColor + '">' + _patFmtI(fluxo.liquido) + '</span></span>';
    html += '</div></div>';

    // Acumulado histórico
    if (acum.meses > 0) {
      var acumLiq = acum.rec - acum.desp;
      html += '<div style="margin-top:8px;padding:10px;background:var(--bg3);border-radius:8px">';
      html += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:6px">Acumulado Histórico (' + acum.meses + ' meses)</div>';
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
      html += '<span style="font-size:.8em">▲ <span style="color:var(--ok)">' + _patFmtI(acum.rec) + '</span></span>';
      html += '<span style="font-size:.8em">▼ <span style="color:var(--dn2)">' + _patFmtI(acum.desp) + '</span></span>';
      html += '<span style="font-size:.8em;font-weight:700">Líq: <span style="color:' + acumColor + '">' + _patFmtI(acumLiq) + '</span></span>';
      html += '</div></div>';
    }

    // Contratos vinculados
    html += '<div style="margin-top:10px">';
    html += '<div style="font-size:.65em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:5px">Contratos vinculados</div>';
    if (contrVinc.length) {
      contrVinc.forEach(function(c) {
        var cor = c.tipo === 'receita' ? 'var(--ok)' : 'var(--dn2)';
        var enc = c.encerradoEm ? ' <span style="color:var(--tx3)">(encerrado)</span>' : '';
        html += '<div style="font-size:.78em;padding:4px 0;border-bottom:1px solid var(--bg3)">';
        html += '<span style="color:' + cor + '">' + (c.tipo === 'receita' ? '▲' : '▼') + '</span> ';
        html += c.desc + ' — ' + _patFmt(c.valor) + '/mês' + enc;
        html += '</div>';
      });
    } else {
      html += '<p style="font-size:.78em;color:var(--tx3)">Nenhum contrato vinculado.</p>';
    }
    html += '</div>';

    // Ações
    html += '<div class="sub-box-actions" style="margin-top:10px">';
    html += '<button class="btn btn-sm btn-outline" onclick="abrirVinculo(\'' + pat.id + '\')">🔗 Vincular contratos</button>';
    html += '</div>';

    html += '</div></div>';
  });

  html += '</div>';
  el.innerHTML = html;
};

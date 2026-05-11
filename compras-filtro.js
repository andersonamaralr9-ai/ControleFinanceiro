// compras-filtro.js v4 — Resumo no topo, form no meio, compras embaixo
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
.cp-filter-bar{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px 20px;margin-bottom:16px;box-shadow:var(--sh);}
.cp-filter-row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;}
.cp-filter-row .form-group{flex:1;min-width:150px;}
.cp-filter-row .form-group label{font-size:.72em;color:var(--tx3);font-weight:600;margin-bottom:4px;display:block;}
.cp-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;}
.cp-section{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px 20px;margin-bottom:20px;box-shadow:var(--sh);}
.cp-section h3{font-size:.88em;color:var(--tx2);font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.cp-section h3 .cp-count{background:var(--bg3);padding:2px 10px;border-radius:12px;font-size:.82em;color:var(--tx3);}
.cp-table{width:100%;border-collapse:collapse;}
.cp-table th{background:var(--bg3);padding:10px 12px;text-align:left;font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;}
.cp-table td{padding:9px 12px;border-bottom:1px solid var(--bg3);font-size:.84em;}
.cp-table tr:hover td{background:rgba(108,92,231,.04);}
.cp-parc-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.72em;font-weight:700;}
.cp-parc-ativa{background:rgba(0,206,201,.12);color:var(--ok);}
.cp-parc-quitada{background:rgba(108,92,231,.12);color:var(--pri2);}
.cp-highlight{background:rgba(253,203,110,.06)!important;}
.cp-totais-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:20px;}
.cp-total-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 18px;box-shadow:var(--sh);}
.cp-total-card h4{font-size:.82em;color:var(--tx2);margin-bottom:8px;}
.cp-total-card .cp-tc-row{display:flex;justify-content:space-between;font-size:.82em;padding:3px 0;}
.cp-total-card .cp-tc-row .cp-tc-label{color:var(--tx3);}
.cp-total-card .cp-tc-row .cp-tc-val{font-weight:700;}
.cp-mes-nav{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px;}
.cp-mes-nav .cp-mes-label{font-size:1.05em;font-weight:700;min-width:160px;text-align:center;}
.cp-mob-cards{display:none;}
@media(max-width:768px){
  .cp-filter-row{flex-direction:column;}
  .cp-filter-row .form-group{min-width:100%;}
  .cp-summary{grid-template-columns:1fr 1fr;gap:8px;}
  .cp-summary .card{padding:10px 8px;}
  .cp-summary .card .card-label{font-size:.62em;}
  .cp-summary .card .card-value{font-size:.9em;}
  .cp-totais-grid{grid-template-columns:1fr;}
  .cp-mes-nav .cp-mes-label{font-size:.88em;min-width:120px;}
  .cp-section .table-wrap{display:none!important;}
  .cp-mob-cards{display:block!important;}
  .cpm{background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:8px;overflow:hidden;max-width:100%;box-sizing:border-box;}
  .cpm-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
  .cpm-desc{font-size:.85em;font-weight:600;margin-bottom:4px;word-break:break-word;}
  .cpm-meta{display:flex;flex-wrap:wrap;gap:4px;font-size:.72em;color:var(--tx3);align-items:center;}
  .cpm-meta span{flex-shrink:0;}
  .cpm-val{font-size:.95em;font-weight:700;color:var(--dn2);flex-shrink:0;}
  .cpm-date{font-size:.7em;color:var(--tx3);}
  .cpm-acts{display:flex;gap:4px;margin-top:6px;}
}
@media(max-width:380px){
  .cp-summary{grid-template-columns:1fr!important;}
  .cp-summary .card .card-value{font-size:.82em;}
}
`;
document.head.appendChild(sty);

// ================================================================
// VARIÁVEIS
// ================================================================
var cpFiltroMes = mesAtual();
var _baseRenderCompras = window.renderCompras;

// ================================================================
// OVERRIDE renderCompras
// ================================================================
window.renderCompras = function(){
  if(_baseRenderCompras) _baseRenderCompras();

  var pgEl = document.getElementById('pg-compras');
  if(!pgEl) return;

  // Esconder tabela original e mobile cards do mobile-cards.js
  var tbOriginal = pgEl.querySelector(':scope > .table-wrap');
  if(tbOriginal) tbOriginal.style.display = 'none';
  var mobCards = document.getElementById('comprasMobCards');
  if(mobCards) mobCards.style.display = 'none';

  // Limpar áreas anteriores
  var oldTop = document.getElementById('cpTopArea');
  if(oldTop) oldTop.remove();
  var oldBottom = document.getElementById('cpBottomArea');
  if(oldBottom) oldBottom.remove();

  var formSection = pgEl.querySelector('.form-section');

  // ═══ PARTE 1: TOPO (nav mês + resumo) — ANTES do formulário ═══
  var topArea = document.createElement('div');
  topArea.id = 'cpTopArea';
  topArea.innerHTML =
    '<div class="cp-mes-nav">' +
      '<button class="btn btn-outline" onclick="window._cpChgMes(-1)">&#9664;</button>' +
      '<span class="cp-mes-label" id="cpMesLabel">' + mesNomeFull(cpFiltroMes) + '</span>' +
      '<button class="btn btn-outline" onclick="window._cpChgMes(1)">&#9654;</button>' +
    '</div>' +
    '<div class="cp-summary" id="cpResumoCards"></div>';

  if(formSection){
    pgEl.insertBefore(topArea, formSection);
  } else {
    pgEl.appendChild(topArea);
  }

  // ═══ PARTE 2: ABAIXO (filtros + totais + tabela) — DEPOIS do formulário ═══
  var cartOpts = '<option value="">Todos</option>';
  S.cartoes.forEach(function(c){
    cartOpts += '<option value="' + c.id + '">' + c.nome + '</option>';
  });
  var catOpts = '<option value="">Todas</option>';
  (S.cats.compra || S.cats.despesa || []).forEach(function(c){
    catOpts += '<option value="' + c + '">' + c + '</option>';
  });

  var bottomArea = document.createElement('div');
  bottomArea.id = 'cpBottomArea';
  bottomArea.innerHTML =
    '<div class="cp-filter-bar">' +
      '<div class="cp-filter-row">' +
        '<div class="form-group"><label>Buscar</label>' +
          '<input id="cpFiltroNome" class="form-control" placeholder="Pesquisar..." oninput="window._cpApplyFilter()"></div>' +
        '<div class="form-group"><label>Cart&atilde;o</label>' +
          '<select id="cpFiltroCartao" class="form-control" onchange="window._cpApplyFilter()">' + cartOpts + '</select></div>' +
        '<div class="form-group"><label>Categoria</label>' +
          '<select id="cpFiltroCat" class="form-control" onchange="window._cpApplyFilter()">' + catOpts + '</select></div>' +
        '<div class="form-group"><label>Status</label>' +
          '<select id="cpFiltroStatus" class="form-control" onchange="window._cpApplyFilter()">' +
            '<option value="">Todos</option><option value="ativa">Parcela ativa</option><option value="parcelada">Parceladas</option><option value="avista">&Agrave; vista</option>' +
          '</select></div>' +
      '</div></div>' +
    '<div class="cp-totais-grid" id="cpTotaisGrid"></div>' +
    '<div class="cp-section">' +
      '<h3>&#128722; Compras da Compet&ecirc;ncia <span class="cp-count" id="cpResultCount">0</span></h3>' +
      '<div class="table-wrap"><table class="cp-table"><thead><tr>' +
        '<th>Data</th><th>Cart&atilde;o</th><th>Descri&ccedil;&atilde;o</th><th>Categoria</th>' +
        '<th>Total</th><th>Parcela</th><th>Valor Parc.</th><th>Status</th><th>A&ccedil;&otilde;es</th>' +
      '</tr></thead><tbody id="cpTbGerencial"></tbody></table></div>' +
      '<div class="cp-mob-cards" id="cpMobCards"></div>' +
    '</div>';

  // Inserir DEPOIS do formulário
  if(formSection && formSection.nextSibling){
    pgEl.insertBefore(bottomArea, formSection.nextSibling);
  } else if(formSection){
    pgEl.appendChild(bottomArea);
  } else {
    pgEl.appendChild(bottomArea);
  }

  _cpApplyFilter();
};

// ================================================================
// NAVEGAÇÃO DE MÊS
// ================================================================
window._cpChgMes = function(dir){
  cpFiltroMes = addMes(cpFiltroMes, dir);
  var lbl = document.getElementById('cpMesLabel');
  if(lbl) lbl.textContent = mesNomeFull(cpFiltroMes);
  _cpApplyFilter();
};

// ================================================================
// HELPERS
// ================================================================
function _cpTemAntecipacao(compra){
  if((compra.parcelas || 1) <= 1) return false;
  return typeof window.abrirAntecipacao === 'function';
}

function _cpCountAntecipadas(compra){
  if(!compra.antecipacoes || !compra.antecipacoes.length) return { count: 0, valor: 0 };
  var count = 0, valor = 0;
  compra.antecipacoes.forEach(function(a){
    count += (a.parcelasNums ? a.parcelasNums.length : 0);
    valor += (a.valorTotal || 0);
  });
  return { count: count, valor: valor };
}

// ================================================================
// APLICAR FILTRO E RENDERIZAR
// ================================================================
window._cpApplyFilter = function(){
  var filtroNome = (document.getElementById('cpFiltroNome') || {}).value || '';
  var filtroCartao = (document.getElementById('cpFiltroCartao') || {}).value || '';
  var filtroCat = (document.getElementById('cpFiltroCat') || {}).value || '';
  var filtroStatus = (document.getElementById('cpFiltroStatus') || {}).value || '';
  var mes = cpFiltroMes;
  var nomeLower = filtroNome.toLowerCase().trim();

  var itens = [];

  S.comprasCartao.forEach(function(c){
    var p = c.parcelas || 1;
    var mCompra = getMes(c.data);
    var valorTotal = Number(c.valor) || 0;
    var valorParcela = valorTotal / p;
    var cart = S.cartoes.find(function(x){ return x.id === c.cartaoId; });
    var cartNome = cart ? cart.nome : '-';
    var antInfo = _cpCountAntecipadas(c);

    for(var i = 0; i < p; i++){
      var mesParcela = addMes(mCompra, i);
      if(mesParcela === mes){
        itens.push({
          id: c.id, cartaoId: c.cartaoId, cartNome: cartNome,
          desc: c.desc, cat: c.categoria || '-',
          valorTotal: valorTotal, valorParcela: valorParcela,
          data: c.data, parcelas: p, parcelaAtual: i + 1,
          isParcelada: p > 1, isCompetenciaOriginal: mCompra === mes,
          isUltimaParcela: (i + 1) === p,
          temAntecipacao: _cpTemAntecipacao(c),
          antCount: antInfo.count, antValor: antInfo.valor
        });
        break;
      }
    }
  });

  if(nomeLower) itens = itens.filter(function(it){ return it.desc.toLowerCase().indexOf(nomeLower) >= 0; });
  if(filtroCartao) itens = itens.filter(function(it){ return it.cartaoId === filtroCartao; });
  if(filtroCat) itens = itens.filter(function(it){ return it.cat === filtroCat; });
  if(filtroStatus === 'ativa') itens = itens.filter(function(it){ return it.isParcelada && !it.isUltimaParcela; });
  else if(filtroStatus === 'parcelada') itens = itens.filter(function(it){ return it.isParcelada; });
  else if(filtroStatus === 'avista') itens = itens.filter(function(it){ return !it.isParcelada; });

  itens.sort(function(a, b){
    if(a.isCompetenciaOriginal !== b.isCompetenciaOriginal) return a.isCompetenciaOriginal ? -1 : 1;
    return b.valorParcela - a.valorParcela;
  });

  var totalCompras = itens.length;
  var totalFaturaMes = itens.reduce(function(s, it){ return s + it.valorParcela; }, 0);
  var totalComprasNovas = itens.filter(function(it){ return it.isCompetenciaOriginal; }).length;
  var totalParceladas = itens.filter(function(it){ return it.isParcelada; }).length;
  var totalAVista = itens.filter(function(it){ return !it.isParcelada; }).length;
  var totalFuturo = 0;
  itens.forEach(function(it){
    if(it.isParcelada && !it.isUltimaParcela) totalFuturo += it.valorParcela * (it.parcelas - it.parcelaAtual);
  });

  // Resumo
  var resumoEl = document.getElementById('cpResumoCards');
  if(resumoEl){
    resumoEl.innerHTML =
      '<div class="card"><div class="card-label">Fatura do M&ecirc;s</div><div class="card-value red">' + fmtV(totalFaturaMes) + '</div></div>' +
      '<div class="card"><div class="card-label">Itens</div><div class="card-value blue">' + totalCompras + '</div></div>' +
      '<div class="card"><div class="card-label">Novas</div><div class="card-value purple">' + totalComprasNovas + '</div></div>' +
      '<div class="card"><div class="card-label">Parceladas</div><div class="card-value red">' + totalParceladas + '</div></div>' +
      '<div class="card"><div class="card-label">&Agrave; Vista</div><div class="card-value green">' + totalAVista + '</div></div>' +
      '<div class="card"><div class="card-label">Futuro</div><div class="card-value red">' + fmtV(totalFuturo) + '</div></div>';
  }

  // Totais por cartão
  var totaisEl = document.getElementById('cpTotaisGrid');
  if(totaisEl){
    var porCartao = {};
    itens.forEach(function(it){
      if(!porCartao[it.cartaoId]) porCartao[it.cartaoId] = { nome: it.cartNome, fatura: 0, novas: 0, parc: 0, futuro: 0 };
      porCartao[it.cartaoId].fatura += it.valorParcela;
      if(it.isCompetenciaOriginal) porCartao[it.cartaoId].novas++;
      if(it.isParcelada) porCartao[it.cartaoId].parc++;
      if(it.isParcelada && !it.isUltimaParcela) porCartao[it.cartaoId].futuro += it.valorParcela * (it.parcelas - it.parcelaAtual);
    });
    var cartIds = Object.keys(porCartao);
    if(cartIds.length > 1){
      var totaisH = '';
      cartIds.forEach(function(cid){
        var d = porCartao[cid];
        var cart = S.cartoes.find(function(x){ return x.id === cid; });
        var limite = cart ? (cart.limite || 0) : 0;
        var disponivel = limite - d.fatura;
        totaisH += '<div class="cp-total-card">' +
          '<h4>&#128179; ' + d.nome + '</h4>' +
          '<div class="cp-tc-row"><span class="cp-tc-label">Fatura</span><span class="cp-tc-val" style="color:var(--dn2)">' + fmtV(d.fatura) + '</span></div>' +
          (limite > 0 ? '<div class="cp-tc-row"><span class="cp-tc-label">Dispon&iacute;vel</span><span class="cp-tc-val" style="color:' + (disponivel >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(disponivel) + '</span></div>' : '') +
          '<div class="cp-tc-row"><span class="cp-tc-label">Novas</span><span class="cp-tc-val">' + d.novas + '</span></div>' +
          '<div class="cp-tc-row"><span class="cp-tc-label">Parceladas</span><span class="cp-tc-val">' + d.parc + '</span></div>' +
          '<div class="cp-tc-row"><span class="cp-tc-label">Futuro</span><span class="cp-tc-val" style="color:var(--dn2)">' + fmtV(d.futuro) + '</span></div>' +
        '</div>';
      });
      totaisEl.innerHTML = totaisH;
    } else { totaisEl.innerHTML = ''; }
  }

  // Contagem
  var countEl = document.getElementById('cpResultCount');
  if(countEl) countEl.textContent = totalCompras + ' itens';

  // Tabela desktop
  var tbEl = document.getElementById('cpTbGerencial');
  if(tbEl){
    if(!itens.length){
      tbEl.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--tx3);padding:30px">Nenhuma compra na compet&ecirc;ncia.</td></tr>';
    } else {
      var h = '';
      itens.forEach(function(it){
        var idEsc = it.id.replace(/'/g, "\\'");
        var statusBadge = !it.isParcelada ? '<span class="cp-parc-badge cp-parc-quitada">&Agrave; vista</span>'
          : it.isUltimaParcela ? '<span class="cp-parc-badge cp-parc-quitada">&Uacute;ltima</span>'
          : '<span class="cp-parc-badge cp-parc-ativa">Ativa</span>';
        var antBadge = it.antCount > 0 ? ' <span class="badge badge-purple">&#9889; ' + it.antCount + ' ant.</span>' : '';
        var rowClass = it.isParcelada && !it.isUltimaParcela ? ' class="cp-highlight"' : '';
        h += '<tr' + rowClass + '>' +
          '<td>' + fmtD(it.data) + '</td><td>' + it.cartNome + '</td><td>' + it.desc + '</td><td>' + it.cat + '</td>' +
          '<td style="font-weight:600;color:var(--tx2)">' + fmtV(it.valorTotal) + '</td>' +
          '<td style="text-align:center">' + (it.isParcelada ? it.parcelaAtual + '/' + it.parcelas : '1/1') + antBadge + '</td>' +
          '<td style="font-weight:700;color:var(--dn2)">' + fmtV(it.valorParcela) + '</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td>' +
            (it.temAntecipacao ? '<button class="btn btn-sm btn-warning" onclick="abrirAntecipacao(\'' + idEsc + '\')">&#9889;</button> ' : '') +
            '<button class="btn btn-sm btn-outline" onclick="editCompra(\'' + idEsc + '\')">&#9998;</button> ' +
            '<button class="btn btn-sm btn-danger" onclick="delCompra(\'' + idEsc + '\')">&#128465;</button>' +
          '</td></tr>';
      });
      tbEl.innerHTML = h;
    }
  }

  // Cards mobile
  var mobEl = document.getElementById('cpMobCards');
  if(mobEl){
    if(!itens.length){
      mobEl.innerHTML = '<p style="color:var(--tx3);text-align:center;padding:20px">Nenhuma compra na compet&ecirc;ncia.</p>';
    } else {
      mobEl.innerHTML = itens.map(function(it){
        var idEsc = it.id.replace(/'/g, "\\'");
        var statusTxt = !it.isParcelada ? '&Agrave; vista' : it.parcelaAtual + '/' + it.parcelas;
        return '<div class="cpm">' +
          '<div class="cpm-top"><span class="cpm-date">' + fmtD(it.data) + '</span><span class="cpm-val">' + fmtV(it.valorParcela) + '</span></div>' +
          '<div class="cpm-desc">' + it.desc + '</div>' +
          '<div class="cpm-meta">' +
            '<span>' + it.cartNome + '</span><span>&bull;</span>' +
            '<span>' + it.cat + '</span><span>&bull;</span>' +
            '<span>' + statusTxt + '</span>' +
            (it.antCount > 0 ? '<span style="color:var(--wn)">&#9889;' + it.antCount + '</span>' : '') +
          '</div>' +
          '<div class="cpm-acts">' +
            (it.temAntecipacao ? '<button class="btn btn-sm btn-warning" onclick="abrirAntecipacao(\'' + idEsc + '\')">&#9889;</button>' : '') +
            '<button class="btn btn-sm btn-outline" onclick="editCompra(\'' + idEsc + '\')">&#9998;</button>' +
            '<button class="btn btn-sm btn-danger" onclick="delCompra(\'' + idEsc + '\')">&#128465;</button>' +
          '</div></div>';
      }).join('');
    }
  }
};

console.log('[Financeiro Pro] Compras Filtro v4 — Resumo topo, form meio, compras abaixo.');
})();

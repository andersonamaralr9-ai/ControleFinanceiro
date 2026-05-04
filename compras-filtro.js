// compras-filtro.js — Filtro avançado e visão gerencial das Compras no Cartão
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* Filtro Compras */
.cp-filter-bar{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px 20px;margin-bottom:20px;box-shadow:var(--sh);}
.cp-filter-row{display:flex;gap:10px;flex-wrap:wrap;align-items:end;}
.cp-filter-row .form-group{flex:1;min-width:150px;}
.cp-filter-row .form-group label{font-size:.72em;color:var(--tx3);font-weight:600;margin-bottom:4px;display:block;}

/* Resumo Compras */
.cp-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;}

/* Tabela gerencial */
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

/* Totalizadores por cartão */
.cp-totais-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-bottom:20px;}
.cp-total-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px 18px;box-shadow:var(--sh);}
.cp-total-card h4{font-size:.82em;color:var(--tx2);margin-bottom:8px;}
.cp-total-card .cp-tc-row{display:flex;justify-content:space-between;font-size:.82em;padding:3px 0;}
.cp-total-card .cp-tc-row .cp-tc-label{color:var(--tx3);}
.cp-total-card .cp-tc-row .cp-tc-val{font-weight:700;}

@media(max-width:768px){
  .cp-filter-row{flex-direction:column;}
  .cp-filter-row .form-group{min-width:100%;}
  .cp-summary{grid-template-columns:1fr 1fr;}
  .cp-totais-grid{grid-template-columns:1fr;}
  .cp-table{font-size:.78em;}
  .cp-table th,.cp-table td{padding:7px 8px;}
}
`;
document.head.appendChild(sty);

// ================================================================
// VARIÁVEIS
// ================================================================
var cpFiltroMes = mesAtual();

// ================================================================
// OVERRIDE renderCompras
// ================================================================
var _origRenderCompras = window.renderCompras;

window.renderCompras = function(){
  // Popular selects do form original
  popCartSel();
  var sc = g('cpCat');
  if(sc){
    sc.innerHTML = '';
    (S.cats.compra || S.cats.despesa || []).forEach(function(c){
      sc.innerHTML += '<option>' + c + '</option>';
    });
  }

  var pgEl = document.getElementById('pg-compras');
  if(!pgEl) return;

  // Remover área dinâmica anterior
  var existing = document.getElementById('cpDynamicArea');
  if(existing) existing.remove();

  var area = document.createElement('div');
  area.id = 'cpDynamicArea';

  // ===== BARRA DE FILTRO =====
  var cartOpts = '<option value="">Todos</option>';
  S.cartoes.forEach(function(c){
    cartOpts += '<option value="' + c.id + '">' + c.nome + '</option>';
  });

  var catOpts = '<option value="">Todas</option>';
  (S.cats.compra || S.cats.despesa || []).forEach(function(c){
    catOpts += '<option value="' + c + '">' + c + '</option>';
  });

  var filterHTML = '<div class="cp-filter-bar">' +
    '<div class="cp-filter-row">' +
      '<div class="form-group"><label>Compet\u00eancia</label>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<button class="btn btn-sm btn-outline" onclick="window._cpChgMes(-1)">&#9664;</button>' +
          '<input type="month" id="cpFiltroMes" class="form-control" value="' + cpFiltroMes + '" onchange="window._cpApplyFilter()" style="max-width:160px">' +
          '<button class="btn btn-sm btn-outline" onclick="window._cpChgMes(1)">&#9654;</button>' +
        '</div></div>' +
      '<div class="form-group"><label>Buscar por nome</label>' +
        '<input id="cpFiltroNome" class="form-control" placeholder="Pesquisar..." oninput="window._cpApplyFilter()"></div>' +
      '<div class="form-group"><label>Cart\u00e3o</label>' +
        '<select id="cpFiltroCartao" class="form-control" onchange="window._cpApplyFilter()">' + cartOpts + '</select></div>' +
      '<div class="form-group"><label>Categoria</label>' +
        '<select id="cpFiltroCat" class="form-control" onchange="window._cpApplyFilter()">' + catOpts + '</select></div>' +
      '<div class="form-group"><label>Status</label>' +
        '<select id="cpFiltroStatus" class="form-control" onchange="window._cpApplyFilter()">' +
          '<option value="">Todos</option><option value="ativa">Parcela ativa no m\u00eas</option><option value="parcelada">Apenas parceladas</option><option value="avista">Apenas \u00e0 vista</option>' +
        '</select></div>' +
    '</div></div>';

  // ===== ÁREA DE RESUMO =====
  var resumoHTML = '<div class="cp-summary" id="cpResumoCards"></div>';

  // ===== TOTAIS POR CARTÃO =====
  var totaisHTML = '<div class="cp-totais-grid" id="cpTotaisGrid"></div>';

  // ===== TABELA GERENCIAL =====
  var tabelaHTML = '<div class="cp-section">' +
    '<h3>&#128722; Compras da Compet\u00eancia <span class="cp-count" id="cpResultCount">0</span></h3>' +
    '<div class="table-wrap"><table class="cp-table"><thead><tr>' +
      '<th>Data Compra</th><th>Cart\u00e3o</th><th>Descri\u00e7\u00e3o</th><th>Categoria</th>' +
      '<th>Valor Total</th><th>Parcela</th><th>Valor Parcela</th><th>Status</th><th>A\u00e7\u00f5es</th>' +
    '</tr></thead><tbody id="cpTbGerencial"></tbody></table></div>' +
  '</div>';

  area.innerHTML = filterHTML + resumoHTML + totaisHTML + tabelaHTML;

  // Esconder tabela original
  var tbOriginal = pgEl.querySelector('.table-wrap');
  if(tbOriginal) tbOriginal.style.display = 'none';

  pgEl.appendChild(area);

  // Aplicar filtro inicial
  _cpApplyFilter();
};

// ================================================================
// NAVEGAÇÃO DE MÊS
// ================================================================
window._cpChgMes = function(dir){
  cpFiltroMes = addMes(cpFiltroMes, dir);
  var inp = document.getElementById('cpFiltroMes');
  if(inp) inp.value = cpFiltroMes;
  _cpApplyFilter();
};

// ================================================================
// APLICAR FILTRO E RENDERIZAR
// ================================================================
window._cpApplyFilter = function(){
  var inpMes = document.getElementById('cpFiltroMes');
  if(inpMes) cpFiltroMes = inpMes.value || mesAtual();

  var filtroNome = (document.getElementById('cpFiltroNome') || {}).value || '';
  var filtroCartao = (document.getElementById('cpFiltroCartao') || {}).value || '';
  var filtroCat = (document.getElementById('cpFiltroCat') || {}).value || '';
  var filtroStatus = (document.getElementById('cpFiltroStatus') || {}).value || '';

  var mes = cpFiltroMes;
  var nomeLower = filtroNome.toLowerCase().trim();

  // Montar lista de compras que aparecem na competência
  // (compras da competência + parceladas ativas na competência)
  var itens = [];

  S.comprasCartao.forEach(function(c){
    var p = c.parcelas || 1;
    var mCompra = getMes(c.data);
    var valorTotal = Number(c.valor) || 0;
    var valorParcela = valorTotal / p;
    var cart = S.cartoes.find(function(x){ return x.id === c.cartaoId; });
    var cartNome = cart ? cart.nome : '-';

    // Para cada parcela, verificar se cai na competência
    for(var i = 0; i < p; i++){
      var mesParcela = addMes(mCompra, i);
      if(mesParcela === mes){
        var parcelaAtual = i + 1;
        var isCompetencia = (mCompra === mes && p === 1); // compra à vista na competência
        var isParceladaAtiva = (p > 1); // parcelada

        itens.push({
          id: c.id,
          cartaoId: c.cartaoId,
          cartNome: cartNome,
          desc: c.desc,
          cat: c.categoria || '-',
          valorTotal: valorTotal,
          valorParcela: valorParcela,
          data: c.data,
          parcelas: p,
          parcelaAtual: parcelaAtual,
          isParcelada: p > 1,
          isCompetenciaOriginal: mCompra === mes,
          isUltimaParcela: parcelaAtual === p
        });
        break; // só 1 entrada por compra por mês
      }
    }
  });

  // Aplicar filtros
  if(nomeLower){
    itens = itens.filter(function(it){
      return it.desc.toLowerCase().indexOf(nomeLower) >= 0;
    });
  }
  if(filtroCartao){
    itens = itens.filter(function(it){ return it.cartaoId === filtroCartao; });
  }
  if(filtroCat){
    itens = itens.filter(function(it){ return it.cat === filtroCat; });
  }
  if(filtroStatus === 'ativa'){
    // Parcelas ativas (parceladas que não terminaram)
    itens = itens.filter(function(it){ return it.isParcelada && !it.isUltimaParcela; });
  } else if(filtroStatus === 'parcelada'){
    itens = itens.filter(function(it){ return it.isParcelada; });
  } else if(filtroStatus === 'avista'){
    itens = itens.filter(function(it){ return !it.isParcelada; });
  }

  // Ordenar: compras da competência primeiro, depois por valor parcela desc
  itens.sort(function(a, b){
    if(a.isCompetenciaOriginal !== b.isCompetenciaOriginal) return a.isCompetenciaOriginal ? -1 : 1;
    return b.valorParcela - a.valorParcela;
  });

  // ===== CÁLCULOS RESUMO =====
  var totalCompras = itens.length;
  var totalFaturaMes = itens.reduce(function(s, it){ return s + it.valorParcela; }, 0);
  var totalComprasNovas = itens.filter(function(it){ return it.isCompetenciaOriginal; }).length;
  var totalParceladas = itens.filter(function(it){ return it.isParcelada; }).length;
  var totalAVista = itens.filter(function(it){ return !it.isParcelada; }).length;

  // Total de parcelas futuras (compras parceladas que ainda terão pagamentos após este mês)
  var totalFuturo = 0;
  itens.forEach(function(it){
    if(it.isParcelada && !it.isUltimaParcela){
      var restantes = it.parcelas - it.parcelaAtual;
      totalFuturo += it.valorParcela * restantes;
    }
  });

  // ===== RENDER RESUMO =====
  var resumoEl = document.getElementById('cpResumoCards');
  if(resumoEl){
    resumoEl.innerHTML =
      '<div class="card"><div class="card-label">Fatura do M\u00eas</div><div class="card-value red">' + fmtV(totalFaturaMes) + '</div></div>' +
      '<div class="card"><div class="card-label">Itens no M\u00eas</div><div class="card-value blue">' + totalCompras + '</div></div>' +
      '<div class="card"><div class="card-label">Compras Novas</div><div class="card-value purple">' + totalComprasNovas + '</div></div>' +
      '<div class="card"><div class="card-label">Parceladas</div><div class="card-value red">' + totalParceladas + '</div></div>' +
      '<div class="card"><div class="card-label">\u00c0 Vista</div><div class="card-value green">' + totalAVista + '</div></div>' +
      '<div class="card"><div class="card-label">Compromisso Futuro</div><div class="card-value red">' + fmtV(totalFuturo) + '</div></div>';
  }

  // ===== TOTAIS POR CARTÃO =====
  var totaisEl = document.getElementById('cpTotaisGrid');
  if(totaisEl){
    var porCartao = {};
    itens.forEach(function(it){
      if(!porCartao[it.cartaoId]) porCartao[it.cartaoId] = { nome: it.cartNome, fatura: 0, novas: 0, parc: 0, futuro: 0 };
      porCartao[it.cartaoId].fatura += it.valorParcela;
      if(it.isCompetenciaOriginal) porCartao[it.cartaoId].novas++;
      if(it.isParcelada) porCartao[it.cartaoId].parc++;
      if(it.isParcelada && !it.isUltimaParcela){
        porCartao[it.cartaoId].futuro += it.valorParcela * (it.parcelas - it.parcelaAtual);
      }
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
          '<div class="cp-tc-row"><span class="cp-tc-label">Fatura do m\u00eas</span><span class="cp-tc-val" style="color:var(--dn2)">' + fmtV(d.fatura) + '</span></div>' +
          (limite > 0 ? '<div class="cp-tc-row"><span class="cp-tc-label">Dispon\u00edvel</span><span class="cp-tc-val" style="color:' + (disponivel >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + fmtV(disponivel) + '</span></div>' : '') +
          '<div class="cp-tc-row"><span class="cp-tc-label">Compras novas</span><span class="cp-tc-val">' + d.novas + '</span></div>' +
          '<div class="cp-tc-row"><span class="cp-tc-label">Parceladas</span><span class="cp-tc-val">' + d.parc + '</span></div>' +
          '<div class="cp-tc-row"><span class="cp-tc-label">Compromisso futuro</span><span class="cp-tc-val" style="color:var(--dn2)">' + fmtV(d.futuro) + '</span></div>' +
        '</div>';
      });
      totaisEl.innerHTML = totaisH;
    } else {
      totaisEl.innerHTML = '';
    }
  }

  // ===== RENDER TABELA =====
  var countEl = document.getElementById('cpResultCount');
  if(countEl) countEl.textContent = totalCompras + ' itens';

  var tbEl = document.getElementById('cpTbGerencial');
  if(!tbEl) return;

  if(!itens.length){
    tbEl.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--tx3);padding:30px">Nenhuma compra encontrada na compet\u00eancia.</td></tr>';
    return;
  }

  var h = '';
  itens.forEach(function(it){
    var idEsc = it.id.replace(/'/g, "\\'");
    var statusBadge = '';
    if(!it.isParcelada){
      statusBadge = '<span class="cp-parc-badge cp-parc-quitada">\u00c0 vista</span>';
    } else if(it.isUltimaParcela){
      statusBadge = '<span class="cp-parc-badge cp-parc-quitada">\u00daltima parcela</span>';
    } else {
      statusBadge = '<span class="cp-parc-badge cp-parc-ativa">Ativa</span>';
    }

    var rowClass = it.isCompetenciaOriginal && it.parcelas === 1 ? '' : (it.isParcelada && !it.isUltimaParcela ? ' class="cp-highlight"' : '');

    h += '<tr' + rowClass + '>' +
      '<td>' + fmtD(it.data) + '</td>' +
      '<td>' + it.cartNome + '</td>' +
      '<td>' + it.desc + '</td>' +
      '<td>' + it.cat + '</td>' +
      '<td style="font-weight:600;color:var(--tx2)">' + fmtV(it.valorTotal) + '</td>' +
      '<td style="text-align:center">' + (it.isParcelada ? it.parcelaAtual + '/' + it.parcelas : '1/1') + '</td>' +
      '<td style="font-weight:700;color:var(--dn2)">' + fmtV(it.valorParcela) + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-outline" onclick="editCompra(\'' + idEsc + '\')">&#9998;</button> ' +
        '<button class="btn btn-sm btn-danger" onclick="delCompra(\'' + idEsc + '\')">&#128465;</button>' +
      '</td>' +
    '</tr>';
  });

  tbEl.innerHTML = h;
};

console.log('[Financeiro Pro] Compras Filtro Gerencial carregado.');
})();

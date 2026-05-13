// relatorios.js v1 — Menu de Relat&oacute;rios Financeiros
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* === RELAT&Oacute;RIOS v1 === */

/* Grid de op&ccedil;&otilde;es de relat&oacute;rio */
.rel-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:24px;}
.rel-opt{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:20px;box-shadow:var(--sh);cursor:pointer;transition:all .2s;}
.rel-opt:hover{transform:translateY(-3px);border-color:var(--pri);}
.rel-opt .ro-icon{font-size:1.8em;margin-bottom:8px;}
.rel-opt .ro-title{font-size:.95em;font-weight:700;margin-bottom:4px;}
.rel-opt .ro-desc{font-size:.78em;color:var(--tx3);line-height:1.4;}

/* &Aacute;rea do relat&oacute;rio gerado */
.rel-area{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:24px;box-shadow:var(--sh);margin-bottom:24px;}
.rel-area h3{font-size:1.05em;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--bg4);}
.rel-back{display:inline-flex;align-items:center;gap:6px;font-size:.85em;color:var(--pri2);cursor:pointer;margin-bottom:16px;padding:6px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--bg4);transition:all .15s;}
.rel-back:hover{background:var(--bg4);}

/* Tabela de relat&oacute;rio */
.rel-table{width:100%;border-collapse:collapse;margin-bottom:16px;}
.rel-table th{background:var(--bg3);padding:10px 14px;text-align:left;font-size:.73em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;}
.rel-table td{padding:10px 14px;border-bottom:1px solid var(--bg3);font-size:.84em;}
.rel-table tr:hover td{background:rgba(108,92,231,.03);}
.rel-table .rt-total{background:var(--bg3);font-weight:700;}
.rel-table .rt-green{color:var(--ok);}
.rel-table .rt-red{color:var(--dn2);}
.rel-table .rt-blue{color:var(--inf2);}
.rel-table .rt-purple{color:var(--pri2);}

/* Filtros do relat&oacute;rio */
.rel-filters{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:20px;}
.rel-filters .form-group{min-width:140px;}
.rel-filters .form-group label{font-size:.72em;color:var(--tx2);font-weight:600;display:block;margin-bottom:4px;}

/* Mini cards */
.rel-mini-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;}
.rel-mc{background:var(--bg3);border-radius:8px;padding:12px;text-align:center;}
.rel-mc .rmc-label{font-size:.62em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:2px;}
.rel-mc .rmc-val{font-size:1.05em;font-weight:700;}

/* Barra horizontal */
.rel-hbar{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.rel-hbar .rhb-label{font-size:.82em;min-width:120px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rel-hbar .rhb-bar-bg{flex:1;background:var(--bg3);border-radius:6px;height:18px;overflow:hidden;position:relative;}
.rel-hbar .rhb-bar-fill{height:100%;border-radius:6px;transition:width .4s;}
.rel-hbar .rhb-val{font-size:.78em;font-weight:700;min-width:80px;}

/* Se&ccedil;&atilde;o de an&aacute;lise */
.rel-analysis{background:var(--bg3);border-radius:var(--rad);padding:16px;margin-bottom:16px;}
.rel-analysis h4{font-size:.88em;font-weight:700;margin-bottom:10px;color:var(--tx2);}
.rel-analysis p{font-size:.84em;color:var(--tx2);line-height:1.5;margin-bottom:6px;}
.rel-analysis strong{color:var(--tx);}

/* Responsive */
@media(max-width:768px){
  .rel-opts{grid-template-columns:1fr;}
  .rel-opt{padding:14px;}
  .rel-opt .ro-icon{font-size:1.4em;}
  .rel-opt .ro-title{font-size:.88em;}
  .rel-area{padding:14px;}
  .rel-filters{flex-direction:column;align-items:stretch;}
  .rel-filters .form-group{min-width:100%;}
  .rel-mini-cards{grid-template-columns:1fr 1fr;gap:8px;}
  .rel-hbar .rhb-label{min-width:80px;font-size:.72em;}
  .rel-hbar .rhb-val{min-width:60px;font-size:.7em;}
  .rel-table th,.rel-table td{padding:7px 8px;font-size:.72em;}
  .rel-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;}
}
@media(max-width:380px){
  .rel-mini-cards{grid-template-columns:1fr 1fr;}
  .rel-mc .rmc-val{font-size:.85em;}
}
`;
document.head.appendChild(sty);

// ================================================================
// Adicionar link no menu lateral
// ================================================================
function addMenuLink(){
  var sidebar = document.getElementById('sidebar');
  if(!sidebar) return;

  // Verificar se j&aacute; existe
  if(document.getElementById('nav-relatorios')) return;

  // Encontrar a se&ccedil;&atilde;o "Sistema"
  var links = sidebar.querySelectorAll('a');
  var configLink = null;
  for(var i = 0; i < links.length; i++){
    if(links[i].id === 'nav-config'){
      configLink = links[i];
      break;
    }
  }

  var newLink = document.createElement('a');
  newLink.id = 'nav-relatorios';
  newLink.setAttribute('onclick', "nav('relatorios')");
  newLink.innerHTML = '<span>&#128202; Relat&oacute;rios</span>';

  if(configLink){
    sidebar.insertBefore(newLink, configLink);
  }
}

// ================================================================
// Criar p&aacute;gina de relat&oacute;rios
// ================================================================
function createPage(){
  if(document.getElementById('pg-relatorios')) return;

  var page = document.createElement('div');
  page.className = 'page';
  page.id = 'pg-relatorios';
  page.innerHTML = '<h2 class="page-title">&#128202; Relat&oacute;rios</h2><div id="relContent"></div>';

  var mainDiv = document.querySelector('.main');
  if(mainDiv) mainDiv.appendChild(page);
}

// ================================================================
// Registrar no sistema de navega&ccedil;&atilde;o
// ================================================================
var _origNav = window.nav;
window.nav = function(p){
  if(p === 'relatorios'){
    document.querySelectorAll('.page').forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.sidebar a').forEach(function(x){ x.classList.remove('active'); });
    document.getElementById('pg-relatorios').classList.add('active');
    var nl = document.getElementById('nav-relatorios');
    if(nl) nl.classList.add('active');
    renderRelatorios();
    if(typeof closeSidebar === 'function') closeSidebar();
    return;
  }
  _origNav(p);
};

// ================================================================
// Renderizar p&aacute;gina de relat&oacute;rios (menu principal)
// ================================================================
window.renderRelatorios = function(){
  var el = document.getElementById('relContent');
  if(!el) return;

  var reports = [
    {id: 'fluxo', icon: '&#128200;', title: 'Fluxo de Caixa Mensal', desc: 'Vis&atilde;o consolidada de receitas, despesas, saldo e evolu&ccedil;&atilde;o m&ecirc;s a m&ecirc;s com gr&aacute;fico de tend&ecirc;ncia.'},
    {id: 'despcat', icon: '&#128202;', title: 'Despesas por Categoria', desc: 'Ranking das categorias com maior gasto, percentuais e compara&ccedil;&atilde;o entre per&iacute;odos.'},
    {id: 'recorrentes', icon: '&#128257;', title: 'An&aacute;lise de Custos Fixos', desc: 'Vis&atilde;o unificada de contratos e assinaturas: total fixo mensal, evolu&ccedil;&atilde;o e impacto no or&ccedil;amento.'},
    {id: 'cartoes', icon: '&#128179;', title: 'Relat&oacute;rio de Cart&otilde;es', desc: 'Uso de limite por cart&atilde;o, faturas mensais, m&eacute;dia de gasto e maiores compras.'},
    {id: 'evolucao', icon: '&#128200;', title: 'Evolu&ccedil;&atilde;o Patrimonial', desc: 'Saldo acumulado ao longo dos meses, taxa de poupan&ccedil;a e proje&ccedil;&atilde;o com base na m&eacute;dia.'},
    {id: 'orcamento', icon: '&#127919;', title: 'Desempenho do Or&ccedil;amento', desc: 'Compara&ccedil;&atilde;o entre planejado vs realizado por categoria, cumprimento de metas e alertas.'},
    {id: 'anual', icon: '&#128197;', title: 'Resumo Anual', desc: 'Vis&atilde;o consolidada do ano: totais de receita e despesa por m&ecirc;s, melhor e pior m&ecirc;s, m&eacute;dias.'},
    {id: 'inadimplencia', icon: '&#9888;', title: 'Alertas e Vencimentos', desc: 'Contratos e assinaturas pr&oacute;ximos do vencimento, parcelas ativas e compromissos futuros.'}
  ];

  var h = '<div class="rel-opts">';
  reports.forEach(function(r){
    h += '<div class="rel-opt" onclick="openReport(\'' + r.id + '\')">';
    h += '<div class="ro-icon">' + r.icon + '</div>';
    h += '<div class="ro-title">' + r.title + '</div>';
    h += '<div class="ro-desc">' + r.desc + '</div>';
    h += '</div>';
  });
  h += '</div>';

  el.innerHTML = h;
};

// ================================================================
// Abrir relat&oacute;rio espec&iacute;fico
// ================================================================
window.openReport = function(id){
  var el = document.getElementById('relContent');
  if(!el) return;

  var backBtn = '<div class="rel-back" onclick="renderRelatorios()">&#9664; Voltar aos Relat&oacute;rios</div>';

  switch(id){
    case 'fluxo': el.innerHTML = backBtn + buildFluxoCaixa(); break;
    case 'despcat': el.innerHTML = backBtn + buildDespCat(); break;
    case 'recorrentes': el.innerHTML = backBtn + buildRecorrentes(); break;
    case 'cartoes': el.innerHTML = backBtn + buildCartoes(); break;
    case 'evolucao': el.innerHTML = backBtn + buildEvolucao(); break;
    case 'orcamento': el.innerHTML = backBtn + buildOrcamento(); break;
    case 'anual': el.innerHTML = backBtn + buildAnual(); break;
    case 'inadimplencia': el.innerHTML = backBtn + buildAlertas(); break;
    default: el.innerHTML = backBtn + '<p>Relat&oacute;rio n&atilde;o encontrado.</p>';
  }
};

// ================================================================
// HELPERS
// ================================================================
function getLast12Months(){
  var meses = [];
  for(var i = -11; i <= 0; i++) meses.push(addMes(mesAtual(), i));
  return meses;
}

function getMonthsForYear(year){
  var meses = [];
  for(var m = 1; m <= 12; m++) meses.push(year + '-' + String(m).padStart(2, '0'));
  return meses;
}

function pct(part, total){
  if(!total) return 0;
  return Math.round((part / total) * 100);
}

// ================================================================
// 1. FLUXO DE CAIXA MENSAL
// ================================================================
function buildFluxoCaixa(){
  var meses = getLast12Months();
  var data = [];
  var saldoAcum = 0;

  meses.forEach(function(mes){
    var E = allEntries(mes);
    var rec = 0, desp = 0;
    E.forEach(function(e){ if(e.tipo === 'receita') rec += e.valor; else desp += e.valor; });
    var saldo = rec - desp;
    saldoAcum += saldo;
    data.push({mes: mes, rec: rec, desp: desp, saldo: saldo, acum: saldoAcum});
  });

  var totalRec = data.reduce(function(s, d){ return s + d.rec; }, 0);
  var totalDesp = data.reduce(function(s, d){ return s + d.desp; }, 0);
  var mediaRec = totalRec / data.length;
  var mediaDesp = totalDesp / data.length;
  var mediaSaldo = (totalRec - totalDesp) / data.length;

  var h = '<div class="rel-area">';
  h += '<h3>&#128200; Fluxo de Caixa &mdash; &Uacute;ltimos 12 Meses</h3>';

  // Mini cards
  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Total Receitas</div><div class="rmc-val rt-green">' + fmtV(totalRec) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Total Despesas</div><div class="rmc-val rt-red">' + fmtV(totalDesp) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Saldo Per&iacute;odo</div><div class="rmc-val ' + (totalRec - totalDesp >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(totalRec - totalDesp) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">M&eacute;dia Mensal</div><div class="rmc-val ' + (mediaSaldo >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(mediaSaldo) + '</div></div>';
  h += '</div>';

  // Tabela
  h += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">';
  h += '<table class="rel-table"><thead><tr><th>M&ecirc;s</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th>Acumulado</th></tr></thead><tbody>';
  data.forEach(function(d){
    h += '<tr>';
    h += '<td>' + mesNome(d.mes) + '</td>';
    h += '<td class="rt-green" style="font-weight:600">' + fmtV(d.rec) + '</td>';
    h += '<td class="rt-red" style="font-weight:600">' + fmtV(d.desp) + '</td>';
    h += '<td class="' + (d.saldo >= 0 ? 'rt-green' : 'rt-red') + '" style="font-weight:700">' + fmtV(d.saldo) + '</td>';
    h += '<td class="' + (d.acum >= 0 ? 'rt-green' : 'rt-red') + '" style="font-weight:700">' + fmtV(d.acum) + '</td>';
    h += '</tr>';
  });
  h += '<tr class="rt-total"><td>M&eacute;dia</td><td class="rt-green">' + fmtV(mediaRec) + '</td><td class="rt-red">' + fmtV(mediaDesp) + '</td><td class="' + (mediaSaldo >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(mediaSaldo) + '</td><td>&mdash;</td></tr>';
  h += '</tbody></table></div>';

  // An&aacute;lise
  var melhorMes = data.reduce(function(best, d){ return d.saldo > best.saldo ? d : best; }, data[0]);
  var piorMes = data.reduce(function(worst, d){ return d.saldo < worst.saldo ? d : worst; }, data[0]);
  var taxaPoupanca = totalRec > 0 ? ((totalRec - totalDesp) / totalRec * 100).toFixed(1) : '0';

  h += '<div class="rel-analysis">';
  h += '<h4>An&aacute;lise</h4>';
  h += '<p>&#128994; <strong>Melhor m&ecirc;s:</strong> ' + mesNomeFull(melhorMes.mes) + ' (saldo ' + fmtV(melhorMes.saldo) + ')</p>';
  h += '<p>&#128308; <strong>Pior m&ecirc;s:</strong> ' + mesNomeFull(piorMes.mes) + ' (saldo ' + fmtV(piorMes.saldo) + ')</p>';
  h += '<p>&#128176; <strong>Taxa de poupan&ccedil;a:</strong> ' + taxaPoupanca + '% da receita &eacute; poupada em m&eacute;dia</p>';
  h += '</div>';

  h += '</div>';
  return h;
}

// ================================================================
// 2. DESPESAS POR CATEGORIA
// ================================================================
function buildDespCat(){
  var meses = getLast12Months();
  var catTotals = {};
  var total = 0;

  meses.forEach(function(mes){
    allEntries(mes).forEach(function(e){
      if(e.tipo === 'despesa'){
        catTotals[e.cat] = (catTotals[e.cat] || 0) + e.valor;
        total += e.valor;
      }
    });
  });

  var sorted = Object.entries(catTotals).sort(function(a, b){ return b[1] - a[1]; });
  var maxVal = sorted.length ? sorted[0][1] : 1;
  var colors = ['var(--dn2)','var(--wn)','var(--pri2)','var(--inf2)','var(--ok)','var(--tx2)'];

  var h = '<div class="rel-area">';
  h += '<h3>&#128202; Despesas por Categoria &mdash; &Uacute;ltimos 12 Meses</h3>';

  // Mini cards
  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Total Despesas</div><div class="rmc-val rt-red">' + fmtV(total) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Categorias</div><div class="rmc-val rt-blue">' + sorted.length + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">M&eacute;dia Mensal</div><div class="rmc-val rt-red">' + fmtV(total / 12) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Maior Categoria</div><div class="rmc-val rt-purple">' + (sorted.length ? sorted[0][0] : '-') + '</div></div>';
  h += '</div>';

  // Barras horizontais
  sorted.forEach(function(item, idx){
    var cor = colors[idx % colors.length];
    var p = pct(item[1], total);
    h += '<div class="rel-hbar">';
    h += '<div class="rhb-label">' + item[0] + '</div>';
    h += '<div class="rhb-bar-bg"><div class="rhb-bar-fill" style="width:' + Math.max((item[1]/maxVal)*100, 2) + '%;background:' + cor + '"></div></div>';
    h += '<div class="rhb-val" style="color:' + cor + '">' + fmtV(item[1]) + ' (' + p + '%)</div>';
    h += '</div>';
  });

  // Tabela detalhada
  h += '<div style="overflow-x:auto;margin-top:16px;">';
  h += '<table class="rel-table"><thead><tr><th>Categoria</th><th>Total 12m</th><th>M&eacute;dia/m&ecirc;s</th><th>% do Total</th></tr></thead><tbody>';
  sorted.forEach(function(item){
    h += '<tr><td style="font-weight:600">' + item[0] + '</td>';
    h += '<td class="rt-red" style="font-weight:600">' + fmtV(item[1]) + '</td>';
    h += '<td>' + fmtV(item[1] / 12) + '</td>';
    h += '<td>' + pct(item[1], total) + '%</td></tr>';
  });
  h += '<tr class="rt-total"><td>Total</td><td class="rt-red">' + fmtV(total) + '</td><td class="rt-red">' + fmtV(total / 12) + '</td><td>100%</td></tr>';
  h += '</tbody></table></div>';

  h += '</div>';
  return h;
}

// ================================================================
// 3. AN&Aacute;LISE DE CUSTOS FIXOS (Contratos + Assinaturas)
// ================================================================
function buildRecorrentes(){
  var ma = mesAtual();
  var contrAtivos = S.contratos.filter(function(c){
    if(c.encerradoEm) return false;
    if(c.dataFim && c.dataFim < ma) return false;
    return true;
  });
  var assAtivas = S.assinaturas.filter(function(s){ return !s.encerradaEm; });

  var totalContDesp = 0, totalContRec = 0, totalAss = 0;
  contrAtivos.forEach(function(c){
    if(c.tipo === 'receita') totalContRec += Number(c.valor) || 0;
    else totalContDesp += Number(c.valor) || 0;
  });
  assAtivas.forEach(function(s){ totalAss += Number(s.valor) || 0; });

  var totalFixo = totalContDesp + totalAss;
  var totalMesE = allEntries(ma);
  var totalDesp = 0;
  totalMesE.forEach(function(e){ if(e.tipo === 'despesa') totalDesp += e.valor; });
  var pctFixo = totalDesp > 0 ? ((totalFixo / totalDesp) * 100).toFixed(1) : '0';

  var h = '<div class="rel-area">';
  h += '<h3>&#128257; An&aacute;lise de Custos Fixos &mdash; ' + mesNomeFull(ma) + '</h3>';

  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Contratos Desp.</div><div class="rmc-val rt-red">' + fmtV(totalContDesp) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Assinaturas</div><div class="rmc-val rt-red">' + fmtV(totalAss) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Contratos Rec.</div><div class="rmc-val rt-green">' + fmtV(totalContRec) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Total Fixo</div><div class="rmc-val rt-purple">' + fmtV(totalFixo) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">% das Despesas</div><div class="rmc-val rt-blue">' + pctFixo + '%</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Total Itens</div><div class="rmc-val">' + (contrAtivos.length + assAtivas.length) + '</div></div>';
  h += '</div>';

  // Lista unificada
  var itens = [];
  contrAtivos.forEach(function(c){
    itens.push({nome: c.desc, tipo: c.tipo === 'receita' ? 'Receita' : 'Despesa', origem: 'Contrato', cat: c.categoria || 'Outros', valor: Number(c.valor) || 0, dia: c.dia || 1});
  });
  assAtivas.forEach(function(s){
    var cart = S.cartoes.find(function(x){ return x.id === s.cartaoId; });
    itens.push({nome: s.nome, tipo: 'Despesa', origem: 'Assinatura' + (cart ? ' (' + cart.nome + ')' : ''), cat: s.categoria || 'Outros', valor: Number(s.valor) || 0, dia: '-'});
  });
  itens.sort(function(a, b){ return b.valor - a.valor; });

  h += '<div style="overflow-x:auto;">';
  h += '<table class="rel-table"><thead><tr><th>Nome</th><th>Origem</th><th>Categoria</th><th>Tipo</th><th>Valor/m&ecirc;s</th></tr></thead><tbody>';
  itens.forEach(function(it){
    var cls = it.tipo === 'Receita' ? 'rt-green' : 'rt-red';
    h += '<tr><td style="font-weight:600">' + it.nome + '</td><td>' + it.origem + '</td><td>' + it.cat + '</td><td>' + it.tipo + '</td><td class="' + cls + '" style="font-weight:700">' + fmtV(it.valor) + '</td></tr>';
  });
  h += '<tr class="rt-total"><td colspan="4">Total Custos Fixos (Despesas)</td><td class="rt-red">' + fmtV(totalFixo) + '</td></tr>';
  h += '</tbody></table></div>';

  h += '<div class="rel-analysis"><h4>An&aacute;lise</h4>';
  h += '<p><strong>' + pctFixo + '%</strong> das suas despesas mensais s&atilde;o custos fixos (contratos + assinaturas).</p>';
  if(parseFloat(pctFixo) > 70) h += '<p>&#9888; Seus custos fixos representam mais de 70% das despesas. Considere revisar contratos e assinaturas.</p>';
  else if(parseFloat(pctFixo) > 50) h += '<p>&#128993; Seus custos fixos est&atilde;o em n&iacute;vel moderado (50-70%). Monitore para evitar crescimento.</p>';
  else h += '<p>&#128994; Seus custos fixos est&atilde;o em n&iacute;vel saud&aacute;vel (&lt;50%).</p>';
  h += '</div></div>';

  return h;
}

// ================================================================
// 4. RELAT&Oacute;RIO DE CART&Otilde;ES
// ================================================================
function buildCartoes(){
  var ma = mesAtual();
  var meses = getLast12Months();

  var h = '<div class="rel-area">';
  h += '<h3>&#128179; Relat&oacute;rio de Cart&otilde;es de Cr&eacute;dito</h3>';

  if(!S.cartoes.length){
    h += '<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum cart&atilde;o cadastrado.</p></div>';
    return h;
  }

  // Por cart&atilde;o
  S.cartoes.forEach(function(cart){
    var usado = 0;
    var faturas = [];

    meses.forEach(function(mes){
      var fatura = faturaCC(mes);
      var valCart = fatura.filter(function(f){ return f.cartao === cart.nome; }).reduce(function(s, f){ return s + f.valor; }, 0);
      faturas.push({mes: mes, valor: valCart});
      if(mes === ma) usado = valCart;
    });

    var totalAnual = faturas.reduce(function(s, f){ return s + f.valor; }, 0);
    var media = totalAnual / 12;
    var limite = cart.limite || 0;
    var usoPct = limite > 0 ? ((usado / limite) * 100).toFixed(1) : '0';

    h += '<div style="margin-bottom:20px;padding:16px;background:var(--bg3);border-radius:var(--rad)">';
    h += '<h4 style="margin-bottom:12px">' + cart.nome + ' <small style="color:var(--tx3)">' + (cart.bandeira || '') + '</small></h4>';

    h += '<div class="rel-mini-cards">';
    h += '<div class="rel-mc"><div class="rmc-label">Limite</div><div class="rmc-val">' + fmtV(limite) + '</div></div>';
    h += '<div class="rel-mc"><div class="rmc-label">Fatura Atual</div><div class="rmc-val rt-red">' + fmtV(usado) + '</div></div>';
    h += '<div class="rel-mc"><div class="rmc-label">Uso do Limite</div><div class="rmc-val ' + (parseFloat(usoPct) > 80 ? 'rt-red' : 'rt-blue') + '">' + usoPct + '%</div></div>';
    h += '<div class="rel-mc"><div class="rmc-label">M&eacute;dia/m&ecirc;s</div><div class="rmc-val">' + fmtV(media) + '</div></div>';
    h += '</div>';

    // Mini tabela de faturas
    h += '<div style="overflow-x:auto;"><table class="rel-table"><thead><tr>';
    faturas.slice(-6).forEach(function(f){ h += '<th>' + mesNome(f.mes) + '</th>'; });
    h += '</tr></thead><tbody><tr>';
    faturas.slice(-6).forEach(function(f){ h += '<td class="rt-red" style="font-weight:600">' + fmtV(f.valor) + '</td>'; });
    h += '</tr></tbody></table></div>';

    h += '</div>';
  });

  h += '</div>';
  return h;
}

// ================================================================
// 5. EVOLU&Ccedil;&Atilde;O PATRIMONIAL
// ================================================================
function buildEvolucao(){
  var meses = getLast12Months();
  var saldoAcum = 0;
  var data = [];

  meses.forEach(function(mes){
    var E = allEntries(mes);
    var rec = 0, desp = 0;
    E.forEach(function(e){ if(e.tipo === 'receita') rec += e.valor; else desp += e.valor; });
    saldoAcum += (rec - desp);
    data.push({mes: mes, rec: rec, desp: desp, saldo: rec - desp, acum: saldoAcum});
  });

  var investTotal = S.investimentos.reduce(function(s, i){ return s + (Number(i.valor) || 0); }, 0);
  var mediaSaldo = saldoAcum / data.length;

  // Proje&ccedil;&atilde;o 6 meses
  var proj = [];
  var base = saldoAcum;
  for(var i = 1; i <= 6; i++){
    base += mediaSaldo;
    proj.push({mes: addMes(mesAtual(), i), acum: base});
  }

  var h = '<div class="rel-area">';
  h += '<h3>&#128200; Evolu&ccedil;&atilde;o Patrimonial</h3>';

  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Saldo Acumulado</div><div class="rmc-val ' + (saldoAcum >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(saldoAcum) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Investimentos</div><div class="rmc-val rt-blue">' + fmtV(investTotal) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Patrim. Estimado</div><div class="rmc-val rt-purple">' + fmtV(saldoAcum + investTotal) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Poupan&ccedil;a M&eacute;dia</div><div class="rmc-val ' + (mediaSaldo >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(mediaSaldo) + '/m&ecirc;s</div></div>';
  h += '</div>';

  // Barras de evolu&ccedil;&atilde;o
  var maxAcum = Math.max.apply(null, data.map(function(d){ return Math.abs(d.acum); }).concat([1]));
  h += '<h4 style="font-size:.88em;color:var(--tx2);margin:16px 0 10px">Evolu&ccedil;&atilde;o do Saldo Acumulado</h4>';
  data.forEach(function(d){
    var w = Math.max((Math.abs(d.acum) / maxAcum) * 100, 2);
    var cor = d.acum >= 0 ? 'var(--ok)' : 'var(--dn2)';
    h += '<div class="rel-hbar">';
    h += '<div class="rhb-label">' + mesNome(d.mes) + '</div>';
    h += '<div class="rhb-bar-bg"><div class="rhb-bar-fill" style="width:' + w + '%;background:' + cor + '"></div></div>';
    h += '<div class="rhb-val" style="color:' + cor + '">' + fmtV(d.acum) + '</div>';
    h += '</div>';
  });

  // Proje&ccedil;&atilde;o
  h += '<div class="rel-analysis"><h4>Proje&ccedil;&atilde;o (6 meses)</h4>';
  h += '<p>Com base na m&eacute;dia de poupan&ccedil;a de <strong>' + fmtV(mediaSaldo) + '/m&ecirc;s</strong>:</p>';
  proj.forEach(function(p){
    h += '<p>' + mesNomeFull(p.mes) + ': <strong class="' + (p.acum >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(p.acum) + '</strong></p>';
  });
  h += '</div></div>';

  return h;
}

// ================================================================
// 6. DESEMPENHO DO OR&Ccedil;AMENTO
// ================================================================
function buildOrcamento(){
  var ma = mesAtual();
  var plan = S.planejamento[ma] || {};
  var cats = Object.keys(plan);

  var h = '<div class="rel-area">';
  h += '<h3>&#127919; Desempenho do Or&ccedil;amento &mdash; ' + mesNomeFull(ma) + '</h3>';

  if(!cats.length){
    h += '<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum or&ccedil;amento definido para este m&ecirc;s. V&aacute; em Planejamento para definir limites.</p></div>';
    return h;
  }

  var E = allEntries(ma);
  var totalPlan = 0, totalGasto = 0, ok = 0, warn = 0, danger = 0;

  var rows = cats.map(function(cat){
    var lim = plan[cat] || 0;
    var gasto = E.filter(function(e){ return e.tipo === 'despesa' && e.cat === cat; }).reduce(function(s, e){ return s + e.valor; }, 0);
    totalPlan += lim;
    totalGasto += gasto;
    var p = lim ? Math.round(gasto / lim * 100) : 0;
    if(p > 100) danger++;
    else if(p > 80) warn++;
    else ok++;
    return {cat: cat, lim: lim, gasto: gasto, disp: lim - gasto, pct: p};
  });

  rows.sort(function(a, b){ return b.pct - a.pct; });

  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Or&ccedil;amento Total</div><div class="rmc-val">' + fmtV(totalPlan) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Gasto Atual</div><div class="rmc-val rt-red">' + fmtV(totalGasto) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Dispon&iacute;vel</div><div class="rmc-val ' + (totalPlan - totalGasto >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(totalPlan - totalGasto) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">No Limite</div><div class="rmc-val rt-green">' + ok + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Aten&ccedil;&atilde;o</div><div class="rmc-val" style="color:var(--wn)">' + warn + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Estourou</div><div class="rmc-val rt-red">' + danger + '</div></div>';
  h += '</div>';

  // Barras
  rows.forEach(function(r){
    var cor = r.pct > 100 ? 'var(--dn2)' : r.pct > 80 ? 'var(--wn)' : 'var(--ok)';
    var w = Math.min(r.pct, 100);
    h += '<div class="rel-hbar">';
    h += '<div class="rhb-label">' + r.cat + '</div>';
    h += '<div class="rhb-bar-bg"><div class="rhb-bar-fill" style="width:' + w + '%;background:' + cor + '"></div></div>';
    h += '<div class="rhb-val" style="color:' + cor + '">' + r.pct + '% (' + fmtV(r.gasto) + '/' + fmtV(r.lim) + ')</div>';
    h += '</div>';
  });

  // An&aacute;lise
  h += '<div class="rel-analysis"><h4>An&aacute;lise</h4>';
  if(danger > 0) h += '<p>&#128308; <strong>' + danger + ' categoria(s)</strong> estourou(aram) o or&ccedil;amento.</p>';
  if(warn > 0) h += '<p>&#128993; <strong>' + warn + ' categoria(s)</strong> est&aacute;(ao) acima de 80% do limite.</p>';
  var cumprimento = totalPlan > 0 ? Math.round((1 - Math.min(totalGasto / totalPlan, 1)) * 100) : 0;
  h += '<p>&#127919; Taxa de cumprimento do or&ccedil;amento: <strong>' + cumprimento + '%</strong></p>';
  h += '</div></div>';

  return h;
}

// ================================================================
// 7. RESUMO ANUAL
// ================================================================
function buildAnual(){
  var year = new Date().getFullYear();
  var meses = getMonthsForYear(year);
  var data = [];
  var totalRec = 0, totalDesp = 0;

  meses.forEach(function(mes){
    var E = allEntries(mes);
    var rec = 0, desp = 0;
    E.forEach(function(e){ if(e.tipo === 'receita') rec += e.valor; else desp += e.valor; });
    totalRec += rec;
    totalDesp += desp;
    data.push({mes: mes, rec: rec, desp: desp, saldo: rec - desp});
  });

  var mesAtualStr = mesAtual();
  var mesesComDados = data.filter(function(d){ return d.mes <= mesAtualStr && (d.rec > 0 || d.desp > 0); });
  var melhorMes = mesesComDados.length ? mesesComDados.reduce(function(b, d){ return d.saldo > b.saldo ? d : b; }, mesesComDados[0]) : null;
  var piorMes = mesesComDados.length ? mesesComDados.reduce(function(w, d){ return d.saldo < w.saldo ? d : w; }, mesesComDados[0]) : null;

  var h = '<div class="rel-area">';
  h += '<h3>&#128197; Resumo Anual &mdash; ' + year + '</h3>';

  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Receitas ' + year + '</div><div class="rmc-val rt-green">' + fmtV(totalRec) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Despesas ' + year + '</div><div class="rmc-val rt-red">' + fmtV(totalDesp) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Saldo ' + year + '</div><div class="rmc-val ' + (totalRec - totalDesp >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(totalRec - totalDesp) + '</div></div>';
  if(melhorMes) h += '<div class="rel-mc"><div class="rmc-label">Melhor M&ecirc;s</div><div class="rmc-val rt-green">' + mesNome(melhorMes.mes) + '</div></div>';
  if(piorMes) h += '<div class="rel-mc"><div class="rmc-label">Pior M&ecirc;s</div><div class="rmc-val rt-red">' + mesNome(piorMes.mes) + '</div></div>';
  h += '</div>';

  // Tabela mensal
  h += '<div style="overflow-x:auto;">';
  h += '<table class="rel-table"><thead><tr><th>M&ecirc;s</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>';
  data.forEach(function(d){
    if(d.mes > mesAtualStr) return;
    h += '<tr><td>' + mesNome(d.mes) + '</td>';
    h += '<td class="rt-green" style="font-weight:600">' + fmtV(d.rec) + '</td>';
    h += '<td class="rt-red" style="font-weight:600">' + fmtV(d.desp) + '</td>';
    h += '<td class="' + (d.saldo >= 0 ? 'rt-green' : 'rt-red') + '" style="font-weight:700">' + fmtV(d.saldo) + '</td></tr>';
  });
  h += '<tr class="rt-total"><td>Total ' + year + '</td><td class="rt-green">' + fmtV(totalRec) + '</td><td class="rt-red">' + fmtV(totalDesp) + '</td><td class="' + (totalRec - totalDesp >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(totalRec - totalDesp) + '</td></tr>';
  h += '</tbody></table></div>';

  // Barras
  var maxD = Math.max.apply(null, data.map(function(d){ return Math.max(d.rec, d.desp); }).concat([1]));
  h += '<h4 style="font-size:.88em;color:var(--tx2);margin:16px 0 10px">Receitas vs Despesas por M&ecirc;s</h4>';
  data.forEach(function(d){
    if(d.mes > mesAtualStr) return;
    var wr = Math.max((d.rec / maxD) * 100, 1);
    var wd = Math.max((d.desp / maxD) * 100, 1);
    h += '<div style="margin-bottom:8px">';
    h += '<div style="font-size:.76em;color:var(--tx3);margin-bottom:2px">' + mesNome(d.mes) + '</div>';
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px"><div style="width:40px;font-size:.65em;color:var(--ok);text-align:right">Rec</div><div style="flex:1;background:var(--bg3);border-radius:4px;height:10px;overflow:hidden"><div style="width:' + wr + '%;height:100%;background:var(--ok);border-radius:4px"></div></div><div style="font-size:.68em;min-width:70px">' + fmtV(d.rec) + '</div></div>';
    h += '<div style="display:flex;align-items:center;gap:6px"><div style="width:40px;font-size:.65em;color:var(--dn2);text-align:right">Desp</div><div style="flex:1;background:var(--bg3);border-radius:4px;height:10px;overflow:hidden"><div style="width:' + wd + '%;height:100%;background:var(--dn2);border-radius:4px"></div></div><div style="font-size:.68em;min-width:70px">' + fmtV(d.desp) + '</div></div>';
    h += '</div>';
  });

  h += '</div>';
  return h;
}

// ================================================================
// 8. ALERTAS E VENCIMENTOS
// ================================================================
function buildAlertas(){
  var ma = mesAtual();
  var prox1 = addMes(ma, 1);
  var prox2 = addMes(ma, 2);
  var prox3 = addMes(ma, 3);

  var alertas = [];

  // Contratos com dataFim pr&oacute;ximo
  S.contratos.forEach(function(c){
    if(c.encerradoEm) return;
    if(c.dataFim){
      var fimMes = c.dataFim.substring(0, 7);
      if(fimMes >= ma && fimMes <= prox3){
        alertas.push({
          icon: '&#128197;',
          tipo: 'Contrato vencendo',
          desc: c.desc,
          detalhe: 'Vence em ' + mesNomeFull(c.dataFim),
          cor: fimMes === ma ? 'var(--dn2)' : fimMes === prox1 ? 'var(--wn)' : 'var(--inf2)',
          urgencia: fimMes === ma ? 1 : fimMes === prox1 ? 2 : 3
        });
      }
    }
  });

  // Parcelas ativas (compras parceladas)
  var parcelasAtivas = 0;
  var valorParcelasHoje = 0;
  S.comprasCartao.forEach(function(c){
    var p = c.parcelas || 1;
    if(p <= 1) return;
    var mC = getMes(c.data);
    for(var i = 0; i < p; i++){
      if(addMes(mC, i) === ma){
        parcelasAtivas++;
        valorParcelasHoje += (Number(c.valor) || 0) / p;
      }
    }
    // &Uacute;ltima parcela
    var ultimaParcela = addMes(mC, p - 1);
    if(ultimaParcela >= ma && ultimaParcela <= prox3){
      alertas.push({
        icon: '&#128179;',
        tipo: '&Uacute;ltima parcela',
        desc: c.desc + ' (' + p + 'x)',
        detalhe: '&Uacute;ltima em ' + mesNome(ultimaParcela),
        cor: 'var(--ok)',
        urgencia: 4
      });
    }
  });

  // Assinaturas com valor alto
  S.assinaturas.filter(function(s){ return !s.encerradaEm; }).forEach(function(s){
    if(Number(s.valor) > 200){
      alertas.push({
        icon: '&#128257;',
        tipo: 'Assinatura alta',
        desc: s.nome,
        detalhe: fmtV(s.valor) + '/m&ecirc;s',
        cor: 'var(--wn)',
        urgencia: 5
      });
    }
  });

  alertas.sort(function(a, b){ return a.urgencia - b.urgencia; });

  var h = '<div class="rel-area">';
  h += '<h3>&#9888; Alertas e Vencimentos</h3>';

  h += '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Alertas Ativos</div><div class="rmc-val rt-red">' + alertas.length + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Parcelas Ativas</div><div class="rmc-val rt-blue">' + parcelasAtivas + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Valor Parcelas/m&ecirc;s</div><div class="rmc-val rt-red">' + fmtV(valorParcelasHoje) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Contratos Ativos</div><div class="rmc-val">' + S.contratos.filter(function(c){ return !c.encerradoEm; }).length + '</div></div>';
  h += '</div>';

  if(alertas.length === 0){
    h += '<div class="rel-analysis"><h4>Tudo certo!</h4><p>&#128994; Nenhum alerta no momento. Seus compromissos financeiros est&atilde;o sob controle.</p></div>';
  } else {
    h += '<div style="overflow-x:auto;">';
    h += '<table class="rel-table"><thead><tr><th></th><th>Tipo</th><th>Descri&ccedil;&atilde;o</th><th>Detalhe</th></tr></thead><tbody>';
    alertas.forEach(function(a){
      h += '<tr><td style="font-size:1.2em">' + a.icon + '</td>';
      h += '<td style="font-weight:600;color:' + a.cor + '">' + a.tipo + '</td>';
      h += '<td>' + a.desc + '</td>';
      h += '<td>' + a.detalhe + '</td></tr>';
    });
    h += '</tbody></table></div>';
  }

  // Compromissos futuros
  h += '<div class="rel-analysis"><h4>Compromissos dos Pr&oacute;ximos 3 Meses</h4>';
  [prox1, prox2, prox3].forEach(function(m){
    var E = allEntries(m);
    var desp = E.filter(function(e){ return e.tipo === 'despesa'; }).reduce(function(s, e){ return s + e.valor; }, 0);
    var fat = faturaCC(m).reduce(function(s, f){ return s + f.valor; }, 0);
    h += '<p><strong>' + mesNomeFull(m) + ':</strong> Despesas previstas <span class="rt-red" style="font-weight:700">' + fmtV(desp) + '</span>';
    if(fat > 0) h += ' | Fatura cart&atilde;o <span style="color:#e65100;font-weight:700">' + fmtV(fat) + '</span>';
    h += '</p>';
  });
  h += '</div></div>';

  return h;
}

// ================================================================
// Init
// ================================================================
addMenuLink();
createPage();

console.log('[Financeiro Pro] Relat\u00f3rios v1 carregado — 8 relat\u00f3rios dispon\u00edveis.');
})();

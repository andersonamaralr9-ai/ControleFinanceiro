// relatorios.js v2 — Navegacao de mes + Relatorio Detalhado Excel
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
.rel-opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:24px;}
.rel-opt{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:20px;box-shadow:var(--sh);cursor:pointer;transition:all .2s;}
.rel-opt:hover{transform:translateY(-3px);border-color:var(--pri);}
.rel-opt .ro-icon{font-size:1.8em;margin-bottom:8px;}
.rel-opt .ro-title{font-size:.95em;font-weight:700;margin-bottom:4px;}
.rel-opt .ro-desc{font-size:.78em;color:var(--tx3);line-height:1.4;}
.rel-area{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:24px;box-shadow:var(--sh);margin-bottom:24px;}
.rel-area h3{font-size:1.05em;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid var(--bg4);}
.rel-back{display:inline-flex;align-items:center;gap:6px;font-size:.85em;color:var(--pri2);cursor:pointer;margin-bottom:16px;padding:6px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--bg4);transition:all .15s;}
.rel-back:hover{background:var(--bg4);}
.rel-table{width:100%;border-collapse:collapse;margin-bottom:16px;}
.rel-table th{background:var(--bg3);padding:10px 14px;text-align:left;font-size:.73em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;}
.rel-table td{padding:10px 14px;border-bottom:1px solid var(--bg3);font-size:.84em;}
.rel-table tr:hover td{background:rgba(108,92,231,.03);}
.rel-table .rt-total{background:var(--bg3);font-weight:700;}
.rel-table .rt-green{color:var(--ok);}
.rel-table .rt-red{color:var(--dn2);}
.rel-table .rt-blue{color:var(--inf2);}
.rel-table .rt-purple{color:var(--pri2);}
.rel-filters{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:20px;}
.rel-filters .form-group{min-width:140px;}
.rel-filters .form-group label{font-size:.72em;color:var(--tx2);font-weight:600;display:block;margin-bottom:4px;}
.rel-mini-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;}
.rel-mc{background:var(--bg3);border-radius:8px;padding:12px;text-align:center;}
.rel-mc .rmc-label{font-size:.62em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:2px;}
.rel-mc .rmc-val{font-size:1.05em;font-weight:700;}
.rel-hbar{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.rel-hbar .rhb-label{font-size:.82em;min-width:120px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rel-hbar .rhb-bar-bg{flex:1;background:var(--bg3);border-radius:6px;height:18px;overflow:hidden;}
.rel-hbar .rhb-bar-fill{height:100%;border-radius:6px;transition:width .4s;}
.rel-hbar .rhb-val{font-size:.78em;font-weight:700;min-width:80px;}
.rel-analysis{background:var(--bg3);border-radius:var(--rad);padding:16px;margin-bottom:16px;}
.rel-analysis h4{font-size:.88em;font-weight:700;margin-bottom:10px;color:var(--tx2);}
.rel-analysis p{font-size:.84em;color:var(--tx2);line-height:1.5;margin-bottom:6px;}
.rel-analysis strong{color:var(--tx);}
.rel-month-nav{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:16px;}
.rel-month-nav .rel-mes-label{font-size:1em;font-weight:600;min-width:160px;text-align:center;}
@media(max-width:768px){
  .rel-opts{grid-template-columns:1fr;}
  .rel-opt{padding:14px;}
  .rel-area{padding:14px;}
  .rel-filters{flex-direction:column;align-items:stretch;}
  .rel-filters .form-group{min-width:100%;}
  .rel-mini-cards{grid-template-columns:1fr 1fr;gap:8px;}
  .rel-hbar .rhb-label{min-width:80px;font-size:.72em;}
  .rel-hbar .rhb-val{min-width:60px;font-size:.7em;}
  .rel-table th,.rel-table td{padding:7px 8px;font-size:.72em;}
  .rel-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .rel-month-nav .rel-mes-label{font-size:.85em;min-width:120px;}
}
@media(max-width:380px){
  .rel-mini-cards{grid-template-columns:1fr 1fr;}
  .rel-mc .rmc-val{font-size:.85em;}
}
`;
document.head.appendChild(sty);

// ================================================================
// Estado dos relatorios com mes
// ================================================================
var relState = {
  despcat_mes: mesAtual(),
  recorrentes_mes: mesAtual(),
  orcamento_mes: mesAtual(),
  detalhado_de: addMes(mesAtual(), -2),
  detalhado_ate: mesAtual()
};

window._relChgMes = function(report, n){
  relState[report + '_mes'] = addMes(relState[report + '_mes'], n);
  openReport(report);
};

// ================================================================
// Menu lateral
// ================================================================
function addMenuLink(){
  var sidebar = document.getElementById('sidebar');
  if(!sidebar || document.getElementById('nav-relatorios')) return;
  var configLink = document.getElementById('nav-config');
  var newLink = document.createElement('a');
  newLink.id = 'nav-relatorios';
  newLink.setAttribute('onclick', "nav('relatorios')");
  newLink.innerHTML = '<span>&#128202; Relat&oacute;rios</span>';
  if(configLink) sidebar.insertBefore(newLink, configLink);
}

function createPage(){
  if(document.getElementById('pg-relatorios')) return;
  var page = document.createElement('div');
  page.className = 'page';
  page.id = 'pg-relatorios';
  page.innerHTML = '<h2 class="page-title">&#128202; Relat&oacute;rios</h2><div id="relContent"></div>';
  var mainDiv = document.querySelector('.main');
  if(mainDiv) mainDiv.appendChild(page);
}

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
// Menu de relatorios
// ================================================================
window.renderRelatorios = function(){
  var el = document.getElementById('relContent');
  if(!el) return;

  var reports = [
    {id:'fluxo',icon:'&#128200;',title:'Fluxo de Caixa',desc:'Receitas, despesas, saldo e evolu&ccedil;&atilde;o nos &uacute;ltimos 12 meses.'},
    {id:'despcat',icon:'&#128202;',title:'Despesas por Categoria',desc:'Ranking por categoria com navega&ccedil;&atilde;o mensal e compara&ccedil;&atilde;o.'},
    {id:'recorrentes',icon:'&#128257;',title:'Custos Fixos',desc:'Contratos e assinaturas: total fixo mensal com navega&ccedil;&atilde;o de m&ecirc;s.'},
    {id:'cartoes',icon:'&#128179;',title:'Cart&otilde;es de Cr&eacute;dito',desc:'Faturas, uso de limite e m&eacute;dia por cart&atilde;o.'},
    {id:'evolucao',icon:'&#128200;',title:'Evolu&ccedil;&atilde;o Patrimonial',desc:'Saldo acumulado e proje&ccedil;&atilde;o de 6 meses.'},
    {id:'orcamento',icon:'&#127919;',title:'Or&ccedil;amento',desc:'Planejado vs realizado com navega&ccedil;&atilde;o mensal.'},
    {id:'anual',icon:'&#128197;',title:'Resumo Anual',desc:'Vis&atilde;o consolidada do ano corrente.'},
    {id:'inadimplencia',icon:'&#9888;',title:'Alertas',desc:'Vencimentos, parcelas e compromissos futuros.'},
    {id:'detalhado',icon:'&#128203;',title:'Extrato Detalhado (Excel)',desc:'Todos os lan&ccedil;amentos por categoria, data e compet&ecirc;ncia para an&aacute;lise em Excel.'}
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
// Abrir relatorio
// ================================================================
window.openReport = function(id){
  var el = document.getElementById('relContent');
  if(!el) return;
  var back = '<div class="rel-back" onclick="renderRelatorios()">&#9664; Voltar aos Relat&oacute;rios</div>';
  switch(id){
    case 'fluxo': el.innerHTML = back + buildFluxoCaixa(); break;
    case 'despcat': el.innerHTML = back + buildDespCat(); break;
    case 'recorrentes': el.innerHTML = back + buildRecorrentes(); break;
    case 'cartoes': el.innerHTML = back + buildCartoes(); break;
    case 'evolucao': el.innerHTML = back + buildEvolucao(); break;
    case 'orcamento': el.innerHTML = back + buildOrcamento(); break;
    case 'anual': el.innerHTML = back + buildAnual(); break;
    case 'inadimplencia': el.innerHTML = back + buildAlertas(); break;
    case 'detalhado': el.innerHTML = back + buildDetalhado(); break;
  }
};

// ================================================================
// HELPERS
// ================================================================
function getLast12(){ var m=[]; for(var i=-11;i<=0;i++) m.push(addMes(mesAtual(),i)); return m; }
function getYear(y){ var m=[]; for(var i=1;i<=12;i++) m.push(y+'-'+String(i).padStart(2,'0')); return m; }
function pct(p,t){ return t ? Math.round(p/t*100) : 0; }
function monthNav(report, mes){
  return '<div class="rel-month-nav">' +
    '<button class="btn btn-outline btn-sm" onclick="_relChgMes(\'' + report + '\',-1)">&#9664;</button>' +
    '<span class="rel-mes-label">' + mesNomeFull(mes) + '</span>' +
    '<button class="btn btn-outline btn-sm" onclick="_relChgMes(\'' + report + '\',1)">&#9654;</button>' +
    '</div>';
}

// ================================================================
// 1. FLUXO DE CAIXA (12 meses)
// ================================================================
function buildFluxoCaixa(){
  var meses = getLast12(), data = [], sA = 0;
  meses.forEach(function(m){ var E=allEntries(m),r=0,d=0; E.forEach(function(e){if(e.tipo==='receita')r+=e.valor;else d+=e.valor;}); sA+=(r-d); data.push({m:m,r:r,d:d,s:r-d,a:sA}); });
  var tR=data.reduce(function(s,d){return s+d.r;},0), tD=data.reduce(function(s,d){return s+d.d;},0), mR=tR/12, mD=tD/12, mS=(tR-tD)/12;
  var best=data.reduce(function(b,d){return d.s>b.s?d:b;},data[0]);
  var worst=data.reduce(function(w,d){return d.s<w.s?d:w;},data[0]);
  var tp=tR>0?((tR-tD)/tR*100).toFixed(1):'0';
  var h='<div class="rel-area"><h3>&#128200; Fluxo de Caixa &mdash; 12 Meses</h3>';
  h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Total Receitas</div><div class="rmc-val rt-green">'+fmtV(tR)+'</div></div><div class="rel-mc"><div class="rmc-label">Total Despesas</div><div class="rmc-val rt-red">'+fmtV(tD)+'</div></div><div class="rel-mc"><div class="rmc-label">Saldo</div><div class="rmc-val '+(tR-tD>=0?'rt-green':'rt-red')+'">'+fmtV(tR-tD)+'</div></div><div class="rel-mc"><div class="rmc-label">M&eacute;dia Mensal</div><div class="rmc-val '+(mS>=0?'rt-green':'rt-red')+'">'+fmtV(mS)+'</div></div></div>';
  h+='<div style="overflow-x:auto"><table class="rel-table"><thead><tr><th>M&ecirc;s</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th>Acumulado</th></tr></thead><tbody>';
  data.forEach(function(d){ h+='<tr><td>'+mesNome(d.m)+'</td><td class="rt-green" style="font-weight:600">'+fmtV(d.r)+'</td><td class="rt-red" style="font-weight:600">'+fmtV(d.d)+'</td><td class="'+(d.s>=0?'rt-green':'rt-red')+'" style="font-weight:700">'+fmtV(d.s)+'</td><td class="'+(d.a>=0?'rt-green':'rt-red')+'" style="font-weight:700">'+fmtV(d.a)+'</td></tr>'; });
  h+='<tr class="rt-total"><td>M&eacute;dia</td><td class="rt-green">'+fmtV(mR)+'</td><td class="rt-red">'+fmtV(mD)+'</td><td class="'+(mS>=0?'rt-green':'rt-red')+'">'+fmtV(mS)+'</td><td>&mdash;</td></tr></tbody></table></div>';
  h+='<div class="rel-analysis"><h4>An&aacute;lise</h4><p>&#128994; <strong>Melhor:</strong> '+mesNomeFull(best.m)+' ('+fmtV(best.s)+')</p><p>&#128308; <strong>Pior:</strong> '+mesNomeFull(worst.m)+' ('+fmtV(worst.s)+')</p><p>&#128176; <strong>Poupan&ccedil;a:</strong> '+tp+'%</p></div></div>';
  return h;
}

// ================================================================
// 2. DESPESAS POR CATEGORIA (com navegacao de mes)
// ================================================================
function buildDespCat(){
  var mes = relState.despcat_mes;
  var E = allEntries(mes);
  var catT = {}, total = 0;
  E.forEach(function(e){ if(e.tipo==='despesa'){ catT[e.cat]=(catT[e.cat]||0)+e.valor; total+=e.valor; } });
  var sorted = Object.entries(catT).sort(function(a,b){return b[1]-a[1];});
  var maxV = sorted.length ? sorted[0][1] : 1;
  var colors = ['var(--dn2)','var(--wn)','var(--pri2)','var(--inf2)','var(--ok)','var(--tx2)'];

  var h = '<div class="rel-area"><h3>&#128202; Despesas por Categoria</h3>';
  h += monthNav('despcat', mes);
  h += '<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Total Despesas</div><div class="rmc-val rt-red">'+fmtV(total)+'</div></div><div class="rel-mc"><div class="rmc-label">Categorias</div><div class="rmc-val rt-blue">'+sorted.length+'</div></div><div class="rel-mc"><div class="rmc-label">Maior</div><div class="rmc-val rt-purple">'+(sorted.length?sorted[0][0]:'-')+'</div></div></div>';
  sorted.forEach(function(item,idx){
    var cor=colors[idx%colors.length], p=pct(item[1],total);
    h+='<div class="rel-hbar"><div class="rhb-label">'+item[0]+'</div><div class="rhb-bar-bg"><div class="rhb-bar-fill" style="width:'+Math.max((item[1]/maxV)*100,2)+'%;background:'+cor+'"></div></div><div class="rhb-val" style="color:'+cor+'">'+fmtV(item[1])+' ('+p+'%)</div></div>';
  });
  h+='<div style="overflow-x:auto;margin-top:16px"><table class="rel-table"><thead><tr><th>Categoria</th><th>Total</th><th>% do Total</th></tr></thead><tbody>';
  sorted.forEach(function(item){ h+='<tr><td style="font-weight:600">'+item[0]+'</td><td class="rt-red" style="font-weight:600">'+fmtV(item[1])+'</td><td>'+pct(item[1],total)+'%</td></tr>'; });
  h+='<tr class="rt-total"><td>Total</td><td class="rt-red">'+fmtV(total)+'</td><td>100%</td></tr></tbody></table></div></div>';
  return h;
}

// ================================================================
// 3. CUSTOS FIXOS (com navegacao de mes)
// ================================================================
function buildRecorrentes(){
  var mes = relState.recorrentes_mes;
  var contrAtivos = S.contratos.filter(function(c){ if(c.encerradoEm&&c.encerradoEm<mes)return false; if(c.dataFim&&c.dataFim<mes)return false; var ini=(c.inicio||'').substring(0,7); if(!ini||ini>mes)return false; return true; });
  var assAtivas = S.assinaturas.filter(function(s){ if(s.encerradaEm&&s.encerradaEm<mes)return false; var ini=(s.inicio||'').substring(0,7); if(!ini||ini>mes)return false; return true; });

  var tCD=0,tCR=0,tA=0;
  contrAtivos.forEach(function(c){
    var val=Number(c.valor)||0;
    (c.historico||[]).forEach(function(h){var hd=(h.de||'').substring(0,7);if(hd&&mes>=hd)val=Number(h.valor)||0;});
    if(c.tipo==='receita')tCR+=val;else tCD+=val;
  });
  assAtivas.forEach(function(s){
    var val=Number(s.valor)||0;
    (s.historico||[]).forEach(function(h){var hd=(h.de||'').substring(0,7);if(hd&&mes>=hd)val=Number(h.valor)||0;});
    tA+=val;
  });

  var tF=tCD+tA;
  var totalDesp=0; allEntries(mes).forEach(function(e){if(e.tipo==='despesa')totalDesp+=e.valor;});
  var pF=totalDesp>0?((tF/totalDesp)*100).toFixed(1):'0';

  var h='<div class="rel-area"><h3>&#128257; Custos Fixos</h3>';
  h+=monthNav('recorrentes',mes);
  h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Contratos Desp.</div><div class="rmc-val rt-red">'+fmtV(tCD)+'</div></div><div class="rel-mc"><div class="rmc-label">Assinaturas</div><div class="rmc-val rt-red">'+fmtV(tA)+'</div></div><div class="rel-mc"><div class="rmc-label">Contratos Rec.</div><div class="rmc-val rt-green">'+fmtV(tCR)+'</div></div><div class="rel-mc"><div class="rmc-label">Total Fixo</div><div class="rmc-val rt-purple">'+fmtV(tF)+'</div></div><div class="rel-mc"><div class="rmc-label">% Despesas</div><div class="rmc-val rt-blue">'+pF+'%</div></div></div>';

  // Lista
  var itens=[];
  contrAtivos.forEach(function(c){ var v=Number(c.valor)||0; (c.historico||[]).forEach(function(h){var hd=(h.de||'').substring(0,7);if(hd&&mes>=hd)v=Number(h.valor)||0;}); itens.push({nome:c.desc,tipo:c.tipo==='receita'?'Receita':'Despesa',origem:'Contrato',cat:c.categoria||'Outros',valor:v}); });
  assAtivas.forEach(function(s){ var v=Number(s.valor)||0; (s.historico||[]).forEach(function(h){var hd=(h.de||'').substring(0,7);if(hd&&mes>=hd)v=Number(h.valor)||0;}); var cart=S.cartoes.find(function(x){return x.id===s.cartaoId;}); itens.push({nome:s.nome,tipo:'Despesa',origem:'Assinatura'+(cart?' ('+cart.nome+')':''),cat:s.categoria||'Outros',valor:v}); });
  itens.sort(function(a,b){return b.valor-a.valor;});

  h+='<div style="overflow-x:auto"><table class="rel-table"><thead><tr><th>Nome</th><th>Origem</th><th>Categoria</th><th>Tipo</th><th>Valor/m&ecirc;s</th></tr></thead><tbody>';
  itens.forEach(function(it){ h+='<tr><td style="font-weight:600">'+it.nome+'</td><td>'+it.origem+'</td><td>'+it.cat+'</td><td>'+it.tipo+'</td><td class="'+(it.tipo==='Receita'?'rt-green':'rt-red')+'" style="font-weight:700">'+fmtV(it.valor)+'</td></tr>'; });
  h+='<tr class="rt-total"><td colspan="4">Total Fixo (Despesas)</td><td class="rt-red">'+fmtV(tF)+'</td></tr></tbody></table></div>';

  h+='<div class="rel-analysis"><h4>An&aacute;lise</h4><p><strong>'+pF+'%</strong> das despesas s&atilde;o fixas.</p>';
  if(parseFloat(pF)>70) h+='<p>&#9888; Custos fixos muito altos (&gt;70%).</p>';
  else if(parseFloat(pF)>50) h+='<p>&#128993; N&iacute;vel moderado (50-70%).</p>';
  else h+='<p>&#128994; N&iacute;vel saud&aacute;vel (&lt;50%).</p>';
  h+='</div></div>';
  return h;
}

// ================================================================
// 4. CARTOES
// ================================================================
function buildCartoes(){
  var meses=getLast12();
  var h='<div class="rel-area"><h3>&#128179; Cart&otilde;es de Cr&eacute;dito</h3>';
  if(!S.cartoes.length){h+='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum cart&atilde;o.</p></div>';return h;}
  S.cartoes.forEach(function(cart){
    var faturas=[];
    meses.forEach(function(m){ var f=faturaCC(m); var v=f.filter(function(x){return x.cartao===cart.nome;}).reduce(function(s,x){return s+x.valor;},0); faturas.push({m:m,v:v}); });
    var tA=faturas.reduce(function(s,f){return s+f.v;},0), med=tA/12;
    var atual=faturas[faturas.length-1].v, lim=cart.limite||0;
    var uso=lim>0?((atual/lim)*100).toFixed(1):'0';

    h+='<div style="margin-bottom:20px;padding:16px;background:var(--bg3);border-radius:var(--rad)">';
    h+='<h4 style="margin-bottom:12px">'+cart.nome+' <small style="color:var(--tx3)">'+(cart.bandeira||'')+'</small></h4>';
    h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Limite</div><div class="rmc-val">'+fmtV(lim)+'</div></div><div class="rel-mc"><div class="rmc-label">Fatura Atual</div><div class="rmc-val rt-red">'+fmtV(atual)+'</div></div><div class="rel-mc"><div class="rmc-label">Uso</div><div class="rmc-val '+(parseFloat(uso)>80?'rt-red':'rt-blue')+'">'+uso+'%</div></div><div class="rel-mc"><div class="rmc-label">M&eacute;dia</div><div class="rmc-val">'+fmtV(med)+'</div></div></div>';
    h+='<div style="overflow-x:auto"><table class="rel-table"><thead><tr>';
    faturas.slice(-6).forEach(function(f){h+='<th>'+mesNome(f.m)+'</th>';});
    h+='</tr></thead><tbody><tr>';
    faturas.slice(-6).forEach(function(f){h+='<td class="rt-red" style="font-weight:600">'+fmtV(f.v)+'</td>';});
    h+='</tr></tbody></table></div></div>';
  });
  h+='</div>';return h;
}

// ================================================================
// 5. EVOLUCAO PATRIMONIAL
// ================================================================
function buildEvolucao(){
  var meses=getLast12(),sA=0,data=[];
  meses.forEach(function(m){var E=allEntries(m),r=0,d=0;E.forEach(function(e){if(e.tipo==='receita')r+=e.valor;else d+=e.valor;});sA+=(r-d);data.push({m:m,s:r-d,a:sA});});
  var inv=S.investimentos.reduce(function(s,i){return s+(Number(i.valor)||0);},0);
  var mS=sA/12;
  var proj=[];var b=sA;for(var i=1;i<=6;i++){b+=mS;proj.push({m:addMes(mesAtual(),i),a:b});}
  var maxA=Math.max.apply(null,data.map(function(d){return Math.abs(d.a);}).concat([1]));

  var h='<div class="rel-area"><h3>&#128200; Evolu&ccedil;&atilde;o Patrimonial</h3>';
  h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Saldo Acumulado</div><div class="rmc-val '+(sA>=0?'rt-green':'rt-red')+'">'+fmtV(sA)+'</div></div><div class="rel-mc"><div class="rmc-label">Investimentos</div><div class="rmc-val rt-blue">'+fmtV(inv)+'</div></div><div class="rel-mc"><div class="rmc-label">Patrim&ocirc;nio</div><div class="rmc-val rt-purple">'+fmtV(sA+inv)+'</div></div><div class="rel-mc"><div class="rmc-label">Poupan&ccedil;a/m&ecirc;s</div><div class="rmc-val '+(mS>=0?'rt-green':'rt-red')+'">'+fmtV(mS)+'</div></div></div>';
  data.forEach(function(d){var w=Math.max((Math.abs(d.a)/maxA)*100,2);var cor=d.a>=0?'var(--ok)':'var(--dn2)';h+='<div class="rel-hbar"><div class="rhb-label">'+mesNome(d.m)+'</div><div class="rhb-bar-bg"><div class="rhb-bar-fill" style="width:'+w+'%;background:'+cor+'"></div></div><div class="rhb-val" style="color:'+cor+'">'+fmtV(d.a)+'</div></div>';});
  h+='<div class="rel-analysis"><h4>Proje&ccedil;&atilde;o (6 meses)</h4><p>M&eacute;dia: <strong>'+fmtV(mS)+'/m&ecirc;s</strong></p>';
  proj.forEach(function(p){h+='<p>'+mesNomeFull(p.m)+': <strong class="'+(p.a>=0?'rt-green':'rt-red')+'">'+fmtV(p.a)+'</strong></p>';});
  h+='</div></div>';return h;
}

// ================================================================
// 6. ORCAMENTO (com navegacao de mes)
// ================================================================
function buildOrcamento(){
  var mes=relState.orcamento_mes;
  var plan=S.planejamento[mes]||{};var cats=Object.keys(plan);
  var h='<div class="rel-area"><h3>&#127919; Or&ccedil;amento</h3>';
  h+=monthNav('orcamento',mes);
  if(!cats.length){h+='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum or&ccedil;amento em '+mesNomeFull(mes)+'.</p></div>';return h;}
  var E=allEntries(mes),tP=0,tG=0,ok=0,wn=0,dn=0;
  var rows=cats.map(function(cat){var lim=plan[cat]||0;var gasto=E.filter(function(e){return e.tipo==='despesa'&&e.cat===cat;}).reduce(function(s,e){return s+e.valor;},0);tP+=lim;tG+=gasto;var p=lim?Math.round(gasto/lim*100):0;if(p>100)dn++;else if(p>80)wn++;else ok++;return{cat:cat,lim:lim,gasto:gasto,pct:p};});
  rows.sort(function(a,b){return b.pct-a.pct;});
  h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Or&ccedil;amento</div><div class="rmc-val">'+fmtV(tP)+'</div></div><div class="rel-mc"><div class="rmc-label">Gasto</div><div class="rmc-val rt-red">'+fmtV(tG)+'</div></div><div class="rel-mc"><div class="rmc-label">Dispon&iacute;vel</div><div class="rmc-val '+(tP-tG>=0?'rt-green':'rt-red')+'">'+fmtV(tP-tG)+'</div></div><div class="rel-mc"><div class="rmc-label">OK</div><div class="rmc-val rt-green">'+ok+'</div></div><div class="rel-mc"><div class="rmc-label">Aten&ccedil;&atilde;o</div><div class="rmc-val" style="color:var(--wn)">'+wn+'</div></div><div class="rel-mc"><div class="rmc-label">Estourou</div><div class="rmc-val rt-red">'+dn+'</div></div></div>';
  rows.forEach(function(r){var cor=r.pct>100?'var(--dn2)':r.pct>80?'var(--wn)':'var(--ok)';h+='<div class="rel-hbar"><div class="rhb-label">'+r.cat+'</div><div class="rhb-bar-bg"><div class="rhb-bar-fill" style="width:'+Math.min(r.pct,100)+'%;background:'+cor+'"></div></div><div class="rhb-val" style="color:'+cor+'">'+r.pct+'%</div></div>';});
  var cump=tP>0?Math.round((1-Math.min(tG/tP,1))*100):0;
  h+='<div class="rel-analysis"><h4>An&aacute;lise</h4>';
  if(dn>0) h+='<p>&#128308; '+dn+' categoria(s) estourou.</p>';
  if(wn>0) h+='<p>&#128993; '+wn+' categoria(s) &gt;80%.</p>';
  h+='<p>&#127919; Cumprimento: <strong>'+cump+'%</strong></p></div></div>';
  return h;
}

// ================================================================
// 7. RESUMO ANUAL
// ================================================================
function buildAnual(){
  var year=new Date().getFullYear(),meses=getYear(year),data=[],tR=0,tD=0;
  var ma=mesAtual();
  meses.forEach(function(m){var E=allEntries(m),r=0,d=0;E.forEach(function(e){if(e.tipo==='receita')r+=e.valor;else d+=e.valor;});tR+=r;tD+=d;data.push({m:m,r:r,d:d,s:r-d});});
  var comDados=data.filter(function(d){return d.m<=ma&&(d.r>0||d.d>0);});
  var best=comDados.length?comDados.reduce(function(b,d){return d.s>b.s?d:b;},comDados[0]):null;
  var worst=comDados.length?comDados.reduce(function(w,d){return d.s<w.s?d:w;},comDados[0]):null;
  var h='<div class="rel-area"><h3>&#128197; Resumo '+year+'</h3>';
  h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Receitas</div><div class="rmc-val rt-green">'+fmtV(tR)+'</div></div><div class="rel-mc"><div class="rmc-label">Despesas</div><div class="rmc-val rt-red">'+fmtV(tD)+'</div></div><div class="rel-mc"><div class="rmc-label">Saldo</div><div class="rmc-val '+(tR-tD>=0?'rt-green':'rt-red')+'">'+fmtV(tR-tD)+'</div></div>';
  if(best)h+='<div class="rel-mc"><div class="rmc-label">Melhor</div><div class="rmc-val rt-green">'+mesNome(best.m)+'</div></div>';
  if(worst)h+='<div class="rel-mc"><div class="rmc-label">Pior</div><div class="rmc-val rt-red">'+mesNome(worst.m)+'</div></div>';
  h+='</div>';
  h+='<div style="overflow-x:auto"><table class="rel-table"><thead><tr><th>M&ecirc;s</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>';
  data.forEach(function(d){if(d.m>ma)return;h+='<tr><td>'+mesNome(d.m)+'</td><td class="rt-green" style="font-weight:600">'+fmtV(d.r)+'</td><td class="rt-red" style="font-weight:600">'+fmtV(d.d)+'</td><td class="'+(d.s>=0?'rt-green':'rt-red')+'" style="font-weight:700">'+fmtV(d.s)+'</td></tr>';});
  h+='<tr class="rt-total"><td>Total</td><td class="rt-green">'+fmtV(tR)+'</td><td class="rt-red">'+fmtV(tD)+'</td><td class="'+(tR-tD>=0?'rt-green':'rt-red')+'">'+fmtV(tR-tD)+'</td></tr></tbody></table></div></div>';
  return h;
}

// ================================================================
// 8. ALERTAS
// ================================================================
function buildAlertas(){
  var ma=mesAtual(),p1=addMes(ma,1),p2=addMes(ma,2),p3=addMes(ma,3);var alertas=[];
  S.contratos.forEach(function(c){if(c.encerradoEm)return;if(c.dataFim){var fm=c.dataFim.substring(0,7);if(fm>=ma&&fm<=p3)alertas.push({icon:'&#128197;',tipo:'Contrato vencendo',desc:c.desc,det:'Vence em '+mesNomeFull(c.dataFim),cor:fm===ma?'var(--dn2)':fm===p1?'var(--wn)':'var(--inf2)',u:fm===ma?1:2});}});
  var pAtiv=0,vPar=0;
  S.comprasCartao.forEach(function(c){var p=c.parcelas||1;if(p<=1)return;var mC=getMes(c.data);for(var i=0;i<p;i++){if(addMes(mC,i)===ma){pAtiv++;vPar+=(Number(c.valor)||0)/p;}}var ult=addMes(mC,p-1);if(ult>=ma&&ult<=p3)alertas.push({icon:'&#128179;',tipo:'&Uacute;ltima parcela',desc:c.desc+' ('+p+'x)',det:mesNome(ult),cor:'var(--ok)',u:4});});
  S.assinaturas.filter(function(s){return!s.encerradaEm;}).forEach(function(s){if(Number(s.valor)>200)alertas.push({icon:'&#128257;',tipo:'Assinatura alta',desc:s.nome,det:fmtV(s.valor)+'/m&ecirc;s',cor:'var(--wn)',u:5});});
  alertas.sort(function(a,b){return a.u-b.u;});

  var h='<div class="rel-area"><h3>&#9888; Alertas e Vencimentos</h3>';
  h+='<div class="rel-mini-cards"><div class="rel-mc"><div class="rmc-label">Alertas</div><div class="rmc-val rt-red">'+alertas.length+'</div></div><div class="rel-mc"><div class="rmc-label">Parcelas Ativas</div><div class="rmc-val rt-blue">'+pAtiv+'</div></div><div class="rel-mc"><div class="rmc-label">Parcelas/m&ecirc;s</div><div class="rmc-val rt-red">'+fmtV(vPar)+'</div></div></div>';
  if(!alertas.length){h+='<div class="rel-analysis"><p>&#128994; Nenhum alerta. Tudo sob controle.</p></div>';}
  else{h+='<div style="overflow-x:auto"><table class="rel-table"><thead><tr><th></th><th>Tipo</th><th>Descri&ccedil;&atilde;o</th><th>Detalhe</th></tr></thead><tbody>';alertas.forEach(function(a){h+='<tr><td>'+a.icon+'</td><td style="font-weight:600;color:'+a.cor+'">'+a.tipo+'</td><td>'+a.desc+'</td><td>'+a.det+'</td></tr>';});h+='</tbody></table></div>';}
  h+='<div class="rel-analysis"><h4>Pr&oacute;ximos 3 Meses</h4>';
  [p1,p2,p3].forEach(function(m){var E=allEntries(m);var d=E.filter(function(e){return e.tipo==='despesa';}).reduce(function(s,e){return s+e.valor;},0);var f=faturaCC(m).reduce(function(s,x){return s+x.valor;},0);h+='<p><strong>'+mesNomeFull(m)+':</strong> Desp. <span class="rt-red" style="font-weight:700">'+fmtV(d)+'</span>';if(f>0)h+=' | Fatura <span style="color:#e65100;font-weight:700">'+fmtV(f)+'</span>';h+='</p>';});
  h+='</div></div>';return h;
}

// ================================================================
// 9. EXTRATO DETALHADO (para Excel)
// ================================================================
function buildDetalhado(){
  var de = relState.detalhado_de;
  var ate = relState.detalhado_ate;

  var h = '<div class="rel-area"><h3>&#128203; Extrato Detalhado para Excel</h3>';
  h += '<div class="rel-filters">';
  h += '<div class="form-group"><label>De</label><input type="month" id="relDetDe" class="form-control" value="' + de + '" onchange="window._relDetUpdateRange()"></div>';
  h += '<div class="form-group"><label>At&eacute;</label><input type="month" id="relDetAte" class="form-control" value="' + ate + '" onchange="window._relDetUpdateRange()"></div>';
  h += '<div class="form-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="window._relDetGenerate()">Gerar Pr&eacute;via</button></div>';
  h += '<div class="form-group"><label>&nbsp;</label><button class="btn btn-success" onclick="window._relDetExportXLS()">&#128229; Exportar Excel</button></div>';
  h += '</div>';
  h += '<div id="relDetPreview"></div>';
  h += '</div>';

  // Gerar preview automaticamente
  setTimeout(function(){ window._relDetGenerate(); }, 100);

  return h;
}

window._relDetUpdateRange = function(){
  var de = document.getElementById('relDetDe');
  var ate = document.getElementById('relDetAte');
  if(de) relState.detalhado_de = de.value;
  if(ate) relState.detalhado_ate = ate.value;
};

function getDetailedEntries(de, ate){
  var meses = [];
  var m = de;
  while(m <= ate){ meses.push(m); m = addMes(m, 1); if(meses.length > 36) break; }

  var rows = [];
  meses.forEach(function(mes){
    var E = allEntries(mes);
    E.forEach(function(e){
      rows.push({
        competencia: mes,
        competenciaLabel: mesNome(mes),
        data: e.data,
        dataFmt: fmtD(e.data),
        tipo: e.tipo === 'receita' ? 'Receita' : 'Despesa',
        categoria: e.cat,
        descricao: e.desc,
        valor: e.valor,
        origem: e.origem
      });
    });
  });

  rows.sort(function(a, b){
    if(a.competencia !== b.competencia) return a.competencia.localeCompare(b.competencia);
    if(a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
    return a.data.localeCompare(b.data);
  });

  return rows;
}

window._relDetGenerate = function(){
  window._relDetUpdateRange();
  var de = relState.detalhado_de, ate = relState.detalhado_ate;
  var rows = getDetailedEntries(de, ate);
  var prev = document.getElementById('relDetPreview');
  if(!prev) return;

  var tR = 0, tD = 0;
  rows.forEach(function(r){ if(r.tipo === 'Receita') tR += r.valor; else tD += r.valor; });

  var h = '<div class="rel-mini-cards">';
  h += '<div class="rel-mc"><div class="rmc-label">Registros</div><div class="rmc-val rt-blue">' + rows.length + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Receitas</div><div class="rmc-val rt-green">' + fmtV(tR) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Despesas</div><div class="rmc-val rt-red">' + fmtV(tD) + '</div></div>';
  h += '<div class="rel-mc"><div class="rmc-label">Saldo</div><div class="rmc-val ' + (tR - tD >= 0 ? 'rt-green' : 'rt-red') + '">' + fmtV(tR - tD) + '</div></div>';
  h += '</div>';

  // Preview dos primeiros 50
  var preview = rows.slice(0, 50);
  h += '<p style="font-size:.78em;color:var(--tx3);margin-bottom:10px">Pr&eacute;via: ' + Math.min(50, rows.length) + ' de ' + rows.length + ' registros. Exporte para ver tudo.</p>';
  h += '<div style="overflow-x:auto"><table class="rel-table"><thead><tr><th>Compet&ecirc;ncia</th><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descri&ccedil;&atilde;o</th><th>Valor</th><th>Origem</th></tr></thead><tbody>';
  preview.forEach(function(r){
    var cls = r.tipo === 'Receita' ? 'rt-green' : 'rt-red';
    h += '<tr><td>' + r.competenciaLabel + '</td><td>' + r.dataFmt + '</td><td class="' + cls + '">' + r.tipo + '</td><td>' + r.categoria + '</td><td>' + r.descricao + '</td><td class="' + cls + '" style="font-weight:700">' + fmtV(r.valor) + '</td><td>' + r.origem + '</td></tr>';
  });
  if(rows.length > 50) h += '<tr><td colspan="7" style="text-align:center;color:var(--tx3)">... e mais ' + (rows.length - 50) + ' registros (exporte para ver todos)</td></tr>';
  h += '</tbody></table></div>';

  prev.innerHTML = h;
};

window._relDetExportXLS = function(){
  window._relDetUpdateRange();
  var de = relState.detalhado_de, ate = relState.detalhado_ate;
  var rows = getDetailedEntries(de, ate);

  if(!rows.length){ alert('Nenhum registro no per\u00edodo.'); return; }

  // Montar dados para Excel
  var xlsRows = rows.map(function(r){
    return {
      'Compet\u00eancia': r.competenciaLabel,
      'Data': r.dataFmt,
      'Tipo': r.tipo,
      'Categoria': r.categoria,
      'Descri\u00e7\u00e3o': r.descricao,
      'Valor': r.valor,
      'Origem': r.origem
    };
  });

  // Totais no fim
  var tR = 0, tD = 0;
  rows.forEach(function(r){ if(r.tipo === 'Receita') tR += r.valor; else tD += r.valor; });
  xlsRows.push({});
  xlsRows.push({'Compet\u00eancia': '', 'Data': '', 'Tipo': '', 'Categoria': '', 'Descri\u00e7\u00e3o': 'TOTAL RECEITAS', 'Valor': tR, 'Origem': ''});
  xlsRows.push({'Compet\u00eancia': '', 'Data': '', 'Tipo': '', 'Categoria': '', 'Descri\u00e7\u00e3o': 'TOTAL DESPESAS', 'Valor': tD, 'Origem': ''});
  xlsRows.push({'Compet\u00eancia': '', 'Data': '', 'Tipo': '', 'Categoria': '', 'Descri\u00e7\u00e3o': 'SALDO', 'Valor': tR - tD, 'Origem': ''});

  var ws = XLSX.utils.json_to_sheet(xlsRows);
  ws['!cols'] = [{wch:12},{wch:12},{wch:10},{wch:20},{wch:35},{wch:14},{wch:20}];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extrato Detalhado');

  // Sheet 2: Resumo por categoria
  var catMap = {};
  rows.forEach(function(r){
    var key = r.tipo + '|' + r.categoria + '|' + r.competencia;
    if(!catMap[key]) catMap[key] = {tipo: r.tipo, cat: r.categoria, mes: r.competenciaLabel, valor: 0, qtd: 0};
    catMap[key].valor += r.valor;
    catMap[key].qtd++;
  });
  var catRows = Object.values(catMap).sort(function(a, b){
    if(a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
    if(a.cat !== b.cat) return a.cat.localeCompare(b.cat);
    return a.mes.localeCompare(b.mes);
  }).map(function(c){
    return {'Tipo': c.tipo, 'Categoria': c.cat, 'M\u00eas': c.mes, 'Quantidade': c.qtd, 'Valor Total': c.valor};
  });
  var ws2 = XLSX.utils.json_to_sheet(catRows);
  ws2['!cols'] = [{wch:10},{wch:20},{wch:12},{wch:12},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Por Categoria');

  // Sheet 3: Resumo mensal
  var mesMap = {};
  rows.forEach(function(r){
    if(!mesMap[r.competencia]) mesMap[r.competencia] = {mes: r.competenciaLabel, rec: 0, desp: 0};
    if(r.tipo === 'Receita') mesMap[r.competencia].rec += r.valor;
    else mesMap[r.competencia].desp += r.valor;
  });
  var mesRows = Object.keys(mesMap).sort().map(function(k){
    var m = mesMap[k];
    return {'M\u00eas': m.mes, 'Receitas': m.rec, 'Despesas': m.desp, 'Saldo': m.rec - m.desp};
  });
  var ws3 = XLSX.utils.json_to_sheet(mesRows);
  ws3['!cols'] = [{wch:12},{wch:14},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumo Mensal');

  XLSX.writeFile(wb, 'extrato_detalhado_' + de + '_a_' + ate + '.xlsx', {compression: true});

  if(typeof toast === 'function') toast('Excel exportado com sucesso!', 'success');
};

// ================================================================
// Init
// ================================================================
addMenuLink();
createPage();
console.log('[Financeiro Pro] Relat\u00f3rios v2 — 9 relat\u00f3rios com navega\u00e7\u00e3o mensal + Excel detalhado.');
})();

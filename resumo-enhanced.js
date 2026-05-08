// resumo-enhanced.js v5 — Mobile ultra-compacto
(function(){
'use strict';

var sty = document.createElement('style');
sty.textContent = `
/* ── RESUMO ENHANCED v5 ── */

#resumoCards.cards{display:block!important;grid-template-columns:none!important;gap:0!important;margin-bottom:0!important;}

/* Quick actions */
.res-quick-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.res-quick-btn{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:10px 16px;font-size:.78em;color:var(--tx2);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;font-weight:600;white-space:nowrap;}
.res-quick-btn:hover{border-color:var(--pri);color:var(--pri2);transform:translateY(-1px);}

/* Desktop grids */
.res-grid-main{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;}
.res-grid-sec{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}

/* Card base */
.rsc{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:16px 14px;box-shadow:var(--sh);transition:transform .2s;overflow:hidden;}
.rsc:hover{transform:translateY(-3px);}
.rsc .rsc-lbl{font-size:.66em;color:var(--tx3);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;}
.rsc .rsc-ico{margin-right:4px;}
.rsc .rsc-val{font-size:1.25em;font-weight:700;margin-bottom:6px;word-break:break-all;}
.rsc .rsc-row{display:flex;justify-content:space-between;align-items:center;font-size:.74em;padding:3px 0;border-top:1px solid var(--bg3);gap:4px;}
.rsc .rsc-row-l{color:var(--tx3);flex-shrink:0;}
.rsc .rsc-row-v{font-weight:600;text-align:right;}
.rsc .rsc-bdg{display:inline-block;font-size:.6em;padding:1px 6px;border-radius:8px;font-weight:700;margin-left:3px;}
.rsc .rsc-bdg.g{background:rgba(0,206,201,.15);color:var(--ok);}
.rsc .rsc-bdg.y{background:rgba(253,203,110,.15);color:var(--wn);}
.rsc.c-rec{border-top:3px solid var(--ok);}
.rsc.c-desp{border-top:3px solid var(--dn2);}
.rsc.c-sal{border-top:3px solid var(--inf2);}
.rsc.c-cc{border-top:3px solid #e65100;}
.rsc.c-cont{border-top:3px solid var(--pri);}
.rsc.c-ass{border-top:3px solid var(--wn);}
.rsc.clk{cursor:pointer;}.rsc.clk:hover{opacity:.88;}

/* Pair (desktop hidden) */
.rsc .rsc-pair{display:none;}

/* Modal */
.res-det-list{max-height:400px;overflow-y:auto;}
.res-det-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:.85em;gap:8px;}
.res-det-item:hover{background:var(--bg3);}
.res-det-item:last-child{border:none;}
.res-det-item .rdi-d{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}
.res-det-item .rdi-m{font-size:.7em;color:var(--tx3);flex-shrink:0;}
.res-det-item .rdi-v{font-weight:700;flex-shrink:0;}
.res-det-tot{display:flex;justify-content:space-between;padding:12px;font-weight:700;font-size:.95em;border-top:2px solid var(--bg4);margin-top:4px;}
.res-det-empty{text-align:center;padding:30px;color:var(--tx3);font-size:.88em;}

/* ====== MOBILE ====== */
@media(max-width:768px){
  #resumoCards.cards{display:block!important;grid-template-columns:none!important;margin-top:0!important;}

  .res-quick-row{flex-wrap:nowrap!important;overflow-x:auto;padding-bottom:2px;margin-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none;gap:6px;}
  .res-quick-row::-webkit-scrollbar{display:none;}
  .res-quick-btn{flex-shrink:0;padding:5px 8px;font-size:.65em;border-radius:6px;}

  .res-grid-main,.res-grid-sec{grid-template-columns:1fr 1fr!important;gap:8px!important;margin-bottom:8px!important;}

  /* Card ultra-compacto */
  .rsc{padding:8px 8px 6px;border-radius:8px;border-top-width:2px!important;}
  .rsc .rsc-lbl{font-size:.55em;margin-bottom:1px;letter-spacing:.5px;}
  .rsc .rsc-val{font-size:.82em;margin-bottom:2px;}

  /* Desktop rows escondidos, pair visível */
  .rsc .rsc-row.desk{display:none!important;}
  .rsc .rsc-pair{
    display:grid!important;grid-template-columns:1fr 1fr;
    border-top:1px solid var(--bg3);margin-top:2px;
  }
  .rsc .rsc-pair .rsc-h{padding:3px 2px;display:flex;flex-direction:column;gap:0;}
  .rsc .rsc-pair .rsc-h:first-child{border-right:1px solid var(--bg3);padding-right:4px;}
  .rsc .rsc-pair .rsc-h:last-child{padding-left:4px;}
  .rsc .rsc-pair .rsc-hl{font-size:.5em;color:var(--tx3);}
  .rsc .rsc-pair .rsc-hv{font-size:.65em;font-weight:600;}
  .rsc .rsc-bdg{font-size:.5em;padding:0 3px;margin-left:2px;}

  /* Sub-rows simples compactos */
  .rsc .rsc-row{font-size:.6em;padding:2px 0;}

  /* Saldo card ocupa 2 colunas */
  .rsc.c-sal{grid-column:1/-1;}

  /* Gráficos */
  .chart-row{gap:10px!important;margin-bottom:16px!important;}
  .chart-box{padding:10px!important;}
  .chart-box h3{font-size:.75em!important;margin-bottom:8px!important;}
  .bar-chart{height:120px!important;}
  .top-cat-item{margin-bottom:8px!important;}
  .top-cat-hdr{font-size:.72em!important;}
  .top-cat-bar{height:6px!important;}
}

@media(max-width:380px){
  .rsc .rsc-val{font-size:.75em;}
  .rsc .rsc-pair .rsc-hv{font-size:.6em;}
  .rsc .rsc-pair .rsc-hl{font-size:.48em;}
  .res-quick-btn{font-size:.6em;padding:4px 6px;}
  .bar-chart{height:100px!important;}
}
`;
document.head.appendChild(sty);

// Modal
if(!document.getElementById('modalResDet')){
  var m=document.createElement('div');m.className='modal';m.id='modalResDet';
  m.innerHTML='<div class="modal-content" style="max-width:580px"><div class="modal-header"><h3 id="resDetTitle">Detalhes</h3><span class="modal-close" onclick="closeM(\'modalResDet\')">&times;</span></div><div class="modal-body" id="resDetBody"></div></div>';
  document.body.appendChild(m);
}

// Helpers
function ck(mes){return(S.checkPagamentos&&S.checkPagamentos[mes])?S.checkPagamentos[mes]:{};}
function bk(e){return(e.origem||'')+'|'+(e.desc||'')+'|'+(e.valor||0).toFixed(2);}
function showDet(t,items,cc){
  document.getElementById('resDetTitle').textContent=t;
  var h='';
  if(!items.length){h='<div class="res-det-empty">Nenhum item.</div>';}
  else{
    h='<div class="res-det-list">';var tot=0;
    items.forEach(function(e){tot+=e.valor;var c=cc==='g'?'color:var(--ok)':(cc==='r'?'color:var(--dn2)':'color:var(--tx)');
    h+='<div class="res-det-item"><span class="rdi-d">'+(e.desc||'-')+'</span><span class="rdi-m">'+(e.origem||'')+(e.cat?' \u00b7 '+e.cat:'')+'</span><span class="rdi-v" style="'+c+'">'+fmtV(e.valor)+'</span></div>';});
    h+='</div>';var tc=cc==='g'?'var(--ok)':(cc==='r'?'var(--dn2)':'var(--tx)');
    h+='<div class="res-det-tot"><span>Total</span><span style="color:'+tc+'">'+fmtV(tot)+'</span></div>';
  }
  document.getElementById('resDetBody').innerHTML=h;openM('modalResDet');
}

// Build pair HTML (desktop=2 rows, mobile=side-by-side)
function P(l1,v1,s1,b1,l2,v2,s2,b2){
  var bg=function(b){return b?' <span class="rsc-bdg '+b.c+'">'+b.t+'</span>':'';};
  // Desktop rows
  var d='<div class="rsc-row desk"><span class="rsc-row-l">'+l1+'</span><span class="rsc-row-v" style="'+s1+'">'+v1+bg(b1)+'</span></div>';
  d+='<div class="rsc-row desk"><span class="rsc-row-l">'+l2+'</span><span class="rsc-row-v" style="'+s2+'">'+v2+bg(b2)+'</span></div>';
  // Mobile pair
  d+='<div class="rsc-pair"><div class="rsc-h"><span class="rsc-hl">'+l1+'</span><span class="rsc-hv" style="'+s1+'">'+v1+bg(b1)+'</span></div><div class="rsc-h"><span class="rsc-hl">'+l2+'</span><span class="rsc-hv" style="'+s2+'">'+v2+bg(b2)+'</span></div></div>';
  return d;
}
function R(l,v,s){return '<div class="rsc-row"><span class="rsc-row-l">'+l+'</span><span class="rsc-row-v" style="'+s+'">'+v+'</span></div>';}

// Formato compacto (sem centavos) para mobile
function fmtC(v){return 'R$ '+Math.round(v||0).toLocaleString('pt-BR');}

// renderResumo
window.renderResumo=function(){
  g('mesLabel').textContent=mesNomeFull(curMes);
  var E=allEntries(curMes),chk=ck(curMes);
  var rec=0,desp=0,rcf=0,rpn=0,dcf=0,dpn=0,rcn=0,rpnn=0,dcn=0,dpnn=0;
  var rI=[],dI=[],rcI=[],rpI=[],dcI=[],dpI=[];
  E.forEach(function(e){
    var p=!!chk[bk(e)];
    if(e.tipo==='receita'){rec+=e.valor;rI.push(e);if(p){rcf+=e.valor;rcn++;rcI.push(e);}else{rpn+=e.valor;rpnn++;rpI.push(e);}}
    else{desp+=e.valor;dI.push(e);if(p){dcf+=e.valor;dcn++;dcI.push(e);}else{dpn+=e.valor;dpnn++;dpI.push(e);}}
  });
  var sal=rec-desp,salC=rcf-dcf;

  var fI=typeof faturaCC==='function'?faturaCC(curMes):[],fT=fI.reduce(function(s,i){return s+(Number(i.valor)||0);},0);
  var fPC={};fI.forEach(function(i){var n=i.cartao||'Sem cart\u00e3o';fPC[n]=(fPC[n]||0)+(Number(i.valor)||0);});

  var cA=S.contratos.filter(function(c){return !c.encerradoEm;}).length,cR=0,cD=0;
  E.forEach(function(e){if(e.origem==='Contrato'){if(e.tipo==='receita')cR+=e.valor;else cD+=e.valor;}});

  var aA=S.assinaturas.filter(function(s){return !s.encerradaEm;}).length,aT=0;
  E.forEach(function(e){if(e.origem&&e.origem.indexOf('Assinatura')===0)aT+=e.valor;});

  var h='';

  // Quick
  h+='<div class="res-quick-row">';
  h+='<div class="res-quick-btn" onclick="nav(\'checkpag\')">&#9989; Check</div>';
  h+='<div class="res-quick-btn" onclick="nav(\'extratoCat\')">&#128202; Categorias</div>';
  h+='<div class="res-quick-btn" onclick="nav(\'lancs\')">&#128221; Lan\u00e7ar</div>';
  h+='</div>';

  // Grid 1: Receitas, Despesas (2 cols mobile), Saldo (full width mobile)
  h+='<div class="res-grid-main">';

  h+='<div class="rsc c-rec clk" onclick="window._resRec()">';
  h+='<div class="rsc-lbl"><span class="rsc-ico">&#128200;</span>Receitas</div>';
  h+='<div class="rsc-val" style="color:var(--ok)">'+fmtV(rec)+'</div>';
  h+=P('Recebido',fmtC(rcf),'color:var(--ok)',{c:'g',t:rcn},'Pendente',fmtC(rpn),'color:var(--wn)',{c:'y',t:rpnn});
  h+='</div>';

  h+='<div class="rsc c-desp clk" onclick="window._resDesp()">';
  h+='<div class="rsc-lbl"><span class="rsc-ico">&#128201;</span>Despesas</div>';
  h+='<div class="rsc-val" style="color:var(--dn2)">'+fmtV(desp)+'</div>';
  h+=P('Pagas',fmtC(dcf),'color:var(--ok)',{c:'g',t:dcn},'Pendentes',fmtC(dpn),'color:var(--wn)',{c:'y',t:dpnn});
  h+='</div>';

  h+='<div class="rsc c-sal">';
  h+='<div class="rsc-lbl"><span class="rsc-ico">&#128176;</span>Saldo</div>';
  h+='<div class="rsc-val" style="color:'+(sal>=0?'var(--inf2)':'var(--dn2)')+'">'+fmtV(sal)+'</div>';
  h+=P('Confirmado',fmtC(salC),'color:'+(salC>=0?'var(--ok)':'var(--dn2)'),null,'Projetado',fmtC(sal),'color:'+(sal>=0?'var(--inf2)':'var(--dn2)'),null);
  h+='</div>';

  h+='</div>';

  // Grid 2: Cartão, Contratos, Assinaturas
  h+='<div class="res-grid-sec">';

  h+='<div class="rsc c-cc clk" onclick="window._resFat()">';
  h+='<div class="rsc-lbl"><span class="rsc-ico">&#128179;</span>Fatura</div>';
  h+='<div class="rsc-val" style="color:#e65100">'+fmtV(fT)+'</div>';
  var cn=Object.keys(fPC);
  if(cn.length){cn.forEach(function(n){h+=R(n,fmtC(fPC[n]),'color:#e65100');});}
  else{h+=R('Nenhuma','-','color:var(--tx3)');}
  h+='</div>';

  h+='<div class="rsc c-cont clk" onclick="nav(\'contratos\')">';
  h+='<div class="rsc-lbl"><span class="rsc-ico">&#128196;</span>Contratos</div>';
  h+='<div class="rsc-val" style="color:var(--pri2)">'+cA+'</div>';
  if(cR>0)h+=R('Rec',fmtC(cR),'color:var(--ok)');
  if(cD>0)h+=R('Desp',fmtC(cD),'color:var(--dn2)');
  if(!cR&&!cD)h+=R('M\u00eas','R$ 0','color:var(--tx3)');
  h+='</div>';

  h+='<div class="rsc c-ass clk" onclick="nav(\'assinaturas\')">';
  h+='<div class="rsc-lbl"><span class="rsc-ico">&#128257;</span>Assinaturas</div>';
  h+='<div class="rsc-val" style="color:var(--wn)">'+aA+'</div>';
  h+=R('M\u00eas',fmtC(aT),'color:var(--wn)');
  h+='</div>';

  h+='</div>';

  g('resumoCards').innerHTML=h;

  // Gráficos
  var ms=[];for(var i=-5;i<=0;i++)ms.push(addMes(curMes,i));
  var dt=ms.map(function(m){var e=allEntries(m),r=0,d=0;e.forEach(function(x){if(x.tipo==='receita')r+=x.valor;else d+=x.valor;});return{m:m,r:r,d:d};});
  var gM=Math.max.apply(null,dt.map(function(x){return Math.max(x.r,x.d);}).concat([1]));
  g('barChart').innerHTML=dt.map(function(x){
    return '<div class="bar-group"><div class="bar-top-val g">'+fmtI(x.r)+'</div><div class="bar-top-val r">'+fmtI(x.d)+'</div><div class="bar-bars"><div class="bar rec" style="height:'+Math.max((x.r/gM)*160,4)+'px"></div><div class="bar desp" style="height:'+Math.max((x.d/gM)*160,4)+'px"></div></div><div class="bar-bottom"><div class="bar-label">'+mesNome(x.m)+'</div></div></div>';
  }).join('');

  var cM={};E.filter(function(e){return e.tipo==='despesa';}).forEach(function(e){cM[e.cat]=(cM[e.cat]||0)+e.valor;});
  var tp=Object.entries(cM).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
  var mC=tp.length?tp[0][1]:1;
  g('topCats').innerHTML=tp.length?tp.map(function(t){
    return '<div class="top-cat-item"><div class="top-cat-hdr"><span>'+t[0]+'</span><span style="font-weight:700">'+fmtV(t[1])+'</span></div><div class="top-cat-bar"><div class="top-cat-fill" style="width:'+(t[1]/mC)*100+'%"></div></div></div>';
  }).join(''):'<p style="color:var(--tx3)">Sem despesas</p>';

  window._resData={rI:rI,dI:dI,fI:fI,fT:fT};
};

// Modais
window._resRec=function(){showDet('Receitas \u2014 '+mesNomeFull(curMes),(window._resData||{}).rI||[],'g');};
window._resDesp=function(){showDet('Despesas \u2014 '+mesNomeFull(curMes),(window._resData||{}).dI||[],'r');};
window._resFat=function(){
  var d=window._resData||{},fi=d.fI||[];
  document.getElementById('resDetTitle').textContent='Fatura Cart\u00e3o \u2014 '+mesNomeFull(curMes);
  var h='';
  if(!fi.length){h='<div class="res-det-empty">Nenhuma compra.</div>';}
  else{
    var pc={};fi.forEach(function(i){var n=i.cartao||'Sem cart\u00e3o';if(!pc[n])pc[n]=[];pc[n].push(i);});
    h='<div class="res-det-list">';
    Object.keys(pc).forEach(function(c){var it=pc[c],st=it.reduce(function(s,i){return s+(Number(i.valor)||0);},0);
    h+='<div style="padding:8px 10px;background:var(--bg3);font-weight:700;font-size:.8em;border-bottom:1px solid var(--bg4);">&#128179; '+c+' <span style="float:right;color:#e65100">'+fmtV(st)+'</span></div>';
    it.forEach(function(x){h+='<div class="res-det-item"><span class="rdi-d">'+(x.desc||'-')+'</span><span class="rdi-m">'+(x.tipo||'')+(x.cat?' \u00b7 '+x.cat:'')+'</span><span class="rdi-v" style="color:#e65100">'+fmtV(x.valor)+'</span></div>';});});
    h+='</div><div class="res-det-tot"><span>Total</span><span style="color:#e65100">'+fmtV(d.fT||0)+'</span></div>';
  }
  document.getElementById('resDetBody').innerHTML=h;openM('modalResDet');
};

console.log('[Financeiro Pro] Resumo Enhanced v5 \u2014 Mobile ultra-compacto, 2 cols, gr\u00e1ficos menores.');
})();

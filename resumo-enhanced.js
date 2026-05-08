// resumo-enhanced.js v4 — Layout mobile corrigido de verdade
// Resolve conflitos com .cards do index.html e design-packs.js
(function(){
'use strict';

// ================================================================
// CSS — usa !important onde necessário para vencer index.html
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── RESUMO ENHANCED v4 ── */

/* Esconder o container .cards padrão quando é o resumo e usar nosso layout */
#resumoCards.cards {
  display: block !important;
  grid-template-columns: none !important;
  gap: 0 !important;
  margin-bottom: 0 !important;
}

/* === QUICK ACTIONS === */
.res-quick-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.res-quick-btn{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:10px 16px;font-size:.78em;color:var(--tx2);cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;font-weight:600;white-space:nowrap;}
.res-quick-btn:hover{border-color:var(--pri);color:var(--pri2);transform:translateY(-1px);}

/* === CARDS GRID DESKTOP === */
.res-grid-main{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;}
.res-grid-sec{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}

/* === CARD BASE === */
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

/* Bordas de cor */
.rsc.c-rec{border-top:3px solid var(--ok);}
.rsc.c-desp{border-top:3px solid var(--dn2);}
.rsc.c-sal{border-top:3px solid var(--inf2);}
.rsc.c-cc{border-top:3px solid #e65100;}
.rsc.c-cont{border-top:3px solid var(--pri);}
.rsc.c-ass{border-top:3px solid var(--wn);}

/* Clicável */
.rsc.clk{cursor:pointer;}.rsc.clk:hover{opacity:.88;}

/* === MODAL === */
.res-det-list{max-height:400px;overflow-y:auto;}
.res-det-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:.85em;gap:8px;}
.res-det-item:hover{background:var(--bg3);}
.res-det-item:last-child{border:none;}
.res-det-item .rdi-d{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;}
.res-det-item .rdi-m{font-size:.7em;color:var(--tx3);flex-shrink:0;}
.res-det-item .rdi-v{font-weight:700;flex-shrink:0;}
.res-det-tot{display:flex;justify-content:space-between;padding:12px;font-weight:700;font-size:.95em;border-top:2px solid var(--bg4);margin-top:4px;}
.res-det-empty{text-align:center;padding:30px;color:var(--tx3);font-size:.88em;}

/* ============================================================ */
/* ========  MOBILE  ========================================== */
/* ============================================================ */
@media(max-width:768px){
  /* FORÇAR override do .cards do index.html */
  #resumoCards.cards {
    display: block !important;
    grid-template-columns: none !important;
    margin-top: 0 !important;
  }

  /* Quick actions: scroll horizontal */
  .res-quick-row{
    flex-wrap:nowrap !important;
    overflow-x:auto;
    padding-bottom:4px;
    margin-bottom:12px;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
  }
  .res-quick-row::-webkit-scrollbar{display:none;}
  .res-quick-btn{flex-shrink:0;padding:7px 10px;font-size:.7em;border-radius:8px;}

  /* Grids: coluna ÚNICA */
  .res-grid-main,
  .res-grid-sec{
    grid-template-columns:1fr !important;
    gap:10px !important;
    margin-bottom:12px !important;
  }

  /* Card compacto */
  .rsc{padding:12px 10px;border-radius:10px;}
  .rsc .rsc-lbl{font-size:.62em;margin-bottom:3px;}
  .rsc .rsc-val{font-size:1.05em;margin-bottom:4px;}

  /* Sub-valores: 2 cols lado a lado DENTRO do card */
  .rsc .rsc-pair{
    display:grid !important;
    grid-template-columns:1fr 1fr;
    border-top:1px solid var(--bg3);
  }
  .rsc .rsc-pair .rsc-half{
    padding:5px 2px;
    display:flex;
    flex-direction:column;
    gap:1px;
  }
  .rsc .rsc-pair .rsc-half:first-child{
    border-right:1px solid var(--bg3);
    padding-right:6px;
  }
  .rsc .rsc-pair .rsc-half:last-child{
    padding-left:6px;
  }
  .rsc .rsc-pair .rsc-half-l{font-size:.6em;color:var(--tx3);}
  .rsc .rsc-pair .rsc-half-v{font-size:.78em;font-weight:600;}
  .rsc .rsc-bdg{font-size:.55em;padding:1px 4px;}

  /* Sub simples */
  .rsc .rsc-row{font-size:.7em;padding:4px 0;}
}

@media(max-width:380px){
  .rsc .rsc-val{font-size:.95em;}
  .rsc .rsc-pair .rsc-half-v{font-size:.72em;}
  .res-quick-btn{font-size:.65em;padding:6px 8px;}
}
`;
document.head.appendChild(sty);

// ================================================================
// MODAL
// ================================================================
if(!document.getElementById('modalResDet')){
  var m = document.createElement('div');
  m.className = 'modal'; m.id = 'modalResDet';
  m.innerHTML = '<div class="modal-content" style="max-width:580px"><div class="modal-header">' +
    '<h3 id="resDetTitle">Detalhes</h3>' +
    '<span class="modal-close" onclick="closeM(\'modalResDet\')">&times;</span>' +
    '</div><div class="modal-body" id="resDetBody"></div></div>';
  document.body.appendChild(m);
}

// ================================================================
// HELPERS
// ================================================================
function ck(mes){ return (S.checkPagamentos && S.checkPagamentos[mes]) ? S.checkPagamentos[mes] : {}; }
function bk(e){ return (e.origem||'')+'|'+(e.desc||'')+'|'+(e.valor||0).toFixed(2); }

function showDet(title, items, cc){
  document.getElementById('resDetTitle').textContent = title;
  var h = '';
  if(!items.length){ h = '<div class="res-det-empty">Nenhum item.</div>'; }
  else {
    h = '<div class="res-det-list">';
    var tot = 0;
    items.forEach(function(e){
      tot += e.valor;
      var c = cc==='g' ? 'color:var(--ok)' : (cc==='r' ? 'color:var(--dn2)' : 'color:var(--tx)');
      h += '<div class="res-det-item"><span class="rdi-d">'+(e.desc||'-')+'</span><span class="rdi-m">'+(e.origem||'')+(e.cat?' \u00b7 '+e.cat:'')+'</span><span class="rdi-v" style="'+c+'">'+fmtV(e.valor)+'</span></div>';
    });
    h += '</div>';
    var tc = cc==='g' ? 'var(--ok)' : (cc==='r' ? 'var(--dn2)' : 'var(--tx)');
    h += '<div class="res-det-tot"><span>Total</span><span style="color:'+tc+'">'+fmtV(tot)+'</span></div>';
  }
  document.getElementById('resDetBody').innerHTML = h;
  openM('modalResDet');
}

// Build paired sub-values (mobile = side by side, desktop = stacked rows)
function pair(l1,v1,s1,b1, l2,v2,s2,b2){
  // Desktop: 2 rows
  var desk = '';
  desk += '<div class="rsc-row"><span class="rsc-row-l">'+l1+'</span><span class="rsc-row-v" style="'+s1+'">'+v1+(b1?' <span class="rsc-bdg '+b1.c+'">'+b1.t+'</span>':'')+'</span></div>';
  desk += '<div class="rsc-row"><span class="rsc-row-l">'+l2+'</span><span class="rsc-row-v" style="'+s2+'">'+v2+(b2?' <span class="rsc-bdg '+b2.c+'">'+b2.t+'</span>':'')+'</span></div>';
  // Mobile: paired grid (shown via CSS, desktop hides it)
  var mob = '<div class="rsc-pair">';
  mob += '<div class="rsc-half"><span class="rsc-half-l">'+l1+'</span><span class="rsc-half-v" style="'+s1+'">'+v1+(b1?' <span class="rsc-bdg '+b1.c+'">'+b1.t+'</span>':'')+'</span></div>';
  mob += '<div class="rsc-half"><span class="rsc-half-l">'+l2+'</span><span class="rsc-half-v" style="'+s2+'">'+v2+(b2?' <span class="rsc-bdg '+b2.c+'">'+b2.t+'</span>':'')+'</span></div>';
  mob += '</div>';
  // Wrap: desktop version hidden on mobile, mobile version hidden on desktop
  return '<div class="rsc-desk-only" style="display:block">'+desk+'</div><div class="rsc-mob-only" style="display:none">'+mob+'</div>';
}

// Single sub-row
function row(l,v,s){ return '<div class="rsc-row"><span class="rsc-row-l">'+l+'</span><span class="rsc-row-v" style="'+s+'">'+v+'</span></div>'; }

// ================================================================
// CSS for show/hide desktop/mobile blocks
// ================================================================
var sty2 = document.createElement('style');
sty2.textContent = `
@media(max-width:768px){
  .rsc-desk-only{display:none !important;}
  .rsc-mob-only{display:block !important;}
}
@media(min-width:769px){
  .rsc-desk-only{display:block !important;}
  .rsc-mob-only{display:none !important;}
}`;
document.head.appendChild(sty2);

// ================================================================
// OVERRIDE renderResumo
// ================================================================
window.renderResumo = function(){
  g('mesLabel').textContent = mesNomeFull(curMes);
  var E = allEntries(curMes);
  var chk = ck(curMes);

  var rec=0,desp=0,rcf=0,rpn=0,dcf=0,dpn=0,rcn=0,rpnn=0,dcn=0,dpnn=0;
  var rI=[],dI=[],rcI=[],rpI=[],dcI=[],dpI=[];

  E.forEach(function(e){
    var p = !!chk[bk(e)];
    if(e.tipo==='receita'){
      rec+=e.valor; rI.push(e);
      if(p){rcf+=e.valor;rcn++;rcI.push(e);} else {rpn+=e.valor;rpnn++;rpI.push(e);}
    } else {
      desp+=e.valor; dI.push(e);
      if(p){dcf+=e.valor;dcn++;dcI.push(e);} else {dpn+=e.valor;dpnn++;dpI.push(e);}
    }
  });
  var sal = rec - desp, salC = rcf - dcf;

  // Fatura
  var fI = typeof faturaCC==='function' ? faturaCC(curMes) : [];
  var fT = fI.reduce(function(s,i){return s+(Number(i.valor)||0);},0);
  var fPC = {};
  fI.forEach(function(i){ var n=i.cartao||'Sem cart\u00e3o'; fPC[n]=(fPC[n]||0)+(Number(i.valor)||0); });

  // Contratos
  var cA = S.contratos.filter(function(c){return !c.encerradoEm;}).length;
  var cR=0, cD=0;
  E.forEach(function(e){ if(e.origem==='Contrato'){ if(e.tipo==='receita') cR+=e.valor; else cD+=e.valor; }});

  // Assinaturas
  var aA = S.assinaturas.filter(function(s){return !s.encerradaEm;}).length;
  var aT = 0;
  E.forEach(function(e){ if(e.origem && e.origem.indexOf('Assinatura')===0) aT+=e.valor; });

  // ===== HTML =====
  var h = '';

  // Quick actions
  h += '<div class="res-quick-row">';
  h += '<div class="res-quick-btn" onclick="nav(\'checkpag\')">&#9989; Check Pagamentos</div>';
  h += '<div class="res-quick-btn" onclick="nav(\'extratoCat\')">&#128202; Extrato Categorizado</div>';
  h += '<div class="res-quick-btn" onclick="nav(\'lancs\')">&#128221; Novo Lan\u00e7amento</div>';
  h += '</div>';

  // ── LINHA 1 ──
  h += '<div class="res-grid-main">';

  // Receitas
  h += '<div class="rsc c-rec clk" onclick="window._resRec()">';
  h += '<div class="rsc-lbl"><span class="rsc-ico">&#128200;</span>Receitas</div>';
  h += '<div class="rsc-val" style="color:var(--ok)">'+fmtV(rec)+'</div>';
  h += pair('Recebido',fmtV(rcf),'color:var(--ok)',{c:'g',t:rcn}, 'Pendente',fmtV(rpn),'color:var(--wn)',{c:'y',t:rpnn});
  h += '</div>';

  // Despesas
  h += '<div class="rsc c-desp clk" onclick="window._resDesp()">';
  h += '<div class="rsc-lbl"><span class="rsc-ico">&#128201;</span>Despesas</div>';
  h += '<div class="rsc-val" style="color:var(--dn2)">'+fmtV(desp)+'</div>';
  h += pair('Pagas',fmtV(dcf),'color:var(--ok)',{c:'g',t:dcn}, 'Pendentes',fmtV(dpn),'color:var(--wn)',{c:'y',t:dpnn});
  h += '</div>';

  // Saldo
  h += '<div class="rsc c-sal">';
  h += '<div class="rsc-lbl"><span class="rsc-ico">&#128176;</span>Saldo</div>';
  h += '<div class="rsc-val" style="color:'+(sal>=0?'var(--inf2)':'var(--dn2)')+'">'+fmtV(sal)+'</div>';
  h += pair('Confirmado',fmtV(salC),'color:'+(salC>=0?'var(--ok)':'var(--dn2)'),null, 'Projetado',fmtV(sal),'color:'+(sal>=0?'var(--inf2)':'var(--dn2)'),null);
  h += '</div>';

  h += '</div>';

  // ── LINHA 2 ──
  h += '<div class="res-grid-sec">';

  // Fatura
  h += '<div class="rsc c-cc clk" onclick="window._resFat()">';
  h += '<div class="rsc-lbl"><span class="rsc-ico">&#128179;</span>Fatura Cart\u00e3o</div>';
  h += '<div class="rsc-val" style="color:#e65100">'+fmtV(fT)+'</div>';
  var cn = Object.keys(fPC);
  if(cn.length){ cn.forEach(function(n){ h += row(n, fmtV(fPC[n]), 'color:#e65100'); }); }
  else { h += row('Nenhuma compra', '-', 'color:var(--tx3)'); }
  h += '</div>';

  // Contratos
  h += '<div class="rsc c-cont clk" onclick="nav(\'contratos\')">';
  h += '<div class="rsc-lbl"><span class="rsc-ico">&#128196;</span>Contratos</div>';
  h += '<div class="rsc-val" style="color:var(--pri2)">'+cA+' <small style="font-size:.5em;color:var(--tx3)">ativos</small></div>';
  if(cR>0) h += row('Receita', fmtV(cR), 'color:var(--ok)');
  if(cD>0) h += row('Despesa', fmtV(cD), 'color:var(--dn2)');
  if(!cR && !cD) h += row('Total no m\u00eas', 'R$ 0,00', 'color:var(--tx3)');
  h += '</div>';

  // Assinaturas
  h += '<div class="rsc c-ass clk" onclick="nav(\'assinaturas\')">';
  h += '<div class="rsc-lbl"><span class="rsc-ico">&#128257;</span>Assinaturas</div>';
  h += '<div class="rsc-val" style="color:var(--wn)">'+aA+' <small style="font-size:.5em;color:var(--tx3)">ativas</small></div>';
  h += row('Total no m\u00eas', fmtV(aT), 'color:var(--wn)');
  h += '</div>';

  h += '</div>';

  g('resumoCards').innerHTML = h;

  // ===== GRÁFICOS =====
  var ms=[];for(var i=-5;i<=0;i++) ms.push(addMes(curMes,i));
  var dt=ms.map(function(m){var e=allEntries(m),r=0,d=0;e.forEach(function(x){if(x.tipo==='receita')r+=x.valor;else d+=x.valor;});return{m:m,r:r,d:d};});
  var gM=Math.max.apply(null,dt.map(function(x){return Math.max(x.r,x.d);}).concat([1]));
  g('barChart').innerHTML=dt.map(function(x){
    return '<div class="bar-group"><div class="bar-top-val g">'+fmtI(x.r)+'</div><div class="bar-top-val r">'+fmtI(x.d)+'</div><div class="bar-bars"><div class="bar rec" style="height:'+Math.max((x.r/gM)*160,4)+'px"></div><div class="bar desp" style="height:'+Math.max((x.d/gM)*160,4)+'px"></div></div><div class="bar-bottom"><div class="bar-label">'+mesNome(x.m)+'</div></div></div>';
  }).join('');

  var cM={};E.filter(function(e){return e.tipo==='despesa';}).forEach(function(e){cM[e.cat]=(cM[e.cat]||0)+e.valor;});
  var tp=Object.entries(cM).sort(function(a,b){return b[1]-a[1];}).slice(0,6);
  var mC=tp.length?tp[0][1]:1;
  g('topCats').innerHTML=tp.length?tp.map(function(t){
    return '<div class="top-cat-item"><div class="top-cat-hdr"><span>'+t[0]+'</span><span style="font-weight:700">'+fmtV(t[1])+'</span></div><div class="top-cat-bar"><div class="top-cat-fill" style="width:'+(t[1]/mC)*100+'%"></div></div></div>';
  }).join(''):'<p style="color:var(--tx3)">Sem despesas</p>';

  window._resData={rI:rI,dI:dI,rcI:rcI,rpI:rpI,dcI:dcI,dpI:dpI,fI:fI,fT:fT};
};

// ================================================================
// MODAIS
// ================================================================
window._resRec=function(){showDet('Receitas \u2014 '+mesNomeFull(curMes),(window._resData||{}).rI||[],'g');};
window._resDesp=function(){showDet('Despesas \u2014 '+mesNomeFull(curMes),(window._resData||{}).dI||[],'r');};
window._resFat=function(){
  var d=window._resData||{},fi=d.fI||[];
  document.getElementById('resDetTitle').textContent='Fatura Cart\u00e3o \u2014 '+mesNomeFull(curMes);
  var h='';
  if(!fi.length){h='<div class="res-det-empty">Nenhuma compra no cart\u00e3o.</div>';}
  else {
    var pc={};fi.forEach(function(i){var n=i.cartao||'Sem cart\u00e3o';if(!pc[n])pc[n]=[];pc[n].push(i);});
    h='<div class="res-det-list">';
    Object.keys(pc).forEach(function(c){
      var it=pc[c],st=it.reduce(function(s,i){return s+(Number(i.valor)||0);},0);
      h+='<div style="padding:10px 12px;background:var(--bg3);font-weight:700;font-size:.85em;border-bottom:1px solid var(--bg4);">&#128179; '+c+' <span style="float:right;color:#e65100">'+fmtV(st)+'</span></div>';
      it.forEach(function(x){h+='<div class="res-det-item"><span class="rdi-d">'+(x.desc||'-')+'</span><span class="rdi-m">'+(x.tipo||'')+(x.cat?' \u00b7 '+x.cat:'')+'</span><span class="rdi-v" style="color:#e65100">'+fmtV(x.valor)+'</span></div>';});
    });
    h+='</div><div class="res-det-tot"><span>Total Fatura</span><span style="color:#e65100">'+fmtV(d.fT||0)+'</span></div>';
  }
  document.getElementById('resDetBody').innerHTML=h;
  openM('modalResDet');
};

console.log('[Financeiro Pro] Resumo Enhanced v4 \u2014 Mobile fix: override .cards, classes \u00fanicas, display:block/none.');
})();

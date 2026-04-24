// mobile-cards.js - Cards mobile + fix gráfico
(function(){
  // Detectar mobile
  function isMob(){return window.innerWidth<=768;}

  // Injetar CSS mobile cards
  var sty=document.createElement('style');
  sty.textContent=`
    .mob-cards{display:none;}
    @media(max-width:768px){
      /* Esconder tabelas, mostrar cards */
      #pg-lancs .table-wrap{display:none!important;}
      #pg-extrato .table-wrap{display:none!important;}
      #pg-compras .table-wrap{display:none!important;}
      .mob-cards{display:block!important;}

      /* Card style */
      .mc{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:14px;margin-bottom:10px;box-shadow:var(--sh);}
      .mc-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
      .mc-date{font-size:.75em;color:var(--tx3);}
      .mc-val{font-size:1.05em;font-weight:700;}
      .mc-desc{font-size:.88em;font-weight:600;margin-bottom:4px;color:var(--tx);}
      .mc-meta{display:flex;justify-content:space-between;align-items:center;font-size:.75em;color:var(--tx3);flex-wrap:wrap;gap:4px;}
      .mc-acts{display:flex;gap:6px;}
      .mc-obs{font-size:.72em;color:var(--tx3);font-style:italic;margin-top:4px;}
      .mc-left{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}

      /* Fix gráfico - mais espaço */
      .chart-box{padding:14px;overflow:visible!important;}
      .bar-chart{height:200px!important;gap:2px!important;overflow:visible!important;}
      .bar-group{min-width:0;overflow:visible;}
      .bar-top-val{font-size:.45em!important;min-height:auto!important;margin-bottom:1px!important;line-height:1.2!important;}
      .bar{max-width:18px!important;}
      .bar-bars{gap:2px!important;}
      .bar-label{font-size:.5em!important;}
      .bar-bottom{margin-top:3px!important;}
    }
  `;
  document.head.appendChild(sty);

  // Salvar referências originais
  var _renderLancs=window.renderLancs;
  var _renderExtrato=window.renderExtrato;
  var _renderCompras=window.renderCompras;

  // Override renderLancs
  window.renderLancs=function(){
    _renderLancs();
    var el=document.getElementById('lancMobCards');
    if(!el){el=document.createElement('div');el.id='lancMobCards';el.className='mob-cards';document.getElementById('pg-lancs').appendChild(el);}
    var E=allEntries(lancMes);E.sort(function(a,b){return b.data.localeCompare(a.data);});
    if(!E.length){el.innerHTML='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum lan\u00e7amento</p>';return;}
    el.innerHTML=E.map(function(e){
      var cor=e.tipo==='receita'?'var(--ok)':'var(--dn2)';
      var sinal=e.tipo==='receita'?'+ ':'- ';
      var bc=e.tipo==='receita'?'badge-success':'badge-danger';
      var acts=e.isManual?'<span class="mc-acts"><button class="btn btn-sm btn-outline" onclick="editLanc(\''+e.id+'\')">&#9998;</button><button class="btn btn-sm btn-danger" onclick="delLanc(\''+e.id+'\')">&#128465;</button></span>':'';
      return '<div class="mc"><div class="mc-top"><span class="mc-date">'+fmtD(e.data)+'</span><span class="mc-val" style="color:'+cor+'">'+sinal+fmtV(e.valor)+'</span></div><div class="mc-desc">'+e.desc+'</div><div class="mc-meta"><span class="mc-left"><span class="badge '+bc+'">'+e.tipo+'</span> '+e.cat+' &bull; '+e.origem+'</span>'+acts+'</div>'+(e.obs?'<div class="mc-obs">'+e.obs+'</div>':'')+'</div>';
    }).join('');
  };

  // Override renderExtrato
  window.renderExtrato=function(){
    _renderExtrato();
    var el=document.getElementById('extratoMobCards');
    if(!el){el=document.createElement('div');el.id='extratoMobCards';el.className='mob-cards';document.getElementById('pg-extrato').appendChild(el);}
    var E=getExtratoData();
    if(!E.length){el.innerHTML='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum registro</p>';return;}
    el.innerHTML=E.map(function(e){
      var cor=e.tipo==='receita'?'var(--ok)':'var(--dn2)';
      var sinal=e.tipo==='receita'?'+ ':'- ';
      var bc=e.tipo==='receita'?'badge-success':'badge-danger';
      return '<div class="mc"><div class="mc-top"><span class="mc-date">'+fmtD(e.data)+'</span><span class="mc-val" style="color:'+cor+'">'+sinal+fmtV(e.valor)+'</span></div><div class="mc-desc">'+e.desc+'</div><div class="mc-meta"><span class="mc-left"><span class="badge '+bc+'">'+e.tipo+'</span> '+e.cat+' &bull; '+e.origem+'</span></div></div>';
    }).join('');
  };

  // Override renderCompras
  window.renderCompras=function(){
    _renderCompras();
    var el=document.getElementById('comprasMobCards');
    if(!el){el=document.createElement('div');el.id='comprasMobCards';el.className='mob-cards';document.getElementById('pg-compras').appendChild(el);}
    if(!S.comprasCartao.length){el.innerHTML='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhuma compra</p>';return;}
    el.innerHTML=S.comprasCartao.map(function(c){
      var cart=S.cartoes.find(function(x){return x.id===c.cartaoId;});
      var vp=fmtV((Number(c.valor)||0)/(c.parcelas||1));
      return '<div class="mc"><div class="mc-top"><span class="mc-date">'+fmtD(c.data)+'</span><span class="mc-val" style="color:var(--dn2)">'+fmtV(c.valor)+'</span></div><div class="mc-desc">'+c.desc+'</div><div class="mc-meta"><span class="mc-left">'+(cart?cart.nome:'-')+' &bull; '+(c.categoria||'-')+' &bull; '+(c.parcelas||1)+'x '+vp+'</span><span class="mc-acts"><button class="btn btn-sm btn-outline" onclick="editCompra(\''+c.id+'\')">&#9998;</button><button class="btn btn-sm btn-danger" onclick="delCompra(\''+c.id+'\')">&#128465;</button></span></div></div>';
    }).join('');
  };

  // Re-render if already loaded
  if(typeof renderAll==='function'){
    setTimeout(function(){renderAll();},100);
  }
})();

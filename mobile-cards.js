// mobile-cards.js - Cards mobile + fix gráfico
(function(){
  // Detectar mobile
  function isMob(){return window.innerWidth<=768;}

  // Injetar CSS mobile cards
  // CSS movido para app.css (bloco 1 deste arquivo)

  // Salvar referências originais
  var _renderLancs=window.renderLancs;
  var _renderExtrato=window.renderExtrato;

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

  // Compras NÃO tem card mobile aqui de propósito.
  // compras-filtro.js renderiza #cpMobCards já filtrado pela fatura do mês.
  // A versão que existia aqui listava S.comprasCartao inteiro (todos os meses)
  // e aparecia sobreposta no mobile, porque o `.mob-cards{display:block!important}`
  // deste arquivo vencia o display:none inline aplicado por compras-filtro.js.

  // Re-render if already loaded
  if(typeof renderAll==='function'){
    setTimeout(function(){renderAll();},100);
  }
})();

// mobile-cards.js - Cards mobile + fix gráfico
(function(){
  // Detectar mobile
  function isMob(){return window.innerWidth<=768;}

  // Injetar CSS mobile cards
  // CSS movido para app.css (bloco 1 deste arquivo)

  // Salvar referências originais
  var _renderLancs=window.renderLancs;
  var _renderExtrato=window.renderExtrato;

  // Override renderLancs (nov/2026): lista do celular agrupada por dia, com o
  // total de cada dia, respeitando os MESMOS filtros e a ordenacao da tabela
  // (antes os cartoes ignoravam os filtros). Toque no lancamento manual abre a
  // edicao (que tem o botao Excluir). Filtros recolhidos atras de "Filtros".
  var DSEM=['dom','seg','ter','qua','qui','sex','sáb'];
  var MESC=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function rotuloDia(iso){
    var hoje=typeof hojeStr==='function'?hojeStr():new Date().toISOString().slice(0,10);
    var p=iso.split('-'),d=new Date(+p[0],+p[1]-1,+p[2]);
    var o=new Date();o.setDate(o.getDate()-1);
    var ontem=o.getFullYear()+'-'+String(o.getMonth()+1).padStart(2,'0')+'-'+String(o.getDate()).padStart(2,'0');
    var base=DSEM[d.getDay()]+', '+(+p[2])+' '+MESC[+p[1]-1];
    if(iso===hoje)return 'Hoje &middot; '+base;
    if(iso===ontem)return 'Ontem &middot; '+base;
    return base;
  }
  function filtrosAtivos(){
    var n=0;['lfTipo','lfCat'].forEach(function(id){var e=document.getElementById(id);if(e&&e.value)n++;});
    var so=document.getElementById('lfSort');if(so&&so.value&&so.value!=='data_desc')n++;
    return n;
  }
  function montarFiltrosMob(){
    var fb=document.querySelector('#pg-lancs .filter-bar');
    if(!fb||document.getElementById('lfToggle'))return;
    fb.classList.add('lf-bar');
    var b=document.createElement('button');
    b.type='button';b.id='lfToggle';b.className='btn btn-outline lf-toggle';
    b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','lfMais');
    b.onclick=function(){var ab=fb.classList.toggle('lf-aberto');b.setAttribute('aria-expanded',ab?'true':'false');};
    var busca=document.getElementById('lfBusca');
    if(busca&&busca.nextSibling)fb.insertBefore(b,busca.nextSibling);else fb.appendChild(b);
  }
  function atualizarBotaoFiltros(){
    var b=document.getElementById('lfToggle');if(!b)return;
    var n=filtrosAtivos();
    b.innerHTML='Filtros'+(n?' <span class="lf-n">'+n+'</span>':'');
  }
  function entradasFiltradas(){
    var E=allEntries(lancMes);
    var v=function(id){var e=document.getElementById(id);return e?e.value:'';};
    var fT=v('lfTipo'),fC=v('lfCat'),fB=(v('lfBusca')||'').trim().toLowerCase(),fS=v('lfSort')||'data_desc';
    if(fT)E=E.filter(function(e){return e.tipo===fT;});
    if(fC)E=E.filter(function(e){return e.cat===fC;});
    if(fB)E=E.filter(function(e){return(e.desc||'').toLowerCase().indexOf(fB)>=0||(e.cat||'').toLowerCase().indexOf(fB)>=0||(e.obs||'').toLowerCase().indexOf(fB)>=0;});
    E.sort(function(a,b){
      if(fS==='data_asc')return a.data.localeCompare(b.data);
      if(fS==='valor_desc')return b.valor-a.valor;
      if(fS==='valor_asc')return a.valor-b.valor;
      if(fS==='desc_asc')return(a.desc||'').localeCompare(b.desc||'');
      return b.data.localeCompare(a.data);
    });
    return {E:E,porData:fS==='data_desc'||fS==='data_asc'};
  }
  function linha(e){
    var rec=e.tipo==='receita';
    var orig=e.origem==='Contrato'?'Contrato':(e.origem||'').indexOf('Assinatura')===0?'Assinatura':(e.origem||'').indexOf('Cart')===0?'Cartão':'';
    var meta=esc(e.cat)+(orig?' &middot; '+orig:'');
    var attrs=e.isManual?' role="button" tabindex="0" data-id="'+esc(e.id)+'" onclick="editLanc(this.dataset.id)" onkeydown="if(event.key===\'Enter\')editLanc(this.dataset.id)" aria-label="Editar '+esc(e.desc)+'"':'';
    return '<div class="lm-it'+(e.isManual?' lm-ed':'')+'"'+attrs+'>'+
      '<span class="tipo-dot '+(rec?'rec':'desp')+'"></span>'+
      '<div class="lm-tx"><div class="lm-desc">'+esc(e.desc)+'</div><div class="lm-meta">'+meta+'</div>'+(e.obs?'<div class="lm-obs">'+esc(e.obs)+'</div>':'')+'</div>'+
      '<div class="lm-val '+(rec?'amount-rec':'amount-desp')+'">'+(rec?'+ ':'&minus; ')+fmtV(e.valor)+'</div></div>';
  }
  window.renderLancs=function(){
    _renderLancs();
    montarFiltrosMob();atualizarBotaoFiltros();
    var el=document.getElementById('lancMobCards');
    if(!el){el=document.createElement('div');el.id='lancMobCards';el.className='mob-cards';document.getElementById('pg-lancs').appendChild(el);}
    var r=entradasFiltradas(),E=r.E;
    if(!E.length){el.innerHTML='<p class="lm-vazio">'+(filtrosAtivos()||(document.getElementById('lfBusca')||{}).value?'Nenhum lançamento com esses filtros':'Nenhum lançamento neste mês')+'</p>';return;}
    var rec=0,desp=0;E.forEach(function(e){if(e.tipo==='receita')rec+=e.valor;else desp+=e.valor;});
    var h='<div class="lm-resumo"><span>'+E.length+' lançamento'+(E.length>1?'s':'')+'</span><span>'+[rec?'<span class="amount-rec">+ '+fmtV(rec)+'</span>':'',desp?'<span class="amount-desp">&minus; '+fmtV(desp)+'</span>':''].filter(Boolean).join(' &middot; ')+'</span></div>';
    if(!r.porData){
      h+='<div class="lm-grupo">'+E.map(linha).join('')+'</div>';
    }else{
      var dias=[],mapa={};
      E.forEach(function(e){if(!mapa[e.data]){mapa[e.data]=[];dias.push(e.data);}mapa[e.data].push(e);});
      dias.forEach(function(d){
        var it=mapa[d],t=0;it.forEach(function(e){t+=e.tipo==='receita'?e.valor:-e.valor;});
        h+='<div class="lm-dia"><span>'+rotuloDia(d)+'</span><span class="lm-dia-t">'+(t>=0?'+ ':'&minus; ')+fmtV(Math.abs(t))+'</span></div>'+
           '<div class="lm-grupo">'+it.map(linha).join('')+'</div>';
      });
    }
    el.innerHTML=h;
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

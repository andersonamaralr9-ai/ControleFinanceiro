// melhorias.js — Filtros em Assinaturas/Contratos + Histórico de valores + Extrato por Categoria com Comparação
(function(){

// ================================================================
// CSS
// ================================================================
var sty=document.createElement('style');
sty.textContent=`
/* Filtros de assinaturas e contratos */
.filter-sub{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.filter-sub .form-control{max-width:180px;}
.filter-sub .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}
@media(max-width:768px){
  .filter-sub{flex-direction:column;align-items:stretch;}
  .filter-sub .form-control{max-width:100%;}
  .filter-sub .filter-count{margin-left:0;text-align:center;}
}

/* Histórico de valores do contrato */
.hist-timeline{margin:12px 0;max-height:200px;overflow-y:auto;}
.hist-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-left:3px solid var(--pri);margin-bottom:6px;background:var(--bg3);border-radius:0 8px 8px 0;font-size:.84em;}
.hist-item .hist-data{color:var(--tx3);font-size:.78em;min-width:80px;}
.hist-item .hist-valor{font-weight:700;color:var(--pri2);}
.hist-item .hist-atual{color:var(--ok);font-weight:700;}
.hist-item .hist-diff{font-size:.75em;margin-left:auto;}
.hist-item .hist-diff.up{color:var(--dn2);}
.hist-item .hist-diff.down{color:var(--ok);}

/* Nova página Extrato por Categoria */
.cat-extrato-grid{display:grid;grid-template-columns:1fr;gap:0;margin-bottom:24px;}
.cat-row{display:grid;grid-template-columns:1fr 120px 120px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bg4);transition:background .15s;cursor:default;}
.cat-row:hover{background:var(--bg3);}
.cat-row-header{background:var(--bg3);font-size:.73em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;cursor:default;}
.cat-row-header:hover{background:var(--bg3);}
.cat-row .cat-name{font-weight:600;font-size:.88em;}
.cat-row .cat-val{font-weight:700;text-align:right;font-size:.9em;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background .15s;}
.cat-row .cat-val:hover{background:var(--bg4);}
.cat-row .cat-val.green{color:var(--ok);}
.cat-row .cat-val.red{color:var(--dn2);}
.cat-section-title{font-size:.9em;font-weight:700;padding:14px 16px 8px;color:var(--tx2);border-bottom:2px solid var(--bg4);background:var(--bg2);}
.cat-total-row{background:var(--bg3);font-weight:700;border-top:2px solid var(--bg4);}
.cat-total-row .cat-name{font-size:.9em;}

/* Comparação lado a lado */
.comp-container{margin-top:20px;}
.comp-header{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
.comp-header label{font-size:.8em;color:var(--tx2);font-weight:600;}
.comp-row{display:grid;grid-template-columns:1fr 110px 110px 110px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--bg4);font-size:.85em;}
.comp-row-header{background:var(--bg3);font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;}
.comp-val{text-align:right;font-weight:700;}
.comp-diff{text-align:right;font-weight:700;font-size:.82em;}
.comp-diff.up{color:var(--dn2);}
.comp-diff.down{color:var(--ok);}
.comp-diff.zero{color:var(--tx3);}
.comp-section-title{font-size:.85em;font-weight:700;padding:12px 16px 6px;color:var(--tx2);border-bottom:2px solid var(--bg4);}
.comp-total-row{background:var(--bg3);font-weight:700;border-top:2px solid var(--bg4);}

/* Modal de detalhes */
.det-list{max-height:350px;overflow-y:auto;}
.det-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--bg4);font-size:.85em;}
.det-item .det-desc{flex:1;}
.det-item .det-data{color:var(--tx3);font-size:.78em;min-width:80px;}
.det-item .det-val{font-weight:700;min-width:90px;text-align:right;}
.det-item .det-origem{font-size:.72em;color:var(--tx3);margin-left:8px;}
.det-total{padding:12px;background:var(--bg3);border-radius:8px;margin-top:8px;text-align:right;font-weight:700;font-size:.95em;}

@media(max-width:768px){
  .cat-row{grid-template-columns:1fr 90px 90px;padding:10px 12px;}
  .cat-row .cat-val{font-size:.8em;padding:3px 6px;}
  .comp-row{grid-template-columns:1fr 80px 80px 80px;padding:8px 12px;font-size:.78em;}
  .comp-header{flex-direction:column;align-items:stretch;}
}
`;
document.head.appendChild(sty);


// ================================================================
// 1. FILTROS EM ASSINATURAS
// ================================================================
(function(){
  var pg=document.getElementById('pg-assinaturas');
  if(!pg) return;
  var formSection=pg.querySelector('.form-section');
  if(!formSection) return;

  // Criar barra de filtro antes do subGrid
  var filterDiv=document.createElement('div');
  filterDiv.className='filter-sub';
  filterDiv.id='filterSubs';
  filterDiv.innerHTML=
    '<select id="fSubCartao" class="form-control" onchange="filtrarSubs()"><option value="">Todos os cartões</option></select>'+
    '<select id="fSubCat" class="form-control" onchange="filtrarSubs()"><option value="">Todas as categorias</option></select>'+
    '<input id="fSubBusca" class="form-control" placeholder="Buscar nome..." oninput="filtrarSubs()" style="max-width:200px">'+
    '<span class="filter-count" id="fSubCount"></span>';

  var subGrid=document.getElementById('subGrid');
  if(subGrid) subGrid.parentNode.insertBefore(filterDiv,subGrid);

  // Povoar filtros
  function povoarFiltrosSubs(){
    var selCart=document.getElementById('fSubCartao');
    var selCat=document.getElementById('fSubCat');
    if(!selCart||!selCat) return;
    var cartVal=selCart.value, catVal=selCat.value;
    selCart.innerHTML='<option value="">Todos os cartões</option>';
    selCat.innerHTML='<option value="">Todas as categorias</option>';
    if(S.cartoes) S.cartoes.forEach(function(c){
      selCart.innerHTML+='<option value="'+c.id+'">'+c.nome+'</option>';
    });
    var cats={};
    if(S.assinaturas) S.assinaturas.forEach(function(a){ if(a.categoria) cats[a.categoria]=1; });
    Object.keys(cats).sort().forEach(function(c){
      selCat.innerHTML+='<option value="'+c+'">'+c+'</option>';
    });
    selCart.value=cartVal; selCat.value=catVal;
  }

  var _origRenderSubs=window.renderSubs;
  window.renderSubs=function(){
    _origRenderSubs();
    povoarFiltrosSubs();
    filtrarSubs();
  };

  window.filtrarSubs=function(){
    var cartFiltro=document.getElementById('fSubCartao').value;
    var catFiltro=document.getElementById('fSubCat').value;
    var busca=(document.getElementById('fSubBusca').value||'').toLowerCase();
    var subGrid=document.getElementById('subGrid');
    if(!subGrid) return;
    var boxes=subGrid.querySelectorAll('.sub-box');
    var total=0,visivel=0;
    boxes.forEach(function(box){
      total++;
      var texto=box.textContent.toLowerCase();
      var cartOk=true,catOk=true,buscaOk=true;
      // Extrair dados do box para filtrar
      if(cartFiltro){
        var cart=S.cartoes.find(function(c){return c.id===cartFiltro;});
        if(cart) cartOk=texto.indexOf(cart.nome.toLowerCase())>=0;
        else cartOk=false;
      }
      if(catFiltro) catOk=texto.indexOf(catFiltro.toLowerCase())>=0;
      if(busca) buscaOk=texto.indexOf(busca)>=0;
      if(cartOk&&catOk&&buscaOk){ box.style.display=''; visivel++; }
      else { box.style.display='none'; }
    });
    document.getElementById('fSubCount').textContent=visivel+' de '+total+' assinatura(s)';
  };
})();


// ================================================================
// 2. FILTROS EM CONTRATOS + HISTÓRICO DE VALORES
// ================================================================
(function(){
  var pg=document.getElementById('pg-contratos');
  if(!pg) return;
  var formSection=pg.querySelector('.form-section');
  if(!formSection) return;

  // Filtro
  var filterDiv=document.createElement('div');
  filterDiv.className='filter-sub';
  filterDiv.id='filterContratos';
  filterDiv.innerHTML=
    '<select id="fContTipo" class="form-control" onchange="filtrarContratos()"><option value="">Todos os tipos</option><option value="receita">Receita</option><option value="despesa">Despesa</option></select>'+
    '<select id="fContCat" class="form-control" onchange="filtrarContratos()"><option value="">Todas as categorias</option></select>'+
    '<input id="fContBusca" class="form-control" placeholder="Buscar descrição..." oninput="filtrarContratos()" style="max-width:200px">'+
    '<span class="filter-count" id="fContCount"></span>';

  var contGrid=document.getElementById('contGrid');
  if(contGrid) contGrid.parentNode.insertBefore(filterDiv,contGrid);

  function povoarFiltrosContratos(){
    var selCat=document.getElementById('fContCat');
    if(!selCat) return;
    var catVal=selCat.value;
    selCat.innerHTML='<option value="">Todas as categorias</option>';
    var cats={};
    if(S.contratos) S.contratos.forEach(function(c){ if(c.categoria) cats[c.categoria]=1; });
    Object.keys(cats).sort().forEach(function(c){
      selCat.innerHTML+='<option value="'+c+'">'+c+'</option>';
    });
    selCat.value=catVal;
  }

  // Override renderContratos para adicionar filtro + botão histórico
  var _origRenderContratos=window.renderContratos;
  window.renderContratos=function(){
    _origRenderContratos();
    povoarFiltrosContratos();
    filtrarContratos();

    // Adicionar botão "Histórico" em cada contrato
    var contGrid=document.getElementById('contGrid');
    if(!contGrid) return;
    contGrid.querySelectorAll('.sub-box').forEach(function(box){
      var actions=box.querySelector('.sub-box-actions');
      if(!actions) return;
      if(actions.querySelector('.btn-hist')) return;

      // Encontrar o contrato correspondente
      var editBtn=actions.querySelector('[onclick*="editContrato"]');
      if(!editBtn) return;
      var match=editBtn.getAttribute('onclick').match(/editContrato\(['"](.+?)['"]\)/);
      if(!match) return;
      var contId=match[1];

      var btn=document.createElement('button');
      btn.className='btn btn-sm btn-outline btn-hist';
      btn.innerHTML='&#128197; Histórico';
      btn.title='Ver histórico de valores';
      btn.onclick=function(){ abrirHistorico(contId); };
      actions.appendChild(btn);
    });
  };

  window.filtrarContratos=function(){
    var tipoFiltro=document.getElementById('fContTipo').value;
    var catFiltro=document.getElementById('fContCat').value;
    var busca=(document.getElementById('fContBusca').value||'').toLowerCase();
    var contGrid=document.getElementById('contGrid');
    if(!contGrid) return;
    var boxes=contGrid.querySelectorAll('.sub-box');
    var total=0,visivel=0;
    boxes.forEach(function(box){
      total++;
      var texto=box.textContent.toLowerCase();
      var tipoOk=true,catOk=true,buscaOk=true;
      if(tipoFiltro) tipoOk=texto.indexOf(tipoFiltro)>=0;
      if(catFiltro) catOk=texto.indexOf(catFiltro.toLowerCase())>=0;
      if(busca) buscaOk=texto.indexOf(busca)>=0;
      if(tipoOk&&catOk&&buscaOk){ box.style.display=''; visivel++; }
      else { box.style.display='none'; }
    });
    document.getElementById('fContCount').textContent=visivel+' de '+total+' contrato(s)';
  };

  // Histórico de valores
  // Ao editar um contrato, salvar o valor antigo no histórico
  var _origSaveEditContrato=window.saveEditContrato;
  if(_origSaveEditContrato){
    window.saveEditContrato=function(){
      // Capturar valor antes da edição
      var id=document.getElementById('editContId')&&document.getElementById('editContId').value;
      if(id){
        var cont=S.contratos.find(function(c){return c.id===id;});
        if(cont){
          var novoValor=parseFloat((document.getElementById('editContValor')||{}).value);
          if(!isNaN(novoValor)){
            var valorAtual=Number(cont.valor)||0;
            // Se valor mudou, salvar no histórico
            if(Math.abs(novoValor-valorAtual)>0.01){
              if(!cont.historicoValores) cont.historicoValores=[];
              cont.historicoValores.push({
                data: new Date().toISOString().slice(0,10),
                valorAnterior: valorAtual,
                valorNovo: novoValor
              });
            }
          }
        }
      }
      _origSaveEditContrato();
    };
  }

  // Modal do histórico
  var modalHist=document.createElement('div');
  modalHist.className='modal';
  modalHist.id='modalHistorico';
  modalHist.innerHTML=`
    <div class="modal-content" style="max-width:480px">
      <div class="modal-header">
        <h3>&#128197; Histórico de Valores</h3>
        <span class="modal-close" onclick="document.getElementById('modalHistorico').classList.remove('show')">&times;</span>
      </div>
      <div class="modal-body" id="histBody"></div>
    </div>
  `;
  document.body.appendChild(modalHist);

  window.abrirHistorico=function(contId){
    var cont=S.contratos.find(function(c){return c.id===contId;});
    if(!cont){toast('Contrato não encontrado','error');return;}

    var html='<p style="margin-bottom:12px"><strong style="color:var(--tx)">'+cont.desc+'</strong><br><span style="font-size:.82em;color:var(--tx3)">Valor atual: '+fmtV(cont.valor)+'</span></p>';

    var hist=cont.historicoValores||[];
    if(hist.length===0){
      html+='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhuma alteração de valor registrada.<br><span style="font-size:.78em">O histórico será gravado automaticamente quando você editar o valor do contrato.</span></p>';
    } else {
      html+='<div class="hist-timeline">';
      // Ordenar do mais recente para o mais antigo
      var sorted=hist.slice().sort(function(a,b){return b.data.localeCompare(a.data);});
      sorted.forEach(function(h,i){
        var diff=h.valorNovo-h.valorAnterior;
        var diffClass=diff>0?'up':'down';
        var diffLabel=diff>0?'▲ +'+fmtV(Math.abs(diff)):'▼ -'+fmtV(Math.abs(diff));
        var isAtual=(i===0);
        html+='<div class="hist-item">'+
          '<span class="hist-data">'+fmtD(h.data)+'</span>'+
          '<span>'+fmtV(h.valorAnterior)+' → </span>'+
          '<span class="'+(isAtual?'hist-atual':'hist-valor')+'">'+fmtV(h.valorNovo)+'</span>'+
          '<span class="hist-diff '+diffClass+'">'+diffLabel+'</span>'+
        '</div>';
      });
      // Mostrar valor original (o primeiro registro)
      var primeiro=hist[0];
      if(primeiro){
        html+='<div class="hist-item" style="border-left-color:var(--tx3);opacity:.6">'+
          '<span class="hist-data">Início</span>'+
          '<span class="hist-valor">'+fmtV(primeiro.valorAnterior)+'</span>'+
          '<span class="hist-diff zero" style="color:var(--tx3)">valor original</span>'+
        '</div>';
      }
      html+='</div>';
    }

    document.getElementById('histBody').innerHTML=html;
    document.getElementById('modalHistorico').classList.add('show');
  };
})();


// ================================================================
// 3. NOVA PÁGINA: EXTRATO POR CATEGORIA COM COMPARAÇÃO
// ================================================================
(function(){
  // Criar link no menu sidebar
  var sidebar=document.getElementById('sidebar');
  if(!sidebar) return;
  // Inserir após o link "Extrato"
  var extLink=document.getElementById('nav-extrato');
  if(!extLink) return;

  var newLink=document.createElement('a');
  newLink.id='nav-extratoCat';
  newLink.onclick=function(){nav('extratoCat');};
  newLink.innerHTML='<span>&#128202; Extrato Categorizado</span>';
  extLink.parentNode.insertBefore(newLink,extLink.nextSibling);

  // Criar a página
  var mainDiv=document.querySelector('.main');
  if(!mainDiv) return;

  var pgDiv=document.createElement('div');
  pgDiv.className='page';
  pgDiv.id='pg-extratoCat';
  pgDiv.innerHTML=`
    <h2 class="page-title">&#128202; Extrato por Categoria</h2>
    <div class="month-nav">
      <button class="btn btn-outline" onclick="chgECM(-1)">&#9664;</button>
      <span class="mes-label" id="ecMesLabel"></span>
      <button class="btn btn-outline" onclick="chgECM(1)">&#9654;</button>
    </div>
    <div id="ecArea"></div>
    <div class="comp-container" id="ecCompContainer">
      <div class="comp-header">
        <label>&#128200; Comparar com:</label>
        <input type="month" id="ecCompMes" class="form-control" style="max-width:180px" onchange="renderExtratoCat()">
        <button class="btn btn-sm btn-outline" onclick="document.getElementById('ecCompMes').value='';renderExtratoCat()">Limpar</button>
      </div>
      <div id="ecCompArea"></div>
    </div>
  `;
  mainDiv.appendChild(pgDiv);

  // Variável do mês selecionado
  var ecMes=new Date();
  ecMes.setDate(1);

  var nomeMeses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function ecMesStr(d){ return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1); }
  function ecMesLabel(d){ return nomeMeses[d.getMonth()]+' '+d.getFullYear(); }

  window.chgECM=function(dir){
    ecMes.setMonth(ecMes.getMonth()+dir);
    renderExtratoCat();
  };

  // Pegar todos os lançamentos de um mês (usando allEntries se disponível)
  function getEntriesMes(mesStr){
    // mesStr = "YYYY-MM"
    var entries=[];
    // Lançamentos manuais
    if(S.lancamentos) S.lancamentos.forEach(function(l){
      if(l.data&&l.data.substring(0,7)===mesStr) entries.push(l);
    });
    // Contratos recorrentes
    if(S.contratos) S.contratos.forEach(function(c){
      if(!c.inicio) return;
      var ym=mesStr.split('-');var y=parseInt(ym[0]),m=parseInt(ym[1]);
      var inicioYM=c.inicio.split('-');var iy=parseInt(inicioYM[0]),im=parseInt(inicioYM[1]);
      if(y*100+m>=iy*100+im){
        entries.push({
          data:mesStr+'-'+(c.diaVencimento<10?'0':'')+c.diaVencimento,
          tipo:c.tipo||'despesa', desc:c.desc, cat:c.categoria||'',
          valor:Number(c.valor)||0, origem:'Contrato'
        });
      }
    });
    // Assinaturas
    if(S.assinaturas) S.assinaturas.forEach(function(a){
      if(!a.inicio) return;
      var ym=mesStr.split('-');var y=parseInt(ym[0]),m=parseInt(ym[1]);
      var inicioYM=a.inicio.split('-');var iy=parseInt(inicioYM[0]),im=parseInt(inicioYM[1]);
      if(y*100+m>=iy*100+im){
        entries.push({
          data:mesStr+'-01',
          tipo:'despesa', desc:a.nome||a.desc, cat:a.categoria||'',
          valor:Number(a.valor)||0, origem:'Assinatura'
        });
      }
    });
    return entries;
  }

  // Agrupar por tipo e categoria
  function agrupar(entries){
    var receitas={},despesas={};
    entries.forEach(function(e){
      var cat=e.cat||e.categoria||'Sem categoria';
      var tipo=e.tipo||'despesa';
      var val=Number(e.valor)||0;
      if(tipo==='receita'){
        if(!receitas[cat]) receitas[cat]={total:0,items:[]};
        receitas[cat].total+=val;
        receitas[cat].items.push(e);
      } else {
        if(!despesas[cat]) despesas[cat]={total:0,items:[]};
        despesas[cat].total+=val;
        despesas[cat].items.push(e);
      }
    });
    return {receitas:receitas,despesas:despesas};
  }

  // Modal de detalhes
  var modalDet=document.createElement('div');
  modalDet.className='modal';
  modalDet.id='modalDetCategoria';
  modalDet.innerHTML=`
    <div class="modal-content" style="max-width:540px">
      <div class="modal-header">
        <h3 id="detCatTitle">Detalhes</h3>
        <span class="modal-close" onclick="document.getElementById('modalDetCategoria').classList.remove('show')">&times;</span>
      </div>
      <div class="modal-body" id="detCatBody"></div>
    </div>
  `;
  document.body.appendChild(modalDet);

  window.abrirDetCategoria=function(cat,tipo,mesStr){
    var entries=getEntriesMes(mesStr);
    var filtrados=entries.filter(function(e){
      return (e.cat||e.categoria||'Sem categoria')===cat && (e.tipo||'despesa')===tipo;
    });
    filtrados.sort(function(a,b){return a.data.localeCompare(b.data);});

    var total=filtrados.reduce(function(a,e){return a+(Number(e.valor)||0);},0);
    var corTotal=tipo==='receita'?'var(--ok)':'var(--dn2)';

    document.getElementById('detCatTitle').textContent=cat+' — '+(tipo==='receita'?'Receitas':'Despesas');

    var html='<div class="det-list">';
    if(filtrados.length===0){
      html+='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum lançamento</p>';
    } else {
      filtrados.forEach(function(e){
        var cor=tipo==='receita'?'color:var(--ok)':'color:var(--dn2)';
        html+='<div class="det-item">'+
          '<span class="det-data">'+fmtD(e.data)+'</span>'+
          '<span class="det-desc">'+(e.desc||'-')+'</span>'+
          '<span class="det-origem">'+(e.origem||'Manual')+'</span>'+
          '<span class="det-val" style="'+cor+'">'+fmtV(e.valor)+'</span>'+
        '</div>';
      });
    }
    html+='</div>';
    html+='<div class="det-total" style="color:'+corTotal+'">Total: '+fmtV(total)+'</div>';

    document.getElementById('detCatBody').innerHTML=html;
    document.getElementById('modalDetCategoria').classList.add('show');
  };

  // Renderizar o extrato categorizado
  window.renderExtratoCat=function(){
    document.getElementById('ecMesLabel').textContent=ecMesLabel(ecMes);
    var mesStr=ecMesStr(ecMes);
    var entries=getEntriesMes(mesStr);
    var grupos=agrupar(entries);

    var html='<div class="chart-box" style="padding:0;overflow:hidden">';

    // Header
    html+='<div class="cat-row cat-row-header"><span>Categoria</span><span style="text-align:right">Receita</span><span style="text-align:right">Despesa</span></div>';

    // Todas as categorias (unir receitas e despesas)
    var allCats={};
    Object.keys(grupos.receitas).forEach(function(c){allCats[c]=1;});
    Object.keys(grupos.despesas).forEach(function(c){allCats[c]=1;});
    var catList=Object.keys(allCats).sort();

    var totalRec=0,totalDesp=0;

    if(catList.length===0){
      html+='<div style="padding:30px;text-align:center;color:var(--tx3)">Nenhum lançamento neste mês</div>';
    } else {
      catList.forEach(function(cat){
        var rec=(grupos.receitas[cat]||{}).total||0;
        var desp=(grupos.despesas[cat]||{}).total||0;
        totalRec+=rec; totalDesp+=desp;

        var recClick=rec>0?'onclick="abrirDetCategoria(\''+cat.replace(/'/g,"\\'")+'\',\'receita\',\''+mesStr+'\')" style="cursor:pointer"':'';
        var despClick=desp>0?'onclick="abrirDetCategoria(\''+cat.replace(/'/g,"\\'")+'\',\'despesa\',\''+mesStr+'\')" style="cursor:pointer"':'';

        html+='<div class="cat-row">'+
          '<span class="cat-name">'+cat+'</span>'+
          '<span class="cat-val green" '+recClick+'>'+(rec>0?fmtV(rec):'-')+'</span>'+
          '<span class="cat-val red" '+despClick+'>'+(desp>0?fmtV(desp):'-')+'</span>'+
        '</div>';
      });

      // Total
      html+='<div class="cat-row cat-total-row">'+
        '<span class="cat-name">TOTAL</span>'+
        '<span class="cat-val green">'+fmtV(totalRec)+'</span>'+
        '<span class="cat-val red">'+fmtV(totalDesp)+'</span>'+
      '</div>';

      // Saldo
      var saldo=totalRec-totalDesp;
      html+='<div class="cat-row" style="border-top:2px solid var(--pri)">'+
        '<span class="cat-name" style="color:var(--pri2)">SALDO</span>'+
        '<span></span>'+
        '<span class="cat-val '+(saldo>=0?'green':'red')+'">'+fmtV(Math.abs(saldo))+(saldo<0?' (déficit)':'')+'</span>'+
      '</div>';
    }

    html+='</div>';
    document.getElementById('ecArea').innerHTML=html;

    // ============ COMPARAÇÃO ============
    var compMes=document.getElementById('ecCompMes').value;
    var compArea=document.getElementById('ecCompArea');
    if(!compMes){
      compArea.innerHTML='';
      return;
    }

    var compEntries=getEntriesMes(compMes);
    var compGrupos=agrupar(compEntries);
    var compDate=new Date(compMes+'-01T12:00:00');
    var compLabel=ecMesLabel(compDate);

    var allCatsComp={};
    Object.keys(grupos.receitas).forEach(function(c){allCatsComp[c]=1;});
    Object.keys(grupos.despesas).forEach(function(c){allCatsComp[c]=1;});
    Object.keys(compGrupos.receitas).forEach(function(c){allCatsComp[c]=1;});
    Object.keys(compGrupos.despesas).forEach(function(c){allCatsComp[c]=1;});
    var allCatsList=Object.keys(allCatsComp).sort();

    var ch='<div class="chart-box" style="padding:0;overflow:hidden;margin-top:16px">';
    ch+='<div style="padding:14px 16px;border-bottom:2px solid var(--bg4);font-weight:700;font-size:.9em;color:var(--pri2)">'+
      '&#128200; '+ecMesLabel(ecMes)+' vs '+compLabel+'</div>';

    // DESPESAS
    ch+='<div class="comp-section-title" style="color:var(--dn2)">Despesas</div>';
    ch+='<div class="comp-row comp-row-header"><span>Categoria</span><span style="text-align:right">'+ecMesLabel(ecMes).split(' ')[0]+'</span><span style="text-align:right">'+compLabel.split(' ')[0]+'</span><span style="text-align:right">Diferença</span></div>';

    var totalDespAtual=0,totalDespComp=0;
    allCatsList.forEach(function(cat){
      var atual=(grupos.despesas[cat]||{}).total||0;
      var comp=(compGrupos.despesas[cat]||{}).total||0;
      if(atual===0&&comp===0) return;
      totalDespAtual+=atual; totalDespComp+=comp;
      var diff=atual-comp;
      var diffClass=diff>0?'up':(diff<0?'down':'zero');
      var diffLabel=diff>0?'▲ +'+fmtV(diff):(diff<0?'▼ '+fmtV(diff):'-');
      ch+='<div class="comp-row"><span>'+cat+'</span><span class="comp-val" style="color:var(--dn2)">'+(atual?fmtV(atual):'-')+'</span><span class="comp-val" style="color:var(--dn2)">'+(comp?fmtV(comp):'-')+'</span><span class="comp-diff '+diffClass+'">'+diffLabel+'</span></div>';
    });
    // Total despesas
    var diffTD=totalDespAtual-totalDespComp;
    var diffTDClass=diffTD>0?'up':(diffTD<0?'down':'zero');
    var diffTDLabel=diffTD>0?'▲ +'+fmtV(diffTD):(diffTD<0?'▼ '+fmtV(diffTD):'-');
    ch+='<div class="comp-row comp-total-row"><span>TOTAL DESPESAS</span><span class="comp-val" style="color:var(--dn2)">'+fmtV(totalDespAtual)+'</span><span class="comp-val" style="color:var(--dn2)">'+fmtV(totalDespComp)+'</span><span class="comp-diff '+diffTDClass+'">'+diffTDLabel+'</span></div>';

    // RECEITAS
    ch+='<div class="comp-section-title" style="color:var(--ok)">Receitas</div>';
    ch+='<div class="comp-row comp-row-header"><span>Categoria</span><span style="text-align:right">'+ecMesLabel(ecMes).split(' ')[0]+'</span><span style="text-align:right">'+compLabel.split(' ')[0]+'</span><span style="text-align:right">Diferença</span></div>';

    var totalRecAtual=0,totalRecComp=0;
    allCatsList.forEach(function(cat){
      var atual=(grupos.receitas[cat]||{}).total||0;
      var comp=(compGrupos.receitas[cat]||{}).total||0;
      if(atual===0&&comp===0) return;
      totalRecAtual+=atual; totalRecComp+=comp;
      var diff=atual-comp;
      var diffClass=diff>0?'down':(diff<0?'up':'zero'); // receita subiu = bom (green)
      var diffLabel=diff>0?'▲ +'+fmtV(diff):(diff<0?'▼ '+fmtV(diff):'-');
      ch+='<div class="comp-row"><span>'+cat+'</span><span class="comp-val" style="color:var(--ok)">'+(atual?fmtV(atual):'-')+'</span><span class="comp-val" style="color:var(--ok)">'+(comp?fmtV(comp):'-')+'</span><span class="comp-diff '+diffClass+'">'+diffLabel+'</span></div>';
    });
    var diffTR=totalRecAtual-totalRecComp;
    var diffTRClass=diffTR>0?'down':(diffTR<0?'up':'zero');
    var diffTRLabel=diffTR>0?'▲ +'+fmtV(diffTR):(diffTR<0?'▼ '+fmtV(diffTR):'-');
    ch+='<div class="comp-row comp-total-row"><span>TOTAL RECEITAS</span><span class="comp-val" style="color:var(--ok)">'+fmtV(totalRecAtual)+'</span><span class="comp-val" style="color:var(--ok)">'+fmtV(totalRecComp)+'</span><span class="comp-diff '+diffTRClass+'">'+diffTRLabel+'</span></div>';

    ch+='</div>';
    compArea.innerHTML=ch;
  };

  // Registrar a nova página no sistema de navegação
  var _origNav=window.nav;
  window.nav=function(pg){
    _origNav(pg);
    // Ativar/desativar o link
    var el=document.getElementById('nav-extratoCat');
    if(el){
      if(pg==='extratoCat') el.classList.add('active');
      else el.classList.remove('active');
    }
    // Mostrar/esconder a página
    var pgEl=document.getElementById('pg-extratoCat');
    if(pgEl){
      if(pg==='extratoCat'){
        pgEl.classList.add('active');
        renderExtratoCat();
      } else {
        pgEl.classList.remove('active');
      }
    }
  };

})();

console.log('[Financeiro Pro] Módulo de melhorias carregado (filtros + histórico + extrato categorizado).');
})();

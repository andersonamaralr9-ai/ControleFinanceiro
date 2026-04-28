// melhorias.js v2 — Filtros + Histórico (contratos E assinaturas) + Valores vigentes por mês + Datas BR + Persistência de filtros + Extrato Categorizado
(function(){
'use strict';

// ================================================================
// HELPER: Formato de data brasileiro (dd/mm/aaaa)
// ================================================================
var _origFmtD=window.fmtD;
window.fmtD=function(d){
  if(!d) return '-';
  // Se já é dd/mm/aaaa, retornar
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  // Se é yyyy-mm-dd
  var p=String(d).split('-');
  if(p.length===3) return p[2]+'/'+p[1]+'/'+p[0];
  // Se é yyyy-mm
  if(p.length===2) return p[1]+'/'+p[0];
  // Fallback
  if(_origFmtD) return _origFmtD(d);
  return d;
};

// ================================================================
// HELPER: Valor vigente de contrato/assinatura em determinado mês
// Considera o historicoValores para retornar o valor correto
// ================================================================
function valorVigente(item, mesAno){
  // mesAno = "YYYY-MM"
  // item tem .valor (atual) e .historicoValores (array de {data,valorAnterior,valorNovo,vigenciaA partir})
  var hist=item.historicoValores||[];
  if(hist.length===0) return Number(item.valor)||0;

  // Construir timeline de valores: [(vigencia, valor)]
  // O valor original é o valorAnterior do primeiro registro
  var timeline=[];

  // Ordenar por data ou vigência
  var sorted=hist.slice().sort(function(a,b){
    var da=a.vigenciaAPartir||a.data||'';
    var db=b.vigenciaAPartir||b.data||'';
    return da.localeCompare(db);
  });

  // Valor original (antes de qualquer alteração)
  var valorOriginal=sorted[0].valorAnterior;
  timeline.push({desde:'0000-00', valor:valorOriginal});

  sorted.forEach(function(h){
    var desde=h.vigenciaAPartir||h.data||'';
    // Converter para YYYY-MM
    if(desde.length===10) desde=desde.substring(0,7); // yyyy-mm-dd → yyyy-mm
    timeline.push({desde:desde, valor:h.valorNovo});
  });

  // Encontrar o valor vigente no mesAno
  var vigente=timeline[0].valor;
  for(var i=0;i<timeline.length;i++){
    if(timeline[i].desde<=mesAno) vigente=timeline[i].valor;
    else break;
  }
  return vigente;
}

// Expor globalmente para uso no extrato categorizado
window.valorVigenteItem=valorVigente;

// ================================================================
// PERSISTÊNCIA DE FILTROS no localStorage
// ================================================================
var FILTROS_KEY='finApp_filtros';
function salvarFiltro(nome,valor){
  var f=JSON.parse(localStorage.getItem(FILTROS_KEY)||'{}');
  f[nome]=valor;
  localStorage.setItem(FILTROS_KEY,JSON.stringify(f));
}
function lerFiltro(nome,padrao){
  var f=JSON.parse(localStorage.getItem(FILTROS_KEY)||'{}');
  return f[nome]!==undefined?f[nome]:padrao;
}

// ================================================================
// CSS
// ================================================================
var sty=document.createElement('style');
sty.textContent=`
.filter-sub{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;}
.filter-sub .form-control{max-width:180px;}
.filter-sub .filter-count{font-size:.78em;color:var(--tx3);margin-left:auto;}
@media(max-width:768px){
  .filter-sub{flex-direction:column;align-items:stretch;}
  .filter-sub .form-control{max-width:100%;}
  .filter-sub .filter-count{margin-left:0;text-align:center;}
}
.hist-timeline{margin:12px 0;max-height:250px;overflow-y:auto;}
.hist-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-left:3px solid var(--pri);margin-bottom:6px;background:var(--bg3);border-radius:0 8px 8px 0;font-size:.84em;flex-wrap:wrap;}
.hist-item .hist-data{color:var(--tx3);font-size:.78em;min-width:80px;}
.hist-item .hist-vigencia{font-size:.72em;color:var(--inf2);background:rgba(9,132,227,.1);padding:2px 8px;border-radius:10px;}
.hist-item .hist-valor{font-weight:700;color:var(--pri2);}
.hist-item .hist-atual{color:var(--ok);font-weight:700;}
.hist-item .hist-diff{font-size:.75em;margin-left:auto;}
.hist-item .hist-diff.up{color:var(--dn2);}
.hist-item .hist-diff.down{color:var(--ok);}
.hist-item .hist-diff.zero{color:var(--tx3);}
.hist-orig{border-left-color:var(--tx3)!important;opacity:.6;}
.cat-row{display:grid;grid-template-columns:1fr 120px 120px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bg4);transition:background .15s;cursor:default;}
.cat-row:hover{background:var(--bg3);}
.cat-row-header{background:var(--bg3);font-size:.73em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;cursor:default;}
.cat-row-header:hover{background:var(--bg3);}
.cat-row .cat-name{font-weight:600;font-size:.88em;}
.cat-row .cat-val{font-weight:700;text-align:right;font-size:.9em;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background .15s;}
.cat-row .cat-val:hover{background:var(--bg4);}
.cat-row .cat-val.green{color:var(--ok);}
.cat-row .cat-val.red{color:var(--dn2);}
.cat-total-row{background:var(--bg3);font-weight:700;border-top:2px solid var(--bg4);}
.cat-total-row .cat-name{font-size:.9em;}
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
// HELPER: formatar mês BR
// ================================================================
var MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function nomeMesBR(mesAno){
  // "YYYY-MM" → "Mês YYYY"
  var p=mesAno.split('-');
  return MESES[parseInt(p[1])-1]+' '+p[0];
}

// ================================================================
// MODAL DE HISTÓRICO (compartilhado entre contratos e assinaturas)
// ================================================================
var modalHist=document.createElement('div');
modalHist.className='modal';
modalHist.id='modalHistorico';
modalHist.innerHTML='<div class="modal-content" style="max-width:500px">'+
  '<div class="modal-header"><h3 id="histTitle">&#128197; Histórico de Valores</h3>'+
  '<span class="modal-close" onclick="document.getElementById(\'modalHistorico\').classList.remove(\'show\')">&times;</span></div>'+
  '<div class="modal-body" id="histBody"></div></div>';
document.body.appendChild(modalHist);

window.abrirHistorico=function(tipo, itemId){
  // tipo = 'contrato' ou 'assinatura'
  var item;
  if(tipo==='contrato') item=S.contratos.find(function(c){return c.id===itemId;});
  else item=S.assinaturas.find(function(a){return a.id===itemId;});
  if(!item){toast('Item não encontrado','error');return;}

  var nome=item.desc||item.nome||'-';
  document.getElementById('histTitle').textContent='Histórico — '+nome;

  var html='<p style="margin-bottom:12px"><strong style="color:var(--tx)">'+nome+'</strong><br>'+
    '<span style="font-size:.82em;color:var(--tx3)">Valor atual: '+fmtV(item.valor)+'</span></p>';

  var hist=item.historicoValores||[];
  if(hist.length===0){
    html+='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhuma alteração de valor registrada.<br>'+
      '<span style="font-size:.78em">O histórico será gravado automaticamente quando você editar o valor.</span></p>';
  } else {
    html+='<div class="hist-timeline">';
    var sorted=hist.slice().sort(function(a,b){
      var da=a.vigenciaAPartir||a.data||'';
      var db=b.vigenciaAPartir||b.data||'';
      return db.localeCompare(da); // mais recente primeiro
    });
    sorted.forEach(function(h,i){
      var diff=h.valorNovo-h.valorAnterior;
      var diffClass=diff>0?'up':(diff<0?'down':'zero');
      var diffLabel=diff>0?'▲ +'+fmtV(Math.abs(diff)):(diff<0?'▼ -'+fmtV(Math.abs(diff)):'—');
      var isAtual=(i===0);
      var vigLabel='';
      if(h.vigenciaAPartir) vigLabel='<span class="hist-vigencia">a partir de '+nomeMesBR(h.vigenciaAPartir.substring(0,7))+'</span>';
      html+='<div class="hist-item">'+
        '<span class="hist-data">'+fmtD(h.data)+'</span>'+
        vigLabel+
        '<span>'+fmtV(h.valorAnterior)+' → </span>'+
        '<span class="'+(isAtual?'hist-atual':'hist-valor')+'">'+fmtV(h.valorNovo)+'</span>'+
        '<span class="hist-diff '+diffClass+'">'+diffLabel+'</span>'+
      '</div>';
    });
    // Valor original
    var primeiro=hist.sort(function(a,b){return (a.data||'').localeCompare(b.data||'');})[0];
    if(primeiro){
      html+='<div class="hist-item hist-orig">'+
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


// ================================================================
// 1. INTERCEPTAR EDIÇÃO DE CONTRATOS — registrar histórico + vigência
// ================================================================
(function(){
  var _origSave=window.saveEditContrato;
  if(!_origSave) return;
  window.saveEditContrato=function(){
    // Descobrir ID do contrato sendo editado
    // Tentar vários IDs possíveis do campo hidden
    var idEl=document.getElementById('editContId')||document.getElementById('editContratoId');
    var id=idEl?idEl.value:null;
    if(id){
      var cont=S.contratos.find(function(c){return c.id===id;});
      if(cont){
        // Tentar pegar novo valor de vários IDs possíveis
        var novoValorEl=document.getElementById('editContValor')||document.getElementById('editContratoValor');
        var novoValor=novoValorEl?parseFloat(String(novoValorEl.value).replace(/\./g,'').replace(',','.')):NaN;
        if(!isNaN(novoValor)){
          var valorAtual=Number(cont.valor)||0;
          if(Math.abs(novoValor-valorAtual)>0.01){
            if(!cont.historicoValores) cont.historicoValores=[];
            // Determinar vigência — se o form tem campo de vigência, usar; senão, usar a data de hoje
            var vigEl=document.getElementById('editContVigencia');
            var vigencia=vigEl?vigEl.value:'';
            if(!vigencia){
              // Usar o mês atual como vigência padrão
              var h=new Date();
              vigencia=h.getFullYear()+'-'+(h.getMonth()+1<10?'0':'')+(h.getMonth()+1);
            }
            cont.historicoValores.push({
              data: new Date().toISOString().slice(0,10),
              vigenciaAPartir: vigencia,
              valorAnterior: valorAtual,
              valorNovo: novoValor
            });
          }
        }
      }
    }
    _origSave();
  };
})();


// ================================================================
// 2. INTERCEPTAR EDIÇÃO DE ASSINATURAS — registrar histórico + vigência
// ================================================================
(function(){
  var _origSave=window.saveEditSub;
  if(!_origSave) return;
  window.saveEditSub=function(){
    var idEl=document.getElementById('editSubId')||document.getElementById('editAssinaturaId');
    var id=idEl?idEl.value:null;
    if(id){
      var sub=S.assinaturas.find(function(a){return a.id===id;});
      if(sub){
        var novoValorEl=document.getElementById('editSubValor')||document.getElementById('editAssinaturaValor');
        var novoValor=novoValorEl?parseFloat(String(novoValorEl.value).replace(/\./g,'').replace(',','.')):NaN;
        if(!isNaN(novoValor)){
          var valorAtual=Number(sub.valor)||0;
          if(Math.abs(novoValor-valorAtual)>0.01){
            if(!sub.historicoValores) sub.historicoValores=[];
            var vigEl=document.getElementById('editSubVigencia');
            var vigencia=vigEl?vigEl.value:'';
            if(!vigencia){
              var h=new Date();
              vigencia=h.getFullYear()+'-'+(h.getMonth()+1<10?'0':'')+(h.getMonth()+1);
            }
            sub.historicoValores.push({
              data: new Date().toISOString().slice(0,10),
              vigenciaAPartir: vigencia,
              valorAnterior: valorAtual,
              valorNovo: novoValor
            });
          }
        }
      }
    }
    _origSave();
  };
})();


// ================================================================
// 3. FILTROS EM ASSINATURAS + botão Histórico
// ================================================================
(function(){
  var pg=document.getElementById('pg-assinaturas');
  if(!pg) return;

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

  function povoarFiltrosSubs(){
    var selCart=document.getElementById('fSubCartao');
    var selCat=document.getElementById('fSubCat');
    if(!selCart||!selCat) return;
    var cartVal=selCart.value||lerFiltro('subCartao','');
    var catVal=selCat.value||lerFiltro('subCat','');
    selCart.innerHTML='<option value="">Todos os cartões</option>';
    selCat.innerHTML='<option value="">Todas as categorias</option>';
    if(S.cartoes) S.cartoes.forEach(function(c){ selCart.innerHTML+='<option value="'+c.id+'">'+c.nome+'</option>'; });
    var cats={};
    if(S.assinaturas) S.assinaturas.forEach(function(a){ if(a.categoria) cats[a.categoria]=1; });
    Object.keys(cats).sort().forEach(function(c){ selCat.innerHTML+='<option value="'+c+'">'+c+'</option>'; });
    selCart.value=cartVal; selCat.value=catVal;
    var buscaEl=document.getElementById('fSubBusca');
    if(buscaEl&&!buscaEl.value) buscaEl.value=lerFiltro('subBusca','');
  }

  var _origRenderSubs=window.renderSubs;
  window.renderSubs=function(){
    _origRenderSubs();
    povoarFiltrosSubs();

    // Adicionar botão Histórico em cada assinatura
    var subGrid=document.getElementById('subGrid');
    if(subGrid){
      subGrid.querySelectorAll('.sub-box').forEach(function(box){
        var actions=box.querySelector('.sub-box-actions');
        if(!actions||actions.querySelector('.btn-hist')) return;
        var editBtn=actions.querySelector('[onclick*="editSub"]');
        if(!editBtn) return;
        var match=editBtn.getAttribute('onclick').match(/editSub\(['"](.+?)['"]\)/);
        if(!match) return;
        var subId=match[1];
        var btn=document.createElement('button');
        btn.className='btn btn-sm btn-outline btn-hist';
        btn.innerHTML='&#128197; Histórico';
        btn.title='Ver histórico de valores';
        btn.onclick=function(){ abrirHistorico('assinatura',subId); };
        actions.appendChild(btn);
      });
    }

    filtrarSubs();
  };

  window.filtrarSubs=function(){
    var cartFiltro=document.getElementById('fSubCartao').value;
    var catFiltro=document.getElementById('fSubCat').value;
    var busca=(document.getElementById('fSubBusca').value||'').toLowerCase();
    salvarFiltro('subCartao',cartFiltro);
    salvarFiltro('subCat',catFiltro);
    salvarFiltro('subBusca',busca);
    var subGrid=document.getElementById('subGrid');
    if(!subGrid) return;
    var boxes=subGrid.querySelectorAll('.sub-box');
    var total=0,visivel=0;
    boxes.forEach(function(box){
      total++;
      var texto=box.textContent.toLowerCase();
      var cartOk=true,catOk=true,buscaOk=true;
      if(cartFiltro){
        var cart=S.cartoes.find(function(c){return c.id===cartFiltro;});
        cartOk=cart?texto.indexOf(cart.nome.toLowerCase())>=0:false;
      }
      if(catFiltro) catOk=texto.indexOf(catFiltro.toLowerCase())>=0;
      if(busca) buscaOk=texto.indexOf(busca)>=0;
      box.style.display=(cartOk&&catOk&&buscaOk)?'':'none';
      if(cartOk&&catOk&&buscaOk) visivel++;
    });
    document.getElementById('fSubCount').textContent=visivel+' de '+total+' assinatura(s)';
  };
})();


// ================================================================
// 4. FILTROS EM CONTRATOS + botão Histórico
// ================================================================
(function(){
  var pg=document.getElementById('pg-contratos');
  if(!pg) return;

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
    var catVal=selCat.value||lerFiltro('contCat','');
    selCat.innerHTML='<option value="">Todas as categorias</option>';
    var cats={};
    if(S.contratos) S.contratos.forEach(function(c){ if(c.categoria) cats[c.categoria]=1; });
    Object.keys(cats).sort().forEach(function(c){ selCat.innerHTML+='<option value="'+c+'">'+c+'</option>'; });
    selCat.value=catVal;
    var tipoEl=document.getElementById('fContTipo');
    if(tipoEl&&!tipoEl._restored){tipoEl.value=lerFiltro('contTipo','');tipoEl._restored=true;}
    var buscaEl=document.getElementById('fContBusca');
    if(buscaEl&&!buscaEl.value) buscaEl.value=lerFiltro('contBusca','');
  }

  var _origRenderContratos=window.renderContratos;
  window.renderContratos=function(){
    _origRenderContratos();
    povoarFiltrosContratos();

    // Adicionar botão Histórico
    var contGrid=document.getElementById('contGrid');
    if(contGrid){
      contGrid.querySelectorAll('.sub-box').forEach(function(box){
        var actions=box.querySelector('.sub-box-actions');
        if(!actions||actions.querySelector('.btn-hist')) return;
        var editBtn=actions.querySelector('[onclick*="editContrato"]');
        if(!editBtn) return;
        var match=editBtn.getAttribute('onclick').match(/editContrato\(['"](.+?)['"]\)/);
        if(!match) return;
        var contId=match[1];
        var btn=document.createElement('button');
        btn.className='btn btn-sm btn-outline btn-hist';
        btn.innerHTML='&#128197; Histórico';
        btn.title='Ver histórico de valores';
        btn.onclick=function(){ abrirHistorico('contrato',contId); };
        actions.appendChild(btn);
      });
    }

    filtrarContratos();
  };

  window.filtrarContratos=function(){
    var tipoFiltro=document.getElementById('fContTipo').value;
    var catFiltro=document.getElementById('fContCat').value;
    var busca=(document.getElementById('fContBusca').value||'').toLowerCase();
    salvarFiltro('contTipo',tipoFiltro);
    salvarFiltro('contCat',catFiltro);
    salvarFiltro('contBusca',busca);
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
      box.style.display=(tipoOk&&catOk&&buscaOk)?'':'none';
      if(tipoOk&&catOk&&buscaOk) visivel++;
    });
    document.getElementById('fContCount').textContent=visivel+' de '+total+' contrato(s)';
  };
})();


// ================================================================
// 5. PERSISTIR FILTROS DO EXTRATO ORIGINAL
// ================================================================
(function(){
  var _origRenderExtrato=window.renderExtrato;
  if(!_origRenderExtrato) return;

  // Restaurar filtros ao carregar
  setTimeout(function(){
    var de=document.getElementById('extDe');
    var ate=document.getElementById('extAte');
    var tipo=document.getElementById('extTipo');
    var cat=document.getElementById('extCat');
    if(de&&lerFiltro('extDe','')) de.value=lerFiltro('extDe','');
    if(ate&&lerFiltro('extAte','')) ate.value=lerFiltro('extAte','');
    if(tipo&&lerFiltro('extTipo','')) tipo.value=lerFiltro('extTipo','');
    // cat precisa ser restaurada depois do render
  },200);

  window.renderExtrato=function(){
    // Salvar filtros antes de renderizar
    var de=document.getElementById('extDe');
    var ate=document.getElementById('extAte');
    var tipo=document.getElementById('extTipo');
    var cat=document.getElementById('extCat');
    if(de) salvarFiltro('extDe',de.value);
    if(ate) salvarFiltro('extAte',ate.value);
    if(tipo) salvarFiltro('extTipo',tipo.value);
    if(cat) salvarFiltro('extCat',cat.value);
    _origRenderExtrato();
  };
})();

// Persistir filtros do balancete
(function(){
  setTimeout(function(){
    var de=document.getElementById('balDe');
    var ate=document.getElementById('balAte');
    if(de&&lerFiltro('balDe','')) de.value=lerFiltro('balDe','');
    if(ate&&lerFiltro('balAte','')) ate.value=lerFiltro('balAte','');
  },200);

  var _origRenderBal=window.renderBalancete;
  if(!_origRenderBal) return;
  window.renderBalancete=function(){
    var de=document.getElementById('balDe');
    var ate=document.getElementById('balAte');
    if(de) salvarFiltro('balDe',de.value);
    if(ate) salvarFiltro('balAte',ate.value);
    _origRenderBal();
  };
})();


// ================================================================
// 6. EXTRATO POR CATEGORIA COM COMPARAÇÃO (valores vigentes)
// ================================================================
(function(){
  var sidebar=document.getElementById('sidebar');
  if(!sidebar) return;
  var extLink=document.getElementById('nav-extrato');
  if(!extLink) return;

  var newLink=document.createElement('a');
  newLink.id='nav-extratoCat';
  newLink.onclick=function(){nav('extratoCat');};
  newLink.innerHTML='<span>&#128202; Extrato Categorizado</span>';
  extLink.parentNode.insertBefore(newLink,extLink.nextSibling);

  var mainDiv=document.querySelector('.main');
  if(!mainDiv) return;

  var pgDiv=document.createElement('div');
  pgDiv.className='page';
  pgDiv.id='pg-extratoCat';
  pgDiv.innerHTML=
    '<h2 class="page-title">&#128202; Extrato por Categoria</h2>'+
    '<div class="month-nav"><button class="btn btn-outline" onclick="chgECM(-1)">&#9664;</button>'+
    '<span class="mes-label" id="ecMesLabel"></span>'+
    '<button class="btn btn-outline" onclick="chgECM(1)">&#9654;</button></div>'+
    '<div id="ecArea"></div>'+
    '<div class="comp-container" id="ecCompContainer">'+
    '<div class="comp-header"><label>&#128200; Comparar com:</label>'+
    '<input type="month" id="ecCompMes" class="form-control" style="max-width:180px" onchange="renderExtratoCat()">'+
    '<button class="btn btn-sm btn-outline" onclick="document.getElementById(\'ecCompMes\').value=\'\';renderExtratoCat()">Limpar</button></div>'+
    '<div id="ecCompArea"></div></div>';
  mainDiv.appendChild(pgDiv);

  var ecMes=new Date();
  ecMes.setDate(1);
  // Restaurar mês salvo
  var savedECMes=lerFiltro('ecMes','');
  if(savedECMes){
    var p=savedECMes.split('-');
    ecMes=new Date(parseInt(p[0]),parseInt(p[1])-1,1);
  }

  function ecMesStr(d){ return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1); }

  window.chgECM=function(dir){
    ecMes.setMonth(ecMes.getMonth()+dir);
    salvarFiltro('ecMes',ecMesStr(ecMes));
    renderExtratoCat();
  };

  // Pegar lançamentos de um mês COM valores vigentes
  function getEntriesMes(mesStr){
    var entries=[];
    if(S.lancamentos) S.lancamentos.forEach(function(l){
      if(l.data&&l.data.substring(0,7)===mesStr) entries.push(l);
    });
    // Contratos — usar valor vigente no mês
    if(S.contratos) S.contratos.forEach(function(c){
      if(!c.inicio) return;
      var ym=mesStr.split('-');var y=parseInt(ym[0]),m=parseInt(ym[1]);
      var inicioYM=c.inicio.split('-');var iy=parseInt(inicioYM[0]),im=parseInt(inicioYM[1]);
      if(y*100+m>=iy*100+im){
        var val=valorVigente(c,mesStr);
        entries.push({
          data:mesStr+'-'+((c.diaVencimento||1)<10?'0':'')+(c.diaVencimento||1),
          tipo:c.tipo||'despesa', desc:c.desc, cat:c.categoria||'',
          valor:val, origem:'Contrato'
        });
      }
    });
    // Assinaturas — usar valor vigente no mês
    if(S.assinaturas) S.assinaturas.forEach(function(a){
      if(!a.inicio) return;
      var ym=mesStr.split('-');var y=parseInt(ym[0]),m=parseInt(ym[1]);
      var inicioYM=a.inicio.split('-');var iy=parseInt(inicioYM[0]),im=parseInt(inicioYM[1]);
      if(y*100+m>=iy*100+im){
        var val=valorVigente(a,mesStr);
        entries.push({
          data:mesStr+'-01',
          tipo:'despesa', desc:a.nome||a.desc, cat:a.categoria||'',
          valor:val, origem:'Assinatura'
        });
      }
    });
    return entries;
  }

  function agrupar(entries){
    var receitas={},despesas={};
    entries.forEach(function(e){
      var cat=e.cat||e.categoria||'Sem categoria';
      var tipo=e.tipo||'despesa';
      var val=Number(e.valor)||0;
      if(tipo==='receita'){
        if(!receitas[cat]) receitas[cat]={total:0,items:[]};
        receitas[cat].total+=val; receitas[cat].items.push(e);
      } else {
        if(!despesas[cat]) despesas[cat]={total:0,items:[]};
        despesas[cat].total+=val; despesas[cat].items.push(e);
      }
    });
    return {receitas:receitas,despesas:despesas};
  }

  // Modal detalhes
  var modalDet=document.createElement('div');
  modalDet.className='modal';
  modalDet.id='modalDetCategoria';
  modalDet.innerHTML='<div class="modal-content" style="max-width:540px">'+
    '<div class="modal-header"><h3 id="detCatTitle">Detalhes</h3>'+
    '<span class="modal-close" onclick="document.getElementById(\'modalDetCategoria\').classList.remove(\'show\')">&times;</span></div>'+
    '<div class="modal-body" id="detCatBody"></div></div>';
  document.body.appendChild(modalDet);

  window.abrirDetCategoria=function(cat,tipo,mesStr){
    var entries=getEntriesMes(mesStr);
    var filtrados=entries.filter(function(e){
      return (e.cat||e.categoria||'Sem categoria')===cat && (e.tipo||'despesa')===tipo;
    });
    filtrados.sort(function(a,b){return a.data.localeCompare(b.data);});
    var total=filtrados.reduce(function(a,e){return a+(Number(e.valor)||0);},0);
    var corTotal=tipo==='receita'?'var(--ok)':'var(--dn2)';

    document.getElementById('detCatTitle').textContent=cat+' — '+(tipo==='receita'?'Receitas':'Despesas')+' — '+nomeMesBR(mesStr);

    var html='<div class="det-list">';
    if(!filtrados.length){
      html+='<p style="color:var(--tx3);text-align:center;padding:20px">Nenhum lançamento</p>';
    } else {
      filtrados.forEach(function(e){
        var cor=tipo==='receita'?'color:var(--ok)':'color:var(--dn2)';
        html+='<div class="det-item"><span class="det-data">'+fmtD(e.data)+'</span>'+
          '<span class="det-desc">'+(e.desc||'-')+'</span>'+
          '<span class="det-origem">'+(e.origem||'Manual')+'</span>'+
          '<span class="det-val" style="'+cor+'">'+fmtV(e.valor)+'</span></div>';
      });
    }
    html+='</div><div class="det-total" style="color:'+corTotal+'">Total: '+fmtV(total)+'</div>';
    document.getElementById('detCatBody').innerHTML=html;
    document.getElementById('modalDetCategoria').classList.add('show');
  };

  window.renderExtratoCat=function(){
    document.getElementById('ecMesLabel').textContent=nomeMesBR(ecMesStr(ecMes));
    var mesStr=ecMesStr(ecMes);
    var entries=getEntriesMes(mesStr);
    var grupos=agrupar(entries);

    var html='<div class="chart-box" style="padding:0;overflow:hidden">';
    html+='<div class="cat-row cat-row-header"><span>Categoria</span><span style="text-align:right">Receita</span><span style="text-align:right">Despesa</span></div>';

    var allCats={};
    Object.keys(grupos.receitas).forEach(function(c){allCats[c]=1;});
    Object.keys(grupos.despesas).forEach(function(c){allCats[c]=1;});
    var catList=Object.keys(allCats).sort();
    var totalRec=0,totalDesp=0;

    if(!catList.length){
      html+='<div style="padding:30px;text-align:center;color:var(--tx3)">Nenhum lançamento neste mês</div>';
    } else {
      catList.forEach(function(cat){
        var rec=(grupos.receitas[cat]||{}).total||0;
        var desp=(grupos.despesas[cat]||{}).total||0;
        totalRec+=rec; totalDesp+=desp;
        var esc=cat.replace(/'/g,"\\'");
        var recClick=rec>0?'onclick="abrirDetCategoria(\''+esc+'\',\'receita\',\''+mesStr+'\')" style="cursor:pointer"':'';
        var despClick=desp>0?'onclick="abrirDetCategoria(\''+esc+'\',\'despesa\',\''+mesStr+'\')" style="cursor:pointer"':'';
        html+='<div class="cat-row"><span class="cat-name">'+cat+'</span>'+
          '<span class="cat-val green" '+recClick+'>'+(rec>0?fmtV(rec):'-')+'</span>'+
          '<span class="cat-val red" '+despClick+'>'+(desp>0?fmtV(desp):'-')+'</span></div>';
      });
      html+='<div class="cat-row cat-total-row"><span class="cat-name">TOTAL</span>'+
        '<span class="cat-val green">'+fmtV(totalRec)+'</span>'+
        '<span class="cat-val red">'+fmtV(totalDesp)+'</span></div>';
      var saldo=totalRec-totalDesp;
      html+='<div class="cat-row" style="border-top:2px solid var(--pri)"><span class="cat-name" style="color:var(--pri2)">SALDO</span><span></span>'+
        '<span class="cat-val '+(saldo>=0?'green':'red')+'">'+fmtV(Math.abs(saldo))+(saldo<0?' (déficit)':'')+'</span></div>';
    }
    html+='</div>';
    document.getElementById('ecArea').innerHTML=html;

    // COMPARAÇÃO
    var compMes=document.getElementById('ecCompMes').value;
    var compArea=document.getElementById('ecCompArea');
    if(!compMes){compArea.innerHTML='';return;}

    var compEntries=getEntriesMes(compMes);
    var compGrupos=agrupar(compEntries);
    var mesAtualLabel=nomeMesBR(mesStr);
    var compLabel=nomeMesBR(compMes);
    var mesAtualShort=mesAtualLabel.split(' ')[0];
    var compShort=compLabel.split(' ')[0];

    var allCatsComp={};
    Object.keys(grupos.receitas).forEach(function(c){allCatsComp[c]=1;});
    Object.keys(grupos.despesas).forEach(function(c){allCatsComp[c]=1;});
    Object.keys(compGrupos.receitas).forEach(function(c){allCatsComp[c]=1;});
    Object.keys(compGrupos.despesas).forEach(function(c){allCatsComp[c]=1;});
    var allCatsList=Object.keys(allCatsComp).sort();

    var ch='<div class="chart-box" style="padding:0;overflow:hidden;margin-top:16px">';
    ch+='<div style="padding:14px 16px;border-bottom:2px solid var(--bg4);font-weight:700;font-size:.9em;color:var(--pri2)">&#128200; '+mesAtualLabel+' vs '+compLabel+'</div>';

    // Despesas
    ch+='<div class="comp-section-title" style="color:var(--dn2)">Despesas</div>';
    ch+='<div class="comp-row comp-row-header"><span>Categoria</span><span style="text-align:right">'+mesAtualShort+'</span><span style="text-align:right">'+compShort+'</span><span style="text-align:right">Diferença</span></div>';
    var tdA=0,tdC=0;
    allCatsList.forEach(function(cat){
      var a=(grupos.despesas[cat]||{}).total||0;
      var c=(compGrupos.despesas[cat]||{}).total||0;
      if(!a&&!c) return;
      tdA+=a;tdC+=c;
      var d=a-c;var dc=d>0?'up':(d<0?'down':'zero');
      var dl=d>0?'▲ +'+fmtV(d):(d<0?'▼ '+fmtV(d):'-');
      ch+='<div class="comp-row"><span>'+cat+'</span><span class="comp-val" style="color:var(--dn2)">'+(a?fmtV(a):'-')+'</span><span class="comp-val" style="color:var(--dn2)">'+(c?fmtV(c):'-')+'</span><span class="comp-diff '+dc+'">'+dl+'</span></div>';
    });
    var dd=tdA-tdC;var ddc=dd>0?'up':(dd<0?'down':'zero');var ddl=dd>0?'▲ +'+fmtV(dd):(dd<0?'▼ '+fmtV(dd):'-');
    ch+='<div class="comp-row comp-total-row"><span>TOTAL DESPESAS</span><span class="comp-val" style="color:var(--dn2)">'+fmtV(tdA)+'</span><span class="comp-val" style="color:var(--dn2)">'+fmtV(tdC)+'</span><span class="comp-diff '+ddc+'">'+ddl+'</span></div>';

    // Receitas
    ch+='<div class="comp-section-title" style="color:var(--ok)">Receitas</div>';
    ch+='<div class="comp-row comp-row-header"><span>Categoria</span><span style="text-align:right">'+mesAtualShort+'</span><span style="text-align:right">'+compShort+'</span><span style="text-align:right">Diferença</span></div>';
    var trA=0,trC=0;
    allCatsList.forEach(function(cat){
      var a=(grupos.receitas[cat]||{}).total||0;
      var c=(compGrupos.receitas[cat]||{}).total||0;
      if(!a&&!c) return;
      trA+=a;trC+=c;
      var d=a-c;var dc=d>0?'down':(d<0?'up':'zero');
      var dl=d>0?'▲ +'+fmtV(d):(d<0?'▼ '+fmtV(d):'-');
      ch+='<div class="comp-row"><span>'+cat+'</span><span class="comp-val" style="color:var(--ok)">'+(a?fmtV(a):'-')+'</span><span class="comp-val" style="color:var(--ok)">'+(c?fmtV(c):'-')+'</span><span class="comp-diff '+dc+'">'+dl+'</span></div>';
    });
    var dr=trA-trC;var drc=dr>0?'down':(dr<0?'up':'zero');var drl=dr>0?'▲ +'+fmtV(dr):(dr<0?'▼ '+fmtV(dr):'-');
    ch+='<div class="comp-row comp-total-row"><span>TOTAL RECEITAS</span><span class="comp-val" style="color:var(--ok)">'+fmtV(trA)+'</span><span class="comp-val" style="color:var(--ok)">'+fmtV(trC)+'</span><span class="comp-diff '+drc+'">'+drl+'</span></div>';
    ch+='</div>';
    compArea.innerHTML=ch;
  };

  // Registrar nova página na navegação
  var _origNav=window.nav;
  window.nav=function(pg){
    _origNav(pg);
    var el=document.getElementById('nav-extratoCat');
    if(el){el.classList[pg==='extratoCat'?'add':'remove']('active');}
    var pgEl=document.getElementById('pg-extratoCat');
    if(pgEl){
      if(pg==='extratoCat'){pgEl.classList.add('active');renderExtratoCat();}
      else pgEl.classList.remove('active');
    }
  };
})();


// ================================================================
// 7. FORÇAR DATAS BR EM TODOS OS INPUTS type="date" ao exibir
// ================================================================
// Os inputs nativos usam o formato do sistema, mas podemos garantir
// que qualquer fmtD() no código sempre retorne dd/mm/aaaa
// (já feito no override do fmtD acima)


console.log('[Financeiro Pro] Melhorias v2 carregadas.');
})();

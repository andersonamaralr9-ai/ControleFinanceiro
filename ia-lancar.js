// ia-lancar.js v1 — Lançar por foto ou texto (fase 7b do PLANO-MIGRACAO.md)
// ------------------------------------------------------------------------
// Aba "Lançar" do Assistente. O usuário escreve ("almoço 45,90 no débito") e/ou
// manda a foto de um cupom; /api/extrair só PROPÕE os itens. Cada item aparece
// editável e NADA é gravado até o usuário clicar em "Lançar": aí o app grava
// pelo mesmo formato do addLanc/addCompra do index.html e chama salvar(), que
// sincroniza como qualquer lançamento manual. Toast com Desfazer.
//
// Depende de ia.js (montarTela cria #iaModoLancar e chama iaMontarLancar).
(function(){
'use strict';
if(!window.NUVEM_ATIVA)return;

var foto=null;       // {media_type, data(base64), url(prévia)}
var itens=[];        // propostas em revisão
var aviso='',lendo=false;

function el(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function v2(n){return (Number(n)||0).toFixed(2).replace('.',',');}

function catsDe(destino,tipo){
  if(destino==='cartao')return (S.cats.compra&&S.cats.compra.length?S.cats.compra:S.cats.despesa)||[];
  return (S.cats&&S.cats[tipo])||[];
}
function cartoes(){return (S.cartoes||[]).filter(function(c){return c&&c.id;});}

// ---------------------------------------------------------------- foto
// Reduz para no máximo 1600 px no maior lado (JPEG 0,85): cabe no limite de
// corpo da Vercel e custa poucos tokens, sem perder a leitura do cupom.
function reduzir(arquivo){
  return new Promise(function(ok,falha){
    var url=URL.createObjectURL(arquivo),img=new Image();
    img.onload=function(){
      var max=1600,w=img.naturalWidth,h=img.naturalHeight,k=Math.min(1,max/Math.max(w,h));
      var cv=document.createElement('canvas');cv.width=Math.round(w*k);cv.height=Math.round(h*k);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      var dataUrl=cv.toDataURL('image/jpeg',0.85);URL.revokeObjectURL(url);
      ok({media_type:'image/jpeg',data:dataUrl.split(',')[1],url:dataUrl});
    };
    img.onerror=function(){URL.revokeObjectURL(url);falha(new Error('Não consegui abrir essa imagem.'));};
    img.src=url;
  });
}

// ---------------------------------------------------------------- tela
function montar(caixa){
  caixa.innerHTML=
    '<form class="il-form" id="ilForm">'+
      '<label for="ilTexto" class="ia-oculto">O que lançar</label>'+
      '<textarea id="ilTexto" class="form-control" rows="2" placeholder="Ex.: almoço 45,90 no débito; mercado 230 no cartão em 3x"></textarea>'+
      '<div class="il-acoes">'+
        '<label class="btn btn-sm btn-outline il-foto-btn"><input type="file" id="ilFoto" accept="image/*" class="ia-oculto">Foto do cupom</label>'+
        '<span id="ilFotoPrevia" class="il-foto-previa"></span>'+
        '<button type="submit" class="btn btn-primary" id="ilLer">Ler</button>'+
      '</div>'+
    '</form>'+
    '<div id="ilRevisao" aria-live="polite"></div>';
  el('ilForm').addEventListener('submit',function(e){e.preventDefault();ler();});
  el('ilFoto').addEventListener('change',async function(){
    var f=this.files&&this.files[0];this.value='';if(!f)return;
    try{foto=await reduzir(f);}catch(e){foto=null;toast(e.message,'error');}
    renderFoto();
  });
  el('ilFotoPrevia').addEventListener('click',function(e){if(e.target.closest('.il-foto-tirar')){foto=null;renderFoto();}});
  var rev=el('ilRevisao');
  rev.addEventListener('change',function(e){
    var card=e.target.closest('[data-i]');if(!card)return;var i=+card.dataset.i,it=itens[i];if(!it)return;
    var campo=e.target.dataset.campo;if(!campo)return;
    it[campo]=e.target.type==='checkbox'?e.target.checked:e.target.value;
    if(campo==='destino'||campo==='tipo'){
      if(it.destino==='cartao')it.tipo='despesa';
      var lista=catsDe(it.destino,it.tipo);if(lista.indexOf(it.categoria)<0)it.categoria=lista[0]||'';
      renderRevisao();
    }
    if(campo==='incluir'){renderRevisao();var c=document.querySelector('#ilRevisao [data-i="'+i+'"] [data-campo="incluir"]');if(c)c.focus();}
  });
  rev.addEventListener('click',function(e){
    if(e.target.closest('#ilGravar'))gravar();
    if(e.target.closest('#ilDescartar')){itens=[];aviso='';renderRevisao();}
  });
  renderFoto();renderRevisao();
}

function renderFoto(){
  var p=el('ilFotoPrevia');if(!p)return;
  p.innerHTML=foto?'<img src="'+foto.url+'" alt="Foto escolhida"><button type="button" class="il-foto-tirar" aria-label="Tirar a foto">×</button>':'';
}

function opcoes(lista,atual){
  return lista.map(function(x){return '<option'+(x===atual?' selected':'')+'>'+esc(x)+'</option>';}).join('');
}

function renderRevisao(){
  var r=el('ilRevisao');if(!r)return;
  if(lendo){r.innerHTML='<p class="il-lendo">Lendo…</p>';return;}
  if(!itens.length){
    r.innerHTML=aviso?'<p class="il-aviso">'+esc(aviso)+'</p>':
      '<p class="ia-vazio">Escreva o gasto ou mande a foto do cupom. Você revisa tudo antes de gravar.</p>';
    return;
  }
  var cs=cartoes(),marcados=itens.filter(function(it){return it.incluir;}).length;
  r.innerHTML=(aviso?'<p class="il-aviso">'+esc(aviso)+'</p>':'')+
    itens.map(function(it,i){
      var cartao=it.destino==='cartao',id='il'+i;
      return '<fieldset class="il-item'+(it.incluir?'':' il-fora')+'" data-i="'+i+'"><legend class="ia-oculto">Item '+(i+1)+'</legend>'+
        '<label class="il-incluir"><input type="checkbox" data-campo="incluir"'+(it.incluir?' checked':'')+'> Lançar este</label>'+
        '<div class="il-grade">'+
          '<div class="form-group"><label for="'+id+'d">Onde</label><select id="'+id+'d" class="form-control" data-campo="destino">'+
            '<option value="lancamento"'+(cartao?'':' selected')+'>Lançamento</option><option value="cartao"'+(cartao?' selected':'')+'>Cartão de crédito</option></select></div>'+
          (cartao?'':'<div class="form-group"><label for="'+id+'t">Tipo</label><select id="'+id+'t" class="form-control" data-campo="tipo">'+
            '<option value="despesa"'+(it.tipo==='despesa'?' selected':'')+'>Despesa</option><option value="receita"'+(it.tipo==='receita'?' selected':'')+'>Receita</option></select></div>')+
          '<div class="form-group il-larga"><label for="'+id+'s">Descrição</label><input id="'+id+'s" class="form-control" data-campo="descricao" value="'+esc(it.descricao)+'"></div>'+
          '<div class="form-group"><label for="'+id+'c">Categoria</label><select id="'+id+'c" class="form-control" data-campo="categoria">'+opcoes(catsDe(it.destino,it.tipo),it.categoria)+'</select></div>'+
          '<div class="form-group"><label for="'+id+'v">Valor'+(cartao&&+it.parcelas>1?' total':'')+' (R$)</label><input id="'+id+'v" class="form-control" inputmode="decimal" data-campo="valor" value="'+esc(it.valor)+'"></div>'+
          '<div class="form-group"><label for="'+id+'a">Data</label><input id="'+id+'a" type="date" class="form-control" data-campo="data" value="'+esc(it.data)+'"></div>'+
          (cartao?'<div class="form-group"><label for="'+id+'k">Cartão</label><select id="'+id+'k" class="form-control" data-campo="cartaoId">'+
              '<option value="">Escolha…</option>'+cs.map(function(c){return '<option value="'+esc(c.id)+'"'+(c.id===it.cartaoId?' selected':'')+'>'+esc(c.nome||c.id)+'</option>';}).join('')+'</select></div>'+
            '<div class="form-group"><label for="'+id+'p">Parcelas</label><input id="'+id+'p" type="number" min="1" max="48" class="form-control" data-campo="parcelas" value="'+esc(it.parcelas)+'"></div>':'')+
        '</div></fieldset>';
    }).join('')+
    '<div class="il-fim"><button type="button" class="btn btn-primary" id="ilGravar"'+(marcados?'':' disabled')+'>Lançar '+marcados+(marcados===1?' item':' itens')+'</button>'+
    '<button type="button" class="btn btn-outline" id="ilDescartar">Descartar</button></div>';
}

// ---------------------------------------------------------------- ler
async function ler(){
  var texto=(el('ilTexto').value||'').trim();
  if(lendo)return;
  if(!texto&&!foto){toast('Escreva o gasto ou escolha uma foto.','error');return;}
  if(!navigator.onLine){toast('Sem internet: ler com IA precisa de conexão.','error');return;}
  lendo=true;aviso='';itens=[];renderRevisao();el('ilLer').disabled=true;
  try{
    var token=window.nuvemToken?await window.nuvemToken():null;
    if(!token)throw new Error('Entre de novo para usar.');
    var cs=cartoes();
    var r=await fetch('/api/extrair',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({texto:texto,imagem:foto?{media_type:foto.media_type,data:foto.data}:null,
        contexto:{hoje:hojeStr(),categorias:{despesa:S.cats.despesa||[],receita:S.cats.receita||[],compra:S.cats.compra||[]},cartoes:cs.map(function(c){return c.nome||c.id;})}})});
    var j=null;try{j=await r.json();}catch(e){}
    if(!r.ok)throw new Error((j&&j.erro)||('Erro '+r.status));
    aviso=j.aviso||'';
    itens=(j.itens||[]).map(function(it){
      var c=it.destino==='cartao'?cs.find(function(x){return (x.nome||x.id)===it.cartao;}):null;
      var lista=catsDe(it.destino,it.tipo);
      return {incluir:true,destino:it.destino,tipo:it.tipo,descricao:it.descricao,
        categoria:lista.indexOf(it.categoria)>=0?it.categoria:(lista[0]||''),
        valor:v2(it.valor),data:it.data||hojeStr(),cartaoId:c?c.id:'',parcelas:it.parcelas||1};
    });
    if(!itens.length&&!aviso)aviso='Não encontrei nada para lançar.';
    if(itens.length){el('ilTexto').value='';foto=null;renderFoto();}
    if(j.uso&&typeof window.iaAtualizarSaldo==='function')window.iaAtualizarSaldo();
  }catch(e){
    toast('Lançar com IA: '+((e&&e.message)||'falha'),'error');
  }
  lendo=false;el('ilLer').disabled=false;renderRevisao();
}

// ---------------------------------------------------------------- gravar
function gravar(){
  var marc=itens.filter(function(it){return it.incluir;});
  for(var k=0;k<marc.length;k++){
    var it=marc[k],n=k+1;
    if(!String(it.descricao||'').trim())return toast('Item '+n+': falta a descrição.','error');
    if(!(parseN(it.valor)>0))return toast('Item '+n+': valor inválido.','error');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(it.data))return toast('Item '+n+': falta a data.','error');
    if(it.destino==='cartao'&&!it.cartaoId)return toast('Item '+n+': escolha o cartão.','error');
  }
  var novos=[];
  marc.forEach(function(it){
    var id=uid(),valor=parseN(it.valor),desc=String(it.descricao).trim();
    if(it.destino==='cartao'){
      S.comprasCartao.push({id:id,cartaoId:it.cartaoId,desc:desc,categoria:it.categoria,valor:valor,data:it.data,parcelas:Math.min(48,Math.max(1,parseInt(it.parcelas,10)||1))});
      novos.push({col:'comprasCartao',id:id});
    }else{
      S.lancamentos.push({id:id,tipo:it.tipo==='receita'?'receita':'despesa',desc:desc,categoria:it.categoria,valor:valor,data:it.data,status:'confirmado',obs:'Lançado com IA'});
      novos.push({col:'lancamentos',id:id});
    }
  });
  salvar();
  itens=[];aviso='';renderRevisao();
  toast(novos.length+(novos.length===1?' item lançado.':' itens lançados.'),'success',{acao:'Desfazer',onAcao:function(){
    novos.forEach(function(x){markDeleted(x.id);S[x.col]=S[x.col].filter(function(y){return y.id!==x.id;});});
    salvar();toast('Desfeito.','info');
  }});
}

window.iaMontarLancar=montar;
})();

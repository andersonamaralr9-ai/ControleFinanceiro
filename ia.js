// ia.js v1 — Assistente de análise (fase 7a do PLANO-MIGRACAO.md)
// ------------------------------------------------------------------------
// Tela "Assistente": perguntas em português sobre os seus dados. SÓ LEITURA:
// o servidor (api/chat.js) não tem nenhuma ferramenta de escrita.
//
// O retrato enviado é montado AQUI, com as mesmas funções das telas
// (window.allEntries = lançamentos + parcelas do cartão + assinaturas +
// contratos com valor vigente). Assim os totais que o assistente cita são os
// mesmos do Resumo — ele não precisa refazer regra de negócio nenhuma.
//
// Só aparece com a nuvem nova ligada (precisa da sessão do Supabase).
(function(){
'use strict';
if(!window.NUVEM_ATIVA)return;

var conversa=[];   // [{role, content}] da sessão atual (não é salvo)
var ocupado=false;

function el(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function n2(v){return (Math.round((Number(v)||0)*100)/100).toFixed(2);}
function mesMais(m,k){var a=+m.slice(0,4),b=+m.slice(5,7)-1+k;a+=Math.floor(b/12);b=((b%12)+12)%12;return a+'-'+String(b+1).padStart(2,'0');}

// ---------------------------------------------------------------- retrato
function intervaloMeses(){
  var ms=[];
  (S.lancamentos||[]).forEach(function(l){if(l&&l.data)ms.push(String(l.data).slice(0,7));});
  (S.comprasCartao||[]).forEach(function(c){if(c&&c.data)ms.push(String(c.data).slice(0,7));});
  var hoje=new Date().toISOString().slice(0,7);ms.push(hoje);
  ms.sort();
  var ini=ms[0],fim=mesMais(hoje,3),out=[];
  for(var m=ini;m<=fim&&out.length<60;m=mesMais(m,1))out.push(m);
  return out;
}

function montarRetrato(){
  var L=[],hoje=new Date();
  L.push('Hoje: '+hoje.toLocaleDateString('pt-BR')+'. Valores em R$. Meses futuros trazem só o que já está previsto (parcelas, contratos, assinaturas).');
  L.push('');
  L.push('# Movimento por mês (mesma regra da tela Resumo)');
  intervaloMeses().forEach(function(mes){
    var E=[];try{E=window.allEntries(mes)||[];}catch(e){return;}
    if(!E.length)return;
    var porTipo={},porCat={};
    E.forEach(function(e){
      var t=e.tipo||'despesa',v=Number(e.valor)||0;
      porTipo[t]=(porTipo[t]||0)+v;
      var k=t+' | '+(e.cat||'Outros');porCat[k]=(porCat[k]||0)+v;
    });
    var rec=porTipo.receita||0,des=porTipo.despesa||0;
    L.push('');
    L.push('## '+mes+' — receitas '+n2(rec)+' | despesas '+n2(des)+' | saldo '+n2(rec-des)+
      Object.keys(porTipo).filter(function(t){return t!=='receita'&&t!=='despesa';}).map(function(t){return ' | '+t+' '+n2(porTipo[t]);}).join(''));
    L.push('Por categoria: '+Object.keys(porCat).sort().map(function(k){return k+' '+n2(porCat[k]);}).join('; '));
    L.push('data\ttipo\tcategoria\tvalor\tdescrição\torigem');
    E.slice().sort(function(a,b){return String(a.data).localeCompare(String(b.data));}).forEach(function(e){
      L.push([e.data,e.tipo,e.cat,n2(e.valor),String(e.desc||'').replace(/\s+/g,' '),e.origem||''].join('\t'));
    });
  });
  var pl=S.planejamento||{};
  if(Object.keys(pl).length){L.push('');L.push('# Planejamento (limite por categoria e mês)');L.push(JSON.stringify(pl));}
  if((S.cartoes||[]).length){L.push('');L.push('# Cartões');L.push(JSON.stringify(S.cartoes));}
  if((S.investimentos||[]).length){L.push('');L.push('# Investimentos (aportes, resgates e rentabilidade registrados)');L.push(JSON.stringify(S.investimentos));}
  if((S.patrimonios||[]).length){L.push('');L.push('# Patrimônio');L.push(JSON.stringify(S.patrimonios));}
  return L.join('\n');
}
window.iaMontarRetrato=montarRetrato; // para inspecionar/testar

// ---------------------------------------------------------------- texto
// Resposta em texto simples: parágrafos, "- " listas e **negrito**.
function formatar(t){
  var linhas=esc(t).split('\n'),h='',lista=false;
  linhas.forEach(function(l){
    var neg=l.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    if(/^\s*[-•]\s+/.test(l)){if(!lista){h+='<ul>';lista=true;}h+='<li>'+neg.replace(/^\s*[-•]\s+/,'')+'</li>';}
    else{if(lista){h+='</ul>';lista=false;}if(l.trim())h+='<p>'+neg+'</p>';}
  });
  if(lista)h+='</ul>';
  return h;
}

// ---------------------------------------------------------------- tela
function montarTela(){
  if(el('pg-ia'))return;
  var resumo=document.getElementById('nav-resumo');
  if(resumo){
    var a=document.createElement('a');a.id='nav-ia';a.setAttribute('onclick',"nav('ia')");
    a.innerHTML='<span class="nav-ic">&#10022;</span><span>Assistente</span>';
    resumo.parentNode.insertBefore(a,resumo.nextSibling);
  }
  var main=document.querySelector('.main');if(!main)return;
  var pg=document.createElement('div');pg.className='page';pg.id='pg-ia';
  pg.innerHTML='<h2 class="page-title">Assistente</h2>'+
    '<p class="ia-sub">Pergunte sobre os seus números. O assistente só consulta: não lança nem altera nada.</p>'+
    '<div class="ia-saldo" id="iaSaldo" aria-live="polite"></div>'+
    '<div class="ia-sugestoes" id="iaSugestoes"></div>'+
    '<div class="ia-chat" id="iaChat" aria-live="polite"></div>'+
    '<form class="ia-form" id="iaForm"><label for="iaPergunta" class="ia-oculto">Sua pergunta</label>'+
    '<textarea id="iaPergunta" class="form-control" rows="2" placeholder="Ex.: Quanto gastei com alimentação em outubro?"></textarea>'+
    '<button type="submit" class="btn btn-primary" id="iaEnviar">Perguntar</button></form>'+
    '<div class="ia-rodape"><span id="iaUso"></span> <button type="button" class="btn btn-sm btn-outline" id="iaNova">Nova conversa</button></div>';
  main.appendChild(pg);
  var sug=['Quanto gastei este mês e como isso se compara ao mês passado?','Quais categorias mais pesaram nos últimos 3 meses?','Quanto vou pagar de fatura nos próximos meses?','Estou dentro do planejamento deste mês?'];
  el('iaSugestoes').innerHTML=sug.map(function(s){return '<button type="button" class="ia-sug">'+esc(s)+'</button>';}).join('');
  el('iaSugestoes').addEventListener('click',function(e){var b=e.target.closest('.ia-sug');if(b){el('iaPergunta').value=b.textContent;enviar();}});
  el('iaForm').addEventListener('submit',function(e){e.preventDefault();enviar();});
  el('iaPergunta').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar();}});
  el('iaNova').addEventListener('click',function(){conversa=[];render();el('iaUso').textContent='';});
  el('iaSaldo').addEventListener('click',function(e){
    if(e.target.closest('#iaSaldoEditar')){editandoSaldo=true;renderSaldo();var c=el('iaCredito');if(c){c.focus();c.select();}}
    if(e.target.closest('#iaSaldoCancelar')){editandoSaldo=false;renderSaldo();}
  });
  el('iaSaldo').addEventListener('submit',function(e){e.preventDefault();salvarCredito();});
  render();
}

// ---------------------------------------------------------------- saldo
// Estimativa: crédito informado − custo das perguntas desde então (o
// servidor calcula o custo de cada resposta pela tabela de preços). O valor
// oficial é o do console da Anthropic.
var saldo=null,editandoSaldo=false,saldoErro='';
function usd(v,casas){return 'US$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:casas||2,maximumFractionDigits:casas||2});}
function dataCurta(iso){try{return new Date(iso).toLocaleDateString('pt-BR');}catch(e){return '';}}

function renderSaldo(){
  var b=el('iaSaldo');if(!b)return;
  if(editandoSaldo||(saldo&&saldo.credito==null)){
    var atual=saldo&&saldo.saldo!=null?String(Math.max(0,saldo.saldo).toFixed(2)).replace('.',','):'';
    b.innerHTML='<form class="ia-saldo-form"><label for="iaCredito">Créditos do Claude: informe o saldo que aparece no console da Anthropic (US$)</label>'+
      '<div class="ia-saldo-linha"><input id="iaCredito" class="form-control" inputmode="decimal" placeholder="Ex.: 5,00" value="'+esc(atual)+'">'+
      '<button type="submit" class="btn btn-primary btn-sm">Salvar</button>'+
      (saldo&&saldo.credito!=null?'<button type="button" class="btn btn-sm btn-outline" id="iaSaldoCancelar">Cancelar</button>':'')+
      '</div><small>Use também quando colocar mais crédito. A contagem do gasto recomeça a partir daí.</small></form>';
    return;
  }
  if(!saldo){b.innerHTML=saldoErro?'<small>'+esc(saldoErro)+'</small>':'';return;}
  var baixo=saldo.saldo<0.5;
  b.innerHTML='<div class="ia-saldo-info"><span class="ia-saldo-rot">Créditos do Claude (estimativa)</span>'+
    '<strong class="ia-saldo-valor'+(baixo?' ia-saldo-baixo':'')+'">'+usd(saldo.saldo,3)+'</strong>'+
    '<span class="ia-saldo-det">'+usd(saldo.credito)+' em '+dataCurta(saldo.desde)+' − '+usd(saldo.gasto,4)+' em '+saldo.perguntas+' pergunta'+(saldo.perguntas===1?'':'s')+
    ' · este mês: '+usd(saldo.mes_gasto,4)+'</span></div>'+
    '<button type="button" class="btn btn-sm btn-outline" id="iaSaldoEditar">Atualizar crédito</button>';
}

async function chamarSaldo(metodo,corpo){
  var token=window.nuvemToken?await window.nuvemToken():null;
  if(!token)throw new Error('Entre de novo.');
  var r=await fetch('/api/saldo',{method:metodo,headers:Object.assign({'Authorization':'Bearer '+token},corpo?{'Content-Type':'application/json'}:{}),body:corpo?JSON.stringify(corpo):undefined});
  var j=null;try{j=await r.json();}catch(e){}
  if(!r.ok)throw new Error((j&&j.erro)||('Erro '+r.status));
  return j;
}

async function carregarSaldo(){
  if(!navigator.onLine)return;
  try{saldo=await chamarSaldo('GET');saldoErro='';}catch(e){saldoErro='Saldo de créditos indisponível agora.';}
  renderSaldo();
}

async function salvarCredito(){
  var v=parseN(el('iaCredito').value);
  if(!(v>=0)){toast('Informe o valor em US$, por exemplo 5,00.','error');return;}
  try{saldo=await chamarSaldo('POST',{credito:v});editandoSaldo=false;renderSaldo();toast('Crédito atualizado.','success');}
  catch(e){toast('Créditos: '+((e&&e.message)||'falha'),'error');}
}

function render(){
  var c=el('iaChat');if(!c)return;
  if(!conversa.length){c.innerHTML='<p class="ia-vazio">Faça uma pergunta ou toque numa sugestão.</p>';el('iaSugestoes').style.display='';return;}
  el('iaSugestoes').style.display='none';
  c.innerHTML=conversa.map(function(m){
    return '<div class="ia-msg ia-'+(m.role==='user'?'eu':'ia')+'">'+(m.role==='user'?'<p>'+esc(m.content)+'</p>':formatar(m.content))+'</div>';
  }).join('')+(ocupado?'<div class="ia-msg ia-ia ia-pensando"><p>Analisando os seus dados…</p></div>':'');
  c.scrollTop=c.scrollHeight;
  var b=el('iaEnviar');if(b){b.disabled=ocupado;b.textContent=ocupado?'Aguarde…':'Perguntar';}
}

async function enviar(){
  var campo=el('iaPergunta'),q=(campo.value||'').trim();
  if(!q||ocupado)return;
  if(!navigator.onLine){toast&&toast('Sem internet: o assistente precisa de conexão.','error');return;}
  campo.value='';
  conversa.push({role:'user',content:q});ocupado=true;render();
  var resp,j=null;
  try{
    var token=window.nuvemToken?await window.nuvemToken():null;
    if(!token)throw new Error('Entre de novo para usar o assistente.');
    resp=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({dados:montarRetrato(),mensagens:conversa.slice(-30)})});
    try{j=await resp.json();}catch(e){}
    if(!resp.ok)throw new Error((j&&j.erro)||('Erro '+resp.status));
    conversa.push({role:'assistant',content:j.texto||'(sem resposta)'});
    var quem=j.provedor==='gemini'?'Gemini (Google, plano gratuito: o Google pode usar o conteúdo para melhorar produtos)':j.provedor==='claude'?'Claude (Anthropic)':'';
    el('iaUso').textContent=(quem?'Respondido por '+quem+'. ':'')+(j.uso?'Tokens: '+(j.uso.entrada+(j.uso.cache_lido||0)+(j.uso.cache_gravado||0))+' lidos ('+(j.uso.cache_lido||0)+' do cache), '+j.uso.saida+' escritos.':'')+
      (j.uso&&j.uso.custo_usd!=null?' Custo: '+usd(j.uso.custo_usd,4)+'.':'');
    if(j.provedor==='claude')carregarSaldo();
  }catch(e){
    conversa.pop(); // a pergunta volta para o campo, para tentar de novo
    campo.value=q;
    if(typeof toast==='function')toast('Assistente: '+((e&&e.message)||'falha'),'error');
  }
  ocupado=false;render();
}

registerPage('ia',function(){render();carregarSaldo();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montarTela);else montarTela();
})();

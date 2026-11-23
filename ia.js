// ia.js v2 — Assistente (fase 7 do PLANO-MIGRACAO.md; refeito em 23/11/2026)
// ------------------------------------------------------------------------
// Tela "Assistente": perguntas em português sobre os seus dados. SÓ LEITURA:
// o servidor (api/chat.js) não tem ferramenta nenhuma de escrita.
//
// A IA NÃO acessa o banco nem as telas. Ela vê só o RETRATO em texto montado
// aqui, a cada pergunta, com as mesmas funções das telas (allEntries,
// Check de Pagamentos, cartões, planejamento, metas, avisos). Assim os números
// que ela cita batem com o app. A v1 mandava só lançamentos e totais: sem o
// que estava pago, sem vencimentos e sem faturas, ela respondia "não vejo isso"
// a qualquer pergunta de pagamento (usuário apontou em 23/11/2026).
//
// Tamanho: detalhe linha a linha só de 2 meses antes a 3 depois do atual;
// meses mais antigos vão como totais por categoria.
//
// Só aparece com a nuvem nova ligada (precisa da sessão do Supabase).
(function(){
'use strict';
if(!window.NUVEM_ATIVA)return;

var CHAVE_CONVERSA='finApp_iaConversa';
var conversa=lerConversa();   // [{role, content}]
var ocupado=false,ultimoUso='';

function el(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function n2(v){return (Math.round((Number(v)||0)*100)/100).toFixed(2);}
function br(iso){var p=String(iso||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(iso||'');}
function ic(n){return typeof iconeSVG==='function'?iconeSVG(n):'';}
function lerConversa(){try{var c=JSON.parse(localStorage.getItem(CHAVE_CONVERSA)||'[]');return Array.isArray(c)?c.slice(-30):[];}catch(e){return [];}}
function gravarConversa(){try{localStorage.setItem(CHAVE_CONVERSA,JSON.stringify(conversa.slice(-30)));}catch(e){}}

// ---------------------------------------------------------------- retrato
// Mesma chave do checkpagamentos.js: origem|descrição|valor.
function chave(e){return (e.origem||'')+'|'+(e.desc||'')+'|'+(Number(e.valor)||0).toFixed(2);}
function pagos(mes){return (S.checkPagamentos&&S.checkPagamentos[mes])||{};}
function status(e,mes){return pagos(mes)[chave(e)]?(e.tipo==='receita'?'recebido':'pago'):'pendente';}
function cartaoDe(e){
  var o=e.origem||'';
  return (S.cartoes||[]).find(function(c){return o==='Cartão '+c.nome||o==='Assinatura '+c.nome;})||null;
}
function vencFatura(cart,mes){
  var ult=new Date(+mes.slice(0,4),+mes.slice(5,7),0).getDate();
  var d=Math.min(Math.max(1,parseInt(cart.vencimento,10)||ult),ult);
  return mes+'-'+String(d).padStart(2,'0');
}
// Data que importa para pagar: item do cartão vence com a fatura.
function dataPagar(e,mes){var c=e.isCC?cartaoDe(e):null;return c?vencFatura(c,mes):e.data;}
function totais(E,mes){
  var t={rec:0,des:0,recOk:0,desOk:0};
  E.forEach(function(e){
    var v=Number(e.valor)||0,ok=!!pagos(mes)[chave(e)];
    if(e.tipo==='receita'){t.rec+=v;if(ok)t.recOk+=v;}else if(e.tipo==='despesa'){t.des+=v;if(ok)t.desOk+=v;}
  });
  return t;
}
function porCategoria(E){
  var m={};E.forEach(function(e){var k=(e.tipo||'despesa')+' | '+(e.cat||'Outros');m[k]=(m[k]||0)+(Number(e.valor)||0);});
  return Object.keys(m).sort().map(function(k){return k+' '+n2(m[k]);}).join('; ');
}
function primeiroMes(){
  var ms=[mesAtual()];
  (S.lancamentos||[]).forEach(function(l){if(l&&l.data)ms.push(String(l.data).slice(0,7));});
  (S.comprasCartao||[]).forEach(function(c){if(c&&c.data)ms.push(String(c.data).slice(0,7));});
  ms.sort();return ms[0];
}

function montarRetrato(){
  var L=[],hoje=new Date(),mesH=mesAtual();
  var ini=addMes(mesH,-2),fim=addMes(mesH,3);
  L.push('Hoje: '+hoje.toLocaleDateString('pt-BR')+' (mês atual: '+mesH+'). Valores em R$.');
  L.push('Como ler: "status" vem do Check de Pagamentos do app. "pago" = despesa marcada como paga; "recebido" = receita marcada como recebida; "pendente" = ainda não marcada. Itens do cartão (parcelas e assinaturas no cartão) vencem no dia de vencimento da fatura daquele cartão. Meses futuros só têm o que já está previsto (parcelas, contratos, assinaturas).');

  // Avisos que o próprio app mostra
  var av=typeof window.calcularAlertas==='function'?window.calcularAlertas():[];
  L.push('');L.push('# Avisos que o app está mostrando agora');
  L.push(av.length?av.map(function(a){return '- '+a.titulo+' ('+a.det+')';}).join('\n'):'- nenhum');

  // Mês atual em resumo
  var EH=allEntries(mesH),tH=totais(EH,mesH);
  L.push('');L.push('# Situação do mês atual ('+mesH+')');
  L.push('Receitas '+n2(tH.rec)+' (recebido '+n2(tH.recOk)+', a receber '+n2(tH.rec-tH.recOk)+')');
  L.push('Despesas '+n2(tH.des)+' (pago '+n2(tH.desOk)+', a pagar '+n2(tH.des-tH.desOk)+')');
  var resgH=0,aporH=0;
  (S.lancamentos||[]).forEach(function(l){if(l.origemInvest&&String(l.data||'').slice(0,7)===mesH){if(l.tipo==='receita')resgH+=Number(l.valor)||0;else aporH+=Number(l.valor)||0;}});
  L.push('Resultado do mês (receitas − despesas, sem aportes/resgates) '+n2(tH.rec-tH.des));
  L.push('Sobra na conta (resultado + resgates '+n2(resgH)+' − aportes '+n2(aporH)+') '+n2(tH.rec-tH.des+resgH-aporH)+'. É o número em destaque no Resumo do app.');
  var pend=EH.filter(function(e){return e.tipo==='despesa'&&!pagos(mesH)[chave(e)];})
    .sort(function(a,b){return String(dataPagar(a,mesH)).localeCompare(String(dataPagar(b,mesH)));});
  L.push('Despesas pendentes do mês (vencimento | valor | descrição | origem):');
  L.push(pend.length?pend.map(function(e){return br(dataPagar(e,mesH))+' | '+n2(e.valor)+' | '+String(e.desc||'').replace(/\s+/g,' ')+' | '+(e.origem||'');}).join('\n'):'(nenhuma)');

  // Faturas por cartão
  if((S.cartoes||[]).length){
    L.push('');L.push('# Faturas dos cartões (mês da fatura | cartão | vencimento | total | itens pagos/total | situação)');
    for(var m=addMes(mesH,-1);m<=fim;m=addMes(m,1)){
      var Em=allEntries(m);
      S.cartoes.forEach(function(c){
        var it=Em.filter(function(e){return e.isCC&&cartaoDe(e)===c;});if(!it.length)return;
        var tot=it.reduce(function(s,e){return s+(Number(e.valor)||0);},0),ok=it.filter(function(e){return pagos(m)[chave(e)];}).length;
        L.push(m+' | '+c.nome+' | '+br(vencFatura(c,m))+' | '+n2(tot)+' | '+ok+'/'+it.length+' | '+(ok===it.length?'paga':ok?'parcialmente marcada':'pendente'));
      });
    }
    L.push('Cartões: '+S.cartoes.map(function(c){return c.nome+' (fecha dia '+(c.fechamento||'?')+', vence dia '+(c.vencimento||'?')+(c.limite?', limite '+n2(c.limite):'')+')';}).join('; '));
  }

  // Contratos e assinaturas ativos no mês atual
  var ctr=EH.filter(function(e){return e.origem==='Contrato';});
  if(ctr.length){
    L.push('');L.push('# Contratos ativos em '+mesH+' (tipo | descrição | categoria | valor vigente | vence | status)');
    ctr.forEach(function(e){L.push(e.tipo+' | '+String(e.desc).replace(/ \(Contrato\)$/,'')+' | '+e.cat+' | '+n2(e.valor)+' | dia '+String(e.data).slice(8,10)+' | '+status(e,mesH));});
  }
  var ass=EH.filter(function(e){return /^Assinatura/.test(e.origem||'');});
  if(ass.length){
    L.push('');L.push('# Assinaturas ativas em '+mesH+' (nome | valor | categoria | cartão)');
    ass.forEach(function(e){var c=cartaoDe(e);L.push(String(e.desc).replace(/ \(Assinatura\)$/,'')+' | '+n2(e.valor)+' | '+e.cat+' | '+(c?c.nome:'-'));});
  }

  // Planejamento e metas
  var lim=(S.planejamento&&S.planejamento[mesH])||{};
  if(Object.keys(lim).length){
    var gs={};EH.forEach(function(e){if(e.tipo==='despesa')gs[e.cat]=(gs[e.cat]||0)+(Number(e.valor)||0);});
    L.push('');L.push('# Planejamento de '+mesH+' (categoria | limite | gasto | %)');
    Object.keys(lim).forEach(function(c){var l=Number(lim[c])||0,g=gs[c]||0;L.push(c+' | '+n2(l)+' | '+n2(g)+' | '+(l?Math.round(g/l*100):0)+'%');});
  } else { L.push('');L.push('# Planejamento de '+mesH);L.push('(nenhum limite definido neste mês)'); }
  var ms=typeof window.planMetas==='function'?window.planMetas():[];
  L.push('');L.push('# Metas (nome | valor da meta | guardado | prazo)');
  L.push(ms.length?ms.map(function(x){return x.nome+' | '+n2(x.alvo)+' | '+n2(x.guardado)+' | '+(x.prazo||'sem prazo');}).join('\n'):'(nenhuma meta)');

  // Aportes e resgates: transferências (fora de receitas e despesas)
  var tr=(S.lancamentos||[]).filter(function(l){var m=String(l.data||'').slice(0,7);return l.origemInvest&&m>=ini&&m<=fim;})
    .sort(function(a,b){return String(a.data).localeCompare(String(b.data));});
  L.push('');L.push('# Transferências para investimentos de '+ini+' a '+fim+' (aportes e resgates; NÃO entram em receitas, despesas nem saldo do mês)');
  L.push(tr.length?tr.map(function(l){return br(l.data)+' | '+(l.tipo==='despesa'?'aporte':'resgate')+' | '+n2(l.valor)+' | '+String(l.desc||'');}).join('\n'):'(nenhuma)');

  // Detalhe por mês
  L.push('');L.push('# Lançamentos detalhados de '+ini+' a '+fim+' (mesma regra da tela Resumo)');
  for(var d=ini;d<=fim;d=addMes(d,1)){
    var E=allEntries(d);if(!E.length)continue;var t=totais(E,d);
    L.push('');
    L.push('## '+d+' — receitas '+n2(t.rec)+' (recebido '+n2(t.recOk)+') | despesas '+n2(t.des)+' (pago '+n2(t.desOk)+') | saldo '+n2(t.rec-t.des));
    L.push('Por categoria: '+porCategoria(E));
    L.push('vencimento/data\ttipo\tcategoria\tvalor\tdescrição\torigem\tstatus');
    E.slice().sort(function(a,b){return String(dataPagar(a,d)).localeCompare(String(dataPagar(b,d)));}).forEach(function(e){
      L.push([br(dataPagar(e,d)),e.tipo,e.cat,n2(e.valor),String(e.desc||'').replace(/\s+/g,' '),e.origem||'',status(e,d)].join('\t'));
    });
  }

  // Meses anteriores só em totais
  var p=primeiroMes();
  if(p<ini){
    L.push('');L.push('# Meses anteriores (só totais)');
    for(var a=p;a<ini;a=addMes(a,1)){
      var Ea=allEntries(a);if(!Ea.length)continue;var ta=totais(Ea,a);
      L.push('## '+a+' — receitas '+n2(ta.rec)+' | despesas '+n2(ta.des)+' | saldo '+n2(ta.rec-ta.des));
      L.push('Por categoria: '+porCategoria(Ea));
    }
  }

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
// Estilo mensageiro: mensagens no fluxo da página; campo de pergunta fixo
// embaixo (no celular, logo acima da barra inferior); sugestões sempre à mão.
var SUGESTOES=['O que ainda falta pagar este mês?','Quanto vem de fatura nos próximos meses?','Quanto gastei este mês comparado ao mês passado?','Quais categorias mais pesaram nos últimos 3 meses?','Estou dentro do planejamento deste mês?','Como estão minhas metas?'];

function aba(qual){
  var lancar=qual==='lancar';
  el('iaModoLancar').hidden=!lancar;el('iaModoPerguntar').hidden=lancar;
  el('iaAbaLancar').classList.toggle('ativa',lancar);el('iaAbaPerguntar').classList.toggle('ativa',!lancar);
  el('iaAbaLancar').setAttribute('aria-selected',String(lancar));el('iaAbaPerguntar').setAttribute('aria-selected',String(!lancar));
  document.body.classList.toggle('ia-modo-lancar',lancar);
}

function montarTela(){
  if(el('pg-ia'))return;
  var resumo=document.getElementById('nav-resumo');
  if(resumo){
    var a=document.createElement('a');a.id='nav-ia';a.setAttribute('onclick',"nav('ia')");
    a.innerHTML='<span class="nav-ic">&#10022;</span><span>Assistente</span>';
    resumo.parentNode.insertBefore(a,resumo.nextSibling);
    if(typeof window.aplicarIcones==='function')window.aplicarIcones();
  }
  var main=document.querySelector('.main');if(!main)return;
  var pg=document.createElement('div');pg.className='page';pg.id='pg-ia';
  pg.innerHTML='<div class="ia-topo"><h2 class="page-title">Assistente</h2><div class="ia-saldo" id="iaSaldo" aria-live="polite"></div></div>'+
    '<div class="ia-abas" role="tablist">'+
      '<button type="button" role="tab" id="iaAbaPerguntar" aria-controls="iaModoPerguntar" aria-selected="true" class="ia-aba ativa">Perguntar</button>'+
      '<button type="button" role="tab" id="iaAbaLancar" aria-controls="iaModoLancar" aria-selected="false" class="ia-aba">Lançar por foto ou texto</button>'+
    '</div>'+
    '<div id="iaModoLancar" role="tabpanel" aria-labelledby="iaAbaLancar" hidden>'+
    '<p class="ia-sub">Escreva o gasto ou mande a foto do cupom. A IA preenche, você confere e só então grava.</p>'+
    '<div id="iaLancarCaixa"></div></div>'+
    '<div id="iaModoPerguntar" role="tabpanel" aria-labelledby="iaAbaPerguntar">'+
      '<div class="ia-chat" id="iaChat" aria-live="polite"></div>'+
      '<div class="ia-dock" id="iaDock">'+
        '<div class="ia-sugestoes" id="iaSugestoes" aria-label="Sugestões de pergunta"></div>'+
        '<form class="ia-form" id="iaForm"><label for="iaPergunta" class="ia-oculto">Sua pergunta</label>'+
          '<textarea id="iaPergunta" class="form-control" rows="1" placeholder="Pergunte sobre seus números…"></textarea>'+
          '<button type="submit" class="btn btn-primary ia-enviar" id="iaEnviar" aria-label="Enviar pergunta">'+ic('enviar')+'<span>Enviar</span></button>'+
        '</form>'+
      '</div>'+
    '</div>';
  main.appendChild(pg);
  if(typeof window.iaMontarLancar==='function')window.iaMontarLancar(el('iaLancarCaixa'));
  else el('iaAbaLancar').hidden=true;
  window.iaAbrirLancar=function(){nav('ia');aba('lancar');};
  el('iaAbaPerguntar').addEventListener('click',function(){aba('perguntar');});
  el('iaAbaLancar').addEventListener('click',function(){aba('lancar');});
  el('iaSugestoes').innerHTML=SUGESTOES.map(function(s){return '<button type="button" class="ia-sug">'+esc(s)+'</button>';}).join('');
  el('iaSugestoes').addEventListener('click',function(e){var b=e.target.closest('.ia-sug');if(b){el('iaPergunta').value=b.textContent;enviar();}});
  el('iaForm').addEventListener('submit',function(e){e.preventDefault();enviar();});
  var campo=el('iaPergunta');
  campo.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviar();}});
  campo.addEventListener('input',crescer);
  el('iaChat').addEventListener('click',function(e){
    if(e.target.closest('#iaNova')){conversa=[];ultimoUso='';gravarConversa();render();el('iaPergunta').focus();}
  });
  el('iaSaldo').addEventListener('click',function(e){
    if(e.target.closest('#iaSaldoEditar')){editandoSaldo=true;renderSaldo();var c=el('iaCredito');if(c){c.focus();c.select();}}
    if(e.target.closest('#iaSaldoCancelar')){editandoSaldo=false;renderSaldo();}
  });
  el('iaSaldo').addEventListener('submit',function(e){e.preventDefault();salvarCredito();});
  render();
}
// O campo cresce até 5 linhas conforme o texto.
function crescer(){var c=el('iaPergunta');if(!c)return;c.style.height='auto';c.style.height=Math.min(c.scrollHeight,130)+'px';}

// ---------------------------------------------------------------- saldo
// Estimativa: crédito informado − custo das perguntas desde então (o
// servidor calcula o custo de cada resposta pela tabela de preços). O valor
// oficial é o do console da Anthropic. Fica numa linha discreta no topo.
var saldo=null,editandoSaldo=false,saldoErro='';
function usd(v,casas){return 'US$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:casas||2,maximumFractionDigits:casas||2});}
function dataCurta(iso){try{return new Date(iso).toLocaleDateString('pt-BR');}catch(e){return '';}}

function renderSaldo(){
  var b=el('iaSaldo');if(!b)return;
  if(editandoSaldo){
    var atual=saldo&&saldo.saldo!=null?String(Math.max(0,saldo.saldo).toFixed(2)).replace('.',','):'';
    b.innerHTML='<form class="ia-saldo-form"><label for="iaCredito">Saldo de créditos que aparece no console da Anthropic (US$)</label>'+
      '<div class="ia-saldo-linha"><input id="iaCredito" class="form-control" inputmode="decimal" placeholder="Ex.: 5,00" value="'+esc(atual)+'">'+
      '<button type="submit" class="btn btn-primary btn-sm">Salvar</button>'+
      '<button type="button" class="btn btn-sm btn-outline" id="iaSaldoCancelar">Cancelar</button>'+
      '</div><small>Use também quando colocar mais crédito. A contagem do gasto recomeça a partir daí.</small></form>';
    return;
  }
  if(!saldo){b.innerHTML=saldoErro?'<small class="ia-saldo-linha1">'+esc(saldoErro)+'</small>':'';return;}
  if(saldo.credito==null){
    b.innerHTML='<span class="ia-saldo-linha1">Créditos do Claude: não informados <button type="button" class="ia-saldo-link" id="iaSaldoEditar">Informar</button></span>';
    return;
  }
  var baixo=saldo.saldo<0.5;
  b.innerHTML='<span class="ia-saldo-linha1" title="'+esc(usd(saldo.credito)+' em '+dataCurta(saldo.desde)+' − '+usd(saldo.gasto,4)+' em '+saldo.perguntas+' pergunta(s) · este mês: '+usd(saldo.mes_gasto,4))+'">'+
    'Créditos: <strong class="'+(baixo?'ia-saldo-baixo':'')+'">'+usd(saldo.saldo,3)+'</strong> <span class="ia-saldo-est">(estimativa)</span>'+
    ' <button type="button" class="ia-saldo-link" id="iaSaldoEditar">Atualizar</button></span>';
}

async function chamarSaldo(metodo,corpo){
  var token=window.nuvemToken?await window.nuvemToken():null;
  if(!token)throw new Error('Entre de novo.');
  var r=await fetch('/api/saldo',{method:metodo,headers:Object.assign({'Authorization':'Bearer '+token},corpo?{'Content-Type':'application/json'}:{}),body:corpo?JSON.stringify(corpo):undefined});
  var j=null;try{j=await r.json();}catch(e){}
  if(!r.ok)throw new Error((j&&j.erro)||('Erro '+r.status));
  return j;
}

window.iaAtualizarSaldo=function(){carregarSaldo();};
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

// ---------------------------------------------------------------- conversa
function render(){
  var c=el('iaChat');if(!c)return;
  if(!conversa.length&&!ocupado){
    c.innerHTML='<div class="ia-boasvindas"><p><strong>Pergunte sobre seus números.</strong></p>'+
      '<p>Eu vejo seus lançamentos, o que está pago ou pendente no Check de Pagamentos, as faturas dos cartões, contratos, assinaturas, o planejamento e as metas. Só consulto: não lanço nem altero nada.</p></div>';
  } else {
    c.innerHTML='<div class="ia-conv-topo"><button type="button" class="btn btn-sm btn-outline" id="iaNova">Nova conversa</button></div>'+
      conversa.map(function(m){
        return '<div class="ia-msg ia-'+(m.role==='user'?'eu':'ia')+'">'+(m.role==='user'?'<p>'+esc(m.content)+'</p>':formatar(m.content))+'</div>';
      }).join('')+
      (ocupado?'<div class="ia-msg ia-ia ia-pensando" role="status"><span class="ia-pontos"><i></i><i></i><i></i></span> Analisando seus dados…</div>':'')+
      (ultimoUso&&!ocupado?'<p class="ia-uso">'+esc(ultimoUso)+'</p>':'');
    var ultima=c.lastElementChild;
    if(ultima&&curPage==='ia')requestAnimationFrame(function(){ultima.scrollIntoView({block:'end',behavior:'smooth'});});
  }
  var b=el('iaEnviar');if(b)b.disabled=ocupado;
}

async function enviar(){
  var campo=el('iaPergunta'),q=(campo.value||'').trim();
  if(!q||ocupado)return;
  if(!navigator.onLine){toast('Sem internet: o assistente precisa de conexão.','error');return;}
  campo.value='';crescer();
  conversa.push({role:'user',content:q});ocupado=true;render();
  var resp,j=null;
  try{
    var token=window.nuvemToken?await window.nuvemToken():null;
    if(!token)throw new Error('Entre de novo para usar o assistente.');
    resp=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({dados:montarRetrato(),mensagens:conversa.slice(-30)})});
    try{j=await resp.json();}catch(e){}
    if(!resp.ok)throw new Error((j&&j.erro)||('Erro '+resp.status));
    conversa.push({role:'assistant',content:j.texto||'(sem resposta)'});gravarConversa();
    var quem=j.provedor==='gemini'?'Gemini':j.provedor==='claude'?'Claude':'';
    ultimoUso=(quem?quem:'')+(j.uso&&j.uso.custo_usd!=null?' · custo '+usd(j.uso.custo_usd,4):'');
    if(j.provedor==='claude')carregarSaldo();
  }catch(e){
    conversa.pop(); // a pergunta volta para o campo, para tentar de novo
    campo.value=q;crescer();
    toast('Assistente: '+((e&&e.message)||'falha'),'error');
  }
  ocupado=false;render();
}

registerPage('ia',function(){render();carregarSaldo();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montarTela);else montarTela();
})();

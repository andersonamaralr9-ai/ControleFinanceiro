// nuvem.js v1 — Sincronizacao com o Supabase (fase 2 do PLANO-MIGRACAO.md)
// ------------------------------------------------------------------------
// Fica DESLIGADO por padrao: o app continua no Gist (auth.js) ate a troca.
// Liga quando:
//   - a pagina abre com ?nuvem=supabase (fica gravado neste aparelho), ou
//   - o endereco e *.vercel.app (a previa da Vercel e o app novo).
// ?nuvem=gist desliga e volta ao Gist neste aparelho.
//
// Carrega ANTES do auth.js: ele le window.NUVEM_ATIVA e, se ligado, pula
// todo o login/sync do Gist (mantendo os helpers ensureArrays, _tsStamp...).
//
// Modelo (ver PLANO-MIGRACAO.md, secao 3):
//   itens(colecao, id, dados, ts, excluido)  — um objeto por linha
//   mapas(mapa, chave, valor, ts, removido)  — uma linha por chave
// O banco recusa (em silencio) gravacao com ts menor que o ja gravado.
//
// Fluxo:
//   salvar()  -> compara S com o retrato anterior -> fila no aparelho
//                (localStorage, sobrevive a fechar o app) -> envio em lote
//   novidades -> busca so o que mudou desde o cursor (atualizado_em) e aplica
//                quando o ts da nuvem e maior que o que o aparelho conhece.
// Os dados ficam numa chave de localStorage propria por usuario do Supabase
// (finApp_sb_<uid>): nada aqui le nem grava os dados do Gist.
(function(){
'use strict';

// ---------------------------------------------------------------- chave
var FLAG_KEY='finApp_nuvem';
try{
  var _q=new URLSearchParams(location.search).get('nuvem');
  if(_q==='supabase')localStorage.setItem(FLAG_KEY,'supabase');
  else if(_q==='gist')localStorage.setItem(FLAG_KEY,'gist');
}catch(e){}
var _flag=null;try{_flag=localStorage.getItem(FLAG_KEY);}catch(e){}
var ATIVA=_flag==='supabase'||(_flag!=='gist'&&/\.vercel\.app$/.test(location.hostname));
window.NUVEM_ATIVA=ATIVA;
if(!ATIVA)return;

// ---------------------------------------------------------------- config
// Chave publica: pode ficar no codigo, quem protege os dados e o RLS.
var SB_URL='https://fuicmmnwumgmtwgemzuy.supabase.co';
var SB_KEY='sb_publishable_-C1CbKZJlFqDws8yi0glrA_o-WL4wwS';
var SB_LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

var COLS=['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa','patrimonios','lixeira'];
var SEP='\u0001';
var LOTE=500;              // linhas por envio/pagina
var SOBREPOR_MS=5000;      // o cursor volta 5s: commits concorrentes nao escapam
var INTERVALO_MS=2*60*1000;
var ATRASO_ENVIO_MS=1500;

var sb=null,uid=null,email=null;
var K={};                  // chaves de localStorage do usuario
var meta=null;             // {cursorItens, cursorMapas, ts:{chave:ts}}
var fila=null;             // {chave:{t:'itens'|'mapas', row:{...}, v:n}}
var snapI={},snapM={};     // retrato do ultimo estado conhecido
var _envTimer=null,_intTimer=null,_ocupado=false,_denovo=false,_ultimoErro='';

// ---------------------------------------------------------------- util
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}}
function fp(v){try{return JSON.stringify(v);}catch(e){return '';}}
function o(x){return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}
function chaveDe(col){return col==='lixeira'?'lixoId':'id';}
function salvarMeta(){ls(K.meta,meta);}
function salvarFila(){ls(K.fila,fila);}
// Fila e meta sao do aparelho, divididas entre abas abertas. Toda alteracao
// relê do disco antes (num bloco sincrono), senao uma aba gravaria a sua
// copia velha por cima e apagaria da fila o que a outra tinha posto.
function relerDisco(){
  meta=ls(K.meta)||{};if(!meta.ts)meta.ts={};
  fila=ls(K.fila)||{};
}
function pendentes(){if(K.fila)fila=ls(K.fila)||{};return Object.keys(fila||{}).length;}

// Mapas achatados chave->valor. Granularidade escolhida pelo tipo de edicao:
//  planejamento: um mes inteiro por linha (inclui mes vazio)
//  cats:         uma lista de categorias por tipo (preserva a ordem)
//  config:       uma chave por linha
//  checkPagamentos: um item por linha (marcar no celular e no PC no mesmo
//                mes nao pode perder marcacao) + marcador do mes vazio
function achatar(st){
  var r={planejamento:{},cats:{},config:{},checkPagamentos:{}};
  Object.keys(o(st.planejamento)).forEach(function(m){r.planejamento[m]=st.planejamento[m];});
  Object.keys(o(st.cats)).forEach(function(t){r.cats[t]=st.cats[t];});
  Object.keys(o(st.config)).forEach(function(k){r.config[k]=st.config[k];});
  var cp=o(st.checkPagamentos);
  Object.keys(cp).forEach(function(m){
    r.checkPagamentos[m+SEP]=null; // o mes existe
    Object.keys(o(cp[m])).forEach(function(k){r.checkPagamentos[m+SEP+k]=cp[m][k];});
  });
  return r;
}
function retratoMapas(st){
  var a=achatar(st),s={};
  Object.keys(a).forEach(function(n){s[n]={};Object.keys(a[n]).forEach(function(k){s[n][k]=fp(a[n][k]);});});
  return s;
}
function retratoItens(st){
  var s={};
  COLS.forEach(function(c){
    s[c]={};var kf=chaveDe(c);
    (Array.isArray(st[c])?st[c]:[]).forEach(function(it){if(it&&it[kf])s[c][it[kf]]=fp(it);});
  });
  return s;
}
function retratar(){snapI=retratoItens(S);snapM=retratoMapas(S);}

// ---------------------------------------------------------------- fila
var _v=0;
function enfileirar(t,chave,row){
  fila[chave]={t:t,row:row,v:Date.now()*1000+(_v++%1000)};
}

// Compara S com o retrato e poe na fila o que mudou. Roda dentro do salvar().
// Aparelho que ainda nao completou a primeira busca nao envia nada: o S dele
// e o estado padrao, e alguns modulos mexem nele ao abrir (ex.: acrescentam
// a categoria "Investimento"). Enviado com horario novo, isso venceria as
// categorias reais da nuvem. So o retrato e atualizado; a primeira busca
// traz tudo e dali em diante as edicoes sobem normalmente.
function detectarMudancas(){
  relerDisco();
  if(!meta.inicial){retratar();return 0;}
  var agora=Date.now(),n=0;
  var atualI=retratoItens(S);
  COLS.forEach(function(c){
    var ant=snapI[c]||{},cur=atualI[c],kf=chaveDe(c);
    var porId={};(S[c]||[]).forEach(function(it){if(it&&it[kf])porId[it[kf]]=it;});
    Object.keys(cur).forEach(function(id){
      if(ant[id]===cur[id])return;
      var it=porId[id],ts=(c!=='lixeira'&&it._ts)?it._ts:agora;
      if(ts<=(meta.ts['i|'+c+'|'+id]||0))ts=(meta.ts['i|'+c+'|'+id]||0)+1;
      meta.ts['i|'+c+'|'+id]=ts;
      enfileirar('itens','i|'+c+'|'+id,{user_id:uid,colecao:c,id:String(id),dados:JSON.parse(cur[id]),ts:ts,excluido:false});n++;
    });
    Object.keys(ant).forEach(function(id){
      if(id in cur)return;
      var ts=Math.max(agora,(meta.ts['i|'+c+'|'+id]||0)+1);
      meta.ts['i|'+c+'|'+id]=ts;
      enfileirar('itens','i|'+c+'|'+id,{user_id:uid,colecao:c,id:String(id),dados:JSON.parse(ant[id]),ts:ts,excluido:true});n++;
    });
  });
  var atualM=retratoMapas(S);
  Object.keys(atualM).forEach(function(mp){
    var ant=snapM[mp]||{},cur=atualM[mp];
    var todas={};Object.keys(ant).forEach(function(k){todas[k]=1;});Object.keys(cur).forEach(function(k){todas[k]=1;});
    Object.keys(todas).forEach(function(k){
      if(ant[k]===cur[k])return;
      var mk='m|'+mp+'|'+k,ts=Math.max(agora,(meta.ts[mk]||0)+1);
      meta.ts[mk]=ts;
      var rem=!(k in cur);
      enfileirar('mapas',mk,{user_id:uid,mapa:mp,chave:k,valor:rem?null:JSON.parse(cur[k]),ts:ts,removido:rem});n++;
    });
  });
  snapI=atualI;snapM=atualM;
  if(n){salvarMeta();salvarFila();}
  return n;
}

// ---------------------------------------------------------------- envio
async function enviar(){
  relerDisco();
  var chaves=Object.keys(fila);
  if(!chaves.length)return true;
  for(var t of ['itens','mapas']){
    var doTipo=chaves.filter(function(k){return fila[k]&&fila[k].t===t;});
    for(var i=0;i<doTipo.length;i+=LOTE){
      var parte=doTipo.slice(i,i+LOTE),versoes={};
      var rows=parte.map(function(k){versoes[k]=fila[k].v;return fila[k].row;});
      var res=await sb.from(t).upsert(rows,{onConflict:t==='itens'?'user_id,colecao,id':'user_id,mapa,chave',returning:'minimal'});
      if(res.error)throw new Error(res.error.message||'falha no envio');
      // So tira da fila o que nao mudou enquanto o envio estava no ar
      fila=ls(K.fila)||{};
      parte.forEach(function(k){if(fila[k]&&fila[k].v===versoes[k])delete fila[k];});
      salvarFila();
    }
  }
  return true;
}

// ---------------------------------------------------------------- novidades
async function buscarTabela(t,cursor){
  var desde=cursor?new Date(new Date(cursor).getTime()-SOBREPOR_MS).toISOString():null;
  var linhas=[],de=0;
  for(;;){
    var q=sb.from(t).select('*').order('atualizado_em',{ascending:true}).order(t==='itens'?'colecao':'mapa').order(t==='itens'?'id':'chave').range(de,de+LOTE-1);
    if(desde)q=q.gte('atualizado_em',desde);
    var res=await q;
    if(res.error)throw new Error(res.error.message||'falha na leitura');
    linhas=linhas.concat(res.data||[]);
    if(!res.data||res.data.length<LOTE)break;
    de+=LOTE;
  }
  return linhas;
}

// Aplica linhas da nuvem em S. Sincrono do inicio ao fim: nenhuma edicao
// local pode acontecer no meio.
function aplicar(itens,mapas){
  relerDisco();
  var mudou=0;
  itens.forEach(function(r){
    var mk='i|'+r.colecao+'|'+r.id,conhecido=meta.ts[mk]||0,ts=Number(r.ts);
    if(ts<=conhecido)return;           // ja tenho igual ou mais novo
    meta.ts[mk]=ts;
    // uma edicao local mais velha na fila perderia no servidor: descarta
    if(fila[mk]&&fila[mk].row.ts<=ts)delete fila[mk];
    var c=r.colecao;if(COLS.indexOf(c)===-1)return;
    if(!Array.isArray(S[c]))S[c]=[];
    var kf=chaveDe(c),idx=-1;
    for(var i=0;i<S[c].length;i++){if(S[c][i]&&String(S[c][i][kf])===r.id){idx=i;break;}}
    if(r.excluido){if(idx>=0){S[c].splice(idx,1);mudou++;}}
    else if(idx>=0){S[c][idx]=r.dados;mudou++;}
    else{S[c].push(r.dados);mudou++;}
  });
  mapas.forEach(function(r){
    var mk='m|'+r.mapa+'|'+r.chave,conhecido=meta.ts[mk]||0,ts=Number(r.ts);
    if(ts<=conhecido)return;
    meta.ts[mk]=ts;
    if(fila[mk]&&fila[mk].row.ts<=ts)delete fila[mk];
    var rem=r.removido,v=r.valor;mudou++;
    if(r.mapa==='planejamento'){if(!S.planejamento||Array.isArray(S.planejamento))S.planejamento={};if(rem)delete S.planejamento[r.chave];else S.planejamento[r.chave]=v;}
    else if(r.mapa==='cats'){if(!S.cats)S.cats={};if(rem)delete S.cats[r.chave];else S.cats[r.chave]=v;}
    else if(r.mapa==='config'){if(!S.config)S.config={};if(rem)delete S.config[r.chave];else S.config[r.chave]=v;}
    else if(r.mapa==='checkPagamentos'){
      var p=r.chave.split(SEP),mes=p[0],k=p.slice(1).join(SEP);
      if(!S.checkPagamentos||typeof S.checkPagamentos!=='object')S.checkPagamentos={};
      if(!S.checkPagamentosTs||typeof S.checkPagamentosTs!=='object')S.checkPagamentosTs={};
      if(k===''){ // marcador do mes
        if(rem){delete S.checkPagamentos[mes];delete S.checkPagamentosTs[mes];}
        else if(!S.checkPagamentos[mes])S.checkPagamentos[mes]={};
      }else{
        var cm=S.checkPagamentos[mes]=o(S.checkPagamentos[mes]);
        var tm=S.checkPagamentosTs[mes]=o(S.checkPagamentosTs[mes]);
        if(rem){delete cm[k];delete tm[k];}else{cm[k]=v;tm[k]=ts;}
      }
    }
  });
  if(mudou){
    if(typeof ensureArrays==='function')S=ensureArrays(S);
    // o que veio da nuvem vira referencia: nao e edicao local
    if(typeof window._tsReset==='function')window._tsReset(S);
    retratar();
    localStorage.setItem(K.dados,JSON.stringify(S));
  }
  salvarMeta();salvarFila();
  return mudou;
}

// ---------------------------------------------------------------- sync
function status(){
  var n=pendentes();
  if(!navigator.onLine)return syncUI('off',n?n+' alteraç'+(n>1?'ões':'ão')+' aguardando envio (offline)':'Offline');
  var fila_=n?n+' alteraç'+(n>1?'ões':'ão')+' aguardando envio':'';
  if(_ultimoErro)return syncUI('on',(fila_?fila_+' — ':'')+'Erro: '+_ultimoErro+', tentando de novo');
  if(n)return syncUI('loading',fila_);
  syncUI('on','Sincronizado '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
}

async function sincronizar(opc){
  opc=opc||{};
  if(!sb||!uid){status();return false;}
  if(_ocupado){_denovo=true;return false;}
  if(!navigator.onLine){status();return false;}
  _ocupado=true;syncUI('loading','Sincronizando...');
  var ok=false;
  try{
    await enviar();
    if(!opc.soEnviar){
      var ci=meta.cursorItens,cm=meta.cursorMapas;
      var itens=await buscarTabela('itens',ci),mapas=await buscarTabela('mapas',cm);
      var mudou=aplicar(itens,mapas);
      if(itens.length)meta.cursorItens=itens[itens.length-1].atualizado_em;
      if(mapas.length)meta.cursorMapas=mapas[mapas.length-1].atualizado_em;
      if(!meta.inicial){
        meta.inicial=true;
        // Banco vazio (primeiro uso da conta): o estado local e o ponto de
        // partida. Zera o retrato para que o proximo salvar suba tudo.
        if(!itens.length&&!mapas.length){snapI={};snapM={};}
      }
      salvarMeta();
      if(mudou){
        if(S.config&&S.config.theme&&typeof setTheme==='function')setTheme(S.config.theme);
        if(typeof renderAll==='function')renderAll();
      }
      // descartes acima podem ter deixado algo novo para enviar
      if(pendentes())await enviar();
    }
    _ultimoErro='';ok=true;
  }catch(e){
    console.error('[Nuvem]',e);
    _ultimoErro=/fetch|network|Failed/i.test(String(e&&e.message))?'sem conexão':(e&&e.message)||'falha';
  }
  _ocupado=false;status();
  if(typeof renderCloudArea==='function'&&typeof curPage!=='undefined'&&curPage==='backup')renderCloudArea();
  if(_denovo){_denovo=false;setTimeout(function(){sincronizar();},0);}
  return ok;
}
window.nuvemSincronizar=sincronizar;

function agendarEnvio(){
  clearTimeout(_envTimer);
  _envTimer=setTimeout(function(){sincronizar({soEnviar:true});},ATRASO_ENVIO_MS);
}

// ---------------------------------------------------------------- entrar
function entrar(u){
  uid=u.id;email=u.email||'';
  K={dados:'finApp_sb_'+uid,meta:'finApp_sb_meta_'+uid,fila:'finApp_sb_fila_'+uid};
  ls('finApp_sb_ultimo',{id:uid,email:email});
  meta=ls(K.meta)||{};if(!meta.ts)meta.ts={};
  fila=ls(K.fila)||{};
  var d=ls(K.dados);
  S=(typeof ensureArrays==='function')?ensureArrays(d||defState()):(d||defState());
  if(typeof window._tsReset==='function')window._tsReset(S);
  retratar();

  window.salvar=function(){
    if(!uid)return;
    if(typeof normalizarHistoricos==='function')normalizarHistoricos(S);
    if(typeof window._tsStamp==='function')window._tsStamp(S);
    localStorage.setItem(K.dados,JSON.stringify(S));
    if(detectarMudancas())agendarEnvio();
    status();
  };
  window.scheduleSync=agendarEnvio;
  window.doSyncNow=function(){return sincronizar();};
  window.doPullGist=function(){return sincronizar();};
  window._authSyncNow=sincronizar;
  window.renderCloudArea=renderCloudArea;
  window.nuvemBaixarTudo=async function(){
    if(!confirm('Buscar tudo da nuvem de novo? Alterações locais ainda não enviadas continuam na fila.'))return;
    meta.cursorItens=null;meta.cursorMapas=null;meta.ts={};meta.inicial=false;
    // reenfileira-se o que estiver na fila com o ts que ja tinha
    Object.keys(fila).forEach(function(k){meta.ts[k]=fila[k].row.ts;});
    salvarMeta();await sincronizar();
  };
  window.cloudOk=true;

  // Outra aba deste aparelho salvou: adota o estado dela (ela ja pos as
  // mudancas na fila). Sem isso, a proxima gravacao desta aba devolveria ao
  // disco o estado velho.
  if(!window._nuvemStorageHook){
    window._nuvemStorageHook=true;
    window.addEventListener('storage',function(e){
      if(!uid)return;
      if(e.key===K.dados&&e.newValue){
        try{S=ensureArrays(JSON.parse(e.newValue));}catch(x){return;}
        if(typeof window._tsReset==='function')window._tsReset(S);
        retratar();
        if(typeof renderAll==='function')renderAll();
      }
      if(e.key===K.fila)status();
    });
  }

  mostrarApp();
  if(S.config&&S.config.theme&&typeof setTheme==='function')setTheme(S.config.theme);
  if(typeof renderAll==='function')renderAll();
  status();
  sincronizar();
  clearInterval(_intTimer);
  _intTimer=setInterval(function(){sincronizar();},INTERVALO_MS);
}

// ---------------------------------------------------------------- tela
function el(id){return document.getElementById(id);}
function montarTelas(){
  var ov=document.createElement('div');ov.className='auth-overlay';ov.id='authOverlay';
  ov.innerHTML='<form class="auth-box" id="nvForm" autocomplete="on">'+
    '<div class="auth-logo">&#128176;</div>'+
    '<div class="auth-title">Financeiro Pro</div>'+
    '<div class="auth-sub">Entre com seu e-mail e senha</div>'+
    '<div class="form-group"><label for="nvEmail">E-mail</label><input type="email" id="nvEmail" class="form-control" autocomplete="username" required></div>'+
    '<div class="form-group"><label for="nvSenha">Senha</label><input type="password" id="nvSenha" class="form-control" autocomplete="current-password" required></div>'+
    '<div class="auth-keep"><input type="checkbox" id="nvManter" checked><label for="nvManter">Manter conectado</label></div>'+
    '<button type="submit" class="auth-btn" id="nvBtn"><span>Entrar</span></button>'+
    '<div class="auth-error" id="nvErro" role="alert"></div>'+
    '<div class="auth-footer">Supabase · dados protegidos por usuário</div></form>';
  document.body.appendChild(ov);
  el('nvForm').addEventListener('submit',function(e){e.preventDefault();fazerLogin();});

  var ub=document.createElement('div');ub.className='auth-ubar';ub.id='authUBar';
  ub.innerHTML='<div class="au-left"><div class="au-avatar" id="auAvatar"></div>'+
    '<div class="au-info"><span class="au-name" id="auName"></span><span class="au-role admin" id="auRole">Supabase</span></div></div>'+
    '<div class="au-right"><div class="au-sync-info" id="auSyncTimer"></div>'+
    '<button class="au-logout" id="nvSair">Sair</button></div>';
  document.body.appendChild(ub);
  el('nvSair').addEventListener('click',sair);
}
function esconderApp(){
  ['sidebar','mobHeader'].forEach(function(i){var e=el(i);if(e)e.style.visibility='hidden';});
  var mn=document.querySelector('.main');if(mn)mn.style.visibility='hidden';
}
function mostrarApp(){
  var ov=el('authOverlay');if(ov){ov.classList.add('hiding');setTimeout(function(){ov.style.display='none';},400);}
  ['sidebar','mobHeader'].forEach(function(i){var e=el(i);if(e)e.style.visibility='visible';});
  var mn=document.querySelector('.main');if(mn)mn.style.visibility='visible';
  var nome=(email||'').split('@')[0]||'Usuário';
  if(el('auAvatar'))el('auAvatar').textContent=nome.charAt(0).toUpperCase();
  if(el('auName'))el('auName').textContent=email||nome;
  if(el('authUBar'))el('authUBar').style.display='flex';
}
function mostrarLogin(msg){
  esconderApp();
  var ov=el('authOverlay');ov.style.display='flex';ov.classList.remove('hiding');
  if(msg)el('nvErro').textContent=msg;
  setTimeout(function(){var u=ls('finApp_sb_ultimo');if(u&&u.email&&!el('nvEmail').value){el('nvEmail').value=u.email;el('nvSenha').focus();}else el('nvEmail').focus();},100);
}

async function fazerLogin(){
  var e=el('nvEmail').value.trim(),p=el('nvSenha').value,btn=el('nvBtn'),err=el('nvErro');
  if(!e||!p){err.textContent='Preencha e-mail e senha.';return;}
  if(!sb){err.textContent='Sem conexão com o servidor de login. Verifique a internet e recarregue.';return;}
  btn.disabled=true;btn.textContent='Entrando...';err.textContent='';
  try{localStorage.setItem('finApp_sb_manter',el('nvManter').checked?'1':'0');}catch(x){}
  var res;
  try{res=await sb.auth.signInWithPassword({email:e,password:p});}
  catch(x){res={error:{message:'rede'}};}
  btn.disabled=false;btn.innerHTML='<span>Entrar</span>';
  if(res.error){
    var m=String(res.error.message||'');
    // Mostra o motivo real: "senha incorreta" so quando for isso mesmo
    if(/invalid login credentials/i.test(m))err.textContent='E-mail ou senha incorretos.';
    else if(/email not confirmed/i.test(m))err.textContent='E-mail ainda não confirmado.';
    else if(/rede|fetch|network/i.test(m))err.textContent='Sem conexão com o servidor. Tente de novo.';
    else err.textContent='Não foi possível entrar: '+m;
    return;
  }
  el('nvSenha').value='';
  entrar(res.data.user);
}

async function sair(){
  var n=pendentes();
  if(n&&!confirm(n+' alteraç'+(n>1?'ões ainda não foram enviadas':'ão ainda não foi enviada')+'. Elas ficam guardadas neste aparelho e sobem no próximo login. Sair mesmo assim?'))return;
  if(!n&&!confirm('Deseja sair?'))return;
  clearInterval(_intTimer);
  try{if(sb)await sb.auth.signOut({scope:'local'});}catch(e){}
  location.reload();
}

// Tela de Backup: estado da nuvem nova
function renderCloudArea(){
  var a=el('cloudArea');if(!a)return;
  var n=pendentes();
  a.innerHTML='<p style="color:var(--ok);font-weight:600;margin-bottom:10px">Conectado ao Supabase</p>'+
    '<p style="font-size:.84em;color:var(--tx3);margin-bottom:14px">'+(email||'')+' · '+
    (n?n+' alteraç'+(n>1?'ões':'ão')+' aguardando envio':'nada pendente')+
    (_ultimoErro?' · último erro: '+_ultimoErro:'')+'</p>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="btn btn-sm btn-primary" onclick="nuvemSincronizar()">Sincronizar agora</button>'+
    '<button class="btn btn-sm btn-outline" onclick="nuvemBaixarTudo()">Buscar tudo de novo</button></div>';
}

// ---------------------------------------------------------------- inicio
// Sessao: com "Manter conectado" fica no localStorage; sem, so na aba.
var armazenamento={
  getItem:function(k){try{return localStorage.getItem(k)||sessionStorage.getItem(k);}catch(e){return null;}},
  setItem:function(k,v){try{(localStorage.getItem('finApp_sb_manter')==='0'?sessionStorage:localStorage).setItem(k,v);}catch(e){}},
  removeItem:function(k){try{localStorage.removeItem(k);sessionStorage.removeItem(k);}catch(e){}}
};
function carregarLib(){
  return new Promise(function(ok,falha){
    if(window.supabase&&window.supabase.createClient)return ok();
    var s=document.createElement('script');s.src=SB_LIB;s.onload=ok;s.onerror=function(){falha(new Error('lib'));};
    document.head.appendChild(s);
  });
}

async function iniciar(){
  window.cloudOk=false;
  montarTelas();esconderApp();
  syncUI('off','Aguardando login...');
  window.addEventListener('online',function(){status();sincronizar();});
  window.addEventListener('offline',status);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')sincronizar();});

  var ultimo=ls('finApp_sb_ultimo'),manter=localStorage.getItem('finApp_sb_manter')!=='0';
  try{
    await carregarLib();
    sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{storage:armazenamento,persistSession:true,autoRefreshToken:true,storageKey:'finApp_sb_auth'}});
    sb.auth.onAuthStateChange(function(ev){
      if(ev==='SIGNED_OUT'&&uid){uid=null;mostrarLogin('Sessão encerrada. Entre de novo.');}
    });
    var r=await sb.auth.getSession();
    var s=r&&r.data&&r.data.session;
    if(s&&s.user)return entrar(s.user);
  }catch(e){
    console.warn('[Nuvem] sem servidor de login:',e);
    // Offline ao abrir: com "Manter conectado", abre com os dados do aparelho;
    // as alteracoes ficam na fila e sobem quando a sessao voltar.
    if(ultimo&&manter&&armazenamento.getItem('finApp_sb_auth')){entrar(ultimo);return;}
  }
  mostrarLogin();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);
else iniciar();
})();

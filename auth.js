// auth.js v8 — Fix dispositivos + Visual moderno + Dados isolados + Auto-sync 5min
(function(){
'use strict';

// ================================================================
// BLOQUEAR index.html imediatamente
// ================================================================
window.cloudOk = false;
if(typeof syncTimer !== 'undefined'){ clearTimeout(syncTimer); syncTimer = null; }
window.initCloud    = function(){};
window.scheduleSync = function(){};
window.gistRead     = function(){ return Promise.resolve(null); };
window.gistWrite    = function(){ return Promise.resolve(false); };
syncUI('off','Aguardando login...');
var _mt = document.getElementById('modalToken');
if(_mt && _mt.classList.contains('show')) _mt.classList.remove('show');

// ================================================================
// CONSTANTES
// ================================================================
var SESSION_KEY    = 'finApp_session';
var DEVICE_ID_KEY  = 'finApp_device_id';
var SESSION_SHORT  = 24*60*60*1000;
var SESSION_LONG   = 90*24*60*60*1000;
var DATA_GIST_ID   = '667e29c52ee1d62185b5eae8c871faa1';
var AUTO_SYNC_MS   = 5*60*1000;
var _autoSyncTimer = null;

// ================================================================
// HELPERS
// ================================================================
async function sha256(t){
  var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0');}).join('');
}
function getDeviceId(){
  var id=localStorage.getItem(DEVICE_ID_KEY);
  if(!id){id='dev_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36);localStorage.setItem(DEVICE_ID_KEY,id);}
  return id;
}
function detectDevice(){
  var ua=navigator.userAgent||'';
  var br='Nav';
  if(ua.indexOf('Chrome')>-1&&ua.indexOf('Edg')===-1)br='Chrome';
  else if(ua.indexOf('Firefox')>-1)br='Firefox';
  else if(ua.indexOf('Safari')>-1&&ua.indexOf('Chrome')===-1)br='Safari';
  else if(ua.indexOf('Edg')>-1)br='Edge';
  var os='Desktop';
  if(/Android/i.test(ua))os='Android';else if(/iPhone|iPad|iPod/i.test(ua))os='iOS';
  else if(/Windows/i.test(ua))os='Windows';else if(/Mac/i.test(ua))os='macOS';
  else if(/Linux/i.test(ua))os='Linux';
  return br+' / '+os;
}

// ================================================================
// COLECOES SINCRONIZADAS
// ================================================================
// Lista unica, usada pelo merge, pelo carimbo de _ts e pelo ensureArrays.
// Antes esse mesmo array estava escrito nos tres lugares, e foi por isso que
// 'patrimonios' ficou de fora dos tres: o merge usa o estado REMOTO como
// base, entao patrimonio nao era mesclado — valia sempre o que estava na
// nuvem e uma inclusao feita num aparelho sumia sem aviso se o outro
// sincronizasse antes. Colecao nova entra aqui e passa a valer nos tres.
var _SYNC_COLS=['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa','patrimonios'];

// ================================================================
// DEEP MERGE
// ================================================================
function deepMergeState(local,remote){
  if(!remote||(!remote.lancamentos&&!remote.contratos&&!remote.cartoes))
    return ensureArrays(JSON.parse(JSON.stringify(local||defState())));
  if(!local||(!local.lancamentos&&!local.contratos&&!local.cartoes))
    return ensureArrays(JSON.parse(JSON.stringify(remote)));
  var r=JSON.parse(JSON.stringify(remote)),l=JSON.parse(JSON.stringify(local));

  // Merge tombstones: união de ambos os lados, maior timestamp vence por id
  var lDel=l._deletedIds||{},rDel=r._deletedIds||{},delIds={};
  Object.keys(lDel).forEach(function(id){delIds[id]=lDel[id];});
  Object.keys(rDel).forEach(function(id){delIds[id]=Math.max(delIds[id]||0,rDel[id]);});

  _SYNC_COLS.forEach(function(k){
    var ra=Array.isArray(r[k])?r[k]:[],la=Array.isArray(l[k])?l[k]:[];
    var map={};
    ra.forEach(function(i){if(i.id)map[i.id]=i;});
    la.forEach(function(i){
      if(!i.id)return;
      if(map[i.id]){var rts=map[i.id]._ts||0,lts=i._ts||0;if(lts>rts)map[i.id]=i;}
      else map[i.id]=i;
    });
    // Aplicar tombstones: remover itens deletados (tombstone mais recente que o item vence)
    Object.keys(delIds).forEach(function(id){
      if(map[id]&&delIds[id]>=(map[id]._ts||0))delete map[id];
    });
    r[k]=Object.values(map);
  });
  r._deletedIds=delIds;

  // Lixeira: uniao por lixoId. Nao entra no laco acima porque nao usa _ts
  // nem tombstone — a entrada e imutavel depois de criada.
  // "purgado" vence dos dois lados: apagar de vez num aparelho tem que valer
  // no outro. A remocao fisica fica so por conta da retencao de tempo, que
  // e a mesma nos dois lados, entao ambos convergem sem precisar sincronizar
  // a remocao (se um lado apagasse fisicamente, a uniao traria de volta).
  var lixMap={};
  (Array.isArray(r.lixeira)?r.lixeira:[]).forEach(function(it){if(it&&it.lixoId)lixMap[it.lixoId]=it;});
  (Array.isArray(l.lixeira)?l.lixeira:[]).forEach(function(it){
    if(!it||!it.lixoId)return;
    if(lixMap[it.lixoId])lixMap[it.lixoId].purgado=!!(lixMap[it.lixoId].purgado||it.purgado);
    else lixMap[it.lixoId]=it;
  });
  var limiteLix=Date.now()-(window.LIXEIRA_RETENCAO_DIAS||30)*86400000;
  r.lixeira=Object.values(lixMap).filter(function(it){return (it.excluidoEm||0)>limiteLix;});
  _mergeMapas(l,r); // planejamento, cats, config: vence a alteracao mais recente
  // Check de Pagamentos: por item, vence a alteracao mais recente
  // (checkPagamentosTs). Antes era "uniao": desmarcar apagava a chave no
  // aparelho, a nuvem ainda tinha true e o pagamento voltava marcado.
  // Itens sem horario (gravados antes de nov/2026) seguem a regra antiga:
  // o valor local, se existir, vence.
  var _obj=function(o){return o&&typeof o==='object'&&!Array.isArray(o)?o:{};};
  var lc=_obj(l.checkPagamentos),rc=_obj(r.checkPagamentos),
      lt=_obj(l.checkPagamentosTs),rt=_obj(r.checkPagamentosTs),ck={},ckTs={};
  Object.keys(Object.assign({},lc,rc)).forEach(function(m){
    var lm=_obj(lc[m]),rm=_obj(rc[m]),ltm=_obj(lt[m]),rtm=_obj(rt[m]),om={},otm={};
    Object.keys(Object.assign({},lm,rm)).forEach(function(k){
      var a=ltm[k]||0,b=rtm[k]||0;
      if(a>b)om[k]=lm[k];
      else if(b>a)om[k]=rm[k];
      else om[k]=(k in lm)?lm[k]:rm[k];
      if(a||b)otm[k]=Math.max(a,b);
    });
    ck[m]=om;if(Object.keys(otm).length)ckTs[m]=otm;
  });
  r.checkPagamentos=ck;r.checkPagamentosTs=ckTs;
  var _mesclado=ensureArrays(r);
  // O estado mesclado vira a nova referencia: nada nele deve ser
  // considerado "alterado localmente" no proximo salvar().
  _tsReset(_mesclado);
  return _mesclado;
}

// ================================================================
// CARIMBO DE ALTERACAO (_ts)
// ----------------------------------------------------------------
// deepMergeState resolve conflito por _ts (linha "if(lts>rts)"), mas
// nada no app gravava esse campo: os dois lados ficavam em 0, a
// comparacao dava falso e o REMOTO vencia sempre. Consequencia: se o
// sync de 3s falhasse (rede), o auto-sync de 5min sobrescrevia a
// edicao local com a versao antiga da nuvem.
// Aqui marcamos _ts apenas nos itens que realmente mudaram, comparando
// com um retrato do ultimo estado salvo/mesclado.
// ================================================================
var _TS_COLS=_SYNC_COLS;
var _tsSnap={};

// ----------------------------------------------------------------
// MAPAS FORA DAS COLECOES: planejamento, cats, config
// ----------------------------------------------------------------
// O merge antigo era "uniao" (planejamento e cats) ou "local sempre vence"
// (config). Consequencias: limite editado voltava ao valor da nuvem, limite
// ou categoria apagados reapareciam, e o tema de um aparelho desatualizado
// desfazia a troca feita no outro. Agora cada chave tem o horario da ultima
// alteracao (inclusive remocao) em st._mapTs[mapa][chave], carimbado no
// salvar() por comparacao com o retrato anterior - nenhuma tela precisa
// saber disso. Chaves sem horario (dados antigos) seguem a regra antiga.
var _SEP='\u0001';
function _o(x){return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}
var _MAPAS={
  planejamento:{
    flat:function(o){var f={};Object.keys(_o(o)).forEach(function(m){Object.keys(_o(o[m])).forEach(function(c){f[m+_SEP+c]=o[m][c];});});return f;},
    unflat:function(f){var o={};Object.keys(f).forEach(function(k){var p=k.split(_SEP);(o[p[0]]=o[p[0]]||{})[p[1]]=f[k];});return o;},
    legado:function(k,lf,rf){return (k in rf)?rf[k]:lf[k];} // nuvem vence; local so completa
  },
  cats:{
    flat:function(o){var f={};Object.keys(_o(o)).forEach(function(t){(Array.isArray(o[t])?o[t]:[]).forEach(function(c){f[t+_SEP+c]=true;});});return f;},
    unflat:function(f){var o={};Object.keys(f).forEach(function(k){var p=k.split(_SEP);(o[p[0]]=o[p[0]]||[]).push(p[1]);});return o;},
    legado:function(k,lf,rf){return true;} // uniao
  },
  config:{
    flat:function(o){var f={};Object.keys(_o(o)).forEach(function(k){f[k]=o[k];});return f;},
    unflat:function(f){return Object.assign({},f);},
    legado:function(k,lf,rf){return (k in lf)?lf[k]:rf[k];} // local vence
  }
};
var _mapSnap={};
function _fp(v){try{return JSON.stringify(v);}catch(e){return '';}}
function _mapRetrato(st){
  var s={};Object.keys(_MAPAS).forEach(function(n){var f=_MAPAS[n].flat(st[n]),m={};Object.keys(f).forEach(function(k){m[k]=_fp(f[k]);});s[n]=m;});return s;
}
function _mapCarimbar(st){
  var agora=Date.now(),atual=_mapRetrato(st);
  if(!st._mapTs||typeof st._mapTs!=='object')st._mapTs={};
  Object.keys(_MAPAS).forEach(function(n){
    var ant=_mapSnap[n]||{},cur=atual[n],ts=st._mapTs[n]=_o(st._mapTs[n]);
    Object.keys(cur).forEach(function(k){if(ant[k]!==cur[k])ts[k]=agora;});
    Object.keys(ant).forEach(function(k){if(!(k in cur))ts[k]=agora;}); // removida
  });
  _mapSnap=atual;
}
function _mergeMapas(l,r){
  var lts=_o(l._mapTs),rts=_o(r._mapTs),outTs={};
  Object.keys(_MAPAS).forEach(function(n){
    var M=_MAPAS[n],lf=M.flat(l[n]),rf=M.flat(r[n]),lt=_o(lts[n]),rt=_o(rts[n]),out={},ot={};
    var chaves=[];[rf,lf,rt,lt].forEach(function(o){Object.keys(o).forEach(function(k){if(chaves.indexOf(k)===-1)chaves.push(k);});});
    chaves.forEach(function(k){
      var a=lt[k]||0,b=rt[k]||0;
      if(a>b){if(k in lf)out[k]=lf[k];}
      else if(b>a){if(k in rf)out[k]=rf[k];}
      else if((k in lf)||(k in rf))out[k]=M.legado(k,lf,rf);
      if(a||b)ot[k]=Math.max(a,b);
    });
    var res=M.unflat(out);
    // grupos vazios (mes sem limite, tipo sem categoria) nao aparecem no
    // formato chave-a-chave; recoloca-os para o merge nao sumir com nada
    if(n!=='config')[l[n],r[n]].forEach(function(o){Object.keys(_o(o)).forEach(function(g){if(!(g in res))res[g]=Array.isArray(o[g])?[]:{};});});
    r[n]=res;outTs[n]=ot;
  });
  r._mapTs=outTs;
}

function _tsFingerprint(it){
  var c={};
  Object.keys(it).forEach(function(k){ if(k!=='_ts') c[k]=it[k]; });
  try{ return JSON.stringify(c); }catch(e){ return ''; }
}

// Define o estado atual como referencia (sem marcar nada como alterado)
function _tsReset(st){
  _tsSnap={};
  if(!st) return;
  _mapSnap=_mapRetrato(st);
  _TS_COLS.forEach(function(col){
    var m={};
    (Array.isArray(st[col])?st[col]:[]).forEach(function(it){
      if(it&&it.id) m[it.id]=_tsFingerprint(it);
    });
    _tsSnap[col]=m;
  });
}

// Marca _ts nos itens novos ou modificados desde a ultima referencia
function _tsStamp(st){
  if(!st) return;
  _mapCarimbar(st);
  var agora=Date.now();
  _TS_COLS.forEach(function(col){
    var anterior=_tsSnap[col]||{}, atual={};
    (Array.isArray(st[col])?st[col]:[]).forEach(function(it){
      if(!it||!it.id) return;
      var fp=_tsFingerprint(it);
      atual[it.id]=fp;
      if(anterior[it.id]!==fp) it._ts=agora;
    });
    _tsSnap[col]=atual;
  });
}
window._tsReset=_tsReset;
window._tsStamp=_tsStamp;
window.deepMergeState=deepMergeState; // exposto para inspecao/teste do merge
// Historico de contratos/assinaturas sempre em ordem de mes, um ajuste por
// mes, e .valor = o do ajuste mais recente. Os ajustes eram empilhados na
// ordem em que foram digitados e varios leitores pegam "o ultimo que casa"
// na ordem do array: um ajuste RETROATIVO (ex.: junho, lancado em novembro)
// passava a valer para novembro, e ainda sobrescrevia .valor.
function normalizarHistoricos(st){
  ['contratos','assinaturas'].forEach(function(col){
    (Array.isArray(st[col])?st[col]:[]).forEach(function(it){
      if(!it||!Array.isArray(it.historico)||!it.historico.length)return;
      // Ordenacao estavel e sem apagar nada: dois ajustes no mesmo mes ficam
      // na ordem em que foram digitados, e os leitores ("ultimo que casa")
      // continuam pegando o mais recente digitado.
      var hs=it.historico.filter(function(h){return h&&h.de;});
      hs.sort(function(a,b){var x=String(a.de).substring(0,7),y=String(b.de).substring(0,7);return x<y?-1:x>y?1:0;});
      if(hs.length!==it.historico.length)return; // entrada sem mes: nao mexe neste item
      it.historico=hs;
      it.valor=Number(hs[hs.length-1].valor)||0;
    });
  });
  return st;
}
window.normalizarHistoricos=normalizarHistoricos;

function ensureArrays(st){
  _SYNC_COLS.forEach(function(k){
    if(!Array.isArray(st[k]))st[k]=[];
  });
  normalizarHistoricos(st);
  if(!st.planejamento||Array.isArray(st.planejamento))st.planejamento={};
  if(!st.cats)st.cats=JSON.parse(JSON.stringify(defCats));
  Object.keys(defCats).forEach(function(k){if(!Array.isArray(st.cats[k]))st.cats[k]=defCats[k].slice();});
  if(!st.config)st.config={theme:'dark'};
  if(!st._deletedIds||typeof st._deletedIds!=='object'||Array.isArray(st._deletedIds))st._deletedIds={};
  if(!Array.isArray(st.lixeira))st.lixeira=[];
  return st;
}

// ================================================================
// GIST READ / WRITE — cache inteligente para evitar leituras duplicadas
// ================================================================
var _gistCache=null, _gistCacheTime=0, GIST_CACHE_TTL=5000;
var _gistLastErr=''; // motivo da ultima falha de leitura/gravacao, para a mensagem de sync

async function readGistFull(){
  var tk=_getToken();if(!tk){_gistLastErr='sem token';return null;}
  if(_gistCache && (Date.now()-_gistCacheTime)<GIST_CACHE_TTL) return _gistCache;
  try{
    // no-store: a API do GitHub responde com max-age=60, e o navegador
    // servia a versao de ate 1 min atras. Mesclar com ela e gravar apagava
    // o que o outro aparelho tinha acabado de enviar.
    var r=await fetch('https://api.github.com/gists/'+DATA_GIST_ID,{cache:'no-store',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});
    if(!r.ok){_gistLastErr='HTTP '+r.status;return null;}
    _gistCache=await r.json();_gistCacheTime=Date.now();
    return _gistCache;
  }catch(e){_gistLastErr='rede';return null;}
}
function invalidateGistCache(){_gistCache=null;_gistCacheTime=0;}

// Leitura para sincronizar. Distingue "a nuvem nao tem o arquivo" (null) de
// "nao deu para ler" (lanca erro). Antes as duas viravam null e quem chamava
// gravava o estado local por cima da nuvem, exibindo "Cloud conectado".
async function readUserGistStrict(user){
  invalidateGistCache();
  var g=await readGistFull();
  if(!g)throw new Error(_gistLastErr||'leitura falhou');
  var f=g.files&&g.files[getUserFileKey(user)];
  if(!f)return null;
  if(f.truncated)throw new Error('arquivo truncado');
  return JSON.parse(f.content);
}

async function readGistFile(fileName){
  var g=await readGistFull();if(!g)return null;
  var f=g.files&&g.files[fileName];
  try{return(f&&f.content)?JSON.parse(f.content):null;}catch(e){return null;}
}

async function writeGistFiles(filesObj){
  var tk=_getToken();if(!tk)return false;
  var files={};
  Object.keys(filesObj).forEach(function(fn){
    // Sem indentacao: o arquivo fica ~30% menor (mais longe do limite de
    // 1 MB do Gist, em que o conteudo vem truncado e o sync para).
    files[fn]={content:JSON.stringify(filesObj[fn])};
  });
  try{
    var r=await fetch('https://api.github.com/gists/'+DATA_GIST_ID,{
      method:'PATCH',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk,'Content-Type':'application/json'},
      body:JSON.stringify({files:files})});
    invalidateGistCache();
    if(!r.ok)_gistLastErr='HTTP '+r.status;
    return r.ok;
  }catch(e){_gistLastErr='rede';return false;}
}

async function writeGistFile(fileName,data){
  var obj={};obj[fileName]=data;return await writeGistFiles(obj);
}

function getUserFileKey(u){return u.toLowerCase().replace(/[^a-z0-9]/g,'_')+'.json';}
function getUserStorageKey(u){return 'finApp_v5_'+u.toLowerCase().replace(/[^a-z0-9]/g,'_');}
async function readUserGistFile(user){return await readGistFile(getUserFileKey(user));}
async function writeUserGistFile(user,data){return await writeGistFile(getUserFileKey(user),data);}
async function readAuthGist(){return await readGistFile('auth_users.json');}
async function writeAuthGist(data){return await writeGistFile('auth_users.json',data);}

async function ensureAuthFile(){
  // So cria o arquivo quando a leitura funcionou e ele de fato nao existe.
  // Antes, qualquer falha de leitura (rede, limite da API) caia aqui e
  // regravava auth_users.json vazio, apagando os usuarios.
  var g=await readGistFull();if(!g)return null;
  var f=g.files&&g.files['auth_users.json'];
  if(f){
    var ad=null;try{ad=JSON.parse(f.content);}catch(e){return null;}
    if(ad&&ad.users)return ad;
  }
  var data={users:[]};
  await writeGistFile('auth_users.json',data);
  return data;
}

// ================================================================
// CSS — VISUAL MODERNO (glassmorphism, gradientes, animações)
// ================================================================
// CSS movido para app.css (bloco 1 deste arquivo)

// ================================================================
// HTML LOGIN
// ================================================================
var _hasToken=!!(localStorage.getItem('finApp_gist_token_enc'));
var ov=document.createElement('div');ov.className='auth-overlay';ov.id='authOverlay';
// Sempre no DOM: com token salvo fica oculto, e o login o reexibe quando o
// GitHub recusa o token guardado (expirado/revogado), para trocar por um novo.
var tkHTML='<div class="auth-token-section" id="authTokenSection"'+(_hasToken?' style="display:none"':'')+'>'+
    '<div class="ats-title" id="authTokenTitle">\u26a0 Primeira conex\u00e3o neste dispositivo</div>'+
    '<div class="form-group" style="margin-bottom:8px"><label>Token GitHub (permiss\u00e3o gist)</label>'+
    '<input type="password" id="authToken" class="form-control" placeholder="ghp_xxxxxxxxxxxx" autocomplete="off"></div>'+
    '<div class="ats-help">Pe\u00e7a ao administrador ou crie em '+
    '<a href="https://github.com/settings/tokens/new?scopes=gist&description=FinanceiroPro" target="_blank">github.com/settings/tokens</a> com permiss\u00e3o <strong>gist</strong>.</div></div>';
ov.innerHTML='<div class="auth-box"><div class="auth-logo">&#128176;</div>'+
  '<div class="auth-title">Financeiro Pro</div>'+
  '<div class="auth-sub">Fa\u00e7a login para acessar seus dados financeiros</div>'+tkHTML+
  '<div class="form-group"><label>Usu\u00e1rio</label><input type="text" id="authUser" class="form-control" placeholder="Digite seu usu\u00e1rio" autocomplete="username"></div>'+
  '<div class="form-group"><label>Senha</label><input type="password" id="authPass" class="form-control" placeholder="Digite sua senha" autocomplete="current-password"></div>'+
  '<div class="auth-keep"><input type="checkbox" id="authKeep"><label for="authKeep">Manter conectado</label></div>'+
  '<button class="auth-btn" id="authLoginBtn" onclick="window._authDoLogin()"><span>Entrar</span></button>'+
  '<div class="auth-error" id="authError"></div>'+
  '<div class="auth-footer">Acesso protegido \u00b7 Criptografia SHA-256</div></div>';
document.body.appendChild(ov);

var ubar=document.createElement('div');ubar.className='auth-ubar';ubar.id='authUBar';
ubar.innerHTML='<div class="au-left">'+
  '<div class="au-avatar" id="auAvatar"></div>'+
  '<div class="au-info"><span class="au-name" id="auName"></span><span class="au-role" id="auRole"></span></div></div>'+
  '<div class="au-right">'+
  '<div class="au-sync-info" id="auSyncTimer"></div>'+
  '<button class="au-logout" onclick="window._authDoLogout()">Sair</button></div>';
document.body.appendChild(ubar);

document.getElementById('authPass').addEventListener('keydown',function(e){if(e.key==='Enter')window._authDoLogin();});
document.getElementById('authUser').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('authPass').focus();});
var _atkEl=document.getElementById('authToken');
if(_atkEl)_atkEl.addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('authUser').focus();});
window._authCurrentUser=null;

// ================================================================
// TOKEN — criptografado com AES-GCM (PBKDF2 da senha)
// ================================================================
var _TOKEN_ENC_KEY = 'finApp_gist_token_enc';
var _TOKEN_SESS_KEY = 'finApp_tk_sesskey';

function _setGistToken(t){window.gistToken=t;}
function _getToken(){return window.gistToken||'';}

async function _pbkdf2Key(pass, salt){
  var km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey(
    {name:'PBKDF2',salt:salt,iterations:100000,hash:'SHA-256'},
    km,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);
}
async function _encryptToken(token, pass){
  var salt=crypto.getRandomValues(new Uint8Array(16));
  var iv=crypto.getRandomValues(new Uint8Array(12));
  var key=await _pbkdf2Key(pass,salt);
  var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,new TextEncoder().encode(token));
  var buf=new Uint8Array(28+ct.byteLength);
  buf.set(salt,0);buf.set(iv,16);buf.set(new Uint8Array(ct),28);
  localStorage.setItem(_TOKEN_ENC_KEY,btoa(String.fromCharCode(...buf)));
  // Salvar chave derivada na sessão para uso sem senha
  var raw=await crypto.subtle.exportKey('raw',key);
  sessionStorage.setItem(_TOKEN_SESS_KEY,btoa(String.fromCharCode(...new Uint8Array(raw))));
}
async function _decryptToken(pass){
  var enc=localStorage.getItem(_TOKEN_ENC_KEY);if(!enc)return null;
  try{
    var buf=Uint8Array.from(atob(enc),function(c){return c.charCodeAt(0);});
    var key=await _pbkdf2Key(pass,buf.slice(0,16));
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.slice(16,28)},key,buf.slice(28));
    var token=new TextDecoder().decode(pt);
    var raw=await crypto.subtle.exportKey('raw',key);
    sessionStorage.setItem(_TOKEN_SESS_KEY,btoa(String.fromCharCode(...new Uint8Array(raw))));
    return token;
  }catch(e){return null;}
}
async function _getTokenFromSession(){
  var skb64=sessionStorage.getItem(_TOKEN_SESS_KEY);if(!skb64)return null;
  var enc=localStorage.getItem(_TOKEN_ENC_KEY);if(!enc)return null;
  try{
    var skRaw=Uint8Array.from(atob(skb64),function(c){return c.charCodeAt(0);});
    var key=await crypto.subtle.importKey('raw',skRaw,{name:'AES-GCM'},false,['decrypt']);
    var buf=Uint8Array.from(atob(enc),function(c){return c.charCodeAt(0);});
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.slice(16,28)},key,buf.slice(28));
    return new TextDecoder().decode(pt);
  }catch(e){return null;}
}
// Token trocado depois do login (tela de Backup / modal Conectar). Regrava o
// arquivo principal no mesmo formato do login: mesmo salt, e a chave da sessao
// e justamente a derivada da senha com esse salt. Antes ia para uma chave
// '_sess' que ninguem lia, e o token novo sumia ao recarregar a pagina.
async function _reencryptTokenWithSessionKey(token){
  var skb64=sessionStorage.getItem(_TOKEN_SESS_KEY);
  var enc=localStorage.getItem(_TOKEN_ENC_KEY);
  if(!skb64||!enc)return false;
  try{
    var skRaw=Uint8Array.from(atob(skb64),function(c){return c.charCodeAt(0);});
    var key=await crypto.subtle.importKey('raw',skRaw,{name:'AES-GCM'},false,['encrypt']);
    var old=Uint8Array.from(atob(enc),function(c){return c.charCodeAt(0);});
    var iv=crypto.getRandomValues(new Uint8Array(12));
    var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,new TextEncoder().encode(token));
    var buf=new Uint8Array(28+ct.byteLength);
    buf.set(old.slice(0,16),0);buf.set(iv,16);buf.set(new Uint8Array(ct),28);
    localStorage.setItem(_TOKEN_ENC_KEY,btoa(String.fromCharCode(...buf)));
    return true;
  }catch(e){return false;}
}
localStorage.removeItem(_TOKEN_ENC_KEY+'_sess'); // sobra do formato antigo, nunca lido

// ----------------------------------------------------------------
// TOKEN DO APARELHO — para o "Manter conectado"
// A chave que abre o token salvo vinha da senha e ficava so no
// sessionStorage. Ao fechar o navegador ela sumia, mas a sessao de 90 dias
// continuava valida: o app abria sem pedir senha e sem token, ficava
// offline e nenhuma alteracao subia para a nuvem (so o "Entre para
// sincronizar" e o campo de token na tela de Backup).
// Agora, com "Manter conectado", o token e cifrado com uma chave AES gerada
// no aparelho, NAO exportavel, guardada no IndexedDB: o JS da pagina
// consegue usa-la, mas ela nao sai do navegador nem aparece num dump do
// localStorage. Sair do app apaga.
// ----------------------------------------------------------------
var _IDB_TK='deviceToken';
function _idbReq(mode,fn){
  return new Promise(function(res,rej){
    var o=indexedDB.open('finApp',1);
    o.onupgradeneeded=function(){o.result.createObjectStore('kv');};
    o.onerror=function(){rej(o.error);};
    o.onsuccess=function(){
      var db=o.result,tx=db.transaction('kv',mode),q=fn(tx.objectStore('kv')),out;
      q.onsuccess=function(){out=q.result;};
      tx.oncomplete=function(){db.close();res(out);};
      tx.onerror=tx.onabort=function(){db.close();rej(tx.error);};
    };
  });
}
async function _saveDeviceToken(token){
  try{
    var key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    var iv=crypto.getRandomValues(new Uint8Array(12));
    var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,new TextEncoder().encode(token));
    await _idbReq('readwrite',function(s){return s.put({key:key,iv:iv,ct:ct},_IDB_TK);});
    return true;
  }catch(e){console.warn('[Auth] token do aparelho nao foi salvo:',e);return false;}
}
async function _getDeviceToken(){
  try{
    var r=await _idbReq('readonly',function(s){return s.get(_IDB_TK);});
    if(!r||!r.key)return null;
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:r.iv},r.key,r.ct);
    return new TextDecoder().decode(pt);
  }catch(e){return null;}
}
async function _clearDeviceToken(){
  try{await _idbReq('readwrite',function(s){return s.delete(_IDB_TK);});}catch(e){}
}
// Token para a sessao atual: o da aba (login com senha) ou o do aparelho.
async function _recuperarToken(){
  if(window.gistToken)return window.gistToken;
  var t=await _getTokenFromSession();
  if(!t){var s=getSession();if(s&&s.keep)t=await _getDeviceToken();}
  if(t)window.gistToken=t;
  return t||'';
}
// Token digitado depois do login: vale para os dois cofres.
async function _guardarTokenNovo(token){
  await _reencryptTokenWithSessionKey(token);
  var s=getSession();
  if(s&&s.keep)await _saveDeviceToken(token);
}

// ================================================================
// SESSÃO
// ================================================================
function getSession(){
  try{var s=JSON.parse(localStorage.getItem(SESSION_KEY));
    if(s&&s.user&&s.expires&&Date.now()<s.expires)return s;
    localStorage.removeItem(SESSION_KEY);return null;}catch(e){return null;}
}
function setSession(u,role,keep){
  var dur=keep?SESSION_LONG:SESSION_SHORT;
  localStorage.setItem(SESSION_KEY,JSON.stringify({user:u,role:role,deviceId:getDeviceId(),loginAt:Date.now(),expires:Date.now()+dur,keep:!!keep}));
}
function clearSession(){localStorage.removeItem(SESSION_KEY);}

// ================================================================
// DISPOSITIVOS — FIX: leitura atômica, sem race condition
// ================================================================
async function registerDevice(user,keep){
  // Invalidar cache para garantir leitura fresca
  invalidateGistCache();
  var d=await readAuthGist();
  if(!d||!d.users){console.warn('[Auth v8] registerDevice: auth_users.json não encontrado');return false;}
  var u=d.users.find(function(x){return x.username.toLowerCase()===user.toLowerCase();});
  if(!u){console.warn('[Auth v8] registerDevice: usuário não encontrado');return false;}
  if(!Array.isArray(u.sessions))u.sessions=[];
  var did=getDeviceId(),dur=keep?SESSION_LONG:SESSION_SHORT;
  // Remover sessão antiga deste device
  u.sessions=u.sessions.filter(function(s){return s.deviceId!==did;});
  // Adicionar nova
  u.sessions.push({
    deviceId:did,
    device:detectDevice(),
    loginAt:new Date().toISOString(),
    expiresAt:new Date(Date.now()+dur).toISOString(),
    keep:!!keep
  });
  // Limpar expiradas de todos
  d.users.forEach(function(x){
    if(!Array.isArray(x.sessions))x.sessions=[];
    x.sessions=x.sessions.filter(function(s){return new Date(s.expiresAt).getTime()>Date.now();});
  });
  var ok=await writeAuthGist(d);
  console.log('[Auth v8] registerDevice:',ok?'OK':'FALHOU','- device:',did,'- user:',user);
  return ok;
}

async function unregisterDevice(user,did){
  invalidateGistCache();
  var d=await readAuthGist();if(!d||!d.users)return;
  var u=d.users.find(function(x){return x.username.toLowerCase()===user.toLowerCase();});
  if(!u||!Array.isArray(u.sessions))return;
  u.sessions=u.sessions.filter(function(s){return s.deviceId!==did;});
  await writeAuthGist(d);
}

// ================================================================
// MIGRAÇÃO ANDERSON
// ================================================================
async function migrateAndersonOnce(){
  // Após migração confirmada, nunca mais verificar (economiza 1 read no Gist a cada login)
  if(localStorage.getItem('finApp_migrated_v1'))return null;
  // Leitura estrita: se falhar, nao migra. Com a leitura antiga uma falha
  // parecia "anderson.json vazio" e o financeiro.json legado era gravado
  // por cima dos dados atuais.
  var userFile;
  try{userFile=await readUserGistStrict('Anderson');}catch(e){return null;}
  if(userFile&&((userFile.lancamentos&&userFile.lancamentos.length>0)||(userFile.contratos&&userFile.contratos.length>0)||(userFile.cartoes&&userFile.cartoes.length>0))){
    localStorage.setItem('finApp_migrated_v1','1');
    return null;
  }
  var legacy=await readGistFile('financeiro.json');
  if(!legacy||(!legacy.lancamentos&&!legacy.contratos&&!legacy.cartoes))return null;
  await writeUserGistFile('Anderson',legacy);
  localStorage.setItem('finApp_migrated_v1','1');
  console.log('[Auth v8] Migração: financeiro.json → anderson.json');
  return legacy;
}

// ================================================================
// SWITCH TO USER DATA
// ================================================================
function switchToUserData(user,skipRender){
  var uKey=getUserStorageKey(user);
  window._userSK=uKey;window._authUsername=user;
  try{var d=JSON.parse(localStorage.getItem(uKey));if(d){S=ensureArrays(d);}else{S=defState();}}catch(e){S=defState();}
  _tsReset(S); // estado recem-carregado e a referencia inicial

  window.salvar=function(){
    if(!window._userSK)return;
    normalizarHistoricos(S);
    _tsStamp(S); // marca o que mudou, para o merge saber quem e mais recente
    localStorage.setItem(window._userSK,JSON.stringify(S));
    window.scheduleSync();
  };

  // ------------------------------------------------------------
  // SINCRONIZAR = ler a nuvem, mesclar, gravar. Sempre os tres.
  // Antes o salvar() e o "Sincronizar Agora" so gravavam: o aparelho com o
  // estado velho apagava da nuvem o que o outro tinha lancado, e a tela
  // mostrava "Sync" porque a gravacao em si dava certo. Todo caminho que
  // fala com a nuvem (salvar, auto-sync, botoes, login, voltar ao app)
  // passa por aqui.
  // ------------------------------------------------------------
  var _ust=null,_syncing=false,_syncPend=false;
  function _temDados(o){return !!(o&&typeof o==='object'&&(o.lancamentos||o.cartoes||o.contratos));}
  async function syncMerge(semRender){
    if(!cloudOk||!window._authUsername)return false;
    // Ja tem um em andamento: roda de novo quando ele terminar. Antes a
    // chamada era descartada e a edicao feita nesse meio-tempo nao subia.
    if(_syncing){_syncPend=true;return false;}
    _syncing=true;syncUI('loading','Sincronizando...');
    var ok=false;
    try{
      var rem=await readUserGistStrict(window._authUsername);
      // Nenhum await entre ler S e substitui-lo: uma edicao feita durante a
      // leitura ja esta em S e entra no merge.
      var antes=JSON.stringify(S);
      if(_temDados(rem))S=deepMergeState(S,rem);
      var depois=JSON.stringify(S);
      localStorage.setItem(window._userSK,depois);
      if(!semRender&&depois!==antes&&typeof renderAll==='function')renderAll();
      // Nuvem ja igual ao resultado: nao precisa gravar
      if(_temDados(rem)&&JSON.stringify(ensureArrays(rem))===depois)ok=true;
      else ok=await writeUserGistFile(window._authUsername,S);
      syncUI('on',ok?'Sync '+new Date().toLocaleTimeString('pt-BR'):'Erro sync ('+(_gistLastErr||'?')+')');
    }catch(e){
      console.error('[Sync]',e);
      syncUI('on','Erro sync ('+((e&&e.message)||'rede')+')');
    }
    _syncing=false;_lastAutoSync=Date.now();
    if(_syncPend){_syncPend=false;setTimeout(function(){syncMerge();},0);}
    return ok;
  }
  window._authSyncNow=syncMerge;

  window.scheduleSync=function(){
    if(!cloudOk)return;clearTimeout(_ust);
    _ust=setTimeout(function(){syncMerge();},3000);
  };

  // Ao voltar para o app. O iOS congela o setInterval com o app em segundo
  // plano, entao o celular passava o fim de semana sem buscar nada da nuvem
  // e seguia exibindo o ultimo "Sync". Registrado uma vez so: switchToUserData
  // roda de novo a cada login, e _authSyncNow aponta sempre para o atual.
  if(!window._authSyncHooks){
    window._authSyncHooks=true;
    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='visible'&&window._authSyncNow)window._authSyncNow();
    });
    window.addEventListener('online',function(){if(window._authSyncNow)window._authSyncNow();});
  }

  // AUTO-SYNC 5 min
  function startAutoSync(){
    stopAutoSync();
    _lastAutoSync=Date.now();
    _autoSyncTimer=setInterval(function(){syncMerge();},AUTO_SYNC_MS);
    updateSyncCountdown();
  }
  function stopAutoSync(){
    if(_autoSyncTimer){clearInterval(_autoSyncTimer);_autoSyncTimer=null;}
    if(_countdownTimer){clearInterval(_countdownTimer);_countdownTimer=null;}
  }
  var _countdownTimer=null,_lastAutoSync=Date.now();
  function updateSyncCountdown(){
    if(_countdownTimer)clearInterval(_countdownTimer);
    _countdownTimer=setInterval(function(){
      var el=document.getElementById('auSyncTimer');if(!el)return;
      if(!cloudOk){el.innerHTML='<span style="color:var(--dn2)">Offline</span>';return;}
      var left=Math.max(0,Math.round((AUTO_SYNC_MS-(Date.now()-_lastAutoSync))/1000));
      var m=Math.floor(left/60),s=left%60;
      el.innerHTML='<span style="color:var(--ok)">\u25cf</span> Pr\u00f3x. sync: '+m+':'+String(s).padStart(2,'0');
    },1000);
  }
  window._authStartAutoSync=startAutoSync;
  window._authStopAutoSync=stopAutoSync;

  window.gistRead=async function(){return await readUserGistFile(window._authUsername);};
  window.gistWrite=async function(d){return await writeUserGistFile(window._authUsername,d);};

  window.connectCloud=async function(){
    var t=(document.getElementById('inputToken')||{}).value;
    if(!t)t=(document.getElementById('bkToken')||{}).value;
    if(!t||!t.trim()){alert('Informe o token.');return;}
    _setGistToken(t.trim());await _guardarTokenNovo(t.trim());syncUI('loading','Conectando...');
    var tm=document.getElementById('modalToken');if(tm&&tm.classList.contains('show'))closeM('modalToken');
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    cloudOk=true;
    await syncMerge(true);
    renderAll();
    startAutoSync();
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  window.initCloud=async function(){
    await _recuperarToken();
    if(!window.gistToken){cloudOk=false;syncUI('off','Sem token: saia e entre de novo para sincronizar');return;}
    syncUI('loading','Conectando...');
    invalidateGistCache();
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    cloudOk=true;
    // Se a leitura falhar, o erro fica visivel e o auto-sync tenta de novo;
    // o estado local nao e mais gravado por cima da nuvem.
    await syncMerge(true);
    if(typeof renderAll==='function')renderAll(); // o login pula o render: este e o unico
    startAutoSync();
  };

  window.doPullGist=async function(){await syncMerge();};

  window.doConnectFromBk=async function(){
    var t=(document.getElementById('bkToken')||{}).value;
    if(!t||!t.trim()){alert('Informe o token.');return;}
    _setGistToken(t.trim());await _guardarTokenNovo(t.trim());syncUI('loading','Conectando...');
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    cloudOk=true;
    await syncMerge(true);
    renderAll();
    startAutoSync();
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  // Restaurar do Cloud: substitui local DIRETO pelo Gist sem merge (recuperação de emergência)
  window.doReplaceWithGist=async function(){
    if(!confirm('Isso vai substituir todos os dados locais pelos dados do Cloud. Continuar?'))return;
    syncUI('loading','Restaurando...');invalidateGistCache();
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&typeof rem==='object'&&(rem.lancamentos||rem.cartoes||rem.contratos)){
      S=ensureArrays(JSON.parse(JSON.stringify(rem)));
      _tsReset(S); // restaurado da nuvem: nada e alteracao local
      localStorage.setItem(window._userSK,JSON.stringify(S));
      if(typeof renderAll==='function')renderAll();
      syncUI('on','Dados restaurados do Cloud');
      if(typeof bkMsg==='function')bkMsg('Dados restaurados do Cloud com sucesso!',true);
    }else{
      syncUI('on','Nenhum dado encontrado no Cloud');
      if(typeof bkMsg==='function')bkMsg('Nenhum dado encontrado no Cloud.',false);
    }
  };

  window.doSyncNow=async function(){
    await _recuperarToken();
    await syncMerge();
  };

  window.doDisconnect=function(){
    window.gistToken='';cloudOk=false;
    localStorage.removeItem(_TOKEN_ENC_KEY);
    sessionStorage.removeItem(_TOKEN_SESS_KEY);_clearDeviceToken();
    stopAutoSync();syncUI('off','Offline');
    var el=document.getElementById('auSyncTimer');if(el)el.textContent='';
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  window.skipCloud=function(){
    var m=document.getElementById('modalToken');if(m&&m.classList.contains('show'))closeM('modalToken');
    cloudOk=false;syncUI('off','Offline');
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  if(S.config&&S.config.theme&&typeof setTheme==='function')setTheme(S.config.theme);
  if(!skipRender&&typeof renderAll==='function')renderAll();
}

// ================================================================
// LOGIN — FIX: await registerDevice ANTES de initCloud
// ================================================================
window._authDoLogin=async function(){
  var ue=document.getElementById('authUser'),pe=document.getElementById('authPass'),
      te=document.getElementById('authToken'),ke=document.getElementById('authKeep'),
      ee=document.getElementById('authError'),btn=document.getElementById('authLoginBtn');
  var user=(ue.value||'').trim(),pass=pe.value,keep=ke.checked;
  if(!user||!pass){ee.textContent='Preencha usu\u00e1rio e senha.';return;}
  btn.disabled=true;btn.textContent='Verificando...';ee.textContent='';
  // Descriptografar token salvo usando a senha (gera chave de sess\u00e3o automaticamente)
  var decTk=await _decryptToken(pass);
  if(decTk){window.gistToken=decTk;}
  // Se o campo de token foi preenchido, usar e criptografar com a senha
  if(te){var tv=(te.value||'').trim();if(tv){window.gistToken=tv;await _encryptToken(tv,pass);}}
  // Migra\u00e7\u00e3o \u00fanica: se ainda h\u00e1 token em plaintext, criptografar e remover
  if(!window.gistToken){var legTk=localStorage.getItem('finApp_gist_token');if(legTk){window.gistToken=legTk;await _encryptToken(legTk,pass);localStorage.removeItem('finApp_gist_token');}}
  var tk=_getToken();
  if(!tk){
    ee.textContent='Informe o Token GitHub.';
    var sec0=document.getElementById('authTokenSection');if(sec0)sec0.style.display=''; // estava oculto se havia token salvo
    btn.disabled=false;btn.textContent='Entrar';return;
  }
  var ih=await sha256(pass),role='user',ok=false;
  invalidateGistCache();
  var ad=await ensureAuthFile();
  // Sem leitura da nuvem nao da para conferir a senha. Antes isso caia em
  // "Usuario ou senha incorretos" (ou, pior, recriava a lista de usuarios).
  if(!ad){
    var err=_gistLastErr||'sem resposta';
    if(/HTTP 40[13]/.test(err)){
      ee.textContent='O GitHub recusou o token salvo neste aparelho ('+err+'). Informe um token novo.';
      var sec=document.getElementById('authTokenSection');if(sec)sec.style.display='';
      var tt=document.getElementById('authTokenTitle');if(tt)tt.textContent='⚠ Token expirado ou revogado';
      var ti=document.getElementById('authToken');if(ti){ti.value='';ti.focus();}
    }else{
      ee.textContent='Não foi possível acessar a nuvem ('+err+'). Tente de novo em instantes.';
    }
    window.gistToken='';
    btn.disabled=false;btn.textContent='Entrar';return;
  }
  if(ad.users){
    var f=ad.users.find(function(u){return u.username.toLowerCase()===user.toLowerCase()&&u.passwordHash===ih;});
    if(f){ok=true;user=f.username;role=f.role||'user';}
    // Primeiro usuário: se não há nenhum cadastrado, o primeiro a logar com token válido vira admin
    if(!ok&&ad.users.length===0){
      role='admin';ok=true;
      ad.users.push({username:user,passwordHash:ih,createdAt:new Date().toISOString(),role:'admin',sessions:[]});
      await writeAuthGist(ad);
    }
  }
  if(ok){
    var ts=document.getElementById('authTokenSection');if(ts)ts.style.display='none';
    setSession(user,role,keep);
    if(keep)await _saveDeviceToken(tk);else await _clearDeviceToken();
    window._authCurrentUser={username:user,role:role};
    switchToUserData(user);
    showApp(user,role);
    // FIX: AWAIT registerDevice para garantir que a sessão é salva antes do initCloud
    await registerDevice(user,keep);
    // Agora sim iniciar cloud (que também lê o auth_users.json)
    if(typeof initCloud==='function') await initCloud();
  }else{
    ee.textContent='Usu\u00e1rio ou senha incorretos.';pe.value='';pe.focus();
  }
  btn.disabled=false;btn.textContent='Entrar';
};

// ================================================================
// LOGOUT
// ================================================================
window._authDoLogout=async function(){
  if(!confirm('Deseja sair?'))return;
  var s=getSession();if(s)await unregisterDevice(s.user,getDeviceId());
  clearSession();window._authCurrentUser=null;
  await _clearDeviceToken();
  if(typeof window._authStopAutoSync==='function')window._authStopAutoSync();
  location.reload();
};

// ================================================================
// SHOW/HIDE
// ================================================================
function showApp(u,r){
  var o=document.getElementById('authOverlay');o.classList.add('hiding');
  setTimeout(function(){o.style.display='none';},400);
  document.getElementById('sidebar').style.visibility='visible';
  document.querySelector('.main').style.visibility='visible';
  var mh=document.getElementById('mobHeader');if(mh)mh.style.visibility='visible';
  // Avatar: primeira letra do nome
  var av=document.getElementById('auAvatar');
  if(av)av.textContent=u.charAt(0).toUpperCase();
  document.getElementById('auName').textContent=u;
  var re=document.getElementById('auRole');
  re.textContent=r==='admin'?'Administrador':'Usu\u00e1rio';
  re.className='au-role '+r;
  document.getElementById('authUBar').style.display='flex';
  applyRoleRestrictions(r);
}
function hideApp(){
  document.getElementById('sidebar').style.visibility='hidden';
  document.querySelector('.main').style.visibility='hidden';
  var mh=document.getElementById('mobHeader');if(mh)mh.style.visibility='hidden';
  document.getElementById('authUBar').style.display='none';
  var o=document.getElementById('authOverlay');o.style.display='flex';
  setTimeout(function(){o.classList.remove('hiding');},10);
  document.getElementById('authUser').value='';
  document.getElementById('authPass').value='';
  document.getElementById('authError').textContent='';
}
function applyRoleRestrictions(r){
  if(r==='admin')return;
  setTimeout(function(){
    var cc=document.getElementById('configCatsArea');
    if(cc)cc.innerHTML='<div class="no-admin-msg">Somente administradores podem gerenciar categorias.</div>';
    var aa=document.getElementById('authAdminSection');if(aa)aa.style.display='none';
    var ld=document.querySelector('#pg-config .btn-danger');if(ld){var p=ld.closest('.form-section');if(p)p.style.display='none';}
  },600);
}

// ================================================================
// ADMIN UI — Dispositivos com cards modernos
// ================================================================
setTimeout(function(){
  var cp=document.getElementById('pg-config');if(!cp)return;

  var sec=document.createElement('div');sec.className='form-section';sec.id='authAdminSection';
  sec.innerHTML='<h3 style="margin-bottom:14px">Gerenciar Usu\u00e1rios</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Cada usu\u00e1rio possui dados financeiros independentes e isolados.</p>'+
    '<div id="authUsersList"></div>'+
    '<div class="form-grid" style="margin-top:14px">'+
    '<div class="form-group"><label>Novo Usu\u00e1rio</label><input id="newAuthUser" class="form-control" placeholder="Nome"></div>'+
    '<div class="form-group"><label>Senha</label><input type="password" id="newAuthPass" class="form-control" placeholder="Senha"></div>'+
    '<div class="form-group"><label>Perfil</label><select id="newAuthRole" class="form-control"><option value="admin">Admin</option><option value="user" selected>Usu\u00e1rio</option></select></div>'+
    '<div class="form-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="window._authAddUser()">Adicionar</button></div></div>'+
    '<div id="authMsg" style="margin-top:8px;font-size:.82em;min-height:20px"></div>';
  cp.appendChild(sec);

  var ds=document.createElement('div');ds.className='form-section';ds.id='authDevicesSection';
  ds.innerHTML='<h3 style="margin-bottom:14px">Dispositivos Conectados</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Dispositivos com sess\u00e3o ativa.</p>'+
    '<div id="authDevicesList"><p style="color:var(--tx3);font-size:.85em">Carregando...</p></div>'+
    '<button class="btn btn-sm btn-outline" onclick="window._authRefreshDevices()" style="margin-top:12px">Atualizar lista</button>';
  cp.appendChild(ds);

  if(window._authCurrentUser){
    if(window._authCurrentUser.role==='admin')window._authRenderUsers();
    setTimeout(function(){window._authRefreshDevices();},800);
  }
},500);

// Dispositivos — renderização com CARDS modernos
window._authRefreshDevices=async function(){
  var el=document.getElementById('authDevicesList');if(!el)return;
  el.innerHTML='<p style="color:var(--tx3);font-size:.85em">Carregando...</p>';
  invalidateGistCache();
  var d=await readAuthGist();
  if(!d||!d.users){el.innerHTML='<p style="color:var(--tx3)">Conecte ao cloud primeiro.</p>';return;}
  var cur=window._authCurrentUser;if(!cur)return;
  var myDid=getDeviceId(),h='';
  var show=cur.role==='admin'?d.users:d.users.filter(function(u){return u.username.toLowerCase()===cur.username.toLowerCase();});

  show.forEach(function(user){
    var ss=(user.sessions||[]).filter(function(s){return new Date(s.expiresAt).getTime()>Date.now();});
    if(ss.length===0&&show.length>1)return;
    h+='<div class="dev-user-group">';
    if(show.length>1)h+='<h4>&#128100; '+user.username+' ('+ss.length+' dispositivo'+(ss.length!==1?'s':'')+')</h4>';
    if(ss.length===0){
      h+='<p style="color:var(--tx3);font-size:.84em;padding:12px 0">Nenhum dispositivo ativo.</p>';
    }else{
      h+='<div class="dev-grid">';
      ss.forEach(function(s){
        var ic=(s.deviceId===myDid&&user.username.toLowerCase()===cur.username.toLowerCase());
        var devParts=(s.device||'Desconhecido').split(' / ');
        var browser=devParts[0]||'Nav';
        var osName=devParts[1]||'Desktop';
        // Ícone por OS
        var icon='&#128187;'; // desktop
        if(osName==='Android')icon='&#128241;';
        else if(osName==='iOS')icon='&#128241;';
        else if(osName==='Windows')icon='&#128187;';
        else if(osName==='macOS')icon='&#128187;';
        else if(osName==='Linux')icon='&#128421;';

        var ld=new Date(s.loginAt);
        var ls=ld.toLocaleDateString('pt-BR')+' '+ld.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        var ed=new Date(s.expiresAt);
        var es=ed.toLocaleDateString('pt-BR')+' '+ed.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        var tp=s.keep?'Permanente':'24 horas';
        var tpBadge=s.keep?'badge-success':'badge-warning';

        h+='<div class="dev-card'+(ic?' current':'')+'">'+
          '<div class="dev-icon">'+icon+'</div>'+
          '<div class="dev-name">'+browser+' \u2014 '+osName+(ic?' <span class="badge badge-info">Este dispositivo</span>':'')+'</div>'+
          '<div class="dev-meta">'+
            'Login: '+ls+'<br>'+
            'Expira: '+es+'<br>'+
            'Tipo: <span class="badge '+tpBadge+'">'+tp+'</span>'+
          '</div>'+
          '<div class="dev-actions">'+(ic?'<span style="color:var(--ok);font-size:.78em;font-weight:600">\u2713 Sess\u00e3o atual</span>':
            '<button class="btn btn-sm btn-danger" onclick="window._authKickDevice(\''+user.username.replace(/'/g,"\\'")+'\',\''+s.deviceId+'\')">Encerrar sess\u00e3o</button>')+
          '</div></div>';
      });
      h+='</div>';
    }
    h+='</div>';
  });

  if(!h)h='<p style="color:var(--tx3)">Nenhum dispositivo ativo encontrado.</p>';
  el.innerHTML=h;
};

window._authKickDevice=async function(u,did){
  if(!confirm('Encerrar sess\u00e3o deste dispositivo?'))return;
  await unregisterDevice(u,did);
  if(typeof toast==='function')toast('Sess\u00e3o encerrada!');else alert('Sess\u00e3o encerrada!');
  window._authRefreshDevices();
};

window._authRenderUsers=async function(){
  var el=document.getElementById('authUsersList');if(!el)return;
  invalidateGistCache();
  var d=await readAuthGist();if(!d||!d.users){el.innerHTML='<p style="color:var(--tx3)">Conecte ao cloud.</p>';return;}
  var h='<div class="table-wrap"><table><thead><tr><th>Usu\u00e1rio</th><th>Perfil</th><th>Criado</th><th>Disp. Ativos</th><th>A\u00e7\u00f5es</th></tr></thead><tbody>';
  d.users.forEach(function(u){
    var dc=u.createdAt?(typeof fmtD==='function'?fmtD(u.createdAt.substring(0,10)):u.createdAt.substring(0,10)):'-';
    var rl=u.role==='admin'?'Admin':'Usu\u00e1rio',bg=u.role==='admin'?'badge-purple':'badge-info';
    var as=(u.sessions||[]).filter(function(s){return new Date(s.expiresAt).getTime()>Date.now();});
    var db=as.length>0?'<span class="badge badge-success">'+as.length+'</span>':'<span class="badge badge-warning">0</span>';
    h+='<tr><td><strong>'+u.username+'</strong></td><td><span class="badge '+bg+'">'+rl+'</span></td><td>'+dc+'</td><td>'+db+'</td>'+
      '<td><button class="btn btn-sm btn-outline" onclick="window._authChangePass(\''+u.username.replace(/'/g,"\\'")+'\')">Senha</button> '+
      '<button class="btn btn-sm btn-danger" onclick="window._authDelUser(\''+u.username.replace(/'/g,"\\'")+'\')">'+(typeof iconeSVG==="function"?iconeSVG("lixeira"):"")+'</button></td></tr>';
  });
  h+='</tbody></table></div>';el.innerHTML=h;
};

window._authAddUser=async function(){
  var n=(document.getElementById('newAuthUser').value||'').trim(),
      p=document.getElementById('newAuthPass').value,
      r=document.getElementById('newAuthRole').value,
      m=document.getElementById('authMsg');
  if(!n||!p){m.innerHTML='<span style="color:var(--dn2)">Preencha nome e senha.</span>';return;}
  invalidateGistCache();
  var d=await readAuthGist();if(!d){d=await ensureAuthFile();}
  if(!d){m.innerHTML='<span style="color:var(--dn2)">Erro ao acessar o cloud.</span>';return;}
  if(d.users.some(function(u){return u.username.toLowerCase()===n.toLowerCase();})){
    m.innerHTML='<span style="color:var(--dn2)">Usu\u00e1rio j\u00e1 existe.</span>';return;}
  d.users.push({username:n,passwordHash:await sha256(p),createdAt:new Date().toISOString(),role:r,sessions:[]});
  if(await writeAuthGist(d)){
    m.innerHTML='<span style="color:var(--ok)">Usu\u00e1rio "'+n+'" criado com dados independentes!</span>';
    document.getElementById('newAuthUser').value='';document.getElementById('newAuthPass').value='';
    window._authRenderUsers();
  }else m.innerHTML='<span style="color:var(--dn2)">Erro ao salvar.</span>';
};

window._authChangePass=async function(u){
  var np=prompt('Nova senha para "'+u+'":');if(!np)return;
  invalidateGistCache();
  var d=await readAuthGist();if(!d)return alert('Erro.');
  var x=d.users.find(function(z){return z.username===u;});if(!x)return alert('Usu\u00e1rio n\u00e3o encontrado.');
  x.passwordHash=await sha256(np);
  if(await writeAuthGist(d))alert('Senha alterada com sucesso!');else alert('Erro ao salvar.');
};

window._authDelUser=async function(u){
  var c=window._authCurrentUser;
  if(c&&c.username.toLowerCase()===u.toLowerCase())return alert('Voc\u00ea n\u00e3o pode excluir a si mesmo.');
  if(!confirm('Excluir usu\u00e1rio "'+u+'"? Os dados financeiros no Gist n\u00e3o ser\u00e3o removidos automaticamente.'))return;
  invalidateGistCache();
  var d=await readAuthGist();if(!d)return alert('Erro.');
  d.users=d.users.filter(function(x){return x.username!==u;});
  if(await writeAuthGist(d)){alert('Usu\u00e1rio removido.');window._authRenderUsers();}else alert('Erro ao salvar.');
};

// ================================================================
// INIT — com await correto
// ================================================================
(async function(){
  var sb=document.getElementById('sidebar'),mn=document.querySelector('.main'),mh=document.getElementById('mobHeader');
  if(sb)sb.style.visibility='hidden';if(mn)mn.style.visibility='hidden';if(mh)mh.style.visibility='hidden';
  var ss=getSession();
  if(ss){
    window._authCurrentUser={username:ss.user,role:ss.role||'user'};
    switchToUserData(ss.user,true); // skipRender=true: initCloud fará o único render
    showApp(ss.user,ss.role||'user');
    await _recuperarToken(); // antes do registerDevice, que tambem le a nuvem
    await registerDevice(ss.user,ss.keep||false);
    if(typeof initCloud==='function') await initCloud();
    // Se initCloud não conseguiu conectar (sem token/offline), renderiza com dados locais
    if(!cloudOk&&typeof renderAll==='function')renderAll();
  }else{
    setTimeout(function(){var t=document.getElementById('authToken');if(t&&!_hasToken)t.focus();else document.getElementById('authUser').focus();},200);
  }
})();

console.log('[Financeiro Pro] Auth v8 — Fix dispositivos + visual moderno + dados isolados + auto-sync 5min.');
})();

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

  ['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'].forEach(function(k){
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
  if(!r.planejamento||Array.isArray(r.planejamento))r.planejamento={};
  if(l.planejamento&&typeof l.planejamento==='object'&&!Array.isArray(l.planejamento))
    Object.keys(l.planejamento).forEach(function(k){
      if(!r.planejamento[k])r.planejamento[k]=l.planejamento[k];
      else if(typeof r.planejamento[k]==='object'&&typeof l.planejamento[k]==='object')
        Object.keys(l.planejamento[k]).forEach(function(c){if(r.planejamento[k][c]===undefined)r.planejamento[k][c]=l.planejamento[k][c];});
    });
  if(!r.cats)r.cats=JSON.parse(JSON.stringify(defCats));
  if(l.cats)Object.keys(l.cats).forEach(function(t){
    if(Array.isArray(l.cats[t])){if(!Array.isArray(r.cats[t]))r.cats[t]=[];
      l.cats[t].forEach(function(c){if(r.cats[t].indexOf(c)===-1)r.cats[t].push(c);});}
  });
  if(l.config&&typeof l.config==='object')r.config=Object.assign({},r.config||{},l.config);
  if(l.checkPagamentos&&typeof l.checkPagamentos==='object'){
    if(!r.checkPagamentos)r.checkPagamentos={};
    Object.keys(l.checkPagamentos).forEach(function(m){
      if(!r.checkPagamentos[m])r.checkPagamentos[m]=l.checkPagamentos[m];
      else Object.assign(r.checkPagamentos[m],l.checkPagamentos[m]);
    });
  }
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
var _TS_COLS=['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'];
var _tsSnap={};

function _tsFingerprint(it){
  var c={};
  Object.keys(it).forEach(function(k){ if(k!=='_ts') c[k]=it[k]; });
  try{ return JSON.stringify(c); }catch(e){ return ''; }
}

// Define o estado atual como referencia (sem marcar nada como alterado)
function _tsReset(st){
  _tsSnap={};
  if(!st) return;
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
function ensureArrays(st){
  ['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'].forEach(function(k){
    if(!Array.isArray(st[k]))st[k]=[];
  });
  if(!st.planejamento||Array.isArray(st.planejamento))st.planejamento={};
  if(!st.cats)st.cats=JSON.parse(JSON.stringify(defCats));
  Object.keys(defCats).forEach(function(k){if(!Array.isArray(st.cats[k]))st.cats[k]=defCats[k].slice();});
  if(!st.config)st.config={theme:'dark'};
  if(!st._deletedIds||typeof st._deletedIds!=='object'||Array.isArray(st._deletedIds))st._deletedIds={};
  return st;
}

// ================================================================
// GIST READ / WRITE — cache inteligente para evitar leituras duplicadas
// ================================================================
var _gistCache=null, _gistCacheTime=0, GIST_CACHE_TTL=5000;

async function readGistFull(){
  var tk=_getToken();if(!tk)return null;
  if(_gistCache && (Date.now()-_gistCacheTime)<GIST_CACHE_TTL) return _gistCache;
  try{
    var r=await fetch('https://api.github.com/gists/'+DATA_GIST_ID,{
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});
    if(!r.ok)return null;
    _gistCache=await r.json();_gistCacheTime=Date.now();
    return _gistCache;
  }catch(e){return null;}
}
function invalidateGistCache(){_gistCache=null;_gistCacheTime=0;}

async function readGistFile(fileName){
  var g=await readGistFull();if(!g)return null;
  var f=g.files&&g.files[fileName];
  try{return(f&&f.content)?JSON.parse(f.content):null;}catch(e){return null;}
}

async function writeGistFiles(filesObj){
  var tk=_getToken();if(!tk)return false;
  var files={};
  Object.keys(filesObj).forEach(function(fn){
    files[fn]={content:JSON.stringify(filesObj[fn],null,2)};
  });
  try{
    var r=await fetch('https://api.github.com/gists/'+DATA_GIST_ID,{
      method:'PATCH',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk,'Content-Type':'application/json'},
      body:JSON.stringify({files:files})});
    invalidateGistCache();
    return r.ok;
  }catch(e){return false;}
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
  var ad=await readAuthGist();
  if(ad&&ad.users)return ad;
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
var tkHTML='';
if(!_hasToken){
  tkHTML='<div class="auth-token-section" id="authTokenSection">'+
    '<div class="ats-title">\u26a0 Primeira conex\u00e3o neste dispositivo</div>'+
    '<div class="form-group" style="margin-bottom:8px"><label>Token GitHub (permiss\u00e3o gist)</label>'+
    '<input type="password" id="authToken" class="form-control" placeholder="ghp_xxxxxxxxxxxx" autocomplete="off"></div>'+
    '<div class="ats-help">Pe\u00e7a ao administrador ou crie em '+
    '<a href="https://github.com/settings/tokens/new?scopes=gist&description=FinanceiroPro" target="_blank">github.com/settings/tokens</a> com permiss\u00e3o <strong>gist</strong>.</div></div>';
}
ov.innerHTML='<div class="auth-box"><div class="auth-logo">&#128176;</div>'+
  '<div class="auth-title">Financeiro Pro</div>'+
  '<div class="auth-sub">Fa\u00e7a login para acessar seus dados financeiros</div>'+tkHTML+
  '<div class="form-group"><label>Usu\u00e1rio</label><input type="text" id="authUser" class="form-control" placeholder="Digite seu usu\u00e1rio" autocomplete="username"></div>'+
  '<div class="form-group"><label>Senha</label><input type="password" id="authPass" class="form-control" placeholder="Digite sua senha" autocomplete="current-password"></div>'+
  '<div class="auth-keep"><input type="checkbox" id="authKeep"><label for="authKeep">Manter conectado</label></div>'+
  '<button class="auth-btn" id="authLoginBtn" onclick="window._authDoLogin()"><span>Entrar</span></button>'+
  '<div class="auth-error" id="authError"></div>'+
  '<div class="auth-footer">&#128274; Acesso protegido \u00b7 Criptografia SHA-256</div></div>';
document.body.appendChild(ov);

var ubar=document.createElement('div');ubar.className='auth-ubar';ubar.id='authUBar';
ubar.innerHTML='<div class="au-left">'+
  '<div class="au-avatar" id="auAvatar"></div>'+
  '<div class="au-info"><span class="au-name" id="auName"></span><span class="au-role" id="auRole"></span></div></div>'+
  '<div class="au-right">'+
  '<div class="au-sync-info" id="auSyncTimer"></div>'+
  '<button class="au-logout" onclick="window._authDoLogout()">&#128682; Sair</button></div>';
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
async function _reencryptTokenWithSessionKey(token){
  var skb64=sessionStorage.getItem(_TOKEN_SESS_KEY);if(!skb64)return false;
  try{
    var skRaw=Uint8Array.from(atob(skb64),function(c){return c.charCodeAt(0);});
    var key=await crypto.subtle.importKey('raw',skRaw,{name:'AES-GCM'},false,['encrypt']);
    var iv=crypto.getRandomValues(new Uint8Array(12));
    var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,new TextEncoder().encode(token));
    // Formato sessão: 16 bytes zero (sem salt PBKDF2) + 12 iv + ciphertext
    // Marcado com prefixo 0x01 para distinguir do formato PBKDF2
    var buf=new Uint8Array(1+12+ct.byteLength);
    buf[0]=0x01;buf.set(iv,1);buf.set(new Uint8Array(ct),13);
    localStorage.setItem(_TOKEN_ENC_KEY+'_sess',btoa(String.fromCharCode(...buf)));
    return true;
  }catch(e){return false;}
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
  var userFile=await readUserGistFile('Anderson');
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
    _tsStamp(S); // marca o que mudou, para o merge saber quem e mais recente
    localStorage.setItem(window._userSK,JSON.stringify(S));
    window.scheduleSync();
  };

  var _ust=null,_syncing=false;
  window.scheduleSync=function(){
    if(!cloudOk)return;clearTimeout(_ust);
    _ust=setTimeout(async function(){
      if(_syncing)return;_syncing=true;
      syncUI('loading','Sincronizando...');
      try{
        var ok=await writeUserGistFile(window._authUsername,S);
        if(ok)syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
        else syncUI('on','Erro sync');
      }catch(e){syncUI('on','Erro sync (rede)');}
      _syncing=false;
    },3000);
  };

  // AUTO-SYNC 5 min
  function startAutoSync(){
    stopAutoSync();
    _lastAutoSync=Date.now();
    _autoSyncTimer=setInterval(async function(){
      if(!cloudOk||_syncing)return;
      _syncing=true;
      syncUI('loading','Auto-sync...');
      try{
        invalidateGistCache();
        var loc=JSON.parse(JSON.stringify(S));
        var rem=await readUserGistFile(window._authUsername);
        if(rem&&typeof rem==='object'&&(rem.lancamentos||rem.cartoes||rem.contratos)){
          var _snapAS=JSON.stringify(S);
          S=deepMergeState(loc,rem);
          localStorage.setItem(window._userSK,JSON.stringify(S));
          await writeUserGistFile(window._authUsername,S);
          if(JSON.stringify(S)!==_snapAS&&typeof renderAll==='function')renderAll();
          syncUI('on','Auto-sync '+new Date().toLocaleTimeString('pt-BR'));
        }else{
          await writeUserGistFile(window._authUsername,S);
          syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
        }
      }catch(e){syncUI('on','Erro auto-sync');}
      _syncing=false;
      _lastAutoSync=Date.now();
    },AUTO_SYNC_MS);
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
    _setGistToken(t.trim());await _reencryptTokenWithSessionKey(t.trim());syncUI('loading','Conectando...');
    var tm=document.getElementById('modalToken');if(tm&&tm.classList.contains('show'))closeM('modalToken');
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&(rem.lancamentos||rem.cartoes||rem.contratos))S=deepMergeState(loc,rem);
    localStorage.setItem(window._userSK,JSON.stringify(S));
    await writeUserGistFile(window._authUsername,S);
    renderAll();cloudOk=true;syncUI('on','Cloud conectado');
    startAutoSync();
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  window.initCloud=async function(){
    if(!window.gistToken){var st=await _getTokenFromSession();if(st)window.gistToken=st;}
    if(!window.gistToken){cloudOk=false;syncUI('off','Entre para sincronizar');return;}
    syncUI('loading','Conectando...');
    // Invalidar cache UMA vez antes de todos os reads — evita duplo HTTP call
    invalidateGistCache();
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&typeof rem==='object'&&(rem.lancamentos||rem.cartoes||rem.contratos)){
      S=deepMergeState(loc,rem);
      localStorage.setItem(window._userSK,JSON.stringify(S));
      if(typeof renderAll==='function')renderAll(); // sempre renderiza após merge com Cloud
      await writeUserGistFile(window._authUsername,S);
      cloudOk=true;syncUI('on','Cloud conectado');
      startAutoSync();return;
    }
    if(typeof renderAll==='function')renderAll(); // sem dados remotos: renderiza com local
    await writeUserGistFile(window._authUsername,S);
    cloudOk=true;syncUI('on','Cloud conectado');
    startAutoSync();
  };

  window.doPullGist=async function(){
    syncUI('loading','Baixando...');invalidateGistCache();
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&(rem.lancamentos||rem.cartoes||rem.contratos)){
      S=deepMergeState(loc,rem);localStorage.setItem(window._userSK,JSON.stringify(S));
      renderAll();syncUI('on','Dados carregados');
    }else syncUI('on','Nenhum dado remoto');
  };

  window.doConnectFromBk=async function(){
    var t=(document.getElementById('bkToken')||{}).value;
    if(!t||!t.trim()){alert('Informe o token.');return;}
    _setGistToken(t.trim());await _reencryptTokenWithSessionKey(t.trim());syncUI('loading','Conectando...');
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&(rem.lancamentos||rem.cartoes||rem.contratos))S=deepMergeState(loc,rem);
    localStorage.setItem(window._userSK,JSON.stringify(S));
    await writeUserGistFile(window._authUsername,S);
    renderAll();cloudOk=true;syncUI('on','Cloud conectado');
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
      if(typeof bkMsg==='function')bkMsg('✅ Dados restaurados do Cloud com sucesso!',true);
    }else{
      syncUI('on','Nenhum dado encontrado no Cloud');
      if(typeof bkMsg==='function')bkMsg('❌ Nenhum dado encontrado no Cloud.',false);
    }
  };

  window.doSyncNow=async function(){
    if(!window.gistToken){var st=await _getTokenFromSession();if(st)window.gistToken=st;}
    syncUI('loading','Sincronizando...');
    var ok=await writeUserGistFile(window._authUsername,S);
    if(ok)syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
    else syncUI('on','Erro sync');
  };

  window.doDisconnect=function(){
    window.gistToken='';cloudOk=false;
    localStorage.removeItem(_TOKEN_ENC_KEY);localStorage.removeItem(_TOKEN_ENC_KEY+'_sess');
    sessionStorage.removeItem(_TOKEN_SESS_KEY);
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
  var tk=_getToken();if(!tk){ee.textContent='Informe o Token GitHub.';btn.disabled=false;btn.textContent='Entrar';return;}
  var ih=await sha256(pass),role='user',ok=false;
  var ad=await ensureAuthFile();
  if(ad&&ad.users){
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
window._authDoLogout=function(){
  if(!confirm('Deseja sair?'))return;
  var s=getSession();if(s)unregisterDevice(s.user,getDeviceId());
  clearSession();window._authCurrentUser=null;
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
    if(cc)cc.innerHTML='<div class="no-admin-msg">&#128274; Somente administradores podem gerenciar categorias.</div>';
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
  sec.innerHTML='<h3 style="margin-bottom:14px">&#128274; Gerenciar Usu\u00e1rios</h3>'+
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
  ds.innerHTML='<h3 style="margin-bottom:14px">&#128241; Dispositivos Conectados</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Dispositivos com sess\u00e3o ativa.</p>'+
    '<div id="authDevicesList"><p style="color:var(--tx3);font-size:.85em">Carregando...</p></div>'+
    '<button class="btn btn-sm btn-outline" onclick="window._authRefreshDevices()" style="margin-top:12px">&#128259; Atualizar lista</button>';
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
      '<button class="btn btn-sm btn-danger" onclick="window._authDelUser(\''+u.username.replace(/'/g,"\\'")+'\')">&#128465;</button></td></tr>';
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
    await registerDevice(ss.user,ss.keep||false);
    if(typeof initCloud==='function') await initCloud();
    // Se initCloud não conseguiu conectar (sem token/offline), renderiza com dados locais
    if(!cloudOk&&typeof renderAll==='function')renderAll();
  }else{
    setTimeout(function(){var t=document.getElementById('authToken');if(t)t.focus();else document.getElementById('authUser').focus();},200);
  }
})();

console.log('[Financeiro Pro] Auth v8 — Fix dispositivos + visual moderno + dados isolados + auto-sync 5min.');
})();

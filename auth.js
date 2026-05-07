// auth.js v5.5 — Correção definitiva: arquivo completo + merge real
(function(){
'use strict';

// ================================================================
// FIX IMEDIATO: Cancelar TUDO do index.html antes que setTimeout rode
// ================================================================
window.cloudOk = false;
if(typeof syncTimer !== 'undefined'){ clearTimeout(syncTimer); syncTimer = null; }
window.initCloud = function(){};
window.scheduleSync = function(){};
window.gistRead = function(){ return Promise.resolve(null); };
window.gistWrite = function(){ return Promise.resolve(false); };
syncUI('off','Aguardando login...');
var _mt = document.getElementById('modalToken');
if(_mt && _mt.classList.contains('show')) _mt.classList.remove('show');

var AUTH_GIST_KEY  = 'finApp_auth_gist_id';
var SESSION_KEY    = 'finApp_session';
var DEVICE_ID_KEY  = 'finApp_device_id';
var SESSION_SHORT  = 24*60*60*1000;
var SESSION_LONG   = 90*24*60*60*1000;
var LEGACY_GIST_ID = '667e29c52ee1d62185b5eae8c871faa1';

/* ---------- HELPERS ---------- */
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

/* ---------- DEEP MERGE ---------- */
function deepMergeState(local,remote){
  if(!remote||(!remote.lancamentos&&!remote.contratos&&!remote.cartoes))
    return ensureArrays(JSON.parse(JSON.stringify(local||defState())));
  if(!local||(!local.lancamentos&&!local.contratos&&!local.cartoes))
    return ensureArrays(JSON.parse(JSON.stringify(remote)));
  var r=JSON.parse(JSON.stringify(remote)),l=JSON.parse(JSON.stringify(local));
  ['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'].forEach(function(k){
    var ra=Array.isArray(r[k])?r[k]:[],la=Array.isArray(l[k])?l[k]:[];
    var ids={};ra.forEach(function(i){if(i.id)ids[i.id]=true;});
    la.forEach(function(i){if(i.id&&!ids[i.id])ra.push(i);});
    r[k]=ra;
  });
  if(!r.planejamento||Array.isArray(r.planejamento))r.planejamento={};
  if(l.planejamento&&typeof l.planejamento==='object'&&!Array.isArray(l.planejamento))
    Object.keys(l.planejamento).forEach(function(k){if(!r.planejamento[k])r.planejamento[k]=l.planejamento[k];});
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
  return ensureArrays(r);
}
function ensureArrays(st){
  ['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'].forEach(function(k){
    if(!Array.isArray(st[k]))st[k]=[];
  });
  if(!st.planejamento||Array.isArray(st.planejamento))st.planejamento={};
  if(!st.cats)st.cats=JSON.parse(JSON.stringify(defCats));
  Object.keys(defCats).forEach(function(k){if(!Array.isArray(st.cats[k]))st.cats[k]=defCats[k].slice();});
  if(!st.config)st.config={theme:'dark'};
  return st;
}

/* ---------- CSS ---------- */
var sty=document.createElement('style');
sty.textContent=
'.auth-overlay{position:fixed;inset:0;z-index:10000;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .3s}'+
'.auth-overlay.hiding{opacity:0;pointer-events:none}'+
'.auth-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:16px;padding:40px 36px;width:95%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center}'+
'.auth-logo{font-size:2.2em;margin-bottom:6px}'+
'.auth-title{font-size:1.3em;font-weight:700;background:var(--priG);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}'+
'.auth-sub{font-size:.82em;color:var(--tx3);margin-bottom:28px}'+
'.auth-box .form-group{text-align:left;margin-bottom:16px}'+
'.auth-box .form-group label{font-size:.78em;color:var(--tx2);font-weight:600;margin-bottom:4px;display:block}'+
'.auth-box .form-control{width:100%;padding:12px 14px;font-size:.9em}'+
'.auth-btn{width:100%;padding:14px;border:none;border-radius:10px;background:var(--priG);color:#fff;font-size:.95em;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px}'+
'.auth-btn:hover{opacity:.9;transform:translateY(-1px)}'+
'.auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}'+
'.auth-error{color:var(--dn2);font-size:.82em;margin-top:12px;min-height:20px}'+
'.auth-footer{margin-top:20px;font-size:.72em;color:var(--tx3)}'+
'.auth-keep{display:flex;align-items:center;gap:8px;margin-top:12px;margin-bottom:4px;justify-content:center}'+
'.auth-keep input[type=checkbox]{width:18px;height:18px;accent-color:var(--pri);cursor:pointer}'+
'.auth-keep label{font-size:.82em;color:var(--tx2);cursor:pointer;user-select:none}'+
'.auth-token-section{text-align:left;margin-bottom:16px;padding:14px;background:var(--bg3);border-radius:10px;border:1px solid var(--bg4)}'+
'.auth-token-section .ats-title{font-size:.78em;color:var(--wn);font-weight:700;margin-bottom:8px}'+
'.auth-token-section .ats-help{font-size:.72em;color:var(--tx3);margin-top:6px;line-height:1.4}'+
'.auth-token-section .ats-help a{color:var(--pri2);text-decoration:none}'+
'.auth-token-section .ats-help a:hover{text-decoration:underline}'+
'.auth-ubar{position:fixed;bottom:0;left:0;right:0;z-index:90;background:var(--bg2);border-top:1px solid var(--bg4);padding:8px 16px;display:none;align-items:center;justify-content:space-between;font-size:.78em;gap:8px}'+
'.auth-ubar .au-name{color:var(--ok);font-weight:600}'+
'.auth-ubar .au-role{font-size:.72em;padding:2px 8px;border-radius:8px;margin-left:4px}'+
'.auth-ubar .au-role.admin{background:rgba(108,92,231,.15);color:var(--pri2)}'+
'.auth-ubar .au-role.user{background:rgba(9,132,227,.15);color:var(--inf2)}'+
'.auth-ubar .au-logout{background:transparent;border:1px solid var(--bg4);color:var(--tx3);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.82em;transition:all .15s}'+
'.auth-ubar .au-logout:hover{border-color:var(--dn2);color:var(--dn2)}'+
'.no-admin-msg{background:rgba(253,203,110,.08);border:1px solid rgba(253,203,110,.2);border-radius:8px;padding:12px 16px;color:var(--wn);font-size:.84em;margin-bottom:12px}'+
'.dev-table{width:100%;border-collapse:collapse;margin-top:10px}'+
'.dev-table th{background:var(--bg3);padding:10px 12px;text-align:left;font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3)}'+
'.dev-table td{padding:9px 12px;border-bottom:1px solid var(--bg3);font-size:.82em}'+
'.dev-table .dev-current{color:var(--ok);font-weight:600}'+
'.dev-table .dev-other{color:var(--tx2)}'+
'@media(max-width:768px){.auth-box{padding:28px 20px}.auth-ubar{padding:6px 12px;font-size:.72em}.main{padding-bottom:50px!important}}';
document.head.appendChild(sty);

/* ---------- HTML LOGIN ---------- */
var _hasToken=!!(localStorage.getItem('finApp_gist_token'));
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
  '<button class="auth-btn" id="authLoginBtn" onclick="window._authDoLogin()">Entrar</button>'+
  '<div class="auth-error" id="authError"></div>'+
  '<div class="auth-footer">&#128274; Acesso protegido</div></div>';
document.body.appendChild(ov);

var ubar=document.createElement('div');ubar.className='auth-ubar';ubar.id='authUBar';
ubar.innerHTML='<span>&#128100; <span class="au-name" id="auName"></span><span class="au-role" id="auRole"></span></span>'+
  '<button class="au-logout" onclick="window._authDoLogout()">&#128682; Sair</button>';
document.body.appendChild(ubar);

document.getElementById('authPass').addEventListener('keydown',function(e){if(e.key==='Enter')window._authDoLogin();});
document.getElementById('authUser').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('authPass').focus();});
var _atkEl=document.getElementById('authToken');
if(_atkEl)_atkEl.addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('authUser').focus();});
window._authCurrentUser=null;

/* ---------- TOKEN ---------- */
function _setGistToken(t){window.gistToken=t;localStorage.setItem('finApp_gist_token',t);}
function _getToken(){return window.gistToken||localStorage.getItem('finApp_gist_token')||'';}

/* ---------- GIST AUTH ---------- */
async function readAuthGist(){
  var tk=_getToken();if(!tk)return null;
  var gid=localStorage.getItem(AUTH_GIST_KEY);
  if(!gid){gid=await findAuthGist(tk);if(!gid)gid=await createAuthGist(tk);if(!gid)return null;}
  try{var r=await fetch('https://api.github.com/gists/'+gid,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});
    if(r.status===404){localStorage.removeItem(AUTH_GIST_KEY);gid=await findAuthGist(tk);if(!gid)gid=await createAuthGist(tk);if(!gid)return null;
      r=await fetch('https://api.github.com/gists/'+gid,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});}
    if(!r.ok)return null;var j=await r.json();var f=j.files&&j.files['auth_users.json'];
    return(f&&f.content)?JSON.parse(f.content):null;
  }catch(e){return null;}
}
async function findAuthGist(tk){
  try{var r=await fetch('https://api.github.com/gists?per_page=100',{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});
    if(!r.ok)return null;var gs=await r.json();
    for(var i=0;i<gs.length;i++){if(gs[i].description==='FinanceiroPro-Auth'&&gs[i].files&&gs[i].files['auth_users.json']){
      localStorage.setItem(AUTH_GIST_KEY,gs[i].id);return gs[i].id;}}return null;
  }catch(e){return null;}
}
async function writeAuthGist(data){
  var tk=_getToken(),gid=localStorage.getItem(AUTH_GIST_KEY);if(!tk||!gid)return false;
  try{var r=await fetch('https://api.github.com/gists/'+gid,{method:'PATCH',
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk,'Content-Type':'application/json'},
    body:JSON.stringify({files:{'auth_users.json':{content:JSON.stringify(data,null,2)}}})});return r.ok;
  }catch(e){return false;}
}
async function createAuthGist(tk){
  var h=await sha256('202328');
  var data={users:[{username:'Anderson',passwordHash:h,createdAt:new Date().toISOString(),role:'admin',sessions:[]}]};
  try{var r=await fetch('https://api.github.com/gists',{method:'POST',
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk,'Content-Type':'application/json'},
    body:JSON.stringify({description:'FinanceiroPro-Auth',public:false,
      files:{'auth_users.json':{content:JSON.stringify(data,null,2)}}})});
    if(!r.ok)return null;var j=await r.json();localStorage.setItem(AUTH_GIST_KEY,j.id);return j.id;
  }catch(e){return null;}
}

/* ---------- SESSÃO ---------- */
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

/* ---------- DISPOSITIVOS ---------- */
async function registerDevice(user,keep){
  var d=await readAuthGist();if(!d||!d.users)return;
  var u=d.users.find(function(x){return x.username.toLowerCase()===user.toLowerCase();});if(!u)return;
  if(!Array.isArray(u.sessions))u.sessions=[];
  var did=getDeviceId(),dur=keep?SESSION_LONG:SESSION_SHORT;
  u.sessions=u.sessions.filter(function(s){return s.deviceId!==did;});
  u.sessions.push({deviceId:did,device:detectDevice(),loginAt:new Date().toISOString(),expiresAt:new Date(Date.now()+dur).toISOString(),keep:!!keep});
  d.users.forEach(function(x){if(!Array.isArray(x.sessions))x.sessions=[];x.sessions=x.sessions.filter(function(s){return new Date(s.expiresAt).getTime()>Date.now();});});
  await writeAuthGist(d);
}
async function unregisterDevice(user,did){
  var d=await readAuthGist();if(!d||!d.users)return;
  var u=d.users.find(function(x){return x.username.toLowerCase()===user.toLowerCase();});
  if(!u||!Array.isArray(u.sessions))return;
  u.sessions=u.sessions.filter(function(s){return s.deviceId!==did;});
  await writeAuthGist(d);
}

/* ---------- GIST LEGADO ---------- */
async function readLegacyGist(){
  var tk=_getToken();if(!tk)return null;
  try{var r=await fetch('https://api.github.com/gists/'+LEGACY_GIST_ID,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});
    if(!r.ok)return null;var j=await r.json();var f=j.files&&j.files['financeiro.json'];
    return(f&&f.content)?JSON.parse(f.content):null;}catch(e){return null;}
}

/* ---------- DADOS POR USUÁRIO ---------- */
function getUserFileKey(u){return u.toLowerCase().replace(/[^a-z0-9]/g,'_')+'.json';}
function getUserStorageKey(u){return 'finApp_v5_'+u.toLowerCase().replace(/[^a-z0-9]/g,'_');}

async function readUserGistFile(user){
  var tk=_getToken(),gid=localStorage.getItem(AUTH_GIST_KEY);if(!tk||!gid)return null;
  var fn=getUserFileKey(user);
  try{var r=await fetch('https://api.github.com/gists/'+gid,{headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk}});
    if(!r.ok)return null;var j=await r.json();var f=j.files&&j.files[fn];
    return(f&&f.content)?JSON.parse(f.content):null;}catch(e){return null;}
}
async function writeUserGistFile(user,data){
  var tk=_getToken(),gid=localStorage.getItem(AUTH_GIST_KEY);if(!tk||!gid)return false;
  var fn=getUserFileKey(user),files={};files[fn]={content:JSON.stringify(data,null,2)};
  try{var r=await fetch('https://api.github.com/gists/'+gid,{method:'PATCH',
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tk,'Content-Type':'application/json'},
    body:JSON.stringify({files:files})});return r.ok;}catch(e){return false;}
}

/* ---------- SWITCH TO USER DATA ---------- */
function switchToUserData(user){
  var uKey=getUserStorageKey(user);
  window._userSK=uKey;window._authUsername=user;
  // Migrar da chave global se a do usuário não existir
  if(!localStorage.getItem(uKey)){var ex=localStorage.getItem('finApp_v5');if(ex)localStorage.setItem(uKey,ex);}
  try{var d=JSON.parse(localStorage.getItem(uKey));
    if(d){S=ensureArrays(d);}else{S=defState();}
  }catch(e){S=defState();}

  // Override salvar
  window.salvar=function(){
    if(!window._userSK)return;
    localStorage.setItem(window._userSK,JSON.stringify(S));
    window.scheduleSync();
  };
  window.gistRead=async function(){return await readUserGistFile(window._authUsername);};
  window.gistWrite=async function(d){return await writeUserGistFile(window._authUsername,d);};

  // scheduleSync com lock
  var _ust=null,_syncing=false;
  window.scheduleSync=function(){
    if(!cloudOk)return;clearTimeout(_ust);
    _ust=setTimeout(async function(){
      if(_syncing)return;_syncing=true;
      syncUI('loading','Sincronizando...');
      try{var ok=await writeUserGistFile(window._authUsername,S);
        if(ok)syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
        else syncUI('on','Erro sync');
      }catch(e){syncUI('on','Erro sync (rede)');}
      _syncing=false;
    },3000);
  };

  // connectCloud
  window.connectCloud=async function(){
    var t=(document.getElementById('inputToken')||{}).value;
    if(!t)t=(document.getElementById('bkToken')||{}).value;
    if(!t||!t.trim()){alert('Informe o token.');return;}
    _setGistToken(t.trim());syncUI('loading','Conectando...');
    var tm=document.getElementById('modalToken');if(tm&&tm.classList.contains('show'))closeM('modalToken');
    await readAuthGist();
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(!rem)rem=await readLegacyGist();
    if(rem&&(rem.lancamentos||rem.cartoes||rem.contratos)){S=deepMergeState(loc,rem);}
    localStorage.setItem(window._userSK,JSON.stringify(S));
    await writeUserGistFile(window._authUsername,S);
    renderAll();cloudOk=true;syncUI('on','Cloud conectado');
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  // initCloud — MERGE REAL
  window.initCloud=async function(){
    var st=localStorage.getItem('finApp_gist_token')||'';if(st)window.gistToken=st;
    if(!window.gistToken){cloudOk=false;syncUI('off','Sem token');return;}
    syncUI('loading','Conectando...');
    var ad=await readAuthGist();
    if(!ad){cloudOk=false;syncUI('on','Erro cloud');return;}
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&typeof rem==='object'&&(rem.lancamentos||rem.cartoes||rem.contratos)){
      S=deepMergeState(loc,rem);
      localStorage.setItem(window._userSK,JSON.stringify(S));renderAll();
      await writeUserGistFile(window._authUsername,S);
      cloudOk=true;syncUI('on','Cloud conectado');return;
    }
    var leg=await readLegacyGist();
    if(leg&&typeof leg==='object'&&(leg.lancamentos||leg.cartoes||leg.contratos)){
      S=deepMergeState(loc,leg);
      localStorage.setItem(window._userSK,JSON.stringify(S));renderAll();
      await writeUserGistFile(window._authUsername,S);
      cloudOk=true;syncUI('on','Dados migrados!');return;
    }
    if(S&&S.lancamentos&&S.lancamentos.length>0)await writeUserGistFile(window._authUsername,S);
    cloudOk=true;syncUI('on','Cloud conectado');
  };

  // doPullGist
  window.doPullGist=async function(){
    syncUI('loading','Baixando...');var loc=JSON.parse(JSON.stringify(S));
    var d=await readUserGistFile(window._authUsername);
    if(d&&(d.lancamentos||d.cartoes||d.contratos)){
      S=deepMergeState(loc,d);localStorage.setItem(window._userSK,JSON.stringify(S));
      renderAll();syncUI('on','Dados carregados');
    }else{
      var leg=await readLegacyGist();
      if(leg&&(leg.lancamentos||leg.cartoes||leg.contratos)){
        S=deepMergeState(loc,leg);localStorage.setItem(window._userSK,JSON.stringify(S));
        await writeUserGistFile(window._authUsername,S);renderAll();syncUI('on','Dados migrados');
      }else syncUI('on','Nenhum dado');
    }
  };

  // doConnectFromBk
  window.doConnectFromBk=async function(){
    var t=(document.getElementById('bkToken')||{}).value;
    if(!t||!t.trim()){alert('Informe o token.');return;}
    _setGistToken(t.trim());syncUI('loading','Conectando...');
    await readAuthGist();var loc=JSON.parse(JSON.stringify(S));
    var d=await readUserGistFile(window._authUsername);
    if(!d||!(d.lancamentos||d.cartoes||d.contratos)){d=await readLegacyGist();}
    if(d&&(d.lancamentos||d.cartoes||d.contratos))S=deepMergeState(loc,d);
    localStorage.setItem(window._userSK,JSON.stringify(S));
    await writeUserGistFile(window._authUsername,S);
    renderAll();cloudOk=true;syncUI('on','Cloud conectado');
    if(typeof renderCloudArea==='function')renderCloudArea();
  };

  // doSyncNow
  window.doSyncNow=async function(){
    var st=localStorage.getItem('finApp_gist_token')||'';if(st)window.gistToken=st;
    syncUI('loading','Sincronizando...');
    var ok=await writeUserGistFile(window._authUsername,S);
    if(ok)syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
    else syncUI('on','Erro sync');
  };
  window.doDisconnect=function(){window.gistToken='';cloudOk=false;localStorage.removeItem('finApp_gist_token');syncUI('off','Offline');if(typeof renderCloudArea==='function')renderCloudArea();};
  window.skipCloud=function(){var m=document.getElementById('modalToken');if(m&&m.classList.contains('show'))closeM('modalToken');cloudOk=false;syncUI('off','Offline');if(typeof renderCloudArea==='function')renderCloudArea();};

  if(S.config&&S.config.theme&&typeof setTheme==='function')setTheme(S.config.theme);
  if(typeof renderAll==='function')renderAll();
}

/* ---------- LOGIN ---------- */
window._authDoLogin=async function(){
  var ue=document.getElementById('authUser'),pe=document.getElementById('authPass'),
      te=document.getElementById('authToken'),ke=document.getElementById('authKeep'),
      ee=document.getElementById('authError'),btn=document.getElementById('authLoginBtn');
  var user=(ue.value||'').trim(),pass=pe.value,keep=ke.checked;
  if(te){var tv=(te.value||'').trim();if(tv)_setGistToken(tv);}
  if(!user||!pass){ee.textContent='Preencha usu\u00e1rio e senha.';return;}
  var tk=_getToken();if(!tk){ee.textContent='Informe o Token GitHub.';return;}
  btn.disabled=true;btn.textContent='Verificando...';ee.textContent='';
  var ih=await sha256(pass),role='user',ok=false;
  var ad=await readAuthGist();
  if(ad&&ad.users){var f=ad.users.find(function(u){return u.username.toLowerCase()===user.toLowerCase()&&u.passwordHash===ih;});
    if(f){ok=true;user=f.username;role=f.role||'user';}}
  if(!ok){var fb=await sha256('202328');if(user.toLowerCase()==='anderson'&&ih===fb){ok=true;user='Anderson';role='admin';}}
  if(ok){
    var ts=document.getElementById('authTokenSection');if(ts)ts.style.display='none';
    setSession(user,role,keep);window._authCurrentUser={username:user,role:role};
    switchToUserData(user);showApp(user,role);registerDevice(user,keep);
    setTimeout(function(){if(typeof initCloud==='function')initCloud();},300);
  }else{ee.textContent='Usu\u00e1rio ou senha incorretos.';pe.value='';pe.focus();}
  btn.disabled=false;btn.textContent='Entrar';
};

/* ---------- LOGOUT ---------- */
window._authDoLogout=function(){
  if(!confirm('Deseja sair?'))return;
  var s=getSession();if(s)unregisterDevice(s.user,getDeviceId());
  clearSession();window._authCurrentUser=null;location.reload();
};

/* ---------- SHOW/HIDE APP ---------- */
function showApp(u,r){
  var o=document.getElementById('authOverlay');o.classList.add('hiding');
  setTimeout(function(){o.style.display='none';},300);
  document.getElementById('sidebar').style.visibility='visible';
  document.querySelector('.main').style.visibility='visible';
  var mh=document.getElementById('mobHeader');if(mh)mh.style.visibility='visible';
  document.getElementById('auName').textContent=u;
  var re=document.getElementById('auRole');re.textContent=r==='admin'?'Administrador':'Usu\u00e1rio';re.className='au-role '+r;
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
  document.getElementById('authUser').value='';document.getElementById('authPass').value='';
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

/* ---------- ADMIN UI ---------- */
setTimeout(function(){
  var cp=document.getElementById('pg-config');if(!cp)return;
  var sec=document.createElement('div');sec.className='form-section';sec.id='authAdminSection';
  sec.innerHTML='<h3 style="margin-bottom:14px">&#128274; Gerenciar Usu\u00e1rios</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Cada usu\u00e1rio tem seus pr\u00f3prios dados.</p>'+
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
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Veja dispositivos logados e encerre sess\u00f5es.</p>'+
    '<div id="authDevicesList"><p style="color:var(--tx3);font-size:.85em">Carregando...</p></div>'+
    '<button class="btn btn-sm btn-outline" onclick="window._authRefreshDevices()" style="margin-top:10px">&#128259; Atualizar</button>';
  cp.appendChild(ds);
  if(window._authCurrentUser){
    if(window._authCurrentUser.role==='admin')window._authRenderUsers();
    setTimeout(function(){window._authRefreshDevices();},800);
  }
},500);

/* ---------- DISPOSITIVOS UI ---------- */
window._authRefreshDevices=async function(){
  var el=document.getElementById('authDevicesList');if(!el)return;
  el.innerHTML='<p style="color:var(--tx3);font-size:.85em">Carregando...</p>';
  var d=await readAuthGist();if(!d||!d.users){el.innerHTML='<p style="color:var(--tx3);font-size:.85em">Conecte ao cloud.</p>';return;}
  var cur=window._authCurrentUser;if(!cur)return;
  var myDid=getDeviceId(),h='';
  var show=cur.role==='admin'?d.users:d.users.filter(function(u){return u.username.toLowerCase()===cur.username.toLowerCase();});
  show.forEach(function(user){
    var ss=(user.sessions||[]).filter(function(s){return new Date(s.expiresAt).getTime()>Date.now();});
    if(ss.length===0&&show.length>1)return;
    h+='<div style="margin-bottom:16px">';
    if(show.length>1)h+='<h4 style="font-size:.9em;margin-bottom:8px;color:var(--pri2)">&#128100; '+user.username+'</h4>';
    if(ss.length===0){h+='<p style="color:var(--tx3);font-size:.84em">Nenhum dispositivo ativo.</p>';}
    else{h+='<div class="table-wrap"><table class="dev-table"><thead><tr><th>Dispositivo</th><th>Login</th><th>Expira</th><th>Tipo</th><th>A\u00e7\u00e3o</th></tr></thead><tbody>';
      ss.forEach(function(s){
        var ic=(s.deviceId===myDid&&user.username.toLowerCase()===cur.username.toLowerCase());
        var ld=new Date(s.loginAt),ed=new Date(s.expiresAt);
        var ls=ld.toLocaleDateString('pt-BR')+' '+ld.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        var es=ed.toLocaleDateString('pt-BR')+' '+ed.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        var tp=s.keep?'<span class="badge badge-success">Permanente</span>':'<span class="badge badge-warning">24h</span>';
        h+='<tr class="'+(ic?'dev-current':'dev-other')+'"><td>'+(s.device||'?')+(ic?' <span class="badge badge-info">Este</span>':'')+'</td>'+
          '<td>'+ls+'</td><td>'+es+'</td><td>'+tp+'</td>'+
          '<td>'+(ic?'<span style="color:var(--tx3);font-size:.8em">Atual</span>':
          '<button class="btn btn-sm btn-danger" onclick="window._authKickDevice(\''+user.username.replace(/'/g,"\\'")+'\',\''+s.deviceId+'\')">Encerrar</button>')+'</td></tr>';
      });h+='</tbody></table></div>';}
    h+='</div>';
  });
  if(!h)h='<p style="color:var(--tx3);font-size:.85em">Nenhum dispositivo ativo.</p>';
  el.innerHTML=h;
};
window._authKickDevice=async function(u,did){if(!confirm('Encerrar sess\u00e3o?'))return;await unregisterDevice(u,did);if(typeof toast==='function')toast('Encerrada!');else alert('Encerrada!');window._authRefreshDevices();};

/* ---------- USUÁRIOS UI ---------- */
window._authRenderUsers=async function(){
  var el=document.getElementById('authUsersList');if(!el)return;
  var d=await readAuthGist();if(!d||!d.users){el.innerHTML='<p style="color:var(--tx3)">Conecte ao cloud.</p>';return;}
  var h='<div class="table-wrap"><table><thead><tr><th>Usu\u00e1rio</th><th>Perfil</th><th>Criado</th><th>Disp.</th><th>A\u00e7\u00f5es</th></tr></thead><tbody>';
  d.users.forEach(function(u){
    var dc=u.createdAt?fmtD(u.createdAt.substring(0,10)):'-';
    var rl=u.role==='admin'?'Admin':'Usu\u00e1rio',bg=u.role==='admin'?'badge-purple':'badge-info';
    var as=(u.sessions||[]).filter(function(s){return new Date(s.expiresAt).getTime()>Date.now();});
    var db=as.length>0?'<span class="badge badge-success">'+as.length+'</span>':'<span class="badge badge-warning">0</span>';
    h+='<tr><td><strong>'+u.username+'</strong></td><td><span class="badge '+bg+'">'+rl+'</span></td><td>'+dc+'</td><td>'+db+'</td>'+
      '<td><button class="btn btn-sm btn-outline" onclick="window._authChangePass(\''+u.username.replace(/'/g,"\\'")+'\')">Senha</button> '+
      '<button class="btn btn-sm btn-danger" onclick="window._authDelUser(\''+u.username.replace(/'/g,"\\'")+'\')">&#128465;</button></td></tr>';
  });h+='</tbody></table></div>';el.innerHTML=h;
};
window._authAddUser=async function(){
  var n=(document.getElementById('newAuthUser').value||'').trim(),p=document.getElementById('newAuthPass').value,
      r=document.getElementById('newAuthRole').value,m=document.getElementById('authMsg');
  if(!n||!p){m.innerHTML='<span style="color:var(--dn2)">Preencha tudo.</span>';return;}
  var d=await readAuthGist();if(!d){m.innerHTML='<span style="color:var(--dn2)">Erro cloud.</span>';return;}
  if(d.users.some(function(u){return u.username.toLowerCase()===n.toLowerCase();})){m.innerHTML='<span style="color:var(--dn2)">J\u00e1 existe.</span>';return;}
  d.users.push({username:n,passwordHash:await sha256(p),createdAt:new Date().toISOString(),role:r,sessions:[]});
  if(await writeAuthGist(d)){m.innerHTML='<span style="color:var(--ok)">"'+n+'" criado!</span>';document.getElementById('newAuthUser').value='';document.getElementById('newAuthPass').value='';window._authRenderUsers();}
  else m.innerHTML='<span style="color:var(--dn2)">Erro.</span>';
};
window._authChangePass=async function(u){var np=prompt('Nova senha para "'+u+'":');if(!np)return;var d=await readAuthGist();if(!d)return alert('Erro.');
  var x=d.users.find(function(z){return z.username===u;});if(!x)return alert('N\u00e3o encontrado.');x.passwordHash=await sha256(np);if(await writeAuthGist(d))alert('Senha alterada!');else alert('Erro.');};
window._authDelUser=async function(u){var c=window._authCurrentUser;if(c&&c.username.toLowerCase()===u.toLowerCase())return alert('N\u00e3o pode excluir a si mesmo.');
  if(!confirm('Excluir "'+u+'"?'))return;var d=await readAuthGist();if(!d)return alert('Erro.');
  d.users=d.users.filter(function(x){return x.username!==u;});if(await writeAuthGist(d)){alert('Removido.');window._authRenderUsers();}else alert('Erro.');};

/* ---------- INIT ---------- */
(function(){
  var sb=document.getElementById('sidebar'),mn=document.querySelector('.main'),mh=document.getElementById('mobHeader');
  if(sb)sb.style.visibility='hidden';if(mn)mn.style.visibility='hidden';if(mh)mh.style.visibility='hidden';
  var ss=getSession();
  if(ss){
    window._authCurrentUser={username:ss.user,role:ss.role||'user'};
    switchToUserData(ss.user);showApp(ss.user,ss.role||'user');
    setTimeout(function(){if(typeof initCloud==='function')initCloud();},300);
  }else{
    setTimeout(function(){var t=document.getElementById('authToken');if(t)t.focus();else document.getElementById('authUser').focus();},200);
  }
})();

console.log('[Financeiro Pro] Auth v5.5 — Arquivo completo + merge real + protecao race condition.');
})();

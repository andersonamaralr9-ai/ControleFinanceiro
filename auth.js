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
  ['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'].forEach(function(k){
    var ra=Array.isArray(r[k])?r[k]:[],la=Array.isArray(l[k])?l[k]:[];
    var map={};
    ra.forEach(function(i){if(i.id)map[i.id]=i;});
    la.forEach(function(i){
      if(!i.id)return;
      if(map[i.id]){var rts=map[i.id]._ts||0,lts=i._ts||0;if(lts>rts)map[i.id]=i;}
      else map[i.id]=i;
    });
    r[k]=Object.values(map);
  });
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
  var h=await sha256('202328');
  var data={users:[{username:'Anderson',passwordHash:h,createdAt:new Date().toISOString(),role:'admin',sessions:[]}]};
  await writeGistFile('auth_users.json',data);
  return data;
}

// ================================================================
// CSS — VISUAL MODERNO (glassmorphism, gradientes, animações)
// ================================================================
var sty=document.createElement('style');
sty.textContent=`
/* ===== AUTH OVERLAY — Glassmorphism ===== */
.auth-overlay{position:fixed;inset:0;z-index:10000;background:linear-gradient(135deg,#0a0a1a 0%,#1a1035 40%,#0d1f3c 100%);display:flex;align-items:center;justify-content:center;transition:opacity .4s;overflow:hidden}
.auth-overlay::before{content:'';position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(108,92,231,.15),transparent 70%);top:-100px;right:-100px;border-radius:50%;animation:authFloat 8s ease-in-out infinite}
.auth-overlay::after{content:'';position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(0,206,201,.1),transparent 70%);bottom:-80px;left:-80px;border-radius:50%;animation:authFloat 10s ease-in-out infinite reverse}
@keyframes authFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.1)}}
.auth-overlay.hiding{opacity:0;pointer-events:none}
.auth-box{background:rgba(26,29,39,.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(108,92,231,.2);border-radius:24px;padding:44px 40px;width:95%;max-width:420px;box-shadow:0 25px 80px rgba(0,0,0,.5),0 0 40px rgba(108,92,231,.08);text-align:center;position:relative;z-index:1;animation:authSlideUp .5s ease-out}
@keyframes authSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.auth-logo{font-size:2.8em;margin-bottom:8px;filter:drop-shadow(0 4px 12px rgba(108,92,231,.3))}
.auth-title{font-size:1.5em;font-weight:800;background:linear-gradient(135deg,#a29bfe,#6c5ce7,#00cec9);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:authGrad 4s ease infinite;margin-bottom:4px}
@keyframes authGrad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.auth-sub{font-size:.82em;color:var(--tx3);margin-bottom:28px}
.auth-box .form-group{text-align:left;margin-bottom:16px}
.auth-box .form-group label{font-size:.78em;color:var(--tx2);font-weight:600;margin-bottom:6px;display:block;letter-spacing:.3px}
.auth-box .form-control{width:100%;padding:13px 16px;font-size:.9em;background:rgba(36,40,54,.8);border:1px solid rgba(108,92,231,.15);border-radius:12px;color:var(--tx);transition:all .25s}
.auth-box .form-control:focus{border-color:var(--pri);box-shadow:0 0 0 4px rgba(108,92,231,.15),0 0 20px rgba(108,92,231,.1)}
.auth-btn{width:100%;padding:15px;border:none;border-radius:12px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;font-size:.95em;font-weight:700;cursor:pointer;transition:all .3s;margin-top:10px;position:relative;overflow:hidden;letter-spacing:.3px}
.auth-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#a29bfe,#6c5ce7);opacity:0;transition:opacity .3s}
.auth-btn:hover::before{opacity:1}
.auth-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(108,92,231,.4)}
.auth-btn:active{transform:translateY(0)}
.auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.auth-btn span{position:relative;z-index:1}
.auth-error{color:var(--dn2);font-size:.82em;margin-top:12px;min-height:20px}
.auth-footer{margin-top:24px;font-size:.72em;color:var(--tx3);opacity:.7}
.auth-keep{display:flex;align-items:center;gap:8px;margin-top:14px;margin-bottom:6px;justify-content:center}
.auth-keep input[type=checkbox]{width:18px;height:18px;accent-color:var(--pri);cursor:pointer;border-radius:4px}
.auth-keep label{font-size:.82em;color:var(--tx2);cursor:pointer;user-select:none}
.auth-token-section{text-align:left;margin-bottom:16px;padding:16px;background:rgba(253,203,110,.05);border-radius:14px;border:1px solid rgba(253,203,110,.15)}
.auth-token-section .ats-title{font-size:.8em;color:var(--wn);font-weight:700;margin-bottom:8px}
.auth-token-section .ats-help{font-size:.72em;color:var(--tx3);margin-top:8px;line-height:1.5}
.auth-token-section .ats-help a{color:var(--pri2);text-decoration:none;font-weight:600}
.auth-token-section .ats-help a:hover{text-decoration:underline}

/* ===== USER BAR — moderna com glassmorphism ===== */
.auth-ubar{position:fixed;bottom:0;left:0;right:0;z-index:90;background:rgba(26,29,39,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid rgba(108,92,231,.1);padding:10px 20px;display:none;align-items:center;justify-content:space-between;font-size:.8em;gap:8px}
.auth-ubar .au-left{display:flex;align-items:center;gap:10px}
.auth-ubar .au-avatar{width:32px;height:32px;border-radius:10px;background:var(--priG);display:flex;align-items:center;justify-content:center;font-size:.85em;font-weight:700;color:#fff;flex-shrink:0}
.auth-ubar .au-info{display:flex;flex-direction:column;gap:1px}
.auth-ubar .au-name{color:var(--tx);font-weight:700;font-size:.9em}
.auth-ubar .au-role{font-size:.68em;padding:2px 8px;border-radius:6px;display:inline-block;width:fit-content}
.auth-ubar .au-role.admin{background:rgba(108,92,231,.15);color:var(--pri2)}
.auth-ubar .au-role.user{background:rgba(9,132,227,.15);color:var(--inf2)}
.auth-ubar .au-right{display:flex;align-items:center;gap:12px}
.auth-ubar .au-sync-info{font-size:.72em;color:var(--tx3);text-align:right;line-height:1.3}
.auth-ubar .au-logout{background:transparent;border:1px solid rgba(255,255,255,.08);color:var(--tx3);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:.82em;transition:all .2s;display:flex;align-items:center;gap:6px}
.auth-ubar .au-logout:hover{border-color:var(--dn2);color:var(--dn2);background:rgba(214,48,49,.05)}

/* ===== DISPOSITIVOS ===== */
.no-admin-msg{background:rgba(253,203,110,.06);border:1px solid rgba(253,203,110,.15);border-radius:12px;padding:14px 18px;color:var(--wn);font-size:.84em;margin-bottom:12px}
.dev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:12px}
.dev-card{background:var(--bg3);border:1px solid var(--bg4);border-radius:12px;padding:16px;transition:all .2s;position:relative}
.dev-card:hover{border-color:var(--pri);transform:translateY(-2px)}
.dev-card.current{border-color:var(--ok);box-shadow:0 0 20px rgba(0,206,201,.08)}
.dev-card .dev-icon{font-size:1.6em;margin-bottom:8px}
.dev-card .dev-name{font-weight:700;font-size:.88em;margin-bottom:4px}
.dev-card .dev-name .badge{margin-left:6px;font-size:.65em;vertical-align:middle}
.dev-card .dev-meta{font-size:.75em;color:var(--tx3);line-height:1.6}
.dev-card .dev-actions{margin-top:10px;display:flex;gap:6px}
.dev-user-group{margin-bottom:20px}
.dev-user-group h4{font-size:.92em;color:var(--pri2);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--bg4)}

/* ===== SIDEBAR MODERNA ===== */
.sidebar{scrollbar-width:thin;scrollbar-color:var(--bg4) transparent}
.sidebar::-webkit-scrollbar{width:4px}
.sidebar::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:4px}
.sidebar .logo{padding:28px 20px 20px;font-size:1.4em;font-weight:800;background:linear-gradient(135deg,#a29bfe,#6c5ce7,#00cec9);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:authGrad 4s ease infinite;text-align:center;letter-spacing:-.3px}
.sidebar a{border-radius:0 10px 10px 0;margin-right:10px;border-left:3px solid transparent;transition:all .2s}
.sidebar a:hover{background:linear-gradient(90deg,rgba(108,92,231,.08),transparent);border-left-color:var(--pri2);transform:translateX(4px)}
.sidebar a.active{background:linear-gradient(90deg,rgba(108,92,231,.15),rgba(108,92,231,.03));border-left-color:var(--pri);color:var(--tx);font-weight:600}
.sidebar a.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--priG);border-radius:0 3px 3px 0}
.sidebar .group-label{font-size:.65em;letter-spacing:3px;color:var(--tx3);opacity:.6;padding:16px 20px 6px}

/* ===== MOBILE HEADER MODERNA ===== */
.mobile-header{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:rgba(26,29,39,.9)!important;border-bottom:1px solid rgba(108,92,231,.1)!important}
.mobile-header .mob-title{font-size:1.05em;font-weight:800;background:linear-gradient(135deg,#a29bfe,#6c5ce7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.mobile-header .hamburger{color:var(--pri2);font-size:1.3em;padding:6px 10px;border-radius:8px;transition:background .2s}
.mobile-header .hamburger:active{background:rgba(108,92,231,.15)}

/* ===== CARDS com hover glow ===== */
.card{transition:transform .25s,box-shadow .25s;border:1px solid var(--bg4);position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--priG);opacity:0;transition:opacity .25s}
.card:hover::before{opacity:1}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.2)}

/* ===== PAGE TITLES ===== */
.page-title{font-size:1.5em;font-weight:800;margin-bottom:22px;padding-bottom:14px;border-bottom:2px solid transparent;border-image:linear-gradient(90deg,var(--pri),transparent) 1;letter-spacing:-.3px}

/* ===== FORM SECTIONS com glow ===== */
.form-section{border:1px solid var(--bg4);transition:border-color .3s,box-shadow .3s;border-radius:16px}
.form-section:hover{border-color:rgba(108,92,231,.15);box-shadow:0 4px 20px rgba(108,92,231,.05)}

/* ===== BOTÕES melhorados ===== */
.btn-primary{background:linear-gradient(135deg,#6c5ce7,#a29bfe);position:relative;overflow:hidden;transition:all .25s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(108,92,231,.3)}
.btn-primary:active{transform:translateY(0)}

/* ===== TABELAS modernas ===== */
th{background:linear-gradient(135deg,var(--bg3),rgba(108,92,231,.05));font-size:.72em;letter-spacing:1.2px}
tr{transition:background .15s}

/* ===== SYNC BAR ===== */
.sidebar .sync-bar{background:rgba(108,92,231,.03);border-top:1px solid rgba(108,92,231,.08);padding:14px 16px}
.sidebar .sync-bar .sdot{box-shadow:0 0 8px currentColor}

/* ===== SUB-BOX / CONTRACT CARDS ===== */
.sub-box{border-radius:16px;transition:transform .25s,box-shadow .25s}
.sub-box:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,.15)}
.sub-box-header{border-radius:16px 16px 0 0}

/* ===== MODAIS ===== */
.modal-content{border-radius:20px;border:1px solid rgba(108,92,231,.15);box-shadow:0 25px 80px rgba(0,0,0,.5)}
.modal-header{border-bottom:1px solid rgba(108,92,231,.1)}

/* ===== SCROLLBAR GLOBAL ===== */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:var(--pri)}

/* ===== BADGES PILL ===== */
.badge{border-radius:8px;font-weight:600;letter-spacing:.2px}

/* ===== CHART BOX ===== */
.chart-box{border-radius:16px;transition:box-shadow .25s}
.chart-box:hover{box-shadow:0 6px 24px rgba(0,0,0,.15)}

/* ===== MONTH NAV ===== */
.month-nav .btn{border-radius:10px;transition:all .2s}
.month-nav .btn:hover{background:rgba(108,92,231,.1);border-color:var(--pri);color:var(--pri)}

/* ===== CC CARDS ===== */
.cc-card{border-radius:16px;border-top:3px solid;border-image:var(--priG) 1;transition:transform .25s}
.cc-card:hover{transform:translateY(-3px)}

/* ===== SMOOTH TRANSITIONS ===== */
*{transition-timing-function:cubic-bezier(.4,0,.2,1)}

/* ===== MOBILE FIXES ===== */
@media(max-width:768px){
  .auth-box{padding:32px 24px;border-radius:20px}
  .auth-logo{font-size:2.2em}
  .auth-title{font-size:1.3em}
  .auth-ubar{padding:8px 14px}
  .auth-ubar .au-avatar{width:28px;height:28px;font-size:.75em}
  .auth-ubar .au-name{font-size:.82em}
  .auth-ubar .au-sync-info{font-size:.65em}
  .dev-grid{grid-template-columns:1fr}
  .main{padding-bottom:56px!important}
}
`;
document.head.appendChild(sty);

// ================================================================
// HTML LOGIN
// ================================================================
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
// TOKEN
// ================================================================
function _setGistToken(t){window.gistToken=t;localStorage.setItem('finApp_gist_token',t);}
function _getToken(){return window.gistToken||localStorage.getItem('finApp_gist_token')||'';}

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
  var userFile=await readUserGistFile('Anderson');
  if(userFile&&((userFile.lancamentos&&userFile.lancamentos.length>0)||(userFile.contratos&&userFile.contratos.length>0)||(userFile.cartoes&&userFile.cartoes.length>0)))return null;
  var legacy=await readGistFile('financeiro.json');
  if(!legacy||(!legacy.lancamentos&&!legacy.contratos&&!legacy.cartoes))return null;
  await writeUserGistFile('Anderson',legacy);
  console.log('[Auth v8] Migração: financeiro.json → anderson.json');
  return legacy;
}

// ================================================================
// SWITCH TO USER DATA
// ================================================================
function switchToUserData(user){
  var uKey=getUserStorageKey(user);
  window._userSK=uKey;window._authUsername=user;
  try{var d=JSON.parse(localStorage.getItem(uKey));if(d){S=ensureArrays(d);}else{S=defState();}}catch(e){S=defState();}

  window.salvar=function(){
    if(!window._userSK)return;
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
          S=deepMergeState(loc,rem);
          localStorage.setItem(window._userSK,JSON.stringify(S));
          await writeUserGistFile(window._authUsername,S);
          if(typeof renderAll==='function')renderAll();
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
    _setGistToken(t.trim());syncUI('loading','Conectando...');
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
    var st=localStorage.getItem('finApp_gist_token')||'';if(st)window.gistToken=st;
    if(!window.gistToken){cloudOk=false;syncUI('off','Sem token');return;}
    syncUI('loading','Conectando...');
    await ensureAuthFile();
    if(window._authUsername.toLowerCase()==='anderson')await migrateAndersonOnce();
    invalidateGistCache();
    var loc=JSON.parse(JSON.stringify(S));
    var rem=await readUserGistFile(window._authUsername);
    if(rem&&typeof rem==='object'&&(rem.lancamentos||rem.cartoes||rem.contratos)){
      S=deepMergeState(loc,rem);
      localStorage.setItem(window._userSK,JSON.stringify(S));
      if(typeof renderAll==='function')renderAll();
      await writeUserGistFile(window._authUsername,S);
      cloudOk=true;syncUI('on','Cloud conectado');
      startAutoSync();return;
    }
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
    _setGistToken(t.trim());syncUI('loading','Conectando...');
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

  window.doSyncNow=async function(){
    var st=localStorage.getItem('finApp_gist_token')||'';if(st)window.gistToken=st;
    syncUI('loading','Sincronizando...');
    var ok=await writeUserGistFile(window._authUsername,S);
    if(ok)syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
    else syncUI('on','Erro sync');
  };

  window.doDisconnect=function(){
    window.gistToken='';cloudOk=false;localStorage.removeItem('finApp_gist_token');
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
  if(typeof renderAll==='function')renderAll();
}

// ================================================================
// LOGIN — FIX: await registerDevice ANTES de initCloud
// ================================================================
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
  var ad=await ensureAuthFile();
  if(ad&&ad.users){
    var f=ad.users.find(function(u){return u.username.toLowerCase()===user.toLowerCase()&&u.passwordHash===ih;});
    if(f){ok=true;user=f.username;role=f.role||'user';}
  }
  if(!ok){var fb=await sha256('202328');if(user.toLowerCase()==='anderson'&&ih===fb){ok=true;user='Anderson';role='admin';}}
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
    switchToUserData(ss.user);
    showApp(ss.user,ss.role||'user');
    // Registrar dispositivo novamente (refresh da sessão) e depois initCloud
    await registerDevice(ss.user,ss.keep||false);
    if(typeof initCloud==='function') await initCloud();
  }else{
    setTimeout(function(){var t=document.getElementById('authToken');if(t)t.focus();else document.getElementById('authUser').focus();},200);
  }
})();

console.log('[Financeiro Pro] Auth v8 — Fix dispositivos + visual moderno + dados isolados + auto-sync 5min.');
})();

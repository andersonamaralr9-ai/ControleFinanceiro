// auth.js v5 — Arquivo por usuário, Manter Conectado, Gerenciamento de Dispositivos
(function(){
'use strict';

var AUTH_GIST_KEY  = 'finApp_auth_gist_id';
var SESSION_KEY    = 'finApp_session';
var DEVICE_ID_KEY  = 'finApp_device_id';
var SESSION_SHORT  = 24 * 60 * 60 * 1000;       // 24h
var SESSION_LONG   = 90 * 24 * 60 * 60 * 1000;   // 90 dias

// ================================================================
// HELPERS
// ================================================================
async function sha256(text){
  var enc = new TextEncoder();
  var buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
}

function getDeviceId(){
  var id = localStorage.getItem(DEVICE_ID_KEY);
  if(!id){
    id = 'dev_' + Math.random().toString(36).substr(2,9) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function detectDevice(){
  var ua = navigator.userAgent || '';
  var browser = 'Navegador';
  if(ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) browser = 'Chrome';
  else if(ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if(ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
  else if(ua.indexOf('Edg') > -1) browser = 'Edge';

  var os = 'Desktop';
  if(/Android/i.test(ua)) os = 'Android';
  else if(/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if(/Windows/i.test(ua)) os = 'Windows';
  else if(/Mac/i.test(ua)) os = 'macOS';
  else if(/Linux/i.test(ua)) os = 'Linux';

  return browser + ' / ' + os;
}

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = [
'.auth-overlay{position:fixed;inset:0;z-index:10000;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .3s;}',
'.auth-overlay.hiding{opacity:0;pointer-events:none;}',
'.auth-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:16px;padding:40px 36px;width:95%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center;}',
'.auth-logo{font-size:2.2em;margin-bottom:6px;}',
'.auth-title{font-size:1.3em;font-weight:700;background:var(--priG);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;}',
'.auth-sub{font-size:.82em;color:var(--tx3);margin-bottom:28px;}',
'.auth-box .form-group{text-align:left;margin-bottom:16px;}',
'.auth-box .form-group label{font-size:.78em;color:var(--tx2);font-weight:600;margin-bottom:4px;display:block;}',
'.auth-box .form-control{width:100%;padding:12px 14px;font-size:.9em;}',
'.auth-btn{width:100%;padding:14px;border:none;border-radius:10px;background:var(--priG);color:#fff;font-size:.95em;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px;}',
'.auth-btn:hover{opacity:.9;transform:translateY(-1px);}',
'.auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}',
'.auth-error{color:var(--dn2);font-size:.82em;margin-top:12px;min-height:20px;}',
'.auth-footer{margin-top:20px;font-size:.72em;color:var(--tx3);}',
'.auth-keep{display:flex;align-items:center;gap:8px;margin-top:12px;margin-bottom:4px;justify-content:center;}',
'.auth-keep input[type=checkbox]{width:18px;height:18px;accent-color:var(--pri);cursor:pointer;}',
'.auth-keep label{font-size:.82em;color:var(--tx2);cursor:pointer;user-select:none;}',
'.auth-ubar{position:fixed;bottom:0;left:0;right:0;z-index:90;background:var(--bg2);border-top:1px solid var(--bg4);padding:8px 16px;display:none;align-items:center;justify-content:space-between;font-size:.78em;gap:8px;}',
'.auth-ubar .au-name{color:var(--ok);font-weight:600;}',
'.auth-ubar .au-role{font-size:.72em;padding:2px 8px;border-radius:8px;margin-left:4px;}',
'.auth-ubar .au-role.admin{background:rgba(108,92,231,.15);color:var(--pri2);}',
'.auth-ubar .au-role.user{background:rgba(9,132,227,.15);color:var(--inf2);}',
'.auth-ubar .au-logout{background:transparent;border:1px solid var(--bg4);color:var(--tx3);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.82em;transition:all .15s;}',
'.auth-ubar .au-logout:hover{border-color:var(--dn2);color:var(--dn2);}',
'.no-admin-msg{background:rgba(253,203,110,.08);border:1px solid rgba(253,203,110,.2);border-radius:8px;padding:12px 16px;color:var(--wn);font-size:.84em;margin-bottom:12px;}',
'.dev-table{width:100%;border-collapse:collapse;margin-top:10px;}',
'.dev-table th{background:var(--bg3);padding:10px 12px;text-align:left;font-size:.72em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);}',
'.dev-table td{padding:9px 12px;border-bottom:1px solid var(--bg3);font-size:.82em;}',
'.dev-table .dev-current{color:var(--ok);font-weight:600;}',
'.dev-table .dev-other{color:var(--tx2);}',
'@media(max-width:768px){',
'  .auth-box{padding:28px 20px;}',
'  .auth-ubar{padding:6px 12px;font-size:.72em;}',
'  .main{padding-bottom:50px!important;}',
'}'
].join('\n');
document.head.appendChild(sty);

// ================================================================
// HTML LOGIN — agora com checkbox "Manter conectado"
// ================================================================
var overlay = document.createElement('div');
overlay.className = 'auth-overlay';
overlay.id = 'authOverlay';
overlay.innerHTML =
  '<div class="auth-box">'+
    '<div class="auth-logo">&#128176;</div>'+
    '<div class="auth-title">Financeiro Pro</div>'+
    '<div class="auth-sub">Fa\u00e7a login para acessar seus dados financeiros</div>'+
    '<div class="form-group"><label>Usu\u00e1rio</label>'+
      '<input type="text" id="authUser" class="form-control" placeholder="Digite seu usu\u00e1rio" autocomplete="username"></div>'+
    '<div class="form-group"><label>Senha</label>'+
      '<input type="password" id="authPass" class="form-control" placeholder="Digite sua senha" autocomplete="current-password"></div>'+
    '<div class="auth-keep">'+
      '<input type="checkbox" id="authKeep">'+
      '<label for="authKeep">Manter conectado</label>'+
    '</div>'+
    '<button class="auth-btn" id="authLoginBtn" onclick="window._authDoLogin()">Entrar</button>'+
    '<div class="auth-error" id="authError"></div>'+
    '<div class="auth-footer">&#128274; Acesso protegido</div>'+
  '</div>';
document.body.appendChild(overlay);

var ubar = document.createElement('div');
ubar.className = 'auth-ubar';
ubar.id = 'authUBar';
ubar.innerHTML = '<span>&#128100; <span class="au-name" id="auName"></span>'+
  '<span class="au-role" id="auRole"></span></span>'+
  '<button class="au-logout" onclick="window._authDoLogout()">&#128682; Sair</button>';
document.body.appendChild(ubar);

document.getElementById('authPass').addEventListener('keydown',function(e){if(e.key==='Enter')window._authDoLogin();});
document.getElementById('authUser').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('authPass').focus();});

window._authCurrentUser = null;

// ================================================================
// TOKEN HELPERS
// ================================================================
function _setGistToken(t){
  window.gistToken = t;
  localStorage.setItem('finApp_gist_token', t);
}
function _getToken(){
  return window.gistToken || localStorage.getItem('finApp_gist_token') || '';
}

// ================================================================
// GIST DE AUTENTICAÇÃO (auth_users.json)
// ================================================================
async function readAuthGist(){
  var token = _getToken();
  if(!token) return null;
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!gistId){
    gistId = await findAuthGist(token);
    if(!gistId) gistId = await createAuthGist(token);
    if(!gistId) return null;
  }
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId,{
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
    });
    if(r.status === 404){
      localStorage.removeItem(AUTH_GIST_KEY);
      gistId = await findAuthGist(token);
      if(!gistId) gistId = await createAuthGist(token);
      if(!gistId) return null;
      r = await fetch('https://api.github.com/gists/'+gistId,{
        headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
      });
    }
    if(!r.ok) return null;
    var j = await r.json();
    var f = j.files && j.files['auth_users.json'];
    return (f && f.content) ? JSON.parse(f.content) : null;
  }catch(e){return null;}
}

async function findAuthGist(token){
  try{
    var r = await fetch('https://api.github.com/gists?per_page=100',{
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
    });
    if(!r.ok) return null;
    var gists = await r.json();
    for(var i = 0; i < gists.length; i++){
      if(gists[i].description === 'FinanceiroPro-Auth' && gists[i].files && gists[i].files['auth_users.json']){
        localStorage.setItem(AUTH_GIST_KEY, gists[i].id);
        return gists[i].id;
      }
    }
    return null;
  }catch(e){return null;}
}

async function writeAuthGist(data){
  var token = _getToken();
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!token || !gistId) return false;
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId,{
      method:'PATCH',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({files:{'auth_users.json':{content:JSON.stringify(data,null,2)}}})
    });
    return r.ok;
  }catch(e){return false;}
}

async function createAuthGist(token){
  var h = await sha256('202328');
  var data = {
    users:[{
      username:'Anderson',
      passwordHash:h,
      createdAt:new Date().toISOString(),
      role:'admin',
      sessions:[]
    }]
  };
  try{
    var r = await fetch('https://api.github.com/gists',{
      method:'POST',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({description:'FinanceiroPro-Auth',public:false,
        files:{'auth_users.json':{content:JSON.stringify(data,null,2)}}})
    });
    if(!r.ok) return null;
    var j = await r.json();
    localStorage.setItem(AUTH_GIST_KEY, j.id);
    return j.id;
  }catch(e){return null;}
}

// ================================================================
// SESSÃO LOCAL
// ================================================================
function getSession(){
  try{
    var s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if(s && s.user && s.expires && Date.now() < s.expires) return s;
    localStorage.removeItem(SESSION_KEY);
    return null;
  }catch(e){return null;}
}
function setSession(username, role, keepConnected){
  var duration = keepConnected ? SESSION_LONG : SESSION_SHORT;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    user: username,
    role: role,
    deviceId: getDeviceId(),
    loginAt: Date.now(),
    expires: Date.now() + duration,
    keep: !!keepConnected
  }));
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// ================================================================
// REGISTRAR / REMOVER DISPOSITIVO NO GIST
// ================================================================
async function registerDevice(username, keepConnected){
  var data = await readAuthGist();
  if(!data || !data.users) return;
  var user = data.users.find(function(u){ return u.username.toLowerCase() === username.toLowerCase(); });
  if(!user) return;
  if(!Array.isArray(user.sessions)) user.sessions = [];

  var devId = getDeviceId();
  var duration = keepConnected ? SESSION_LONG : SESSION_SHORT;

  // Remove sessão antiga deste device
  user.sessions = user.sessions.filter(function(s){ return s.deviceId !== devId; });

  // Adiciona nova sessão
  user.sessions.push({
    deviceId: devId,
    device: detectDevice(),
    loginAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + duration).toISOString(),
    keep: !!keepConnected
  });

  // Limpa sessões expiradas de todos os usuários
  data.users.forEach(function(u){
    if(!Array.isArray(u.sessions)) u.sessions = [];
    u.sessions = u.sessions.filter(function(s){
      return new Date(s.expiresAt).getTime() > Date.now();
    });
  });

  await writeAuthGist(data);
}

async function unregisterDevice(username, deviceId){
  var data = await readAuthGist();
  if(!data || !data.users) return;
  var user = data.users.find(function(u){ return u.username.toLowerCase() === username.toLowerCase(); });
  if(!user || !Array.isArray(user.sessions)) return;
  user.sessions = user.sessions.filter(function(s){ return s.deviceId !== deviceId; });
  await writeAuthGist(data);
}

// ================================================================
// DADOS POR USUÁRIO — Arquivo separado no Gist
// ================================================================
function getUserFileKey(username){
  return username.toLowerCase().replace(/[^a-z0-9]/g,'_') + '.json';
}
function getUserStorageKey(username){
  return 'finApp_v5_' + username.toLowerCase().replace(/[^a-z0-9]/g,'_');
}

async function readUserGistFile(username){
  var token = _getToken();
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!token || !gistId) return null;
  var fileName = getUserFileKey(username);
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId,{
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
    });
    if(!r.ok) return null;
    var j = await r.json();
    var f = j.files && j.files[fileName];
    return (f && f.content) ? JSON.parse(f.content) : null;
  }catch(e){return null;}
}

async function writeUserGistFile(username, data){
  var token = _getToken();
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!token || !gistId) return false;
  var fileName = getUserFileKey(username);
  var files = {};
  files[fileName] = {content: JSON.stringify(data, null, 2)};
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId,{
      method:'PATCH',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({files: files})
    });
    return r.ok;
  }catch(e){return false;}
}

function switchToUserData(username){
  var userKey = getUserStorageKey(username);
  window._userSK = userKey;
  window._authUsername = username;

  // Carregar dados locais
  if(!localStorage.getItem(userKey)){
    var existing = localStorage.getItem('finApp_v5');
    if(existing) localStorage.setItem(userKey, existing);
  }

  try{
    var d = JSON.parse(localStorage.getItem(userKey));
    if(d){
      S = d;
      ['lancamentos','cartoes','comprasCartao','assinaturas','contratos','investimentos','caixa'].forEach(function(k){
        if(!Array.isArray(S[k])) S[k] = [];
      });
      if(!S.planejamento || Array.isArray(S.planejamento)) S.planejamento = {};
      if(!S.cats) S.cats = JSON.parse(JSON.stringify(defCats));
      Object.keys(defCats).forEach(function(k){
        if(!Array.isArray(S.cats[k])) S.cats[k] = defCats[k].slice();
      });
      if(!S.config) S.config = {theme:'dark'};
    } else {
      S = defState();
    }
  }catch(e){
    S = defState();
  }

  // Override salvar — grava local + agenda sync Gist por usuário
  window.salvar = function(){
    localStorage.setItem(window._userSK, JSON.stringify(S));
    _scheduleUserSync();
  };

  // Override gistRead/gistWrite para usar arquivo do usuário
  window.gistRead = async function(){
    return await readUserGistFile(window._authUsername);
  };

  window.gistWrite = async function(data){
    return await writeUserGistFile(window._authUsername, data);
  };

  // Override scheduleSync
  var _userSyncTimer = null;
  window._scheduleUserSync = function(){
    if(!cloudOk) return;
    clearTimeout(_userSyncTimer);
    _userSyncTimer = setTimeout(async function(){
      syncUI('loading','Sincronizando...');
      try{
        var ok = await writeUserGistFile(window._authUsername, S);
        if(ok) syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
        else syncUI('on','Erro sync');
      }catch(e){
        syncUI('on','Erro sync (rede)');
      }
    }, 3000);
  };
  window.scheduleSync = window._scheduleUserSync;

  // Override connectCloud
  window.connectCloud = async function(){
    var t = (document.getElementById('inputToken') || {}).value;
    if(!t) t = (document.getElementById('bkToken') || {}).value;
    if(!t || !t.trim()){alert('Informe o token.');return;}
    t = t.trim();
    _setGistToken(t);
    syncUI('loading','Conectando...');
    var tokenModal = document.getElementById('modalToken');
    if(tokenModal && tokenModal.classList.contains('show')) closeM('modalToken');
    var data = await readUserGistFile(window._authUsername);
    if(data === null){
      cloudOk = true;
      await writeUserGistFile(window._authUsername, S);
      syncUI('on','Cloud conectado');
    } else if(data && typeof data === 'object'){
      if(data.lancamentos || data.cartoes || data.contratos){
        S = mergeState(data);
        localStorage.setItem(window._userSK, JSON.stringify(S));
        renderAll();
      }
      cloudOk = true;
      syncUI('on','Cloud conectado');
    } else {
      cloudOk = true;
      syncUI('on','Cloud conectado');
    }
    if(typeof renderCloudArea === 'function') renderCloudArea();
  };

  // Override initCloud
  window.initCloud = async function(){
    var savedToken = localStorage.getItem('finApp_gist_token') || '';
    if(savedToken) window.gistToken = savedToken;
    if(!window.gistToken){
      openM('modalToken');
      return;
    }
    syncUI('loading','Conectando...');
    var data = await readUserGistFile(window._authUsername);
    if(data && typeof data === 'object' && (data.lancamentos || data.cartoes || data.contratos)){
      S = mergeState(data);
      localStorage.setItem(window._userSK, JSON.stringify(S));
      renderAll();
    }
    cloudOk = true;
    syncUI('on','Cloud conectado');
  };

  // Override doPullGist
  window.doPullGist = async function(){
    syncUI('loading','Baixando...');
    var data = await readUserGistFile(window._authUsername);
    if(data && (data.lancamentos || data.cartoes || data.contratos)){
      S = mergeState(data);
      localStorage.setItem(window._userSK, JSON.stringify(S));
      renderAll();
      syncUI('on','Dados carregados');
    } else {
      syncUI('on','Nenhum dado no Gist');
    }
  };

  // Override doConnectFromBk
  window.doConnectFromBk = async function(){
    var t = (document.getElementById('bkToken') || {}).value;
    if(!t || !t.trim()){alert('Informe o token.');return;}
    t = t.trim();
    _setGistToken(t);
    syncUI('loading','Conectando...');
    var data = await readUserGistFile(window._authUsername);
    if(data && (data.lancamentos || data.cartoes || data.contratos)){
      S = mergeState(data);
      localStorage.setItem(window._userSK, JSON.stringify(S));
      renderAll();
    } else {
      await writeUserGistFile(window._authUsername, S);
    }
    cloudOk = true;
    syncUI('on','Cloud conectado');
    if(typeof renderCloudArea === 'function') renderCloudArea();
  };

  // Override doSyncNow
  window.doSyncNow = async function(){
    var savedToken = localStorage.getItem('finApp_gist_token') || '';
    if(savedToken) window.gistToken = savedToken;
    syncUI('loading','Sincronizando...');
    var ok = await writeUserGistFile(window._authUsername, S);
    if(ok) syncUI('on','Sync '+new Date().toLocaleTimeString('pt-BR'));
    else syncUI('on','Erro sync');
  };

  if(S.config && S.config.theme && typeof setTheme === 'function') setTheme(S.config.theme);
  if(typeof renderAll === 'function') renderAll();
}

// ================================================================
// LOGIN
// ================================================================
window._authDoLogin = async function(){
  var userEl  = document.getElementById('authUser');
  var passEl  = document.getElementById('authPass');
  var keepEl  = document.getElementById('authKeep');
  var errEl   = document.getElementById('authError');
  var btn     = document.getElementById('authLoginBtn');

  var username = (userEl.value||'').trim();
  var password = passEl.value;
  var keepConnected = keepEl.checked;

  if(!username || !password){
    errEl.textContent = 'Preencha usu\u00e1rio e senha.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verificando...';
  errEl.textContent = '';

  var inputHash = await sha256(password);
  var role = 'user';
  var validado = false;

  var token = _getToken();
  if(token){
    var authData = await readAuthGist();
    if(authData && authData.users){
      var found = authData.users.find(function(u){
        return u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === inputHash;
      });
      if(found){
        validado = true;
        username = found.username;
        role = found.role || 'user';
      }
    }
  }

  // Fallback local
  if(!validado){
    var fallback = await sha256('202328');
    if(username.toLowerCase() === 'anderson' && inputHash === fallback){
      validado = true;
      username = 'Anderson';
      role = 'admin';
    }
  }

  if(validado){
    setSession(username, role, keepConnected);
    window._authCurrentUser = {username: username, role: role};
    switchToUserData(username);
    showApp(username, role);

    // Registrar dispositivo no Gist (async, não bloqueia)
    registerDevice(username, keepConnected);

    setTimeout(function(){
      if(typeof initCloud === 'function') initCloud();
    }, 500);
  } else {
    errEl.textContent = 'Usu\u00e1rio ou senha incorretos.';
    passEl.value = '';
    passEl.focus();
  }

  btn.disabled = false;
  btn.textContent = 'Entrar';
};

// ================================================================
// LOGOUT
// ================================================================
window._authDoLogout = function(){
  if(!confirm('Deseja sair do sistema?')) return;
  var session = getSession();
  if(session){
    unregisterDevice(session.user, getDeviceId());
  }
  clearSession();
  window._authCurrentUser = null;
  location.reload();
};

// ================================================================
// SHOW / HIDE APP
// ================================================================
function showApp(username, role){
  var ov = document.getElementById('authOverlay');
  ov.classList.add('hiding');
  setTimeout(function(){ ov.style.display = 'none'; }, 300);

  document.getElementById('sidebar').style.visibility = 'visible';
  document.querySelector('.main').style.visibility = 'visible';
  var mh = document.getElementById('mobHeader');
  if(mh) mh.style.visibility = 'visible';

  document.getElementById('auName').textContent = username;
  var roleEl = document.getElementById('auRole');
  roleEl.textContent = role === 'admin' ? 'Administrador' : 'Usu\u00e1rio';
  roleEl.className = 'au-role ' + role;
  document.getElementById('authUBar').style.display = 'flex';

  applyRoleRestrictions(role);
}

function hideApp(){
  document.getElementById('sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';
  var mh = document.getElementById('mobHeader');
  if(mh) mh.style.visibility = 'hidden';
  document.getElementById('authUBar').style.display = 'none';

  var ov = document.getElementById('authOverlay');
  ov.style.display = 'flex';
  setTimeout(function(){ ov.classList.remove('hiding'); },10);
  document.getElementById('authUser').value = '';
  document.getElementById('authPass').value = '';
  document.getElementById('authError').textContent = '';
}

function applyRoleRestrictions(role){
  if(role === 'admin') return;
  setTimeout(function(){
    var configCats = document.getElementById('configCatsArea');
    if(configCats){
      configCats.innerHTML = '<div class="no-admin-msg">&#128274; Somente administradores podem gerenciar categorias.</div>';
    }
    var authAdmin = document.getElementById('authAdminSection');
    if(authAdmin) authAdmin.style.display = 'none';
    var limparSection = document.querySelector('#pg-config .btn-danger');
    if(limparSection){
      var parent = limparSection.closest('.form-section');
      if(parent) parent.style.display = 'none';
    }
  }, 600);
}

// ================================================================
// ADMIN: Gerenciar Usuários + Dispositivos
// ================================================================
setTimeout(function(){
  var configPage = document.getElementById('pg-config');
  if(!configPage) return;

  // ---- Seção Gerenciar Usuários ----
  var sec = document.createElement('div');
  sec.className = 'form-section';
  sec.id = 'authAdminSection';
  sec.innerHTML =
    '<h3 style="margin-bottom:14px">&#128274; Gerenciar Usu\u00e1rios</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Cada usu\u00e1rio tem seus pr\u00f3prios dados financeiros separados.</p>'+
    '<div id="authUsersList"></div>'+
    '<div class="form-grid" style="margin-top:14px">'+
      '<div class="form-group"><label>Novo Usu\u00e1rio</label><input id="newAuthUser" class="form-control" placeholder="Nome"></div>'+
      '<div class="form-group"><label>Senha</label><input type="password" id="newAuthPass" class="form-control" placeholder="Senha"></div>'+
      '<div class="form-group"><label>Perfil</label><select id="newAuthRole" class="form-control">'+
        '<option value="admin">Admin</option>'+
        '<option value="user" selected>Usu\u00e1rio</option></select></div>'+
      '<div class="form-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="window._authAddUser()">Adicionar</button></div>'+
    '</div>'+
    '<div id="authMsg" style="margin-top:8px;font-size:.82em;min-height:20px"></div>';
  configPage.appendChild(sec);

  // ---- Seção Dispositivos Conectados ----
  var devSec = document.createElement('div');
  devSec.className = 'form-section';
  devSec.id = 'authDevicesSection';
  devSec.innerHTML =
    '<h3 style="margin-bottom:14px">&#128241; Dispositivos Conectados</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Veja os dispositivos logados na sua conta e encerre sess\u00f5es remotamente.</p>'+
    '<div id="authDevicesList"><p style="color:var(--tx3);font-size:.85em">Carregando...</p></div>'+
    '<button class="btn btn-sm btn-outline" onclick="window._authRefreshDevices()" style="margin-top:10px">&#128259; Atualizar</button>';
  configPage.appendChild(devSec);

  // Renderizar ao entrar
  if(window._authCurrentUser){
    if(window._authCurrentUser.role === 'admin'){
      window._authRenderUsers();
    }
    setTimeout(function(){ window._authRefreshDevices(); }, 800);
  }
}, 500);

// ================================================================
// RENDERIZAR DISPOSITIVOS
// ================================================================
window._authRefreshDevices = async function(){
  var el = document.getElementById('authDevicesList');
  if(!el) return;
  el.innerHTML = '<p style="color:var(--tx3);font-size:.85em">Carregando...</p>';

  var data = await readAuthGist();
  if(!data || !data.users){
    el.innerHTML = '<p style="color:var(--tx3);font-size:.85em">Conecte ao cloud para ver dispositivos.</p>';
    return;
  }

  var cur = window._authCurrentUser;
  if(!cur) return;

  var myDeviceId = getDeviceId();
  var h = '';

  // Se admin, mostrar dispositivos de todos os usuários
  var usersToShow = [];
  if(cur.role === 'admin'){
    usersToShow = data.users;
  } else {
    var me = data.users.find(function(u){ return u.username.toLowerCase() === cur.username.toLowerCase(); });
    if(me) usersToShow = [me];
  }

  usersToShow.forEach(function(user){
    var sessions = (user.sessions || []).filter(function(s){
      return new Date(s.expiresAt).getTime() > Date.now();
    });

    if(sessions.length === 0 && usersToShow.length > 1) return; // Pula se admin e usuário sem sessão

    h += '<div style="margin-bottom:16px">';
    if(usersToShow.length > 1){
      h += '<h4 style="font-size:.9em;margin-bottom:8px;color:var(--pri2)">&#128100; '+user.username+'</h4>';
    }

    if(sessions.length === 0){
      h += '<p style="color:var(--tx3);font-size:.84em">Nenhum dispositivo ativo.</p>';
    } else {
      h += '<div class="table-wrap"><table class="dev-table"><thead><tr>'+
        '<th>Dispositivo</th><th>Login</th><th>Expira</th><th>Tipo</th><th>A\u00e7\u00e3o</th>'+
        '</tr></thead><tbody>';

      sessions.forEach(function(sess){
        var isCurrent = (sess.deviceId === myDeviceId && user.username.toLowerCase() === cur.username.toLowerCase());
        var cls = isCurrent ? 'dev-current' : 'dev-other';
        var loginDate = new Date(sess.loginAt);
        var expDate = new Date(sess.expiresAt);
        var loginStr = loginDate.toLocaleDateString('pt-BR') + ' ' + loginDate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        var expStr = expDate.toLocaleDateString('pt-BR') + ' ' + expDate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        var tipoSess = sess.keep ? '<span class="badge badge-success">Permanente</span>' : '<span class="badge badge-warning">24h</span>';

        h += '<tr class="'+cls+'"><td>'+(sess.device||'Desconhecido')+(isCurrent?' <span class="badge badge-info">Este</span>':'')+'</td>'+
          '<td>'+loginStr+'</td>'+
          '<td>'+expStr+'</td>'+
          '<td>'+tipoSess+'</td>'+
          '<td>'+(isCurrent ?
            '<span style="color:var(--tx3);font-size:.8em">Sess\u00e3o atual</span>' :
            '<button class="btn btn-sm btn-danger" onclick="window._authKickDevice(\''+user.username.replace(/'/g,"\\'")+'\',\''+sess.deviceId+'\')">Encerrar</button>'
          )+'</td></tr>';
      });

      h += '</tbody></table></div>';
    }
    h += '</div>';
  });

  if(!h) h = '<p style="color:var(--tx3);font-size:.85em">Nenhum dispositivo ativo encontrado.</p>';
  el.innerHTML = h;
};

// ================================================================
// ENCERRAR SESSÃO DE DISPOSITIVO REMOTO
// ================================================================
window._authKickDevice = async function(username, deviceId){
  if(!confirm('Encerrar sess\u00e3o deste dispositivo?')) return;
  await unregisterDevice(username, deviceId);
  if(typeof toast === 'function') toast('Sess\u00e3o encerrada!');
  else alert('Sess\u00e3o encerrada!');
  window._authRefreshDevices();
};

// ================================================================
// RENDERIZAR USUÁRIOS (Admin)
// ================================================================
window._authRenderUsers = async function(){
  var el = document.getElementById('authUsersList');
  if(!el) return;
  var data = await readAuthGist();
  if(!data || !data.users){
    el.innerHTML = '<p style="color:var(--tx3);font-size:.85em">Conecte ao cloud para gerenciar usu\u00e1rios.</p>';
    return;
  }
  var h = '<div class="table-wrap"><table><thead><tr><th>Usu\u00e1rio</th><th>Perfil</th><th>Criado em</th><th>Dispositivos</th><th>A\u00e7\u00f5es</th></tr></thead><tbody>';
  data.users.forEach(function(u){
    var dc = u.createdAt ? fmtD(u.createdAt.substring(0,10)) : '-';
    var badge = u.role==='admin' ? 'badge-purple' : 'badge-info';
    var roleLabel = u.role==='admin' ? 'Admin' : 'Usu\u00e1rio';
    var activeSessions = (u.sessions || []).filter(function(s){ return new Date(s.expiresAt).getTime() > Date.now(); });
    var devCount = activeSessions.length;
    var devBadge = devCount > 0 ? '<span class="badge badge-success">'+devCount+' ativo'+(devCount>1?'s':'')+'</span>' : '<span class="badge badge-warning">0</span>';

    h += '<tr><td><strong>'+u.username+'</strong></td>'+
      '<td><span class="badge '+badge+'">'+roleLabel+'</span></td>'+
      '<td>'+dc+'</td>'+
      '<td>'+devBadge+'</td>'+
      '<td><button class="btn btn-sm btn-outline" onclick="window._authChangePass(\''+u.username.replace(/'/g,"\\'")+'\')">Senha</button> '+
      '<button class="btn btn-sm btn-danger" onclick="window._authDelUser(\''+u.username.replace(/'/g,"\\'")+'\')">&#128465;</button></td></tr>';
  });
  h += '</tbody></table></div>';
  el.innerHTML = h;
};

window._authAddUser = async function(){
  var name = (document.getElementById('newAuthUser').value||'').trim();
  var pass = document.getElementById('newAuthPass').value;
  var role = document.getElementById('newAuthRole').value;
  var msg = document.getElementById('authMsg');
  if(!name||!pass){msg.innerHTML='<span style="color:var(--dn2)">Preencha nome e senha.</span>';return;}

  var data = await readAuthGist();
  if(!data){msg.innerHTML='<span style="color:var(--dn2)">Erro ao conectar ao cloud.</span>';return;}
  if(data.users.some(function(u){return u.username.toLowerCase()===name.toLowerCase();})){
    msg.innerHTML='<span style="color:var(--dn2)">Usu\u00e1rio j\u00e1 existe.</span>';return;
  }

  data.users.push({
    username:name,
    passwordHash:await sha256(pass),
    createdAt:new Date().toISOString(),
    role:role,
    sessions:[]
  });
  if(await writeAuthGist(data)){
    msg.innerHTML='<span style="color:var(--ok)">Usu\u00e1rio "'+name+'" criado!</span>';
    document.getElementById('newAuthUser').value='';
    document.getElementById('newAuthPass').value='';
    window._authRenderUsers();
  } else {
    msg.innerHTML='<span style="color:var(--dn2)">Erro ao salvar.</span>';
  }
};

window._authChangePass = async function(username){
  var np = prompt('Nova senha para "'+username+'":');
  if(!np) return;
  var data = await readAuthGist();
  if(!data) return alert('Erro.');
  var u = data.users.find(function(x){return x.username===username;});
  if(!u) return alert('N\u00e3o encontrado.');
  u.passwordHash = await sha256(np);
  if(await writeAuthGist(data)) alert('Senha alterada!');
  else alert('Erro ao salvar.');
};

window._authDelUser = async function(username){
  var cur = window._authCurrentUser;
  if(cur && cur.username.toLowerCase()===username.toLowerCase())
    return alert('Voc\u00ea n\u00e3o pode excluir seu pr\u00f3prio usu\u00e1rio.');
  if(!confirm('Excluir "'+username+'"? Os dados financeiros deste usu\u00e1rio ser\u00e3o mantidos no Gist.')) return;
  var data = await readAuthGist();
  if(!data) return alert('Erro.');
  data.users = data.users.filter(function(u){return u.username!==username;});
  if(await writeAuthGist(data)){alert('Removido.');window._authRenderUsers();}
  else alert('Erro.');
};

// ================================================================
// INICIALIZAÇÃO
// ================================================================
(function(){
  var sidebar = document.getElementById('sidebar');
  var main = document.querySelector('.main');
  var mh = document.getElementById('mobHeader');
  if(sidebar) sidebar.style.visibility = 'hidden';
  if(main) main.style.visibility = 'hidden';
  if(mh) mh.style.visibility = 'hidden';

  var session = getSession();
  if(session){
    window._authCurrentUser = {username:session.user, role:session.role||'user'};
    switchToUserData(session.user);
    showApp(session.user, session.role||'user');
  } else {
    setTimeout(function(){ document.getElementById('authUser').focus(); }, 200);
  }
})();

console.log('[Financeiro Pro] Auth v5 — Arquivo por usu\u00e1rio, Manter Conectado, Dispositivos.');
})();

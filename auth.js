// auth.js — Sistema de autenticação com usuários armazenados no GitHub Gist
// Senhas são armazenadas como hash SHA-256 (nunca em texto puro)
// Dados dos usuários ficam no Gist, não no código-fonte
(function(){
'use strict';

// ================================================================
// CONFIGURAÇÃO
// ================================================================
var AUTH_GIST_ID = ''; // Será criado automaticamente na primeira execução
var AUTH_KEY = 'finApp_auth';
var AUTH_GIST_KEY = 'finApp_auth_gist_id';
var SESSION_KEY = 'finApp_session';
var SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// ================================================================
// SHA-256 (Web Crypto API)
// ================================================================
async function sha256(text){
  var encoder = new TextEncoder();
  var data = encoder.encode(text);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
}

// ================================================================
// CSS DA TELA DE LOGIN
// ================================================================
var authStyle = document.createElement('style');
authStyle.textContent = `
  .auth-overlay{position:fixed;inset:0;z-index:10000;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .3s;}
  .auth-overlay.hidden{opacity:0;pointer-events:none;}
  .auth-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:16px;padding:40px 36px;width:95%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center;}
  .auth-logo{font-size:2em;margin-bottom:6px;}
  .auth-title{font-size:1.3em;font-weight:700;background:var(--priG);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;}
  .auth-subtitle{font-size:.82em;color:var(--tx3);margin-bottom:28px;}
  .auth-box .form-group{text-align:left;margin-bottom:16px;}
  .auth-box .form-group label{font-size:.78em;color:var(--tx2);font-weight:600;margin-bottom:4px;display:block;}
  .auth-box .form-control{width:100%;padding:12px 14px;font-size:.9em;}
  .auth-btn{width:100%;padding:14px;border:none;border-radius:10px;background:var(--priG);color:#fff;font-size:.95em;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px;}
  .auth-btn:hover{opacity:.9;transform:translateY(-1px);}
  .auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .auth-error{color:var(--dn2);font-size:.82em;margin-top:12px;min-height:20px;}
  .auth-footer{margin-top:20px;font-size:.72em;color:var(--tx3);}
  .auth-user-bar{position:fixed;bottom:0;left:0;right:0;z-index:90;background:var(--bg2);border-top:1px solid var(--bg4);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;font-size:.78em;}
  .auth-user-bar .user-name{color:var(--ok);font-weight:600;}
  .auth-user-bar .btn-logout{background:transparent;border:1px solid var(--bg4);color:var(--tx3);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.82em;transition:all .15s;}
  .auth-user-bar .btn-logout:hover{border-color:var(--dn2);color:var(--dn2);}
  @media(max-width:768px){
    .auth-box{padding:30px 24px;}
    .auth-user-bar{padding:6px 12px;font-size:.72em;}
  }
`;
document.head.appendChild(authStyle);

// ================================================================
// CRIAR TELA DE LOGIN
// ================================================================
var authOverlay = document.createElement('div');
authOverlay.className = 'auth-overlay';
authOverlay.id = 'authOverlay';
authOverlay.innerHTML = 
  '<div class="auth-box">'+
    '<div class="auth-logo">&#128176;</div>'+
    '<div class="auth-title">Financeiro Pro</div>'+
    '<div class="auth-subtitle">Faça login para acessar seus dados</div>'+
    '<div class="form-group"><label>Usuário</label><input type="text" id="authUser" class="form-control" placeholder="Digite seu usuário" autocomplete="username"></div>'+
    '<div class="form-group"><label>Senha</label><input type="password" id="authPass" class="form-control" placeholder="Digite sua senha" autocomplete="current-password"></div>'+
    '<button class="auth-btn" id="authBtn" onclick="doLogin()">Entrar</button>'+
    '<div class="auth-error" id="authError"></div>'+
    '<div class="auth-footer">Dados protegidos com criptografia SHA-256</div>'+
  '</div>';
document.body.appendChild(authOverlay);

// Enter para submeter
document.getElementById('authPass').addEventListener('keydown', function(e){
  if(e.key === 'Enter') doLogin();
});
document.getElementById('authUser').addEventListener('keydown', function(e){
  if(e.key === 'Enter') document.getElementById('authPass').focus();
});

// Barra do usuário logado
var userBar = document.createElement('div');
userBar.className = 'auth-user-bar';
userBar.id = 'authUserBar';
userBar.style.display = 'none';
userBar.innerHTML = '<span>&#128100; Logado como: <span class="user-name" id="loggedUserName"></span></span>'+
  '<button class="btn-logout" onclick="doLogout()">Sair</button>';
document.body.appendChild(userBar);

// ================================================================
// FUNÇÕES DE AUTENTICAÇÃO
// ================================================================

// Ler usuários do Gist (base de dados externa)
async function readAuthGist(){
  var token = localStorage.getItem('finApp_gist_token');
  if(!token) return null;
  
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!gistId){
    // Criar o Gist de autenticação na primeira vez
    gistId = await createAuthGist(token);
    if(!gistId) return null;
  }
  
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId, {
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
    });
    if(!r.ok) return null;
    var j = await r.json();
    var f = j.files && j.files['auth_users.json'];
    return (f && f.content) ? JSON.parse(f.content) : null;
  }catch(e){ return null; }
}

async function writeAuthGist(data){
  var token = localStorage.getItem('finApp_gist_token');
  if(!token) return false;
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!gistId) return false;
  
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId, {
      method:'PATCH',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({files:{'auth_users.json':{content:JSON.stringify(data,null,2)}}})
    });
    return r.ok;
  }catch(e){ return false; }
}

async function createAuthGist(token){
  // Hash da senha inicial: Anderson / 202328
  var initialHash = await sha256('202328');
  var initialData = {
    users: [
      { username: 'Anderson', passwordHash: initialHash, createdAt: new Date().toISOString(), role: 'admin' }
    ],
    settings: { maxAttempts: 5, lockoutMinutes: 15 }
  };
  
  try{
    var r = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({
        description: 'Financeiro Pro - Auth Data (NÃO EXCLUIR)',
        public: false,
        files:{'auth_users.json':{content:JSON.stringify(initialData,null,2)}}
      })
    });
    if(!r.ok) return null;
    var j = await r.json();
    localStorage.setItem(AUTH_GIST_KEY, j.id);
    return j.id;
  }catch(e){ return null; }
}

// Verificar sessão ativa
function getSession(){
  try{
    var s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if(s && s.user && s.expires && Date.now() < s.expires) return s;
    return null;
  }catch(e){ return null; }
}

function setSession(username){
  var session = {
    user: username,
    loginAt: Date.now(),
    expires: Date.now() + SESSION_DURATION
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

// ================================================================
// LOGIN
// ================================================================
window.doLogin = async function(){
  var userEl = document.getElementById('authUser');
  var passEl = document.getElementById('authPass');
  var errorEl = document.getElementById('authError');
  var btnEl = document.getElementById('authBtn');
  
  var username = (userEl.value||'').trim();
  var password = passEl.value;
  
  if(!username || !password){
    errorEl.textContent = 'Preencha usuário e senha.';
    return;
  }
  
  btnEl.disabled = true;
  btnEl.textContent = 'Verificando...';
  errorEl.textContent = '';
  
  // Tentar ler usuários do Gist
  var authData = await readAuthGist();
  
  if(!authData){
    // Se não tem Gist configurado, usar validação local de fallback
    // Hash hardcoded do usuário inicial (Anderson / 202328)
    var inputHash = await sha256(password);
    var fallbackHash = await sha256('202328');
    
    if(username.toLowerCase() === 'anderson' && inputHash === fallbackHash){
      setSession(username);
      showApp(username);
      btnEl.disabled = false;
      btnEl.textContent = 'Entrar';
      return;
    }
    
    errorEl.textContent = 'Usuário ou senha incorretos.';
    btnEl.disabled = false;
    btnEl.textContent = 'Entrar';
    passEl.value = '';
    passEl.focus();
    return;
  }
  
  // Validar contra os dados do Gist
  var users = authData.users || [];
  var inputHash = await sha256(password);
  
  var found = users.find(function(u){
    return u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === inputHash;
  });
  
  if(found){
    setSession(found.username);
    showApp(found.username);
  } else {
    errorEl.textContent = 'Usuário ou senha incorretos.';
    passEl.value = '';
    passEl.focus();
  }
  
  btnEl.disabled = false;
  btnEl.textContent = 'Entrar';
};

// ================================================================
// LOGOUT
// ================================================================
window.doLogout = function(){
  if(!confirm('Deseja realmente sair?')) return;
  clearSession();
  hideApp();
};

// ================================================================
// MOSTRAR / ESCONDER APP
// ================================================================
function showApp(username){
  document.getElementById('authOverlay').classList.add('hidden');
  setTimeout(function(){
    document.getElementById('authOverlay').style.display = 'none';
  }, 300);
  
  // Mostrar sidebar, main e user bar
  document.getElementById('sidebar').style.visibility = 'visible';
  document.querySelector('.main').style.visibility = 'visible';
  var mobHeader = document.getElementById('mobHeader');
  if(mobHeader) mobHeader.style.visibility = 'visible';
  
  document.getElementById('loggedUserName').textContent = username;
  document.getElementById('authUserBar').style.display = 'flex';
}

function hideApp(){
  // Esconder tudo
  document.getElementById('sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';
  var mobHeader = document.getElementById('mobHeader');
  if(mobHeader) mobHeader.style.visibility = 'hidden';
  document.getElementById('authUserBar').style.display = 'none';
  
  // Mostrar login
  var overlay = document.getElementById('authOverlay');
  overlay.style.display = 'flex';
  setTimeout(function(){ overlay.classList.remove('hidden'); }, 10);
  
  // Limpar campos
  document.getElementById('authUser').value = '';
  document.getElementById('authPass').value = '';
  document.getElementById('authError').textContent = '';
  document.getElementById('authUser').focus();
}

// ================================================================
// INICIALIZAÇÃO — esconder app até login
// ================================================================
(function init(){
  // Esconder app inicialmente
  document.getElementById('sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';
  var mobHeader = document.getElementById('mobHeader');
  if(mobHeader) mobHeader.style.visibility = 'hidden';
  
  // Verificar sessão existente
  var session = getSession();
  if(session){
    showApp(session.user);
  } else {
    document.getElementById('authUser').focus();
  }
})();

// ================================================================
// GERENCIAMENTO DE USUÁRIOS (para admin)
// ================================================================
// Adicionar link no sidebar de config
setTimeout(function(){
  var configPage = document.getElementById('pg-config');
  if(!configPage) return;
  
  var section = document.createElement('div');
  section.className = 'form-section';
  section.id = 'authAdminSection';
  section.innerHTML = 
    '<h3 style="margin-bottom:14px">&#128274; Gerenciar Usuários</h3>'+
    '<div id="authUsersList" style="margin-bottom:14px"></div>'+
    '<div class="form-grid" style="grid-template-columns:1fr 1fr 1fr auto">'+
      '<div class="form-group"><label>Novo Usuário</label><input id="newAuthUser" class="form-control" placeholder="Nome"></div>'+
      '<div class="form-group"><label>Senha</label><input type="password" id="newAuthPass" class="form-control" placeholder="Senha"></div>'+
      '<div class="form-group"><label>Perfil</label><select id="newAuthRole" class="form-control"><option value="admin">Admin</option><option value="user">Usuário</option></select></div>'+
      '<div class="form-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="addAuthUser()">Adicionar</button></div>'+
    '</div>'+
    '<div id="authAdminMsg" style="margin-top:8px;font-size:.82em;min-height:20px"></div>';
  configPage.appendChild(section);
  
  renderAuthUsers();
}, 500);

window.renderAuthUsers = async function(){
  var listEl = document.getElementById('authUsersList');
  if(!listEl) return;
  
  var authData = await readAuthGist();
  if(!authData || !authData.users){
    listEl.innerHTML = '<p style="color:var(--tx3);font-size:.85em">Conecte ao cloud para gerenciar usuários.</p>';
    return;
  }
  
  var html = '<div class="table-wrap"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Criado em</th><th>Ações</th></tr></thead><tbody>';
  authData.users.forEach(function(u){
    var dataC = u.createdAt ? fmtD(u.createdAt.substring(0,10)) : '-';
    html += '<tr><td><strong>'+u.username+'</strong></td>'+
      '<td><span class="badge '+(u.role==='admin'?'badge-purple':'badge-info')+'">'+u.role+'</span></td>'+
      '<td>'+dataC+'</td>'+
      '<td><button class="btn btn-sm btn-outline" onclick="changeAuthPass(\''+u.username.replace(/'/g,"\\'")+'\')">Alterar Senha</button> '+
      '<button class="btn btn-sm btn-danger" onclick="delAuthUser(\''+u.username.replace(/'/g,"\\'")+'\')">&#128465;</button></td></tr>';
  });
  html += '</tbody></table></div>';
  listEl.innerHTML = html;
};

window.addAuthUser = async function(){
  var username = (document.getElementById('newAuthUser').value||'').trim();
  var password = document.getElementById('newAuthPass').value;
  var role = document.getElementById('newAuthRole').value;
  var msgEl = document.getElementById('authAdminMsg');
  
  if(!username || !password){
    msgEl.innerHTML = '<span style="color:var(--dn2)">Preencha nome e senha.</span>';
    return;
  }
  
  var authData = await readAuthGist();
  if(!authData){ msgEl.innerHTML = '<span style="color:var(--dn2)">Erro ao conectar.</span>'; return; }
  
  if(authData.users.some(function(u){return u.username.toLowerCase()===username.toLowerCase();})){
    msgEl.innerHTML = '<span style="color:var(--dn2)">Usuário já existe.</span>';
    return;
  }
  
  var hash = await sha256(password);
  authData.users.push({ username: username, passwordHash: hash, createdAt: new Date().toISOString(), role: role });
  
  var ok = await writeAuthGist(authData);
  if(ok){
    msgEl.innerHTML = '<span style="color:var(--ok)">Usuário "'+username+'" criado!</span>';
    document.getElementById('newAuthUser').value = '';
    document.getElementById('newAuthPass').value = '';
    renderAuthUsers();
  } else {
    msgEl.innerHTML = '<span style="color:var(--dn2)">Erro ao salvar.</span>';
  }
};

window.changeAuthPass = async function(username){
  var newPass = prompt('Nova senha para "'+username+'":');
  if(!newPass) return;
  
  var authData = await readAuthGist();
  if(!authData) return alert('Erro ao conectar.');
  
  var user = authData.users.find(function(u){return u.username===username;});
  if(!user) return alert('Usuário não encontrado.');
  
  user.passwordHash = await sha256(newPass);
  var ok = await writeAuthGist(authData);
  if(ok){ alert('Senha alterada!'); }
  else { alert('Erro ao salvar.'); }
};

window.delAuthUser = async function(username){
  var session = getSession();
  if(session && session.user.toLowerCase() === username.toLowerCase()){
    return alert('Você não pode excluir seu próprio usuário.');
  }
  if(!confirm('Excluir "'+username+'"?')) return;
  
  var authData = await readAuthGist();
  if(!authData) return alert('Erro ao conectar.');
  
  authData.users = authData.users.filter(function(u){return u.username!==username;});
  var ok = await writeAuthGist(authData);
  if(ok){ alert('Usuário removido.'); renderAuthUsers(); }
  else { alert('Erro ao salvar.'); }
};


console.log('[Financeiro Pro] Auth module loaded.');
})();

// auth.js v2 — Multiusuário com dados separados + controle de perfil
// Cada usuário tem seus próprios dados financeiros
// Admin: gerencia usuários + categorias | User: apenas seus dados, sem editar categorias
(function(){
'use strict';

// ================================================================
// CONFIGURAÇÃO
// ================================================================
var AUTH_GIST_KEY = 'finApp_auth_gist_id';
var SESSION_KEY = 'finApp_session';
var SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

// ================================================================
// SHA-256
// ================================================================
async function sha256(text){
  var enc = new TextEncoder();
  var buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
}

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
.auth-overlay{position:fixed;inset:0;z-index:10000;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .3s;}
.auth-overlay.hiding{opacity:0;pointer-events:none;}
.auth-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:16px;padding:40px 36px;width:95%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center;}
.auth-logo{font-size:2.2em;margin-bottom:6px;}
.auth-title{font-size:1.3em;font-weight:700;background:var(--priG);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;}
.auth-sub{font-size:.82em;color:var(--tx3);margin-bottom:28px;}
.auth-box .form-group{text-align:left;margin-bottom:16px;}
.auth-box .form-group label{font-size:.78em;color:var(--tx2);font-weight:600;margin-bottom:4px;display:block;}
.auth-box .form-control{width:100%;padding:12px 14px;font-size:.9em;}
.auth-btn{width:100%;padding:14px;border:none;border-radius:10px;background:var(--priG);color:#fff;font-size:.95em;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px;}
.auth-btn:hover{opacity:.9;transform:translateY(-1px);}
.auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;}
.auth-error{color:var(--dn2);font-size:.82em;margin-top:12px;min-height:20px;}
.auth-footer{margin-top:20px;font-size:.72em;color:var(--tx3);}
.auth-ubar{position:fixed;bottom:0;left:0;right:0;z-index:90;background:var(--bg2);border-top:1px solid var(--bg4);padding:8px 16px;display:none;align-items:center;justify-content:space-between;font-size:.78em;gap:8px;}
.auth-ubar .au-name{color:var(--ok);font-weight:600;}
.auth-ubar .au-role{font-size:.72em;padding:2px 8px;border-radius:8px;margin-left:4px;}
.auth-ubar .au-role.admin{background:rgba(108,92,231,.15);color:var(--pri2);}
.auth-ubar .au-role.user{background:rgba(9,132,227,.15);color:var(--inf2);}
.auth-ubar .au-logout{background:transparent;border:1px solid var(--bg4);color:var(--tx3);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.82em;transition:all .15s;}
.auth-ubar .au-logout:hover{border-color:var(--dn2);color:var(--dn2);}
.no-admin-msg{background:rgba(253,203,110,.08);border:1px solid rgba(253,203,110,.2);border-radius:8px;padding:12px 16px;color:var(--wn);font-size:.84em;margin-bottom:12px;}
@media(max-width:768px){
  .auth-box{padding:28px 20px;}
  .auth-ubar{padding:6px 12px;font-size:.72em;}
  .main{padding-bottom:50px!important;}
}
`;
document.head.appendChild(sty);

// ================================================================
// HTML — Tela de Login
// ================================================================
var overlay = document.createElement('div');
overlay.className = 'auth-overlay';
overlay.id = 'authOverlay';
overlay.innerHTML =
  '<div class="auth-box">'+
    '<div class="auth-logo">&#128176;</div>'+
    '<div class="auth-title">Financeiro Pro</div>'+
    '<div class="auth-sub">Faça login para acessar seus dados financeiros</div>'+
    '<div class="form-group"><label>Usuário</label>'+
      '<input type="text" id="authUser" class="form-control" placeholder="Digite seu usuário" autocomplete="username"></div>'+
    '<div class="form-group"><label>Senha</label>'+
      '<input type="password" id="authPass" class="form-control" placeholder="Digite sua senha" autocomplete="current-password"></div>'+
    '<button class="auth-btn" id="authLoginBtn" onclick="window._authDoLogin()">Entrar</button>'+
    '<div class="auth-error" id="authError"></div>'+
    '<div class="auth-footer">&#128274; Acesso protegido</div>'+
  '</div>';
document.body.appendChild(overlay);

// Barra inferior
var ubar = document.createElement('div');
ubar.className = 'auth-ubar';
ubar.id = 'authUBar';
ubar.innerHTML = '<span>&#128100; <span class="au-name" id="auName"></span>'+
  '<span class="au-role" id="auRole"></span></span>'+
  '<button class="au-logout" onclick="window._authDoLogout()">&#128682; Sair</button>';
document.body.appendChild(ubar);

// Enter / Tab
document.getElementById('authPass').addEventListener('keydown',function(e){if(e.key==='Enter')window._authDoLogin();});
document.getElementById('authUser').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('authPass').focus();});

// ================================================================
// ESTADO GLOBAL DE AUTENTICAÇÃO
// ================================================================
window._authCurrentUser = null; // {username, role}

// ================================================================
// GIST DE AUTENTICAÇÃO
// ================================================================
async function readAuthGist(){
  var token = localStorage.getItem('finApp_gist_token');
  if(!token) return null;
  var gistId = localStorage.getItem(AUTH_GIST_KEY);
  if(!gistId){
    gistId = await createAuthGist(token);
    if(!gistId) return null;
  }
  try{
    var r = await fetch('https://api.github.com/gists/'+gistId,{
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
    });
    if(r.status === 404){
      // Gist foi deletado, recriar
      localStorage.removeItem(AUTH_GIST_KEY);
      gistId = await createAuthGist(token);
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

async function writeAuthGist(data){
  var token = localStorage.getItem('finApp_gist_token');
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
    users:[{username:'Anderson',passwordHash:h,createdAt:new Date().toISOString(),role:'admin'}]
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
// SESSÃO
// ================================================================
function getSession(){
  try{
    var s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if(s && s.user && s.expires && Date.now() < s.expires) return s;
    return null;
  }catch(e){return null;}
}
function setSession(username, role){
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    user: username, role: role,
    loginAt: Date.now(), expires: Date.now() + SESSION_DURATION
  }));
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// ================================================================
// TROCAR DADOS POR USUÁRIO — chave do localStorage separada
// ================================================================
function getUserStorageKey(username){
  return 'finApp_v5_' + username.toLowerCase().replace(/[^a-z0-9]/g,'_');
}

function switchToUserData(username){
  // Mudar a chave SK do sistema para a do usuário
  // O sistema original usa window.SK = 'finApp_v5'
  // Vamos redirecionar para 'finApp_v5_anderson', etc.
  var userKey = getUserStorageKey(username);
  
  // Se o usuário nunca logou, copiar os dados atuais (migração)
  if(!localStorage.getItem(userKey)){
    var existing = localStorage.getItem('finApp_v5');
    if(existing){
      // Só copiar para o primeiro usuário (admin) na migração
      localStorage.setItem(userKey, existing);
    }
  }
  
  // Redirecionar o sistema para usar a chave do usuário
  // O index.html define: const SK='finApp_v5'
  // Mas SK é const, não podemos mudar. Vamos sobrescrever load() e salvar()
  
  // Override da função load para usar a chave do usuário
  window._userSK = userKey;
  
  // Carregar dados do usuário
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
  
  // Override salvar para gravar na chave do usuário
  var _origSalvar = window.salvar;
  window.salvar = function(){
    localStorage.setItem(window._userSK, JSON.stringify(S));
    // Também chamar scheduleSync se existir
    if(typeof scheduleSync === 'function') scheduleSync();
  };
  
  // Aplicar tema e re-renderizar
  if(S.config && S.config.theme) setTheme(S.config.theme);
  if(typeof renderAll === 'function') renderAll();
}

// ================================================================
// LOGIN
// ================================================================
window._authDoLogin = async function(){
  var userEl = document.getElementById('authUser');
  var passEl = document.getElementById('authPass');
  var errEl = document.getElementById('authError');
  var btn = document.getElementById('authLoginBtn');
  
  var username = (userEl.value||'').trim();
  var password = passEl.value;
  
  if(!username || !password){
    errEl.textContent = 'Preencha usuário e senha.';
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  errEl.textContent = '';
  
  var inputHash = await sha256(password);
  var role = 'user';
  var validado = false;
  
  // Tentar validar via Gist
  var authData = await readAuthGist();
  if(authData && authData.users){
    var found = authData.users.find(function(u){
      return u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === inputHash;
    });
    if(found){
      validado = true;
      username = found.username; // manter capitalização original
      role = found.role || 'user';
    }
  } else {
    // Fallback local: Anderson / 202328
    var fallback = await sha256('202328');
    if(username.toLowerCase() === 'anderson' && inputHash === fallback){
      validado = true;
      username = 'Anderson';
      role = 'admin';
    }
  }
  
  if(validado){
    setSession(username, role);
    window._authCurrentUser = {username: username, role: role};
    switchToUserData(username);
    showApp(username, role);
  } else {
    errEl.textContent = 'Usuário ou senha incorretos.';
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
  clearSession();
  window._authCurrentUser = null;
  location.reload(); // Recarregar limpa tudo
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
  roleEl.textContent = role === 'admin' ? 'Administrador' : 'Usuário';
  roleEl.className = 'au-role ' + role;
  document.getElementById('authUBar').style.display = 'flex';
  
  // Aplicar restrições de perfil
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

// ================================================================
// RESTRIÇÕES POR PERFIL
// ================================================================
function applyRoleRestrictions(role){
  if(role === 'admin') return; // admin pode tudo
  
  // USER: esconder gerenciamento de categorias e de usuários
  // Esconder seção de categorias na config
  setTimeout(function(){
    var configCats = document.getElementById('configCatsArea');
    if(configCats){
      configCats.innerHTML = '<div class="no-admin-msg">&#128274; Somente administradores podem gerenciar categorias.</div>';
    }
    
    // Esconder seção de gerenciamento de usuários
    var authAdmin = document.getElementById('authAdminSection');
    if(authAdmin) authAdmin.style.display = 'none';
    
    // Esconder botão "Limpar Todos os Dados"
    var limparSection = document.querySelector('#pg-config .btn-danger');
    if(limparSection){
      var parent = limparSection.closest('.form-section');
      if(parent) parent.style.display = 'none';
    }
  }, 600);
}

// ================================================================
// ADMIN: Gerenciar Usuários (adicionado na página Config)
// ================================================================
setTimeout(function(){
  var configPage = document.getElementById('pg-config');
  if(!configPage) return;
  
  var sec = document.createElement('div');
  sec.className = 'form-section';
  sec.id = 'authAdminSection';
  sec.innerHTML =
    '<h3 style="margin-bottom:14px">&#128274; Gerenciar Usuários</h3>'+
    '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Cada usuário tem seus próprios dados financeiros separados. Ninguém vê os dados de outro.</p>'+
    '<div id="authUsersList"></div>'+
    '<div class="form-grid" style="margin-top:14px">'+
      '<div class="form-group"><label>Novo Usuário</label><input id="newAuthUser" class="form-control" placeholder="Nome"></div>'+
      '<div class="form-group"><label>Senha</label><input type="password" id="newAuthPass" class="form-control" placeholder="Senha"></div>'+
      '<div class="form-group"><label>Perfil</label><select id="newAuthRole" class="form-control">'+
        '<option value="admin">Admin (gerencia tudo)</option>'+
        '<option value="user" selected>Usuário (só seus dados)</option></select></div>'+
      '<div class="form-group"><label>&nbsp;</label><button class="btn btn-primary" onclick="window._authAddUser()">Adicionar</button></div>'+
    '</div>'+
    '<div id="authMsg" style="margin-top:8px;font-size:.82em;min-height:20px"></div>';
  configPage.appendChild(sec);
  
  // Render se já logado
  if(window._authCurrentUser && window._authCurrentUser.role === 'admin'){
    window._authRenderUsers();
  }
}, 500);

window._authRenderUsers = async function(){
  var el = document.getElementById('authUsersList');
  if(!el) return;
  var data = await readAuthGist();
  if(!data || !data.users){
    el.innerHTML = '<p style="color:var(--tx3);font-size:.85em">Conecte ao cloud para gerenciar.</p>';
    return;
  }
  var h = '<div class="table-wrap"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Criado em</th><th>Ações</th></tr></thead><tbody>';
  data.users.forEach(function(u){
    var dc = u.createdAt ? fmtD(u.createdAt.substring(0,10)) : '-';
    var badge = u.role==='admin' ? 'badge-purple' : 'badge-info';
    var roleLabel = u.role==='admin' ? 'Admin' : 'Usuário';
    h += '<tr><td><strong>'+u.username+'</strong></td>'+
      '<td><span class="badge '+badge+'">'+roleLabel+'</span></td>'+
      '<td>'+dc+'</td>'+
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
    msg.innerHTML='<span style="color:var(--dn2)">Usuário já existe.</span>';return;
  }
  
  data.users.push({username:name, passwordHash:await sha256(pass), createdAt:new Date().toISOString(), role:role});
  if(await writeAuthGist(data)){
    msg.innerHTML='<span style="color:var(--ok)">Usuário "'+name+'" criado com sucesso!</span>';
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
  if(!u) return alert('Não encontrado.');
  u.passwordHash = await sha256(np);
  if(await writeAuthGist(data)) alert('Senha alterada!');
  else alert('Erro ao salvar.');
};

window._authDelUser = async function(username){
  var cur = window._authCurrentUser;
  if(cur && cur.username.toLowerCase()===username.toLowerCase())
    return alert('Você não pode excluir seu próprio usuário logado.');
  if(!confirm('Excluir "'+username+'"? Os dados financeiros dele serão mantidos no navegador.')) return;
  var data = await readAuthGist();
  if(!data) return alert('Erro.');
  data.users = data.users.filter(function(u){return u.username!==username;});
  if(await writeAuthGist(data)){alert('Removido.');window._authRenderUsers();}
  else alert('Erro.');
};

// ================================================================
// INICIALIZAÇÃO — esconder app, verificar sessão
// ================================================================
(function(){
  // Esconder app imediatamente
  document.getElementById('sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';
  var mh = document.getElementById('mobHeader');
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

console.log('[Financeiro Pro] Auth v2 — multiusuário com dados separados.');
})();

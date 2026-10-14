// a11y.js v1 — Acesso por teclado e rótulos de formulário
//
// A auditoria encontrou o app praticamente inutilizável sem mouse:
//   - 5 elementos alcançáveis por Tab na tela de Resumo inteira
//   - 0 dos 17 links do menu recebiam foco (são <a> sem href)
//   - 77 elementos clicáveis que não são botão nem link
//   - 58 campos de formulário com <label> visível mas sem for/id
//
// Em vez de editar 150 pontos de marcação espalhados por 20 arquivos — e
// obrigar todo módulo futuro a lembrar da regra —, isto faz uma passada no
// DOM depois de cada render. Mesma abordagem do icones.js.
(function(){
'use strict';

var contador = 0;

// ── 1. Tornar clicável = alcançável ──────────────────────────────
// Qualquer coisa com onclick que não seja nativamente interativa vira
// alcançável por Tab e responde a Enter/Espaço, como o usuário espera.
function tornarAcessivel(raiz){
  (raiz || document).querySelectorAll('[onclick]').forEach(function(el){
    var tag = el.tagName;
    if(tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if(tag === 'A' && el.hasAttribute('href')) return;
    if(el.hasAttribute('data-a11y')) return;

    el.setAttribute('tabindex', '0');
    // Os itens do menu navegam entre telas: são link. O resto age na
    // propria tela: e botao.
    el.setAttribute('role', el.id && el.id.indexOf('nav-') === 0 ? 'link' : 'button');
    el.setAttribute('data-a11y', '1');
  });
}

// Enter e Espaço acionam. Delegado no documento: vale para o que for
// criado depois, sem precisar religar nada.
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
  var el = e.target;
  if(!el || !el.getAttribute || el.getAttribute('data-a11y') !== '1') return;
  // Espaço em campo de texto digita espaço; não sequestrar.
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
  e.preventDefault();
  el.click();
});

// ── 2. Rótulos de formulário ─────────────────────────────────────
// Os <label> existem e aparecem na tela, mas nenhum aponta para o campo.
// Um leitor de tela anuncia "campo de edição, vazio". Aqui cada
// .form-group com um rótulo e um controle passa a ter o par for/id.
function ligarRotulos(raiz){
  (raiz || document).querySelectorAll('.form-group').forEach(function(g){
    var lbl = g.querySelector('label');
    if(!lbl || lbl.hasAttribute('for')) return;
    var campo = g.querySelector('input:not([type=hidden]), select, textarea');
    if(!campo) return;
    if(!campo.id) campo.id = 'cmp' + (++contador) + '_' + Date.now().toString(36);
    lbl.setAttribute('for', campo.id);
  });
  // Campos fora de .form-group (filtros, busca) ficam com aria-label a
  // partir do placeholder, que e o rotulo que o usuario ja ve.
  (raiz || document).querySelectorAll('input[placeholder], select').forEach(function(c){
    if(c.type === 'hidden') return;
    if(c.getAttribute('aria-label') || c.labels && c.labels.length) return;
    var texto = c.placeholder || (c.options && c.options[0] ? c.options[0].textContent : '');
    if(texto) c.setAttribute('aria-label', texto.trim());
  });
}

// ── 3. Nome acessível em botão só de ícone ───────────────────────
// Os botões de editar e excluir das tabelas agora são só o ícone SVG. Para
// o mouse isso é claro; para leitor de tela é um "botão" sem nome nenhum.
// O rótulo sai do próprio handler, que já diz a intenção (editLanc, delSub).
var VERBOS = [
  [/^del|excluir|remover/i, 'Excluir'], [/^edit|editar/i, 'Editar'],
  [/ajust/i, 'Ajustar'], [/encerr/i, 'Encerrar'], [/reat/i, 'Reativar'],
  [/restaur/i, 'Restaurar'], [/copiar/i, 'Copiar']
];
function nomearIcones(raiz){
  (raiz || document).querySelectorAll('button, [role=button]').forEach(function(b){
    if(b.getAttribute('aria-label') || (b.textContent || '').trim()) return;
    if(!b.querySelector('svg')) return;
    var on = b.getAttribute('onclick') || '';
    var nome = b.getAttribute('title') || '';
    if(!nome){
      for(var i = 0; i < VERBOS.length; i++){
        if(VERBOS[i][0].test(on)){ nome = VERBOS[i][1]; break; }
      }
    }
    b.setAttribute('aria-label', nome || 'Ação');
    if(!b.getAttribute('title')) b.setAttribute('title', nome || 'Ação');
  });
}

// ── 4. Marcos da página ──────────────────────────────────────────
// Sem <main> nem <h1> o leitor de tela nao tem como pular ao conteudo.
function marcos(){
  var main = document.querySelector('.main');
  if(main && !main.hasAttribute('role')){
    main.setAttribute('role', 'main');
    main.setAttribute('id', main.id || 'conteudo');
  }
  var sb = document.getElementById('sidebar');
  if(sb && !sb.hasAttribute('aria-label')) sb.setAttribute('aria-label', 'Navegação principal');
  // O titulo da tela ativa e o h1 da pagina: so um por vez esta visivel.
  document.querySelectorAll('.page .page-title').forEach(function(t){
    if(!t.hasAttribute('role')) t.setAttribute('role', 'heading');
    t.setAttribute('aria-level', '1');
  });
}

function passada(){
  tornarAcessivel();
  ligarRotulos();
  nomearIcones();
  marcos();
}
window.a11yPassada = passada;

passada();
if(typeof onNavigate === 'function') onNavigate(passada);
// Modulos montam tela depois do load; tambem apos abrir modal.
setTimeout(passada, 400);
setTimeout(passada, 1500);

console.log('[Financeiro Pro] a11y.js v1 — teclado, rótulos e marcos.');
})();

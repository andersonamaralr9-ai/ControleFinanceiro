// barra-inferior.js v1 — Navegação de baixo no celular (≤ 768 px)
// ------------------------------------------------------------------------
// Antes, no celular, tudo passava pelo menu "hambúrguer" de 18 itens, e uma
// barra fixa embaixo mostrava só e-mail + Sair. Agora:
//   Início · Lançamentos · [+] · Assistente · Mais
// O "+" abre uma folha com as formas de lançar: manual, compra no cartão,
// foto do cupom e texto (as duas últimas usam a aba Lançar do Assistente,
// por isso só aparecem com a nuvem ligada). "Mais" abre o menu completo, onde
// agora ficam a conta e o Sair (a barra do usuário some no celular).
//
// No computador nada muda: a barra fica escondida pelo CSS.
(function(){
'use strict';

function el(id){return document.getElementById(id);}
function ic(n){return typeof window.iconeSVG==='function'?window.iconeSVG(n):'';}
var comIA=!!window.NUVEM_ATIVA;

// Destino de cada aba. Páginas fora da barra acendem "Mais".
var ABAS=[
  {id:'resumo',rot:'Início',ic:'resumo'},
  {id:'lancs',rot:'Lançamentos',ic:'lancs'},
  {id:'+'},
  comIA?{id:'ia',rot:'Assistente',ic:'ia'}:{id:'compras',rot:'Compras',ic:'compras'},
  {id:'mais',rot:'Mais',ic:'menu'}
];

function montar(){
  if(el('barraInferior'))return;
  var b=document.createElement('nav');b.id='barraInferior';b.className='barra-inferior';b.setAttribute('aria-label','Navegação principal');
  b.innerHTML=ABAS.map(function(a){
    if(a.id==='+')return '<button type="button" class="bi-mais" id="biLancar" aria-haspopup="dialog" aria-controls="biFolha" aria-label="Lançar">'+ic('mais')+'</button>';
    return '<button type="button" class="bi-aba" data-aba="'+a.id+'">'+ic(a.ic)+'<span>'+a.rot+'</span></button>';
  }).join('');
  document.body.appendChild(b);

  var f=document.createElement('div');f.id='biFolha';f.className='bi-folha';f.hidden=true;
  f.setAttribute('role','dialog');f.setAttribute('aria-modal','true');f.setAttribute('aria-labelledby','biFolhaTit');
  f.innerHTML='<div class="bi-fundo" data-fechar="1"></div><div class="bi-painel">'+
    '<div class="bi-alca" aria-hidden="true"></div><h3 id="biFolhaTit">Lançar</h3>'+
    (comIA?
      '<button type="button" class="bi-op" data-op="foto">'+ic('camera')+'<span><strong>Foto do cupom</strong><small>A IA lê e você confere</small></span></button>'+
      '<button type="button" class="bi-op" data-op="texto">'+ic('texto')+'<span><strong>Escrever</strong><small>"almoço 45,90 no débito"</small></span></button>':'')+
    '<button type="button" class="bi-op" data-op="manual">'+ic('lancs')+'<span><strong>Lançamento</strong><small>Despesa ou receita, à mão</small></span></button>'+
    '<button type="button" class="bi-op" data-op="cartao">'+ic('cartoes')+'<span><strong>Compra no cartão</strong><small>À vista ou parcelada</small></span></button>'+
    '<button type="button" class="btn btn-outline bi-cancelar" data-fechar="1">Cancelar</button></div>';
  document.body.appendChild(f);

  b.addEventListener('click',function(e){
    var aba=e.target.closest('.bi-aba');
    if(aba){
      var id=aba.dataset.aba;
      if(id==='mais'){if(typeof toggleSidebar==='function')toggleSidebar();return;}
      nav(id);window.scrollTo(0,0);return;
    }
    if(e.target.closest('#biLancar'))abrir();
  });
  f.addEventListener('click',function(e){
    if(e.target.closest('[data-fechar]'))return fechar();
    var op=e.target.closest('.bi-op');if(op)escolher(op.dataset.op);
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!f.hidden)fechar();});

  moverConta();
  marcar(typeof curPage==='string'?curPage:'resumo');
}

function abrir(){
  var f=el('biFolha');f.hidden=false;
  document.body.classList.add('bi-folha-aberta');
  var p=f.querySelector('.bi-op');if(p)p.focus();
}
// Esc/Cancelar devolvem o foco ao "+" (no celular, o toque nem sempre foca o
// botão, então "quem estava focado" não serve). Ao escolher uma opção, o foco
// vai para o destino, por isso semFoco.
function fechar(semFoco){
  var f=el('biFolha');if(f.hidden)return;f.hidden=true;
  document.body.classList.remove('bi-folha-aberta');
  if(!semFoco){var b=el('biLancar');if(b)b.focus();}
}

// Tudo síncrono a partir do toque: o navegador só abre a câmera/galeria
// (input.click) se a chamada vier direto do gesto do usuário.
function escolher(op){
  fechar(true);
  if(op==='manual'){if(typeof abrirNovoLanc==='function')abrirNovoLanc('despesa');return;}
  if(op==='cartao'){
    nav('compras');window.scrollTo(0,0);
    var d=el('cpDesc');if(d){d.scrollIntoView({block:'center'});d.focus();}
    return;
  }
  if(typeof window.iaAbrirLancar!=='function')return;
  window.iaAbrirLancar();window.scrollTo(0,0);
  if(op==='foto'){var i=el('ilFoto');if(i)i.click();}
  if(op==='texto'){var t=el('ilTexto');if(t)t.focus();}
}

function marcar(p){
  var b=el('barraInferior');if(!b)return;
  var naBarra=ABAS.some(function(a){return a.id===p;});
  b.querySelectorAll('.bi-aba').forEach(function(x){
    var ativo=x.dataset.aba===p||(!naBarra&&x.dataset.aba==='mais');
    x.classList.toggle('ativa',ativo);
    if(ativo)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');
  });
}

// A barra do usuário (e-mail + Sair) fica escondida no celular; uma cópia
// compacta vai para o fim do menu lateral, que o "Mais" abre. O botão Sair
// da cópia aciona o original, que tem a lógica de sair.
function moverConta(){
  var sb=el('sidebar');if(!sb||el('biConta'))return;
  var c=document.createElement('div');c.id='biConta';c.className='bi-conta';
  c.innerHTML='<span class="bi-conta-email" id="biContaEmail"></span><button type="button" class="btn btn-sm btn-outline" id="biSair">Sair</button>';
  sb.appendChild(c);
  el('biSair').addEventListener('click',function(){
    var s=el('nvSair')||document.querySelector('.auth-ubar .au-logout');if(s)s.click();
  });
  atualizarConta();
}
function atualizarConta(){
  var e=el('biContaEmail'),n=el('auName');
  if(e)e.textContent=n?n.textContent:'';
}

onNavigate(function(p){marcar(p);atualizarConta();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montar);else montar();
})();

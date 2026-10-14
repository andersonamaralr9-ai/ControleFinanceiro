// icones.js v1 — Ícones de traço no lugar dos glifos Unicode do menu
//
// A barra lateral usava formas geométricas Unicode (▦ ↕ ▤ ☰ ▧ ▥ ▭ ⊞ ◎ ◫) mais
// dois emojis (🗑 ☁). A 18px elas viram retângulos quase idênticos: ocupam
// espaço sem ajudar a achar nada, e emoji não acompanha cor nem peso da
// tipografia, então destoava nos quatro visuais.
//
// Aqui cada destino recebe um SVG de traço com stroke="currentColor": o ícone
// herda a cor do próprio link. Isso resolve de vez o problema de contraste do
// item ativo — não importa qual regra de fundo vença a cascata, ícone e texto
// sempre têm a mesma cor.
//
// A troca é feita em JS, por id, porque Relatórios, Lixeira e Check de
// Pagamentos são criados pelos próprios módulos: assim uma página nova entra
// sem precisar editar marcação compartilhada.
(function(){
'use strict';

function svg(d){
  return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" ' +
    'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>';
}

var ICONES = {
  // painel
  resumo: svg('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'),
  // entra e sai
  lancs: svg('<path d="M7 20V5M7 5 4 8M7 5l3 3M17 4v15M17 19l-3-3M17 19l3-3"/>'),
  // documento
  contratos: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  // linhas
  extrato: svg('<path d="M4 7h16M4 12h16M4 17h9"/>'),
  // linhas + marcador
  extratocat: svg('<path d="M4 7h10M4 12h10M4 17h7"/><circle cx="18.5" cy="7" r="2"/>'),
  // balança
  balancete: svg('<path d="M12 4v16M6 20h12M4 8h16"/><path d="M7 8 4 14h6zM17 8l-3 6h6z"/>'),
  // conferido
  checkpag: svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  // cartão
  cartoes: svg('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>'),
  // sacola
  compras: svg('<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>'),
  // recorrência
  assinaturas: svg('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4"/>'),
  // alvo
  planejamento: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
  // em alta
  investimentos: svg('<path d="M4 17.5 10 11l3.5 3.5L20 7"/><path d="M15 7h5v5"/>'),
  // casa
  patrimonio: svg('<path d="m4 10.5 8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5.5h4V20"/>'),
  // barras
  relatorios: svg('<path d="M4 20h16"/><path d="M7.5 20v-6M12 20V6M16.5 20v-9"/>'),
  // controles
  config: svg('<path d="M4 8h10M18 8h2M4 16h3M11 16h9"/><circle cx="16" cy="8" r="2.2"/><circle cx="9" cy="16" r="2.2"/>'),
  // lixeira
  lixeira: svg('<path d="M4 7h16M9.5 7V5h5v2M6.5 7l.8 13h9.4l.8-13"/><path d="M10.5 11v5M13.5 11v5"/>'),
  // nuvem
  backup: svg('<path d="M7 18a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6 1.1A3.5 3.5 0 0 1 17 18z"/>'),
  // acoes (fora do menu)
  mais: svg('<path d="M12 5v14M5 12h14"/>'),
  // em baixa (contraponto de "investimentos", que e em alta)
  baixa: svg('<path d="M4 7.5 10 14l3.5-3.5L20 17"/><path d="M15 17h5v-5"/>'),
  // cifra
  dinheiro: svg('<path d="M12 3v18"/><path d="M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3"/>'),
  // calendario
  calendario: svg('<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  // alerta
  alerta: svg('<path d="M12 4.5 21 19.5H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>'),
  // veiculo
  veiculo: svg('<path d="M5 16.5h14M6.5 16.5v2M17.5 16.5v2"/><path d="M4.5 16.5v-4l2-4.5h11l2 4.5v4"/><circle cx="8" cy="13.5" r="1.1"/><circle cx="16" cy="13.5" r="1.1"/>'),
  // pendente
  relogio: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  // editar
  editar: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14.5 5.5 18.5 9.5"/>'),
  // copiar
  copiar: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  // caixa / outro
  caixa: svg('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>')
};

function aplicar(){
  var sb = document.getElementById('sidebar');
  if(!sb) return;
  sb.querySelectorAll('a[id^="nav-"]').forEach(function(a){
    var ic = a.querySelector('.nav-ic');
    if(!ic || ic.getAttribute('data-svg') === '1') return;   // ja trocado
    var chave = a.id.replace('nav-', '').toLowerCase();
    var d = ICONES[chave];
    if(!d) return;                                           // sem icone: mantem o glifo
    ic.innerHTML = d;
    ic.setAttribute('data-svg', '1');
  });
}

window.aplicarIcones = aplicar;
// Mesmo vocabulário de ícones para quem monta HTML fora do menu.
window.iconeSVG = function(nome){ return ICONES[nome] || ''; };

aplicar();
// Modulos criam links depois (Relatorios, Lixeira, Check de Pagamentos).
if(typeof onNavigate === 'function') onNavigate(aplicar);
setTimeout(aplicar, 400);
setTimeout(aplicar, 1500);

console.log('[Financeiro Pro] icones.js v1 — glifos do menu trocados por SVG de traço.');
})();

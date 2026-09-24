// design-packs.js v2 — 4 identidades visuais selecionáveis em Configurações.
// "atual" = tema Neobanco (sem CSS extra). Os demais sobrescrevem as
// variáveis do :root (index.html) e alguns componentes-chave.
// Exceção documentada no CLAUDE.md: este é o único módulo que injeta CSS.
(function(){
'use strict';

var PACK_KEY = 'finApp_pack_persist';

var DESIGN_PACKS = [
  { id:'atual',   nome:'Atual',   desc:'Neobanco: escuro com acento roxo. O visual que você usa hoje.', sw:['#14151d','#1e2029','#8b5cf6','#2fd480','#ff5c72'] },
  { id:'grafite', nome:'Grafite', desc:'Evolução do atual: escuro neutro, um único acento âmbar, números em mono.', sw:['#0b0c0e','#17181c','#ffb547','#5fd4a0','#ff7a6b'] },
  { id:'bruma',   nome:'Bruma',   desc:'Claro e suave, blocos arredondados, verde-petróleo como acento.', sw:['#eef0ec','#ffffff','#0f766e','#d6ebe4','#c25a26'] },
  { id:'noturno', nome:'Noturno', desc:'Azul-noite com filetes dourados e números em serifa. Sóbrio.', sw:['#0e1726','#142035','#d4b26a','#8cc4a4','#e39a88'] }
];
var IDS = DESIGN_PACKS.map(function(p){ return p.id; });
// ids antigos (v1) caem no visual atual
function normaliza(id){ return IDS.indexOf(id) >= 0 ? id : 'atual'; }

// ── Fontes (só as dos packs novos) ──
if(!document.getElementById('dp-fonts')){
  var lk = document.createElement('link');
  lk.id = 'dp-fonts'; lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Figtree:wght@400;500;600;700&display=swap';
  document.head.appendChild(lk);
}

// Base comum aos packs novos: sem gradientes, cores fixas do JS viram tokens.
function base(p){ return `
body.pack-${p} .r-hero-val,body.pack-${p} .rc6-val,body.pack-${p} .ih-val,body.pack-${p} .card-value{font-variant-numeric:tabular-nums}
body.pack-${p} [style*="#e65100"]{color:var(--wn)!important}
body.pack-${p} [style*="#e6510022"]{background:var(--bg3)!important}
body.pack-${p} .card::before{display:none!important}
body.pack-${p} .form-section:has(#themeGrid){opacity:.45;pointer-events:none}
body.pack-${p} .form-section:has(#themeGrid)::after{content:'Temas de cor valem só para o visual Atual.';display:block;font-size:.75em;color:var(--tx3);margin-top:8px}
`; }

var packCSS = {};

packCSS.grafite = base('grafite') + `
body.pack-grafite{
  --bg:#0b0c0e;--bg2:#111215;--bg3:#17181c;--bg4:#26272d;
  --tx:#ececef;--tx2:#c4c5cc;--tx3:#85868f;
  --pri:#ffb547;--pri2:#ffc56e;--priG:linear-gradient(#ffb547,#ffb547);
  --ok:#5fd4a0;--ok2:#7fe0b4;--okG:linear-gradient(#5fd4a0,#5fd4a0);
  --wn:#f2c14e;--wn2:#f5d07a;--wnG:linear-gradient(#f2c14e,#f2c14e);
  --dn:#ff7a6b;--dn2:#ff7a6b;--dnG:linear-gradient(#ff7a6b,#ff7a6b);
  --inf:#8ab4ff;--inf2:#a8c7ff;--rad:12px;--sh:none;
  font-family:'Geist',system-ui,sans-serif!important;background:#0b0c0e!important;
}
body.pack-grafite .r-hero-val,body.pack-grafite .rc6-val,body.pack-grafite .ih-val,body.pack-grafite .card-value,body.pack-grafite .rc-val,body.pack-grafite .rf-val,body.pack-grafite td{font-family:'Geist Mono',monospace!important;letter-spacing:-.02em}
body.pack-grafite .sidebar{background:#0b0c0e!important;border-right:1px solid #1e1f24!important}
body.pack-grafite .sidebar a.active{background:#ececef!important;color:#0b0c0e!important}
body.pack-grafite .sidebar a.active::before{display:none!important}
body.pack-grafite .r-hero{background:#17181c!important;border:1px solid #26272d!important;color:var(--tx)!important;box-shadow:none!important}
body.pack-grafite .r-hero-tag{background:#26272d!important;color:var(--tx)!important}
body.pack-grafite .rc6,body.pack-grafite .card,body.pack-grafite .chart-box,body.pack-grafite .ih-card,body.pack-grafite .sub-box,body.pack-grafite .table-wrap,body.pack-grafite .form-section,body.pack-grafite .cc-card{background:#111215!important;border:1px solid #1e1f24!important;box-shadow:none!important;border-image:none!important}
body.pack-grafite .btn-primary,body.pack-grafite .rq-btn.primary{background:#ffb547!important;color:#0b0c0e!important;box-shadow:none!important}
body.pack-grafite .bar.rec{background:#5fd4a0!important}
body.pack-grafite .bar.desp{background:#2e2f36!important}
body.pack-grafite .rc-bar-fill,body.pack-grafite .top-cat-fill{background:#ffb547!important}
body.pack-grafite .rc-ic,body.pack-grafite .rf-ic{background:#1e1f24!important}
body.pack-grafite .form-control{background:#17181c!important;border:1px solid #26272d!important}
body.pack-grafite .form-control:focus{border-color:#ffb547!important;box-shadow:0 0 0 3px rgba(255,181,71,.15)!important}
body.pack-grafite .modal-content{background:#111215!important;border:1px solid #26272d!important}
/* Pills "ativos" da tela de Investimentos usam var(--pri) de fundo com texto
   branco fixo. Com acento claro (ambar) o branco fica ilegivel — medido 1,76:1.
   Mesmo tratamento do .btn-primary deste pack: texto escuro sobre o acento. */
body.pack-grafite .ivt-btn.on,body.pack-grafite .inv-af-pill.on{color:#0b0c0e!important}
`;

packCSS.bruma = base('bruma') + `
body.pack-bruma{
  --bg:#eef0ec;--bg2:#ffffff;--bg3:#f4f5f2;--bg4:#e1e5df;
  --tx:#1d2320;--tx2:#4a524e;--tx3:#6a726d;
  --pri:#0f766e;--pri2:#0f766e;--priG:linear-gradient(#0f766e,#0f766e);
  --ok:#0f766e;--ok2:#128a80;--okG:linear-gradient(#0f766e,#0f766e);
  --wn:#b7791f;--wn2:#c98b2e;--wnG:linear-gradient(#b7791f,#b7791f);
  --dn:#c25a26;--dn2:#c25a26;--dnG:linear-gradient(#c25a26,#c25a26);
  --inf:#2563a8;--inf2:#2563a8;--rad:20px;--sh:none;
  font-family:'Hanken Grotesk',system-ui,sans-serif!important;background:#eef0ec!important;color:#1d2320!important;
}
body.pack-bruma .r-hero-val,body.pack-bruma .rc6-val,body.pack-bruma .ih-val,body.pack-bruma .card-value,body.pack-bruma .rc-val,body.pack-bruma .rf-val{font-family:'Spline Sans Mono',monospace!important;letter-spacing:-.02em}
body.pack-bruma .sidebar{background:#ffffff!important;border-right:none!important}
body.pack-bruma .sidebar a{border-radius:12px!important}
body.pack-bruma .sidebar a.active{background:#d6ebe4!important;color:#0f766e!important;font-weight:600}
body.pack-bruma .sidebar a.active::before{display:none!important}
body.pack-bruma .mobile-header,body.pack-bruma .auth-ubar{background:#ffffff!important;border-color:#e1e5df!important}
body.pack-bruma .r-hero{background:#1d2320!important;color:#fff!important;border:none!important;box-shadow:none!important}
body.pack-bruma .r-hero *{color:#fff}
body.pack-bruma .r-hero-tag{background:rgba(255,255,255,.12)!important}
body.pack-bruma .rc6,body.pack-bruma .card,body.pack-bruma .chart-box,body.pack-bruma .sub-box,body.pack-bruma .table-wrap,body.pack-bruma .form-section,body.pack-bruma .cc-card{background:#ffffff!important;border:none!important;box-shadow:none!important;border-image:none!important}
body.pack-bruma .ih-card{background:#d6ebe4!important;border:none!important;box-shadow:none!important}
body.pack-bruma .btn,body.pack-bruma .rq-btn{border-radius:999px!important}
body.pack-bruma .btn-primary,body.pack-bruma .rq-btn.primary{background:#0f766e!important;color:#fff!important;box-shadow:none!important}
body.pack-bruma .bar{border-radius:8px!important}
body.pack-bruma .bar.rec{background:#0f766e!important}
body.pack-bruma .bar.desp{background:#f2c3a8!important}
body.pack-bruma .rc-bar-fill,body.pack-bruma .top-cat-fill{background:#0f766e!important}
body.pack-bruma .rc-ic,body.pack-bruma .rf-ic{background:#eef0ec!important;border-radius:11px!important}
body.pack-bruma .form-control{background:#f4f5f2!important;border:1px solid #e1e5df!important;color:#1d2320!important;border-radius:12px!important}
body.pack-bruma .form-control:focus{border-color:#0f766e!important;box-shadow:0 0 0 3px rgba(15,118,110,.12)!important}
body.pack-bruma th{background:#f4f5f2!important;color:#6a726d!important}
body.pack-bruma td{border-bottom-color:#eef0ec!important}
body.pack-bruma .modal{background:rgba(29,35,32,.35)!important}
body.pack-bruma .modal-content{background:#fff!important;border:none!important;border-radius:24px!important}
/* Unico pack claro: cores cravadas no app.css/JS foram escolhidas para fundo
   escuro e ficam fracas aqui. Badge de categoria media 1,57:1 e o valor de
   categoria 2,77:1. O fundo tintado continua identificando a categoria; so o
   texto passa a ser escuro. */
body.pack-bruma .cat-badge{color:var(--tx)!important}
body.pack-bruma .rc-val{color:var(--tx)!important}
`;

packCSS.noturno = base('noturno') + `
body.pack-noturno{
  --bg:#0e1726;--bg2:#142035;--bg3:#1a2842;--bg4:#2a3850;
  --tx:#eae6dc;--tx2:#c3c8d2;--tx3:#8d97a8;
  --pri:#d4b26a;--pri2:#e2c689;--priG:linear-gradient(#d4b26a,#d4b26a);
  --ok:#8cc4a4;--ok2:#a5d4b9;--okG:linear-gradient(#8cc4a4,#8cc4a4);
  --wn:#e0b85c;--wn2:#e8c87c;--wnG:linear-gradient(#e0b85c,#e0b85c);
  --dn:#e39a88;--dn2:#e39a88;--dnG:linear-gradient(#e39a88,#e39a88);
  --inf:#9db8e0;--inf2:#b3c9ea;--rad:2px;--sh:none;
  font-family:'Figtree',system-ui,sans-serif!important;background:#0e1726!important;
}
body.pack-noturno .r-hero-val,body.pack-noturno .rc6-val,body.pack-noturno .ih-val,body.pack-noturno .card-value,body.pack-noturno .page-title{font-family:'Bodoni Moda',serif!important;font-weight:400!important;letter-spacing:0}
body.pack-noturno .rc6-lbl,body.pack-noturno .r-hero-lbl,body.pack-noturno .ih-lbl,body.pack-noturno .card-label,body.pack-noturno th{text-transform:uppercase;letter-spacing:.14em;font-size:.68em}
body.pack-noturno .sidebar{background:#0b1320!important;border-right:1px solid #2a3850!important}
body.pack-noturno .sidebar .logo{font-family:'Bodoni Moda',serif!important;font-style:italic;background:none!important;-webkit-text-fill-color:#eae6dc!important}
body.pack-noturno .sidebar a.active{background:transparent!important;color:#d4b26a!important;border-left:1px solid #d4b26a!important}
body.pack-noturno .sidebar a.active::before{display:none!important}
body.pack-noturno .r-hero{background:transparent!important;border:none!important;border-bottom:1px solid #d4b26a!important;box-shadow:none!important;color:var(--tx)!important}
body.pack-noturno .r-hero-tag{background:transparent!important;border:1px solid #d4b26a!important;color:#d4b26a!important}
body.pack-noturno .rc6{background:transparent!important;border:none!important;border-left:1px solid #d4b26a!important;box-shadow:none!important}
body.pack-noturno .card,body.pack-noturno .chart-box,body.pack-noturno .sub-box,body.pack-noturno .table-wrap,body.pack-noturno .form-section,body.pack-noturno .cc-card{background:#142035!important;border:1px solid #2a3850!important;box-shadow:none!important;border-image:none!important}
body.pack-noturno .ih-card{background:#121d31!important;border:1px solid #d4b26a!important;box-shadow:none!important}
body.pack-noturno .btn-primary,body.pack-noturno .rq-btn.primary{background:transparent!important;border:1px solid #d4b26a!important;color:#d4b26a!important;box-shadow:none!important;text-transform:uppercase;letter-spacing:.12em}
body.pack-noturno .bar{border-radius:0!important}
body.pack-noturno .bar.rec{background:#8cc4a4!important}
body.pack-noturno .bar.desp{background:#e39a88!important}
body.pack-noturno .rc-bar-fill,body.pack-noturno .top-cat-fill{background:#d4b26a!important}
body.pack-noturno .rc-ic,body.pack-noturno .rf-ic{background:transparent!important;border:1px solid #2a3850!important}
body.pack-noturno .form-control{background:#0e1726!important;border:1px solid #2a3850!important;border-radius:2px!important}
body.pack-noturno .form-control:focus{border-color:#d4b26a!important;box-shadow:none!important}
body.pack-noturno .modal-content{background:#142035!important;border:1px solid #d4b26a!important;border-radius:2px!important}
/* Mesmo caso do Grafite: acento dourado com texto branco fixo dava 2,02:1. */
body.pack-noturno .ivt-btn.on,body.pack-noturno .inv-af-pill.on{color:#0e1726!important}
`;

// ── Seletor (Configurações) ──
var selCSS = `
.dp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.dp-opt{border:2px solid var(--bg4);border-radius:14px;overflow:hidden;cursor:pointer;background:var(--bg2);position:relative;transition:border-color .15s}
.dp-opt:hover{border-color:var(--tx3)}
.dp-opt.sel{border-color:var(--pri)}
.dp-opt.sel::after{content:'\\2713';position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;background:var(--pri);color:var(--bg);display:flex;align-items:center;justify-content:center;font-size:.75em;font-weight:700}
.dp-sw{display:flex;height:56px}
.dp-sw span{flex:1}
.dp-info{padding:12px 14px}
.dp-name{font-weight:700;font-size:.9em;margin-bottom:4px}
.dp-desc{font-size:.74em;color:var(--tx3);line-height:1.4}
@media(max-width:768px){.dp-grid{grid-template-columns:1fr 1fr}}
`;

var styleEl = document.getElementById('design-pack-styles') || document.createElement('style');
styleEl.id = 'design-pack-styles';
styleEl.textContent = Object.keys(packCSS).map(function(k){ return packCSS[k]; }).join('\n') + selCSS;
if(!styleEl.parentNode) document.head.appendChild(styleEl);

// ── Aplicar ──
function aplica(id){
  id = normaliza(id);
  var keep = document.body.className.split(' ').filter(function(c){ return c && c.indexOf('pack-') !== 0; });
  if(id !== 'atual') keep.push('pack-' + id);
  document.body.className = keep.join(' ');
  var meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', { atual:'#14151d', grafite:'#0b0c0e', bruma:'#eef0ec', noturno:'#0e1726' }[id]);
  return id;
}

function setDesignPack(id){
  id = aplica(id);
  try { localStorage.setItem(PACK_KEY, id); } catch(e){}
  if(typeof S !== 'undefined' && S && S.config){
    S.config.designPack = id;
    if(typeof salvar === 'function') salvar();
  }
  if(typeof renderConfig === 'function') renderConfig();
}
window.setDesignPack = setDesignPack;

function packSalvo(){
  var id = null;
  try { id = localStorage.getItem(PACK_KEY); } catch(e){}
  if(!id && typeof S !== 'undefined' && S && S.config) id = S.config.designPack;
  return normaliza(id);
}

function renderPackSelector(){
  var pg = document.getElementById('pg-config');
  if(!pg) return;
  var old = document.getElementById('dpSection');
  if(old) old.remove();
  var cur = packSalvo();
  var sec = document.createElement('div');
  sec.className = 'form-section';
  sec.id = 'dpSection';
  var h = '<h3 style="margin-bottom:6px">Visual da interface</h3>';
  h += '<p style="font-size:.82em;color:var(--tx3);margin-bottom:14px">Muda cores, tipografia e formas do app inteiro. Fica salvo neste aparelho e na nuvem.</p><div class="dp-grid">';
  DESIGN_PACKS.forEach(function(p){
    h += '<div class="dp-opt' + (p.id === cur ? ' sel' : '') + '" onclick="setDesignPack(\'' + p.id + '\')">' +
      '<div class="dp-sw">' + p.sw.map(function(c){ return '<span style="background:' + c + '"></span>'; }).join('') + '</div>' +
      '<div class="dp-info"><div class="dp-name">' + p.nome + '</div><div class="dp-desc">' + p.desc + '</div></div></div>';
  });
  h += '</div>';
  sec.innerHTML = h;
  var tema = document.getElementById('themeGrid');
  var alvo = tema ? tema.closest('.form-section') : pg.querySelector('.form-section');
  if(alvo) alvo.parentNode.insertBefore(sec, alvo); else pg.appendChild(sec);
}

// Registro explícito (padrão do CLAUDE.md), sem embrulhar renderConfig/renderAll
if(typeof afterRender === 'function') afterRender('config', function(){ renderPackSelector(); });
if(typeof onNavigate === 'function') onNavigate(function(){ aplica(packSalvo()); });

// Aplica já no carregamento e de novo quando o login termina de trazer S
aplica(packSalvo());
var ov = document.getElementById('authOverlay');
if(ov) new MutationObserver(function(){
  if(ov.classList.contains('hiding')) setTimeout(function(){ aplica(packSalvo()); }, 300);
}).observe(ov, { attributes:true });

console.log('[Financeiro Pro] Design Packs v2 — Atual, Grafite, Bruma, Noturno.');
})();

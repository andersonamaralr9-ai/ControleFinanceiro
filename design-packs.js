// design-packs.js v1 — Design Packs: visuais que redesenham a interface inteira
// Cada pack aplica CSS que muda layout, formas, animações — não apenas cores.
// Pack "classic" = visual atual (nenhum CSS extra).
(function(){
'use strict';

// ================================================================
// PACKS DISPONÍVEIS
// ================================================================
var DESIGN_PACKS = [
  {
    id: 'classic',
    nome: 'Clássico',
    desc: 'Visual padrão do Financeiro Pro. Cards quadrados, sidebar sólida, layout tradicional.',
    icon: '🏛️',
    preview: 'linear-gradient(135deg, #1a1d27, #242836)'
  },
  {
    id: 'neon',
    nome: 'Neon',
    desc: 'Fundo ultra-escuro com acentos neon vibrantes, bordas brilhantes e efeito glow.',
    icon: '💜',
    preview: 'linear-gradient(135deg, #0a0a0f, #1a0a2e)'
  },
  {
    id: 'glass',
    nome: 'Glass',
    desc: 'Glassmorphism completo: elementos translúcidos com blur, bordas suaves e visual futurista.',
    icon: '🧊',
    preview: 'linear-gradient(135deg, #0d1117, #161b22)'
  },
  {
    id: 'minimal',
    nome: 'Minimal',
    desc: 'Ultra-limpo, sem bordas visíveis, muito espaço, tipografia grande. Visual de app bancário.',
    icon: '◻️',
    preview: 'linear-gradient(135deg, #fafbfc, #f0f2f5)'
  },
  {
    id: 'gradient',
    nome: 'Gradient',
    desc: 'Gradientes suaves em tudo: cards, sidebar, botões. Visual jovem tipo app fintech.',
    icon: '🌈',
    preview: 'linear-gradient(135deg, #1a1035, #0d1f3c)'
  }
];

// ================================================================
// CSS DE CADA PACK
// ================================================================

var packCSS = {};

// ── NEON ──
packCSS.neon = `
/* === PACK: NEON === */
body.pack-neon {
  --neon-pri: #b24dff;
  --neon-sec: #00fff2;
  --neon-pink: #ff2d95;
  --neon-glow: 0 0 12px rgba(178,77,255,.35);
  --neon-glow-sec: 0 0 12px rgba(0,255,242,.3);
  background: #050508 !important;
}

/* Sidebar — fundo ultra-escuro, borda neon */
body.pack-neon .sidebar {
  background: rgba(8,8,15,.97) !important;
  border-right: 1px solid rgba(178,77,255,.15) !important;
  box-shadow: 2px 0 30px rgba(178,77,255,.05);
}
body.pack-neon .sidebar .logo {
  background: linear-gradient(135deg, #b24dff, #00fff2) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none;
  filter: drop-shadow(0 0 20px rgba(178,77,255,.4));
  font-size: 1.5em !important;
  letter-spacing: 1px;
}
body.pack-neon .sidebar a {
  border-left: 3px solid transparent !important;
  border-radius: 0 !important;
  margin-right: 0 !important;
  transition: all .2s;
}
body.pack-neon .sidebar a:hover {
  background: rgba(178,77,255,.06) !important;
  border-left-color: var(--neon-pri) !important;
  color: #fff !important;
  text-shadow: 0 0 8px rgba(178,77,255,.5);
  transform: none !important;
}
body.pack-neon .sidebar a.active {
  background: rgba(178,77,255,.1) !important;
  border-left-color: var(--neon-pri) !important;
  color: #fff !important;
  text-shadow: 0 0 12px rgba(178,77,255,.6);
  box-shadow: inset 0 0 20px rgba(178,77,255,.05);
}
body.pack-neon .sidebar a.active::before { display: none !important; }
body.pack-neon .sidebar .group-label {
  color: rgba(178,77,255,.4) !important;
  letter-spacing: 4px !important;
}
body.pack-neon .sidebar .sep {
  background: rgba(178,77,255,.1) !important;
}
body.pack-neon .sidebar .sync-bar {
  background: rgba(178,77,255,.03) !important;
  border-top: 1px solid rgba(178,77,255,.1) !important;
}

/* Mobile header */
body.pack-neon .mobile-header {
  background: rgba(8,8,15,.95) !important;
  border-bottom: 1px solid rgba(178,77,255,.15) !important;
  backdrop-filter: blur(16px) !important;
}
body.pack-neon .mobile-header .mob-title {
  background: linear-gradient(135deg, #b24dff, #00fff2) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

/* Cards — borda neon glow */
body.pack-neon .card {
  background: rgba(12,12,20,.9) !important;
  border: 1px solid rgba(178,77,255,.12) !important;
  border-radius: 16px !important;
  box-shadow: 0 0 20px rgba(178,77,255,.04), inset 0 1px 0 rgba(178,77,255,.06) !important;
  transition: all .3s !important;
}
body.pack-neon .card::before {
  background: linear-gradient(90deg, #b24dff, #00fff2) !important;
  height: 2px !important;
  opacity: 0 !important;
}
body.pack-neon .card:hover {
  border-color: rgba(178,77,255,.3) !important;
  box-shadow: 0 0 30px rgba(178,77,255,.1), 0 8px 32px rgba(0,0,0,.4) !important;
  transform: translateY(-4px) !important;
}
body.pack-neon .card:hover::before { opacity: 1 !important; }
body.pack-neon .card .card-label {
  color: rgba(178,77,255,.5) !important;
  letter-spacing: 2px !important;
}
body.pack-neon .card .card-value.green { color: #00fff2 !important; text-shadow: 0 0 10px rgba(0,255,242,.3); }
body.pack-neon .card .card-value.red { color: #ff2d95 !important; text-shadow: 0 0 10px rgba(255,45,149,.3); }
body.pack-neon .card .card-value.blue { color: #4d9fff !important; text-shadow: 0 0 10px rgba(77,159,255,.3); }
body.pack-neon .card .card-value.purple { color: #b24dff !important; text-shadow: 0 0 10px rgba(178,77,255,.3); }

/* Page titles — neon underline */
body.pack-neon .page-title {
  border-image: linear-gradient(90deg, #b24dff, #00fff2, transparent) 1 !important;
  text-shadow: 0 0 30px rgba(178,77,255,.15);
}

/* Form sections */
body.pack-neon .form-section {
  background: rgba(12,12,20,.8) !important;
  border: 1px solid rgba(178,77,255,.08) !important;
  border-radius: 16px !important;
}
body.pack-neon .form-section:hover {
  border-color: rgba(178,77,255,.2) !important;
  box-shadow: 0 0 30px rgba(178,77,255,.05) !important;
}

/* Form controls */
body.pack-neon .form-control {
  background: rgba(20,20,35,.8) !important;
  border: 1px solid rgba(178,77,255,.1) !important;
  border-radius: 10px !important;
}
body.pack-neon .form-control:focus {
  border-color: var(--neon-pri) !important;
  box-shadow: 0 0 0 3px rgba(178,77,255,.15), 0 0 20px rgba(178,77,255,.1) !important;
}

/* Buttons */
body.pack-neon .btn-primary {
  background: linear-gradient(135deg, #b24dff, #8b2fc9) !important;
  box-shadow: 0 0 20px rgba(178,77,255,.2) !important;
}
body.pack-neon .btn-primary:hover {
  box-shadow: 0 0 30px rgba(178,77,255,.4), 0 4px 15px rgba(178,77,255,.3) !important;
}
body.pack-neon .btn-success {
  background: linear-gradient(135deg, #00d4aa, #00fff2) !important;
  box-shadow: 0 0 15px rgba(0,255,242,.15) !important;
}
body.pack-neon .btn-danger {
  background: linear-gradient(135deg, #ff2d95, #ff0066) !important;
  box-shadow: 0 0 15px rgba(255,45,149,.15) !important;
}
body.pack-neon .btn-outline {
  border-color: rgba(178,77,255,.2) !important;
  color: var(--neon-pri) !important;
}
body.pack-neon .btn-outline:hover {
  border-color: var(--neon-pri) !important;
  box-shadow: 0 0 15px rgba(178,77,255,.15) !important;
  background: rgba(178,77,255,.05) !important;
}

/* Tables */
body.pack-neon .table-wrap {
  background: rgba(12,12,20,.8) !important;
  border: 1px solid rgba(178,77,255,.08) !important;
  border-radius: 16px !important;
}
body.pack-neon th {
  background: rgba(178,77,255,.06) !important;
  color: rgba(178,77,255,.6) !important;
  letter-spacing: 2px !important;
}
body.pack-neon td { border-bottom-color: rgba(178,77,255,.05) !important; }
body.pack-neon tr:hover td { background: rgba(178,77,255,.03) !important; }

/* Chart boxes */
body.pack-neon .chart-box {
  background: rgba(12,12,20,.8) !important;
  border: 1px solid rgba(178,77,255,.08) !important;
  border-radius: 16px !important;
}
body.pack-neon .chart-box:hover {
  box-shadow: 0 0 30px rgba(178,77,255,.06) !important;
}
body.pack-neon .chart-box h3 { color: rgba(178,77,255,.5) !important; }
body.pack-neon .bar.rec { background: linear-gradient(180deg, #00fff2, #00b8a9) !important; box-shadow: 0 0 8px rgba(0,255,242,.2); }
body.pack-neon .bar.desp { background: linear-gradient(180deg, #ff2d95, #cc0066) !important; box-shadow: 0 0 8px rgba(255,45,149,.2); }
body.pack-neon .top-cat-fill { background: linear-gradient(90deg, #ff2d95, #b24dff) !important; }

/* Sub-boxes (contratos, assinaturas) */
body.pack-neon .sub-box {
  background: rgba(12,12,20,.8) !important;
  border: 1px solid rgba(178,77,255,.08) !important;
  border-radius: 16px !important;
}
body.pack-neon .sub-box:hover { border-color: rgba(178,77,255,.2) !important; box-shadow: 0 0 25px rgba(178,77,255,.06) !important; }
body.pack-neon .sub-box-header { background: rgba(178,77,255,.04) !important; }

/* CC cards */
body.pack-neon .cc-card {
  background: rgba(12,12,20,.8) !important;
  border: 1px solid rgba(178,77,255,.08) !important;
  border-top: 2px solid var(--neon-pri) !important;
  border-radius: 16px !important;
  border-image: none !important;
}

/* Badges */
body.pack-neon .badge { border-radius: 6px !important; letter-spacing: .5px !important; }
body.pack-neon .badge-success { background: rgba(0,255,242,.1) !important; color: #00fff2 !important; }
body.pack-neon .badge-danger { background: rgba(255,45,149,.1) !important; color: #ff2d95 !important; }
body.pack-neon .badge-info { background: rgba(77,159,255,.1) !important; color: #4d9fff !important; }
body.pack-neon .badge-purple { background: rgba(178,77,255,.1) !important; color: #b24dff !important; }
body.pack-neon .badge-warning { background: rgba(255,204,0,.1) !important; color: #ffcc00 !important; }

/* Modals */
body.pack-neon .modal-content {
  background: rgba(12,12,20,.95) !important;
  border: 1px solid rgba(178,77,255,.15) !important;
  box-shadow: 0 0 60px rgba(178,77,255,.1), 0 25px 80px rgba(0,0,0,.6) !important;
  border-radius: 20px !important;
}
body.pack-neon .modal-header { border-bottom-color: rgba(178,77,255,.1) !important; }

/* Month nav */
body.pack-neon .month-nav .btn:hover {
  background: rgba(178,77,255,.08) !important;
  border-color: var(--neon-pri) !important;
  box-shadow: 0 0 12px rgba(178,77,255,.15) !important;
}

/* Scrollbar */
body.pack-neon ::-webkit-scrollbar-thumb { background: rgba(178,77,255,.2) !important; }
body.pack-neon ::-webkit-scrollbar-thumb:hover { background: var(--neon-pri) !important; }

/* Auth bar */
body.pack-neon .auth-ubar {
  background: rgba(8,8,15,.95) !important;
  border-top: 1px solid rgba(178,77,255,.1) !important;
}
`;

// ── GLASS ──
packCSS.glass = `
/* === PACK: GLASS === */
body.pack-glass {
  background: #0d1117 !important;
}
body.pack-glass::before {
  content: '';
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 30% 20%, rgba(108,92,231,.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(0,206,201,.06) 0%, transparent 50%);
  z-index: -1;
  animation: glassShift 20s ease-in-out infinite;
}
@keyframes glassShift {
  0%,100% { transform: translate(0,0); }
  25% { transform: translate(2%,-2%); }
  50% { transform: translate(-1%,1%); }
  75% { transform: translate(1%,2%); }
}

/* Sidebar — translúcida */
body.pack-glass .sidebar {
  background: rgba(13,17,23,.7) !important;
  backdrop-filter: blur(20px) saturate(1.4) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.4) !important;
  border-right: 1px solid rgba(255,255,255,.06) !important;
}
body.pack-glass .sidebar .logo {
  background: linear-gradient(135deg, #a29bfe, #6c5ce7, #00cec9) !important;
  background-size: 200% 200% !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}
body.pack-glass .sidebar a {
  border-radius: 0 12px 12px 0 !important;
  border-left: 3px solid transparent !important;
}
body.pack-glass .sidebar a:hover {
  background: rgba(255,255,255,.04) !important;
  border-left-color: rgba(108,92,231,.5) !important;
  transform: none !important;
}
body.pack-glass .sidebar a.active {
  background: rgba(108,92,231,.08) !important;
  border-left-color: #6c5ce7 !important;
  backdrop-filter: blur(10px);
}
body.pack-glass .sidebar a.active::before { display: none !important; }
body.pack-glass .sidebar .sync-bar {
  background: rgba(255,255,255,.02) !important;
  border-top: 1px solid rgba(255,255,255,.05) !important;
}

/* Mobile header */
body.pack-glass .mobile-header {
  background: rgba(13,17,23,.6) !important;
  backdrop-filter: blur(20px) !important;
  border-bottom: 1px solid rgba(255,255,255,.06) !important;
}

/* Cards — glass effect */
body.pack-glass .card {
  background: rgba(22,27,34,.5) !important;
  backdrop-filter: blur(16px) saturate(1.2) !important;
  -webkit-backdrop-filter: blur(16px) saturate(1.2) !important;
  border: 1px solid rgba(255,255,255,.06) !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.05) !important;
}
body.pack-glass .card::before {
  background: linear-gradient(90deg, rgba(108,92,231,.3), rgba(0,206,201,.3)) !important;
  height: 2px !important;
  border-radius: 20px 20px 0 0 !important;
}
body.pack-glass .card:hover {
  background: rgba(22,27,34,.6) !important;
  border-color: rgba(255,255,255,.1) !important;
  box-shadow: 0 12px 40px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08) !important;
}

/* Page titles */
body.pack-glass .page-title {
  border-image: linear-gradient(90deg, rgba(108,92,231,.4), transparent) 1 !important;
}

/* Form sections — glass */
body.pack-glass .form-section {
  background: rgba(22,27,34,.4) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,.05) !important;
  border-radius: 20px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.04) !important;
}
body.pack-glass .form-section:hover {
  border-color: rgba(255,255,255,.08) !important;
}

/* Form controls */
body.pack-glass .form-control {
  background: rgba(30,36,44,.6) !important;
  border: 1px solid rgba(255,255,255,.06) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(8px) !important;
}
body.pack-glass .form-control:focus {
  border-color: rgba(108,92,231,.4) !important;
  box-shadow: 0 0 0 3px rgba(108,92,231,.1), 0 0 20px rgba(108,92,231,.05) !important;
}

/* Buttons */
body.pack-glass .btn-primary {
  background: rgba(108,92,231,.7) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(108,92,231,.3) !important;
  border-radius: 12px !important;
}
body.pack-glass .btn-primary:hover {
  background: rgba(108,92,231,.85) !important;
  box-shadow: 0 4px 20px rgba(108,92,231,.25) !important;
}
body.pack-glass .btn-outline {
  border-color: rgba(255,255,255,.1) !important;
  border-radius: 12px !important;
}
body.pack-glass .btn-outline:hover {
  background: rgba(255,255,255,.04) !important;
  border-color: rgba(108,92,231,.3) !important;
}

/* Tables */
body.pack-glass .table-wrap {
  background: rgba(22,27,34,.4) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,.05) !important;
  border-radius: 20px !important;
}
body.pack-glass th {
  background: rgba(255,255,255,.03) !important;
}
body.pack-glass td { border-bottom-color: rgba(255,255,255,.03) !important; }
body.pack-glass tr:hover td { background: rgba(255,255,255,.02) !important; }

/* Chart boxes */
body.pack-glass .chart-box {
  background: rgba(22,27,34,.4) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,.05) !important;
  border-radius: 20px !important;
}

/* Sub-boxes */
body.pack-glass .sub-box {
  background: rgba(22,27,34,.4) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,.05) !important;
  border-radius: 20px !important;
}
body.pack-glass .sub-box:hover { border-color: rgba(255,255,255,.1) !important; }
body.pack-glass .sub-box-header {
  background: rgba(255,255,255,.03) !important;
  border-radius: 20px 20px 0 0 !important;
}

/* CC cards */
body.pack-glass .cc-card {
  background: rgba(22,27,34,.4) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,.05) !important;
  border-top: 2px solid rgba(108,92,231,.4) !important;
  border-radius: 20px !important;
  border-image: none !important;
}

/* Modals */
body.pack-glass .modal-content {
  background: rgba(22,27,34,.8) !important;
  backdrop-filter: blur(24px) saturate(1.4) !important;
  border: 1px solid rgba(255,255,255,.08) !important;
  border-radius: 24px !important;
  box-shadow: 0 25px 80px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05) !important;
}

/* Badges — glass */
body.pack-glass .badge { border-radius: 8px !important; backdrop-filter: blur(6px) !important; }

/* Scrollbar */
body.pack-glass ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08) !important; }
body.pack-glass ::-webkit-scrollbar-thumb:hover { background: rgba(108,92,231,.4) !important; }

/* Auth bar */
body.pack-glass .auth-ubar {
  background: rgba(13,17,23,.6) !important;
  backdrop-filter: blur(20px) !important;
  border-top: 1px solid rgba(255,255,255,.05) !important;
}
`;

// ── MINIMAL ──
packCSS.minimal = `
/* === PACK: MINIMAL === */
body.pack-minimal {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  background: #f8f9fb !important;
  color: #1a1a2e !important;
}

/* Override CSS vars for light feel */
body.pack-minimal {
  --bg: #f8f9fb; --bg2: #ffffff; --bg3: #f0f2f5; --bg4: #e4e7ec;
  --tx: #1a1a2e; --tx2: #4a5568; --tx3: #a0aec0;
  --sh: 0 1px 3px rgba(0,0,0,.04);
}

/* Sidebar — limpa, sem borda pesada */
body.pack-minimal .sidebar {
  background: #ffffff !important;
  border-right: none !important;
  box-shadow: 1px 0 0 #e4e7ec !important;
  width: 240px !important;
}
body.pack-minimal .sidebar .logo {
  font-size: 1.2em !important;
  font-weight: 800 !important;
  background: none !important;
  -webkit-text-fill-color: #1a1a2e !important;
  letter-spacing: -.5px !important;
  padding: 32px 24px 24px !important;
}
body.pack-minimal .sidebar .group-label {
  font-size: .6em !important;
  color: #a0aec0 !important;
  letter-spacing: 3px !important;
  padding: 20px 24px 6px !important;
}
body.pack-minimal .sidebar .sep { background: #f0f2f5 !important; margin: 4px 20px !important; }
body.pack-minimal .sidebar a {
  padding: 10px 24px !important;
  color: #4a5568 !important;
  border-left: none !important;
  border-radius: 8px !important;
  margin: 1px 12px !important;
  font-size: .85em !important;
  font-weight: 500 !important;
}
body.pack-minimal .sidebar a:hover {
  background: #f7f8fa !important;
  color: #1a1a2e !important;
  border-left-color: transparent !important;
  transform: none !important;
}
body.pack-minimal .sidebar a.active {
  background: #f0f2ff !important;
  color: #4f46e5 !important;
  font-weight: 600 !important;
  border-left-color: transparent !important;
}
body.pack-minimal .sidebar a.active::before { display: none !important; }
body.pack-minimal .sidebar .sync-bar {
  background: transparent !important;
  border-top: 1px solid #f0f2f5 !important;
}

body.pack-minimal .main { margin-left: 240px !important; padding: 40px !important; }

/* Mobile header */
body.pack-minimal .mobile-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e4e7ec !important;
  backdrop-filter: none !important;
}
body.pack-minimal .mobile-header .mob-title {
  background: none !important;
  -webkit-text-fill-color: #1a1a2e !important;
  font-weight: 800 !important;
}
body.pack-minimal .mobile-header .hamburger { color: #1a1a2e !important; }

/* Cards — clean, no shadow, subtle border */
body.pack-minimal .card {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 14px !important;
  box-shadow: none !important;
  padding: 24px !important;
}
body.pack-minimal .card::before { display: none !important; }
body.pack-minimal .card:hover {
  border-color: #d0d5dd !important;
  box-shadow: 0 2px 8px rgba(0,0,0,.04) !important;
  transform: translateY(-2px) !important;
}
body.pack-minimal .card .card-label {
  color: #a0aec0 !important;
  font-size: .68em !important;
  letter-spacing: 1.5px !important;
}
body.pack-minimal .card .card-value { font-size: 1.5em !important; font-weight: 800 !important; }
body.pack-minimal .card .card-value.green { color: #059669 !important; }
body.pack-minimal .card .card-value.red { color: #dc2626 !important; }
body.pack-minimal .card .card-value.blue { color: #2563eb !important; }
body.pack-minimal .card .card-value.purple { color: #7c3aed !important; }

/* Page title — large, no underline */
body.pack-minimal .page-title {
  font-size: 1.8em !important;
  font-weight: 800 !important;
  border: none !important;
  border-image: none !important;
  padding-bottom: 8px !important;
  margin-bottom: 28px !important;
  color: #1a1a2e !important;
  letter-spacing: -.5px !important;
}

/* Form sections — clean */
body.pack-minimal .form-section {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 14px !important;
  box-shadow: none !important;
  padding: 28px !important;
}
body.pack-minimal .form-section:hover {
  border-color: #d0d5dd !important;
  box-shadow: none !important;
}

/* Form controls */
body.pack-minimal .form-control {
  background: #f8f9fb !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 10px !important;
  color: #1a1a2e !important;
  font-size: .88em !important;
}
body.pack-minimal .form-control:focus {
  border-color: #4f46e5 !important;
  box-shadow: 0 0 0 3px rgba(79,70,229,.1) !important;
  background: #fff !important;
}

/* Buttons */
body.pack-minimal .btn {
  border-radius: 10px !important;
  font-weight: 600 !important;
}
body.pack-minimal .btn-primary {
  background: #4f46e5 !important;
  box-shadow: none !important;
}
body.pack-minimal .btn-primary:hover {
  background: #4338ca !important;
  box-shadow: 0 2px 8px rgba(79,70,229,.2) !important;
}
body.pack-minimal .btn-success { background: #059669 !important; }
body.pack-minimal .btn-danger { background: #dc2626 !important; }
body.pack-minimal .btn-warning { background: #d97706 !important; color: #fff !important; }
body.pack-minimal .btn-outline {
  border-color: #e4e7ec !important;
  color: #4a5568 !important;
}
body.pack-minimal .btn-outline:hover {
  border-color: #4f46e5 !important;
  color: #4f46e5 !important;
  background: transparent !important;
}

/* Tables */
body.pack-minimal .table-wrap {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}
body.pack-minimal th {
  background: #f8f9fb !important;
  color: #a0aec0 !important;
  font-weight: 600 !important;
}
body.pack-minimal td {
  border-bottom: 1px solid #f0f2f5 !important;
  color: #1a1a2e !important;
}
body.pack-minimal tr:hover td { background: #f8f9fb !important; }

/* Chart boxes */
body.pack-minimal .chart-box {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}
body.pack-minimal .chart-box h3 { color: #a0aec0 !important; }
body.pack-minimal .bar.rec { background: linear-gradient(180deg, #059669, #34d399) !important; }
body.pack-minimal .bar.desp { background: linear-gradient(180deg, #dc2626, #f87171) !important; }
body.pack-minimal .top-cat-fill { background: linear-gradient(90deg, #dc2626, #f87171) !important; }
body.pack-minimal .top-cat-bar { background: #f0f2f5 !important; }

/* Sub-boxes */
body.pack-minimal .sub-box {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}
body.pack-minimal .sub-box:hover { box-shadow: 0 2px 8px rgba(0,0,0,.04) !important; }
body.pack-minimal .sub-box-header { background: #f8f9fb !important; border-radius: 14px 14px 0 0 !important; }

/* CC cards */
body.pack-minimal .cc-card {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-top: 3px solid #4f46e5 !important;
  border-radius: 14px !important;
  border-image: none !important;
  box-shadow: none !important;
}

/* Badges */
body.pack-minimal .badge { border-radius: 6px !important; font-weight: 600 !important; }
body.pack-minimal .badge-success { background: rgba(5,150,105,.08) !important; color: #059669 !important; }
body.pack-minimal .badge-danger { background: rgba(220,38,38,.08) !important; color: #dc2626 !important; }
body.pack-minimal .badge-info { background: rgba(37,99,235,.08) !important; color: #2563eb !important; }
body.pack-minimal .badge-purple { background: rgba(124,58,237,.08) !important; color: #7c3aed !important; }

/* Modals */
body.pack-minimal .modal { background: rgba(0,0,0,.3) !important; backdrop-filter: blur(4px) !important; }
body.pack-minimal .modal-content {
  background: #ffffff !important;
  border: 1px solid #e4e7ec !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 60px rgba(0,0,0,.12) !important;
}
body.pack-minimal .modal-header { border-bottom: 1px solid #f0f2f5 !important; }
body.pack-minimal .modal-header h3 { color: #1a1a2e !important; }
body.pack-minimal .modal-close { color: #a0aec0 !important; }
body.pack-minimal .modal-close:hover { color: #dc2626 !important; }

/* Scrollbar */
body.pack-minimal ::-webkit-scrollbar-thumb { background: #d0d5dd !important; }
body.pack-minimal ::-webkit-scrollbar-thumb:hover { background: #4f46e5 !important; }

/* Auth bar */
body.pack-minimal .auth-ubar {
  background: rgba(255,255,255,.95) !important;
  border-top: 1px solid #e4e7ec !important;
  backdrop-filter: blur(12px) !important;
}
body.pack-minimal .auth-ubar .au-name { color: #1a1a2e !important; }
body.pack-minimal .auth-ubar .au-logout { border-color: #e4e7ec !important; color: #4a5568 !important; }
body.pack-minimal .auth-ubar .au-logout:hover { border-color: #dc2626 !important; color: #dc2626 !important; }

/* Labels and text overrides */
body.pack-minimal .form-group label { color: #4a5568 !important; }
body.pack-minimal .sub-valor { color: #4f46e5 !important; }
body.pack-minimal .card-label { color: #a0aec0 !important; }

@media(max-width:768px){
  body.pack-minimal .main { padding: 70px 16px 24px !important; margin-left: 0 !important; }
  body.pack-minimal .sidebar { width: 260px !important; }
}
`;

// ── GRADIENT ──
packCSS.gradient = `
/* === PACK: GRADIENT === */
body.pack-gradient {
  background: linear-gradient(135deg, #0f0c29 0%, #1a1035 30%, #24243e 60%, #0f0c29 100%) !important;
  background-attachment: fixed !important;
}

/* Sidebar — gradient background */
body.pack-gradient .sidebar {
  background: linear-gradient(180deg, rgba(26,16,53,.95), rgba(15,12,41,.98)) !important;
  border-right: 1px solid rgba(162,155,254,.08) !important;
}
body.pack-gradient .sidebar .logo {
  background: linear-gradient(135deg, #f093fb, #f5576c, #4facfe) !important;
  background-size: 300% 300% !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  animation: gradShift 6s ease infinite !important;
  font-size: 1.5em !important;
}
@keyframes gradShift {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
body.pack-gradient .sidebar a {
  border-left: 3px solid transparent !important;
  border-radius: 0 12px 12px 0 !important;
  margin-right: 8px !important;
}
body.pack-gradient .sidebar a:hover {
  background: linear-gradient(90deg, rgba(240,147,251,.06), transparent) !important;
  border-left-color: #f093fb !important;
  transform: none !important;
}
body.pack-gradient .sidebar a.active {
  background: linear-gradient(90deg, rgba(240,147,251,.12), rgba(79,172,254,.05)) !important;
  border-left-color: #f093fb !important;
}
body.pack-gradient .sidebar a.active::before { display: none !important; }
body.pack-gradient .sidebar .group-label { color: rgba(240,147,251,.35) !important; }
body.pack-gradient .sidebar .sep { background: rgba(162,155,254,.06) !important; }
body.pack-gradient .sidebar .sync-bar {
  background: rgba(240,147,251,.02) !important;
  border-top: 1px solid rgba(162,155,254,.06) !important;
}

/* Mobile header */
body.pack-gradient .mobile-header {
  background: linear-gradient(90deg, rgba(15,12,41,.95), rgba(26,16,53,.95)) !important;
  border-bottom: 1px solid rgba(240,147,251,.1) !important;
  backdrop-filter: blur(16px) !important;
}
body.pack-gradient .mobile-header .mob-title {
  background: linear-gradient(135deg, #f093fb, #4facfe) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

/* Cards — gradient borders and backgrounds */
body.pack-gradient .card {
  background: linear-gradient(135deg, rgba(26,16,53,.7), rgba(36,36,62,.7)) !important;
  border: 1px solid rgba(240,147,251,.08) !important;
  border-radius: 18px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,.15) !important;
  position: relative !important;
  overflow: hidden !important;
}
body.pack-gradient .card::before {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 3px !important;
  background: linear-gradient(90deg, #f093fb, #f5576c, #4facfe) !important;
  opacity: .6 !important;
}
body.pack-gradient .card:hover {
  border-color: rgba(240,147,251,.2) !important;
  box-shadow: 0 8px 30px rgba(240,147,251,.08) !important;
}
body.pack-gradient .card:hover::before { opacity: 1 !important; }
body.pack-gradient .card .card-value.green { color: #55efc4 !important; }
body.pack-gradient .card .card-value.red { color: #f5576c !important; }
body.pack-gradient .card .card-value.blue { color: #4facfe !important; }
body.pack-gradient .card .card-value.purple { color: #f093fb !important; }

/* Page titles */
body.pack-gradient .page-title {
  border-image: linear-gradient(90deg, #f093fb, #4facfe, transparent) 1 !important;
}

/* Form sections */
body.pack-gradient .form-section {
  background: linear-gradient(135deg, rgba(26,16,53,.6), rgba(36,36,62,.6)) !important;
  border: 1px solid rgba(240,147,251,.06) !important;
  border-radius: 18px !important;
}
body.pack-gradient .form-section:hover {
  border-color: rgba(240,147,251,.12) !important;
}

/* Form controls */
body.pack-gradient .form-control {
  background: rgba(36,36,62,.7) !important;
  border: 1px solid rgba(240,147,251,.08) !important;
  border-radius: 12px !important;
}
body.pack-gradient .form-control:focus {
  border-color: #f093fb !important;
  box-shadow: 0 0 0 3px rgba(240,147,251,.12) !important;
}

/* Buttons */
body.pack-gradient .btn-primary {
  background: linear-gradient(135deg, #f093fb, #f5576c) !important;
}
body.pack-gradient .btn-primary:hover {
  box-shadow: 0 4px 20px rgba(240,147,251,.3) !important;
}
body.pack-gradient .btn-success { background: linear-gradient(135deg, #00b894, #55efc4) !important; }
body.pack-gradient .btn-danger { background: linear-gradient(135deg, #f5576c, #ff3838) !important; }
body.pack-gradient .btn-outline {
  border-color: rgba(240,147,251,.15) !important;
  color: #f093fb !important;
}
body.pack-gradient .btn-outline:hover {
  border-color: #f093fb !important;
  background: rgba(240,147,251,.06) !important;
}

/* Tables */
body.pack-gradient .table-wrap {
  background: linear-gradient(135deg, rgba(26,16,53,.6), rgba(36,36,62,.6)) !important;
  border: 1px solid rgba(240,147,251,.06) !important;
  border-radius: 18px !important;
}
body.pack-gradient th { background: rgba(240,147,251,.04) !important; color: rgba(240,147,251,.5) !important; }
body.pack-gradient td { border-bottom-color: rgba(240,147,251,.04) !important; }

/* Chart boxes */
body.pack-gradient .chart-box {
  background: linear-gradient(135deg, rgba(26,16,53,.6), rgba(36,36,62,.6)) !important;
  border: 1px solid rgba(240,147,251,.06) !important;
  border-radius: 18px !important;
}
body.pack-gradient .bar.rec { background: linear-gradient(180deg, #55efc4, #00b894) !important; }
body.pack-gradient .bar.desp { background: linear-gradient(180deg, #f5576c, #ff3838) !important; }
body.pack-gradient .top-cat-fill { background: linear-gradient(90deg, #f5576c, #f093fb) !important; }

/* Sub-boxes */
body.pack-gradient .sub-box {
  background: linear-gradient(135deg, rgba(26,16,53,.6), rgba(36,36,62,.6)) !important;
  border: 1px solid rgba(240,147,251,.06) !important;
  border-radius: 18px !important;
}
body.pack-gradient .sub-box:hover { border-color: rgba(240,147,251,.15) !important; }
body.pack-gradient .sub-box-header { background: rgba(240,147,251,.03) !important; border-radius: 18px 18px 0 0 !important; }

/* CC cards */
body.pack-gradient .cc-card {
  background: linear-gradient(135deg, rgba(26,16,53,.6), rgba(36,36,62,.6)) !important;
  border: 1px solid rgba(240,147,251,.06) !important;
  border-top: 3px solid transparent !important;
  border-image: linear-gradient(90deg, #f093fb, #4facfe) 1 !important;
  border-image-slice: 1 !important;
  border-radius: 18px !important;
}

/* Modals */
body.pack-gradient .modal-content {
  background: linear-gradient(135deg, rgba(26,16,53,.95), rgba(36,36,62,.95)) !important;
  border: 1px solid rgba(240,147,251,.1) !important;
  border-radius: 22px !important;
}

/* Badges */
body.pack-gradient .badge-success { background: rgba(85,239,196,.1) !important; color: #55efc4 !important; }
body.pack-gradient .badge-danger { background: rgba(245,87,108,.1) !important; color: #f5576c !important; }
body.pack-gradient .badge-purple { background: rgba(240,147,251,.1) !important; color: #f093fb !important; }

/* Scrollbar */
body.pack-gradient ::-webkit-scrollbar-thumb { background: rgba(240,147,251,.15) !important; }
body.pack-gradient ::-webkit-scrollbar-thumb:hover { background: #f093fb !important; }

/* Auth bar */
body.pack-gradient .auth-ubar {
  background: linear-gradient(90deg, rgba(15,12,41,.95), rgba(26,16,53,.95)) !important;
  border-top: 1px solid rgba(240,147,251,.08) !important;
}
`;

// ================================================================
// INJETAR CSS
// ================================================================
var styleEl = document.createElement('style');
styleEl.id = 'design-pack-styles';
var allCSS = Object.keys(packCSS).map(function(k){ return packCSS[k]; }).join('\n');

// Adicionar CSS do seletor de packs
allCSS += `
/* === DESIGN PACK SELECTOR === */
.dp-section{margin-bottom:24px;}
.dp-section h3{margin-bottom:6px;}
.dp-section .dp-sub{font-size:.82em;color:var(--tx3);margin-bottom:16px;}
.dp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
.dp-opt{padding:0;border-radius:16px;cursor:pointer;border:2px solid var(--bg4);transition:all .25s;overflow:hidden;position:relative;background:var(--bg2);}
.dp-opt:hover{border-color:var(--pri);transform:scale(1.02);}
.dp-opt.sel{border-color:var(--pri);box-shadow:0 0 20px rgba(108,92,231,.15);}
.dp-opt.sel::after{content:'\\2713';position:absolute;top:10px;right:12px;background:var(--pri);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75em;font-weight:700;}
.dp-preview{height:80px;display:flex;align-items:center;justify-content:center;font-size:2em;border-radius:14px 14px 0 0;}
.dp-info{padding:14px 16px;}
.dp-name{font-weight:700;font-size:.9em;margin-bottom:4px;}
.dp-desc{font-size:.72em;color:var(--tx3);line-height:1.4;}
body.pack-minimal .dp-opt{background:#fff!important;border-color:#e4e7ec!important;}
body.pack-minimal .dp-opt.sel{border-color:#4f46e5!important;}
body.pack-minimal .dp-opt.sel::after{background:#4f46e5!important;}
body.pack-minimal .dp-name{color:#1a1a2e!important;}
body.pack-minimal .dp-desc{color:#a0aec0!important;}
@media(max-width:768px){.dp-grid{grid-template-columns:1fr 1fr;}.dp-preview{height:60px;font-size:1.5em;}.dp-info{padding:10px 12px;}.dp-desc{font-size:.65em;}}
@media(max-width:380px){.dp-grid{grid-template-columns:1fr;}}
`;

styleEl.textContent = allCSS;
document.head.appendChild(styleEl);

// ================================================================
// APLICAR / REMOVER PACK
// ================================================================
function applyPack(packId){
  // Remover todos os pack classes
  DESIGN_PACKS.forEach(function(p){
    document.body.classList.remove('pack-' + p.id);
  });
  // Aplicar novo (se não for classic)
  if(packId && packId !== 'classic'){
    document.body.classList.add('pack-' + packId);
  }
  // Salvar no state
  if(typeof S !== 'undefined' && S.config){
    S.config.designPack = packId || 'classic';
    if(typeof salvar === 'function') salvar();
  }
}

window.setDesignPack = applyPack;

// ================================================================
// RENDERIZAR SELETOR NO MENU CONFIGURAÇÕES
// ================================================================
function renderPackSelector(){
  var configPage = document.getElementById('pg-config');
  if(!configPage) return;

  // Verificar se já existe
  var existing = document.getElementById('dpSection');
  if(existing) existing.remove();

  var currentPack = (S && S.config && S.config.designPack) || 'classic';

  var section = document.createElement('div');
  section.className = 'form-section dp-section';
  section.id = 'dpSection';

  var html = '<h3 style="margin-bottom:6px">&#127912; Visual da Interface</h3>';
  html += '<p class="dp-sub">Escolha um design que redesenha toda a interface. Cada visual muda layout, formas, efeitos e animações — não apenas cores. Os temas de cor continuam funcionando dentro de cada visual.</p>';
  html += '<div class="dp-grid">';

  DESIGN_PACKS.forEach(function(p){
    var isSel = p.id === currentPack;
    html += '<div class="dp-opt' + (isSel ? ' sel' : '') + '" onclick="setDesignPack(\'' + p.id + '\');renderConfig();">' +
      '<div class="dp-preview" style="background:' + p.preview + '">' + p.icon + '</div>' +
      '<div class="dp-info">' +
        '<div class="dp-name">' + p.nome + '</div>' +
        '<div class="dp-desc">' + p.desc + '</div>' +
      '</div>' +
    '</div>';
  });

  html += '</div>';
  section.innerHTML = html;

  // Inserir ANTES da seção de temas de cor
  var themeSection = configPage.querySelector('.form-section:has(#themeGrid)');
  if(!themeSection){
    // Fallback: procurar pela seção que contém "Tema"
    var allSections = configPage.querySelectorAll('.form-section');
    for(var i = 0; i < allSections.length; i++){
      if(allSections[i].querySelector('#themeGrid')){
        themeSection = allSections[i];
        break;
      }
    }
  }

  if(themeSection){
    themeSection.parentNode.insertBefore(section, themeSection);
  } else {
    // Inserir no topo
    var firstSection = configPage.querySelector('.form-section');
    if(firstSection) configPage.insertBefore(section, firstSection);
    else configPage.appendChild(section);
  }
}

// ================================================================
// HOOK: renderConfig
// ================================================================
var _origRenderConfig = window.renderConfig;
if(_origRenderConfig){
  window.renderConfig = function(){
    _origRenderConfig();
    renderPackSelector();
  };
}

// ================================================================
// HOOK: renderAll — garantir que o pack se mantém após re-render
// ================================================================
var _origRenderAll = window.renderAll;
if(_origRenderAll){
  window.renderAll = function(){
    _origRenderAll();
    // Re-aplicar pack (pois renderAll pode resetar classes)
    var currentPack = (S && S.config && S.config.designPack) || 'classic';
    if(currentPack !== 'classic'){
      if(!document.body.classList.contains('pack-' + currentPack)){
        document.body.classList.add('pack-' + currentPack);
      }
    }
  };
}

// ================================================================
// INIT: aplicar pack salvo ao carregar
// ================================================================
function initPack(){
  var currentPack = 'classic';
  if(typeof S !== 'undefined' && S && S.config && S.config.designPack){
    currentPack = S.config.designPack;
  }
  if(currentPack !== 'classic'){
    document.body.classList.add('pack-' + currentPack);
  }
}

// Tentar aplicar imediatamente (se S já existe)
if(typeof S !== 'undefined' && S) initPack();

// Também aplicar após um delay (para quando auth.js carrega os dados depois)
setTimeout(initPack, 800);
setTimeout(initPack, 2000);

// Observar mudanças no S (quando o login carrega dados do user)
var _origSwitchToUserData = window.switchToUserData;
if(_origSwitchToUserData){
  // Não podemos facilmente hookar switchToUserData (está dentro de IIFE do auth.js)
  // Então usamos setTimeout mais agressivo
}

// Observar quando auth mostra o app
var observer = new MutationObserver(function(mutations){
  mutations.forEach(function(m){
    if(m.type === 'attributes' && m.attributeName === 'class'){
      var overlay = document.getElementById('authOverlay');
      if(overlay && overlay.classList.contains('hiding')){
        setTimeout(initPack, 500);
      }
    }
  });
});
var authOverlay = document.getElementById('authOverlay');
if(authOverlay){
  observer.observe(authOverlay, { attributes: true });
}

console.log('[Financeiro Pro] Design Packs v1 — 5 visuais: Classic, Neon, Glass, Minimal, Gradient.');
})();

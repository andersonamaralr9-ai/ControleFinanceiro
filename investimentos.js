// investimentos.js v7 — redesign completo (mockup aprovado)
(function(){
'use strict';

// ================================================================
// CSS
// ================================================================
var sty = document.createElement('style');
sty.textContent = `
/* ── INVESTIMENTOS v7 ── */
.inv-wrap{max-width:100%;}

/* topo */
.inv-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;flex-wrap:wrap;}
.inv-top-actions{display:flex;gap:8px;align-items:center;}
.inv-view-toggle{display:flex;background:var(--bg3);border:1px solid var(--bg4);border-radius:10px;overflow:hidden;}
.ivt-btn{padding:7px 14px;background:none;border:none;color:var(--tx3);font-size:.75em;font-weight:600;cursor:pointer;transition:all .15s;}
.ivt-btn.on{background:var(--pri);color:#fff;}

/* nav mês */
.inv-mes-nav{display:flex;align-items:center;background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);margin-bottom:12px;overflow:hidden;}
.inv-mn-btn{background:none;border:none;color:var(--tx2);padding:10px 16px;cursor:pointer;font-size:1em;transition:background .15s;flex-shrink:0;}
.inv-mn-btn:hover{background:var(--bg3);}
.inv-mn-center{flex:1;text-align:center;padding:10px 8px;}
.inv-mn-label{font-size:.95em;font-weight:700;display:block;}
.inv-mn-sub{font-size:.62em;color:var(--tx3);margin-top:2px;}
.inv-mn-today{font-size:.65em;color:var(--pri2);cursor:pointer;padding:4px 10px;border-radius:6px;border:1px solid transparent;transition:all .15s;margin-right:4px;flex-shrink:0;}
.inv-mn-today:hover{border-color:var(--pri);background:rgba(108,92,231,.1);}

/* kpi strip — estilo neobank: dots de cor + tipografia maior */
.inv-kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);margin-bottom:14px;overflow:hidden;}
.inv-kc{padding:16px 12px;border-right:1px solid var(--bg4);text-align:center;}
.inv-kc:last-child{border-right:none;}
.inv-kc .inv-klbl{display:flex;align-items:center;justify-content:center;gap:5px;font-size:.64em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;margin-bottom:7px;}
.inv-klbl .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.inv-kval{font-size:1.15em;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.3px;}
.inv-ksub{font-size:.64em;color:var(--tx3);margin-top:4px;}

/* alloc */
.inv-alloc{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:12px 14px;margin-bottom:12px;}
.inv-alloc-head{display:flex;justify-content:space-between;margin-bottom:7px;}
.inv-alloc-track{display:flex;height:6px;border-radius:4px;overflow:hidden;gap:2px;margin-bottom:8px;}
.inv-alloc-seg{height:100%;border-radius:2px;}
.inv-alloc-legs{display:flex;gap:12px;flex-wrap:wrap;}
.inv-alloc-leg{display:flex;align-items:center;gap:5px;font-size:.7em;color:var(--tx2);}
.inv-alloc-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}

/* filtro período acumulado */
.inv-acum-filter{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);padding:9px 13px;}
.inv-af-pill{background:var(--bg3);border:1px solid var(--bg4);color:var(--tx3);border-radius:20px;padding:4px 12px;font-size:.7em;font-weight:600;cursor:pointer;transition:all .15s;}
.inv-af-pill.on{background:var(--pri);border-color:var(--pri);color:#fff;}
.inv-af-inputs{display:none;align-items:center;gap:6px;flex-wrap:wrap;}
.inv-af-inputs.show{display:flex;}
.inv-af-inputs input[type=month]{background:var(--bg3);border:1px solid var(--bg4);border-radius:8px;color:var(--tx);padding:5px 8px;font-size:.78em;outline:none;}

/* tabela lista */
.inv-list-table{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);overflow:hidden;margin-bottom:12px;}
.inv-lth{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(0,1fr)) minmax(0,1fr) 36px;padding:8px 14px;background:var(--bg3);border-bottom:1px solid var(--bg4);gap:8px;}
.inv-lth span{font-size:.58em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;text-align:right;}
.inv-lth span:first-child{text-align:left;}
.inv-ltr{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(0,1fr)) minmax(0,1fr) 36px;padding:11px 14px;border-bottom:1px solid var(--bg4);gap:8px;align-items:center;cursor:pointer;transition:background .13s;}
.inv-ltr:last-of-type{border:none;}
.inv-ltr:hover{background:rgba(255,255,255,.02);}
.inv-ltr-left{display:flex;align-items:center;gap:10px;min-width:0;}
.inv-ltr-bar{width:3px;height:32px;border-radius:3px;flex-shrink:0;}
.inv-ltr-name{font-size:.85em;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.inv-ltr-tipo{font-size:.62em;color:var(--tx3);margin-top:2px;}
.inv-lcell{text-align:right;}
.inv-lcell .cv{font-size:.82em;font-weight:700;font-variant-numeric:tabular-nums;display:block;}
.inv-lcell .cs{font-size:.62em;color:var(--tx3);margin-top:1px;}
.inv-lcell.clickable{cursor:pointer;border-radius:8px;transition:background .13s;}
.inv-lcell.clickable:hover{background:var(--bg3);}
.inv-ltr-arr{width:26px;height:26px;border-radius:7px;background:var(--bg3);border:1px solid var(--bg4);color:var(--tx3);display:flex;align-items:center;justify-content:center;font-size:.85em;cursor:pointer;transition:all .15s;margin-left:auto;}
.inv-ltr:hover .inv-ltr-arr{background:var(--pri);color:#fff;border-color:var(--pri);}
.inv-totals-row{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(3,minmax(0,1fr)) minmax(0,1fr) 36px;padding:10px 14px;background:var(--bg3);gap:8px;border-top:2px solid var(--bg4);}
.inv-totals-row .tl{font-size:.72em;font-weight:800;color:var(--tx2);}
.inv-totals-row .tv{font-size:.82em;font-weight:800;font-variant-numeric:tabular-nums;text-align:right;}

/* cards detalhado */
.inv-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-bottom:12px;}
.inv-card2{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);overflow:hidden;transition:transform .18s,box-shadow .18s;}
.inv-card2:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.25);}
.inv-card2-head{padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bg4);}
.inv-card2-strip{width:4px;height:38px;border-radius:3px;flex-shrink:0;}
.inv-card2-title{font-size:.92em;font-weight:700;}
.inv-card2-tipo{font-size:.64em;color:var(--tx3);margin-top:3px;}
.inv-card2-body{padding:14px 16px;}
.inv-card2-row{display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;font-size:.83em;border-bottom:1px solid var(--bg4);}
.inv-card2-row:last-of-type{border:none;}
.inv-card2-row .cl{color:var(--tx3);}
.inv-card2-row .cr{font-weight:700;font-variant-numeric:tabular-nums;}

/* gráfico de barras */
.inv-mini-chart{padding:0 16px 14px;}
.inv-mini-chart .inv-clbl{display:block;font-size:.6em;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);font-weight:700;margin-bottom:9px;}
.inv-bar-chart{display:flex;align-items:flex-end;gap:5px;}
.inv-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;min-width:0;}
.inv-bar-val-lbl{font-size:.52em;font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap;text-align:center;line-height:1.2;height:14px;margin-bottom:4px;}
.inv-bar-track{width:100%;height:48px;display:flex;align-items:flex-end;}
.inv-bar-fill{width:100%;border-radius:3px 3px 0 0;transition:height .3s ease;}
.inv-bar-mes-lbl{font-size:.56em;color:var(--tx3);text-align:center;margin-top:4px;white-space:nowrap;overflow:hidden;width:100%;line-height:1.2;}
.inv-card2-actions{padding:10px 16px;border-top:1px solid var(--bg4);display:flex;gap:7px;}
.inv-ca{flex:1;padding:8px;border-radius:9px;border:1px solid var(--bg4);background:var(--bg3);color:var(--tx2);font-size:.74em;font-weight:600;cursor:pointer;transition:all .15s;text-align:center;}
.inv-ca:hover{background:var(--bg4);color:var(--tx);}
.inv-ca.pri{background:var(--pri);border-color:var(--pri);color:#fff;}
.inv-ca.pri:hover{opacity:.85;}

/* overlay panel */
.inv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:500;display:none;align-items:center;justify-content:center;padding:16px;}
.inv-overlay.open{display:flex;}
.inv-panel{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);width:100%;max-width:540px;max-height:88vh;display:flex;flex-direction:column;animation:invPanelPop .22s ease;}
@keyframes invPanelPop{from{transform:scale(.94);opacity:0}to{transform:scale(1);opacity:1}}
.inv-panel-head{padding:16px 16px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0;}
.inv-panel-title{font-size:1em;font-weight:700;}
.inv-panel-sub{font-size:.72em;color:var(--tx3);margin-top:3px;}
.inv-px{background:var(--bg3);border:1px solid var(--bg4);color:var(--tx2);border-radius:8px;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;font-size:.85em;}
.inv-px:hover{background:var(--dn2);color:#fff;border-color:var(--dn2);}
.inv-panel-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:12px 16px;flex-shrink:0;}
.inv-pk{background:var(--bg3);border:1px solid var(--bg4);border-radius:12px;padding:11px 10px;text-align:center;}
.inv-pk .inv-pkl{display:flex;align-items:center;justify-content:center;gap:4px;font-size:.6em;text-transform:uppercase;letter-spacing:.8px;color:var(--tx3);font-weight:700;margin-bottom:5px;}
.inv-pk .inv-pkl .dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.inv-pk-val{font-size:1em;font-weight:800;font-variant-numeric:tabular-nums;}
.inv-pmn{display:flex;align-items:center;justify-content:space-between;padding:0 16px 10px;flex-shrink:0;}
.inv-pmn-btn{background:var(--bg3);border:1px solid var(--bg4);color:var(--tx2);border-radius:8px;padding:5px 13px;cursor:pointer;font-size:.77em;font-weight:600;transition:all .15s;}
.inv-pmn-btn:hover{border-color:var(--pri);color:var(--pri2);}
.inv-pmn-label{font-size:.85em;font-weight:700;color:var(--tx2);}
.inv-panel-tabs{display:flex;border-bottom:1px solid var(--bg4);padding:0 16px;flex-shrink:0;}
.inv-tab{height:40px;padding:0 13px;background:none;border:none;border-bottom:2px solid transparent;color:var(--tx3);font-size:.77em;font-weight:600;cursor:pointer;transition:all .15s;}
.inv-tab.on{color:var(--pri2);border-bottom-color:var(--pri2);}
.inv-tab:hover:not(.on){color:var(--tx2);}
.inv-panel-body{flex:1;overflow-y:auto;padding:0 16px 14px;}
.inv-tp{display:none;padding-top:13px;}
.inv-tp.on{display:block;}
.inv-hi{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;background:var(--bg3);border-radius:9px;margin-bottom:5px;gap:10px;}
.inv-hi.hl{border:1px solid rgba(108,92,231,.25);}
.inv-hi-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0;}
.inv-hi-mes{font-size:.8em;font-weight:700;color:var(--tx2);min-width:50px;}
.inv-hi-obs{font-size:.68em;color:var(--tx3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.inv-hi-val{font-size:.87em;font-weight:700;font-variant-numeric:tabular-nums;flex-shrink:0;}
.inv-hi-del{background:none;border:none;color:var(--tx3);cursor:pointer;padding:3px 6px;border-radius:5px;font-size:.8em;transition:color .15s;flex-shrink:0;}
.inv-hi-del:hover{color:var(--dn2);}
.inv-hi-empty{padding:8px 11px;background:var(--bg3);border-radius:9px;font-size:.78em;color:var(--tx3);border:1px dashed var(--bg4);}
.inv-chip{font-size:.64em;padding:2px 8px;border-radius:10px;font-weight:700;}
.inv-chip-p{background:rgba(0,184,148,.12);color:var(--ok);}
.inv-chip-n{background:rgba(214,48,49,.12);color:var(--dn2);}
.inv-chip-a{background:rgba(108,92,231,.15);color:var(--pri2);}
.inv-hist-sec-lbl{font-size:.6em;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);font-weight:700;margin:11px 0 5px 2px;display:block;}

/* form inline panel */
.inv-ifrm{background:var(--bg3);border:1px solid var(--bg4);border-radius:11px;padding:13px;margin-top:10px;}
.inv-ifrm-lbl{font-size:.65em;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);font-weight:700;margin-bottom:9px;display:block;}
.inv-ifrm-row{display:flex;gap:6px;flex-wrap:wrap;}
.inv-ii{flex:1;min-width:85px;background:var(--bg2);border:1px solid var(--bg4);border-radius:8px;padding:8px 10px;color:var(--tx);font-size:.82em;outline:none;transition:border-color .15s;}
.inv-ii:focus{border-color:var(--pri);}
.inv-ib{background:var(--pri);border:none;border-radius:8px;color:#fff;padding:8px 15px;font-size:.82em;font-weight:700;cursor:pointer;transition:opacity .15s;}
.inv-ib:hover{opacity:.85;}
.inv-rmodo{display:flex;gap:5px;margin-bottom:8px;}
.inv-rmodo-btn{flex:1;background:var(--bg2);border:1px solid var(--bg4);color:var(--tx3);border-radius:7px;padding:5px;font-size:.71em;font-weight:600;cursor:pointer;transition:all .15s;}
.inv-rmodo-btn.on{background:var(--pri);border-color:var(--pri);color:#fff;}
.inv-rcalc{font-size:.72em;padding:5px 2px;display:none;}

.inv-panel-acts{padding:11px 16px;border-top:1px solid var(--bg4);display:flex;gap:7px;flex-shrink:0;}
.inv-pa{flex:1;padding:9px;border-radius:9px;border:1px solid var(--bg4);background:var(--bg3);color:var(--tx2);font-size:.77em;font-weight:600;cursor:pointer;transition:all .15s;text-align:center;}
.inv-pa:hover{background:var(--bg4);color:var(--tx);}
.inv-pa.danger:hover{background:rgba(214,48,49,.1);color:var(--dn2);border-color:var(--dn2);}

/* modal novo ativo */
.inv-modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:600;display:none;align-items:center;justify-content:center;padding:16px;}
.inv-modal-ov.open{display:flex;}
.inv-modal-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--rad);width:100%;max-width:430px;animation:invPanelPop .2s ease;}
.inv-modal-head{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--bg4);}
.inv-modal-head h3{font-size:.93em;font-weight:700;}
.inv-fg{margin-bottom:12px;}
.inv-fg label{font-size:.72em;color:var(--tx3);font-weight:600;letter-spacing:.5px;display:block;margin-bottom:5px;}
.inv-fc{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:9px;padding:9px 12px;color:var(--tx);font-size:.87em;outline:none;transition:border-color .15s;}
.inv-fc:focus{border-color:var(--pri);}
.inv-fg-row{display:flex;gap:9px;}
.inv-fg-row .inv-fg{flex:1;}
.inv-modal-body{padding:18px;}
.inv-modal-foot{padding:12px 18px;border-top:1px solid var(--bg4);display:flex;gap:8px;}
.inv-mbtn{flex:1;padding:10px;border-radius:9px;font-size:.82em;font-weight:700;cursor:pointer;transition:all .15s;}
.inv-mbtn-pri{background:var(--pri);border:none;color:#fff;}
.inv-mbtn-pri:hover{opacity:.85;}
.inv-mbtn-sec{background:var(--bg3);border:1px solid var(--bg4);color:var(--tx2);}
.inv-mbtn-sec:hover{background:var(--bg4);}

@media(max-width:640px){
  .inv-kpi-strip{grid-template-columns:repeat(3,1fr);}
  .inv-kc:nth-child(4),.inv-kc:nth-child(5){border-top:1px solid var(--bg4);}
  .inv-lth,.inv-ltr,.inv-totals-row{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) 28px;}
  .inv-lth span:nth-child(3),.inv-lth span:nth-child(4),
  .inv-ltr .inv-lcell:nth-child(3),.inv-ltr .inv-lcell:nth-child(4),
  .inv-totals-row .tv:nth-child(3),.inv-totals-row .tv:nth-child(4){display:none;}
  .inv-cards-grid{grid-template-columns:1fr;}
}
`;
document.head.appendChild(sty);

// ================================================================
// INJETAR HTML (overlay panel + modal novo ativo)
// ================================================================
(function injectHTML(){
  if(document.getElementById('invOverlay')) return;

  var ov = document.createElement('div');
  ov.className = 'inv-overlay';
  ov.id = 'invOverlay';
  ov.onclick = function(e){ if(e.target === ov) invClosePanel(); };
  ov.innerHTML =
    '<div class="inv-panel">' +
      '<div class="inv-panel-head">' +
        '<div><div class="inv-panel-title" id="invPTitle"></div><div class="inv-panel-sub" id="invPSub"></div></div>' +
        '<button class="inv-px" onclick="invClosePanel()">&#10005;</button>' +
      '</div>' +
      '<div class="inv-panel-kpis" id="invPKpis"></div>' +
      '<div class="inv-pmn">' +
        '<button class="inv-pmn-btn" onclick="invChgPMes(-1)">&#9664;</button>' +
        '<span class="inv-pmn-label" id="invPMesLabel"></span>' +
        '<button class="inv-pmn-btn" onclick="invChgPMes(1)">&#9654;</button>' +
      '</div>' +
      '<div class="inv-panel-tabs">' +
        '<button class="inv-tab on" id="invTabRent" onclick="invSwitchTab(\'rent\')">&#128200; Rentabilidade</button>' +
        '<button class="inv-tab" id="invTabMov" onclick="invSwitchTab(\'mov\')">&#128260; Movimenta&ccedil;&otilde;es</button>' +
      '</div>' +
      '<div class="inv-panel-body">' +
        '<div class="inv-tp on" id="invTpRent">' +
          '<div id="invRentMesInfo"></div>' +
          '<div id="invRentHist"></div>' +
          '<div class="inv-ifrm">' +
            '<span class="inv-ifrm-lbl">&#65291; Lan&ccedil;ar rentabilidade</span>' +
            '<div class="inv-rmodo">' +
              '<button class="inv-rmodo-btn on" id="invRModoValBtn" onclick="invSetRModo(\'valor\')">Valor (R$)</button>' +
              '<button class="inv-rmodo-btn" id="invRModoSaldoBtn" onclick="invSetRModo(\'saldo\')">Saldo atual</button>' +
            '</div>' +
            '<div class="inv-ifrm-row">' +
              '<input class="inv-ii" type="month" id="invFiRMes" style="max-width:140px" oninput="invCalcRentPreview()">' +
              '<input class="inv-ii" placeholder="R$ rentabilidade" inputmode="decimal" id="invFiRVal">' +
              '<input class="inv-ii" placeholder="R$ saldo atual" inputmode="decimal" id="invFiRSaldo" style="display:none" oninput="invCalcRentPreview()">' +
              '<button class="inv-ib" onclick="invAddRent()">Salvar</button>' +
            '</div>' +
            '<div class="inv-rcalc" id="invFiRCalc"></div>' +
          '</div>' +
        '</div>' +
        '<div class="inv-tp" id="invTpMov">' +
          '<div id="invMovMesInfo"></div>' +
          '<div id="invMovHist"></div>' +
          '<div class="inv-ifrm">' +
            '<span class="inv-ifrm-lbl">&#65291; Aporte / Resgate</span>' +
            '<div class="inv-ifrm-row">' +
              '<select class="inv-ii" id="invFiMTipo" style="max-width:105px"><option value="aporte">Aporte</option><option value="resgate">Resgate</option></select>' +
              '<input class="inv-ii" type="date" id="invFiMData" style="max-width:135px">' +
              '<input class="inv-ii" placeholder="R$ valor" inputmode="decimal" id="invFiMVal">' +
              '<button class="inv-ib" onclick="invAddMov()">Salvar</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="inv-panel-acts">' +
        '<button class="inv-pa" onclick="invEditarAtivo()">&#9998; Editar</button>' +
        '<button class="inv-pa danger" onclick="invExcluirAtivo()">&#128465; Excluir</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  var mn = document.createElement('div');
  mn.className = 'inv-modal-ov';
  mn.id = 'invModalNovo';
  mn.onclick = function(e){ if(e.target === mn) invCloseNovoAtivo(); };
  mn.innerHTML =
    '<div class="inv-modal-box">' +
      '<div class="inv-modal-head">' +
        '<h3 id="invModalNovoTitle">&#65291; Novo Ativo</h3>' +
        '<button class="inv-px" onclick="invCloseNovoAtivo()">&#10005;</button>' +
      '</div>' +
      '<div class="inv-modal-body">' +
        '<div class="inv-fg"><label>Nome do ativo</label><input class="inv-fc" id="invNaNome" placeholder="Ex: Tesouro IPCA+ 2029"></div>' +
        '<div class="inv-fg-row">' +
          '<div class="inv-fg"><label>Tipo</label><select class="inv-fc" id="invNaTipo"></select></div>' +
          '<div class="inv-fg"><label>Valor inicial (R$)</label><input class="inv-fc" id="invNaValor" placeholder="0,00" inputmode="decimal"></div>' +
        '</div>' +
        '<div class="inv-fg"><label>Data de in&iacute;cio</label><input class="inv-fc" type="date" id="invNaData"></div>' +
        '<div class="inv-fg"><label>Observa&ccedil;&atilde;o (opcional)</label><input class="inv-fc" id="invNaObs" placeholder=""></div>' +
        '<input type="hidden" id="invNaEditId">' +
      '</div>' +
      '<div class="inv-modal-foot">' +
        '<button class="inv-mbtn inv-mbtn-sec" onclick="invCloseNovoAtivo()">Cancelar</button>' +
        '<button class="inv-mbtn inv-mbtn-pri" id="invNaSalvarBtn" onclick="invSalvarNovoAtivo()">Adicionar ativo</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(mn);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      invClosePanel();
      invCloseNovoAtivo();
    }
  });
})();

// ================================================================
// CONSTANTES
// ================================================================
var INV_CORES = ['#6c5ce7','#00b894','#0984e3','#fdcb6e','#e17055','#d63031','#00cec9','#e84393','#636e72','#2d3436'];
var INV_MESES_ABR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ================================================================
// ESTADO
// ================================================================
var _invMesSel = null;       // mês selecionado na tela (null = mês atual)
var _invPMesSel = null;      // mês selecionado no panel
var _invAtivoSel = null;     // objeto do ativo no panel
var _invActiveTab = 'rent';  // aba ativa no panel
var _invVistaAtual = 'lista';
var _invAcumPer = 'inicio';  // 'inicio' | '12m' | 'custom'
var _invRModo = 'valor';     // 'valor' | 'saldo'

function _invGetMes(){
  return _invMesSel || (typeof mesAtual === 'function' ? mesAtual() : '');
}

// ================================================================
// FORMATAÇÃO
// ================================================================
function _invFmt(v){
  return 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function _invFmtMes(m){
  var p = (m || '').split('-');
  if(p.length < 2) return m;
  return INV_MESES_ABR[+p[1]-1] + '/' + p[0].slice(2);
}
function _invFmtMesFull(m){
  if(typeof mesNomeFull === 'function') return mesNomeFull(m);
  if(typeof mesNome === 'function') return mesNome(m);
  var p = (m || '').split('-');
  if(p.length < 2) return m;
  var nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return nomes[+p[1]-1] + ' ' + p[0];
}
function _invAddMes(m, n){
  if(typeof addMes === 'function') return addMes(m, n);
  var p = (m || '').split('-').map(Number);
  var d = new Date(p[0], p[1]-1+n, 1);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}
function _invGetMesDe(data){ return (data || '').substring(0, 7); }

// ================================================================
// CÁLCULOS
// ================================================================
function _invCalcAtivo(inv, ma){
  var si = Number(inv.valor) || 0;
  var ap = 0, re = 0, rent = 0;
  (inv.movimentacoes || []).forEach(function(m){
    var mm = _invGetMesDe(m.data), v = Number(m.valor) || 0;
    if(mm && mm < ma){ si += m.tipo === 'resgate' ? -v : v; }
    else if(mm === ma){ if(m.tipo === 'aporte') ap += v; else re += v; }
  });
  (inv.rentabilidade || []).forEach(function(r){
    var v = Number(r.valor) || 0;
    if(r.mes < ma) si += v;
    else if(r.mes === ma) rent += v;
  });
  return { saldoInicial: si, aporte: ap, resgate: re, rent: rent, fechamento: si + ap - re + rent };
}

function _invCalcRentAcum(inv){
  var ma = _invGetMes();
  var rents = (inv.rentabilidade || []);
  if(_invAcumPer === '12m'){
    var lim = _invAddMes(ma, -11);
    rents = rents.filter(function(r){ return r.mes >= lim && r.mes <= ma; });
  } else if(_invAcumPer === 'custom'){
    var de = (document.getElementById('invAfDe') || {}).value;
    var ate = (document.getElementById('invAfAte') || {}).value || ma;
    rents = de ? rents.filter(function(r){ return r.mes >= de && r.mes <= ate; })
               : rents.filter(function(r){ return r.mes <= ma; });
  } else {
    rents = rents.filter(function(r){ return r.mes <= ma; });
  }
  var totalRent = rents.reduce(function(s, r){ return s + Number(r.valor||0); }, 0);
  var base = Number(inv.valor) || 1;
  return { valor: totalRent, pct: base ? totalRent / base * 100 : 0 };
}

// ================================================================
// RENDER PRINCIPAL
// ================================================================
window.renderInvest = function(){
  var invTipoSel = document.getElementById('invTipo');
  if(invTipoSel){
    invTipoSel.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){ invTipoSel.innerHTML += '<option>' + c + '</option>'; });
  }

  var invs = S.investimentos || [];
  var pgEl = document.getElementById('pg-investimentos');
  if(!pgEl) return;

  var existing = document.getElementById('invDynamicArea');
  if(existing) existing.remove();
  var tbWrap = pgEl.querySelector('.table-wrap');
  if(tbWrap) tbWrap.style.display = 'none';
  var oldForm = pgEl.querySelector('.form-section');
  if(oldForm) oldForm.style.display = 'none';

  var area = document.createElement('div');
  area.id = 'invDynamicArea';
  area.className = 'inv-wrap';

  var ma = _invGetMes();

  // cálculos agregados
  var tSI = 0, tAp = 0, tRe = 0, tRent = 0, tFec = 0;
  invs.forEach(function(inv){
    var c = _invCalcAtivo(inv, ma);
    tSI += c.saldoInicial; tAp += c.aporte; tRe += c.resgate; tRent += c.rent; tFec += c.fechamento;
  });

  var html = '';

  // ── topo ──
  html += '<div class="inv-top">' +
    '<div></div>' +
    '<div class="inv-top-actions">' +
      '<div class="inv-view-toggle">' +
        '<button class="ivt-btn' + (_invVistaAtual === 'lista' ? ' on' : '') + '" id="invBtnLista" onclick="invSetVista(\'lista\')">&#9776; Lista</button>' +
        '<button class="ivt-btn' + (_invVistaAtual === 'detalhe' ? ' on' : '') + '" id="invBtnDetalhe" onclick="invSetVista(\'detalhe\')">&#9635; Detalhado</button>' +
      '</div>' +
      '<button onclick="invOpenNovoAtivo()" style="background:var(--priG);border:none;color:#fff;border-radius:10px;padding:9px 16px;font-size:.8em;font-weight:700;cursor:pointer;">&#65291; Novo ativo</button>' +
    '</div>' +
  '</div>';

  // ── nav mês ──
  html += '<div class="inv-mes-nav">' +
    '<button class="inv-mn-btn" onclick="invChgMes(-1)">&#9664;</button>' +
    '<div class="inv-mn-center">' +
      '<span class="inv-mn-label">' + _invFmtMesFull(ma) + '</span>' +
      '<span class="inv-mn-sub" id="invMnSub">' + (ma === (typeof mesAtual === 'function' ? mesAtual() : '') ? 'Mês atual' : '') + '</span>' +
    '</div>' +
    '<span class="inv-mn-today" onclick="invGoToday()">Hoje</span>' +
    '<button class="inv-mn-btn" onclick="invChgMes(1)">&#9654;</button>' +
  '</div>';

  // ── kpi strip ──
  var rentPct = tSI > 0 ? (tRent / tSI * 100) : 0;
  var rentCls = tRent >= 0 ? 'color:var(--ok)' : 'color:var(--dn2)';
  html += '<div class="inv-kpi-strip">' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--tx3)"></span>Saldo Inicial</span><div class="inv-kval" style="color:var(--tx2)">' + _invFmt(tSI) + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--pri2)"></span>Aportes</span><div class="inv-kval" style="color:var(--pri2)">' + (tAp ? '+' + _invFmt(tAp) : '—') + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--dn2)"></span>Resgates</span><div class="inv-kval" style="color:var(--dn2)">' + (tRe ? '−' + _invFmt(tRe) : '—') + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:' + (tRent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '"></span>Rentabilidade</span><div class="inv-kval" style="' + rentCls + '">' + (tRent ? (tRent > 0 ? '+' : '') + _invFmt(tRent) : '—') + '</div><div class="inv-ksub">' + (tSI > 0 ? rentPct.toFixed(2) + '% a.m.' : '') + '</div></div>' +
    '<div class="inv-kc"><span class="inv-klbl"><span class="dot" style="background:var(--ok)"></span>Saldo Fechamento</span><div class="inv-kval" style="color:var(--ok)">' + _invFmt(tFec) + '</div></div>' +
  '</div>';

  // ── alocação ──
  var total = tFec || 1;
  html += '<div class="inv-alloc">' +
    '<div class="inv-alloc-head"><span style="font-size:.6em;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);font-weight:700">Alocação</span><span style="font-size:.72em;color:var(--tx3)">' + _invFmt(tFec) + '</span></div>' +
    '<div class="inv-alloc-track">' + invs.map(function(inv, i){ var c = _invCalcAtivo(inv, ma); return '<div class="inv-alloc-seg" style="width:' + Math.max(c.fechamento/total*100, 0.5).toFixed(1) + '%;background:' + INV_CORES[i % INV_CORES.length] + '" title="' + (inv.nome||'-') + '"></div>'; }).join('') + '</div>' +
    '<div class="inv-alloc-legs">' + invs.map(function(inv, i){ var c = _invCalcAtivo(inv, ma); return '<div class="inv-alloc-leg"><div class="inv-alloc-dot" style="background:' + INV_CORES[i % INV_CORES.length] + '"></div>' + (inv.nome||'-') + ' — ' + (c.fechamento/total*100).toFixed(0) + '%</div>'; }).join('') + '</div>' +
  '</div>';

  // ── filtro período acumulado ──
  html += '<div class="inv-acum-filter">' +
    '<span style="font-size:.6em;text-transform:uppercase;letter-spacing:1.2px;color:var(--tx3);font-weight:700;flex-shrink:0">Rent. Acumulada:</span>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button class="inv-af-pill' + (_invAcumPer === 'inicio' ? ' on' : '') + '" onclick="invSetAcumPer(\'inicio\',event)">Desde o início</button>' +
      '<button class="inv-af-pill' + (_invAcumPer === '12m' ? ' on' : '') + '" onclick="invSetAcumPer(\'12m\',event)">Últimos 12m</button>' +
      '<button class="inv-af-pill' + (_invAcumPer === 'custom' ? ' on' : '') + '" onclick="invSetAcumPer(\'custom\',event)">Personalizado</button>' +
    '</div>' +
    '<div class="inv-af-inputs' + (_invAcumPer === 'custom' ? ' show' : '') + '" id="invAfCustomInputs">' +
      '<input type="month" id="invAfDe" class="inv-ii" style="max-width:130px" oninput="renderInvest()">' +
      '<span style="color:var(--tx3);font-size:.8em">até</span>' +
      '<input type="month" id="invAfAte" class="inv-ii" style="max-width:130px" oninput="renderInvest()">' +
    '</div>' +
  '</div>';

  // ── vistas ──
  if(_invVistaAtual === 'lista'){
    html += _invBuildLista(invs, ma);
  } else {
    html += _invBuildDetalhe(invs, ma);
  }

  area.innerHTML = html;
  pgEl.appendChild(area);
};

// ================================================================
// VISTA LISTA
// ================================================================
function _invBuildLista(invs, ma){
  var h = '';
  h += '<div class="inv-list-table">' +
    '<div class="inv-lth">' +
      '<span>Ativo</span>' +
      '<span>Rent. Acumulada</span>' +
      '<span>Aporte / Resgate</span>' +
      '<span>Rent. Mês</span>' +
      '<span>Saldo Fechamento</span>' +
      '<span></span>' +
    '</div>' +
    '<div id="invLRows">';

  var tRA = 0, tAp = 0, tRe = 0, tRent = 0, tFec = 0;
  invs.forEach(function(inv, i){
    var c = _invCalcAtivo(inv, ma);
    var ra = _invCalcRentAcum(inv);
    tRA += ra.valor; tAp += c.aporte; tRe += c.resgate; tRent += c.rent; tFec += c.fechamento;

    var rentCls = c.rent > 0 ? 'color:var(--ok)' : c.rent < 0 ? 'color:var(--dn2)' : 'color:var(--tx3)';
    var movNet = c.aporte - c.resgate;
    var movStr = movNet > 0 ? '<span style="color:var(--ok)">+' + _invFmt(movNet) + '</span>' :
                 movNet < 0 ? '<span style="color:var(--dn2)">−' + _invFmt(-movNet) + '</span>' :
                 '<span style="color:var(--tx3)">—</span>';
    var raStr = ra.valor ? (ra.valor > 0 ? '+' : '') + _invFmt(ra.valor) : '—';
    var raPctStr = ra.valor ? (ra.pct > 0 ? '+' : '') + ra.pct.toFixed(1) + '% acum.' : '';
    var rentStr = c.rent ? (c.rent > 0 ? '+' : '') + _invFmt(c.rent) : '—';
    var idEsc = (inv.id || '').replace(/'/g, "\\'");

    h += '<div class="inv-ltr">' +
      '<div class="inv-ltr-left" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<div class="inv-ltr-bar" style="background:' + INV_CORES[i % INV_CORES.length] + '"></div>' +
        '<div><div class="inv-ltr-name">' + (inv.nome||'-') + '</div><div class="inv-ltr-tipo">' + (inv.tipo||'Outro') + '</div></div>' +
      '</div>' +
      '<div class="inv-lcell clickable" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<span class="cv" style="color:var(--pri2)">' + raStr + '</span>' +
        '<span class="cs">' + raPctStr + '</span>' +
      '</div>' +
      '<div class="inv-lcell clickable" onclick="invOpenPanel(\'' + idEsc + '\',\'mov\')">' +
        '<span class="cv">' + movStr + '</span>' +
        '<span class="cs">' + (c.aporte && c.resgate ? 'aporte + resgate' : c.aporte ? 'aporte' : c.resgate ? 'resgate' : '') + '</span>' +
      '</div>' +
      '<div class="inv-lcell clickable" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<span class="cv" style="' + rentCls + '">' + rentStr + '</span>' +
      '</div>' +
      '<div class="inv-lcell" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">' +
        '<span class="cv" style="color:var(--ok)">' + _invFmt(c.fechamento) + '</span>' +
      '</div>' +
      '<div onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')"><div class="inv-ltr-arr">&rsaquo;</div></div>' +
    '</div>';
  });

  h += '</div>';

  var movTot = tAp - tRe;
  h += '<div class="inv-totals-row">' +
    '<span class="tl">Total</span>' +
    '<span class="tv" style="color:var(--pri2)">' + (tRA ? (tRA > 0 ? '+' : '') + _invFmt(tRA) : '—') + '</span>' +
    '<span class="tv" style="color:' + (movTot > 0 ? 'var(--ok)' : movTot < 0 ? 'var(--dn2)' : 'var(--tx3)') + '">' + (movTot ? (movTot > 0 ? '+' : '−') + _invFmt(Math.abs(movTot)) : '—') + '</span>' +
    '<span class="tv" style="color:' + (tRent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (tRent ? (tRent > 0 ? '+' : '') + _invFmt(tRent) : '—') + '</span>' +
    '<span class="tv" style="color:var(--ok)">' + _invFmt(tFec) + '</span>' +
    '<span></span>' +
  '</div>';

  h += '</div>';
  return h;
}

// ================================================================
// VISTA DETALHADA
// ================================================================
function _invBuildDetalhe(invs, ma){
  var meses6 = [];
  for(var i = -5; i <= 0; i++) meses6.push(_invAddMes(ma, i));
  var h = '<div class="inv-cards-grid">';

  invs.forEach(function(inv, idx){
    var c = _invCalcAtivo(inv, ma);
    var ra = _invCalcRentAcum(inv);
    var cor = INV_CORES[idx % INV_CORES.length];
    var movNet = c.aporte - c.resgate;
    var rentCls = c.rent > 0 ? 'var(--ok)' : c.rent < 0 ? 'var(--dn2)' : 'var(--tx3)';
    var idEsc = (inv.id || '').replace(/'/g, "\\'");

    // barras
    var dadosMes = meses6.map(function(m){ return { m: m, rent: _invCalcAtivo(inv, m).rent }; });
    var maxAbs = Math.max.apply(null, dadosMes.map(function(d){ return Math.abs(d.rent); }).concat([1]));
    var BAR_MAX = 44;
    var bars = dadosMes.map(function(d){
      var h2 = d.rent ? Math.max(Math.round(Math.abs(d.rent) / maxAbs * BAR_MAX), 5) : 3;
      var barCor = d.rent > 0 ? cor : d.rent < 0 ? 'var(--dn2)' : 'var(--bg4)';
      var opac = d.rent ? 1 : 0.35;
      var mo = +d.m.split('-')[1] - 1;
      var mesAbr = INV_MESES_ABR[mo];
      var valLbl = d.rent ? (d.rent > 0 ? '+' : '') + _invFmt(d.rent) : '';
      var valCls = d.rent > 0 ? 'color:var(--ok)' : d.rent < 0 ? 'color:var(--dn2)' : 'color:var(--tx3)';
      var isSel = d.m === ma;
      return '<div class="inv-bar-col">' +
        '<div class="inv-bar-val-lbl" style="' + valCls + (d.rent ? '' : ';opacity:.4') + '">' + valLbl + '</div>' +
        '<div class="inv-bar-track">' +
          '<div class="inv-bar-fill" style="height:' + h2 + 'px;background:' + barCor + ';opacity:' + opac + (isSel ? ';outline:2px solid ' + cor + ';outline-offset:2px' : '') + '"></div>' +
        '</div>' +
        '<div class="inv-bar-mes-lbl" style="' + (isSel ? 'color:var(--tx);font-weight:700' : '') + '">' + mesAbr + '</div>' +
      '</div>';
    }).join('');

    h += '<div class="inv-card2">' +
      '<div class="inv-card2-head">' +
        '<div class="inv-card2-strip" style="background:' + cor + '"></div>' +
        '<div style="flex:1;min-width:0"><div class="inv-card2-title">' + (inv.nome||'-') + '</div><div class="inv-card2-tipo">' + (inv.tipo||'Outro') + '</div></div>' +
        '<div style="text-align:right;flex-shrink:0"><div style="font-size:1em;font-weight:800;color:var(--ok);font-variant-numeric:tabular-nums">' + _invFmt(c.fechamento) + '</div><div style="font-size:.62em;color:var(--tx3);margin-top:2px">saldo fechamento</div></div>' +
      '</div>' +
      '<div class="inv-card2-body">' +
        '<div class="inv-card2-row"><span class="cl">Rent. Acumulada</span><span class="cr" style="color:var(--pri2)">' + (ra.valor ? (ra.valor > 0 ? '+' : '') + _invFmt(ra.valor) : '—') + '<small style="color:var(--tx3);font-weight:400"> ' + (ra.pct ? (ra.pct > 0 ? '+' : '') + ra.pct.toFixed(1) + '%' : '') + '</small></span></div>' +
        '<div class="inv-card2-row"><span class="cl">Rent. ' + _invFmtMes(ma) + '</span><span class="cr" style="color:' + rentCls + '">' + (c.rent ? (c.rent > 0 ? '+' : '') + _invFmt(c.rent) : '—') + '</span></div>' +
        '<div class="inv-card2-row"><span class="cl">Aporte / Resgate</span><span class="cr" style="color:' + (movNet > 0 ? 'var(--ok)' : movNet < 0 ? 'var(--dn2)' : 'var(--tx3)') + '">' + (movNet ? (movNet > 0 ? '+' : '−') + _invFmt(Math.abs(movNet)) : '—') + '</span></div>' +
        '<div class="inv-card2-row"><span class="cl">Saldo Inicial</span><span class="cr" style="color:var(--tx2)">' + _invFmt(c.saldoInicial) + '</span></div>' +
      '</div>' +
      '<div class="inv-mini-chart">' +
        '<span class="inv-clbl">Rentabilidade — últimos 6 meses</span>' +
        '<div class="inv-bar-chart">' + bars + '</div>' +
      '</div>' +
      '<div class="inv-card2-actions">' +
        '<button class="inv-ca" onclick="invOpenPanel(\'' + idEsc + '\',\'mov\')">&#128260; Movimentações</button>' +
        '<button class="inv-ca" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">&#128200; Rentabilidade</button>' +
        '<button class="inv-ca pri" onclick="invOpenPanel(\'' + idEsc + '\',\'rent\')">Ver detalhe &rsaquo;</button>' +
      '</div>' +
    '</div>';
  });

  h += '</div>';
  return h;
}

// ================================================================
// PANEL
// ================================================================
window.invOpenPanel = function(id, tab){
  _invAtivoSel = (S.investimentos || []).find(function(x){ return x.id === id; });
  if(!_invAtivoSel) return;
  _invPMesSel = _invGetMes();
  invSwitchTab(tab || 'rent');
  _invRenderPanel();
  document.getElementById('invOverlay').classList.add('open');
};
window.invClosePanel = function(){
  var ov = document.getElementById('invOverlay');
  if(ov) ov.classList.remove('open');
};
window.invChgPMes = function(n){
  _invPMesSel = _invAddMes(_invPMesSel, n);
  _invRenderPanel();
};
window.invSwitchTab = function(id){
  _invActiveTab = id;
  ['Rent','Mov'].forEach(function(t){
    var btn = document.getElementById('invTab' + t);
    var tp = document.getElementById('invTp' + t.toLowerCase());
    var isOn = (id === t.toLowerCase());
    if(btn) btn.classList.toggle('on', isOn);
    if(tp) tp.classList.toggle('on', isOn);
  });
};

function _invRenderPanel(){
  var inv = _invAtivoSel;
  if(!inv) return;
  var c = _invCalcAtivo(inv, _invPMesSel);
  var ra = _invCalcRentAcum(inv);
  var rentCls = c.rent > 0 ? 'var(--ok)' : c.rent < 0 ? 'var(--dn2)' : 'var(--tx3)';

  document.getElementById('invPTitle').textContent = inv.nome || '-';
  document.getElementById('invPSub').textContent = (inv.tipo||'') + ' · saldo ' + _invFmt(c.fechamento);
  document.getElementById('invPMesLabel').textContent = _invFmtMesFull(_invPMesSel);
  var riMes = document.getElementById('invFiRMes');
  if(riMes) riMes.value = _invPMesSel;
  var miData = document.getElementById('invFiMData');
  if(miData) miData.value = _invPMesSel + '-10';

  document.getElementById('invPKpis').innerHTML =
    '<div class="inv-pk"><span class="inv-pkl"><span class="dot" style="background:var(--ok)"></span>Saldo Fechamento</span><div class="inv-pk-val" style="color:var(--ok)">' + _invFmt(c.fechamento) + '</div></div>' +
    '<div class="inv-pk"><span class="inv-pkl"><span class="dot" style="background:' + (c.rent >= 0 ? 'var(--ok)' : 'var(--dn2)') + '"></span>Rent. Mês</span><div class="inv-pk-val" style="color:' + rentCls + '">' + (c.rent ? (c.rent > 0 ? '+' : '') + _invFmt(c.rent) : '—') + '</div></div>' +
    '<div class="inv-pk"><span class="inv-pkl"><span class="dot" style="background:var(--pri2)"></span>Rent. Acumulada</span><div class="inv-pk-val" style="color:var(--pri2)">' + (ra.valor ? (ra.valor > 0 ? '+' : '') + _invFmt(ra.valor) : '—') + '</div><div style="font-size:.6em;color:var(--tx3);margin-top:2px">' + (ra.pct ? (ra.pct > 0 ? '+' : '') + ra.pct.toFixed(1) + '% total' : '') + '</div></div>';

  // aba rent
  var rents = (inv.rentabilidade || []).slice().sort(function(a, b){ return b.mes.localeCompare(a.mes); });
  var rmv = rents.find(function(r){ return r.mes === _invPMesSel; });
  var idEsc = (inv.id || '').replace(/'/g, "\\'");

  document.getElementById('invRentMesInfo').innerHTML = rmv
    ? '<div class="inv-hi hl"><div class="inv-hi-left"><span class="inv-hi-mes">' + _invFmtMes(_invPMesSel) + '</span><span class="inv-chip inv-chip-a">mês selecionado</span></div><span class="inv-hi-val" style="color:' + (rmv.valor >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rmv.valor > 0 ? '+' : '') + _invFmt(rmv.valor) + '</span><button class="inv-hi-del" onclick="invDelRent(\'' + idEsc + '\',\'' + rmv.mes + '\')">&#10005;</button></div>'
    : '<div class="inv-hi-empty">Nenhuma rentabilidade em ' + _invFmtMesFull(_invPMesSel) + '</div>';

  var restRents = rents.filter(function(r){ return r.mes !== _invPMesSel; });
  document.getElementById('invRentHist').innerHTML = restRents.length
    ? '<span class="inv-hist-sec-lbl">Histórico completo</span>' + restRents.map(function(r){
        var rv = Number(r.valor) || 0;
        return '<div class="inv-hi"><div class="inv-hi-left"><span class="inv-hi-mes">' + _invFmtMes(r.mes) + '</span><span class="inv-chip ' + (rv >= 0 ? 'inv-chip-a' : 'inv-chip-n') + '">Rentabilidade</span></div>' +
          '<span class="inv-hi-val" style="color:' + (rv >= 0 ? 'var(--ok)' : 'var(--dn2)') + '">' + (rv > 0 ? '+' : '') + _invFmt(rv) + '</span>' +
          '<button class="inv-hi-del" onclick="invDelRent(\'' + idEsc + '\',\'' + r.mes + '\')">&#10005;</button></div>';
      }).join('')
    : '';

  // aba mov
  var movs = (inv.movimentacoes || []).slice().sort(function(a, b){ return b.data.localeCompare(a.data); });
  var movsMes = movs.filter(function(m){ return _invGetMesDe(m.data) === _invPMesSel; });
  var movsRest = movs.filter(function(m){ return _invGetMesDe(m.data) !== _invPMesSel; });

  function movHtml(m){
    var mv = Number(m.valor) || 0;
    var movIdEsc = (m.id || '').replace(/'/g, "\\'");
    return '<div class="inv-hi" style="border:1px solid rgba(' + (m.tipo === 'aporte' ? '0,184,148' : '214,48,49') + ',.15)">' +
      '<div class="inv-hi-left"><span class="inv-hi-mes">' + (typeof fmtD === 'function' ? fmtD(m.data) : m.data) + '</span>' +
      '<span class="inv-chip ' + (m.tipo === 'aporte' ? 'inv-chip-p' : 'inv-chip-n') + '">' + m.tipo + '</span>' +
      (m.obs ? '<span class="inv-hi-obs">' + m.obs + '</span>' : '') + '</div>' +
      '<span class="inv-hi-val" style="color:' + (m.tipo === 'aporte' ? 'var(--ok)' : 'var(--dn2)') + '">' + (m.tipo === 'aporte' ? '+' : '−') + _invFmt(mv) + '</span>' +
      '<button class="inv-hi-del" onclick="invDelMovById(\'' + idEsc + '\',\'' + movIdEsc + '\')">&#10005;</button></div>';
  }

  document.getElementById('invMovMesInfo').innerHTML = movsMes.length
    ? '<span class="inv-hist-sec-lbl">' + _invFmtMesFull(_invPMesSel) + '</span>' + movsMes.map(movHtml).join('')
    : '<div class="inv-hi-empty">Nenhuma movimentação em ' + _invFmtMesFull(_invPMesSel) + '</div>';

  document.getElementById('invMovHist').innerHTML = movsRest.length
    ? '<span class="inv-hist-sec-lbl">Histórico</span>' + movsRest.map(movHtml).join('')
    : '';
}

// ================================================================
// RENTABILIDADE (panel)
// ================================================================
window.invSetRModo = function(m){
  _invRModo = m;
  var vEl = document.getElementById('invFiRVal');
  var sEl = document.getElementById('invFiRSaldo');
  var vBtn = document.getElementById('invRModoValBtn');
  var sBtn = document.getElementById('invRModoSaldoBtn');
  if(vEl) vEl.style.display = m === 'valor' ? '' : 'none';
  if(sEl) sEl.style.display = m === 'saldo' ? '' : 'none';
  if(vBtn) vBtn.classList.toggle('on', m === 'valor');
  if(sBtn) sBtn.classList.toggle('on', m === 'saldo');
  var calc = document.getElementById('invFiRCalc');
  if(calc) calc.style.display = 'none';
  if(m === 'saldo') invCalcRentPreview();
};
window.invCalcRentPreview = function(){
  if(_invRModo !== 'saldo' || !_invAtivoSel) return;
  var mes = (document.getElementById('invFiRMes') || {}).value;
  var saldo = parseFloat(((document.getElementById('invFiRSaldo') || {}).value || '').replace(',','.'));
  var el = document.getElementById('invFiRCalc');
  if(!el) return;
  if(!mes || isNaN(saldo)){ el.style.display = 'none'; return; }
  var c = _invCalcAtivo(_invAtivoSel, mes);
  var base = c.saldoInicial + c.aporte - c.resgate;
  var rent = saldo - base;
  el.textContent = 'Base: ' + _invFmt(base) + ' → Rent. calculada: ' + (rent >= 0 ? '+' : '') + _invFmt(rent);
  el.style.color = rent >= 0 ? 'var(--ok)' : 'var(--dn2)';
  el.style.display = 'block';
};
window.invAddRent = function(){
  if(!_invAtivoSel) return;
  var mes = (document.getElementById('invFiRMes') || {}).value;
  if(!mes) return alert('Selecione o mês.');
  var val;
  if(_invRModo === 'valor'){
    val = parseFloat(((document.getElementById('invFiRVal') || {}).value || '').replace(',','.'));
    if(isNaN(val)) return alert('Preencha o valor da rentabilidade.');
  } else {
    var saldo = parseFloat(((document.getElementById('invFiRSaldo') || {}).value || '').replace(',','.'));
    if(isNaN(saldo)) return alert('Preencha o saldo atual.');
    var c = _invCalcAtivo(_invAtivoSel, mes);
    val = saldo - (c.saldoInicial + c.aporte - c.resgate);
  }
  if(!Array.isArray(_invAtivoSel.rentabilidade)) _invAtivoSel.rentabilidade = [];
  _invAtivoSel.rentabilidade = _invAtivoSel.rentabilidade.filter(function(r){ return r.mes !== mes; });
  _invAtivoSel.rentabilidade.push({ mes: mes, valor: val });
  salvar();
  var vEl = document.getElementById('invFiRVal'); if(vEl) vEl.value = '';
  var sEl = document.getElementById('invFiRSaldo'); if(sEl) sEl.value = '';
  var cEl = document.getElementById('invFiRCalc'); if(cEl) cEl.style.display = 'none';
  _invRenderPanel(); renderInvest();
};
window.invDelRent = function(invId, mes){
  if(!confirm('Remover rentabilidade de ' + _invFmtMes(mes) + '?')) return;
  var inv = (S.investimentos || []).find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.rentabilidade = (inv.rentabilidade || []).filter(function(r){ return r.mes !== mes; });
  salvar(); _invRenderPanel(); renderInvest();
};

// ================================================================
// MOVIMENTAÇÕES (panel)
// ================================================================
window.invAddMov = function(){
  if(!_invAtivoSel) return;
  var tipo = (document.getElementById('invFiMTipo') || {}).value || 'aporte';
  var data = (document.getElementById('invFiMData') || {}).value;
  var val = parseFloat(((document.getElementById('invFiMVal') || {}).value || '').replace(',','.'));
  if(!data) return alert('Informe a data.');
  if(isNaN(val) || val <= 0) return alert('Informe um valor válido.');
  if(!Array.isArray(_invAtivoSel.movimentacoes)) _invAtivoSel.movimentacoes = [];
  _invAtivoSel.movimentacoes.push({ tipo: tipo, valor: val, data: data, obs: '', id: (typeof uid === 'function' ? uid() : Date.now() + '') });
  salvar();
  var vEl = document.getElementById('invFiMVal'); if(vEl) vEl.value = '';
  _invRenderPanel(); renderInvest();
};
window.invDelMovById = function(invId, movId){
  if(!confirm('Remover movimentação?')) return;
  var inv = (S.investimentos || []).find(function(x){ return x.id === invId; });
  if(!inv) return;
  inv.movimentacoes = (inv.movimentacoes || []).filter(function(m){ return m.id !== movId; });
  salvar(); _invRenderPanel(); renderInvest();
};

// ================================================================
// EDITAR / EXCLUIR (panel)
// ================================================================
window.invEditarAtivo = function(){
  if(!_invAtivoSel) return;
  var inv = _invAtivoSel;
  var nEl = document.getElementById('invNaNome'); if(nEl) nEl.value = inv.nome || '';
  var tEl = document.getElementById('invNaTipo');
  if(tEl){
    tEl.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){ tEl.innerHTML += '<option>' + c + '</option>'; });
    tEl.value = inv.tipo || '';
  }
  var vEl = document.getElementById('invNaValor'); if(vEl) vEl.value = Number(inv.valor||0).toFixed(2).replace('.',',');
  var dEl = document.getElementById('invNaData'); if(dEl) dEl.value = inv.data || inv.dataInicio || '';
  var oEl = document.getElementById('invNaObs'); if(oEl) oEl.value = inv.obs || '';
  var eEl = document.getElementById('invNaEditId'); if(eEl) eEl.value = inv.id || '';
  var tit = document.getElementById('invModalNovoTitle'); if(tit) tit.textContent = '✏️ Editar Ativo';
  var btn = document.getElementById('invNaSalvarBtn'); if(btn) btn.textContent = 'Salvar alterações';
  invClosePanel();
  document.getElementById('invModalNovo').classList.add('open');
};
window.invExcluirAtivo = function(){
  if(!_invAtivoSel) return;
  if(!confirm('Excluir "' + (_invAtivoSel.nome||'-') + '"?\nEsta ação não pode ser desfeita.')) return;
  S.investimentos = (S.investimentos || []).filter(function(x){ return x.id !== _invAtivoSel.id; });
  _invAtivoSel = null;
  salvar();
  invClosePanel();
  renderInvest();
};

// ================================================================
// NOVO ATIVO / EDITAR
// ================================================================
window.invOpenNovoAtivo = function(){
  var nEl = document.getElementById('invNaNome'); if(nEl) nEl.value = '';
  var tEl = document.getElementById('invNaTipo');
  if(tEl){
    tEl.innerHTML = '';
    (S.cats.investimento || ['Outro']).forEach(function(c){ tEl.innerHTML += '<option>' + c + '</option>'; });
  }
  var vEl = document.getElementById('invNaValor'); if(vEl) vEl.value = '';
  var dEl = document.getElementById('invNaData'); if(dEl) dEl.value = typeof hojeStr === 'function' ? hojeStr() : '';
  var oEl = document.getElementById('invNaObs'); if(oEl) oEl.value = '';
  var eEl = document.getElementById('invNaEditId'); if(eEl) eEl.value = '';
  var tit = document.getElementById('invModalNovoTitle'); if(tit) tit.textContent = '＋ Novo Ativo';
  var btn = document.getElementById('invNaSalvarBtn'); if(btn) btn.textContent = 'Adicionar ativo';
  document.getElementById('invModalNovo').classList.add('open');
};
window.invCloseNovoAtivo = function(){
  var mn = document.getElementById('invModalNovo');
  if(mn) mn.classList.remove('open');
};
window.invSalvarNovoAtivo = function(){
  var nome = ((document.getElementById('invNaNome') || {}).value || '').trim();
  var tipo = (document.getElementById('invNaTipo') || {}).value || 'Outro';
  var valRaw = ((document.getElementById('invNaValor') || {}).value || '').replace(',','.');
  var val = parseFloat(valRaw);
  var data = (document.getElementById('invNaData') || {}).value || '';
  var obs = ((document.getElementById('invNaObs') || {}).value || '').trim();
  var editId = (document.getElementById('invNaEditId') || {}).value || '';
  if(!nome || isNaN(val)) return alert('Preencha nome e valor inicial.');
  if(!Array.isArray(S.investimentos)) S.investimentos = [];
  if(editId){
    var inv = S.investimentos.find(function(x){ return x.id === editId; });
    if(inv){ inv.nome = nome; inv.tipo = tipo; inv.valor = val; inv.data = data; inv.obs = obs; }
  } else {
    S.investimentos.push({ id: typeof uid === 'function' ? uid() : 'i' + Date.now(), nome: nome, tipo: tipo, valor: val, data: data, obs: obs, rentabilidade: [], movimentacoes: [] });
  }
  salvar();
  invCloseNovoAtivo();
  renderInvest();
};

// ================================================================
// NAVEGAÇÃO MÊS / VISTA / FILTRO
// ================================================================
window.invChgMes = function(n){
  _invMesSel = _invAddMes(_invGetMes(), n);
  renderInvest();
};
window.invGoToday = function(){
  _invMesSel = null;
  renderInvest();
};
window.invSetVista = function(v){
  _invVistaAtual = v;
  renderInvest();
};
window.invSetAcumPer = function(p, e){
  _invAcumPer = p;
  document.querySelectorAll('.inv-af-pill').forEach(function(b){ b.classList.remove('on'); });
  if(e && e.target) e.target.classList.add('on');
  var ci = document.getElementById('invAfCustomInputs');
  if(ci) ci.classList.toggle('show', p === 'custom');
  if(p !== 'custom') renderInvest();
};

console.log('[Financeiro Pro] Investimentos v7 — redesign completo.');
})();

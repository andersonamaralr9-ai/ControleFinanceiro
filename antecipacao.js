// antecipacao.js - Antecipação de parcelas de compras no cartão
(function(){

  // ============================================
  // CSS do modal de antecipação
  // ============================================
  var sty = document.createElement('style');
  sty.textContent = `
    .ant-modal-parcelas { max-height: 300px; overflow-y: auto; margin: 12px 0; }
    .ant-parc-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--bg4); font-size:.88em; }
    .ant-parc-item:last-child { border-bottom:none; }
    .ant-parc-item.ja-paga { opacity:.45; }
    .ant-parc-item.antecipada { background:rgba(0,206,201,.08); }
    .ant-parc-item.bloqueada { opacity:.35; }
    .ant-parc-item label { display:flex; align-items:center; gap:8px; cursor:pointer; flex:1; }
    .ant-parc-item input[type=checkbox] { width:18px; height:18px; accent-color:var(--pri); cursor:pointer; }
    .ant-parc-info { flex:1; }
    .ant-parc-num { font-weight:700; color:var(--pri2); }
    .ant-parc-mes { font-size:.82em; color:var(--tx2); margin-left:6px; }
    .ant-parc-val { font-weight:700; color:var(--dn2); white-space:nowrap; }
    .ant-parc-status { font-size:.72em; padding:2px 8px; border-radius:10px; font-weight:600; margin-left:8px; }
    .ant-parc-status.normal { background:rgba(9,132,227,.12); color:var(--inf2); }
    .ant-parc-status.pendente { background:rgba(253,203,110,.15); color:var(--wn); }
    .ant-parc-status.antecipada { background:rgba(108,92,231,.15); color:var(--pri2); }
    .ant-parc-status.bloqueada { background:rgba(100,100,100,.15); color:var(--tx3); }
    .ant-resumo { background:var(--bg3); border-radius:8px; padding:14px; margin:12px 0; }
    .ant-resumo p { font-size:.85em; color:var(--tx2); margin-bottom:4px; }
    .ant-resumo .ant-total { font-size:1.15em; font-weight:700; color:var(--ok); }
    .ant-select-bar { display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
    .ant-select-bar button { padding:5px 12px; font-size:.75em; }
    .ant-mes-destino { margin:12px 0; padding:14px; background:var(--bg3); border-radius:8px; }
    .ant-mes-destino label { font-size:.8em; color:var(--tx2); font-weight:600; display:block; margin-bottom:6px; }
    .ant-mes-destino .ant-help { font-size:.72em; color:var(--tx3); margin-top:6px; font-style:italic; }
    .ant-aviso { background:rgba(253,203,110,.1); border:1px solid rgba(253,203,110,.25); border-radius:8px; padding:10px 14px; margin:10px 0; font-size:.82em; color:var(--wn); }
  `;
  document.head.appendChild(sty);

  // ============================================
  // Criar o modal HTML
  // ============================================
  var modalDiv = document.createElement('div');
  modalDiv.className = 'modal';
  modalDiv.id = 'modalAntecipacao';
  modalDiv.innerHTML = `
    <div class="modal-content" style="max-width:520px">
      <div class="modal-header">
        <h3>&#9889; Antecipar Parcelas</h3>
        <span class="modal-close" onclick="fecharAntecipacao()">&times;</span>
      </div>
      <div class="modal-body">
        <div id="antCompraInfo"></div>
        <div class="ant-mes-destino">
          <label>&#128197; Em qual fatura você vai pagar as parcelas antecipadas?</label>
          <input type="month" id="antMesDestino" class="form-control" style="max-width:200px" onchange="antAtualizarDisponibilidade()">
          <p class="ant-help">Exemplo: se escolher Junho/2026, só as parcelas de Julho/2026 em diante poderão ser antecipadas.</p>
        </div>
        <div id="antAvisoArea"></div>
        <div class="ant-select-bar" id="antSelectBar" style="display:none">
          <button class="btn btn-sm btn-outline" onclick="antSelecionarTodas()">Selecionar Todas</button>
          <button class="btn btn-sm btn-outline" onclick="antDesmarcarTodas()">Desmarcar Todas</button>
          <button class="btn btn-sm btn-outline" onclick="antSelecionarUltimas()">Últimas N parcelas...</button>
        </div>
        <div class="ant-modal-parcelas" id="antListaParcelas"></div>
        <div class="ant-resumo" id="antResumo" style="display:none">
          <p>Parcelas selecionadas: <strong id="antQtdSel">0</strong></p>
          <p>Valor total antecipado: <span class="ant-total" id="antValorTotal">R$ 0,00</span></p>
        </div>
        <button class="btn btn-primary" onclick="confirmarAntecipacao()" style="width:100%;margin-top:12px">
          Confirmar Antecipação
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  // ============================================
  // Estado
  // ============================================
  var antState = {
    compraId: null,
    compra: null,
    parcelas: []
  };

  // ============================================
  // Helpers
  // ============================================
  function nomeMes(y,m){
    return new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  }
  function mesSeguinte(y,m){
    m++; if(m>12){m=1;y++;} return {y:y,m:m};
  }
  function mesParaNum(mesAno){
    // "YYYY-MM" → número YYYYMM para comparação
    var p=mesAno.split('-'); return parseInt(p[0])*100+parseInt(p[1]);
  }

  // ============================================
  // Calcular parcelas e em qual fatura cada uma cai
  // ============================================
  function calcularParcelas(compra){
    var cart = S.cartoes.find(function(c){return c.id===compra.cartaoId;});
    var fechamento = cart ? (Number(cart.fechamento)||1) : 1;
    var dataCompra = new Date(compra.data+'T12:00:00');
    var diaCompra = dataCompra.getDate();
    var mesCompra = dataCompra.getMonth()+1;
    var anoCompra = dataCompra.getFullYear();

    var mesBase, anoBase;
    if(diaCompra > fechamento){
      var ns = mesSeguinte(anoCompra, mesCompra);
      anoBase = ns.y; mesBase = ns.m;
    } else {
      anoBase = anoCompra; mesBase = mesCompra;
    }

    var totalParc = compra.parcelas || 1;
    var valorParc = (Number(compra.valor)||0) / totalParc;

    var antecipacoes = compra.antecipacoes || [];

    var resultado = [];
    var y = anoBase, m = mesBase;
    for(var i=1; i<=totalParc; i++){
      var status = 'normal'; // cairá normalmente na fatura

      var foiAntecipada = antecipacoes.some(function(a){
        return a.parcelasNums && a.parcelasNums.indexOf(i) >= 0;
      });
      if(foiAntecipada) status = 'antecipada';

      resultado.push({
        num: i,
        mesAno: y+'-'+(m<10?'0':'')+m,
        mesNum: y*100+m,
        mesLabel: nomeMes(y,m),
        valor: valorParc,
        status: status,
        disponivel: false, // será calculado quando o usuário escolher o mês destino
        selected: false
      });
      var ns = mesSeguinte(y,m);
      y=ns.y; m=ns.m;
    }
    return resultado;
  }

  // ============================================
  // Atualizar disponibilidade com base no mês destino
  // Regra: só parcelas de MESES POSTERIORES ao mês destino podem ser antecipadas
  // ============================================
  window.antAtualizarDisponibilidade = function(){
    var mesDestino = document.getElementById('antMesDestino').value;
    if(!mesDestino){
      antState.parcelas.forEach(function(p){ p.disponivel=false; p.selected=false; });
      renderListaParcelas();
      document.getElementById('antSelectBar').style.display='none';
      document.getElementById('antAvisoArea').innerHTML='';
      return;
    }

    var mesDestinoNum = mesParaNum(mesDestino);
    var temDisponivel = false;

    antState.parcelas.forEach(function(p){
      p.selected = false;
      if(p.status === 'antecipada'){
        p.disponivel = false; // já foi antecipada
      } else if(p.mesNum > mesDestinoNum){
        // A parcela cairia DEPOIS do mês destino → pode antecipar
        p.disponivel = true;
        temDisponivel = true;
      } else {
        // A parcela cai no mês destino ou antes → não faz sentido antecipar
        p.disponivel = false;
      }
    });

    var avisoArea = document.getElementById('antAvisoArea');
    if(temDisponivel){
      var disponiveis = antState.parcelas.filter(function(p){return p.disponivel;});
      avisoArea.innerHTML = '<div class="ant-aviso">&#128161; Fatura escolhida: <strong>'+nomeMes(
        parseInt(mesDestino.split('-')[0]),parseInt(mesDestino.split('-')[1])
      )+'</strong>. Parcelas de <strong>'+disponiveis[0].mesLabel+'</strong> em diante podem ser antecipadas ('+disponiveis.length+' parcela(s)).</div>';
      document.getElementById('antSelectBar').style.display='flex';
    } else {
      avisoArea.innerHTML = '<div class="ant-aviso">Nenhuma parcela disponível para antecipar nesta fatura. Escolha um mês anterior.</div>';
      document.getElementById('antSelectBar').style.display='none';
    }

    renderListaParcelas();
  };

  // ============================================
  // Abrir modal
  // ============================================
  window.abrirAntecipacao = function(compraId){
    var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
    if(!compra){toast('Compra não encontrada','error');return;}

    antState.compraId = compraId;
    antState.compra = compra;
    antState.parcelas = calcularParcelas(compra);

    var cart = S.cartoes.find(function(c){return c.id===compra.cartaoId;});
    var valorParc = (Number(compra.valor)||0) / (compra.parcelas||1);
    document.getElementById('antCompraInfo').innerHTML =
      '<p style="font-size:.9em;color:var(--tx2);margin-bottom:4px"><strong style="color:var(--tx)">'+compra.desc+'</strong></p>'+
      '<p style="font-size:.82em;color:var(--tx3)">Cartão: '+(cart?cart.nome:'-')+' &bull; Total: '+fmtV(compra.valor)+' &bull; '+compra.parcelas+'x de '+fmtV(valorParc)+'</p>';

    // Resetar mês destino
    document.getElementById('antMesDestino').value = '';
    document.getElementById('antAvisoArea').innerHTML = '';
    document.getElementById('antSelectBar').style.display = 'none';
    document.getElementById('antResumo').style.display = 'none';
    document.getElementById('antListaParcelas').innerHTML = '';

    renderListaParcelas();
    document.getElementById('modalAntecipacao').classList.add('show');
  };

  // ============================================
  // Renderizar lista de parcelas
  // ============================================
  function renderListaParcelas(){
    var mesDestino = document.getElementById('antMesDestino').value;
    var html = '';

    antState.parcelas.forEach(function(p, idx){
      var disabled = '';
      var cls = '';
      var statusBadge = '';

      if(p.status === 'antecipada'){
        disabled = 'disabled';
        cls = 'antecipada';
        statusBadge = '<span class="ant-parc-status antecipada">Antecipada</span>';
      } else if(!mesDestino){
        // Ainda não escolheu o mês → tudo desabilitado
        disabled = 'disabled';
        cls = 'bloqueada';
        statusBadge = '<span class="ant-parc-status normal">Fatura: '+p.mesLabel+'</span>';
      } else if(!p.disponivel){
        // Parcela cai no mês destino ou antes → não pode antecipar
        disabled = 'disabled';
        cls = 'bloqueada';
        statusBadge = '<span class="ant-parc-status normal">Fatura: '+p.mesLabel+'</span>';
      } else {
        // Pode antecipar!
        cls = '';
        statusBadge = '<span class="ant-parc-status pendente">Fatura: '+p.mesLabel+'</span>';
      }

      html += '<div class="ant-parc-item '+cls+'">'+
        '<label>'+
          '<input type="checkbox" data-idx="'+idx+'" '+(p.selected?'checked':'')+' '+disabled+' onchange="antToggle('+idx+')">'+
          '<span class="ant-parc-info">'+
            '<span class="ant-parc-num">'+p.num+'/'+antState.parcelas.length+'</span>'+
            '<span class="ant-parc-mes">'+p.mesLabel+'</span>'+
            statusBadge+
          '</span>'+
        '</label>'+
        '<span class="ant-parc-val">'+fmtV(p.valor)+'</span>'+
      '</div>';
    });

    document.getElementById('antListaParcelas').innerHTML = html;
    atualizarResumo();
  }

  // ============================================
  // Toggle / Selecionar / Desmarcar
  // ============================================
  window.antToggle = function(idx){
    var p = antState.parcelas[idx];
    if(!p.disponivel || p.status==='antecipada') return;
    p.selected = !p.selected;
    atualizarResumo();
  };

  window.antSelecionarTodas = function(){
    antState.parcelas.forEach(function(p){
      if(p.disponivel && p.status!=='antecipada') p.selected=true;
    });
    renderListaParcelas();
  };

  window.antDesmarcarTodas = function(){
    antState.parcelas.forEach(function(p){ p.selected=false; });
    renderListaParcelas();
  };

  window.antSelecionarUltimas = function(){
    var n = prompt('Quantas últimas parcelas deseja antecipar?');
    if(!n) return;
    n = parseInt(n);
    if(isNaN(n) || n<1) return;

    antState.parcelas.forEach(function(p){ p.selected=false; });
    var disponiveis = antState.parcelas.filter(function(p){ return p.disponivel && p.status!=='antecipada'; });
    var start = Math.max(0, disponiveis.length - n);
    for(var i=start; i<disponiveis.length; i++){
      disponiveis[i].selected = true;
    }
    renderListaParcelas();
  };

  // ============================================
  // Resumo
  // ============================================
  function atualizarResumo(){
    var selecionadas = antState.parcelas.filter(function(p){return p.selected;});
    var total = selecionadas.reduce(function(acc,p){return acc+p.valor;},0);
    var resumoEl = document.getElementById('antResumo');
    if(selecionadas.length > 0){
      resumoEl.style.display = 'block';
      document.getElementById('antQtdSel').textContent = selecionadas.length;
      document.getElementById('antValorTotal').textContent = fmtV(total);
    } else {
      resumoEl.style.display = 'none';
    }
  }

  // ============================================
  // Confirmar
  // ============================================
  window.confirmarAntecipacao = function(){
    var selecionadas = antState.parcelas.filter(function(p){return p.selected;});
    if(selecionadas.length === 0){
      toast('Selecione pelo menos uma parcela para antecipar','error');
      return;
    }
    var mesDestino = document.getElementById('antMesDestino').value;
    if(!mesDestino){
      toast('Informe o mês da fatura de destino','error');
      return;
    }

    var total = selecionadas.reduce(function(acc,p){return acc+p.valor;},0);
    var nums = selecionadas.map(function(p){return p.num;});
    var mesDestinoLabel = nomeMes(parseInt(mesDestino.split('-')[0]),parseInt(mesDestino.split('-')[1]));

    var msgConfirm = 'Confirma a antecipação de ' + selecionadas.length + ' parcela(s) ' +
      'no valor total de ' + fmtV(total) + '?\n\n' +
      'Parcelas: ' + nums.join(', ') + '\n' +
      'Serão cobradas na fatura de ' + mesDestinoLabel + '.';

    if(!confirm(msgConfirm)) return;

    var idx = S.comprasCartao.findIndex(function(c){return c.id===antState.compraId;});
    if(idx < 0){toast('Compra não encontrada','error');return;}

    if(!S.comprasCartao[idx].antecipacoes){
      S.comprasCartao[idx].antecipacoes = [];
    }

    S.comprasCartao[idx].antecipacoes.push({
      id: 'ant_' + Date.now(),
      data: new Date().toISOString().slice(0,10),
      mesDestino: mesDestino,
      parcelasNums: nums,
      valorTotal: Math.round(total*100)/100,
      valorParcela: Math.round(selecionadas[0].valor*100)/100
    });

    save();
    fecharAntecipacao();
    renderCompras();
    toast('Antecipação registrada! ' + selecionadas.length + ' parcela(s) de ' + fmtV(total) + ' na fatura de ' + mesDestinoLabel, 'success');
  };

  window.fecharAntecipacao = function(){
    document.getElementById('modalAntecipacao').classList.remove('show');
  };

  // ============================================
  // Override renderCompras para adicionar botão ⚡ Antecipar
  // ============================================
  var _origRenderCompras = window.renderCompras;

  window.renderCompras = function(){
    _origRenderCompras();

    // --- Tabela desktop ---
    var tb = document.getElementById('tbCompras');
    if(tb){
      tb.querySelectorAll('tr').forEach(function(row){
        var lastTd = row.querySelector('td:last-child');
        if(!lastTd) return;
        var editBtn = lastTd.querySelector('[onclick*="editCompra"]');
        if(!editBtn) return;
        var match = editBtn.getAttribute('onclick').match(/editCompra\(['"](.+?)['"]\)/);
        if(!match) return;
        var compraId = match[1];
        var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
        if(!compra || (compra.parcelas||1) <= 1) return;

        // Verificar parcelas não antecipadas
        var parcelas = calcularParcelas(compra);
        var naoAntecipadas = parcelas.filter(function(p){return p.status!=='antecipada';});
        if(naoAntecipadas.length <= 1) return; // só 1 parcela normal restante, não faz sentido

        if(lastTd.querySelector('.btn-antecipar')) return;

        var btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-warning btn-antecipar';
        btn.innerHTML = '&#9889;';
        btn.title = 'Antecipar parcelas';
        btn.onclick = function(){ abrirAntecipacao(compraId); };
        lastTd.insertBefore(btn, lastTd.firstChild);

        // Badge de antecipações existentes
        if(compra.antecipacoes && compra.antecipacoes.length > 0){
          var totalAnt = compra.antecipacoes.reduce(function(a,b){return a+b.valorTotal;},0);
          var parcAnt = compra.antecipacoes.reduce(function(a,b){return a+(b.parcelasNums?b.parcelasNums.length:0);},0);
          var tds = row.querySelectorAll('td');
          if(tds.length >= 6){
            var parcTd = tds[5];
            if(!parcTd.querySelector('.badge-purple')){
              parcTd.innerHTML += ' <span class="badge badge-purple" title="'+parcAnt+' parcela(s) antecipada(s) - '+fmtV(totalAnt)+'">&#9889; '+parcAnt+' ant.</span>';
            }
          }
        }
      });
    }

    // --- Mobile cards ---
    var mobCards = document.getElementById('comprasMobCards');
    if(mobCards){
      mobCards.querySelectorAll('.mc').forEach(function(mc){
        var editBtn = mc.querySelector('[onclick*="editCompra"]');
        if(!editBtn) return;
        var match = editBtn.getAttribute('onclick').match(/editCompra\(['"](.+?)['"]\)/);
        if(!match) return;
        var compraId = match[1];
        var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
        if(!compra || (compra.parcelas||1) <= 1) return;
        var parcelas = calcularParcelas(compra);
        var naoAntecipadas = parcelas.filter(function(p){return p.status!=='antecipada';});
        if(naoAntecipadas.length <= 1) return;
        if(mc.querySelector('.btn-antecipar')) return;

        var acts = mc.querySelector('.mc-acts');
        if(!acts) return;
        var btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-warning btn-antecipar';
        btn.innerHTML = '&#9889; Antecipar';
        btn.onclick = function(){ abrirAntecipacao(compraId); };
        acts.insertBefore(btn, acts.firstChild);
      });
    }
  };

  // ============================================
  // Função global para consultar antecipações por fatura
  // ============================================
  window.getAntecipacoesFatura = function(cartaoId, mesAno){
    var total = 0, detalhes = [];
    S.comprasCartao.forEach(function(c){
      if(c.cartaoId !== cartaoId) return;
      if(!c.antecipacoes) return;
      c.antecipacoes.forEach(function(ant){
        if(ant.mesDestino === mesAno){
          total += ant.valorTotal;
          detalhes.push({desc:c.desc, parcelas:ant.parcelasNums.length, valor:ant.valorTotal});
        }
      });
    });
    return {total:total, detalhes:detalhes};
  };

  console.log('[Financeiro Pro] Módulo de antecipação v2 carregado.');
})();

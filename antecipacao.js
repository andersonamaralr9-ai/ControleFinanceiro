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
    .ant-parc-item label { display:flex; align-items:center; gap:8px; cursor:pointer; flex:1; }
    .ant-parc-item input[type=checkbox] { width:18px; height:18px; accent-color:var(--pri); cursor:pointer; }
    .ant-parc-info { flex:1; }
    .ant-parc-num { font-weight:700; color:var(--pri2); }
    .ant-parc-mes { font-size:.82em; color:var(--tx2); margin-left:6px; }
    .ant-parc-val { font-weight:700; color:var(--dn2); white-space:nowrap; }
    .ant-parc-status { font-size:.72em; padding:2px 8px; border-radius:10px; font-weight:600; margin-left:8px; }
    .ant-parc-status.paga { background:rgba(0,206,201,.15); color:var(--ok); }
    .ant-parc-status.pendente { background:rgba(253,203,110,.15); color:var(--wn); }
    .ant-parc-status.antecipada { background:rgba(108,92,231,.15); color:var(--pri2); }
    .ant-resumo { background:var(--bg3); border-radius:8px; padding:14px; margin:12px 0; }
    .ant-resumo p { font-size:.85em; color:var(--tx2); margin-bottom:4px; }
    .ant-resumo .ant-total { font-size:1.15em; font-weight:700; color:var(--ok); }
    .ant-select-bar { display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
    .ant-select-bar button { padding:5px 12px; font-size:.75em; }
    .ant-mes-destino { margin:12px 0; }
    .ant-mes-destino label { font-size:.8em; color:var(--tx2); font-weight:600; display:block; margin-bottom:4px; }
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
        <div class="ant-select-bar">
          <button class="btn btn-sm btn-outline" onclick="antSelecionarTodas()">Selecionar Todas</button>
          <button class="btn btn-sm btn-outline" onclick="antDesmarcarTodas()">Desmarcar Todas</button>
          <button class="btn btn-sm btn-outline" onclick="antSelecionarUltimas()">Últimas N parcelas...</button>
        </div>
        <div class="ant-modal-parcelas" id="antListaParcelas"></div>
        <div class="ant-mes-destino">
          <label>Mês da fatura onde as parcelas antecipadas vão cair:</label>
          <input type="month" id="antMesDestino" class="form-control" style="max-width:200px">
        </div>
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
    parcelas: [] // {num, mesAno, valor, status:'paga'|'pendente'|'antecipada', selected}
  };

  // ============================================
  // Helper: nome do mês
  // ============================================
  function nomeMes(y,m){
    var d=new Date(y,m-1,1);
    return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  }

  // ============================================
  // Helper: mês seguinte
  // ============================================
  function mesSeguinte(y,m){
    m++;
    if(m>12){m=1;y++;}
    return {y:y,m:m};
  }

  // ============================================
  // Determinar em qual fatura cada parcela cai
  // Lógica: se a data da compra é antes do fechamento → cai na fatura daquele mês
  //         se é depois → cai na fatura do mês seguinte
  //         parcela 2 = +1 mês, etc.
  // ============================================
  function calcularParcelas(compra){
    var cart = S.cartoes.find(function(c){return c.id===compra.cartaoId;});
    var fechamento = cart ? (Number(cart.fechamento)||1) : 1;
    var dataCompra = new Date(compra.data+'T12:00:00');
    var diaCompra = dataCompra.getDate();
    var mesCompra = dataCompra.getMonth()+1;
    var anoCompra = dataCompra.getFullYear();

    // Se compra foi depois do fechamento, primeira parcela vai pro mês seguinte
    var mesBase, anoBase;
    if(diaCompra > fechamento){
      var ns = mesSeguinte(anoCompra, mesCompra);
      anoBase = ns.y; mesBase = ns.m;
    } else {
      anoBase = anoCompra; mesBase = mesCompra;
    }

    var totalParc = compra.parcelas || 1;
    var valorParc = (Number(compra.valor)||0) / totalParc;
    var hoje = new Date();
    var mesAtual = hoje.getFullYear()*100 + (hoje.getMonth()+1);

    // Verificar antecipações já feitas
    var antecipacoes = compra.antecipacoes || [];

    var resultado = [];
    var y = anoBase, m = mesBase;
    for(var i=1; i<=totalParc; i++){
      var mesKey = y*100+m;
      var status = 'pendente';

      // Verificar se já foi antecipada
      var foiAntecipada = antecipacoes.some(function(a){
        return a.parcelasNums && a.parcelasNums.indexOf(i) >= 0;
      });

      if(foiAntecipada){
        status = 'antecipada';
      } else if(mesKey <= mesAtual){
        status = 'paga';
      }

      resultado.push({
        num: i,
        mesAno: y+'-'+(m<10?'0':'')+m,
        mesLabel: nomeMes(y,m),
        valor: valorParc,
        status: status,
        selected: false
      });
      var ns = mesSeguinte(y,m);
      y=ns.y; m=ns.m;
    }
    return resultado;
  }

  // ============================================
  // Abrir modal de antecipação
  // ============================================
  window.abrirAntecipacao = function(compraId){
    var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
    if(!compra){toast('Compra não encontrada','error');return;}

    antState.compraId = compraId;
    antState.compra = compra;
    antState.parcelas = calcularParcelas(compra);

    // Info da compra
    var cart = S.cartoes.find(function(c){return c.id===compra.cartaoId;});
    var valorParc = (Number(compra.valor)||0) / (compra.parcelas||1);
    document.getElementById('antCompraInfo').innerHTML =
      '<p style="font-size:.9em;color:var(--tx2);margin-bottom:4px"><strong style="color:var(--tx)">'+compra.desc+'</strong></p>'+
      '<p style="font-size:.82em;color:var(--tx3)">Cartão: '+(cart?cart.nome:'-')+' &bull; Total: '+fmtV(compra.valor)+' &bull; '+compra.parcelas+'x de '+fmtV(valorParc)+'</p>';

    // Mês destino padrão = mês atual
    var agora = new Date();
    document.getElementById('antMesDestino').value = agora.getFullYear()+'-'+(agora.getMonth()+1<10?'0':'')+(agora.getMonth()+1);

    renderListaParcelas();
    document.getElementById('modalAntecipacao').classList.add('show');
  };

  // ============================================
  // Renderizar lista de parcelas
  // ============================================
  function renderListaParcelas(){
    var html = '';
    antState.parcelas.forEach(function(p, idx){
      var disabled = (p.status==='paga' || p.status==='antecipada') ? 'disabled' : '';
      var cls = p.status==='paga' ? 'ja-paga' : (p.status==='antecipada' ? 'antecipada' : '');
      var statusBadge = '';
      if(p.status==='paga') statusBadge='<span class="ant-parc-status paga">Paga</span>';
      else if(p.status==='antecipada') statusBadge='<span class="ant-parc-status antecipada">Antecipada</span>';
      else statusBadge='<span class="ant-parc-status pendente">Pendente</span>';

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
  // Toggle parcela
  // ============================================
  window.antToggle = function(idx){
    var p = antState.parcelas[idx];
    if(p.status==='paga' || p.status==='antecipada') return;
    p.selected = !p.selected;
    atualizarResumo();
  };

  // ============================================
  // Selecionar todas pendentes
  // ============================================
  window.antSelecionarTodas = function(){
    antState.parcelas.forEach(function(p){
      if(p.status==='pendente') p.selected=true;
    });
    renderListaParcelas();
  };

  // ============================================
  // Desmarcar todas
  // ============================================
  window.antDesmarcarTodas = function(){
    antState.parcelas.forEach(function(p){ p.selected=false; });
    renderListaParcelas();
  };

  // ============================================
  // Selecionar últimas N parcelas
  // ============================================
  window.antSelecionarUltimas = function(){
    var n = prompt('Quantas últimas parcelas deseja antecipar?');
    if(!n) return;
    n = parseInt(n);
    if(isNaN(n) || n<1) return;

    // Pegar as pendentes de trás pra frente
    antState.parcelas.forEach(function(p){ p.selected=false; });
    var pendentes = antState.parcelas.filter(function(p){ return p.status==='pendente'; });
    var start = Math.max(0, pendentes.length - n);
    for(var i=start; i<pendentes.length; i++){
      pendentes[i].selected = true;
    }
    renderListaParcelas();
  };

  // ============================================
  // Atualizar resumo
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
  // Confirmar antecipação
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

    var msgConfirm = 'Confirma a antecipação de ' + selecionadas.length + ' parcela(s) ' +
      'no valor total de ' + fmtV(total) + '?\n\n' +
      'As parcelas serão registradas na fatura de ' + mesDestino + '.';

    if(!confirm(msgConfirm)) return;

    // Encontrar a compra no array
    var idx = S.comprasCartao.findIndex(function(c){return c.id===antState.compraId;});
    if(idx < 0){toast('Compra não encontrada','error');return;}

    // Inicializar array de antecipações se não existir
    if(!S.comprasCartao[idx].antecipacoes){
      S.comprasCartao[idx].antecipacoes = [];
    }

    // Registrar a antecipação
    var antecipacao = {
      id: 'ant_' + Date.now(),
      data: new Date().toISOString().slice(0,10),
      mesDestino: mesDestino,
      parcelasNums: nums,
      valorTotal: Math.round(total*100)/100,
      valorParcela: Math.round(selecionadas[0].valor*100)/100
    };
    S.comprasCartao[idx].antecipacoes.push(antecipacao);

    // Salvar
    save();

    // Fechar modal e re-renderizar
    fecharAntecipacao();
    renderCompras();
    toast('Antecipação de ' + selecionadas.length + ' parcela(s) registrada com sucesso! Total: ' + fmtV(total), 'success');
  };

  // ============================================
  // Fechar modal
  // ============================================
  window.fecharAntecipacao = function(){
    document.getElementById('modalAntecipacao').classList.remove('show');
  };

  // ============================================
  // Adicionar botão "Antecipar" na tabela de compras
  // Override renderCompras para incluir o botão
  // ============================================
  var _origRenderCompras = window.renderCompras;

  window.renderCompras = function(){
    _origRenderCompras();

    // Adicionar botão de antecipar em cada linha da tabela
    var tb = document.getElementById('tbCompras');
    if(!tb) return;
    var rows = tb.querySelectorAll('tr');
    rows.forEach(function(row){
      var lastTd = row.querySelector('td:last-child');
      if(!lastTd) return;

      // Extrair o ID da compra do onclick existente
      var editBtn = lastTd.querySelector('[onclick*="editCompra"]');
      if(!editBtn) return;
      var match = editBtn.getAttribute('onclick').match(/editCompra\(['"](.+?)['"]\)/);
      if(!match) return;
      var compraId = match[1];

      // Verificar se a compra tem mais de 1 parcela
      var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
      if(!compra || (compra.parcelas||1) <= 1) return;

      // Verificar se ainda tem parcelas pendentes
      var parcelas = calcularParcelas(compra);
      var pendentes = parcelas.filter(function(p){return p.status==='pendente';});
      if(pendentes.length === 0) return;

      // Verificar se já tem o botão
      if(lastTd.querySelector('.btn-antecipar')) return;

      var btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-warning btn-antecipar';
      btn.innerHTML = '&#9889;';
      btn.title = 'Antecipar parcelas ('+pendentes.length+' pendentes)';
      btn.onclick = function(){ abrirAntecipacao(compraId); };
      lastTd.insertBefore(btn, lastTd.firstChild);
    });

    // Também atualizar os mobile cards (se existirem)
    var mobCards = document.getElementById('comprasMobCards');
    if(mobCards){
      var mcs = mobCards.querySelectorAll('.mc');
      mcs.forEach(function(mc){
        var editBtn = mc.querySelector('[onclick*="editCompra"]');
        if(!editBtn) return;
        var match = editBtn.getAttribute('onclick').match(/editCompra\(['"](.+?)['"]\)/);
        if(!match) return;
        var compraId = match[1];
        var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
        if(!compra || (compra.parcelas||1) <= 1) return;
        var parcelas = calcularParcelas(compra);
        var pendentes = parcelas.filter(function(p){return p.status==='pendente';});
        if(pendentes.length === 0) return;
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
  // Integrar antecipações no cálculo da fatura
  // Override a função que calcula o total da fatura por mês
  // para incluir as parcelas antecipadas
  // ============================================

  // Função auxiliar global para consultar antecipações de um cartão em um mês
  window.getAntecipacoesFatura = function(cartaoId, mesAno){
    // mesAno formato "YYYY-MM"
    var total = 0;
    var detalhes = [];
    S.comprasCartao.forEach(function(c){
      if(c.cartaoId !== cartaoId) return;
      if(!c.antecipacoes) return;
      c.antecipacoes.forEach(function(ant){
        if(ant.mesDestino === mesAno){
          total += ant.valorTotal;
          detalhes.push({
            desc: c.desc,
            parcelas: ant.parcelasNums.length + ' parcela(s)',
            valor: ant.valorTotal
          });
        }
      });
    });
    return {total: total, detalhes: detalhes};
  };

  // ============================================
  // Exibir info de antecipações na tabela
  // ============================================
  // Adicionar coluna visual com ícone nas compras que têm antecipações
  var _origRenderCompras2 = window.renderCompras;
  window.renderCompras = function(){
    _origRenderCompras2();

    // Marcar visualmente as compras com antecipações
    var tb = document.getElementById('tbCompras');
    if(!tb) return;
    var rows = tb.querySelectorAll('tr');
    rows.forEach(function(row){
      var editBtn = row.querySelector('[onclick*="editCompra"]');
      if(!editBtn) return;
      var match = editBtn.getAttribute('onclick').match(/editCompra\(['"](.+?)['"]\)/);
      if(!match) return;
      var compraId = match[1];
      var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
      if(!compra || !compra.antecipacoes || compra.antecipacoes.length===0) return;

      // Calcular total já antecipado
      var totalAnt = compra.antecipacoes.reduce(function(a,b){return a+b.valorTotal;},0);
      var parcAnt = compra.antecipacoes.reduce(function(a,b){return a+(b.parcelasNums?b.parcelasNums.length:0);},0);

      // Adicionar badge na coluna de parcelas
      var tds = row.querySelectorAll('td');
      if(tds.length >= 6){
        var parcTd = tds[5]; // coluna Parcelas
        if(!parcTd.querySelector('.badge-purple')){
          parcTd.innerHTML += ' <span class="badge badge-purple" title="'+parcAnt+' parcela(s) antecipada(s) - '+fmtV(totalAnt)+'">&#9889; '+parcAnt+' ant.</span>';
        }
      }
    });
  };

  console.log('[Financeiro Pro] Módulo de antecipação de parcelas carregado.');
})();

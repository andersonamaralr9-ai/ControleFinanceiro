// antecipacao.js v3 — Antecipação de parcelas + Correção dos cálculos de fatura/extrato/resumo
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
  modalDiv.innerHTML =
    '<div class="modal-content" style="max-width:520px">' +
      '<div class="modal-header">' +
        '<h3>&#9889; Antecipar Parcelas</h3>' +
        '<span class="modal-close" onclick="fecharAntecipacao()">&times;</span>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div id="antCompraInfo"></div>' +
        '<div class="ant-mes-destino">' +
          '<label>&#128197; Em qual fatura voc\u00ea vai pagar as parcelas antecipadas?</label>' +
          '<input type="month" id="antMesDestino" class="form-control" style="max-width:200px" onchange="antAtualizarDisponibilidade()">' +
          '<p class="ant-help">Exemplo: se escolher Junho/2026, s\u00f3 as parcelas de Julho/2026 em diante poder\u00e3o ser antecipadas.</p>' +
        '</div>' +
        '<div id="antAvisoArea"></div>' +
        '<div class="ant-select-bar" id="antSelectBar" style="display:none">' +
          '<button class="btn btn-sm btn-outline" onclick="antSelecionarTodas()">Selecionar Todas</button>' +
          '<button class="btn btn-sm btn-outline" onclick="antDesmarcarTodas()">Desmarcar Todas</button>' +
          '<button class="btn btn-sm btn-outline" onclick="antSelecionarUltimas()">\u00daltimas N parcelas...</button>' +
        '</div>' +
        '<div class="ant-modal-parcelas" id="antListaParcelas"></div>' +
        '<div class="ant-resumo" id="antResumo" style="display:none">' +
          '<p>Parcelas selecionadas: <strong id="antQtdSel">0</strong></p>' +
          '<p>Valor total antecipado: <span class="ant-total" id="antValorTotal">R$ 0,00</span></p>' +
        '</div>' +
        '<button class="btn btn-primary" onclick="confirmarAntecipacao()" style="width:100%;margin-top:12px">' +
          'Confirmar Antecipa\u00e7\u00e3o' +
        '</button>' +
      '</div>' +
    '</div>';
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
  // Helpers internos
  // ============================================
  function nomeMes(y,m){
    return new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  }
  function mesSeguinte(y,m){
    m++; if(m>12){m=1;y++;} return {y:y,m:m};
  }
  function mesParaNum(mesAno){
    var p=mesAno.split('-'); return parseInt(p[0])*100+parseInt(p[1]);
  }

  // ============================================
  // HELPER GLOBAL: Verificar se uma parcela foi antecipada
  // Retorna mesDestino se sim, null se não
  // ============================================
  function getAntecipacaoDestino(compra, parcelaNum){
    if(!compra.antecipacoes) return null;
    for(var a = 0; a < compra.antecipacoes.length; a++){
      var ant = compra.antecipacoes[a];
      if(ant.parcelasNums && ant.parcelasNums.indexOf(parcelaNum) >= 0){
        return ant.mesDestino;
      }
    }
    return null;
  }
  // Expor globalmente para outros scripts que precisem
  window._getAntecipacaoDestino = getAntecipacaoDestino;

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
      var status = 'normal';
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
        disponivel: false,
        selected: false
      });
      var ns2 = mesSeguinte(y,m);
      y=ns2.y; m=ns2.m;
    }
    return resultado;
  }

  // ============================================
  // Atualizar disponibilidade com base no mês destino
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
        p.disponivel = false;
      } else if(p.mesNum > mesDestinoNum){
        p.disponivel = true;
        temDisponivel = true;
      } else {
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
      avisoArea.innerHTML = '<div class="ant-aviso">Nenhuma parcela dispon\u00edvel para antecipar nesta fatura. Escolha um m\u00eas anterior.</div>';
      document.getElementById('antSelectBar').style.display='none';
    }

    renderListaParcelas();
  };

  // ============================================
  // Abrir modal
  // ============================================
  window.abrirAntecipacao = function(compraId){
    var compra = S.comprasCartao.find(function(c){return c.id===compraId;});
    if(!compra){toast('Compra n\u00e3o encontrada','error');return;}

    antState.compraId = compraId;
    antState.compra = compra;
    antState.parcelas = calcularParcelas(compra);

    var cart = S.cartoes.find(function(c){return c.id===compra.cartaoId;});
    var valorParc = (Number(compra.valor)||0) / (compra.parcelas||1);
    document.getElementById('antCompraInfo').innerHTML =
      '<p style="font-size:.9em;color:var(--tx2);margin-bottom:4px"><strong style="color:var(--tx)">'+compra.desc+'</strong></p>'+
      '<p style="font-size:.82em;color:var(--tx3)">Cart\u00e3o: '+(cart?cart.nome:'-')+' &bull; Total: '+fmtV(compra.valor)+' &bull; '+compra.parcelas+'x de '+fmtV(valorParc)+'</p>';

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
        disabled = 'disabled';
        cls = 'bloqueada';
        statusBadge = '<span class="ant-parc-status normal">Fatura: '+p.mesLabel+'</span>';
      } else if(!p.disponivel){
        disabled = 'disabled';
        cls = 'bloqueada';
        statusBadge = '<span class="ant-parc-status normal">Fatura: '+p.mesLabel+'</span>';
      } else {
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
    var n = prompt('Quantas \u00faltimas parcelas deseja antecipar?');
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
  // Confirmar — CORRIGIDO: usa salvar() em vez de save()
  // ============================================
  window.confirmarAntecipacao = function(){
    var selecionadas = antState.parcelas.filter(function(p){return p.selected;});
    if(selecionadas.length === 0){
      toast('Selecione pelo menos uma parcela para antecipar','error');
      return;
    }
    var mesDestino = document.getElementById('antMesDestino').value;
    if(!mesDestino){
      toast('Informe o m\u00eas da fatura de destino','error');
      return;
    }

    var total = selecionadas.reduce(function(acc,p){return acc+p.valor;},0);
    var nums = selecionadas.map(function(p){return p.num;});
    var mesDestinoLabel = nomeMes(parseInt(mesDestino.split('-')[0]),parseInt(mesDestino.split('-')[1]));

    var msgConfirm = 'Confirma a antecipa\u00e7\u00e3o de ' + selecionadas.length + ' parcela(s) ' +
      'no valor total de ' + fmtV(total) + '?\n\n' +
      'Parcelas: ' + nums.join(', ') + '\n' +
      'Ser\u00e3o cobradas na fatura de ' + mesDestinoLabel + '.';

    if(!confirm(msgConfirm)) return;

    var idx = S.comprasCartao.findIndex(function(c){return c.id===antState.compraId;});
    if(idx < 0){toast('Compra n\u00e3o encontrada','error');return;}

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

    // ★ FIX: era save() que não existia — agora usa salvar()
    salvar();

    fecharAntecipacao();
    renderCompras();
    if(typeof renderCartoes === 'function') renderCartoes();
    if(typeof renderResumo === 'function') renderResumo();
    toast('Antecipa\u00e7\u00e3o registrada! ' + selecionadas.length + ' parcela(s) de ' + fmtV(total) + ' na fatura de ' + mesDestinoLabel, 'success');
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
        var parcelas = calcularParcelas(compra);
        var naoAntecipadas = parcelas.filter(function(p){return p.status!=='antecipada';});
        if(naoAntecipadas.length <= 1) return;
        if(lastTd.querySelector('.btn-antecipar')) return;

        var btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-warning btn-antecipar';
        btn.innerHTML = '&#9889;';
        btn.title = 'Antecipar parcelas';
        btn.onclick = function(){ abrirAntecipacao(compraId); };
        lastTd.insertBefore(btn, lastTd.firstChild);

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

  // ============================================================
  // ★★★ CORREÇÃO: OVERRIDE allEntries — respeitar antecipações
  // ============================================================
  window.allEntries = function(mes){
    var E = [];
    var _arr = function(v){ return Array.isArray(v) ? v : []; };

    // — Lançamentos manuais (sem alteração) —
    S.lancamentos.filter(function(l){ return getMes(l.data) === mes; }).forEach(function(l){
      E.push({
        tipo:l.tipo, desc:l.desc, cat:l.categoria||l.cat||'Outros',
        valor:Number(l.valor)||0, data:l.data, obs:l.obs||'',
        origem:'Lan\u00e7amento', id:l.id, isManual:true
      });
    });

    // — Compras no cartão COM antecipação —
    S.comprasCartao.forEach(function(c){
      var p = c.parcelas||1, mC = getMes(c.data);
      var vp = (Number(c.valor)||0)/p;

      for(var i=0; i<p; i++){
        var parcelaNum = i+1;
        var mesOriginal = addMes(mC, i);
        var mesDestino = getAntecipacaoDestino(c, parcelaNum);
        var mesEfetivo = mesDestino || mesOriginal;

        if(mesEfetivo === mes){
          var cart = S.cartoes.find(function(x){return x.id===c.cartaoId;});
          var descExtra = mesDestino ? ' [Antecipada]' : '';
          E.push({
            tipo:'despesa',
            desc:c.desc+' ('+(parcelaNum)+'/'+p+')'+descExtra,
            cat:c.categoria||c.cat||'Cart\u00e3o de Cr\u00e9dito',
            valor:vp, data:mes+'-15', obs:'',
            origem:'Cart\u00e3o'+(cart?' '+cart.nome:''),
            isManual:false, isCC:true
          });
        }
      }
    });

    // — Assinaturas (sem alteração) —
    S.assinaturas.forEach(function(s){
      var inicio=(s.inicio||'').substring(0,7);
      var hist=_arr(s.historico);
      if(hist.length&&!inicio) inicio=(hist[0].de||hist[0].desde||'').substring(0,7);
      if(!inicio||mes<inicio) return;
      if(s.encerradaEm&&mes>s.encerradaEm) return;
      var val=Number(s.valor)||0;
      for(var h=0;h<hist.length;h++){
        var hd=(hist[h].de||hist[h].desde||'').substring(0,7);
        if(hd&&mes>=hd) val=Number(hist[h].valor)||0;
      }
      var cart=S.cartoes.find(function(x){return x.id===s.cartaoId;});
      E.push({
        tipo:'despesa', desc:s.nome+' (Assinatura)',
        cat:s.categoria||s.cat||'Assinaturas',
        valor:val, data:mes+'-15', obs:'',
        origem:'Assinatura'+(cart?' '+cart.nome:''),
        isManual:false, isCC:true
      });
    });

    // — Contratos (sem alteração) —
    S.contratos.forEach(function(c){
      var inicio=(c.inicio||'').substring(0,7);
      var hist=_arr(c.historico);
      if(hist.length&&!inicio) inicio=(hist[0].de||hist[0].desde||'').substring(0,7);
      if(!inicio||mes<inicio) return;
      if(c.encerradoEm&&mes>c.encerradoEm) return;
      var val=Number(c.valor)||0;
      for(var h=0;h<hist.length;h++){
        var hd=(hist[h].de||hist[h].desde||'').substring(0,7);
        if(hd&&mes>=hd) val=Number(hist[h].valor)||0;
      }
      var dia=c.dia?String(c.dia).padStart(2,'0'):'01';
      E.push({
        tipo:c.tipo||'despesa', desc:c.desc+' (Contrato)',
        cat:c.categoria||c.cat||'Outros',
        valor:val, data:mes+'-'+dia, obs:c.obs||'',
        origem:'Contrato', isManual:false, isCC:false
      });
    });

    return E;
  };

  // ============================================================
  // ★★★ CORREÇÃO: OVERRIDE faturaCC — respeitar antecipações
  // ============================================================
  window.faturaCC = function(mes){
    var itens = [];
    var _arr = function(v){ return Array.isArray(v) ? v : []; };

    S.comprasCartao.forEach(function(c){
      var p = c.parcelas||1, mC = getMes(c.data);
      var vp = (Number(c.valor)||0)/p;

      for(var i=0; i<p; i++){
        var parcelaNum = i+1;
        var mesOriginal = addMes(mC, i);
        var mesDestino = getAntecipacaoDestino(c, parcelaNum);
        var mesEfetivo = mesDestino || mesOriginal;

        if(mesEfetivo === mes){
          var cart = S.cartoes.find(function(x){return x.id===c.cartaoId;});
          var descSuffix = mesDestino ? ' [Antecipada de '+mesNome(mesOriginal)+']' : '';
          itens.push({
            desc:c.desc+' ('+(parcelaNum)+'/'+p+')'+descSuffix,
            cat:c.categoria||'', valor:vp,
            cartao:cart?cart.nome:'',
            tipo:mesDestino?'Antecipada':'Parcela',
            cartaoId:c.cartaoId
          });
        }
      }
    });

    S.assinaturas.forEach(function(s){
      var inicio=(s.inicio||'').substring(0,7);
      var hist=_arr(s.historico);
      if(hist.length&&!inicio) inicio=(hist[0].de||hist[0].desde||'').substring(0,7);
      if(!inicio||mes<inicio) return;
      if(s.encerradaEm&&mes>s.encerradaEm) return;
      var val=Number(s.valor)||0;
      for(var h=0;h<hist.length;h++){
        var hd=(hist[h].de||hist[h].desde||'').substring(0,7);
        if(hd&&mes>=hd) val=Number(hist[h].valor)||0;
      }
      var cart=S.cartoes.find(function(x){return x.id===s.cartaoId;});
      itens.push({
        desc:s.nome, cat:s.categoria||'', valor:val,
        cartao:cart?cart.nome:'', tipo:'Assinatura',
        cartaoId:s.cartaoId
      });
    });

    return itens;
  };

  // ============================================================
  // ★★★ CORREÇÃO: OVERRIDE calcFaturaAtual — respeitar antecipações
  // ============================================================
  window.calcFaturaAtual = function(cid){
    var total = 0;
    var ma = mesAtual();

    S.comprasCartao.filter(function(c){return c.cartaoId===cid;}).forEach(function(c){
      var p = c.parcelas||1, mC = getMes(c.data);
      var vp = (Number(c.valor)||0)/p;
      for(var i=0; i<p; i++){
        var parcelaNum = i+1;
        var mesOriginal = addMes(mC, i);
        var mesDestino = getAntecipacaoDestino(c, parcelaNum);
        var mesEfetivo = mesDestino || mesOriginal;
        if(mesEfetivo === ma) total += vp;
      }
    });

    S.assinaturas.filter(function(s){
      return s.cartaoId===cid && !s.encerradaEm;
    }).forEach(function(s){
      var inicio=(s.inicio||'').substring(0,7);
      if(inicio && ma<inicio) return;
      var val=Number(s.valor)||0;
      var hist=Array.isArray(s.historico)?s.historico:[];
      for(var h=0;h<hist.length;h++){
        var hd=(hist[h].de||hist[h].desde||'').substring(0,7);
        if(hd&&ma>=hd) val=Number(hist[h].valor)||0;
      }
      total += val;
    });

    return total;
  };

  // ============================================================
  // ★★★ CORREÇÃO: OVERRIDE calcSaldoDevedor — respeitar antecipações
  // ============================================================
  window.calcSaldoDevedor = function(cid){
    var total = 0;
    var ma = mesAtual();

    S.comprasCartao.filter(function(c){return c.cartaoId===cid;}).forEach(function(c){
      var p = c.parcelas||1, mC = getMes(c.data);
      var vp = (Number(c.valor)||0)/p;
      for(var i=0; i<p; i++){
        var parcelaNum = i+1;
        var mesOriginal = addMes(mC, i);
        var mesDestino = getAntecipacaoDestino(c, parcelaNum);
        var mesEfetivo = mesDestino || mesOriginal;
        if(mesEfetivo >= ma) total += vp;
      }
    });

    return total;
  };

  // ============================================================
  // ★★★ CORREÇÃO: OVERRIDE calcUsado — usar novo calcSaldoDevedor
  // ============================================================
  window.calcUsado = function(cid){
    var assinaturas = 0;
    var ma = mesAtual();
    S.assinaturas.filter(function(s){
      return s.cartaoId===cid && !s.encerradaEm;
    }).forEach(function(s){
      var inicio=(s.inicio||'').substring(0,7);
      if(inicio && ma<inicio) return;
      var val=Number(s.valor)||0;
      var hist=Array.isArray(s.historico)?s.historico:[];
      for(var h=0;h<hist.length;h++){
        var hd=(hist[h].de||hist[h].desde||'').substring(0,7);
        if(hd&&ma>=hd) val=Number(hist[h].valor)||0;
      }
      assinaturas += val;
    });
    return calcSaldoDevedor(cid) + assinaturas;
  };

  console.log('[Financeiro Pro] Antecipa\u00e7\u00e3o v3 — save fix + allEntries/faturaCC/calcFatura respeitam antecipa\u00e7\u00f5es.');
})();

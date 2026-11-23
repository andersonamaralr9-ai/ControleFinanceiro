// lanc-rapido.js - Novo lancamento mais rapido (nov/2026)
// ---------------------------------------------------------------
// Mexe so no #modalNovoLanc (o HTML do modal esta no index.html):
//  - Despesa/Receita em dois botoes (o <select id="lTipo"> continua, oculto,
//    porque updLCats e addLanc leem dele);
//  - valor em destaque e com foco ao abrir;
//  - as 6 categorias mais usadas do tipo (ultimos 120 dias) viram chips;
//  - descricoes ja usadas aparecem como sugestao e, ao escolher uma, a
//    categoria usada da ultima vez e marcada sozinha;
//  - Hoje/Ontem em chips;
//  - validacao com aviso no campo (em vez do alert) e Desfazer apos salvar.
(function(){
  function g(id){ return document.getElementById(id); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function isoDe(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function hoje(){ return typeof hojeStr === 'function' ? hojeStr() : isoDe(new Date()); }
  function ontem(){ var d = new Date(); d.setDate(d.getDate() - 1); return isoDe(d); }
  function tipoAtual(){ return (g('lTipo') && g('lTipo').value) || 'despesa'; }
  function lancs(){ return (typeof S !== 'undefined' && S && Array.isArray(S.lancamentos)) ? S.lancamentos : []; }

  // Categorias mais usadas do tipo, so entre as que ainda existem.
  function maisUsadas(tipo){
    var validas = typeof getCats === 'function' ? getCats(tipo) : [];
    var limite = new Date(); limite.setDate(limite.getDate() - 120); limite = isoDe(limite);
    var cont = {};
    lancs().forEach(function(l){
      if(l.tipo !== tipo || !l.categoria || (l.data || '') < limite) return;
      cont[l.categoria] = (cont[l.categoria] || 0) + 1;
    });
    var top = Object.keys(cont).filter(function(c){ return validas.indexOf(c) >= 0; })
      .sort(function(a, b){ return cont[b] - cont[a]; }).slice(0, 6);
    // Sem historico: as primeiras categorias cadastradas.
    validas.forEach(function(c){ if(top.length < 6 && top.indexOf(c) < 0) top.push(c); });
    return top;
  }

  // Ultima categoria usada para cada descricao do tipo (mais recente vence).
  function ultimoPorDesc(tipo){
    var m = {};
    lancs().slice().sort(function(a, b){ return (a.data || '').localeCompare(b.data || ''); }).forEach(function(l){
      if(l.tipo === tipo && l.desc) m[l.desc.trim().toLowerCase()] = { desc: l.desc.trim(), cat: l.categoria, data: l.data || '' };
    });
    return m;
  }

  function renderTipo(){
    var t = tipoAtual();
    document.querySelectorAll('#modalNovoLanc .lr-tp').forEach(function(b){
      var on = b.getAttribute('data-t') === t;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    var m = g('modalNovoLanc'); if(m) m.classList.toggle('lr-receita', t === 'receita');
  }
  function renderCats(){
    var box = g('lrCats'), sel = g('lCat'); if(!box || !sel) return;
    box.innerHTML = maisUsadas(tipoAtual()).map(function(c){
      var on = sel.value === c;
      return '<button type="button" class="lr-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
  }
  function renderDatas(){
    var box = g('lrDatas'), inp = g('lData'); if(!box || !inp) return;
    var v = inp.value;
    box.innerHTML = [['Hoje', hoje()], ['Ontem', ontem()]].map(function(p){
      var on = v === p[1];
      return '<button type="button" class="lr-chip' + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-data="' + p[1] + '">' + p[0] + '</button>';
    }).join('');
  }
  function renderSugestoes(){
    var dl = g('lrSugDesc'); if(!dl) return;
    var m = ultimoPorDesc(tipoAtual());
    dl.innerHTML = Object.keys(m).map(function(k){ return m[k]; })
      .sort(function(a, b){ return b.data.localeCompare(a.data); }).slice(0, 40)
      .map(function(x){ return '<option value="' + esc(x.desc) + '"></option>'; }).join('');
  }
  function categoriaPadrao(){
    var top = maisUsadas(tipoAtual()), sel = g('lCat');
    if(sel && top.length && Array.prototype.some.call(sel.options, function(o){ return o.value === top[0]; })) sel.value = top[0];
  }
  function renderTudo(){ renderTipo(); renderCats(); renderDatas(); renderSugestoes(); }

  function trocarTipo(t){
    if(!g('lTipo') || tipoAtual() === t) return;
    g('lTipo').value = t;
    if(typeof updLCats === 'function') updLCats();
    categoriaPadrao(); renderTudo();
    if(g('lDesc').value.trim()) aplicarPalpite();
  }

  function aviso(campo, msg){
    var el = g(campo); if(!el) return;
    el.classList.add('lr-erro'); el.setAttribute('aria-invalid', 'true');
    el.focus();
    if(typeof toast === 'function') toast(msg, 'error');
    var limpa = function(){ el.classList.remove('lr-erro'); el.removeAttribute('aria-invalid'); el.removeEventListener('input', limpa); };
    el.addEventListener('input', limpa);
  }

  // ---------------------------------------------------------------
  // PREVISAO DE CATEGORIA (nov/2026)
  // Olha os lancamentos e as compras de cartao antigos: descricao igual
  // pesa muito; palavras em comum (sem acento, sem "de/da/do", e o comeco
  // de palavra enquanto digita: "cort" acha "corte") pesam pelo que
  // cobrem da descricao. Uso recente (6 meses) pesa mais. Sem historico,
  // um dicionario pequeno cobre o obvio (almoco -> Alimentacao).
  // Marca a categoria sozinha so enquanto o usuario nao escolheu uma; a
  // correcao dele vira historico e ensina a proxima previsao.
  // ---------------------------------------------------------------
  var catManual = false, lrPalpiteAtivo = false;
  var PARADAS = ['de','da','do','das','dos','com','para','pra','por','em','no','na','nos','nas','um','uma','the','and','ltda','mes','pgto','pag','pagamento','compra'];
  var DICIONARIO = [
    [/\b(almoco|jantar|lanche|restaurante|ifood|padaria|mercado|supermercado|acougue|feira|cafe|pizza|hamburg|refeicao)/, /alimenta|mercado|refei/],
    [/\b(uber|99|taxi|onibus|metro|gasolina|combustivel|etanol|posto|estacionamento|pedagio)/, /transporte|carro|veic|combust/],
    [/\b(farmacia|remedio|medic|consulta|exame|dentista|hospital|plano de saude|unimed)/, /saude|farm/],
    [/\b(aluguel|condominio|luz|energia|agua|gas|internet|iptu)\b/, /moradia|casa|conta/],
    [/\b(netflix|spotify|cinema|show|ingresso|viagem|hotel)/, /lazer|entret|viag/],
    [/\b(escola|faculdade|curso|livro|mensalidade)/, /educa/],
    [/\b(salario|holerite|folha)/, /salario/]
  ];
  function norm(t){ return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\d+\s*\/\s*\d+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function palavras(t){ return norm(t).split(' ').filter(function(w){ return w.length >= 3 && PARADAS.indexOf(w) < 0 && !/^\d+$/.test(w); }); }
  function historico(tipo){
    var h = lancs().filter(function(l){ return l.tipo === tipo; });
    if(tipo === 'despesa' && typeof S !== 'undefined' && S && Array.isArray(S.comprasCartao)) h = h.concat(S.comprasCartao);
    return h;
  }
  function preverCategoria(desc, tipo){
    var alvo = norm(desc), pw = palavras(desc);
    if(alvo.length < 3) return null;
    var validas = typeof getCats === 'function' ? getCats(tipo) : [];
    var lim = new Date(); lim.setDate(lim.getDate() - 180); lim = isoDe(lim);
    var pontos = {}, vezes = {}, exemplo = {};
    historico(tipo).forEach(function(l){
      if(!l.categoria || validas.indexOf(l.categoria) < 0 || !l.desc) return;
      var d = norm(l.desc), p = 0;
      if(d === alvo) p = 10;
      else if(pw.length){
        var hw = palavras(l.desc), achou = 0;
        pw.forEach(function(w){ if(hw.some(function(x){ return x === w || (w.length >= 3 && x.indexOf(w) === 0) || (x.length >= 4 && w.indexOf(x) === 0); })) achou++; });
        if(achou) p = 4 * achou / pw.length;
      }
      if(!p) return;
      p *= (l.data || '') >= lim ? 1.5 : 1;
      pontos[l.categoria] = (pontos[l.categoria] || 0) + p;
      vezes[l.categoria] = (vezes[l.categoria] || 0) + 1;
      if(!exemplo[l.categoria] || (l.data || '') > exemplo[l.categoria].data) exemplo[l.categoria] = { desc: l.desc.trim(), data: l.data || '' };
    });
    var cats = Object.keys(pontos).sort(function(a, b){ return pontos[b] - pontos[a]; });
    if(cats.length && pontos[cats[0]] >= 1.5){
      return { cat: cats[0], vezes: vezes[cats[0]], exemplo: exemplo[cats[0]].desc, fonte: 'historico' };
    }
    for(var i = 0; i < DICIONARIO.length; i++){
      if(!DICIONARIO[i][0].test(alvo)) continue;
      var c = validas.filter(function(v){ return DICIONARIO[i][1].test(norm(v)); })[0];
      if(c) return { cat: c, fonte: 'palavra' };
    }
    return null;
  }
  function mostrarPalpite(p){
    var el = g('lrPalpite');
    if(!el){
      var cats = g('lrCats'); if(!cats) return;
      el = document.createElement('div'); el.id = 'lrPalpite'; el.className = 'lr-palpite'; el.setAttribute('aria-live', 'polite');
      cats.parentNode.insertBefore(el, cats);
    }
    if(!p){ el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = p.fonte === 'historico'
      ? 'Sugerida pelo hist&oacute;rico: <b>' + esc(p.cat) + '</b> &middot; usada ' + p.vezes + 'x' + (norm(p.exemplo) !== norm(g('lDesc').value) ? ', como em &ldquo;' + esc(p.exemplo) + '&rdquo;' : '')
      : 'Sugerida: <b>' + esc(p.cat) + '</b>';
  }
  function aplicarPalpite(){
    if(catManual) return;
    var p = preverCategoria(g('lDesc').value, tipoAtual());
    if(p && Array.prototype.some.call(g('lCat').options, function(o){ return o.value === p.cat; })){
      g('lCat').value = p.cat; renderCats(); mostrarPalpite(p);
    } else {
      // Sem palpite: volta para a categoria padrao (nao deixa a do palpite anterior).
      if(lrPalpiteAtivo){ categoriaPadrao(); renderCats(); }
      mostrarPalpite(null);
    }
    lrPalpiteAtivo = !!p;
  }
  window.preverCategoria = preverCategoria;

  function ligar(){
    var m = g('modalNovoLanc'); if(!m || m._lrLigado) return; m._lrLigado = true;
    m.addEventListener('click', function(e){
      var tp = e.target.closest('.lr-tp'); if(tp){ trocarTipo(tp.getAttribute('data-t')); return; }
      var c = e.target.closest('.lr-chip[data-cat]'); if(c){ g('lCat').value = c.getAttribute('data-cat'); catManual = true; renderCats(); mostrarPalpite(null); return; }
      var d = e.target.closest('.lr-chip[data-data]'); if(d){ g('lData').value = d.getAttribute('data-data'); renderDatas(); }
    });
    g('lCat').addEventListener('change', function(){ catManual = true; renderCats(); mostrarPalpite(null); });
    g('lData').addEventListener('change', renderDatas);
    g('lData').addEventListener('input', renderDatas);
    // Previsao de categoria pelo historico (ver preverCategoria).
    g('lDesc').addEventListener('input', aplicarPalpite);
    // Enter avanca: valor -> descricao -> salva.
    g('lValor').addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); g('lDesc').focus(); } });
    ['lDesc', 'lObs'].forEach(function(id){
      g(id).addEventListener('keydown', function(e){ if(e.key === 'Enter' && !e.isComposing){ e.preventDefault(); window.addLanc(); } });
    });
  }

  // Abrir: tipo pedido, categoria mais usada, data de hoje, foco no valor.
  var _abrir = window.abrirNovoLanc;
  if(typeof _abrir === 'function'){
    window.abrirNovoLanc = function(tipo){
      ligar();
      catManual = false; mostrarPalpite(null);
      _abrir.apply(this, arguments);
      if(!g('lValor').value && !g('lDesc').value) categoriaPadrao();
      if(!g('lData').value) g('lData').value = hoje();
      renderTudo();
      setTimeout(function(){ try{ g('lValor').focus(); }catch(e){} }, 80);
    };
  }

  // Salvar: valida com aviso no campo e oferece Desfazer.
  var _add = window.addLanc;
  if(typeof _add === 'function'){
    window.addLanc = function(){
      var v = typeof parseN === 'function' ? parseN(g('lValor').value) : parseFloat(g('lValor').value);
      if(!v || v <= 0) return aviso('lValor', 'Informe o valor.');
      if(!g('lDesc').value.trim()) return aviso('lDesc', 'Informe a descrição.');
      if(!g('lData').value) return aviso('lData', 'Informe a data.');
      var antes = lancs().length;
      _add.apply(this, arguments);
      var novo = lancs().length > antes ? lancs()[lancs().length - 1] : null;
      if(novo){ catManual = false; mostrarPalpite(null); }
      renderTudo();
      if(novo && typeof toast === 'function'){
        toast((novo.tipo === 'receita' ? 'Receita' : 'Despesa') + ' lançada: ' + (typeof fmtV === 'function' ? fmtV(novo.valor) : novo.valor), 'success', { acao: 'Desfazer', onAcao: function(){
          if(typeof markDeleted === 'function') markDeleted(novo.id);
          S.lancamentos = S.lancamentos.filter(function(x){ return x.id !== novo.id; });
          if(typeof salvar === 'function') salvar();
          if(typeof ren === 'function' && typeof curPage !== 'undefined') ren(curPage);
          if(typeof renderLancs === 'function' && curPage !== 'lancs') renderLancs();
          toast('Lançamento desfeito.', 'info');
        }});
      }
    };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar); else ligar();
})();

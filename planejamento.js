// planejamento.js v2 — Planejar: limites por categoria + metas (nov/2026)
// ------------------------------------------------------------------------
// Refeito porque estava quase sem uso: seis cartões de número, prompt() do
// navegador para editar e uma tabela larga que não cabia no celular.
//
// Dados (sem mudança de formato, sincronizam como antes):
//  - Limites: S.planejamento[mes][categoria] = valor   (mapa "planejamento")
//  - Metas:   S.config.metas = [{id,nome,alvo,guardado,prazo:'AAAA-MM'|'',criado}]
//    No mapa "config", cada chave sincroniza sozinha; trocamos o array inteiro
//    a cada mudança para o carimbo de alteração pegar.
//
// Gasto de uma categoria = allEntries(mes) (lançamentos + parcelas do cartão
// + assinaturas + contratos), a mesma regra do Resumo.
(function(){
'use strict';

function ic(n){ return typeof iconeSVG === 'function' ? iconeSVG(n) : ''; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function g2(id){ return document.getElementById(id); }
function v2(n){ return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).replace('.', ','); }
function nivel(pct){ return pct > 100 ? 'dn' : pct >= 80 ? 'wn' : 'ok'; }

// ---------------------------------------------------------------- dados
function gastosDoMes(mes){
  var m = {};
  allEntries(mes).forEach(function(e){ if(e.tipo === 'despesa') m[e.cat] = (m[e.cat] || 0) + (Number(e.valor) || 0); });
  return m;
}
function limites(mes){ return (S.planejamento && S.planejamento[mes]) || {}; }
function gravarLimite(mes, cat, valor){
  if(!S.planejamento || Array.isArray(S.planejamento)) S.planejamento = {};
  if(!S.planejamento[mes]) S.planejamento[mes] = {};
  if(valor == null) delete S.planejamento[mes][cat];
  else S.planejamento[mes][cat] = valor;
}
// Média dos 3 meses anteriores (meses sem gasto contam como zero), para cima
// de 10 em 10: um ponto de partida honesto para quem nunca definiu limite.
function sugestao(cat, mes){
  var t = 0;
  for(var i = 1; i <= 3; i++) t += gastosDoMes(addMes(mes, -i))[cat] || 0;
  var m = t / 3;
  return m > 0 ? Math.ceil(m / 10) * 10 : 0;
}
function metas(){ return Array.isArray(S.config && S.config.metas) ? S.config.metas : []; }
function gravarMetas(lista){ if(!S.config) S.config = {}; S.config.metas = lista; }
function mesesAte(prazo){
  if(!prazo) return null;
  var a = mesAtual(); if(prazo < a) return 0;
  var n = 1; while(a < prazo && n < 600){ a = addMes(a, 1); n++; }
  return n;
}
window.planMetas = metas;            // os alertas leem daqui
window.planGastosDoMes = gastosDoMes;

// ---------------------------------------------------------------- janela
// Uma janela só, reaproveitada por todas as edições (openM/closeM cuidam de
// foco, Esc e Enter).
function janela(titulo, corpo, botoes){
  var m = g2('modalPj');
  if(!m){
    m = document.createElement('div'); m.className = 'modal'; m.id = 'modalPj';
    m.innerHTML = '<div class="modal-content"><div class="modal-header"><h3 id="pjTit"></h3>' +
      '<span class="modal-close" onclick="closeM(\'modalPj\')">&times;</span></div>' +
      '<div id="pjCorpo" class="modal-body pj-corpo"></div><div class="modal-footer" id="pjRodape"></div></div>';
    document.body.appendChild(m);
  }
  g2('pjTit').textContent = titulo;
  g2('pjCorpo').innerHTML = corpo;
  var r = g2('pjRodape'); r.innerHTML = '';
  botoes.forEach(function(b){
    var el = document.createElement('button'); el.type = 'button';
    el.className = 'btn ' + (b.cls || 'btn-outline'); el.textContent = b.txt;
    el.onclick = b.acao; r.appendChild(el);
  });
  openM('modalPj');
  var f = m.querySelector('#pjCorpo input, #pjCorpo select'); if(f) setTimeout(function(){ f.focus(); if(f.select) f.select(); }, 50);
}
function fechar(){ closeM('modalPj'); }

// ---------------------------------------------------------------- limites
window._pjLimite = function(cat){
  var mes = planMes, atual = limites(mes)[cat], novo = cat == null;
  var opcoes = '';
  if(novo){
    var livres = getCats('despesa').filter(function(c){ return limites(mes)[c] == null; });
    if(!livres.length){ toast('Todas as categorias já têm limite neste mês.', 'info'); return; }
    opcoes = '<div class="form-group"><label for="pjCat">Categoria</label><select id="pjCat" class="form-control">' +
      livres.map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div>';
  }
  var sug = sugestao(novo ? (getCats('despesa')[0] || '') : cat, mes);
  var corpo = opcoes +
    '<div class="form-group"><label for="pjVal">Limite em ' + esc(mesNomeFull(mes)) + ' (R$)</label>' +
    '<input id="pjVal" class="form-control" inputmode="decimal" placeholder="0,00" value="' + (atual != null ? v2(atual) : '') + '"></div>' +
    '<p class="pj-dica" id="pjSug">' + (sug ? 'Média dos últimos 3 meses: ' + fmtV(sug) + '.' : '') + '</p>';
  var botoes = [];
  if(!novo && atual != null) botoes.push({ txt: 'Remover', cls: 'btn-outline pj-remover', acao: function(){
    var antes = atual; gravarLimite(mes, cat, null); salvar(); fechar(); renderPlan();
    toast('Limite de ' + cat + ' removido.', 'success', { acao: 'Desfazer', onAcao: function(){ gravarLimite(mes, cat, antes); salvar(); renderPlan(); } });
  }});
  botoes.push({ txt: 'Cancelar', acao: fechar });
  botoes.push({ txt: 'Salvar', cls: 'btn-primary', acao: function(){
    var c = novo ? g2('pjCat').value : cat, v = parseN(g2('pjVal').value);
    if(!c){ toast('Escolha a categoria.', 'error'); return; }
    if(!(v > 0)){ toast('Informe um valor maior que zero.', 'error'); return; }
    gravarLimite(mes, c, Math.round(v * 100) / 100); salvar(); fechar(); renderPlan();
    toast('Limite de ' + c + ': ' + fmtV(v) + '.', 'success');
  }});
  janela(novo ? 'Novo limite' : 'Limite de ' + cat, corpo, botoes);
  if(novo){
    var sel = g2('pjCat');
    sel.onchange = function(){ var s = sugestao(sel.value, mes); g2('pjSug').textContent = s ? 'Média dos últimos 3 meses: ' + fmtV(s) + '.' : ''; };
    sel.onchange();
  }
};

window._pjSugerir = function(){
  var mes = planMes, atuais = limites(mes), feitos = [];
  var cats = {};
  for(var i = 1; i <= 3; i++) Object.keys(gastosDoMes(addMes(mes, -i))).forEach(function(c){ cats[c] = 1; });
  Object.keys(cats).forEach(function(c){
    if(atuais[c] != null) return;
    var s = sugestao(c, mes); if(s > 0){ gravarLimite(mes, c, s); feitos.push(c); }
  });
  if(!feitos.length){ toast('Sem gastos nos últimos 3 meses para sugerir (ou todas já têm limite).', 'info'); return; }
  salvar(); renderPlan();
  toast(feitos.length + ' limite(s) sugerido(s) pela média. Ajuste o que quiser.', 'success', { acao: 'Desfazer', onAcao: function(){
    feitos.forEach(function(c){ gravarLimite(mes, c, null); }); salvar(); renderPlan();
  }});
};

window._pjCopiar = function(){
  var mes = planMes, ant = limites(addMes(mes, -1)), atuais = limites(mes), feitos = [];
  Object.keys(ant).forEach(function(c){ if(atuais[c] == null){ gravarLimite(mes, c, ant[c]); feitos.push(c); } });
  if(!feitos.length){ toast('Nada a copiar de ' + mesNomeFull(addMes(mes, -1)) + '.', 'info'); return; }
  salvar(); renderPlan();
  toast(feitos.length + ' limite(s) copiado(s).', 'success', { acao: 'Desfazer', onAcao: function(){
    feitos.forEach(function(c){ gravarLimite(mes, c, null); }); salvar(); renderPlan();
  }});
};

// ---------------------------------------------------------------- metas
function formMeta(m){
  return '<div class="form-group"><label for="pjMNome">Nome</label><input id="pjMNome" class="form-control" maxlength="60" placeholder="Ex.: Reserva de emergência" value="' + esc(m.nome || '') + '"></div>' +
    '<div class="pj-2col"><div class="form-group"><label for="pjMAlvo">Valor da meta (R$)</label><input id="pjMAlvo" class="form-control" inputmode="decimal" placeholder="0,00" value="' + (m.alvo ? v2(m.alvo) : '') + '"></div>' +
    '<div class="form-group"><label for="pjMGuard">Já guardado (R$)</label><input id="pjMGuard" class="form-control" inputmode="decimal" placeholder="0,00" value="' + (m.guardado ? v2(m.guardado) : '') + '"></div></div>' +
    '<div class="form-group"><label for="pjMPrazo">Prazo (opcional)</label><input id="pjMPrazo" type="month" class="form-control" value="' + esc(m.prazo || '') + '"></div>';
}
function lerMeta(){
  var nome = g2('pjMNome').value.trim(), alvo = parseN(g2('pjMAlvo').value), guard = parseN(g2('pjMGuard').value) || 0, prazo = g2('pjMPrazo').value || '';
  if(!nome){ toast('Dê um nome à meta.', 'error'); return null; }
  if(!(alvo > 0)){ toast('Informe o valor da meta.', 'error'); return null; }
  if(guard < 0){ toast('O valor guardado não pode ser negativo.', 'error'); return null; }
  return { nome: nome, alvo: Math.round(alvo * 100) / 100, guardado: Math.round(guard * 100) / 100, prazo: /^\d{4}-\d{2}$/.test(prazo) ? prazo : '' };
}

window._pjMeta = function(id){
  var lista = metas(), m = id ? lista.find(function(x){ return x.id === id; }) : {};
  if(id && !m) return;
  var botoes = [];
  if(id) botoes.push({ txt: 'Excluir', cls: 'btn-outline pj-remover', acao: function(){
    var antes = metas().slice();
    gravarMetas(metas().filter(function(x){ return x.id !== id; })); salvar(); fechar(); renderPlan();
    toast('Meta "' + m.nome + '" excluída.', 'success', { acao: 'Desfazer', onAcao: function(){ gravarMetas(antes); salvar(); renderPlan(); } });
  }});
  botoes.push({ txt: 'Cancelar', acao: fechar });
  botoes.push({ txt: 'Salvar', cls: 'btn-primary', acao: function(){
    var d = lerMeta(); if(!d) return;
    var nova = metas().slice();
    if(id) nova = nova.map(function(x){ return x.id === id ? Object.assign({}, x, d) : x; });
    else nova.push(Object.assign({ id: uid(), criado: hojeStr() }, d));
    gravarMetas(nova); salvar(); fechar(); renderPlan();
    toast(id ? 'Meta atualizada.' : 'Meta criada.', 'success');
  }});
  janela(id ? 'Editar meta' : 'Nova meta', formMeta(m), botoes);
};

window._pjGuardar = function(id){
  var m = metas().find(function(x){ return x.id === id; }); if(!m) return;
  janela('Guardar em "' + m.nome + '"',
    '<div class="form-group"><label for="pjGVal">Quanto (R$)</label><input id="pjGVal" class="form-control" inputmode="decimal" placeholder="0,00"></div>' +
    '<p class="pj-dica">Para registrar uma retirada, use valor negativo (ex.: -200,00). Isto só acompanha a meta: não cria lançamento.</p>',
    [{ txt: 'Cancelar', acao: fechar }, { txt: 'Guardar', cls: 'btn-primary', acao: function(){
      var v = parseN(g2('pjGVal').value);
      if(!v){ toast('Informe o valor.', 'error'); return; }
      var antes = metas().slice();
      gravarMetas(metas().map(function(x){ return x.id === id ? Object.assign({}, x, { guardado: Math.max(0, Math.round(((Number(x.guardado) || 0) + v) * 100) / 100) }) : x; }));
      salvar(); fechar(); renderPlan();
      toast((v > 0 ? 'Guardado ' : 'Retirado ') + fmtV(Math.abs(v)) + ' em "' + m.nome + '".', 'success', { acao: 'Desfazer', onAcao: function(){ gravarMetas(antes); salvar(); renderPlan(); } });
    }}]);
};

// ---------------------------------------------------------------- tela
window.renderPlan = function(){
  var lbl = g2('planMesLabel'); if(lbl) lbl.textContent = mesNomeFull(planMes);
  var pg = g2('pg-planejamento'); if(!pg) return;
  // O formulário e a tabela antigos do index.html ficam escondidos.
  pg.classList.add('pj-v2');
  var area = g2('pjArea');
  if(!area){ area = document.createElement('div'); area.id = 'pjArea'; pg.appendChild(area); }
  var t = pg.querySelector('.page-title'); if(t) t.textContent = 'Planejar';

  var mes = planMes, lim = limites(mes), gastos = gastosDoMes(mes);
  var cats = Object.keys(lim);
  var totLim = 0, totGasto = 0;
  var linhas = cats.map(function(c){
    var l = Number(lim[c]) || 0, gs = gastos[c] || 0; totLim += l; totGasto += gs;
    return { cat: c, lim: l, gasto: gs, pct: l ? Math.round(gs / l * 100) : 0 };
  }).sort(function(a, b){ return b.pct - a.pct; });
  var disp = totLim - totGasto, pctTot = totLim ? Math.round(totGasto / totLim * 100) : 0;
  var semLim = Object.keys(gastos).filter(function(c){ return lim[c] == null && gastos[c] > 0; })
    .map(function(c){ return { cat: c, gasto: gastos[c] }; }).sort(function(a, b){ return b.gasto - a.gasto; });
  var ehAtual = mes === mesAtual();
  var h = '';

  // Quadro do mês
  h += '<section class="pj-quadro">';
  if(cats.length){
    var dias = 0;
    if(ehAtual){ var hj = new Date(), ult = new Date(hj.getFullYear(), hj.getMonth() + 1, 0).getDate(); dias = ult - hj.getDate() + 1; }
    h += '<div class="pj-q-rot">' + (disp >= 0 ? 'Ainda dá para gastar' : 'Passou dos limites em') + '</div>' +
      '<div class="pj-q-val' + (disp < 0 ? ' pj-neg' : '') + '">' + fmtV(Math.abs(disp)) + '</div>' +
      '<div class="pj-barra"><div class="pj-barra-fill pj-' + nivel(pctTot) + '" style="width:' + Math.min(pctTot, 100) + '%"></div></div>' +
      '<div class="pj-q-sub">' + fmtV(totGasto) + ' de ' + fmtV(totLim) + ' (' + pctTot + '%) nas categorias com limite' +
      (ehAtual && disp > 0 && dias ? ' &middot; ' + fmtV(disp / dias) + ' por dia nos ' + dias + ' dia' + (dias === 1 ? '' : 's') + ' que faltam' : '') + '</div>';
  } else {
    h += '<div class="pj-q-rot">Sem limites em ' + esc(mesNomeFull(mes)) + '</div>' +
      '<p class="pj-q-sub">Defina quanto quer gastar por categoria e o app avisa quando estiver chegando perto. Para começar rápido, use a média dos últimos 3 meses.</p>';
  }
  h += '<div class="pj-acoes">' +
    '<button type="button" class="btn btn-primary btn-sm" onclick="window._pjLimite()">' + ic('mais') + ' Limite</button>' +
    '<button type="button" class="btn btn-outline btn-sm" onclick="window._pjSugerir()">Sugerir pela média</button>' +
    (Object.keys(limites(addMes(mes, -1))).length ? '<button type="button" class="btn btn-outline btn-sm" onclick="window._pjCopiar()">' + ic('copiar') + ' Copiar de ' + esc(mesNome(addMes(mes, -1))) + '</button>' : '') +
    '</div></section>';

  // Limites
  if(linhas.length){
    h += '<section class="pj-sec"><h3>Limites por categoria</h3><div class="pj-lista">';
    linhas.forEach(function(r){
      var n = nivel(r.pct);
      h += '<button type="button" class="pj-item" onclick="window._pjLimite(\'' + esc(r.cat).replace(/\\/g, '\\\\').replace(/&#39;/g, "\\'") + '\')">' +
        '<span class="pj-item-top"><span class="pj-item-nome">' + esc(r.cat) + '</span><span class="pj-item-val">' + fmtV(r.gasto) + ' <small>de ' + fmtV(r.lim) + '</small></span></span>' +
        '<span class="pj-barra"><span class="pj-barra-fill pj-' + n + '" style="width:' + Math.min(r.pct, 100) + '%"></span></span>' +
        '<span class="pj-item-sub"><span class="pj-pct pj-t-' + n + '">' + r.pct + '%</span><span>' +
        (r.lim - r.gasto >= 0 ? 'restam ' + fmtV(r.lim - r.gasto) : 'passou ' + fmtV(r.gasto - r.lim)) + '</span></span></button>';
    });
    h += '</div></section>';
  }

  // Gastos sem limite
  if(semLim.length){
    h += '<section class="pj-sec"><h3>Gastos sem limite</h3><div class="pj-lista">';
    semLim.forEach(function(r){
      h += '<div class="pj-sem"><span class="pj-item-nome">' + esc(r.cat) + '</span><span class="pj-item-val">' + fmtV(r.gasto) + '</span>' +
        '<button type="button" class="btn btn-sm btn-outline" onclick="window._pjLimiteNovo(\'' + esc(r.cat).replace(/\\/g, '\\\\').replace(/&#39;/g, "\\'") + '\')">Definir</button></div>';
    });
    h += '</div></section>';
  }

  // Metas
  var ms = metas();
  h += '<section class="pj-sec"><div class="pj-sec-top"><h3>Metas</h3>' +
    '<button type="button" class="btn btn-sm btn-outline" onclick="window._pjMeta()">' + ic('mais') + ' Nova meta</button></div>';
  if(!ms.length){
    h += '<p class="pj-vazio">Guarde dinheiro com objetivo: reserva de emergência, viagem, entrada de um imóvel. A meta mostra quanto falta e quanto guardar por mês.</p>';
  } else {
    h += '<div class="pj-metas">';
    ms.forEach(function(m){
      var alvo = Number(m.alvo) || 0, gd = Number(m.guardado) || 0, falta = Math.max(0, alvo - gd);
      var pct = alvo ? Math.min(100, Math.round(gd / alvo * 100)) : 0, meses = mesesAte(m.prazo), sub;
      if(!falta) sub = '<span class="pj-t-ok">Meta atingida</span>';
      else if(m.prazo && meses === 0) sub = '<span class="pj-t-dn">Prazo passou (' + esc(mesNome(m.prazo)) + ')</span> &middot; faltam ' + fmtV(falta);
      else if(m.prazo) sub = 'Faltam ' + fmtV(falta) + ' &middot; ' + fmtV(falta / meses) + '/mês até ' + esc(mesNome(m.prazo));
      else sub = 'Faltam ' + fmtV(falta);
      h += '<div class="pj-meta">' +
        '<div class="pj-item-top"><span class="pj-item-nome">' + esc(m.nome) + '</span><span class="pj-item-val">' + fmtV(gd) + ' <small>de ' + fmtV(alvo) + '</small></span></div>' +
        '<div class="pj-barra"><div class="pj-barra-fill pj-meta-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="pj-item-sub"><span>' + sub + '</span><span class="pj-pct">' + pct + '%</span></div>' +
        '<div class="pj-meta-acoes"><button type="button" class="btn btn-sm btn-primary" onclick="window._pjGuardar(\'' + esc(m.id) + '\')">Guardar</button>' +
        '<button type="button" class="btn btn-sm btn-outline" onclick="window._pjMeta(\'' + esc(m.id) + '\')">' + ic('editar') + ' Editar</button></div></div>';
    });
    h += '</div>';
  }
  h += '</section>';

  // Comparativo (recolhido)
  var meses3 = [addMes(mes, -2), addMes(mes, -1), mes], todas = {};
  meses3.forEach(function(mm){ Object.keys(limites(mm)).forEach(function(c){ todas[c] = 1; }); });
  var listaC = Object.keys(todas).sort();
  if(listaC.length){
    var gm = meses3.map(gastosDoMes);
    h += '<details class="pj-sec pj-comp"><summary>Comparativo dos últimos 3 meses</summary><div class="pj-comp-tab"><table><thead><tr><th>Categoria</th>' +
      meses3.map(function(mm){ return '<th>' + esc(mesNome(mm)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      listaC.map(function(c){
        return '<tr><td>' + esc(c) + '</td>' + meses3.map(function(mm, i){
          var l = limites(mm)[c], gs = gm[i][c] || 0;
          if(l == null) return '<td>' + (gs ? fmtV(gs) : '–') + '</td>';
          var p = l ? Math.round(gs / l * 100) : 0;
          return '<td>' + fmtV(gs) + ' <small class="pj-t-' + nivel(p) + '">' + p + '%</small></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div></details>';
  }

  area.innerHTML = h;
  // Limite ou meta mudou: o número de avisos (menu e barra) acompanha na hora.
  if(typeof window.atualizarAlertas === 'function') window.atualizarAlertas();
};

// "Definir" em gasto sem limite: já abre com a categoria escolhida e a
// sugestão preenchida (média de 3 meses ou, sem histórico, o gasto do mês).
window._pjLimiteNovo = function(cat){
  window._pjLimite(cat);
  var s = sugestao(cat, planMes) || Math.ceil(((gastosDoMes(planMes)[cat]) || 0) / 10) * 10;
  var i = g2('pjVal'); if(i && !i.value && s) i.value = v2(s);
  g2('pjTit').textContent = 'Novo limite: ' + cat;
};

})();

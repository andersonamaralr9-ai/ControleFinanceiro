// desfazer.js - Excluir na hora, com Desfazer (nov/2026)
// ---------------------------------------------------------------
// Troca a janela "Excluir?" do navegador por: exclui na hora e mostra um
// aviso com "Desfazer". Nao reescreve as funcoes de exclusao: embrulha as
// que ja existem, responde "sim" ao confirm() delas so durante a chamada e
// descobre o que foi para a Lixeira (todas chamam paraLixeira). O Desfazer
// usa a propria restauracao da Lixeira (lixeiraRestaurar), que ja cuida do
// tombstone (_deletedIds) e do _ts para o sync nao apagar de novo.
//
// Ficam de fora, de proposito, as que nao tem volta ou nao sao exclusao:
// limpar todos os dados, excluir definitivamente/esvaziar a Lixeira, sair,
// recarregar da nuvem e as perguntas de aporte/rentabilidade.
// Carregar POR ULTIMO (depois de quem sobrescreve essas funcoes).
(function(){
  var ALVOS = ['delLanc', 'delCont', 'delCartao', 'delCompra', 'delSub', 'delInvest', 'delCat',
    'invDelRent', 'invDelMovById', 'invExcluirAtivo', '_histExcluir', 'delPatrimonio'];

  function lixeira(){ return (typeof S !== 'undefined' && S && Array.isArray(S.lixeira)) ? S.lixeira : []; }

  function semPerguntar(fn, ctx, args){
    var c = window.confirm;
    window.confirm = function(){ return true; };
    try { return fn.apply(ctx, args); } finally { window.confirm = c; }
  }

  function embrulhar(nome){
    var orig = window[nome];
    if(typeof orig !== 'function' || orig._comDesfazer) return;
    var f = function(){
      var antes = {};
      lixeira().forEach(function(x){ antes[x.lixoId] = 1; });
      var r = semPerguntar(orig, this, arguments);
      var novos = lixeira().filter(function(x){ return !antes[x.lixoId]; });
      if(novos.length && typeof toast === 'function' && typeof lixeiraRestaurar === 'function'){
        var rot = novos[novos.length - 1].rotulo || 'Item';
        toast('“' + rot + '” excluído.', 'success', { acao: 'Desfazer', onAcao: function(){
          novos.slice().reverse().forEach(function(n){ lixeiraRestaurar(n.lixoId); });
          // Historico de valores aberto: redesenha para o ajuste voltar a aparecer.
          var mh = document.getElementById('modalHistorico');
          if(nome === '_histExcluir' && mh && mh.classList.contains('show') && typeof abrirHistorico === 'function' && typeof _histCtx !== 'undefined')
            try { abrirHistorico(_histCtx.tipo, _histCtx.itemId, true); } catch(e){}
        }});
      }
      return r;
    };
    f._comDesfazer = true;
    window[nome] = f;
  }

  // Encerrar contrato nao vai para a Lixeira: o Desfazer so limpa a data.
  function embrulharEncerrar(){
    var orig = window.encCont;
    if(typeof orig !== 'function' || orig._comDesfazer) return;
    var f = function(id){
      var c = (S.contratos || []).find(function(x){ return x.id === id; });
      var tinha = c ? c.encerradoEm : undefined;
      var r = semPerguntar(orig, this, arguments);
      if(c && c.encerradoEm && c.encerradoEm !== tinha && typeof toast === 'function'){
        toast('“' + (c.desc || 'Contrato') + '” encerrado.', 'success', { acao: 'Desfazer', onAcao: function(){
          if(tinha === undefined) delete c.encerradoEm; else c.encerradoEm = tinha;
          c._ts = Date.now();
          salvar();
          if(typeof renderContratos === 'function') renderContratos();
          if(typeof renderResumo === 'function') renderResumo();
          toast('Contrato reativado.', 'info');
        }});
      }
      return r;
    };
    f._comDesfazer = true;
    window.encCont = f;
  }

  function aplicar(){ ALVOS.forEach(embrulhar); embrulharEncerrar(); }
  aplicar();
  // Alguns arquivos redefinem funcoes no load; embrulha de novo (idempotente).
  window.addEventListener('load', function(){ aplicar(); setTimeout(aplicar, 500); });
})();

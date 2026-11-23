// /api/atalho — Atalho do iPhone (app Atalhos) que manda fotos de cupom
// ------------------------------------------------------------------------
// Do ATALHO (sem login, com a chave do atalho):
//   POST {chave, imagem: base64}      -> guarda a foto para revisão
//   Responde em TEXTO, para o atalho mostrar numa notificação.
// Do APP (com a sessão do Supabase, Bearer):
//   GET                 -> {fotos:[{id,criado_em}], chave:{criado_em,usado_em}|null}
//   GET ?id=N           -> {media_type, dados}
//   DELETE ?id=N        -> apaga a foto (depois de lida)
//   POST ?acao=chave    -> gera chave nova (a antiga para de valer); devolve UMA vez
//   DELETE ?acao=chave  -> revoga a chave
//
// A chave só ENTREGA fotos (função atalho_enviar no Supabase, que confere o
// hash). Ela não lê dados nem grava lançamentos: quem lança é o usuário, no
// app, depois de revisar. Do banco guardamos só o SHA-256 da chave.
import crypto from 'node:crypto';
import { SB_URL, SB_PUBLICA, usuarioDoToken, tokenDoPedido, rest } from './_ia.js';

const MAX_IMAGEM = 3_500_000;
const MENSAGENS = {
  chave_invalida: 'Chave do atalho inválida. Gere uma nova no app (Assistente → Lançar → Atalho do iPhone).',
  tipo_invalido: 'Formato de imagem não aceito. No atalho, converta para JPEG.',
  tamanho_invalido: 'Foto grande demais. No atalho, redimensione para 1600 de largura.',
  fila_cheia: 'Já há 10 fotos esperando revisão. Abra o Financeiro e revise antes de mandar mais.',
};

function texto(res, status, msg) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(status).send(msg);
}
function erro(res, status, msg) {
  res.status(status).json({ erro: msg });
}

// Formato pelos primeiros bytes (o atalho nem sempre diz o tipo).
function tipoDaImagem(b64) {
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (b64.startsWith('UklGR')) return 'image/webp';
  if (b64.startsWith('R0lGOD')) return 'image/gif';
  return null;
}

async function receberDoAtalho(req, res) {
  const corpo = req.body || {};
  const chave = typeof corpo.chave === 'string' ? corpo.chave.trim() : '';
  let dados = typeof corpo.imagem === 'string' ? corpo.imagem : '';
  dados = dados.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');   // tira prefixo e quebras de linha
  if (!chave) return texto(res, 400, 'Falta a chave no atalho.');
  if (!dados) return texto(res, 400, 'Falta a foto. O atalho precisa mandar a imagem em Base64 no campo "imagem".');
  if (dados.length > MAX_IMAGEM) return texto(res, 413, MENSAGENS.tamanho_invalido);
  const tipo = tipoDaImagem(dados);
  if (!tipo) return texto(res, 400, MENSAGENS.tipo_invalido);

  // Chamada anônima (só a chave pública): quem decide é a função no banco.
  let r;
  try {
    r = await fetch(`${SB_URL}/rest/v1/rpc/atalho_enviar`, {
      method: 'POST',
      headers: { apikey: SB_PUBLICA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_chave: chave, p_media_type: tipo, p_dados: dados }),
    });
  } catch (e) {
    console.error('[atalho] rede', e);
    return texto(res, 502, 'Não consegui falar com o servidor. Tente de novo.');
  }
  if (r.ok) return texto(res, 200, 'Foto enviada. Abra o Financeiro para revisar e lançar.');
  const j = await r.json().catch(() => ({}));
  const cod = String(j.message || '');
  if (MENSAGENS[cod]) return texto(res, cod === 'chave_invalida' ? 401 : 400, MENSAGENS[cod]);
  console.error('[atalho] rpc', r.status, JSON.stringify(j).slice(0, 300));
  return texto(res, 502, 'Não consegui guardar a foto. Tente de novo.');
}

export default async function handler(req, res) {
  const token = tokenDoPedido(req);
  // Sem sessão: só o atalho, e só para entregar foto.
  if (!token) {
    if (req.method !== 'POST') return texto(res, 405, 'Use POST.');
    return receberDoAtalho(req, res);
  }

  const usuario = await usuarioDoToken(token).catch(() => null);
  if (!usuario) return erro(res, 401, 'Sessão expirada. Saia e entre de novo.');
  const q = req.query || {};
  const id = /^\d+$/.test(String(q.id || '')) ? String(q.id) : null;

  try {
    if (q.acao === 'chave') {
      if (req.method === 'POST') {
        const chave = crypto.randomBytes(24).toString('base64url');   // 32 caracteres
        const hash = crypto.createHash('sha256').update(chave).digest('hex');
        const r = await rest(token, 'atalho_chave?on_conflict=user_id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ user_id: usuario.id, hash, criado_em: new Date().toISOString(), usado_em: null }),
        });
        if (!r.ok) { console.error('[atalho] chave', r.status, JSON.stringify(r.corpo).slice(0, 300)); return erro(res, 502, 'Não consegui gerar a chave.'); }
        return res.status(200).json({ chave });
      }
      if (req.method === 'DELETE') {
        const r = await rest(token, `atalho_chave?user_id=eq.${usuario.id}`, { method: 'DELETE' });
        if (!r.ok) return erro(res, 502, 'Não consegui revogar a chave.');
        return res.status(200).json({ ok: true });
      }
      return erro(res, 405, 'Use POST ou DELETE.');
    }

    if (req.method === 'GET' && id) {
      const r = await rest(token, `foto_pendente?id=eq.${id}&select=media_type,dados`);
      if (!r.ok) return erro(res, 502, 'Não consegui ler a foto.');
      if (!r.corpo || !r.corpo[0]) return erro(res, 404, 'Foto não encontrada.');
      return res.status(200).json(r.corpo[0]);
    }
    if (req.method === 'GET') {
      const [f, c] = await Promise.all([
        rest(token, 'foto_pendente?select=id,criado_em&order=criado_em'),
        rest(token, 'atalho_chave?select=criado_em,usado_em'),
      ]);
      if (!f.ok || !c.ok) return erro(res, 502, 'Não consegui ver as fotos do atalho.');
      return res.status(200).json({ fotos: f.corpo || [], chave: (c.corpo && c.corpo[0]) || null });
    }
    if (req.method === 'DELETE' && id) {
      const r = await rest(token, `foto_pendente?id=eq.${id}`, { method: 'DELETE' });
      if (!r.ok) return erro(res, 502, 'Não consegui apagar a foto.');
      return res.status(200).json({ ok: true });
    }
    return erro(res, 405, 'Pedido inválido.');
  } catch (e) {
    console.error('[atalho]', e);
    return erro(res, 500, 'Erro inesperado.');
  }
}

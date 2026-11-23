// /api/saldo — saldo ESTIMADO dos créditos do Assistente (ver _ia.js).
//   GET  -> { credito, desde, gasto, saldo, perguntas, mes_gasto }
//   POST { credito } -> grava o crédito informado e zera a contagem a partir
//        de agora (use ao colocar mais crédito no console da Anthropic,
//        informando o saldo que o console mostra).
import { usuarioDoToken, tokenDoPedido, rest } from './_ia.js';

function erro(res, status, msg) {
  res.status(status).json({ erro: msg });
}

async function somarGasto(token, desdeISO) {
  // Poucas linhas por mês (uma por pergunta): soma aqui mesmo, paginando.
  let total = 0, n = 0, ini = 0;
  const filtro = desdeISO ? `&criado_em=gte.${encodeURIComponent(desdeISO)}` : '';
  for (;;) {
    const r = await rest(token, `ia_uso?select=custo_usd${filtro}&order=id`, {
      headers: { Range: `${ini}-${ini + 999}` },
    });
    if (!r.ok) throw new Error(`ia_uso ${r.status}`);
    r.corpo.forEach((l) => { total += Number(l.custo_usd) || 0; n++; });
    if (r.corpo.length < 1000) break;
    ini += 1000;
  }
  return { total, n };
}

async function montarSaldo(token) {
  const c = await rest(token, 'ia_credito?select=credito_usd,desde');
  if (!c.ok) throw new Error(`ia_credito ${c.status}`);
  const linha = c.corpo && c.corpo[0];
  const agora = new Date();
  const inicioMes = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)).toISOString();
  const mes = await somarGasto(token, inicioMes);
  if (!linha) return { credito: null, desde: null, gasto: null, saldo: null, perguntas: 0, mes_gasto: mes.total };
  const g = await somarGasto(token, linha.desde);
  const credito = Number(linha.credito_usd);
  return {
    credito,
    desde: linha.desde,
    gasto: Math.round(g.total * 1e4) / 1e4,
    saldo: Math.round((credito - g.total) * 1e4) / 1e4,
    perguntas: g.n,
    mes_gasto: Math.round(mes.total * 1e4) / 1e4,
  };
}

export default async function handler(req, res) {
  const token = tokenDoPedido(req);
  if (!token) return erro(res, 401, 'Entre no app.');
  const usuario = await usuarioDoToken(token).catch(() => null);
  if (!usuario) return erro(res, 401, 'Sessão expirada. Saia e entre de novo.');

  try {
    if (req.method === 'POST') {
      const v = Number((req.body || {}).credito);
      if (!Number.isFinite(v) || v < 0 || v > 100000) return erro(res, 400, 'Informe um valor em US$ válido.');
      const r = await rest(token, 'ia_credito?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: usuario.id, credito_usd: Math.round(v * 100) / 100, desde: new Date().toISOString() }),
      });
      if (!r.ok) { console.error('[saldo] gravar', r.status, JSON.stringify(r.corpo).slice(0, 300)); return erro(res, 502, 'Não consegui gravar o crédito.'); }
    } else if (req.method !== 'GET') {
      return erro(res, 405, 'Use GET ou POST.');
    }
    return res.status(200).json(await montarSaldo(token));
  } catch (e) {
    console.error('[saldo]', e);
    return erro(res, 502, 'Não consegui calcular o saldo.');
  }
}

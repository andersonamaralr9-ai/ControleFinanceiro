// Comum a /api/chat e /api/saldo. O "_" no nome impede a Vercel de expor
// este arquivo como rota.
//
// Saldo de créditos: a Anthropic não informa o saldo pela chave de API comum
// (o relatório de custos exige chave de administrador e atrasa 4–24 h). Então
// o app ESTIMA: cada resposta traz os tokens usados, o custo sai da tabela de
// preços abaixo e fica numa linha de ia_uso (sem pergunta nem resposta). O
// saldo é o crédito informado pelo usuário menos o gasto desde então.
// O valor oficial continua sendo o do console da Anthropic.

// Haiku 5.5 por padrão (23/11/2026): barato e suficiente para ler os totais
// e para extrair lançamentos. Trocável por CLAUDE_MODELO na Vercel.
export const CLAUDE_MODELO = process.env.CLAUDE_MODELO || 'claude-haiku-5-5';

export const SB_URL = 'https://fuicmmnwumgmtwgemzuy.supabase.co';
export const SB_PUBLICA = 'sb_publishable_-C1CbKZJlFqDws8yi0glrA_o-WL4wwS';

export async function usuarioDoToken(token) {
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_PUBLICA, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

export function tokenDoPedido(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

// Preços em US$ por milhão de tokens (tabela da Anthropic, nov/2026).
// Cache: leitura conforme o modelo; gravação de 5 min = 1,25 × entrada.
// Haiku 5.5 tem duas faixas: prompt até 100k tokens ou acima.
const PRECOS = {
  'claude-haiku-5-5': (prompt) => (prompt <= 100_000
    ? { entrada: 0.10, saida: 0.50, lido: 0.01, gravado: 0.125 }
    : { entrada: 0.50, saida: 2.50, lido: 0.05, gravado: 0.625 }),
  'claude-sonnet-5-5': () => ({ entrada: 2, saida: 10, lido: 0.10, gravado: 2.5 }),
  'claude-opus-5-5': () => ({ entrada: 4, saida: 20, lido: 0.20, gravado: 5 }),
};

// uso = {entrada, cache_lido, cache_gravado, saida}. Modelo desconhecido:
// usa o preço do Opus (o mais caro da lista) para não subestimar o gasto.
export function custoUSD(modelo, uso) {
  const prompt = (uso.entrada || 0) + (uso.cache_lido || 0) + (uso.cache_gravado || 0);
  const nome = Object.keys(PRECOS).find((k) => String(modelo || '').startsWith(k)) || 'claude-opus-5-5';
  const p = PRECOS[nome](prompt);
  const usd = ((uso.entrada || 0) * p.entrada + (uso.cache_lido || 0) * p.lido +
    (uso.cache_gravado || 0) * p.gravado + (uso.saida || 0) * p.saida) / 1e6;
  return Math.round(usd * 1e6) / 1e6;
}

// PostgREST com o token do próprio usuário: a RLS garante que cada um só
// lê e grava as próprias linhas.
export async function rest(token, caminho, opcoes = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: SB_PUBLICA,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  });
  const texto = await r.text();
  let corpo = null;
  try { corpo = texto ? JSON.parse(texto) : null; } catch (e) { corpo = texto; }
  return { ok: r.ok, status: r.status, corpo };
}

// Falha ao registrar não pode derrubar a resposta: só loga.
export async function registrarUso(token, linha) {
  try {
    const r = await rest(token, 'ia_uso', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(linha),
    });
    if (!r.ok) console.error('[ia_uso]', r.status, JSON.stringify(r.corpo).slice(0, 300));
  } catch (e) {
    console.error('[ia_uso] rede', e);
  }
}

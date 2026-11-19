// /api/chat — Assistente de análise (fase 7a do PLANO-MIGRACAO.md)
// ------------------------------------------------------------------------
// Função da Vercel. Recebe a pergunta + o retrato dos dados que o próprio
// app montou (com as mesmas funções das telas: allEntries, faturaCC...) e
// responde com o Gemini (plano gratuito do Google) ou com o Claude — ver
// escolherProvedor(). SÓ LEITURA por construção: não há ferramentas, o
// modelo não grava nada; ele só vê o texto que o app mandou.
// Variáveis na Vercel: GEMINI_API_KEY e/ou ANTHROPIC_API_KEY; opcionais
// IA_PROVEDOR ('gemini'|'claude') e GEMINI_MODELO.
//
// Segurança:
//  - a chave do Claude fica só na variável de ambiente ANTHROPIC_API_KEY
//    da Vercel (nunca no navegador);
//  - toda chamada exige a sessão do Supabase do usuário (Bearer), conferida
//    no próprio Supabase; sem login válido, 401;
//  - limites de tamanho para a conta não estourar por engano.
import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

const SB_URL = 'https://fuicmmnwumgmtwgemzuy.supabase.co';
const SB_PUBLICA = 'sb_publishable_-C1CbKZJlFqDws8yi0glrA_o-WL4wwS';
const MAX_DADOS = 400_000;      // caracteres do retrato (~100k tokens)
const MAX_MENSAGENS = 30;       // histórico da conversa
const MAX_PERGUNTA = 4_000;

// Fixo (sem data/hora): mantém o prefixo idêntico e o cache funcionando.
const SISTEMA = `Você é o assistente de análise do Financeiro Pro, app de finanças pessoais do usuário.
Você recebe um retrato dos dados dele, montado pelo próprio app com as mesmas regras das telas
(parcelas do cartão por mês, valor vigente de contratos e assinaturas, investimentos).

Como responder:
- Português do Brasil, direto, como um bom planejador financeiro conversando.
- Use SOMENTE os dados do retrato. Se a informação não estiver lá, diga que não está.
- Os totais por mês e por categoria já vêm calculados: use-os em vez de somar linha a linha.
  Quando precisar somar ou comparar, mostre a conta de forma curta.
- Valores em R$ no formato brasileiro (R$ 1.234,56). Datas como dd/mm/aaaa ou "nov/2026".
- Texto simples: parágrafos curtos e listas com "- ". Sem tabelas, sem títulos com #.
- Você não altera nada no app. Se pedirem para lançar, editar ou excluir, explique que por
  enquanto você só consulta e que isso se faz pela tela correspondente.
- Não dê recomendação de investimento personalizada (comprar/vender ativo específico);
  pode explicar números, tendências, gastos e o planejamento.`;

async function usuarioDoToken(token) {
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_PUBLICA, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

function erro(res, status, msg) {
  res.status(status).json({ erro: msg });
}

// Qual IA responde. IA_PROVEDOR ('gemini' | 'claude') manda; sem ela, usa a
// que tiver chave, preferindo o Gemini (começo no plano gratuito, 19/11/2026).
function escolherProvedor() {
  const p = (process.env.IA_PROVEDOR || '').toLowerCase();
  if (p === 'claude') return process.env.ANTHROPIC_API_KEY ? 'claude' : null;
  if (p === 'gemini') return process.env.GEMINI_API_KEY ? 'gemini' : null;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  return null;
}

// ---------------------------------------------------------------- Gemini
// REST oficial (generateContent). Modelo trocável por GEMINI_MODELO sem
// mexer no código. Plano gratuito: o Google pode usar o conteúdo para
// melhorar os produtos — a tela avisa.
const GEMINI_MODELO = process.env.GEMINI_MODELO || 'gemini-2.5-flash';
const GEMINI_URL = process.env.GEMINI_URL || 'https://generativelanguage.googleapis.com';

async function responderGemini(res, dados, conversa) {
  const corpo = {
    systemInstruction: { parts: [{ text: SISTEMA }, { text: `<dados_do_usuario>\n${dados}\n</dados_do_usuario>` }] },
    contents: conversa.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: 8192 },
  };
  let r, j = null;
  try {
    r = await fetch(`${GEMINI_URL}/v1beta/models/${encodeURIComponent(GEMINI_MODELO)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(corpo),
    });
    j = await r.json().catch(() => null);
  } catch (e) {
    console.error('[chat gemini] rede', e);
    return erro(res, 502, 'Falha ao falar com o Gemini. Tente de novo.');
  }
  if (!r.ok) {
    const msg = (j && j.error && j.error.message) || '';
    console.error('[chat gemini]', r.status, msg.slice(0, 300));
    if (r.status === 429) return erro(res, 429, 'Limite do plano gratuito do Gemini atingido. Tente mais tarde.');
    if (r.status === 400 && /api key/i.test(msg)) return erro(res, 503, 'Chave do Gemini inválida na Vercel.');
    if (r.status === 401 || r.status === 403) return erro(res, 503, 'Chave do Gemini inválida ou sem permissão.');
    if (r.status === 404) return erro(res, 503, `Modelo ${GEMINI_MODELO} não encontrado no Gemini.`);
    return erro(res, 502, 'Falha no serviço do Gemini. Tente de novo.');
  }
  const cand = j && j.candidates && j.candidates[0];
  if (!cand || !cand.content) {
    const motivo = (j && j.promptFeedback && j.promptFeedback.blockReason) || (cand && cand.finishReason) || '';
    return res.status(200).json({ texto: 'Não consegui responder essa pergunta. Tente reformular.' + (motivo ? ` (${motivo})` : ''), provedor: 'gemini' });
  }
  const texto = (cand.content.parts || []).filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text).join('').trim();
  const cortado = cand.finishReason === 'MAX_TOKENS';
  const u = j.usageMetadata || {};
  const cacheLido = u.cachedContentTokenCount || 0;
  return res.status(200).json({
    texto: (texto || 'Não consegui responder essa pergunta. Tente reformular.') + (cortado ? '\n\n(resposta cortada por tamanho)' : ''),
    provedor: 'gemini',
    uso: { entrada: (u.promptTokenCount || 0) - cacheLido, cache_lido: cacheLido, cache_gravado: 0, saida: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0) },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return erro(res, 405, 'Use POST.');

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return erro(res, 401, 'Entre no app para usar o assistente.');
  const usuario = await usuarioDoToken(token).catch(() => null);
  if (!usuario) return erro(res, 401, 'Sessão expirada. Saia e entre de novo.');

  const { dados, mensagens } = req.body || {};
  if (typeof dados !== 'string' || !dados) return erro(res, 400, 'Retrato dos dados ausente.');
  if (dados.length > MAX_DADOS) return erro(res, 413, 'Dados grandes demais para o assistente.');
  if (!Array.isArray(mensagens) || !mensagens.length || mensagens.length > MAX_MENSAGENS)
    return erro(res, 400, 'Conversa inválida.');
  // Só texto, alternando usuário/assistente, começando e terminando no usuário.
  const conversa = [];
  for (const m of mensagens) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string')
      return erro(res, 400, 'Mensagem inválida.');
    if (m.role === 'user' && m.content.length > MAX_PERGUNTA) return erro(res, 413, 'Pergunta longa demais.');
    conversa.push({ role: m.role, content: m.content });
  }
  if (conversa[0].role !== 'user' || conversa[conversa.length - 1].role !== 'user')
    return erro(res, 400, 'Conversa inválida.');

  const provedor = escolherProvedor();
  if (!provedor) return erro(res, 503, 'Assistente ainda não configurado (falta a chave na Vercel).');
  if (provedor === 'gemini') return responderGemini(res, dados, conversa);

  const client = new Anthropic();
  try {
    const resposta = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      // Recusa por engano dos filtros de segurança: o servidor tenta de novo
      // no modelo de reserva, dentro da mesma chamada.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [
        { type: 'text', text: SISTEMA },
        // Retrato dos dados: grande e igual durante a conversa -> cache.
        { type: 'text', text: `<dados_do_usuario>\n${dados}\n</dados_do_usuario>`, cache_control: { type: 'ephemeral' } },
      ],
      messages: conversa,
    });

    if (resposta.stop_reason === 'refusal')
      return res.status(200).json({ texto: 'Não consegui responder essa pergunta. Tente reformular.', uso: resposta.usage });

    const texto = resposta.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const cortado = resposta.stop_reason === 'max_tokens';
    return res.status(200).json({
      texto: texto + (cortado ? '\n\n(resposta cortada por tamanho)' : ''),
      provedor: 'claude',
      uso: {
        entrada: resposta.usage.input_tokens,
        cache_lido: resposta.usage.cache_read_input_tokens,
        cache_gravado: resposta.usage.cache_creation_input_tokens,
        saida: resposta.usage.output_tokens,
      },
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return erro(res, 503, 'Chave do Claude inválida na Vercel.');
    if (e instanceof Anthropic.RateLimitError) return erro(res, 429, 'Muitas perguntas seguidas. Espere um pouco.');
    if (e instanceof Anthropic.BadRequestError) { console.error('[chat] 400', e.message); return erro(res, 400, 'Pedido recusado pela API.'); }
    if (e instanceof Anthropic.APIError) { console.error('[chat]', e.status, e.message); return erro(res, 502, 'Falha no serviço do Claude. Tente de novo.'); }
    console.error('[chat]', e);
    return erro(res, 500, 'Erro inesperado.');
  }
}

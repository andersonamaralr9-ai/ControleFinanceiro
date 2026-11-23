// /api/chat — Assistente de análise (fase 7a do PLANO-MIGRACAO.md)
// ------------------------------------------------------------------------
// Função da Vercel. Recebe a pergunta + o retrato dos dados que o próprio
// app montou (com as mesmas funções das telas: allEntries, faturaCC...) e
// responde com o Gemini (plano gratuito do Google) ou com o Claude — ver
// escolherProvedor(). SÓ LEITURA por construção: não há ferramentas, o
// modelo não grava nada; ele só vê o texto que o app mandou.
// Variáveis na Vercel: ANTHROPIC_API_KEY e/ou GEMINI_API_KEY; opcionais
// IA_PROVEDOR ('gemini'|'claude'), CLAUDE_MODELO e GEMINI_MODELO.
//
// Segurança:
//  - a chave do Claude fica só na variável de ambiente ANTHROPIC_API_KEY
//    da Vercel (nunca no navegador);
//  - toda chamada exige a sessão do Supabase do usuário (Bearer), conferida
//    no próprio Supabase; sem login válido, 401;
//  - limites de tamanho para a conta não estourar por engano.
import Anthropic from '@anthropic-ai/sdk';
import { usuarioDoToken, tokenDoPedido, custoUSD, registrarUso, CLAUDE_MODELO } from './_ia.js';

export const config = { maxDuration: 60 };

const MAX_DADOS = 400_000;      // caracteres do retrato (~100k tokens)
const MAX_MENSAGENS = 30;       // histórico da conversa
const MAX_PERGUNTA = 4_000;

// Fixo (sem data/hora): mantém o prefixo idêntico e o cache funcionando.
const SISTEMA = `Você é o assistente de análise do Financeiro Pro, app de finanças pessoais do usuário.
Você recebe um retrato dos dados dele, montado pelo próprio app com as mesmas regras das telas
(parcelas do cartão por mês, valor vigente de contratos e assinaturas, investimentos).

O que o retrato traz (use a seção certa para cada pergunta):
- "Situação do mês atual": totais, quanto já foi pago/recebido e a lista de despesas pendentes
  com vencimento. Para "o que falta pagar", use essa lista.
- "Faturas dos cartões": total de cada fatura por mês, vencimento e se está paga.
- "Contratos" e "Assinaturas" ativos, com valor vigente e dia de vencimento.
- "Planejamento" (limites por categoria), "Metas" e os "Avisos" que o app está mostrando.
- "Lançamentos detalhados": linha a linha, com coluna status (pago / recebido / pendente),
  de 2 meses antes a 3 meses depois do atual. Meses mais antigos vêm só com totais.
- "status" vem do Check de Pagamentos: pendente significa que o usuário ainda não marcou como
  pago, não necessariamente que está atrasado. Compare o vencimento com a data de hoje.

Como responder:
- Português do Brasil, direto e curto, como um bom planejador financeiro conversando.
  Responda primeiro o que foi perguntado; detalhe só se ajudar.
- Use SOMENTE os dados do retrato. Se a informação não estiver lá, diga exatamente o que falta.
- Os totais por mês e por categoria já vêm calculados: use-os em vez de somar linha a linha.
  Quando precisar somar ou comparar, mostre a conta de forma curta.
- Valores em R$ no formato brasileiro (R$ 1.234,56). Datas como dd/mm/aaaa ou "nov/2026".
- Texto simples: parágrafos curtos e listas com "- ". Sem tabelas, sem títulos com #.
- Você não altera nada no app. Se pedirem para lançar, editar ou excluir, explique que por
  enquanto você só consulta e que isso se faz pela tela correspondente.
- Não dê recomendação de investimento personalizada (comprar/vender ativo específico);
  pode explicar números, tendências, gastos e o planejamento.`;

function erro(res, status, msg) {
  res.status(status).json({ erro: msg });
}

// Qual IA responde. IA_PROVEDOR ('gemini' | 'claude') manda; sem ela, usa a
// que tiver chave, preferindo o Claude: o plano gratuito do Gemini recusou
// todas as perguntas por sobrecarga (503) em 23/11/2026.
function escolherProvedor() {
  const p = (process.env.IA_PROVEDOR || '').toLowerCase();
  if (p === 'claude') return process.env.ANTHROPIC_API_KEY ? 'claude' : null;
  if (p === 'gemini') return process.env.GEMINI_API_KEY ? 'gemini' : null;
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

// ---------------------------------------------------------------- Claude
// Modelo em CLAUDE_MODELO (_ia.js; Haiku 5.5 por padrão, ~US$ 0,004 a
// pergunta). Reserva do servidor só no Opus.
const CLAUDE_COM_RESERVA = /^claude-opus-5-5$/.test(CLAUDE_MODELO);

// ---------------------------------------------------------------- Gemini
// REST oficial (generateContent). Modelo trocável por GEMINI_MODELO sem
// mexer no código. Plano gratuito: o Google pode usar o conteúdo para
// melhorar os produtos — a tela avisa.
// O Google aposenta modelos para contas novas (o 2.5-flash deu 404 em
// 23/11/2026). Se o modelo der 404, descobrimos um "flash" disponível na
// lista da própria API e guardamos enquanto a função estiver de pé.
let GEMINI_MODELO = process.env.GEMINI_MODELO || 'gemini-3.8-flash';
const GEMINI_URL = process.env.GEMINI_URL || 'https://generativelanguage.googleapis.com';

function versaoModelo(nome) {
  const m = /gemini-(\d+(?:\.\d+)?)/.exec(nome);
  return m ? parseFloat(m[1]) : 0;
}

async function descobrirModeloGemini() {
  try {
    const r = await fetch(`${GEMINI_URL}/v1beta/models?pageSize=1000`, {
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const nomes = (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      // Flash estável: sem lite, preview, experimental, imagem, áudio etc.
      .filter((n) => /^gemini-[\d.]+-flash$/.test(n));
    nomes.sort((a, b) => versaoModelo(b) - versaoModelo(a));
    return nomes[0] || null;
  } catch (e) {
    console.error('[chat gemini] lista de modelos', e);
    return null;
  }
}

// 503 ("high demand") e 500 são passageiros no Google: tenta mais duas vezes
// com espera curta (cabe folgado nos 60 s da função).
const ESPERAS_GEMINI = [1500, 4000];

async function chamarGemini(corpo) {
  let tentativa = await chamarGeminiUmaVez(corpo);
  for (const ms of ESPERAS_GEMINI) {
    if (tentativa.r.status !== 503 && tentativa.r.status !== 500) break;
    console.warn(`[chat gemini] ${tentativa.r.status}; nova tentativa em ${ms} ms`);
    await new Promise((ok) => setTimeout(ok, ms));
    tentativa = await chamarGeminiUmaVez(corpo);
  }
  return tentativa;
}

async function chamarGeminiUmaVez(corpo) {
  const r = await fetch(`${GEMINI_URL}/v1beta/models/${encodeURIComponent(GEMINI_MODELO)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(corpo),
  });
  const j = await r.json().catch(() => null);
  return { r, j };
}

async function responderGemini(res, dados, conversa) {
  const corpo = {
    systemInstruction: { parts: [{ text: SISTEMA }, { text: `<dados_do_usuario>\n${dados}\n</dados_do_usuario>` }] },
    contents: conversa.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    // Folga para o "raciocínio" interno dos modelos novos, que também conta aqui.
    generationConfig: { maxOutputTokens: 16384 },
  };
  let r, j = null;
  try {
    ({ r, j } = await chamarGemini(corpo));
    if (r.status === 404) {
      const novo = await descobrirModeloGemini();
      if (novo && novo !== GEMINI_MODELO) {
        console.warn(`[chat gemini] ${GEMINI_MODELO} indisponível; usando ${novo}`);
        GEMINI_MODELO = novo;
        ({ r, j } = await chamarGemini(corpo));
      }
    }
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
    if (r.status === 503 || r.status === 500)
      return erro(res, 503, 'O Gemini está sobrecarregado agora (comum no plano gratuito). Tente de novo em alguns minutos.');
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

  const token = tokenDoPedido(req);
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
      model: CLAUDE_MODELO,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      // Recusa por engano dos filtros de segurança: no Opus o servidor tenta
      // de novo no modelo de reserva. O Haiku 5.5 não tem reserva (400).
      ...(CLAUDE_COM_RESERVA ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
      system: [
        { type: 'text', text: SISTEMA },
        // Retrato dos dados: grande e igual durante a conversa -> cache.
        { type: 'text', text: `<dados_do_usuario>\n${dados}\n</dados_do_usuario>`, cache_control: { type: 'ephemeral' } },
      ],
      messages: conversa,
    });

    // Toda resposta cobrada (inclusive recusa) entra na conta do saldo.
    const uso = {
      entrada: resposta.usage.input_tokens || 0,
      cache_lido: resposta.usage.cache_read_input_tokens || 0,
      cache_gravado: resposta.usage.cache_creation_input_tokens || 0,
      saida: resposta.usage.output_tokens || 0,
    };
    const modelo = resposta.model || CLAUDE_MODELO;
    uso.custo_usd = custoUSD(modelo, uso);
    await registrarUso(token, { provedor: 'claude', modelo, ...uso });

    if (resposta.stop_reason === 'refusal')
      return res.status(200).json({ texto: 'Não consegui responder essa pergunta. Tente reformular.', provedor: 'claude', uso });

    const texto = resposta.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const cortado = resposta.stop_reason === 'max_tokens';
    return res.status(200).json({
      texto: texto + (cortado ? '\n\n(resposta cortada por tamanho)' : ''),
      provedor: 'claude',
      uso,
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

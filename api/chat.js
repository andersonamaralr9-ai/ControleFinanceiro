// /api/chat — Assistente de análise (fase 7a do PLANO-MIGRACAO.md)
// ------------------------------------------------------------------------
// Função da Vercel. Recebe a pergunta + o retrato dos dados que o próprio
// app montou (com as mesmas funções das telas: allEntries, faturaCC...) e
// responde com o Claude. SÓ LEITURA por construção: não há ferramentas,
// o modelo não grava nada; ele só vê o texto que o app mandou.
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

  if (!process.env.ANTHROPIC_API_KEY) return erro(res, 503, 'Assistente ainda não configurado (falta a chave na Vercel).');
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

# Plano de migração: Gist → Supabase + Vercel

Status: **aprovado** (18/11/2026). Fases 0 e 1 concluídas (conta criada,
cadastro público desligado). Fase 2 concluída (19/11/2026): `nuvem.js`,
testado com servidor simulado e com o login real na prévia da Vercel.
Fase 3 concluída (19/11/2026): ensaio de importação aprovado, 24/24
verificações iguais (relatório em `../backups/`, fora do repositório).
Fase 4 concluída: o usuário conferiu telas e totais na prévia (depois da
correção do ts=0, ver abaixo).
**Fase 5 concluída — troca feita em 19/11/2026.** Gist sem alteração desde o
ensaio (mesmo md5 74ccc21d); importação final gravou 0 linhas; conferência
24/24. App oficial: **https://financeiro-pro-ia.vercel.app** (branch `main`).
O GitHub Pages recebe o mesmo código, mas lá a chave fica desligada e ele
continua no Gist — fase 6 o torna só leitura com aviso do endereço novo.
Fase 6 (19/11/2026): **app antigo só leitura** no ar (aviso no topo, nada
é gravado no Gist, edição é desfeita com aviso). **Backup** pronto em
`../financeiro-backup/` (GitHub Action, segunda e quinta 06:00), testado com
os dados reais contra um servidor falso. **Fase 6 concluída:** repositório
privado `financeiro-backup` no ar; o primeiro backup real (19/11/2026,
13:22 UTC) ficou igual ao backup do Gist nas 14 partes do estado. Roda
segunda e quinta, sob demanda e quando o script/workflow muda.
**Fase 7a concluída (23/11/2026): Assistente de análise (só leitura)** no
app oficial. `ia.js` monta o retrato dos dados com as funções das telas
(`allEntries` por mês, planejamento, cartões, investimentos, patrimônio) e
`api/chat.js` responde com o **Claude Haiku 5.5** (~US$ 0,004 a pergunta;
modelo trocável por `CLAUDE_MODELO`). O Gemini gratuito ficou como
alternativa (`GEMINI_API_KEY`), mas recusou tudo por sobrecarga (503) e o
`gemini-2.5-flash` já não existe para contas novas. Saldo de créditos
**estimado** no topo do Assistente (`api/saldo.js`, tabelas `ia_uso` e
`ia_credito`): a Anthropic não dá o saldo pela chave comum. Falta a 7b
(lançar por foto/texto com confirmação).

Lição do ensaio: itens nunca editados não têm `_ts` e entram com `ts=0`.
A primeira versão do `nuvem.js` tratava "não conheço" como 0 e descartava
`0<=0` (264 lançamentos não chegavam). A conferência no banco não pegou
porque o banco estava certo; o teste que pegou foi passar o backup real
pelo app (simulador local) e comparar o `S` resultante com o backup.

Recursos criados:
- Supabase `controle-financeiro` (ref `fuicmmnwumgmtwgemzuy`, sa-east-1).
  Para abrir vaga no plano gratuito, o projeto `english-study` foi pausado.
- Vercel `controle-financeiro` (time anderson-amaral), ligado a este repo,
  produção = `main`, ainda sem deploy. Variáveis: `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY` (legada).
- Migração `fase1_itens_mapas_rls`: tabelas `itens` e `mapas`, gatilho
  `sync_guard` (ts menor é ignorado em silêncio; `atualizado_em` usa
  `clock_timestamp()`), RLS sem política de DELETE (anon sem acesso nenhum),
  visões `v_lancamentos` e `v_compras` com `security_invoker`.
  `v_parcelas` fica para a fase 3, junto com a lógica de fatura do app.
  Testado com 2 usuários: isolamento, ts antigo, DELETE e anon bloqueados.

Objetivo: tirar os dados do Gist (legível por quem tem o ID, sem login real,
merge do arquivo inteiro) sem perder nenhum registro, e preparar o terreno
para a IA (chat de análise e lançamento por foto).

Regra número um: **o Gist não é alterado nem apagado em nenhuma fase.** Ele
fica como cópia de segurança e caminho de volta por pelo menos 60 dias
depois da troca.

---

## 1. O que existe hoje (levantado dos dados reais)

| Coleção | Itens | Campos aninhados |
|---|---|---|
| lancamentos | 676 | — |
| comprasCartao | 156 | `antecipacoes[]` |
| contratos | 15 | `historico[]` |
| assinaturas | 6 | `historico[]`, `periodos[]` |
| investimentos | 6 | `movimentacoes[]`, `rentabilidade[]` |
| cartoes | 2 | — |
| patrimonios | 2 | `contratoIds[]`, `finHistorico[]` |
| lixeira | 6 | `dados{}`, `ctx{}` |
| caixa | 0 | — |

Mapas (chave → valor): `planejamento` (mês → categoria → limite), `cats`,
`config`, `checkPagamentos` (+ `checkPagamentosTs`). Controle de sync:
`_ts` por item, `_mapTs`, `_deletedIds` (20 tombstones).

---

## 2. Decisão de modelo: "um documento por item"

Duas opções foram consideradas:

- **A. Tabelas totalmente relacionais** (uma coluna por campo, tabelas filhas
  para histórico, parcelas, movimentações). Mais "correto", mas obriga a
  reescrever boa parte do app e a converter cada campo — cada conversão é um
  lugar onde um dado pode se perder.
- **B. Um documento JSON por item, em linhas separadas** ✅ recomendada.
  Cada lançamento, compra, contrato etc. vira **uma linha**, com o objeto
  exatamente como está hoje numa coluna `dados jsonb`. O app continua com o
  mesmo `S` em memória e as mesmas telas; muda só a camada que fala com a
  nuvem.

Por que B:
- A importação é mecânica e **verificável por igualdade exata**: o que sai do
  Gist tem que voltar idêntico do banco, campo a campo.
- Cada alteração grava **só a linha alterada** (acaba o merge do arquivo
  inteiro, origem de boa parte dos bugs de sync).
- Para relatórios e para a IA, criamos **visões tipadas** sobre o JSON
  (`valor`, `data`, `categoria` como colunas). Dá para evoluir para tabelas
  relacionais depois, já com os dados seguros no banco.

---

## 3. Banco (Supabase / Postgres)

Região: **São Paulo (sa-east-1)**.

```sql
-- Itens das coleções: um objeto por linha, igual ao de hoje
create table itens (
  user_id   uuid    not null default auth.uid() references auth.users,
  colecao   text    not null,          -- 'lancamentos', 'comprasCartao', ...
  id        text    not null,          -- o mesmo id de hoje
  dados     jsonb   not null,          -- o objeto inteiro
  ts        bigint  not null,          -- carimbo do aparelho (o _ts de hoje)
  excluido  boolean not null default false,  -- substitui _deletedIds
  atualizado_em timestamptz not null default now(),  -- cursor de sync
  primary key (user_id, colecao, id)
);

-- Mapas: uma linha por chave (substitui _mapTs e checkPagamentosTs)
create table mapas (
  user_id  uuid   not null default auth.uid() references auth.users,
  mapa     text   not null,            -- 'planejamento', 'cats', 'config', 'checkPagamentos'
  chave    text   not null,            -- ex.: '2026-07␁Lazer'
  valor    jsonb,
  ts       bigint not null,
  removido boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, mapa, chave)
);
```

Regras:
- **RLS** nas duas tabelas: `user_id = auth.uid()` para ler e gravar. Sem
  sessão válida, a API não devolve nada.
- **Última alteração vence no servidor:** um gatilho recusa gravação com
  `ts` menor que o já gravado (um aparelho desatualizado não sobrescreve um
  mais novo) e atualiza `atualizado_em`.
- **Exclusão é lógica** (`excluido = true`). Nada é apagado fisicamente;
  limpeza só depois de meses, se um dia for necessária.
- **Cadastro público desligado** depois de criar a sua conta: ninguém mais
  consegue se registrar.
- **Visões tipadas** (`v_lancamentos`, `v_compras`, `v_parcelas`…) para
  relatórios e para as ferramentas da IA.

---

## 4. Login

Supabase Auth com **e-mail e senha** (recomendado; a senha fica com hash e
salt no servidor, com recuperação por e-mail). Opcional depois: link mágico
por e-mail ou passkey.

Some do app: token do GitHub, `auth_users.json`, hash SHA-256 sem salt,
cifragem do token no aparelho.

---

## 5. Sincronização no app

Continua **funcionando sem internet** (o `S` segue no `localStorage`).

- **Ao salvar:** o app já sabe o que mudou (`_tsStamp` / `_mapCarimbar`).
  Essas linhas vão para uma **fila de envio** no aparelho e sobem em lote.
  Sem rede, a fila espera; nada se perde se o app fechar.
- **Ao abrir / voltar ao app / a cada poucos minutos:** busca só o que mudou
  desde a última vez (`atualizado_em > cursor`) e aplica no `S`.
- **Opcional:** Realtime do Supabase, para o celular ver na hora o que foi
  lançado no computador.
- **Indicador claro:** "Sincronizado", "N alterações aguardando envio",
  "Erro: tentar de novo".

Implementação: um módulo novo (`nuvem.js`) com a mesma função de hoje
(carregar, enviar, buscar novidades). O código do Gist fica intacto até a
troca, atrás de uma chave de configuração.

Como ficou (fase 2):
- **Chave:** `?nuvem=supabase` liga neste aparelho, `?nuvem=gist` desliga;
  `*.vercel.app` liga sozinho (prévia = app novo, GitHub Pages = antigo).
  O `nuvem.js` carrega antes do `auth.js`, que para logo depois dos helpers
  quando a chave está ligada.
- **Dados locais separados:** `finApp_sb_<uid>` (+ `_meta_`, `_fila_`). Não
  toca no `finApp_v5_*` do Gist.
- **Mapas no banco:** `planejamento` uma linha por mês; `cats` uma lista por
  tipo (mantém a ordem); `config` uma por chave; `checkPagamentos` uma por
  item (`mes␁chave`) mais o marcador do mês (`mes␁`, valor nulo).
- **Aparelho novo não envia antes da primeira busca completa.** Um módulo
  acrescenta "Investimento" às categorias ao abrir; sem essa trava, o
  estado padrão subiria com horário novo e venceria as categorias reais.
- **Abas do mesmo aparelho** dividem fila e dados: toda escrita relê a fila
  do disco, e o evento `storage` faz a aba adotar o que a outra salvou.
- **Testado** (servidor simulado com a regra do gatilho, 2 origens = 2
  aparelhos): aparelho novo recebe tudo sem estragar a nuvem; lançar,
  editar e excluir (com lixeira) sincronizam; 3 alterações offline
  sobrevivem a recarregar e sobem quando a rede volta; edição offline mais
  velha perde para a mais nova; 2 abas no mesmo aparelho não perdem fila;
  modo Gist continua igual.

---

## 6. Importação e conferência (o "não perder nada")

Script `migracao/importar.js` (Node, roda no seu computador):

1. **Backup:** baixa o Gist atual e grava `backup-AAAA-MM-DD.json` (e o
   histórico de versões do Gist continua existindo).
2. **Importa** cada item como linha em `itens` e cada chave dos mapas em
   `mapas`. Itens em `_deletedIds` entram como `excluido = true`.
3. **Lê tudo de volta** do banco e remonta o `S`.
4. **Confere**, e só aprova se **tudo** bater:
   - quantidade por coleção (676 lançamentos, 156 compras, …);
   - **igualdade exata** de cada objeto (campo a campo, incluindo histórico,
     parcelas, antecipações, movimentações);
   - mapas idênticos (limites, categorias, config, pagamentos marcados);
   - **totais de cada mês** com movimento (receitas, despesas, fatura do
     cartão, saldo de investimentos), calculados pelas mesmas funções do app
     sobre o `S` antigo e sobre o `S` remontado.
5. Gera `relatorio-conferencia.txt`. Qualquer diferença de 1 centavo ou de
   1 campo **bloqueia** a troca.

O script é idempotente: pode rodar quantas vezes for preciso (ensaio,
importação final).

Como ficou (fase 3): em vez de script Node com chave secreta, a importação
roda **dentro do banco**, sem nenhuma senha ou chave de serviço:
- o banco baixa o `anderson.json` do Gist numa versão fixa (raw_url com o
  sha) para `migracao.fonte`; o md5 tem que bater com o backup local;
- `migracao.importar(uid, fonte)` grava itens e mapas (gatilho desligado
  só durante a função), na ordem dos arrays de origem; itens da conta que
  não estão na fonte (testes) viram `excluido`;
- `migracao.conferir(uid, fonte)` remonta o estado como o `nuvem.js` e
  compara contagens, cada coleção, cada mapa e o estado inteiro (jsonb).
O esquema `migracao` não é exposto na API. Backup e relatório ficam em
`Projeto Financeiro/backups/`, fora deste repositório público.

---

## 7. Hospedagem (Vercel) e publicação

- Projeto Vercel ligado a este repositório do GitHub.
- **Cada branch ganha um link de prévia** — testamos no celular antes de ir
  para o ar; `main` vira produção.
- Domínio próprio (você registra, ex. no registro.br, ~R$ 40/ano) apontado
  para a Vercel, com HTTPS automático.
- A chave pública do Supabase (anon) pode ficar no app: quem protege os
  dados é o RLS. Chaves secretas (Supabase service role, IA) ficam só nas
  variáveis de ambiente da Vercel/GitHub.
- Depois da troca, o repositório pode virar **privado** (a Vercel funciona
  com repositório privado; o GitHub Pages grátis não).

---

## 8. Backup contínuo

- GitHub Action semanal (num repositório privado seu) exporta tudo do
  Supabase para JSON e guarda o histórico. Também evita a pausa do plano
  gratuito por inatividade.
- O botão "Exportar backup" do app continua.

---

## 9. Fases

| Fase | O que | Quem | Pronto quando |
|---|---|---|---|
| 0 | Criar contas Supabase e Vercel; fazer login nas CLIs | **você** (eu guio) | `supabase` e `vercel` respondem logados |
| 1 | Criar tabelas, RLS, gatilho, visões; desligar cadastro | eu | teste com usuário de teste: um usuário não lê o dado do outro |
| 2 | `nuvem.js` + tela de login nova, atrás de chave | eu | app de teste lança/edita/exclui offline e sincroniza entre 2 abas |
| 3 | Ensaio de importação + conferência | eu | relatório 100% igual |
| 4 | Deploy de prévia na Vercel; você usa a prévia em paralelo (só olhando) | eu + você | você confere telas e totais nos 2 aparelhos |
| 5 | **Dia da troca:** você para de lançar no app antigo → importação final → conferência → app novo vira o oficial | eu + você | relatório 100% igual; você lança no novo |
| 6 | Backup semanal ativo; app antigo vira só leitura com aviso do novo endereço | eu | primeiro backup gerado |
| 7 | IA: chat de análise (só leitura), depois foto/texto com confirmação | eu | perguntas de teste com resposta conferida |

Estimativa: fases 1–6 em **1 a 2 semanas** de trabalho, sem pressa no dia da
troca. A fase 7 vem depois, sobre a base nova.

**Caminho de volta em qualquer fase:** o Gist está intacto e o app antigo
continua publicado; basta voltar a usá-lo.

---

## 10. Decisões

Tomadas em 18/11/2026:
1. **Login:** e-mail e senha.
2. **Modelo de dados:** B, documento por item.
3. **Repositório:** vira privado depois da troca.

Pendente:
4. **Domínio:** qual nome? Pode ficar para a fase 4; até lá usamos o
   endereço gratuito `*.vercel.app`.

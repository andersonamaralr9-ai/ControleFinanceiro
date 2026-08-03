# Controle Financeiro — contexto para o Claude

App financeiro pessoal em JS puro (sem build, sem framework). Roda no
GitHub Pages, guarda os dados num Gist do GitHub.

Este arquivo existe para uma sessão nova (ou outro dev) começar sabendo o
que não está óbvio no código. **Leia antes de mexer.**

---

## Como publicar

```bash
git add <arquivos> && git commit -m "..." && git push
```

O GitHub Pages republica sozinho em ~1–2 min.
URL: https://andersonamaralr9-ai.github.io/ControleFinanceiro/

**Ao editar qualquer `.js` ou `.css`, incremente o `?v=N` da tag
correspondente no `index.html`.** Sem isso o navegador serve a versão em
cache e a alteração "não aparece" — isso já custou várias idas e vindas
achando que a mudança não tinha sido aplicada.

Para conferir se subiu de verdade (o CDN também cacheia):

```bash
curl -s "https://andersonamaralr9-ai.github.io/ControleFinanceiro/index.html?cb=$(date +%s)" | grep -o 'app.css?v=[0-9]*'
```

---

## Convenções de arquitetura

O app teve uma fase em que cada módulo embrulhava as funções globais
(`window.nav`, `window.renderX`) guardando a anterior e chamando-a. Isso
gerou uma cadeia de até 4 níveis onde, se um módulo esquecesse de
encadear, tudo registrado depois dele morria **em silêncio**. Três bugs
reais vieram daí. Foi substituído por registro explícito.

### Não faça

```js
var _orig = window.renderAssinaturas;      // ❌
window.renderAssinaturas = function(){ _orig(); /* ... */ };

var _origNav = window.nav;                 // ❌
window.nav = function(p){ _origNav(p); /* ... */ };
```

### Faça

```js
registerPage('minhaPagina', function(){ renderMinhaPagina(); });  // nova página
onNavigate(function(pagina){ /* após cada navegação */ });
afterRender('assinaturas', function(){ /* complementa a tela */ });
```

- `registerPage` / `onNavigate` / `afterRender` estão definidos no
  `index.html`.
- Passe **função anônima que chama** a sua (`function(){ minhaFn(); }`),
  não a referência direta — assim resolve na hora da chamada e não
  depende da ordem de definição entre arquivos.
- `afterRender` roda também quando `renderX()` é chamado direto (após
  salvar/excluir), não só ao navegar. Nunca chame a função base dentro
  do complemento: ele já roda depois dela, e isso causaria recursão.

### CSS

Todo estilo de módulo fica no **`app.css`**. Não injete `<style>` via JS.

O `app.css` é carregado no `<head>`, **logo depois** do `<style>` inline
do `index.html`. Essa posição é deliberada: reproduz a precedência que os
módulos tinham quando injetavam no `head`. Um `<link>` antes do `<style>`
inverteria a cascata.

Única exceção legítima: `design-packs.js`, que monta o CSS em runtime a
partir de uma variável (os 5 packs visuais alternáveis).

---

## Armadilhas conhecidas

**Números em pt-BR.** Use sempre o `parseN` global. Fazer
`parseFloat(txt.replace(',','.'))` quebra com separador de milhar:
`"1.050,00"` vira `"1.050.00"` → `1.05`. Esse bug existiu em 6 lugares e
gravava valores mil vezes menores. Em `investimentos.js` há o helper
`_invNum()`, que usa `parseN` mas devolve `NaN` para campo vazio (as
validações locais usam `isNaN`).

**Sincronização.** `deepMergeState` (auth.js) resolve conflito por `_ts`.
Esse campo é carimbado por `_tsStamp()` dentro do `salvar()`, só nos
itens que mudaram. Se você criar um caminho novo que atribui `S` vindo da
nuvem, chame `_tsReset(S)` — senão dados remotos são tratados como edição
local no próximo salvar.

**Mobile.** `env(safe-area-inset-bottom)` só funciona porque o
`index.html` tem `viewport-fit=cover` na tag de viewport. Sem isso,
resolve sempre para 0.

**Verifique no navegador.** Ler o código não basta: vários bugs aqui só
apareceram medindo o DOM real (aba que não trocava, lista duplicada no
mobile, filtro vazio). Abra o `index.html`, esconda o overlay de login
(`document.getElementById('authOverlay').style.display='none'`), torne
`.main`/`#sidebar` visíveis, popule `S` e teste.

---

## Mapa dos arquivos

`index.html` — shell, CSS base, funções base de render, registro de
páginas, estado global `S`, `parseN`, `allEntries`, `faturaCC`.

`app.css` — estilos consolidados de todos os módulos, na ordem de
carregamento dos scripts.

Módulos, na ordem em que carregam (a ordem importa):

| Arquivo | Papel |
|---|---|
| `auth.js` | Login, multiusuário, sync com Gist, token cifrado (AES-GCM/PBKDF2), merge com tombstones, carimbo `_ts` |
| `mobile-cards.js` | Listas em card no mobile (lançamentos, extrato) |
| `antecipacao.js` | Antecipação de parcelas do cartão |
| `melhorias.js` | Modal de histórico (contratos/assinaturas) com editar/excluir, filtros, Extrato Categorizado |
| `checkpagamentos.js` | Tela Check de Pagamentos |
| `investimentos.js` | Tela de Investimentos (v7) |
| `investimentos-integra.js` | Integração investimentos ↔ lançamentos |
| `rent-saldo.js` | Lançar rentabilidade por valor ou por saldo |
| `compras-filtro.js` | Tela de Compras do cartão (filtra pela fatura do mês) |
| `planejamento.js` | Orçamento por categoria |
| `patrimonio.js` | Patrimônio |
| `cartoes-fix.js` | Tela de Cartões |
| `design-packs.js` | 5 packs visuais alternáveis (CSS dinâmico) |
| `resumo-enhanced.js` | Dashboard (Resumo) |
| `mobile-global-fix.js` | Ajustes responsivos e anti-zoom |
| `assinaturas-enhanced.js` | Assinaturas |
| `contratos-enhanced.js` | Contratos |
| `relatorios.js` | 10 relatórios + exportação Excel |
| `theme-persist.js` | Persistência do tema |

`investimentos-enhanced.js` é um stub vazio (funcionalidade migrou para
`investimentos.js`).

---

## Modelo de dados

Estado global `S`, persistido em `localStorage` e sincronizado com o Gist.

Coleções: `lancamentos`, `cartoes`, `comprasCartao`, `assinaturas`,
`contratos`, `investimentos`, `caixa`, `patrimonios`; mais
`planejamento`, `cats`, `config`, `checkPagamentos`, `_deletedIds`.

**Valores recorrentes usam vigência.** Contratos e assinaturas têm
`historico: [{de:'YYYY-MM', valor:N}]`. O valor de um mês é o do ajuste
mais recente com `de <= mes` — use `valorVigenteMes(item, mes)`. Não
sobrescreva `.valor` sem registrar no histórico, senão o passado muda
junto.

**Investimentos** são calculados mês a mês: saldo inicial (tudo antes do
mês) → aportes/resgates/rentabilidade do mês → fechamento.

---

## Pendências conhecidas

- **Senhas com SHA-256 sem salt** (`auth.js`). Vulnerável a rainbow table
  se o Gist vazar. Corrigir exige migrar os hashes existentes.
- **Confirmar que o Gist está como *secret*** no GitHub — ele guarda o
  `auth_users.json` com os hashes. Só dá para verificar na interface do
  GitHub.
- **Dados possivelmente errados no passado**: valores lançados com
  separador de milhar antes da correção do `parseN` foram gravados
  menores. Não há correção retroativa; vale revisar Investimentos.
- **590 KB sem minificação**, 20 scripts sequenciais. Só pesa em 3G.
- **Sem importação de OFX/CSV** — decisão do usuário: ele lança conforme
  gasta, para ter noção do limite em tempo real. Não sugerir de novo.

---

## Preferências do usuário

- Responde em português.
- Quer que mudanças sejam **verificadas no navegador** antes de "está
  pronto" — já houve casos de eu afirmar que estava feito e não estar.
- Prefere entender a causa raiz, não remendo. Diga quando a sugestão
  anterior estava errada.
- O visual aprovado é o "Neobanco": fundo `#14151d`, acento roxo
  `#8b5cf6`, número principal do card em neutro (branco), cor só no ponto
  do rótulo e nos valores de status.

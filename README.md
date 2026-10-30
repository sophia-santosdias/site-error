# Site de leitura de história

Site estático (HTML/CSS/JS puro) para publicar no GitHub Pages.

## Adicionar um capítulo
1. Crie `chapters/03.txt` com o texto. Parágrafos são separados por linha em branco; `---` sozinho vira separador de cena; `*itálico*` e `**negrito**` funcionam.
2. Registre em `chapters/chapters.json`:
   `{ "id": "3", "title": "Capítulo 3 – Título", "file": "03.txt" }`

O `id` é usado na URL e no mapeamento dos comentários, então não o altere depois de publicado.

## Conversas de WhatsApp e posts de Twitter
Dentro do capítulo, use blocos que começam com `::: tipo` e terminam com `:::` sozinho numa linha.

WhatsApp (o texto depois de `whatsapp` é o nome do contato):

    ::: whatsapp Marina
    = Hoje
    < mensagem recebida | 07:12
    > mensagem enviada | 07:13
    <Ana> mensagem recebida em grupo | 07:14
    :::

- `<` recebida, `>` enviada, `=` etiqueta de data. A hora depois de ` | ` é opcional.
- Cada mensagem ocupa uma linha. `*itálico*` e `**negrito**` funcionam.

Tweet (`Nome | @usuario | data e hora`, os dois últimos opcionais):

    ::: tweet Rádio da Cidade | @radiodacidade | 07:30 · 12 mar
    Texto do post, pode ter várias linhas.

    + 128 respostas · 2,4 mil curtidas
    :::

A linha que começa com `+` é a de estatísticas (opcional).

## Testar localmente
Os capítulos são carregados via `fetch`, então é preciso um servidor (não abra o arquivo direto):

    python -m http.server 8000 --bind 127.0.0.1

Acesse http://127.0.0.1:8000

## Publicar no GitHub Pages
1. Crie um repositório **público** e suba o conteúdo desta pasta.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.

## Ativar comentários (Supabase, sem login para o leitor)
O leitor informa só nome e comentário. Todo comentário entra como **pendente** e só aparece no site depois que você aprova.

1. Crie uma conta gratuita em https://supabase.com e um novo projeto.
2. No projeto: **SQL Editor → New query**, cole o conteúdo de `supabase/setup.sql` e clique em **Run**.
3. Em **Project Settings → API**, copie a *Project URL* e a chave **anon / publishable**.
4. Preencha `js/config.js` (`url` e `anonKey`). Nunca use a chave `service_role` / `secret` no site.
5. Para moderar: **Table Editor → comments**. Marque `approved` para publicar, ou apague a linha para remover.

A chave anon é pública por natureza. A segurança vem das regras do banco: o público só consegue ler comentários aprovados e enviar novos (sempre pendentes), nunca editar, apagar nem se auto-aprovar.

## Ideias de interações futuras
Reações por capítulo, favoritar trechos, busca, contagem de palavras/tempo de leitura, mapa de personagens, notas do autor no fim do capítulo.

# Manual de Criação de Capítulos e Personagens — Site Error 404

Este manual contém todas as instruções e exemplos práticos para criar capítulos, formatar posts do X/Twitter, diálogos de WhatsApp, trilhas sonoras do Spotify, pontos de vista e cadastrar personagens com seus perfis e grupos.

---

## 1. Estrutura dos Capítulos (`chapters/XX.txt`)

Os arquivos de capítulo ficam na pasta `chapters/` (ex: `01.txt`, `02.txt`). Eles suportam texto corrido em Markdown simplificado e blocos especiais delimitados por `::: tipo ... :::`.

---

### 1.1. Tweets e Threads (`::: tweet` ou `::: thread`)

Permite criar posts individuais ou threads encadeadas com múltiplos tweets e respostas.

#### Exemplo de Thread com Múltiplos Tweets:
```text
::: tweet Eduarda Fragoso | @dudafragoso | 07:30 · 12 mar
:foto img/personagens/eduarda-fragoso.png
Tô sentindo um cheirinho, quem mais?
+ 2,648 Visualizações · 2,949 Retweets

:resposta Lorena Ferette | @lorenaferette | 07:31 · 12 mar
:foto img/personagens/lorena-ferette.png
E ela apronta de novo, menina burra mds
+ 312 Visualizações

:resposta Lorena Ferette | @lorenaferette | 07:32 · 12 mar
:foto img/personagens/lorena-ferette.png
Depois reclama quando leva exposed
+ 325 Visualizações

:resposta Alice Fragoso | @bestfragoso | 07:35 · 12 mar
:foto img/personagens/apresentacao/alice-fragoso.jpeg
Cheguei pro exposed 👀
:img img/personagens/apresentacao/alice-banner.jpeg
+ 1,420 Visualizações · 150 Curtidas
:::
```

#### Comandos suportados dentro do bloco de tweet:
- **Cabeçalho:** `Nome de Exibição | @handle | Data e Hora`
- **`:foto caminho/imagem.png`** — Foto de perfil circular do autor.
- **`:respostas`** *(ou `:comentarios`)* — **Ativa respostas públicas de leitores!** Permite que qualquer leitor responda ao tweet diretamente no post. As respostas são salvas no Supabase e aparecem encadeadas no fio como respostas reais do Twitter/X.
- **`:resposta Nome | @handle | Data e Hora`** — Inicia um novo tweet da história encadeado na thread.
- **`:img caminho/imagem.png`** — Anexa uma imagem/mídia ao corpo do tweet.
- **`+ X Visualizações · Y Retweets · Z Curtidas`** — Linha de métricas e estatísticas.
- **Menções e Hashtags:** `@usuario` e `#hashtag` são detectados e destacados em azul automaticamente.

#### Exemplo de Tweet Interativo Aberto para Respostas de Leitores:
```text
::: tweet Eduarda Fragoso | @dudafragoso | 07:30 · 12 mar
:foto img/personagens/eduarda-fragoso.png
:respostas
Tô sentindo um cheirinho, quem mais?
+ 2,648 Visualizações · 2,949 Retweets
:::
```

---

### 1.2. Grupos de WhatsApp no Capítulo (`::: grupo`)

Permite chamar qualquer grupo cadastrado pelo seu `id` (ex: `manezinhas`, `cade-a-lorena`, `benca-seu-agenor`) com o visual completo de celular / dark mode com papel de parede, avatares circulares e nomes coloridos.

O sistema **busca automaticamente** a foto e a cor temática do remetente cadastrado no `personagens.json` quando você usa `<Nome>` ou `<Apelido>`.

#### 1.2.1. Usando um Grupo Existente pelo ID:
```text
::: grupo manezinhas
= Hoje
<Mãe> Meninas, onde vocês estão? | 18:20
<Irmã> Tô saindo do trabalho agora | 18:21
> Já tô chegando no metrô | 18:22
<Mãe> Venham com cuidado! | 18:23
:::
```

#### 1.2.2. Alterando o Nome ou Foto do Grupo na Cena:
Se o grupo mudou de nome ou de foto naquele momento da história, você pode passar as alterações no cabeçalho ou em diretivas:

```text
::: grupo manezinhas | As Três Manezinhas | img/personagens/apresentacao/marilia-vaz.jpeg
:membros Mãe, Mili, Lorena
= Sexta-feira
<Mãe> Mudei o nome do grupo kkkk | 19:00
<Irmã> Ficou bem melhor | 19:01
> Adorei mãe | 19:02
:::
```

#### 1.2.3. Criando um Grupo Novo Direto no Capítulo:
```text
::: grupo Amigos da Faculdade
:foto img/personagens/apresentacao/eduarda-fragoso.jpg
:membros Duda, Paulinho, Maggye, Você
:fundo img/personagens/apresentacao/wallpaper-fragoso.jpeg
<Paulinho> Bora pro barzinho hoje? | 20:00
<Maggye> Partiu! | 20:01
> Chego em 10 minutos | 20:02
:::
```

#### Comandos suportados dentro de `::: grupo`:
- **Cabeçalho:** `::: grupo <id_ou_nome> [ | Novo Nome ] [ | Nova Foto ]`
- **`:nome ...`** — Sobrescreve o nome do grupo.
- **`:foto ...`** — Sobrescreve a foto de perfil do grupo.
- **`:membros ...`** — Altera a lista de participantes do subtítulo.
- **`:fundo ...`** — Altera o wallpaper de fundo (ou `"nuvem"` para a arte padrão).
- **`= Texto`** — Adiciona chip de data centralizado (ex: `= Hoje`, `= Ontem`).
- **`> Mensagem | hora`** (ou `> Você: Mensagem | hora`) — Mensagem **enviada** (verde à direita com duplo check azul).
- **`<Nome> Mensagem | hora`** — Mensagem **recebida** (branca à esquerda com avatar e nome colorido automático).
- **`<Nome :foto caminho.jpg :cor #b842bd> Mensagem | hora`** — Customiza foto ou cor do remetente manualmente caso necessário.

---

### 1.3. Conversas Individuais de WhatsApp (`::: whatsapp`)

Simula chats diretos e compactos:

```text
::: whatsapp Eduarda Fragoso
:foto img/personagens/eduarda-fragoso.png
= Hoje
< Ei, tá ocupada agora? | 14:32
> Depende de quem tá perguntando | 14:33
< Grossa | 14:33
:::
```

---

### 1.4. Trilha Sonora do Spotify (`::: spotify`)

Incorpora um player do Spotify para tocar a música da cena.

#### Exemplo:
```text
::: spotify https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
Trilha sonora: girl in red — we fell in love in october
:::
```
> Aceita links de faixas (`track`), álbuns (`album`) ou playlists (`playlist`). O texto abaixo do link vira a legenda da música.

---

### 1.5. Notas da Autora (`::: nota`)

Caixa destacada para avisos, recados ou notas de rodapé da autora.

#### Exemplo:
```text
::: nota
Notas da autora sobre este capítulo: não esqueçam de deixar seus comentários no parágrafo!
:::
```

---

### 1.6. Marcador de Ponto de Vista (POV)

Destaca a troca de narrador com estilo cyber-glitch.

#### Exemplo:
```text
== Ponto de Vista: Eduarda ==
```

---

### 1.7. Divisores e Formatação de Texto

- **Divisor de cena:** Linha com `---`
- **Negrito:** `**texto em negrito**`
- **Itálico:** `*texto em itálico*`
- **Diálogos:** Aspas `"fala"` ou travessão `— fala`.

---

## 2. Cadastro de Personagens e Grupos (`personagens.json`)

O arquivo `personagens.json` contém os núcleos, os personagens e os grupos de WhatsApp que aparecem no final de cada núcleo.

### Estrutura Completa de Exemplo:

```json
[
  {
    "nucleo": "Núcleo Ferette",
    "personagens": [
      {
        "nome": "Lorena Ferette",
        "foto": "img/personagens/apresentacao/lorena-ferette.png",
        "twitter": {
          "handle": "@prostradinha",
          "privada": true,
          "bio": "Vou usar meu nome, ninguém nunca vai ver mesmo",
          "banner": "img/personagens/apresentacao/lorena-banner.png",
          "banner_position": "center 40%",
          "avatar": "img/personagens/apresentacao/lorena-avatar.png",
          "seguindo": "0",
          "seguidores": "0"
        },
        "descricao": [
          "Programadora, quase nerd, Lorena tem 27 anos e é completamente fechada em seu mundo.",
          "Filha caçula, lésbica e concisa nas demonstrações de afeto."
        ]
      }
    ],
    "grupos": [
      {
        "id": "manezinhas",
        "nome": "Manezinhas",
        "membros": "Irmã, Mãe, Você",
        "foto": "img/personagens/apresentacao/marilia-vaz.jpeg",
        "fundo": "img/personagens/apresentacao/wallpaper-ferette.jpeg",
        "mensagens": [
          {
            "tipo": "out",
            "texto": "Lorena",
            "hora": "18:09",
            "status": "lido"
          },
          {
            "tipo": "in",
            "autor": "Mãe",
            "autor_cor": "#b842bd",
            "foto": "img/personagens/apresentacao/marilia-vaz.jpeg",
            "texto": "Marília",
            "hora": "18:10"
          },
          {
            "tipo": "in",
            "autor": "Irmã",
            "autor_cor": "#8fa31e",
            "foto": "img/personagens/apresentacao/emilia-ferette.png",
            "texto": "Emília",
            "hora": "18:10"
          }
        ]
      }
    ]
  }
]
```

### Configurações do Grupo de WhatsApp:
- **`id`**: Identificador único em minúsculas (ex: `"manezinhas"`, `"cade-a-lorena"`, `"benca-seu-agenor"`), usado para chamá-lo nos capítulos com `::: grupo <id>`.
- **`nome`**: Nome do grupo (ex: `"Manezinhas"`).
- **`membros`**: Subtítulo com os integrantes (ex: `"Irmã, Mãe, Você"`).
- **`foto`**: Foto de perfil circular do grupo.
- **`fundo`** *(opcional)*:
  - Caminho de uma imagem (ex: `"img/wallpaper.jpeg"`).
  - `"nuvem"` ou omitido: exibe a **nuvem cinza com chuva binária** padrão.
  - `"none"`: fundo escuro liso.
- **`mensagens`**: Lista de mensagens:
  - **Mensagem enviada:** `"tipo": "out"`, `"texto": "..."`, `"hora": "18:09"`, `"status": "lido"`.
  - **Mensagem recebida:** `"tipo": "in"`, `"autor": "Mãe"`, `"autor_cor": "#b842bd"`, `"foto": "caminho.jpg"`, `"texto": "..."`, `"hora": "18:10"`.

---

## 3. Configurações Globais (`js/config.js`)

No arquivo `js/config.js` você define os metadados da história e a lista de capítulos:

```javascript
window.CONFIG = {
  title: "Error 404",
  author: "Sophia Dias",
  sinopse: "Sinopse da história...",
  chapters: [
    { id: "01", title: "Capítulo 1", file: "chapters/01.txt" },
    { id: "02", title: "Capítulo 2", file: "chapters/02.txt" }
  ]
};
```

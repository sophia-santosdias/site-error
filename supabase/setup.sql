-- Cole este script no Supabase: SQL Editor -> New query -> Run.
-- Se a tabela já existe, rode apenas os comandos ALTER/DROP/CREATE abaixo.

create table if not exists public.comments (
  id              bigint generated always as identity primary key,
  chapter_id      text        not null check (chapter_id ~ '^[A-Za-z0-9_-]{1,20}$'),
  paragraph_index integer     not null default -1,
  author          text        not null check (char_length(author) between 1 and 50),
  body            text        not null check (char_length(body) between 1 and 2000),
  approved        boolean     not null default true,
  created_at      timestamptz not null default now()
);

-- Se a tabela já existia, atualize o default da coluna approved:
-- alter table public.comments alter column approved set default true;

create index if not exists comments_chapter_idx on public.comments (chapter_id, paragraph_index, created_at);

alter table public.comments enable row level security;

revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon;
grant insert (chapter_id, paragraph_index, author, body) on public.comments to anon;

-- Leitura: todos os comentários (sem filtro de aprovação)
drop policy if exists "ler comentarios aprovados" on public.comments;
drop policy if exists "ler todos comentarios" on public.comments;
create policy "ler todos comentarios"
  on public.comments for select to anon
  using (true);

-- Envio: qualquer comentário é aceito (approved é ignorado pelo anon)
drop policy if exists "enviar comentarios pendentes" on public.comments;
drop policy if exists "enviar comentarios" on public.comments;
create policy "enviar comentarios"
  on public.comments for insert to anon
  with check (true);

-- Para remover um comentário: apague a linha no Table Editor.

-- ============================================================
-- REAÇÕES POR CAPÍTULO
-- ============================================================
create table if not exists public.reactions (
  id         bigint generated always as identity primary key,
  chapter_id text        not null check (chapter_id ~ '^[A-Za-z0-9_-]{1,20}$'),
  emoji      text        not null check (emoji in ('💔','😭','👀','🔥','🥺')),
  created_at timestamptz not null default now()
);

create index if not exists reactions_chapter_idx on public.reactions (chapter_id, emoji);

alter table public.reactions enable row level security;

revoke all on public.reactions from anon, authenticated;
grant select on public.reactions to anon;
grant insert (chapter_id, emoji) on public.reactions to anon;

drop policy if exists "ler reacoes" on public.reactions;
create policy "ler reacoes"
  on public.reactions for select to anon
  using (true);

drop policy if exists "enviar reacao" on public.reactions;
create policy "enviar reacao"
  on public.reactions for insert to anon
  with check (true);

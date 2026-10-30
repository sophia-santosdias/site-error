-- Cole este script no Supabase: SQL Editor -> New query -> Run.

create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  chapter_id text        not null check (chapter_id ~ '^[A-Za-z0-9_-]{1,20}$'),
  author     text        not null check (char_length(author) between 1 and 50),
  body       text        not null check (char_length(body) between 1 and 2000),
  approved   boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_chapter_idx on public.comments (chapter_id, created_at);

alter table public.comments enable row level security;

-- Privilégios mínimos para o público (papel "anon"):
-- pode LER e ENVIAR, mas nunca editar, apagar nem se auto-aprovar.
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon;
grant insert (chapter_id, author, body) on public.comments to anon;

drop policy if exists "ler comentarios aprovados" on public.comments;
create policy "ler comentarios aprovados"
  on public.comments for select to anon
  using (approved = true);

drop policy if exists "enviar comentarios pendentes" on public.comments;
create policy "enviar comentarios pendentes"
  on public.comments for insert to anon
  with check (approved = false);

-- Para aprovar: Table Editor -> comments -> marque "approved" na linha.
-- Para remover: apague a linha no Table Editor.

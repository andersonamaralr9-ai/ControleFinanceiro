-- Atalho do iPhone (app Atalhos): entrega fotos de cupom para o usuário
-- revisar no app. A chave do atalho só serve para ENTREGAR fotos: não lê
-- nada e não grava lançamentos. Guardamos só o hash SHA-256 da chave.
-- Rodar uma vez no SQL Editor do Supabase (projeto controle-financeiro).
create table public.atalho_chave (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  hash text not null unique,
  criado_em timestamptz not null default now(),
  usado_em timestamptz
);
alter table public.atalho_chave enable row level security;
create policy "atalho_chave: ler a propria" on public.atalho_chave for select to authenticated using (user_id = (select auth.uid()));
create policy "atalho_chave: criar a propria" on public.atalho_chave for insert to authenticated with check (user_id = (select auth.uid()));
create policy "atalho_chave: trocar a propria" on public.atalho_chave for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "atalho_chave: revogar a propria" on public.atalho_chave for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.atalho_chave from anon, authenticated;
grant select, insert, update, delete on public.atalho_chave to authenticated;

create table public.foto_pendente (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  media_type text not null,
  dados text not null
);
create index foto_pendente_user on public.foto_pendente (user_id, criado_em);
alter table public.foto_pendente enable row level security;
create policy "foto_pendente: ler a propria" on public.foto_pendente for select to authenticated using (user_id = (select auth.uid()));
create policy "foto_pendente: apagar a propria" on public.foto_pendente for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.foto_pendente from anon, authenticated;
grant select, delete on public.foto_pendente to authenticated;

-- Única porta de entrada das fotos: valida a chave pelo hash e grava.
-- Limites: só imagens, até ~2,6 MB, no máximo 10 aguardando; mais de 7 dias
-- sem revisar são descartadas.
create function public.atalho_enviar(p_chave text, p_media_type text, p_dados text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if p_chave is null or length(p_chave) < 20 or length(p_chave) > 200 then
    raise exception 'chave_invalida';
  end if;
  select user_id into v_user from public.atalho_chave
   where hash = encode(extensions.digest(p_chave, 'sha256'), 'hex');
  if v_user is null then
    raise exception 'chave_invalida';
  end if;
  if p_media_type not in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') then
    raise exception 'tipo_invalido';
  end if;
  if p_dados is null or length(p_dados) < 100 or length(p_dados) > 3500000 then
    raise exception 'tamanho_invalido';
  end if;
  delete from public.foto_pendente where user_id = v_user and criado_em < now() - interval '7 days';
  if (select count(*) from public.foto_pendente where user_id = v_user) >= 10 then
    raise exception 'fila_cheia';
  end if;
  insert into public.foto_pendente (user_id, media_type, dados) values (v_user, p_media_type, p_dados);
  update public.atalho_chave set usado_em = now() where user_id = v_user;
  return 'ok';
end;
$$;
revoke all on function public.atalho_enviar(text, text, text) from public;
grant execute on function public.atalho_enviar(text, text, text) to anon, authenticated;

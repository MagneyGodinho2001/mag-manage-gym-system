create table if not exists public.treinos (
  id text primary key,
  title text not null,
  modality text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  instructor text not null,
  max_capacity integer not null default 1,
  enrolled_athletes jsonb not null default '[]'::jsonb,
  attendance jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now()
);

alter table public.membros
add column if not exists total_pontos integer not null default 0;

update public.membros
set plano = case
  when total_pontos >= 4560 then 'Preta (2º Dan)'
  when total_pontos >= 3120 then 'Preta (1º Dan)'
  when total_pontos >= 2040 then 'Castanha'
  when total_pontos >= 1964 then 'Azul'
  when total_pontos >= 780 then 'Verde'
  when total_pontos >= 420 then 'Laranja'
  when total_pontos >= 180 then 'Amarela'
  else 'Branca'
end;

alter table public.treinos enable row level security;

drop policy if exists "Permitir leitura publica de treinos" on public.treinos;
create policy "Permitir leitura publica de treinos"
on public.treinos
for select
to anon
using (true);

drop policy if exists "Permitir inserir treinos" on public.treinos;
create policy "Permitir inserir treinos"
on public.treinos
for insert
to anon
with check (true);

drop policy if exists "Permitir atualizar treinos" on public.treinos;
create policy "Permitir atualizar treinos"
on public.treinos
for update
to anon
using (true)
with check (true);

drop policy if exists "Permitir apagar treinos" on public.treinos;
create policy "Permitir apagar treinos"
on public.treinos
for delete
to anon
using (true);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'membros'
    ) then
      alter publication supabase_realtime add table public.membros;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'treinos'
    ) then
      alter publication supabase_realtime add table public.treinos;
    end if;
  end if;
end $$;

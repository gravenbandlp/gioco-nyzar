-- Salvataggi del gioco Ny'Zar fuori da claude.ai (docs/salvataggi.md).
-- Una riga per account: il personaggio in jsonb. Ognuno legge e scrive solo la propria riga.
create table if not exists public.salvataggi (
  utente uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dati jsonb not null,
  aggiornato timestamptz not null default now()
);

alter table public.salvataggi enable row level security;

drop policy if exists "il proprio salvataggio" on public.salvataggi;
create policy "il proprio salvataggio" on public.salvataggi
  for all to authenticated
  using (auth.uid() = utente)
  with check (auth.uid() = utente);

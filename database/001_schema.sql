-- Schema CRM per workspace unico protetto dalla funzione Netlify.
-- Non crea utenti, profili o dipendenze da auth.uid().
begin;
create table public.contacts (
 id uuid primary key default gen_random_uuid(), company text not null check(length(btrim(company)) between 1 and 200),
 person text not null check(length(btrim(person)) between 1 and 200), email text not null default '', phone text not null default '', website text not null default '', city text not null default '', sector text not null default '', source text not null default '', source_url text not null default '',
 need text not null default '' check(length(need)<=20000), notes text not null default '' check(length(notes)<=20000),
 stage text not null default 'Da ricercare' check(stage in ('Da ricercare','Da contattare','Contattato','Brief ricevuto','Anteprima 48h','Anteprima inviata','Preventivo')),
 outcome text not null default 'In corso' check(outcome in ('In corso','Acquisto','Perso')),
 owner_id text not null default 'workspace', value numeric(12,2) not null default 1350 check(value>=0), priority text not null default 'Media' check(priority in ('Alta','Media','Bassa')), next_action text not null default '', next_at timestamptz,
 preview_started_at timestamptz, preview_url text not null default '', do_not_contact boolean not null default false,
 created_by text not null default 'workspace', updated_by text not null default 'workspace', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1, archived_at timestamptz,
 check(website='' or website ~ '^https?://'), check(source_url='' or source_url ~ '^https?://'), check(preview_url='' or preview_url ~ '^https?://'), check(btrim(email)<>'' or btrim(phone)<>'')
);
create unique index contacts_unique_email on public.contacts(lower(btrim(email))) where btrim(email)<>'' and archived_at is null;
create index contacts_next on public.contacts(next_at) where archived_at is null;
create or replace function public.set_contact_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); new.version=old.version+1; return new; end; $$;
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_contact_updated_at();
create table public.events (id uuid primary key default gen_random_uuid(), contact_id uuid not null references public.contacts(id) on delete cascade, actor_id text not null default 'workspace', kind text not null check(length(kind) between 1 and 100), body text not null default '' check(length(body)<=30000), origin text not null default 'manual' check(origin in ('manual','ai')), created_at timestamptz not null default now());
create index events_contact on public.events(contact_id,created_at desc);
create table public.drafts (id uuid primary key default gen_random_uuid(), contact_id uuid not null references public.contacts(id) on delete cascade, body text not null check(length(body) between 1 and 30000), channel text not null check(channel in ('Email','WhatsApp','LinkedIn')), created_by text not null default 'workspace', created_at timestamptz not null default now());
alter table public.contacts enable row level security; alter table public.events enable row level security; alter table public.drafts enable row level security;
revoke all on public.contacts,public.events,public.drafts from anon;
grant select,insert,update on public.contacts to authenticated;
grant select,insert on public.events to authenticated;
grant select,insert,update,delete on public.drafts to authenticated;
create policy contacts_read on public.contacts for select to authenticated using ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy contacts_write on public.contacts for insert to authenticated with check ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy contacts_update on public.contacts for update to authenticated using ((auth.jwt()->>'email') = 'info@principalsites.it') with check ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy events_read on public.events for select to authenticated using ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy events_write on public.events for insert to authenticated with check ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy drafts_read on public.drafts for select to authenticated using ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy drafts_write on public.drafts for insert to authenticated with check ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy drafts_update on public.drafts for update to authenticated using ((auth.jwt()->>'email') = 'info@principalsites.it') with check ((auth.jwt()->>'email') = 'info@principalsites.it');
create policy drafts_delete on public.drafts for delete to authenticated using ((auth.jwt()->>'email') = 'info@principalsites.it');
commit;

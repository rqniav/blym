-- Blym database setup. Paste this whole file into Supabase > SQL Editor > New query, then click Run.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  lake text not null,
  where_text text default '',
  descr text default '',
  manager text default '',
  risk text not null check (risk in ('high','moderate','low')),
  ai_verdict text default 'none',
  ai_confidence text default 'low',
  lat double precision not null,
  lng double precision not null,
  thumb text default '',
  confirms int not null default 1,
  cleared int not null default 0,
  is_sample boolean not null default false,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table public.reports enable row level security;

-- Anyone can read reports
drop policy if exists "anyone can read" on public.reports;
create policy "anyone can read" on public.reports for select to anon, authenticated using (true);

-- Anyone can add a new report, but only a normal, fresh one
drop policy if exists "anyone can add" on public.reports;
create policy "anyone can add" on public.reports for insert to anon, authenticated
  with check (
    confirms = 1 and cleared = 0 and is_sample = false
    and char_length(lake) between 1 and 120
    and char_length(coalesce(thumb, '')) < 120000
    and lat between 33 and 35 and lng between -85 and -83
  );

grant select, insert on public.reports to anon, authenticated;

-- "I see it too" / "It's gone" votes go through this function, so nobody can edit reports directly
create or replace function public.vote(report_id uuid, kind text)
returns void language sql security definer set search_path = public as $$
  update public.reports
     set confirms = confirms + (case when kind = 'confirms' then 1 else 0 end),
         cleared  = cleared  + (case when kind = 'cleared'  then 1 else 0 end)
   where id = report_id;
$$;
grant execute on function public.vote(uuid, text) to anon, authenticated;

-- Sample reports so the map isn't empty (labeled as samples in the app)
insert into public.reports (lake, where_text, descr, risk, ai_verdict, lat, lng, confirms, cleared, is_sample, created_at) values
 ('Sample: Duluth neighborhood pond', 'East shore by the walking path', 'Bright green paint-like film along the edge', 'high', 'harmful', 34.0026, -84.1446, 3, 0, true, (extract(epoch from now()) * 1000)::bigint - 2*86400000),
 ('Sample: Lawrenceville park pond', 'Near the fishing pier', 'Greenish water, slight musty smell', 'moderate', 'unclear', 33.9562, -83.988, 1, 0, true, (extract(epoch from now()) * 1000)::bigint - 5*86400000),
 ('Sample: Snellville HOA lake', 'North cove', 'Yellow dusty film, looks like pollen', 'low', 'harmless', 33.8573, -84.0199, 1, 2, true, (extract(epoch from now()) * 1000)::bigint - 9*86400000);

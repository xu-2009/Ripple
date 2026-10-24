-- Fictional showcase members. This does not add real auth accounts or bill records.
begin;
create table if not exists public.showcase_users (
  showcase_id text primary key,
  display_name text not null,
  county text not null,
  resource text not null check (resource in ('water','electricity')),
  actions_started integer not null check (actions_started > 0),
  actions_completed integer not null check (actions_completed between 0 and actions_started),
  source text not null default 'fictional' check (source = 'fictional')
);
alter table public.showcase_users enable row level security;
revoke all on public.showcase_users from anon, authenticated;
with counties(county, seed) as (values
    ('Beaver', 1),
    ('Box Elder', 3),
    ('Cache', 5),
    ('Carbon', 7),
    ('Daggett', 9),
    ('Davis', 11),
    ('Duchesne', 13),
    ('Emery', 15),
    ('Garfield', 17),
    ('Grand', 19),
    ('Iron', 21),
    ('Juab', 23),
    ('Kane', 25),
    ('Millard', 27),
    ('Morgan', 29),
    ('Piute', 31),
    ('Rich', 33),
    ('Salt Lake', 35),
    ('San Juan', 37),
    ('Sanpete', 39),
    ('Sevier', 41),
    ('Summit', 43),
    ('Tooele', 45),
    ('Uintah', 47),
    ('Utah', 49),
    ('Wasatch', 51),
    ('Washington', 53),
    ('Wayne', 55),
    ('Weber', 57)
), resources(resource, progress_offset, count_offset) as (
  values ('water',0,3), ('electricity',2,11)
), records as (
  select lpad(c.seed::text,3,'0')||'-'||r.resource||'-'||lpad(n.member::text,2,'0') as showcase_id,
    'Example member '||lpad(n.member::text,2,'0') as display_name,
    c.county,r.resource,7 as actions_started,
    1 + mod(c.seed*3 + n.member*5 + r.progress_offset,7) as actions_completed
  from counties c cross join resources r
  cross join lateral generate_series(1,12+mod(c.seed*7+r.count_offset,13)) as n(member)
)
insert into public.showcase_users(showcase_id,display_name,county,resource,actions_started,actions_completed)
select showcase_id,display_name,county,resource,actions_started,actions_completed from records where true
on conflict (showcase_id) do update set
  display_name=excluded.display_name,
  county=excluded.county,
  resource=excluded.resource,
  actions_started=excluded.actions_started,
  actions_completed=excluded.actions_completed;
create or replace function public.showcase_county_report()
returns table(county text,resource text,participants bigint,started bigint,completed bigint)
language sql stable security definer set search_path = '' as $$
  select s.county,s.resource,count(*)::bigint,sum(s.actions_started)::bigint,sum(s.actions_completed)::bigint
  from public.showcase_users s where s.source='fictional'
  group by s.county,s.resource order by s.county,s.resource;
$$;
revoke all on function public.showcase_county_report() from public,anon,authenticated;
grant execute on function public.showcase_county_report() to anon,authenticated;
commit;

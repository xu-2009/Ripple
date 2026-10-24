-- Apply once in a NEW Supabase project's SQL editor. Public keys cannot bypass RLS.
begin;
create table public.household_snapshots (
  user_id uuid primary key references auth.users on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1000000),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.household_snapshots enable row level security;
create policy read_own_snapshot on public.household_snapshots for select to authenticated using (user_id = auth.uid());
revoke all on public.household_snapshots from anon, authenticated;
grant select on public.household_snapshots to authenticated;
create function public.save_household(p_payload jsonb, p_expected bigint) returns bigint
language plpgsql security definer set search_path = '' as $$
declare next_version bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if p_expected = 0 then
    insert into public.household_snapshots(user_id,payload) values(auth.uid(),p_payload)
    on conflict do nothing returning revision into next_version;
  else
    update public.household_snapshots set payload=p_payload, revision=revision+1, updated_at=now()
    where user_id=auth.uid() and revision=p_expected returning revision into next_version;
  end if;
  if next_version is null then raise exception 'SYNC_CONFLICT: another device changed this household'; end if;
  return next_version;
end $$;

create table public.community_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  county text not null check (county in ('Beaver','Box Elder','Cache','Carbon','Daggett','Davis','Duchesne','Emery','Garfield','Grand','Iron','Juab','Kane','Millard','Morgan','Piute','Rich','Salt Lake','San Juan','Sanpete','Sevier','Summit','Tooele','Uintah','Utah','Wasatch','Washington','Wayne','Weber')),
  resource text not null check(resource in ('water','electricity')),
  month date not null check(extract(day from month)=1),
  days integer not null check(days between 1 and 366),
  residents integer not null check(residents between 1 and 30),
  amount numeric not null check(amount >= 0 and amount <= 100000000000),
  evidence_path text not null,
  consent_at timestamptz not null default now(),
  status text not null default 'pending' check(status in ('pending','verified','rejected')),
  review_note text not null default '',
  reviewed_at timestamptz,
  unique(user_id,resource,month)
);
alter table public.community_bills enable row level security;
create policy read_own_bill on public.community_bills for select to authenticated using(user_id=auth.uid());
create policy delete_own_bill on public.community_bills for delete to authenticated using(user_id=auth.uid());
revoke all on public.community_bills from anon,authenticated;
grant select,delete on public.community_bills to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('bill-evidence','bill-evidence',false,5000000,array['application/pdf','image/png','image/jpeg']);
create policy upload_own_evidence on storage.objects for insert to authenticated with check(bucket_id='bill-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy read_own_evidence on storage.objects for select to authenticated using(bucket_id='bill-evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy delete_own_evidence on storage.objects for delete to authenticated using(bucket_id='bill-evidence' and (storage.foldername(name))[1]=auth.uid()::text);

create function public.submit_bill(p_bill jsonb,p_evidence text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid; multiplier numeric; unit text := p_bill->>'unit';
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirm your email before submitting'; end if;
  if (p_bill->>'consent') is distinct from 'true' then raise exception 'Consent is required'; end if;
  if p_evidence not like auth.uid()::text || '/%' or not exists(select 1 from storage.objects where bucket_id='bill-evidence' and name=p_evidence) then raise exception 'Upload evidence first'; end if;
  if (p_bill->>'type')='water' then
    multiplier := case unit when 'gal' then 1 when 'kgal' then 1000 when 'ccf' then 748.052 else null end;
  elsif (p_bill->>'type')='electricity' and unit='kWh' then multiplier:=1;
  end if;
  if multiplier is null then raise exception 'Invalid resource/unit'; end if;
  if (p_bill->>'month') !~ '^(19|20|21)[0-9]{2}-(0[1-9]|1[0-2])$' then raise exception 'Invalid month'; end if;
  if ((p_bill->>'month')||'-01')::date >= date_trunc('month',current_date) then raise exception 'Submit a completed billing month'; end if;
  insert into public.community_bills(user_id,county,resource,month,days,residents,amount,evidence_path)
  values(auth.uid(),p_bill->>'county',p_bill->>'type',((p_bill->>'month')||'-01')::date,
    (p_bill->>'days')::integer,(p_bill->>'residents')::integer,(p_bill->>'quantity')::numeric*multiplier,p_evidence)
  returning id into result;
  return result;
end $$;

-- Only a trusted reviewer with the server-side service role may approve evidence.
create function public.review_bill(p_id uuid,p_status text,p_note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('verified','rejected') or length(trim(p_note)) < 5 then raise exception 'A review decision and note are required'; end if;
  update public.community_bills set status=p_status,review_note=left(p_note,1000),reviewed_at=now() where id=p_id;
  if not found then raise exception 'Submission not found'; end if;
end $$;

create function public.county_report(p_month date,p_resource text)
returns table(county text,participant_band text,daily_per_person numeric,reduction_percent numeric)
language sql stable security definer set search_path = '' as $$
  -- Fixed month/resource cohorts; no household records or small groups returned.
  with pairs as (
    select a.county,a.amount/a.days/a.residents as now_rate,b.amount/b.days/b.residents as old_rate
    from public.community_bills a join public.community_bills b
      on a.user_id=b.user_id and a.resource=b.resource and a.county=b.county
      and b.month=(a.month-interval '1 month')::date
    where a.status='verified' and b.status='verified' and a.month=p_month and a.resource=p_resource
  ) select county, (floor(count(*)/10.0)*10)::int::text || '+' as participant_band,
    round(avg(now_rate),1), round((1-avg(now_rate)/nullif(avg(old_rate),0))*100,1)
    from pairs group by county having count(*)>=10 order by 4 desc nulls last;
$$;

create table public.challenge_members (
  user_id uuid not null references auth.users on delete cascade,
  challenge text not null check(challenge in ('water-week','power-week')),
  week date not null,
  county text not null,
  checkins date[] not null default '{}',
  primary key(user_id,challenge,week)
);
alter table public.challenge_members enable row level security;
revoke all on public.challenge_members from anon,authenticated;
create function public.community_challenge(p_challenge text,p_county text,p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'UTC')::date; week_start date := date_trunc('week',now() at time zone 'UTC')::date;
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Confirm your account first'; end if;
  if p_county not in ('Beaver','Box Elder','Cache','Carbon','Daggett','Davis','Duchesne','Emery','Garfield','Grand','Iron','Juab','Kane','Millard','Morgan','Piute','Rich','Salt Lake','San Juan','Sanpete','Sevier','Summit','Tooele','Uintah','Utah','Wasatch','Washington','Wayne','Weber') then raise exception 'Invalid county'; end if;
  if p_action='join' then
    insert into public.challenge_members(user_id,challenge,week,county) values(auth.uid(),p_challenge,week_start,p_county) on conflict do nothing;
  elsif p_action='checkin' then
    update public.challenge_members set checkins=array_append(checkins,today) where user_id=auth.uid() and challenge=p_challenge and week=week_start and not today=any(checkins);
  elsif p_action='undo' then
    update public.challenge_members set checkins=array_remove(checkins,today) where user_id=auth.uid() and challenge=p_challenge and week=week_start;
  elsif p_action='leave' then
    delete from public.challenge_members where user_id=auth.uid() and challenge=p_challenge and week=week_start;
  else raise exception 'Invalid action'; end if;
end $$;
create function public.my_challenges() returns table(challenge text,week date,county text,checkins date[],server_day date)
language sql stable security definer set search_path = '' as $$
  select challenge,week,county,checkins,(now() at time zone 'UTC')::date from public.challenge_members
  where user_id=auth.uid() and week=date_trunc('week',now() at time zone 'UTC')::date;
$$;
create function public.challenge_report() returns table(challenge text,county text,participant_band text,percent numeric)
language sql stable security definer set search_path = '' as $$
  select challenge,county,(floor(count(*)/10.0)*10)::int::text||'+',round(sum(cardinality(checkins))*100.0/(count(*)*7),1)
  from public.challenge_members where week=date_trunc('week',now() at time zone 'UTC')::date
  group by challenge,county having count(*)>=10 order by 4 desc;
$$;
create function public.erase_my_data() returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from public.community_bills where user_id=auth.uid();
  delete from public.challenge_members where user_id=auth.uid();
  delete from public.household_snapshots where user_id=auth.uid();
end $$;

revoke all on function public.save_household(jsonb,bigint),public.submit_bill(jsonb,text),public.community_challenge(text,text,text),public.my_challenges(),public.erase_my_data(),public.review_bill(uuid,text,text),public.county_report(date,text),public.challenge_report() from public,anon,authenticated;
grant execute on function public.save_household(jsonb,bigint),public.submit_bill(jsonb,text),public.community_challenge(text,text,text),public.my_challenges(),public.erase_my_data() to authenticated;
grant execute on function public.county_report(date,text),public.challenge_report() to anon,authenticated;
grant execute on function public.review_bill(uuid,text,text) to service_role;
commit;

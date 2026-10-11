-- Run this script in the Supabase SQL editor before deploying the chat UI.
-- Chat data is private. Only the Next.js server uses the service role key.
-- Requires the existing profiles, subscriptions, and routine_templates tables.

begin;

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  customer_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_kind text not null check (sender_kind in ('customer', 'admin')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  routine_id bigint null references public.routine_templates(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_customer_id_id_idx
  on public.chat_messages (customer_id, id desc);

create index if not exists chat_messages_customer_kind_created_idx
  on public.chat_messages (customer_id, sender_kind, created_at desc);

alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
grant select on public.chat_messages to service_role;

create or replace function public.chat_get_status(p_customer_id uuid)
returns table (plan_code text, used integer, message_limit integer, resets_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_plan text;
  v_started_at timestamptz;
  v_window_start timestamptz;
begin
  select s.plan_code, s.created_at into v_plan, v_started_at
  from public.subscriptions s
  where s.user_id = p_customer_id and s.status = 'active'
  order by s.created_at desc, s.id desc
  limit 1;

  if v_plan not in ('intermediate', 'premium') or v_plan is null then
    return;
  end if;

  if v_plan = 'premium' then
    return query select v_plan, 0, null::integer, null::timestamptz;
    return;
  end if;

  v_window_start := v_started_at
    + floor(extract(epoch from (now() - v_started_at)) / 1209600)::integer * interval '14 days';

  return query
  select v_plan,
    count(*)::integer,
    10,
    v_window_start + interval '14 days'
  from public.chat_messages m
  where m.customer_id = p_customer_id
    and m.sender_kind = 'customer'
    and m.created_at >= v_window_start
    and m.created_at < v_window_start + interval '14 days';
end;
$$;

create or replace function public.chat_send_message(
  p_customer_id uuid,
  p_sender_id uuid,
  p_body text,
  p_routine_id bigint default null
)
returns table (
  id bigint,
  customer_id uuid,
  sender_id uuid,
  sender_kind text,
  body text,
  routine_id bigint,
  created_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_plan text;
  v_started_at timestamptz;
  v_sender_kind text;
  v_window_start timestamptz;
  v_used integer;
begin
  if p_customer_id is null or p_sender_id is null
    or p_body is null or char_length(btrim(p_body)) not between 1 and 2000 then
    raise exception 'CHAT_INVALID_MESSAGE';
  end if;

  -- Lock the subscription row so two simultaneous sends cannot exceed the quota.
  select s.plan_code, s.created_at into v_plan, v_started_at
  from public.subscriptions s
  where s.user_id = p_customer_id and s.status = 'active'
  order by s.created_at desc, s.id desc
  limit 1 for update;

  if v_plan not in ('intermediate', 'premium') or v_plan is null then
    raise exception 'CHAT_PLAN_REQUIRED';
  end if;

  if p_sender_id = p_customer_id then
    v_sender_kind := 'customer';
  elsif exists (
    select 1 from public.profiles p
    where p.id = p_sender_id and p.is_admin = true
  ) then
    v_sender_kind := 'admin';
  else
    raise exception 'CHAT_FORBIDDEN';
  end if;

  if p_routine_id is not null and not exists (
    select 1 from public.routine_templates r
    where r.id = p_routine_id
      and (r.is_basic = true or r.owner_user_id = p_customer_id)
  ) then
    raise exception 'CHAT_INVALID_ROUTINE';
  end if;

  if v_sender_kind = 'customer' and v_plan = 'intermediate' then
    v_window_start := v_started_at
      + floor(extract(epoch from (now() - v_started_at)) / 1209600)::integer * interval '14 days';

    select count(*)::integer into v_used
    from public.chat_messages m
    where m.customer_id = p_customer_id
      and m.sender_kind = 'customer'
      and m.created_at >= v_window_start
      and m.created_at < v_window_start + interval '14 days';

    if v_used >= 10 then
      raise exception 'CHAT_LIMIT_REACHED';
    end if;
  end if;

  return query
  insert into public.chat_messages (customer_id, sender_id, sender_kind, body, routine_id)
  values (p_customer_id, p_sender_id, v_sender_kind, btrim(p_body), p_routine_id)
  returning chat_messages.id, chat_messages.customer_id, chat_messages.sender_id,
    chat_messages.sender_kind, chat_messages.body, chat_messages.routine_id,
    chat_messages.created_at;
end;
$$;

create or replace function public.chat_list_conversations()
returns table (
  customer_id uuid,
  full_name text,
  email text,
  last_message text,
  last_message_at timestamptz,
  last_sender_kind text
)
language sql security definer set search_path = public, pg_temp
as $$
  select latest.customer_id, p.full_name, p.email, latest.body,
    latest.created_at, latest.sender_kind
  from (
    select distinct on (m.customer_id)
      m.customer_id, m.body, m.created_at, m.sender_kind, m.id
    from public.chat_messages m
    order by m.customer_id, m.id desc
  ) latest
  left join public.profiles p on p.id = latest.customer_id
  order by latest.id desc;
$$;

revoke all on function public.chat_get_status(uuid) from public, anon, authenticated;
revoke all on function public.chat_send_message(uuid, uuid, text, bigint) from public, anon, authenticated;
revoke all on function public.chat_list_conversations() from public, anon, authenticated;
grant execute on function public.chat_get_status(uuid) to service_role;
grant execute on function public.chat_send_message(uuid, uuid, text, bigint) to service_role;
grant execute on function public.chat_list_conversations() to service_role;

notify pgrst, 'reload schema';

commit;

select to_regclass('public.chat_messages') as chat_messages_table,
  to_regprocedure('public.chat_send_message(uuid,uuid,text,bigint)') as send_function,
  to_regprocedure('public.chat_get_status(uuid)') as status_function;

select has_table_privilege('anon', 'public.chat_messages', 'SELECT') as anon_can_read_messages,
  has_table_privilege('authenticated', 'public.chat_messages', 'SELECT') as users_can_read_messages_directly,
  has_function_privilege('authenticated', 'public.chat_send_message(uuid,uuid,text,bigint)', 'EXECUTE') as users_can_call_send_directly;

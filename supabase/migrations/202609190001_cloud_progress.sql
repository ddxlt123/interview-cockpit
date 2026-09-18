create table if not exists public.question_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  favorite boolean not null default false,
  favorite_updated_at timestamptz not null default 'epoch',
  proficiency text not null default 'unrated'
    check (proficiency in ('unrated', 'beginner', 'practicing', 'mastered')),
  proficiency_updated_at timestamptz not null default 'epoch',
  primary key (user_id, question_key)
);

alter table public.question_progress enable row level security;

revoke all on table public.question_progress from anon;
grant select, insert, update on table public.question_progress to authenticated;

create policy "Users can read their own progress"
  on public.question_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own progress"
  on public.question_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own progress"
  on public.question_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.merge_question_progress(p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.question_progress as current_progress (
    user_id,
    question_key,
    favorite,
    favorite_updated_at,
    proficiency,
    proficiency_updated_at
  )
  select
    (select auth.uid()),
    item->>'question_key',
    coalesce((item->>'favorite')::boolean, false),
    coalesce(nullif(item->>'favorite_updated_at', '')::timestamptz, 'epoch'::timestamptz),
    coalesce(nullif(item->>'proficiency', ''), 'unrated'),
    coalesce(nullif(item->>'proficiency_updated_at', '')::timestamptz, 'epoch'::timestamptz)
  from jsonb_array_elements(p_rows) as item
  where nullif(item->>'question_key', '') is not null
  on conflict (user_id, question_key) do update
  set
    favorite = case
      when excluded.favorite_updated_at > current_progress.favorite_updated_at then excluded.favorite
      else current_progress.favorite
    end,
    favorite_updated_at = greatest(excluded.favorite_updated_at, current_progress.favorite_updated_at),
    proficiency = case
      when excluded.proficiency_updated_at > current_progress.proficiency_updated_at then excluded.proficiency
      else current_progress.proficiency
    end,
    proficiency_updated_at = greatest(excluded.proficiency_updated_at, current_progress.proficiency_updated_at);
end;
$$;

revoke all on function public.merge_question_progress(jsonb) from public, anon;
grant execute on function public.merge_question_progress(jsonb) to authenticated;

create table if not exists patient_referral_processing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text default 'default',
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists patient_referral_processing_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references patient_referral_processing_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null default '',
  tool_call jsonb,
  created_at timestamptz default now()
);

alter table patient_referral_processing_sessions enable row level security;
alter table patient_referral_processing_messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'patient_referral_processing_sessions' and policyname = 'allow_all_prp_sessions') then
    create policy allow_all_prp_sessions on patient_referral_processing_sessions for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'patient_referral_processing_messages' and policyname = 'allow_all_prp_messages') then
    create policy allow_all_prp_messages on patient_referral_processing_messages for all using (true) with check (true);
  end if;
end $$;

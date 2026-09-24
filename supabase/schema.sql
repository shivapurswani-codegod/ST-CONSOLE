-- ST Console — Supabase schema
-- Run this whole file once in Supabase: Project → SQL Editor → New query → paste → Run

create extension if not exists pgcrypto;

-- ---------- settings (single row) ----------
create table if not exists settings (
  id int primary key default 1,
  weekly_fee_per_member numeric not null default 120,
  venue_paid_per_attendee numeric not null default 90,
  visitor_fee numeric not null default 130,
  renewal_fee numeric not null default 0,
  active_members int not null default 0,
  careem_link text not null default '',
  bank_name text not null default '',
  bank_account_name text not null default '',
  bank_account_number text not null default '',
  bank_iban text not null default '',
  kitty_initial numeric not null default 0,
  constraint single_row check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- ---------- venue fee weekly entries ----------
create table if not exists venue_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  attendance int not null default 0,
  visitors int not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------- events ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  budget numeric not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------- miscellaneous debits/credits ----------
create table if not exists misc_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null check (type in ('debit','credit')),
  amount numeric not null,
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------- renewals member list ----------
create table if not exists renewal_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  email text default '',
  renewal_date date,
  join_date date,
  created_at timestamptz not null default now()
);

-- ---------- fee members (Members page) ----------
create table if not exists fee_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text default '',
  email text default '',
  phone text default '',
  active boolean not null default true,
  last_accrual_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- fee ledger (charges + payments, per member) ----------
create table if not exists fee_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references fee_members(id) on delete cascade,
  date date not null,
  type text not null check (type in ('charge','payment')),
  category text not null check (category in ('meeting','social','sponsorship')),
  amount numeric not null,
  method text default '',
  note text default '',
  created_at timestamptz not null default now()
);

create index if not exists fee_ledger_member_idx on fee_ledger(member_id);

-- ---------- holidays (dates with no meeting — no fee accrues) ----------
create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security ----------
-- This is a single shared chapter console: any signed-in user (i.e. anyone
-- you've created a login for in Supabase Auth) can read and write everything.
alter table settings enable row level security;
alter table venue_entries enable row level security;
alter table events enable row level security;
alter table misc_entries enable row level security;
alter table renewal_members enable row level security;
alter table fee_members enable row level security;
alter table fee_ledger enable row level security;
alter table holidays enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['settings','venue_entries','events','misc_entries','renewal_members','fee_members','fee_ledger','holidays'])
  loop
    execute format('drop policy if exists "authenticated full access" on %I', t);
    execute format(
      'create policy "authenticated full access" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t
    );
  end loop;
end $$;

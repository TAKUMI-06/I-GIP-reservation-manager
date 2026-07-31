-- ==============================================================================
-- i-GIP 入館管理システム - 初期スキーマ
-- ------------------------------------------------------------------------------
-- 設計メモ:
-- ・「users」（一般利用者アカウント）は本システムでは作成しない。
--   利用者はログイン不要のため、氏名・連絡先は reservations テーブルに
--   都度保存する（同一人物の重複予約も許可する仕様のため、マスタ化は不要）。
--   認証が必要なのは管理者（admin_users）のみで、Supabase Auth (auth.users) と
--   1:1で紐づく。この設計判断は README.md にも記載している。
-- ・すべての機微データへの読み書きは、Server Actions / Route Handlers 内で
--   Service Role キーを使い、アプリ側で権限チェックを行った上で実行する。
--   RLSはその防御をすり抜けて直接DBを叩かれた場合の多層防御として機能する。
-- ==============================================================================

-- 拡張機能
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- admin_users: 管理者（スーパー管理者 / 受付担当）
-- ------------------------------------------------------------------------------
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.admin_users (id) on delete set null
);

comment on table public.admin_users is '管理者アカウント（スーパー管理者・受付担当）。auth.usersと1:1。';

-- ------------------------------------------------------------------------------
-- available_dates: 予約可能日（管理者が事前登録した日程のみ選択可）
-- ------------------------------------------------------------------------------
create table if not exists public.available_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references public.admin_users (id) on delete set null
);

comment on table public.available_dates is '利用者が予約可能な日程。自由入力は禁止し、この表に登録された日のみ選択可能。';

-- ------------------------------------------------------------------------------
-- reservations: 予約
-- ------------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  qr_token text not null unique,
  available_date_id uuid not null references public.available_dates (id),
  visit_date date not null,
  name text not null,
  team_name text not null,
  email text not null,
  phone text not null,
  terms_agreed boolean not null default false,
  terms_agreed_at timestamptz,
  status text not null default 'not_checked_in' check (status in ('not_checked_in', 'checked_in')),
  checked_in_at timestamptz,
  checked_in_method text check (checked_in_method in ('qr', 'manual')),
  checked_in_by uuid references public.admin_users (id) on delete set null,
  confirmation_email_sent_at timestamptz,
  confirmation_email_error text,
  reminder_sent_at timestamptz,
  reminder_email_error text,
  created_ip inet,
  created_at timestamptz not null default now(),
  constraint chk_checked_in_consistency check (
    (status = 'not_checked_in' and checked_in_at is null and checked_in_method is null)
    or
    (status = 'checked_in' and checked_in_at is not null and checked_in_method is not null)
  )
);

comment on table public.reservations is '来場予約。QRトークンは個人情報を含まない推測困難なランダム文字列。';

create index if not exists idx_reservations_visit_date on public.reservations (visit_date);
create index if not exists idx_reservations_status on public.reservations (status);
create index if not exists idx_reservations_email on public.reservations (lower(email));
create index if not exists idx_reservations_name on public.reservations (name);
create index if not exists idx_reservations_team_name on public.reservations (team_name);
create index if not exists idx_reservations_phone on public.reservations (phone);
create index if not exists idx_reservations_created_at on public.reservations (created_at);
create index if not exists idx_reservations_qr_token on public.reservations (qr_token);

-- ------------------------------------------------------------------------------
-- checkin_logs: 入館履歴（手動入館の履歴も含む監査用ログ）
-- ------------------------------------------------------------------------------
create table if not exists public.checkin_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method text not null check (method in ('qr', 'manual')),
  performed_by uuid references public.admin_users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.checkin_logs is '入館処理の履歴。QR読み取り・手動入館の両方を記録する。';

create index if not exists idx_checkin_logs_reservation_id on public.checkin_logs (reservation_id);
create index if not exists idx_checkin_logs_checked_in_at on public.checkin_logs (checked_in_at);

-- ------------------------------------------------------------------------------
-- notification_settings: 通知先設定（シングルトン想定だが将来の拡張性のため複数行可）
-- ------------------------------------------------------------------------------
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  admin_notification_emails text[] not null default '{}',
  reminder_enabled boolean not null default true,
  reminder_send_hour_jst smallint not null default 18 check (reminder_send_hour_jst between 0 and 23),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null
);

comment on table public.notification_settings is '新規予約通知・前日リマインド送信の設定。';

-- ------------------------------------------------------------------------------
-- audit_logs: 監査ログ（管理操作・重要イベントの追跡）
-- ------------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_users (id) on delete set null,
  actor_email text,
  action text not null,
  target_table text,
  target_id text,
  detail jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'すべての管理操作・機微イベントの監査ログ。改ざん防止のためUPDATE権限は付与しない。';

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at);
create index if not exists idx_audit_logs_action on public.audit_logs (action);

-- ==============================================================================
-- ヘルパー関数（RLSポリシーから参照）
-- ==============================================================================

-- 現在ログイン中のユーザーに対応する admin_users.id を返す（存在しなければnull）
create or replace function public.current_admin_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.admin_users
  where auth_user_id = auth.uid() and is_active = true
  limit 1;
$$;

-- 現在ログイン中のユーザーが有効な管理者（役割問わず）かどうか
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid() and is_active = true
  );
$$;

-- 現在ログイン中のユーザーがスーパー管理者かどうか
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid() and is_active = true and role = 'super_admin'
  );
$$;

-- ==============================================================================
-- RLS 有効化
-- ==============================================================================
alter table public.admin_users enable row level security;
alter table public.available_dates enable row level security;
alter table public.reservations enable row level security;
alter table public.checkin_logs enable row level security;
alter table public.notification_settings enable row level security;
alter table public.audit_logs enable row level security;

-- ------------------------------------------------------------------------------
-- admin_users ポリシー
-- ------------------------------------------------------------------------------
create policy "admin_users_select_own_org" on public.admin_users
  for select using (public.is_admin());

create policy "admin_users_insert_super_admin_only" on public.admin_users
  for insert with check (public.is_super_admin());

create policy "admin_users_update_super_admin_only" on public.admin_users
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy "admin_users_delete_super_admin_only" on public.admin_users
  for delete using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- available_dates ポリシー
-- ------------------------------------------------------------------------------
-- 予約ページ（未ログインの利用者含む）は「有効な日程」のみ閲覧可能
create policy "available_dates_public_select_active" on public.available_dates
  for select using (is_active = true or public.is_admin());

create policy "available_dates_insert_super_admin_only" on public.available_dates
  for insert with check (public.is_super_admin());

create policy "available_dates_update_super_admin_only" on public.available_dates
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy "available_dates_delete_super_admin_only" on public.available_dates
  for delete using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- reservations ポリシー
-- ------------------------------------------------------------------------------
-- 予約作成: 未ログインの利用者でも新規予約(未入館状態)を1件作成できる。
-- 個別の予約内容の閲覧・検索は行わせず（一覧化による情報漏えいを防止するため）、
-- 作成直後の確認画面はサーバー側（Service Role）で予約IDを指定して取得する。
create policy "reservations_public_insert" on public.reservations
  for insert with check (
    status = 'not_checked_in'
    and checked_in_at is null
    and checked_in_method is null
    and checked_in_by is null
  );

create policy "reservations_admin_select" on public.reservations
  for select using (public.is_admin());

create policy "reservations_admin_update" on public.reservations
  for update using (public.is_admin()) with check (public.is_admin());

create policy "reservations_super_admin_delete" on public.reservations
  for delete using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- checkin_logs ポリシー
-- ------------------------------------------------------------------------------
create policy "checkin_logs_admin_select" on public.checkin_logs
  for select using (public.is_admin());

create policy "checkin_logs_admin_insert" on public.checkin_logs
  for insert with check (public.is_admin());

create policy "checkin_logs_super_admin_delete" on public.checkin_logs
  for delete using (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- notification_settings ポリシー（スーパー管理者のみ）
-- ------------------------------------------------------------------------------
create policy "notification_settings_super_admin_select" on public.notification_settings
  for select using (public.is_admin());

create policy "notification_settings_super_admin_write" on public.notification_settings
  for insert with check (public.is_super_admin());

create policy "notification_settings_super_admin_update" on public.notification_settings
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- audit_logs ポリシー（スーパー管理者のみ閲覧、UPDATEは不可＝改ざん防止）
-- ------------------------------------------------------------------------------
create policy "audit_logs_super_admin_select" on public.audit_logs
  for select using (public.is_super_admin());

create policy "audit_logs_admin_insert" on public.audit_logs
  for insert with check (public.is_admin());

create policy "audit_logs_super_admin_delete" on public.audit_logs
  for delete using (public.is_super_admin());

-- ==============================================================================
-- notification_settings 初期行（シングルトン）
-- ==============================================================================
insert into public.notification_settings (admin_notification_emails, reminder_enabled)
select '{}', true
where not exists (select 1 from public.notification_settings);

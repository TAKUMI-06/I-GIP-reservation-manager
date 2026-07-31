-- ==============================================================================
-- サンプルデータ投入用SQL（開発・デモ環境向け）
-- 管理者アカウントは Supabase Auth を経由する必要があるため、
-- このSQLではなく `npm run seed` (scripts/seed.ts) で投入してください。
-- ここでは admin_users への参照を持たない、認証不要のマスタデータのみ投入します。
-- ==============================================================================

-- 予約可能日のサンプル（当日以降の日付を動的に生成）
insert into public.available_dates (date, is_active, note)
values
  (current_date + interval '3 day', true, '午前・午後 見学受付'),
  (current_date + interval '5 day', true, null),
  (current_date + interval '10 day', true, '団体優先枠'),
  (current_date + interval '14 day', true, null),
  (current_date - interval '2 day', false, '終了済みサンプル')
on conflict (date) do nothing;

-- 通知設定の初期値
update public.notification_settings
set admin_notification_emails = array['admin@example.jp']
where admin_notification_emails = '{}';

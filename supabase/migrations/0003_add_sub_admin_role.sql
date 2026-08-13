-- ==============================================================================
-- サブ管理者ロールの追加
-- ------------------------------------------------------------------------------
-- 受付担当(staff)と同じページ権限を持ちつつ、将来的な拡張の入り口として
-- 独立したロール値を持たせる。電話番号の非表示制御はアプリケーション側で行う。
-- ==============================================================================

alter table public.admin_users drop constraint admin_users_role_check;
alter table public.admin_users
  add constraint admin_users_role_check check (role in ('super_admin', 'staff', 'sub_admin'));

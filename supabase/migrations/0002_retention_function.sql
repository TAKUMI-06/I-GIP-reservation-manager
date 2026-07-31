-- ==============================================================================
-- データ保持ポリシー用ヘルパー関数
-- 予約は作成から3か月(92日)経過したものが削除対象。
-- 実際の削除は Route Handler (/api/cron/retention) から Service Role で実行し、
-- 削除前に audit_logs へスナップショットを記録する（アプリ側で実施）。
-- 本関数は「削除対象一覧」を管理画面から確認するためのビューを提供する。
-- ==============================================================================

create or replace view public.retention_candidates as
select
  r.id,
  r.name,
  r.team_name,
  r.email,
  r.visit_date,
  r.created_at,
  (now() - r.created_at) as age
from public.reservations r
where r.created_at < now() - interval '92 days'
order by r.created_at asc;

comment on view public.retention_candidates is 'データ保持期間(3か月)を超過し削除対象となる予約の一覧。';

alter view public.retention_candidates set (security_invoker = on);

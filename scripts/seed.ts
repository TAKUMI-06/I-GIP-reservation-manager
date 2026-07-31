/**
 * サンプルデータ投入スクリプト（開発・デモ環境専用）
 *
 * 実行方法:
 *   npm run seed
 *
 * 前提:
 *   - .env.local に NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定済みであること
 *   - supabase/migrations の SQL を適用済みであること
 *
 * 投入内容:
 *   - スーパー管理者アカウント 1件
 *   - 受付担当アカウント 1件
 *   - 利用可能日 数件
 *   - サンプル予約 数件（入館済み/未入館が混在）
 *
 * 本番環境に対して実行しないこと。
 */
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "環境変数が不足しています。.env.local に NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。",
  );
  process.exit(1);
}

const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL ?? "super-admin@i-gip.example.jp";
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
const STAFF_EMAIL = process.env.SEED_STAFF_EMAIL ?? "staff@i-gip.example.jp";
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD ?? "ChangeMe123!";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertAdminUser(params: {
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "staff";
}) {
  const { data: existingAdmin } = await supabase
    .from("admin_users")
    .select("id, auth_user_id")
    .eq("email", params.email)
    .maybeSingle();

  if (existingAdmin) {
    console.log(`既存の管理者をスキップ: ${params.email}`);
    return existingAdmin.id as string;
  }

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
  });

  if (authError || !created.user) {
    throw new Error(`認証ユーザー作成に失敗: ${params.email} - ${authError?.message}`);
  }

  const { data: adminRow, error: insertError } = await supabase
    .from("admin_users")
    .insert({
      auth_user_id: created.user.id,
      name: params.name,
      email: params.email,
      role: params.role,
    })
    .select("id")
    .single();

  if (insertError || !adminRow) {
    throw new Error(`admin_users登録に失敗: ${params.email} - ${insertError?.message}`);
  }

  console.log(`管理者を作成しました: ${params.email} (${params.role})`);
  return adminRow.id as string;
}

async function upsertAvailableDate(date: string, note: string | null, createdBy: string) {
  const { data: existing } = await supabase
    .from("available_dates")
    .select("id")
    .eq("date", date)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("available_dates")
    .insert({ date, note, created_by: createdBy })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`available_dates登録に失敗: ${date} - ${error?.message}`);
  }
  return data.id as string;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("=== i-GIP サンプルデータ投入を開始します ===");

  const superAdminId = await upsertAdminUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    name: "スーパー管理者（サンプル）",
    role: "super_admin",
  });

  await upsertAdminUser({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    name: "受付担当（サンプル）",
    role: "staff",
  });

  const dateA = await upsertAvailableDate(addDays(3), "午前・午後 見学受付", superAdminId);
  const dateB = await upsertAvailableDate(addDays(7), null, superAdminId);
  await upsertAvailableDate(addDays(14), "団体優先枠", superAdminId);

  const sampleReservations = [
    { name: "山田 太郎", team_name: "〇〇高等学校 サッカー部", email: "taro.yamada@example.jp", phone: "090-1111-2222", availableDateId: dateA, checkedIn: true },
    { name: "佐藤 花子", team_name: "△△中学校 吹奏楽部", email: "hanako.sato@example.jp", phone: "090-3333-4444", availableDateId: dateA, checkedIn: false },
    { name: "鈴木 一郎", team_name: "□□大学 陸上部", email: "ichiro.suzuki@example.jp", phone: "080-5555-6666", availableDateId: dateB, checkedIn: false },
  ];

  for (const r of sampleReservations) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("email", r.email)
      .eq("available_date_id", r.availableDateId)
      .maybeSingle();

    if (existing) {
      console.log(`既存の予約をスキップ: ${r.email}`);
      continue;
    }

    const { data: dateRow } = await supabase
      .from("available_dates")
      .select("date")
      .eq("id", r.availableDateId)
      .single();

    const qrToken = crypto.randomBytes(32).toString("base64url");

    const { error } = await supabase.from("reservations").insert({
      qr_token: qrToken,
      available_date_id: r.availableDateId,
      visit_date: dateRow!.date,
      name: r.name,
      team_name: r.team_name,
      email: r.email,
      phone: r.phone,
      terms_agreed: true,
      terms_agreed_at: new Date().toISOString(),
      status: r.checkedIn ? "checked_in" : "not_checked_in",
      checked_in_at: r.checkedIn ? new Date().toISOString() : null,
      checked_in_method: r.checkedIn ? "manual" : null,
    });

    if (error) {
      console.error(`予約の作成に失敗: ${r.email}`, error.message);
    } else {
      console.log(`サンプル予約を作成しました: ${r.name}`);
    }
  }

  console.log("\n=== 完了 ===");
  console.log(`スーパー管理者ログイン: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}`);
  console.log(`受付担当ログイン: ${STAFF_EMAIL} / ${STAFF_PASSWORD}`);
  console.log("※ 本番環境では初回ログイン後、必ずパスワードを変更してください。");
}

main().catch((err) => {
  console.error("シード処理中にエラーが発生しました:", err);
  process.exit(1);
});

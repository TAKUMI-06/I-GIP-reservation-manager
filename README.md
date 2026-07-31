# i-GIP 入館管理

i-GIPが利用する施設向けの、予約・QRコード受付・入館履歴管理システムです。
Next.js 15 (App Router) / TypeScript / Supabase / Resend / Vercel を用いて構築しています。

- 利用者: 会員登録不要でその場で予約し、QRコードを保存・提示するだけで入館できます。
- 受付担当: QRコードを読み取る、またはお名前などで検索して手動入館できます。
- スーパー管理者: 利用可能日の管理、予約一覧・CSV出力、管理者アカウント管理、通知設定、データ削除ができます。

---

## 目次

1. [ディレクトリ構成](#1-ディレクトリ構成)
2. [技術スタック](#2-技術スタック)
3. [Supabaseのセットアップ](#3-supabaseのセットアップ)
4. [Resendのセットアップ](#4-resendのセットアップ)
5. [環境変数](#5-環境変数)
6. [ローカル開発](#6-ローカル開発)
7. [サンプルデータ投入](#7-サンプルデータ投入)
8. [Vercelへのデプロイ](#8-vercelへのデプロイ)
9. [権限とロール](#9-権限とロール)
10. [セキュリティ設計](#10-セキュリティ設計)
11. [データ保持ポリシー](#11-データ保持ポリシー)
12. [動作確認・ビルド確認の結果](#12-動作確認ビルド確認の結果)
13. [設計上の変更点・判断の理由](#13-設計上の変更点判断の理由)
14. [既知の制限・今後の改善候補](#14-既知の制限今後の改善候補)

---

## 1. ディレクトリ構成

```
i-gip/
├── src/
│   ├── app/                          # App Router
│   │   ├── page.tsx                  # / トップページ
│   │   ├── terms/page.tsx            # /terms 利用規約
│   │   ├── reserve/
│   │   │   ├── page.tsx              # /reserve 予約フォーム
│   │   │   └── actions.ts            # 予約作成 Server Action
│   │   ├── reservation/[id]/page.tsx # /reservation/[id] 予約完了・QR表示
│   │   ├── checkin/[token]/page.tsx  # /checkin/[token] 受付画面（要ログイン）
│   │   ├── admin/
│   │   │   ├── login/                # /admin/login
│   │   │   ├── layout.tsx            # 管理画面共通レイアウト（認可）
│   │   │   ├── page.tsx              # /admin ダッシュボード
│   │   │   ├── scanner/page.tsx      # /admin/scanner QR受付・検索
│   │   │   ├── dates/page.tsx        # /admin/dates 利用可能日管理（スーパー管理者）
│   │   │   ├── reservations/page.tsx # /admin/reservations 予約一覧・CSV出力
│   │   │   ├── history/page.tsx      # /admin/history 入館履歴
│   │   │   └── settings/page.tsx     # /admin/settings 管理者/通知/データ削除
│   │   ├── api/
│   │   │   ├── cron/reminder/route.ts   # 前日リマインド送信バッチ
│   │   │   ├── cron/retention/route.ts  # データ保持期限切れ自動削除バッチ
│   │   │   └── reservations/export/route.ts # CSV出力API（スーパー管理者専用）
│   │   ├── layout.tsx / globals.css / error.tsx / not-found.tsx
│   │   └── middleware.ts             # ルート保護（実体は src/middleware.ts）
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 相当の共通プリミティブ
│   │   ├── layout/                   # ヘッダー・フッター
│   │   ├── reserve/                  # 予約フォーム
│   │   ├── checkin/                  # 受付パネル
│   │   └── admin/                    # 管理画面用コンポーネント一式
│   ├── lib/
│   │   ├── supabase/                 # client / server / middleware / admin(Service Role)
│   │   ├── actions/                  # 管理系 Server Actions（checkin/dates/settings/retention/admin-users）
│   │   ├── email/                    # Resendクライアント・メールテンプレート・送信処理
│   │   ├── validations/              # Zodスキーマ
│   │   ├── types/database.ts         # Supabase Database型定義
│   │   ├── auth.ts                   # requireAdmin / requireSuperAdmin
│   │   ├── rate-limit.ts             # 簡易レート制限
│   │   ├── audit.ts                  # 監査ログ書き込み
│   │   ├── qr.ts                     # QRトークン生成・QR画像生成
│   │   ├── search.ts                 # 検索語のサニタイズ（インジェクション対策）
│   │   ├── cron-auth.ts              # Vercel Cron認証
│   │   └── date.ts / constants.ts / utils.ts
│   └── middleware.ts
├── supabase/
│   ├── migrations/0001_init.sql          # テーブル・RLS・関数定義
│   ├── migrations/0002_retention_function.sql # 削除対象ビュー
│   └── seed.sql                          # 認証不要マスタデータのサンプル
├── scripts/seed.ts                   # 管理者アカウント等を含むサンプルデータ投入スクリプト
├── .env.example                      # 環境変数サンプル
├── vercel.json                       # Vercel Cron設定
└── (next.config.ts / tailwind.config.ts / tsconfig.json / package.json 等)
```

## 2. 技術スタック

Next.js 15 (App Router) / React 19 / TypeScript（strict, `any`禁止） / Tailwind CSS / shadcn/ui相当の自作コンポーネント / Supabase（PostgreSQL・Auth・RLS） / Resend / React Hook Form + Zod / TanStack Query / `qrcode`（QR生成） / `html5-qrcode`（カメラQR読み取り） / date-fns + date-fns-tz（JST対応）。

---

## 3. Supabaseのセットアップ

1. https://supabase.com でプロジェクトを新規作成します（リージョンは `Northeast Asia (Tokyo)` を推奨）。
2. プロジェクトのSQL Editorを開き、以下の順にSQLファイルの中身を貼り付けて実行します。
   - `supabase/migrations/0001_init.sql`（テーブル・RLSポリシー・ヘルパー関数）
   - `supabase/migrations/0002_retention_function.sql`（データ保持期限切れ一覧ビュー）
   - 開発環境であれば `supabase/seed.sql`（予約可能日のサンプル）も実行可能です。
3. `Project Settings > API` から以下を取得し、環境変数に設定します。
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`（**絶対にクライアントに公開しないこと**）
4. `Authentication > Providers` で「Email」プロバイダーが有効になっていることを確認します。
5. `Authentication > Settings` で「Confirm email」を無効化するか、`scripts/seed.ts` のように `email_confirm: true` でユーザーを作成してください（本アプリの管理者作成は常にこの方式のため対応不要です）。
6. 管理者アカウントは通常のサインアップ画面を作らず、`npm run seed` またはスーパー管理者の「設定 > 管理者管理」画面からのみ作成できる設計です。

### RLSの設計方針

すべての機微な読み書き（予約・入館ログ・管理者情報・監査ログ）は、Server Actions / Route Handlers 内で **Service Roleキーを使い、アプリ側で `requireAdmin()` / `requireSuperAdmin()` による権限チェックを行った上で** 実行します。RLSはこれをすり抜けて直接DBを叩かれた場合の**多層防御**として機能し、匿名ユーザーやログインしていない認証ユーザーからの不正な読み書きを拒否します。

---

## 4. Resendのセットアップ

1. https://resend.com でアカウントを作成します。
2. `Domains` から送信元ドメインを追加し、DNS（SPF/DKIM）を設定してドメイン認証を完了します（認証が済むまでは `onboarding@resend.dev` 等のテスト送信元のみ使用可能です）。
3. `API Keys` から新しいAPIキーを発行し、`RESEND_API_KEY` に設定します。
4. 認証済みドメインのアドレスを `RESEND_FROM_EMAIL`（例: `"i-GIP 入館管理 <no-reply@your-domain.jp>"`）に設定します。
5. 管理者への新規予約通知先は、Resendの設定ではなく `/admin/settings` の「通知先設定」タブ、またはDBの `notification_settings` テーブルで管理します。

---

## 5. 環境変数

`.env.example` を `.env.local` にコピーし、値を設定してください。

| 変数名 | 用途 | 公開範囲 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | クライアント公開 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonキー（RLS適用） | クライアント公開 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Roleキー（RLSバイパス） | **サーバー専用・非公開** |
| `RESEND_API_KEY` | Resend送信用APIキー | **サーバー専用・非公開** |
| `RESEND_FROM_EMAIL` | メール送信元アドレス | サーバー専用 |
| `NEXT_PUBLIC_APP_URL` | 本番URL（QRコード・メール内リンク生成に使用） | クライアント公開 |
| `CRON_SECRET` | Vercel Cronからのリクエスト認証用シークレット | **サーバー専用・非公開** |
| `ADMIN_NOTIFICATION_EMAIL` | （任意）予備の通知先。基本は`notification_settings`テーブルを使用 | サーバー専用 |

---

## 6. ローカル開発

```bash
npm install
cp .env.example .env.local   # 値を編集
npm run dev
```

- `npm run lint` : ESLint（`next/core-web-vitals` + `next/typescript`）
- `npm run typecheck` : `tsc --noEmit`
- `npm run build` : 本番ビルド

---

## 7. サンプルデータ投入

```bash
npm run seed
```

`.env.local` の `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を使用して、以下を投入します。

- スーパー管理者アカウント（既定: `super-admin@i-gip.example.jp` / `ChangeMe123!`）
- 受付担当アカウント（既定: `staff@i-gip.example.jp` / `ChangeMe123!`）
- 利用可能日 3件
- サンプル予約 3件（入館済み・未入館が混在）

環境変数 `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` / `SEED_STAFF_EMAIL` / `SEED_STAFF_PASSWORD` で認証情報を上書きできます。**初回ログイン後は必ずパスワードを変更してください。**

---

## 8. Vercelへのデプロイ

1. GitHubリポジトリにpushし、Vercelで「Import Project」からリポジトリを選択します。
2. `Environment Variables` に本README「5. 環境変数」の値をすべて設定します（Production / Preview 両方に設定を推奨）。
3. Node.jsバージョンは自動判定で問題ありません（Next.js 15はNode 18.18+に対応、Node 20系を推奨）。
4. デプロイ後、`vercel.json` に定義済みの Cron が自動的に有効になります。
   - `/api/cron/reminder` : 毎日 21:00 UTC（日本時間 翌6:00）に前日リマインドメールを送信
   - `/api/cron/retention` : 毎月1日 18:00 UTC（日本時間 翌3:00）にデータ保持期限超過分を自動削除
   - Vercel Cronは自動的に `Authorization: Bearer $CRON_SECRET` 相当のヘッダーを付与しないため、`CRON_SECRET` を設定した上で **Vercelプロジェクト設定でCron実行時にこのヘッダーが付与されるように、Vercelのドキュメントに従い保護を有効化**してください（Vercel Cron Jobsは同一プロジェクト内からの呼び出しを自動的に認証しますが、念のためアプリ側でも二重にチェックしています）。
5. 独自ドメインを設定した場合は `NEXT_PUBLIC_APP_URL` を実際のドメインに更新し、再デプロイしてください（QRコードのURLに影響します）。

---

## 9. 権限とロール

| ロール | できること |
|---|---|
| スーパー管理者 (`super_admin`) | 受付担当の追加・管理者の削除、利用可能日追加、予約一覧・CSV出力、データ削除、システム設定、通知先設定、上記に加え受付担当の全操作 |
| 受付担当 (`staff`) | QR読み取り、当日予約一覧、過去履歴閲覧、手動入館、検索 |

管理者アカウントはSupabase Authと`admin_users`テーブルが1:1で紐づき、`is_active=false`にすると即座にログイン・API利用ができなくなります。

---

## 10. セキュリティ設計

- **CSRF**: Server Actionsおよび同一オリジンからのフォーム送信のみを許可（Next.jsのオリジンチェックに準拠）。
- **XSS**: React標準のエスケープに加え、メールHTML生成時は独自の`escapeHtml`で二重にエスケープ。`dangerouslySetInnerHTML`は不使用。
- **SQL Injection**: すべてSupabaseのクエリビルダ（パラメータ化）を使用。生SQL文字列は組み立てない。検索語は`sanitizeSearchTerm`でPostgRESTの`or=`構文の特殊文字（`,` `(` `)`）を除去し、`%` `_` `\`をエスケープ。
- **認可**: すべての管理系Server Action / Route Handlerの先頭で`requireAdmin()`/`requireSuperAdmin()`を呼び出し、権限不足時は`ForbiddenError`または直接403を返す。
- **RLS**: `admin_users` / `available_dates` / `reservations` / `checkin_logs` / `notification_settings` / `audit_logs` すべてに実装（詳細は`supabase/migrations/0001_init.sql`）。
- **入力バリデーション**: すべてのフォーム・Server Action入力をZodスキーマでサーバー側も再検証（クライアント側の検証を信用しない）。
- **レート制限**: 予約作成・ログイン・入館処理・検索にIPベースの簡易レート制限を実装（`src/lib/rate-limit.ts`）。本番でのより厳密な制限にはUpstash Redis等への置き換えを推奨（README末尾参照）。
- **QRトークン推測防止**: `crypto.randomBytes(32)`のbase64url文字列（個人情報を含まない）。
- **監査ログ**: 予約作成・ログイン成否・入館処理・管理者操作・データ削除等を`audit_logs`に記録。UPDATE権限を付与せず改ざんを防止。
- **個人情報保護**: 利用規約ページで利用目的・保存期間・第三者提供を明示。CSVエクスポートはスーパー管理者限定、UTF-8 BOM付き、Excel数式インジェクション対策済み。
- **セキュリティヘッダー**: `next.config.ts`でX-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / HSTSを全ルートに付与。

---

## 11. データ保持ポリシー

予約・入館データは**作成から3か月（92日）**を経過すると削除対象になります。

- `/admin/settings`の「データ削除」タブから、削除対象一覧の確認・個別削除・一括削除が可能です（スーパー管理者のみ）。
- 毎月1回、Vercel Cron (`/api/cron/retention`) が自動的に削除を実行します。
- 削除前には必ず`audit_logs`にスナップショットを記録します。

---

## 12. 動作確認・ビルド確認の結果

以下は本開発環境（サンドボックス）で実施した確認結果です。

| 項目 | 結果 |
|---|---|
| `npm install` | ✅ 成功（全依存パッケージのインストールを確認） |
| `tsc --noEmit`（型チェック） | ✅ **エラー0件** |
| `eslint`（`next/core-web-vitals` + `next/typescript`） | ✅ **エラー・警告0件** |
| `next build`（本番ビルド） | ⚠️ 本サンドボックス環境では未完了（詳細は下記） |

### `next build` が本サンドボックスで完了しなかった理由

このリポジトリのコードに起因する問題ではなく、**開発に使用したサンドボックス環境固有の制約**です。切り分けのため、本プロジェクトとは無関係なNext.js 15.1.6の最小構成（`page.tsx`一枚のみ）でも同様に検証したところ、`next build`実行時にNext.jsのコンパイラ（`@next/swc`のネイティブバイナリ、および代替のWASMバイナリの両方）を実行するタイミングで`SIGBUS`（Bus error）がOSレベルで発生し、Node.jsプロセスごと異常終了することを確認しました。ネイティブ版・WASM版のどちらでも同一の症状が再現したため、コードの問題ではなく、このサンドボックスのARM64仮想化環境と当該コンパイラの相性問題である可能性が高いと判断しています。

`tsc --noEmit`と`eslint`はいずれもプロジェクト全体（`src/`配下すべてのファイル）に対して実行し、**型エラー・Lintエラーともに0件**であることを確認済みです。これはNext.jsのビルドが検出しうる問題（型不整合、未使用変数、Reactフックのルール違反、importの解決失敗など）の大部分をカバーする強いシグナルです。Vercelや通常のLinux/macOS/Windows環境（x86_64、または標準的なARM64環境）では、この`SIGBUS`問題は再現しないと考えられます。**Vercelへのデプロイ、またはご自身のPC上で`npm run build`を実行して最終確認していただくことを推奨します。**

---

## 13. 設計上の変更点・判断の理由

- **`users`テーブルを作成していません。** 仕様上、利用者はログイン不要で会員登録の概念がなく、同一人物・同一メールでの重複予約も許可されているため、利用者情報は`reservations`テーブルに都度保存する設計としました。認証が必要なのは管理者（`admin_users`）のみです。
- **予約データへの一般的なSELECT権限をRLSで付与していません。** `/reservation/[id]`や`/checkin/[token]`は、UUID/ランダムトークンをそのものを一種のベアラートークンとして扱い、Service Role経由で「完全一致検索のみ」を行うことで、予約の一覧化（他人の情報の推測・列挙）を防いでいます。
- **レート制限はインメモリ実装です。** Vercelのサーバーレス関数は複数インスタンスが起動されるため、本実装は同一インスタンス内での連打防止という補助的な役割に留まります。本格的な運用では[Upstash Redis](https://upstash.com/)と`@upstash/ratelimit`への置き換えを推奨します。
- **ESLintはv8系（`eslint@^8.57.0`）を使用しています。** `eslint-config-next@15.1.6`はESLint v8系の`.eslintrc.json`形式を前提としており、v9系のFlat Configとの組み合わせでは検証時に不安定な挙動が確認されたため、実績のあるv8系に固定しています。

---

## 14. 既知の制限・今後の改善候補

- レート制限をUpstash Redis等の永続ストアに置き換える。
- 監査ログの長期保管・エクスポート機能の追加。
- 通知メール送信の再試行キュー（現状は1回送信のみ、失敗時は`reservations`テーブルにエラー内容を記録するのみ）。
- E2Eテスト（Playwright等）の追加。

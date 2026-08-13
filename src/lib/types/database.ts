/**
 * Supabaseデータベースの型定義。
 * `supabase gen types typescript` で生成する型と互換性のある手書き定義。
 * スキーマ変更時は supabase/migrations と本ファイルを必ず同期させること。
 */

export type AdminRole = "super_admin" | "staff" | "sub_admin";
export type ReservationStatus = "not_checked_in" | "checked_in";
export type CheckinMethod = "qr" | "manual";

// NOTE: これらは意図的に `interface` ではなく `type` エイリアスで定義している。
// TypeScriptの構造的型チェックでは、`interface` は Record<string, X> 系の
// インデックスシグネチャ型に対して暗黙の互換性を持たないため、
// @supabase/supabase-js の `GenericTable`（Row/Insert/UpdateがRecord<string,unknown>を要求）
// との `extends` 判定が `never` に落ちてしまう。`type` エイリアスであれば
// 構造的に互換性を持つため、Database型定義では必ず `type` を使うこと。

export type AdminUserRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
};

export type AvailableDateRow = {
  id: string;
  date: string;
  is_active: boolean;
  note: string | null;
  created_at: string;
  created_by: string | null;
};

export type ReservationRow = {
  id: string;
  qr_token: string;
  available_date_id: string;
  visit_date: string;
  name: string;
  team_name: string;
  email: string;
  phone: string;
  terms_agreed: boolean;
  terms_agreed_at: string | null;
  status: ReservationStatus;
  checked_in_at: string | null;
  checked_in_method: CheckinMethod | null;
  checked_in_by: string | null;
  confirmation_email_sent_at: string | null;
  confirmation_email_error: string | null;
  reminder_sent_at: string | null;
  reminder_email_error: string | null;
  created_ip: string | null;
  created_at: string;
};

export type CheckinLogRow = {
  id: string;
  reservation_id: string;
  checked_in_at: string;
  method: CheckinMethod;
  performed_by: string | null;
  note: string | null;
  created_at: string;
};

export type NotificationSettingsRow = {
  id: string;
  admin_notification_emails: string[];
  reminder_enabled: boolean;
  reminder_send_hour_jst: number;
  updated_at: string;
  updated_by: string | null;
};

export type AuditLogRow = {
  id: string;
  actor_admin_id: string | null;
  actor_email: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export type RetentionCandidateRow = {
  id: string;
  name: string;
  team_name: string;
  email: string;
  visit_date: string;
  created_at: string;
  age: string;
};

/**
 * Supabaseクライアントに渡すジェネリックDatabase型。
 * @supabase/supabase-js の型推論を正しく機能させるため、各テーブルに
 * Row / Insert / Update / Relationships を過不足なく定義する（Relationshipsが
 * 欠けると `.select()` 等の戻り値が `never` に落ちてしまうため必須）。
 */
export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUserRow;
        Insert: Partial<AdminUserRow> & { name: string; email: string; role: AdminRole };
        Update: Partial<AdminUserRow>;
        Relationships: [];
      };
      available_dates: {
        Row: AvailableDateRow;
        Insert: Partial<AvailableDateRow> & { date: string };
        Update: Partial<AvailableDateRow>;
        Relationships: [];
      };
      reservations: {
        Row: ReservationRow;
        Insert: Partial<ReservationRow> & {
          qr_token: string;
          available_date_id: string;
          visit_date: string;
          name: string;
          team_name: string;
          email: string;
          phone: string;
        };
        Update: Partial<ReservationRow>;
        Relationships: [
          {
            foreignKeyName: "reservations_available_date_id_fkey";
            columns: ["available_date_id"];
            isOneToOne: false;
            referencedRelation: "available_dates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_checked_in_by_fkey";
            columns: ["checked_in_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
        ];
      };
      checkin_logs: {
        Row: CheckinLogRow;
        Insert: Partial<CheckinLogRow> & { reservation_id: string; method: CheckinMethod };
        Update: Partial<CheckinLogRow>;
        Relationships: [
          {
            foreignKeyName: "checkin_logs_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkin_logs_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_settings: {
        Row: NotificationSettingsRow;
        Insert: Partial<NotificationSettingsRow>;
        Update: Partial<NotificationSettingsRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Partial<AuditLogRow> & { action: string };
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
    };
    Views: {
      retention_candidates: {
        Row: RetentionCandidateRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

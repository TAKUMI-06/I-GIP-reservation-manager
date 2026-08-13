import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "メールアドレスを入力してください。").email("メールアドレスの形式が正しくありません。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const addAvailableDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません。"),
  note: z.string().trim().max(200).optional(),
});

export const addAdminUserSchema = z.object({
  name: z.string().trim().min(1, "氏名を入力してください。").max(100),
  email: z.string().trim().min(1, "メールアドレスを入力してください。").email(),
  role: z.enum(["super_admin", "staff", "sub_admin"]),
  password: z
    .string()
    .min(8, "パスワードは8文字以上にしてください。")
    .max(72, "パスワードは72文字以内にしてください。"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "パスワードは8文字以上にしてください。")
      .max(72, "パスワードは72文字以内にしてください。"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください。"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const updateNotificationSettingsSchema = z.object({
  adminNotificationEmails: z
    .array(z.string().trim().email("メールアドレスの形式が正しくありません。"))
    .max(20, "通知先は20件までです。"),
  reminderEnabled: z.boolean(),
});

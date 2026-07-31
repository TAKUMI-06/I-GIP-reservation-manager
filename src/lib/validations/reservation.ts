import { z } from "zod";

/** 電話番号: 数字・ハイフンのみ、10〜15桁程度を許容 */
const phoneRegex = /^[0-9-]{9,15}$/;

export const reservationFormSchema = z.object({
  availableDateIds: z
    .array(z.string().uuid())
    .min(1, { message: "利用日を1つ以上選択してください。" }),
  name: z
    .string()
    .trim()
    .min(1, "氏名を入力してください。")
    .max(100, "氏名は100文字以内で入力してください。"),
  teamName: z
    .string()
    .trim()
    .min(1, "チーム名を入力してください。")
    .max(100, "チーム名は100文字以内で入力してください。"),
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください。")
    .email("メールアドレスの形式が正しくありません。")
    .max(255),
  phone: z
    .string()
    .trim()
    .min(1, "電話番号を入力してください。")
    .regex(phoneRegex, "電話番号の形式が正しくありません（例: 090-1234-5678）。"),
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: "利用規約への同意が必要です。" }),
  }),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export const searchReservationSchema = z.object({
  query: z.string().trim().max(200).optional().default(""),
});

export const manualCheckinSchema = z.object({
  reservationId: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
});

export const qrCheckinSchema = z.object({
  token: z.string().trim().min(10).max(200),
});

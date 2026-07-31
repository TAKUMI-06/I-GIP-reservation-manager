import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwindのクラス名を安全にマージするヘルパー。
 * shadcn/ui系コンポーネント全般で使用する。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

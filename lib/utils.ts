import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  try {
    return new Date(date).toLocaleDateString("ko-KR", options);
  } catch {
    return "알 수 없음";
  }
}

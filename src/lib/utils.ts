import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWIBDateString(dateObj: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(dateObj);
}

export function getWIBDay() {
  const dateStr = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" }).format(new Date());
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.indexOf(dateStr);
}

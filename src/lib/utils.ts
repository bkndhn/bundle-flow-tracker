import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a consistent 12-hour format across all devices
 * Uses explicit locale and options to ensure consistency
 */
export function formatDateTime12hr(dateString: string): string {
  const date = new Date(dateString);
  
  // Format date part: dd/MM/yyyy
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Format time part: hh:mm AM/PM (12-hour format)
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = hours.toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Format date only: dd/MM/yyyy
 */
export function formatDateOnly(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

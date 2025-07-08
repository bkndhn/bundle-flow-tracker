import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGodownStaff() {
  return [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" }
  ];
}

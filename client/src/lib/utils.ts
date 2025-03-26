import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function getReadingTime(content: string) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return time === 1 ? '1 min read' : `${time} min read`;
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

export function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getRandomAvatar(name: string = '') {
  // Use initials for a deterministic color
  const initials = getInitials(name);
  const charCode = initials.charCodeAt(0) || 65; // 'A' is 65
  const hue = (charCode - 65) * 15 % 360;
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${hue},70%,80%&color=fff`;
}

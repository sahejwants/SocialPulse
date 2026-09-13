import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/** Extract [lat, lng] from a Google Maps URL. Returns null if not found. */
export function extractMapCoords(url: string): [number, number] | null {
  const patterns = [
    /@(-?\d+\.?\d+),(-?\d+\.?\d+)/,                 // @lat,lng,zoom
    /[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/,             // ?q=lat,lng
    /[?&]ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/,            // ?ll=lat,lng
    /[?&]center=(-?\d+\.?\d+),(-?\d+\.?\d+)/,        // ?center=lat,lng
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  }
  return null;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

import { env } from "@/core/config/env";

/**
 * A API devolve imagens como URL absoluta (Supabase Storage) ou caminho
 * servido por ela (ex.: /uploads/2026/10/abc.webp). Resolve para absoluta.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.apiUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

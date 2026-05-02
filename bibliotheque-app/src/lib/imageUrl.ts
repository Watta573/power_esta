const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ?? "http://localhost:8080";

export function couvertureUrl(couverture: string | null | undefined): string | null {
  if (!couverture) return null;
  if (couverture.startsWith("http")) return couverture;
  return `${API_BASE}${couverture}`;
}

import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ── Rate limiting côté client ─────────────────────────────────────────────────
const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const requestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - REQUEST_WINDOW_MS;
  // Purger les anciennes entrées
  while (requestTimestamps.length && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return false;
  requestTimestamps.push(now);
  return true;
}

// ── Détection de patterns suspects ───────────────────────────────────────────
const SUSPICIOUS_PATTERNS = [
  /<script[\s\S]*?>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /union\s+select/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /exec\s*\(/i,
  /\.\.\//,                    // path traversal
  /%2e%2e/i,                   // encoded path traversal
  /\x00/,                      // null bytes
];

function containsSuspiciousContent(value: unknown): boolean {
  if (typeof value === "string") {
    return SUSPICIOUS_PATTERNS.some((p) => p.test(value));
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(containsSuspiciousContent);
  }
  return false;
}

// ── Sanitisation légère des strings ──────────────────────────────────────────
function sanitizeString(str: string): string {
  // Sanitise uniquement les caractères dangereux pour XSS, pas les caractères normaux
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeData(data: unknown): unknown {
  if (typeof data === "string") return sanitizeString(data);
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, sanitizeData(v)])
    );
  }
  return data;
}

// ── Sanitisation des messages de log (anti log-injection) ───────────────────
function sanitizeLog(value: unknown): string {
  return String(value).replace(/[\r\n\t]/g, " ").substring(0, 200);
}

// ── Génération du token CSRF (Synchronizer Token Pattern) ──────────────────
// Le token est généré une fois par session, lié à l'origine attendue,
// et envoyé dans un header custom (X-CSRF-Token) que les requêtes cross-origin
// ne peuvent pas définir via un formulaire HTML ou fetch sans CORS.
const EXPECTED_ORIGIN = window.location.origin;

function getCsrfToken(): string {
  const key = "__csrf";
  let token = sessionStorage.getItem(key);
  if (!token) {
    token = `${crypto.randomUUID()}.${Date.now()}`;
    sessionStorage.setItem(key, token);
  }
  return token;
}

// Vérifie que l'origine d'une réponse est de confiance (protection CSRF côté client)
export function isOriginTrusted(origin: string | null | undefined): boolean {
  if (!origin) return true;
  return origin === EXPECTED_ORIGIN;
}

// ── Gestion du token refresh ──────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshToken(): Promise<string | null> {
  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
      withCredentials: true,
      timeout: 5000,
    });
    const newToken: string = res.data.token;
    useAuthStore.getState().setAuth(newToken, res.data.refreshToken ?? "", res.data.utilisateur);
    return newToken;
  } catch {
    useAuthStore.getState().logout();
    window.location.replace("/login");
    return null;
  }
}

// ── Client principal ──────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: false, // L'auth se fait via header Authorization (JWT). Pas de cookies sur les requêtes API.
});

// ── Intercepteur REQUEST ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Rate limiting
    if (!checkRateLimit()) {
      return Promise.reject(
        Object.assign(new Error("Trop de requêtes. Veuillez patienter."), { code: "RATE_LIMITED" })
      ) as never;
    }

    // 2. Injection du token JWT
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Détection de contenu suspect + sanitisation du body (pas sur FormData)
    if (config.data && !(config.data instanceof FormData)) {
      config.data = sanitizeData(config.data);
    }
    if (config.data && !(config.data instanceof FormData) && containsSuspiciousContent(config.data)) {
      console.warn("[Security] Contenu suspect détecté dans la requête — bloqué.");
      return Promise.reject(
        Object.assign(new Error("Contenu non autorisé détecté."), { code: "SUSPICIOUS_CONTENT" })
      ) as never;
    }

    // 5. Token CSRF + nonce anti-replay sur les mutations
    if (["post", "put", "delete", "patch"].includes(config.method ?? "")) {
      config.headers["X-CSRF-Token"] = getCsrfToken();
      config.headers["X-Request-Nonce"] = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    }

    // 6. Timestamp de la requête (détection de replay attacks)
    config.headers["X-Request-Time"] = Date.now().toString();

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur RESPONSE ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers["content-type"] ?? "");
    // Valider l'origine de la réponse pour détecter les attaques CSRF/MITM
    const responseOrigin = response.headers["x-response-origin"] as string | undefined;
    if (responseOrigin && !isOriginTrusted(responseOrigin)) {
      return Promise.reject(Object.assign(new Error("Origine de réponse non fiable."), { code: "UNTRUSTED_ORIGIN" }));
    }
    if (response.data && !contentType.includes("application/json") && !contentType.includes("text/")) {
      console.warn("[Security] Type de contenu inattendu:", sanitizeLog(contentType));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // 401 → tentative de refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Mettre en file d'attente
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshToken();
      isRefreshing = false;

      if (newToken) {
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      }
    }

    // 403 → accès refusé
    if (error.response?.status === 403) {
      const safeUrl = sanitizeLog(originalRequest.url ?? "");
      console.warn("[Security] Accès refusé: " + safeUrl);
    }

    // 429 → rate limiting serveur
    if (error.response?.status === 429) {
      const safeRetry = sanitizeLog(error.response.headers["retry-after"] ?? "5");
      console.warn("[Security] Rate limit serveur. Retry après " + safeRetry + "s");
    }

    // 5xx → retry automatique (max 2 fois, avec backoff)
    if (error.response?.status >= 500 && (originalRequest._retryCount ?? 0) < 2) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      const delay = originalRequest._retryCount * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return apiClient(originalRequest);
    }

    // Timeout → message clair
    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        Object.assign(new Error("La requête a expiré. Vérifiez votre connexion."), { code: "TIMEOUT" })
      );
    }

    return Promise.reject(error);
  }
);

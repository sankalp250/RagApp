/**
 * API Client for interacting with the FastAPI Backend (http://127.0.0.1:8000/api/v1)
 */

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleaned = envUrl.replace(/\/+$/, "");
  return cleaned.endsWith("/api/v1") ? cleaned : `${cleaned}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

export interface UserSession {
  id: string;
  email: string;
  full_name?: string;
  organization_id?: string;
  organization_name?: string;
  role?: string;
}

export type AuthUnauthorizedHandler = () => void;
let unauthorizedHandler: AuthUnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: AuthUnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("chatin_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      null
    );
  },
  setToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("chatin_token", token);
  },
  getUser: (): UserSession | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("chatin_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser: (user: UserSession) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("chatin_user", JSON.stringify(user));
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("chatin_token");
    localStorage.removeItem("chatin_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
  },
};

// ─── High-Performance Client Cache & In-Flight Request Deduplication ─────────
interface CacheRecord<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const clientCache = new Map<string, CacheRecord<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function invalidateApiCache(pattern?: string) {
  if (!pattern) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.includes(pattern)) {
      clientCache.delete(key);
    }
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStorage.getToken();
  const user = authStorage.getUser();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (user?.organization_id) {
    headers["X-Organization-ID"] = user.organization_id;
  }

  let url: string;
  if (endpoint.startsWith("http")) {
    url = endpoint;
  } else if (endpoint.startsWith("/api/v1") || endpoint.startsWith("api/v1")) {
    const root = API_BASE_URL.replace(/\/api\/v1$/, "");
    url = `${root}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  } else {
    url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid/expired credentials
      if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
        authStorage.clear();
        invalidateApiCache();
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }
    }

    let errorDetail = "An unexpected error occurred";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(
    endpoint: string,
    headers?: Record<string, string>,
    options: { bypassCache?: boolean; ttlMs?: number } = {}
  ): Promise<T> => {
    const { bypassCache = false, ttlMs = 25000 } = options;
    const token = authStorage.getToken() || "anon";
    const cacheKey = `GET:${endpoint}:${token}`;

    if (!bypassCache) {
      const cached = clientCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttlMs) {
        return Promise.resolve(cached.data as T);
      }
    }

    // Deduplicate identical concurrent inflight requests
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as Promise<T>;
    }

    const fetchPromise = request<T>(endpoint, { method: "GET", headers })
      .then((data) => {
        clientCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttlMs,
        });
        return data;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  post: <T>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    invalidateApiCache();
    return request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    });
  },

  put: <T>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    invalidateApiCache();
    return request<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    });
  },

  patch: <T>(endpoint: string, body?: any, headers?: Record<string, string>) => {
    invalidateApiCache();
    return request<T>(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    });
  },

  delete: <T>(endpoint: string, headers?: Record<string, string>) => {
    invalidateApiCache();
    return request<T>(endpoint, { method: "DELETE", headers });
  },

  upload: <T>(endpoint: string, formData: FormData) => {
    invalidateApiCache();
    return request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  },

  invalidateCache: invalidateApiCache,
};

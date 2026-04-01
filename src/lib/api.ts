const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    authHeaders["Authorization"] = `Bearer ${token}`;
  } else {
    const stored = localStorage.getItem("token");
    if (stored) {
      authHeaders["Authorization"] = `Bearer ${stored}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders,
    ...rest,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || "API Error");
  }

  return res.json();
}

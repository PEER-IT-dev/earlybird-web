export interface UserInfo {
  id: string;
  display_name: string;
  member_type: "earlybird" | "super_earlybird" | null;
  is_admin: boolean;
  profile_image: string | null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  return JSON.parse(raw);
}

export function setUser(user: UserInfo) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

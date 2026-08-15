const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type UserRole = "organizer" | "customer" | "gate";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? "Algo deu errado. Tente novamente.");
  }

  return response.json();
}

export function login(email: string, password: string) {
  return request<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  name: string;
  email: string;
  password: string;
  role: "organizer" | "customer";
}) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function me(token: string) {
  return request<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

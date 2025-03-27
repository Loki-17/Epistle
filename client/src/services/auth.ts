import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
  displayName: z.string().min(2).optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export async function login(data: LoginData) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include", // Important for session cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to login");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function register(data: RegisterData) {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include", // Important for session cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to register");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function logout() {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include", // Important for session cookies
    });

    if (!response.ok) {
      throw new Error("Failed to logout");
    }

    // Clear any user-related data
    localStorage.removeItem("user");
    
    // Redirect to the homepage
    window.location.href = "/";
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
} 
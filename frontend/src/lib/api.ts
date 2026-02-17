import { supabase } from "./supabase";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/**
 * Authenticated fetch helper
 * Automatically attaches Supabase JWT token
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Get current session safely
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    // Create headers safely
    const headers = new Headers(options.headers || {});

    // Default JSON header
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Attach JWT token
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Perform request
    const response = await fetch(`${BACKEND_URL}${url}`, {
      ...options,
      headers,
    });

    // If unauthorized → force logout
    if (response.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }

    return response;
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}

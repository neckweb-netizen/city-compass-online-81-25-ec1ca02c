import { HttpError } from "./security.ts";

export function escapeHtml(value: unknown, maxLength = 1000): string {
  return String(value ?? "")
    .slice(0, maxLength)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function validateEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, "Email inválido");
  }
  return email;
}

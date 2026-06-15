import axios, { AxiosError } from "axios";
import { ApiErrorPayload } from "../types/common";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api";

export function normalizeApiBaseUrl(baseUrl: string | undefined): string {
  const normalizedBaseUrl = (baseUrl ?? DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;
}

export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

if (import.meta.env.DEV) {
  console.info("[api] baseURL:", apiBaseUrl);
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
});

function formatApiDetail(detail: unknown): string | undefined {
  if (!detail) return undefined;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const row = item as { loc?: unknown[]; msg?: string; type?: string };
          const path = Array.isArray(row.loc) ? row.loc.join(".") : "campo";
          return `${path}: ${row.msg ?? row.type ?? JSON.stringify(item)}`;
        }
        return String(item);
      })
      .join(" | ");
  }
  if (typeof detail === "object") return JSON.stringify(detail);
  return String(detail);
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Ocurrio un error inesperado.";
  const axiosError = error as AxiosError<ApiErrorPayload>;
  if (axiosError.code === "ECONNABORTED") return "El backend tardo demasiado en responder. Puede estar iniciando en Render o procesando una simulacion pesada.";
  if (!axiosError.response) return "No se pudo conectar con el backend. Verifica que FastAPI este corriendo.";
  if (axiosError.response.status === 404) {
    return "No se encontro el endpoint solicitado en el backend. Verifica que VITE_API_URL termine en /api y que la ruta exista.";
  }
  const payload = axiosError.response.data;
  return formatApiDetail(payload?.detail) ?? formatApiDetail(payload?.message) ?? `Error ${axiosError.response.status}`;
}

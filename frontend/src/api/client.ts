import axios, { AxiosError } from "axios";
import { ApiErrorPayload } from "../types/common";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  timeout: 12000,
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Ocurrio un error inesperado.";
  const axiosError = error as AxiosError<ApiErrorPayload>;
  if (axiosError.code === "ECONNABORTED") return "El backend tardo demasiado en responder.";
  if (!axiosError.response) return "No se pudo conectar con el backend. Verifica que FastAPI este corriendo.";
  return axiosError.response.data?.detail ?? axiosError.response.data?.message ?? `Error ${axiosError.response.status}`;
}

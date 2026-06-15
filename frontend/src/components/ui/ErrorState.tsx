import { AlertTriangle } from "lucide-react";

function toMessage(message: unknown) {
  if (message === undefined || message === null) return "Ocurrio un error inesperado.";
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.map(toMessage).join(" | ");
  if (typeof message === "object") return JSON.stringify(message);
  return String(message);
}

export function ErrorState({ message }: { message: unknown }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
        <span>{toMessage(message)}</span>
      </div>
    </div>
  );
}

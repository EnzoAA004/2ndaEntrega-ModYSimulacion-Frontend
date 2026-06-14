export function toNumberPayload<T extends Record<string, string>>(values: T, textFields: string[] = []) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, textFields.includes(key) ? value : Number(value)])
  );
}

export const methodOptions = [
  { label: "Euler", value: "euler" },
  { label: "Heun", value: "heun" },
  { label: "RK4", value: "rk4" },
];

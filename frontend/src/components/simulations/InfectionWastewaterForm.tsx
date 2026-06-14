import { FormEvent, useState } from "react";
import { runInfectionWastewater } from "../../api/simulationsApi";
import { getApiErrorMessage } from "../../api/client";
import { SimulationResult } from "../../types/simulation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ErrorState } from "../ui/ErrorState";
import { methodOptions, toNumberPayload } from "./formUtils";

const initial = { beta: "0.35", K: "100000", gamma: "0.12", alpha: "25", k: "0.15", d: "0.05", I0: "100", V0: "5000", t_final: "90", step: "0.5", method: "rk4" };

export function InfectionWastewaterForm({ onResult }: { onResult: (result: SimulationResult) => void }) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onResult(await runInfectionWastewater(toNumberPayload(values, ["method"])));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorState message={error} />}
      <div className="grid gap-3 md:grid-cols-2">
        {Object.keys(initial).filter((key) => key !== "method").map((key) => (
          <Input key={key} label={key} value={values[key as keyof typeof values]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        ))}
        <Select label="Metodo" value={values.method} options={methodOptions} onChange={(e) => setValues({ ...values, method: e.target.value })} />
      </div>
      <Button disabled={loading}>{loading ? "Simulando..." : "Ejecutar modelo 2D"}</Button>
    </form>
  );
}

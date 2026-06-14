import { FormEvent, useState } from "react";
import { runPhaseDiagram } from "../../api/simulationsApi";
import { getApiErrorMessage } from "../../api/client";
import { SimulationResult } from "../../types/simulation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ErrorState } from "../ui/ErrorState";
import { toNumberPayload } from "./formUtils";

const initial = { I_min: "0", I_max: "100000", V_min: "0", V_max: "1000000", grid_size: "18", beta: "0.35", K: "100000", gamma: "0.12", alpha: "25", k: "0.15", d: "0.05" };

export function PhaseDiagramForm({ onResult }: { onResult: (result: SimulationResult) => void }) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onResult(await runPhaseDiagram(toNumberPayload(values)));
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
        {Object.keys(initial).map((key) => (
          <Input key={key} label={key} value={values[key as keyof typeof values]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        ))}
      </div>
      <Button disabled={loading}>{loading ? "Calculando..." : "Ver diagrama de fase"}</Button>
    </form>
  );
}

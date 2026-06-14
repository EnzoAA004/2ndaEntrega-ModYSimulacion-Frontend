import { FormEvent, useState } from "react";
import { runBifurcation } from "../../api/simulationsApi";
import { getApiErrorMessage } from "../../api/client";
import { SimulationResult } from "../../types/simulation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ErrorState } from "../ui/ErrorState";
import { toNumberPayload } from "./formUtils";

const initial = { parameter_name: "beta", parameter_min: "0.01", parameter_max: "0.8", steps: "100", K: "100000", beta: "0.35", gamma: "0.12" };

export function BifurcationForm({ onResult }: { onResult: (result: SimulationResult) => void }) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onResult(await runBifurcation(toNumberPayload(values, ["parameter_name"])));
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
        <Select label="Parametro" value={values.parameter_name} options={[{ label: "beta", value: "beta" }, { label: "gamma", value: "gamma" }]} onChange={(e) => setValues({ ...values, parameter_name: e.target.value })} />
        {Object.keys(initial).filter((key) => key !== "parameter_name").map((key) => (
          <Input key={key} label={key} value={values[key as keyof typeof values]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        ))}
      </div>
      <Button disabled={loading}>{loading ? "Calculando..." : "Ver bifurcacion"}</Button>
    </form>
  );
}

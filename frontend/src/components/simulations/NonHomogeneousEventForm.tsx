import { FormEvent, useState } from "react";
import { runNonHomogeneousEvent } from "../../api/simulationsApi";
import { getApiErrorMessage } from "../../api/client";
import { SimulationResult } from "../../types/simulation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ErrorState } from "../ui/ErrorState";
import { methodOptions, toNumberPayload } from "./formUtils";

const initial = { event_type: "outbreak_shock", base_source: "50000", amplitude: "15000", frequency: "0.1", shock_start: "15", shock_end: "25", shock_magnitude: "90000", rainfall_start: "35", rainfall_end: "45", dilution_multiplier: "0.55", k: "0.15", d: "0.05", V0: "10000", t_final: "70", step: "0.5", method: "rk4" };

export function NonHomogeneousEventForm({ onResult }: { onResult: (result: SimulationResult) => void }) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onResult(await runNonHomogeneousEvent(toNumberPayload(values, ["event_type", "method"])));
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
        <Select label="Tipo de evento" value={values.event_type} options={["constant", "sinusoidal", "outbreak_shock", "rainfall_dilution"].map((v) => ({ label: v, value: v }))} onChange={(e) => setValues({ ...values, event_type: e.target.value })} />
        <Select label="Metodo" value={values.method} options={methodOptions} onChange={(e) => setValues({ ...values, method: e.target.value })} />
        {Object.keys(initial).filter((key) => !["event_type", "method"].includes(key)).map((key) => (
          <Input key={key} label={key} value={values[key as keyof typeof values]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
        ))}
      </div>
      <Button disabled={loading}>{loading ? "Simulando..." : "Ejecutar evento"}</Button>
    </form>
  );
}

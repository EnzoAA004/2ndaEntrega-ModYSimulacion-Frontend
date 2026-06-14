import { FormEvent, useState } from "react";
import { runViralDecay } from "../../api/simulationsApi";
import { getApiErrorMessage } from "../../api/client";
import { SimulationResult } from "../../types/simulation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { ErrorState } from "../ui/ErrorState";
import { methodOptions, toNumberPayload } from "./formUtils";

const initial = { S: "50000", k: "0.15", d: "0.05", V0: "10000", t_final: "60", step: "0.5", method: "rk4", name: "" };

export function ViralDecayForm({ onResult }: { onResult: (result: SimulationResult) => void }) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      onResult(await runViralDecay(toNumberPayload(values, ["method", "name"])));
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
        <Input label="S" hint="Fuente viral externa" value={values.S} onChange={(e) => setValues({ ...values, S: e.target.value })} />
        <Input label="k" hint="Decaimiento viral" value={values.k} onChange={(e) => setValues({ ...values, k: e.target.value })} />
        <Input label="d" hint="Dilucion/remocion" value={values.d} onChange={(e) => setValues({ ...values, d: e.target.value })} />
        <Input label="V0" value={values.V0} onChange={(e) => setValues({ ...values, V0: e.target.value })} />
        <Input label="t_final" value={values.t_final} onChange={(e) => setValues({ ...values, t_final: e.target.value })} />
        <Input label="step" value={values.step} onChange={(e) => setValues({ ...values, step: e.target.value })} />
        <Select label="Metodo" value={values.method} options={methodOptions} onChange={(e) => setValues({ ...values, method: e.target.value })} />
        <Input label="Nombre opcional" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
      </div>
      <Button disabled={loading}>{loading ? "Simulando..." : "Ejecutar modelo 1D"}</Button>
    </form>
  );
}

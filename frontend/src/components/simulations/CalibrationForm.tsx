import { FormEvent, useState } from "react";
import { runCalibration } from "../../api/simulationsApi";
import { getApiErrorMessage } from "../../api/client";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Card, CardTitle } from "../ui/Card";
import { ErrorState } from "../ui/ErrorState";
import { formatNumber, formatScientific } from "../../utils/formatters";

const initial = { location_name: "Buenos Aires - Planta Norte", model_type: "infection-wastewater-2d", date_from: "", date_to: "" };

export function CalibrationForm() {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
      setResult(await runCalibration(payload));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  const estimated = result?.estimated_parameters ?? {};
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorState message={error} />}
        <Input label="Ubicacion" value={values.location_name} onChange={(e) => setValues({ ...values, location_name: e.target.value })} />
        <Select label="Modelo" value={values.model_type} options={[{ label: "Modelo 2D infectados-carga viral", value: "infection-wastewater-2d" }, { label: "Modelo 1D decaimiento viral", value: "viral-decay-1d" }]} onChange={(e) => setValues({ ...values, model_type: e.target.value })} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Fecha desde" type="date" value={values.date_from} onChange={(e) => setValues({ ...values, date_from: e.target.value })} />
          <Input label="Fecha hasta" type="date" value={values.date_to} onChange={(e) => setValues({ ...values, date_to: e.target.value })} />
        </div>
        <Button disabled={loading}>{loading ? "Calibrando..." : "Calibrar desde datos"}</Button>
      </form>
      {result && (
        <Card>
          <CardTitle>Parametros estimados</CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="beta" value={formatNumber(estimated.beta, 4)} />
            <Metric label="gamma" value={formatNumber(estimated.gamma, 4)} />
            <Metric label="alpha" value={formatNumber(estimated.alpha, 4)} />
            <Metric label="k" value={formatNumber(estimated.k, 4)} />
            <Metric label="d" value={formatNumber(estimated.d, 4)} />
            <Metric label="S" value={formatScientific(estimated.S)} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{result.explanation}</p>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>;
}

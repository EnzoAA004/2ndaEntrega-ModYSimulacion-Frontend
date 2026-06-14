import { ChangeEvent, useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/client";
import { DatasetSummary, getDatasetSummary, seedDemo, uploadCsv } from "../api/datasetsApi";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { formatDate, formatNumber, formatScientific } from "../utils/formatters";

export function DatasetPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<DatasetSummary>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshSummary() {
    try {
      setSummary(await getDatasetSummary());
    } catch {
      setSummary(undefined);
    }
  }

  useEffect(() => { refreshSummary(); }, []);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const result = await uploadCsv(file);
      setMessage(`CSV importado correctamente. Filas procesadas: ${result.rows_inserted ?? result.inserted ?? "-"}`);
      await refreshSummary();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setLoading(true);
    setError("");
    try {
      const result = await seedDemo();
      setMessage(`Datos demo cargados. Filas insertadas: ${result.rows_inserted ?? result.inserted ?? "-"}`);
      await refreshSummary();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Dataset" description="Carga datos ambientales reales o genera un dataset demo para explorar la plataforma sin preparar archivos externos." />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Importar CSV</CardTitle>
          <p className="mt-2 text-sm text-slate-600">Sube un archivo con columnas compatibles con el backend FastAPI.</p>
          <input className="mt-4 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm" type="file" accept=".csv" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleUpload} disabled={!file || loading}>Subir CSV</Button>
            <Button variant="secondary" onClick={handleSeed} disabled={loading}>Cargar datos demo</Button>
          </div>
          <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Columnas esperadas</p>
            <p className="mt-2 leading-6">sample_date, location_name, city, country, population_served, flow_rate_m3_day, viral_concentration_gc_l, temperature_c, rainfall_mm, clinical_cases</p>
          </div>
        </Card>
        <Card>
          <CardTitle>Resumen del dataset</CardTitle>
          {loading ? <div className="mt-4"><LoadingState /></div> : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="Total mediciones" value={formatNumber(summary?.total_measurements)} />
              <Metric label="Ubicaciones" value={formatNumber(summary?.locations)} />
              <Metric label="Fecha desde" value={formatDate(summary?.date_from)} />
              <Metric label="Fecha hasta" value={formatDate(summary?.date_to)} />
              <Metric label="Promedio viral" value={formatScientific(summary?.avg_viral_concentration_gc_l)} />
              <Metric label="Maximo viral" value={formatScientific(summary?.max_viral_concentration_gc_l)} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-slate-950">{value}</p></div>;
}

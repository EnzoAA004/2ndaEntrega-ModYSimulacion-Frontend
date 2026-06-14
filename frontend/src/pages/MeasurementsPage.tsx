import { FormEvent, useEffect, useState } from "react";
import { getApiErrorMessage } from "../api/client";
import { getMeasurements } from "../api/measurementsApi";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import { Measurement, MeasurementFilters } from "../types/measurement";
import { formatDate, formatNumber, formatScientific } from "../utils/formatters";

export function MeasurementsPage() {
  const [filters, setFilters] = useState<MeasurementFilters>({ page: 1, page_size: 20 });
  const [rows, setRows] = useState<Measurement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await getMeasurements(nextFilters);
      setRows(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...filters, page: 1 };
    setFilters(next);
    load(next);
  }

  return (
    <>
      <PageHeader title="Mediciones" description="Consulta paginada de muestras ambientales con filtros por ubicacion, ciudad, pais y rango temporal." />
      <Card className="mb-6">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Input label="Ubicacion" value={filters.location_name ?? ""} onChange={(e) => setFilters({ ...filters, location_name: e.target.value })} />
          <Input label="Ciudad" value={filters.city ?? ""} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          <Input label="Pais" value={filters.country ?? ""} onChange={(e) => setFilters({ ...filters, country: e.target.value })} />
          <Input label="Desde" type="date" value={filters.date_from ?? ""} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
          <Input label="Hasta" type="date" value={filters.date_to ?? ""} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
          <div className="flex items-end"><Button className="w-full">Filtrar</Button></div>
        </form>
      </Card>
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      {loading ? <LoadingState /> : rows.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>{["Fecha", "Ubicacion", "Ciudad", "Viral", "Caudal", "Temp.", "Lluvia", "Casos", "Riesgo"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, i) => (
                  <tr key={`${row.id ?? row.location_name}-${i}`}>
                    <td className="px-4 py-3">{formatDate(row.sample_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.location_name}</td>
                    <td className="px-4 py-3">{row.city ?? "-"}</td>
                    <td className="px-4 py-3">{formatScientific(row.viral_concentration_gc_l)}</td>
                    <td className="px-4 py-3">{formatNumber(row.flow_rate_m3_day)}</td>
                    <td className="px-4 py-3">{formatNumber(row.temperature_c, 1)}</td>
                    <td className="px-4 py-3">{formatNumber(row.rainfall_mm, 1)}</td>
                    <td className="px-4 py-3">{formatNumber(row.clinical_cases)}</td>
                    <td className="px-4 py-3"><Badge risk={row.risk_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-600">
            <span>Total: {total}</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={(filters.page ?? 1) <= 1} onClick={() => { const next = { ...filters, page: (filters.page ?? 1) - 1 }; setFilters(next); load(next); }}>Anterior</Button>
              <Button variant="ghost" disabled={(filters.page ?? 1) * (filters.page_size ?? 20) >= total} onClick={() => { const next = { ...filters, page: (filters.page ?? 1) + 1 }; setFilters(next); load(next); }}>Siguiente</Button>
            </div>
          </div>
        </Card>
      ) : <EmptyState />}
    </>
  );
}

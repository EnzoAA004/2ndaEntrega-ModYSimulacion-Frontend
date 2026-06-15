import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarClock, Database, FileText, ShieldCheck, Siren, TrendingUp } from "lucide-react";
import { getLocationAnalytics, getLocationForecast, getOverview, getRiskTable } from "../api/analyticsApi";
import { apiBaseUrl, apiClient, getApiErrorMessage } from "../api/client";
import { getLatestMeasurements, getLocations } from "../api/measurementsApi";
import { ForecastChart } from "../components/charts/ForecastChart";
import { ViralLoadChart } from "../components/charts/ViralLoadChart";
import { EarlyWarningPanel } from "../components/dashboard/EarlyWarningPanel";
import { LatestMeasurementsTable } from "../components/dashboard/LatestMeasurementsTable";
import { LocationSelector } from "../components/dashboard/LocationSelector";
import { PredictionRankingPanel } from "../components/dashboard/PredictionRankingPanel";
import { RiskTable } from "../components/dashboard/RiskTable";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Card, CardTitle } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { LocationAnalytics, LocationForecast, Overview, RiskResult } from "../types/analytics";
import { LocationSummary, Measurement } from "../types/measurement";
import { formatDate, formatNumber, formatPercentTrend, formatScientific } from "../utils/formatters";

export function DashboardPage() {
  const [overview, setOverview] = useState<Overview>();
  const [riskRows, setRiskRows] = useState<RiskResult[]>([]);
  const [latest, setLatest] = useState<Measurement[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [predictiveRows, setPredictiveRows] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [locationData, setLocationData] = useState<LocationAnalytics>();
  const [forecast, setForecast] = useState<LocationForecast>();
  const [forecastLoading, setForecastLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const [overviewResult, riskResult, latestResult, locationsResult, predictiveResult] = await Promise.allSettled([
        getOverview(),
        getRiskTable(),
        getLatestMeasurements(),
        getLocations(),
        apiClient.get("/analytics/predictive-ranking", { params: { horizon: 21, window: 45 } }),
      ]);

      const errors: string[] = [];
      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
      else errors.push(getApiErrorMessage(overviewResult.reason));

      if (riskResult.status === "fulfilled") setRiskRows(riskResult.value);
      else errors.push(getApiErrorMessage(riskResult.reason));

      if (latestResult.status === "fulfilled") setLatest(latestResult.value);
      else errors.push(getApiErrorMessage(latestResult.reason));

      if (locationsResult.status === "fulfilled") setLocations(locationsResult.value);
      else errors.push(getApiErrorMessage(locationsResult.reason));

      if (predictiveResult.status === "fulfilled") setPredictiveRows(predictiveResult.value.data ?? []);

      const loadedLocations = locationsResult.status === "fulfilled" ? locationsResult.value : [];
      const loadedRisk = riskResult.status === "fulfilled" ? riskResult.value : [];
      setSelected(loadedLocations[0]?.location_name ?? loadedRisk[0]?.location_name ?? "");
      if (errors.length) setError([...new Set(errors)].join(" "));
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setForecastLoading(true);
    Promise.allSettled([getLocationAnalytics(selected), getLocationForecast(selected, 21, 45)]).then(([analyticsResult, forecastResult]) => {
      if (analyticsResult.status === "fulfilled") setLocationData(analyticsResult.value);
      else setError(getApiErrorMessage(analyticsResult.reason));

      if (forecastResult.status === "fulfilled") setForecast(forecastResult.value);
      else setError(getApiErrorMessage(forecastResult.reason));
    }).finally(() => setForecastLoading(false));
  }, [selected]);

  const currentRisk = useMemo(() => riskRows.find((row) => row.location_name === selected), [riskRows, selected]);
  const selectedSeries = locationData?.series ?? locationData?.time_series ?? [];
  const trend14 = overview?.trend_14d ?? overview?.trend_last_14_days;
  const forecastSummary = forecast?.summary;

  return (
    <>
      <PageHeader title="Dashboard epidemiologico" description="Centro de monitoreo temprano de carga viral en aguas residuales, riesgo por ubicación y señales anticipatorias frente a casos clínicos." />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      {loading ? <LoadingState /> : (
        <div className="space-y-6">
          <Card className="overflow-hidden border-sentinel-100 bg-gradient-to-r from-sentinel-50 via-white to-cyan-50">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge risk={overview?.latest_risk_level} />
                  <Badge tone={overview?.early_warning_locations ? "red" : "green"}>{overview?.early_warning_locations ? "Alerta temprana" : "Monitoreo normal"}</Badge>
                </div>
                <h2 className="text-2xl font-bold text-slate-950">Estado epidemiologico general</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {overview?.status_message ?? "Carga datos demo o mediciones reales para activar el monitoreo epidemiológico ambiental."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" href={apiBaseUrl + "/analytics/report/html"} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" /> Reporte imprimible</a>
                  <a className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" href={apiBaseUrl + "/analytics/export/measurements.csv"} target="_blank" rel="noreferrer">Exportar CSV</a>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                <div className="rounded-xl bg-white/80 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><TrendingUp className="h-4 w-4" /> Tendencia 14d</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{formatPercentTrend(trend14)}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Siren className="h-4 w-4" /> Alertas</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(overview?.early_warning_locations)}</div>
                </div>
                <div className="rounded-xl bg-white/80 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Database className="h-4 w-4" /> Datos</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(overview?.total_measurements)}</div>
                </div>
              </div>
            </div>
          </Card>

          <SummaryCards overview={overview} />
          {!latest.length && !riskRows.length ? <EmptyState title="No hay mediciones" message="Carga datos demo desde Dataset para activar el dashboard." /> : null}

          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <Card>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Carga viral, media movil, casos y lluvia</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Serie temporal con umbrales de riesgo alto y crítico.</p>
                </div>
                {locations.length > 0 && <div className="w-full md:w-72"><LocationSelector locations={locations} value={selected} onChange={setSelected} /></div>}
              </div>
              {selectedSeries.length ? (
                <ViralLoadChart data={selectedSeries} highThreshold={locationData?.thresholds?.high} criticalThreshold={locationData?.thresholds?.critical} />
              ) : <EmptyState message="Selecciona una ubicacion con datos para ver la serie temporal." />}
            </Card>
            <EarlyWarningPanel analytics={locationData} risk={currentRisk} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <Card>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Predicción de carga viral y escenarios</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Proyección log-lineal a 21 días con banda de incertidumbre y escenarios de mitigación o crecimiento alto.</p>
                </div>
                {forecastSummary?.forecast_risk_level && <Badge risk={forecastSummary.forecast_risk_level} />}
              </div>
              {forecastLoading ? <LoadingState /> : forecast?.forecast?.length ? <ForecastChart forecast={forecast} /> : <EmptyState title="Sin predicción" message="Se necesitan al menos 7 mediciones para proyectar la tendencia." />}
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-sentinel-600" />
                <CardTitle>Lectura predictiva</CardTitle>
              </div>
              {forecastSummary?.status === "ok" ? (
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Riesgo proyectado</p><p className="mt-1 text-lg font-bold text-slate-950">{forecastSummary.forecast_risk_level ?? "-"}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Cambio esperado</p><p className="mt-1 text-lg font-bold text-slate-950">{formatPercentTrend(forecastSummary.projected_change_percent)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Máximo predicho</p><p className="mt-1 text-lg font-bold text-slate-950">{formatScientific(forecastSummary.max_predicted_viral_concentration_gc_l)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Duplicación</p><p className="mt-1 text-lg font-bold text-slate-950">{forecastSummary.doubling_time_days ? `${formatNumber(forecastSummary.doubling_time_days, 1)} días` : "No aplica"}</p></div>
                  </div>
                  <div className="rounded-xl border border-sentinel-100 bg-sentinel-50 p-4"><div className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Activity className="h-4 w-4 text-sentinel-700" /> Recomendación automática</div><p>{forecastSummary.recommendation}</p></div>
                  <div className="text-xs leading-5 text-slate-500"><p>Umbral alto: {forecastSummary.high_threshold_crossing_date ? formatDate(forecastSummary.high_threshold_crossing_date) : "no cruza en el horizonte"}.</p><p>Umbral crítico: {forecastSummary.critical_threshold_crossing_date ? formatDate(forecastSummary.critical_threshold_crossing_date) : "no cruza en el horizonte"}.</p></div>
                </div>
              ) : <EmptyState title="Predicción no disponible" message={forecastSummary?.message ?? "Carga más datos para habilitar la predicción."} />}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardTitle>Ranking predictivo por ubicación</CardTitle>
              <p className="mb-4 mt-1 text-sm text-slate-500">Ordena las plantas por riesgo proyectado, score predictivo y velocidad de crecimiento.</p>
              {predictiveRows.length ? <PredictionRankingPanel rows={predictiveRows} /> : <EmptyState title="Sin ranking predictivo" />}
            </Card>
            <Card>
              <CardTitle>Plano operativo de vigilancia</CardTitle>
              <p className="mt-1 text-sm leading-6 text-slate-600">Vista resumida para defensa: combina riesgo actual, predicción a 21 días y acciones preventivas. Para una versión con mapa geográfico real se puede integrar Leaflet si luego se cargan coordenadas reales.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {predictiveRows.slice(0, 4).map((row) => <div key={row.location_name} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{row.location_name}</p><Badge risk={row.forecast_risk_level} /></div><p className="mt-2 text-sm text-slate-600">{row.recommendation}</p></div>)}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="mb-4 flex items-center justify-between gap-3"><div><CardTitle>Ranking de riesgo por ubicacion</CardTitle><p className="mt-1 text-sm text-slate-500">Ordenado por score de riesgo, tendencia y alerta temprana.</p></div><ShieldCheck className="h-5 w-5 text-sentinel-600" /></div>
              <div className="mt-4">{riskRows.length ? <RiskTable rows={riskRows} /> : <EmptyState />}</div>
            </Card>
            <Card>
              <CardTitle>Ultimas mediciones</CardTitle>
              <div className="mt-4">{latest.length ? <LatestMeasurementsTable rows={latest} /> : <EmptyState />}</div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

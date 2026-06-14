import { useEffect, useMemo, useState } from "react";
import { getLocationAnalytics, getOverview, getRiskTable } from "../api/analyticsApi";
import { getApiErrorMessage } from "../api/client";
import { getLatestMeasurements, getLocations } from "../api/measurementsApi";
import { ViralLoadChart } from "../components/charts/ViralLoadChart";
import { EarlyWarningPanel } from "../components/dashboard/EarlyWarningPanel";
import { LatestMeasurementsTable } from "../components/dashboard/LatestMeasurementsTable";
import { LocationSelector } from "../components/dashboard/LocationSelector";
import { RiskTable } from "../components/dashboard/RiskTable";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { LocationAnalytics, Overview, RiskResult } from "../types/analytics";
import { LocationSummary, Measurement } from "../types/measurement";

export function DashboardPage() {
  const [overview, setOverview] = useState<Overview>();
  const [riskRows, setRiskRows] = useState<RiskResult[]>([]);
  const [latest, setLatest] = useState<Measurement[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [locationData, setLocationData] = useState<LocationAnalytics>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [overviewData, riskData, latestData, locationsData] = await Promise.all([getOverview(), getRiskTable(), getLatestMeasurements(), getLocations()]);
        setOverview(overviewData);
        setRiskRows(riskData);
        setLatest(latestData);
        setLocations(locationsData);
        setSelected(locationsData[0]?.location_name ?? riskData[0]?.location_name ?? "");
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    getLocationAnalytics(selected).then(setLocationData).catch((err) => setError(getApiErrorMessage(err)));
  }, [selected]);

  const currentRisk = useMemo(() => riskRows.find((row) => row.location_name === selected), [riskRows, selected]);

  return (
    <>
      <PageHeader title="Dashboard epidemiologico" description="Monitoreo temprano de carga viral en aguas residuales, tendencias de riesgo y senales anticipatorias frente a casos clinicos." />
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      {loading ? <LoadingState /> : (
        <div className="space-y-6">
          <SummaryCards overview={overview} />
          {!latest.length && !riskRows.length ? <EmptyState title="No hay mediciones" message="Carga datos demo desde Dataset para activar el dashboard." /> : null}
          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <Card>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Carga viral por ubicacion</CardTitle>
                {locations.length > 0 && <div className="w-full md:w-72"><LocationSelector locations={locations} value={selected} onChange={setSelected} /></div>}
              </div>
              {locationData?.series?.length ? <ViralLoadChart data={locationData.series} /> : <EmptyState message="Selecciona una ubicacion con datos para ver la serie temporal." />}
            </Card>
            <EarlyWarningPanel analytics={locationData} risk={currentRisk} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardTitle>Tabla de riesgo</CardTitle>
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

import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { LocationAnalytics, RiskResult } from "../../types/analytics";
import { formatPercentTrend } from "../../utils/formatters";
import { Card, CardTitle } from "../ui/Card";

export function EarlyWarningPanel({ analytics, risk }: { analytics?: LocationAnalytics; risk?: RiskResult }) {
  const warning = analytics?.early_warning ?? risk?.early_warning;
  const trend7 = risk?.trend_7d ?? analytics?.risk?.trend_7d;
  const trend14 = risk?.trend_14d ?? analytics?.risk?.trend_14d;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={warning ? "rounded-lg bg-red-50 p-2 text-red-600" : "rounded-lg bg-emerald-50 p-2 text-emerald-600"}>
          {warning ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div>
          <CardTitle>{warning ? "Alerta temprana activa" : "Sin alerta temprana critica"}</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {analytics?.explanation ?? risk?.explanation ?? "El panel compara senales de aguas residuales, tendencia reciente y casos clinicos para detectar anticipacion epidemiologica."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><TrendingUp className="h-3 w-3" /> 7d {formatPercentTrend(trend7)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><TrendingUp className="h-3 w-3" /> 14d {formatPercentTrend(trend14)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

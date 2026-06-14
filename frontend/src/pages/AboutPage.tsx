import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Card, CardTitle } from "../components/ui/Card";

export function AboutPage() {
  return (
    <>
      <PageHeader title="Acerca del proyecto" description="Wastewater Sentinel muestra como una plataforma cloud puede transformar mediciones ambientales en alertas tempranas y evidencia para toma de decisiones." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardTitle>Objetivo</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">Detectar incrementos de riesgo epidemiologico mediante analisis de aguas residuales, integrando datos de laboratorio, casos clinicos y simulaciones de sistemas dinamicos.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Dashboard de vigilancia", "Carga CSV y datos demo", "Modelos 1D y 2D", "Eventos no homogeneos", "Bifurcaciones", "Diagramas de fase", "Region segura", "Marco teorico"].map((item) => <div key={item} className="rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">{item}</div>)}
          </div>
        </Card>
        <Card>
          <CardTitle>Stack</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {["React", "Vite", "TypeScript", "Tailwind", "Axios", "Router", "Recharts", "Lucide", "FastAPI"].map((item) => <Badge key={item} tone="cyan">{item}</Badge>)}
          </div>
          <CardTitle>Integrantes</CardTitle>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Integrante 1 - Placeholder</li>
            <li>Integrante 2 - Placeholder</li>
            <li>Integrante 3 - Placeholder</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Temas aplicados de la materia</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">Ecuaciones diferenciales ordinarias, metodos de integracion numerica, analisis de estabilidad, autovalores, bifurcaciones, sistemas no autonomos, visualizacion de campos de fase y lectura de indicadores de riesgo.</p>
        </Card>
        <Card>
          <CardTitle>Fuentes de datos posibles</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">Laboratorios de aguas residuales, plantas de tratamiento, secretarias de salud, registros abiertos de casos clinicos, meteorologia local y sensores hidrologicos.</p>
        </Card>
      </div>
    </>
  );
}

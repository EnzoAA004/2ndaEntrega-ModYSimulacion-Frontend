import { PageHeader } from "../components/layout/PageHeader";

const sections = [
  { icon: "ti-droplet", color: "#0B7E8A", bg: "#E0F5F7", title: "¿Qué es vigilancia epidemiológica por aguas residuales?", body: "Es el monitoreo sistemático de biomarcadores presentes en efluentes cloacales. La concentración viral agregada permite estimar actividad infecciosa comunitaria sin depender solo de tests clínicos individuales." },
  { icon: "ti-virus", color: "#7C3AED", bg: "#EDE9FE", title: "¿Por qué puede anticipar brotes?", body: "Muchas personas eliminan material genético viral antes de consultar o ser diagnosticadas. Por eso la señal ambiental puede crecer días antes que los casos clínicos reportados." },
  { icon: "ti-chart-line", color: "#0891B2", bg: "#E0F2FE", title: "Modelo 1D de concentración viral", body: "dV/dt = S − kV − dV. La variable V representa carga viral, S la fuente de aporte, k el decaimiento y d la dilución o remoción hidráulica." },
  { icon: "ti-scale", color: "#059669", bg: "#D1FAE5", title: "Equilibrio y estabilidad", body: "El equilibrio es V* = S / (k+d). Si k+d es positivo, perturbaciones alrededor del equilibrio decaen y el sistema vuelve a una concentración estacionaria." },
  { icon: "ti-users", color: "#DC2626", bg: "#FEE2E2", title: "Modelo 2D infectados–carga viral", body: "dI/dt = βI(1 − I/K) − γI y dV/dt = αI − kV − dV. El primer término modela crecimiento epidemiológico saturado; el segundo vincula infectados con señal ambiental." },
  { icon: "ti-arrows-diagonal", color: "#D97706", bg: "#FEF3C7", title: "Diagramas de fase", body: "El plano I–V permite visualizar campos vectoriales, nulclinas y equilibrios. Es útil para entender trayectorias de brote y retorno a región segura." },
  { icon: "ti-git-branch", color: "#7C3AED", bg: "#EDE9FE", title: "Bifurcaciones", body: "El umbral β > γ separa regímenes: si la transmisión efectiva supera la recuperación, el equilibrio libre de brote pierde estabilidad y aparece un régimen con infectados persistentes." },
  { icon: "ti-cloud-rain", color: "#0891B2", bg: "#E0F2FE", title: "Sistemas no homogéneos", body: "Lluvias, shocks de brote, descargas localizadas o cambios de caudal introducen términos dependientes del tiempo. Estos eventos explican picos, diluciones o falsas caídas de señal." },
  { icon: "ti-shield-check", color: "#059669", bg: "#D1FAE5", title: "Región segura y Lyapunov", body: "Una función tipo V_risk(I,V) penaliza excesos sobre umbrales seguros. Si disminuye, el sistema se aproxima a una región aceptable; si aumenta, sugiere alerta operativa." },
  { icon: "ti-calendar-stats", color: "#0B7E8A", bg: "#E0F5F7", title: "Predicción aplicada", body: "La plataforma ajusta una tendencia log-lineal sobre la carga viral histórica y proyecta escenarios a 21 días. Permite anticipar cruces de umbral alto o crítico y comparar mitigación contra crecimiento alto." },
  { icon: "ti-adjustments-horizontal", color: "#DC2626", bg: "#FEE2E2", title: "Calibración desde datos", body: "A partir de mediciones históricas se estiman parámetros como β, γ, α, k, d, S, I₀ y V₀. Esos parámetros quedan listos para ejecutar modelos 1D y 2D con sentido empírico." },
  { icon: "ti-file-text", color: "#D97706", bg: "#FEF3C7", title: "Reporte ejecutivo", body: "El sistema genera un reporte imprimible con resumen, ranking predictivo, recomendaciones y relación con los temas de la materia. Puede guardarse como PDF desde el navegador." },
  { icon: "ti-atom", color: "#0B7E8A", bg: "#E0F5F7", title: "Relación con Modelado y Simulación", body: "El proyecto integra ecuaciones diferenciales, métodos numéricos, estabilidad local, bifurcaciones, sistemas no autónomos, predicción, visualización de datos y validación interpretativa aplicada." },
];

export function TheoryPage() {
  return (
    <>
      <PageHeader
        title="Marco teórico"
        description="Fundamentos científicos y matemáticos que justifican Wastewater Sentinel como aplicación de Modelado y Simulación."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(({ icon, color, bg, title, body }, index) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-md"
          >
            {/* Número de fondo decorativo */}
            <span
              className="pointer-events-none absolute -right-2 -top-4 select-none font-bold leading-none text-slate-100"
              style={{ fontSize: "7rem" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="relative flex items-start gap-4">
              {/* Ícono */}
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: bg }}
              >
                <i className={`ti ${icon} text-xl`} style={{ color }} />
              </div>

              <div className="min-w-0 flex-1">
                {/* Número pequeño encima */}
                <span className="mb-1 block text-xs font-semibold tracking-widest" style={{ color }}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="text-sm font-semibold leading-snug text-slate-800">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
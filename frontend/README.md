# Wastewater Sentinel Frontend

Frontend profesional para una plataforma cloud de vigilancia epidemiologica temprana mediante analisis de aguas residuales. La aplicacion visualiza mediciones, riesgo epidemiologico, simulaciones dinamicas, bifurcaciones, diagramas de fase, regiones seguras, predicciones y reportes ejecutivos.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Axios
- React Router DOM
- Recharts
- Lucide React

## Instalacion

```bash
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar si hace falta:

```env
VITE_API_URL=http://localhost:8000/api
```

En produccion debe apuntar al backend desplegado con el prefijo `/api`.

## Ejecucion

```bash
npm run dev
npm run build
```

## Paginas

- `/`: dashboard de vigilancia, alertas tempranas, prediccion, ranking predictivo y reporte.
- `/measurements`: mediciones paginadas y filtrables.
- `/dataset`: carga CSV, seed demo y resumen del dataset.
- `/simulations`: modelos 1D, 2D, eventos no homogeneos, escenarios, calibracion, bifurcacion, fase y Lyapunov.
- `/theory`: marco teorico para Modelado y Simulacion.
- `/about`: objetivo, stack, funcionalidades y contexto del proyecto.

## Funcionalidades disponibles

### Dashboard

- Resumen general de mediciones.
- Riesgo actual por ubicacion.
- Serie temporal con carga viral, media movil, casos clinicos y lluvia.
- Prediccion a 21 dias por ubicacion.
- Banda de incertidumbre.
- Escenario base, mitigacion y crecimiento alto.
- Ranking predictivo por ubicacion.
- Plano operativo resumido.
- Boton de reporte imprimible.
- Exportacion CSV.

### Dataset

- Carga de CSV.
- Carga de datos demo.
- Resumen de cantidad de mediciones, ubicaciones y valores virales.

### Simulaciones

- Modelo 1D de decaimiento viral.
- Modelo 2D infectados-carga viral.
- Eventos no homogeneos.
- Comparacion de escenarios.
- Calibracion desde datos historicos.
- Bifurcacion.
- Diagrama de fase.
- Region segura tipo Lyapunov.

### Marco teorico

Incluye explicaciones de vigilancia por aguas residuales, modelos 1D y 2D, estabilidad, bifurcaciones, sistemas no homogeneos, Lyapunov, prediccion, calibracion y reporte ejecutivo.

## Backend

El frontend consume un backend FastAPI bajo el prefijo configurado por `VITE_API_URL`. Por defecto espera:

```text
http://localhost:8000/api
```

Incluye estados de carga, vacio y errores amigables cuando el backend no responde o devuelve parametros invalidos.

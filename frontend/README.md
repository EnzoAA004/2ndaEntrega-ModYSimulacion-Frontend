# Wastewater Sentinel Frontend

Frontend profesional para una plataforma cloud de vigilancia epidemiologica temprana mediante analisis de aguas residuales. La aplicacion visualiza mediciones, riesgo epidemiologico, simulaciones dinamicas, bifurcaciones, diagramas de fase y regiones seguras.

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

## Ejecucion

```bash
npm run dev
npm run build
```

## Paginas

- `/`: dashboard de vigilancia, alertas tempranas y tabla de riesgo.
- `/measurements`: mediciones paginadas y filtrables.
- `/dataset`: carga CSV, seed demo y resumen del dataset.
- `/simulations`: modelos 1D, 2D, eventos no homogeneos, bifurcacion, fase y Lyapunov.
- `/theory`: marco teorico para Modelado y Simulacion.
- `/about`: objetivo, stack, funcionalidades y contexto del proyecto.

## Backend

El frontend consume un backend FastAPI bajo el prefijo configurado por `VITE_API_URL`. Por defecto espera:

```text
http://localhost:8000/api
```

Incluye estados de carga, vacio y errores amigables cuando el backend no responde o devuelve parametros invalidos.

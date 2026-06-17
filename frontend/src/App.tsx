import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AboutPage } from "./pages/AboutPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DatasetPage } from "./pages/DatasetPage";
import { MeasurementsPage } from "./pages/MeasurementsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SimulationsPage } from "./pages/SimulationsPage";
import { Simulation3DPage } from "./pages/Simulation3DPage";
import { TheoryPage } from "./pages/TheoryPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/measurements" element={<MeasurementsPage />} />
        <Route path="/dataset" element={<DatasetPage />} />
        <Route path="/simulations" element={<SimulationsPage />} />
        <Route path="/simulation-3d" element={<Simulation3DPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/theory" element={<TheoryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

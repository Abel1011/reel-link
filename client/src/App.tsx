import { Routes, Route, Navigate } from "react-router-dom";
import ProjectLayout from "./layouts/ProjectLayout";
import LandingPage from "./pages/LandingPage";
import AiModePage from "./pages/AiModePage";
import StylePage from "./pages/StylePage";
import CharactersPage from "./pages/CharactersPage";
import LocationsPage from "./pages/LocationsPage";
import ScriptPage from "./pages/ScriptPage";
import VideoPage from "./pages/VideoPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/project/:id/ai-generate" element={<AiModePage />} />
      <Route path="/project/:id" element={<ProjectLayout />}>
        <Route index element={<Navigate to="style" replace />} />
        <Route path="style" element={<StylePage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="script" element={<ScriptPage />} />
        <Route path="video" element={<VideoPage />} />
      </Route>
    </Routes>
  );
}

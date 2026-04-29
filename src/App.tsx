import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./state/ThemeContext";
import { StashProvider } from "./state/StashContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { HexTooltip } from "./components/HexTooltip";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { FamilyPage } from "./pages/FamilyPage";
import { SkinPage } from "./pages/SkinPage";
import { ExtractPage } from "./pages/ExtractPage";
import { StashesPage } from "./pages/StashesPage";

export default function App() {
  return (
    <ThemeProvider>
      <StashProvider>
        <BrowserRouter>
          <div className="h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark">
            <Header />
            <div className="flex-1 flex min-h-0">
              <main className="flex-1 overflow-y-auto scroll-thin flex flex-col">
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/family/:familyId" element={<FamilyPage />} />
                    <Route path="/skin" element={<SkinPage />} />
                    <Route path="/extract" element={<ExtractPage />} />
                    <Route path="/stashes" element={<StashesPage />} />
                    <Route path="/bibles" element={<Navigate to="/stashes" replace />} />
                  </Routes>
                </div>
                <Footer />
              </main>
              <Sidebar />
            </div>
            <Toast />
            <HexTooltip />
          </div>
        </BrowserRouter>
      </StashProvider>
    </ThemeProvider>
  );
}

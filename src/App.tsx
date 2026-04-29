import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./state/ThemeContext";
import { BibleProvider } from "./state/BibleContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { HomePage } from "./pages/HomePage";
import { FamilyPage } from "./pages/FamilyPage";
import { SkinPage } from "./pages/SkinPage";
import { ExtractPage } from "./pages/ExtractPage";
import { BiblesPage } from "./pages/BiblesPage";

export default function App() {
  return (
    <ThemeProvider>
      <BibleProvider>
        <BrowserRouter>
          <div className="h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark">
            <Header />
            <div className="flex-1 flex min-h-0">
              <main className="flex-1 overflow-y-auto scroll-thin">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/family/:familyId" element={<FamilyPage />} />
                  <Route path="/skin" element={<SkinPage />} />
                  <Route path="/extract" element={<ExtractPage />} />
                  <Route path="/bibles" element={<BiblesPage />} />
                </Routes>
              </main>
              <Sidebar />
            </div>
            <Toast />
          </div>
        </BrowserRouter>
      </BibleProvider>
    </ThemeProvider>
  );
}

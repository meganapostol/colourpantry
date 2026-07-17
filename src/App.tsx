import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./state/ThemeContext";
import { StashProvider } from "./state/StashContext";
import { CVDProvider, useCVD } from "./state/CVDContext";
import { CVDFilter } from "./components/CVDFilter";
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
import { GeneratePage } from "./pages/GeneratePage";
import { VariationsPage } from "./pages/VariationsPage";
import { ContrastPage } from "./pages/ContrastPage";
import { VisualizePage } from "./pages/VisualizePage";
import { CollagePage } from "./pages/CollagePage";
import { GradientsPage } from "./pages/GradientsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LookupPage } from "./pages/LookupPage";
import { GlazePage } from "./pages/GlazePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { AdminFeedbackPage } from "./pages/AdminFeedbackPage";
import { BlogPage } from "./pages/BlogPage";
import { BlogPostPage } from "./pages/BlogPostPage";

function CVDFilteredContent() {
  const { mode } = useCVD();
  const filterStyle =
    mode === "none"
      ? undefined
      : { filter: `url(#cvd-${mode})`, WebkitFilter: `url(#cvd-${mode})` };

  return (
    <div className="flex-1 flex min-h-0" style={filterStyle}>
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/family/:familyId" element={<FamilyPage />} />
            <Route path="/skin" element={<SkinPage />} />
            <Route path="/extract" element={<ExtractPage />} />
            <Route path="/stashes" element={<StashesPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/variations" element={<VariationsPage />} />
            <Route path="/contrast" element={<ContrastPage />} />
            <Route path="/visualize" element={<VisualizePage />} />
            <Route path="/collage" element={<CollagePage />} />
            <Route path="/gradients" element={<GradientsPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/lookup" element={<LookupPage />} />
            <Route path="/glaze" element={<GlazePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/bibles" element={<Navigate to="/stashes" replace />} />
          </Routes>
        </div>
        <Footer />
      </main>
      <Sidebar />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    window.__cpBootSettle?.("app");
  }, []);

  return (
    <ThemeProvider>
      <CVDProvider>
        <StashProvider>
          <BrowserRouter>
            <CVDFilter />
            <div className="h-screen flex flex-col bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark">
              <Header />
              <CVDFilteredContent />
              <Toast />
              <HexTooltip />
            </div>
          </BrowserRouter>
        </StashProvider>
      </CVDProvider>
    </ThemeProvider>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import BrandPage from "./pages/BrandPage";
import PressPage from "./pages/PressPage";
import VsPage from "./pages/VsPage";
import SeoDynamicPage from "./pages/SeoDynamicPage";
import { PoweredByBadge } from "./components/PoweredByBadge";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Core app routes */}
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />

            {/* Static SEO pages */}
            <Route path="/brand" element={<BrandPage />} />
            <Route path="/press" element={<PressPage />} />

            {/* Comparison pages: /vs/snapdrop */}
            <Route path="/vs/:competitor" element={<VsPage />} />

            {/* Programmatic SEO catch-all:
                - /snapdrop-alternative
                - /share-pdf-files
                - /share-files-between-windows-and-macos
                - /best-file-sharing-for-developers
                Falls through to NotFound for unknown slugs.
            */}
            <Route path="/:slug" element={<SeoDynamicPage />} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PoweredByBadge />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

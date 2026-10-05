import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// The share tool loads eagerly; everything else is split into its own chunk.
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BrandPage = lazy(() => import("./pages/BrandPage"));
const PressPage = lazy(() => import("./pages/PressPage"));
const VsPage = lazy(() => import("./pages/VsPage"));
const SeoDynamicPage = lazy(() => import("./pages/SeoDynamicPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
import { PoweredByBadge } from "./components/PoweredByBadge";
import { InstallPrompt } from "./components/InstallPrompt";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            {/* Core app routes */}
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />

            {/* Static SEO pages */}
            <Route path="/brand" element={<BrandPage />} />
            <Route path="/press" element={<PressPage />} />
            <Route path="/about" element={<InfoPage />} />
            <Route path="/privacy" element={<InfoPage />} />
            <Route path="/terms" element={<InfoPage />} />
            <Route path="/contact" element={<InfoPage />} />

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
          </Suspense>
          <PoweredByBadge />
          <InstallPrompt />

        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

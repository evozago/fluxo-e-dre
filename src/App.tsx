import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthPage } from "@/components/auth/AuthPage";
import { setupGlobalErrorHandling, trackPageLoad, logger } from "@/lib/logger";
import { useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  useEffect(() => {
    // Configurar logging global
    setupGlobalErrorHandling();
    trackPageLoad();
    
    // Log de inicialização da aplicação
    logger.info('Application started', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    return () => {
      logger.info('Application unmounted');
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <AuthGuard requireAuth={false}>
              <Index />
            </AuthGuard>
          } 
        />
        <Route 
          path="/auth" 
          element={
            <AuthGuard requireAuth={false}>
              <AuthPage />
            </AuthGuard>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <AuthGuard requireAuth={true}>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </AuthGuard>
          } 
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

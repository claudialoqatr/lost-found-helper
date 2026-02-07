import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import QRScanRouter from "./pages/QRScanRouter";
import ClaimTagPage from "./pages/ClaimTagPage";
import EditTagPage from "./pages/EditTagPage";
import FinderPage from "./pages/FinderPage";
import MyTagsPage from "./pages/MyTagsPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import BatchesPage from "./pages/admin/BatchesPage";
import BatchDetailPage from "./pages/admin/BatchDetailPage";
import RetailersPage from "./pages/admin/RetailersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/qr-codes/:code" element={<QRScanRouter />} />
              <Route path="/tag/:code" element={<ClaimTagPage />} />
              <Route path="/found/:code" element={<FinderPage />} />
              <Route path="/my-tags" element={<MyTagsPage />} />
              <Route path="/my-tags/:code" element={<EditTagPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Admin Routes */}
              <Route path="/admin/batches" element={<BatchesPage />} />
              <Route path="/admin/batches/:batchId" element={<BatchDetailPage />} />
              <Route path="/admin/retailers" element={<RetailersPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

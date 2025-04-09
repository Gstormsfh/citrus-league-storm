
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Roster from "./pages/Roster";
import Standings from "./pages/Standings";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Podcasts from "./pages/Podcasts";
import Guides from "./pages/Guides";
import Matchup from "./pages/Matchup";
import FreeAgents from "./pages/FreeAgents";
import GMOffice from "./pages/GMOffice";
import TeamSettings from "./pages/TeamSettings";
import News from "./pages/News";
import "./App.css";

// Configure with a higher stale time to prevent unnecessary refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" closeButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/matchup" element={<Matchup />} />
          <Route path="/free-agents" element={<FreeAgents />} />
          <Route path="/gm-office" element={<GMOffice />} />
          <Route path="/team-settings" element={<TeamSettings />} />
          <Route path="/news" element={<News />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

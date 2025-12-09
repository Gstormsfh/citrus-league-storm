import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LeagueProvider } from "@/contexts/LeagueContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StormyChatBubble } from "./components/StormyChatBubble";
import "./App.css";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Roster = lazy(() => import("./pages/Roster"));
const Standings = lazy(() => import("./pages/Standings"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const Podcasts = lazy(() => import("./pages/Podcasts"));
const Guides = lazy(() => import("./pages/Guides"));
const Matchup = lazy(() => import("./pages/Matchup"));
const FreeAgents = lazy(() => import("./pages/FreeAgents"));
const GMOffice = lazy(() => import("./pages/GMOffice"));
const StormyAssistant = lazy(() => import("./pages/StormyAssistant"));
const News = lazy(() => import("./pages/News"));
const DraftRoom = lazy(() => import("./pages/DraftRoom"));
const Profile = lazy(() => import("./pages/Profile"));
const TeamAnalytics = lazy(() => import("./pages/TeamAnalytics"));
const WaiverWire = lazy(() => import("./pages/WaiverWire"));
const ScheduleManager = lazy(() => import("./pages/ScheduleManager"));
const TradeAnalyzer = lazy(() => import("./pages/TradeAnalyzer"));
const OtherTeam = lazy(() => import("./pages/OtherTeam"));
const CreateLeague = lazy(() => import("./pages/CreateLeague"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const LeagueDashboard = lazy(() => import("./pages/LeagueDashboard"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" closeButton />
        <BrowserRouter>
          <LeagueProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/roster" element={<Roster />} />
                <Route path="/standings" element={<Standings />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/podcasts" element={<Podcasts />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/matchup" element={<Matchup />} />
                <Route path="/free-agents" element={<FreeAgents />} />
                <Route path="/gm-office" element={<GMOffice />} />
                <Route path="/gm-office/stormy" element={<StormyAssistant />} />
                <Route path="/news" element={<News />} />
                <Route path="/draft-room" element={<ErrorBoundary><DraftRoom /></ErrorBoundary>} />
                <Route path="/draft" element={<ErrorBoundary><DraftRoom /></ErrorBoundary>} /> {/* Fallback route */}
                <Route path="/create-league" element={<ProtectedRoute requireProfile><CreateLeague /></ProtectedRoute>} />
                <Route path="/league/:leagueId" element={<ProtectedRoute><LeagueDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/team-analytics" element={<TeamAnalytics />} />
                <Route path="/waiver-wire" element={<WaiverWire />} />
                <Route path="/schedule-manager" element={<ScheduleManager />} />
                <Route path="/trade-analyzer" element={<TradeAnalyzer />} />
                <Route path="/team/:teamId" element={<OtherTeam />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <StormyChatBubble />
          </LeagueProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

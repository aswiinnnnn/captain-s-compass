import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import FleetOverview from "./pages/FleetOverview";
import BiddingDetail from "./pages/BiddingDetail";
import RiskAnalysis from "./pages/RiskAnalysis";
import VoyagePlanner from "./pages/VoyagePlanner";
import PortIntelligence from "./pages/PortIntelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ChatProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/fleet" element={<FleetOverview />} />
            <Route path="/dashboard" element={<Navigate to="/fleet" replace />} />
            <Route path="/bidding/:id" element={<BiddingDetail />} />
            <Route path="/risk/:id" element={<RiskAnalysis />} />
            <Route path="/voyage-planner" element={<VoyagePlanner />} />
            <Route path="/port-intelligence" element={<PortIntelligence />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

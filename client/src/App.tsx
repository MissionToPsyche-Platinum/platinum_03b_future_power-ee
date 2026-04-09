import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter"; 
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Simulator from "./pages/Simulator";
import Comparison from "./pages/Comparison";
import Optimization from "./pages/Optimization";
import MissionTimeline from "./pages/MissionTimeline";
import Sizing from "./pages/Sizing";
import CostBenefit from "./pages/CostBenefit";
import CompareScenarios from "./pages/CompareScenarios";
import Help from "./pages/Help";
import AccuracyComparison from "./pages/AccuracyComparison";
import QuickStartGuide from "./pages/QuickStartGuide";

function AppRoutes() { 
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/simulator"} component={Simulator} />
      <Route path={"/comparison"} component={Comparison} />
      <Route path={"/optimization"} component={Optimization} />
      <Route path={"/timeline"} component={MissionTimeline} />
      <Route path={"/sizing"} component={Sizing} />
      <Route path={"/cost-benefit"} component={CostBenefit} />
      <Route path={"/compare"} component={CompareScenarios} />
      <Route path={"/help"} component={Help} />
      <Route path={"/accuracy"} component={AccuracyComparison} />
      <Route path={"/quick-start-guide"} component={QuickStartGuide} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // (This will equal "/platinum_03b_future_power-ee/")
  const base = import.meta.env.BASE_URL;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <WouterRouter base={base}>
             <AppRoutes />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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

function Router() {
  // make sure to consider if you need authentication for certain routes
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

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

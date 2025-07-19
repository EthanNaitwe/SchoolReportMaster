import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavigationHeader from "@/components/navigation-header";
import Dashboard from "@/pages/dashboard";
import Uploads from "@/pages/uploads";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-academic-bg">
      <NavigationHeader />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/uploads" component={Uploads} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

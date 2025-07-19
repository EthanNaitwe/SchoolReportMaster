import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NavigationHeader from "@/components/navigation-header";
import Dashboard from "@/pages/dashboard";
import Uploads from "@/pages/uploads";
import Reports from "@/pages/reports";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-academic-bg">
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/">
          <NavigationHeader />
          <main>
            <ProtectedRoute path="/" component={Dashboard} />
          </main>
        </Route>
        <Route path="/uploads">
          <NavigationHeader />
          <main>
            <ProtectedRoute path="/uploads" component={Uploads} />
          </main>
        </Route>
        <Route path="/reports">
          <NavigationHeader />
          <main>
            <ProtectedRoute path="/reports" component={Reports} />
          </main>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

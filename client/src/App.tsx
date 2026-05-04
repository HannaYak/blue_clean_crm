import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./pages/AdminDashboard";
import CleanerDashboard from "./pages/CleanerDashboard";
import LoginPage from "./pages/LoginPage";

function Router() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <LoginPage />;
  }
  
  return (
    <Switch>
      {user.role === 'admin' && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin/*" component={AdminDashboard} />
        </>
      )}
      {user.role === 'cleaner' && (
        <>
          <Route path="/" component={CleanerDashboard} />
          <Route path="/cleaner/*" component={CleanerDashboard} />
        </>
      )}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

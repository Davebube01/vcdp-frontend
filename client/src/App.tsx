import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import ResponseForm from "@/pages/form";
import Responses from "@/pages/responses";
import { InsightProvider } from "@/lib/store";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/form" component={ResponseForm} />
        <Route path="/responses" component={Responses} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InsightProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </InsightProvider>
    </QueryClientProvider>
  );
}

export default App;

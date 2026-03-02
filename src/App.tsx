import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import NewRecord from "@/pages/records/new";
import Records from "@/pages/records/index";
import RecordDetails from "@/pages/records/details";
import Documents from "@/pages/documents";
import Users from "@/pages/users";
import { InsightProvider } from "@/lib/store";
import { AuthProvider } from "./core/providers/AuthProvider";

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/records" element={<Records />} />
              <Route path="/records/new" element={<NewRecord />} />
              <Route path="/records/:id" element={<RecordDetails />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/users" element={<Users />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <InsightProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </InsightProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

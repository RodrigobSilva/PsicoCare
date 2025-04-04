import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Pacientes from "@/pages/pacientes";
import Psicologos from "@/pages/psicologos";
import Agenda from "@/pages/agenda";
import Salas from "@/pages/salas";
import Financeiro from "@/pages/financeiro";
import PlanosSaude from "@/pages/planos-saude";
import Relatorios from "@/pages/relatorios";
import Configuracoes from "@/pages/configuracoes";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { user } = useAuth();
  const isAdmin = user?.tipo === "admin";
  const isPsicologo = user?.tipo === "psicologo";
  const isSecretaria = user?.tipo === "secretaria";
  const isPaciente = user?.tipo === "paciente";

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      
      <ProtectedRoute 
        path="/pacientes"
        component={Pacientes} 
        allowedRoles={["admin", "secretaria", "psicologo"]}
      />
      
      <ProtectedRoute 
        path="/psicologos" 
        component={Psicologos}
        allowedRoles={["admin", "secretaria"]}
      />
      
      <ProtectedRoute path="/agenda" component={Agenda} />
      
      <ProtectedRoute 
        path="/salas" 
        component={Salas}
        allowedRoles={["admin", "secretaria"]}
      />
      
      <ProtectedRoute 
        path="/financeiro" 
        component={Financeiro}
        allowedRoles={["admin", "secretaria"]}
      />
      
      <ProtectedRoute 
        path="/planos-saude" 
        component={PlanosSaude}
        allowedRoles={["admin", "secretaria"]}
      />
      
      <ProtectedRoute 
        path="/relatorios" 
        component={Relatorios}
        allowedRoles={["admin", "secretaria"]}
      />
      
      <ProtectedRoute 
        path="/configuracoes" 
        component={Configuracoes}
        allowedRoles={["admin"]}
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

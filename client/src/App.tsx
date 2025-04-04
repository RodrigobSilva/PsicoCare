import { Switch, Route } from "wouter";
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
import { AuthProvider, useAuth } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pacientes" component={Pacientes} />
      <Route path="/psicologos" component={Psicologos} />
      <Route path="/agenda" component={Agenda} />
      <Route path="/salas" component={Salas} />
      <Route path="/financeiro" component={Financeiro} />
      <Route path="/planos-saude" component={PlanosSaude} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;

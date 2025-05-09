import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import CustomRouter from "@/components/layout/custom-router";
import ErrorBoundary from "@/pages/error-boundary";
import Dashboard from "@/pages/dashboard";
import Pacientes from "@/pages/pacientes";
import Psicologos from "@/pages/psicologos";
import Agenda from "@/pages/agenda";
import Salas from "@/pages/salas";
import Financeiro from "@/pages/financeiro";
import PlanosSaude from "@/pages/planos-saude";
import Relatorios from "@/pages/relatorios";
import Configuracoes from "@/pages/configuracoes";
import ConfiguracoesAvancadas from "@/pages/configuracoes-avancadas";
import Teleconsulta from "@/pages/teleconsulta";
import Perfil from "@/pages/perfil";
import AIAssistant from "@/pages/ai-assistant";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { OnboardingProvider } from "./hooks/use-onboarding";
import PsicologoForm from "@/components/psicologos/psicologo-form"; // Fixed import path


function Router() {
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
      <ProtectedRoute 
        path="/psicologos/novo" 
        component={() => {
          const [, setLocation] = useLocation();
          return <PsicologoForm onSuccess={() => setLocation('/psicologos')} />;
        }}
        allowedRoles={["admin", "secretaria"]}
      />
      <ProtectedRoute 
        path="/psicologos/:id/editar" 
        component={({ match }) => (
          <PsicologoForm 
            psicologoId={match.params.id} 
            onSuccess={() => {
              const [, setLocation] = useLocation();
              setLocation('/psicologos');
            }} 
          />
        )}
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

      <ProtectedRoute 
        path="/configuracoes-avancadas" 
        component={ConfiguracoesAvancadas}
        allowedRoles={["admin"]}
      />

      <ProtectedRoute
        path="/teleconsulta/:id"
        component={Teleconsulta}
      />

      <ProtectedRoute
        path="/perfil"
        component={Perfil}
      />

      <ProtectedRoute
        path="/assistente-ia"
        component={AIAssistant}
        allowedRoles={["admin", "secretaria", "psicologo"]}
      />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <ErrorBoundary>
          <CustomRouter>
            <Router />
            <Toaster />
          </CustomRouter>
        </ErrorBoundary>
      </OnboardingProvider>
    </AuthProvider>
  );
}

export default App;
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  allowedRoles?: string[];
};

export function ProtectedRoute({ path, component: Component, allowedRoles }: ProtectedRouteProps) {
  return (
    <Route path={path}>
      {() => {
        try {
          const { user, isLoading } = useAuth();

          if (isLoading) {
            return (
              <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            );
          }

          if (!user) {
            return <Redirect to="/auth" />;
          }

          // Verificar permissões de acesso baseado no tipo de usuário
          if (allowedRoles && !allowedRoles.includes(user.tipo)) {
            return (
              <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
                <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
              </div>
            );
          }

          return <Component />;
        } catch (error) {
          console.error("Erro no ProtectedRoute:", error);
          return <Redirect to="/auth" />;
        }
      }}
    </Route>
  );
}

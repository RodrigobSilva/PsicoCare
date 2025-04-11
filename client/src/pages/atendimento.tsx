import { useParams } from "wouter";
import { useEffect } from "react";
import Layout from "@/components/layout/layout";
import AtendimentoForm from "@/components/atendimento/atendimento-form";
import ProximasSessoes from "@/components/atendimento/proximas-sessoes";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Atendimento() {
  const { user } = useAuth();
  const isAdminOrPsicologo = user?.tipo === 'admin' || user?.tipo === 'psicologo';
  const params = useParams<{ id: string }>();
  const agendamentoId = params?.id ? parseInt(params.id) : undefined;

  // Buscar informações do psicólogo
  const { data: psicologoAtual, isLoading: isLoadingPsicologo } = useQuery({
    queryKey: ['/api/psicologos/usuario', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.tipo !== 'psicologo') return null;
      
      try {
        const res = await apiRequest("GET", `/api/psicologos/usuario/${user.id}`);
        // Verificar se a resposta é JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("A resposta não é um JSON válido");
          throw new Error('Erro ao buscar psicólogo atual: resposta não é JSON');
        }
        
        const data = await res.json();
        console.log("Informações do psicólogo carregadas:", data);
        return data;
      } catch (error) {
        console.error("Erro ao buscar psicólogo:", error);
        throw error;
      }
    },
    enabled: !!user?.id && user?.tipo === 'psicologo'
  });

  // Verificar permissão do usuário
  useEffect(() => {
    if (user && !isAdminOrPsicologo) {
      // Redirecionar se não for admin ou psicólogo
      window.location.href = '/dashboard';
    }
  }, [user, isAdminOrPsicologo]);

  if (!isAdminOrPsicologo) {
    return (
      <Layout>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Esta funcionalidade está disponível apenas para administradores e psicólogos.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AtendimentoForm agendamentoId={agendamentoId} />
          </div>
          <div className="lg:col-span-1">
            {user?.tipo === 'psicologo' && (
              isLoadingPsicologo ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Próximas Sessões</CardTitle>
                    <CardDescription>Carregando...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center p-4">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : psicologoAtual ? (
                <ProximasSessoes psicologoId={psicologoAtual.id} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Próximas Sessões</CardTitle>
                    <CardDescription>Erro ao carregar dados do psicólogo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">Não foi possível carregar os dados do psicólogo.</p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
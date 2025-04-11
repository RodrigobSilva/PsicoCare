import { useParams } from "wouter";
import { useEffect } from "react";
import Layout from "@/components/layout/layout";
import AtendimentoForm from "@/components/atendimento/atendimento-form";
import ProximasSessoes from "@/components/atendimento/proximas-sessoes";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function Atendimento() {
  const { user } = useAuth();
  const isAdminOrPsicologo = user?.tipo === 'admin' || user?.tipo === 'psicologo';
  const params = useParams<{ id: string }>();
  const agendamentoId = params?.id ? parseInt(params.id) : undefined;

  // Buscar informações do psicólogo
  const { data: psicologoAtual } = useQuery({
    queryKey: ['/api/psicologos/usuario', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.tipo !== 'psicologo') return null;
      const res = await fetch(`/api/psicologos/usuario/${user.id}`);
      if (!res.ok) throw new Error('Erro ao buscar psicólogo atual');
      return res.json();
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
            {user?.tipo === 'psicologo' && psicologoAtual && (
              <ProximasSessoes psicologoId={psicologoAtual.id} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
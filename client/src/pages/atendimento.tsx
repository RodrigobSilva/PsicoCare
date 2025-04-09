import { useParams } from "wouter";
import { useEffect } from "react";
import Layout from "@/components/layout/layout";
import AtendimentoForm from "@/components/atendimento/atendimento-form";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Atendimento() {
  const { user } = useAuth();
  const isAdminOrPsicologo = user?.tipo === 'admin' || user?.tipo === 'psicologo';
  const params = useParams<{ id: string }>();
  const agendamentoId = params?.id ? parseInt(params.id) : undefined;

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
        <AtendimentoForm agendamentoId={agendamentoId} />
      </div>
    </Layout>
  );
}
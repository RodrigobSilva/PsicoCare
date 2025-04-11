import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/layout";
import AtendimentoForm from "@/components/atendimento/atendimento-form";
import ProximasSessoes from "@/components/atendimento/proximas-sessoes";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, AlertCircle, Video } from "lucide-react";

export default function Atendimento() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdminOrPsicologo = user?.tipo === 'admin' || user?.tipo === 'psicologo';
  const params = useParams<{ id: string }>();
  const agendamentoId = params?.id ? parseInt(params.id) : undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar informações do psicólogo
  const { data: psicologoAtual, isLoading: isLoadingPsicologo } = useQuery({
    queryKey: ['/api/psicologos/usuario', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.tipo !== 'psicologo') return null;
      
      try {
        const res = await apiRequest("GET", `/api/psicologos/usuario/${user.id}`);
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
  
  // Buscar detalhes do agendamento
  const { data: agendamento, isLoading: isLoadingAgendamento } = useQuery({
    queryKey: ['/api/agendamentos', agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return null;
      
      try {
        const res = await apiRequest("GET", `/api/agendamentos/${agendamentoId}`);
        const data = await res.json();
        console.log("Detalhes do agendamento:", data);
        return data;
      } catch (error) {
        console.error("Erro ao buscar detalhes do agendamento:", error);
        throw error;
      }
    },
    enabled: !!agendamentoId
  });
  
  // Criar atendimento se necessário ao carregar a página
  const { data: atendimento } = useQuery({
    queryKey: ['createAtendimento', agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return null;
      if (!user || !isAdminOrPsicologo) return null;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Verificar se já existe um atendimento para este agendamento
        console.log("Verificando atendimento existente para agendamento:", agendamentoId);
        const verificacaoRes = await apiRequest("GET", `/api/atendimentos/agendamento/${agendamentoId}`);
        const atendimentosExistentes = await verificacaoRes.json();
        
        if (atendimentosExistentes && atendimentosExistentes.length > 0) {
          console.log("Atendimento já existente:", atendimentosExistentes);
          setIsLoading(false);
          return atendimentosExistentes[0];
        }
        
        // Se não existe atendimento, criar um novo
        console.log("Nenhum atendimento existente, criando novo...");
        const dataAtual = new Date();
        
        // Dados para criar o atendimento
        const dadosAtendimento = {
          agendamentoId: agendamentoId,
          dataAtendimento: dataAtual,
          status: "em_andamento"
        };
        
        const criacaoRes = await apiRequest("POST", "/api/atendimentos", dadosAtendimento);
        const novoAtendimento = await criacaoRes.json();
        console.log("Novo atendimento criado:", novoAtendimento);
        
        setIsLoading(false);
        return novoAtendimento;
      } catch (error) {
        console.error("Erro ao processar atendimento:", error);
        setError("Ocorreu um erro ao iniciar o atendimento. Por favor, tente novamente.");
        setIsLoading(false);
        return null;
      }
    },
    enabled: !!agendamentoId && !!user && isAdminOrPsicologo
  });

  // Verificar permissão do usuário
  useEffect(() => {
    if (user && !isAdminOrPsicologo) {
      // Redirecionar se não for admin ou psicólogo
      navigate('/dashboard');
    }
  }, [user, isAdminOrPsicologo, navigate]);

  // Redirecionar para teleconsulta se for um atendimento remoto
  useEffect(() => {
    if (agendamento && agendamento.remoto) {
      console.log("Este agendamento é uma teleconsulta. Redirecionando...");
      navigate(`/teleconsulta/${agendamentoId}`);
    }
  }, [agendamento, agendamentoId, navigate]);

  const iniciarTeleconsulta = () => {
    if (agendamentoId) {
      navigate(`/teleconsulta/${agendamentoId}`);
    }
  };

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

  // Exibir mensagem de carregamento
  if (isLoading || isLoadingAgendamento) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Exibir mensagem de erro
  if (error) {
    return (
      <Layout>
        <div className="container py-6">
          <Card className="border-red-300">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                Erro ao Iniciar Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">{error}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/atendimentos')}>
                  Voltar para Atendimentos
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Verificar se é uma teleconsulta
  if (agendamento && agendamento.remoto) {
    return (
      <Layout>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Teleconsulta</CardTitle>
              <CardDescription>
                Este agendamento foi marcado como uma teleconsulta remota
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center p-6 bg-primary/5 rounded-lg mb-6">
                <Video className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">Iniciar Sessão de Teleconsulta</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Você pode iniciar a teleconsulta imediatamente clicando no botão abaixo.
                  Certifique-se de que sua câmera e microfone estão funcionando adequadamente.
                </p>
                <Button className="gap-2" size="lg" onClick={iniciarTeleconsulta}>
                  <Video className="h-4 w-4" />
                  Iniciar Teleconsulta
                </Button>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/atendimentos')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Atendimentos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Página normal de atendimento presencial
  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Atendimento</h1>
          <Button variant="outline" onClick={() => navigate('/atendimentos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Atendimentos
          </Button>
        </div>
        
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
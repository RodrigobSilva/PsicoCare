import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import VideoCallInterface from "@/components/teleconsulta/VideoCallInterface";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  VideoIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  Building2Icon
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TeleconsultaPage() {
  const [isPreparandoConsulta, setIsPreparandoConsulta] = useState(false);
  const [isConsultaIniciada, setIsConsultaIniciada] = useState(false);
  const { id: agendamentoId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Buscar detalhes do agendamento
  const { data: agendamento, isLoading, error } = useQuery({
    queryKey: ["/api/agendamentos", agendamentoId],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/agendamentos/${agendamentoId}`);
        return res.json();
      } catch (err) {
        console.error("Erro ao carregar agendamento:", err);
        throw new Error("Não foi possível carregar os detalhes da consulta");
      }
    },
    enabled: !!agendamentoId,
  });

  // Formatar data e hora
  const formatarData = (dataString?: string) => {
    if (!dataString) return "Data não disponível";
    try {
      return format(new Date(dataString), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };

  const formatarHora = (horaString?: string) => {
    if (!horaString) return "";
    return horaString.substring(0, 5);
  };

  // Iniciar a teleconsulta
  const iniciarConsulta = async () => {
    try {
      setIsPreparandoConsulta(true);
      
      // Aqui seria feita uma chamada à API para registrar o início da teleconsulta
      await apiRequest("POST", `/api/teleconsultas/iniciar`, {
        agendamentoId,
        iniciadoPor: user?.id,
        dataHoraInicio: new Date().toISOString(),
      });
      
      // Aguardar um tempo para simular a preparação da chamada
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsPreparandoConsulta(false);
      setIsConsultaIniciada(true);
    } catch (error) {
      console.error("Erro ao iniciar consulta:", error);
      setIsPreparandoConsulta(false);
    }
  };

  // Encerrar a teleconsulta e retornar à agenda
  const encerrarConsulta = () => {
    navigate("/agenda");
  };

  // Verificar se o usuário tem permissão para acessar a página
  const verificarPermissao = () => {
    if (!user || !agendamento) return false;
    
    const isPsicologo = user.tipo === "psicologo" && agendamento.psicologoId === user.id;
    const isPaciente = user.tipo === "paciente" && agendamento.pacienteId === user.id;
    const isAdmin = user.tipo === "admin";
    
    return isPsicologo || isPaciente || isAdmin;
  };

  // Se estiver carregando, mostrar spinner
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  // Se houver erro ou não tiver permissão, mostrar mensagem
  if (error || !verificarPermissao()) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="bg-destructive/10 p-4 rounded-full mb-4">
                <VideoIcon className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Acesso não permitido</h2>
              <p className="text-neutral-500 text-center mb-4">
                {error
                  ? "Ocorreu um erro ao carregar os detalhes da consulta."
                  : "Você não tem permissão para acessar esta teleconsulta."}
              </p>
              <Button onClick={() => navigate("/agenda")}>Voltar para a Agenda</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Se a videochamada foi iniciada, exibir a interface
  if (isConsultaIniciada) {
    return (
      <Layout fullWidth>
        <div className="container mx-auto p-4">
          <VideoCallInterface
            sessionId={agendamentoId}
            pacienteId={agendamento?.pacienteId}
            psicologoId={agendamento?.psicologoId}
            onEndCall={encerrarConsulta}
            isHost={user?.tipo === "psicologo" || user?.tipo === "admin"}
          />
        </div>
      </Layout>
    );
  }

  // Tela de preparação para a consulta
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <VideoIcon className="mr-2 h-5 w-5 text-primary" />
              Teleconsulta
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Informações da Consulta</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Data</p>
                      <p>{formatarData(agendamento?.data)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ClockIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Horário</p>
                      <p>{formatarHora(agendamento?.horaInicio)} - {formatarHora(agendamento?.horaFim)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <UserIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-500">
                        {user?.tipo === "psicologo" ? "Paciente" : "Psicólogo"}
                      </p>
                      <p>
                        {user?.tipo === "psicologo" 
                          ? agendamento?.paciente?.usuario?.nome
                          : agendamento?.psicologo?.usuario?.nome}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Building2Icon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-500">Tipo de Atendimento</p>
                      <p>{agendamento?.tipoAtendimento || "Teleconsulta"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-blue-700 font-medium mb-2">Dicas para uma boa teleconsulta</h3>
                <ul className="text-sm text-blue-600 space-y-1 list-disc pl-4">
                  <li>Verifique se sua câmera e microfone estão funcionando corretamente</li>
                  <li>Escolha um local silencioso e bem iluminado</li>
                  <li>Tenha uma conexão de internet estável</li>
                  <li>Evite distrações e interrupções durante a sessão</li>
                  <li>Utilize fones de ouvido para melhorar a qualidade do áudio</li>
                </ul>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => navigate("/agenda")}>
              Voltar para Agenda
            </Button>
            
            <Button 
              onClick={iniciarConsulta} 
              disabled={isPreparandoConsulta}
              className="gap-2"
            >
              {isPreparandoConsulta ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Preparando...
                </>
              ) : (
                <>
                  <VideoIcon className="h-4 w-4" />
                  Iniciar Teleconsulta
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
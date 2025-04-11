import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User, Video, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface ProximasSessoesProps {
  psicologoId?: number;
  onSelectAgendamento?: (agendamentoId: number) => void;
}

export default function ProximasSessoes({ psicologoId, onSelectAgendamento }: ProximasSessoesProps) {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar o ID do psicólogo associado ao usuário atual (se for psicólogo)
  const { data: psicologoUsuario } = useQuery({
    queryKey: ['/api/psicologos/usuario', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.tipo !== 'psicologo') return null;
      try {
        const res = await apiRequest("GET", `/api/psicologos/usuario/${user.id}`);
        return res.json();
      } catch (error) {
        console.error('Erro ao buscar psicólogo do usuário:', error);
        return null;
      }
    },
    enabled: !!user?.id && user?.tipo === 'psicologo'
  });

  // Usar o psicologoId passado como prop, ou o ID do psicólogo atual
  const psicologoIdFinal = psicologoId || psicologoUsuario?.id;

  const [showOnlyToday, setShowOnlyToday] = useState(true);

  // Buscar próximos agendamentos do psicólogo
  const { data: agendamentos, isLoading, error: agendamentosError } = useQuery({
    queryKey: ['/api/agendamentos/proximos', psicologoIdFinal, showOnlyToday],
    queryFn: async () => {
      if (!psicologoIdFinal) return [];
      
      console.log("Buscando agendamentos para o psicólogo ID:", psicologoIdFinal);
      
      try {
        // Buscar os agendamentos a partir de hoje para este psicólogo
        const hoje = new Date();
        const dataHoje = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        // URL para buscar agendamentos
        const url = `/api/agendamentos?dataInicio=${dataHoje}&psicologoId=${psicologoIdFinal}`;
        
        const res = await apiRequest("GET", url);
        
        // Verificar se a resposta é de fato um JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("A resposta não é um JSON válido");
          return [];
        }
        
        const data = await res.json();
        console.log("Agendamentos recebidos:", data.length);
        
        // Filtrar os agendamentos futuros e não cancelados
        const agora = new Date();
        const proximasConsultas = data.filter((agendamento: any) => {
          const dataAgendamento = new Date(agendamento.data);
          const [horaInicio, minutoInicio] = agendamento.horaInicio.split(':').map(Number);
          dataAgendamento.setHours(horaInicio, minutoInicio, 0, 0);
          
          const isHoje = dataAgendamento.toDateString() === agora.toDateString();
          
          return (
            dataAgendamento >= agora && 
            agendamento.status !== 'cancelado' && 
            agendamento.status !== 'realizado' &&
            (!showOnlyToday || isHoje)
          );
        }).sort((a: any, b: any) => {
          // Ordenar por data e hora
          const dataA = new Date(a.data);
          const [horaA, minutoA] = a.horaInicio.split(':').map(Number);
          dataA.setHours(horaA, minutoA, 0, 0);
          
          const dataB = new Date(b.data);
          const [horaB, minutoB] = b.horaInicio.split(':').map(Number);
          dataB.setHours(horaB, minutoB, 0, 0);
          
          return dataA.getTime() - dataB.getTime();
        });
        
        console.log("Próximas consultas filtradas:", proximasConsultas.length);
        return proximasConsultas;
      } catch (error) {
        console.error('Erro ao buscar próximos agendamentos:', error);
        return [];
      }
    },
    enabled: !!psicologoIdFinal
  });
  
  // Próximas consultas filtradas
  const proximasConsultas = agendamentos || [];

  const iniciarAtendimento = async (agendamento: any) => {
    try {
      if (onSelectAgendamento) {
        // Se houver um callback de seleção, usá-lo (para uso em outras páginas)
        onSelectAgendamento(agendamento.id);
        return;
      }

      // Sempre vai para a página de atendimento, independentemente do tipo (presencial ou remoto)
      navigate(`/atendimento/${agendamento.id}`);
    } catch (error) {
      console.error("Erro ao iniciar atendimento:", error);
      alert("Ocorreu um erro ao iniciar o atendimento. Por favor, tente novamente.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Próximas Sessões</CardTitle>
            <CardDescription>
              Visualize suas próximas sessões agendadas e inicie os atendimentos
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyToday(!showOnlyToday)}
          >
            {showOnlyToday ? 'Mostrar Todas' : 'Apenas Hoje'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : agendamentosError ? (
          <div className="py-6 text-center text-muted-foreground">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-lg font-medium">Erro ao carregar sessões</p>
            <p className="text-sm">Não foi possível carregar as próximas sessões.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : !proximasConsultas || proximasConsultas.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Nenhuma sessão agendada</p>
            <p className="text-sm">Não há próximas sessões agendadas no momento.</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {proximasConsultas?.map((agendamento: any) => {
                const pacienteNome = agendamento.paciente?.usuario?.nome || 'Paciente não encontrado';
                const dataFormatada = format(new Date(agendamento.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                const isHoje = new Date(agendamento.data).toDateString() === hoje.toDateString();
                
                return (
                  <div key={agendamento.id} className="flex flex-col md:flex-row justify-between p-4 border rounded-lg">
                    <div className="space-y-2 mb-4 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{pacienteNome}</span>
                        <Badge variant={isHoje ? "default" : "outline"}>
                          {isHoje ? "Hoje" : dataFormatada}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{agendamento.horaInicio} - {agendamento.horaFim}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {agendamento.remoto ? (
                            <>
                              <Video className="h-3 w-3" />
                              <span>Teleconsulta</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>Presencial</span>
                            </>
                          )}
                        </Badge>
                        {agendamento.sala && !agendamento.remoto && (
                          <span>• Sala: {agendamento.sala.nome}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Button onClick={() => iniciarAtendimento(agendamento)} className="whitespace-nowrap">
                        {agendamento.remoto ? 'Iniciar Teleconsulta' : 'Iniciar Atendimento'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ProximasSessoesProps {
  psicologoId?: number;
}

export default function ProximasSessoes({ psicologoId }: ProximasSessoesProps) {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar o ID do psicólogo associado ao usuário atual (se for psicólogo)
  const { data: psicologoUsuario } = useQuery({
    queryKey: ['/api/psicologos/usuario', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.tipo !== 'psicologo') return null;
      try {
        const res = await fetch(`/api/psicologos/usuario/${user.id}`);
        if (!res.ok) throw new Error('Erro ao buscar psicólogo do usuário');
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

  // Buscar próximos agendamentos do psicólogo
  const { data: proximasConsultas, isLoading } = useQuery({
    queryKey: ['/api/atendimentos/psicologo', psicologoIdFinal],
    queryFn: async () => {
      if (!psicologoIdFinal) return [];
      try {
        const res = await fetch(`/api/atendimentos/psicologo/${psicologoIdFinal}`);
        if (!res.ok) throw new Error('Erro ao buscar próximas sessões');
        return res.json();
      } catch (error) {
        console.error('Erro ao buscar próximos agendamentos:', error);
        return [];
      }
    },
    enabled: !!psicologoIdFinal
  });

  const iniciarAtendimento = (agendamentoId: number) => {
    setLocation(`/atendimento/${agendamentoId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas Sessões</CardTitle>
        <CardDescription>
          Visualize suas próximas sessões agendadas e inicie os atendimentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : proximasConsultas?.length === 0 ? (
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
                        <Badge variant="secondary">
                          {agendamento.remoto ? 'Teleconsulta' : 'Presencial'}
                        </Badge>
                        {agendamento.sala && (
                          <span>• Sala: {agendamento.sala.nome}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Button onClick={() => iniciarAtendimento(agendamento.id)}>
                        Iniciar Atendimento
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
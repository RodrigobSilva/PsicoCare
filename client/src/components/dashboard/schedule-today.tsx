import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Check, 
  Calendar as CalendarIcon, 
  Info 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScheduleTodayProps {
  agendamentos?: any[];
  isLoading: boolean;
}

export default function ScheduleToday({ agendamentos, isLoading }: ScheduleTodayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const updateAgendamentoMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/agendamentos/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agendamentos"] });
      toast({
        title: "Agendamento atualizado",
        description: "O status do agendamento foi atualizado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o agendamento.",
        variant: "destructive"
      });
    }
  });

  const confirmarAgendamento = (id: number) => {
    updateAgendamentoMutation.mutate({ id, status: "confirmado" });
  };

  const getPatientInitials = (paciente: any) => {
    if (!paciente?.usuario?.nome) return "??";
    
    const names = paciente.usuario.nome.split(" ");
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    
    // Verifica se time é uma string ISO 8601 completa
    if (time.includes('T') && time.includes('Z')) {
      return format(parseISO(time), 'HH:mm');
    }
    
    // Se for apenas o horário em formato HH:MM:SS
    return time.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado": return "bg-success bg-opacity-10 text-success";
      case "cancelado": return "bg-danger bg-opacity-10 text-danger";
      case "realizado": return "bg-info bg-opacity-10 text-info";
      default: return "bg-warning bg-opacity-10 text-warning";
    }
  };

  const canConfirm = (agendamento: any) => {
    // Apenas admin, secretária e o próprio psicólogo podem confirmar
    if (!user) return false;
    
    if (user.tipo === "admin" || user.tipo === "secretaria") return true;
    
    if (user.tipo === "psicologo" && user.id === agendamento.psicologo?.usuario?.id) return true;
    
    return false;
  };

  return (
    <Card className="mb-6 lg:mb-0">
      <CardHeader className="pb-4 border-b border-neutral-200 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-neutral-800">Agenda de Hoje</CardTitle>
        <Link href="/agenda">
          <Button variant="link" className="text-sm text-primary hover:text-primary-dark">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <Skeleton className="rounded-full w-10 h-10" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40 mt-1" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="flex mt-1 justify-end">
                    <Skeleton className="h-5 w-5 rounded-full ml-2" />
                    <Skeleton className="h-5 w-5 rounded-full ml-2" />
                    <Skeleton className="h-5 w-5 rounded-full ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {agendamentos && agendamentos.length > 0 ? (
              agendamentos.map((agendamento) => (
                <div 
                  key={agendamento.id} 
                  className={cn(
                    "flex items-center p-3 bg-neutral-50 rounded-lg border",
                    agendamento.status === "confirmado" ? "border-primary border-opacity-20" : "border-neutral-200"
                  )}
                >
                  <div 
                    className={cn(
                      "rounded-full w-10 h-10 text-white flex items-center justify-center",
                      agendamento.status === "confirmado" ? "bg-primary" : "bg-secondary"
                    )}
                  >
                    <span>{getPatientInitials(agendamento.paciente)}</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-neutral-800">
                      {agendamento.paciente?.usuario?.nome || "Paciente não encontrado"}
                    </h4>
                    <p className="text-xs text-neutral-600">
                      {`Dr. ${agendamento.psicologo?.usuario?.nome || "Não atribuído"} • ${agendamento.tipoAtendimento || "Consulta"}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-xs px-2 py-1 rounded-full", getStatusColor(agendamento.status))}>
                      {formatTime(agendamento.horaInicio)} - {formatTime(agendamento.horaFim)}
                    </span>
                    <div className="flex mt-1 justify-end">
                      {agendamento.status === "confirmado" ? (
                        <button className="text-success text-sm" title="Confirmado">
                          <CheckCircle size={16} />
                        </button>
                      ) : canConfirm(agendamento) ? (
                        <button 
                          className="text-neutral-600 hover:text-primary text-sm" 
                          title="Confirmar"
                          onClick={() => confirmarAgendamento(agendamento.id)}
                        >
                          <Check size={16} />
                        </button>
                      ) : null}
                      <button className="text-neutral-600 hover:text-primary text-sm ml-2" title="Reagendar">
                        <CalendarIcon size={16} />
                      </button>
                      <button className="text-neutral-600 hover:text-info text-sm ml-2" title="Informações">
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <CalendarIcon className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <p>Não há agendamentos para hoje.</p>
                <p className="text-sm mt-1">Clique em "Ver todos" para visualizar a agenda completa.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

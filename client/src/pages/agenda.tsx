
import { useState, useEffect } from "react";
import Layout from "@/components/layout/layout";
import Calendar from "@/components/agenda/calendar";
import AgendamentoForm from "@/components/agenda/agendamento-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";


// Função para criar um objeto URLSearchParams a partir da string de consulta
function useSearchParams() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");

  return {
    get: (param: string) => searchParams.get(param),
  };
}

export default function Agenda() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { user } = useAuth();
  const { toast } = useToast();
  const query = useSearchParams();
  
  // Verificar se o usuário é administrador ou secretária
  const isAdminOrSecretaria = user?.tipo === "admin" || user?.tipo === "secretaria";
  const isPsicologo = user?.tipo === "psicologo";
  
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

  // Redirecionar psicólogo para sua própria agenda
  useEffect(() => {
    if (user?.tipo === 'psicologo' && psicologoUsuario?.id && !query.get("psicologo")) {
      const url = new URL(window.location.href);
      url.searchParams.set('psicologo', psicologoUsuario.id.toString());
      window.history.pushState({}, '', url.toString());
    }
  }, [user?.tipo, psicologoUsuario?.id]);

  const psicologoId = query.get("psicologo");
  const filialId = query.get("filial");
  const showForm = query.get("new") === "true";

  // Abrir formulário de agendamento se o parâmetro estiver presente
  useEffect(() => {
    if (showForm) {
      setIsFormOpen(true);
    }
  }, [showForm]);

  // Carregar detalhes do agendamento selecionado se necessário
  const { data: agendamentoDetalhes } = useQuery({
    queryKey: ["/api/agendamentos", selectedAgendamento?.id],
    queryFn: async () => {
      if (!selectedAgendamento?.id) return null;
      const res = await apiRequest(
        "GET",
        `/api/agendamentos/${selectedAgendamento.id}`,
      );
      return res.json();
    },
    enabled: !!selectedAgendamento?.id,
  });

  // Handler para seleção de agendamento no calendário
  const handleSelectAgendamento = (agendamento: any) => {
    setSelectedAgendamento(agendamento);
    setIsDetailsOpen(true);
  };

  // Handler para novo agendamento
  const handleNewAgendamento = () => {
    setSelectedAgendamento(null);
    setIsFormOpen(true);
  };

  // Handler para editar agendamento
  const handleEditAgendamento = () => {
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  // Verificar se o usuário pode editar o agendamento
  const canEditAgendamento = () => {
    if (!user || !selectedAgendamento) return false;

    // Apenas Admin e secretaria podem editar agendamentos
    if (user.tipo === "admin" || user.tipo === "secretaria") return true;

    return false;
  };
  
  // Verificar se o usuário pode excluir o agendamento
  const canDeleteAgendamento = () => {
    if (!user || !selectedAgendamento) return false;

    // Apenas Admin e secretaria podem excluir agendamentos
    if (user.tipo === "admin" || user.tipo === "secretaria") return true;

    return false;
  };
  
  // Mutation para excluir agendamento
  const deleteAgendamentoMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/agendamentos/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/agendamentos"],
      });
      setIsDetailsOpen(false);
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o agendamento.",
        variant: "destructive",
      });
    },
  });

  // Handler para excluir agendamento
  const handleDeleteAgendamento = () => {
    if (window.confirm("Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.")) {
      deleteAgendamentoMutation.mutate(selectedAgendamento.id);
    }
  };
  


  // Obter rótulo de status do agendamento
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "agendado":
        return "Agendado";
      case "confirmado":
        return "Confirmado";
      case "cancelado":
        return "Cancelado";
      case "realizado":
        return "Realizado";
      default:
        return status;
    }
  };

  // Obter cor do status do agendamento
  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado":
        return "bg-warning bg-opacity-10 text-warning";
      case "confirmado":
        return "bg-success bg-opacity-10 text-success";
      case "cancelado":
        return "bg-danger bg-opacity-10 text-danger";
      case "realizado":
        return "bg-info bg-opacity-10 text-info";
      default:
        return "bg-neutral-200 text-neutral-700";
    }
  };

  // Formar hora legível
  const formatHora = (hora: string) => {
    if (!hora) return "";
    return hora.substring(0, 5);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-teal-800">
            <div className="inline-block p-1.5 bg-teal-100/50 rounded-lg mr-2">
              <svg className="w-6 h-6 text-teal-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Agenda
          </h1>
          <div className="flex flex-wrap gap-2">
            {isAdminOrSecretaria && (
              <>
                <Button onClick={handleNewAgendamento} className="bg-teal-600 hover:bg-teal-700 shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Agendamento
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/pacientes?new=true"} className="border-teal-200 hover:bg-teal-50 text-teal-700 hover:text-teal-800 shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Button>
              </>
            )}
          </div>
        </div>

        <Calendar
          onSelectAgendamento={handleSelectAgendamento}
          psicologoId={psicologoId ? parseInt(psicologoId) : undefined}
          filialId={filialId ? parseInt(filialId) : undefined}
          initialDate={selectedDate}
        />

        {/* Diálogo de Formulário de Agendamento */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAgendamento
                  ? "Editar Agendamento"
                  : "Novo Agendamento"}
              </DialogTitle>
              <DialogDescription>
                {selectedAgendamento
                  ? "Edite as informações do agendamento existente."
                  : "Preencha os dados para criar um novo agendamento."}
              </DialogDescription>
            </DialogHeader>
            <AgendamentoForm
              agendamentoId={selectedAgendamento?.id}
              defaultDate={selectedDate}
              onSuccess={(data) => {
                setIsFormOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["/api/agendamentos"],
                });
                // Mostrar o toast para qualquer status exceto "cancelado"
                if (data && data.status !== "cancelado") {
                  toast({
                    title: selectedAgendamento
                      ? "Agendamento atualizado"
                      : "Agendamento criado",
                    description: selectedAgendamento
                      ? "O agendamento foi atualizado com sucesso."
                      : "O agendamento foi criado com sucesso.",
                  });
                }
              }}
              onCanceled={() => {
                setIsFormOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["/api/agendamentos"],
                });
                // Não mostra toast quando cancelar
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Diálogo de Detalhes do Agendamento */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>

            {selectedAgendamento && (
              <Card>
                <CardHeader className="pb-2 bg-gradient-to-r from-teal-50 to-transparent">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <CardTitle className="text-lg text-teal-800">
                          {selectedAgendamento.paciente?.usuario?.nome}
                        </CardTitle>
                      </div>
                      <CardDescription className="ml-12 text-teal-600">
                        {selectedAgendamento.tipoAtendimento || "Consulta"}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`shadow-sm ${
                        selectedAgendamento.status === "agendado" 
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                          : selectedAgendamento.status === "confirmado" 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                          : selectedAgendamento.status === "realizado" 
                          ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      }`}
                    >
                      {getStatusLabel(selectedAgendamento.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 pb-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-teal-600">
                          Data
                        </h4>
                        <p className="text-neutral-800 font-medium">
                          {selectedAgendamento.data &&
                            format(
                              new Date(selectedAgendamento.data),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR },
                            )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-teal-600">
                          Horário
                        </h4>
                        <p className="text-neutral-800 font-medium">
                          {formatHora(selectedAgendamento.horaInicio)} -{" "}
                          {formatHora(selectedAgendamento.horaFim)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-teal-600">
                          Psicólogo
                        </h4>
                        <p className="text-neutral-800 font-medium">
                          {selectedAgendamento.psicologo?.usuario?.nome}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-teal-600">
                          Filial
                        </h4>
                        <p className="text-neutral-800 font-medium">
                          {selectedAgendamento.filial?.nome}
                        </p>
                      </div>
                    </div>
                    
                    {selectedAgendamento.sala && (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-teal-600">
                            Sala
                          </h4>
                          <p className="text-neutral-800 font-medium">
                            {selectedAgendamento.sala?.nome}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedAgendamento.planoSaude && (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-teal-600">
                            Plano de Saúde
                          </h4>
                          <p className="text-neutral-800 font-medium">
                            {selectedAgendamento.planoSaude?.nome}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedAgendamento.observacao && (
                    <div className="p-3 bg-teal-50/40 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h4 className="text-sm font-medium text-teal-700">
                          Observação
                        </h4>
                      </div>
                      <p className="text-neutral-700 text-sm pl-7">
                        {selectedAgendamento.observacao}
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-4 bg-gradient-to-r from-transparent to-teal-50/50">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className="border-teal-200 hover:bg-teal-50 text-teal-700 hover:text-teal-800 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Fechar
                  </Button>

                  <div className="flex gap-2">
                    {canEditAgendamento() && (
                      <Button 
                        onClick={handleEditAgendamento}
                        className="bg-teal-600 hover:bg-teal-700 shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Agendamento
                      </Button>
                    )}
                    
                    {canDeleteAgendamento() && (
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAgendamento}
                        className="shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir Agendamento
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )}
          </DialogContent>
        </Dialog>


      </div>
    </Layout>
  );
}

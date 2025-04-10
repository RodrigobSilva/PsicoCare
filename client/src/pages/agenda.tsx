
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
import { useQuery } from "@tanstack/react-query";
import AtendimentoForm from "@/components/atendimentos/atendimento-form";

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
  const [showAtendimentoForm, setShowAtendimentoForm] = useState(false);
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
      window.location.href = `/agenda?psicologo=${psicologoUsuario.id}`;
    }
  }, [user?.tipo, psicologoUsuario?.id, query]);

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
  
  // Verificar se o usuário pode registrar atendimento
  const canRegisterAtendimento = () => {
    if (!user || !selectedAgendamento) return false;
    
    // Admin e secretaria podem registrar atendimentos
    if (user.tipo === "admin" || user.tipo === "secretaria") return true;
    
    // Psicólogos podem registrar apenas seus próprios atendimentos
    if (
      user.tipo === "psicologo" &&
      selectedAgendamento.psicologoId === psicologoUsuario?.id
    )
      return true;
      
    return false;
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Agenda</h1>
          <div className="flex gap-2">
            {isAdminOrSecretaria && (
              <>
                <Button onClick={handleNewAgendamento}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Agendamento
                </Button>
                <Button variant="secondary" onClick={() => window.location.href = "/pacientes?new=true"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsFormOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              Consultar Horários
            </Button>
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
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedAgendamento.paciente?.usuario?.nome}
                      </CardTitle>
                      <CardDescription>
                        {selectedAgendamento.tipoAtendimento || "Consulta"}
                      </CardDescription>
                    </div>
                    <Badge
                      className={getStatusColor(selectedAgendamento.status)}
                    >
                      {getStatusLabel(selectedAgendamento.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 pb-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">
                        Data
                      </h4>
                      <p className="text-neutral-800">
                        {selectedAgendamento.data &&
                          format(
                            new Date(selectedAgendamento.data),
                            "dd 'de' MMMM 'de' yyyy",
                            { locale: ptBR },
                          )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">
                        Horário
                      </h4>
                      <p className="text-neutral-800">
                        {formatHora(selectedAgendamento.horaInicio)} -{" "}
                        {formatHora(selectedAgendamento.horaFim)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">
                        Psicólogo
                      </h4>
                      <p className="text-neutral-800">
                        {selectedAgendamento.psicologo?.usuario?.nome}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">
                        Filial
                      </h4>
                      <p className="text-neutral-800">
                        {selectedAgendamento.filial?.nome}
                      </p>
                    </div>
                    {selectedAgendamento.sala && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">
                          Sala
                        </h4>
                        <p className="text-neutral-800">
                          {selectedAgendamento.sala?.nome}
                        </p>
                      </div>
                    )}
                    {selectedAgendamento.planoSaude && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">
                          Plano de Saúde
                        </h4>
                        <p className="text-neutral-800">
                          {selectedAgendamento.planoSaude?.nome}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedAgendamento.observacao && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">
                        Observação
                      </h4>
                      <p className="text-neutral-700 text-sm mt-1">
                        {selectedAgendamento.observacao}
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    Fechar
                  </Button>

                  <div className="flex gap-2">
                    {canEditAgendamento() && (
                      <Button onClick={handleEditAgendamento}>
                        Editar Agendamento
                      </Button>
                    )}
                    
                    {canRegisterAtendimento() && selectedAgendamento?.status === "confirmado" && (
                      <Button onClick={() => setShowAtendimentoForm(true)}>
                        Registrar Atendimento
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Registro de Atendimento */}
        <Dialog
          open={showAtendimentoForm}
          onOpenChange={setShowAtendimentoForm}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Registro de Atendimento</DialogTitle>
              <DialogDescription>
                Registre os dados do atendimento realizado
              </DialogDescription>
            </DialogHeader>
            {selectedAgendamento && (
              <AtendimentoForm
                agendamentoId={selectedAgendamento.id}
                onSuccess={() => {
                  setShowAtendimentoForm(false);
                  queryClient.invalidateQueries({
                    queryKey: ["/api/agendamentos"],
                  });
                  toast({
                    title: "Atendimento registrado",
                    description: "O atendimento foi registrado com sucesso.",
                  });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

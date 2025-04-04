import { useState, useEffect } from "react";
import Layout from "@/components/layout/layout";
import Calendar from "@/components/agenda/calendar";
// Placeholder para o componente AgendamentoForm que será criado depois
const AgendamentoForm = (props: any) => <div>Formulário de Agendamento</div>;
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
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Função para criar um objeto URLSearchParams a partir da string de consulta
function useSearchParams() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  return {
    get: (param: string) => searchParams.get(param)
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
      const res = await apiRequest("GET", `/api/agendamentos/${selectedAgendamento.id}`);
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
    
    if (user.tipo === "admin" || user.tipo === "secretaria") return true;
    
    if (user.tipo === "psicologo" && selectedAgendamento.psicologo?.usuario?.id === user.id) return true;
    
    return false;
  };

  // Obter rótulo de status do agendamento
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "agendado": return "Agendado";
      case "confirmado": return "Confirmado";
      case "cancelado": return "Cancelado";
      case "realizado": return "Realizado";
      default: return status;
    }
  };

  // Obter cor do status do agendamento
  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado": return "bg-warning bg-opacity-10 text-warning";
      case "confirmado": return "bg-success bg-opacity-10 text-success";
      case "cancelado": return "bg-danger bg-opacity-10 text-danger";
      case "realizado": return "bg-info bg-opacity-10 text-info";
      default: return "bg-neutral-200 text-neutral-700";
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
          <Button onClick={handleNewAgendamento}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
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
                {selectedAgendamento ? "Editar Agendamento" : "Novo Agendamento"}
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
              onSuccess={() => {
                setIsFormOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/agendamentos"] });
                toast({
                  title: selectedAgendamento ? "Agendamento atualizado" : "Agendamento criado",
                  description: selectedAgendamento
                    ? "O agendamento foi atualizado com sucesso."
                    : "O agendamento foi criado com sucesso.",
                });
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
                      <CardTitle className="text-lg">{selectedAgendamento.paciente?.usuario?.nome}</CardTitle>
                      <CardDescription>
                        {selectedAgendamento.tipoAtendimento || "Consulta"}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(selectedAgendamento.status)}>
                      {getStatusLabel(selectedAgendamento.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 pb-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Data</h4>
                      <p className="text-neutral-800">
                        {selectedAgendamento.data && format(new Date(selectedAgendamento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Horário</h4>
                      <p className="text-neutral-800">
                        {formatHora(selectedAgendamento.horaInicio)} - {formatHora(selectedAgendamento.horaFim)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Psicólogo</h4>
                      <p className="text-neutral-800">{selectedAgendamento.psicologo?.usuario?.nome}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Filial</h4>
                      <p className="text-neutral-800">{selectedAgendamento.filial?.nome}</p>
                    </div>
                    {selectedAgendamento.sala && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">Sala</h4>
                        <p className="text-neutral-800">{selectedAgendamento.sala?.nome}</p>
                      </div>
                    )}
                    {selectedAgendamento.planoSaude && (
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500">Plano de Saúde</h4>
                        <p className="text-neutral-800">{selectedAgendamento.planoSaude?.nome}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedAgendamento.observacao && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Observação</h4>
                      <p className="text-neutral-700 text-sm mt-1">{selectedAgendamento.observacao}</p>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Fechar
                  </Button>
                  
                  {canEditAgendamento() && (
                    <Button onClick={handleEditAgendamento}>
                      Editar Agendamento
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, addMonths, startOfMonth, subMonths, setDefaultOptions } from "date-fns";
import { ptBR } from "date-fns/locale";

// Configurar locale padrão para pt-BR
setDefaultOptions({ locale: ptBR });

interface CalendarProps {
  onSelectAgendamento?: (agendamento: any) => void;
  psicologoId?: number;
  filialId?: number;
  view?: "day" | "week" | "month";
  initialDate?: Date;
}

export default function Calendar({ 
  onSelectAgendamento, 
  psicologoId, 
  filialId, 
  view = "day",
  initialDate = new Date()
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">(view);
  const [selectedPsicologo, setSelectedPsicologo] = useState<string>(psicologoId ? psicologoId.toString() : "");
  const [selectedFilial, setSelectedFilial] = useState<string>(filialId ? filialId.toString() : "");

  // Consultas para obter dados
  const { data: psicologos, isLoading: isLoadingPsicologos } = useQuery({
    queryKey: ["/api/psicologos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/psicologos");
      return res.json();
    },
  });

  const { data: filiais, isLoading: isLoadingFiliais } = useQuery({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filiais");
      return res.json();
    },
  });

  // Construir query params baseado nos filtros
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    // Formato ISO para data
    params.append("data", currentDate.toISOString().split('T')[0]);
    
    if (selectedPsicologo) {
      params.append("psicologoId", selectedPsicologo);
    }
    
    if (selectedFilial) {
      params.append("filialId", selectedFilial);
    }
    
    return params.toString();
  };

  // Buscar agendamentos
  const { data: agendamentos, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos", { 
      data: currentDate.toISOString().split('T')[0],
      psicologoId: selectedPsicologo,
      filialId: selectedFilial
    }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/agendamentos?${buildQueryParams()}`);
      return res.json();
    },
  });

  // Navegar para o próximo período
  const goToNext = () => {
    if (currentView === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (currentView === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else if (currentView === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  // Navegar para o período anterior
  const goToPrevious = () => {
    if (currentView === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (currentView === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else if (currentView === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  // Ir para hoje
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obter título do período atual
  const getCurrentPeriodTitle = () => {
    if (currentView === "day") {
      return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy");
    } else if (currentView === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return `Semana de ${format(start, "dd/MM/yyyy")}`;
    } else if (currentView === "month") {
      return format(currentDate, "MMMM 'de' yyyy");
    }
    return "";
  };

  // Gerar slots para visualização diária
  const generateDayView = () => {
    const horarios = [];
    for (let hora = 8; hora < 20; hora++) {
      horarios.push(`${hora}:00`);
      horarios.push(`${hora}:30`);
    }

    return horarios.map((horario) => {
      const [h, m] = horario.split(":");
      
      // Encontrar agendamentos neste horário
      const agendamentosNoHorario = agendamentos?.filter((a: any) => {
        const horaInicio = a.horaInicio?.substring(0, 5);
        return horaInicio === horario;
      });

      return (
        <div key={horario} className="flex border-b border-neutral-200 min-h-[80px]">
          <div className="w-20 p-2 font-medium text-neutral-500 text-sm border-r border-neutral-200">
            {horario}
          </div>
          <div className="flex-1 p-2">
            {agendamentosNoHorario?.length > 0 ? (
              agendamentosNoHorario.map((agendamento: any) => (
                <div 
                  key={agendamento.id}
                  className={cn(
                    "p-2 rounded mb-1 cursor-pointer text-sm",
                    agendamento.status === "confirmado" ? "bg-primary-light text-white" : "bg-secondary-light text-white"
                  )}
                  onClick={() => onSelectAgendamento?.(agendamento)}
                >
                  <div className="font-medium">{agendamento.paciente?.usuario?.nome}</div>
                  <div className="text-xs">{agendamento.tipoAtendimento} - {agendamento.psicologo?.usuario?.nome}</div>
                </div>
              ))
            ) : null}
          </div>
        </div>
      );
    });
  };

  // Renderizar conteúdo baseado na visualização atual
  const renderCalendarContent = () => {
    if (isLoadingAgendamentos) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (currentView === "day") {
      return generateDayView();
    }

    return (
      <div className="p-4 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
        <p className="text-neutral-500">Visualização {currentView === "week" ? "semanal" : "mensal"} em desenvolvimento.</p>
        <p className="text-neutral-500 text-sm">Por favor, utilize a visualização diária por enquanto.</p>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4 flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>{getCurrentPeriodTitle()}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select 
              value={currentView} 
              onValueChange={(value) => setCurrentView(value as "day" | "week" | "month")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diária</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select 
              value={selectedPsicologo} 
              onValueChange={setSelectedPsicologo}
              disabled={isLoadingPsicologos}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um psicólogo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os psicólogos</SelectItem>
                {psicologos?.map((psicologo: any) => (
                  <SelectItem key={psicologo.id} value={psicologo.id.toString()}>
                    {psicologo.usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select 
              value={selectedFilial} 
              onValueChange={setSelectedFilial}
              disabled={isLoadingFiliais}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as filiais</SelectItem>
                {filiais?.map((filial: any) => (
                  <SelectItem key={filial.id} value={filial.id.toString()}>
                    {filial.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-320px)]">
        {renderCalendarContent()}
      </CardContent>
    </Card>
  );
}

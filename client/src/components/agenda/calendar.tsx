import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
import { 
  format, 
  addDays, 
  startOfWeek,
  endOfWeek, 
  addMonths, 
  startOfMonth,
  endOfMonth, 
  subMonths, 
  setDefaultOptions,
  getDay,
  getDate,
  isToday,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";

// Configurar locale padrão para pt-BR
setDefaultOptions({ locale: ptBR });

// Interface para tipar os agendamentos
interface Agendamento {
  id: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  tipoAtendimento?: string;
  observacao?: string;
  paciente?: {
    id: number;
    usuario?: {
      id: number;
      nome: string;
    }
  };
  psicologo?: {
    id: number;
    usuario?: {
      id: number;
      nome: string;
    }
  };
  filial?: {
    id: number;
    nome: string;
  };
  sala?: {
    id: number;
    nome: string;
  };
  planoSaude?: {
    id: number;
    nome: string;
  };
}

interface CalendarProps {
  onSelectAgendamento?: (agendamento: Agendamento) => void;
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
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">(view);

  // Se usuário for psicólogo, o filtro de psicólogo deve ser fixo como o ID dele
  // Se for admin ou secretaria, pode ser qualquer psicólogo ou nenhum
  const isPsicologo = user?.tipo === 'psicologo';

  // Consulta para obter o ID do psicólogo do usuário atual (se for psicólogo)
  const { data: psicologoUsuario, isLoading: isLoadingPsicologoUsuario } = useQuery({
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

  // ID do psicólogo associado ao usuário atual
  const userPsicologoId = isPsicologo && psicologoUsuario ? psicologoUsuario.id : undefined;

  // Se for psicólogo, sempre usa o ID do próprio psicólogo
  // Caso contrário, usa o ID passado como prop ou o selecionado no filtro
  const [selectedPsicologo, setSelectedPsicologo] = useState<string>(
    psicologoId ? psicologoId.toString() : "nenhum"
  );

  // Atualizar o filtro de psicólogo quando recebermos os dados do psicólogo do usuário
  useEffect(() => {
    if (isPsicologo && userPsicologoId) {
      setSelectedPsicologo(userPsicologoId.toString());
    }
  }, [isPsicologo, userPsicologoId]);
  
  // Estado para a filial selecionada
  const [selectedFilial, setSelectedFilial] = useState<string>(filialId ? filialId.toString() : "nenhuma");
  
  // Atualizar o filtro de filial quando receber como prop
  useEffect(() => {
    if (filialId) {
      setSelectedFilial(filialId.toString());
    }
  }, [filialId]);

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

    // Obter o intervalo de datas baseado na visualização
    if (currentView === "day") {
      // Formato ISO para data
      params.append("data", currentDate.toISOString().split('T')[0]);
    } else if (currentView === "week") {
      // Obter primeiro e último dia da semana
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });

      params.append("dataInicio", start.toISOString().split('T')[0]);
      params.append("dataFim", end.toISOString().split('T')[0]);
    } else if (currentView === "month") {
      // Obter primeiro e último dia do mês
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      params.append("dataInicio", start.toISOString().split('T')[0]);
      params.append("dataFim", end.toISOString().split('T')[0]);
    }

    // Se for psicólogo, sempre usa apenas seus próprios agendamentos
    if (isPsicologo && userPsicologoId) {
      params.append("psicologoId", userPsicologoId.toString());
    } 
    // Para admin/secretária, permite filtrar por psicólogo
    else if (!isPsicologo && selectedPsicologo && selectedPsicologo !== "todos" && selectedPsicologo !== "nenhum") {
      params.append("psicologoId", selectedPsicologo);
      console.log("Aplicando filtro de psicólogo:", selectedPsicologo);
    }

    // Adicionar filtro de filial - certifique-se de que é um valor válido
    if (selectedFilial && selectedFilial !== "todas" && selectedFilial !== "nenhuma") {
      params.append("filialId", selectedFilial);
      console.log("Aplicando filtro de filial:", selectedFilial);
    }

    console.log("Parâmetros de filtro completos:", Object.fromEntries(params.entries()));
    return params.toString();
  };

  // Construir query key baseado na visualização atual
  const buildQueryKey = () => {
    let dateParams = {};

    if (currentView === "day") {
      dateParams = { data: currentDate.toISOString().split('T')[0] };
    } else if (currentView === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      dateParams = { 
        dataInicio: start.toISOString().split('T')[0],
        dataFim: end.toISOString().split('T')[0]
      };
    } else if (currentView === "month") {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      dateParams = { 
        dataInicio: start.toISOString().split('T')[0],
        dataFim: end.toISOString().split('T')[0]
      };
    }

    // Determinar qual ID de psicólogo usar na query key
    const psicologoIdForKey = isPsicologo && userPsicologoId 
      ? userPsicologoId.toString() 
      : selectedPsicologo;

    return {
      ...dateParams,
      psicologoId: psicologoIdForKey,
      filialId: selectedFilial,
      view: currentView
    };
  };

  // Se for psicólogo, sempre busca seus agendamentos
  // Se for admin/secretaria, busca com filtros ou busca todos
  const shouldFetchAgendamentos = isPsicologo ? 
    !!userPsicologoId : 
    (selectedPsicologo !== "nenhum" || selectedFilial !== "nenhuma");

  // Buscar agendamentos
  const { data: agendamentos, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos", buildQueryKey()],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/agendamentos?${buildQueryParams()}`);
      const data = await res.json();

      // Criar um Map para armazenar agendamentos únicos usando ID como chave
      const uniqueAgendamentos = new Map();

      data.forEach((ag: any) => {
        // Verificar se é um agendamento válido e se pertence ao psicólogo correto
        if (isPsicologo && userPsicologoId && ag.psicologo?.id !== userPsicologoId) {
          return;
        }

        // Usar o ID como chave para garantir unicidade
        if (!uniqueAgendamentos.has(ag.id)) {
          uniqueAgendamentos.set(ag.id, ag);
        }
      });

      // Converter Map de volta para array e ordenar por data e hora
      return Array.from(uniqueAgendamentos.values())
        .sort((a, b) => {
          const dateCompare = a.data.localeCompare(b.data);
          if (dateCompare === 0) {
            return a.horaInicio.localeCompare(b.horaInicio);
          }
          return dateCompare;
        });
    },
    enabled: shouldFetchAgendamentos
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

  // Função para formatar o horário
  const formatHorario = (horario: string | undefined) => {
    if (!horario) return "";
    return horario.substring(0, 5);
  };

  // Obter a cor do status do agendamento
  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado":
        return "bg-orange-500 text-white hover:bg-orange-600";
      case "confirmado":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "cancelado":
        return "bg-red-500 text-white hover:bg-red-600";
      case "realizado":
        return "bg-green-500 text-white hover:bg-green-600";
      default:
        return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  // Renderizar cartão de agendamento
  const renderAgendamentoCard = (agendamento: Agendamento) => {
    return (
      <div 
        key={agendamento.id}
        className={cn(
          "p-2 rounded mb-1 cursor-pointer text-sm",
          getStatusColor(agendamento.status)
        )}
        onClick={() => onSelectAgendamento?.(agendamento)}
      >
        <div className="font-medium">{agendamento.paciente?.usuario?.nome}</div>
        <div className="text-xs">
          {formatHorario(agendamento.horaInicio)} - {formatHorario(agendamento.horaFim)}
          {agendamento.tipoAtendimento && ` • ${agendamento.tipoAtendimento}`}
          {agendamento.psicologo?.usuario?.nome && ` • ${agendamento.psicologo?.usuario?.nome}`}
        </div>
      </div>
    );
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
      const agendamentosNoHorario = agendamentos?.filter((a: Agendamento) => {
        const horaInicio = a.horaInicio?.substring(0, 5);
        return horaInicio === horario && isSameDay(parseISO(a.data), currentDate);
      });

      return (
        <div key={horario} className="flex border-b border-neutral-200 min-h-[80px]">
          <div className="w-20 p-2 font-medium text-neutral-500 text-sm border-r border-neutral-200">
            {horario}
          </div>
          <div className="flex-1 p-2">
            {agendamentosNoHorario && agendamentosNoHorario.length > 0 ? (
              agendamentosNoHorario.map(renderAgendamentoCard)
            ) : null}
          </div>
        </div>
      );
    });
  };

  // Gerar visualização semanal
  const generateWeekView = () => {
    // Obter dias da semana
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    // Horários de trabalho
    const horarios = [];
    for (let hora = 8; hora < 20; hora++) {
      horarios.push(`${hora}:00`);
    }

    return (
      <div className="w-full border-collapse">
        {/* Cabeçalho com os dias da semana */}
        <div className="flex border-b border-neutral-200">
          <div className="w-20 p-2 font-medium text-neutral-500 text-sm"></div>
          {weekDays.map((day) => (
            <div 
              key={day.toISOString()} 
              className={cn(
                "flex-1 p-2 text-center border-l border-neutral-200",
                isToday(day) ? "bg-primary-light/10" : ""
              )}
            >
              <div className="font-medium">{format(day, "EEE", { locale: ptBR })}</div>
              <div className={cn(
                "text-sm", 
                isToday(day) ? "text-primary-light font-medium" : "text-neutral-500"
              )}>
                {format(day, "dd/MM")}
              </div>
            </div>
          ))}
        </div>

        {/* Linha para cada horário */}
        {horarios.map((horario) => (
          <div key={horario} className="flex border-b border-neutral-200 min-h-[100px]">
            <div className="w-20 p-2 font-medium text-neutral-500 text-sm border-r border-neutral-200">
              {horario}
            </div>

            {/* Coluna para cada dia */}
            {weekDays.map((day) => {
              // Encontrar agendamentos neste dia e horário
              const agendamentosNaHora = agendamentos?.filter((a: Agendamento) => {
                const horaInicio = a.horaInicio?.substring(0, 5);
                return horaInicio === horario && 
                       isSameDay(parseISO(a.data), day);
              });

              return (
                <div 
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 p-2 border-l border-neutral-200",
                    isToday(day) ? "bg-primary-light/5" : ""
                  )}
                >
                  {agendamentosNaHora && agendamentosNaHora.length > 0 ? (
                    agendamentosNaHora.map(renderAgendamentoCard)
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Gerar visualização mensal
  const generateMonthView = () => {
    // Obter primeiro dia do mês
    const monthStart = startOfMonth(currentDate);

    // Obter primeiro dia a ser exibido (primeira segunda-feira antes ou igual ao início do mês)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

    // Obter último dia do mês
    const monthEnd = endOfMonth(currentDate);

    // Obter todos os dias que serão exibidos no calendário (incluindo os dias que transbordarem)
    const calendarDays = eachDayOfInterval({ 
      start: calendarStart, 
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }) 
    });

    // Agrupar dias em semanas
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    calendarDays.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Nomes dos dias da semana
    const weekDayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

    return (
      <div className="w-full border-collapse">
        {/* Cabeçalho com os dias da semana */}
        <div className="grid grid-cols-7 border-b border-neutral-200">
          {weekDayNames.map((name) => (
            <div key={name} className="p-2 text-center font-medium text-neutral-500">
              {name}
            </div>
          ))}
        </div>

        {/* Células do calendário */}
        <div className="grid grid-cols-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-neutral-200">
              {week.map((day) => {
                // Encontrar agendamentos para este dia
                const dayAgendamentos = agendamentos?.filter((a: Agendamento) => 
                  isSameDay(parseISO(a.data), day)
                );

                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "min-h-[120px] p-1 border-r border-neutral-200 last:border-r-0",
                      !isSameMonth(day, currentDate) ? "bg-neutral-50" : "",
                      isToday(day) ? "bg-primary-light/5" : ""
                    )}
                  >
                    <div className={cn(
                      "text-right p-1 mb-1",
                      isSameMonth(day, currentDate) ? "font-medium" : "text-neutral-400",
                      isToday(day) ? "bg-primary-light text-white rounded-full w-7 h-7 flex items-center justify-center ml-auto" : ""
                    )}>
                      {getDate(day)}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayAgendamentos?.slice(0, 3).map((agendamento: Agendamento) => (
                        <div
                          key={agendamento.id}
                          onClick={() => onSelectAgendamento?.(agendamento)}
                          className={cn(
                            "px-1 py-0.5 text-xs rounded cursor-pointer truncate",
                            getStatusColor(agendamento.status)
                          )}
                        >
                          {formatHorario(agendamento.horaInicio)} - {agendamento.paciente?.usuario?.nome}
                        </div>
                      ))}

                      {dayAgendamentos && dayAgendamentos.length > 3 && (
                        <div className="text-xs text-center text-neutral-500">
                          +{dayAgendamentos.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar conteúdo baseado na visualização atual
  const renderCalendarContent = () => {
    // Mostrar mensagem de carregamento
    if (isLoadingAgendamentos) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // Para admin/secretaria, mostrar mensagem quando nenhum filtro estiver selecionado
    if (!isPsicologo && (selectedPsicologo === "nenhum" || selectedPsicologo === "") && (selectedFilial === "nenhuma" || selectedFilial === "")) {
      return (
        <div className="flex justify-center items-center p-12 h-full">
          <div className="text-center max-w-md p-6 bg-neutral-50 rounded-lg border border-neutral-200">
            <CalendarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">Selecione um filtro</h3>
            <p className="text-neutral-500">
              Para visualizar a agenda, selecione um psicólogo ou uma filial nos filtros acima.
            </p>
          </div>
        </div>
      );
    }

    // Renderizar o calendário de acordo com a visualização
    if (currentView === "day") {
      return generateDayView();
    } else if (currentView === "week") {
      return generateWeekView();
    } else if (currentView === "month") {
      return generateMonthView();
    }

    return null;
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
            {isPsicologo ? (
              // Para psicólogos, mostrar apenas um rótulo estático indicando que são seus agendamentos
              <div className="h-10 px-3 py-2 rounded-md border border-input flex items-center">
                <span className="text-sm text-muted-foreground">Meus agendamentos</span>
              </div>
            ) : (
              // Para admin e secretarias, permitir selecionar qualquer psicólogo
              <Select 
                value={selectedPsicologo} 
                onValueChange={(value) => {
                  console.log("Selecionado psicólogo:", value);
                  setSelectedPsicologo(value);
                }}
                disabled={isLoadingPsicologos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um psicólogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Selecione um psicólogo</SelectItem>
                  <SelectItem value="todos">Todos os psicólogos</SelectItem>
                  {psicologos?.map((psicologo: any) => (
                    <SelectItem 
                      key={psicologo.id} 
                      value={psicologo.id.toString()}
                    >
                      {psicologo.usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Select 
              value={selectedFilial} 
              onValueChange={(value) => {
                console.log("Selecionada filial:", value);
                setSelectedFilial(value);
              }}
              disabled={isLoadingFiliais}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Selecione uma filial</SelectItem>
                <SelectItem value="todas">Todas as filiais</SelectItem>
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
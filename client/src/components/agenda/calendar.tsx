import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingTip } from "@/components/onboarding/onboarding-tip";
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
  parseISO, 
  isSameDay, 
  isToday,
  isSameMonth, 
  getDate,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subMonths,
  addMonths,
  isWithinInterval,
  eachDayOfInterval,
  compareAsc,
  setDefaultOptions,
  getDay
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
  const [selectedPsicologo, setSelectedPsicologo] = useState<string>("todos");

  // Atualizar o filtro de psicólogo quando recebermos os dados do psicólogo do usuário
  // ou quando a prop psicologoId mudar
  useEffect(() => {
    if (isPsicologo && userPsicologoId) {
      // Psicólogo só pode ver seus próprios agendamentos
      setSelectedPsicologo(userPsicologoId.toString());
    } else if (psicologoId) {
      // Se recebemos o ID do psicólogo como prop, usar esse valor
      setSelectedPsicologo(psicologoId.toString());
    } else {
      // Por padrão, mostrar todos os psicólogos para admin/secretaria
      setSelectedPsicologo("todos");
    }
  }, [isPsicologo, userPsicologoId, psicologoId]);
  
  // Estado para a filial selecionada - inicializa com "todas"
  const [selectedFilial, setSelectedFilial] = useState<string>("todas");
  
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
      const formattedDate = currentDate.toISOString().split('T')[0];
      params.append("data", formattedDate);
      console.log("Buscando agendamentos para o dia:", formattedDate);
    } else if (currentView === "week") {
      // Obter primeiro e último dia da semana com uma margem de segurança
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      // Adicionar um dia extra ao final para garantir que toda a semana esteja incluída
      const end = addDays(endDate, 1);

      // Usar formato ISO para as datas
      const startFormatted = format(start, "yyyy-MM-dd");
      const endFormatted = format(end, "yyyy-MM-dd");

      // Adicionar logs para depuração
      console.log("Buscando agendamentos a partir de:", startFormatted);
      console.log("Até:", endFormatted);

      params.append("dataInicio", startFormatted);
      params.append("dataFim", endFormatted);
    } else if (currentView === "month") {
      // Obter primeiro e último dia do mês com uma margem de segurança
      // Incluir a semana anterior e posterior para mostrar dias adjacentes
      const start = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      // Adicionar um dia extra ao final para garantir que todo o mês esteja incluído
      const end = addDays(endDate, 1);

      // Usar formato ISO para as datas
      const startFormatted = format(start, "yyyy-MM-dd");
      const endFormatted = format(end, "yyyy-MM-dd");

      // Adicionar logs para depuração
      console.log("Buscando agendamentos a partir de:", startFormatted);
      console.log("Até:", endFormatted);

      params.append("dataInicio", startFormatted);
      params.append("dataFim", endFormatted);
    }

    // Se for psicólogo, sempre usa apenas seus próprios agendamentos
    if (isPsicologo && userPsicologoId) {
      params.append("psicologoId", userPsicologoId.toString());
    } 
    // Para admin/secretária, permite filtrar por psicólogo
    else if (!isPsicologo && selectedPsicologo && selectedPsicologo !== "todos") {
      params.append("psicologoId", selectedPsicologo);
      console.log("Aplicando filtro de psicólogo:", selectedPsicologo);
    }

    // Adicionar filtro de filial - certifique-se de que é um valor válido
    if (selectedFilial && selectedFilial !== "todas") {
      params.append("filialId", selectedFilial);
      console.log("Aplicando filtro de filial:", selectedFilial);
    }
    
    // Registro para depuração
    console.log("Filtros aplicados - Psicólogo:", selectedPsicologo, "Filial:", selectedFilial);

    console.log("Parâmetros de filtro completos:", Object.fromEntries(params.entries()));
    return params.toString();
  };

  // Construir query key baseado na visualização atual
  const buildQueryKey = () => {
    let dateParams = {};

    if (currentView === "day") {
      dateParams = { data: format(currentDate, "yyyy-MM-dd") };
    } else if (currentView === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      // Adicionar um dia extra ao final para garantir que toda a semana esteja incluída
      const end = addDays(endDate, 1);
      dateParams = { 
        dataInicio: format(start, "yyyy-MM-dd"),
        dataFim: format(end, "yyyy-MM-dd")
      };
    } else if (currentView === "month") {
      const start = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      // Adicionar um dia extra ao final para garantir que todo o mês esteja incluído
      const end = addDays(endDate, 1);
      dateParams = { 
        dataInicio: format(start, "yyyy-MM-dd"),
        dataFim: format(end, "yyyy-MM-dd")
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
  // Se for admin/secretaria, busca todos ou com filtros aplicados
  const shouldFetchAgendamentos = isPsicologo ? 
    !!userPsicologoId : 
    true; // Sempre buscar para admin/secretaria (mesmo sem filtros)

  // Buscar agendamentos
  const { data: agendamentos, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos", buildQueryKey()],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/agendamentos?${buildQueryParams()}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar agendamentos");
        }
        
        const data = await res.json();

        // Criar um Map para armazenar agendamentos únicos usando ID como chave
        const uniqueAgendamentos = new Map();

        // Log para depuração inicial
        console.log("Total de agendamentos recebidos:", data.length);
        console.log("Filtrando agendamentos a partir de:", format(currentDate, "yyyy-MM-dd"));
        
        // Log completo dos agendamentos no banco para depuração
        if (data.length > 0) {
          console.log("Total de agendamentos no banco:", data.length);
          data.forEach((ag: any) => {
            if (ag.data && ag.id) {
              console.log(`Agendamento ${ag.id}, data: ${ag.data}, incluído: ${
                currentView === "day" 
                  ? ag.data === format(currentDate, "yyyy-MM-dd")
                  : currentView === "week"
                    ? isWithinInterval(parseISO(ag.data), {
                        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                        end: endOfWeek(currentDate, { weekStartsOn: 1 })
                      })
                    : isWithinInterval(parseISO(ag.data), {
                        start: startOfMonth(currentDate),
                        end: endOfMonth(currentDate)
                      })
              }`);
            }
          });
        }
        
        // Processamento para garantir validade dos dados
        data.forEach((ag: any) => {
          // Verificações básicas
          if (!ag.data || !ag.id) return;
          
          try {
            // Converter string para data
            const agendamentoDate = parseISO(ag.data);
            
            // Verificar se a data é válida
            if (isNaN(agendamentoDate.getTime())) return;
            
            // Verificar se está no período correto com base na visão
            let isInPeriod = false;
            
            if (currentView === "day") {
              isInPeriod = isSameDay(agendamentoDate, currentDate);
            } else if (currentView === "week") {
              isInPeriod = isWithinInterval(agendamentoDate, {
                start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                end: endOfWeek(currentDate, { weekStartsOn: 1 })
              });
            } else if (currentView === "month") {
              isInPeriod = isWithinInterval(agendamentoDate, {
                start: startOfMonth(currentDate),
                end: endOfMonth(currentDate)
              });
            }
            
            if (!isInPeriod) return;
            
            // Aplicar filtros de psicólogo e filial
            if (isPsicologo && userPsicologoId && ag.psicologoId !== userPsicologoId) return;
            
            if (!isPsicologo && selectedPsicologo !== "todos" && ag.psicologoId.toString() !== selectedPsicologo) return;
            
            if (selectedFilial !== "todas" && ag.filialId?.toString() !== selectedFilial) return;
            
            // Adicionar ao Map usando ID como chave para garantir unicidade
            uniqueAgendamentos.set(ag.id, {
              ...ag,
              // Adicionar um objeto Date para facilitar comparações
              dateObj: agendamentoDate
            });
            
          } catch (error) {
            console.error(`Erro ao processar agendamento ${ag.id}:`, error);
            return;
          }
        });
        
        // Converter Map para array e ordenar por data e hora
        return Array.from(uniqueAgendamentos.values())
          .sort((a, b) => {
            // Ordenar primeiro por data, depois por hora
            const dateCompare = compareAsc(a.dateObj, b.dateObj);
            if (dateCompare === 0) {
              return a.horaInicio.localeCompare(b.horaInicio);
            }
            return dateCompare;
          });
      } catch (error) {
        console.error("Erro na busca de agendamentos:", error);
        return [];
      }
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
        
        // Certifique-se de que a data é válida antes de tentar analisar
        if (!a.data) return false;
        
        try {
          const agendamentoDate = parseISO(a.data);
          return horaInicio === horario && isSameDay(agendamentoDate, currentDate);
        } catch (error) {
          console.error(`Erro ao processar data do agendamento ${a.id}:`, error);
          return false;
        }
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
                
                // Certifique-se de que a data é válida antes de tentar analisar
                if (!a.data) return false;
                
                try {
                  const agendamentoDate = parseISO(a.data);
                  return horaInicio === horario && isSameDay(agendamentoDate, day);
                } catch (error) {
                  console.error(`Erro ao processar data do agendamento ${a.id}:`, error);
                  return false;
                }
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
                const dayAgendamentos = agendamentos?.filter((a: Agendamento) => {
                  // Certifique-se de que a data é válida antes de tentar analisar
                  if (!a.data) return false;
                  
                  try {
                    const agendamentoDate = parseISO(a.data);
                    return isSameDay(agendamentoDate, day);
                  } catch (error) {
                    console.error(`Erro ao processar data do agendamento ${a.id}:`, error);
                    return false;
                  }
                });

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
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Carregando agendamentos...</span>
        </div>
      );
    }

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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{getCurrentPeriodTitle()}</CardTitle>
            {/* Exibição dos filtros selecionados */}
            <div className="text-sm text-neutral-500 mt-1">
              {selectedPsicologo !== "todos" && psicologos ? (
                <span className="inline-flex items-center mr-2">
                  Psicólogo: {psicologos.find((p: any) => p.id.toString() === selectedPsicologo)?.usuario?.nome || "Carregando..."}
                </span>
              ) : !isPsicologo ? (
                <span className="inline-flex items-center mr-2">Psicólogo: Todos</span>
              ) : null}
              
              {selectedFilial !== "todas" && filiais ? (
                <span className="inline-flex items-center">
                  Filial: {filiais.find((f: any) => f.id.toString() === selectedFilial)?.nome || "Carregando..."}
                </span>
              ) : (
                <span className="inline-flex items-center">Filial: Todas</span>
              )}
              
              {/* Dica de onboarding para a agenda */}
              <OnboardingTip
                id="agenda-scheduling"
                title="Gerenciamento de Agenda"
                side="bottom"
                align="start"
                delayMs={1500}
                className="ml-3"
              >
                <p>
                  Aqui você pode visualizar e gerenciar todos os agendamentos.
                </p>
                <p className="mt-1">
                  Use os controles acima para navegar entre os dias, semanas ou meses, e os filtros para encontrar agendamentos específicos.
                </p>
                <p className="mt-1">
                  Clique em um agendamento para visualizar seus detalhes ou editá-lo.
                </p>
              </OnboardingTip>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
            >
              Hoje
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Select 
              value={currentView} 
              onValueChange={(value) => setCurrentView(value as "day" | "week" | "month")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Controles para filtrar por psicólogo e filial */}
        {(!isPsicologo || isLoadingPsicologoUsuario) && (
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {/* Filtro de Psicólogo - apenas para admin/secretaria */}
            {!isPsicologo && (
              <div className="flex-1">
                <Select 
                  value={selectedPsicologo} 
                  onValueChange={setSelectedPsicologo}
                  disabled={isLoadingPsicologos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um psicólogo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os psicólogos</SelectItem>
                    {psicologos?.map((psicologo: any) => (
                      <SelectItem 
                        key={psicologo.id} 
                        value={psicologo.id.toString()}
                      >
                        {psicologo.usuario?.nome || `Psicólogo #${psicologo.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtro de Filial - para todos os usuários */}
            <div className="flex-1">
              <Select 
                value={selectedFilial} 
                onValueChange={setSelectedFilial}
                disabled={isLoadingFiliais}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as filiais</SelectItem>
                  {filiais?.map((filial: any) => (
                    <SelectItem 
                      key={filial.id} 
                      value={filial.id.toString()}
                    >
                      {filial.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="rounded border border-neutral-200 overflow-hidden">
          {renderCalendarContent()}
        </div>

        {/* Legenda dos status */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
            <span className="text-xs text-neutral-600">Agendado</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span className="text-xs text-neutral-600">Confirmado</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span className="text-xs text-neutral-600">Realizado</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
            <span className="text-xs text-neutral-600">Cancelado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
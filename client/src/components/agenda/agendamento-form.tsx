import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAgendamentoSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";

// Opções para status de agendamento
const statusOptions = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "cancelado", label: "Cancelado" },
  { value: "realizado", label: "Realizado" }
];

// Configurações de horário da clínica baseadas no servidor
const HORARIO_CLINICA = {
  // Segunda a Sexta (1-5)
  SEMANA: {
    abertura: "08:00",
    fechamento: "21:00",
    ultimoAgendamento: "20:30" // Para sessões de 30 minutos
  },
  // Sábado (6)
  SABADO: {
    abertura: "08:00",
    fechamento: "15:00",
    ultimoAgendamento: "14:30" // Para sessões de 30 minutos
  }
};

// Função para gerar horários baseados no dia da semana
function gerarHorariosDisponiveis(data: Date): string[] {
  const diaSemana = data.getDay(); // 0 = Domingo, 1-5 = Segunda a Sexta, 6 = Sábado
  
  // Se for domingo, não há horários disponíveis
  if (diaSemana === 0) {
    return [];
  }
  
  // Definir horários com base no dia da semana
  const horarios = diaSemana === 6 ? HORARIO_CLINICA.SABADO : HORARIO_CLINICA.SEMANA;
  
  // Extrair horas e minutos de inicio e fim
  const [horaInicio, minInicio] = horarios.abertura.split(':').map(Number);
  const [horaUltimo, minUltimo] = horarios.ultimoAgendamento.split(':').map(Number);
  
  const horariosDisponiveis: string[] = [];
  
  // Gerar horários de 30 em 30 minutos dentro do intervalo de funcionamento
  for (let hora = horaInicio; hora <= horaUltimo; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      // Verificar se não excede o último horário permitido
      if (hora === horaUltimo && minuto > minUltimo) {
        continue;
      }
      
      const horaStr = hora.toString().padStart(2, '0');
      const minutoStr = minuto.toString().padStart(2, '0');
      horariosDisponiveis.push(`${horaStr}:${minutoStr}`);
    }
  }
  
  return horariosDisponiveis;
}

// Os horários serão gerados dinamicamente com base na data selecionada

// Schema com validações adicionais para o formulário
const agendamentoFormSchema = insertAgendamentoSchema.extend({
  data: z.date({
    required_error: "A data é obrigatória",
  }),
  horaInicio: z.string({
    required_error: "A hora de início é obrigatória",
  }),
  horaFim: z.string({
    required_error: "A hora de término é obrigatória",
  }),
  psicologoId: z.coerce.number({
    required_error: "O psicólogo é obrigatório",
  }),
  pacienteId: z.coerce.number({
    required_error: "O paciente é obrigatório",
  }),
  filialId: z.coerce.number({
    required_error: "A filial é obrigatória",
  }),
  salaId: z.coerce.number().optional(),
  planoSaudeId: z.coerce.number().optional(),
  particular: z.boolean().default(false),
  valorConsulta: z.coerce.number().optional(),
  tipoAtendimento: z.string({
    required_error: "O tipo de atendimento é obrigatório",
  }),
  status: z.string({
    required_error: "O status é obrigatório",
  }).default("agendado"),
  observacao: z.string().optional(),
  remoto: z.boolean().default(false),
  sublocacao: z.boolean().default(false),
});

interface AgendamentoFormProps {
  agendamentoId?: number;
  defaultDate?: Date;
  onSuccess: (data?: any) => void;
  onCanceled?: () => void;
}

export default function AgendamentoForm({ agendamentoId, defaultDate, onSuccess, onCanceled }: AgendamentoFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [pacientePlanos, setPacientePlanos] = useState<any[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  // Configuração do formulário com valores padrão
  const form = useForm<z.infer<typeof agendamentoFormSchema>>({
    resolver: zodResolver(agendamentoFormSchema),
    defaultValues: {
      data: defaultDate || new Date(),
      horaInicio: "09:00",
      horaFim: "09:30",
      status: "agendado",
      tipoAtendimento: "retorno",
      particular: false,
      remoto: false,
      sublocacao: false,
      observacao: "",
    },
  });

  // Carregar dados do agendamento se estiver editando
  const { data: agendamentoAtual, isLoading: isLoadingAgendamento } = useQuery({
    queryKey: ["/api/agendamentos", agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return null;
      const res = await apiRequest("GET", `/api/agendamentos/${agendamentoId}`);
      return res.json();
    },
    enabled: !!agendamentoId,
  });

  // Buscar psicólogos
  const { data: psicologos, isLoading: isLoadingPsicologos } = useQuery({
    queryKey: ["/api/psicologos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/psicologos");
      return res.json();
    },
  });

  // Buscar pacientes
  const { data: pacientes, isLoading: isLoadingPacientes } = useQuery({
    queryKey: ["/api/pacientes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/pacientes");
      return res.json();
    },
  });

  // Buscar filiais
  const { data: filiais, isLoading: isLoadingFiliais } = useQuery({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filiais");
      return res.json();
    },
  });

  // Buscar salas com base na filial selecionada
  const { data: salas, isLoading: isLoadingSalas } = useQuery({
    queryKey: ["/api/salas", form.watch("filialId")],
    queryFn: async () => {
      const filialId = form.watch("filialId");
      if (!filialId) return [];
      const res = await apiRequest("GET", `/api/salas?filialId=${filialId}`);
      return res.json();
    },
    enabled: !!form.watch("filialId"),
  });

  // Resetar sala quando filial muda
  useEffect(() => {
    form.setValue("salaId", undefined);
  }, [form.watch("filialId")]);

  // Buscar planos de saúde
  const { data: planosSaude, isLoading: isLoadingPlanosSaude } = useQuery({
    queryKey: ["/api/planos-saude"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/planos-saude");
      return res.json();
    },
  });

  // Mutation para salvar o agendamento
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof agendamentoFormSchema>) => {
      // Formatar data ISO 8601
      const dataFormatada = format(values.data, "yyyy-MM-dd");

      // Criar objeto de agendamento para enviar ao servidor
      const agendamentoData = {
        ...values,
        data: dataFormatada,
      };
      
      // Garantir que existe um filialId válido mesmo para agendamentos remotos
      if (values.remoto && !values.filialId && filiais && filiais.length > 0) {
        agendamentoData.filialId = filiais[0].id;
      }

      if (agendamentoId) {
        // Editar existente
        const res = await apiRequest("PUT", `/api/agendamentos/${agendamentoId}`, agendamentoData);
        return res.json();
      } else {
        // Criar novo
        const res = await apiRequest("POST", "/api/agendamentos", agendamentoData);
        return res.json();
      }
    },
    onSuccess: (data) => {
      setIsSaving(false);
      // Sempre passar os dados para as funções de callback
      if (data?.status === "cancelado") {
        // Se for cancelado, chamar onCanceled
        if (onCanceled) {
          onCanceled();
        } else {
          onSuccess(data);
        }
      } else {
        // Para outros status, passar os dados para onSuccess
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error("Erro ao salvar agendamento:", error);
      setIsSaving(false);
    },
  });

  // Preencher formulário quando estiver editando e dados carregarem
  useEffect(() => {
    if (agendamentoAtual) {
      form.reset({
        pacienteId: agendamentoAtual.pacienteId,
        psicologoId: agendamentoAtual.psicologoId,
        filialId: agendamentoAtual.filialId,
        salaId: agendamentoAtual.salaId || undefined,
        data: new Date(agendamentoAtual.data),
        horaInicio: agendamentoAtual.horaInicio?.substring(0, 5) || "09:00",
        horaFim: agendamentoAtual.horaFim?.substring(0, 5) || "09:30",
        tipoAtendimento: agendamentoAtual.tipoAtendimento,
        status: agendamentoAtual.status,
        observacao: agendamentoAtual.observacao || "",
        planoSaudeId: agendamentoAtual.planoSaudeId || undefined,
        particular: agendamentoAtual.particular || false,
        remoto: agendamentoAtual.remoto || false,
        sublocacao: agendamentoAtual.sublocacao || false,
        valorConsulta: agendamentoAtual.valorConsulta,
      });
    }
  }, [agendamentoAtual, form]);

  // Buscar planos vinculados ao paciente quando o paciente é selecionado
  useEffect(() => {
    const fetchPacientePlanos = async () => {
      const pacienteId = form.watch("pacienteId");
      if (!pacienteId) {
        setPacientePlanos([]);
        return;
      }

      try {
        const res = await apiRequest("GET", `/api/pacientes/${pacienteId}/planos-saude`);
        const data = await res.json();
        setPacientePlanos(data);
      } catch (error) {
        console.error("Erro ao buscar planos do paciente:", error);
        setPacientePlanos([]);
      }
    };

    fetchPacientePlanos();
  }, [form.watch("pacienteId")]);

  // Atualizar os horários disponíveis baseados na data selecionada
  useEffect(() => {
    const dataSelecionada = form.watch("data");
    if (dataSelecionada) {
      // Gerar novos horários com base na data
      const novosHorarios = gerarHorariosDisponiveis(dataSelecionada);
      setHorariosDisponiveis(novosHorarios);
      
      // Se não houver horários disponíveis ou o horário selecionado não estiver disponível,
      // selecionar o primeiro horário disponível ou limpar
      const horaInicioAtual = form.watch("horaInicio");
      if (novosHorarios.length > 0) {
        if (!novosHorarios.includes(horaInicioAtual)) {
          form.setValue("horaInicio", novosHorarios[0]);
        }
      } else {
        // Se não há horários disponíveis, limpar
        form.setValue("horaInicio", "");
        form.setValue("horaFim", "");
      }
    }
  }, [form.watch("data"), form]);

  // Atualizar hora de término automaticamente (+30 minutos após hora de início)
  useEffect(() => {
    const horaInicio = form.watch("horaInicio");
    if (horaInicio) {
      try {
        const [hours, minutes] = horaInicio.split(":").map(Number);
        const dataBase = new Date();
        dataBase.setHours(hours, minutes, 0, 0);

        const novaHoraFim = addMinutes(dataBase, 30);
        const horaFimFormatada = format(novaHoraFim, "HH:mm");

        form.setValue("horaFim", horaFimFormatada);
      } catch (error) {
        console.error("Erro ao calcular hora fim:", error);
      }
    }
  }, [form.watch("horaInicio"), form]);

  // Hook para toast
  const { toast } = useToast();
  
  // Mutation para validar disponibilidade de horário
  const validarMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, horaInicio, horaFim, psicologoId } = values;
      const dataFormatada = format(data, "yyyy-MM-dd");
      
      const res = await apiRequest("POST", "/api/agendamentos/validar", {
        data: dataFormatada,
        horaInicio,
        horaFim,
        psicologoId,
        agendamentoId
      });
      
      return res.json();
    }
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof agendamentoFormSchema>) => {
    setIsSaving(true);
    
    // Se o status for "cancelado", não precisa validar disponibilidade
    if (values.status === "cancelado") {
      try {
        // Formatar data ISO 8601
        const dataFormatada = format(values.data, "yyyy-MM-dd");

        // Criar objeto de agendamento para enviar ao servidor
        const agendamentoData = {
          ...values,
          data: dataFormatada,
        };
        
        // Garantir que existe um filialId válido mesmo para agendamentos remotos
        if (values.remoto && !values.filialId && filiais && filiais.length > 0) {
          agendamentoData.filialId = filiais[0].id;
        }

        if (agendamentoId) {
          // Editar existente
          await apiRequest("PUT", `/api/agendamentos/${agendamentoId}`, agendamentoData);
        } else {
          // Criar novo
          await apiRequest("POST", "/api/agendamentos", agendamentoData);
        }
        
        // Invalidar consultas e fechar o modal
        queryClient.invalidateQueries({ queryKey: ["/api/agendamentos"] });
        setIsSaving(false);
        
        // Se o status for cancelado, sempre usar onCanceled para não mostrar toast
        if (values.status === "cancelado" && onCanceled) {
          onCanceled();
        } else {
          onSuccess({ status: values.status });
        }
      } catch (error: any) {
        console.error("Erro ao salvar agendamento:", error);
        
        // Mostrar erro específico do servidor se disponível
        if (error.response) {
          try {
            const errorData = await error.response.json();
            toast({
              title: "Erro ao salvar agendamento",
              description: errorData.mensagem || "Ocorreu um erro ao salvar o agendamento.",
              variant: "destructive"
            });
          } catch {
            toast({
              title: "Erro ao salvar agendamento",
              description: "Ocorreu um erro ao salvar o agendamento.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Erro ao salvar agendamento",
            description: "Ocorreu um erro ao salvar o agendamento.",
            variant: "destructive"
          });
        }
        
        setIsSaving(false);
      }
    } else {
      // Para outros status, validar disponibilidade antes de salvar
      try {
        // Validar disponibilidade
        const validacao = await validarMutation.mutateAsync({
          data: values.data,
          horaInicio: values.horaInicio,
          horaFim: values.horaFim,
          psicologoId: values.psicologoId
        });
        
        if (!validacao.valido) {
          // Mostrar mensagem de erro
          toast({
            title: "Horário indisponível",
            description: validacao.mensagem,
            variant: "destructive"
          });
          setIsSaving(false);
          return;
        }
        
        // Se disponível, salvar o agendamento
        mutation.mutate(values);
      } catch (error: any) {
        console.error("Erro ao validar disponibilidade:", error);
        
        toast({
          title: "Erro ao validar disponibilidade",
          description: "Não foi possível verificar a disponibilidade do horário.",
          variant: "destructive"
        });
        
        setIsSaving(false);
      }
    }
  };

  // Verificar se está carregando
  const isLoading = isLoadingAgendamento || isLoadingPsicologos || isLoadingPacientes || 
                   isLoadingFiliais || isLoadingSalas || isLoadingPlanosSaude;

  return (
    <div className="space-y-4 py-2 pb-4 max-h-[85vh] overflow-y-auto">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando...</span>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção de informações principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo de Paciente - esconder para psicólogos */}
              {useAuth().user?.tipo !== 'psicologo' ? (
                <FormField
                  control={form.control}
                  name="pacienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o paciente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pacientes?.map((paciente: any) => (
                            <SelectItem 
                              key={paciente.id} 
                              value={paciente.id.toString()}
                            >
                              {paciente.usuario?.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                // Para psicólogos, usar um campo hidden com valor fixo
                <input 
                  type="hidden" 
                  {...form.register("pacienteId")} 
                />
              )}

              <FormField
                control={form.control}
                name="psicologoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Psicólogo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o psicólogo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {psicologos?.map((psicologo: any) => (
                          <SelectItem 
                            key={psicologo.id} 
                            value={psicologo.id.toString()}
                          >
                            {psicologo.usuario?.nome} ({psicologo.crp})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="horaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Início</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a hora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {horariosDisponiveis.length > 0 ? (
                            horariosDisponiveis.map((hora) => (
                              <SelectItem key={hora} value={hora}>
                                {hora}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="indisponivel">
                              Não há horários disponíveis neste dia
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Fim</FormLabel>
                      <Input 
                        {...field} 
                        disabled 
                        placeholder="Calculado automaticamente" 
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="filialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filial</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a filial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sala</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a sala" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salas?.map((sala: any) => (
                          <SelectItem 
                            key={sala.id} 
                            value={sala.id.toString()}
                          >
                            {sala.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoAtendimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atendimento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primeira_consulta">
                          Primeira consulta
                        </SelectItem>
                        <SelectItem value="retorno">
                          Retorno
                        </SelectItem>
                        <SelectItem value="avaliacao">
                          Avaliação
                        </SelectItem>
                        <SelectItem value="emergencia">
                          Emergência
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção de informações adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-medium mb-2">Informações adicionais</h3>
              </div>
              
              <FormField
                control={form.control}
                name="remoto"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Atendimento Remoto</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sublocacao"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Sublocação</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="particular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Atendimento Particular</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            // Se marcado como particular, limpar plano de saúde
                            form.setValue("planoSaudeId", undefined);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch("particular") && (
                <FormField
                  control={form.control}
                  name="planoSaudeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Saúde</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pacientePlanos.length > 0 ? (
                            pacientePlanos.map((pacientePlano: any) => (
                              <SelectItem 
                                key={pacientePlano.planoSaudeId || pacientePlano.planoSaude?.id} 
                                value={(pacientePlano.planoSaudeId || pacientePlano.planoSaude?.id).toString()}
                              >
                                {pacientePlano.planoSaude?.nome || pacientePlano.nome}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="nenhum_plano">
                              Nenhum plano encontrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("particular") && (
                <FormField
                  control={form.control}
                  name="valorConsulta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Consulta (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0.00"
                          min="0" 
                          step="0.01"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Observações sobre o agendamento"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCanceled}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : agendamentoId ? "Atualizar" : "Agendar"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
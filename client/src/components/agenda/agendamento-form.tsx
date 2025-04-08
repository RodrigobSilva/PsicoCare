import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAgendamentoSchema } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { format, addMinutes, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  CheckIcon,
  ChevronsUpDown,
  Clock, 
  Loader2 
} from "lucide-react";

// Tipos de atendimento
const tiposAtendimento = [
  { value: "primeira_consulta", label: "Primeira Consulta" },
  { value: "retorno", label: "Retorno" },
  { value: "avaliacao", label: "Avaliação" },
  { value: "acompanhamento", label: "Acompanhamento" },
  { value: "terapia", label: "Terapia" },
  { value: "orientacao", label: "Orientação" }
];

// Status de agendamento
const statusAgendamento = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "realizado", label: "Realizado" }
];

// Opções de horário para agendamento (de 30 em 30 minutos)
const horariosDisponiveis: string[] = [];
for (let hours = 8; hours < 20; hours++) {
  for (let minutes = 0; minutes < 60; minutes += 30) {
    const hour = hours.toString().padStart(2, '0');
    const minute = minutes.toString().padStart(2, '0');
    horariosDisponiveis.push(`${hour}:${minute}`);
  }
}

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
  onSuccess: () => void;
}

export default function AgendamentoForm({ agendamentoId, defaultDate, onSuccess }: AgendamentoFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [pacientePlanos, setPacientePlanos] = useState<any[]>([]);

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
      const res = await apiRequest("GET", `/api/salas`);
      const allSalas = await res.json();
      // Filtrar apenas salas da filial selecionada
      return allSalas.filter((sala: any) => sala.filialId === filialId);
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
    onSuccess: () => {
      setIsSaving(false);
      onSuccess();
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

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof agendamentoFormSchema>) => {
    setIsSaving(true);
    mutation.mutate(values);
  };

  // Verificar se está carregando
  const isLoading = isLoadingAgendamento || isLoadingPsicologos || isLoadingPacientes || 
                   isLoadingFiliais || isLoadingSalas || isLoadingPlanosSaude;

  return (
    <div className="space-y-4 py-2 pb-4">
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
              <FormField
                control={form.control}
                name="pacienteId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Paciente</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                      }}
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
                          {horariosDisponiveis.map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
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
                  name="horaFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Fim</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={true} // Desabilitado pois é calculado automaticamente
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Hora de término" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {horariosDisponiveis.map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      disabled={!form.watch("filialId") || form.watch("remoto")}
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
                            {sala.nome} - {sala.descricao || "Sala de atendimento"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Seção de tipo e status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {tiposAtendimento.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
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
                        {statusAgendamento.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Opções de pagamento */}
            <div>
              <h3 className="text-lg font-medium mb-2">Informações de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="particular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Se particular for marcado, limpar plano de saúde
                              if (checked) {
                                form.setValue("planoSaudeId", undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Particular</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remoto"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Se remoto for marcado, limpar sala
                              if (checked) {
                                form.setValue("salaId", undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Atendimento Remoto</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sublocacao"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sublocação</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="planoSaudeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano de Saúde</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString()}
                          disabled={form.watch("particular")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pacientePlanos.length > 0 ? (
                              pacientePlanos.map((plano: any) => (
                                <SelectItem 
                                  key={plano.planoSaudeId} 
                                  value={plano.planoSaudeId.toString()}
                                >
                                  {plano.planoSaude?.nome} - {plano.numeroCarteirinha}
                                </SelectItem>
                              ))
                            ) : (
                              planosSaude?.map((plano: any) => (
                                <SelectItem
                                  key={plano.id}
                                  value={plano.id.toString()}
                                >
                                  {plano.nome}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {pacientePlanos.length === 0 && form.watch("pacienteId") && (
                          <p className="text-sm text-yellow-600 mt-1">
                            Paciente sem planos vinculados.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valorConsulta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Consulta (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => {
                              // Converter para centavos se houver valor
                              const value = e.target.value 
                                ? parseInt(e.target.value) * 100
                                : undefined;
                              field.onChange(value);
                            }}
                            value={field.value ? (field.value / 100).toString() : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informe detalhes adicionais sobre o agendamento..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de ação */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onSuccess()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    {agendamentoId ? "Atualizar" : "Agendar"} Consulta
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
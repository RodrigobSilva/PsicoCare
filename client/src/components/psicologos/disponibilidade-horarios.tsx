import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Clock, Plus, X, Calendar } from "lucide-react";

// Constantes para horário de funcionamento da clínica
const HORARIO_CLINICA_INICIO = "08:00";
const HORARIO_CLINICA_FIM = "21:00";

// Dias da semana para uso no formulário
const diasSemana = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

// Esquema de validação para um horário
const horarioSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horaInicio: z.string()
    .refine((hora) => hora >= HORARIO_CLINICA_INICIO && hora <= HORARIO_CLINICA_FIM, {
      message: `O horário de início deve estar entre ${HORARIO_CLINICA_INICIO} e ${HORARIO_CLINICA_FIM}`,
    }),
  horaFim: z.string()
    .refine((hora) => hora >= HORARIO_CLINICA_INICIO && hora <= HORARIO_CLINICA_FIM, {
      message: `O horário de fim deve estar entre ${HORARIO_CLINICA_INICIO} e ${HORARIO_CLINICA_FIM}`,
    }),
  remoto: z.boolean().default(false),
}).refine(
  (data) => data.horaInicio < data.horaFim,
  {
    message: "O horário de início deve ser anterior ao horário de fim",
    path: ["horaFim"],
  }
);

type Horario = z.infer<typeof horarioSchema>;

interface DisponibilidadeHorariosProps {
  value: Horario[];
  onChange: (value: Horario[]) => void;
}

export function DisponibilidadeHorarios({ value, onChange }: DisponibilidadeHorariosProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Inicializar formulário
  const form = useForm<Horario>({
    resolver: zodResolver(horarioSchema),
    defaultValues: {
      diaSemana: 1,
      horaInicio: "08:00",
      horaFim: "09:00",
      remoto: false,
    },
  });

  // Lidar com adição/edição de disponibilidade
  const onSubmit = (data: Horario) => {
    console.log("Submetendo horário:", data);

    // Verificar se já existe um horário igual para o mesmo dia
    const horarioExistente = value.some((horario, idx) => {
      // Ignorar o próprio horário quando estiver editando
      if (editingIndex !== null && idx === editingIndex) return false;
      
      return (
        horario.diaSemana === data.diaSemana &&
        ((horario.horaInicio <= data.horaInicio && data.horaInicio < horario.horaFim) ||
         (horario.horaInicio < data.horaFim && data.horaFim <= horario.horaFim) ||
         (data.horaInicio <= horario.horaInicio && horario.horaFim <= data.horaFim))
      );
    });

    if (horarioExistente) {
      toast({
        title: "Conflito de horário",
        description: "Já existe um horário cadastrado que se sobrepõe a este.",
        variant: "destructive",
      });
      return;
    }

    // Criar uma cópia do valor atual para evitar mutações
    let novosHorarios = [...value];

    if (editingIndex !== null) {
      // Atualizar horário existente
      novosHorarios[editingIndex] = { ...data };
    } else {
      // Adicionar novo horário
      novosHorarios.push({ ...data });
    }

    // Atualizar os horários
    onChange(novosHorarios);

    // Feedback após salvar com sucesso
    toast({
      title: editingIndex !== null ? "Horário atualizado" : "Horário adicionado",
      description: "As alterações foram salvas com sucesso."
    });

    // Limpar o formulário e fechar o diálogo
    setDialogOpen(false);
    setEditingIndex(null);
    
    // Reset do formulário para valores padrão para a próxima adição
    form.reset({
      diaSemana: 1,
      horaInicio: "08:00",
      horaFim: "09:00",
      remoto: false,
    });
  };

  // Abrir diálogo para adicionar novo horário
  const handleAddHorario = () => {
    form.reset({
      diaSemana: 1,
      horaInicio: "08:00",
      horaFim: "09:00",
      remoto: false,
    });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  // Abrir diálogo para editar horário existente
  const handleEditHorario = (index: number) => {
    console.log("Editando horário no índice:", index);
    
    // Encontrar o índice correto no array original (não ordenado)
    const horarioParaEditar = horariosSorted[index];
    const indexNoArrayOriginal = value.findIndex(h => 
      h.diaSemana === horarioParaEditar.diaSemana && 
      h.horaInicio === horarioParaEditar.horaInicio && 
      h.horaFim === horarioParaEditar.horaFim &&
      h.remoto === horarioParaEditar.remoto
    );
    
    if (indexNoArrayOriginal === -1) {
      console.error("Horário não encontrado no array original");
      toast({
        title: "Erro",
        description: "Não foi possível encontrar o horário para editar",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Editando horário do índice original:", indexNoArrayOriginal);
    
    // Usar o horário original e configurar o índice correto
    const horario = value[indexNoArrayOriginal];
    form.reset(horario);
    setEditingIndex(indexNoArrayOriginal);
    setDialogOpen(true);
  };

  // Remover horário
  const handleRemoveHorario = (index: number) => {
    console.log("Removendo horário no índice:", index);
    
    // Encontrar o índice correto no array original (não ordenado)
    const horarioParaRemover = horariosSorted[index];
    const indexNoArrayOriginal = value.findIndex(h => 
      h.diaSemana === horarioParaRemover.diaSemana && 
      h.horaInicio === horarioParaRemover.horaInicio && 
      h.horaFim === horarioParaRemover.horaFim &&
      h.remoto === horarioParaRemover.remoto
    );
    
    if (indexNoArrayOriginal === -1) {
      console.error("Horário não encontrado no array original");
      toast({
        title: "Erro",
        description: "Não foi possível encontrar o horário para remover",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Removendo horário do índice original:", indexNoArrayOriginal);
    
    // Criar uma cópia do array e remover o item
    const novosHorarios = [...value];
    novosHorarios.splice(indexNoArrayOriginal, 1);
    
    // Atualizar o estado
    onChange(novosHorarios);
    
    toast({
      title: "Horário removido",
      description: "O horário foi removido com sucesso"
    });
  };

  // Ordenar horários por dia da semana e hora de início
  const horariosSorted = [...value].sort((a, b) => {
    if (a.diaSemana !== b.diaSemana) {
      return a.diaSemana - b.diaSemana;
    }
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  // Obter o nome do dia da semana
  const getNomeDiaSemana = (diaSemana: number) => {
    return diasSemana.find(dia => dia.value === diaSemana)?.label || "";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Horários Disponíveis</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleAddHorario}
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Adicionar Horário
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        {horariosSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-neutral-500">
            <Calendar className="h-8 w-8 mb-2 opacity-50" />
            <p>Nenhum horário cadastrado</p>
            <p className="text-sm">Clique em "Adicionar Horário" para começar</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {horariosSorted.map((horario, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-neutral-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{getNomeDiaSemana(horario.diaSemana)}</span>
                  <div className="flex items-center text-sm text-neutral-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{horario.horaInicio} - {horario.horaFim}</span>
                  </div>
                  {horario.remoto && (
                    <span className="text-xs text-blue-600 mt-1">
                      Atendimento Remoto Disponível
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEditHorario(index)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    disabled={value.length <= 1}
                    onClick={() => handleRemoveHorario(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          // Se estiver fechando o diálogo
          if (!open) {
            setDialogOpen(false);
            setEditingIndex(null);
            // Reset do formulário para o próximo uso
            form.reset({
              diaSemana: 1,
              horaInicio: "08:00",
              horaFim: "09:00",
              remoto: false,
            });
          } else {
            setDialogOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Editar Horário" : "Adicionar Horário"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="diaSemana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Semana</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {diasSemana.map((dia) => (
                          <SelectItem key={dia.value} value={dia.value.toString()}>
                            {dia.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Inicial</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Final</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remoto"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Disponível para Atendimento Remoto
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingIndex(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
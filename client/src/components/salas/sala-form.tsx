import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertSalaSchema } from "@shared/schema";

// Esquema com validações adicionais
const salaFormSchema = insertSalaSchema.extend({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  filialId: z.number().min(1, "Selecione uma filial"),
  capacidade: z.number().min(1, "A capacidade deve ser pelo menos 1").optional(),
  descricao: z.string().optional(),
  recursos: z.string().optional(),
  ativa: z.boolean().default(true),
});

type SalaFormValues = z.infer<typeof salaFormSchema>;

interface SalaFormProps {
  salaId?: number | null;
  defaultFilialId?: number | null;
  onSuccess: () => void;
}

export default function SalaForm({ salaId, defaultFilialId, onSuccess }: SalaFormProps) {
  // Buscar dados da sala se estiver editando
  const { data: sala, isLoading } = useQuery({
    queryKey: ["/api/salas", salaId],
    queryFn: async () => {
      if (!salaId) return null;
      const res = await apiRequest("GET", `/api/salas/${salaId}`);
      return await res.json();
    },
    enabled: !!salaId,
  });

  // Buscar lista de filiais
  const { data: filiais } = useQuery({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filiais");
      return await res.json();
    },
  });

  // Configurar formulário
  const form = useForm<SalaFormValues>({
    resolver: zodResolver(salaFormSchema),
    defaultValues: {
      nome: "",
      filialId: defaultFilialId || 0,
      capacidade: 1,
      descricao: "",
      recursos: "",
      ativa: true,
    },
  });

  // Atualizar valores do formulário quando a sala for carregada
  useEffect(() => {
    if (sala) {
      form.reset({
        nome: sala.nome,
        filialId: sala.filialId,
        capacidade: sala.capacidade || 1,
        descricao: sala.descricao || "",
        recursos: sala.recursos || "",
        ativa: sala.ativa,
      });
    }
  }, [sala, form]);

  // Configurar mutação para criar/atualizar sala
  const mutation = useMutation({
    mutationFn: async (data: SalaFormValues) => {
      const response = await apiRequest(
        salaId ? "PUT" : "POST",
        salaId ? `/api/salas/${salaId}` : "/api/salas",
        data
      );
      if (!response.ok) {
        throw new Error("Erro ao salvar sala");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salas"] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Erro ao salvar sala:", error);
      throw error;
    }
  });

  // Handler de submit
  const onSubmit = (data: SalaFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Sala</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome da sala" {...field} />
              </FormControl>
              <FormDescription>
                Nome ou número de identificação da sala.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filialId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Filial</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(Number(value))} 
                defaultValue={field.value ? String(field.value) : undefined}
                value={field.value ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filiais && filiais.map((filial: any) => (
                    <SelectItem key={filial.id} value={String(filial.id)}>
                      {filial.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Filial onde esta sala está localizada.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidade</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  placeholder="1" 
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Número máximo de pessoas que a sala comporta.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva a sala..." 
                  className="resize-none" 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Descrição geral da sala e suas características.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recursos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recursos Disponíveis</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Liste os recursos disponíveis na sala..." 
                  className="resize-none" 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Recursos como equipamentos, móveis, etc. disponíveis nesta sala.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status da Sala</FormLabel>
                <FormDescription>
                  {field.value ? "A sala está ativa e disponível para uso" : "A sala está inativa e não disponível para agendamentos"}
                </FormDescription>
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

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending || isLoading}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {salaId ? "Atualizar Sala" : "Cadastrar Sala"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
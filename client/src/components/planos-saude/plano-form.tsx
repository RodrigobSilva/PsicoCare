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
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertPlanoSaudeSchema } from "@shared/schema";

// Esquema com validações adicionais
const planoFormSchema = insertPlanoSaudeSchema.extend({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  codigo: z.string().optional(),
  valorConsulta: z.number().min(0, "O valor não pode ser negativo").optional(),
  percentualRepasse: z.number().min(0, "O percentual não pode ser negativo").max(100, "O percentual não pode exceder 100%").optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
});

type PlanoFormValues = z.infer<typeof planoFormSchema>;

interface PlanoFormProps {
  planoId?: number | null;
  onSuccess: () => void;
}

export default function PlanoForm({ planoId, onSuccess }: PlanoFormProps) {
  const { toast } = useToast();
  
  // Buscar dados do plano se estiver editando
  const { data: plano, isLoading } = useQuery({
    queryKey: ["/api/planos-saude", planoId],
    queryFn: async () => {
      if (!planoId) return null;
      const res = await apiRequest("GET", `/api/planos-saude/${planoId}`);
      return await res.json();
    },
    enabled: !!planoId,
  });

  // Configurar formulário
  const form = useForm<PlanoFormValues>({
    resolver: zodResolver(planoFormSchema),
    defaultValues: {
      nome: "",
      codigo: "",
      valorConsulta: 0,
      percentualRepasse: 70,
      observacoes: "",
      ativo: true,
    },
  });

  // Atualizar valores do formulário quando o plano for carregado
  useEffect(() => {
    if (plano) {
      form.reset({
        nome: plano.nome,
        codigo: plano.codigo || "",
        valorConsulta: plano.valorConsulta || 0,
        percentualRepasse: plano.percentualRepasse || 70,
        observacoes: plano.observacoes || "",
        ativo: plano.ativo,
      });
    }
  }, [plano, form]);

  // Configurar mutação para criar/atualizar plano
  const mutation = useMutation({
    mutationFn: async (data: PlanoFormValues) => {
      if (planoId) {
        // Atualizar plano existente
        await apiRequest("PUT", `/api/planos-saude/${planoId}`, data);
      } else {
        // Criar novo plano
        await apiRequest("POST", "/api/planos-saude", data);
      }
    },
    onSuccess: () => {
      // Mostrar toast apenas quando o plano for salvo com sucesso
      toast({
        title: planoId ? "Plano atualizado" : "Plano cadastrado",
        description: planoId
          ? "As informações do plano foram atualizadas com sucesso."
          : "O plano foi cadastrado com sucesso no sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/planos-saude"] });
      onSuccess();
    },
  });

  // Handler de submit
  const onSubmit = (data: PlanoFormValues) => {
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
              <FormLabel>Nome do Plano</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do plano" {...field} />
              </FormControl>
              <FormDescription>
                Nome oficial do plano de saúde.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Digite o código do plano (opcional)" {...field} />
              </FormControl>
              <FormDescription>
                Código identificador do plano na operadora.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="valorConsulta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Consulta (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    step={0.01}
                    placeholder="0,00" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Valor pago pelo plano por consulta (em reais).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="percentualRepasse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual de Repasse (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    max={100}
                    placeholder="70" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Percentual do valor repassado ao psicólogo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Digite observações adicionais sobre o plano..." 
                  className="resize-none" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Informações adicionais sobre o plano, regras específicas, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status do Plano</FormLabel>
                <FormDescription>
                  {field.value ? "O plano está ativo e disponível para uso" : "O plano está inativo e não disponível para novos agendamentos"}
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
            {planoId ? "Atualizar Plano" : "Cadastrar Plano"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
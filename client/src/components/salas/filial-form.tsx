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
import { insertFilialSchema } from "@shared/schema";

// Esquema com validações adicionais
const filialFormSchema = insertFilialSchema.extend({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().min(5, "Endereço muito curto").optional(),
  cidade: z.string().min(2, "Informe a cidade").optional(),
  estado: z.string().length(2, "Use a sigla do estado (2 letras)").optional(),
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 00000-000")
    .optional(),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (00) 00000-0000")
    .optional(),
  email: z.string().email("Email inválido").optional(),
  ativa: z.boolean().default(true),
});

type FilialFormValues = z.infer<typeof filialFormSchema>;

interface FilialFormProps {
  filialId?: number | null;
  onSuccess: () => void;
}

export default function FilialForm({ filialId, onSuccess }: FilialFormProps) {
  // Buscar dados da filial se estiver editando
  const { data: filial, isLoading } = useQuery({
    queryKey: ["/api/filiais", filialId],
    queryFn: async () => {
      if (!filialId) return null;
      const res = await apiRequest("GET", `/api/filiais/${filialId}`);
      return await res.json();
    },
    enabled: !!filialId,
  });

  // Configurar formulário
  const form = useForm<FilialFormValues>({
    resolver: zodResolver(filialFormSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      telefone: "",
      email: "",
      ativa: true,
    },
  });

  // Atualizar valores do formulário quando a filial for carregada
  useEffect(() => {
    if (filial) {
      form.reset({
        nome: filial.nome,
        endereco: filial.endereco || "",
        cidade: filial.cidade || "",
        estado: filial.estado || "",
        cep: filial.cep || "",
        telefone: filial.telefone || "",
        email: filial.email || "",
        ativa: filial.ativa,
      });
    }
  }, [filial, form]);

  // Configurar mutação para criar/atualizar filial
  const mutation = useMutation({
    mutationFn: async (data: FilialFormValues) => {
      const response = await apiRequest(
        filialId ? "PUT" : "POST",
        filialId ? `/api/filiais/${filialId}` : "/api/filiais",
        data
      );
      if (!response.ok) {
        throw new Error("Erro ao salvar filial");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Erro ao salvar filial:", error);
      throw error;
    }
  });

  // Handler de submit
  const onSubmit = (data: FilialFormValues) => {
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
              <FormLabel>Nome da Filial</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome da filial" {...field} />
              </FormControl>
              <FormDescription>
                Nome que identifica esta unidade ou filial.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormDescription>
                  Telefone principal da filial.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="email@clinica.com.br" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  E-mail para contato direto com esta filial.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, número, bairro" {...field} />
              </FormControl>
              <FormDescription>
                Endereço completo da filial.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="Cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="UF" 
                    maxLength={2} 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input placeholder="00000-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ativa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status da Filial</FormLabel>
                <FormDescription>
                  {field.value ? "A filial está ativa e operando normalmente" : "A filial está inativa temporariamente"}
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
            {filialId ? "Atualizar Filial" : "Cadastrar Filial"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
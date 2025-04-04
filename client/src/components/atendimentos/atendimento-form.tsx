
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const atendimentoFormSchema = z.object({
  observacoes: z.string().min(1, "Observações são obrigatórias"),
  diagnostico: z.string().optional(),
  evolucao: z.string().min(1, "Evolução é obrigatória"),
  encaminhamento: z.string().optional(),
  duracao: z.coerce.number().min(1, "Duração é obrigatória"),
});

interface AtendimentoFormProps {
  agendamentoId: number;
  onSuccess: () => void;
}

export default function AtendimentoForm({ agendamentoId, onSuccess }: AtendimentoFormProps) {
  const form = useForm<z.infer<typeof atendimentoFormSchema>>({
    resolver: zodResolver(atendimentoFormSchema),
    defaultValues: {
      observacoes: "",
      diagnostico: "",
      evolucao: "",
      encaminhamento: "",
      duracao: 50,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof atendimentoFormSchema>) => {
      const response = await apiRequest(
        "POST",
        "/api/atendimentos",
        {
          ...data,
          agendamentoId,
        }
      );
      if (!response.ok) {
        throw new Error("Erro ao salvar atendimento");
      }
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: z.infer<typeof atendimentoFormSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Registro de Atendimento</CardTitle>
            <CardDescription>
              Preencha os dados do atendimento realizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="duracao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Registre as observações do atendimento..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evolucao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evolução</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a evolução do paciente..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Registre o diagnóstico se houver..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="encaminhamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encaminhamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Registre encaminhamentos se necessário..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate
-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Atendimento"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

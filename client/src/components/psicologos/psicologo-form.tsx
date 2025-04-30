import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";
import DisponibilidadeHorarios from "./disponibilidade-horarios";

const crpRegex = /^\d{2}\/\d{4}$/;

const psicologoFormSchema = z.object({
  dadosPessoais: z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").or(z.literal("")),
    telefone: z.string().min(10, "Telefone inválido"),
    cpf: z.string().min(11, "CPF inválido"),
    foto: z.string().optional(),
  }),
  informacoesProfissionais: z.object({
    crp: z.string().regex(crpRegex, "CRP deve estar no formato XX/XXXX"),
    especialidade: z.string().min(1, "Selecione uma especialidade"),
    formacao: z.string().optional(),
    curriculo: z.string().optional(),
    redesSociais: z.string().optional(),
    enderecoConsultorio: z.string().optional(),
  }),
  disponibilidade: z.array(z.object({
    diaSemana: z.number().min(0).max(6),
    horaInicio: z.string(),
    horaFim: z.string(),
    recorrente: z.boolean().default(true),
    intervalo: z.number().min(0).max(60).default(10),
    duracaoConsulta: z.number().min(30).max(120).default(50),
  })).min(1, "Adicione pelo menos um horário"),
});

type PsicologoFormValues = z.infer<typeof psicologoFormSchema>;

const ESPECIALIDADES = [
  "Psicologia Clínica",
  "Psicologia Infantil",
  "Neuropsicologia",
  "Psicologia Organizacional",
  "Psicologia Escolar",
  "Psicologia do Esporte",
  "Psicologia Hospitalar",
];

interface PsicologoFormProps {
  psicologoId?: number;
  onSuccess: () => void;
}

export default function PsicologoForm({ psicologoId, onSuccess }: PsicologoFormProps) {
  const [activeTab, setActiveTab] = useState("dadosPessoais");
  const { toast } = useToast();
  const form = useForm<PsicologoFormValues>({
    resolver: zodResolver(psicologoFormSchema),
    defaultValues: {
      dadosPessoais: {
        nome: "",
        email: "",
        senha: "",
        telefone: "",
        cpf: "",
        foto: "",
      },
      informacoesProfissionais: {
        crp: "",
        especialidade: "",
        formacao: "",
        curriculo: "",
        redesSociais: "",
        enderecoConsultorio: "",
      },
      disponibilidade: [{
        diaSemana: 1,
        horaInicio: "08:00",
        horaFim: "17:00",
        recorrente: true,
        intervalo: 10,
        duracaoConsulta: 50,
      }],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PsicologoFormValues) => {
      const response = await apiRequest(
        psicologoId ? "PUT" : "POST",
        `/api/psicologos${psicologoId ? `/${psicologoId}` : ''}`,
        data
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.code === "CRP_DUPLICATE") {
          throw new Error("CRP já cadastrado no sistema");
        }
        throw new Error("Erro ao salvar psicólogo");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: psicologoId ? "Psicólogo atualizado" : "Psicólogo cadastrado",
        description: "Dados salvos com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PsicologoFormValues) => {
    mutation.mutate(data);
  };
    
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            {/* Dados Pessoais */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dadosPessoais.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email*</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Informações Profissionais */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="informacoesProfissionais.crp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRP* (XX/XXXX)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="informacoesProfissionais.especialidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade*</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {ESPECIALIDADES.map((esp) => (
                        <Button
                          key={esp}
                          type="button"
                          variant={field.value === esp ? "default" : "outline"}
                          onClick={() => {
                            field.onChange(field.value === esp ? "" : esp);
                          }}
                        >
                          {esp}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="informacoesProfissionais.enderecoConsultorio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço do Consultório</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="informacoesProfissionais.curriculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currículo/Descrição Profissional</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Disponibilidade */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="disponibilidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horários de Atendimento*</FormLabel>
                    <DisponibilidadeHorarios
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
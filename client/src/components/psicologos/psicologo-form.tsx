import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";

// Esquema de validação para dados pessoais
const dadosPessoaisSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  telefone: z.string().min(10, "Telefone inválido").optional().nullable(),
  cpf: z.string().min(11, "CPF inválido").optional().nullable(),
});

// Esquema de validação para informações profissionais
const informacoesProfissionaisSchema = z.object({
  crp: z.string().min(4, "CRP inválido"),
  especialidade: z.string().optional().nullable(),
  formacao: z.string().optional().nullable(),
});

// Esquema de validação para disponibilidade
const disponibilidadeSchema = z.array(
  z.object({
    diaSemana: z.number().min(0).max(6),
    horaInicio: z.string(),
    horaFim: z.string(),
    remoto: z.boolean().default(false),
  })
);

// Combine os esquemas
const psicologoFormSchema = z.object({
  dadosPessoais: dadosPessoaisSchema,
  informacoesProfissionais: informacoesProfissionaisSchema,
  disponibilidade: disponibilidadeSchema,
});

type PsicologoFormValues = z.infer<typeof psicologoFormSchema>;

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

interface PsicologoFormProps {
  psicologoId?: number | null;
  onSuccess: () => void;
}

export default function PsicologoForm({ psicologoId, onSuccess }: PsicologoFormProps) {
  const [activeTab, setActiveTab] = useState<string>("dadosPessoais");

  // Carregar dados do psicólogo para edição
  const { data: psicologo, isLoading: isLoadingPsicologo } = useQuery({
    queryKey: ["/api/psicologos", psicologoId],
    queryFn: async () => {
      if (!psicologoId) return null;
      const res = await apiRequest("GET", `/api/psicologos/${psicologoId}`);
      return res.json();
    },
    enabled: !!psicologoId,
  });

  // Inicializar formulário
  const form = useForm<PsicologoFormValues>({
    resolver: zodResolver(psicologoFormSchema),
    defaultValues: {
      dadosPessoais: {
        nome: "",
        email: "",
        senha: "",
        telefone: "",
        cpf: "",
      },
      informacoesProfissionais: {
        crp: "",
        especialidade: "",
        formacao: "",
      },
      disponibilidade: [
        { diaSemana: 1, horaInicio: "08:00", horaFim: "17:00", remoto: false },
      ],
    },
  });

  // Preencher formulário com dados do psicólogo se estiver editando
  React.useEffect(() => {
    if (psicologo && psicologoId) {
      form.reset({
        dadosPessoais: {
          nome: psicologo.usuario?.nome || "",
          email: psicologo.usuario?.email || "",
          senha: "", // Não exibir senha atual
          telefone: psicologo.usuario?.telefone || "",
          cpf: psicologo.usuario?.cpf || "",
        },
        informacoesProfissionais: {
          crp: psicologo.crp || "",
          especialidade: psicologo.especialidade || "",
          formacao: psicologo.formacao || "",
        },
        disponibilidade: psicologo.disponibilidades?.length
          ? psicologo.disponibilidades.map((d: any) => ({
              diaSemana: d.diaSemana,
              horaInicio: d.horaInicio,
              horaFim: d.horaFim,
              remoto: d.remoto || false,
            }))
          : [{ diaSemana: 1, horaInicio: "08:00", horaFim: "17:00", remoto: false }],
      });
    }
  }, [psicologo, psicologoId, form]);

  // Mutation para criar ou atualizar psicólogo
  const mutation = useMutation({
    mutationFn: async (data: PsicologoFormValues) => {
      const payload = {
        usuario: {
          nome: data.dadosPessoais.nome,
          email: data.dadosPessoais.email,
          senha: data.dadosPessoais.senha,
          telefone: data.dadosPessoais.telefone,
          cpf: data.dadosPessoais.cpf,
          tipo: "psicologo"
        },
        psicologo: {
          crp: data.informacoesProfissionais.crp,
          especialidade: data.informacoesProfissionais.especialidade,
          formacao: data.informacoesProfissionais.formacao
        },
        disponibilidades: data.disponibilidade
      };

      // Se for edição, use PUT, senão use POST
      const method = psicologoId ? "PUT" : "POST";
      const endpoint = psicologoId ? `/api/psicologos/${psicologoId}` : "/api/psicologos";
      
      const psicologoResponse = await apiRequest(
        method,
        endpoint,
        payload
      );

      if (!psicologoResponse.ok) {
        throw new Error("Erro ao salvar psicólogo");
      }
      return psicologoResponse.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  // Lidar com envio do formulário
  const onSubmit = (data: PsicologoFormValues) => {
    mutation.mutate(data);
  };

  // Adicionar nova disponibilidade
  const adicionarDisponibilidade = () => {
    const disponibilidades = form.getValues("disponibilidade");
    form.setValue("disponibilidade", [
      ...disponibilidades, 
      { diaSemana: 1, horaInicio: "08:00", horaFim: "17:00", remoto: false }
    ]);
  };

  // Remover disponibilidade
  const removerDisponibilidade = (index: number) => {
    const disponibilidades = form.getValues("disponibilidade");
    if (disponibilidades.length > 1) {
      form.setValue(
        "disponibilidade", 
        disponibilidades.filter((_, i) => i !== index)
      );
    }
  };

  // Avançar para próxima aba
  const goToNextTab = () => {
    if (activeTab === "dadosPessoais") {
      setActiveTab("informacoesProfissionais");
    } else if (activeTab === "informacoesProfissionais") {
      setActiveTab("disponibilidade");
    } else if (activeTab === "disponibilidade") {
      form.handleSubmit(onSubmit)();
    }
  };

  // Voltar para aba anterior
  const goToPreviousTab = () => {
    if (activeTab === "disponibilidade") {
      setActiveTab("informacoesProfissionais");
    } else if (activeTab === "informacoesProfissionais") {
      setActiveTab("dadosPessoais");
    }
  };

  if (isLoadingPsicologo && psicologoId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dadosPessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="informacoesProfissionais">Informações Profissionais</TabsTrigger>
            <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
          </TabsList>

          {/* Aba de Dados Pessoais */}
          <TabsContent value="dadosPessoais" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dadosPessoais.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
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
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{psicologoId ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={psicologoId ? "Digite para alterar a senha" : "******"} 
                        {...field} 
                        required={!psicologoId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Aba de Informações Profissionais */}
          <TabsContent value="informacoesProfissionais" className="space-y-4">
            <FormField
              control={form.control}
              name="informacoesProfissionais.crp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRP</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do CRP" {...field} />
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
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Especialidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="informacoesProfissionais.formacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formação</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes sobre a formação acadêmica" 
                      {...field} 
                      className="min-h-[150px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Aba de Disponibilidade */}
          <TabsContent value="disponibilidade" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Atendimento</CardTitle>
                <CardDescription>
                  Configure os dias, horários e o tipo de atendimento (presencial ou remoto) em que o profissional estará disponível.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.getValues("disponibilidade").map((_, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-md relative">
                    <FormField
                      control={form.control}
                      name={`disponibilidade.${index}.diaSemana`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da Semana</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
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

                    <FormField
                      control={form.control}
                      name={`disponibilidade.${index}.horaInicio`}
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
                      name={`disponibilidade.${index}.horaFim`}
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

                    <div className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name={`disponibilidade.${index}.remoto`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Atendimento Remoto
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removerDisponibilidade(index)}
                        disabled={form.getValues("disponibilidade").length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const novoHorario = {
                      diaSemana: 1, // Segunda-feira como padrão
                      horaInicio: "08:00",
                      horaFim: "17:00",
                      ativo: true
                    };
                    const disponibilidadeAtual = form.getValues("disponibilidade");
                    form.setValue("disponibilidade", [...disponibilidadeAtual, novoHorario]);
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Horário
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t border-neutral-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={goToPreviousTab}
            disabled={activeTab === "dadosPessoais"}
          >
            Voltar
          </Button>

          {activeTab === "disponibilidade" ? (
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>Salvar</>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={goToNextTab}>
              Próximo
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
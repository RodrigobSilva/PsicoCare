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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Esquema de validação para dados pessoais
const dadosPessoaisSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
  telefone: z.string().min(10, "Telefone inválido").optional().nullable(),
  cpf: z.string().min(11, "CPF inválido").optional().nullable(),
  ativo: z.boolean().default(true),
  dataNascimento: z.string().optional().nullable(),
  genero: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
});

// Esquema de validação para informações clínicas
const informacoesClinicasSchema = z.object({
  observacoes: z.string().optional().nullable(),
});

// Esquema de validação para plano de saúde
const planoSaudeSchema = z.object({
  planoSaudeId: z.string().optional().nullable(),
  numeroCarteirinha: z.string().optional().nullable(),
  dataValidade: z.string().optional().nullable(),
}).refine(data => {
  // Se um campo do plano está preenchido, todos devem estar preenchidos
  const { planoSaudeId, numeroCarteirinha, dataValidade } = data;
  
  if (planoSaudeId && planoSaudeId !== "nenhum") {
    return !!numeroCarteirinha && !!dataValidade;
  }
  
  return true;
}, {
  message: "Preencha todos os campos do plano de saúde"
});

// Combine os esquemas
const patientFormSchema = z.object({
  dadosPessoais: dadosPessoaisSchema,
  informacoesClinicas: informacoesClinicasSchema,
  planoSaude: planoSaudeSchema,
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  pacienteId?: number | null;
  onSuccess: () => void;
}

export default function PatientForm({ pacienteId, onSuccess }: PatientFormProps) {
  const [activeTab, setActiveTab] = useState<string>("dadosPessoais");
  const { toast } = useToast();

  // Carregar dados do paciente para edição
  const { data: paciente, isLoading: isLoadingPaciente } = useQuery({
    queryKey: ["/api/pacientes", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return null;
      const res = await apiRequest("GET", `/api/pacientes/${pacienteId}`);
      return res.json();
    },
    enabled: !!pacienteId,
  });

  // Carregar lista de planos de saúde
  const { data: planosSaude, isLoading: isLoadingPlanos } = useQuery({
    queryKey: ["/api/planos-saude"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/planos-saude");
      return res.json();
    },
  });

  // Inicializar formulário
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      dadosPessoais: {
        nome: "",
        email: "",
        senha: "",
        telefone: "",
        cpf: "",
        dataNascimento: "",
        genero: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
      },
      informacoesClinicas: {
        observacoes: "",
      },
      planoSaude: {
        planoSaudeId: "",
        numeroCarteirinha: "",
        dataValidade: "",
      },
    },
  });

  // Preencher formulário com dados do paciente se estiver editando
  React.useEffect(() => {
    if (paciente && pacienteId) {
      const pacientePlano = paciente.planos && paciente.planos.length > 0 ? paciente.planos[0] : null;

      form.reset({
        dadosPessoais: {
          nome: paciente.usuario?.nome || "",
          email: paciente.usuario?.email || "",
          senha: "", // Não exiba a senha atual
          telefone: paciente.usuario?.telefone || "",
          cpf: paciente.usuario?.cpf || "",
          ativo: paciente.usuario?.ativo ?? true, // Se não houver valor, assume ativo
          dataNascimento: paciente.dataNascimento || "",
          genero: paciente.genero || "",
          endereco: paciente.endereco || "",
          cidade: paciente.cidade || "",
          estado: paciente.estado || "",
          cep: paciente.cep || "",
        },
        informacoesClinicas: {
          observacoes: paciente.observacoes || "",
        },
        planoSaude: {
          planoSaudeId: pacientePlano?.planoSaudeId?.toString() || "",
          numeroCarteirinha: pacientePlano?.numeroCarteirinha || "",
          dataValidade: pacientePlano?.dataValidade || "",
        },
      });
    }
  }, [paciente, pacienteId, form]);

  // Handler para abrir formulário de edição
  const mutation = useMutation({
    mutationFn: async (data: PatientFormValues) => {
      // Preparar dados para API
      const payload = {
        usuario: {
          nome: data.dadosPessoais.nome,
          email: data.dadosPessoais.email,
          senha: data.dadosPessoais.senha || undefined,
          telefone: data.dadosPessoais.telefone,
          cpf: data.dadosPessoais.cpf,
          ativo: data.dadosPessoais.ativo,
          tipo: "paciente"
        },
        paciente: {
          dataNascimento: data.dadosPessoais.dataNascimento,
          genero: data.dadosPessoais.genero,
          endereco: data.dadosPessoais.endereco,
          cidade: data.dadosPessoais.cidade,
          estado: data.dadosPessoais.estado,
          cep: data.dadosPessoais.cep,
          observacoes: data.informacoesClinicas.observacoes
        },
        planoSaude: data.planoSaude.planoSaudeId && data.planoSaude.planoSaudeId !== "nenhum" ? {
          planoSaudeId: parseInt(data.planoSaude.planoSaudeId),
          numeroCarteirinha: data.planoSaude.numeroCarteirinha,
          dataValidade: data.planoSaude.dataValidade
        } : null
      };

      try {
        // Criar ou atualizar paciente
        if (pacienteId) {
          const res = await apiRequest("PUT", `/api/pacientes/${pacienteId}`, payload);
          if (!res.ok) throw new Error("Falha ao atualizar paciente");
          return await res.json();
        } else {
          const res = await apiRequest("POST", "/api/pacientes", payload);
          if (!res.ok) throw new Error("Falha ao criar paciente");
          return await res.json();
        }
      } catch (error) {
        console.error("Erro ao salvar paciente:", error);
        throw error;
      }
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  // Lidar com envio do formulário
  const onSubmit = async (data: PatientFormValues) => {
    try {
      const isValid = await form.trigger();
      if (!isValid) return;

      await mutation.mutateAsync(data);
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
    }
  };

  // Avançar para próxima aba
  const goToNextTab = async () => {
    if (activeTab === "dadosPessoais") {
      const isValid = await form.trigger("dadosPessoais");
      if (isValid) {
        setActiveTab("informacoesClinicas");
      }
    } else if (activeTab === "informacoesClinicas") {
      const isValid = await form.trigger("informacoesClinicas");
      if (isValid) {
        setActiveTab("planoSaude");
      }
    }
  };

  // Voltar para aba anterior
  const goToPreviousTab = () => {
    if (activeTab === "planoSaude") {
      setActiveTab("informacoesClinicas");
    } else if (activeTab === "informacoesClinicas") {
      setActiveTab("dadosPessoais");
    }
  };

  if (isLoadingPaciente && pacienteId) {
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
            <TabsTrigger value="informacoesClinicas">Informações Clínicas</TabsTrigger>
            <TabsTrigger value="planoSaude">Plano de Saúde</TabsTrigger>
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
                      <Input placeholder="000.000.000-00" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="(00) 00000-0000" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo ativo só aparece na edição de paciente existente */}
              {pacienteId && (
                <FormField
                  control={form.control}
                  name="dadosPessoais.ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mr-2 h-4 w-4"
                          />
                          <div className="grid gap-1.5 leading-none">
                            <FormLabel className="m-0">
                              Paciente Ativo
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {field.value
                                ? "O paciente está ativo e pode agendar consultas"
                                : "O paciente está inativo e não pode agendar consultas"}
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {!pacienteId && (
                <FormField
                  control={form.control}
                  name="dadosPessoais.senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="dadosPessoais.endereco"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dadosPessoais.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Aba de Informações Clínicas */}
          <TabsContent value="informacoesClinicas" className="space-y-4">
            <FormField
              control={form.control}
              name="informacoesClinicas.observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o paciente" 
                      {...field} 
                      value={field.value || ""}
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Aba de Plano de Saúde */}
          <TabsContent value="planoSaude" className="space-y-4">
            <FormField
              control={form.control}
              name="planoSaude.planoSaudeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Saúde</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ""}
                    value={field.value || "nenhum"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano de saúde" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nenhum">Particular (Sem plano)</SelectItem>
                      {planosSaude?.map((plano: any) => (
                        <SelectItem key={plano.id} value={plano.id.toString()}>
                          {plano.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Mostrar campos de carteirinha e validade apenas se tiver um plano de saúde selecionado */}
            {form.watch("planoSaude.planoSaudeId") && form.watch("planoSaude.planoSaudeId") !== "nenhum" && (
              <>
                <FormField
                  control={form.control}
                  name="planoSaude.numeroCarteirinha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Carteirinha</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da carteirinha" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="planoSaude.dataValidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Validade</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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

          {activeTab === "planoSaude" ? (
            <Button 
              type="submit"
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                // Validar todo o formulário e submeter
                form.trigger().then(isValid => {
                  if (isValid) {
                    // Submeter o formulário e fechar quando concluído
                    form.handleSubmit(async (data) => {
                      await onSubmit(data);
                      // O callback onSuccess será chamado após o sucesso da mutation
                    })();
                  } else {
                    // Se houver erros, mostrar mensagem ao usuário
                    toast({
                      title: "Verificar informações",
                      description: "Corrija os campos inválidos antes de salvar.",
                      variant: "destructive"
                    });
                  }
                });
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar e Concluir"
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
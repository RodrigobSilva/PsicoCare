
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, Server, Lock, BellRing, Mail, Users, UserPlus, 
  User, Trash2, Edit, Save, X, Send, Loader2 
} from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Usuario } from "@shared/schema";

const formSchema = z.object({
  whatsappToken: z.string(),
  whatsappEnabled: z.boolean()
});

// Esquema para configurações de email
const emailConfigSchema = z.object({
  emailHost: z.string().min(1, "O servidor SMTP é obrigatório"),
  emailPort: z.coerce.number().int().min(1, "A porta deve ser um número válido"),
  emailUser: z.string().min(1, "O usuário é obrigatório"),
  emailPassword: z.string().min(1, "A senha é obrigatória"),
  emailFrom: z.string().email("Email inválido").min(1, "O email de envio é obrigatório"),
  emailEnabled: z.boolean().default(false),
  notificarAgendamento: z.boolean().default(true),
  notificarCancelamento: z.boolean().default(true),
  notificarLembrete: z.boolean().default(true),
  notificarPagamento: z.boolean().default(true),
});

type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

// Componente para configuração de notificações por email
function EmailConfigForm() {
  const { toast } = useToast();
  
  // Buscar configurações atuais
  const { data: emailConfig, isLoading } = useQuery({
    queryKey: ["/api/config/email"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/config/email");
        if (!res.ok) throw new Error("Falha ao buscar configurações de email");
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar configurações de email:", error);
        return {
          emailHost: "",
          emailPort: 587,
          emailUser: "",
          emailPassword: "",
          emailFrom: "",
          emailEnabled: false,
          notificarAgendamento: true,
          notificarCancelamento: true,
          notificarLembrete: true,
          notificarPagamento: true
        };
      }
    }
  });
  
  // Formulário
  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      emailHost: "",
      emailPort: 587,
      emailUser: "",
      emailPassword: "",
      emailFrom: "",
      emailEnabled: false,
      notificarAgendamento: true,
      notificarCancelamento: true,
      notificarLembrete: true,
      notificarPagamento: true
    }
  });
  
  // Atualizar formulário quando os dados forem carregados
  useEffect(() => {
    if (emailConfig) {
      form.reset({
        emailHost: emailConfig.emailHost || "",
        emailPort: emailConfig.emailPort || 587,
        emailUser: emailConfig.emailUser || "",
        emailPassword: emailConfig.emailPassword || "",
        emailFrom: emailConfig.emailFrom || "",
        emailEnabled: emailConfig.emailEnabled || false,
        notificarAgendamento: emailConfig.notificarAgendamento ?? true,
        notificarCancelamento: emailConfig.notificarCancelamento ?? true,
        notificarLembrete: emailConfig.notificarLembrete ?? true,
        notificarPagamento: emailConfig.notificarPagamento ?? true
      });
    }
  }, [emailConfig, form]);
  
  // Mutação para salvar configurações
  const salvarConfigMutation = useMutation({
    mutationFn: async (data: EmailConfigFormValues) => {
      const res = await apiRequest("POST", "/api/config/email", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao salvar configurações de email");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações de email foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Enviar email de teste
  const testarEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/config/email/test", form.getValues());
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao enviar email de teste");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email de teste enviado",
        description: "Verifique sua caixa de entrada para confirmar o recebimento.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: EmailConfigFormValues) => {
    salvarConfigMutation.mutate(data);
  };
  
  const testarEmail = () => {
    if (form.formState.isValid) {
      testarEmailMutation.mutate();
    } else {
      toast({
        title: "Formulário inválido",
        description: "Preencha corretamente todos os campos obrigatórios.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configurações do Servidor SMTP</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="emailHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servidor SMTP</FormLabel>
                  <FormControl>
                    <Input placeholder="smtp.gmail.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Endereço do servidor de email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emailPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porta</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="587" {...field} />
                  </FormControl>
                  <FormDescription>
                    Geralmente 587 (TLS) ou 465 (SSL)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="emailUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="seu.email@gmail.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email ou nome de usuário
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emailPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormDescription>
                    Senha ou chave de aplicativo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="emailFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email de Envio</FormLabel>
                <FormControl>
                  <Input placeholder="clinica@seudominio.com.br" {...field} />
                </FormControl>
                <FormDescription>
                  Endereço que aparecerá como remetente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="emailEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Ativar notificações por email</FormLabel>
                  <FormDescription>
                    Ative para enviar emails automáticos
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
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tipos de Notificações</h3>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="notificarAgendamento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Confirmação de agendamento
                    </FormLabel>
                    <FormDescription>
                      Enviar email quando um novo agendamento for criado
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notificarCancelamento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Cancelamento de agendamento
                    </FormLabel>
                    <FormDescription>
                      Enviar email quando um agendamento for cancelado
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notificarLembrete"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Lembretes de consultas
                    </FormLabel>
                    <FormDescription>
                      Enviar email de lembrete antes das consultas agendadas
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notificarPagamento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Comprovantes de pagamento
                    </FormLabel>
                    <FormDescription>
                      Enviar email com comprovante após pagamentos realizados
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={testarEmail}
            disabled={testarEmailMutation.isPending}
          >
            {testarEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Email de Teste
              </>
            )}
          </Button>
          
          <Button
            type="submit"
            disabled={salvarConfigMutation.isPending}
          >
            {salvarConfigMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Schema de formulário para novo usuário
const usuarioSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  tipo: z.enum(["admin", "secretaria", "psicologo", "paciente"], {
    required_error: "Você deve selecionar um tipo de usuário"
  }),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  ativo: z.boolean().default(true)
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

// Componente de gerenciamento de usuários
function GerenciamentoUsuarios() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "admin" | "secretaria" | "psicologo" | "paciente">("todos");
  
  // Buscar lista de usuários
  const { data: usuarios, isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/usuarios");
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      return await res.json();
    }
  });

  // Função para ordenar usuários por tipo
  const ordenarUsuariosPorTipo = (users: Usuario[]) => {
    const ordemTipos = { admin: 1, secretaria: 2, psicologo: 3, paciente: 4 };
    
    return [...users].sort((a, b) => {
      // Primeiro ordenar por tipo de usuário
      const tipoA = a.tipo as keyof typeof ordemTipos;
      const tipoB = b.tipo as keyof typeof ordemTipos;
      const ordemA = ordemTipos[tipoA] || 999;
      const ordemB = ordemTipos[tipoB] || 999;
      
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      
      // Em caso de empate no tipo, ordenar por nome
      return a.nome.localeCompare(b.nome);
    });
  };

  // Filtrar usuários por status e tipo
  const usuariosFiltrados = usuarios ? ordenarUsuariosPorTipo(
    usuarios.filter(usuario => {
      // Filtrar por status
      if (filtroStatus === "ativos" && usuario.ativo === false) return false;
      if (filtroStatus === "inativos" && usuario.ativo !== false) return false;
      
      // Filtrar por tipo
      if (filtroTipo !== "todos" && usuario.tipo !== filtroTipo) return false;
      
      return true;
    })
  ) : [];
  
  // Formulário para novo usuário
  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
      tipo: "paciente",
      telefone: "",
      cpf: "",
      ativo: true
    }
  });
  
  // Atualizar formulário ao editar usuário
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        nome: selectedUser.nome,
        email: selectedUser.email,
        senha: "",
        confirmarSenha: "",
        tipo: selectedUser.tipo as any,
        telefone: selectedUser.telefone || "",
        cpf: selectedUser.cpf || "",
        ativo: selectedUser.ativo === false ? false : true
      });
    } else {
      form.reset({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
        tipo: "paciente",
        telefone: "",
        cpf: "",
        ativo: true
      });
    }
  }, [selectedUser, form]);
  
  // Mutação para criar/atualizar usuário
  const salvarUsuarioMutation = useMutation({
    mutationFn: async (data: Omit<UsuarioFormValues, "confirmarSenha">) => {
      const { confirmarSenha, ...userData } = data as any;
      
      if (selectedUser) {
        // Se não houver senha, remova do objeto
        if (!userData.senha) {
          delete userData.senha;
        }
        
        const res = await apiRequest("PATCH", `/api/usuarios/${selectedUser.id}`, userData);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao atualizar usuário");
        }
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/usuarios", userData);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Erro ao criar usuário");
        }
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: selectedUser ? "Usuário atualizado" : "Usuário criado",
        description: selectedUser 
          ? `Usuário ${selectedUser.nome} foi atualizado com sucesso.` 
          : "Novo usuário criado com sucesso.",
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para excluir usuário
  const excluirUsuarioMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/usuarios/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao excluir usuário");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "Usuário foi excluído com sucesso."
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: UsuarioFormValues) => {
    const { confirmarSenha, ...userData } = data;
    salvarUsuarioMutation.mutate(userData);
  };
  
  const abrirDialogCriarUsuario = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };
  
  const abrirDialogEditarUsuario = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setIsDialogOpen(true);
  };
  
  const confirmarExcluirUsuario = (usuario: Usuario) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) {
      excluirUsuarioMutation.mutate(usuario.id);
    }
  };
  
  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      admin: "Administrador",
      secretaria: "Secretária",
      psicologo: "Psicólogo",
      paciente: "Paciente"
    };
    return tipos[tipo] || tipo;
  };
  
  const getUsuarioInitials = (nome: string) => {
    if (!nome) return "??";
    
    const names = nome.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between mb-4">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Cadastre e gerencie usuários do sistema</CardDescription>
          </div>
          <Button onClick={abrirDialogCriarUsuario}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 space-y-2 sm:space-y-0">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={filtroStatus} onValueChange={(value: "todos" | "ativos" | "inativos") => setFiltroStatus(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tipo:</span>
            <Select value={filtroTipo} onValueChange={(value: "todos" | "admin" | "secretaria" | "psicologo" | "paciente") => setFiltroTipo(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="secretaria">Secretárias</SelectItem>
                <SelectItem value="psicologo">Psicólogos</SelectItem>
                <SelectItem value="paciente">Pacientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados && usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getUsuarioInitials(usuario.nome)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{usuario.nome}</p>
                            <p className="text-xs text-muted-foreground">{usuario.cpf || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTipoLabel(usuario.tipo)}</Badge>
                      </TableCell>
                      <TableCell>
                        {usuario.ativo ? (
                          <Badge variant="default" className="bg-green-600">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => abrirDialogEditarUsuario(usuario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => confirmarExcluirUsuario(usuario)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Dialog para criar/editar usuário */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? "Editar Usuário" : "Criar Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser 
                  ? "Edite as informações do usuário selecionado." 
                  : "Preencha as informações para cadastrar um novo usuário."}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedUser ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmarSenha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Usuário</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="secretaria">Secretária</SelectItem>
                            <SelectItem value="psicologo">Psicólogo</SelectItem>
                            <SelectItem value="paciente">Paciente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="telefone"
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
                </div>
                
                <FormField
                  control={form.control}
                  name="cpf"
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
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Status do Usuário</FormLabel>
                        <FormDescription>
                          Determina se o usuário pode fazer login no sistema
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
                
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={salvarUsuarioMutation.isPending}
                  >
                    {salvarUsuarioMutation.isPending ? (
                      <>
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      whatsappToken: "",
      whatsappEnabled: false
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-800 mb-2">Configurações</h1>
          <p className="text-neutral-600">Gerencie as configurações do sistema</p>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="geral">
              <Settings className="w-4 h-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="sistema">
              <Server className="w-4 h-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="seguranca">
              <Lock className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              <BellRing className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="integracao">
              <Mail className="w-4 h-4 mr-2" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações da Clínica</CardTitle>
                  <CardDescription>Informações básicas da clínica</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as informações básicas da clínica como nome, endereço, telefone e horário de funcionamento.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações Regionais</CardTitle>
                  <CardDescription>Idioma, formato de data e hora</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Defina o idioma, formato de data e hora, e outras preferências regionais.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="usuarios">
            <GerenciamentoUsuarios />
          </TabsContent>

          <TabsContent value="sistema">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Manutenção</CardTitle>
                  <CardDescription>Backup e restauração</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as opções de backup e restauração de dados do sistema.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>Otimização do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as opções de performance e otimização do sistema.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seguranca">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Senhas e Autenticação</CardTitle>
                  <CardDescription>Políticas de senha e login</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as políticas de senha, autenticação e outras configurações de segurança.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proteção de Dados</CardTitle>
                  <CardDescription>Criptografia e privacidade</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as opções de criptografia e proteção de dados do sistema.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notificacoes">
            <div className="grid gap-6 md:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Notificações por Email</CardTitle>
                  <CardDescription>Configuração de envio de emails para agendamentos e eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailConfigForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integracao">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Integração com WhatsApp</CardTitle>
                  <CardDescription>Configuração da API do WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="whatsappToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token de Acesso</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Token de acesso da API do WhatsApp Business
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="whatsappEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Ativar notificações via WhatsApp</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Salvar Configurações</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Google Calendar</CardTitle>
                  <CardDescription>Sincronização de agenda</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure a sincronização de agendamentos com o Google Calendar.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

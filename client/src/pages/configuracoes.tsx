
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Server, Lock, BellRing, Mail, Users, UserPlus, User, Trash2, Edit, Save, X } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  
  // Buscar lista de usuários
  const { data: usuarios, isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/usuarios");
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      return await res.json();
    }
  });
  
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Cadastre e gerencie usuários do sistema</CardDescription>
        </div>
        <Button onClick={abrirDialogCriarUsuario}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
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
                {usuarios && usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
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
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notificações por Email</CardTitle>
                  <CardDescription>Configuração de envio de emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as opções de envio de notificações por email.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lembretes e Alertas</CardTitle>
                  <CardDescription>Configuração de lembretes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">
                    Configure as opções de lembretes e alertas do sistema.
                  </p>
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

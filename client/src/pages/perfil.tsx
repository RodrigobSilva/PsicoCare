import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, KeyRound, Mail, Phone, UserCircle } from "lucide-react";

// Schema para validação do formulário de alteração de senha
const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, "A senha atual é obrigatória"),
  novaSenha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string().min(6, "Confirme a nova senha"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type AlterarSenhaFormValues = z.infer<typeof alterarSenhaSchema>;

export default function PerfilPage() {
  const { user, changePasswordMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");

  // Formulário para alteração de senha
  const form = useForm<AlterarSenhaFormValues>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const onAlterarSenhaSubmit = (data: AlterarSenhaFormValues) => {
    changePasswordMutation.mutate({
      senhaAtual: data.senhaAtual,
      novaSenha: data.novaSenha,
    }, {
      onSuccess: () => {
        toast({
          title: 'Senha alterada com sucesso!',
          description: 'Sua senha foi atualizada com sucesso.'
        })
        form.reset();
      },
      onError: (error) => {
        toast({
          title: 'Erro ao alterar senha',
          description: error.message,
          variant: 'error',
        })
      }
    });
  };

  // Obter as iniciais do usuário para o avatar
  const getUserInitials = () => {
    if (!user || !user.nome) return "??";

    const names = user.nome.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Obter a cor de fundo do avatar com base no tipo de usuário
  const getAvatarColor = () => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      secretaria: "bg-purple-500",
      psicologo: "bg-blue-500",
      paciente: "bg-green-500"
    };

    return user?.tipo ? colors[user.tipo] || "bg-gray-500" : "bg-gray-500";
  };

  // Obter o rótulo do tipo de usuário
  const getUserTypeLabel = () => {
    const types: Record<string, string> = {
      admin: "Administrador",
      secretaria: "Secretária",
      psicologo: "Psicólogo",
      paciente: "Paciente"
    };

    return user?.tipo ? types[user.tipo] || user.tipo : "";
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Coluna esquerda - Informações do usuário */}
          <div className="md:w-1/3">
            <Card>
              <CardHeader className="flex flex-col items-center pb-2">
                <Avatar className={`h-24 w-24 ${getAvatarColor()}`}>
                  <AvatarFallback className="text-3xl">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4">{user?.nome}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Shield className="h-4 w-4 mr-1" />
                  {getUserTypeLabel()}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p>{user?.email}</p>
                    </div>
                  </div>

                  {user?.telefone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p>{user.telefone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <UserCircle className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Usuário desde</p>
                      <p>-</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita - Tabs */}
          <div className="md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações de conta e altere sua senha
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="info" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Informações Pessoais
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center">
                      <KeyRound className="h-4 w-4 mr-2" />
                      Segurança
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info">
                    <div className="space-y-4">
                      <p className="text-gray-500">
                        Esta seção exibirá suas informações pessoais. Para alterações de cadastro, entre em contato com a administração da clínica.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-medium">Nome Completo</h3>
                          <p>{user?.nome || '-'}</p>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-medium">Email</h3>
                          <p>{user?.email || '-'}</p>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-medium">Telefone</h3>
                          <p>{user?.telefone || '-'}</p>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-medium">CPF</h3>
                          <p>{user?.cpf || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onAlterarSenhaSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="senhaAtual"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Senha Atual</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="novaSenha"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nova Senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
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
                                  <FormLabel>Confirmar Nova Senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button 
                              type="submit" 
                              className="w-full md:w-auto"
                              disabled={changePasswordMutation.isPending}
                            >
                              {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                            </Button>
                          </form>
                        </Form>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-2">Dicas de Segurança</h3>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          <li>Use senhas fortes com pelo menos 8 caracteres</li>
                          <li>Combine letras maiúsculas, minúsculas, números e símbolos</li>
                          <li>Não use a mesma senha em vários sites</li>
                          <li>Nunca compartilhe suas credenciais de acesso</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
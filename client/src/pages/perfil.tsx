import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Lock, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";

// Schema para validação da alteração de senha
const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  novaSenha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type AlterarSenhaFormValues = z.infer<typeof alterarSenhaSchema>;

export default function PerfilPage() {
  const { user, changePasswordMutation } = useAuth();
  const [tab, setTab] = useState<"perfil" | "senha">("perfil");

  const alterarSenhaForm = useForm<AlterarSenhaFormValues>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: ""
    }
  });

  const onAlterarSenhaSubmit = (data: AlterarSenhaFormValues) => {
    // Remova a confirmação de senha antes de enviar para a API
    const { confirmarSenha, ...senhaData } = data;
    changePasswordMutation.mutate(senhaData, {
      onSuccess: () => {
        alterarSenhaForm.reset();
      }
    });
  };

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
              </div>
              <CardTitle>{user.nome}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <CardDescription>
                {user.tipo.charAt(0).toUpperCase() + user.tipo.slice(1)}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="perfil" value={tab} onValueChange={(value) => setTab(value as "perfil" | "senha")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="perfil">Informações</TabsTrigger>
              <TabsTrigger value="senha">Alterar Senha</TabsTrigger>
            </TabsList>
            
            <TabsContent value="perfil">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Visualize suas informações cadastradas no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                      <p className="text-base">{user.nome}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p className="text-base">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Telefone</h3>
                      <p className="text-base">{user.telefone || "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">CPF</h3>
                      <p className="text-base">{user.cpf || "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Perfil</h3>
                      <p className="text-base">{user.tipo.charAt(0).toUpperCase() + user.tipo.slice(1)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <p className="text-base">{user.ativo ? "Ativo" : "Inativo"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="senha">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Altere sua senha de acesso ao sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...alterarSenhaForm}>
                    <form onSubmit={alterarSenhaForm.handleSubmit(onAlterarSenhaSubmit)} className="space-y-4">
                      <FormField
                        control={alterarSenhaForm.control}
                        name="senhaAtual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="password" placeholder="******" {...field} />
                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={alterarSenhaForm.control}
                        name="novaSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="password" placeholder="******" {...field} />
                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={alterarSenhaForm.control}
                        name="confirmarSenha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="password" placeholder="******" {...field} />
                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={changePasswordMutation.isPending}>
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando senha...
                          </>
                        ) : (
                          "Alterar Senha"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
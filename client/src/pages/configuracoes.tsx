import Layout from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Server, Lock, BellRing, Mail } from "lucide-react";

export default function Configuracoes() {
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
                  <p className="text-sm text-neutral-600">
                    Configure a integração com a API do WhatsApp para envio de mensagens.
                  </p>
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
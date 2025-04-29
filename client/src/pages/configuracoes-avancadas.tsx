import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Database, Server, Shield } from "lucide-react";
import { Redirect } from "wouter";
import { SupabaseDashboard } from "@/components/supabase-dashboard";

export default function ConfiguracoesAvancadas() {
  const { user } = useAuth();
  
  // Verificar se o usuário é admin
  if (!user || user.tipo !== "admin") {
    return <Redirect to="/dashboard" />;
  }
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Configurações Avançadas</h1>
        </div>
        
        <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Área Restrita</AlertTitle>
          <AlertDescription>
            Esta seção contém configurações avançadas do sistema que podem afetar o funcionamento
            da aplicação. Tenha cuidado ao fazer alterações.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="border-b w-full justify-start rounded-none p-0">
            <TabsTrigger 
              value="database" 
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-t"
            >
              <Database className="h-4 w-4 mr-2" />
              Banco de Dados
            </TabsTrigger>
            <TabsTrigger 
              value="server" 
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-t"
            >
              <Server className="h-4 w-4 mr-2" />
              Servidor
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-t"
            >
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="database">
            <SupabaseDashboard />
          </TabsContent>
          
          <TabsContent value="server">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Servidor</CardTitle>
                <CardDescription>
                  Gerenciamento de instâncias e recursos do servidor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-gray-500">
                  <Server className="h-8 w-8 mx-auto mb-2" />
                  <p>Configurações do servidor estarão disponíveis em breve.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Gerenciamento de políticas de segurança e permissões.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2" />
                  <p>Configurações de segurança estarão disponíveis em breve.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
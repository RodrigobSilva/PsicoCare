import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, RefreshCw, CheckCircle2, XCircle, AlertCircle, Server } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { checkSupabaseConnection } from '@/lib/supabase';
import { SupabaseStatus } from '@/components/supabase-status';

export function SupabaseDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus('error');
    }
  };

  const getDbStats = async () => {
    setLoadingStats(true);
    try {
      // Tentar obter estatísticas básicas do banco
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public');
      
      if (tablesError) throw tablesError;
      
      // Dados simulados (no ambiente real, seriam obtidos do banco)
      const statsData = {
        tables: tablesData || [],
        size: '128 MB',
        lastBackup: new Date().toLocaleString(),
        version: 'PostgreSQL 15.2'
      };
      
      setDatabaseStats(statsData);
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      setDatabaseStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const simulateSyncToSupabase = async () => {
    setSyncStatus('syncing');
    try {
      // Simular uma operação de sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSyncStatus('success');
      
      // Resetar o status após 3 segundos
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Database className="mr-2 h-6 w-6" />
                Status do Supabase
              </CardTitle>
              <CardDescription>
                Gerenciamento da conexão com o banco de dados Supabase
              </CardDescription>
            </div>
            <SupabaseStatus />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection">
            <TabsList className="mb-4">
              <TabsTrigger value="connection">Conexão</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connection" className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  onClick={checkConnection} 
                  disabled={connectionStatus === 'checking'}
                  className="flex items-center"
                >
                  {connectionStatus === 'checking' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Verificar Conexão
                </Button>
                
                <Badge 
                  variant={connectionStatus === 'success' ? 'default' : 
                           connectionStatus === 'error' ? 'destructive' : 'outline'} 
                  className="text-sm py-1 px-2"
                >
                  {connectionStatus === 'idle' ? 'Não verificado' : 
                   connectionStatus === 'checking' ? 'Verificando...' : 
                   connectionStatus === 'success' ? 'Conectado' : 'Falha na conexão'}
                </Badge>
              </div>
              
              {connectionStatus === 'success' && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Conexão estabelecida com sucesso</AlertTitle>
                  <AlertDescription>
                    Seu aplicativo está conectado ao banco de dados Supabase e pronto para operação.
                  </AlertDescription>
                </Alert>
              )}
              
              {connectionStatus === 'error' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Falha na conexão</AlertTitle>
                  <AlertDescription>
                    Verifique sua conexão com a internet e as credenciais do Supabase.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4 text-sm">
                <h3 className="font-medium mb-2">Informações de Conexão</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <span className="font-medium text-gray-500">URL:</span> 
                    <code className="ml-2 text-xs bg-gray-100 p-1 rounded">https://cogrkxxduyclyzfupbzx.supabase.co</code>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Região:</span> 
                    <span className="ml-2">aws/south-america-east-1</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status:</span> 
                    <span className="ml-2">{connectionStatus === 'success' ? 'Online' : 'Verificando...'}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="stats">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  onClick={getDbStats} 
                  disabled={loadingStats}
                  className="flex items-center"
                >
                  {loadingStats ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Server className="mr-2 h-4 w-4" />
                  )}
                  Carregar Estatísticas
                </Button>
              </div>
              
              {databaseStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Tabelas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{databaseStats.tables.length || '0'}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Tamanho</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{databaseStats.size}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Último Backup</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base font-medium">{databaseStats.lastBackup}</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Versão</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base font-medium">{databaseStats.version}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {databaseStats.tables.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Tabelas ({databaseStats.tables.length})</h3>
                      <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
                        <ul className="text-sm">
                          {databaseStats.tables.map((table: any, index: number) => (
                            <li key={index} className="py-1">
                              <code>{table.tablename}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Estatísticas não estão disponíveis. Clique em "Carregar Estatísticas" para buscar informações.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sync">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sincronização de Banco de Dados</AlertTitle>
                <AlertDescription>
                  Esta funcionalidade permite sincronizar dados entre o banco PostgreSQL local 
                  e o Supabase. Use com cautela, pois pode sobrescrever dados existentes.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={simulateSyncToSupabase} 
                    disabled={syncStatus === 'syncing'}
                    className="flex items-center"
                  >
                    {syncStatus === 'syncing' ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Sincronizar para Supabase
                  </Button>
                  
                  {syncStatus === 'success' && (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Sincronizado com sucesso
                    </Badge>
                  )}
                  
                  {syncStatus === 'error' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Falha na sincronização
                    </Badge>
                  )}
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium mb-2 text-sm">Histórico de sincronização</h3>
                  <div className="text-xs text-gray-500">
                    <p>Nenhuma sincronização realizada recentemente.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-gray-50 text-xs text-gray-500 rounded-b-lg">
          <p>
            Não compartilhe suas credenciais do Supabase. Para configurações avançadas, acesse o 
            dashboard do Supabase diretamente.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
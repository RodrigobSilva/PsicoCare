
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export default function PortalPaciente() {
  const { data: agendamentos, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/agendamentos");
      return res.json();
    },
  });

  const { data: prontuarios, isLoading: isLoadingProntuarios } = useQuery({
    queryKey: ["/api/prontuarios"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/prontuarios");
      return res.json();
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-neutral-800 mb-6">Portal do Paciente</h1>

        <Tabs defaultValue="agendamentos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
            <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Consultas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAgendamentos ? (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      {agendamentos?.map((agendamento: any) => (
                        <div key={agendamento.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium">{new Date(agendamento.data).toLocaleDateString()}</p>
                            <p className="text-sm text-neutral-500">{agendamento.horaInicio}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Detalhes
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calendário</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar mode="single" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prontuario">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProntuarios ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    {prontuarios?.map((prontuario: any) => (
                      <div key={prontuario.id} className="border-b py-4">
                        <p className="font-medium">{new Date(prontuario.dataRegistro).toLocaleDateString()}</p>
                        <p className="text-sm text-neutral-500">{prontuario.descricao}</p>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avaliacoes">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Clínicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Escala de Ansiedade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button>Iniciar Avaliação</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Escala de Depressão</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button>Iniciar Avaliação</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Questionário de Qualidade de Vida</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button>Iniciar Avaliação</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

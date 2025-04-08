
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VideoIcon } from "lucide-react";

export default function Atendimentos() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: atendimentos, isLoading } = useQuery({
    queryKey: ["/api/atendimentos"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/atendimentos?psicologoId=${user?.id}`);
      return res.json();
    },
  });

  const iniciarTeleconsulta = (agendamentoId: number) => {
    navigate(`/teleconsulta/${agendamentoId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Atendimentos</h1>
        
        <div className="grid gap-4">
          {isLoading ? (
            <p>Carregando atendimentos...</p>
          ) : atendimentos?.length === 0 ? (
            <p>Nenhum atendimento encontrado.</p>
          ) : (
            atendimentos?.map((atendimento: any) => (
              <Card key={atendimento.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      Atendimento - {format(new Date(atendimento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    {atendimento.tipo === "teleconsulta" && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => iniciarTeleconsulta(atendimento.agendamentoId)}
                      >
                        <VideoIcon className="w-4 h-4 mr-2" />
                        Iniciar Teleconsulta
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Paciente:</strong> {atendimento.paciente?.usuario?.nome}</p>
                    <p><strong>Horário:</strong> {atendimento.horaInicio} - {atendimento.horaFim}</p>
                    <p><strong>Tipo:</strong> {atendimento.tipo}</p>
                    <p><strong>Observações:</strong> {atendimento.observacoes}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

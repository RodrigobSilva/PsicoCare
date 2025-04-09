
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import AtendimentoForm from "@/components/atendimentos/atendimento-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Atendimentos() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<number | null>(null);

  const { data: atendimentos, isLoading, refetch } = useQuery({
    queryKey: ["/api/atendimentos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/atendimentos");
      return res.json();
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Atendimentos</h1>
          <Button onClick={() => setShowForm(true)}>Novo Atendimento</Button>
        </div>

        {isLoading ? (
          <div>Carregando...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Psicólogo</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos?.map((atendimento: any) => (
                  <TableRow key={atendimento.id}>
                    <TableCell>
                      {format(new Date(atendimento.dataAtendimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{atendimento.paciente?.usuario?.nome}</TableCell>
                    <TableCell>{atendimento.psicologo?.usuario?.nome}</TableCell>
                    <TableCell>{atendimento.duracao} min</TableCell>
                    <TableCell>{atendimento.observacoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Novo Atendimento</DialogTitle>
            </DialogHeader>
            <AtendimentoForm
              agendamentoId={selectedAgendamentoId || 0}
              onSuccess={() => {
                setShowForm(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

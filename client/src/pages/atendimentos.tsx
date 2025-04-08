
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import AtendimentoForm from "@/components/atendimentos/atendimento-form";
import { Button } from "@/components/ui/button";
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
  const { data: atendimentos, isLoading } = useQuery({
    queryKey: ["/api/atendimentos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/atendimentos");
      return res.json();
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">Atendimentos</h1>

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
                      {format(new Date(atendimento.data), "dd/MM/yyyy", { locale: ptBR })}
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
      </div>
    </Layout>
  );
}

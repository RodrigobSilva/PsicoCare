import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, Edit, Trash2, PhoneCall, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import PsicologoForm from "@/components/psicologos/psicologo-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import type { PsicologoFormValues } from "@/components/psicologos/psicologo-form";


export default function Psicologos() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: psicologos, isLoading } = useQuery({
    queryKey: ["/api/psicologos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/psicologos");
      return res.json();
    },
  });

  const filteredPsicologos = psicologos?.filter((psicologo: any) =>
    psicologo.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    psicologo.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    psicologo.crp.includes(searchTerm)
  );

  const openEditDialog = (id: number) => {
    setEditing(id);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setEditing(null);
    setOpen(false);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Gerenciamento de Psicólogos</h1>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Psicólogo
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Buscar psicólogos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Lista de psicólogos cadastrados no sistema</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CRP</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPsicologos && filteredPsicologos.length > 0 ? (
                    filteredPsicologos.map((psicologo: any) => (
                      <TableRow key={psicologo.id}>
                        <TableCell className="font-medium">{psicologo.usuario.nome}</TableCell>
                        <TableCell>{psicologo.crp}</TableCell>
                        <TableCell>
                          {psicologo.especialidade ? (
                            <Badge variant="outline" className="bg-secondary-light bg-opacity-10">
                              {psicologo.especialidade}
                            </Badge>
                          ) : (
                            <span className="text-neutral-500 text-sm">Não informada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{psicologo.usuario.email}</span>
                            {psicologo.usuario.telefone && (
                              <span className="text-xs text-neutral-500 flex items-center mt-1">
                                <PhoneCall className="h-3 w-3 mr-1" />
                                {psicologo.usuario.telefone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/agenda?psicologo=${psicologo.id}`}>
                              <Calendar className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(psicologo.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            onClick={async () => {
                              try {
                                await apiRequest("DELETE", `/api/psicologos/${psicologo.id}`);
                                queryClient.invalidateQueries({ queryKey: ["/api/psicologos"] });
                                toast({
                                  title: "Psicólogo removido",
                                  description: "O psicólogo foi removido com sucesso.",
                                });
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Erro ao remover psicólogo",
                                  description: "Não foi possível remover o psicólogo.",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                        {searchTerm ? "Nenhum psicólogo encontrado para a busca." : "Nenhum psicólogo cadastrado."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Psicólogo" : "Novo Psicólogo"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Atualize as informações do psicólogo no formulário abaixo."
                  : "Preencha o formulário para cadastrar um novo psicólogo no sistema."}
              </DialogDescription>
            </DialogHeader>
            <PsicologoForm
              psicologoId={editing}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/psicologos"] });
                handleCloseDialog();
                toast({
                  title: editing ? "Psicólogo atualizado" : "Psicólogo cadastrado",
                  description: editing
                    ? "As informações do psicólogo foram atualizadas com sucesso."
                    : "O psicólogo foi cadastrado com sucesso no sistema.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
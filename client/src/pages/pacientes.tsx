import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import PatientForm from "@/components/pacientes/patient-form";
import { useToast } from "@/hooks/use-toast";

export default function Pacientes() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["/api/pacientes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/pacientes");
      return res.json();
    },
  });

  const filteredPacientes = pacientes?.filter(paciente => 
    paciente.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (paciente.usuario.cpf && paciente.usuario.cpf.includes(searchTerm))
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
          <h1 className="text-2xl font-semibold text-neutral-800">Gerenciamento de Pacientes</h1>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Buscar pacientes..."
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
                <TableCaption>Lista de pacientes cadastrados no sistema</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPacientes && filteredPacientes.length > 0 ? (
                    filteredPacientes.map((paciente) => (
                      <TableRow key={paciente.id}>
                        <TableCell className="font-medium">{paciente.usuario.nome}</TableCell>
                        <TableCell>{paciente.usuario.email}</TableCell>
                        <TableCell>{paciente.usuario.telefone || "Não informado"}</TableCell>
                        <TableCell>{paciente.usuario.cpf || "Não informado"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(paciente.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                        Nenhum paciente encontrado
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
              <DialogTitle>{editing ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
              <DialogDescription>
                {editing 
                  ? "Atualize as informações do paciente no formulário abaixo." 
                  : "Preencha o formulário para cadastrar um novo paciente no sistema."}
              </DialogDescription>
            </DialogHeader>
            <PatientForm 
              pacienteId={editing} 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
                handleCloseDialog();
                toast({
                  title: editing ? "Paciente atualizado" : "Paciente cadastrado",
                  description: editing
                    ? "As informações do paciente foram atualizadas com sucesso."
                    : "O paciente foi cadastrado com sucesso no sistema.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

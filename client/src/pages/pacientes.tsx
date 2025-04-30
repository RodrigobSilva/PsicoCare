import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { OnboardingTip } from "@/components/onboarding/onboarding-tip";
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
import { Loader2, Plus, Search, Edit, Trash2, PowerOff, Eye, Upload, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PatientForm from "@/components/pacientes/patient-form";
import ImportPatients from "@/components/pacientes/import-patients";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";


export default function Pacientes() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Verificar se o usuário é psicólogo
  const isPsicologo = user?.tipo === "psicologo";
  // Verificar se o usuário é administrador ou secretária
  const isAdminOrSecretaria = user?.tipo === "admin" || user?.tipo === "secretaria";

  // Buscar pacientes
  const { data: pacientesData, isLoading } = useQuery({
    queryKey: ["/api/pacientes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/pacientes");
      return res.json();
    },
  });
  
  // Garantir que pacientes seja sempre um array
  const pacientes = Array.isArray(pacientesData) ? pacientesData : [];
  
  // Buscar planos de saúde para importação
  const { data: planosSaude = [] } = useQuery({
    queryKey: ["/api/planos-saude"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/planos-saude");
      return res.json();
    },
  });

  // Filtrar pacientes com base na pesquisa
  const filteredPacientes = pacientes.filter((paciente: any) => 
    paciente.usuario?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (paciente.usuario?.cpf && paciente.usuario.cpf.includes(searchTerm))
  );
  
  // Mutation para alternar status ativo/inativo
  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number, ativo: boolean }) => {
      await apiRequest("PATCH", `/api/pacientes/${id}/status`, { ativo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
      toast({
        title: "Status atualizado",
        description: "O status do paciente foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do paciente.",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (id: number) => {
    setEditing(id);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setEditing(null);
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/pacientes/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
      toast({ title: "Paciente excluído", description: "O paciente foi excluído com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao excluir paciente", description: "Ocorreu um erro ao excluir o paciente. Tente novamente mais tarde." });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-neutral-800">Gerenciamento de Pacientes</h1>
            
            {/* Dica de onboarding para gerenciamento de pacientes */}
            <OnboardingTip
              id="pacientes-management"
              title="Gerenciamento de Pacientes"
              side="right"
              className="ml-2"
              delayMs={1000}
            >
              <p>
                Aqui você pode cadastrar, editar e gerenciar todos os pacientes da clínica.
              </p>
              <p className="mt-1">
                Use a barra de pesquisa para encontrar pacientes específicos por nome, email ou CPF.
              </p>
              {isAdminOrSecretaria && (
                <p className="mt-1">
                  Como {user?.tipo === "admin" ? "administrador" : "secretária"}, você pode adicionar novos pacientes, editar informações e alterar o status.
                </p>
              )}
              {isPsicologo && (
                <p className="mt-1">
                  Como psicólogo, você pode visualizar a lista de pacientes para consulta.
                </p>
              )}
            </OnboardingTip>
          </div>
          
          {isAdminOrSecretaria && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar Planilha
              </Button>
              <Button onClick={() => {
                setEditing(null); // Garantir que estamos criando um novo paciente
                setOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Paciente
              </Button>
            </div>
          )}
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPacientes && filteredPacientes.length > 0 ? (
                    filteredPacientes.map((paciente: any) => (
                      <TableRow 
                        key={paciente.id} 
                        className={paciente.usuario?.ativo === false ? "bg-neutral-50" : undefined}
                      >
                        <TableCell className="font-medium">
                          {paciente.usuario?.nome || 'Nome não disponível'}
                        </TableCell>
                        <TableCell>{paciente.usuario?.email || 'Email não disponível'}</TableCell>
                        <TableCell>{paciente.usuario?.telefone || "Não informado"}</TableCell>
                        <TableCell>{paciente.usuario?.cpf || "Não informado"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={paciente.usuario?.ativo ? "default" : "outline"} 
                            className={paciente.usuario?.ativo ? "bg-success" : "text-neutral-500"}
                          >
                            {paciente.usuario?.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isAdminOrSecretaria ? (
                                <>
                                  <DropdownMenuItem onClick={() => openEditDialog(paciente.id)}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleAtivoMutation.mutate({
                                      id: paciente.id, 
                                      ativo: !paciente.usuario?.ativo
                                    })}
                                  >
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    {paciente.usuario?.ativo ? "Desativar" : "Ativar"}
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                // Para psicólogos, apenas visualização
                                <DropdownMenuItem onClick={() => window.location.href = `/pacientes/${paciente.id}`}>
                                  <Eye className="mr-2 h-4 w-4" /> Visualizar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
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

        {/* Componente para importação de planilha */}
        <ImportPatients
          open={importOpen}
          onOpenChange={setImportOpen}
          planosSaude={planosSaude}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
            toast({
              title: "Importação concluída",
              description: "Os pacientes foram importados com sucesso."
            });
          }}
        />
      </div>
    </Layout>
  );
}
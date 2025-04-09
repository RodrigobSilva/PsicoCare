import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Loader2, Plus, Search, Edit, Trash2, FileText, ChartBarStacked } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PlanoForm from "@/components/planos-saude/plano-form";

export default function PlanosSaude() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPlanoId, setEditingPlanoId] = useState<number | null>(null);
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  const { toast } = useToast();

  // Mutation para deletar plano
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/planos-saude/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planos-saude"] });
      toast({
        title: "Plano excluído",
        description: "O plano foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o plano.",
        variant: "destructive",
      });
    },
  });

  // Carregar lista de planos de saúde
  const { data: planos, isLoading } = useQuery({
    queryKey: ["/api/planos-saude"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/planos-saude");
      return res.json();
    },
  });

  // Carregar detalhes do plano selecionado
  const { data: planoDetalhes, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ["/api/planos-saude", selectedPlano?.id],
    queryFn: async () => {
      if (!selectedPlano?.id) return null;
      const res = await apiRequest("GET", `/api/planos-saude/${selectedPlano.id}`);
      return res.json();
    },
    enabled: !!selectedPlano?.id,
  });

  // Filtrar planos baseado na busca
  const filteredPlanos = planos?.filter((plano: any) => 
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plano.codigo && plano.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handler para abrir formulário de edição
  const handleEditPlano = (id: number) => {
    setEditingPlanoId(id);
    setIsFormOpen(true);
  };

  // Handler para abrir novo formulário
  const handleNewPlano = () => {
    setEditingPlanoId(null);
    setIsFormOpen(true);
  };

  // Handler para ver detalhes do plano
  const handleViewDetails = (plano: any) => {
    setSelectedPlano(plano);
    setIsDetailsOpen(true);
  };

  // Formatar valor monetário
  const formatarValor = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined) return "Não informado";
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor / 100); // Converter centavos para reais
  };

  // Formatar percentual
  const formatarPercentual = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined) return "Não informado";
    return `${valor}%`;
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Planos de Saúde</h1>
          <Button onClick={handleNewPlano}>
            <Plus className="mr-2 h-4 w-4" /> Novo Plano
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Buscar planos de saúde..."
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
                <TableCaption>Lista de planos de saúde cadastrados no sistema</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Valor da Consulta</TableHead>
                    <TableHead>Repasse ao Psicólogo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlanos && filteredPlanos.length > 0 ? (
                    filteredPlanos.map((plano: any) => (
                      <TableRow key={plano.id}>
                        <TableCell className="font-medium">{plano.nome}</TableCell>
                        <TableCell>{plano.codigo || "Não informado"}</TableCell>
                        <TableCell>{formatarValor(plano.valorConsulta)}</TableCell>
                        <TableCell>{formatarPercentual(plano.percentualRepasse)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={plano.ativo ? "default" : "outline"} 
                            className={plano.ativo ? "bg-success" : "text-neutral-500"}
                          >
                            {plano.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(plano)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditPlano(plano.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este plano?')) {
                                deleteMutation.mutate(plano.id);
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
                      <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
                        {searchTerm ? "Nenhum plano encontrado para a busca." : "Nenhum plano cadastrado."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        {/* Diálogo de Formulário */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlanoId ? "Editar Plano de Saúde" : "Novo Plano de Saúde"}</DialogTitle>
              <DialogDescription>
                {editingPlanoId 
                  ? "Atualize as informações do plano de saúde no formulário abaixo." 
                  : "Preencha o formulário para cadastrar um novo plano de saúde."}
              </DialogDescription>
            </DialogHeader>
            <PlanoForm 
              planoId={editingPlanoId}
              onSuccess={() => {
                setIsFormOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/planos-saude"] });
                toast({
                  title: editingPlanoId ? "Plano atualizado" : "Plano cadastrado",
                  description: editingPlanoId
                    ? "As informações do plano foram atualizadas com sucesso."
                    : "O plano foi cadastrado com sucesso no sistema.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de Detalhes */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Plano de Saúde</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre o plano e estatísticas de uso
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlano && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedPlano.nome}</CardTitle>
                    <CardDescription>Informações gerais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-500">Código</p>
                        <p className="font-medium">{selectedPlano.codigo || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Status</p>
                        <Badge 
                          variant={selectedPlano.ativo ? "default" : "outline"} 
                          className={selectedPlano.ativo ? "bg-success" : "text-neutral-500"}
                        >
                          {selectedPlano.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Valor da Consulta</p>
                        <p className="font-medium">{formatarValor(selectedPlano.valorConsulta)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Repasse ao Psicólogo</p>
                        <p className="font-medium">{formatarPercentual(selectedPlano.percentualRepasse)}</p>
                      </div>
                    </div>
                    
                    {selectedPlano.observacoes && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Observações</p>
                        <p className="text-sm">{selectedPlano.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                    <CardDescription>Utilização do plano</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Pacientes</h3>
                            <p className="text-sm text-neutral-500">usuários deste plano</p>
                          </div>
                        </div>
                        <span className="text-xl font-semibold">24</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Sessões</h3>
                            <p className="text-sm text-neutral-500">no último mês</p>
                          </div>
                        </div>
                        <span className="text-xl font-semibold">36</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Faturamento</h3>
                            <p className="text-sm text-neutral-500">no último mês</p>
                          </div>
                        </div>
                        <span className="text-xl font-semibold">R$ 4.680,00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Histórico de Sessões</CardTitle>
                    <CardDescription>Últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center justify-center bg-neutral-50 rounded">
                      <div className="text-center">
                        <ChartBarStacked className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                        <p className="text-neutral-500">Gráfico de sessões por mês</p>
                        <p className="text-neutral-400 text-sm mt-1">Implementação em desenvolvimento</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </Button>
              {selectedPlano && (
                <Button onClick={() => {
                  setIsDetailsOpen(false);
                  handleEditPlano(selectedPlano.id);
                }}>
                  Editar Plano
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// Ícones utilizados no componente
function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

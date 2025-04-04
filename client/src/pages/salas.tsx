import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Building, 
  Home 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SalaForm from "@/components/salas/sala-form";
import FilialForm from "@/components/salas/filial-form";
import { Badge } from "@/components/ui/badge";

export default function Salas() {
  const [activeTab, setActiveTab] = useState("filiais");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilialModalOpen, setIsFilialModalOpen] = useState(false);
  const [isSalaModalOpen, setIsSalaModalOpen] = useState(false);
  const [editingFilialId, setEditingFilialId] = useState<number | null>(null);
  const [editingSalaId, setEditingSalaId] = useState<number | null>(null);
  const [selectedFilial, setSelectedFilial] = useState<any>(null);
  const { toast } = useToast();

  // Carregar lista de filiais
  const { data: filiais, isLoading: isLoadingFiliais } = useQuery({
    queryKey: ["/api/filiais"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/filiais");
      return res.json();
    },
  });

  // Carregar lista de salas
  const { data: salas, isLoading: isLoadingSalas } = useQuery({
    queryKey: ["/api/salas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/salas");
      return res.json();
    },
  });

  // Carregar detalhes da filial selecionada
  const { data: filialDetalhes, isLoading: isLoadingFilialDetalhes } = useQuery({
    queryKey: ["/api/filiais", selectedFilial?.id],
    queryFn: async () => {
      if (!selectedFilial?.id) return null;
      const res = await apiRequest("GET", `/api/filiais/${selectedFilial.id}`);
      return res.json();
    },
    enabled: !!selectedFilial?.id,
  });

  // Filtrar filiais baseado na busca
  const filteredFiliais = filiais?.filter((filial: any) => 
    filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar salas baseado na busca
  const filteredSalas = salas?.filter((sala: any) => 
    sala.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sala.filial?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers para edição de filial
  const handleEditFilial = (id: number) => {
    setEditingFilialId(id);
    setIsFilialModalOpen(true);
  };

  // Handlers para edição de sala
  const handleEditSala = (id: number) => {
    setEditingSalaId(id);
    setIsSalaModalOpen(true);
  };

  // Handler para seleção de filial
  const handleSelectFilial = (filial: any) => {
    setSelectedFilial(filial);
  };

  // Fechar dialogo de filial
  const handleCloseFilialDialog = () => {
    setEditingFilialId(null);
    setIsFilialModalOpen(false);
  };

  // Fechar dialogo de sala
  const handleCloseSalaDialog = () => {
    setEditingSalaId(null);
    setIsSalaModalOpen(false);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Gestão de Salas e Filiais</h1>
          
          <div className="flex gap-2">
            {activeTab === "filiais" ? (
              <Button onClick={() => setIsFilialModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Filial
              </Button>
            ) : (
              <Button onClick={() => setIsSalaModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Sala
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="filiais" className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              Filiais
            </TabsTrigger>
            <TabsTrigger value="salas" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Salas
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo de Filiais */}
          <TabsContent value="filiais">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Lista de Filiais</CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                      <Input
                        placeholder="Buscar filiais..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[calc(100vh-380px)] overflow-y-auto">
                    {isLoadingFiliais ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {filteredFiliais && filteredFiliais.length > 0 ? (
                          filteredFiliais.map((filial: any) => (
                            <div 
                              key={filial.id} 
                              className={`p-4 cursor-pointer hover:bg-neutral-50 ${
                                selectedFilial?.id === filial.id ? 'bg-primary-light bg-opacity-10' : ''
                              }`}
                              onClick={() => handleSelectFilial(filial)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-neutral-800">{filial.nome}</h3>
                                  <div className="flex items-center text-sm text-neutral-500 mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {filial.cidade}, {filial.estado}
                                  </div>
                                </div>
                                <Badge 
                                  variant={filial.ativa ? "default" : "outline"} 
                                  className={filial.ativa ? "bg-success" : "text-neutral-500"}
                                >
                                  {filial.ativa ? "Ativa" : "Inativa"}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-neutral-500">
                            {searchTerm ? 
                              "Nenhuma filial encontrada para a busca." : 
                              "Nenhuma filial cadastrada."
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                {selectedFilial ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedFilial.nome}</CardTitle>
                          <CardDescription>Detalhes da filial</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditFilial(selectedFilial.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {isLoadingFilialDetalhes ? (
                        <div className="flex justify-center items-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500">Endereço</h3>
                              <p className="text-neutral-800">{selectedFilial.endereco}</p>
                              <p className="text-neutral-800">
                                {selectedFilial.cidade}, {selectedFilial.estado}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-neutral-500">Contato</h3>
                              <p className="text-neutral-800">{selectedFilial.telefone || "Não informado"}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-neutral-500 mb-2">Salas</h3>
                            {filialDetalhes?.salas && filialDetalhes.salas.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filialDetalhes.salas.map((sala: any) => (
                                  <Card key={sala.id} className="border border-neutral-200">
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-neutral-800">{sala.nome}</h4>
                                          {sala.capacidade && (
                                            <p className="text-sm text-neutral-500">
                                              Capacidade: {sala.capacidade} pessoas
                                            </p>
                                          )}
                                        </div>
                                        <Badge 
                                          variant={sala.ativa ? "default" : "outline"} 
                                          className={sala.ativa ? "bg-success" : "text-neutral-500"}
                                        >
                                          {sala.ativa ? "Ativa" : "Inativa"}
                                        </Badge>
                                      </div>
                                      {sala.descricao && (
                                        <p className="text-sm text-neutral-600 mt-2">{sala.descricao}</p>
                                      )}
                                      <div className="flex justify-end mt-3">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => handleEditSala(sala.id)}
                                        >
                                          <Edit className="h-3 w-3 mr-1" /> Editar
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-6 bg-neutral-50 rounded-md">
                                <p className="text-neutral-500">Nenhuma sala cadastrada para esta filial.</p>
                                <Button 
                                  variant="outline" 
                                  className="mt-2"
                                  onClick={() => {
                                    setIsSalaModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Adicionar Sala
                                </Button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12">
                    <div className="text-center">
                      <Building className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-neutral-700 font-medium">Selecione uma filial</h3>
                      <p className="text-neutral-500 mt-1">Selecione uma filial para visualizar seus detalhes.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Conteúdo de Salas */}
          <TabsContent value="salas">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                  <Input
                    placeholder="Buscar salas..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {isLoadingSalas ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Lista de salas cadastradas no sistema</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Filial</TableHead>
                        <TableHead>Capacidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalas && filteredSalas.length > 0 ? (
                        filteredSalas.map((sala: any) => (
                          <TableRow key={sala.id}>
                            <TableCell className="font-medium">{sala.nome}</TableCell>
                            <TableCell>{sala.filial?.nome || "Desconhecida"}</TableCell>
                            <TableCell>{sala.capacidade || "Não definida"}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={sala.ativa ? "default" : "outline"} 
                                className={sala.ativa ? "bg-success" : "text-neutral-500"}
                              >
                                {sala.ativa ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditSala(sala.id)}>
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
                            {searchTerm ? "Nenhuma sala encontrada para a busca." : "Nenhuma sala cadastrada."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Diálogo para Filial */}
        <Dialog open={isFilialModalOpen} onOpenChange={setIsFilialModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFilialId ? "Editar Filial" : "Nova Filial"}</DialogTitle>
              <DialogDescription>
                {editingFilialId
                  ? "Atualize as informações da filial no formulário abaixo."
                  : "Preencha o formulário para cadastrar uma nova filial."}
              </DialogDescription>
            </DialogHeader>
            <FilialForm 
              filialId={editingFilialId}
              onSuccess={() => {
                handleCloseFilialDialog();
                queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
                toast({
                  title: editingFilialId ? "Filial atualizada" : "Filial cadastrada",
                  description: editingFilialId
                    ? "As informações da filial foram atualizadas com sucesso."
                    : "A filial foi cadastrada com sucesso no sistema.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
        
        {/* Diálogo para Sala */}
        <Dialog open={isSalaModalOpen} onOpenChange={setIsSalaModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSalaId ? "Editar Sala" : "Nova Sala"}</DialogTitle>
              <DialogDescription>
                {editingSalaId
                  ? "Atualize as informações da sala no formulário abaixo."
                  : "Preencha o formulário para cadastrar uma nova sala."}
              </DialogDescription>
            </DialogHeader>
            <SalaForm 
              salaId={editingSalaId}
              defaultFilialId={selectedFilial?.id}
              onSuccess={() => {
                handleCloseSalaDialog();
                queryClient.invalidateQueries({ queryKey: ["/api/salas"] });
                queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
                toast({
                  title: editingSalaId ? "Sala atualizada" : "Sala cadastrada",
                  description: editingSalaId
                    ? "As informações da sala foram atualizadas com sucesso."
                    : "A sala foi cadastrada com sucesso no sistema.",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

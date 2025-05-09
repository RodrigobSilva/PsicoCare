import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
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
  ChartBarStacked, 
  CircleDollarSign, 
  Search, 
  ClipboardList, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterPlanoSaude, setFilterPlanoSaude] = useState("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Carregar lista de pagamentos
  const { data: pagamentos, isLoading: isLoadingPagamentos } = useQuery({
    queryKey: ["/api/pagamentos", { 
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString()
    }],
    queryFn: async () => {
      // Construir parâmetros de filtro para a requisição
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("dateTo", dateRange.to.toISOString());
      }
      
      try {
        console.log("Buscando pagamentos com filtros:", Object.fromEntries(params.entries()));
        const res = await apiRequest("GET", `/api/pagamentos?${params.toString()}`);
        if (!res.ok) {
          // Se houver erro de autenticação, retornar array vazio
          if (res.status === 401) {
            console.error("Usuário não autenticado ao buscar pagamentos");
            return [];
          }
          throw new Error(`Erro ao buscar pagamentos: ${res.status} ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar pagamentos:", error);
        return [];
      }
    },
  });

  // Carregar lista de planos de saúde
  const { data: planosSaude, isLoading: isLoadingPlanosSaude } = useQuery({
    queryKey: ["/api/planos-saude"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/planos-saude");
      return res.json();
    },
  });

  // Filtrar pagamentos
  const filteredPagamentos = pagamentos?.filter((pagamento: any) => {
    // Verifica se o pagamento e o atendimento têm as propriedades necessárias
    if (!pagamento || !pagamento.atendimento || 
        !pagamento.atendimento.paciente || !pagamento.atendimento.paciente.usuario ||
        !pagamento.atendimento.psicologo || !pagamento.atendimento.psicologo.usuario) {
      return false;
    }
    
    // Filtro de busca - com verificações de segurança
    const pacienteNome = pagamento.atendimento.paciente.usuario.nome || '';
    const psicologoNome = pagamento.atendimento.psicologo.usuario.nome || '';
    const searchMatch = (
      pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psicologoNome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filtro de status
    const statusMatch = filterStatus === "todos" || pagamento.status === filterStatus;
    
    // Filtro de plano de saúde
    let planoMatch = true;
    if (filterPlanoSaude !== "todos") {
      if (filterPlanoSaude === "particular") {
        planoMatch = !pagamento.atendimento.planoSaude;
      } else {
        planoMatch = pagamento.atendimento.planoSaude?.nome === filterPlanoSaude;
      }
    }
    
    return searchMatch && statusMatch && planoMatch;
  });

  // Calcular estatísticas financeiras
  const calcularEstatisticas = () => {
    if (!pagamentos || !Array.isArray(pagamentos)) return {
      totalRecebido: 0,
      totalPendente: 0,
      totalRepasses: 0,
      totalLiquido: 0
    };
    
    const totalRecebido = pagamentos
      .filter((p: any) => p.status === "pago")
      .reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
      
    const totalPendente = pagamentos
      .filter((p: any) => p.status === "pendente")
      .reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
      
    const totalRepasses = pagamentos
      .reduce((sum: number, p: any) => sum + (p.repassePsicologo || 0), 0);
      
    return {
      totalRecebido,
      totalPendente,
      totalRepasses,
      totalLiquido: totalRecebido - totalRepasses
    };
  };

  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor / 100); // Converter centavos para reais
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    if (!dataString) return "-";
    return format(new Date(dataString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Estatísticas financeiras
  const estatisticas = calcularEstatisticas();

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Financeiro</h1>
          
          <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="flex items-center">
              <ChartBarStacked className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center">
              <CircleDollarSign className="mr-2 h-4 w-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="repasses" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Repasses
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Financeiro */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-600 text-sm">Total Recebido</p>
                      <h3 className="text-2xl font-semibold text-neutral-800">
                        {formatarValor(estatisticas.totalRecebido)}
                      </h3>
                    </div>
                    <div className="w-12 h-12 bg-success bg-opacity-10 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="text-success" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-neutral-500 text-sm">
                      {pagamentos?.filter((p: any) => p.status === "pago")?.length || 0} pagamentos recebidos no período
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-600 text-sm">Total Pendente</p>
                      <h3 className="text-2xl font-semibold text-neutral-800">
                        {formatarValor(estatisticas.totalPendente)}
                      </h3>
                    </div>
                    <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-full flex items-center justify-center">
                      <ClipboardList className="text-warning" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-warning text-sm font-medium">
                      {pagamentos?.filter((p: any) => p.status === "pendente")?.length || 0} faturas
                    </span>
                    <span className="text-neutral-500 text-sm ml-2">aguardando pagamento</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-600 text-sm">Total de Repasses</p>
                      <h3 className="text-2xl font-semibold text-neutral-800">
                        {formatarValor(estatisticas.totalRepasses)}
                      </h3>
                    </div>
                    <div className="w-12 h-12 bg-danger bg-opacity-10 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="text-danger" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-neutral-500 text-sm">
                      {pagamentos?.length || 0} atendimentos no período
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-600 text-sm">Lucro Líquido</p>
                      <h3 className="text-2xl font-semibold text-neutral-800">
                        {formatarValor(estatisticas.totalLiquido)}
                      </h3>
                    </div>
                    <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      <CircleDollarSign className="text-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-neutral-500 text-sm">
                      {formatarValor(estatisticas.totalRecebido - estatisticas.totalRepasses)} após repasses aos profissionais
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle>Receitas por método de pagamento</CardTitle>
                  <CardDescription>Distribuição de receitas nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                    <div className="text-center p-6">
                      <ChartBarStacked className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500">Gráfico de receitas por método de pagamento</p>
                      <p className="text-neutral-400 text-sm mt-1">Implementação em desenvolvimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Últimos pagamentos</CardTitle>
                  <CardDescription>Pagamentos mais recentes</CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  <div className="divide-y divide-neutral-100">
                    {pagamentos && Array.isArray(pagamentos) && pagamentos.length > 0 ? 
                      pagamentos.slice(0, 5).map((pagamento: any) => {
                        if (!pagamento) return null;
                        
                        // Verifica se todos os dados necessários existem
                        const pacienteNome = pagamento?.atendimento?.paciente?.usuario?.nome || "Paciente não identificado";
                        const psicologoNome = pagamento?.atendimento?.psicologo?.usuario?.nome || "Psicólogo não identificado";
                        const dataRegistro = pagamento?.dataRegistro || "";
                        const metodoPagamento = pagamento?.metodoPagamento || "";
                        
                        return (
                          <div key={pagamento.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-neutral-800">
                                  {pacienteNome}
                                </p>
                                <p className="text-sm text-neutral-500">
                                  {psicologoNome}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-neutral-800">
                                  {formatarValor(pagamento.valor || 0)}
                                </p>
                                <Badge 
                                  variant={pagamento.status === "pago" ? "default" : "outline"}
                                  className={pagamento.status === "pago" ? "bg-success" : "text-warning"}
                                >
                                  {pagamento.status === "pago" ? "Pago" : "Pendente"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
                              <span>{formatarData(dataRegistro)}</span>
                              <span>
                                {metodoPagamento === "plano_saude" && "Plano de Saúde"}
                                {metodoPagamento === "dinheiro" && "Dinheiro"}
                                {metodoPagamento === "cartão" && "Cartão"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    : (
                      <div className="p-4 text-center text-neutral-500">
                        Nenhum pagamento registrado no período.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Lista de Pagamentos */}
          <TabsContent value="pagamentos">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                    <Input
                      placeholder="Buscar pagamentos..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pago">Pagos</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterPlanoSaude} onValueChange={setFilterPlanoSaude}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os planos</SelectItem>
                      <SelectItem value="particular">Particular</SelectItem>
                      {planosSaude?.map((plano: any) => (
                        <SelectItem key={plano.id} value={plano.nome}>
                          {plano.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoadingPagamentos ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Lista de pagamentos {dateRange?.from && dateRange?.to ? `de ${format(dateRange.from, 'dd/MM/yyyy')} até ${format(dateRange.to, 'dd/MM/yyyy')}` : ''}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Psicólogo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Forma de Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPagamentos && filteredPagamentos.length > 0 ? (
                        filteredPagamentos.map((pagamento: any) => {
                          // Verifica as propriedades necessárias
                          const pacienteNome = pagamento?.atendimento?.paciente?.usuario?.nome || "Paciente não identificado";
                          const psicologoNome = pagamento?.atendimento?.psicologo?.usuario?.nome || "Psicólogo não identificado";
                          const dataAtendimento = pagamento?.atendimento?.dataAtendimento || "";
                          
                          return (
                            <TableRow key={pagamento.id}>
                              <TableCell className="font-medium">
                                {pacienteNome}
                              </TableCell>
                              <TableCell>
                                {psicologoNome}
                              </TableCell>
                              <TableCell>
                                {formatarData(dataAtendimento)}
                              </TableCell>
                              <TableCell>
                                {formatarValor(pagamento.valor || 0)}
                              </TableCell>
                            <TableCell>
                              {pagamento?.metodoPagamento === "plano_saude" && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                  {pagamento?.atendimento?.planoSaude?.nome || "Plano de Saúde"}
                                </Badge>
                              )}
                              {pagamento?.metodoPagamento === "dinheiro" && (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                  Dinheiro
                                </Badge>
                              )}
                              {pagamento?.metodoPagamento === "cartão" && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                                  Cartão
                                </Badge>
                              )}
                              {!pagamento?.metodoPagamento && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                  Não especificado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={pagamento?.status === "pago" ? "default" : "outline"}
                                className={pagamento?.status === "pago" ? "bg-success" : "text-warning"}
                              >
                                {pagamento?.status === "pago" ? "Pago" : "Pendente"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
                            {searchTerm || filterStatus !== "todos" || filterPlanoSaude !== "todos"
                              ? "Nenhum pagamento encontrado com os filtros aplicados."
                              : "Nenhum pagamento registrado no período."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Repasses */}
          <TabsContent value="repasses">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Repasses de Planos de Saúde</CardTitle>
                  <CardDescription>
                    Acompanhamento dos repasses de honorários para psicólogos
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Psicólogo</TableHead>
                          <TableHead>Atendimentos</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">INSS (11%)</TableHead>
                          <TableHead className="text-right">Valor Líquido</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPagamentos ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                              <p className="text-neutral-500 mt-2">Carregando repasses...</p>
                            </TableCell>
                          </TableRow>
                        ) : pagamentos?.length ? (
                          pagamentos
                            .filter((p: any) => p.repassePsicologo > 0)
                            .map((pagamento: any) => {
                              const valorTotal = pagamento.valor;
                              const repasse = pagamento.repassePsicologo || 0;
                              const inss = Math.round(repasse * 0.11);
                              const liquido = repasse - inss;
                              
                              return (
                                <TableRow key={pagamento.id}>
                                  <TableCell className="font-medium">
                                    {pagamento?.atendimento?.psicologo?.usuario?.nome || "Psicólogo não identificado"}
                                  </TableCell>
                                  <TableCell>1</TableCell>
                                  <TableCell className="text-right">{formatarValor(valorTotal)}</TableCell>
                                  <TableCell className="text-right">{formatarValor(inss)}</TableCell>
                                  <TableCell className="text-right">{formatarValor(liquido)}</TableCell>
                                  <TableCell>
                                    <Badge className={pagamento?.status === "pago" ? "bg-success" : "bg-warning"}>
                                      {pagamento?.status === "pago" ? "Pago" : "Pendente"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-neutral-500">
                              Nenhum repasse encontrado no período selecionado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento por Plano de Saúde</CardTitle>
                  <CardDescription>
                    Valores a receber e recebidos por convênio no período
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plano de Saúde</TableHead>
                          <TableHead className="text-right">Atendimentos</TableHead>
                          <TableHead className="text-right">Valor Bruto</TableHead>
                          <TableHead className="text-right">Repasse</TableHead>
                          <TableHead className="text-right">Receita Líquida</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingPlanosSaude || isLoadingPagamentos ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                              <div className="flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                              <p className="text-neutral-500 mt-2">Carregando dados dos planos de saúde...</p>
                            </TableCell>
                          </TableRow>
                        ) : planosSaude?.length ? (
                          planosSaude.map((plano: any) => {
                            // Filtrar pagamentos deste plano
                            const pagamentosPlano = pagamentos?.filter((p: any) => {
                              // Verifica se o pagamento e o atendimento e planoSaude existem
                              if (!p || !p.atendimento || !p.atendimento.planoSaude) return false;
                              
                              // Compara os IDs do plano
                              return p.atendimento.planoSaude.id === plano.id;
                            }) || [];
                            
                            const totalAtendimentos = pagamentosPlano.length;
                            const valorBruto = pagamentosPlano.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
                            const valorRepasse = pagamentosPlano.reduce((sum: number, p: any) => sum + (p.repassePsicologo || 0), 0);
                            const receitaLiquida = valorBruto - valorRepasse;
                            
                            // Só mostrar se tiver pagamentos
                            return totalAtendimentos > 0 ? (
                              <TableRow key={plano.id}>
                                <TableCell className="font-medium">{plano.nome}</TableCell>
                                <TableCell className="text-right">{totalAtendimentos}</TableCell>
                                <TableCell className="text-right">{formatarValor(valorBruto)}</TableCell>
                                <TableCell className="text-right">{formatarValor(valorRepasse)}</TableCell>
                                <TableCell className="text-right">{formatarValor(receitaLiquida)}</TableCell>
                              </TableRow>
                            ) : null;
                          }).filter(Boolean)
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                              Nenhum plano de saúde cadastrado ou sem pagamentos no período.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Relatórios */}
          <TabsContent value="relatorios">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Disponíveis</CardTitle>
                  <CardDescription>
                    Selecione um relatório para gerar
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">Faturamento Mensal</h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            Relatório detalhado do faturamento mensal por período, psicólogo e tipo de pagamento.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-accent bg-opacity-10 flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">Repasses aos Profissionais</h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            Relatório de repasses realizados aos psicólogos com detalhamento por atendimento.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-secondary bg-opacity-10 flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">Faturamento por Plano de Saúde</h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            Detalhamento de valores faturados por plano de saúde e status de pagamento.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-info bg-opacity-10 flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-info" />
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">Inadimplência</h3>
                          <p className="text-sm text-neutral-500 mt-1">
                            Relatório de pagamentos em atraso e taxas de inadimplência por período.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Demonstrativo Financeiro</CardTitle>
                  <CardDescription>
                    Resumo financeiro do período selecionado
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-center p-12 h-80">
                    <div className="text-center">
                      <ChartBarStacked className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-700 font-medium">Demonstrativo em desenvolvimento</p>
                      <p className="text-neutral-500 mt-1">
                        Selecione um período e um tipo de relatório para gerar o demonstrativo financeiro.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import Layout from "@/components/layout/layout";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartBarStacked, 
  ChartPie, 
  ChartLine, 
  FileText, 
  Users, 
  CalendarRange, 
  DownloadCloud,
  Plus,
  Loader2
} from "lucide-react";
import { subDays } from "date-fns";

// Schema para o formulário de novo relatório
const novoRelatorioSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  tipo: z.string(),
  categoria: z.string(),
  descricao: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  periodoPadrao: z.number().int().min(1),
});

type NovoRelatorioFormValues = z.infer<typeof novoRelatorioSchema>;

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState("assistenciais");
  const [tipoRelatorio, setTipoRelatorio] = useState("sessoes_por_profissional");
  const [tipoRelatorioFinanceiro, setTipoRelatorioFinanceiro] = useState("faturamento_mensal");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Formato para relatórios assistenciais
  const opcoesRelatoriosAssistenciais = [
    { value: "sessoes_por_profissional", label: "Sessões por Profissional" },
    { value: "sessoes_por_tipo", label: "Sessões por Tipo de Atendimento" },
    { value: "novos_pacientes", label: "Novos Pacientes" },
    { value: "taxa_ocupacao", label: "Taxa de Ocupação de Salas" },
  ];

  // Formato para relatórios financeiros
  const opcoesRelatoriosFinanceiros = [
    { value: "faturamento_mensal", label: "Faturamento Mensal" },
    { value: "faturamento_planos", label: "Faturamento por Plano de Saúde" },
    { value: "repasses", label: "Repasses aos Profissionais" },
    { value: "inadimplencia", label: "Inadimplência" },
  ];

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Relatórios</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Relatório Personalizado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Relatório</DialogTitle>
                <DialogDescription>
                  Configure um novo relatório personalizado que ficará disponível no sistema.
                </DialogDescription>
              </DialogHeader>
              <NovoRelatorioForm onSuccess={() => {
                setIsDialogOpen(false);
                toast({
                  title: "Relatório criado",
                  description: "O novo relatório foi adicionado com sucesso.",
                });
              }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Período do Relatório</CardTitle>
              <CardDescription>
                Selecione o período para geração dos relatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DateRangePicker 
                value={dateRange}
                onChange={setDateRange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportar</CardTitle>
              <CardDescription>
                Baixe os relatórios em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full flex items-center" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar como PDF
                </Button>
                <Button className="w-full flex items-center" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar como Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="assistenciais" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Relatórios Assistenciais
            </TabsTrigger>
            <TabsTrigger value="financeiros" className="flex items-center">
              <ChartBarStacked className="mr-2 h-4 w-4" />
              Relatórios Financeiros
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="flex items-center">
              <CalendarRange className="mr-2 h-4 w-4" />
              Agendamentos
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da aba Relatórios Assistenciais */}
          <TabsContent value="assistenciais">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Tipo de Relatório</CardTitle>
                    <CardDescription>
                      Selecione o relatório desejado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um relatório" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcoesRelatoriosAssistenciais.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {opcoesRelatoriosAssistenciais.find(o => o.value === tipoRelatorio)?.label}
                    </CardTitle>
                    <CardDescription>
                      Visualização do relatório para o período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tipoRelatorio === "sessoes_por_profissional" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartBarStacked className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Sessões por Profissional</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de barras mostrando o número de sessões realizadas por cada profissional.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tipoRelatorio === "sessoes_por_tipo" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartPie className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Sessões por Tipo de Atendimento</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de pizza mostrando a distribuição de sessões por tipo de atendimento.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tipoRelatorio === "novos_pacientes" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartLine className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Novos Pacientes</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de linha mostrando a evolução de novos pacientes ao longo do tempo.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tipoRelatorio === "taxa_ocupacao" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartBarStacked className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Taxa de Ocupação de Salas</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de barras mostrando a taxa de ocupação de cada sala.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Conteúdo da aba Relatórios Financeiros */}
          <TabsContent value="financeiros">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Tipo de Relatório</CardTitle>
                    <CardDescription>
                      Selecione o relatório desejado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={tipoRelatorioFinanceiro} onValueChange={setTipoRelatorioFinanceiro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um relatório" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcoesRelatoriosFinanceiros.map((opcao) => (
                          <SelectItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {opcoesRelatoriosFinanceiros.find(o => o.value === tipoRelatorioFinanceiro)?.label}
                    </CardTitle>
                    <CardDescription>
                      Visualização do relatório para o período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tipoRelatorioFinanceiro === "faturamento_mensal" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartBarStacked className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Faturamento Mensal</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de barras mostrando o faturamento mensal.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tipoRelatorioFinanceiro === "faturamento_planos" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartPie className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Faturamento por Plano de Saúde</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de pizza mostrando a distribuição do faturamento por plano de saúde.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tipoRelatorioFinanceiro === "repasses" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartBarStacked className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Repasses aos Profissionais</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de barras mostrando os repasses realizados para cada profissional.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tipoRelatorioFinanceiro === "inadimplencia" && (
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartLine className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Inadimplência</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico de linha mostrando a evolução da inadimplência ao longo do tempo.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Conteúdo da aba Agendamentos */}
          <TabsContent value="agendamentos">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>
                      Filtre os dados do relatório
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Profissional</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os profissionais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os profissionais</SelectItem>
                          <SelectItem value="1">Dr. Carlos Mendes</SelectItem>
                          <SelectItem value="2">Dra. Maria Silva</SelectItem>
                          <SelectItem value="3">Dr. André Costa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Filial</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as filiais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todas as filiais</SelectItem>
                          <SelectItem value="1">Unidade Centro</SelectItem>
                          <SelectItem value="2">Unidade Norte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os status</SelectItem>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="realizado">Realizado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="md:col-span-9">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Agendamentos</CardTitle>
                    <CardDescription>
                      Análise de agendamentos para o período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-lg">
                          <h3 className="text-xl font-bold text-primary">152</h3>
                          <p className="text-sm text-neutral-500">Total de agendamentos</p>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-lg">
                          <h3 className="text-xl font-bold text-success">128</h3>
                          <p className="text-sm text-neutral-500">Sessões realizadas</p>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-lg">
                          <h3 className="text-xl font-bold text-danger">24</h3>
                          <p className="text-sm text-neutral-500">Cancelamentos</p>
                        </div>
                      </div>
                      
                      <div className="h-80 flex items-center justify-center bg-neutral-50 rounded">
                        <div className="text-center">
                          <ChartBarStacked className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-700 font-medium">Distribuição de Agendamentos</p>
                          <p className="text-neutral-500 mt-1">
                            Gráfico mostrando a distribuição de agendamentos por dia da semana e horário.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Componente de formulário para criar novo relatório
interface NovoRelatorioFormProps {
  onSuccess: () => void;
}

function NovoRelatorioForm({ onSuccess }: NovoRelatorioFormProps) {
  const form = useForm<NovoRelatorioFormValues>({
    resolver: zodResolver(novoRelatorioSchema),
    defaultValues: {
      nome: "",
      tipo: "grafico_barras",
      categoria: "assistencial",
      descricao: "",
      periodoPadrao: 30,
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  async function onSubmit(data: NovoRelatorioFormValues) {
    setIsLoading(true);
    try {
      // Simular API request (na implementação real, enviar para o servidor)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Novo relatório:", data);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const tiposRelatorio = [
    { value: "grafico_barras", label: "Gráfico de Barras" },
    { value: "grafico_linhas", label: "Gráfico de Linhas" },
    { value: "grafico_pizza", label: "Gráfico de Pizza" },
    { value: "tabela", label: "Tabela de Dados" },
  ];
  
  const categoriasRelatorio = [
    { value: "assistencial", label: "Assistencial" },
    { value: "financeiro", label: "Financeiro" },
    { value: "administrativo", label: "Administrativo" },
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Relatório</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Produtividade por Psicólogo" {...field} />
              </FormControl>
              <FormDescription>
                Um nome descritivo para o relatório
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoriasRelatorio.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Classificação do relatório
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Visualização</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiposRelatorio.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Formato de visualização dos dados
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o propósito deste relatório..." 
                  className="resize-none" 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Explique brevemente o propósito e os dados apresentados
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="periodoPadrao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período Padrão (dias)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1}
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Período padrão para análise de dados (em dias)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Relatório
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

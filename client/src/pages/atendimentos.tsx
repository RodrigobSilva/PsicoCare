
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { apiRequest } from "@/lib/queryClient";
import AtendimentoForm from "@/components/atendimento/atendimento-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Search, User, FileText, Edit, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Atendimentos() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAtendimentoForm, setShowAtendimentoForm] = useState(false);
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<number | null>(null);
  const isAdminOrPsicologo = user?.tipo === 'admin' || user?.tipo === 'psicologo';

  // Buscar atendimentos
  const { data: atendimentos, isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ["/api/atendimentos"],
    queryFn: async () => {
      const res = await fetch("/api/atendimentos");
      if (!res.ok) throw new Error("Erro ao buscar atendimentos");
      return res.json();
    },
  });

  // Buscar agendamentos
  const { data: agendamentos, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos"],
    queryFn: async () => {
      const res = await fetch("/api/agendamentos");
      if (!res.ok) throw new Error("Erro ao buscar agendamentos");
      return res.json();
    },
  });

  // Buscar próximas sessões agendadas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Filtra agendamentos para mostrar apenas os que ainda não foram atendidos
  const proximasConsultas = agendamentos?.filter((agendamento: any) => {
    const dataAgendamento = new Date(agendamento.data);
    const [hora, minuto] = agendamento.horaInicio.split(':');
    dataAgendamento.setHours(parseInt(hora), parseInt(minuto), 0, 0);
    const agora = new Date();
    return (dataAgendamento >= agora) && agendamento.status !== 'cancelado' && agendamento.status !== 'realizado';
  }).sort((a: any, b: any) => {
    const dataA = new Date(a.data);
    const dataB = new Date(b.data);
    if (dataA.getTime() !== dataB.getTime()) {
      return dataA.getTime() - dataB.getTime();
    }
    return a.horaInicio.localeCompare(b.horaInicio);
  }) || [];

  // Ordenar próximas consultas por data/hora
  proximasConsultas.sort((a: any, b: any) => {
    const dataA = new Date(a.data);
    const dataB = new Date(b.data);
    const compareData = dataA.getTime() - dataB.getTime();
    
    if (compareData !== 0) return compareData;
    
    // Se as datas forem iguais, ordenar por hora de início
    const [horaA, minutoA] = a.horaInicio.split(':').map(Number);
    const [horaB, minutoB] = b.horaInicio.split(':').map(Number);
    
    const compareHora = horaA - horaB;
    if (compareHora !== 0) return compareHora;
    
    return minutoA - minutoB;
  });

  // Atendimentos concluídos ordenados por data (mais recentes primeiro)
  const atendimentosConcluidos = atendimentos?.filter((atendimento: any) => 
    atendimento.status === 'concluido'
  ).sort((a: any, b: any) => {
    return new Date(b.dataHoraInicio).getTime() - new Date(a.dataHoraInicio).getTime();
  }) || [];

  // Filtrar atendimentos concluídos com base no termo de busca
  const filteredAtendimentos = atendimentosConcluidos.filter((atendimento: any) => {
    const pacienteNome = atendimento.paciente?.usuario?.nome || '';
    const psicologoNome = atendimento.psicologo?.usuario?.nome || '';
    const dataFormatada = format(new Date(atendimento.dataHoraInicio), "dd/MM/yyyy", { locale: ptBR });
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      pacienteNome.toLowerCase().includes(searchTermLower) ||
      psicologoNome.toLowerCase().includes(searchTermLower) ||
      dataFormatada.includes(searchTermLower) ||
      (atendimento.resumo || '').toLowerCase().includes(searchTermLower) ||
      (atendimento.observacoes || '').toLowerCase().includes(searchTermLower)
    );
  });

  const iniciarAtendimento = (agendamentoId: number) => {
    setSelectedAgendamentoId(agendamentoId);
    setLocation(`/atendimento/${agendamentoId}`);
  };

  const verAtendimento = (atendimentoId: number) => {
    // Implementar visualização detalhada do atendimento
    alert(`Visualizar atendimento ${atendimentoId}`);
  };

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Atendimentos</h1>
            <p className="text-muted-foreground">Gerencie os atendimentos e sessões terapêuticas</p>
          </div>
        </div>

        <Tabs defaultValue="proximas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="proximas">Próximas Sessões</TabsTrigger>
            <TabsTrigger value="historico">Histórico de Atendimentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="proximas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessões Agendadas</CardTitle>
                <CardDescription>
                  Visualize as próximas sessões e inicie os atendimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAgendamentos ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : proximasConsultas.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Calendar className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">Nenhuma sessão agendada</p>
                    <p className="text-sm">Não há próximas sessões agendadas no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proximasConsultas.map((agendamento: any) => {
                      const pacienteNome = agendamento.paciente?.usuario?.nome || 'Paciente não encontrado';
                      const psicologoNome = agendamento.psicologo?.usuario?.nome || 'Psicólogo não encontrado';
                      const dataFormatada = format(new Date(agendamento.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                      const isHoje = new Date(agendamento.data).getTime() === hoje.getTime();
                      
                      return (
                        <div key={agendamento.id} className="flex flex-col md:flex-row justify-between p-4 border rounded-lg">
                          <div className="space-y-2 mb-4 md:mb-0">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{pacienteNome}</span>
                              <Badge variant={isHoje ? "default" : "outline"}>
                                {isHoje ? "Hoje" : dataFormatada}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{agendamento.horaInicio} - {agendamento.horaFim}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <Badge variant="secondary">
                                {agendamento.modalidade === 'teleconsulta' ? 'Teleconsulta' : 'Presencial'}
                              </Badge>
                              {agendamento.psicologo && (
                                <span>• {psicologoNome}</span>
                              )}
                            </div>
                          </div>
                          
                          {isAdminOrPsicologo && (
                            <div className="flex items-center">
                              <Button onClick={() => iniciarAtendimento(agendamento.id)}>
                                Iniciar Atendimento
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atendimentos</CardTitle>
                <CardDescription>
                  Visualize os atendimentos realizados e seus detalhes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por paciente, psicólogo, data..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {isLoadingAtendimentos ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredAtendimentos.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">Nenhum atendimento encontrado</p>
                    <p className="text-sm">Não há atendimentos concluídos ou os filtros não retornaram resultados.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Psicólogo</TableHead>
                          <TableHead>Resumo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAtendimentos.map((atendimento: any) => {
                          const dataFormatada = format(new Date(atendimento.dataHoraInicio), "dd/MM/yyyy", { locale: ptBR });
                          const horaFormatada = format(new Date(atendimento.dataHoraInicio), "HH:mm", { locale: ptBR });
                          
                          return (
                            <TableRow key={atendimento.id}>
                              <TableCell className="font-medium">
                                {dataFormatada}
                                <div className="text-xs text-muted-foreground">{horaFormatada}</div>
                              </TableCell>
                              <TableCell>{atendimento.paciente?.usuario?.nome || "-"}</TableCell>
                              <TableCell>{atendimento.psicologo?.usuario?.nome || "-"}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {atendimento.resumo ? (
                                  <span title={atendimento.resumo}>
                                    {atendimento.resumo.length > 50
                                      ? `${atendimento.resumo.substring(0, 50)}...`
                                      : atendimento.resumo}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">Sem resumo</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => verAtendimento(atendimento.id)}
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

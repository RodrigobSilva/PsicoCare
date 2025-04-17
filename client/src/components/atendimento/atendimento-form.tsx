import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingTip } from "@/components/onboarding/onboarding-tip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, PlayCircle, StopCircle, FileText, Send, Video } from "lucide-react";
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AtendimentoFormProps {
  agendamentoId?: number;
  onSuccess?: () => void;
}

export default function AtendimentoForm({ agendamentoId, onSuccess }: AtendimentoFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [resumo, setResumo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState('');
  const [psicologoId, setPsicologoId] = useState<number | null>(null);
  const [sessaoIniciada, setSessaoIniciada] = useState(false);
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [transcricaoAutomatica, setTranscricaoAutomatica] = useState(false);
  const [linkTeleconsulta, setLinkTeleconsulta] = useState('');

  // Buscar agendamento pelo ID
  const { data: agendamento, isLoading: isLoadingAgendamento } = useQuery({
    queryKey: ['/api/agendamentos', agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return null;
      const res = await apiRequest("GET", `/api/agendamentos/${agendamentoId}`);
      return res.json();
    },
    enabled: !!agendamentoId
  });

  // Buscar atendimentos existentes para este agendamento
  const { data: atendimentosExistentes, isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['/api/atendimentos/agendamento', agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return [];
      const res = await apiRequest("GET", `/api/atendimentos/agendamento/${agendamentoId}`);
      return res.json();
    },
    enabled: !!agendamentoId
  });

  // Buscar psicólogos (para administradores)
  const { data: psicologos, isLoading: isLoadingPsicologos } = useQuery({
    queryKey: ['/api/psicologos'],
    queryFn: async () => {
      const res = await apiRequest("GET", '/api/psicologos');
      return res.json();
    },
    enabled: user?.tipo === 'admin'
  });

  // Verificar se o usuário atual é psicólogo
  const { data: psicologoAtual } = useQuery({
    queryKey: ['/api/psicologos/usuario', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.tipo !== 'psicologo') return null;
      const res = await apiRequest("GET", `/api/psicologos/usuario/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id && user?.tipo === 'psicologo'
  });

  // Iniciar atendimento
  const iniciarAtendimentoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/atendimentos', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Atendimento iniciado",
        description: "O atendimento foi iniciado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/atendimentos/agendamento', agendamentoId] });
      setSessaoIniciada(true);
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Finalizar atendimento
  const finalizarAtendimentoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/atendimentos/${data.id}`, {
        status: 'concluido',
        resumo: data.resumo,
        observacoes: data.observacoes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Atendimento finalizado",
        description: "O atendimento foi finalizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/atendimentos/agendamento', agendamentoId] });
      queryClient.invalidateQueries({ queryKey: ['/api/agendamentos', agendamentoId] });
      setSessaoIniciada(false);

      // Chamar callback onSuccess se existir
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation('/atendimentos');
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao finalizar atendimento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Gerar link para teleconsulta
  const gerarLinkTeleconsultaMutation = useMutation({
    mutationFn: async (agendamentoId: number) => {
      const response = await apiRequest('POST', '/api/teleconsulta/gerar-link', { agendamentoId });
      return response.json();
    },
    onSuccess: (data) => {
      setLinkTeleconsulta(data.link);
      toast({
        title: "Link gerado",
        description: "O link para a teleconsulta foi gerado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Enviar link para o paciente
  const enviarLinkMutation = useMutation({
    mutationFn: async (data: { agendamentoId: number, link: string, method: string }) => {
      const response = await apiRequest('POST', '/api/teleconsulta/enviar-link', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Link enviado",
        description: "O link para a teleconsulta foi enviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar link",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Gerar resumo via OpenAI
  const gerarResumoMutation = useMutation({
    mutationFn: async (transcricao: string) => {
      const response = await apiRequest('POST', '/api/openai/gerar-resumo', { transcricao });
      return response.json();
    },
    onSuccess: (data) => {
      setResumo(data.resumo);
      setGerandoResumo(false);
      toast({
        title: "Resumo gerado",
        description: "O resumo da sessão foi gerado com sucesso.",
      });
    },
    onError: (error) => {
      setGerandoResumo(false);
      toast({
        title: "Erro ao gerar resumo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Efeito para definir o psicólogo atual automaticamente se for um psicólogo
  useEffect(() => {
    if (user?.tipo === 'psicologo' && psicologoAtual) {
      setPsicologoId(psicologoAtual.id);
    }
  }, [user, psicologoAtual]);

  // Efeito para carregar dados do atendimento existente
  useEffect(() => {
    if (atendimentosExistentes && atendimentosExistentes.length > 0) {
      const ultimoAtendimento = atendimentosExistentes[atendimentosExistentes.length - 1];
      setStatus(ultimoAtendimento.status);
      setResumo(ultimoAtendimento.resumo || '');
      setObservacoes(ultimoAtendimento.observacoes || '');
      setSessaoIniciada(ultimoAtendimento.status === 'em_andamento');
    }
  }, [atendimentosExistentes]);

  // Iniciar atendimento
  const handleIniciarAtendimento = useCallback(() => {
    if (!psicologoId) {
      toast({
        title: "Selecione um psicólogo",
        description: "É necessário selecionar um psicólogo para iniciar o atendimento.",
        variant: "destructive",
      });
      return;
    }

    iniciarAtendimentoMutation.mutate({
      agendamentoId,
      psicologoId,
      status: 'em_andamento',
      dataHoraInicio: new Date().toISOString(),
    });

    // Se for uma teleconsulta, gerar link automaticamente
    if (agendamento?.remoto === true) {
      gerarLinkTeleconsultaMutation.mutate(agendamentoId!);
    }
  }, [agendamentoId, psicologoId, agendamento, iniciarAtendimentoMutation, gerarLinkTeleconsultaMutation, toast]);

  // Finalizar atendimento
  const handleFinalizarAtendimento = useCallback(() => {
    if (!atendimentosExistentes || atendimentosExistentes.length === 0) {
      toast({
        title: "Nenhum atendimento em andamento",
        description: "Não há atendimento em andamento para ser finalizado.",
        variant: "destructive",
      });
      return;
    }

    const ultimoAtendimento = atendimentosExistentes[atendimentosExistentes.length - 1];
    finalizarAtendimentoMutation.mutate({
      id: ultimoAtendimento.id,
      resumo,
      observacoes,
    });

    // Atualizar o status do agendamento para concluído
    apiRequest('PUT', `/api/agendamentos/${agendamentoId}`, {
      status: 'concluido'
    });
  }, [atendimentosExistentes, resumo, observacoes, finalizarAtendimentoMutation, toast, agendamentoId, onSuccess, setLocation]);

  // Simular geração de resumo via OpenAI
  const handleGerarResumo = useCallback(() => {
    setGerandoResumo(true);

    // Simulando uma transcrição para teste
    const transcricaoExemplo = "Na sessão de hoje, o paciente relatou dificuldades no ambiente de trabalho, " +
      "principalmente relacionadas a conflitos com colegas. Mencionou sintomas de ansiedade como preocupação excessiva, " +
      "dificuldade para dormir e tensão muscular. Discutimos técnicas de respiração e mindfulness para gerenciar a ansiedade " +
      "no momento em que ela surge. Combinamos que para a próxima sessão o paciente tentará identificar gatilhos específicos " +
      "que desencadeiam sua ansiedade no trabalho.";

    gerarResumoMutation.mutate(transcricaoExemplo);
  }, [gerarResumoMutation]);

  // Enviar link para o paciente
  const handleEnviarLink = useCallback((method: string) => {
    if (!linkTeleconsulta || !agendamentoId) {
      toast({
        title: "Link não gerado",
        description: "É necessário gerar um link antes de enviá-lo.",
        variant: "destructive",
      });
      return;
    }

    enviarLinkMutation.mutate({
      agendamentoId,
      link: linkTeleconsulta,
      method
    });
  }, [linkTeleconsulta, agendamentoId, enviarLinkMutation, toast]);

  // Acessar sala virtual
  const handleAcessarSalaVirtual = useCallback(() => {
    if (!linkTeleconsulta || !agendamentoId) {
      toast({
        title: "Link não gerado",
        description: "É necessário gerar um link antes de acessar a sala virtual.",
        variant: "destructive",
      });
      return;
    }

    // Navegando para a página de teleconsulta com o ID do agendamento
    setLocation(`/teleconsulta/${agendamentoId}`);
  }, [linkTeleconsulta, agendamentoId, setLocation, toast]);

  if (isLoadingAgendamento || isLoadingAtendimentos || isLoadingPsicologos) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!agendamento) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendamento não encontrado</CardTitle>
          <CardDescription>
            O agendamento solicitado não foi encontrado ou não está disponível.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setLocation('/agenda')} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Agenda
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isAdmin = user?.tipo === 'admin';
  const isPsicologo = user?.tipo === 'psicologo';
  const isTeleconsulta = agendamento.remoto === true;
  const atendimentoEmAndamento = sessaoIniciada;
  const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
  const horaInicio = agendamento.horaInicio;
  const horaFim = agendamento.horaFim;
  const statusAgendamento = agendamento.status;
  const pacienteNome = agendamento.paciente?.usuario?.nome || 'Paciente não encontrado';

  return (
    <div className="space-y-4">
      <Button onClick={() => setLocation('/atendimentos')} variant="outline" className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Atendimentos
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle>Atendimento</CardTitle>
              
              {/* Dica de onboarding para sessão de atendimento */}
              <OnboardingTip
                id="atendimento-session"
                title="Gerenciamento de Sessão"
                side="right"
                className="ml-2"
              >
                <p>
                  Esta é a tela de atendimento onde você gerencia a sessão terapêutica.
                </p>
                <p className="mt-1">
                  Aqui você pode iniciar e finalizar a sessão, registrar observações, gerar um resumo da consulta e acessar teleconsultas quando aplicável.
                </p>
                <p className="mt-1">
                  Todas as informações registradas serão salvas automaticamente no prontuário do paciente.
                </p>
              </OnboardingTip>
              
              <CardDescription>Gerenciamento da sessão terapêutica</CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge 
                variant={statusAgendamento === 'concluido' ? 'default' : 
                        statusAgendamento === 'cancelado' ? 'destructive' : 
                        statusAgendamento === 'confirmado' ? 'outline' : 'secondary'}
              >
                {format(new Date(agendamento.data), "'Sessão em' dd 'de' MMMM", { locale: ptBR })} - {agendamento.horaInicio.substring(0, 5)}
              </Badge>
              {agendamento.proximaSessao && (
                <Badge variant="outline">
                  Próxima sessão: {format(new Date(agendamento.proximaSessao.data), "dd 'de' MMMM", { locale: ptBR })} - {agendamento.proximaSessao.horaInicio.substring(0, 5)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Detalhes do Agendamento */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Detalhes da Sessão</h3>
              <p><span className="font-medium">Paciente:</span> {pacienteNome}</p>
              <p><span className="font-medium">Data:</span> {dataFormatada}</p>
              <p><span className="font-medium">Horário:</span> {horaInicio} - {horaFim}</p>
              <p>
                <span className="font-medium">Modalidade:</span> {' '}
                <Badge variant={isTeleconsulta ? 'outline' : 'secondary'}>
                  {isTeleconsulta ? 'Teleconsulta' : 'Presencial'}
                </Badge>
              </p>
              {agendamento.sala && (
                <p><span className="font-medium">Sala:</span> {agendamento.sala?.nome}</p>
              )}
              {agendamento.filial && (
                <p><span className="font-medium">Filial:</span> {agendamento.filial?.nome}</p>
              )}
            </div>

            {/* Seleção de Psicólogo (apenas para admin) */}
            {isAdmin && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Psicólogo Responsável</h3>
                <Select 
                  value={psicologoId?.toString() || ''} 
                  onValueChange={(value) => setPsicologoId(Number(value))}
                  disabled={atendimentoEmAndamento || statusAgendamento === 'concluido'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um psicólogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {psicologos?.map((psicologo: any) => (
                      <SelectItem key={psicologo.id} value={psicologo.id.toString()}>
                        {psicologo.usuario?.nome || `Psicólogo ${psicologo.id}`} - {psicologo.crp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Ações de Teleconsulta (apenas se for teleconsulta) */}
          {isTeleconsulta && (
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="text-lg font-semibold">Teleconsulta</h3>

              {!linkTeleconsulta ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => gerarLinkTeleconsultaMutation.mutate(agendamentoId!)}
                    disabled={!atendimentoEmAndamento || gerarLinkTeleconsultaMutation.isPending}
                  >
                    {gerarLinkTeleconsultaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Gerar Link Seguro
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-2 bg-muted rounded flex items-center justify-between">
                    <span className="font-mono text-sm truncate">{linkTeleconsulta}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleEnviarLink('email')} disabled={enviarLinkMutation.isPending}>
                      {enviarLinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="mr-2 h-4 w-4" /> Enviar por Email
                    </Button>
                    <Button onClick={() => handleEnviarLink('whatsapp')} disabled={enviarLinkMutation.isPending}>
                      {enviarLinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="mr-2 h-4 w-4" /> Enviar por WhatsApp
                    </Button>
                    <Button onClick={handleAcessarSalaVirtual}>
                      <Video className="mr-2 h-4 w-4" /> Acessar Sala Virtual
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controles da Sessão */}
          <div className="flex justify-between items-center border-t border-b py-4">
            {!atendimentoEmAndamento ? (
              <Button 
                onClick={handleIniciarAtendimento}
                disabled={iniciarAtendimentoMutation.isPending || statusAgendamento === 'concluido' || !psicologoId}
              >
                {iniciarAtendimentoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Sessão
              </Button>
            ) : (
              <Button 
                onClick={handleFinalizarAtendimento} 
                variant="destructive"
                disabled={finalizarAtendimentoMutation.isPending}
              >
                {finalizarAtendimentoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <StopCircle className="mr-2 h-4 w-4" /> Finalizar Sessão
              </Button>
            )}

            {atendimentoEmAndamento && (
              <div className="flex items-center">
                <div className="mr-2">Transcrição automática:</div>
                <div 
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${transcricaoAutomatica ? 'bg-primary' : 'bg-input'}`}
                  onClick={() => setTranscricaoAutomatica(!transcricaoAutomatica)}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${transcricaoAutomatica ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Formulário de Resumo e Observações */}
          {atendimentoEmAndamento && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label htmlFor="resumo">Resumo da Sessão</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGerarResumo}
                    disabled={gerandoResumo || !transcricaoAutomatica}
                  >
                    {gerandoResumo ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Gerar Resumo
                  </Button>
                </div>
                <Textarea
                  id="resumo"
                  value={resumo}
                  onChange={(e) => setResumo(e.target.value)}
                  rows={6}
                  className="resize-none"
                  placeholder={gerandoResumo ? "Gerando resumo..." : "Digite ou gere automaticamente o resumo da sessão..."}
                  disabled={gerandoResumo}
                />
                {!transcricaoAutomatica && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ative a transcrição automática para gerar resumos automaticamente.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Registre observações adicionais sobre a sessão..."
                />
              </div>
            </div>
          )}

          {/* Histórico de Sessões Anteriores */}
          {(atendimentosExistentes && atendimentosExistentes.length > 0 && atendimentosExistentes.some((a: any) => a.status === 'concluido')) && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Histórico de Sessões Anteriores</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {atendimentosExistentes
                  .filter((a: any) => a.status === 'concluido')
                  .map((atendimento: any) => (
                    <div key={atendimento.id} className="border rounded-md p-3">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">
                          {new Date(atendimento.dataHoraInicio).toLocaleDateString('pt-BR')} - 
                          {new Date(atendimento.dataHoraInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge variant="outline">Concluído</Badge>
                      </div>
                      {atendimento.resumo && (
                        <div className="mb-2">
                          <span className="text-sm font-medium">Resumo:</span>
                          <p className="text-sm whitespace-pre-line">{atendimento.resumo}</p>
                        </div>
                      )}
                      {atendimento.observacoes && (
                        <div>
                          <span className="text-sm font-medium">Observações:</span>
                          <p className="text-sm whitespace-pre-line">{atendimento.observacoes}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
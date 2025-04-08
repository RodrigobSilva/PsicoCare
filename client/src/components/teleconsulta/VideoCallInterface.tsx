import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Monitor, 
  ScreenShare,
  FileText,
  Save,
  Download,
  CircleDot
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoCallProps {
  sessionId?: string;
  pacienteId?: number;
  psicologoId?: number;
  onEndCall?: () => void;
  isHost?: boolean;
}

interface Transcricao {
  id?: number;
  texto: string;
  timestamp: string;
  duracao: number;
}

export default function VideoCallInterface({
  sessionId,
  pacienteId,
  psicologoId,
  onEndCall,
  isHost = false,
}: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("video");
  const [participants, setParticipants] = useState<string[]>(["Terapeuta", "Paciente"]);
  const [isLoading, setIsLoading] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);
  const [isGravando, setIsGravando] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [gravacaoURL, setGravacaoURL] = useState<string | null>(null);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [transcricaoAtiva, setTranscricaoAtiva] = useState(false);
  const [transcricoes, setTranscricoes] = useState<Transcricao[]>([]);
  const [resumoConsulta, setResumoConsulta] = useState("");
  const [showResumoDialog, setShowResumoDialog] = useState(false);
  const [salvandoResumo, setSalvandoResumo] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const gravarStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Simular a inicialização da videochamada
  useEffect(() => {
    const initializeCall = async () => {
      try {
        setIsLoading(true);
        // Aqui seria a integração real com uma API de videochamada
        // como WebRTC, Twilio, Daily.co, etc.
        
        // Simulando o atraso de inicialização
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Solicitar acesso à câmera e microfone
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          
          // Exibir o vídeo local
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // Em uma implementação real, aqui seria a conexão com o outro participante
          setIsCallActive(true);
          setIsLoading(false);
          
          toast({
            title: "Conexão estabelecida",
            description: "Você está conectado à videoconsulta",
          });
        } else {
          throw new Error("Seu navegador não suporta videochamadas");
        }
      } catch (error: any) {
        console.error("Erro ao iniciar chamada:", error);
        setCallError(error.message || "Não foi possível iniciar a videochamada");
        setIsLoading(false);
        
        toast({
          title: "Erro na conexão",
          description: error.message || "Não foi possível iniciar a videochamada",
          variant: "destructive",
        });
      }
    };
    
    initializeCall();
    
    // Função de limpeza para encerrar a chamada ao desmontar o componente
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  // Rolagem automática para o fim do chat quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const handleEndCall = async () => {
    try {
      // Parar todas as trilhas de mídia
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      setIsCallActive(false);
      
      // Em uma integração real, aqui seria feita uma chamada à API para encerrar a sessão
      await apiRequest("POST", `/api/teleconsultas/${sessionId}/encerrar`, {
        encerradoPor: user?.id,
        dataHoraFim: new Date().toISOString(),
      });
      
      toast({
        title: "Chamada encerrada",
        description: "A videoconsulta foi encerrada com sucesso",
      });
      
      // Se houver transcrições, mostrar diálogo para resumo
      if (transcricoes.length > 0) {
        // Se ainda não tiver um resumo, gerar automaticamente
        if (!resumoConsulta.trim()) {
          await gerarResumoAutomatico();
        }
        setShowResumoDialog(true);
      } else {
        // Sem transcrições, encerrar normalmente
        if (onEndCall) {
          onEndCall();
        } else {
          // Redirecionar para a página de resumo da consulta ou para a página inicial
          setLocation("/agenda");
        }
      }
    } catch (error) {
      console.error("Erro ao encerrar chamada:", error);
      toast({
        title: "Erro ao encerrar chamada",
        description: "Ocorreu um erro ao encerrar a chamada. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const toggleMicrophone = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      setIsMicMuted(!isMicMuted);
    }
  };
  
  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTracks = stream.getVideoTracks();
      
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Parar de compartilhar a tela
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject as MediaStream;
          const tracks = stream.getTracks();
          tracks.forEach(track => {
            if (track.kind === "video") {
              track.stop();
            }
          });
        }
        
        // Restaurar a câmera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
      } else {
        // Iniciar compartilhamento de tela
        // @ts-ignore - TypeScript não reconhece getDisplayMedia em alguns ambientes
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        if (localVideoRef.current) {
          const currentStream = localVideoRef.current.srcObject as MediaStream;
          const audioTracks = currentStream.getAudioTracks();
          
          // Combinar o áudio atual com o vídeo da tela
          const combinedStream = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...audioTracks
          ]);
          
          localVideoRef.current.srcObject = combinedStream;
          
          // Detectar quando o usuário parar o compartilhamento de tela
          screenStream.getVideoTracks()[0].onended = () => {
            toggleScreenShare();
          };
        }
      }
      
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error("Erro ao compartilhar tela:", error);
      toast({
        title: "Erro ao compartilhar tela",
        description: "Não foi possível iniciar o compartilhamento de tela",
        variant: "destructive",
      });
    }
  };
  
  const sendChatMessage = () => {
    if (newMessage.trim() === "") return;
    
    const newChatMessage = {
      sender: user?.nome || "Usuário",
      text: newMessage,
      time: new Date().toLocaleTimeString(),
    };
    
    setChatMessages([...chatMessages, newChatMessage]);
    setNewMessage("");
    
    // Em uma implementação real, aqui seria o envio da mensagem para o outro participante
  };
  
  // Função para lidar com o keydown no input do chat
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  };
  
  // Formatação do tempo de gravação (MM:SS)
  const formatarTempo = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Iniciar gravação da consulta
  const iniciarGravacao = async () => {
    try {
      if (!localVideoRef.current || !localVideoRef.current.srcObject) {
        throw new Error("Stream de vídeo não disponível");
      }
      
      // Combinar áudio e vídeo local com o áudio remoto para a gravação
      const localStream = localVideoRef.current.srcObject as MediaStream;
      const audioTracks = [...localStream.getAudioTracks()];
      const videoTracks = [...localStream.getVideoTracks()];
      
      // Em uma implementação real, também adicionaríamos o áudio remoto
      // se houvesse acesso a ele
      
      // Criar um stream combinado para gravação
      const combinedStream = new MediaStream([...audioTracks, ...videoTracks]);
      gravarStreamRef.current = combinedStream;
      
      // Inicializar o MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const recorder = new MediaRecorder(combinedStream, options);
      
      // Armazenar os chunks de dados conforme forem disponibilizados
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Quando a gravação for parada, criar o blob e URL para download
      recorder.onstop = () => {
        const completeBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(completeBlob);
        setGravacaoURL(url);
        
        // Se a transcrição estiver ativa, enviar o áudio para transcrição
        if (transcricaoAtiva) {
          solicitarTranscricao(completeBlob);
        }
      };
      
      // Iniciar a gravação
      recorder.start(1000); // Salvar dados a cada 1 segundo
      setMediaRecorder(recorder);
      setIsGravando(true);
      
      // Iniciar temporizador
      setTempoGravacao(0);
      timerIntervalRef.current = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Gravação iniciada",
        description: "A consulta está sendo gravada",
      });
    } catch (error: any) {
      console.error("Erro ao iniciar gravação:", error);
      toast({
        title: "Erro ao iniciar gravação",
        description: error.message || "Não foi possível iniciar a gravação",
        variant: "destructive",
      });
    }
  };
  
  // Parar gravação da consulta
  const pararGravacao = () => {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      // Parar temporizador
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      setIsGravando(false);
      setMediaRecorder(null);
      
      toast({
        title: "Gravação finalizada",
        description: "A consulta foi gravada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao parar gravação:", error);
      toast({
        title: "Erro ao finalizar gravação",
        description: error.message || "Ocorreu um erro ao finalizar a gravação",
        variant: "destructive",
      });
    }
  };
  
  // Solicitar transcrição do áudio gravado
  const solicitarTranscricao = async (blob: Blob) => {
    try {
      // Converter Blob para File
      const file = new File([blob], `consulta-${sessionId}-${new Date().toISOString()}.webm`, {
        type: 'video/webm'
      });
      
      // Criar FormData para envio
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('sessionId', sessionId || '');
      
      toast({
        title: "Processando transcrição",
        description: "Aguarde enquanto processamos o áudio da consulta",
      });
      
      // Enviar para API para transcrição
      const response = await fetch('/api/teleconsultas/transcrever', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar áudio para transcrição');
      }
      
      const resultado = await response.json();
      
      // Adicionar transcrição ao estado
      const novaTranscricao: Transcricao = {
        texto: resultado.texto,
        timestamp: new Date().toLocaleTimeString(),
        duracao: resultado.duracao
      };
      
      setTranscricoes(prev => [...prev, novaTranscricao]);
      
      toast({
        title: "Transcrição concluída",
        description: "O áudio da consulta foi transcrito com sucesso",
      });
      
    } catch (error: any) {
      console.error("Erro ao processar transcrição:", error);
      toast({
        title: "Erro na transcrição",
        description: error.message || "Não foi possível transcrever o áudio da consulta",
        variant: "destructive",
      });
    }
  };
  
  // Gerar resumo automático usando OpenAI
  const gerarResumoAutomatico = async () => {
    try {
      if (transcricoes.length === 0) {
        throw new Error("Não há transcrições disponíveis para gerar um resumo");
      }
      
      setSalvandoResumo(true);
      
      // Preparar texto completo das transcrições
      const textoCompleto = transcricoes.map(t => t.texto).join("\n\n");
      
      // Chamar a API para gerar resumo
      const response = await apiRequest("POST", "/api/resumo-consulta", {
        transcricoes
      });
      
      if (!response.ok) {
        throw new Error("Falha ao gerar resumo automático");
      }
      
      const resultado = await response.json();
      
      // Atualizar o estado com o resumo gerado
      setResumoConsulta(resultado.resumo);
      
      toast({
        title: "Resumo gerado",
        description: "O resumo da consulta foi gerado com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: error.message || "Não foi possível gerar o resumo da consulta",
        variant: "destructive",
      });
    } finally {
      setSalvandoResumo(false);
    }
  };
  
  // Salvar resumo no prontuário do paciente
  const salvarResumoConsulta = async () => {
    try {
      if (!resumoConsulta.trim()) {
        throw new Error("O resumo da consulta não pode estar vazio");
      }
      
      setSalvandoResumo(true);
      
      // Chamar API para salvar o resumo no prontuário
      const response = await apiRequest("POST", "/api/prontuarios", {
        pacienteId,
        psicologoId: user?.id,
        conteudo: resumoConsulta,
        data: new Date().toISOString(),
        consultaId: sessionId
      });
      
      if (!response.ok) {
        throw new Error("Falha ao salvar resumo no prontuário");
      }
      
      toast({
        title: "Resumo salvo",
        description: "O resumo da consulta foi salvo no prontuário com sucesso",
      });
      
      // Fechar o diálogo após salvar
      setShowResumoDialog(false);
      
    } catch (error: any) {
      console.error("Erro ao salvar resumo:", error);
      toast({
        title: "Erro ao salvar resumo",
        description: error.message || "Não foi possível salvar o resumo no prontuário",
        variant: "destructive",
      });
    } finally {
      setSalvandoResumo(false);
    }
  };
  
  // Renderização condicional para estado de carregamento
  if (isLoading) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium text-neutral-700">Estabelecendo conexão...</p>
          <p className="text-sm text-neutral-500">Por favor aguarde enquanto preparamos sua videoconsulta</p>
        </CardContent>
      </Card>
    );
  }
  
  // Renderização condicional para estado de erro
  if (callError) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-destructive/10 p-3 rounded-full mb-4">
            <VideoOff className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">Não foi possível iniciar a videoconsulta</h3>
          <p className="text-sm text-neutral-500 mb-4 text-center">{callError}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader className="pb-0">
          <CardTitle className="flex justify-between items-center">
            <span>Videoconsulta {sessionId ? `#${sessionId}` : ""}</span>
            <div className="text-sm font-normal bg-primary/10 text-primary py-1 px-3 rounded-full">
              {isCallActive ? "Em andamento" : "Desconectado"}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="video">
                <Video className="h-4 w-4 mr-2" />
                Vídeo
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="participants">
                <Users className="h-4 w-4 mr-2" />
                Participantes
              </TabsTrigger>
              <TabsTrigger value="transcricao">
                <FileText className="h-4 w-4 mr-2" />
                Transcrição
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[400px]">
                <div className="lg:col-span-2 relative">
                  {/* Vídeo remoto (outro participante) */}
                  <div className="relative h-full min-h-[400px] bg-neutral-100 rounded-lg overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 p-2 rounded-md bg-black/50 text-white text-sm">
                      Participante
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Vídeo local (usuário atual) */}
                  <div className="relative h-full min-h-[200px] bg-neutral-100 rounded-lg overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 p-2 rounded-md bg-black/50 text-white text-sm">
                      Você
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chat">
              <div className="border rounded-md h-[400px] flex flex-col">
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                      <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">As mensagens enviadas durante a consulta aparecerão aqui</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          msg.sender === user?.nome
                            ? "bg-primary/90 text-primary-foreground ml-auto"
                            : "bg-neutral-100 mr-auto"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{msg.sender}</span>
                          <span className="text-xs opacity-70">{msg.time}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-3 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button onClick={sendChatMessage} disabled={newMessage.trim() === ""}>
                    Enviar
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="participants">
              <div className="border rounded-md h-[400px] p-4">
                <h3 className="font-medium mb-4">Participantes ({participants.length})</h3>
                <ul className="space-y-2">
                  {participants.map((participant, index) => (
                    <li key={index} className="flex items-center p-2 border-b">
                      <div className="h-8 w-8 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center mr-3">
                        {participant.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{participant}</p>
                        <p className="text-xs text-neutral-500">
                          {index === 0 ? "Terapeuta" : "Paciente"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="transcricao">
              <div className="border rounded-md h-[400px] flex flex-col">
                <div className="p-3 border-b flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="transcrever"
                        checked={transcricaoAtiva}
                        onCheckedChange={setTranscricaoAtiva}
                        disabled={isGravando}
                      />
                      <Label htmlFor="transcrever">Transcrição Automática</Label>
                    </div>
                    
                    <Button
                      variant={isGravando ? "destructive" : "secondary"}
                      onClick={() => {
                        if (isGravando) {
                          pararGravacao();
                        } else {
                          iniciarGravacao();
                        }
                      }}
                      className="gap-2"
                      disabled={!isCallActive}
                    >
                      {isGravando ? (
                        <>
                          <CircleDot className="h-4 w-4 animate-pulse" />
                          Parar Gravação ({formatarTempo(tempoGravacao)})
                        </>
                      ) : (
                        <>
                          <CircleDot className="h-4 w-4" />
                          Gravar Consulta
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {gravacaoURL && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = gravacaoURL;
                        a.download = `consulta-${sessionId}-${new Date().toISOString().split('T')[0]}.webm`;
                        a.click();
                      }}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Gravação
                    </Button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {transcricoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                      <FileText className="h-12 w-12 mb-2 opacity-20" />
                      <p>Nenhuma transcrição disponível</p>
                      <p className="text-sm">Ative a transcrição automática ou grave a consulta para começar</p>
                    </div>
                  ) : (
                    <>
                      {transcricoes.map((transcricao, index) => (
                        <div key={index} className="bg-neutral-50 p-3 rounded-md border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-neutral-500">{transcricao.timestamp}</span>
                            <span className="text-xs text-neutral-400">{Math.round(transcricao.duracao)}s</span>
                          </div>
                          <p>{transcricao.texto}</p>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t mt-6">
                        <h4 className="font-medium mb-2">Resumo da Consulta</h4>
                        <Textarea
                          placeholder="Digite ou adicione automaticamente um resumo da consulta aqui..."
                          className="min-h-[100px]"
                          value={resumoConsulta}
                          onChange={(e) => setResumoConsulta(e.target.value)}
                        />
                        <div className="flex justify-between mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={gerarResumoAutomatico}
                            disabled={salvandoResumo || transcricoes.length === 0}
                            className="gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Resumir Automaticamente
                          </Button>
                          
                          <Button
                            variant="default"
                            size="sm"
                            onClick={salvarResumoConsulta}
                            disabled={salvandoResumo || !resumoConsulta.trim()}
                            className="gap-1"
                          >
                            {salvandoResumo ? (
                              <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Salvar no Prontuário
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant={isMicMuted ? "outline" : "secondary"}
              size="icon"
              onClick={toggleMicrophone}
              className={isMicMuted ? "border-destructive text-destructive" : ""}
            >
              {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isVideoEnabled ? "secondary" : "outline"}
              size="icon"
              onClick={toggleVideo}
              className={!isVideoEnabled ? "border-destructive text-destructive" : ""}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "secondary" : "outline"}
              size="icon"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <Monitor className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
            </Button>
          </div>
          
          <Button
            variant="destructive"
            onClick={handleEndCall}
            className="px-4"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            Encerrar Chamada
          </Button>
        </CardFooter>
      </Card>

      {/* Diálogo de resumo após encerrar a consulta */}
      <Dialog open={showResumoDialog} onOpenChange={setShowResumoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resumo da Consulta</DialogTitle>
            <DialogDescription>
              Revise e adicione informações ao resumo da consulta para o prontuário do paciente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-3">
            <Textarea
              placeholder="Digite ou adicione automaticamente um resumo da consulta aqui..."
              className="min-h-[150px]"
              value={resumoConsulta}
              onChange={(e) => setResumoConsulta(e.target.value)}
            />
            
            {transcricoes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={gerarResumoAutomatico}
                disabled={salvandoResumo}
                className="gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                Gerar Resumo Automático
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResumoDialog(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={salvarResumoConsulta}
              disabled={salvandoResumo || !resumoConsulta.trim()}
            >
              {salvandoResumo ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar no Prontuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
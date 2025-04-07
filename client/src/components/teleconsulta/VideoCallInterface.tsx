import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  ScreenShare 
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
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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
      
      // Chamar callback de término se fornecido
      if (onEndCall) {
        onEndCall();
      } else {
        // Redirecionar para a página de resumo da consulta ou para a página inicial
        setLocation("/agenda");
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
  );
}
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  MessageSquare,
  MonitorSmartphone,
  Users,
  Timer
} from "lucide-react";

interface VideoCallInterfaceProps {
  sessionId: string;
  pacienteId?: number;
  psicologoId?: number;
  onEndCall: () => void;
  isHost: boolean;
}

export default function VideoCallInterface({
  sessionId,
  pacienteId,
  psicologoId,
  onEndCall,
  isHost
}: VideoCallInterfaceProps) {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: number, sender: string, text: string, time: string}[]>([]);
  const [messageText, setMessageText] = useState("");
  const [currentTab, setCurrentTab] = useState("info");
  const [anotacoes, setAnotacoes] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Referências para os elementos de vídeo
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const userMediaStream = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Inicializar webcam e microfone
  useEffect(() => {
    // Função para iniciar o acesso à mídia
    async function startMedia() {
      try {
        setIsConnecting(true);
        // Solicitar acesso à câmera e microfone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        userMediaStream.current = stream;

        // Configurar o vídeo local
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setTimeout(() => {
          setIsConnecting(false);
          setIsConnected(true);
          startTimeRef.current = Date.now();

          // Iniciar o cronômetro da chamada
          timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsedTime(elapsed);
          }, 1000);

          // Registrar início de sessão (simulado)
          logSessionActivity("inicio");
        }, 2000);
      } catch (error) {
        console.error("Erro ao acessar câmera e microfone:", error);
        setIsConnecting(false);
        toast({
          variant: "destructive",
          title: "Erro de Mídia",
          description: "Não foi possível acessar sua câmera ou microfone. Verifique as permissões."
        });
      }
    }

    startMedia();

    // Cleanup na desmontagem
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (userMediaStream.current) {
        userMediaStream.current.getTracks().forEach(track => track.stop());
      }

      logSessionActivity("encerramento");
    };
  }, [toast]);

  // Registrar atividade na sessão
  const logSessionActivity = async (tipo: string) => {
    try {
      await apiRequest("POST", `/api/teleconsultas/${sessionId}/log`, {
        tipo,
        usuarioId: user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Erro ao registrar atividade '${tipo}':`, error);
    }
  };

  // Formatar o tempo decorrido
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Funções de controle de mídia
  const toggleMicrophone = () => {
    if (userMediaStream.current) {
      userMediaStream.current.getAudioTracks().forEach(track => {
        track.enabled = isMicMuted;
      });
    }
    setIsMicMuted(!isMicMuted);
    logSessionActivity(isMicMuted ? "microfone_ligado" : "microfone_desligado");
  };

  const toggleVideo = () => {
    if (userMediaStream.current) {
      userMediaStream.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
    logSessionActivity(isVideoOff ? "camera_ligada" : "camera_desligada");
  };

  // Iniciar/parar compartilhamento de tela
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      if (screenShareRef.current && screenShareRef.current.srcObject) {
        const tracks = (screenShareRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        screenShareRef.current.srcObject = null;
      }
      logSessionActivity("compartilhamento_tela_fim");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" }
      });

      if (screenShareRef.current) {
        screenShareRef.current.srcObject = stream;
        setIsScreenSharing(true);

        // Tratar o término do compartilhamento pelo usuário
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };

        logSessionActivity("compartilhamento_tela_inicio");
      }
    } catch (error) {
      console.error("Erro ao compartilhar tela:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível iniciar o compartilhamento de tela."
      });
    }
  };

  // Enviar mensagem de chat
  const sendMessage = () => {
    if (messageText.trim() === "") return;

    const newMessage = {
      id: chatMessages.length + 1,
      sender: user?.nome || "Você",
      text: messageText,
      time: new Date().toLocaleTimeString().substring(0, 5)
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessageText("");

    // Em uma implementação real, enviaríamos a mensagem via WebSocket
    logSessionActivity("mensagem_enviada");
  };

  // Salvar anotações
  const salvarAnotacoes = async () => {
    try {
      await apiRequest("POST", `/api/teleconsultas/${sessionId}/anotacoes`, {
        texto: anotacoes,
        usuarioId: user?.id,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Anotações salvas",
        description: "Suas anotações foram salvas com sucesso."
      });
    } catch (error) {
      console.error("Erro ao salvar anotações:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar suas anotações."
      });
    }
  };

  // Encerrar a chamada
  const endCall = () => {
    // Parar todos os streams de mídia
    if (userMediaStream.current) {
      userMediaStream.current.getTracks().forEach(track => track.stop());
    }

    if (screenShareRef.current && screenShareRef.current.srcObject) {
      const tracks = (screenShareRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }

    // Limpar o cronômetro
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Registrar término da chamada
    logSessionActivity("encerramento");

    // Voltar para a página anterior
    onEndCall();
  };

  // Renderizar interface da chamada
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow relative">
        {/* Área principal de vídeo */}
        <div className="lg:col-span-2 relative rounded-lg overflow-hidden bg-neutral-900 h-full min-h-[400px]">
          {isConnecting ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Conectando à chamada...</p>
              </div>
            </div>
          ) : isConnected ? (
            <>
              {/* Compartilhamento de tela (quando ativo) */}
              {isScreenSharing && (
                <div className="absolute inset-0 bg-black">
                  <video
                    ref={screenShareRef}
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                  />
                </div>
              )}

              {/* Vídeo remoto (sempre presente quando não há compartilhamento) */}
              {!isScreenSharing && (
                <div className="absolute inset-0">
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl text-primary">
                          {user?.tipo === "psicologo" ? "P" : "T"}
                        </span>
                      </div>
                      <p className="text-neutral-300">
                        {user?.tipo === "psicologo" ? "Paciente" : "Psicólogo"}
                      </p>
                      <p className="text-neutral-400 text-sm mt-2">
                        {psicologoId && pacienteId ? "Câmera não disponível" : "Aguardando participante..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vídeo local (miniatura) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-neutral-700 rounded overflow-hidden border-2 border-neutral-600 shadow-lg">
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                    <VideoOff className="h-6 w-6 text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Indicador de duração da chamada */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
                <Timer className="h-4 w-4 mr-2" />
                {formatElapsedTime(elapsedTime)}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center mb-4">
                  <VideoOff className="h-8 w-8 text-destructive" />
                </div>
                <p>Não foi possível estabelecer a conexão</p>
                <Button
                  variant="outline"
                  className="mt-4 text-white border-white hover:bg-white/10"
                  onClick={onEndCall}
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Painel lateral com abas */}
        <div className="flex flex-col">
          <Card className="flex-grow overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Teleconsulta</CardTitle>
                <TabsList>
                  <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                  <TabsTrigger value="notas" className="text-xs">Notas</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <CardContent className="overflow-auto h-[calc(100%-4rem)]">
              <TabsContent value="info" className="m-0 h-full">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">ID da Sessão</h3>
                    <p className="font-mono text-sm bg-neutral-100 p-2 rounded">{sessionId}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">
                      {user?.tipo === "psicologo" ? "Paciente" : "Psicólogo"}
                    </h3>
                    <p>
                      {user?.tipo === "psicologo"
                        ? `ID do Paciente: ${pacienteId || "N/A"}`
                        : `ID do Psicólogo: ${psicologoId || "N/A"}`}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Duração</h3>
                    <p>{formatElapsedTime(elapsedTime)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Status</h3>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                      <p>{isConnected ? "Conectado" : "Desconectado"}</p>
                    </div>
                  </div>

                  {isHost && (
                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Ações do Anfitrião</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Convidar</span>
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center justify-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span className="text-xs">Desconectar</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chat" className="m-0 h-full flex flex-col">
                <div className="flex-grow overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-neutral-500 py-6">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className="bg-neutral-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{msg.sender}</span>
                          <span className="text-neutral-500 text-xs">{msg.time}</span>
                        </div>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    disabled={messageText.trim() === ""}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notas" className="m-0 h-full flex flex-col">
                <div className="mb-2">
                  <p className="text-sm text-neutral-500 mb-2">
                    Suas anotações são privadas e só ficam visíveis para você.
                  </p>
                </div>

                <Textarea
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Faça anotações durante a consulta..."
                  className="flex-grow resize-none min-h-[200px]"
                />

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={salvarAnotacoes}
                    disabled={anotacoes.trim() === ""}
                  >
                    Salvar Anotações
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controles da chamada */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-center space-x-4">
          <Button
            variant={isMicMuted ? "outline" : "default"}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={toggleMicrophone}
            disabled={!isConnected}
          >
            {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button
            variant={isVideoOff ? "outline" : "default"}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={toggleVideo}
            disabled={!isConnected}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={toggleScreenShare}
            disabled={!isConnected}
          >
            <MonitorSmartphone className="h-6 w-6" />
          </Button>

          <Button
            variant={currentTab === "chat" ? "default" : "outline"}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={() => setCurrentTab(currentTab === "chat" ? "info" : "chat")}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={endCall}
          >
            <Phone className="h-6 w-6 rotate-135" />
          </Button>
        </div>
      </div>
    </div>
  );
}
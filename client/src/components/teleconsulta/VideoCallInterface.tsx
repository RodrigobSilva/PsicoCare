import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare } from "lucide-react";

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
  const [isConnected, setIsConnected] = useState(true);
  const { user } = useAuth();

  // Referências para os elementos de vídeo
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Simulação de sessão de vídeo
  useEffect(() => {
    // Em um cenário real, aqui estabeleceríamos a conexão WebRTC
    console.log(`Iniciando chamada para a sessão ${sessionId}`);
    
    // Apenas para simular uma chamada
    const timer = setTimeout(() => {
      console.log("Chamada estabelecida");
      setIsConnected(true);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      console.log("Limpando recursos da chamada");
    };
  }, [sessionId]);

  // Funções de controle
  const toggleMicrophone = () => {
    setIsMicMuted(!isMicMuted);
    // Em um cenário real, controlaríamos o microfone real aqui
    console.log(`Microfone ${!isMicMuted ? 'mutado' : 'ativado'}`);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // Em um cenário real, controlaríamos a câmera real aqui
    console.log(`Vídeo ${!isVideoOff ? 'desativado' : 'ativado'}`);
  };

  const endCall = () => {
    // Em um cenário real, encerraríamos a conexão WebRTC aqui
    console.log("Encerrando chamada");
    
    // Informar componente pai
    onEndCall();
  };

  // Renderizar interface da chamada
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow">
        {/* Tela principal (vídeo do outro participante) */}
        <div className="lg:col-span-2 relative rounded-lg overflow-hidden bg-neutral-900 h-full min-h-[400px] flex items-center justify-center">
          {isConnected ? (
            <>
              {/* Placeholder para o vídeo remoto */}
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl text-primary">
                      {user?.tipo === "psicologo" ? "P" : "T"}
                    </span>
                  </div>
                  <p className="text-neutral-300">
                    {user?.tipo === "psicologo" ? "Paciente" : "Terapeuta"}
                  </p>
                  <p className="text-neutral-400 text-sm mt-2">
                    Câmera não disponível para simulação
                  </p>
                </div>
              </div>
              
              {/* Vídeo local (miniatura) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-neutral-700 rounded overflow-hidden border-2 border-neutral-600">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-xs">Você</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-white">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Conectando...</p>
            </div>
          )}
        </div>
        
        {/* Painel lateral */}
        <div className="flex flex-col space-y-4">
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>Detalhes da Consulta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">ID da Sessão</h3>
                <p className="font-mono text-sm bg-neutral-100 p-2 rounded">{sessionId}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">
                  {user?.tipo === "psicologo" ? "Paciente" : "Terapeuta"}
                </h3>
                <p>Nome do {user?.tipo === "psicologo" ? "Paciente" : "Terapeuta"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Duração</h3>
                <p>00:00:00</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full border rounded p-2 min-h-[100px]"
                placeholder="Faça anotações durante a consulta..."
              />
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
          >
            {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          
          <Button
            variant={isVideoOff ? "outline" : "default"}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full h-14 w-14 p-0"
            onClick={endCall}
          >
            <Phone className="h-6 w-6 rotate-135" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-14 w-14 p-0"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Brain } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou sua assistente de IA especializada em psicologia. Como posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle text area resizing
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const resizeTextarea = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    };
    
    textarea.addEventListener("input", resizeTextarea);
    return () => textarea.removeEventListener("input", resizeTextarea);
  }, []);

  // AI assistant chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/assistant/chat", {
        message,
        userId: user?.id,
      });
      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível se comunicar com a assistente de IA. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Erro na comunicação com a IA:", error);
    },
  });

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Generate a unique ID for the message
    const messageId = Date.now().toString();
    
    // Add user message to chat
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    try {
      // Send message to API
      const response = await chatMutation.mutateAsync(input);
      
      // Add AI response to chat
      const assistantMessage: Message = {
        id: `response-${messageId}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Error handling is done in the mutation onError
    }
  };

  // Handle Enter key for sending messages (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Assistente de IA</h1>
          </div>
          
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle>Assistente para Profissionais de Psicologia</CardTitle>
              <CardDescription>
                Use este assistente para suporte em resumos de sessões, sugestões terapêuticas, pesquisa em psicologia e muito mais.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="flex flex-col space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                              {message.role === "user" ? "Você" : "Assistente"}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            <Separator />
            
            <CardFooter className="pt-4">
              <div className="flex w-full items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 min-h-[60px] resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={chatMutation.isPending || !input.trim()}
                  size="icon"
                  className="h-[60px]"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sugestões de uso</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Resumir sessões de terapia com base em notas ou transcrições</li>
                <li>Obter informações sobre abordagens terapêuticas específicas</li>
                <li>Ajuda na elaboração de laudos ou relatórios psicológicos</li>
                <li>Sugestões de exercícios ou técnicas para diferentes condições</li>
                <li>Esclarecer dúvidas sobre diagnósticos e critérios do DSM-5</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
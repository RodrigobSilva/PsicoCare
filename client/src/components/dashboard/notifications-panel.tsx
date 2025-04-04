import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  AlertTriangle, 
  User, 
  FileText,
  Loader2 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationsPanelProps {
  notificacoes?: any[];
  isLoading: boolean;
}

export default function NotificationsPanel({ notificacoes, isLoading }: NotificationsPanelProps) {
  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "cancelamento":
        return <AlertTriangle className="text-white" size={16} />;
      case "novo_paciente":
        return <User className="text-white" size={16} />;
      case "fatura":
        return <FileText className="text-white" size={16} />;
      default:
        return <AlertTriangle className="text-white" size={16} />;
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case "cancelamento":
        return "bg-danger";
      case "novo_paciente":
        return "bg-info";
      case "fatura":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  };

  const getNotificationBorder = (tipo: string) => {
    switch (tipo) {
      case "cancelamento":
        return "border-danger border-opacity-20";
      case "novo_paciente":
      case "fatura":
      default:
        return "border-neutral-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4 border-b border-neutral-200 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-neutral-800">Notificações</CardTitle>
        <Link href="/notificacoes">
          <Button variant="link" className="text-sm text-primary hover:text-primary-dark">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48 mt-1" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {notificacoes && notificacoes.length > 0 ? (
              notificacoes.map((notificacao) => (
                <div 
                  key={notificacao.id} 
                  className={`p-3 bg-neutral-50 rounded-lg border ${getNotificationBorder(notificacao.tipo)}`}
                >
                  <div className="flex">
                    <div className={`rounded-full w-8 h-8 ${getNotificationColor(notificacao.tipo)} text-white flex items-center justify-center`}>
                      {getNotificationIcon(notificacao.tipo)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-800">
                        {notificacao.tipo === "cancelamento" && "Cancelamento de sessão"}
                        {notificacao.tipo === "novo_paciente" && "Novo Paciente"}
                        {notificacao.tipo === "fatura" && "Fatura pendente"}
                      </p>
                      <p className="text-xs text-neutral-600">{notificacao.mensagem}</p>
                      <p className="text-xs text-neutral-500 mt-1">há {notificacao.tempo}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-neutral-500">
                <Bell className="mx-auto h-10 w-10 text-neutral-300 mb-2" />
                <p>Nenhuma notificação no momento.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Ícone de Sino para o estado vazio
function Bell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

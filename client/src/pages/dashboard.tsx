import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatisticCards from "@/components/dashboard/statistic-cards";
import ScheduleToday from "@/components/dashboard/schedule-today";
import QuickAccess from "@/components/dashboard/quick-access";
import NotificationsPanel from "@/components/dashboard/notifications-panel";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: estatisticas, isLoading: isLoadingEstatisticas } = useQuery({
    queryKey: ["/api/dashboard/estatisticas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/estatisticas");
      return res.json();
    },
  });
  
  const { data: agendamentosHoje, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos", { data: new Date().toISOString().split('T')[0] }],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiRequest("GET", `/api/agendamentos?data=${today}`);
      return res.json();
    },
  });
  
  const { data: notificacoes, isLoading: isLoadingNotificacoes } = useQuery({
    queryKey: ["/api/notificacoes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notificacoes");
      return res.json();
    },
  });
  
  const dataFormatada = format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR });
  
  return (
    <Layout>
      <div className="container mx-auto">
        {/* Mobile greeting */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Olá, {user?.nome?.split(' ')[0]}</h1>
            <p className="text-neutral-600">Bem-vindo(a) de volta.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Hoje</p>
            <p className="text-sm font-medium text-neutral-800">{dataFormatada}</p>
          </div>
        </div>

        {/* Dashboard summary cards */}
        <StatisticCards estatisticas={estatisticas} isLoading={isLoadingEstatisticas} />

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Today */}
          <div className="lg:col-span-2">
            <ScheduleToday 
              agendamentos={agendamentosHoje} 
              isLoading={isLoadingAgendamentos} 
            />
          </div>

          <div className="lg:col-span-1">
            <QuickAccess userType={user?.tipo} />
            <NotificationsPanel 
              notificacoes={notificacoes} 
              isLoading={isLoadingNotificacoes} 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

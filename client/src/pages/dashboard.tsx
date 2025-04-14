import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatisticCards from "@/components/dashboard/statistic-cards";
import ScheduleToday from "@/components/dashboard/schedule-today";
import QuickAccess from "@/components/dashboard/quick-access";
import NotificationsPanel from "@/components/dashboard/notifications-panel";
import WelcomeHero from "@/components/dashboard/welcome-hero";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: estatisticas, isLoading: isLoadingEstatisticas } = useQuery({
    queryKey: ["/api/dashboard/estatisticas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/estatisticas");
      return res.json();
    },
  });
  
  // Buscar agendamentos com parâmetros específicos baseados no tipo de usuário
  const { data: agendamentosHoje, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ["/api/agendamentos", { 
      data: new Date().toISOString().split('T')[0],
      userId: user?.id,
      tipo: user?.tipo 
    }],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      let url = `/api/agendamentos?data=${today}`;
      
      // Se for paciente, buscar apenas os agendamentos do próprio paciente
      if (user?.tipo === 'paciente') {
        const pacienteId = user.id; // Assumindo que o id do usuário é o mesmo do paciente
        url += `&pacienteId=${pacienteId}`;
      }
      
      // Se for psicólogo, buscar apenas os agendamentos do próprio psicólogo
      if (user?.tipo === 'psicologo') {
        const psicologoId = user.id; // Assumindo que o id do usuário é o mesmo do psicólogo
        url += `&psicologoId=${psicologoId}`;
      }
      
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user, // Só executa a query se o usuário estiver disponível
  });
  
  const { data: notificacoes, isLoading: isLoadingNotificacoes } = useQuery({
    queryKey: ["/api/notificacoes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notificacoes");
      return res.json();
    },
  });
  
  return (
    <Layout>
      <div className="container mx-auto">
        {/* Animated hero welcome */}
        <WelcomeHero userName={user?.nome?.split(' ')[0] || 'Usuário'} />

        {/* Dashboard summary cards - esconder o card de faturamento para psicólogos */}
        <StatisticCards 
          estatisticas={estatisticas} 
          isLoading={isLoadingEstatisticas}
          userType={user?.tipo} 
        />

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
            {/* Notificações temporariamente removidas
            {user?.tipo === 'admin' && (
              <NotificationsPanel 
                notificacoes={notificacoes} 
                isLoading={isLoadingNotificacoes} 
              />
            )}
            */}
          </div>
        </div>
      </div>
    </Layout>
  );
}

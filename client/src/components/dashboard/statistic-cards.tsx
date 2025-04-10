import { Card, CardContent } from "@/components/ui/card";
import { Calendar, UserPlus, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticCardsProps {
  estatisticas?: {
    sessoesHoje: number;
    novosPacientes: number;
    faturamentoMensal: number;
    taxaOcupacao: number;
  };
  isLoading: boolean;
  userType?: string;
}

export default function StatisticCards({ estatisticas, isLoading, userType }: StatisticCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para filtrar cards baseado no tipo de usuário
  const getCardsByUserType = () => {
    const baseCards = [
      {
        title: "Sessões Hoje",
        value: estatisticas?.sessoesHoje || 0,
        icon: <Calendar className="text-primary" />,
        bgColor: "bg-primary bg-opacity-10",
        trend: { value: 12, label: "em relação à semana passada", positive: true }
      },
      {
        title: "Novos Pacientes",
        value: estatisticas?.novosPacientes || 0,
        icon: <UserPlus className="text-secondary" />,
        bgColor: "bg-secondary bg-opacity-10",
        trend: { value: 5, label: "em relação ao mês passado", positive: true }
      },
      {
        title: "Faturamento Mensal",
        value: estatisticas?.faturamentoMensal || 0,
        valueFormatter: formatCurrency,
        icon: <DollarSign className="text-accent" />,
        bgColor: "bg-accent bg-opacity-10",
        trend: { value: 18, label: "em relação ao mês passado", positive: true }
      },
      {
        title: "Taxa de ocupação",
        value: estatisticas?.taxaOcupacao || 0,
        valueFormatter: (value: number) => `${value}%`,
        icon: <TrendingUp className="text-info" />,
        bgColor: "bg-info bg-opacity-10",
        trend: { value: 3, label: "em relação à semana passada", positive: false }
      }
    ];
    
    // Filtragem dos cards de acordo com o tipo de usuário
    if (userType === 'psicologo') {
      // Psicólogos veem apenas sessões hoje
      return [baseCards[0]]; // Apenas o card de "Sessões Hoje"
    } else if (userType === 'paciente') {
      // Pacientes veem apenas suas próprias consultas agendadas
      return [baseCards[0]]; // Apenas o card de "Sessões Hoje"
    }
    
    // Admin e secretaria veem todos os cards
    return baseCards;
  };
  
  const cards = getCardsByUserType();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-in fade-in duration-500">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <h3 className="text-2xl font-semibold text-neutral-800">
                    {card.valueFormatter ? card.valueFormatter(card.value) : card.value}
                  </h3>
                )}
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-full flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            {!isLoading && (
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${card.trend.positive ? 'text-success' : 'text-danger'}`}>
                  {card.trend.positive ? (
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H9v1h2a1 1 0 110 2H9v1h2a1 1 0 110 2H9a1 1 0 01-1-1v-2a1 1 0 00-1-1H6a1 1 0 110-2h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 011 1z" clipRule="evenodd" />
                      </svg>
                      {card.trend.value}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 13a1 1 0 01-1 1H9v1h2a1 1 0 110 2H9a1 1 0 01-1-1v-2a1 1 0 00-1-1H6a1 1 0 110-2h1a1 1 0 001-1V9a1 1 0 011-1h3a1 1 0 011 1z" clipRule="evenodd" />
                      </svg>
                      {card.trend.value}%
                    </span>
                  )}
                </span>
                <span className="text-neutral-500 text-sm ml-2">{card.trend.label}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
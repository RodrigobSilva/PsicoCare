import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OnboardingTip } from "@/components/onboarding/onboarding-tip";

// Tipos das propriedades do componente
interface WelcomeHeroProps {
  userName: string;
}

// Função para obter saudação baseada na hora do dia
const getGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  } else if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
};

// Função para obter mensagem motivacional aleatória
const getRandomMotivationalMessage = (): string => {
  const messages = [
    "Hoje é um ótimo dia para fazer a diferença!",
    "Sua dedicação transforma vidas!",
    "A cada atendimento, um mundo é transformado.",
    "Pequenos passos, grandes progressos.",
    "Sua presença faz toda a diferença!",
    "Cuidar é um ato de amor e profissionalismo.",
    "O bem-estar começa com pequenas ações.",
    "Cada pessoa é um universo de possibilidades.",
    "Sua empatia é um presente para seus pacientes."
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

export default function WelcomeHero({ userName }: WelcomeHeroProps) {
  const [greeting, setGreeting] = useState<string>(getGreeting());
  const [message, setMessage] = useState<string>(getRandomMotivationalMessage());
  const dataFormatada = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  // Atualizar saudação a cada minuto (caso o usuário fique com a página aberta durante a mudança de período)
  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-8 relative overflow-hidden"
    >
      {/* Círculos decorativos */}
      <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary opacity-10"></div>
      <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-primary opacity-10"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <motion.div variants={itemVariants} className="text-sm text-primary-700 font-medium mb-1">
            {dataFormatada}
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
          >
            {greeting}, {userName}!
          </motion.h1>
          <motion.p variants={itemVariants} className="text-primary-700 mt-2 max-w-xl">
            {message}
          </motion.p>
          
          {/* Dica de onboarding para novos usuários */}
          <OnboardingTip
            id="dashboard-welcome"
            title="Bem-vindo ao Sistema de Gestão de Clínica"
            side="bottom"
            delayMs={1000}
            showAnchor={false}
          >
            <p>
              Este é o seu painel principal, onde você encontrará informações importantes e acesso rápido às funcionalidades mais utilizadas.
            </p>
            <p className="mt-1">
              Explore as diferentes seções no menu lateral para gerenciar pacientes, agenda, atendimentos e muito mais!
            </p>
          </OnboardingTip>
        </div>
        <motion.div variants={itemVariants} className="mt-4 md:mt-0">
          <button
            onClick={() => setMessage(getRandomMotivationalMessage())}
            className="bg-white/80 hover:bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
          >
            Nova mensagem
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
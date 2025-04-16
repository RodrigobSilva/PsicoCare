import { useState, useEffect, createContext, useContext } from "react";

// Definir os IDs de todas as dicas possíveis do onboarding
export type OnboardingTipId = 
  | "dashboard-welcome" 
  | "agenda-scheduling" 
  | "pacientes-management" 
  | "atendimento-session" 
  | "financeiro-overview"
  | "salas-management"
  | "planos-saude-management"
  | "configuracoes-access";

// Interface para gerenciar o estado do onboarding
interface OnboardingState {
  // Dicas que já foram visualizadas pelo usuário
  viewedTips: OnboardingTipId[];
  // Indica se é a primeira vez que o usuário acessa o sistema
  isFirstTimeUser: boolean;
  // Marca uma dica como visualizada
  markTipAsViewed: (tipId: OnboardingTipId) => void;
  // Verifica se uma dica específica já foi visualizada
  isTipViewed: (tipId: OnboardingTipId) => boolean;
  // Resetar todas as dicas (principalmente para testes)
  resetAllTips: () => void;
}

// Criando o contexto de onboarding
const OnboardingContext = createContext<OnboardingState | undefined>(undefined);

// Chave para armazenamento no localStorage
const STORAGE_KEY = "onboarding_state";

// Provedor do contexto de onboarding
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // Estado para armazenar as dicas já visualizadas
  const [viewedTips, setViewedTips] = useState<OnboardingTipId[]>([]);
  
  // Estado para indicar se é a primeira vez que o usuário acessa o sistema
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);

  // Carregar o estado salvo do localStorage ao inicializar
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setViewedTips(parsedState.viewedTips || []);
        // Se não houver dicas visualizadas, consideramos como primeira vez
        setIsFirstTimeUser(parsedState.viewedTips?.length === 0 || false);
      } else {
        // Se não há estado salvo, é a primeira vez
        setIsFirstTimeUser(true);
      }
    } catch (error) {
      console.error("Erro ao carregar estado de onboarding:", error);
      // Em caso de erro, assumimos que é a primeira vez
      setIsFirstTimeUser(true);
    }
  }, []);

  // Salvar o estado no localStorage sempre que houver alterações
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          viewedTips,
        })
      );
    } catch (error) {
      console.error("Erro ao salvar estado de onboarding:", error);
    }
  }, [viewedTips]);

  // Função para marcar uma dica como visualizada
  const markTipAsViewed = (tipId: OnboardingTipId) => {
    if (!viewedTips.includes(tipId)) {
      setViewedTips((prev) => [...prev, tipId]);
    }
  };

  // Função para verificar se uma dica já foi visualizada
  const isTipViewed = (tipId: OnboardingTipId) => {
    return viewedTips.includes(tipId);
  };

  // Função para resetar todas as dicas (para testes)
  const resetAllTips = () => {
    setViewedTips([]);
    setIsFirstTimeUser(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Valor do contexto
  const contextValue: OnboardingState = {
    viewedTips,
    isFirstTimeUser,
    markTipAsViewed,
    isTipViewed,
    resetAllTips,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Hook para acessar o contexto de onboarding
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error("useOnboarding deve ser usado dentro de OnboardingProvider");
  }
  
  return context;
}
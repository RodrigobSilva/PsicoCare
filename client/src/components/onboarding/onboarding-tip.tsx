import React, { useState, useEffect } from "react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { OnboardingTipId, useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingTipProps {
  id: OnboardingTipId;
  title?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  triggerElement?: React.ReactNode;
  delayMs?: number;
  persistent?: boolean;
  showAnchor?: boolean;
}

export function OnboardingTip({
  id,
  title,
  children,
  side = "right",
  align = "center",
  className = "",
  triggerElement,
  delayMs = 500,
  persistent = false,
  showAnchor = true
}: OnboardingTipProps) {
  // Usar o hook de onboarding
  const { isFirstTimeUser, isTipViewed, markTipAsViewed } = useOnboarding();
  
  // Estado para controlar se a dica está aberta
  const [isOpen, setIsOpen] = useState(false);

  // Efeito para abrir a dica após um delay se o usuário for novo e a dica não tiver sido vista
  useEffect(() => {
    if ((isFirstTimeUser || persistent) && !isTipViewed(id)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delayMs);
      
      // Limpar o timer se o componente for desmontado
      return () => clearTimeout(timer);
    }
  }, [isFirstTimeUser, isTipViewed, id, delayMs, persistent]);

  // Fechar a dica e marcá-la como visualizada
  const handleClose = () => {
    setIsOpen(false);
    if (!persistent) {
      markTipAsViewed(id);
    }
  };

  // Se nem o usuário é novo nem a dica é persistente, ou se a dica já foi vista (e não é persistente), não mostrar nada
  if ((!isFirstTimeUser && !persistent) || (!persistent && isTipViewed(id))) {
    // Se tiver um elemento de trigger, renderizar somente ele sem a dica
    return showAnchor ? <>{triggerElement}</> : null;
  }

  // Se não houver um elemento trigger explícito, usar um span vazio como trigger
  const defaultTriggerElement = <span className="inline-block h-2 w-2 rounded-full bg-primary-light animate-pulse"></span>;

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild onClick={() => setIsOpen(!isOpen)}>
          {showAnchor ? (triggerElement || defaultTriggerElement) : <span className="hidden"></span>}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className={`p-4 max-w-xs bg-primary/95 text-primary-foreground shadow-lg ${className}`}
        >
          <div className="flex flex-col gap-2">
            {title && <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">{title}</h4>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 text-white opacity-70 hover:opacity-100 hover:bg-primary-dark/20" 
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>}
            
            <div className="text-xs">{children}</div>
            
            <div className="flex justify-end mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white"
                onClick={handleClose}
              >
                Entendi
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
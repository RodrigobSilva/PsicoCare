import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  ChartBarStacked, 
  Calendar, 
  User, 
  Users, 
  Coins, 
  DoorOpen, 
  FileHeart, 
  FileText, 
  Settings, 
  LogOut,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Verifica se o usuário tem permissão para acessar o item de menu
  const canAccess = (allowedRoles: string[]) => {
    if (!user || !user.tipo) return false;
    return allowedRoles.includes(user.tipo);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const menuItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: <ChartBarStacked className="w-5 text-center" />,
      roles: ["admin", "secretaria", "psicologo", "paciente"]
    },
    { 
      href: "/agenda", 
      label: "Agenda", 
      icon: <Calendar className="w-5 text-center" />,
      roles: ["admin", "secretaria", "psicologo", "paciente"]
    },
    { 
      href: "/atendimentos", 
      label: "Atendimentos", 
      icon: <FileText className="w-5 text-center" />,
      roles: ["admin", "secretaria", "psicologo"]
    },
    { 
      href: "/pacientes", 
      label: "Pacientes", 
      icon: <User className="w-5 text-center" />,
      roles: ["admin", "secretaria", "psicologo"]
    },
    { 
      href: "/psicologos", 
      label: "Psicólogos", 
      icon: <Users className="w-5 text-center" />,
      roles: ["admin", "secretaria"]
    },
    { 
      href: "/financeiro", 
      label: "Financeiro", 
      icon: <Coins className="w-5 text-center" />,
      roles: ["admin"]
    },
    { 
      href: "/salas", 
      label: "Salas e Filiais", 
      icon: <DoorOpen className="w-5 text-center" />,
      roles: ["admin", "secretaria"]
    },
    { 
      href: "/planos-saude", 
      label: "Planos de Saúde", 
      icon: <FileHeart className="w-5 text-center" />,
      roles: ["admin", "secretaria"]
    },
    { 
      href: "/relatorios", 
      label: "Relatórios", 
      icon: <FileText className="w-5 text-center" />,
      roles: ["admin", "secretaria"]
    },
    { 
      href: "/assistente-ia", 
      label: "Assistente IA", 
      icon: <Brain className="w-5 text-center" />,
      roles: ["admin", "secretaria", "psicologo"]
    },
    { 
      href: "/configuracoes", 
      label: "Configurações", 
      icon: <Settings className="w-5 text-center" />,
      roles: ["admin"]
    }
  ];

  const getUserInitials = () => {
    if (!user || !user.nome) return "??";
    
    const names = user.nome.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getUserRoleLabel = () => {
    if (!user) return "";
    
    const roles: Record<string, string> = {
      admin: "Administrador",
      secretaria: "Secretária",
      psicologo: "Psicólogo",
      paciente: "Paciente"
    };
    
    return roles[user.tipo] || user.tipo;
  };

  return (
    <div 
      className={cn(
        "sidebar bg-primary w-64 h-full flex-shrink-0 fixed lg:static z-50 transition-transform",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 bg-primary-dark">
          <h1 className="text-white text-xl font-semibold">PsiSystem</h1>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-primary-light">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center">
              <span>{getUserInitials()}</span>
            </div>
            <div className="ml-3">
              <p className="text-white text-sm font-medium">{user?.nome}</p>
              <p className="text-primary-light text-xs">{getUserRoleLabel()}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              canAccess(item.roles) && (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center px-4 py-3 text-white cursor-pointer",
                        location === item.href ? "bg-primary-dark" : "hover:bg-primary-dark"
                      )}
                      onClick={location === item.href ? undefined : onClose}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </div>
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="border-t border-primary-light p-4">
          <button 
            onClick={handleLogout} 
            className="flex items-center text-white hover:text-neutral-200 w-full"
          >
            <LogOut className="w-5 text-center" />
            <span className="ml-3">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

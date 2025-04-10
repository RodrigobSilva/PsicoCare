import { useAuth } from "@/hooks/use-auth";
import { Menu, Bell, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/agenda": "Agenda",
      "/pacientes": "Pacientes",
      "/psicologos": "Psicólogos",
      "/financeiro": "Financeiro",
      "/salas": "Salas e Filiais",
      "/planos-saude": "Planos de Saúde",
      "/relatorios": "Relatórios",
      "/configuracoes": "Configurações"
    };
    
    return titles[location] || "Dashboard";
  };

  const getUserInitials = () => {
    if (!user || !user.nome) return "??";
    
    const names = user.nome.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm h-16 flex items-center justify-between px-4">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-neutral-600 lg:hidden">
          <Menu size={20} />
        </button>
        <div className="ml-4 lg:ml-0">
          <h2 className="text-lg font-medium text-primary">Espaço Terapêutico JC - {getPageTitle()}</h2>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative text-neutral-600">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center">
                  <span>{getUserInitials()}</span>
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-700">{user?.nome}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/perfil">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

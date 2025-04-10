import { Link, useLocation } from "wouter";
import { ChartBarStacked, Calendar, User, Coins, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Para pacientes, mostre apenas dashboard e agenda
  if (user.tipo === "paciente") {
    return (
      <nav className="lg:hidden bg-white border-t border-neutral-200 flex justify-around p-2">
        <NavItem 
          href="/dashboard" 
          icon={<ChartBarStacked className="text-lg" />} 
          label="Dashboard" 
          active={location === "/dashboard"} 
        />
        <NavItem 
          href="/agenda" 
          icon={<Calendar className="text-lg" />} 
          label="Agenda" 
          active={location === "/agenda"} 
        />
      </nav>
    );
  }

  return (
    <nav className="lg:hidden bg-white border-t border-neutral-200 flex justify-around p-2">
      <NavItem 
        href="/dashboard" 
        icon={<ChartBarStacked className="text-lg" />} 
        label="Dashboard" 
        active={location === "/dashboard"} 
      />
      <NavItem 
        href="/agenda" 
        icon={<Calendar className="text-lg" />} 
        label="Agenda" 
        active={location === "/agenda"} 
      />
      <NavItem 
        href="/pacientes" 
        icon={<User className="text-lg" />} 
        label="Pacientes" 
        active={location === "/pacientes"} 
      />
      <NavItem 
        href="/financeiro" 
        icon={<Coins className="text-lg" />} 
        label="Financeiro" 
        active={location === "/financeiro"}
        hidden={user.tipo !== "admin"}
      />
      <NavItem 
        href="#menu" 
        icon={<MoreHorizontal className="text-lg" />} 
        label="Mais" 
        active={false} 
        id="mobileMenuToggle"
        onClick={(e) => {
          e.preventDefault();
          // Encontrar e ativar o sidebar através de um evento personalizado
          document.dispatchEvent(new CustomEvent('toggle-sidebar'));
        }}
      />
    </nav>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  id?: string;
  hidden?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function NavItem({ href, icon, label, active, id, hidden, onClick }: NavItemProps) {
  if (hidden) return null;
  
  return (
    <Link href={href}>
      <a 
        className={cn(
          "flex flex-col items-center py-1 px-3",
          active ? "text-primary" : "text-neutral-600"
        )}
        id={id}
        onClick={onClick}
      >
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}

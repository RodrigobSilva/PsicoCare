import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus, 
  CalendarPlus, 
  ChartBar, 
  Coins 
} from "lucide-react";

interface QuickAccessProps {
  userType?: string;
}

export default function QuickAccess({ userType }: QuickAccessProps) {
  // Define acessos rápidos com base no tipo de usuário
  const getQuickAccessItems = () => {
    const allItems = [
      {
        href: "/pacientes?new=true",
        label: "Novo Paciente",
        icon: <UserPlus />,
        bgColor: "bg-primary-light bg-opacity-10",
        iconBgColor: "bg-primary",
        roles: ["admin", "secretaria"] // Apenas admin e secretaria podem criar pacientes
      },
      {
        href: "/agenda?new=true",
        label: "Agendar",
        icon: <CalendarPlus />,
        bgColor: "bg-secondary bg-opacity-10",
        iconBgColor: "bg-secondary",
        roles: ["admin", "secretaria", "psicologo"] // Removido paciente conforme solicitado
      },
      {
        href: "/relatorios",
        label: "Relatórios",
        icon: <ChartBar />,
        bgColor: "bg-accent bg-opacity-10",
        iconBgColor: "bg-accent",
        roles: ["admin", "secretaria"]
      },
      {
        href: "/financeiro",
        label: "Financeiro",
        icon: <Coins />,
        bgColor: "bg-info bg-opacity-10",
        iconBgColor: "bg-info",
        roles: ["admin", "secretaria"]
      }
    ];

    // Filtra os itens com base no tipo de usuário
    return allItems.filter(item => 
      !userType || item.roles.includes(userType)
    );
  };

  const quickAccessItems = getQuickAccessItems();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4 border-b border-neutral-200">
        <CardTitle className="text-lg font-medium text-neutral-800">Acesso Rápido</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {quickAccessItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <a className={`flex flex-col items-center justify-center p-4 ${item.bgColor} rounded-lg hover:bg-opacity-20 transition-colors`}>
                <div className={`w-10 h-10 rounded-full ${item.iconBgColor} text-white flex items-center justify-center mb-2`}>
                  {item.icon}
                </div>
                <span className="text-sm text-neutral-700 text-center">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

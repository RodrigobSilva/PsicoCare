
import React from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import PsicologoForm from "@/components/psicologos/psicologo-form";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { ensureArray, asArrayOfType } from "@/lib/utils";

export default function Psicologos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.tipo === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["/api/psicologos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/psicologos");
      return response.json();
    },
  });
  
  // Garantir que psicologos seja sempre um array, mesmo quando a API retorna null ou undefined
  const psicologos = ensureArray(data);
  
  // Interface para tipagem
  interface Psicologo {
    id: number;
    usuario?: {
      id: number;
      nome: string;
      email?: string;
    };
    crp: string;
    especialidade?: string[];
    formacao?: string;
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este psicólogo?')) return;
    try {
      await apiRequest("DELETE", `/api/psicologos/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/psicologos"] });
      toast({
        title: "Psicólogo removido",
        description: "O psicólogo foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover psicólogo",
        description: "Não foi possível remover o psicólogo.",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Psicólogos</h1>
          {isAdmin && (
            <Button onClick={() => setLocation("/psicologos/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Psicólogo
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {asArrayOfType<Psicologo>(psicologos).map(psicologo => (
              <div
                key={psicologo.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                onClick={() => setLocation(`/psicologos/${psicologo.id}/editar`)}
              >
                <h3 className="font-medium">{psicologo.usuario?.nome || 'Nome não disponível'}</h3>
                <p className="text-sm text-muted-foreground">CRP: {psicologo.crp}</p>
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="mt-2 text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(psicologo.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

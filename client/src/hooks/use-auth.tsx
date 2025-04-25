import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { Usuario, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo de dados para a mudança de senha
type ChangePasswordData = {
  senhaAtual: string;
  novaSenha: string;
};

type AuthContextType = {
  user: Usuario | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Usuario, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Usuario, Error, any>;
  changePasswordMutation: UseMutationResult<any, Error, ChangePasswordData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Usuario | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Aplicar o token de autenticação se disponível (execute apenas uma vez na inicialização)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      console.log("Token encontrado no localStorage, aplicando a todas as requisições");
      
      // Adicionar o token ao header para todas as requisições
      const originalFetch = window.fetch;
      window.fetch = function(url: RequestInfo | URL, options: RequestInit = {}) {
        const newOptions = { ...options };
        newOptions.headers = {
          ...newOptions.headers,
          'Authorization': `Bearer ${token}`
        };
        return originalFetch(url, newOptions);
      };
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao fazer login");
      }
      return await res.json();
    },
    onSuccess: (response: any) => {
      const user = response as Usuario;
      
      // Armazenar o token para uso posterior (no localStorage)
      if (response.token) {
        console.log("Token recebido e armazenado");
        localStorage.setItem('authToken', response.token);
        
        // Adicionar o token ao header para futuras requisições
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          const token = localStorage.getItem('authToken');
          if (token) {
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            };
          }
          return originalFetch(url, options);
        };
      }
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${user.nome}!`,
      });
      
      // Redireciona baseado no tipo de usuário
      const redirectPath = user.tipo === "psicologo" ? "/agenda" : "/";
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: Usuario) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Cadastro realizado com sucesso",
        description: `Bem-vindo(a), ${user.nome}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no cadastro",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Tentar fazer o logout no servidor
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        console.warn("Erro ao tentar desconectar do servidor:", error);
        // Continuamos mesmo com erro para pelo menos limpar os dados locais
      }
    },
    onSuccess: () => {
      // Remover o token do localStorage
      localStorage.removeItem('authToken');
      
      // Limpar o cache do React Query
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries(); // Invalidar todas as queries
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
      
      // Redirecionar para a página de login
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      // Mesmo com erro, tentar limpar dados locais
      localStorage.removeItem('authToken');
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Aviso sobre logout",
        description: "Houve um problema ao desconectar no servidor, mas você foi desconectado localmente.",
      });
      
      window.location.href = "/auth";
    },
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao alterar senha");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada com sucesso",
        description: "Sua senha foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao alterar senha",
        description: error.message || "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiBaseUrl } from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  try {
    console.log(`Enviando requisição para: ${fullUrl} (${method})`);
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log("Token encontrado no localStorage");
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Verificar se é uma requisição OPTIONS para pre-flight CORS
    if (method === 'OPTIONS') {
      headers["Access-Control-Request-Method"] = "POST, GET, OPTIONS, PUT, DELETE, PATCH";
      headers["Access-Control-Request-Headers"] = "Content-Type, Authorization";
    }
    
    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors"
    };
    
    // Log detalhado para depuração
    console.log(`Configuração da requisição ${method} para ${fullUrl}:`, {
      headers: JSON.stringify(headers),
      hasBody: !!data
    });
    
    const res = await fetch(fullUrl, options);
    
    // Log de resposta para diagnóstico
    const headerObj: Record<string, string> = {};
    // Usar uma abordagem mais compatível com TypeScript
    const headerKeys = Array.from(res.headers.keys());
    headerKeys.forEach(key => {
      headerObj[key] = res.headers.get(key) || '';
    });
    
    console.log(`Resposta da requisição ${method} (${res.status}):`, {
      status: res.status,
      statusText: res.statusText,
      headers: headerObj
    });
    
    if (!res.ok) {
      // Log detalhado para depuração
      console.error(`Erro na requisição (${res.status}): ${res.statusText}`);
      const errorText = await res.text();
      console.error(`Detalhes do erro: ${errorText}`);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    return res;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const apiBaseUrl = getApiBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
    
    try {
      console.log(`Executando query para: ${fullUrl}`);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      
      // Adicionar token de autenticação se disponível
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log("Token encontrado no localStorage, aplicando a todas as requisições");
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      console.log(`Configuração da requisição GET para ${fullUrl}:`, {
        headers: JSON.stringify(headers)
      });
      
      const fetchOptions: RequestInit = {
        method: 'GET',
        credentials: "include",
        headers,
        mode: "cors"
      };
      
      const res = await fetch(fullUrl, fetchOptions);
      
      // Log de resposta para diagnóstico
      const headerObj: Record<string, string> = {};
      // Usar uma abordagem mais compatível com TypeScript
      const headerKeys = Array.from(res.headers.keys());
      headerKeys.forEach(key => {
        headerObj[key] = res.headers.get(key) || '';
      });
      
      console.log(`Resposta da requisição GET (${res.status}):`, {
        status: res.status,
        statusText: res.statusText,
        headers: headerObj
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log("Retornando null devido a erro 401 (não autenticado)");
        return null;
      }

      if (res.status === 405) {
        console.error(`Erro 405 Method Not Allowed na query: ${fullUrl}`);
        console.error(`Verifique se a rota está configurada corretamente no servidor para aceitar método GET.`);
        throw new Error(`405: Método não permitido para esta rota (${fullUrl}).`);
      }

      if (!res.ok) {
        console.error(`Erro na query (${res.status}): ${res.statusText}`);
        const errorText = await res.text();
        console.error(`Detalhes do erro: ${errorText}`);
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error(`Query failed for ${fullUrl}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

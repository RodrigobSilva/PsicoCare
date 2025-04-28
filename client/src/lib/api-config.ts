// Configuração da API para diferentes ambientes (desenvolvimento e produção)

// URL da API em desenvolvimento (desenvolvimento local ou Replit)
const DEV_API_URL = '';  // URL vazia significa que a API está no mesmo host

// URL da API em produção (quando deployado no Netlify)
// Usamos URL relativa para aproveitar o proxy do Netlify
const PROD_API_URL = '';

// Determina se estamos em produção
const isProduction = import.meta.env.MODE === 'production';

// Função para obter a URL base da API com base no ambiente
export function getApiBaseUrl(): string {
  return isProduction ? PROD_API_URL : DEV_API_URL;
}

// Função para construir uma URL completa da API
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  
  // Se o endpoint já começa com /api, não adicione novamente
  if (endpoint.startsWith('/api/')) {
    return `${baseUrl}${endpoint}`;
  }
  
  // Se o endpoint não começa com /, adicione
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }
  
  return `${baseUrl}/api${endpoint}`;
}

export default {
  getApiBaseUrl,
  getApiUrl
};
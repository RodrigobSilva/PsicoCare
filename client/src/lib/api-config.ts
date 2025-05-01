// Configuração da API

// URL da API - URL vazia significa que a API está no mesmo host
const API_URL = '';

// Função para obter a URL base da API
export function getApiBaseUrl(): string {
  return API_URL;
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
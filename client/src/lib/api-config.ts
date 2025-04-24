// Configuração da API para diferentes ambientes

// URL base da API
let apiBaseUrl = '';

// Em desenvolvimento local, usamos o proxy embutido do Vite
if (import.meta.env.DEV) {
  apiBaseUrl = '';
} else {
  // Em produção, usamos a URL configurada no ambiente ou a URL padrão
  apiBaseUrl = import.meta.env.VITE_API_URL || 'https://sua-api-backend.com';
}

export const API_BASE_URL = apiBaseUrl;
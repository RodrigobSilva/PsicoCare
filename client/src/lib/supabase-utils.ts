import { supabase } from "./supabase";

/**
 * Utilitários para trabalhar com o Supabase
 */

// Função para verificar a saúde do banco de dados
export const checkDatabaseHealth = async () => {
  try {
    // Exemplo: verificar se há conexão com o banco
    const { data, error } = await supabase.from('health_check').select('*');
    
    if (error) {
      console.error('Erro ao verificar saúde do banco:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro na verificação de saúde:', error);
    return false;
  }
};

// Função para fazer cache dos dados do Supabase
export const cacheSupabaseData = async (table: string, key: string) => {
  try {
    const { data, error } = await supabase.from(table).select('*');
    
    if (error) {
      console.error(`Erro ao buscar dados da tabela ${table}:`, error);
      return null;
    }
    
    // Armazenar no localStorage com timestamp
    localStorage.setItem(`supabase_${key}`, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
    
    return data;
  } catch (error) {
    console.error(`Erro ao cachear dados da tabela ${table}:`, error);
    return null;
  }
};

// Função para recuperar dados cacheados (com expiração de 1 hora)
export const getCachedData = (key: string) => {
  const cachedData = localStorage.getItem(`supabase_${key}`);
  
  if (!cachedData) return null;
  
  try {
    const parsedData = JSON.parse(cachedData);
    const expirationTime = 60 * 60 * 1000; // 1 hora em milissegundos
    
    // Verificar se o cache expirou
    if (Date.now() - parsedData.timestamp > expirationTime) {
      localStorage.removeItem(`supabase_${key}`);
      return null;
    }
    
    return parsedData.data;
  } catch (error) {
    console.error(`Erro ao recuperar dados cacheados para ${key}:`, error);
    return null;
  }
};

// Função para sincronizar dados entre o Postgres local e o Supabase
export const syncLocalToSupabase = async (table: string, localData: any[]) => {
  try {
    // Primeiro, remova os dados existentes (upsert pode não ser suficiente dependendo do caso)
    const { error: deleteError } = await supabase.from(table).delete().not('id', 'is', null);
    
    if (deleteError) {
      console.error(`Erro ao limpar tabela ${table}:`, deleteError);
      return false;
    }
    
    // Agora, insira os novos dados
    const { error: insertError } = await supabase.from(table).insert(localData);
    
    if (insertError) {
      console.error(`Erro ao sincronizar dados para tabela ${table}:`, insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Erro durante sincronização para ${table}:`, error);
    return false;
  }
};
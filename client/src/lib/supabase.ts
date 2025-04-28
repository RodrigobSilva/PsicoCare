import { createClient } from '@supabase/supabase-js';

// Usar variáveis de ambiente para as credenciais do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cogrkxxduyclyzfupbzx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ3JreHhkdXljbHl6ZnVwYnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDQyMzcsImV4cCI6MjA2MTE4MDIzN30.yIxAOZIKbSFijyjAR_6PsB-cQptBf2Pkn08hVZodPxo';

// Criação do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para verificar a conexão
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact' }).limit(1);
    if (error) {
      console.error('Erro ao conectar ao Supabase:', error);
      return false;
    }
    console.log('Conexão com Supabase estabelecida com sucesso');
    return true;
  } catch (err) {
    console.error('Erro ao tentar conectar ao Supabase:', err);
    return false;
  }
};
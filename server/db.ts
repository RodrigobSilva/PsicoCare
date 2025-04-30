import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

// Verificar se estamos usando o Supabase ou o PostgreSQL do Replit
const DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Nenhuma URL de banco de dados (DATABASE_URL ou SUPABASE_DATABASE_URL) foi definida");
}

console.log("Conectando ao banco de dados...");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

// Testar a conexão com o banco de dados
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexão', err);
});

// Exporta a conexão com o banco de dados com nosso schema
export const db = drizzle(pool, { schema });
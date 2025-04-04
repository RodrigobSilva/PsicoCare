import { db } from './db';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { logger } from './logger';

async function runMigration() {
  try {
    logger.info('Iniciando migração do banco de dados...');
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();
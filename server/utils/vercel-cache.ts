/**
 * Utilidades para gerenciar o cache na Vercel
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para desabilitar o cache para rotas específicas (API)
 */
export const noCache = (req: Request, res: Response, next: NextFunction) => {
  // Define cabeçalhos para impedir o cache da resposta
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

/**
 * Middleware para habilitar o cache para arquivos estáticos
 */
export const enableStaticCache = (req: Request, res: Response, next: NextFunction) => {
  // Define cabeçalhos para permitir o cache para arquivos estáticos
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 1 dia
  next();
};

export default {
  noCache,
  enableStaticCache
};
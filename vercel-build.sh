#!/bin/bash

# Este script será executado pela Vercel para realizar o build
echo "Iniciando build do projeto para a Vercel..."

# Instalar dependências
npm install

# Build do frontend e backend
echo "Configurando variáveis de ambiente de produção..."
export NODE_ENV=production

# Executar build
echo "Executando build..."
npm run build

# Verificar permissões do arquivo server/index.ts
echo "Verificando permissões do server/index.ts..."
chmod +x server/index.ts

echo "Build concluído com sucesso!"
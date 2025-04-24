#!/bin/bash

# Este script será executado pelo Netlify para realizar o build
echo "Iniciando build apenas do frontend para o Netlify..."

# Instalar dependências
npm install

# Build apenas do frontend
echo "Configurando variáveis de ambiente de produção..."
export NODE_ENV=production
export VITE_API_URL=${API_BACKEND_URL:-https://sua-api-backend.com}

# Executar vite build
echo "Executando vite build..."
npx vite build

# Copiar arquivo _redirects para a pasta de build
echo "Copiando arquivo _redirects para pasta de saída..."
cp client/public/_redirects dist/public/

echo "Build concluído com sucesso!"
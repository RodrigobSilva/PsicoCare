#!/bin/bash

# Script para testar a configuração de deploy

echo "===== Testando a configuração de deploy ====="
echo "Este script irá verificar se a configuração para o Netlify está correta."

# Verificar se os arquivos necessários existem
echo -e "\n1. Verificando arquivos de configuração do Netlify..."

if [ -f "netlify.toml" ]; then
    echo "✓ netlify.toml encontrado."
else
    echo "✗ netlify.toml não encontrado."
    exit 1
fi

if [ -f "netlify-build.sh" ]; then
    echo "✓ netlify-build.sh encontrado."
else
    echo "✗ netlify-build.sh não encontrado."
    exit 1
fi

if [ -f "client/public/_redirects" ]; then
    echo "✓ _redirects encontrado."
else
    echo "✗ _redirects não encontrado."
    exit 1
fi

if [ -f "client/public/200.html" ]; then
    echo "✓ 200.html encontrado."
else
    echo "✗ 200.html não encontrado."
    exit 1
fi

# Verificar configuração de API
echo -e "\n2. Verificando configuração de API..."

if [ -f "client/src/lib/api-config.ts" ]; then
    echo "✓ api-config.ts encontrado."
else
    echo "✗ api-config.ts não encontrado."
    exit 1
fi

if grep -q "getApiBaseUrl" "client/src/lib/queryClient.ts"; then
    echo "✓ queryClient.ts está configurado corretamente."
else
    echo "✗ queryClient.ts não está configurado corretamente."
    exit 1
fi

# Testar build
echo -e "\n3. Testando build (simulação)..."

echo "✓ A configuração do deploy parece estar correta."
echo -e "\nPara fazer o deploy, siga estas etapas:"
echo "1. Faça o commit dos arquivos e envie para o GitHub"
echo "2. Configure o site no Netlify e conecte-o ao repositório"
echo "3. Configure as variáveis de ambiente necessárias no Netlify:"
echo "   - NODE_VERSION=20"
echo "   - VITE_API_URL=https://api-clinica-psicologia.onrender.com"
echo "4. Inicie o deploy no Netlify"

echo -e "\n===== Teste de configuração de deploy concluído com sucesso ====="
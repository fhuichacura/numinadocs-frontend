#!/bin/bash

# Nombre del proyecto (opcional para logs)
PROJECT_NAME="N100F Frontend"

# Puerto que quieres usar
PORT=5175

echo "🚀 Iniciando entorno de desarrollo para: $PROJECT_NAME"

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias con npm install..."
  npm install
else
  echo "✅ Dependencias ya instaladas."
fi

# Ejecutar el comando con puerto
echo "📡 Ejecutando: npm run dev -- --port $PORT"
npm run dev -- --port $PORT
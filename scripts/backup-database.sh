#!/bin/bash

# Script para fazer backup do banco de dados Neon

DB_URL=$DATABASE_URL
BACKUP_FILE="./scripts/database-backup-$(date +%Y%m%d-%H%M%S).sql"

# Criar diretório se não existir
mkdir -p ./scripts

# Fazer dump do banco
pg_dump "$DB_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup criado com sucesso: $BACKUP_FILE"
  
  # Adicionar ao git
  git add "$BACKUP_FILE"
  git commit -m "Add database backup $(date +%Y-%m-%d)"
  git push
  
  echo "✅ Backup enviado para GitHub"
else
  echo "❌ Erro ao fazer backup do banco de dados"
fi

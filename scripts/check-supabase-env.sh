#!/bin/bash
# Script para verificar el ambiente de Supabase antes de ejecutar comandos

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando ambiente de Supabase...${NC}\n"

# Verificar si existe el archivo project-ref (indica conexión remota)
PROJECT_REF_FILE="supabase/.temp/project-ref"

if [ -f "$PROJECT_REF_FILE" ]; then
    PROJECT_REF=$(cat "$PROJECT_REF_FILE")
    echo -e "${RED}⚠️  ADVERTENCIA: Conectado a proyecto REMOTO${NC}"
    echo -e "${RED}   Project Ref: $PROJECT_REF${NC}"

    # Identificar el proyecto
    if [ "$PROJECT_REF" = "fkjbvwbnbxslornufhlp" ]; then
        echo -e "${RED}   Ambiente: PRODUCCIÓN ⚠️${NC}"
    elif [ "$PROJECT_REF" = "wuinfsedukvxlkfvlpna" ]; then
        echo -e "${YELLOW}   Ambiente: STAGING${NC}"
    else
        echo -e "${RED}   Ambiente: DESCONOCIDO${NC}"
    fi

    echo -e "\n${YELLOW}Para desconectar y usar LOCAL, ejecuta:${NC}"
    echo -e "   npx supabase unlink\n"

    # Preguntar si desea continuar
    if [ "$1" != "--force" ]; then
        read -p "¿Deseas continuar con el ambiente REMOTO? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Operación cancelada${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ Usando base de datos LOCAL (Docker)${NC}"
    echo -e "   URL: http://127.0.0.1:54321"
    echo -e "   Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    echo -e "   Studio: http://127.0.0.1:54323\n"

    # Verificar que Supabase local está corriendo
    if ! docker ps | grep -q "supabase_db"; then
        echo -e "${YELLOW}⚠️  Supabase local NO está corriendo${NC}"
        echo -e "${YELLOW}   Ejecuta: npx supabase start${NC}\n"
    else
        echo -e "${GREEN}✅ Supabase local está corriendo${NC}\n"
    fi
fi

echo -e "${BLUE}Todos los comandos se ejecutarán en el ambiente mostrado arriba.${NC}\n"

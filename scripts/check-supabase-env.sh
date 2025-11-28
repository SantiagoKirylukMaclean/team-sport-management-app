#!/bin/bash
# Script para verificar/enforzar el uso del ambiente local de Supabase

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF_FILE="$ROOT_DIR/supabase/.temp/project-ref"

# Flags
AUTO_UNLINK=false
SKIP_PROMPT=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --auto-unlink)
            AUTO_UNLINK=true
            shift
            ;;
        --force)
            SKIP_PROMPT=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando ambiente de Supabase...${NC}\n"

print_local_info() {
    echo -e "${GREEN}✅ Usando base de datos LOCAL (Docker)${NC}"
    echo -e "   URL: http://127.0.0.1:54321"
    echo -e "   Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    echo -e "   Studio: http://127.0.0.1:54323\n"

    if ! docker ps | grep -q "supabase_db"; then
        echo -e "${YELLOW}⚠️  Supabase local NO está corriendo${NC}"
        echo -e "${YELLOW}   Ejecuta: npx supabase start${NC}\n"
    else
        echo -e "${GREEN}✅ Supabase local está corriendo${NC}\n"
    fi
}

if [ -f "$PROJECT_REF_FILE" ]; then
    PROJECT_REF=$(cat "$PROJECT_REF_FILE")
    echo -e "${RED}⚠️  ADVERTENCIA: Conectado a proyecto REMOTO${NC}"
    echo -e "${RED}   Project Ref: $PROJECT_REF${NC}"

    if [ "$PROJECT_REF" = "fkjbvwbnbxslornufhlp" ]; then
        echo -e "${RED}   Ambiente: PRODUCCIÓN ⚠️${NC}"
    elif [ "$PROJECT_REF" = "wuinfsedukvxlkfvlpna" ]; then
        echo -e "${YELLOW}   Ambiente: STAGING${NC}"
    else
        echo -e "${RED}   Ambiente: DESCONOCIDO${NC}"
    fi

    if $AUTO_UNLINK; then
        echo -e "\n${YELLOW}⏳ Forzando modo LOCAL automáticamente...${NC}"
        pushd "$ROOT_DIR" >/dev/null
        if npx --yes supabase unlink >/dev/null 2>&1; then
            popd >/dev/null
            rm -f "$PROJECT_REF_FILE"
            echo -e "${GREEN}✅ Conexión remota eliminada. Continuando en modo LOCAL.${NC}\n"
            print_local_info
        else
            popd >/dev/null
            echo -e "${RED}❌ No se pudo ejecutar 'supabase unlink'. Verifica tus credenciales.${NC}"
            exit 1
        fi
    else
        echo -e "\n${YELLOW}Para desconectar y usar LOCAL, ejecuta:${NC}"
        echo -e "   npx supabase unlink\n"

        if ! $SKIP_PROMPT; then
            read -p "¿Deseas continuar con el ambiente REMOTO? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${RED}❌ Operación cancelada${NC}"
                exit 1
            fi
        fi
    fi
else
    print_local_info
fi

echo -e "${BLUE}Todos los comandos se ejecutarán en el ambiente mostrado arriba.${NC}\n"

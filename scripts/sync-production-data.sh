#!/bin/bash

# Script para sincronizar datos de producción a Supabase local
# Uso: ./scripts/sync-production-data.sh

set -e

echo "🔄 Sincronizando datos de producción a Supabase local..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Supabase esté vinculado
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Error: No estás autenticado en Supabase${NC}"
    echo "Ejecuta: supabase login"
    exit 1
fi

# Verificar que Supabase local esté corriendo
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase local no está corriendo. Iniciando...${NC}"
    supabase start
fi

echo ""
echo -e "${YELLOW}📥 Preparando descarga de datos de producción...${NC}"
echo ""

# Pedir contraseña de forma segura
echo -n "Ingresa la contraseña de la base de datos de producción: "
read -s DB_PASSWORD
echo ""

# URL encode de caracteres especiales en la contraseña
# ! = %21, @ = %40, # = %23, $ = %24, etc.
DB_PASSWORD_ENCODED=$(printf %s "$DB_PASSWORD" | jq -sRr @uri)

# Construir URL de conexión
DB_URL="postgresql://postgres:${DB_PASSWORD_ENCODED}@db.fkjbvwbnbxslornufhlp.supabase.co:5432/postgres"

echo -e "${YELLOW}📥 Descargando datos de producción...${NC}"

# Hacer dump de la base de datos de producción (solo datos)
supabase db dump \
    --db-url "$DB_URL" \
    --data-only \
    --use-copy \
    -f /tmp/production_data.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al descargar datos de producción${NC}"
    echo -e "${YELLOW}💡 Verifica que la contraseña sea correcta${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Datos descargados${NC}"
echo ""

# Preguntar si quiere resetear la BD local primero
read -p "¿Quieres resetear la base de datos local antes de importar? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}🔄 Reseteando base de datos local...${NC}"
    supabase db reset
    echo -e "${GREEN}✓ Base de datos reseteada${NC}"
fi

echo ""
echo -e "${YELLOW}📤 Importando datos a Supabase local...${NC}"

# Importar los datos usando docker exec (no requiere psql instalado localmente)
docker exec -i supabase_db_team-sport-management-app psql -U postgres -d postgres < /tmp/production_data.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al importar datos${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Datos importados exitosamente${NC}"
echo ""

# Limpiar archivo temporal
rm /tmp/production_data.sql

echo -e "${GREEN}✅ Sincronización completa!${NC}"
echo ""
echo "Puedes acceder a Supabase Studio en: http://127.0.0.1:54323"

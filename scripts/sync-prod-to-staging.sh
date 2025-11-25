#!/bin/bash

# Script para sincronizar datos de producción a Staging
# Uso: ./scripts/sync-prod-to-staging.sh

set -e

echo "🔄 Sincronizando datos de producción a Staging..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI no está instalado${NC}"
    echo "Instala con: npm install -g supabase"
    exit 1
fi

# Verificar que jq esté instalado (para URL encoding)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq no está instalado${NC}"
    echo "Instala con: brew install jq"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  ADVERTENCIA: Este script copiará TODOS los datos de producción a staging${NC}"
echo -e "${YELLOW}   Esto incluye: datos de tablas, usuarios de Auth, y configuraciones RLS${NC}"
echo ""
read -p "¿Estás seguro de continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo -e "${YELLOW}📥 Preparando descarga de datos de producción...${NC}"
echo ""

# Pedir contraseña de producción
echo -n "Ingresa la contraseña de la base de datos de PRODUCCIÓN: "
read -s PROD_PASSWORD
echo ""

# URL encode de la contraseña
PROD_PASSWORD_ENCODED=$(printf %s "$PROD_PASSWORD" | jq -sRr @uri)

# Construir URL de conexión de producción
PROD_DB_URL="postgresql://postgres:${PROD_PASSWORD_ENCODED}@db.fkjbvwbnbxslornufhlp.supabase.co:5432/postgres"

echo -e "${YELLOW}📥 Descargando datos de producción...${NC}"

# Verificar que pg_dump esté instalado
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump no está instalado${NC}"
    echo "Instala PostgreSQL con: brew install postgresql"
    exit 1
fi

# Hacer dump de la base de datos de producción (solo datos)
# Usamos pg_dump directamente en lugar de supabase db dump para evitar Docker
PGPASSWORD="$PROD_PASSWORD" pg_dump \
    -h db.fkjbvwbnbxslornufhlp.supabase.co \
    -p 5432 \
    -U postgres \
    -d postgres \
    --data-only \
    --no-owner \
    --no-privileges \
    --disable-triggers \
    -f /tmp/production_to_staging.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al descargar datos de producción${NC}"
    echo -e "${YELLOW}💡 Verifica que la contraseña sea correcta${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Datos de producción descargados${NC}"
echo ""

# Pedir contraseña de staging
echo -n "Ingresa la contraseña de la base de datos de STAGING: "
read -s STAGING_PASSWORD
echo ""

# URL encode de la contraseña de staging
STAGING_PASSWORD_ENCODED=$(printf %s "$STAGING_PASSWORD" | jq -sRr @uri)

# Construir URL de conexión de staging
# NOTA: Reemplaza esto con tu URL de staging real
echo ""
echo -e "${YELLOW}⚠️  Necesitas la URL de tu proyecto de staging${NC}"
echo "Formato: db.[PROJECT_REF].supabase.co"
echo -n "Ingresa el PROJECT_REF de staging: "
read STAGING_PROJECT_REF
echo ""

STAGING_DB_URL="postgresql://postgres:${STAGING_PASSWORD_ENCODED}@db.${STAGING_PROJECT_REF}.supabase.co:5432/postgres"

# Preguntar si quiere resetear staging primero
echo -e "${YELLOW}⚠️  IMPORTANTE: Se recomienda resetear staging antes de importar${NC}"
read -p "¿Quieres resetear la base de datos de staging antes de importar? (S/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}🔄 Reseteando base de datos de staging...${NC}"
    echo -e "${YELLOW}   Esto eliminará TODOS los datos actuales en staging${NC}"
    read -p "¿Confirmas el reseteo? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        # Para resetear, necesitamos ejecutar TRUNCATE en todas las tablas
        echo -e "${YELLOW}   Creando script de limpieza...${NC}"
        
        # Crear script SQL para truncar todas las tablas
        cat > /tmp/truncate_staging.sql << 'EOF'
-- Deshabilitar triggers temporalmente
SET session_replication_role = replica;

-- Truncar tablas en orden (respetando foreign keys)
TRUNCATE TABLE match_goals CASCADE;
TRUNCATE TABLE match_quarter_results CASCADE;
TRUNCATE TABLE match_periods_played CASCADE;
TRUNCATE TABLE match_callups CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE training_attendances CASCADE;
TRUNCATE TABLE trainings CASCADE;
TRUNCATE TABLE player_evaluations CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE teams CASCADE;
TRUNCATE TABLE clubs CASCADE;
TRUNCATE TABLE sports CASCADE;
TRUNCATE TABLE pending_invites CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Re-habilitar triggers
SET session_replication_role = DEFAULT;
EOF
        
        # Ejecutar limpieza en staging
        PGPASSWORD="$STAGING_PASSWORD" psql \
            -h "db.${STAGING_PROJECT_REF}.supabase.co" \
            -p 5432 \
            -U postgres \
            -d postgres \
            -f /tmp/truncate_staging.sql
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error al limpiar staging${NC}"
            echo -e "${YELLOW}💡 Continuando de todas formas...${NC}"
        else
            echo -e "${GREEN}✓ Staging limpiado${NC}"
        fi
        
        rm /tmp/truncate_staging.sql
    fi
fi

echo ""
echo -e "${YELLOW}📤 Importando datos a Staging...${NC}"
echo -e "${YELLOW}   Esto puede tomar varios minutos...${NC}"
echo ""

# Importar los datos a staging usando PGPASSWORD
PGPASSWORD="$STAGING_PASSWORD" psql \
    -h "db.${STAGING_PROJECT_REF}.supabase.co" \
    -p 5432 \
    -U postgres \
    -d postgres \
    -f /tmp/production_to_staging.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al importar datos a staging${NC}"
    echo -e "${YELLOW}💡 Revisa los logs arriba para más detalles${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Datos importados exitosamente a staging${NC}"
echo ""

# Limpiar archivo temporal
rm /tmp/production_to_staging.sql

echo -e "${GREEN}✅ Sincronización completa!${NC}"
echo ""
echo "Los datos de producción ahora están en staging"
echo ""
echo -e "${YELLOW}📝 Próximos pasos recomendados:${NC}"
echo "1. Verifica que los datos se importaron correctamente"
echo "2. Prueba la funcionalidad en staging"
echo "3. Considera anonimizar datos sensibles si es necesario"
echo ""

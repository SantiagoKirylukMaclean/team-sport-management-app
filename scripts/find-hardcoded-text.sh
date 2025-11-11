#!/bin/bash

# Script para encontrar textos hardcodeados en español que necesitan traducción
# Uso: bash scripts/find-hardcoded-text.sh

echo "🔍 Buscando textos hardcodeados en español..."
echo ""

# Buscar strings en español comunes en archivos TSX/TS
echo "📝 Textos en componentes:"
grep -r --include="*.tsx" --include="*.ts" \
  -E '(>|"|'"'"'|label=|title=|placeholder=)(Agregar|Editar|Eliminar|Guardar|Cancelar|Buscar|Filtrar|Nombre|Email|Teléfono|Dirección|Fecha|Hora|Activo|Inactivo|Jugador|Partido|Entrenamiento|Estadística|Usuario|Equipo|Club|Deporte)' \
  src/ \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  | head -30

echo ""
echo "✅ Revisa estos archivos y reemplaza los textos por t('categoria.clave')"
echo ""
echo "Ejemplo:"
echo "  Antes: <button>Guardar</button>"
echo "  Después: <button>{t('common.save')}</button>"

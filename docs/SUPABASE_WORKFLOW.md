# Workflow de Desarrollo con Supabase

## 📝 Configuración Actual

Tu proyecto está configurado para trabajar **exclusivamente con la base de datos LOCAL en Docker**.

### Estado Actual:
- ✅ **Desconectado** de proyectos remotos (production/staging)
- ✅ Base de datos local corriendo en Docker
- ✅ Todas las migraciones aplicadas localmente
- ✅ Scripts de verificación configurados
- ✅ `.gitignore` actualizado para prevenir commits accidentales

## 🔒 Cómo Asegurarte de Usar SIEMPRE Local

### Método 1: Verificar Antes de Ejecutar (Recomendado)

Antes de ejecutar cualquier comando de Supabase, verifica el ambiente:

```bash
npm run supabase:check
```

Este comando te mostrará:
- ✅ Si estás usando LOCAL o ⚠️ si estás conectado a REMOTO
- El estado de los servicios
- URLs de acceso

### Método 2: Usar Scripts NPM Seguros

Usa los scripts predefinidos que incluyen verificación automática:

```bash
# Estos scripts verifican automáticamente que uses LOCAL
npm run supabase:status   # Ver estado con verificación
npm run supabase:reset    # Reset DB con verificación
npm run supabase:migration nombre_migracion  # Nueva migración con verificación
```

### Método 3: Verificación Manual

```bash
# Verificar si existe conexión remota
ls supabase/.temp/project-ref 2>/dev/null && echo "⚠️ REMOTO" || echo "✅ LOCAL"

# Ver proyectos disponibles
npx supabase projects list
# Si ninguno tiene ●, estás en local
```

### ⚠️ Archivo Protegido

El archivo `supabase/.temp/project-ref` ahora está en `.gitignore` para prevenir commits accidentales de conexiones remotas.

## 🔧 Comandos para Desarrollo Local

### Scripts NPM Recomendados (con verificación de seguridad)

```bash
# Verificar ambiente actual
npm run supabase:check

# Iniciar Supabase local
npm run supabase:start

# Detener Supabase local
npm run supabase:stop

# Ver estado (con verificación)
npm run supabase:status

# Abrir Supabase Studio en el navegador
npm run supabase:studio

# MIGRACIONES
# Reset DB - Aplica TODAS las migraciones desde cero (con verificación)
npm run supabase:reset

# Migrar - Aplica solo las migraciones pendientes (con verificación)
npm run supabase:migrate

# Crear nueva migración (con verificación)
npm run supabase:migration:new nombre_migracion

# Listar estado de migraciones
npm run supabase:migration:list

# Push migraciones a remoto (con verificación)
npm run supabase:push
```

### Comandos Directos (sin verificación)

También puedes usar comandos directos de Supabase CLI:

```bash
# Iniciar Supabase Local
npx supabase start

# Detener Supabase Local
npx supabase stop

# Ver Estado de Servicios Locales
npx supabase status

# Reset Base de Datos Local (aplicar todas las migraciones)
npx supabase db reset

# Crear Nueva Migración
npx supabase migration new nombre_de_la_migracion
```

⚠️ **Nota**: Los scripts NPM incluyen verificación automática del ambiente. Si usas comandos directos, verifica manualmente con `npm run supabase:check` primero.

## 🌐 URLs de Desarrollo Local

Cuando Supabase local está corriendo:

- **API URL**: http://127.0.0.1:54321
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio URL**: http://127.0.0.1:54323 (interfaz web para ver la BD)
- **Mailpit URL**: http://127.0.0.1:54324 (captura emails de desarrollo)

## 🚀 Deploy a Producción/Staging

### 1. Conectar a Proyecto Remoto

**Para Producción:**
```bash
npx supabase link --project-ref fkjbvwbnbxslornufhlp
```

**Para Staging:**
```bash
npx supabase link --project-ref wuinfsedukvxlkfvlpna
```

### 2. Aplicar Migraciones a Remoto
```bash
npx supabase db push
```

⚠️ **IMPORTANTE**: Siempre verifica que estás conectado al proyecto correcto antes de hacer push:
```bash
npx supabase projects list
```
El proyecto con `●` es el activo.

### 3. Desconectar del Proyecto Remoto
```bash
npx supabase unlink
```

## 📋 Workflow Recomendado

### Desarrollo de Features:

1. **Trabajar en Local**
   ```bash
   # Asegurarte que no estás conectado a remoto
   npx supabase status

   # Crear migración si es necesario
   npx supabase migration new add_new_feature

   # Editar el archivo de migración en supabase/migrations/
   # Aplicar cambios
   npx supabase db reset
   ```

2. **Probar en Staging** (opcional pero recomendado)
   ```bash
   # Conectar a staging
   npx supabase link --project-ref wuinfsedukvxlkfvlpna

   # Aplicar migraciones
   npx supabase db push

   # Probar la aplicación en staging

   # Desconectar
   npx supabase unlink
   ```

3. **Deploy a Producción**
   ```bash
   # Conectar a producción
   npx supabase link --project-ref fkjbvwbnbxslornufhlp

   # Aplicar migraciones
   npx supabase db push

   # Desconectar
   npx supabase unlink
   ```

## 🔐 Diferencias entre Ambientes

### Local (Docker)
- **Propósito**: Desarrollo y pruebas
- **Datos**: Se pueden resetear fácilmente
- **URL**: http://127.0.0.1:54321
- **Base de Datos**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

### Staging
- **Propósito**: Pre-producción y testing
- **Project Ref**: wuinfsedukvxlkfvlpna
- **Región**: eu-north-1

### Production
- **Propósito**: Usuarios reales
- **Project Ref**: fkjbvwbnbxslornufhlp
- **Región**: eu-north-1

## 🛡️ Mejores Prácticas

1. **Nunca hacer push directo a producción sin probar**
   - Siempre probar migraciones en local primero
   - Considerar probar en staging antes de producción

2. **Mantener migraciones en orden**
   - No modificar migraciones ya aplicadas
   - Crear nuevas migraciones para cambios adicionales

3. **Verificar antes de push**
   ```bash
   # Ver qué migraciones se van a aplicar
   npx supabase projects list  # Verificar proyecto activo
   npx supabase db push --dry-run  # Ver cambios sin aplicarlos
   ```

4. **Desconectar después de deploy**
   - Siempre ejecutar `npx supabase unlink` después de hacer deploy
   - Esto previene aplicar cambios accidentalmente a producción

5. **Usar control de versiones**
   - Commitear migraciones en Git
   - Usar branches para features nuevos

## 🔍 Comandos Útiles de Debugging

### Ver Logs de Postgres Local
```bash
docker logs supabase_db_team-sport-management-app -f
```

### Conectar a Postgres Local con psql
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Ver Contenedores de Supabase
```bash
docker ps | grep supabase
```

### Limpiar Todo y Empezar de Nuevo
```bash
npx supabase stop
npx supabase start
npx supabase db reset
```

## 📊 Archivo .env

Para desarrollo local, tu aplicación debe usar:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

Para staging/producción, necesitarás las keys correspondientes de cada ambiente.

## ⚠️ Problemas Comunes

### "Cannot find project ref"
**Causa**: Estás intentando usar un comando que requiere conexión remota
**Solución**: Asegúrate de estar desconectado (`npx supabase unlink`) para trabajar en local

### Migraciones no se aplican
**Causa**: Puede haber un error en alguna migración
**Solución**:
```bash
npx supabase db reset --debug
```

### Puerto 54321 ya en uso
**Causa**: Otra instancia de Supabase corriendo
**Solución**:
```bash
npx supabase stop
npx supabase start
```

# 📁 Scripts de Supabase

Scripts utilitarios para trabajar con Supabase de forma segura y eficiente.

## 📋 Scripts Disponibles

### 🔒 Scripts de Seguridad

#### `check-supabase-env.sh` ⭐ NUEVO
**Verifica a qué ambiente estás conectado antes de ejecutar comandos**

**Uso:**
```bash
npm run supabase:check
# o
bash scripts/check-supabase-env.sh
```

**Qué hace:**
- ✅ Verifica si estás conectado LOCAL o REMOTO
- ⚠️ Advierte si estás en PRODUCCIÓN
- 🔍 Verifica que Docker esté corriendo
- 📊 Muestra URLs de acceso

**Por qué es importante:** Previene ejecutar comandos destructivos en producción por error.

Ver [documentación completa](../SUPABASE_WORKFLOW.md#-cómo-asegurarte-de-usar-siempre-local)

---

### 🔄 Scripts de Sincronización

#### 1. `sync-production-data.sh`
Sincroniza datos de **producción → local**

#### 2. `sync-prod-to-staging.sh`
Sincroniza datos de **producción → staging**

---

## Uso: Producción → Staging

### Requisitos Previos

1. **Supabase CLI** instalado:
   ```bash
   npm install -g supabase
   ```

2. **jq** instalado (para URL encoding):
   ```bash
   brew install jq
   ```

3. **psql** instalado (viene con PostgreSQL):
   ```bash
   brew install postgresql
   ```

4. **Credenciales necesarias**:
   - Contraseña de la base de datos de producción
   - Contraseña de la base de datos de staging
   - Project REF de staging (ej: `abcdefghijklmnop`)

### Cómo Obtener las Credenciales

#### Contraseña de la Base de Datos

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → Database
3. Busca "Database password" o "Connection string"
4. La contraseña está en la connection string

#### Project REF

1. En Supabase Dashboard, ve a tu proyecto de staging
2. Settings → General
3. Busca "Reference ID" o mira la URL del proyecto
4. Es el código después de `https://supabase.com/dashboard/project/`

### Ejecutar el Script

```bash
./scripts/sync-prod-to-staging.sh
```

El script te pedirá:
1. ✅ Confirmación de que quieres continuar
2. 🔑 Contraseña de producción
3. 🔑 Contraseña de staging
4. 📝 Project REF de staging
5. ⚠️ Confirmación para resetear staging (recomendado)

### Proceso del Script

1. **Descarga** datos de producción (solo datos, no esquema)
2. **Limpia** staging (opcional pero recomendado)
3. **Importa** datos a staging
4. **Verifica** que todo funcionó correctamente

---

## ⚠️ Advertencias Importantes

### Datos que SE copian:
- ✅ Todos los datos de las tablas
- ✅ Usuarios de Auth (emails, contraseñas hasheadas)
- ✅ Configuraciones RLS
- ✅ Relaciones entre tablas

### Datos que NO se copian:
- ❌ Archivos en Storage
- ❌ Configuración de Auth providers
- ❌ Edge Functions
- ❌ Webhooks

### Consideraciones de Seguridad

1. **Datos sensibles**: Los datos de producción incluyen información real de usuarios
2. **Emails**: Los usuarios de producción recibirán emails si pruebas funcionalidades de Auth en staging
3. **Anonimización**: Considera anonimizar datos después de la importación

---

## Solución de Problemas

### Error: "jq: command not found"
```bash
brew install jq
```

### Error: "psql: command not found"
```bash
brew install postgresql
```

### Error: "contraseña incorrecta"
- Verifica que copiaste la contraseña completa
- Asegúrate de no incluir espacios al inicio o final
- Prueba la contraseña en Supabase Studio primero

### Error: "permission denied"
```bash
chmod +x scripts/sync-prod-to-staging.sh
```

### Error al importar datos
- Verifica que staging tenga el mismo esquema que producción
- Ejecuta las migraciones en staging primero si es necesario
- Considera resetear staging antes de importar

---

## Script de Anonimización (Opcional)

Si quieres anonimizar datos después de importar:

```sql
-- Anonimizar emails de usuarios
UPDATE auth.users 
SET email = CONCAT('test+', id::text, '@example.com')
WHERE email NOT LIKE '%@example.com';

-- Anonimizar nombres de jugadores
UPDATE players 
SET full_name = CONCAT('Jugador ', id);

-- Anonimizar nombres de clubes
UPDATE clubs 
SET name = CONCAT('Club ', id);
```

Guarda esto en `scripts/anonymize-staging.sql` y ejecútalo después de importar:

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" < scripts/anonymize-staging.sql
```

---

## Frecuencia Recomendada

- **Staging**: Sincronizar semanalmente o antes de releases importantes
- **Local**: Sincronizar cuando necesites datos reales para desarrollo

---

## Alternativa: Usar Supabase Branching (Próximamente)

Supabase está desarrollando "Database Branching" que facilitará esto. Mientras tanto, usa estos scripts.

---

## Soporte

Si tienes problemas:
1. Verifica que tienes todas las dependencias instaladas
2. Revisa los logs del script para ver el error exacto
3. Asegúrate de tener las credenciales correctas
4. Verifica que staging tenga el mismo esquema que producción

# Design Document: CI/CD Deployment System

## Overview

Este documento describe el diseño de un sistema de CI/CD completo que automatiza el deployment de la aplicación a través de tres ambientes: local (Docker), staging y producción. El sistema utiliza Supabase CLI para desarrollo local, GitHub Actions para orquestación de CI/CD, Supabase para base de datos y backend, y Vercel para hosting del frontend.

El flujo de trabajo sigue una progresión natural:
1. **Local**: Desarrollo y pruebas con Supabase en Docker
2. **Staging**: Validación automática al hacer push a la rama `stage`
3. **Production**: Deployment automático al hacer merge de `stage` a `main`

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Workflow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Feature    │─────▶│    Stage     │─────▶│     Main     │  │
│  │   Branch     │      │    Branch    │      │    Branch    │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│        │                      │                      │           │
│        │                      │                      │           │
│        ▼                      ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Supabase   │      │   GitHub     │      │   GitHub     │  │
│  │   Docker     │      │   Actions    │      │   Actions    │  │
│  │   (Local)    │      │  (Staging)   │      │ (Production) │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                              │                      │           │
│                              ▼                      ▼           │
│                        ┌──────────────┐      ┌──────────────┐  │
│                        │  Supabase    │      │  Supabase    │  │
│                        │  Staging     │      │  Production  │  │
│                        │  Project     │      │  Project     │  │
│                        └──────────────┘      └──────────────┘  │
│                              │                      │           │
│                              ▼                      ▼           │
│                        ┌──────────────┐      ┌──────────────┐  │
│                        │   Vercel     │      │   Vercel     │  │
│                        │   Preview    │      │  Production  │  │
│                        └──────────────┘      └──────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Local as Supabase Local
    participant Git as Git Repository
    participant GHA as GitHub Actions
    participant SupaStage as Supabase Staging
    participant SupaProd as Supabase Production
    participant Vercel as Vercel

    Dev->>Local: supabase start
    Dev->>Local: Create & test migrations
    Dev->>Git: Push to stage branch
    Git->>GHA: Trigger staging workflow
    GHA->>SupaStage: Run migrations
    SupaStage-->>GHA: Migration success
    GHA->>SupaStage: Deploy edge functions
    SupaStage-->>GHA: Functions deployed
    GHA->>Vercel: Deploy to preview
    Vercel-->>GHA: Deployment URL
    Dev->>Git: Merge stage to main
    Git->>GHA: Trigger production workflow
    GHA->>SupaProd: Run migrations
    SupaProd-->>GHA: Migration success
    GHA->>SupaProd: Deploy edge functions
    SupaProd-->>GHA: Functions deployed
    GHA->>Vercel: Deploy to production
    Vercel-->>GHA: Production URL
```

## Components and Interfaces

### 1. Local Development Environment

**Purpose**: Proporcionar un ambiente de desarrollo completo usando Docker para que los desarrolladores puedan trabajar sin afectar ambientes remotos.

**Components**:
- **Supabase CLI**: Herramienta de línea de comandos para gestionar Supabase localmente
- **Docker Compose**: Orquesta los contenedores de servicios de Supabase
- **PostgreSQL Container**: Base de datos local
- **Supabase Studio Container**: UI para gestionar la base de datos
- **Edge Runtime Container**: Para ejecutar Edge Functions localmente

**Configuration Files**:
- `supabase/config.toml`: Configuración de Supabase CLI (ya existe)
- `.env.local`: Variables de entorno para desarrollo local (ya existe)

**Key Commands**:
```bash
supabase start              # Inicia todos los servicios
supabase stop               # Detiene los servicios
supabase db reset           # Resetea la DB con todas las migraciones
supabase migration new NAME # Crea nueva migración
supabase functions serve    # Sirve edge functions localmente
```

### 2. GitHub Actions Workflows

**Purpose**: Automatizar el deployment a staging y producción cuando se hace push a las ramas correspondientes.

**Workflow Files**:
- `.github/workflows/deploy-staging.yml`: Workflow para staging
- `.github/workflows/deploy-production.yml`: Workflow para producción

**Workflow Structure**:
```yaml
name: Deploy to [Environment]
on:
  push:
    branches: [stage|main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Supabase CLI
      - Run migrations
      - Deploy edge functions
      - Deploy to Vercel
      - Report status
```

**GitHub Secrets Required** (información sensible):
- `SUPABASE_ACCESS_TOKEN_STAGING`: Token de acceso para CLI en staging (obtener de https://supabase.com/dashboard/account/tokens)
- `SUPABASE_ACCESS_TOKEN_PROD`: Token de acceso para CLI en producción
- `VERCEL_TOKEN`: Token para deployments de Vercel (obtener de Vercel Account Settings)
- `VERCEL_ORG_ID`: ID de organización de Vercel
- `VERCEL_PROJECT_ID`: ID del proyecto de Vercel

**Environment Variables** (información pública, puede estar en el workflow):
- `SUPABASE_PROJECT_ID`: ID del proyecto (staging: `wuinfsedukvxlkfvlpna`, prod: `fkjbvwbnbxslornufhlp`)
- `VERCEL_ENV`: `preview` o `production`

**Note**: Los Project IDs de Supabase son públicos (aparecen en las URLs), por lo que no necesitan estar en secrets. Los anon keys también son semi-públicos ya que se exponen en el frontend, pero se pueden poner en secrets por organización.

### 3. Supabase Projects

**Purpose**: Proporcionar base de datos PostgreSQL, autenticación y edge functions para cada ambiente.

**Projects**:
- **Staging**: Project ID `wuinfsedukvxlkfvlpna`
- **Production**: Project ID `fkjbvwbnbxslornufhlp`

**Resources per Project**:
- PostgreSQL database
- Auth service
- Storage buckets
- Edge Functions runtime
- Realtime subscriptions

**Migration Management**:
- Migrations stored in `supabase/migrations/`
- Applied using `supabase db push`
- Tracked in `supabase_migrations` table

**Edge Functions**:
- Functions stored in `supabase/functions/`
- Deployed using `supabase functions deploy`
- Current function: `invite-user`

### 4. Vercel Deployment

**Purpose**: Hospedar el frontend de la aplicación con diferentes ambientes.

**Configuration**:
- Single Vercel project with multiple environments
- **Preview environment**: Para staging (rama `stage`)
- **Production environment**: Para producción (rama `main`)

**Environment Variables in Vercel**:

Staging (Preview):
```
VITE_SUPABASE_URL=https://wuinfsedukvxlkfvlpna.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aW5mc2VkdWt2eGxrZnZscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyNzksImV4cCI6MjA3Mzk1NjI3OX0.e0jkrGdwA6-lKRN-nbu_GDsoQWv_wq74Z535_1jqwTU
```

Production:
```
VITE_SUPABASE_URL=https://fkjbvwbnbxslornufhlp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramJ2d2JuYnhzbG9ybnVmaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyMTYsImV4cCI6MjA3Mzk1NjIxNn0.V0PjH40lQndc4RoEs6pUiJi_DwYg2Ou6UB_QPfQV24k
```

**Note**: Estos anon keys son seguros de exponer en el frontend ya que están diseñados para uso público. La seguridad se maneja mediante Row Level Security (RLS) en Supabase.

**Deployment Method**:
- Triggered by GitHub Actions using Vercel CLI
- Build command: `npm run build`
- Output directory: `dist`

## Data Models

### GitHub Actions Workflow Configuration

```yaml
# Workflow metadata
name: string
on:
  push:
    branches: string[]
  pull_request:
    branches: string[]

# Job definition
jobs:
  deploy:
    runs-on: string
    environment: string
    steps:
      - name: string
        uses: string
        with: object
        env: object
```

### Supabase Migration File

```sql
-- Migration: YYYYMMDDHHMMSS_description.sql
-- Applied in chronological order
-- Tracked in supabase_migrations table

-- Example structure:
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Environment Configuration

```typescript
interface EnvironmentConfig {
  name: 'local' | 'staging' | 'production';
  supabase: {
    projectId: string;
    url: string;
    anonKey: string;
  };
  vercel: {
    environment: 'development' | 'preview' | 'production';
    projectId: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the testable properties are primarily configuration validation examples. Most of the requirements involve external tools (Supabase CLI, GitHub Actions, Vercel) whose behavior we don't control. The properties we can test focus on validating that our configuration files are correctly structured.

Key testable areas:
1. GitHub Actions workflow YAML structure and triggers
2. Workflow step dependencies and ordering
3. Secret and variable references
4. Environment-specific configurations

These are all example-based tests rather than universal properties, as they validate specific configuration values rather than general rules.

### Testable Properties

**Example 1: Staging workflow triggers on stage branch**
*When* the staging workflow YAML is parsed, the push trigger should include the `stage` branch
**Validates: Requirements 3.3**

**Example 2: Production workflow triggers on main branch**
*When* the production workflow YAML is parsed, the push trigger should include the `main` branch
**Validates: Requirements 3.5**

**Example 3: Staging workflow uses correct Supabase project**
*When* the staging workflow is executed, it should reference the project ID `wuinfsedukvxlkfvlpna`
**Validates: Requirements 4.1**

**Example 4: Production workflow uses correct Supabase project**
*When* the production workflow is executed, it should reference the project ID `fkjbvwbnbxslornufhlp`
**Validates: Requirements 4.2**

**Example 5: Workflows reference required secrets**
*When* workflows are parsed, they should reference `SUPABASE_ACCESS_TOKEN_STAGING`, `SUPABASE_ACCESS_TOKEN_PROD`, and `VERCEL_TOKEN`
**Validates: Requirements 9.1, 9.2**

**Example 6: Migration step runs before Vercel deployment**
*When* the workflow is parsed, the Vercel deployment step should depend on the migration step completing successfully
**Validates: Requirements 10.1, 10.2, 10.3**

**Example 7: Failed steps prevent subsequent steps**
*When* the workflow is parsed, deployment steps should have `if: success()` conditions to prevent execution after failures
**Validates: Requirements 5.2, 6.2, 10.4**

**Example 8: Staging workflow deploys to Vercel preview**
*When* the staging workflow is parsed, the Vercel deployment should use `--target preview` or equivalent
**Validates: Requirements 7.1**

**Example 9: Production workflow deploys to Vercel production**
*When* the production workflow is parsed, the Vercel deployment should use `--prod` or equivalent
**Validates: Requirements 7.2**

## Error Handling

### Migration Failures

**Scenario**: Una migración falla durante el deployment

**Handling**:
1. GitHub Actions detecta el exit code no-cero de `supabase db push`
2. El workflow se marca como fallido
3. Los pasos subsecuentes (functions, Vercel) no se ejecutan
4. El commit se marca con estado de fallo en GitHub
5. El deployment anterior permanece activo

**Recovery**:
1. Desarrollador revisa los logs del workflow
2. Corrige la migración localmente
3. Prueba con `supabase db reset` local
4. Hace push de la corrección
5. El workflow se re-ejecuta automáticamente

### Edge Function Deployment Failures

**Scenario**: El deployment de una edge function falla

**Handling**:
1. GitHub Actions detecta el fallo de `supabase functions deploy`
2. El workflow se detiene antes del deployment de Vercel
3. Las funciones anteriores permanecen activas
4. Se registra el error en los logs

**Recovery**:
1. Desarrollador revisa los logs
2. Corrige la función localmente con `supabase functions serve`
3. Hace push de la corrección
4. El workflow se re-ejecuta

### Vercel Deployment Failures

**Scenario**: El deployment a Vercel falla

**Handling**:
1. GitHub Actions detecta el fallo del Vercel CLI
2. El workflow se marca como fallido
3. El deployment anterior permanece activo en Vercel
4. Las migraciones y funciones ya aplicadas permanecen

**Recovery**:
1. Desarrollador revisa los logs de Vercel
2. Corrige el problema (usualmente build errors)
3. Hace push de la corrección
4. El workflow se re-ejecuta

### Missing Secrets

**Scenario**: Un secret requerido no está configurado

**Handling**:
1. GitHub Actions falla al intentar acceder al secret
2. El workflow se detiene inmediatamente
3. Se muestra un error claro indicando el secret faltante

**Recovery**:
1. Administrador configura el secret en GitHub Settings
2. Re-ejecuta el workflow manualmente

### Invalid Credentials

**Scenario**: Un token de acceso es inválido o ha expirado

**Handling**:
1. Supabase CLI o Vercel CLI retorna error de autenticación
2. El workflow se detiene
3. Se registra el error de autenticación

**Recovery**:
1. Administrador genera nuevo token
2. Actualiza el secret en GitHub
3. Re-ejecuta el workflow

## Testing Strategy

### Configuration Validation Tests

**Purpose**: Validar que los archivos de configuración de GitHub Actions están correctamente estructurados.

**Approach**: Unit tests que parsean los archivos YAML y verifican:
- Triggers correctos por branch
- Referencias a secrets correctos
- Project IDs correctos por ambiente
- Orden de pasos y dependencias
- Condiciones de ejecución (`if: success()`)

**Tools**: 
- `js-yaml` para parsear YAML
- Vitest para testing framework

**Example Test Structure**:
```typescript
describe('GitHub Actions Workflows', () => {
  describe('Staging Workflow', () => {
    it('should trigger on push to stage branch', () => {
      const workflow = parseYAML('.github/workflows/deploy-staging.yml');
      expect(workflow.on.push.branches).toContain('stage');
    });

    it('should use staging Supabase project ID', () => {
      const workflow = parseYAML('.github/workflows/deploy-staging.yml');
      expect(workflow.jobs.deploy.env.SUPABASE_PROJECT_ID)
        .toBe('wuinfsedukvxlkfvlpna');
    });

    it('should deploy to Vercel preview', () => {
      const workflow = parseYAML('.github/workflows/deploy-staging.yml');
      const vercelStep = findStep(workflow, 'Deploy to Vercel');
      expect(vercelStep.run).toContain('--target preview');
    });
  });

  describe('Production Workflow', () => {
    it('should trigger on push to main branch', () => {
      const workflow = parseYAML('.github/workflows/deploy-production.yml');
      expect(workflow.on.push.branches).toContain('main');
    });

    it('should use production Supabase project ID', () => {
      const workflow = parseYAML('.github/workflows/deploy-production.yml');
      expect(workflow.jobs.deploy.env.SUPABASE_PROJECT_ID)
        .toBe('fkjbvwbnbxslornufhlp');
    });
  });

  describe('Workflow Dependencies', () => {
    it('should run migrations before Vercel deployment', () => {
      const workflow = parseYAML('.github/workflows/deploy-staging.yml');
      const steps = workflow.jobs.deploy.steps;
      const migrationIndex = steps.findIndex(s => s.name.includes('migration'));
      const vercelIndex = steps.findIndex(s => s.name.includes('Vercel'));
      expect(migrationIndex).toBeLessThan(vercelIndex);
    });

    it('should prevent Vercel deployment if migrations fail', () => {
      const workflow = parseYAML('.github/workflows/deploy-staging.yml');
      const vercelStep = findStep(workflow, 'Deploy to Vercel');
      expect(vercelStep.if).toContain('success()');
    });
  });
});
```

### Integration Tests

**Purpose**: Validar que el flujo completo funciona en un ambiente de prueba.

**Approach**: 
- Crear un proyecto de Supabase de prueba
- Ejecutar los workflows contra este proyecto
- Validar que las migraciones se aplican correctamente
- Validar que las funciones se despliegan

**Note**: Estos tests son opcionales y se ejecutarían manualmente o en un ambiente de CI separado.

### Manual Testing Checklist

**Local Development**:
- [ ] `supabase start` inicia todos los servicios
- [ ] Migraciones se aplican correctamente
- [ ] Edge functions funcionan localmente
- [ ] Aplicación se conecta a Supabase local

**Staging Deployment**:
- [ ] Push a `stage` dispara el workflow
- [ ] Migraciones se aplican a staging
- [ ] Edge functions se despliegan a staging
- [ ] Vercel despliega a preview environment
- [ ] Aplicación funciona en staging

**Production Deployment**:
- [ ] Merge a `main` dispara el workflow
- [ ] Migraciones se aplican a producción
- [ ] Edge functions se despliegan a producción
- [ ] Vercel despliega a production environment
- [ ] Aplicación funciona en producción

**Error Scenarios**:
- [ ] Migración fallida detiene el workflow
- [ ] Function deployment fallido detiene el workflow
- [ ] Vercel deployment fallido mantiene versión anterior
- [ ] Missing secrets causan fallo claro

## Implementation Notes

### Supabase CLI Installation

Los workflows de GitHub Actions necesitarán instalar Supabase CLI:

```yaml
- name: Setup Supabase CLI
  uses: supabase/setup-cli@v1
  with:
    version: latest
```

### Vercel CLI Installation

Los workflows necesitarán instalar Vercel CLI:

```yaml
- name: Setup Vercel CLI
  run: npm install -g vercel
```

### Environment-Specific Configuration

Cada workflow debe configurar las variables de entorno apropiadas:

**Staging**:
```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN_STAGING }}
  SUPABASE_PROJECT_ID: wuinfsedukvxlkfvlpna
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Production**:
```yaml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN_PROD }}
  SUPABASE_PROJECT_ID: fkjbvwbnbxslornufhlp
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Migration Best Practices

1. **Always test locally first**: Usa `supabase db reset` para validar migraciones
2. **Make migrations idempotent**: Usa `IF NOT EXISTS`, `IF EXISTS`, etc.
3. **Avoid destructive changes**: No hagas `DROP TABLE` sin backup
4. **Use transactions**: Envuelve cambios complejos en transacciones
5. **Document migrations**: Agrega comentarios explicando el propósito

### Rollback Strategy

**Code Rollback**:
1. Revertir el commit problemático
2. Push para disparar nuevo deployment
3. El código anterior se despliega

**Database Rollback**:
1. Las migraciones NO se revierten automáticamente
2. Crear una nueva migración que revierta los cambios
3. Aplicarla siguiendo el flujo normal (local → staging → prod)
4. Alternativamente, usar Supabase Dashboard para cambios manuales

**Function Rollback**:
1. Revertir el código de la función
2. Push para re-desplegar la versión anterior

## Security Considerations

### Secrets Management

- **Never commit secrets**: Usar GitHub Secrets y Vercel Environment Variables
- **Rotate tokens regularly**: Especialmente después de que alguien deja el equipo
- **Principle of least privilege**: Tokens deben tener solo los permisos necesarios
- **Audit access**: Revisar quién tiene acceso a secrets periódicamente

### Database Access

- **Use service role key only in CI/CD**: No exponerlo en el frontend
- **Anon key for frontend**: Solo el anon key debe estar en variables de entorno públicas
- **Row Level Security**: Asegurar que RLS está habilitado en todas las tablas
- **Validate migrations**: Revisar que no exponen datos sensibles

### Vercel Environment Variables

- **Separate by environment**: Staging y production deben tener keys diferentes
- **Mark as sensitive**: Usar la opción "Sensitive" en Vercel para variables secretas
- **Don't expose in logs**: Evitar hacer `console.log` de variables sensibles

## Monitoring and Observability

### GitHub Actions Logs

- Cada workflow run tiene logs detallados
- Logs persisten por 90 días
- Accesibles desde la pestaña "Actions" en GitHub

### Supabase Logs

- Logs de migraciones disponibles en Supabase Dashboard
- Logs de edge functions en la sección Functions
- Logs de base de datos en la sección Logs

### Vercel Logs

- Build logs disponibles en cada deployment
- Runtime logs en la sección Logs
- Analytics disponibles en el dashboard

### Alerting

**GitHub Actions**:
- Notificaciones automáticas en GitHub cuando un workflow falla
- Configurar notificaciones por email en GitHub settings

**Vercel**:
- Notificaciones de deployment en Vercel dashboard
- Integración con Slack disponible

**Supabase**:
- Alertas de uso en Supabase dashboard
- Notificaciones de downtime

## Future Enhancements

### Automated Testing in CI

- Ejecutar tests unitarios antes del deployment
- Ejecutar tests de integración contra staging
- Bloquear deployment si los tests fallan

### Database Seeding

- Seed data automático para staging
- Scripts de seed en `supabase/seed.sql`
- Ejecutar después de migraciones

### Preview Deployments for PRs

- Crear preview deployments para cada PR
- Usar Supabase branching (cuando esté disponible)
- Cleanup automático cuando se cierra el PR

### Deployment Notifications

- Notificaciones en Slack cuando se despliega
- Incluir URLs de deployment
- Notificar fallos con detalles

### Performance Monitoring

- Integrar con herramientas de APM
- Monitorear tiempos de respuesta
- Alertas de performance degradation

### Automated Rollback

- Detectar errores automáticamente
- Rollback automático si se detectan problemas
- Requiere health checks y monitoring robusto

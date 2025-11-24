# Guía Maestra de CI/CD - Orden de Implementación

**Fecha de creación:** 23 de Noviembre, 2025  
**Estado:** ✅ Implementación Completa  
**Propósito:** Guía ordenada para configurar y usar el sistema CI/CD

---

## 📋 Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Orden de Configuración Inicial](#orden-de-configuración-inicial)
3. [Uso Diario del Sistema](#uso-diario-del-sistema)
4. [Documentación de Referencia](#documentación-de-referencia)
5. [Solución de Problemas](#solución-de-problemas)

---

## Resumen del Sistema

El sistema CI/CD implementado automatiza el despliegue de la aplicación a través de tres ambientes:

```
Local (Docker) → Staging (stage branch) → Production (main branch)
```

**Componentes:**
- **Supabase Local**: Desarrollo con Docker
- **GitHub Actions**: Automatización de despliegues
- **Supabase Cloud**: Base de datos (staging y producción)
- **Vercel**: Hosting del frontend

---

## Orden de Configuración Inicial

### Fase 1: Configuración Local (Primera Vez)

**Objetivo:** Configurar tu máquina para desarrollo local

#### 📄 Documento: `GETTING_STARTED.md`
**Tiempo estimado:** 15-20 minutos

**Pasos:**
1. Instalar prerequisitos (Docker, Supabase CLI, Node.js)
2. Clonar repositorio e instalar dependencias
3. Validar configuración con script
4. Iniciar Supabase local
5. Configurar variables de entorno locales
6. Verificar que todo funciona

**Comandos clave:**
```bash
# Validar setup
./scripts/validate-local-setup.sh

# Iniciar Supabase
supabase start

# Iniciar aplicación
npm run dev
```

**Siguiente paso:** Una vez que tu ambiente local funciona, continúa con la Fase 2.

---

### Fase 2: Configuración de Secretos en GitHub

**Objetivo:** Configurar tokens y credenciales para CI/CD

#### 📄 Documento: `GITHUB_SECRETS_SETUP.md`
**Tiempo estimado:** 20-30 minutos  
**Requiere:** Acceso admin al repositorio de GitHub

**Pasos:**
1. Generar token de Supabase para staging
2. Generar token de Supabase para producción
3. Generar token de Vercel
4. Obtener Organization ID de Vercel
5. Obtener Project ID de Vercel
6. Agregar los 5 secretos a GitHub

**Secretos requeridos:**
- `SUPABASE_ACCESS_TOKEN_STAGING`
- `SUPABASE_ACCESS_TOKEN_PROD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Validación:**
```bash
# Hacer push a stage para probar
git checkout stage
echo "test" >> README.md
git add README.md
git commit -m "test: validate secrets"
git push origin stage

# Verificar en GitHub → Actions
```

**Siguiente paso:** Configurar variables de entorno en Vercel.

---

### Fase 3: Configuración de Variables en Vercel

**Objetivo:** Configurar URLs y keys de Supabase en Vercel

#### 📄 Documento: `VERCEL_ENV_SETUP.md`
**Tiempo estimado:** 15-20 minutos  
**Requiere:** Acceso al proyecto de Vercel

**Pasos:**
1. Acceder a Vercel Dashboard
2. Ir a Settings → Environment Variables
3. Agregar `VITE_SUPABASE_URL` para Preview (staging)
4. Agregar `VITE_SUPABASE_URL` para Production
5. Agregar `VITE_SUPABASE_ANON_KEY` para Preview
6. Agregar `VITE_SUPABASE_ANON_KEY` para Production

**Valores para Preview (Staging):**
```env
VITE_SUPABASE_URL=https://wuinfsedukvxlkfvlpna.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aW5mc2VkdWt2eGxrZnZscG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyNzksImV4cCI6MjA3Mzk1NjI3OX0.e0jkrGdwA6-lKRN-nbu_GDsoQWv_wq74Z535_1jqwTU
```

**Valores para Production:**
```env
VITE_SUPABASE_URL=https://fkjbvwbnbxslornufhlp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramJ2d2JuYnhzbG9ybnVmaGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODAyMTYsImV4cCI6MjA3Mzk1NjIxNn0.V0PjH40lQndc4RoEs6pUiJi_DwYg2Ou6UB_QPfQV24k
```

**Validación:**
```bash
# Hacer push a stage
git push origin stage

# Verificar que el preview deployment usa staging Supabase
# Abrir preview URL y verificar en DevTools
```

**Siguiente paso:** Probar el pipeline completo.

---

### Fase 4: Validación del Pipeline

**Objetivo:** Probar que todo el sistema funciona correctamente

#### 📄 Documento: `CICD_TESTING_GUIDE.md`
**Tiempo estimado:** 30-45 minutos

**Pasos:**

**Test 1: Staging Deployment**
```bash
# 1. Crear rama de prueba
git checkout stage
git pull origin stage
git checkout -b test-cicd-staging

# 2. Hacer un cambio pequeño
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "test: validate staging pipeline"

# 3. Push a stage
git checkout stage
git merge test-cicd-staging
git push origin stage

# 4. Monitorear en GitHub Actions
# Ir a: https://github.com/[tu-org]/[tu-repo]/actions

# 5. Verificar deployment en Vercel
# Copiar URL del preview desde los logs de Actions
```

**Test 2: Production Deployment**
```bash
# Solo después de validar staging!

# 1. Merge a main
git checkout main
git pull origin main
git merge stage
git push origin main

# 2. Monitorear en GitHub Actions

# 3. Verificar deployment en producción
```

**Checklist de validación:**
- [ ] Workflow de staging se ejecuta automáticamente
- [ ] Migraciones se aplican correctamente
- [ ] Edge functions se despliegan
- [ ] Vercel crea preview deployment
- [ ] Aplicación funciona en staging
- [ ] Workflow de producción se ejecuta
- [ ] Aplicación funciona en producción

**Siguiente paso:** Sistema listo para uso diario.

---

## Uso Diario del Sistema

### Para Desarrolladores

#### 📄 Documento Principal: `WORKFLOW_GUIDE.md`
**Referencia rápida para el flujo de trabajo diario**

**Flujo completo:**

```
1. Desarrollo Local
   ↓
2. Push a feature branch
   ↓
3. PR a stage
   ↓
4. Auto-deploy a staging
   ↓
5. Validar en staging
   ↓
6. PR a main
   ↓
7. Auto-deploy a producción
```

**Comandos diarios:**

```bash
# Iniciar el día
git checkout stage
git pull origin stage
git checkout -b feature/mi-feature
supabase start
npm run dev

# Durante desarrollo
supabase migration new mi_cambio
supabase db reset  # Probar migración
npm run test

# Finalizar feature
git add .
git commit -m "Add mi feature"
git push origin feature/mi-feature
# Crear PR en GitHub: feature → stage

# Después de merge a stage
# GitHub Actions despliega automáticamente a staging
# Probar en staging

# Cuando esté listo para producción
# Crear PR en GitHub: stage → main
# Después de merge, GitHub Actions despliega a producción
```

---

### Desarrollo Local Detallado

#### 📄 Documento: `LOCAL_DEVELOPMENT.md`
**Guía completa de desarrollo local con Supabase**

**Cuándo usar:**
- Necesitas crear migraciones
- Quieres probar edge functions
- Necesitas entender comandos de Supabase CLI
- Tienes problemas con el ambiente local

**Secciones importantes:**
- Comandos esenciales de Supabase
- Crear y probar migraciones
- Desarrollar edge functions
- Mejores prácticas
- Workflow completo Local → Staging → Production

---

### Referencias Rápidas

#### 📄 Documento: `SUPABASE_QUICK_REFERENCE.md`
**Cheat sheet de comandos de Supabase**

**Cuándo usar:**
- Olvidaste un comando
- Necesitas referencia rápida
- Quieres ver ejemplos de SQL

**Comandos más usados:**
```bash
supabase start              # Iniciar servicios
supabase stop               # Detener servicios
supabase status             # Ver estado
supabase db reset           # Resetear DB
supabase migration new NAME # Nueva migración
supabase functions serve    # Servir functions
supabase logs               # Ver logs
```

---

## Documentación de Referencia

### Cuando Algo Sale Mal

#### 📄 Documento: `DEPLOYMENT_ROLLBACK_GUIDE.md`
**Guía completa de rollback y recuperación**

**Cuándo usar:**
- Deployment falló
- Producción tiene un bug
- Necesitas revertir cambios
- Migración causó problemas

**Escenarios cubiertos:**
1. Rollback de código (5-10 min)
2. Rollback de edge functions (5-10 min)
3. Rollback de migraciones (30-60 min) ⚠️
4. Rollback de variables de entorno (5-10 min)
5. Recuperación completa del ambiente (1-2 horas)

**Proceso de emergencia:**
```bash
# Rollback rápido de código
git revert HEAD
git push origin main

# Monitorear deployment
# GitHub Actions despliega versión anterior
```

---

### Solución de Problemas Locales

#### 📄 Documento: `SUPABASE_TROUBLESHOOTING.md`
**Soluciones a problemas comunes de Supabase local**

**Cuándo usar:**
- Supabase no inicia
- Migraciones fallan
- No puedes conectarte a la DB
- Edge functions no funcionan
- Docker tiene problemas

**Problemas más comunes:**
1. Puerto en uso → `supabase stop && supabase start`
2. Migración falla → Verificar SQL, usar `IF NOT EXISTS`
3. No conecta → Verificar `.env.local` y anon key
4. Docker sin espacio → `docker system prune -a`

---

### Testing del Pipeline

#### 📄 Documento: `CICD_TESTING_GUIDE.md`
**Cómo probar el pipeline CI/CD**

**Cuándo usar:**
- Después de cambios en workflows
- Para validar configuración
- Antes de un release importante
- Para entrenar nuevos miembros del equipo

**Incluye:**
- Tests de staging deployment
- Tests de production deployment
- Tests de manejo de errores
- Tests de rollback

---

### Reportes y Estado

#### 📄 Documento: `CICD_PIPELINE_TEST_REPORT.md`
**Reporte de validación del pipeline**

**Cuándo usar:**
- Para verificar que todo está configurado
- Para auditoría
- Para documentación de compliance

**Contiene:**
- Resultados de 82 tests (100% passing)
- Validación de requirements
- Arquitectura del sistema
- Próximos pasos

---

#### 📄 Documento: `CICD_IMPLEMENTATION_COMPLETE.md`
**Resumen de la implementación completa**

**Cuándo usar:**
- Para overview del sistema
- Para onboarding de nuevos devs
- Para presentaciones al equipo

**Contiene:**
- Qué se implementó
- Archivos creados
- Métricas de éxito
- Links a documentación

---

## Solución de Problemas

### Árbol de Decisión

```
¿Tienes un problema?
│
├─ ¿Es con desarrollo local?
│  └─ Ver: SUPABASE_TROUBLESHOOTING.md
│
├─ ¿Es con el deployment?
│  ├─ ¿Falló el workflow?
│  │  └─ Ver: CICD_TESTING_GUIDE.md
│  │
│  └─ ¿Necesitas hacer rollback?
│     └─ Ver: DEPLOYMENT_ROLLBACK_GUIDE.md
│
├─ ¿Es con configuración?
│  ├─ ¿GitHub Secrets?
│  │  └─ Ver: GITHUB_SECRETS_SETUP.md
│  │
│  └─ ¿Variables de Vercel?
│     └─ Ver: VERCEL_ENV_SETUP.md
│
└─ ¿Necesitas referencia rápida?
   └─ Ver: SUPABASE_QUICK_REFERENCE.md
```

---

## Checklist de Configuración Completa

### Configuración Inicial (Una vez)

- [ ] **Fase 1: Local Setup**
  - [ ] Docker instalado y corriendo
  - [ ] Supabase CLI instalado
  - [ ] `supabase start` funciona
  - [ ] Aplicación corre localmente
  - [ ] Documento: `GETTING_STARTED.md`

- [ ] **Fase 2: GitHub Secrets**
  - [ ] `SUPABASE_ACCESS_TOKEN_STAGING` configurado
  - [ ] `SUPABASE_ACCESS_TOKEN_PROD` configurado
  - [ ] `VERCEL_TOKEN` configurado
  - [ ] `VERCEL_ORG_ID` configurado
  - [ ] `VERCEL_PROJECT_ID` configurado
  - [ ] Documento: `GITHUB_SECRETS_SETUP.md`

- [ ] **Fase 3: Vercel Environment Variables**
  - [ ] `VITE_SUPABASE_URL` para Preview
  - [ ] `VITE_SUPABASE_URL` para Production
  - [ ] `VITE_SUPABASE_ANON_KEY` para Preview
  - [ ] `VITE_SUPABASE_ANON_KEY` para Production
  - [ ] Documento: `VERCEL_ENV_SETUP.md`

- [ ] **Fase 4: Validación**
  - [ ] Test de staging deployment exitoso
  - [ ] Test de production deployment exitoso
  - [ ] Documento: `CICD_TESTING_GUIDE.md`

### Uso Diario

- [ ] Leer `WORKFLOW_GUIDE.md` para flujo de trabajo
- [ ] Usar `LOCAL_DEVELOPMENT.md` como referencia
- [ ] Tener `SUPABASE_QUICK_REFERENCE.md` a mano
- [ ] Conocer `DEPLOYMENT_ROLLBACK_GUIDE.md` para emergencias

---

## Mapa de Documentos

### Por Propósito

**Setup Inicial:**
1. `GETTING_STARTED.md` - Primer paso
2. `GITHUB_SECRETS_SETUP.md` - Segundo paso
3. `VERCEL_ENV_SETUP.md` - Tercer paso
4. `CICD_TESTING_GUIDE.md` - Validación

**Uso Diario:**
1. `WORKFLOW_GUIDE.md` - Flujo principal
2. `LOCAL_DEVELOPMENT.md` - Desarrollo local
3. `SUPABASE_QUICK_REFERENCE.md` - Comandos rápidos

**Troubleshooting:**
1. `SUPABASE_TROUBLESHOOTING.md` - Problemas locales
2. `DEPLOYMENT_ROLLBACK_GUIDE.md` - Problemas de deployment

**Referencia:**
1. `CICD_IMPLEMENTATION_COMPLETE.md` - Overview
2. `CICD_PIPELINE_TEST_REPORT.md` - Estado del sistema

---

## Recursos Adicionales

### Scripts Útiles

```bash
# Validar setup local
./scripts/validate-local-setup.sh

# Probar configuración de CI/CD
./scripts/test-cicd-pipeline.sh
```

### URLs Importantes

**Local:**
- App: http://localhost:5173
- Supabase Studio: http://127.0.0.1:54323
- API: http://127.0.0.1:54321

**Staging:**
- Supabase: https://supabase.com/dashboard/project/wuinfsedukvxlkfvlpna
- Vercel: Ver deployment URL en GitHub Actions

**Production:**
- Supabase: https://supabase.com/dashboard/project/fkjbvwbnbxslornufhlp
- Vercel: Tu dominio de producción

**GitHub:**
- Actions: https://github.com/[tu-org]/[tu-repo]/actions
- Settings: https://github.com/[tu-org]/[tu-repo]/settings

---

## Resumen Visual del Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURACIÓN INICIAL                     │
│                      (Una sola vez)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. GETTING_STARTED.md                                       │
│     └─ Setup local (15-20 min)                               │
│                                                               │
│  2. GITHUB_SECRETS_SETUP.md                                  │
│     └─ Configurar secrets (20-30 min)                        │
│                                                               │
│  3. VERCEL_ENV_SETUP.md                                      │
│     └─ Configurar variables (15-20 min)                      │
│                                                               │
│  4. CICD_TESTING_GUIDE.md                                    │
│     └─ Validar pipeline (30-45 min)                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       USO DIARIO                             │
│                  (Cada día de trabajo)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WORKFLOW_GUIDE.md                                           │
│  └─ Flujo: Local → Stage → Production                        │
│                                                               │
│  LOCAL_DEVELOPMENT.md                                        │
│  └─ Desarrollo con Supabase local                            │
│                                                               │
│  SUPABASE_QUICK_REFERENCE.md                                 │
│  └─ Comandos rápidos                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CUANDO HAY PROBLEMAS                       │
│                    (Según necesidad)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SUPABASE_TROUBLESHOOTING.md                                 │
│  └─ Problemas con Supabase local                             │
│                                                               │
│  DEPLOYMENT_ROLLBACK_GUIDE.md                                │
│  └─ Rollback y recuperación                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Contacto y Soporte

**Para problemas:**
1. Consultar documentación relevante (ver árbol de decisión arriba)
2. Revisar logs (GitHub Actions, Vercel, Supabase)
3. Ejecutar scripts de validación
4. Contactar al equipo de DevOps

**Documentación externa:**
- [Supabase Docs](https://supabase.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Docs](https://vercel.com/docs)

---

**Última actualización:** 23 de Noviembre, 2025  
**Versión:** 1.0  
**Mantenido por:** Equipo DevOps


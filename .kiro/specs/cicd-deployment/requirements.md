# Requirements Document

## Introduction

Este documento define los requisitos para implementar un sistema de CI/CD (Continuous Integration/Continuous Deployment) que automatice el despliegue de la aplicación en dos ambientes: staging y producción. El sistema utilizará GitHub Actions para orquestar las migraciones de base de datos en Supabase y los despliegues en Vercel, asegurando que las migraciones se ejecuten exitosamente antes de proceder con el deployment de la aplicación.

## Glossary

- **GitHub Actions**: Sistema de automatización de workflows integrado en GitHub
- **Supabase**: Plataforma de backend-as-a-service que proporciona base de datos PostgreSQL y servicios de autenticación
- **Vercel**: Plataforma de hosting para aplicaciones frontend
- **Migration**: Script SQL que modifica el esquema de la base de datos
- **Edge Function**: Función serverless ejecutada en el edge de Supabase
- **Environment**: Ambiente de ejecución (local, staging o production)
- **Workflow**: Proceso automatizado definido en GitHub Actions
- **Secret**: Variable de entorno sensible almacenada de forma segura
- **Branch**: Rama de código en Git (main para producción, stage para staging, feature branches para desarrollo)
- **Deployment**: Proceso de publicar código en un ambiente específico
- **Rollback**: Proceso de revertir un deployment a una versión anterior
- **Docker**: Plataforma de contenedores para ejecutar servicios de forma aislada
- **Supabase CLI**: Herramienta de línea de comandos para gestionar proyectos Supabase localmente
- **Local Development**: Ambiente de desarrollo en la máquina del desarrollador usando Docker

## Requirements

### Requirement 1: Local Development Environment with Docker

**User Story:** Como desarrollador, quiero ejecutar Supabase localmente usando Docker, para que pueda desarrollar y probar migraciones sin afectar los ambientes remotos.

#### Acceptance Criteria

1. WHEN un desarrollador ejecuta `supabase start` THEN el sistema SHALL iniciar todos los servicios de Supabase en contenedores Docker locales
2. WHEN los servicios locales están corriendo THEN el sistema SHALL exponer la base de datos PostgreSQL en el puerto 54322
3. WHEN los servicios locales están corriendo THEN el sistema SHALL exponer Supabase Studio en el puerto 54323
4. WHEN un desarrollador crea una nueva migración THEN el sistema SHALL aplicarla automáticamente a la base de datos local
5. WHEN un desarrollador ejecuta `supabase db reset` THEN el sistema SHALL recrear la base de datos local con todas las migraciones aplicadas
6. WHEN un desarrollador ejecuta `supabase stop` THEN el sistema SHALL detener todos los contenedores Docker y preservar los datos

### Requirement 2: Migration Development Workflow

**User Story:** Como desarrollador, quiero crear y probar migraciones localmente, para que pueda validar los cambios antes de subirlos a staging.

#### Acceptance Criteria

1. WHEN un desarrollador ejecuta `supabase migration new <nombre>` THEN el sistema SHALL crear un nuevo archivo de migración en `supabase/migrations/` con timestamp
2. WHEN un desarrollador escribe SQL en una migración THEN el sistema SHALL aplicarla a la base de datos local al guardar
3. WHEN una migración local es exitosa THEN el desarrollador SHALL poder probar la aplicación contra la base de datos local
4. WHEN una migración local falla THEN el sistema SHALL mostrar el error sin afectar ambientes remotos
5. WHEN el desarrollador está satisfecho con los cambios THEN el desarrollador SHALL poder hacer commit de las migraciones para deployment

### Requirement 3: Branch Strategy Configuration

**User Story:** Como desarrollador, quiero tener una estrategia de branching clara, para que los deployments se ejecuten automáticamente en el ambiente correcto según la rama.

#### Acceptance Criteria

1. WHEN un desarrollador trabaja en una feature THEN el desarrollador SHALL crear una rama desde `stage` y desarrollar localmente con Docker
2. WHEN el desarrollador termina la feature THEN el desarrollador SHALL hacer merge a `stage` para deployment automático a staging
3. WHEN código es pusheado a la rama `stage` THEN el sistema SHALL ejecutar el workflow de deployment a staging
4. WHEN el deployment a staging es exitoso y validado THEN el desarrollador SHALL hacer merge de `stage` a `main`
5. WHEN código es pusheado a la rama `main` THEN el sistema SHALL ejecutar el workflow de deployment a producción
6. WHEN código es pusheado a feature branches THEN el sistema SHALL NOT ejecutar workflows de deployment
7. WHEN un pull request es creado hacia `main` o `stage` THEN el sistema SHALL ejecutar validaciones sin hacer deployment

### Requirement 4: Supabase Project Configuration

**User Story:** Como DevOps engineer, quiero configurar dos proyectos separados de Supabase, para que staging y producción tengan bases de datos independientes.

#### Acceptance Criteria

1. WHEN el workflow de staging se ejecuta THEN el sistema SHALL conectarse al proyecto de Supabase con ID `wuinfsedukvxlkfvlpna`
2. WHEN el workflow de producción se ejecuta THEN el sistema SHALL conectarse al proyecto de Supabase con ID `fkjbvwbnbxslornufhlp`
3. WHEN se requiere autenticación con Supabase CLI THEN el sistema SHALL utilizar access tokens almacenados en GitHub Secrets
4. WHEN se configura un nuevo ambiente THEN el sistema SHALL validar que el Project ID y Access Token sean correctos antes de proceder

### Requirement 5: Supabase Migration Execution

**User Story:** Como desarrollador, quiero que las migraciones de base de datos se ejecuten automáticamente, para que el esquema de la base de datos esté sincronizado con el código.

#### Acceptance Criteria

1. WHEN el workflow se ejecuta THEN el sistema SHALL aplicar todas las migraciones pendientes en el directorio `supabase/migrations/` en orden cronológico
2. WHEN una migración falla THEN el sistema SHALL detener el workflow y NOT proceder con el deployment de Vercel
3. WHEN todas las migraciones se aplican exitosamente THEN el sistema SHALL registrar el éxito en los logs del workflow
4. WHEN no hay migraciones pendientes THEN el sistema SHALL continuar con el deployment sin errores
5. WHEN se ejecutan migraciones THEN el sistema SHALL utilizar el proyecto de Supabase correspondiente al ambiente

### Requirement 6: Supabase Edge Functions Deployment

**User Story:** Como desarrollador, quiero que las Edge Functions se desplieguen automáticamente, para que la lógica serverless esté disponible en ambos ambientes.

#### Acceptance Criteria

1. WHEN el workflow se ejecuta THEN el sistema SHALL desplegar todas las funciones en el directorio `supabase/functions/` al proyecto correspondiente
2. WHEN el deployment de funciones falla THEN el sistema SHALL detener el workflow y NOT proceder con el deployment de Vercel
3. WHEN las funciones se despliegan exitosamente THEN el sistema SHALL registrar el éxito en los logs del workflow
4. WHEN una función tiene secretos configurados THEN el sistema SHALL desplegar los secretos junto con la función

### Requirement 7: Vercel Deployment Configuration

**User Story:** Como DevOps engineer, quiero configurar un proyecto de Vercel con dos ambientes, para que staging y producción estén separados pero gestionados centralmente.

#### Acceptance Criteria

1. WHEN el workflow de staging se ejecuta THEN el sistema SHALL desplegar a Vercel con el ambiente `preview`
2. WHEN el workflow de producción se ejecuta THEN el sistema SHALL desplegar a Vercel con el ambiente `production`
3. WHEN se despliega a Vercel THEN el sistema SHALL utilizar las variables de entorno configuradas para el ambiente específico
4. WHEN el deployment de Vercel falla THEN el sistema SHALL registrar el error en los logs del workflow
5. WHEN el deployment de Vercel es exitoso THEN el sistema SHALL proporcionar la URL del deployment en los logs

### Requirement 8: Environment Variables Management

**User Story:** Como desarrollador, quiero que todas las variables de entorno se gestionen en Vercel, para que las credenciales estén centralizadas y seguras.

#### Acceptance Criteria

1. WHEN se configura el ambiente de staging THEN el sistema SHALL tener las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` apuntando al proyecto de staging
2. WHEN se configura el ambiente de producción THEN el sistema SHALL tener las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` apuntando al proyecto de producción
3. WHEN la aplicación se construye en Vercel THEN el sistema SHALL inyectar las variables de entorno correspondientes al ambiente
4. WHEN se agregan nuevas variables de entorno THEN el sistema SHALL permitir configurarlas por ambiente en Vercel

### Requirement 9: GitHub Secrets Configuration

**User Story:** Como DevOps engineer, quiero almacenar credenciales sensibles en GitHub Secrets, para que los workflows puedan autenticarse sin exponer las credenciales en el código.

#### Acceptance Criteria

1. WHEN el workflow necesita autenticarse con Supabase THEN el sistema SHALL utilizar secrets `SUPABASE_ACCESS_TOKEN_STAGING` y `SUPABASE_ACCESS_TOKEN_PROD`
2. WHEN el workflow necesita desplegar a Vercel THEN el sistema SHALL utilizar el secret `VERCEL_TOKEN`
3. WHEN se configuran los secrets THEN el sistema SHALL validar que todos los secrets requeridos estén presentes antes de ejecutar el workflow
4. WHEN un secret es inválido THEN el sistema SHALL fallar el workflow con un mensaje de error claro

### Requirement 10: Workflow Execution Order

**User Story:** Como desarrollador, quiero que el workflow ejecute las tareas en el orden correcto, para que las migraciones se apliquen antes del deployment de la aplicación.

#### Acceptance Criteria

1. WHEN el workflow se inicia THEN el sistema SHALL ejecutar primero las migraciones de Supabase
2. WHEN las migraciones son exitosas THEN el sistema SHALL ejecutar el deployment de Edge Functions
3. WHEN las Edge Functions se despliegan exitosamente THEN el sistema SHALL ejecutar el deployment de Vercel
4. WHEN cualquier paso falla THEN el sistema SHALL detener el workflow y NOT ejecutar los pasos siguientes
5. WHEN todos los pasos son exitosos THEN el sistema SHALL marcar el workflow como exitoso

### Requirement 11: Workflow Notifications and Logging

**User Story:** Como desarrollador, quiero recibir notificaciones claras sobre el estado del deployment, para que pueda identificar y resolver problemas rápidamente.

#### Acceptance Criteria

1. WHEN el workflow se ejecuta THEN el sistema SHALL registrar cada paso en los logs de GitHub Actions
2. WHEN un paso falla THEN el sistema SHALL incluir el mensaje de error completo en los logs
3. WHEN el workflow completa exitosamente THEN el sistema SHALL mostrar un resumen con las URLs de los deployments
4. WHEN el workflow falla THEN el sistema SHALL marcar el commit con un estado de fallo visible en GitHub

### Requirement 12: Rollback Capability

**User Story:** Como desarrollador, quiero poder revertir un deployment fallido, para que pueda restaurar rápidamente el servicio en caso de problemas.

#### Acceptance Criteria

1. WHEN un deployment falla THEN el sistema SHALL mantener el deployment anterior activo en Vercel
2. WHEN se necesita hacer rollback THEN el desarrollador SHALL poder revertir el commit y re-ejecutar el workflow
3. WHEN se hace rollback de código THEN el sistema SHALL NOT revertir automáticamente las migraciones de base de datos
4. WHEN se requiere rollback de migraciones THEN el sistema SHALL proporcionar documentación clara sobre el proceso manual

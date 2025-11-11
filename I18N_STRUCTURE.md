# 🏗️ Estructura del Sistema de Internacionalización

## 📁 Archivos Creados

```
src/
├── i18n/
│   ├── config.ts                    # ⚙️ Configuración principal de i18next
│   └── locales/
│       ├── es.json                  # 🇪🇸 Traducciones en español
│       └── en.json                  # 🇬🇧 Traducciones en inglés
│
├── hooks/
│   └── useTranslation.ts            # 🪝 Hook personalizado para usar en componentes
│
└── components/
    └── LanguageSwitcher.tsx         # 🌍 Botón para cambiar idioma (ES/EN)
```

## 📄 Archivos Modificados

```
src/
├── main.tsx                         # ✅ Agregado import de i18n/config
├── layouts/
│   ├── CoachLayout.tsx              # ✅ Traducido + LanguageSwitcher
│   └── AdminLayout.tsx              # ✅ Traducido + LanguageSwitcher
└── pages/
    └── coach/
        └── CoachDashboard.tsx       # ✅ Parcialmente traducido (ejemplo)
```

## 📚 Documentación Creada

```
docs/
├── I18N_QUICK_START.md              # 🚀 Inicio rápido (3 pasos)
├── INTERNATIONALIZATION_SETUP.md    # 📖 Guía completa con ejemplos
├── MULTI_LANGUAGE_GUIDE.md          # 📘 Guía detallada de uso
├── I18N_CHECKLIST.md                # ✅ Checklist de progreso
└── I18N_STRUCTURE.md                # 🏗️ Este archivo

scripts/
└── find-hardcoded-text.sh           # 🔍 Script para encontrar textos hardcodeados
```

## 🔄 Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuario Abre App                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              main.tsx carga i18n/config.ts                   │
│  • Detecta idioma del navegador o localStorage               │
│  • Carga traducciones (es.json, en.json)                     │
│  • Establece idioma por defecto: español                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Componente usa useTranslation()                 │
│  const { t } = useTranslation();                             │
│  <h1>{t('players.title')}</h1>                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           i18next busca la traducción en JSON                │
│  • Si idioma = 'es' → busca en es.json                       │
│  • Si idioma = 'en' → busca en en.json                       │
│  • Si no encuentra → usa fallback (español)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Texto se muestra en pantalla                    │
│  • Español: "Jugadores"                                      │
│  • Inglés: "Players"                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔀 Cambio de Idioma

```
┌─────────────────────────────────────────────────────────────┐
│         Usuario hace clic en LanguageSwitcher                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           i18n.changeLanguage('en' o 'es')                   │
│  • Cambia el idioma activo                                   │
│  • Guarda preferencia en localStorage                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         React re-renderiza todos los componentes             │
│  • Todos los t() se actualizan automáticamente               │
│  • No se recarga la página                                   │
│  • Cambio instantáneo                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Organización de Traducciones

```json
{
  "common": {           // 🔧 Textos comunes (botones, acciones)
    "save": "...",
    "cancel": "...",
    "delete": "..."
  },
  "nav": {              // 🧭 Navegación y menús
    "dashboard": "...",
    "players": "...",
    "matches": "..."
  },
  "players": {          // 👥 Módulo de jugadores
    "title": "...",
    "addPlayer": "...",
    "firstName": "..."
  },
  "matches": {          // 🏀 Módulo de partidos
    "title": "...",
    "opponent": "...",
    "lineup": "..."
  },
  "statistics": {       // 📊 Módulo de estadísticas
    "points": "...",
    "rebounds": "...",
    "assists": "..."
  },
  "training": {         // 🏃 Módulo de entrenamientos
    "title": "...",
    "attendance": "...",
    "present": "..."
  },
  "users": {            // 👤 Módulo de usuarios
    "title": "...",
    "role": "...",
    "admin": "..."
  },
  "admin": {            // 🔐 Panel de administración
    "title": "...",
    "sports": "...",
    "clubs": "..."
  },
  "dashboard": {        // 📈 Dashboard
    "welcome": "...",
    "upcomingMatches": "..."
  }
}
```

## 🎯 Patrón de Uso en Componentes

### Antes (sin i18n)
```tsx
export function PlayersList() {
  return (
    <div>
      <h1>Jugadores</h1>
      <button>Agregar Jugador</button>
      <button>Cancelar</button>
    </div>
  );
}
```

### Después (con i18n)
```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function PlayersList() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('players.title')}</h1>
      <button>{t('players.addPlayer')}</button>
      <button>{t('common.cancel')}</button>
    </div>
  );
}
```

## 🌐 Idiomas Soportados

| Código | Idioma   | Estado | Archivo       |
|--------|----------|--------|---------------|
| `es`   | Español  | ✅ Activo | es.json    |
| `en`   | Inglés   | ✅ Activo | en.json    |
| `fr`   | Francés  | ⚪ Futuro | fr.json    |
| `pt`   | Portugués| ⚪ Futuro | pt.json    |

## 🔧 Configuración Actual

```typescript
// src/i18n/config.ts
{
  fallbackLng: 'es',              // Idioma por defecto
  debug: false,                   // Modo debug desactivado
  detection: {
    order: ['localStorage', 'navigator'],  // Prioridad de detección
    caches: ['localStorage']               // Guardar en localStorage
  }
}
```

## 📊 Estado Actual

| Categoría | Traducciones | Estado |
|-----------|--------------|--------|
| common    | 20+ claves   | ✅ Completo |
| nav       | 8 claves     | ✅ Completo |
| auth      | 7 claves     | ✅ Completo |
| players   | 12 claves    | ✅ Completo |
| matches   | 16 claves    | ✅ Completo |
| statistics| 13 claves    | ✅ Completo |
| training  | 9 claves     | ✅ Completo |
| users     | 10 claves    | ✅ Completo |
| dashboard | 5 claves     | ✅ Completo |
| admin     | 7 claves     | ✅ Completo |

**Total:** ~120 traducciones base disponibles

## 🚀 Próximos Pasos

1. Traducir componentes restantes
2. Agregar traducciones específicas del dominio
3. Traducir mensajes de error y validación
4. Considerar agregar más idiomas
5. Optimizar carga de traducciones (lazy loading)

---

**Sistema listo para usar** ✅  
**Documentación completa** ✅  
**Ejemplos funcionando** ✅

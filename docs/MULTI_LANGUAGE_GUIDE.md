# Guía de Multi-Idioma (i18next)

## Configuración Completada

Se ha implementado **react-i18next** para gestionar traducciones en inglés y español.

### Archivos Creados

1. **`src/i18n/config.ts`** - Configuración principal de i18next
2. **`src/i18n/locales/es.json`** - Traducciones en español
3. **`src/i18n/locales/en.json`** - Traducciones en inglés
4. **`src/components/LanguageSwitcher.tsx`** - Componente para cambiar idioma
5. **`src/hooks/useTranslation.ts`** - Hook personalizado

### Características

- ✅ Detección automática del idioma del navegador
- ✅ Persistencia de preferencia en localStorage
- ✅ Cambio de idioma en tiempo real sin recargar
- ✅ Idioma por defecto: Español
- ✅ Idiomas disponibles: Español (es) e Inglés (en)

## Cómo Usar en Componentes

### 1. Importar el hook

```tsx
import { useTranslation } from '@/hooks/useTranslation';
```

### 2. Usar en el componente

```tsx
export function MiComponente() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <button>{t('common.cancel')}</button>
      <p>{t('players.title')}</p>
    </div>
  );
}
```

### 3. Acceder a traducciones anidadas

Las traducciones están organizadas por categorías:

```tsx
t('common.save')           // "Guardar" / "Save"
t('nav.players')           // "Jugadores" / "Players"
t('players.addPlayer')     // "Agregar Jugador" / "Add Player"
t('matches.opponent')      // "Rival" / "Opponent"
t('statistics.points')     // "Puntos" / "Points"
```

## Estructura de Traducciones

Los archivos JSON están organizados en categorías:

- **common** - Textos comunes (guardar, cancelar, editar, etc.)
- **nav** - Navegación y menús
- **auth** - Autenticación
- **players** - Jugadores
- **matches** - Partidos
- **statistics** - Estadísticas
- **training** - Entrenamientos
- **users** - Usuarios
- **dashboard** - Panel principal

## Agregar Nuevas Traducciones

1. Abre `src/i18n/locales/es.json`
2. Agrega tu nueva clave:

```json
{
  "mySection": {
    "myKey": "Mi texto en español"
  }
}
```

3. Abre `src/i18n/locales/en.json`
4. Agrega la misma clave en inglés:

```json
{
  "mySection": {
    "myKey": "My text in English"
  }
}
```

5. Usa en tu componente:

```tsx
t('mySection.myKey')
```

## Componente LanguageSwitcher

Ya está integrado en el `CoachLayout`. Muestra el idioma actual y permite cambiar entre ES/EN con un clic.

Para agregarlo en otros layouts:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// En tu header o navbar:
<LanguageSwitcher />
```

## Cambiar Idioma Programáticamente

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MiComponente() {
  const { i18n } = useTranslation();

  const cambiarAIngles = () => {
    i18n.changeLanguage('en');
  };

  const cambiarAEspanol = () => {
    i18n.changeLanguage('es');
  };

  return (
    <div>
      <button onClick={cambiarAIngles}>English</button>
      <button onClick={cambiarAEspanol}>Español</button>
    </div>
  );
}
```

## Ejemplos Actualizados

Se han actualizado como ejemplo:
- ✅ `CoachLayout.tsx` - Navegación y header traducidos
- ✅ `CoachDashboard.tsx` - Títulos traducidos

## Próximos Pasos

Para completar la internacionalización:

1. Actualizar todos los componentes para usar `t()` en lugar de texto hardcodeado
2. Agregar más traducciones según sea necesario en los archivos JSON
3. Considerar agregar más idiomas (crear `fr.json`, `pt.json`, etc.)

## Notas Importantes

- Las traducciones se cargan automáticamente al iniciar la app
- El idioma se guarda en `localStorage` como `i18nextLng`
- No necesitas recargar la página al cambiar de idioma
- i18next maneja automáticamente el fallback al idioma por defecto si falta una traducción

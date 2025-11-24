# 🌍 Multi-Idioma - Inicio Rápido

## ✅ Sistema Instalado y Configurado

Tu aplicación ahora tiene soporte completo para **Español** e **Inglés** usando **react-i18next**.

## 🎯 Cómo Usar (3 pasos)

### 1. Importa el hook en tu componente

```tsx
import { useTranslation } from '@/hooks/useTranslation';
```

### 2. Usa el hook

```tsx
export function MiComponente() {
  const { t } = useTranslation();
  
  return <h1>{t('players.title')}</h1>;
}
```

### 3. Listo! 🎉

El texto cambiará automáticamente según el idioma seleccionado.

## 🔄 Cambiar Idioma

El usuario puede cambiar el idioma usando el botón **LanguageSwitcher** que ya está en:
- ✅ CoachLayout (header derecho)
- ✅ AdminLayout (header derecho)

El idioma se guarda automáticamente y persiste entre sesiones.

## 📝 Traducciones Disponibles

Todas las traducciones están en:
- `src/i18n/locales/es.json` (Español)
- `src/i18n/locales/en.json` (Inglés)

### Ejemplos de uso:

```tsx
// Botones comunes
{t('common.save')}      // "Guardar" / "Save"
{t('common.cancel')}    // "Cancelar" / "Cancel"
{t('common.delete')}    // "Eliminar" / "Delete"

// Navegación
{t('nav.players')}      // "Jugadores" / "Players"
{t('nav.matches')}      // "Partidos" / "Matches"
{t('nav.statistics')}   // "Estadísticas" / "Statistics"

// Jugadores
{t('players.addPlayer')}     // "Agregar Jugador" / "Add Player"
{t('players.firstName')}     // "Nombre" / "First Name"
{t('players.jerseyNumber')}  // "Número de Camiseta" / "Jersey Number"

// Partidos
{t('matches.opponent')}      // "Rival" / "Opponent"
{t('matches.lineup')}        // "Alineación" / "Lineup"
{t('matches.finalScore')}    // "Resultado Final" / "Final Score"
```

## ➕ Agregar Nueva Traducción

1. Abre `src/i18n/locales/es.json` y agrega:
```json
{
  "mySection": {
    "myText": "Mi texto en español"
  }
}
```

2. Abre `src/i18n/locales/en.json` y agrega:
```json
{
  "mySection": {
    "myText": "My text in English"
  }
}
```

3. Usa en tu componente:
```tsx
{t('mySection.myText')}
```

## 📚 Documentación Completa

Para más detalles, ejemplos y mejores prácticas, consulta:
- **INTERNATIONALIZATION_SETUP.md** - Guía completa con ejemplos
- **MULTI_LANGUAGE_GUIDE.md** - Guía de uso detallada

## 🎨 Componentes Ya Traducidos

- ✅ CoachLayout
- ✅ AdminLayout  
- ✅ CoachDashboard
- ✅ LanguageSwitcher

## 🚀 Próximos Pasos

Para traducir el resto de la aplicación:

1. Identifica textos hardcodeados en tus componentes
2. Agrégalos a los archivos JSON (es.json y en.json)
3. Reemplaza el texto por `{t('categoria.clave')}`
4. Prueba cambiando el idioma

## 💡 Tip Rápido

Busca en tu código textos como:
```tsx
<button>Guardar</button>           // ❌ Hardcodeado
<button>{t('common.save')}</button> // ✅ Traducible
```

Y reemplázalos por la versión traducible.

---

**¿Necesitas ayuda?** Revisa los archivos de documentación o los componentes ya actualizados como ejemplo.

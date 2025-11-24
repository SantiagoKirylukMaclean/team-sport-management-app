# Sistema de Internacionalización (i18n)

## ✅ Configuración Completada

Se ha implementado **react-i18next** para gestionar traducciones en toda la aplicación.

### 📦 Paquetes Instalados

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 📁 Estructura de Archivos

```
src/
├── i18n/
│   ├── config.ts              # Configuración de i18next
│   └── locales/
│       ├── es.json            # Traducciones en español
│       └── en.json            # Traducciones en inglés
├── hooks/
│   └── useTranslation.ts      # Hook personalizado
└── components/
    └── LanguageSwitcher.tsx   # Componente para cambiar idioma
```

## 🚀 Características

- ✅ **Detección automática** del idioma del navegador
- ✅ **Persistencia** de preferencia en localStorage
- ✅ **Cambio en tiempo real** sin recargar la página
- ✅ **Idioma por defecto**: Español (es)
- ✅ **Idiomas disponibles**: Español e Inglés
- ✅ **Fallback automático** si falta una traducción

## 📖 Uso Básico

### 1. En cualquier componente funcional

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function MiComponente() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('players.title')}</h1>
      <button>{t('common.save')}</button>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### 2. Cambiar idioma programáticamente

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function MiComponente() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <button onClick={() => i18n.changeLanguage('es')}>
        Español
      </button>
      
      {/* Idioma actual */}
      <p>Idioma: {i18n.language}</p>
    </div>
  );
}
```

### 3. Usar el componente LanguageSwitcher

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function MiLayout() {
  return (
    <header>
      <h1>Mi App</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

## 📚 Categorías de Traducciones

Las traducciones están organizadas en categorías lógicas:

| Categoría | Descripción | Ejemplo |
|-----------|-------------|---------|
| `common` | Textos comunes | `t('common.save')` |
| `nav` | Navegación | `t('nav.players')` |
| `auth` | Autenticación | `t('auth.login')` |
| `players` | Jugadores | `t('players.addPlayer')` |
| `matches` | Partidos | `t('matches.opponent')` |
| `statistics` | Estadísticas | `t('statistics.points')` |
| `training` | Entrenamientos | `t('training.attendance')` |
| `users` | Usuarios | `t('users.role')` |
| `dashboard` | Panel | `t('dashboard.welcome')` |
| `admin` | Administración | `t('admin.sports')` |

## ➕ Agregar Nuevas Traducciones

### Paso 1: Editar `src/i18n/locales/es.json`

```json
{
  "myFeature": {
    "title": "Mi Nueva Funcionalidad",
    "description": "Descripción en español",
    "button": "Hacer algo"
  }
}
```

### Paso 2: Editar `src/i18n/locales/en.json`

```json
{
  "myFeature": {
    "title": "My New Feature",
    "description": "Description in English",
    "button": "Do something"
  }
}
```

### Paso 3: Usar en tu componente

```tsx
const { t } = useTranslation();

<h1>{t('myFeature.title')}</h1>
<p>{t('myFeature.description')}</p>
<button>{t('myFeature.button')}</button>
```

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Formulario

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function PlayerForm() {
  const { t } = useTranslation();

  return (
    <form>
      <label>{t('players.firstName')}</label>
      <input type="text" />
      
      <label>{t('players.lastName')}</label>
      <input type="text" />
      
      <button type="submit">{t('common.save')}</button>
      <button type="button">{t('common.cancel')}</button>
    </form>
  );
}
```

### Ejemplo 2: Tabla

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function PlayersTable() {
  const { t } = useTranslation();

  return (
    <table>
      <thead>
        <tr>
          <th>{t('common.name')}</th>
          <th>{t('players.position')}</th>
          <th>{t('players.jerseyNumber')}</th>
          <th>{t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {/* ... */}
      </tbody>
    </table>
  );
}
```

### Ejemplo 3: Diálogo de Confirmación

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function DeleteDialog({ playerName }) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      title={t('players.deletePlayer')}
      description={`¿Estás seguro que querés eliminar a ${playerName}?`}
      confirmText={t('common.delete')}
      cancelText={t('common.cancel')}
    />
  );
}
```

### Ejemplo 4: Navegación Dinámica

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export function Navigation() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/players', label: t('nav.players') },
    { to: '/matches', label: t('nav.matches') },
    { to: '/statistics', label: t('nav.statistics') },
  ];

  return (
    <nav>
      {navItems.map(item => (
        <Link key={item.to} to={item.to}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

## 🔧 Componentes Ya Actualizados

Los siguientes componentes ya están usando i18n:

- ✅ `CoachLayout.tsx` - Navegación y menús
- ✅ `AdminLayout.tsx` - Panel de administración
- ✅ `CoachDashboard.tsx` - Dashboard principal
- ✅ `LanguageSwitcher.tsx` - Selector de idioma

## 📝 Traducciones Disponibles

### Common (Comunes)
- save, cancel, delete, edit, add, search, filter
- loading, error, success, confirm
- back, next, previous, close
- yes, no, actions
- date, time, name, email, phone, address
- status, active, inactive

### Navigation
- dashboard, players, matches, statistics
- training, users, settings, logout

### Players
- title, addPlayer, editPlayer, deletePlayer
- firstName, lastName, birthDate, position
- jerseyNumber, height, weight
- active, inactive, noPlayers

### Matches
- title, addMatch, editMatch, deleteMatch
- opponent, date, time, location
- home, away, result, lineup
- substitutions, callUp, callUps
- startingLineup, bench, quarter, quarters
- finalScore, noMatches

### Statistics
- title, playerStats, teamStats
- points, rebounds, assists, steals, blocks
- turnovers, fouls, minutesPlayed, gamesPlayed
- average, total, noStats

### Training
- title, addTraining, editTraining, deleteTraining
- attendance, present, absent, excused, late
- noTrainings

### Users
- title, addUser, editUser, deleteUser
- role, admin, coach, player, parent
- noUsers

### Admin
- title, panel, sports, clubs, teams
- inviteCoachAdmin, invitePlayer, invitations

## 🌍 Agregar Más Idiomas

Para agregar un nuevo idioma (ej: Francés):

1. Crear `src/i18n/locales/fr.json` con todas las traducciones
2. Importar en `src/i18n/config.ts`:

```typescript
import fr from './locales/fr.json';

i18n.init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr }  // Nuevo idioma
  },
  // ...
});
```

3. Actualizar el `LanguageSwitcher` para incluir el nuevo idioma

## 🐛 Debugging

### Ver el idioma actual
```tsx
const { i18n } = useTranslation();
console.log('Idioma actual:', i18n.language);
```

### Ver todas las traducciones cargadas
```tsx
const { i18n } = useTranslation();
console.log('Traducciones:', i18n.store.data);
```

### Verificar si una clave existe
```tsx
const { t, i18n } = useTranslation();
console.log('Existe?', i18n.exists('players.title'));
```

## 💡 Tips y Mejores Prácticas

1. **Usa claves descriptivas**: `players.addPlayer` es mejor que `btn1`
2. **Organiza por contexto**: Agrupa traducciones relacionadas
3. **Mantén consistencia**: Usa las mismas claves en ambos idiomas
4. **Evita texto hardcodeado**: Siempre usa `t()` para texto visible
5. **Prueba ambos idiomas**: Verifica que todo se vea bien en ES e EN

## 🔍 Próximos Pasos

Para completar la internacionalización de toda la app:

1. Identificar todos los textos hardcodeados en componentes
2. Agregar las traducciones faltantes a los archivos JSON
3. Reemplazar textos por llamadas a `t()`
4. Probar el cambio de idioma en todas las páginas
5. Considerar agregar más idiomas según necesidad

## 📞 Soporte

Si necesitas ayuda:
- Revisa la [documentación oficial de react-i18next](https://react.i18next.com/)
- Consulta los ejemplos en este documento
- Revisa los componentes ya actualizados como referencia

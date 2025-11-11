# ✅ Checklist de Internacionalización

## 🎯 Configuración Inicial (Completado)

- [x] Instalar react-i18next y dependencias
- [x] Crear estructura de carpetas i18n
- [x] Configurar i18next (config.ts)
- [x] Crear archivos de traducción (es.json, en.json)
- [x] Crear hook personalizado (useTranslation)
- [x] Crear componente LanguageSwitcher
- [x] Integrar i18n en main.tsx
- [x] Agregar traducciones base (common, nav, players, matches, etc.)

## 🎨 Layouts (Completado)

- [x] CoachLayout - Navegación y menús
- [x] AdminLayout - Panel de administración
- [x] Agregar LanguageSwitcher a headers

## 📄 Páginas por Traducir

### Admin Pages
- [ ] AdminDashboard.tsx
- [ ] SportsPage.tsx
- [ ] ClubsPage.tsx
- [ ] TeamsPage.tsx
- [ ] UsersPage.tsx
- [ ] InviteUserPage.tsx
- [ ] InvitePlayerPage.tsx
- [ ] InvitationManagementPage.tsx

### Coach Pages
- [x] CoachDashboard.tsx (parcialmente)
- [ ] PlayersPage.tsx
- [ ] TrainingsPage.tsx
- [ ] MatchesPage.tsx
- [ ] StatisticsPage.tsx

### Main Pages
- [ ] Dashboard.tsx
- [ ] Login.tsx
- [ ] Signup.tsx
- [ ] SetPassword.tsx
- [ ] Profile.tsx
- [ ] Jugadores.tsx
- [ ] Equipos.tsx
- [ ] Entrenamiento.tsx
- [ ] Asistencia.tsx
- [ ] Campeonato.tsx
- [ ] Partidos.tsx
- [ ] Notes.tsx

## 🧩 Componentes por Traducir

### UI Components
- [ ] Button (si tiene texto hardcodeado)
- [ ] Card (títulos y descripciones)
- [ ] Dialog (títulos y botones)
- [ ] Table (headers)
- [ ] Form (labels y placeholders)
- [ ] Toast (mensajes)
- [ ] ConfirmDialog

### Feature Components
- [ ] PlayerFormDialog
- [ ] MatchLineupAndResults
- [ ] TrainingAttendancePanel
- [ ] Todos los componentes en src/pages/*/components/

### Layout Components
- [ ] AppShell
- [ ] Header
- [ ] SideBar
- [ ] Footer (si existe)

## 📝 Traducciones por Agregar

### Categorías Faltantes
- [ ] Formularios (form labels, placeholders, validations)
- [ ] Mensajes de error
- [ ] Mensajes de éxito
- [ ] Confirmaciones
- [ ] Tooltips
- [ ] Breadcrumbs
- [ ] Paginación
- [ ] Filtros y búsquedas
- [ ] Notificaciones

### Textos Específicos del Dominio
- [ ] Posiciones de jugadores (Base, Escolta, Alero, etc.)
- [ ] Estados de partidos (Programado, En curso, Finalizado)
- [ ] Estados de asistencia (Presente, Ausente, Justificado)
- [ ] Roles de usuario (Admin, Coach, Player, Parent)
- [ ] Tipos de estadísticas

## 🔍 Proceso de Traducción

Para cada componente:

1. [ ] Abrir el archivo del componente
2. [ ] Identificar todos los textos hardcodeados
3. [ ] Agregar traducciones a es.json y en.json
4. [ ] Importar useTranslation
5. [ ] Reemplazar textos por t('categoria.clave')
6. [ ] Probar en ambos idiomas
7. [ ] Marcar como completado en este checklist

## 🧪 Testing

- [ ] Probar cambio de idioma en todas las páginas
- [ ] Verificar que no hay textos sin traducir
- [ ] Verificar que los layouts se ven bien en ambos idiomas
- [ ] Probar formularios en ambos idiomas
- [ ] Probar mensajes de error en ambos idiomas
- [ ] Verificar que las traducciones tienen sentido en contexto

## 📱 Responsive

- [ ] Verificar que textos largos en inglés no rompen el layout
- [ ] Verificar que textos en español se ven bien en móvil
- [ ] Ajustar estilos si es necesario

## 🚀 Optimizaciones Futuras

- [ ] Lazy loading de traducciones (si la app crece mucho)
- [ ] Agregar más idiomas (francés, portugués, etc.)
- [ ] Traducción de contenido dinámico (si aplica)
- [ ] Formateo de fechas según idioma
- [ ] Formateo de números según idioma
- [ ] Pluralización automática

## 📊 Progreso

**Configuración:** 100% ✅  
**Layouts:** 100% ✅  
**Páginas:** ~5% 🟡  
**Componentes:** ~5% 🟡  
**Traducciones:** ~30% 🟡  

**Total Estimado:** ~15% completado

## 💡 Tips

- Usa el script `scripts/find-hardcoded-text.sh` para encontrar textos
- Revisa los componentes ya traducidos como ejemplo
- Mantén las claves organizadas por contexto
- Prueba frecuentemente cambiando el idioma
- Pide ayuda si necesitas traducciones específicas

## 🎯 Prioridades Sugeridas

1. **Alta:** Páginas principales (Dashboard, Players, Matches)
2. **Alta:** Formularios y diálogos comunes
3. **Media:** Páginas de administración
4. **Media:** Componentes de estadísticas
5. **Baja:** Páginas legacy o poco usadas

---

**Última actualización:** Configuración inicial completada
**Próximo paso:** Traducir PlayersPage.tsx y sus componentes

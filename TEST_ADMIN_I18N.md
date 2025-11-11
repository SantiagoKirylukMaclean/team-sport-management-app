# 🧪 Cómo Probar las Traducciones del Admin

## 🚀 Inicio Rápido

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre el navegador en:**
   ```
   http://localhost:5173/admin
   ```

3. **Busca el selector de idioma** en la esquina superior derecha del header

4. **Haz clic para cambiar entre ES ↔ EN**

## 📋 Checklist de Pruebas

### ✅ AdminLayout (Header y Navegación)

**Ubicación:** Cualquier página `/admin/*`

**Qué probar:**
- [ ] El título del header cambia: "Administración" ↔ "Administration"
- [ ] El selector de idioma muestra: "ES" o "EN"
- [ ] Los items del menú lateral cambian:
  - "Deportes" ↔ "Sports"
  - "Clubes" ↔ "Clubs"
  - "Equipos" ↔ "Teams"
  - "Invitar Entrenador/Admin" ↔ "Invite Coach/Admin"
  - "Invitar Jugador" ↔ "Invite Player"
  - "Invitaciones" ↔ "Invitations"
- [ ] El botón "Volver" cambia a "Back"

### ✅ AdminDashboard

**Ubicación:** `http://localhost:5173/admin`

**Qué probar:**
- [ ] Título: "Panel de Administrador" ↔ "Admin Panel"
- [ ] Descripción: "Gestiona todos los aspectos..." ↔ "Manage all aspects..."
- [ ] Tarjetas de navegación:
  - "Deportes" ↔ "Sports"
  - "Clubes" ↔ "Clubs"
  - "Equipos" ↔ "Teams"
  - "Usuarios" ↔ "Users"
  - "Invitar Entrenador/Admin" ↔ "Invite Coach/Admin"
  - "Invitaciones" ↔ "Invitations"
- [ ] Descripciones de cada tarjeta cambian

### ✅ SportsPage

**Ubicación:** `http://localhost:5173/admin/sports`

**Qué probar:**

**Página principal:**
- [ ] Título: "Deportes" ↔ "Sports"
- [ ] Descripción: "Gestión de deportes del sistema" ↔ "System sports management"
- [ ] Contador: "X deportes" ↔ "X sports"
- [ ] Botón: "Actualizar" ↔ "Refresh"
- [ ] Botón: "Nuevo deporte" ↔ "New Sport"

**Estado de carga:**
- [ ] Mensaje: "Cargando deportes..." ↔ "Loading sports..."

**Crear deporte:**
1. Haz clic en "Nuevo deporte" / "New Sport"
2. [ ] Título del diálogo: "Nuevo deporte" ↔ "New Sport"
3. Ingresa un nombre y guarda
4. [ ] Toast de éxito: "Deporte creado correctamente" ↔ "Sport created successfully"

**Editar deporte:**
1. Haz clic en el botón de editar
2. [ ] Título del diálogo: "Editar deporte" ↔ "Edit Sport"
3. Modifica y guarda
4. [ ] Toast de éxito: "Deporte actualizado correctamente" ↔ "Sport updated successfully"

**Eliminar deporte:**
1. Haz clic en el botón de eliminar
2. [ ] Título: "Eliminar deporte" ↔ "Delete Sport"
3. [ ] Descripción incluye: "¿Estás seguro..." ↔ "Are you sure..."
4. [ ] Botón: "Eliminar" ↔ "Delete"
5. Confirma
6. [ ] Toast: "Deporte eliminado correctamente" ↔ "Sport deleted successfully"

**Cargar más:**
- [ ] Botón: "Cargar más" ↔ "Load more"
- [ ] Durante carga: "Cargando..." ↔ "Loading..."

### ✅ ClubsPage

**Ubicación:** `http://localhost:5173/admin/clubs`

**Qué probar:**

**Página principal:**
- [ ] Título: "Clubes" ↔ "Clubs"
- [ ] Descripción: "Gestión de clubes del sistema" ↔ "System clubs management"
- [ ] Contador: "X clubes" ↔ "X clubs"
- [ ] Botón: "Nuevo Club" ↔ "New Club"

**Filtro:**
- [ ] Label: "Filtrar por deporte:" ↔ "Filter by sport:"
- [ ] Opción: "Todos los deportes" ↔ "All sports"

**Estado vacío:**
- [ ] Título: "No hay clubes" ↔ "No clubs"
- [ ] Descripción cambia según filtro:
  - "No hay clubes para el deporte seleccionado" ↔ "No clubs for the selected sport"
  - "Aún no se han registrado clubes..." ↔ "No clubs have been registered..."
- [ ] Botón: "Crear primer club" ↔ "Create first club"

**Eliminar club:**
1. Intenta eliminar un club con equipos
2. [ ] Error: "No se puede borrar el club porque tiene equipos asociados" ↔ "Cannot delete the club because it has associated teams"

**Éxito al eliminar:**
- [ ] Toast: "Club eliminado" ↔ "Club deleted"
- [ ] Descripción: "El club se eliminó correctamente" ↔ "The club was deleted successfully"

### ✅ TeamsPage

**Ubicación:** `http://localhost:5173/admin/teams`

**Qué probar:**

**Página principal:**
- [ ] Título: "Gestión de Equipos" ↔ "Teams Management"
- [ ] Botón: "Nuevo Equipo" ↔ "New Team"

**Filtros:**
- [ ] Título de la tarjeta: "Filtros" ↔ "Filters"
- [ ] Label deporte: "Deporte" ↔ "Sport"
- [ ] Label club: "Club" ↔ "Club"
- [ ] Opción: "Todos los deportes" ↔ "All sports"
- [ ] Opción: "Todos los clubes" ↔ "All clubs"

**Estados:**
- [ ] Cargando: "Cargando..." ↔ "Loading..."
- [ ] Error: "Error: ..." ↔ "Error: ..."
- [ ] Botón reintentar: "Reintentar" ↔ "Retry"

## 🔄 Flujo de Prueba Completo

### Escenario 1: Usuario en Español
1. Abre `/admin` en español
2. Navega por todas las páginas
3. Verifica que todo esté en español
4. Crea, edita y elimina un deporte
5. Verifica que todos los mensajes estén en español

### Escenario 2: Cambio de Idioma
1. Abre `/admin` en español
2. Cambia a inglés usando el selector
3. Verifica que TODO cambie instantáneamente
4. Navega a `/admin/sports`
5. Verifica que siga en inglés
6. Recarga la página
7. Verifica que mantenga el inglés (localStorage)

### Escenario 3: Usuario en Inglés
1. Cambia el idioma del navegador a inglés
2. Borra localStorage: `localStorage.clear()`
3. Recarga la página
4. Verifica que detecte inglés automáticamente
5. Navega por todas las páginas en inglés

## 🐛 Problemas Comunes

### El idioma no cambia
- **Solución:** Verifica que el componente use `const { t } = useTranslation()`
- **Solución:** Verifica que la clave exista en ambos archivos JSON

### Aparece la clave en lugar del texto
- **Ejemplo:** Ves `admin.sports` en lugar de "Deportes"
- **Solución:** Verifica que la clave esté correctamente escrita
- **Solución:** Verifica que exista en `es.json` y `en.json`

### El idioma no persiste al recargar
- **Solución:** Verifica que i18next esté configurado con localStorage
- **Solución:** Revisa la consola del navegador por errores

### Algunos textos no cambian
- **Solución:** Esos textos están hardcodeados, necesitan ser traducidos
- **Solución:** Busca el texto en el código y reemplázalo por `t('clave')`

## 📊 Resultados Esperados

Al finalizar las pruebas, deberías ver:

✅ **Español:**
- Panel de Administrador
- Deportes, Clubes, Equipos
- Nuevo deporte, Editar deporte, Eliminar deporte
- Cargando deportes...
- Deporte creado correctamente
- Todos los mensajes en español

✅ **English:**
- Admin Panel
- Sports, Clubs, Teams
- New Sport, Edit Sport, Delete Sport
- Loading sports...
- Sport created successfully
- All messages in English

## 🎯 Criterios de Éxito

- [ ] Todas las páginas del admin cambian de idioma
- [ ] El cambio es instantáneo (sin recargar)
- [ ] El idioma persiste al recargar la página
- [ ] Todos los botones están traducidos
- [ ] Todos los mensajes de éxito/error están traducidos
- [ ] Los diálogos están traducidos
- [ ] Los filtros y labels están traducidos
- [ ] No aparecen claves sin traducir (ej: `admin.sports`)

## 📝 Reporte de Pruebas

Usa esta plantilla para reportar:

```
✅ PASÓ / ❌ FALLÓ

Página: /admin/sports
Idioma: Español
Acción: Crear deporte
Resultado: ✅ Toast muestra "Deporte creado correctamente"

Página: /admin/clubs
Idioma: English
Acción: Cambiar filtro
Resultado: ✅ Label muestra "Filter by sport:"
```

---

**¡Listo para probar!** 🚀

Si encuentras algún problema, revisa los archivos:
- `src/i18n/locales/es.json`
- `src/i18n/locales/en.json`
- El componente específico que tiene el problema

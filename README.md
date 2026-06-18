# Arbo Forms

**Arbo** es una plataforma SaaS de creación y gestión de formularios dinámicos. Permite diseñar formularios con un editor visual, publicarlos, embeberlos en cualquier sitio, recolectar respuestas, analizarlas con IA, generar PDFs, y organizar todo en proyectos colaborativos con su propio portal SaaS.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Estilos | Tailwind CSS 4, variables CSS custom (`--arbo-*`) |
| Iconos | @gravity-ui/icons, @heroicons/react |
| Drag & Drop | @dnd-kit (campos del editor) |
| Canvas BD | @xyflow/react (ReactFlow — grafo de relaciones) |
| i18n | react-i18next (ES / EN) |
| Estado | Zustand + React Context |
| Backend | Node.js, Express, TypeScript |
| ORM | Sequelize v7 + sequelize-typescript |
| Base de datos | PostgreSQL (JSONB para estilos y campos) |
| Auth | JWT + bcrypt |
| AI | OpenRouter API (múltiples modelos) |
| Animaciones | Framer Motion |

---

## Características principales

### Editor de formularios
- Editor visual de 3 paneles: árbol de campos / canvas / propiedades
- Drag & drop para reordenar campos
- Vista previa en tiempo real (modo preview)
- Soporte multi-página con paginación y progress bar
- Grid layout libre (posición y tamaño de campos en columnas)
- Campos: texto, password, textarea, número, checkbox, radio, select, multi-select, fecha, archivo

### Sistema de estilos
- Presets de tema (Default, Glass, Midnight, Light, Minimal, Sunset, Ocean, Emerald)
- Color de acento, fondo de página, fondo de card, gradientes
- Border radius, sombras (sm / md / lg / glow)
- Glassmorphism con blur y opacidad configurables
- Orbs de luz/glow animados en el fondo de página
- Animaciones de entrada de campos (fadeIn, slideUp, bounceIn, flipIn, etc.)
- Animaciones hover (lift, glow, scale, tilt, borderPulse)
- Copiar estilos de otro formulario del mismo proyecto

### Proyectos
- Agrupar formularios en proyectos con color y descripción
- Colaboradores por proyecto con roles (viewer / editor)
- Vista detalle con preview miniatura de cada formulario
- Eliminar proyecto con opción de conservar o borrar los formularios vinculados

### Portal SaaS por proyecto (`/p/:id`)
Cada proyecto tiene su propio portal independiente con barra lateral y 3 temas:

| Tab | Descripción |
|-----|------------|
| Dashboard | Estadísticas del proyecto (formularios, respuestas, colaboradores) |
| Formularios | Gestión de forms: crear, editar, vincular, buscar |
| Respuestas | Ver, expandir, exportar (Excel / PDF) respuestas por formulario |
| Documentación | PDFs emitidos agrupados por formulario, descarga individual o masiva |
| Análisis IA | Análisis de respuestas con IA (resumen, insights, tendencias, sentimiento) |
| Base de datos | Canvas ReactFlow de relaciones entre formularios |
| Usuarios | Gestión de colaboradores del proyecto |
| Configuración | Tema del portal (Dark / Light / Glass) |

### Relaciones entre formularios (Base de datos)
- Canvas visual con ReactFlow para conectar formularios como tablas
- Tipos de relación: uno-a-uno, uno-a-muchos, muchos-a-muchos
- Cadena de respuestas: cada respuesta del form hijo referencia a la del padre
- Google Auth gate para formularios relacionales (identidad estricta del respondente)

### Análisis con IA
- Integración con OpenRouter (modelos configurables desde `/form-builder/settings/openrouter`)
- Análisis de respuestas: resumen ejecutivo, insights, tendencias, recomendaciones, sentimiento
- Generación automática de schema de formulario desde una descripción en lenguaje natural
- Estadísticas de uso (tokens, costo, requests) visibles en el dashboard de AI

### Exportación PDF
- Exportar respuesta individual como PDF
- Exportar todas las respuestas de un formulario
- Layout de PDF configurable (pdfLayout) por formulario

### Embed
- Formularios embebibles vía `<iframe src="/embed/:slug">`
- Auto-resize del iframe via `postMessage`
- Fondo transparente opcional para embed
- Snippet de código generado automáticamente desde el editor

### API Keys
- Generación de API keys para acceso externo a respuestas
- Panel de gestión desde `/form-builder/api-keys`

---

## Estructura del proyecto

```
fullstack_node_react_arbo/
├── client/                          # Frontend React + Vite
│   └── src/
│       ├── components/
│       │   └── core/                # TopBar, NavBar, Sidebar
│       ├── core/
│       │   └── form-engine/         # Motor de formularios (ver sección)
│       ├── features/
│       │   ├── auth/                # Login, Register
│       │   └── form-builder/
│       │       ├── views/           # Todas las vistas (ver Rutas)
│       │       │   └── portal/      # Sub-vistas del portal SaaS
│       │       └── components/      # FormCard, DashboardDesigner, etc.
│       ├── i18n/                    # Traducciones ES / EN
│       ├── layouts/                 # AuthLayout, FormBuilderLayout
│       ├── services/                # api.ts (authApi, formApi, projectApi...)
│       └── router.tsx               # Definición de rutas
│
├── server/                          # Backend Express + TypeScript
│   └── src/
│       ├── config/                  # db.ts (conexión PostgreSQL)
│       ├── models/                  # Modelos Sequelize
│       ├── routes/                  # Rutas Express
│       ├── handlers/                # Controladores HTTP
│       ├── services/                # Lógica de negocio
│       ├── repositories/            # Acceso a datos (Sequelize)
│       ├── middleware/              # verifyToken, auth
│       ├── migrations/              # Migraciones de BD
│       └── data/                    # Stats persistidos (AI usage, OpenRouter)
│
└── embed-example.html               # Ejemplo de iframe embebido
```

---

## Motor de formularios (`core/form-engine/`)

El núcleo de Arbo. Convierte un schema JSON en un formulario interactivo. Un único componente `FormBuilder` recibe el schema y el modo de renderizado.

```
form-engine/
├── FormBuilder.tsx                   # Entry point (schema + mode)
├── components/
│   ├── DynamicForm.tsx               # Orquestador: system / edit / view
│   ├── FormViewMode.tsx              # Modo vista pública (paginado)
│   ├── editor/
│   │   ├── EditorContext.tsx         # Estado compartido del editor (undo/redo)
│   │   ├── Navigator.tsx             # Panel izquierdo: árbol de campos
│   │   ├── EditorCanvas.tsx          # Canvas central con tabs
│   │   ├── PagePreviewCanvas.tsx     # Preview de página completa
│   │   ├── EmbedPreviewCanvas.tsx    # Preview de iframe
│   │   ├── EditorTabBar.tsx          # Barra de tabs con scroll
│   │   └── tabs/
│   │       ├── InputsTab.tsx         # Agregar campos
│   │       ├── FieldTab.tsx          # Propiedades del campo seleccionado
│   │       ├── FormStylesTab.tsx     # Presets, colores, glass, animaciones
│   │       ├── PageTab.tsx           # Fondo, orbs, contacto, heading
│   │       ├── SubmitTab.tsx         # Acción al enviar
│   │       └── EmbedTab.tsx         # Configuración de iframe
│   ├── fields/                       # DynamicTextField, DynamicSelect, etc.
│   └── ui/                           # SortableField (DnD), menus, switches
├── constants/
│   ├── editor-constants.ts           # Paletas, opciones de animación, labels
│   ├── style-presets.ts              # 8 presets + SHADOW_OPTIONS
│   └── form-modes.ts
├── hooks/
│   └── useSchemaHistory.ts           # Undo/redo con debounce
├── store/
│   ├── FormContext.tsx               # Provider del formulario
│   └── useFormStore.ts              # Estado y handlers del formulario
├── types/
│   └── schema.types.ts              # FormSchema, FormField, FormStyles, GlowOrb...
└── utils/
    ├── style-helpers.ts              # applyAlpha, getGlassStyle, isColorLight...
    └── formValidations.ts           # Validación de campos
```

### Modos de renderizado

| Modo | Uso |
|------|-----|
| `isSystemForm={true}` | Formularios de auth (login / register) — sin card ni título |
| `mode="edit"` | Editor visual completo con 3 paneles y undo/redo |
| `mode="view"` | Vista pública paginada con todos los estilos aplicados |
| `mode="preview"` | Preview dentro del editor (fiel al view, sin interacción) |

---

## Rutas

### Frontend

| Ruta | Vista | Descripción |
|------|-------|------------|
| `/` | LoginView | Login |
| `/register` | RegisterView | Registro |
| `/form-builder` | DashboardView | Dashboard principal |
| `/form-builder/create-form` | CreateFormView | Crear formulario |
| `/form-builder/edit/:id` | EditFormView | Editor visual |
| `/form-builder/responses/:id` | ResponsesView | Respuestas de un form |
| `/form-builder/projects` | → Dashboard | Redirect |
| `/form-builder/projects/:id` | ProjectDetailView | Detalle de proyecto |
| `/form-builder/projects/:id/relations` | FormRelationsView | Canvas de relaciones BD |
| `/form-builder/shared` | SharedView | Formularios compartidos |
| `/form-builder/archive` | ArchiveView | Formularios archivados |
| `/form-builder/trash` | TrashView | Papelera |
| `/form-builder/api-keys` | ApiKeysView | Gestión de API keys |
| `/form-builder/settings/openrouter` | OpenRouterSettingsView | Config AI |
| `/form-builder/components` | ComponentsLibraryView | Librería de componentes |
| `/p/:id` | ProjectPortalView | Portal SaaS del proyecto |
| `/p/:id/forms` | PortalForms | Forms del proyecto |
| `/p/:id/responses` | PortalResponses | Respuestas en el portal |
| `/p/:id/docs` | PortalDocs | PDFs agrupados por form |
| `/p/:id/analysis` | PortalAnalysis | Análisis IA |
| `/p/:id/database` | PortalDatabase | Canvas de BD |
| `/p/:id/users` | PortalUsers | Colaboradores |
| `/p/:id/settings` | PortalSettings | Configuración del portal |
| `/forms/:slug` | PublicFormView | Formulario público |
| `/embed/:slug` | EmbedFormView | Formulario embebido |

### API Backend (`/api`)

**Auth**
```
POST   /auth/register
POST   /auth/login
GET    /auth/profile
```

**Formularios**
```
POST   /forms                          Crear
GET    /forms                          Mis formularios
GET    /forms/archived                 Archivados
GET    /forms/trash                    Papelera
GET    /forms/shared                   Compartidos conmigo
GET    /forms/:id                      Por ID
GET    /forms/slug/:slug               Por slug (público)
PUT    /forms/:id                      Actualizar
DELETE /forms/:id                      Soft delete (papelera)
POST   /forms/:id/archive              Archivar
POST   /forms/:id/unarchive            Desarchivar
POST   /forms/:id/restore              Restaurar de papelera
DELETE /forms/:id/permanent            Eliminar permanente
GET    /forms/:id/responses            Listar respuestas
POST   /forms/:id/responses            Enviar respuesta
DELETE /forms/:id/responses/:rid       Eliminar respuesta
GET    /forms/:id/responses/count      Contar respuestas
POST   /forms/:id/responses/export     Exportar Excel
POST   /forms/:id/responses/:rid/pdf   Exportar respuesta a PDF
POST   /forms/:id/export-pdf           Exportar todas a PDF
POST   /forms/:id/analyze              Análisis IA de respuestas
GET    /forms/:id/collaborators        Colaboradores
POST   /forms/:id/collaborators        Agregar colaborador
PATCH  /forms/:id/collaborators/:email Cambiar rol
DELETE /forms/:id/collaborators/:email Remover colaborador
```

**Proyectos**
```
POST   /projects                       Crear proyecto
GET    /projects                       Mis proyectos
GET    /projects/:id                   Detalle con formularios
PUT    /projects/:id                   Actualizar
DELETE /projects/:id?deleteForms=bool  Eliminar proyecto
POST   /projects/assign-form           Asignar form a proyecto
GET    /projects/:id/collaborators     Colaboradores
POST   /projects/:id/collaborators     Agregar
PATCH  /projects/:id/collaborators/:email  Cambiar rol
DELETE /projects/:id/collaborators/:email  Remover
GET    /projects/:id/relations         Relaciones entre forms
PUT    /projects/:id/relations         Guardar relaciones
POST   /projects/:id/ai/generate-schema  Generar schema con IA
```

**API Keys**
```
GET    /api-keys                       Listar
POST   /api-keys                       Crear
PATCH  /api-keys/:id/revoke            Revocar
DELETE /api-keys/:id                   Eliminar
```

**Configuración**
```
GET    /settings/openrouter            Config de modelos AI
PUT    /settings/openrouter            Actualizar config
GET    /settings/ai-usage              Estadísticas de uso de AI
```

---

## Modelos de datos

```
User
├── id, name, email, password (hash)
└── hasMany: UserForm, FormResponse

UserForm  (formulario)
├── id, userId, projectId?, title, description, slug
├── onSubmit, isPublished, isArchived, deletedAt
├── styles (JSONB)                     ← toda la config visual
└── hasMany: FormField, FormResponse, FormCollaborator

FormField
├── id, formId, name, label, placeholder
├── type, componentType, defaultValue
├── required, minLength, maxLength, rows
├── sortOrder, page, span, spanTablet, spanMobile
├── validations (JSON), dependencies (JSON), options (JSON)
└── fieldStyles (JSON)                 ← estilos por campo

FormResponse
├── id, formId, respondentId?, respondentName?, respondentEmail?
├── answers (JSON)
├── parentResponseId?, parentFormId?   ← cadena relacional
└── secondaryResponseId?, rootResponseId?

FormCollaborator
├── id, formId, userId?, email, role ("viewer"|"editor")

Project
├── id, userId, name, description, color
└── hasMany: UserForm, ProjectCollaborator, FormRelation

ProjectCollaborator
├── id, projectId, email, role ("viewer"|"editor")

FormRelation  (relaciones entre formularios)
├── id, projectId, parentFormId, childFormId
├── type ("one_to_one"|"one_to_many"|"many_to_many")
├── keyField?                          ← campo de matching sin link
└── joinFormId?                        ← form puente para N:M

ApiKey
├── id, userId, name, key (hash), lastUsedAt, revokedAt
```

---

## Setup local

```bash
# 1. Clonar el repo
git clone <repo-url>
cd fullstack_node_react_arbo

# 2. Backend
cd server
npm install
cp .env.example .env    # Completar DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, JWT_SECRET
npm run dev             # Puerto 4000

# 3. Frontend
cd ../client
npm install
npm run dev             # Puerto 5173
```

### Variables de entorno del servidor (`server/.env`)

```env
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=arbo_forms
DB_HOST=localhost
JWT_SECRET=tu_jwt_secret
CLIENT_URL=http://localhost:5173
```

> Las migraciones corren automáticamente al iniciar el servidor (`sequelize.sync`).

---

## Embeber formularios

```html
<!-- Formulario embebido -->
<iframe
  src="https://tu-dominio.com/embed/mi-formulario"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>

<!-- Auto-resize del iframe -->
<script>
  window.addEventListener("message", function(e) {
    if (e.data?.type === "arbo-embed-resize") {
      document.querySelector("iframe").style.height = e.data.height + "px";
    }
  });
</script>
```

El editor genera el snippet listo para copiar desde la pestaña **Embed** del formulario.

---

## Sistema de temas CSS

Todas las variables del tema se definen en `client/src/index.css`:

```css
--arbo-bg            /* Fondo principal */
--arbo-surface       /* Fondo de cards */
--arbo-surface-2     /* Fondo de elementos secundarios */
--arbo-surface-3     /* Fondo de hover / activo */
--arbo-border        /* Borde estándar */
--arbo-text          /* Texto principal */
--arbo-text-secondary
--arbo-text-muted
--arbo-accent        /* Verde #4ADE80 */
--arbo-accent-subtle
--arbo-accent-muted
--arbo-danger        /* Rojo de alertas */
--arbo-warning       /* Amarillo */
```

El portal SaaS soporta 3 temas por proyecto (persistidos en `localStorage`):
- **Dark** — tema por defecto de Arbo
- **Light** — fondo claro, cards blancas
- **Glass** — glassmorphism con orbs de color y `backdrop-filter`

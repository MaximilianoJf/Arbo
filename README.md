# Arbo Forms

**Arbo** es un Form Builder que permite crear, personalizar, publicar y embeber formularios dinamicos. Construido con React + Node.js, incluye un motor de formularios propio con editor visual, sistema de estilos con presets, paginacion, colaboradores y recoleccion de respuestas.

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19, TypeScript, Vite |
| UI | HeroUI v3 (NextUI), Tailwind CSS 4 |
| Iconos | @gravity-ui/icons |
| DnD | @dnd-kit |
| Backend | Node.js, Express, TypeScript |
| Base de datos | PostgreSQL, Sequelize ORM |
| Auth | JWT (jsonwebtoken, bcrypt) |

---

## Estructura del proyecto

```
fullstack_node_react_arbo/
├── client/                          # Frontend React
│   └── src/
│       ├── components/              # Componentes globales
│       │   ├── core/                #   TopBar, Sidebar, NavBar
│       │   ├── ui/                  #   Logo, WaveSvg
│       │   └── widgets/             #   ThemeSwitcher
│       ├── core/
│       │   ├── components/ui/       #   Selectores custom (CustomSelect, SimpleSelect)
│       │   └── form-engine/         #   MOTOR DE FORMULARIOS (ver seccion dedicada)
│       ├── features/
│       │   ├── auth/                #   Login y Registro
│       │   │   ├── views/           #     LoginView, RegisterView
│       │   │   ├── constants/       #     auth.fields.ts (schemas de login/register)
│       │   │   └── components/      #     AuthCard
│       │   └── form-builder/        #   Gestion de formularios
│       │       ├── views/           #     9 vistas (ver Rutas)
│       │       └── components/      #     FormCard (tarjeta con acciones)
│       ├── layouts/                 # AuthLayout, FormBuilderLayout
│       ├── services/                # api.ts (authApi, formApi)
│       ├── stores/                  # useAppStore, userSlice
│       ├── router.tsx               # Rutas de la app
│       └── index.css                # Tema Arbo Dark + overrides HeroUI
│
├── server/                          # Backend Express
│   └── src/
│       ├── config/                  # db.ts (conexion PostgreSQL)
│       ├── models/                  # Modelos Sequelize
│       │   ├── User.model.ts
│       │   ├── UserForm.model.ts
│       │   ├── FormField.model.ts
│       │   ├── FormResponse.model.ts
│       │   └── FormCollaborator.model.ts
│       ├── routes/                  # Rutas Express
│       │   ├── auth.routes.ts
│       │   ├── form.routes.ts
│       │   └── user.routes.ts
│       ├── handlers/                # Controladores
│       ├── services/                # Logica de negocio
│       ├── repositories/            # Acceso a datos
│       ├── validators/              # Validaciones express-validator
│       ├── middleware/              # JWT verify, error handler
│       └── utils/                   # JWT utilities
│
└── embed-example.html               # Ejemplo de iframe embebido
```

---

## Motor de Formularios (Form Engine)

El core de Arbo es un motor de renderizado dinamico que genera formularios a partir de un schema JSON. Un unico componente (`DynamicForm`) maneja 3 modos de renderizado distintos.

### Estructura del engine

```
core/form-engine/
├── FormBuilder.tsx                   # Wrapper principal (recibe schema + mode)
├── components/
│   ├── DynamicForm.tsx               # Componente central (~1300 lineas)
│   │                                 #   - System form mode (auth)
│   │                                 #   - Editor mode (3 paneles + DnD)
│   │                                 #   - View mode (publico + paginado)
│   ├── Field-render.tsx              # Mapa ComponentType -> Componente React
│   ├── fields/                       # Componentes de campo
│   │   ├── DynamicTextField.tsx      #   Input de texto
│   │   ├── DynamicPasswordWithToggle.tsx  # Password con show/hide
│   │   ├── DynamicTextArea.tsx       #   Textarea
│   │   ├── DynamicNumberField.tsx    #   Input numerico
│   │   ├── DynamicCheckbox.tsx       #   Checkbox / CheckboxGroup
│   │   ├── DynamicSelect.tsx         #   Select dropdown
│   │   └── DynamicDateField.tsx      #   Date picker
│   ├── forms/
│   │   ├── FieldSettingsForm.tsx     #   Modal de configuracion avanzada
│   │   └── ModalWrapper.tsx          #   Contenedor de modales
│   └── ui/
│       ├── menus/                    #   FieldSelectorMenu, ContextMenu, SideBar
│       ├── switches/                 #   EnableSwitch
│       └── sortable/                 #   SortableField (DnD wrapper)
├── constants/
│   ├── field-settings.ts             # FIELD_COMPONENTS (config de cada tipo)
│   ├── form-modes.ts                 # view | edit | create | preview
│   └── style-presets.ts              # 8 presets + SHADOW_OPTIONS + getShadowCss()
├── services/
│   └── formActions.ts                # FormFunctions + FORM_ACTIONS_MAP
├── store/
│   ├── FormContext.tsx                # Provider del formulario
│   └── useFormStore.ts               # Hook de estado (schema, formState, handlers)
├── types/
│   ├── schema.types.ts               # FormSchema, FormField, FormStyles, ComponentType
│   └── fieldForm.types.ts            # FieldSelectorOption, FormFieldSettings
└── utils/
    └── formValidations.ts            # Logica de validacion de campos
```

### Modos de renderizado

| Modo | Uso | Descripcion |
|------|-----|------------|
| `isSystemForm` | Auth (login/register) | Renderizado simple sin card ni titulo |
| `edit` / `create` | Editor interno | 3 paneles: navegador, canvas con DnD, propiedades/estilos |
| `view` | Publico / Embed | Formulario paginado con estilos, colores, progress bar |

### Tipos principales

```typescript
// Schema del formulario
type FormSchema = {
  id?: number;
  title: string;
  description?: string;
  slug?: string;
  onSubmit?: "SaveToDB" | "SendToEmail";
  isPublished?: boolean;
  styles?: FormStyles;
  fields: FormField[];
}

// Definicion de un campo
interface FormField {
  id?: string;
  name: string;
  label?: string;
  placeholder?: string;
  type: string;                    // text, email, password, number, date...
  componentType: ComponentType;    // DynamicTextField, DynamicSelect...
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  validate?: string[];             // ["required", "email", "minLength"...]
  options?: string[];              // Para select/checkbox
  page?: number;                   // Pagina (multi-page forms)
  sortOrder?: number;
}

// Tipos de componentes disponibles
type ComponentType =
  | "DynamicTextField"
  | "DynamicPasswordWithToggle"
  | "DynamicTextArea"
  | "DynamicNumberField"
  | "DynamicCheckbox"
  | "DynamicSelect"
  | "DynamicDateField"

// Estilos del formulario
interface FormStyles {
  accentColor?: string;            // Color de acento
  bgColor?: string;                // Fondo de las cards
  pageBgColor?: string;            // Fondo de la pagina
  gradient?: string;               // Gradiente CSS (reemplaza accentColor)
  cardSize?: "sm"|"md"|"lg"|"xl";  // Ancho del form (480-100%)
  contactSize?: "sm"|"md"|"lg";    // Ancho del panel contacto (240-400px)
  borderRadius?: number;           // Radio de borde (0-24px)
  borderColor?: string;            // Color de borde
  shadowStyle?: "none"|"sm"|"md"|"lg"|"glow";  // Tipo de sombra
  preset?: string;                 // Preset activo
}
```

### Style Presets

8 temas predefinidos que se aplican con un click:

| Preset | Descripcion |
|--------|------------|
| Default | Verde sobre dark (el original Arbo) |
| Glass | Glassmorphism violeta con glow |
| Midnight | Azul profundo con sombras grandes |
| Light | Fondo claro, cards blancas |
| Minimal | Blanco ultra limpio, sin sombra |
| Sunset | Gradiente rosa-naranja sobre purpura |
| Ocean | Gradiente cyan-azul sobre marino |
| Emerald | Verde esmeralda sobre fondo oscuro |

### Acciones de submit

```typescript
const FormFunctions = {
  SaveToDB: "SaveToDB",      // Guarda respuesta via API
  SendToEmail: "SendToEmail" // Abre mailto con datos
}
```

---

## Rutas

### Frontend (React Router)

| Ruta | Componente | Layout | Auth |
|------|-----------|--------|------|
| `/` | LoginView | AuthLayout | No |
| `/register` | RegisterView | AuthLayout | No |
| `/form-builder` | DashboardView | FormBuilderLayout | Si |
| `/form-builder/create-form` | CreateFormView | FormBuilderLayout | Si |
| `/form-builder/edit/:id` | EditFormView | FormBuilderLayout | Si |
| `/form-builder/responses/:id` | ResponsesView | FormBuilderLayout | Si |
| `/form-builder/shared` | SharedView | FormBuilderLayout | Si |
| `/form-builder/archive` | ArchiveView | FormBuilderLayout | Si |
| `/form-builder/trash` | TrashView | FormBuilderLayout | Si |
| `/forms/:slug` | PublicFormView | Standalone | No |
| `/embed/:slug` | EmbedFormView | Standalone | No |

### API Backend

**Auth** (`/api/auth`)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|------------|------|
| POST | `/auth/register` | Registrar usuario | No |
| POST | `/auth/login` | Login | No |
| GET | `/auth/profile` | Perfil del usuario | Si |

**Forms** (`/api/forms`)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|------------|------|
| POST | `/forms` | Crear formulario | Si |
| GET | `/forms` | Mis formularios | Si |
| GET | `/forms/archived` | Formularios archivados | Si |
| GET | `/forms/trash` | Formularios en papelera | Si |
| GET | `/forms/shared` | Compartidos conmigo | Si |
| GET | `/forms/:id` | Obtener por ID | Si |
| GET | `/forms/slug/:slug` | Obtener por slug | No |
| PUT | `/forms/:id` | Actualizar formulario | Si |
| DELETE | `/forms/:id` | Mover a papelera (soft) | Si |
| POST | `/forms/:id/archive` | Archivar | Si |
| POST | `/forms/:id/unarchive` | Desarchivar | Si |
| POST | `/forms/:id/restore` | Restaurar de papelera | Si |
| DELETE | `/forms/:id/permanent` | Eliminar permanente | Si |

**Colaboradores** (`/api/forms/:id/collaborators`)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|------------|------|
| GET | `/forms/:id/collaborators` | Listar colaboradores | Si |
| POST | `/forms/:id/collaborators` | Agregar colaborador | Si |
| PATCH | `/forms/:id/collaborators/:email` | Cambiar rol | Si |
| DELETE | `/forms/:id/collaborators/:email` | Remover | Si |

**Respuestas** (`/api/forms/:id/responses`)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|------------|------|
| POST | `/forms/:id/responses` | Enviar respuesta | No |
| GET | `/forms/:id/responses` | Ver respuestas | Si |

---

## Modelos de datos

```
User
├── id, name, email, password
├── hasMany: UserForm, FormResponse

UserForm
├── id, userId, title, description, slug, onSubmit
├── isPublished, isArchived, deletedAt, styles (JSON)
├── hasMany: FormField, FormResponse, FormCollaborator

FormField
├── id, formId, name, label, placeholder, type, componentType
├── defaultValue, required, minLength, maxLength
├── sortOrder, page, validations (JSON), dependencies (JSON), options (JSON)

FormResponse
├── id, formId, respondentId?, respondentName?, respondentEmail?
├── answers (JSON), createdAt

FormCollaborator
├── id, formId, userId, email, role ("viewer"|"editor")
```

---

## Embeber formularios

Los formularios se pueden embeber en cualquier sitio externo via iframe:

```html
<!-- Solo formulario -->
<iframe
  src="https://tu-dominio.com/embed/tu-slug"
  width="100%" height="600" frameborder="0"
  style="border:none; border-radius:12px; max-width:700px;"
></iframe>

<!-- Con campos de contacto (nombre + email) -->
<iframe
  src="https://tu-dominio.com/embed/tu-slug?contact=1"
  width="100%" height="600" frameborder="0"
  style="border:none; border-radius:12px; max-width:700px;"
></iframe>

<!-- Auto-resize del iframe -->
<script>
  window.addEventListener("message", function(e) {
    if (e.data?.type === "arbo-embed-resize") {
      document.querySelector('iframe').style.height = e.data.height + "px";
    }
  });
</script>
```

El boton **Embed** en cada FormCard del dashboard genera el snippet listo para copiar, con toggle para incluir o no los campos de contacto.

---

## Setup local

```bash
# Backend
cd server
npm install
# Configurar .env con DATABASE_URL y JWT_SECRET
npm run dev        # Puerto 4000

# Frontend
cd client
npm install
npm run dev        # Puerto 5173
```

---

## CSS / Tema

El archivo `client/src/index.css` define el tema **Arbo Dark** con variables CSS:

- `--arbo-bg`, `--arbo-surface`, `--arbo-surface-2`, `--arbo-surface-3`
- `--arbo-accent` (verde), `--arbo-accent-hover`, `--arbo-accent-muted`
- `--arbo-text`, `--arbo-text-secondary`, `--arbo-text-muted`
- `--arbo-danger`, `--arbo-warning`, `--arbo-info`
- `--arbo-border`, `--arbo-border-light`
- `--arbo-radius`, `--arbo-radius-lg`
- `--arbo-shadow`, `--arbo-shadow-lg`

Incluye overrides globales para HeroUI (inputs, selects, checkboxes, modales, popovers) y clases utilitarias como `.arbo-card`, `.arbo-panel`, `.arbo-btn-primary`, `.arbo-auth-card`, etc.

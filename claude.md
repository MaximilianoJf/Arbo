# Claude Code — Arbo Forms

## Arquitectura

Monorepo fullstack: `client/` (React + Vite + TypeScript) y `server/` (Node + Express + Prisma).

El motor de formularios vive en `client/src/core/form-engine/`.

## Reglas de código

### ✅ HACER

- **Componentes pequeños y enfocados**: cada archivo debe tener una sola responsabilidad (un tab, un panel, una utilidad).
- **Extraer funciones puras a `utils/`**: helpers de color, estilo, cálculo de luminancia, etc.
- **Extraer constantes a `constants/`**: arrays estáticos, mapas de configuración, paletas de colores.
- **Usar Context para estado compartido del editor**: cuando múltiples componentes necesitan el mismo estado, usar React Context (ej: `EditorContext`).
- **Tipar todo**: interfaces y types explícitos, evitar `any` excepto donde sea inevitable (APIs externas).
- **Mantener DynamicForm.tsx como orquestador**: solo estado + routing entre modos (system, edit, preview, view).
- **Reutilizar helpers de estilo**: `style-helpers.ts` contiene `applyAlpha`, `getGlassStyle`, `getPageBgCss`, `isColorLight`, etc. Usarlos en vez de duplicar.
- **Nombres descriptivos**: `FormStylesTab`, `PagePreviewCanvas`, `GlowOrbEditor` — no nombres genéricos.
- **Separar lógica de renderizado**: hooks y callbacks en el componente, JSX limpio sin IIFEs anidados.

### ❌ NO HACER

- **No escribir código espagueti**: si un componente pasa de ~300 líneas, considerar dividirlo.
- **No duplicar funciones entre archivos**: si `applyAlpha()` o `isColorLight()` se usa en varios archivos, importarla de `utils/style-helpers.ts`.
- **No usar IIFEs (`(() => { ... })()`) para lógica compleja dentro del JSX**: extraer a un componente o variable.
- **No mezclar constantes con lógica de componente**: moverlas a `constants/`.
- **No hacer prop drilling excesivo**: si hay más de 3 niveles, usar Context.
- **No commitear console.log ni código muerto** (imports sin usar, variables no referenciadas).
- **No hardcodear colores mágicos**: usar variables CSS `var(--arbo-*)` o constantes nombradas.
- **No crear archivos monolíticos**: el viejo DynamicForm.tsx de 2500 líneas no debe repetirse.

## Estructura del form-engine

```
form-engine/
  components/
    DynamicForm.tsx          ← orquestador principal (~200 líneas)
    FormViewMode.tsx          ← modo view/preview
    editor/
      EditorContext.tsx       ← estado compartido del editor
      Navigator.tsx           ← panel izquierdo (árbol de campos)
      EditorCanvas.tsx        ← canvas central (tabs inputs/field/form)
      PagePreviewCanvas.tsx   ← canvas de preview de página
      EmbedPreviewCanvas.tsx  ← canvas de preview de embed
      EditorTabBar.tsx        ← barra de tabs con scroll
      tabs/
        InputsTab.tsx         ← tab "+" (agregar campos)
        FieldTab.tsx          ← tab "Campo" (propiedades del campo)
        FormStylesTab.tsx     ← tab "Form" (presets, colores, glass)
        PageTab.tsx           ← tab "Pagina" (fondo, luces, contacto)
        SubmitTab.tsx         ← tab "Submit" (acción al enviar)
        EmbedTab.tsx          ← tab "Embed" (iframe settings)
    fields/                   ← componentes de campo individuales
    forms/                    ← modales y formularios auxiliares
    ui/                       ← componentes UI reutilizables
  constants/
    editor-constants.ts       ← paletas, labels, config del editor
    style-presets.ts          ← presets de estilo + shadows
    form-modes.ts
  utils/
    style-helpers.ts          ← funciones de color y estilo compartidas
    formValidations.ts        ← reglas de validación
  store/
    useFormStore.ts           ← estado del formulario (Zustand-like)
    FormContext.tsx            ← provider del formulario
  types/
    schema.types.ts           ← tipos del schema
```

## Convenciones de estilo CSS

- Clases utilitarias: Tailwind (`arbo-*` custom + `text-sm`, `flex`, etc.)
- Variables CSS custom: `--arbo-bg`, `--arbo-text`, `--arbo-accent`, `--arbo-border`, etc.
- Estilos inline solo para valores dinámicos (colores del usuario, gradientes, posiciones).

## Testing

- Los formularios de sistema (login, register) usan `isSystemForm={true}`.
- Las vistas públicas (`PublicFormView`, `EmbedFormView`) consumen el schema vía API.
- Los estilos se aplican vía `FormStyles` en el schema.

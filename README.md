# 🌳 Arbo - UI Builder & Dynamic Form Engine

**Arbo** es un constructor de interfaces (Builder) diseñado bajo una arquitectura modular. Actualmente, el proyecto se encuentra en su **Fase 1**, centrado en el desarrollo de un **Motor de Formularios Dinámicos** robusto que sirve como base para una herramienta de creación visual.

## 🚀 El Desafío Técnico: De Código Estático a Componentes Dinámicos

El mayor desafío de este proyecto fue abstraer la lógica de autenticación (**Login y Registro**) para que no fueran archivos estáticos, sino el primer caso de uso de un motor dinámico.

### Puntos Clave del Desarrollo:

- **Mapeo de HeroUI v3:** Transformación de componentes de UI estáticos en elementos dinámicos que se renderizan según un esquema de configuración.
- **Arquitectura de Abstracción para el Builder:** El sistema actual de Login/Registro funciona como una prueba de concepto (PoC). La lógica está diseñada para que, en la siguiente fase, evolucione hacia un **Constructor Visual**, permitiendo que los usuarios finales creen sus propios formularios sin tocar el código.
- **Reutilización de Estructuras:** Un único motor de renderizado gestiona diferentes interfaces basándose únicamente en el paso de `props` de configuración, reduciendo la redundancia de código.

## 🛠️ Stack Tecnológico

- **Frontend:** React.js
- **UI Library:** HeroUI v3 (NextUI)
- **Estilos:** Tailwind CSS
- **Estado:** React Hooks & Logic (Client-side)

## 📂 Estructura principal del Repositorio

```
src/
├── components/
│   ├── shared/
│   │   └── DynamicForm/                # 🚀 El Corazón: Motor de renderizado dinámico
│   │       ├── FormComponents/         # Inputs mapeados (Password, TextField)
│   │       └── DynamicForm.tsx         # Lógica central del formulario dinámico
│   │       └── FormComponents.tsx      # Mapeo de inputs dinámicos
│   │       └── types.ts                # Tipos y contratos del motor
│   ├── navBar/                         # Componentes de navegación
│   ├── ui/                             # Elementos base (Logo, Svgs)
│   └── widgets/                        # Utilidades globales (ThemeSwitcher)
├── features/                           # Módulos de negocio independientes
│   ├── auth/                           # Lógica de Login/Register
│   │   ├── constants/                  # Definición de campos builder de auth (auth.fields.ts)
│   │   └── views/                      # Páginas de Auth
├── interfaces/                         # Contratos de TypeScript (User, Form)
├── layouts/                            # Envoltorios de página (Auth)
├── services/                           # Lógica de validación y acciones APi

```

## 🚀 Proximas Metas

- [x] Implementación de componentes dinámicos base.
- [x] Prototipo de Auth (Login/Register) basado en esquemas.
- [ ] Integración de onSubmit dependiendo de configuración de los formularios.
- [ ] Desarrollo del **Visual Form Builder** (Interfaz para que los usuarios creen sus propios formularios).
- [ ] Integración con Backend para persistencia de formularios.
- [ ] Sistema de validaciones dinámicas.

---

Este proyecto es el motor base para crear formularios dinámicos. La idea es que no se quede solo en código, sino que evolucione a un Builder visual (usando herramientas como Craft.js) para que cualquier usuario pueda armar sus propios módulos de captura de datos arrastrando componentes, sin tener que programar.

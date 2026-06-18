# Arbo Forms MCP Server

Servidor MCP standalone que se conecta al backend de Arbo Forms y expone tools para consultar formularios, analizar respuestas y filtrar datos desde cualquier cliente MCP compatible.

Soporta dos modos de transporte:
- **stdio** — para clientes MCP locales (Cursor, Windsurf, etc.)
- **SSE/HTTP** — para despliegue en la nube (Render, Railway, etc.)

## Setup local (stdio)

### 1. Crear API Key

En tu app Arbo → sidebar → **API Keys** → crear una key nueva. Copiá la key (solo se muestra una vez).

### 2. Instalar dependencias

```bash
cd mcp-server
npm install
```

### 3. Configurar en tu cliente MCP

Agregá la siguiente configuración al archivo de settings de tu cliente MCP:

```json
{
  "mcpServers": {
    "arbo-forms": {
      "command": "npx",
      "args": ["tsx", "/ruta/a/mcp-server/src/index.ts"],
      "env": {
        "ARBO_API_KEY": "arbo_tu_key_aqui",
        "ARBO_API_URL": "http://localhost:4000/api"
      }
    }
  }
}
```

### 4. Reiniciar el cliente MCP

Las tools aparecen automáticamente.

---

## Deploy en Render (SSE/HTTP)

Cuando la variable `PORT` está seteada, el servidor arranca en modo HTTP con SSE en lugar de stdio. Render la setea automáticamente.

### 1. Crear un nuevo Web Service en Render

- **Repository**: este repo
- **Root Directory**: `mcp-server`
- **Build Command**: `npm install`
- **Start Command**: `npx tsx src/index.ts`
- **Instance Type**: Free

### 2. Variables de entorno en Render

En el panel de Render → Environment, agregar:

| Variable | Valor |
|---|---|
| `ARBO_API_KEY` | Tu API key de Arbo |
| `ARBO_API_URL` | `https://tu-backend.onrender.com/api` |

> `PORT` es seteada automáticamente por Render — no la agregues manualmente.

### 3. Conectar desde tu cliente MCP

Una vez desplegado, la URL SSE es:

```
https://tu-mcp-server.onrender.com/sse
```

Configurá tu cliente MCP con esa URL (según soporte de tu cliente para MCP remoto).

---

## Tools disponibles

| Tool | Qué hace |
|---|---|
| `list_forms` | Lista todos tus formularios con sus campos |
| `get_form_schema` | Detalle del esquema de un formulario (campos, tipos) |
| `get_form_responses` | Todas las respuestas de un formulario (filas + columnas) |
| `analyze_responses` | Estadísticas por campo: distribución, top values, completion rate, min/max/avg |
| `search_responses` | Filtrar respuestas por valor de campo |
| `create_form` | Crear un nuevo formulario con campos |
| `update_form` | Actualizar título, descripción o campos de un formulario |
| `publish_form` | Publicar o despublicar un formulario |
| `delete_form` | Mover un formulario a la papelera |
| `analyze_forms_with_ai` | Análisis de respuestas con IA vía OpenRouter |
| `connection_status` | Verificar conexión al backend |

## Ejemplos de uso

```
> Listame todos mis formularios
> Analizá las respuestas del formulario 5
> Buscá en el formulario 3 las respuestas donde el email contenga "gmail"
> Creame un formulario de contacto con nombre, email y mensaje
> ¿Cuál es el campo con menor tasa de respuesta?
```

## Arquitectura

```
mcp-server/
  src/
    index.ts          ← MCP server (stdio o SSE según PORT)
    arbo-client.ts    ← HTTP client → backend API (via X-API-Key)
```

El servidor se comunica con el backend existente usando los endpoints `/api/api-keys/data/*` autenticados con la API key. No accede a la base de datos directamente.

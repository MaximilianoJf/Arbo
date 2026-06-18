# Arbo Forms MCP Server

Servidor MCP standalone que se conecta al backend de Arbo Forms y expone tools para consultar formularios, analizar respuestas y filtrar datos desde Claude Code u otro cliente MCP.

## Setup

### 1. Crear API Key

En tu app Arbo → sidebar → **API Keys** → crear una key nueva. Copiá la key (solo se muestra una vez).

### 2. Instalar dependencias

```bash
cd mcp-server
npm install
```

### 3. Configurar en Claude Code

Agregá a `~/.claude/settings.json` (o al settings del proyecto):

```json
{
  "mcpServers": {
    "arbo-forms": {
      "command": "npx",
      "args": ["tsx", "C:/Users/maxi1/Escritorio/fullstack_node_react_arbo/mcp-server/src/index.ts"],
      "env": {
        "ARBO_API_KEY": "arbo_tu_key_aqui",
        "ARBO_API_URL": "http://localhost:4000/api"
      }
    }
  }
}
```

### 4. Reiniciar Claude Code

Las tools aparecen automáticamente.

## Tools disponibles

| Tool | Qué hace |
|---|---|
| `list_forms` | Lista todos tus formularios con sus campos |
| `get_form_schema` | Detalle del esquema de un formulario (campos, tipos) |
| `get_form_responses` | Todas las respuestas de un formulario (filas + columnas) |
| `analyze_responses` | Estadísticas por campo: distribución, top values, completion rate, min/max/avg |
| `search_responses` | Filtrar respuestas por valor de campo |
| `connection_status` | Verificar conexión al backend |

## Ejemplos de uso en Claude Code

```
> Listame todos mis formularios
> Analizá las respuestas del formulario 5
> Buscá en el formulario 3 las respuestas donde el email contenga "gmail"
> Dame el esquema del formulario de contacto
```

## Arquitectura

```
mcp-server/
  src/
    index.ts          ← MCP server (stdio transport)
    arbo-client.ts    ← HTTP client → backend API (via X-API-Key)
```

El servidor se comunica con el backend existente usando los endpoints `/api/api-keys/data/*` autenticados con la API key. No accede a la base de datos directamente.

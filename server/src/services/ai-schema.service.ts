import { callOpenRouter } from "../utils/openrouter-call";

const SYSTEM_PROMPT = `Sos un experto en diseño de bases de datos relacionales y formularios web.

El usuario va a describir un dominio de datos en lenguaje natural. Tu tarea es diseñar:
1. Los formularios necesarios (equivalentes a tablas en una BD relacional)
2. Los campos de cada formulario (equivalentes a columnas)
3. Las relaciones entre formularios

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código markdown, con esta estructura exacta:
{
  "forms": [
    {
      "title": "string",
      "description": "string",
      "allowMultiple": true,
      "fields": [
        {
          "name": "nombre_snake_case",
          "label": "Etiqueta visible",
          "type": "text",
          "componentType": "DynamicTextField",
          "required": true,
          "options": []
        }
      ]
    }
  ],
  "relations": [
    {
      "parentForm": "Título del formulario padre",
      "childForm": "Título del formulario hijo",
      "type": "one_to_many"
    }
  ]
}

Tipos de componente disponibles:
- DynamicTextField → type: "text" o "email" o "tel"
- DynamicTextArea → type: "textarea"
- DynamicNumberField → type: "number"
- DynamicSelect → type: "select" (requiere options: ["op1", "op2"])
- DynamicRadioGroup → type: "radio" (requiere options: ["op1", "op2"])
- DynamicCheckbox → type: "checkbox"
- DynamicDateField → type: "date"

Tipos de relación disponibles:
- one_to_one → 1:1 exacto
- one_to_many → 1:N (padre tiene muchos hijos)
- zero_to_many → 0:N (hijo completamente opcional)
- one_to_zero → 1:0 (máximo un hijo opcional)
- many_to_many → N:M (requiere formulario puente — NO incluyas este tipo, el usuario lo configurará manualmente)

allowMultiple (MUY IMPORTANTE — pensá en cómo funciona el negocio):
- allowMultiple: true → un mismo usuario del proyecto (ej. un administrador) puede cargar MUCHOS registros en ese formulario. Usalo en formularios de tipo "registro / catálogo / tabla maestra" que se llenan repetidamente: clientes, mascotas, pacientes, productos, empleados, proveedores, turnos, ventas, etc. Casi todos los formularios "base" de un sistema de gestión son allowMultiple: true.
- allowMultiple: false → cada persona responde UNA sola vez. Usalo solo en formularios tipo encuesta pública, inscripción individual, o cuestionario único por persona.
- Regla práctica: si el dueño del negocio va a cargar varias filas de eso (como en una tabla de BD), poné true. Si es un formulario que responde el público una vez, poné false.
- Ejemplo veterinaria: "Usuario/Dueño" → true, "Mascota" → true (un dueño tiene varias), "Encuesta de satisfacción" → false.

Reglas estrictas:
- Incluí SIEMPRE el campo "allowMultiple" (true/false) en cada formulario, según la lógica del negocio descrita arriba.
- Nombres en snake_case, sin espacios ni caracteres especiales
- No incluyas campos "id", "created_at" ni timestamps (se generan automáticamente)
- Usá email para correos, number para cantidades/precios, date para fechas
- options debe ser array vacío [] cuando no aplica
- Máximo 7 formularios, máximo 10 campos por formulario
- Solo referenciá en relations formularios que existen en forms (por su title exacto)
- El JSON debe ser completo y sintácticamente válido`;

export interface GeneratedField {
    name: string;
    label: string;
    type: string;
    componentType: string;
    required: boolean;
    options: string[];
}

export interface GeneratedForm {
    title: string;
    description: string;
    allowMultiple: boolean;
    fields: GeneratedField[];
}

export interface GeneratedRelation {
    parentForm: string;
    childForm: string;
    type: string;
}

export interface GeneratedSchema {
    forms: GeneratedForm[];
    relations: GeneratedRelation[];
}

export const generateRelationalSchema = async (description: string): Promise<GeneratedSchema> => {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
    ];

    const result = await callOpenRouter(messages, { temperature: 0.3, max_tokens: 6000 });

    // Strip markdown code fences if present
    const raw = result.content.replace(/```(?:json)?\n?/g, "").trim();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("La IA no devolvió un esquema JSON válido.");

    let parsed: any;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch {
        throw new Error("El esquema generado no es un JSON válido.");
    }

    if (!Array.isArray(parsed.forms) || parsed.forms.length === 0) {
        throw new Error("La IA no generó ningún formulario.");
    }
    if (!Array.isArray(parsed.relations)) parsed.relations = [];

    // Normalise fields
    parsed.forms = parsed.forms.map((f: any) => ({
        title: String(f.title || "Sin título"),
        description: String(f.description || ""),
        // Default true: most forms in a management system are multi-record registries.
        allowMultiple: f.allowMultiple === undefined ? true : Boolean(f.allowMultiple),
        fields: (f.fields || []).map((field: any) => ({
            name: String(field.name || "campo"),
            label: String(field.label || field.name || "Campo"),
            type: String(field.type || "text"),
            componentType: String(field.componentType || "DynamicTextField"),
            required: Boolean(field.required),
            options: Array.isArray(field.options) ? field.options.map(String) : [],
        })),
    }));

    return parsed as GeneratedSchema;
};

import { callOpenRouter } from "../utils/openrouter-call";

const SYSTEM_PROMPT = `Eres un experto en diseño de bases de datos relacionales y formularios web.

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
      "accessMode": "public",
      "allowMultiple": true,
      "fields": [
        {
          "name": "nombre_snake_case",
          "label": "Etiqueta visible",
          "type": "text",
          "componentType": "DynamicTextField",
          "required": true,
          "unique": false,
          "defaultValue": "",
          "validations": [],
          "pattern": "",
          "patternMessage": "",
          "options": []
        }
      ]
    }
  ],
  "relations": [
    {
      "parentForm": "Título del formulario padre",
      "childForm": "Título del formulario hijo",
      "type": "one_to_many",
      "fkLabelField": "nombre_del_campo_del_padre_a_mostrar"
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

Constraints / restricciones por campo (pensá como columnas de una tabla SQL):
- required: true|false → NOT NULL / NULL. true = obligatorio (no nulo), false = opcional (nulo).
- unique: true|false → restricción UNIQUE. true = no se permiten dos registros con el mismo valor en ese campo. Usalo en identificadores naturales: email, DNI/RUT/cédula, código, SKU, matrícula, patente, nombre de categoría. El sistema rechaza el envío si el valor ya existe.
- defaultValue: "texto" → valor por defecto precargado (DEFAULT). Dejá "" si no aplica.
- validations: array con SOLO estas claves → ["required","email","text","positiveNumber","url","phone","rut","alphanumeric","noSpaces","minLength3","minLength8","maxLength50","maxLength100","maxLength255"]. Ej.: un correo → ["email"]; un teléfono → ["phone"]; un RUT/cédula → ["rut"].
- pattern + patternMessage → regex (sin barras) para validar formatos que NO cubren las validations. Ej.: patente "^[A-Z]{4}\\\\d{2}$" con patternMessage "Patente inválida". Dejá "" en ambos si no aplica.
- Reglas: emití SIEMPRE estas claves en cada campo (con "" o [] o false cuando no apliquen). unique implica casi siempre required:true. Un email lleva type:"email", validations:["email"]. Una clave natural única lleva unique:true.

Tipos de relación disponibles:
- one_to_one → 1:1 exacto
- one_to_many → 1:N (padre tiene muchos hijos)
- zero_to_many → 0:N (hijo completamente opcional)
- one_to_zero → 1:0 (máximo un hijo opcional)
- many_to_many → N:M (requiere formulario puente — NO incluyas este tipo, el usuario lo configurará manualmente)

FK (clave foránea entre formularios) — campo "fkLabelField" en cada relación:
- Cada relación padre→hijo se materializa con un combo box (FK) en el HIJO que permite elegir un registro del PADRE al cargar datos. Es el equivalente a una FOREIGN KEY.
- En "fkLabelField" poné el nombre (snake_case) del campo del PADRE que querés mostrar como etiqueta en ese combo (ej.: "nombre", "titulo", "email"). Si no estás seguro, omitilo o dejá "" y el sistema usa el primer dato del registro.
- El combo se crea automáticamente; no agregues vos un campo select manual para representar la FK.

accessMode (QUIÉN puede llenar cada formulario — MUY IMPORTANTE, pensá en quién lo carga):
- "owner" → SOLO el dueño del proyecto (o sus colaboradores) lo gestiona. NO se expone al público. Usalo en tablas maestras / catálogos / normalizaciones internas que el dueño cura: categorías, materias, tipos, estados, sucursales, productos, listas de referencia. Frases típicas: "yo gestiono las categorías", "tabla interna", "esto lo manejo yo", "normalización".
- "authed" → requiere INICIAR SESIÓN. Identifica a la persona con certeza (por su cuenta/email). Usalo cuando "el cliente accede con su email", "cada cliente responde lo suyo", "que sepa quién respondió", o cualquier flujo donde importa la identidad del que responde.
- "public" → cualquiera responde, sin login (anónimo). Encuestas abiertas, formularios de contacto, quejas públicas sin identificación.
- Regla práctica: catálogo que cura el dueño → "owner". Formulario que responde un cliente identificado → "authed". Formulario abierto al público → "public".

allowMultiple (CUÁNTAS veces puede responder la MISMA persona — combinалo con accessMode):
- allowMultiple: true → la misma cuenta puede cargar MUCHOS registros. Va casi siempre con accessMode "owner" (tablas maestras que el dueño llena fila por fila: clientes, mascotas, productos…). El dueño SIEMPRE puede cargar varias filas en sus catálogos.
- allowMultiple: false → cada persona responde UNA sola vez (el dueño queda exento: él puede cargar varias por ser propietario). Usalo cuando "cada cliente responde una sola vez", inscripción individual, o cuestionario único por persona.
- Ejemplo veterinaria: "Usuario/Dueño" → owner+true, "Mascota" → owner+true, "Encuesta de satisfacción" → public+false.

Relación entre "una vez" y el TIPO de relación (lo pidió explícitamente el usuario):
- En relaciones one_to_one (1:1) el hijo se responde UNA sola vez por cada padre → poné allowMultiple: false en ese hijo (el sistema bloquea un segundo envío del mismo cliente).
- En relaciones one_to_many (1:N) el padre puede tener MUCHOS hijos → allowMultiple: true en el hijo (sin restricción de cantidad).

EJEMPLO COMPLETO (tomado de un pedido real del usuario):
Pedido: "una base de datos donde yo gestiono las categorías, pero mando un formulario que solo el cliente con acceso por su email puede contestar UNA vez. Para mí (el propietario) se puede contestar varias veces. Que indique si ya lo contestó una vez para las de 1:1; las de 1:N no hay problema."
Diseño correcto:
- Form "Categorías": accessMode "owner", allowMultiple true (el dueño gestiona y carga varias).
- Form "Respuesta del cliente": accessMode "authed" (entra con su email/cuenta), allowMultiple false (cada cliente UNA vez; el dueño exento).
- Relación Categorías → Respuesta del cliente: one_to_many si una categoría agrupa muchas respuestas; one_to_one si cada cliente da una sola respuesta única (en cuyo caso el hijo va allowMultiple false).

Reglas estrictas:
- Incluí SIEMPRE "accessMode" ("owner" | "authed" | "public") y "allowMultiple" (true/false) en cada formulario, según la lógica del negocio descrita arriba.
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
    unique: boolean;
    defaultValue: string;
    validations: string[];
    pattern: string;
    patternMessage: string;
    options: string[];
}

export type FormAccessMode = "owner" | "authed" | "public";

export interface GeneratedForm {
    title: string;
    description: string;
    accessMode: FormAccessMode;
    allowMultiple: boolean;
    fields: GeneratedField[];
}

export interface GeneratedRelation {
    parentForm: string;
    childForm: string;
    type: string;
    fkLabelField?: string;
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
    const ACCESS_MODES = ["owner", "authed", "public"];
    parsed.forms = parsed.forms.map((f: any) => ({
        title: String(f.title || "Sin título"),
        description: String(f.description || ""),
        // Default "public": fall back to open access if the model omits / sends a bad value.
        accessMode: ACCESS_MODES.includes(f.accessMode) ? f.accessMode : "public",
        // Default true: most forms in a management system are multi-record registries.
        allowMultiple: f.allowMultiple === undefined ? true : Boolean(f.allowMultiple),
        fields: (f.fields || []).map((field: any) => ({
            name: String(field.name || "campo"),
            label: String(field.label || field.name || "Campo"),
            type: String(field.type || "text"),
            componentType: String(field.componentType || "DynamicTextField"),
            required: Boolean(field.required),
            unique: Boolean(field.unique),
            defaultValue: field.defaultValue == null ? "" : String(field.defaultValue),
            validations: Array.isArray(field.validations) ? field.validations.map(String) : [],
            pattern: field.pattern == null ? "" : String(field.pattern),
            patternMessage: field.patternMessage == null ? "" : String(field.patternMessage),
            options: Array.isArray(field.options) ? field.options.map(String) : [],
        })),
    }));

    // Normalise relations (keep only fkLabelField as a clean optional string)
    parsed.relations = (parsed.relations as any[]).map((r) => ({
        parentForm: String(r.parentForm || ""),
        childForm: String(r.childForm || ""),
        type: String(r.type || "one_to_many"),
        ...(r.fkLabelField ? { fkLabelField: String(r.fkLabelField) } : {}),
    })).filter((r) => r.parentForm && r.childForm);

    return parsed as GeneratedSchema;
};

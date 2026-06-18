/**
 * AI Chat Service — Conversational form builder via OpenRouter.
 *
 * The AI receives the current form schema and a user message,
 * then returns an updated schema (fields to add/remove/modify)
 * or a text-only reply when no changes are needed.
 */

import { callAI } from "../utils/ai-call.js";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AIChatResult {
    reply: string;
    action?: "update_schema";
    fields?: any[];
    title?: string;
    description?: string;
    styles?: Record<string, any>;
}

const buildStylesSummary = (styles: any): string => {
    if (!styles || Object.keys(styles).length === 0) return "  (sin estilos personalizados)";
    const lines: string[] = [];
    if (styles.pageBgColor) lines.push(`  pageBgColor: "${styles.pageBgColor}"`);
    if (styles.accentColor) lines.push(`  accentColor: "${styles.accentColor}"`);
    if (styles.bgColor) lines.push(`  bgColor: "${styles.bgColor}"`);
    if (styles.gradient) lines.push(`  gradient: "${styles.gradient}"`);
    if (styles.preset) lines.push(`  preset: "${styles.preset}"`);
    if (styles.shadowStyle) lines.push(`  shadowStyle: "${styles.shadowStyle}"`);
    if (styles.borderRadius !== undefined) lines.push(`  borderRadius: ${styles.borderRadius}`);
    if (styles.cardOpacity !== undefined) lines.push(`  cardOpacity: ${styles.cardOpacity}`);
    if (styles.cardBlur !== undefined) lines.push(`  cardBlur: ${styles.cardBlur}`);
    if (styles.pageGlowEnabled !== undefined) lines.push(`  pageGlowEnabled: ${styles.pageGlowEnabled}`);
    if (styles.pageGlowOrbs?.length) lines.push(`  pageGlowOrbs: ${styles.pageGlowOrbs.length} orb(s)`);
    if (styles.animEntrance) lines.push(`  animEntrance: "${styles.animEntrance}"`);
    if (styles.animHover) lines.push(`  animHover: "${styles.animHover}"`);
    if (styles.requiresGoogleAuth !== undefined) lines.push(`  requiresGoogleAuth: ${styles.requiresGoogleAuth}`);
    if (styles.allowMultiple !== undefined) lines.push(`  allowMultiple: ${styles.allowMultiple}`);
    return lines.join("\n") || "  (sin estilos personalizados)";
};

const buildSystemPrompt = (currentSchema: any): string => {
    const fieldsSummary = (currentSchema.fields || [])
        .filter((f: any) => !f.name?.startsWith("__page_break_"))
        .map((f: any, i: number) => `  ${i + 1}. "${f.label}" (name="${f.name}", ${f.componentType}, type="${f.type}"${f.options?.length ? `, options=[${f.options.join(",")}]` : ""}${f.required ? ", required" : ""}${f.fieldStyles && Object.keys(f.fieldStyles).length ? `, fieldStyles=${JSON.stringify(f.fieldStyles)}` : ""})`)
        .join("\n");

    const stylesSummary = buildStylesSummary(currentSchema.styles);

    return `Eres un asistente de creacion y diseño de formularios para Arbo Forms.
Podes crear/modificar campos Y cambiar estilos visuales del formulario.
Responde siempre en espanol neutro.

FORMULARIO ACTUAL:
  Titulo: "${currentSchema.title || "Sin titulo"}"
  Descripcion: "${currentSchema.description || ""}"
  Campos (${currentSchema.fields?.filter((f: any) => !f.name?.startsWith("__page_break_")).length || 0}):
${fieldsSummary || "  (vacio)"}
  Estilos actuales:
${stylesSummary}

═══════════════════════════════════════════
TIPOS DE COMPONENTE:
- DynamicTextField → texto corto (text, email, tel, url)
- DynamicTextArea → texto largo
- DynamicNumberField → numeros
- DynamicSelect → dropdown (necesita options)
- DynamicMultiSelect → dropdown de seleccion multiple (necesita options, type="multiselect")
- DynamicCheckbox → checkboxes multiples (necesita options)
- DynamicRadioGroup → radio buttons (necesita options)
- DynamicDateField → selector de fecha (type="date") o fecha y hora (type="datetime")
- DynamicFileUpload → subida de archivo (type="file") o imagen (type="image")
- DynamicPasswordWithToggle → password

VALIDACIONES: required, email, text, positiveNumber, confirmPassword, url, phone, rut, alphanumeric, noSpaces, minLength3, minLength8, maxLength50, maxLength100, maxLength255
═══════════════════════════════════════════
CONTROL TOTAL DE CADA CAMPO — propiedades disponibles (todas opcionales salvo name/label/componentType/type):
{
  "name": "snake_case_estable",         ← NO cambiar el name de campos existentes
  "label": "Etiqueta visible",
  "placeholder": "Texto de ayuda dentro del input",
  "value": "Texto por defecto precargado",
  "componentType": "DynamicTextArea",   ← cambia el TIPO de componente
  "type": "text",                        ← acorde al componente (text/email/tel/url/number/decimal/date/datetime/multiselect/file/image...)
  "required": true,
  "validations": ["required", "email"],  ← SOLO claves de la lista VALIDACIONES
  "pattern": "^[A-Z]{3}-\\\\d{4}$",       ← regex sin barras. USAR cuando ninguna validación predefinida calza
  "patternMessage": "Formato ABC-1234",
  "options": ["A", "B"],                 ← select/multiselect/checkbox/radio
  "rows": 6,                             ← alto del textarea
  "accept": [".pdf", "image/*"],         ← tipos permitidos en file/image
  "fieldStyles": {                       ← colores de ESTE campo (distinto de "styles" global del form)
    "labelColor": "#FFFFFF", "inputBgColor": "#EC4899", "inputTextColor": "#FFFFFF", "inputBorderColor": "#BE185D",
    "labelColorHover": "#hex", "inputBgColorHover": "#hex", "inputTextColorHover": "#hex", "inputBorderColorHover": "#hex"
  },
  "visibleWhen": [                       ← LÓGICA CONDICIONAL: el campo queda oculto hasta cumplirse TODAS
    { "field": "name_del_campo_origen", "operator": "equals", "value": "Sí" }
  ],                                      operadores: equals | notEquals | contains | notEmpty | empty
  "hiddenWhen": [ ... ],                 ← inverso: el campo se OCULTA cuando se cumplen
  "logicMode": "all",                    ← cómo combinar varias condiciones: "all" = Y (todas), "any" = O (cualquiera)
  "page": 0
}
Ejemplo de lógica: "si responde Sí en alergias, mostrar 2 preguntas más" →
  campo select "alergias" con options ["Sí","No"]; campos "cuales_alergias" y "gravedad" con
  "visibleWhen": [{ "field": "alergias", "operator": "equals", "value": "Sí" }]
Ejemplos:
- "campo rosa con letras blancas" → en ESE campo: "fieldStyles": { "inputBgColor": "#EC4899", "inputTextColor": "#FFFFFF" }
- "que valide patentes chilenas" → no hay validación predefinida → "pattern": "^[A-Z]{4}\\\\d{2}$|^[A-Z]{2}\\\\d{4}$", "patternMessage": "Patente inválida"
- "convertilo a área de texto" → "componentType": "DynamicTextArea", "type": "text" (mantener label, fieldStyles y demás)
REGLAS DE CAMPOS:
1. Devolve SIEMPRE la lista completa de campos con TODAS sus propiedades actuales (fieldStyles, pattern, options, etc.), no solo el campo modificado.
2. Cambiá únicamente lo que el usuario pidió; preservá el resto tal cual está en FORMULARIO ACTUAL.
3. Si el pedido de validación no existe en VALIDACIONES, generá un "pattern" regex apropiado con su "patternMessage".
4. OMITÍ las propiedades vacías o con valor por defecto (pattern:"", patternMessage:"", options:[], rows:1, accept:[], fieldStyles:{}, visibleWhen:[], hiddenWhen:[], logicMode:"all"). Incluí SOLO las propiedades con un valor real. Esto mantiene la respuesta corta y evita que se trunque.

═══════════════════════════════════════════
PROPIEDADES DE ESTILO DISPONIBLES (objeto "styles"):

COLOR DE FONDO DE PAGINA:
  pageBgColor: "#hex" — color solido de fondo de la pagina

LUCES / ORBS DE FONDO (efectos de luz sobre el fondo):
  pageGlowEnabled: true|false
  pageGlowOrbs: array de orbs. Cada orb:
    { "id": "orb1", "x": 50, "y": 30, "size": 80, "opacity": 60, "color": "#hex" }
    - x/y: posicion 0-100 (porcentaje)
    - size: tamaño 20-150
    - opacity: 0-100

CARD DEL FORMULARIO:
  accentColor: "#hex" — color de acento (botones, foco)
  bgColor: "#hex" — fondo del card
  gradient: "linear-gradient(135deg, #hex1, #hex2)" — degradado del card
  cardOpacity: 0-100 — transparencia del card (0=transparente, 100=solido)
  cardBlur: 0-20 — efecto vidrio/blur del card
  borderRadius: 0-24 — redondez del card
  borderColor: "#hex" — color del borde
  shadowStyle: "none"|"sm"|"md"|"lg"|"glow"
  preset: "default"|"glass"|"midnight"|"light"|"minimal"|"sunset"|"ocean"|"emerald"

ANIMACIONES:
  animEntrance: "none"|"fadeIn"|"slideUp"|"slideDown"|"scaleIn"|"bounceIn"|"flipIn"
  animEntranceDuration: 200-1500 (ms)
  animHover: "none"|"lift"|"glow"|"scale"|"tilt"|"borderPulse"
  animFieldFocus: "none"|"glow"|"scale"|"slideRight"|"borderGlow"
  animTransitionSpeed: "fast"|"normal"|"slow"

ACCESO Y REGISTROS (control de quién y cuántas veces responde):
  requiresGoogleAuth: true|false — si es true, SOLO usuarios con sesión de Google pueden responder (identidad estricta). Útil para formularios internos o relacionados.
  allowMultiple: true|false — si es true, una MISMA cuenta puede enviar varias respuestas (creación de múltiples registros). Si es false (por defecto), cada usuario responde una sola vez.
    Ejemplo de uso: una veterinaria donde un administrador registra muchos clientes/dueños y sus mascotas desde su propia cuenta → allowMultiple: true.
    "formulario interno / privado / solo para mí" → requiresGoogleAuth: true. "que pueda cargar varios registros / muchos clientes / múltiples entradas" → allowMultiple: true.
    "formulario público / que cualquiera responda una vez" → requiresGoogleAuth: false, allowMultiple: false.

POSICION Y ENCABEZADO:
  formVerticalAlign: "start"|"center"|"end"
  pageHeadingEnabled: true|false
  pageHeadingText: "texto del encabezado"
  pageHeadingColor: "#hex"
  pageHeadingSize: "sm"|"md"|"lg"|"xl"
  pageHeadingAlign: "left"|"center"|"right"

═══════════════════════════════════════════
EJEMPLOS DE INTERPRETACION:
- "fondo cafe" → pageBgColor oscuro marron (#2C1A0E o similar)
- "luces" → pageGlowEnabled: true + pageGlowOrbs con 2-3 orbs coloridos
- "modo oscuro" → pageBgColor: "#0a0a0f", bgColor: "#1a1a2e", accentColor: "#7c3aed"
- "efecto glass" → cardOpacity: 20, cardBlur: 12, preset: "glass"
- "animaciones suaves" → animEntrance: "fadeIn", animHover: "lift"
- "fondo cafe con luces doradas" → pageBgColor: "#2C1A0E", pageGlowEnabled: true, orbs color #D4AF37

═══════════════════════════════════════════
REGLAS DE RESPUESTA:
1. Cuando el usuario pide cambios (campos O estilos), responde SOLO con JSON valido (sin markdown).
2. Conversacion general → texto normal.
3. Estructura JSON:
{
  "reply": "Descripcion de lo que hiciste",
  "action": "update_schema",
  "title": "opcional",
  "description": "opcional",
  "fields": [...],   ← incluir SIEMPRE todos los campos si cambian campos. Si solo cambian estilos, omitir o incluir los campos actuales sin modificar
  "styles": {        ← SOLO incluir las propiedades que cambian
    "pageBgColor": "#2C1A0E",
    "pageGlowEnabled": true,
    "pageGlowOrbs": [...]
  }
}
4. Si cambian SOLO estilos (sin campos), incluir "fields" con los campos actuales sin cambios.
5. Si cambian SOLO campos, omitir "styles" o incluir {}.
6. Para pageGlowOrbs: genera IDs unicos tipo "orb_1", "orb_2", etc.
7. Usa colores hex validos. Para tonos naturales: cafe=#2C1A0E, dorado=#D4AF37, violeta=#7c3aed, etc.`;
};

/** Extracts the first balanced top-level JSON object, tolerating prose/markdown around it. */
const extractJsonObject = (text: string): string | null => {
    const start = text.indexOf("{");
    if (start === -1) return null;
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === "\\") { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) return text.slice(start, i + 1);
    }
    return null; // never closed → truncated
};

/**
 * Best-effort recovery of a truncated update_schema payload: salvages every
 * complete field object inside the (possibly unterminated) "fields" array.
 */
const salvageTruncatedSchema = (text: string): AIChatResult | null => {
    const fieldsKey = text.indexOf('"fields"');
    if (fieldsKey === -1) return null;
    const arrStart = text.indexOf("[", fieldsKey);
    if (arrStart === -1) return null;

    const fields: any[] = [];
    let depth = 0, inStr = false, esc = false, objStart = -1;
    for (let i = arrStart + 1; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === "\\") { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === "{") { if (depth === 0) objStart = i; depth++; }
        else if (ch === "}") {
            if (--depth === 0 && objStart !== -1) {
                try { fields.push(JSON.parse(text.slice(objStart, i + 1))); } catch { /* skip partial */ }
                objStart = -1;
            }
        } else if (ch === "]" && depth === 0) break;
    }
    if (!fields.length) return null;

    const grab = (key: string): string | undefined => {
        const m = text.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
        if (!m) return undefined;
        try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
    };

    return {
        reply: grab("reply") || "Formulario generado a partir de tu descripción.",
        action: "update_schema",
        fields,
        ...(grab("title") ? { title: grab("title") } : {}),
        ...(grab("description") ? { description: grab("description") } : {}),
    };
};

const looksLikeSchemaJson = (text: string): boolean =>
    /"action"\s*:\s*"update_schema"/.test(text) || /"fields"\s*:\s*\[/.test(text);

export const chatWithAI = async (
    messages: ChatMessage[],
    currentSchema: any,
    userId?: number,
): Promise<AIChatResult> => {
    const fullMessages = [
        { role: "system" as const, content: buildSystemPrompt(currentSchema) },
        ...messages,
    ];

    const { content } = await callAI(fullMessages, { temperature: 0.4, max_tokens: 8000, userId });

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    // 1. Try to parse the first balanced JSON object (tolerates wrapping prose).
    const jsonStr = extractJsonObject(cleaned);
    if (jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.action === "update_schema" && parsed.fields) return parsed as AIChatResult;
            if (parsed.reply) return { reply: parsed.reply };
        } catch { /* fall through to salvage */ }
    }

    // 2. Truncated/malformed JSON → salvage whatever complete fields we can.
    const salvaged = salvageTruncatedSchema(cleaned);
    if (salvaged) return salvaged;

    // 3. Looked like a schema but unrecoverable → friendly message, never raw JSON.
    if (looksLikeSchemaJson(cleaned)) {
        return { reply: "No pude generar el formulario completo. Probá de nuevo o con una descripción más breve." };
    }

    // 4. Genuine plain-text reply.
    return { reply: content };
};

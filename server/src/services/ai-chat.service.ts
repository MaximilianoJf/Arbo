/**
 * AI Chat Service — Conversational form builder via OpenRouter.
 *
 * The AI receives the current form schema and a user message,
 * then returns an updated schema (fields to add/remove/modify)
 * or a text-only reply when no changes are needed.
 */

import { callOpenRouter } from "../utils/openrouter-call.js";

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
    return lines.join("\n") || "  (sin estilos personalizados)";
};

const buildSystemPrompt = (currentSchema: any): string => {
    const fieldsSummary = (currentSchema.fields || [])
        .filter((f: any) => !f.name?.startsWith("__page_break_"))
        .map((f: any, i: number) => `  ${i + 1}. "${f.label}" (${f.componentType}, type="${f.type}"${f.options?.length ? `, options=[${f.options.join(",")}]` : ""}${f.required ? ", required" : ""})`)
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
- DynamicCheckbox → checkboxes multiples (necesita options)
- DynamicRadioGroup → radio buttons (necesita options)
- DynamicDateField → selector de fecha
- DynamicPasswordWithToggle → password

VALIDACIONES: required, email, text, positiveNumber, confirmPassword, url, minLength3, minLength8, maxLength50, maxLength100, maxLength255

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

export const chatWithAI = async (
    messages: ChatMessage[],
    currentSchema: any,
): Promise<AIChatResult> => {
    const fullMessages = [
        { role: "system" as const, content: buildSystemPrompt(currentSchema) },
        ...messages,
    ];

    const { content } = await callOpenRouter(fullMessages, { temperature: 0.4, max_tokens: 4000 });

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
        const parsed = JSON.parse(cleaned);
        if (parsed.action === "update_schema" && parsed.fields) {
            return parsed as AIChatResult;
        }
        if (parsed.reply) {
            return { reply: parsed.reply };
        }
    } catch {
        // Not JSON — plain text reply
    }

    return { reply: content };
};

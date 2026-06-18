/**
 * AI Form Scan Service — builds an Arbo form schema from a photo/scan of a form.
 *
 * Receives a base64 data-URL image, sends it to a vision-capable model
 * (trying several free OpenRouter vision models in order) and returns
 * the same update_schema payload the AI chat produces.
 */

import { callAI } from "../utils/ai-call.js";
import type { AIChatResult } from "./ai-chat.service.js";

const SCAN_SYSTEM_PROMPT = `Eres un escáner de formularios para Arbo Forms.
Recibes la FOTO de un formulario (en papel, PDF o pantalla) y debes reconstruirlo como schema digital.
Responde siempre en español neutro.

TIPOS DE COMPONENTE DISPONIBLES:
- DynamicTextField → texto corto (type: text, email, tel, url)
- DynamicTextArea → texto largo / comentarios / observaciones
- DynamicNumberField → números (edad, cantidad, DNI)
- DynamicSelect → dropdown (necesita options)
- DynamicMultiSelect → dropdown de selección múltiple (necesita options, type="multiselect")
- DynamicCheckbox → checkboxes múltiples (necesita options)
- DynamicRadioGroup → opciones excluyentes Sí/No o múltiples (necesita options)
- DynamicDateField → fechas (type="date") o fecha y hora (type="datetime")
- DynamicFileUpload → "adjuntar archivo/documento" (type="file") o "subir foto/imagen" (type="image")
- DynamicSignature → firma

VALIDACIONES: required, email, text, positiveNumber, url, phone, rut, alphanumeric, noSpaces, minLength3, minLength8, maxLength50, maxLength100, maxLength255
Si un campo exige un formato específico (ej: código, patente), podés agregar "pattern" (regex sin barras) y "patternMessage" al campo.

INSTRUCCIONES:
1. Lee TODOS los campos visibles en la imagen, en el orden en que aparecen.
2. Detecta el título y la descripción del formulario si existen.
3. Elige el componentType más apropiado para cada campo (una línea de escritura = TextField; recuadro grande = TextArea; casillas = Checkbox/RadioGroup; "Firma" = DynamicSignature).
4. Los campos marcados con *, "obligatorio" o "requerido" llevan required: true.
5. Genera "name" en snake_case a partir del label (ej: "Nombre completo" → "nombre_completo").

RESPONDE SOLO CON JSON VÁLIDO (sin markdown):
{
  "reply": "Resumen de lo que detectaste en la foto",
  "action": "update_schema",
  "title": "Título detectado",
  "description": "Descripción detectada (o vacío)",
  "fields": [
    { "name": "nombre_completo", "label": "Nombre completo", "componentType": "DynamicTextField", "type": "text", "placeholder": "", "required": true, "options": [], "validations": ["required"] }
  ]
}`;

export const scanFormImage = async (imageDataUrl: string, userId?: number): Promise<AIChatResult> => {
    // No system message: Gemma (vía Google AI Studio) rejects the system role.
    // The instructions travel in the same user message as the image.
    const messages = [
        {
            role: "user",
            content: [
                { type: "text", text: `${SCAN_SYSTEM_PROMPT}\n\nEscanea el formulario de la siguiente imagen y devuélveme SOLO el JSON.` },
                { type: "image_url", image_url: { url: imageDataUrl } },
            ],
        },
    ];

    // callAI detects the image content and routes it through the configured vision models
    // Generous max_tokens: vision models with thinking mode spend tokens on reasoning first
    const { content } = await callAI(messages, { temperature: 0.2, max_tokens: 8000, userId });

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    // Extract the outermost JSON object even if the model wrapped it in prose
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const jsonStr = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.action === "update_schema" && Array.isArray(parsed.fields) && parsed.fields.length > 0) {
            return parsed as AIChatResult;
        }
    } catch { /* not JSON */ }
    throw new Error("La IA no detectó campos en la imagen. Probá con una foto más nítida y de frente.");
};

/**
 * Power BI Project (.pbip) generation.
 *
 * Maps a form + its responses to a tabular model spec, asks the AI for a visual
 * plan, and zips a PBIP folder (built by pbip-builder). Pure domain logic — the
 * handler owns auth, access control and the HTTP response.
 */
import JSZip from "jszip";
import { callAI } from "../utils/ai-call.js";
import {
    buildPbipFiles,
    type PbiColumn,
    type PbiDataType,
    type PbiMeasure,
    type PbiVisual,
    type PbipSpec,
} from "../utils/pbip-builder.js";

const MAX_ROWS = 10000;

// Supported PBIR visual types (anything else from the AI is coerced/dropped)
const VISUAL_MAP: Record<string, string> = {
    card: "card",
    columnChart: "clusteredColumnChart",
    clusteredColumnChart: "clusteredColumnChart",
    barChart: "clusteredBarChart",
    clusteredBarChart: "clusteredBarChart",
    lineChart: "lineChart",
    pieChart: "pieChart",
    pie: "pieChart",
    donutChart: "donutChart",
    doughnut: "donutChart",
};

interface PbiField {
    name: string;
    label?: string;
    type?: string;
    componentType?: string;
    options?: any[];
    sortOrder?: number;
}

interface PbiResponse {
    answers: Record<string, any>;
    respondentName?: string | null;
    respondentEmail?: string | null;
    createdAt?: any;
}

export interface GeneratePowerBiInput {
    title: string;
    slug?: string;
    formId: number;
    fields: PbiField[];
    responses: PbiResponse[];
    diagnostic?: boolean;
    userId?: number;
}

/** Strip characters that break TMDL / DAX / M identifiers. */
const sanitizeName = (s: string, fallback: string): string => {
    const clean = (s || "").replace(/["'\[\]]/g, "").replace(/\s+/g, " ").trim();
    return clean || fallback;
};

/** Map a form field to a Power BI column data type. */
const fieldDataType = (field: PbiField): PbiDataType => {
    const comp = field.componentType || "";
    if (comp === "DynamicDateField" || field.type === "date") return "dateTime";
    if (comp === "DynamicNumberField" || field.type === "number") return "double";
    // A bare checkbox with no options is a single boolean
    if (comp === "DynamicCheckbox" && (!field.options || field.options.length === 0)) return "boolean";
    return "string";
};

/** Builds the full PBIP spec (columns, rows, measures, AI visuals) from a form. */
const buildSpec = async (input: GeneratePowerBiInput): Promise<PbipSpec> => {
    const { title, slug, formId, fields, responses, diagnostic, userId } = input;

    // ── Columns: metadata + one per field (dedupe names) ──
    const used = new Set<string>();
    const uniqueName = (base: string) => {
        let n = base, i = 2;
        while (used.has(n.toLowerCase())) n = `${base} ${i++}`;
        used.add(n.toLowerCase());
        return n;
    };

    const columns: PbiColumn[] = [];
    const colSources: { col: PbiColumn; fieldName?: string; meta?: "date" | "respondent" }[] = [];

    const fechaCol: PbiColumn = { name: uniqueName("Fecha de respuesta"), dataType: "dateTime", summarizeBy: "none" };
    columns.push(fechaCol); colSources.push({ col: fechaCol, meta: "date" });

    const respCol: PbiColumn = { name: uniqueName("Encuestado"), dataType: "string", summarizeBy: "none" };
    columns.push(respCol); colSources.push({ col: respCol, meta: "respondent" });

    for (const f of fields) {
        const dt = fieldDataType(f);
        const col: PbiColumn = {
            name: uniqueName(sanitizeName(f.label || f.name, f.name)),
            dataType: dt,
            summarizeBy: dt === "double" ? "sum" : "none",
        };
        columns.push(col);
        colSources.push({ col, fieldName: f.name });
    }

    // ── Rows ──
    const rows = responses.slice(0, MAX_ROWS).map((r) =>
        colSources.map(({ fieldName, meta }) => {
            if (meta === "date") return r.createdAt ?? null;
            if (meta === "respondent") return r.respondentName || r.respondentEmail || "Anónimo";
            const v = r.answers?.[fieldName!];
            return Array.isArray(v) ? v.join(", ") : (v ?? null);
        }),
    );

    // ── Measures: total + avg/sum per numeric column (safe, deterministic DAX) ──
    // Fixed, space-free table name keeps TMDL refs and PBIR Entity references safe.
    const table = "Respuestas";
    const ref = (name: string) => `'${table}'[${name.replace(/\]/g, "]]")}]`;
    const measures: PbiMeasure[] = [
        { name: "Total de respuestas", expression: `COUNTROWS('${table}')`, formatString: "#,0" },
    ];
    for (const c of columns) {
        if (c.dataType === "double") {
            measures.push({ name: `Promedio de ${c.name}`, expression: `AVERAGE(${ref(c.name)})`, formatString: "#,0.00" });
            measures.push({ name: `Suma de ${c.name}`, expression: `SUM(${ref(c.name)})`, formatString: "#,0.00" });
        }
    }

    // ── AI picks the visuals ──
    const categorical = columns.filter((c) => c.dataType === "string" || c.dataType === "dateTime").map((c) => c.name);
    const visuals = await planVisuals(title, responses.length, columns, measures, categorical, userId);

    return {
        name: sanitizeName(slug || title || `form-${formId}`, `form-${formId}`).replace(/\s+/g, "-").slice(0, 60),
        tableName: table,
        columns,
        rows,
        measures,
        visuals,
        diagnosticEmpty: diagnostic,
    };
};

/** Builds the PBIP project and returns a zip buffer + suggested filename. */
export const generatePowerBiZip = async (input: GeneratePowerBiInput): Promise<{ buffer: Buffer; filename: string }> => {
    const spec = await buildSpec(input);
    const files = buildPbipFiles(spec);
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) zip.file(path, content);
    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    return { buffer, filename: `${spec.name}-powerbi.zip` };
};

/** Asks the AI for a visual plan; falls back to a sensible default on any failure. */
async function planVisuals(
    title: string,
    count: number,
    columns: PbiColumn[],
    measures: PbiMeasure[],
    categorical: string[],
    userId?: number,
): Promise<PbiVisual[]> {
    const measureNames = measures.map((m) => m.name);
    const fallback = (): PbiVisual[] => {
        const out: PbiVisual[] = [{ type: "card", title: "Total de respuestas", measure: "Total de respuestas" }];
        for (const m of measures.slice(1, 3)) out.push({ type: "card", title: m.name, measure: m.name });
        categorical.slice(0, 5).forEach((c, i) =>
            out.push({ type: i % 2 === 0 ? "clusteredColumnChart" : "pieChart", title: `Respuestas por ${c}`, category: c, measure: "Total de respuestas" }));
        return out;
    };

    try {
        const prompt = `Formulario "${title}" con ${count} respuestas.
COLUMNAS disponibles (para eje/leyenda): ${JSON.stringify(columns.map((c) => ({ name: c.name, type: c.dataType })))}
MEDIDAS disponibles (para valores): ${JSON.stringify(measureNames)}

Diseñá un dashboard de Power BI. Devolvé SOLO JSON sin markdown:
{
  "visuals": [
    { "type": "card", "title": "...", "measure": "<nombre exacto de medida>" },
    { "type": "columnChart|barChart|pieChart|donutChart|lineChart", "title": "...", "category": "<nombre exacto de columna>", "measure": "<nombre exacto de medida>" }
  ]
}
Reglas:
- 2 a 4 "card" con las medidas más relevantes.
- pieChart/donutChart sólo para columnas con pocas categorías.
- lineChart sólo con columnas de fecha como category.
- barChart para categorías con nombres largos.
- Máximo 8 visuales. Usá exactamente los nombres dados.`;

        const result = await callAI(
            [
                { role: "system", content: "Sos un analista de BI. Devolvés SOLO JSON válido, sin texto extra." },
                { role: "user", content: prompt },
            ],
            { temperature: 0.2, max_tokens: 1500, userId },
        );

        const raw = result.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(raw);
        const colSet = new Set(columns.map((c) => c.name));
        const measureSet = new Set(measureNames);

        const visuals: PbiVisual[] = (parsed.visuals || [])
            .map((v: any) => ({
                type: VISUAL_MAP[v.type] || "clusteredColumnChart",
                title: String(v.title || ""),
                category: v.category && colSet.has(v.category) ? v.category : undefined,
                measure: measureSet.has(v.measure) ? v.measure : "Total de respuestas",
            }))
            // non-card visuals need a valid category
            .filter((v: PbiVisual) => v.type === "card" || !!v.category)
            .slice(0, 8);

        return visuals.length > 0 ? visuals : fallback();
    } catch {
        return fallback();
    }
}

/**
 * AI HTML dashboard generation.
 *
 * Aggregates form responses per field, asks the AI for a chart/KPI plan, and
 * renders a self-contained HTML dashboard (Chart.js via CDN). Pure domain logic
 * — no HTTP concerns; the handler owns auth, access control and the response.
 */
import { callAI } from "../utils/ai-call.js";

interface DashField {
    name: string;
    label?: string;
    type?: string;
    componentType?: string;
    options?: any[];
}

interface DashResponse {
    answers: Record<string, any>;
}

export interface GenerateDashboardInput {
    title: string;
    description?: string;
    fields: DashField[];
    responses: DashResponse[];
    prompt?: string;
    /** The dashboard the user designed (form.styles.dashboardLayout), used to seed the plan. */
    design?: { widgets?: any[]; accent?: string; title?: string };
    userId?: number;
}

/** Summarize the user-designed widgets so the AI mirrors those choices. */
const describeDesign = (design?: GenerateDashboardInput["design"]): string => {
    const widgets = design?.widgets;
    if (!Array.isArray(widgets) || widgets.length === 0) return "";
    const items = widgets
        .filter((w) => w.kind !== "title" && w.kind !== "text")
        .map((w) => {
            const parts = [`tipo=${w.kind}`];
            if (w.fieldName) parts.push(`campo=${w.fieldName}`);
            if (w.metric) parts.push(`métrica=${w.metric}`);
            if (w.title) parts.push(`título="${w.title}"`);
            return `  - ${parts.join(", ")}`;
        });
    if (items.length === 0) return "";
    return `\nEl usuario YA diseñó este dashboard. Respetá estos visuales (mismos campos/métricas/tipos) y, si tiene sentido, complementalos:\n${items.join("\n")}`;
};

// ─── Field aggregation ────────────────────────────────────────────────────────

const aggregateField = (field: DashField, responses: DashResponse[]) => {
    const vals = responses
        .map((r) => r.answers[field.name])
        .filter((v) => v !== null && v !== undefined && v !== "");

    const comp: string = field.componentType || "";

    if (comp === "DynamicSelect" || comp === "DynamicRadioGroup") {
        const counts: Record<string, number> = {};
        vals.forEach((v) => { const s = String(v); counts[s] = (counts[s] || 0) + 1; });
        return { type: "distribution", counts, answered: vals.length };
    }

    if (comp === "DynamicCheckbox" || comp === "DynamicMultiSelect") {
        const counts: Record<string, number> = {};
        vals.forEach((v) => {
            const parts = typeof v === "string"
                ? v.split(",").filter(Boolean)
                : Array.isArray(v) ? v : [String(v)];
            parts.forEach((p: string) => { const k = p.trim(); counts[k] = (counts[k] || 0) + 1; });
        });
        return { type: "distribution", counts, answered: vals.length };
    }

    if (comp === "DynamicDateField") {
        // Group by month
        const byMonth: Record<string, number> = {};
        vals.forEach((v) => {
            try {
                const d = new Date(String(v));
                if (!isNaN(d.getTime())) {
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    byMonth[key] = (byMonth[key] || 0) + 1;
                }
            } catch { /* skip */ }
        });
        return { type: "timeline", byMonth, answered: vals.length };
    }

    if (field.type === "number" || comp === "DynamicNumberField") {
        const nums = vals.map(Number).filter((n) => !isNaN(n));
        if (nums.length === 0) return { type: "empty", answered: 0 };
        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        return {
            type: "numeric",
            count: nums.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: Math.round((sum / nums.length) * 100) / 100,
            median: sorted[Math.floor(sorted.length / 2)],
        };
    }

    // Text / generic
    return {
        type: "text",
        answered: vals.length,
        sample: vals.slice(0, 8).map((v) => String(v).slice(0, 120)),
    };
};

// ─── Color palette generator ──────────────────────────────────────────────────

const PALETTE = [
    "#4ADE80", "#60A5FA", "#F472B6", "#FACC15", "#A78BFA",
    "#34D399", "#FB923C", "#38BDF8", "#E879F9", "#86EFAC",
];

const genColors = (n: number, _accent: string): string[] =>
    Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]);

// ─── HTML builder ─────────────────────────────────────────────────────────────

const buildHtml = (plan: any, formTitle: string): string => {
    const accent: string = plan.accentColor || "#4ADE80";
    const title: string = plan.title || `Dashboard: ${formTitle}`;
    const subtitle: string = plan.subtitle || "";
    const kpis: any[] = plan.kpis || [];
    const charts: any[] = plan.charts || [];
    const insights: string[] = plan.insights || [];
    const generatedAt = new Date().toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" });

    // KPI cards
    const kpisHtml = kpis.map((k) => `
      <div class="kpi">
        <span class="kpi-icon">${k.icon || "📊"}</span>
        <span class="kpi-value" style="color:${k.color || accent}">${k.value}</span>
        <span class="kpi-label">${k.label}</span>
      </div>`).join("");

    // Chart cards
    const chartsHtml = charts.map((c, i) => `
      <div class="chart-card ${charts.length === 1 ? "full" : ""}">
        <p class="chart-title">${c.title}</p>
        <div class="canvas-wrap"><canvas id="c${i}"></canvas></div>
      </div>`).join("");

    // Chart.js init scripts
    const scripts = charts.map((c, i) => {
        const isHoriz = c.type === "horizontalBar";
        const type = isHoriz ? "bar" : (c.type || "bar");
        const isPolar = type === "pie" || type === "doughnut";

        const datasetsJs = (c.datasets || []).map((ds: any) => {
            const colors = ds.colors || genColors(c.labels?.length || 1, accent);
            if (isPolar) {
                return `{label:${JSON.stringify(ds.label||"")},data:${JSON.stringify(ds.data||[])},backgroundColor:${JSON.stringify(colors)},borderColor:"rgba(255,255,255,0.08)",borderWidth:1}`;
            }
            const bg = colors.length === 1 ? JSON.stringify(colors[0]) : JSON.stringify(colors);
            return `{label:${JSON.stringify(ds.label||"")},data:${JSON.stringify(ds.data||[])},backgroundColor:${bg},borderRadius:6,borderSkipped:false}`;
        }).join(",");

        const scalesJs = isPolar ? "{}" : `{
            x:{grid:{color:"rgba(255,255,255,0.06)"},ticks:{color:"#8888a8"}},
            y:{grid:{color:"rgba(255,255,255,0.06)"},ticks:{color:"#8888a8"}}
        }`;

        return `new Chart(document.getElementById("c${i}"),{
          type:"${type}",
          data:{labels:${JSON.stringify(c.labels||[])},datasets:[${datasetsJs}]},
          options:{
            responsive:true,maintainAspectRatio:false,
            ${isHoriz ? `indexAxis:"y",` : ""}
            plugins:{
              legend:{display:${isPolar},labels:{color:"#a0a0c0",font:{size:11}}},
              tooltip:{backgroundColor:"#12121f",titleColor:"#e0e0f0",bodyColor:"#a0a0c0",borderColor:"${accent}55",borderWidth:1}
            },
            scales:${scalesJs}
          }
        });`;
    }).join("\n");

    const insightsHtml = insights.length > 0 ? `
      <section class="insights">
        <h2 class="section-heading">💡 Insights</h2>
        <ul>${insights.map((s) => `<li>${s}</li>`).join("")}</ul>
      </section>` : "";

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0c0c18;color:#d0d0e8;min-height:100vh;padding:2rem 1rem}
.dash{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:2rem}
header{display:flex;flex-direction:column;gap:.4rem;border-bottom:1px solid #ffffff10;padding-bottom:1.5rem}
.brand{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${accent};opacity:.7}
h1{font-size:1.75rem;font-weight:800;background:linear-gradient(135deg,#ffffff,${accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.subtitle{font-size:.95rem;color:#8888a8}
.meta{font-size:.7rem;color:#5555778;margin-top:.2rem}
/* KPIs */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem}
.kpi{background:linear-gradient(135deg,#14142a,#1a1a30);border:1px solid #ffffff10;border-radius:14px;padding:1.25rem 1rem;display:flex;flex-direction:column;align-items:center;gap:.35rem;text-align:center;transition:transform .2s}
.kpi:hover{transform:translateY(-2px)}
.kpi-icon{font-size:1.5rem}
.kpi-value{font-size:1.6rem;font-weight:800;line-height:1}
.kpi-label{font-size:.7rem;color:#8888a8;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
/* Charts */
.charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:1.25rem}
.chart-card{background:#12122080;border:1px solid #ffffff0f;border-radius:16px;padding:1.25rem;backdrop-filter:blur(8px)}
.chart-card.full{grid-column:1/-1}
.chart-title{font-size:.8rem;font-weight:700;color:#c0c0d8;margin-bottom:.75rem;letter-spacing:.04em;text-transform:uppercase}
.canvas-wrap{height:240px;position:relative}
/* Insights */
.insights{background:#14142a;border:1px solid ${accent}22;border-radius:16px;padding:1.5rem}
.section-heading{font-size:.85rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${accent};margin-bottom:1rem}
.insights ul{display:flex;flex-direction:column;gap:.6rem;padding-left:1.25rem}
.insights li{font-size:.9rem;color:#c0c0d8;line-height:1.5}
/* Footer */
footer{text-align:center;font-size:.7rem;color:#44445560;padding-top:1rem;border-top:1px solid #ffffff08}
footer strong{color:${accent};opacity:.7}
@media(max-width:600px){.charts{grid-template-columns:1fr}.chart-card.full{grid-column:auto}h1{font-size:1.3rem}}
</style>
</head>
<body>
<div class="dash">
  <header>
    <span class="brand">Arbo Forms · AI Dashboard</span>
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
    <span class="meta">Generado con IA · ${generatedAt}</span>
  </header>

  <section class="kpis">${kpisHtml}</section>

  <section class="charts">${chartsHtml}</section>

  ${insightsHtml}

  <footer>Generado automáticamente por <strong>Arbo Forms</strong></footer>
</div>
<script>${scripts}</script>
</body>
</html>`;
};

// ─── Orchestration ──────────────────────────────────────────────────────────────

/** Builds the AI dashboard plan and returns the rendered HTML. Throws on invalid AI output. */
export const generateDashboardHtml = async ({ title, description, fields, responses, prompt, design, userId }: GenerateDashboardInput): Promise<string> => {
    const aggregated = fields.map((f) => ({
        name: f.name,
        label: f.label || f.name,
        componentType: f.componentType,
        options: f.options || [],
        data: aggregateField(f, responses),
    }));

    const systemPrompt = `Sos un analista de datos que genera planes de dashboard en JSON puro.
Devolvés SOLO JSON válido sin markdown, sin texto extra, sin backticks.`;

    const userPrompt = `Formulario: "${title}" — ${responses.length} respuestas totales
${description ? `Descripción: ${description}` : ""}
${prompt ? `\nPETICIÓN DEL USUARIO: ${prompt}\nPriorizá lo que pide el usuario al elegir gráficos, KPIs e insights.` : ""}
${describeDesign(design)}

DATOS POR CAMPO:
${JSON.stringify(aggregated, null, 2)}

Generá un dashboard JSON con esta estructura exacta:
{
  "title": "título descriptivo",
  "subtitle": "subtítulo con el insight principal en una línea",
  "accentColor": "#color hex que represente el tema",
  "kpis": [
    { "label": "Total respuestas", "value": "${responses.length}", "icon": "📋", "color": "#4ADE80" },
    { "label": "...", "value": "...", "icon": "emoji", "color": "#hex" }
  ],
  "charts": [
    {
      "type": "bar|pie|doughnut|horizontalBar|line",
      "title": "título del gráfico",
      "labels": ["etiqueta1", "etiqueta2"],
      "datasets": [{ "label": "nombre", "data": [n1, n2], "colors": ["#hex1", "#hex2"] }]
    }
  ],
  "insights": ["observación 1", "observación 2", "observación 3"]
}

Reglas:
- pie/doughnut: campos de selección con ≤7 opciones
- bar: campos con muchas opciones o comparaciones
- horizontalBar: etiquetas largas
- line: datos de fecha/tiempo (usa byMonth como labels y counts como data)
- numeric: mostrá min/max/avg como KPIs o como anotación en el chart
- Máximo 8 gráficos, mínimo 2 KPIs adicionales al total
- Insights en español, accionables, basados en los datos reales
- Colores coherentes, paleta oscura y vibrante
- Saltá campos tipo text sin datos relevantes`;

    const aiResult = await callAI(
        [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        { temperature: 0.2, max_tokens: 3000, userId },
    );

    let plan: any;
    try {
        const raw = aiResult.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        plan = JSON.parse(raw);
    } catch {
        throw new Error("La IA no devolvió un JSON válido. Intentá de nuevo.");
    }

    return buildHtml(plan, title || "Formulario");
};

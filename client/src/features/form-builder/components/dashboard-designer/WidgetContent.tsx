// ─── Renders a single dashboard widget from real response data ───
// Used by both the editable canvas and the read-only view.

import type { DashWidget, DesignerField } from "./types";
import { DEFAULT_ACCENT } from "./types";
import { aggregateField, computeKpi, limitSeries, type ResponseLike } from "./aggregations";
import { BarChart, HBarChart, PieChart, LineChart } from "./DashboardCharts";

interface Props {
    widget: DashWidget;
    field?: DesignerField;
    responses: ResponseLike[];
}

const WidgetTitle = ({ widget, field }: { widget: DashWidget; field?: DesignerField }) => {
    const text = widget.title || field?.label || field?.name;
    if (!text) return null;
    return <p className="text-[11px] font-bold uppercase tracking-wider truncate mb-1.5" style={{ color: "#c0c0d8" }}>{text}</p>;
};

export const WidgetContent = ({ widget, field, responses }: Props) => {
    const accent = widget.color || DEFAULT_ACCENT;

    // ── Title / text ──
    if (widget.kind === "title") {
        return (
            <div className="w-full h-full flex items-center">
                <h2 className="text-lg font-extrabold truncate" style={{ background: `linear-gradient(135deg,#ffffff,${accent})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {widget.text || "Título"}
                </h2>
            </div>
        );
    }
    if (widget.kind === "text") {
        return <div className="w-full h-full flex items-center text-sm whitespace-pre-wrap break-words" style={{ color: "#c0c0d8" }}>{widget.text || "Texto"}</div>;
    }

    // ── KPI ──
    if (widget.kind === "kpi") {
        const { value, sub } = computeKpi(widget, field, responses);
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center gap-0.5">
                {widget.icon && <span className="text-xl leading-none">{widget.icon}</span>}
                <span className="text-3xl font-extrabold leading-none" style={{ color: accent }}>{value}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#8888a8" }}>
                    {widget.title || sub}
                </span>
            </div>
        );
    }

    // ── Data-bound visuals require a field ──
    if (!field) {
        return <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#8888a8" }}>Elegí un campo</div>;
    }

    const agg = aggregateField(field, responses);

    // ── Stats: numeric summary (sum / avg / min / max / count) ──
    if (widget.kind === "stats") {
        if (agg.type !== "numeric") {
            return (
                <div className="w-full h-full flex flex-col min-h-0">
                    <WidgetTitle widget={widget} field={field} />
                    <div className="flex-1 flex items-center justify-center text-xs" style={{ color: "#8888a8" }}>Elegí un campo numérico</div>
                </div>
            );
        }
        const cells: { label: string; value: number }[] = [
            { label: "Suma", value: agg.sum },
            { label: "Promedio", value: agg.avg },
            { label: "Mínimo", value: agg.min },
            { label: "Máximo", value: agg.max },
            { label: "Conteo", value: agg.count },
        ];
        const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
        return (
            <div className="w-full h-full flex flex-col min-h-0">
                <WidgetTitle widget={widget} field={field} />
                <div className="flex-1 grid gap-2 min-h-0" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))" }}>
                    {cells.map((c) => (
                        <div key={c.label} className="flex flex-col items-center justify-center rounded-lg px-1 py-1.5" style={{ background: "#ffffff08" }}>
                            <span className="text-base font-extrabold leading-none truncate max-w-full" style={{ color: accent }}>{fmt(c.value)}</span>
                            <span className="text-[9px] uppercase tracking-wider mt-1" style={{ color: "#8888a8" }}>{c.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ── Table ──
    if (widget.kind === "table") {
        if (agg.type === "distribution") {
            const { labels, values } = limitSeries(agg.labels, agg.values, widget.limit);
            const total = values.reduce((a, b) => a + b, 0) || 1;
            return (
                <div className="w-full h-full flex flex-col min-h-0">
                    <WidgetTitle widget={widget} field={field} />
                    <div className="flex-1 overflow-auto -mx-1">
                        <table className="w-full text-xs">
                            <tbody>
                                {labels.map((l, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-1 px-1 truncate" style={{ color: "#c0c0d8", maxWidth: 0 }}>{l}</td>
                                        <td className="py-1 px-1 text-right font-mono" style={{ color: accent }}>{values[i]}</td>
                                        <td className="py-1 px-1 text-right tabular-nums" style={{ color: "#8888a8" }}>{Math.round((values[i] / total) * 100)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
        if (agg.type === "text") {
            return (
                <div className="w-full h-full flex flex-col min-h-0">
                    <WidgetTitle widget={widget} field={field} />
                    <ul className="flex-1 overflow-auto flex flex-col gap-1">
                        {agg.samples.map((s, i) => (
                            <li key={i} className="text-xs truncate" style={{ color: "#a0a0c0" }}>• {s}</li>
                        ))}
                    </ul>
                </div>
            );
        }
        if (agg.type === "numeric") {
            const rows: [string, number][] = [["Promedio", agg.avg], ["Mínimo", agg.min], ["Máximo", agg.max], ["Suma", agg.sum], ["Mediana", agg.median]];
            return (
                <div className="w-full h-full flex flex-col min-h-0">
                    <WidgetTitle widget={widget} field={field} />
                    <table className="w-full text-xs">
                        <tbody>
                            {rows.map(([k, v]) => (
                                <tr key={k} className="border-b border-white/5">
                                    <td className="py-1 px-1" style={{ color: "#c0c0d8" }}>{k}</td>
                                    <td className="py-1 px-1 text-right font-mono" style={{ color: accent }}>{v.toLocaleString("es-AR")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#8888a8" }}>Sin datos</div>;
    }

    // ── Charts ──
    let labels: string[] = [];
    let values: number[] = [];
    if (agg.type === "distribution" || agg.type === "timeline") {
        ({ labels, values } = limitSeries(agg.labels, agg.values, widget.limit));
    } else if (agg.type === "numeric") {
        labels = ["Mín", "Prom", "Máx"];
        values = [agg.min, agg.avg, agg.max];
    }

    return (
        <div className="w-full h-full flex flex-col min-h-0">
            <WidgetTitle widget={widget} field={field} />
            <div className="flex-1 min-h-0">
                {widget.kind === "bar" && <BarChart labels={labels} values={values} accent={accent} showValues={widget.showValues} />}
                {widget.kind === "hbar" && <HBarChart labels={labels} values={values} accent={accent} showValues={widget.showValues} />}
                {widget.kind === "pie" && <PieChart labels={labels} values={values} accent={accent} showLegend={widget.showLegend} />}
                {widget.kind === "doughnut" && <PieChart labels={labels} values={values} accent={accent} doughnut showLegend={widget.showLegend} />}
                {widget.kind === "line" && <LineChart labels={labels} values={values} accent={accent} showValues={widget.showValues} />}
            </div>
        </div>
    );
};

// ─── Dependency-free SVG charts for the dashboard ───
// Compact, theme-aware renderers. They fill their container (100%/100%) and
// are used both in the live designer canvas and the read-only view.

import { PALETTE } from "./types";

const colorAt = (i: number, accent: string) => (i === 0 ? accent : PALETTE[i % PALETTE.length]);

const EmptyState = ({ msg = "Sin datos" }: { msg?: string }) => (
    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#8888a8" }}>
        {msg}
    </div>
);

// ─── Bar chart (vertical) ───
export const BarChart = ({ labels, values, accent, showValues }: { labels: string[]; values: number[]; accent: string; showValues?: boolean }) => {
    if (!values.length) return <EmptyState />;
    const max = Math.max(...values, 1);
    const W = 300, H = 160, padB = 26, padT = 14, gap = 6;
    const bw = (W - gap * (values.length + 1)) / values.length;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
            {values.map((v, i) => {
                const bh = ((H - padB - padT) * v) / max;
                const x = gap + i * (bw + gap);
                const y = H - padB - bh;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={bw} height={bh} rx={3} fill={colorAt(i, accent)} />
                        {showValues && <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize={9} fill="#c0c0d8">{v}</text>}
                        <text x={x + bw / 2} y={H - padB + 11} textAnchor="middle" fontSize={8} fill="#8888a8">
                            {(labels[i] || "").slice(0, 8)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

// ─── Horizontal bar chart ───
export const HBarChart = ({ labels, values, accent, showValues }: { labels: string[]; values: number[]; accent: string; showValues?: boolean }) => {
    if (!values.length) return <EmptyState />;
    const max = Math.max(...values, 1);
    const rowH = 22, gap = 6, labelW = 70, W = 300;
    const H = values.length * (rowH + gap) + gap;
    const barArea = W - labelW - 30;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            {values.map((v, i) => {
                const bw = (barArea * v) / max;
                const y = gap + i * (rowH + gap);
                return (
                    <g key={i}>
                        <text x={labelW - 4} y={y + rowH / 2 + 3} textAnchor="end" fontSize={9} fill="#a0a0c0">
                            {(labels[i] || "").slice(0, 11)}
                        </text>
                        <rect x={labelW} y={y} width={Math.max(bw, 1)} height={rowH} rx={3} fill={colorAt(i, accent)} />
                        {showValues && <text x={labelW + bw + 4} y={y + rowH / 2 + 3} fontSize={9} fill="#c0c0d8">{v}</text>}
                    </g>
                );
            })}
        </svg>
    );
};

// ─── Pie / doughnut ───
export const PieChart = ({ labels, values, accent, doughnut, showLegend }: { labels: string[]; values: number[]; accent: string; doughnut?: boolean; showLegend?: boolean }) => {
    const total = values.reduce((a, b) => a + b, 0);
    if (!total) return <EmptyState />;
    const cx = 80, cy = 80, r = 70, ir = doughnut ? 38 : 0;
    let angle = -Math.PI / 2;
    const arcs = values.map((v, i) => {
        const slice = (v / total) * Math.PI * 2;
        const a0 = angle, a1 = angle + slice;
        angle = a1;
        const large = slice > Math.PI ? 1 : 0;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        let d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
        if (ir > 0) {
            const ix0 = cx + ir * Math.cos(a0), iy0 = cy + ir * Math.sin(a0);
            const ix1 = cx + ir * Math.cos(a1), iy1 = cy + ir * Math.sin(a1);
            d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${large} 0 ${ix0} ${iy0} Z`;
        }
        return { d, color: colorAt(i, accent), pct: Math.round((v / total) * 100) };
    });
    return (
        <div className="w-full h-full flex items-center gap-2">
            <svg viewBox="0 0 160 160" height="100%" style={{ flexShrink: 0, maxWidth: showLegend ? "55%" : "100%" }} preserveAspectRatio="xMidYMid meet">
                {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} stroke="#12121f" strokeWidth={1} />)}
            </svg>
            {showLegend && (
                <div className="flex flex-col gap-1 min-w-0 overflow-hidden text-[10px]" style={{ color: "#a0a0c0" }}>
                    {labels.map((l, i) => (
                        <div key={i} className="flex items-center gap-1.5 min-w-0">
                            <span className="size-2 rounded-sm shrink-0" style={{ background: colorAt(i, accent) }} />
                            <span className="truncate">{l}</span>
                            <span className="ml-auto shrink-0 opacity-70">{arcs[i]?.pct}%</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Line chart ───
export const LineChart = ({ labels, values, accent, showValues }: { labels: string[]; values: number[]; accent: string; showValues?: boolean }) => {
    if (!values.length) return <EmptyState />;
    if (values.length === 1) return <BarChart labels={labels} values={values} accent={accent} showValues={showValues} />;
    const max = Math.max(...values, 1);
    const W = 300, H = 160, padB = 24, padT = 14, padL = 16, padR = 10;
    const stepX = (W - padL - padR) / (values.length - 1);
    const pts = values.map((v, i) => {
        const x = padL + i * stepX;
        const y = H - padB - ((H - padB - padT) * v) / max;
        return [x, y] as [number, number];
    });
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
    const area = `${path} L ${pts[pts.length - 1][0]} ${H - padB} L ${pts[0][0]} ${H - padB} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
            <path d={area} fill={accent} opacity={0.12} />
            <path d={path} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p[0]} cy={p[1]} r={2.5} fill={accent} />
                    {showValues && <text x={p[0]} y={p[1] - 5} textAnchor="middle" fontSize={8} fill="#c0c0d8">{values[i]}</text>}
                    <text x={p[0]} y={H - padB + 11} textAnchor="middle" fontSize={7} fill="#8888a8">{(labels[i] || "").slice(2)}</text>
                </g>
            ))}
        </svg>
    );
};

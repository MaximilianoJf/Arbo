/**
 * Builds a Power BI Project (PBIP) folder as an in-memory file map, using the
 * Enhanced Report Format (PBIR) for the report and TMDL for the semantic model.
 *
 * Formats and schema versions mirror what Power BI Desktop emits (validated
 * against Microsoft's public json-schemas and a real exported sample), so the
 * project opens directly in Power BI Desktop. Data is embedded inline in a
 * Power Query (M) partition — PBIP never ships a data cache, so on first open
 * the user clicks Refresh once to load it.
 *
 * NOTE: PBIR (the `definition/` report folder) may require the "Store reports
 * using enhanced metadata format (PBIR)" preview feature in older Desktop
 * builds. It is GA/default in recent versions.
 *
 * Returns a map of { "relative/path": "file contents" } ready to be zipped.
 */

export type PbiDataType = "string" | "int64" | "double" | "dateTime" | "boolean";

export interface PbiColumn {
    name: string;        // also the source/query property — must be stable
    dataType: PbiDataType;
    summarizeBy?: "none" | "sum";
}

export interface PbiMeasure {
    name: string;
    expression: string;  // DAX (single line)
    formatString?: string;
}

export interface PbiVisual {
    type: string;        // PBIR visualType (card, clusteredColumnChart, pieChart…)
    title: string;
    category?: string;   // column name (axis/legend)
    measure: string;     // measure name (value)
}

export interface PbipSpec {
    name: string;        // sanitized project name
    tableName: string;
    columns: PbiColumn[];
    rows: (string | number | boolean | null)[][];
    measures: PbiMeasure[];
    visuals: PbiVisual[];
    /** When true, generates an empty page (no visuals) for diagnostics. */
    diagnosticEmpty?: boolean;
}

/** 20-char hex id, the PBIR object-name convention. */
const objId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^a-f0-9]/g, "").slice(0, 20).padEnd(20, "0");

// ─── M (Power Query) ─────────────────────────────────────────────────────────

// M type used by Table.TransformColumnTypes (the form Power BI's "Enter Data" emits).
const M_TYPE: Record<PbiDataType, string> = {
    string: "type text",
    int64: "Int64.Type",
    double: "type number",
    dateTime: "type date",
    boolean: "type logical",
};

const mString = (s: string) => `"${s.replace(/"/g, '""').replace(/#\(/g, "#(0023)(")}"`;

const mCell = (value: any, dt: PbiDataType): string => {
    if (value === null || value === undefined || value === "") return "null";
    switch (dt) {
        case "boolean":
            return value === true || value === "true" || value === "1" ? "true" : "false";
        case "int64":
        case "double": {
            const n = Number(value);
            return Number.isFinite(n) ? String(n) : "null";
        }
        case "dateTime": {
            const d = new Date(value);
            if (isNaN(d.getTime())) return "null";
            return `#date(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()})`;
        }
        default:
            return mString(String(value));
    }
};

/**
 * Inline M, in the canonical "Enter Data" shape Power BI itself produces:
 *   #table({column names}, {rows}) then Table.TransformColumnTypes(...).
 * Avoids the fragile `type table [...]` ascription that broke parsing.
 */
const buildPartitionM = (spec: PbipSpec): string[] => {
    const names = spec.columns.map((c) => mString(c.name)).join(", ");
    const typePairs = spec.columns.map((c) => `{${mString(c.name)}, ${M_TYPE[c.dataType]}}`).join(", ");
    const rowLines = spec.rows.map((row, i) => {
        const cells = spec.columns.map((c, j) => mCell(row[j], c.dataType)).join(", ");
        const comma = i < spec.rows.length - 1 ? "," : "";
        return `            {${cells}}${comma}`;
    });
    return [
        "let",
        `    Source = #table({${names}}, {`,
        ...rowLines,
        "    }),",
        `    #"Tipos" = Table.TransformColumnTypes(Source, {${typePairs}})`,
        "in",
        '    #"Tipos"',
    ];
};

// ─── TMDL ─────────────────────────────────────────────────────────────────────

const TMDL_TYPE: Record<PbiDataType, string> = {
    string: "string",
    int64: "int64",
    double: "double",
    dateTime: "dateTime",
    boolean: "boolean",
};

/** Quote a TMDL identifier only when it isn't a simple word. */
const tmdlName = (name: string) => /^[A-Za-z_][\w]*$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`;

const tmdlColumn = (c: PbiColumn): string[] => [
    `\tcolumn ${tmdlName(c.name)}`,
    `\t\tdataType: ${TMDL_TYPE[c.dataType]}`,
    `\t\tsummarizeBy: ${c.summarizeBy ?? "none"}`,
    `\t\tsourceColumn: ${c.name}`,
    "",
    "\t\tannotation SummarizationSetBy = Automatic",
    "",
];

const tmdlMeasure = (m: PbiMeasure): string[] => {
    const lines = [`\tmeasure ${tmdlName(m.name)} = ${m.expression}`];
    if (m.formatString) lines.push(`\t\tformatString: ${m.formatString}`);
    lines.push("");
    return lines;
};

const buildTableTmdl = (spec: PbipSpec): string => {
    const mLines = buildPartitionM(spec).map((l) => `\t\t\t${l}`);
    return [
        `table ${tmdlName(spec.tableName)}`,
        "",
        ...spec.measures.flatMap(tmdlMeasure),
        ...spec.columns.flatMap(tmdlColumn),
        `\tpartition ${tmdlName(spec.tableName)} = m`,
        "\t\tmode: import",
        "\t\tsource = ```",
        ...mLines,
        "\t\t\t```",
        "",
    ].join("\n");
};

// ─── PBIR (report) ──────────────────────────────────────────────────────────

const projection = (table: string, prop: string, kind: "Column" | "Measure") => ({
    field: { [kind]: { Expression: { SourceRef: { Entity: table } }, Property: prop } },
    queryRef: `${table}.${prop}`,
    nativeQueryRef: prop,
});

/** Data roles per visual type. */
const buildQueryState = (table: string, v: PbiVisual) => {
    const value = projection(table, v.measure, "Measure");
    if (v.type === "card") return { Values: { projections: [value] } };
    const cat = v.category ? [projection(table, v.category, "Column")] : [];
    return { Category: { projections: cat }, Y: { projections: [value] } };
};

const buildVisualJson = (table: string, v: PbiVisual, name: string, x: number, y: number, w: number, h: number, z: number) =>
    JSON.stringify({
        $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/1.5.0/schema.json",
        name,
        position: { x, y, z, height: h, width: w, tabOrder: z },
        visual: {
            visualType: v.type,
            query: { queryState: buildQueryState(table, v) },
            objects: v.title
                ? { title: [{ properties: { text: { expr: { Literal: { Value: `'${v.title.replace(/'/g, "''")}'` } } }, show: { expr: { Literal: { Value: "true" } } } } }] }
                : {},
            drillFilterOtherVisuals: true,
        },
    }, null, 2);

// ─── Layout ───────────────────────────────────────────────────────────────────

const PAGE_W = 1280, PAGE_H = 720, PAD = 24;

const layoutVisuals = (visuals: PbiVisual[]) => {
    const cards = visuals.filter((v) => v.type === "card");
    const charts = visuals.filter((v) => v.type !== "card");
    const placed: { v: PbiVisual; x: number; y: number; w: number; h: number }[] = [];

    const cardH = 120;
    const cardW = cards.length ? Math.floor((PAGE_W - PAD * (cards.length + 1)) / cards.length) : 0;
    cards.forEach((v, i) => placed.push({ v, x: PAD + i * (cardW + PAD), y: PAD, w: cardW, h: cardH }));

    const top = cards.length ? PAD + cardH + PAD : PAD;
    const perRow = charts.length <= 1 ? 1 : charts.length <= 4 ? 2 : 3;
    const chartW = Math.floor((PAGE_W - PAD * (perRow + 1)) / perRow);
    const rows = Math.max(1, Math.ceil(charts.length / perRow));
    const chartH = Math.max(240, Math.floor((PAGE_H - top - PAD * (rows + 1)) / rows));
    charts.forEach((v, i) => {
        const col = i % perRow, row = Math.floor(i / perRow);
        placed.push({ v, x: PAD + col * (chartW + PAD), y: top + row * (chartH + PAD), w: chartW, h: chartH });
    });
    return placed;
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export const buildPbipFiles = (spec: PbipSpec): Record<string, string> => {
    const { name } = spec;
    const files: Record<string, string> = {};
    const tbl = tmdlName(spec.tableName);

    // Root pointer
    files[`${name}.pbip`] = JSON.stringify({
        version: "1.0",
        artifacts: [{ report: { path: `${name}.Report` } }],
        settings: { enableAutoRecovery: true },
    }, null, 2);

    // ── SemanticModel ──
    files[`${name}.SemanticModel/definition.pbism`] = JSON.stringify({ version: "4.1", settings: {} }, null, 2);
    files[`${name}.SemanticModel/definition/database.tmdl`] = "database\n\tcompatibilityLevel: 1567\n";
    files[`${name}.SemanticModel/definition/model.tmdl`] = [
        "model Model",
        "\tculture: es-ES",
        "\tdefaultPowerBIDataSourceVersion: powerBI_V3",
        "\tdiscourageImplicitMeasures",
        "\tsourceQueryCulture: es-ES",
        "",
        `annotation PBI_QueryOrder = ["${spec.tableName.replace(/"/g, '\\"')}"]`,
        "",
        `ref table ${tbl}`,
        "",
    ].join("\n");
    files[`${name}.SemanticModel/definition/tables/${spec.tableName}.tmdl`] = buildTableTmdl(spec);

    // ── Report (PBIR) ──
    files[`${name}.Report/definition.pbir`] = JSON.stringify({
        version: "4.0",
        datasetReference: { byPath: { path: `../${name}.SemanticModel` } },
    }, null, 2);

    files[`${name}.Report/definition/version.json`] = JSON.stringify({
        $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
        version: "2.0.0",
    }, null, 2);

    files[`${name}.Report/definition/report.json`] = JSON.stringify({
        $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/1.2.0/schema.json",
        layoutOptimization: "None",
        settings: { useStylableVisualContainerHeader: true, defaultDrillFilterOtherVisuals: true },
    }, null, 2);

    const pageName = objId();
    files[`${name}.Report/definition/pages/pages.json`] = JSON.stringify({
        $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json",
        pageOrder: [pageName],
        activePageName: pageName,
    }, null, 2);

    files[`${name}.Report/definition/pages/${pageName}/page.json`] = JSON.stringify({
        $schema: "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/1.3.0/schema.json",
        name: pageName,
        displayName: "Resumen",
        displayOption: "FitToPage",
        height: PAGE_H,
        width: PAGE_W,
    }, null, 2);

    if (!spec.diagnosticEmpty) {
        layoutVisuals(spec.visuals).forEach((p, i) => {
            const vName = objId();
            files[`${name}.Report/definition/pages/${pageName}/visuals/${vName}/visual.json`] =
                buildVisualJson(spec.tableName, p.v, vName, p.x, p.y, p.w, p.h, (i + 1) * 1000);
        });
    }

    return files;
};

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ReactFlow, Background, Controls, Handle, Position, ConnectionMode,
    useNodesState, applyNodeChanges,
    type Node, type Edge, type Connection, type NodeProps, type NodeChange, type IsValidConnection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Xmark, TrashBin } from "@gravity-ui/icons";
import type { ConditionOperator, FieldCondition, FormField } from "../../types";

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
    equals: "es igual a",
    notEquals: "es distinto de",
    contains: "incluye",
    notEmpty: "tiene respuesta",
    empty: "está vacío",
};

const SHOW_COLOR = "#4ADE80";
const HIDE_COLOR = "#EF4444";

type RuleKind = "visibleWhen" | "hiddenWhen";
interface EdgeRef { target: string; kind: RuleKind; index: number }

const condLabel = (c: FieldCondition, kind: RuleKind) =>
    `${kind === "visibleWhen" ? "mostrar si" : "ocultar si"} ${OPERATOR_LABELS[c.operator]}${c.operator !== "empty" && c.operator !== "notEmpty" ? ` "${c.value}"` : ""}`;

/** Field node: incoming connections on the left, outgoing on the right.
 *  Both handles accept multiple connections (N condiciones → un campo, y un campo → N campos). */
const FieldNode = ({ data }: NodeProps) => {
    const d = data as { label: string; sub: string; conditioned: boolean };
    const handleStyle = { width: 14, height: 14, border: "2px solid var(--arbo-surface)" };
    return (
        <div
            className="rounded-xl border px-3 py-2 min-w-44 max-w-56"
            style={{ background: "var(--arbo-surface-2)", borderColor: d.conditioned ? SHOW_COLOR : "var(--arbo-border)" }}
        >
            <Handle id="in" type="target" position={Position.Left} isConnectableStart isConnectableEnd
                style={{ ...handleStyle, background: "var(--arbo-text-muted)" }} />
            <p className="text-xs font-semibold truncate" style={{ color: "var(--arbo-text)" }}>{d.label}</p>
            <p className="text-[9px] font-mono truncate" style={{ color: "var(--arbo-text-muted)" }}>{d.sub}</p>
            {d.conditioned && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.15)", color: SHOW_COLOR }}>condicionado</span>
            )}
            <Handle id="out" type="source" position={Position.Right} isConnectableStart isConnectableEnd
                style={{ ...handleStyle, background: SHOW_COLOR }} />
        </div>
    );
};

const nodeTypes = { field: FieldNode };

interface LogicFlowEditorProps {
    fields: FormField[];
    onFieldsChange: (updater: (fields: FormField[]) => FormField[]) => void;
    /** Optional: notified with the currently selected node names (for "save as component"). */
    onSelectionChange?: (names: string[]) => void;
}

/**
 * Node-based logic editor (React Flow): drag from a field's right handle and
 * drop on another field to create a rule. Click an edge to edit the condition
 * (answer, operator and show/hide action) or delete it.
 */
export const LogicFlowEditor = ({ fields, onFieldsChange, onSelectionChange }: LogicFlowEditorProps) => {
    const [nodes, setNodes] = useNodesState<Node>([]);
    const [selectedEdge, setSelectedEdge] = useState<EdgeRef | null>(null);

    // Build/refresh nodes preserving user-dragged positions
    useEffect(() => {
        setNodes((prev) => {
            const posOf = new Map(prev.map((n) => [n.id, n.position]));
            return fields.map((f, i) => ({
                id: f.name,
                type: "field",
                position: posOf.get(f.name) ?? { x: (i % 2) * 280, y: Math.floor(i / 2) * 110 },
                data: {
                    label: f.label || f.name,
                    sub: `${f.componentType} · ${f.type}`,
                    conditioned: !!(f.visibleWhen?.length || f.hiddenWhen?.length),
                },
            }));
        });
    }, [fields, setNodes]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
        if (onSelectionChange) {
            setNodes((nds) => {
                onSelectionChange(nds.filter((n) => n.selected).map((n) => n.id));
                return nds;
            });
        }
    }, [setNodes, onSelectionChange]);

    // Edges derived from the rules
    const edges: Edge[] = useMemo(() => {
        const out: Edge[] = [];
        for (const f of fields) {
            (["visibleWhen", "hiddenWhen"] as RuleKind[]).forEach((kind) => {
                (f[kind] || []).forEach((c, index) => {
                    const color = kind === "visibleWhen" ? SHOW_COLOR : HIDE_COLOR;
                    const isSel = selectedEdge && selectedEdge.target === f.name && selectedEdge.kind === kind && selectedEdge.index === index;
                    out.push({
                        id: `${kind}:${f.name}:${index}`,
                        source: c.field,
                        sourceHandle: "out",
                        target: f.name,
                        targetHandle: "in",
                        label: condLabel(c, kind),
                        animated: !!isSel,
                        style: { stroke: color, strokeWidth: isSel ? 3 : 2 },
                        labelStyle: { fill: "var(--arbo-text)", fontSize: 9 },
                        labelBgStyle: { fill: "var(--arbo-surface-3)", fillOpacity: 0.9 },
                        labelBgPadding: [4, 2] as [number, number],
                        labelBgBorderRadius: 4,
                    });
                });
            });
        }
        return out;
    }, [fields, selectedEdge]);

    /** Anything goes except self-loops — multiple inputs/outputs per node are valid. */
    const isValidConnection: IsValidConnection = useCallback(
        (conn) => conn.source !== conn.target,
        []
    );

    const onConnect = useCallback((conn: Connection) => {
        if (!conn.source || !conn.target || conn.source === conn.target) return;
        let src = conn.source;
        let tgt = conn.target;
        // Dragged backwards (from "in" or to "out") → swap so arrow always means source→target
        if (conn.sourceHandle === "in" || conn.targetHandle === "out") {
            [src, tgt] = [tgt, src];
        }
        const source = fields.find((f) => f.name === src);
        const targetField = fields.find((f) => f.name === tgt);
        const cond: FieldCondition = source?.options?.length
            ? { field: src, operator: "equals", value: source.options[0] }
            : { field: src, operator: "notEmpty" };
        const newIndex = (targetField?.visibleWhen || []).length;
        onFieldsChange((prev) => prev.map((f) =>
            f.name === tgt ? { ...f, visibleWhen: [...(f.visibleWhen || []), cond] } : f
        ));
        setSelectedEdge({ target: tgt, kind: "visibleWhen", index: newIndex });
    }, [fields, onFieldsChange]);

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        const [kind, target, idx] = edge.id.split(":");
        setSelectedEdge({ target, kind: kind as RuleKind, index: Number(idx) });
    }, []);

    // --- Selected rule helpers ---
    const selTarget = selectedEdge ? fields.find((f) => f.name === selectedEdge.target) : null;
    const selCond = selectedEdge && selTarget ? (selTarget[selectedEdge.kind] || [])[selectedEdge.index] : null;
    const selSource = selCond ? fields.find((f) => f.name === selCond.field) : null;

    const updateRule = (patch: Partial<FieldCondition>, newKind?: RuleKind) => {
        if (!selectedEdge || !selCond) return;
        const { target, kind, index } = selectedEdge;
        onFieldsChange((prev) => prev.map((f) => {
            if (f.name !== target) return f;
            const updated: FieldCondition = { ...selCond, ...patch };
            if (newKind && newKind !== kind) {
                const fromList = (f[kind] || []).filter((_, i) => i !== index);
                const toList = [...(f[newKind] || []), updated];
                return { ...f, [kind]: fromList, [newKind]: toList };
            }
            return { ...f, [kind]: (f[kind] || []).map((c, i) => (i === index ? updated : c)) };
        }));
        if (newKind && newKind !== selectedEdge.kind) {
            const toLen = (selTarget?.[newKind] || []).length;
            setSelectedEdge({ target, kind: newKind, index: toLen });
        }
    };

    const deleteRule = () => {
        if (!selectedEdge) return;
        const { target, kind, index } = selectedEdge;
        onFieldsChange((prev) => prev.map((f) =>
            f.name === target ? { ...f, [kind]: (f[kind] || []).filter((_, i) => i !== index) } : f
        ));
        setSelectedEdge(null);
    };

    // Swap source↔target: remove rule from current target, add it on the old source
    const reverseRule = () => {
        if (!selectedEdge || !selCond || !selSource) return;
        const { target, kind, index } = selectedEdge;
        const newTarget = selCond.field;   // old source becomes the new target
        const newSource = target;           // old target becomes the new source
        const newCond: FieldCondition = selSource.options?.length
            ? { field: newSource, operator: "equals", value: selSource.options[0] }
            : { field: newSource, operator: "notEmpty" };
        onFieldsChange((prev) => prev.map((f) => {
            if (f.name === target) return { ...f, [kind]: (f[kind] || []).filter((_, i) => i !== index) };
            if (f.name === newTarget) return { ...f, visibleWhen: [...(f.visibleWhen || []), newCond] };
            return f;
        }));
        const newIndex = (fields.find((f) => f.name === newTarget)?.visibleWhen || []).length;
        setSelectedEdge({ target: newTarget, kind: "visibleWhen", index: newIndex });
    };

    return (
        <div className="relative w-full h-full" style={{ background: "var(--arbo-surface)" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                onPaneClick={() => setSelectedEdge(null)}
                isValidConnection={isValidConnection}
                connectionMode={ConnectionMode.Loose}
                connectionRadius={32}
                fitView
                proOptions={{ hideAttribution: true }}
                colorMode="dark"
                defaultEdgeOptions={{ type: "smoothstep" }}
            >
                <Background color="rgba(255,255,255,0.06)" gap={20} />
                <Controls showInteractive={false} />
            </ReactFlow>

            {/* Floating condition editor for the selected connection */}
            {selectedEdge && selCond && (
                <div className="absolute top-3 right-3 z-10 w-64 rounded-xl border shadow-xl p-3 flex flex-col gap-2"
                    style={{ background: "var(--arbo-surface-2)", borderColor: "var(--arbo-border)" }}>
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>Condición de la conexión</p>
                        <button onClick={() => setSelectedEdge(null)} className="p-0.5 rounded hover:bg-[var(--arbo-surface-3)]" style={{ color: "var(--arbo-text-muted)" }}>
                            <Xmark className="size-3.5" />
                        </button>
                    </div>

                    <p className="text-[11px]" style={{ color: "var(--arbo-text)" }}>
                        Si <strong style={{ color: SHOW_COLOR }}>{selSource?.label || selCond.field}</strong>…
                    </p>

                    {/* Operator */}
                    <select
                        value={selCond.operator}
                        onChange={(e) => updateRule({ operator: e.target.value as ConditionOperator })}
                        className="w-full px-2 py-1.5 rounded-md text-[11px] focus:outline-none"
                        style={{ background: "var(--arbo-surface-3)", border: "1px solid var(--arbo-border)", color: "var(--arbo-text)" }}
                    >
                        {Object.entries(OPERATOR_LABELS).map(([op, lbl]) => <option key={op} value={op}>{lbl}</option>)}
                    </select>

                    {/* Answer value */}
                    {selCond.operator !== "empty" && selCond.operator !== "notEmpty" && (
                        selSource?.options?.length ? (
                            <select
                                value={selCond.value ?? ""}
                                onChange={(e) => updateRule({ value: e.target.value })}
                                className="w-full px-2 py-1.5 rounded-md text-[11px] focus:outline-none"
                                style={{ background: "var(--arbo-surface-3)", border: "1px solid var(--arbo-border)", color: "var(--arbo-text)" }}
                            >
                                {selSource.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : (
                            <input
                                value={selCond.value ?? ""}
                                onChange={(e) => updateRule({ value: e.target.value })}
                                placeholder="respuesta esperada"
                                className="w-full px-2 py-1.5 rounded-md text-[11px] focus:outline-none"
                                style={{ background: "var(--arbo-surface-3)", border: "1px solid var(--arbo-border)", color: "var(--arbo-text)" }}
                            />
                        )
                    )}

                    {/* Action: show or hide the target */}
                    <div className="flex gap-1">
                        {([
                            { kind: "visibleWhen" as RuleKind, label: "Mostrar", color: SHOW_COLOR },
                            { kind: "hiddenWhen" as RuleKind, label: "Ocultar", color: HIDE_COLOR },
                        ]).map((a) => (
                            <button key={a.kind}
                                onClick={() => updateRule({}, a.kind)}
                                className="flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-opacity"
                                style={selectedEdge.kind === a.kind
                                    ? { background: a.color, color: "#0a0a0f" }
                                    : { background: "var(--arbo-surface-3)", color: "var(--arbo-text-muted)", border: "1px solid var(--arbo-border)" }}>
                                {a.label} "{selTarget?.label || selectedEdge.target}"
                            </button>
                        ))}
                    </div>

                    {/* Multiple incoming conditions: choose Y (todas) or O (cualquiera) */}
                    {((selTarget?.visibleWhen?.length || 0) + (selTarget?.hiddenWhen?.length || 0)) > 1 && (
                        <div className="flex flex-col gap-1 pt-1 border-t" style={{ borderColor: "var(--arbo-border)" }}>
                            <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--arbo-text-muted)" }}>
                                Este campo tiene varias condiciones — combinar con:
                            </p>
                            <div className="flex gap-1">
                                {([
                                    { mode: "all" as const, label: "Y (todas)" },
                                    { mode: "any" as const, label: "O (cualquiera)" },
                                ]).map((m) => {
                                    const active = (selTarget?.logicMode === "any" ? "any" : "all") === m.mode;
                                    return (
                                        <button key={m.mode}
                                            onClick={() => onFieldsChange((prev) => prev.map((f) =>
                                                f.name === selectedEdge.target ? { ...f, logicMode: m.mode } : f
                                            ))}
                                            className="flex-1 px-2 py-1 rounded-md text-[10px] font-semibold"
                                            style={active
                                                ? { background: "var(--arbo-accent)", color: "#0a0a0f" }
                                                : { background: "var(--arbo-surface-3)", color: "var(--arbo-text-muted)", border: "1px solid var(--arbo-border)" }}>
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Direction row: shows source→target and allows swapping */}
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px]"
                        style={{ background: "var(--arbo-surface-3)", border: "1px solid var(--arbo-border)" }}>
                        <span className="flex-1 truncate arbo-text-muted">
                            <strong className="arbo-text">{selSource?.label || selCond.field}</strong>
                            {" → "}
                            <strong className="arbo-text">{selTarget?.label || selectedEdge.target}</strong>
                        </span>
                        <button
                            onClick={reverseRule}
                            className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors hover:bg-[var(--arbo-surface-2)]"
                            style={{ color: "var(--arbo-accent)" }}
                            title="Invertir dirección de la conexión"
                        >
                            ⇄ Invertir
                        </button>
                    </div>

                    <button onClick={deleteRule}
                        className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium"
                        style={{ background: "var(--arbo-danger-muted)", color: "var(--arbo-danger)" }}>
                        <TrashBin className="size-3" /> Eliminar conexión
                    </button>
                </div>
            )}
        </div>
    );
};

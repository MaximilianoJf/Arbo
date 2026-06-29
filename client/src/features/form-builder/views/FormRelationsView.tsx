import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    ReactFlow, Background, Controls, Handle, Position, MarkerType,
    useNodesState, useEdgesState, addEdge,
    type Node, type Edge, type Connection, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, FloppyDisk, ArrowsRotateLeft, TrashBin, TriangleExclamation, Sparkles, Xmark, Eye } from "@gravity-ui/icons";
import { projectApi, formApi, type AIGeneratedSchema } from "@/services/api";
import { RelationInspector } from "../components/relations/RelationInspector";
import { REL_TYPE_META, pickDefaultKeyField, type FormLite, type RelationEdgeData } from "../components/relations/relation-meta";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { applyFieldMeta } from "@/core/form-engine/utils/field-meta";
import type { FormSchema, FormField, ComponentType } from "@/core/form-engine/types";

// ─── Node-based form relations, scoped to a project ───
// Connect forms and choose the cardinality (1:1, 1:N, N:M). An edge A → B means
// B's responses reference A's via parentResponseId. Relations persist to the
// backend; node positions are pure UI layout and stay in localStorage.

const storageKey = (projectId: number) => `arbo:form-relations:${projectId}`;
const DEFAULT_EDGE_DATA: RelationEdgeData = { type: "one_to_many", joinFormId: null, keyField: null };

// Styled edge for a relation, coloured/labelled by its cardinality type.
const makeRelationEdge = (parentFormId: number | string, childFormId: number | string, data: RelationEdgeData): Edge => {
    const meta = REL_TYPE_META[data.type];
    return {
        id: `e${parentFormId}-${childFormId}`,
        source: String(parentFormId),
        target: String(childFormId),
        animated: true,
        label: meta.short,
        labelStyle: { fill: meta.color, fontWeight: 700, fontSize: 11 },
        labelBgStyle: { fill: "var(--arbo-surface)" },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        style: { stroke: meta.color, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: meta.color },
        data,
    };
};

// ── Custom form node: title + its existing fields ──
const FormNode = ({ id, data }: NodeProps) => {
    const d = data as {
        title: string; sub: string; isRoot: boolean; allowMultiple?: boolean;
        fields: { name: string; label: string }[];
        onPreview?: (id: string) => void;
        onDelete?: (id: string) => void;
    };
    const handle = { width: 12, height: 12, border: "2px solid var(--arbo-surface)" };
    const shown = d.fields.slice(0, 5);
    return (
        <div className="rounded-xl border px-3 py-2.5 min-w-44 max-w-64"
            style={{ background: "var(--arbo-surface-2)", borderColor: d.isRoot ? "#4ADE80" : "var(--arbo-border)" }}>
            <Handle id="in" type="target" position={Position.Left} style={{ ...handle, background: "var(--arbo-text-muted)" }} />
            <div className="flex items-center gap-1.5">
                {d.isRoot && <span className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>base</span>}
                <p className="text-xs font-semibold truncate flex-1" style={{ color: "var(--arbo-text)" }}>{d.title}</p>
                {d.onPreview && (
                    <button
                        onClick={(e) => { e.stopPropagation(); d.onPreview!(id); }}
                        className="nodrag shrink-0 p-0.5 rounded hover:bg-[var(--arbo-surface-3)] transition-colors"
                        title="Vista previa"
                    >
                        <Eye className="size-3" style={{ color: "var(--arbo-text-muted)" }} />
                    </button>
                )}
                {d.onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); d.onDelete!(id); }}
                        className="nodrag shrink-0 p-1 rounded hover:bg-[var(--arbo-danger-muted)] transition-colors"
                        title="Eliminar formulario"
                    >
                        <TrashBin className="size-3.5 text-[var(--arbo-danger)]" />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[9px] font-mono truncate" style={{ color: "var(--arbo-text-muted)" }}>{d.sub}</p>
                {d.allowMultiple && (
                    <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-0.5"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#A855F7" }}
                        title="Múltiples registros: una misma cuenta puede cargar varias respuestas"
                    >
                        ∞ multi
                    </span>
                )}
            </div>
            {shown.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {shown.map((f) => (
                        <span key={f.name} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-text-secondary)" }}>
                            {f.label || f.name}
                        </span>
                    ))}
                    {d.fields.length > shown.length && (
                        <span className="text-[8px] px-1 arbo-text-muted">+{d.fields.length - shown.length}</span>
                    )}
                </div>
            )}
            <Handle id="out" type="source" position={Position.Right} style={{ ...handle, background: "#4ADE80" }} />
        </div>
    );
};

const nodeTypes = { form: FormNode };

const mapForms = (raw: any[]): FormLite[] =>
    (raw || []).map((f: any) => {
        const allFields = (f.fields || f.FormFields || [])
            .filter((ff: any) => !ff.name?.startsWith("__page_break_"));
        return {
            id: f.id,
            title: f.title,
            slug: f.slug,
            allowMultiple: !!f.styles?.allowMultiple,
            requiresParentChain: f.styles?.requiresParentChain !== false,
            requiresGoogleAuth: !!f.styles?.requiresGoogleAuth,
            uniqueFields: allFields
                .filter((ff: any) => ff.meta?.unique === true)
                .map((ff: any) => ({ name: ff.name, label: ff.label || ff.name })),
            fields: allFields.map((ff: any) => ({ name: ff.name, label: ff.label || ff.name })),
        };
    });

export const FormRelationsView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const projectId = Number(id);
    const [projectName, setProjectName] = useState("");
    const [forms, setForms] = useState<FormLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [creatingJoin, setCreatingJoin] = useState(false);
    const [creatingFk, setCreatingFk] = useState(false);
    const [fkMsg, setFkMsg] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);
    // form IDs (as strings) that already have at least one response — used to warn before edit.
    const [formsWithData, setFormsWithData] = useState<Set<string>>(new Set());
    const [confirmClear, setConfirmClear] = useState(false);
    // Shown when the user tries to draw a connection that creates a cycle (A→B and B→A).
    const [cycleWarn, setCycleWarn] = useState<{ a: string; b: string } | null>(null);
    const [cycleJoinFormId, setCycleJoinFormId] = useState<string>("");
    // AI schema generation panel
    const [aiOpen, setAiOpen] = useState(() => searchParams.get("ai") === "1");
    const [aiPrompt, setAiPrompt] = useState(() => searchParams.get("prompt") || "");
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiProgress, setAiProgress] = useState<string[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    // Form preview modal
    const [previewFormId, setPreviewFormId] = useState<string | null>(null);
    const [previewSchema, setPreviewSchema] = useState<FormSchema | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    // Form deletion confirm (the form id pending deletion)
    const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
    const [deletingForm, setDeletingForm] = useState(false);

    const requestDeleteForm = useCallback((formId: string) => setDeleteFormId(formId), []);

    const openPreview = useCallback(async (formId: string) => {
        setPreviewFormId(formId);
        setPreviewSchema(null);
        setPreviewLoading(true);
        try {
            const res = await formApi.getById(Number(formId));
            const f = res.data;
            const rawFields: any[] = f.FormFields || f.fields || [];
            const schema: FormSchema = {
                id: Number(f.id),
                title: f.title || "",
                description: f.description || "",
                slug: f.slug || "",
                fields: rawFields
                    .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((ff: any): FormField => ({
                        id: String(ff.id),
                        name: ff.name,
                        label: ff.label || "",
                        placeholder: ff.placeholder || "",
                        type: ff.type,
                        componentType: ff.componentType as ComponentType,
                        value: ff.defaultValue || "",
                        required: ff.required || false,
                        minLength: ff.minLength,
                        maxLength: ff.maxLength,
                        validate: ff.validations || [],
                        dependencies: ff.dependencies || [],
                        options: ff.options || [],
                        sortOrder: ff.sortOrder || 0,
                        page: ff.page ?? 0,
                        fieldStyles: ff.fieldStyles || undefined,
                        ...applyFieldMeta(ff),
                    })),
                styles: f.styles || undefined,
                onSubmit: f.onSubmit || undefined,
            };
            setPreviewSchema(schema);
        } catch {
            setPreviewSchema(null);
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    const nodeFromForm = useCallback((f: FormLite, pos: { x: number; y: number }): Node => ({
        id: String(f.id),
        type: "form",
        position: pos,
        data: { title: f.title, sub: `#${f.id}${f.slug ? " · " + f.slug : ""}`, isRoot: false, allowMultiple: f.allowMultiple, fields: f.fields, onPreview: openPreview, onDelete: requestDeleteForm },
    }), [openPreview, requestDeleteForm]);

    // Load the forms (with fields) + their persisted relations → build nodes/edges
    useEffect(() => {
        const load = async () => {
            try {
                const [projRes, relRes] = await Promise.all([
                    projectApi.getById(projectId),
                    projectApi.getRelations(projectId),
                ]);
                const proj = projRes.data;
                setProjectName(proj?.name || "");
                const list = mapForms(proj?.forms || proj?.userForms || proj?.UserForms || []);
                setForms(list);

                const savedPos: Record<string, { x: number; y: number }> =
                    JSON.parse(localStorage.getItem(storageKey(projectId)) || "null")?.positions || {};
                const validIds = new Set(list.map((f) => String(f.id)));

                setNodes(list.map((f, i) =>
                    nodeFromForm(f, savedPos[String(f.id)] || { x: 60 + (i % 3) * 260, y: 60 + Math.floor(i / 3) * 170 })
                ));

                const validRelations = (relRes.data || [])
                    .filter((r) => validIds.has(String(r.parentFormId)) && validIds.has(String(r.childFormId)));
                const edgesFromRelations = validRelations.map((r) =>
                    makeRelationEdge(r.parentFormId, r.childFormId, {
                        type: r.type || "one_to_many",
                        joinFormId: r.joinFormId ?? null,
                        keyField: r.keyField ?? null,
                    })
                );
                setEdges(edgesFromRelations);

                // Check which child forms already have responses so we can warn before edits.
                const childIds = [...new Set(validRelations.map((r) => r.childFormId))];
                const counts = await Promise.all(
                    childIds.map((cid) =>
                        formApi.getResponseCount(cid).then((r) => ({ id: String(cid), count: r.data.count })).catch(() => ({ id: String(cid), count: 0 }))
                    )
                );
                setFormsWithData(new Set(counts.filter((c) => c.count > 0).map((c) => c.id)));
            } catch {
                navigate("/form-builder/projects");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [projectId, navigate, setNodes, setEdges, nodeFromForm]);

    // Highlight forms that are a parent of someone
    useEffect(() => {
        const parents = new Set(edges.map((e) => e.source));
        setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, isRoot: parents.has(n.id) } })));
    }, [edges, setNodes]);

    const onConnect = useCallback((c: Connection) => {
        if (!c.source || !c.target) return;
        const isSelfRef = c.source === c.target;
        // Block cycles: if the reverse edge already exists, this would create A↔B (use N:M instead).
        // For self-refs, "reverse" is the same edge — just block duplicates.
        const reverseExists = !isSelfRef && edges.some((e) => e.source === c.target && e.target === c.source);
        const forwardExists = edges.some((e) => e.source === c.source && e.target === c.target);
        if (reverseExists || forwardExists) {
            setCycleWarn({ a: c.source, b: c.target });
            return;
        }
        const src = forms.find((f) => String(f.id) === c.source);
        const tgt = forms.find((f) => String(f.id) === c.target);
        const keyField = src && tgt ? pickDefaultKeyField(src, tgt) : null;
        const edge = makeRelationEdge(c.source, c.target, { ...DEFAULT_EDGE_DATA, keyField });
        setEdges((eds) => addEdge(edge, eds));
        setSelectedEdgeId(edge.id);
        setSaved(false);
    }, [setEdges, forms]);

    const updateEdgeData = useCallback((edgeId: string, patch: Partial<RelationEdgeData>) => {
        setEdges((eds) => eds.map((e) => {
            if (e.id !== edgeId) return e;
            const data = { ...(e.data as RelationEdgeData), ...patch };
            return makeRelationEdge(e.source, e.target, data);
        }));
        setSaved(false);
    }, [setEdges]);

    const deleteEdge = useCallback((edgeId: string) => {
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        setSelectedEdgeId(null);
        setSaved(false);
    }, [setEdges]);

    // Move a form to the trash, then drop its node + any connections touching it.
    const confirmDeleteForm = useCallback(async () => {
        if (!deleteFormId || deletingForm) return;
        setDeletingForm(true);
        setSaveErr(null);
        try {
            await formApi.delete(Number(deleteFormId));
            setNodes((ns) => ns.filter((n) => n.id !== deleteFormId));
            setEdges((eds) => eds.filter((e) => e.source !== deleteFormId && e.target !== deleteFormId));
            setForms((prev) => prev.filter((f) => String(f.id) !== deleteFormId));
            if (selectedEdgeId && !edges.find((e) => e.id === selectedEdgeId)) setSelectedEdgeId(null);
            setDeleteFormId(null);
        } catch (e: any) {
            setSaveErr(e.message || "No se pudo eliminar el formulario");
        } finally {
            setDeletingForm(false);
        }
    }, [deleteFormId, deletingForm, setNodes, setEdges, selectedEdgeId, edges]);

    const formById = useMemo(() => new Map(forms.map((f) => [String(f.id), f])), [forms]);

    // Create a blank bridge form in this project and attach it to the selected edge.
    const createJoinForm = useCallback(async (edge: Edge) => {
        if (creatingJoin) return;
        setCreatingJoin(true);
        setSaveErr(null);
        try {
            const a = formById.get(edge.source)?.title || "A";
            const b = formById.get(edge.target)?.title || "B";
            const res = await formApi.create({ title: `Puente: ${a} ↔ ${b}`, description: "", fields: [], projectId, onSubmit: "SaveToDB" });
            const nf = res.data;
            const lite: FormLite = { id: nf.id, title: nf.title, slug: nf.slug, fields: [] };
            setForms((prev) => [...prev, lite]);
            setNodes((ns) => [...ns, nodeFromForm(lite, { x: 60 + (ns.length % 3) * 260, y: 60 + Math.floor(ns.length / 3) * 170 })]);
            updateEdgeData(edge.id, { joinFormId: nf.id });
        } catch (e: any) {
            setSaveErr(e.message || "No se pudo crear el formulario puente");
        } finally {
            setCreatingJoin(false);
        }
    }, [creatingJoin, formById, projectId, setNodes, nodeFromForm, updateEdgeData]);

    // Materialize a parent→child relation as a real FK select field inside the child form.
    // Re-saves the child's full field list (meta included) so nothing is lost, plus the new combo box.
    const createFkField = useCallback(async (parentId: number, childId: number, parentTitle: string, labelField?: string) => {
        if (creatingFk) return;
        setCreatingFk(true);
        setSaveErr(null);
        setFkMsg(null);
        try {
            const res = await formApi.getById(childId);
            const f = res.data;
            const raw: any[] = (f.FormFields || f.fields || []).slice()
                .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            if (raw.some((ff) => ff.meta?.optionsSource?.formId === parentId)) {
                setFkMsg(`"${f.title}" ya tiene un campo que referencia a ${parentTitle}.`);
                return;
            }
            const toPayload = (ff: any) => ({
                name: ff.name, label: ff.label, placeholder: ff.placeholder, type: ff.type,
                componentType: ff.componentType, defaultValue: ff.defaultValue ?? "",
                required: !!ff.required, minLength: ff.minLength, maxLength: ff.maxLength,
                sortOrder: ff.sortOrder ?? 0, page: ff.page ?? 0,
                validations: ff.validations || [], dependencies: ff.dependencies || [],
                options: ff.options || [], fieldStyles: ff.fieldStyles || null, meta: ff.meta ?? null,
            });
            const isSelfRef = parentId === childId;
            const fkField = {
                name: `fk_${parentId}_${Date.now().toString(36)}`,
                label: isSelfRef ? `Padre (${parentTitle})` : parentTitle,
                placeholder: "",
                type: "select",
                componentType: "DynamicSelect",
                defaultValue: "",
                required: false,
                sortOrder: raw.length,
                page: 0,
                validations: [],
                dependencies: [],
                options: [],
                fieldStyles: null,
                meta: { optionsSource: { formId: parentId, formTitle: parentTitle, ...(labelField ? { labelField } : {}) } },
            };
            await formApi.update(childId, { title: f.title, fields: [...raw.map(toPayload), fkField] });
            // Reflect the new field on the child node chip.
            const chip = { name: fkField.name, label: parentTitle };
            setForms((prev) => prev.map((x) => x.id === childId ? { ...x, fields: [...x.fields, chip] } : x));
            setNodes((ns) => ns.map((n) => n.id === String(childId)
                ? { ...n, data: { ...n.data, fields: [...((n.data as any).fields || []), chip] } }
                : n));
            setFkMsg(`Combo box "${parentTitle}" agregado en ${f.title}.`);
        } catch (e: any) {
            setSaveErr(e.message || "No se pudo crear el campo de selección");
        } finally {
            setCreatingFk(false);
        }
    }, [creatingFk, setNodes]);

    const relations = useMemo(() =>
        edges.map((e) => {
            const d = (e.data as RelationEdgeData) || DEFAULT_EDGE_DATA;
            return {
                edgeId: e.id,
                parentFormId: Number(e.source),
                childFormId: Number(e.target),
                parent: formById.get(e.source)?.title || e.source,
                child: formById.get(e.target)?.title || e.target,
                type: d.type,
                joinFormId: d.joinFormId,
                keyField: d.keyField,
            };
        }), [edges, formById]);

    const handleSave = async () => {
        if (saving) return;
        const positions: Record<string, { x: number; y: number }> = {};
        nodes.forEach((n) => { positions[n.id] = n.position; });
        localStorage.setItem(storageKey(projectId), JSON.stringify({ positions }));

        setSaving(true);
        setSaveErr(null);
        try {
            await projectApi.saveRelations(projectId, relations.map((r) => ({
                parentFormId: r.parentFormId,
                childFormId: r.childFormId,
                type: r.type,
                joinFormId: r.joinFormId,
                keyField: r.keyField,
            })));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e: any) {
            setSaveErr(e.message || "No se pudieron guardar las relaciones");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateSchema = async () => {
        if (!aiPrompt.trim() || aiGenerating) return;
        setAiGenerating(true);
        setAiError(null);
        setAiProgress(["Consultando IA..."]);

        try {
            const res = await projectApi.generateSchema(projectId, aiPrompt.trim());
            const schema: AIGeneratedSchema = res.data;

            setAiProgress(["Esquema generado. Creando formularios..."]);

            // Map from AI title → created form id
            const titleToId = new Map<string, number>();

            for (const genForm of schema.forms) {
                setAiProgress((p) => [...p, `Creando "${genForm.title}"…`]);
                const fieldPayload = genForm.fields.map((f, i) => {
                    // pattern / patternMessage / unique round-trip through the JSONB meta column.
                    const meta: Record<string, any> = {};
                    if (f.pattern) meta.pattern = f.pattern;
                    if (f.patternMessage) meta.patternMessage = f.patternMessage;
                    if (f.unique) meta.unique = true;
                    return {
                        name: f.name,
                        label: f.label,
                        type: f.type,
                        componentType: f.componentType,
                        required: f.required,
                        defaultValue: f.defaultValue || "",
                        validations: f.validations || [],
                        options: f.options,
                        sortOrder: i,
                        page: 0,
                        meta: Object.keys(meta).length ? meta : null,
                    };
                });
                // Map the AI's accessMode to the styles flags. accessMode is stored verbatim
                // for the upcoming access-control phase; today "owner"/"authed" already
                // translate to requiresGoogleAuth (login) which IS enforced server-side.
                const accessMode = genForm.accessMode || "public";
                const genStyles: Record<string, any> = { accessMode };
                if (accessMode === "authed" || accessMode === "owner") genStyles.requiresGoogleAuth = true;
                if (genForm.allowMultiple) genStyles.allowMultiple = true;
                const created = await formApi.create({
                    title: genForm.title,
                    description: genForm.description,
                    fields: fieldPayload,
                    projectId,
                    onSubmit: "SaveToDB",
                    styles: genStyles,
                });
                const newForm: FormLite = {
                    id: created.data.id,
                    title: created.data.title,
                    slug: created.data.slug,
                    allowMultiple: !!genForm.allowMultiple,
                    fields: fieldPayload.map((f) => ({ name: f.name, label: f.label })),
                };
                titleToId.set(genForm.title, created.data.id);

                setForms((prev) => [...prev, newForm]);
                setNodes((ns) => [
                    ...ns,
                    nodeFromForm(newForm, {
                        x: 60 + (ns.length % 3) * 280,
                        y: 60 + Math.floor(ns.length / 3) * 180,
                    }),
                ]);
            }

            setAiProgress((p) => [...p, "Conectando relaciones…"]);

            const newEdges: Edge[] = [];
            for (const rel of schema.relations) {
                const srcId = titleToId.get(rel.parentForm);
                const tgtId = titleToId.get(rel.childForm);
                if (!srcId || !tgtId) continue;
                const edge = makeRelationEdge(srcId, tgtId, {
                    type: (rel.type as any) || "one_to_many",
                    joinFormId: null,
                    keyField: null,
                });
                newEdges.push(edge);
            }
            setEdges((eds) => [...eds, ...newEdges]);
            setSaved(false);

            // Materialize each relation as an FK combo box in the child form (the FOREIGN KEY).
            // Runs after every form exists so titleToId resolves; reuses the tested createFkField
            // (dedups + updates node chips). Non-fatal per relation — the combo can be added later.
            let fkCount = 0;
            if (newEdges.length) {
                setAiProgress((p) => [...p, "Creando claves foráneas (combos)…"]);
                for (const rel of schema.relations) {
                    const srcId = titleToId.get(rel.parentForm);
                    const tgtId = titleToId.get(rel.childForm);
                    if (!srcId || !tgtId) continue;
                    try {
                        await createFkField(srcId, tgtId, rel.parentForm, rel.fkLabelField || undefined);
                        fkCount++;
                    } catch { /* leave the FK for the user to add manually from the inspector */ }
                }
            }

            setAiProgress((p) => [...p, `✓ Listo — ${schema.forms.length} formularios, ${newEdges.length} relaciones y ${fkCount} combos FK creados.`]);
            setAiPrompt("");
        } catch (e: any) {
            const raw: string = e.message || "";
            const friendly = raw.includes("API key") || raw.includes("Configurá")
                ? "No hay una API key de OpenRouter configurada. Andá a Configuración → OpenRouter."
                : raw.includes("Todos los modelos") || raw.includes("No response")
                ? "Ningún modelo pudo responder. Intentá de nuevo en unos segundos o reformulá la descripción."
                : raw || "Error al generar el esquema.";
            setAiError(friendly);
        } finally {
            setAiGenerating(false);
        }
    };

    const clearHasData = edges.some((e) => formsWithData.has(e.target));

    const handleClear = () => {
        if (clearHasData && !confirmClear) { setConfirmClear(true); return; }
        setEdges([]); setSelectedEdgeId(null); setSaved(false); setConfirmClear(false);
    };

    const selectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;
    const selSource = selectedEdge ? formById.get(selectedEdge.source) : null;
    const selTarget = selectedEdge ? formById.get(selectedEdge.target) : null;

    if (loading) return <div className="flex items-center justify-center py-20"><div className="arbo-spinner" /></div>;

    return (
        <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
            <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => navigate(`/form-builder/projects/${projectId}`)} className="p-2 rounded-lg hover:bg-[var(--arbo-surface-2)] arbo-text-secondary transition-colors shrink-0">
                    <ArrowLeft className="size-5" />
                </button>
                <div className="flex-1 min-w-[180px]">
                    <h1 className="text-lg font-bold arbo-text">Conexiones — {projectName}</h1>
                    <p className="text-sm arbo-text-muted">Arrastrá del punto derecho de un formulario al de otro para conectarlos. Tocá una conexión para elegir el tipo (1:1, 1:N, N:M).</p>
                </div>
                {/* Actions wrap to their own row on narrow screens so nothing gets cut off. */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {confirmClear ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/30">
                            <TriangleExclamation className="size-3.5 text-[var(--arbo-danger)] shrink-0" />
                            <span className="text-xs text-[var(--arbo-danger)]">¿Borrar todas las conexiones? Hay datos vinculados.</span>
                            <button onClick={handleClear} className="text-xs font-semibold text-[var(--arbo-danger)] hover:opacity-80 ml-1">Sí</button>
                            <button onClick={() => setConfirmClear(false)} className="text-xs arbo-text-muted hover:arbo-text">Cancelar</button>
                        </div>
                    ) : (
                        <button onClick={handleClear} className="arbo-btn arbo-btn-ghost text-xs py-1.5 px-3">
                            <ArrowsRotateLeft className="size-3.5" /> Limpiar
                        </button>
                    )}
                    <button
                        onClick={() => { setAiOpen((v) => !v); setAiError(null); setAiProgress([]); }}
                        className={`arbo-btn text-xs py-1.5 px-3 gap-1.5 transition-colors ${aiOpen ? "arbo-btn-secondary" : "arbo-btn-ghost"}`}
                    >
                        <Sparkles className="size-3.5" /> Generar con IA
                    </button>
                    <button onClick={handleSave} disabled={saving} className="arbo-btn arbo-btn-primary text-xs py-1.5 px-3 disabled:opacity-50 ml-auto sm:ml-0">
                        <FloppyDisk className="size-3.5" /> {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
                    </button>
                </div>
            </div>

            {saveErr && (
                <p className="text-sm text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-3 py-2 rounded-lg">{saveErr}</p>
            )}
            {fkMsg && (
                <p className="text-sm text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] px-3 py-2 rounded-lg">{fkMsg}</p>
            )}

            {/* ── AI generation panel ── */}
            {aiOpen && (
                <div className="rounded-xl border border-[var(--arbo-border)] bg-[var(--arbo-surface-2)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--arbo-border)] bg-gradient-to-r from-[var(--arbo-accent)]/5 to-transparent">
                        <Sparkles className="size-4 text-[var(--arbo-accent)]" />
                        <p className="text-sm font-semibold arbo-text flex-1">Generar base de datos relacional con IA</p>
                        <button onClick={() => { setAiOpen(false); searchParams.delete("ai"); searchParams.delete("prompt"); setSearchParams(searchParams, { replace: true }); }} className="p-1 rounded arbo-text-muted hover:arbo-text transition-colors">
                            <Xmark className="size-4" />
                        </button>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                        <p className="text-xs arbo-text-muted leading-relaxed">
                            Describí tu sistema en lenguaje natural. La IA creará los formularios con sus campos y los conectará automáticamente en el canvas.
                        </p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            disabled={aiGenerating}
                            placeholder="Ej: Quiero una base de datos para una clínica con pacientes, médicos, turnos y diagnósticos. Los pacientes pueden tener muchos turnos, cada turno pertenece a un médico..."
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted resize-none focus:border-[var(--arbo-accent)] focus:outline-none disabled:opacity-50"
                            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerateSchema(); }}
                        />

                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] arbo-text-muted">Ctrl/Cmd + Enter para generar</p>
                            <button
                                onClick={handleGenerateSchema}
                                disabled={!aiPrompt.trim() || aiGenerating}
                                className="arbo-btn arbo-btn-primary text-xs py-1.5 px-4 disabled:opacity-50 gap-1.5"
                            >
                                <Sparkles className="size-3.5" />
                                {aiGenerating ? "Generando…" : "Generar"}
                            </button>
                        </div>

                        {/* Progress log */}
                        {aiProgress.length > 0 && (
                            <div className="rounded-lg bg-[var(--arbo-surface)] border border-[var(--arbo-border)] p-3 flex flex-col gap-1">
                                {aiProgress.map((msg, i) => (
                                    <p key={i} className={`text-xs font-mono ${msg.startsWith("✓") ? "text-[var(--arbo-accent)]" : "arbo-text-muted"}`}>
                                        {msg}
                                    </p>
                                ))}
                                {aiGenerating && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="arbo-spinner size-3" />
                                        <span className="text-xs arbo-text-muted">Procesando…</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {aiError && (
                            <p className="text-xs text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-3 py-2 rounded-lg">{aiError}</p>
                        )}
                    </div>
                </div>
            )}

            {cycleWarn && (() => {
                const nameA = formById.get(cycleWarn.a)?.title || cycleWarn.a;
                const nameB = formById.get(cycleWarn.b)?.title || cycleWarn.b;
                const pivotCandidates = forms.filter(
                    (f) => String(f.id) !== cycleWarn.a && String(f.id) !== cycleWarn.b
                );
                const canConfirm = !!cycleJoinFormId;
                return (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <TriangleExclamation className="size-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div>
                                <p className="text-sm font-semibold text-amber-400">Relación circular detectada</p>
                                <p className="text-xs text-amber-400/80 mt-0.5 leading-snug">
                                    Ya existe una conexión entre <span className="font-medium">{nameA}</span> y <span className="font-medium">{nameB}</span>.
                                    En bases de datos relacionales esto requiere una <span className="font-medium">tabla pivote</span> (N:M).
                                    ¿Qué formulario querés usar como pivote?
                                </p>
                            </div>

                            {pivotCandidates.length === 0 ? (
                                <p className="text-xs text-amber-400/60 italic">
                                    No hay formularios disponibles para usar como pivote. Creá uno primero desde "Mis Formularios".
                                </p>
                            ) : (
                                <select
                                    value={cycleJoinFormId}
                                    onChange={(e) => setCycleJoinFormId(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-md bg-[var(--arbo-surface-2)] text-xs border border-amber-500/30 text-amber-300 focus:border-amber-500 focus:outline-none"
                                >
                                    <option value="">— Elegí un formulario pivote —</option>
                                    {pivotCandidates.map((f) => (
                                        <option key={f.id} value={String(f.id)}>{f.title}</option>
                                    ))}
                                </select>
                            )}

                            <div className="flex gap-2">
                                <button
                                    disabled={!canConfirm}
                                    onClick={() => {
                                        setEdges((eds) => eds.filter((e) =>
                                            !(e.source === cycleWarn.a && e.target === cycleWarn.b) &&
                                            !(e.source === cycleWarn.b && e.target === cycleWarn.a)
                                        ));
                                        const nmEdge = makeRelationEdge(cycleWarn.a, cycleWarn.b, {
                                            type: "many_to_many",
                                            joinFormId: Number(cycleJoinFormId),
                                            keyField: null,
                                        });
                                        setEdges((eds) => [...eds, nmEdge]);
                                        setSelectedEdgeId(nmEdge.id);
                                        setSaved(false);
                                        setCycleWarn(null);
                                        setCycleJoinFormId("");
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Sí, convertir a N:M
                                </button>
                                <button
                                    onClick={() => { setCycleWarn(null); setCycleJoinFormId(""); }}
                                    className="text-xs px-3 py-1.5 rounded-lg text-amber-400/60 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                                >
                                    No, cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                {/* Canvas */}
                <div className="arbo-panel flex-1 min-w-0 w-full h-[60vh] lg:h-[70vh]">
                    {forms.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm arbo-text-muted">No tenés formularios para conectar.</div>
                    ) : (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
                            onPaneClick={() => setSelectedEdgeId(null)}
                            nodeTypes={nodeTypes}
                            fitView
                            proOptions={{ hideAttribution: true }}
                        >
                            <Background color="var(--arbo-border)" gap={20} />
                            <Controls />
                        </ReactFlow>
                    )}
                </div>

                {/* Right panel: inspector when a connection is selected, else the list.
                    Stacks under the canvas on tablet/mobile (< lg). */}
                <div className="arbo-panel w-full lg:w-80 lg:shrink-0 flex flex-col max-h-[70vh]">
                    {selectedEdge && selSource && selTarget ? (
                        <>
                            <div className="arbo-panel-header flex items-center justify-between">
                                <span>Configurar conexión</span>
                                <button onClick={() => setSelectedEdgeId(null)} className="text-xs arbo-text-muted hover:arbo-text">✕</button>
                            </div>
                            <RelationInspector
                                source={selSource}
                                target={selTarget}
                                data={(selectedEdge.data as RelationEdgeData) || DEFAULT_EDGE_DATA}
                                forms={forms}
                                creatingJoin={creatingJoin}
                                creatingFk={creatingFk}
                                hasData={formsWithData.has(selectedEdge.target)}
                                onChange={(patch) => updateEdgeData(selectedEdge.id, patch)}
                                onCreateJoinForm={() => createJoinForm(selectedEdge)}
                                onCreateFkField={(labelField) => createFkField(Number(selectedEdge.source), Number(selectedEdge.target), selSource.title, labelField)}
                                onDelete={() => deleteEdge(selectedEdge.id)}
                                onPatchTargetStyles={(patch) => {
                                    const targetId = Number(selectedEdge.target);
                                    return formApi.patchStyles(targetId, patch)
                                        .then(() => setForms((prev) => prev.map((f) => f.id === targetId ? { ...f, ...patch } : f)))
                                        .catch((e) => { setSaveErr(e?.message || "No se pudo guardar la restricción"); });
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <div className="arbo-panel-header flex items-center justify-between">
                                <span>Conexiones</span>
                                <span className="arbo-badge arbo-badge-success">{relations.length}</span>
                            </div>
                            <div className="p-3 flex flex-col gap-2 overflow-y-auto">
                                {relations.length === 0 ? (
                                    <p className="text-xs arbo-text-muted">Conectá dos formularios arrastrando del punto verde (derecha) al punto del otro.</p>
                                ) : (
                                    relations.map((r) => {
                                        const meta = REL_TYPE_META[r.type];
                                        const joinTitle = r.joinFormId ? formById.get(String(r.joinFormId))?.title : null;
                                        return (
                                            <button
                                                key={r.edgeId}
                                                onClick={() => setSelectedEdgeId(r.edgeId)}
                                                className="text-left flex flex-col gap-1 p-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] hover:border-[var(--arbo-accent)]/40 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="font-semibold arbo-text truncate">{r.parent}</span>
                                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.short}</span>
                                                    <span className="arbo-text-secondary truncate">{r.child}</span>
                                                    <TrashBin
                                                        className="size-3.5 ml-auto shrink-0 arbo-text-muted hover:text-[var(--arbo-danger)]"
                                                        onClick={(e) => { e.stopPropagation(); deleteEdge(r.edgeId); }}
                                                    />
                                                </div>
                                                {r.type === "many_to_many" && (
                                                    <span className="text-[10px] arbo-text-muted">
                                                        Puente: {joinTitle || <span className="text-[var(--arbo-warning)]">sin asignar</span>}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                                {relations.length > 0 && (
                                    <p className="text-[10px] arbo-text-muted mt-1">Tocá una conexión para configurar su tipo y campos.</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Delete form confirm modal ── */}
            {deleteFormId && (() => {
                const f = forms.find((ff) => String(ff.id) === deleteFormId);
                const linkedEdges = edges.filter((e) => e.source === deleteFormId || e.target === deleteFormId).length;
                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => !deletingForm && setDeleteFormId(null)}
                    >
                        <div
                            className="relative flex flex-col gap-3 rounded-2xl border p-5"
                            style={{ background: "var(--arbo-surface)", borderColor: "var(--arbo-danger)", width: "min(420px, 96vw)" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2">
                                <TrashBin className="size-4 text-[var(--arbo-danger)]" />
                                <p className="text-sm font-semibold arbo-text">Eliminar formulario</p>
                            </div>
                            <p className="text-xs arbo-text-secondary leading-relaxed">
                                Vas a enviar <span className="font-semibold arbo-text">{f?.title || "este formulario"}</span> a la papelera.
                                {linkedEdges > 0 && (
                                    <> Se quitarán también <span className="font-semibold text-[var(--arbo-danger)]">{linkedEdges}</span> conexión(es) ligada(s).</>
                                )}
                                {" "}Podés restaurarlo desde la papelera.
                            </p>
                            <div className="flex justify-end gap-2 mt-1">
                                <button
                                    onClick={() => setDeleteFormId(null)}
                                    disabled={deletingForm}
                                    className="text-xs px-3 py-1.5 rounded-lg arbo-text-muted hover:arbo-text border border-[var(--arbo-border)] disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteForm}
                                    disabled={deletingForm}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--arbo-danger-muted)] text-[var(--arbo-danger)] hover:opacity-80 disabled:opacity-50"
                                >
                                    {deletingForm ? "Eliminando…" : "Eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Form preview modal ── */}
            {previewFormId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={() => setPreviewFormId(null)}
                >
                    <div
                        className="relative flex flex-col rounded-2xl border overflow-hidden"
                        style={{
                            background: "var(--arbo-surface)",
                            borderColor: "var(--arbo-border)",
                            width: "min(560px, 96vw)",
                            maxHeight: "88vh",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--arbo-border)" }}>
                            <Eye className="size-4" style={{ color: "var(--arbo-accent)" }} />
                            <p className="text-sm font-semibold arbo-text flex-1 truncate">
                                {previewSchema?.title || forms.find((f) => String(f.id) === previewFormId)?.title || "Vista previa"}
                            </p>
                            <button
                                onClick={() => setPreviewFormId(null)}
                                className="p-1 rounded arbo-text-muted hover:arbo-text transition-colors"
                            >
                                <Xmark className="size-4" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {previewLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="arbo-spinner" />
                                </div>
                            )}
                            {!previewLoading && previewSchema && (
                                <FormBuilder formSchema={previewSchema} mode="view" isSystemForm={false} />
                            )}
                            {!previewLoading && !previewSchema && (
                                <p className="text-sm arbo-text-muted text-center py-8">No se pudo cargar el formulario.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

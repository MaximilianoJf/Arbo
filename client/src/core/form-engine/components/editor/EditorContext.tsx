import { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { FormField, FormSchema, FormStyles, ComponentType, PageElementKey } from "../../types";
import type { EditorTabKey } from "../../constants/editor-constants";
import { useFormStore } from "../../store";
import { FieldRenderMap } from "../Field-render";
import { formApi } from "@/services/api";
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useSchemaHistory } from "../../hooks/useSchemaHistory";

// --- Helpers ---
const getFieldValidations = (componentType: string, fieldType: string): string[] => {
    const render = (FieldRenderMap as Record<string, any>)[componentType];
    if (!render?.types) return [];
    const typeConfig = render.types.find((t: any) => t.type === fieldType);
    return typeConfig?.validations || [];
};

interface EditorContextValue {
    // Form store passthrough
    schema: FormSchema;
    setSchema: React.Dispatch<React.SetStateAction<FormSchema>>;
    formState: Record<string, { value: string | number; error: string | null }>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    removeField: (fieldName: string) => void | Promise<void>;
    reorderFields: (oldIndex: number, newIndex: number) => void;

    // Editor UI state
    selectedField: string | null;
    setSelectedField: (name: string | null) => void;
    activeField: FormField | undefined;
    availableValidations: string[];
    rightTab: EditorTabKey;
    setRightTab: (tab: EditorTabKey) => void;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    hoveredField: string | null;
    setHoveredField: (name: string | null) => void;

    // Selected page element in the free-grid editor (drives contextual page controls).
    // Either a PageElementKey or a decoration id.
    selectedPageElement: PageElementKey | string | null;
    setSelectedPageElement: (k: PageElementKey | string | null) => void;

    // Styles
    styles: FormStyles;
    updateStyles: (patch: Partial<FormStyles>) => void;
    cardTitleColor: string;
    cardSubColor: string;
    cardIsLight: boolean;

    // Pages
    pages: number[];
    totalPages: number;
    currentPageNumber: number;
    currentPageFields: FormField[];
    addPage: () => void;
    removePage: (pageNum: number) => void;
    moveFieldToPage: (fieldName: string, targetPage: number) => void;

    // Field operations
    toggleFieldValidation: (fieldName: string, validation: string) => void;
    quickAddField: (item: { componentType: ComponentType; type: string; label: string }) => void;

    // Field style paint
    copiedFieldStyle: FormField["fieldStyles"] | null;
    setCopiedFieldStyle: (style: FormField["fieldStyles"] | null) => void;
    fieldStyleGlobal: boolean;
    setFieldStyleGlobal: React.Dispatch<React.SetStateAction<boolean>>;

    // Glow orb drag
    glowPreviewRef: React.RefObject<HTMLDivElement | null>;
    draggingGlowId: string | null;
    setDraggingGlowId: (id: string | null) => void;
    glowDragMoved: React.MutableRefObject<boolean>;

    // Animation replay (forces re-mount of animated elements in preview)
    animReplayKey: number;
    replayAnimations: () => void;

    // Preview resize
    previewWidth: number | null;
    setPreviewWidth: (w: number | null) => void;
    previewContainerRef: React.RefObject<HTMLDivElement | null>;
    embedContainerRef: React.RefObject<HTMLDivElement | null>;
    previewContainerActualWidth: number;
    embedContainerActualWidth: number;
    startResize: (e: React.MouseEvent, side: "left" | "right", containerRef?: React.RefObject<HTMLDivElement | null>) => void;

    // Tab scroll
    tabsScrollRef: React.RefObject<HTMLDivElement | null>;

    // Context menu
    contextMenu: { x: number; y: number; pageIdx: number; pageNum: number } | null;
    setContextMenu: (menu: { x: number; y: number; pageIdx: number; pageNum: number } | null) => void;
    contextMenuRef: React.RefObject<HTMLDivElement | null>;

    // Collaborators
    collaborators: any[];
    newCollabEmail: string;
    setNewCollabEmail: (email: string) => void;
    newCollabRole: string;
    setNewCollabRole: (role: string) => void;
    collabError: string | null;
    setCollabError: (error: string | null) => void;
    handleAddCollaborator: () => Promise<void>;
    handleRemoveCollaborator: (email: string) => Promise<void>;

    // Rendering helpers
    renderField: (field: FormField) => React.ReactNode;
    renderViewFields: (fields: FormField[]) => React.ReactNode;

    // Project assignment
    projectId: number | null;
    setProjectId: (id: number | null) => void;

    // Save & navigation
    handleSaveForm: () => Promise<void>;
    saveError: string | null;
    isSaving: boolean;
    savedOk: boolean;
    navigate: (path: string) => void;

    // DnD
    handleDragEnd: (event: any) => void;
    sensors: any;

    // Undo / Redo
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const EditorCtx = createContext<EditorContextValue | null>(null);

export const useEditorContext = () => {
    const ctx = useContext(EditorCtx);
    if (!ctx) throw new Error("useEditorContext must be used within EditorProvider");
    return ctx;
};

export const EditorProvider = ({ children, renderField, renderViewFields }: {
    children: React.ReactNode;
    renderField: (field: FormField) => React.ReactNode;
    renderViewFields: (fields: FormField[]) => React.ReactNode;
}) => {
    const navigate = useNavigate();
    const {
        schema, setSchema: setSchemaRaw, formState, handleInputChange, handleSubmit,
        removeField, reorderFields, activePage, setActivePage,
    } = useFormStore();

    // Undo/redo — wraps setSchema with history tracking (session-only, lost on unmount)
    const { setSchemaWithHistory: setSchema, undo, redo, canUndo, canRedo } = useSchemaHistory(schema, setSchemaRaw);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    // --- Keyboard shortcuts for undo/redo ---
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
            if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
            if (e.key === "y") { e.preventDefault(); redo(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [undo, redo]);

    // --- Editor UI state ---
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [selectedPageElement, setSelectedPageElement] = useState<PageElementKey | string | null>(null);
    const [rightTab, setRightTab] = useState<EditorTabKey>("inputs");
    const [currentPage, setCurrentPage] = useState(0);
    const [hoveredField, setHoveredField] = useState<string | null>(null);
    const tabsScrollRef = useRef<HTMLDivElement>(null);

    // --- Project assignment ---
    const [projectId, setProjectId] = useState<number | null>(schema.projectId ?? null);

    // --- Style paint ---
    const [copiedFieldStyle, setCopiedFieldStyle] = useState<FormField["fieldStyles"] | null>(null);
    const [fieldStyleGlobal, setFieldStyleGlobal] = useState(false);

    // --- Glow drag ---
    const glowPreviewRef = useRef<HTMLDivElement>(null);
    const [draggingGlowId, setDraggingGlowId] = useState<string | null>(null);
    const glowDragMoved = useRef(false);

    // --- Animation replay ---
    const [animReplayKey, setAnimReplayKey] = useState(0);
    const replayAnimations = useCallback(() => setAnimReplayKey((k) => k + 1), []);

    // --- Preview resize ---
    const [previewWidth, setPreviewWidth] = useState<number | null>(null);
    const [previewContainerActualWidth, setPreviewContainerActualWidth] = useState(0);
    const [embedContainerActualWidth, setEmbedContainerActualWidth] = useState(0);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const embedContainerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const resizeStartX = useRef(0);
    const resizeStartW = useRef(0);

    useEffect(() => {
        if (rightTab === "page" || rightTab === "submit") {
            const el = previewContainerRef.current;
            if (!el) return;
            const ro = new ResizeObserver((entries) => {
                setPreviewContainerActualWidth(entries[0]?.contentRect.width ?? 0);
            });
            ro.observe(el);
            return () => ro.disconnect();
        }
        if (rightTab === "embed") {
            const el = embedContainerRef.current;
            if (!el) return;
            const ro = new ResizeObserver((entries) => {
                setEmbedContainerActualWidth(entries[0]?.contentRect.width ?? 0);
            });
            ro.observe(el);
            return () => ro.disconnect();
        }
    }, [rightTab]);

    const startResize = useCallback((e: React.MouseEvent, side: "left" | "right", containerRef?: React.RefObject<HTMLDivElement | null>) => {
        e.preventDefault();
        isResizing.current = true;
        resizeStartX.current = e.clientX;
        const container = (containerRef ?? previewContainerRef).current;
        resizeStartW.current = previewWidth ?? (container?.offsetWidth ?? 800);
        const onMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = ev.clientX - resizeStartX.current;
            const dir = side === "right" ? 1 : -1;
            const newW = Math.max(280, Math.min(resizeStartW.current + delta * dir, container?.offsetWidth ?? 1200));
            setPreviewWidth(Math.round(newW));
        };
        const onUp = () => {
            isResizing.current = false;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [previewWidth]);

    // --- Context menu ---
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageIdx: number; pageNum: number } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        if (contextMenu) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [contextMenu]);

    // --- Collaborators ---
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [newCollabEmail, setNewCollabEmail] = useState("");
    const [newCollabRole, setNewCollabRole] = useState("viewer");
    const [collabError, setCollabError] = useState<string | null>(null);

    useEffect(() => {
        if (schema.id) {
            formApi.getCollaborators(schema.id).then((res) => {
                setCollaborators(res.data);
            }).catch(() => {});
        }
    }, [schema.id]);

    const handleAddCollaborator = async () => {
        if (!schema.id || !newCollabEmail.trim()) return;
        setCollabError(null);
        try {
            const res = await formApi.addCollaborator(schema.id, newCollabEmail.trim(), newCollabRole);
            setCollaborators((prev) => [...prev, res.data]);
            setNewCollabEmail("");
        } catch (err: any) {
            setCollabError(err.message || "Failed to add collaborator");
        }
    };

    const handleRemoveCollaborator = async (email: string) => {
        if (!schema.id) return;
        try {
            await formApi.removeCollaborator(schema.id, email);
            setCollaborators((prev) => prev.filter((c) => c.email !== email));
        } catch (err: any) {
            console.error(err);
        }
    };

    // --- Styles ---
    const styles = schema.styles || {};
    const { cardIsLight, cardTitleColor, cardSubColor } = useMemo(() => {
        const light = (() => {
            const bgColor = styles.bgColor || "#1a1a24";
            if (!bgColor || bgColor.startsWith("var(") || bgColor.startsWith("rgb")) return false;
            const clean = bgColor.replace("#", "");
            if (clean.length !== 6) return false;
            const r = parseInt(clean.substring(0, 2), 16);
            const g = parseInt(clean.substring(2, 4), 16);
            const b = parseInt(clean.substring(4, 6), 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
        })();
        return {
            cardIsLight: light,
            cardTitleColor: light ? "#1e293b" : "var(--arbo-text)",
            cardSubColor: light ? "#475569" : "var(--arbo-text-secondary)",
        };
    }, [styles.bgColor]);

    const updateStyles = useCallback((patch: Partial<FormStyles>) => {
        setSchema((prev) => ({
            ...prev,
            styles: { ...prev.styles, ...patch },
        }));
    }, [setSchema]);

    // --- Pagination ---
    const pages = useMemo(() => {
        const pageMap: Record<number, FormField[]> = {};
        schema.fields.forEach((f) => {
            const p = f.page ?? 0;
            if (!pageMap[p]) pageMap[p] = [];
            pageMap[p].push(f);
        });
        const pageNums = Object.keys(pageMap).map(Number).sort((a, b) => a - b);
        if (pageNums.length === 0) pageNums.push(0);
        return pageNums;
    }, [schema.fields]);

    const totalPages = pages.length;
    const currentPageNumber = pages[currentPage] ?? 0;
    const currentPageFields = schema.fields.filter((f) => (f.page ?? 0) === currentPageNumber);

    useEffect(() => {
        setActivePage(currentPageNumber);
    }, [currentPage, currentPageNumber, setActivePage]);

    const addPage = useCallback(() => {
        const maxPage = pages.length > 0 ? Math.max(...pages) : -1;
        setCurrentPage(pages.length);
        setSchema((prev) => ({
            ...prev,
            fields: [...prev.fields, {
                id: crypto.randomUUID(),
                name: `__page_break_${maxPage + 1}`,
                label: "",
                placeholder: "",
                type: "hidden",
                componentType: "DynamicTextField" as ComponentType,
                value: "",
                page: maxPage + 1,
                sortOrder: 9999,
            }],
        }));
    }, [pages, setSchema]);

    const removePage = useCallback((pageNum: number) => {
        if (totalPages <= 1) return;
        setSchema((prev) => ({
            ...prev,
            fields: prev.fields.filter((f) => (f.page ?? 0) !== pageNum),
        }));
        setCurrentPage(Math.max(0, currentPage - 1));
        setContextMenu(null);
    }, [totalPages, currentPage, setSchema]);

    const moveFieldToPage = useCallback((fieldName: string, targetPage: number) => {
        setSchema((prev) => ({
            ...prev,
            fields: prev.fields.map((f) =>
                f.name === fieldName ? { ...f, page: targetPage } : f
            ),
        }));
    }, [setSchema]);

    // --- Toggle validation ---
    const toggleFieldValidation = useCallback((fieldName: string, validation: string) => {
        if (validation === "confirmPassword") {
            setSchema((prev) => {
                const confirmName = `${fieldName}_confirm`;
                const companionExists = prev.fields.some((f) => f.name === confirmName);

                if (!companionExists) {
                    const fieldIdx = prev.fields.findIndex((f) => f.name === fieldName);
                    const field = prev.fields[fieldIdx];
                    if (!field) return prev;

                    const confirmField: FormField = {
                        id: crypto.randomUUID(),
                        name: confirmName,
                        label: "Confirm Password",
                        placeholder: "Confirm your password",
                        type: "password",
                        componentType: "DynamicPasswordWithToggle" as ComponentType,
                        value: "",
                        required: field.required,
                        validate: ["required", "confirmPassword"],
                        sortOrder: (field.sortOrder ?? 0) + 1,
                        page: field.page ?? 0,
                    };

                    const newFields = [...prev.fields];
                    newFields.splice(fieldIdx + 1, 0, confirmField);
                    return { ...prev, fields: newFields };
                } else {
                    return { ...prev, fields: prev.fields.filter((f) => f.name !== confirmName) };
                }
            });
            return;
        }

        setSchema((prev) => ({
            ...prev,
            fields: prev.fields.map((f) => {
                if (f.name !== fieldName) return f;
                const current = f.validate || [];
                const has = current.includes(validation);
                return {
                    ...f,
                    validate: has
                        ? current.filter((v) => v !== validation)
                        : [...current, validation],
                };
            }),
        }));
    }, [setSchema]);

    // --- Quick add field ---
    const quickAddField = useCallback((item: { componentType: ComponentType; type: string; label: string }) => {
        const fieldName = `${item.label.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
        const newField: FormField = {
            id: crypto.randomUUID(),
            name: fieldName,
            label: item.label,
            placeholder: `Enter ${item.label.toLowerCase()}...`,
            type: item.type,
            componentType: item.componentType,
            value: "",
            required: false,
            validate: [],
            sortOrder: schema.fields.length,
            page: currentPageNumber,
            // Sensible defaults so the field works out of the box
            ...(item.componentType === "DynamicMultiSelect" ? { options: ["Opción 1", "Opción 2", "Opción 3"] } : {}),
            ...(item.componentType === "DynamicFileUpload" && item.type === "image" ? { accept: ["image/*"] } : {}),
            ...(item.componentType === "DynamicFileUpload" && item.type === "file" ? { accept: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip"] } : {}),
        };

        setSchema((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
        setSelectedField(fieldName);
        setRightTab("field");
    }, [schema.fields.length, currentPageNumber, setSchema]);

    // --- DnD ---
    const handleDragEnd = useCallback((event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const globalOld = schema.fields.findIndex((f) => f.name === active.id);
        const globalNew = schema.fields.findIndex((f) => f.name === over.id);
        if (globalOld !== -1 && globalNew !== -1) {
            reorderFields(globalOld, globalNew);
        }
    }, [schema.fields, reorderFields]);

    // --- Save ---
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);

    const handleSaveForm = useCallback(async () => {
        setSaveError(null);
        setSavedOk(false);
        setIsSaving(true);
        try {
            const cleanFields = schema.fields.filter((f) => !f.name?.startsWith("__page_break_"));
            const payload = {
                title: schema.title,
                description: schema.description || "",
                onSubmit: schema.onSubmit || "",
                styles: schema.styles || {},
                projectId,
                fields: cleanFields.map((f, i) => ({
                    name: f.name,
                    label: f.label,
                    placeholder: f.placeholder,
                    type: f.type,
                    componentType: f.componentType,
                    defaultValue: String(f.value || ""),
                    required: f.required || false,
                    minLength: f.minLength,
                    maxLength: f.maxLength,
                    sortOrder: i,
                    page: f.page ?? 0,
                    validations: f.validate || [],
                    dependencies: f.dependencies || [],
                    options: f.options || [],
                    fieldStyles: f.fieldStyles || null,
                })),
            };

            if (schema.id) {
                await formApi.update(schema.id, payload);
            } else {
                // New form: store the returned ID in the schema so subsequent saves
                // call update() instead of creating duplicate forms.
                const res = await formApi.create(payload);
                const newId: number | undefined = res?.data?.id;
                if (newId) {
                    setSchemaRaw((prev) => ({ ...prev, id: newId }));
                }
            }
            setSavedOk(true);
            setTimeout(() => setSavedOk(false), 2500);
        } catch (err: any) {
            const msg = err?.message || "Error al guardar el formulario";
            console.error("Failed to save form:", err);
            setSaveError(msg);
        } finally {
            setIsSaving(false);
        }
    }, [schema, projectId, setSchemaRaw]);

    // --- Active field ---
    const activeField = schema.fields.find((f) => f.name === selectedField);
    const availableValidations = activeField
        ? getFieldValidations(activeField.componentType, activeField.type)
        : [];

    const value = useMemo<EditorContextValue>(() => ({
        schema, setSchema, formState, handleInputChange, handleSubmit,
        removeField, reorderFields,
        selectedField, setSelectedField, activeField, availableValidations,
        rightTab, setRightTab, currentPage, setCurrentPage,
        hoveredField, setHoveredField,
        selectedPageElement, setSelectedPageElement,
        styles, updateStyles, cardTitleColor, cardSubColor, cardIsLight,
        pages, totalPages, currentPageNumber, currentPageFields,
        addPage, removePage, moveFieldToPage,
        toggleFieldValidation, quickAddField,
        copiedFieldStyle, setCopiedFieldStyle, fieldStyleGlobal, setFieldStyleGlobal,
        glowPreviewRef, draggingGlowId, setDraggingGlowId, glowDragMoved,
        animReplayKey, replayAnimations,
        previewWidth, setPreviewWidth, previewContainerRef, embedContainerRef,
        previewContainerActualWidth, embedContainerActualWidth, startResize,
        tabsScrollRef,
        contextMenu, setContextMenu, contextMenuRef,
        collaborators, newCollabEmail, setNewCollabEmail, newCollabRole, setNewCollabRole,
        collabError, setCollabError, handleAddCollaborator, handleRemoveCollaborator,
        projectId, setProjectId,
        renderField, renderViewFields,
        handleSaveForm, saveError, isSaving, savedOk, navigate,
        handleDragEnd, sensors,
        undo, redo, canUndo, canRedo,
    }), [
        schema, formState, selectedField, rightTab, currentPage, hoveredField, selectedPageElement,
        styles, cardTitleColor, cardSubColor, cardIsLight,
        pages, totalPages, currentPageNumber,
        copiedFieldStyle, fieldStyleGlobal,
        draggingGlowId, animReplayKey, previewWidth,
        previewContainerActualWidth, embedContainerActualWidth,
        contextMenu, collaborators, newCollabEmail, newCollabRole, collabError,
        projectId, saveError, isSaving, savedOk, canUndo, canRedo,
        renderField, renderViewFields,
    ]);

    return <EditorCtx.Provider value={value}>{children}</EditorCtx.Provider>;
};

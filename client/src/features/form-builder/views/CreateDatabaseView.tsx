import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectApi, formApi } from "@/services/api";
import { Database, Sparkles, ArrowRight, LayoutCellsLarge, Check, ArrowLeft } from "@gravity-ui/icons";

const PROJECT_COLORS = ["#4ADE80", "#60A5FA", "#F472B6", "#FBBF24", "#A78BFA", "#FB923C", "#34D399", "#F87171"];

// ─── DB suggestions (relational schemas) — each is an AI prompt ───
interface DbSuggestion {
    id: string;
    icon: string;
    label: string;
    description: string;
    prompt: string;
}

const SUGGESTIONS: DbSuggestion[] = [
    {
        id: "crm",
        icon: "🤝",
        label: "CRM de clientes",
        description: "Empresas, contactos y oportunidades de venta.",
        prompt: "Base de datos CRM con tres formularios relacionados: Empresas (nombre, rubro, sitio web), Contactos (nombre, email, teléfono, cargo) pertenecientes a una empresa, y Oportunidades de venta (título, monto, estado) asociadas a un contacto. Relacioná Empresas → Contactos (uno a muchos) y Contactos → Oportunidades (uno a muchos).",
    },
    {
        id: "escuela",
        icon: "🎓",
        label: "Gestión escolar",
        description: "Alumnos, materias y calificaciones.",
        prompt: "Base de datos escolar con: Alumnos (nombre, DNI, email), Materias (nombre de la materia, código) y Notas (calificación, fecha de evaluación) que vinculan a un alumno con una materia. Relacioná Alumnos → Notas y Materias → Notas.",
    },
    {
        id: "inventario",
        icon: "📦",
        label: "Inventario",
        description: "Productos, categorías y movimientos de stock.",
        prompt: "Base de datos de inventario con: Categorías (nombre, descripción), Productos (nombre, SKU, precio, stock) que pertenecen a una categoría, y Movimientos de stock (tipo de movimiento, cantidad, fecha) de cada producto. Relacioná Categorías → Productos y Productos → Movimientos.",
    },
    {
        id: "reservas",
        icon: "📅",
        label: "Reservas / Turnos",
        description: "Clientes, servicios y reservas.",
        prompt: "Base de datos de reservas con: Clientes (nombre, email, teléfono), Servicios (nombre del servicio, duración, precio) y Reservas (fecha, hora, estado) que vinculan un cliente con un servicio. Relacioná Clientes → Reservas y Servicios → Reservas.",
    },
    {
        id: "eventos",
        icon: "🎟️",
        label: "Eventos",
        description: "Eventos, asistentes e inscripciones.",
        prompt: "Base de datos de eventos con: Eventos (nombre, fecha, lugar, cupo), Asistentes (nombre, email, empresa) e Inscripciones (tipo de entrada, fecha de inscripción) que conectan un asistente con un evento. Relacioná Eventos → Inscripciones y Asistentes → Inscripciones.",
    },
    {
        id: "biblioteca",
        icon: "📚",
        label: "Biblioteca",
        description: "Libros, socios y préstamos.",
        prompt: "Base de datos de biblioteca con: Libros (título, autor, ISBN), Socios (nombre, número de socio, email) y Préstamos (fecha de préstamo, fecha de devolución, estado) que vinculan un socio con un libro. Relacioná Libros → Préstamos y Socios → Préstamos.",
    },
];

type Mode = "suggestions" | "ai" | "existing";

export const CreateDatabaseView = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [color, setColor] = useState(PROJECT_COLORS[0]);
    const [mode, setMode] = useState<Mode>("suggestions");

    // suggestions / ai
    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
    const [aiPrompt, setAiPrompt] = useState("");
    const aiRef = useRef<HTMLTextAreaElement>(null);

    // existing forms
    const [forms, setForms] = useState<any[]>([]);
    const [formsLoading, setFormsLoading] = useState(false);
    const [selectedFormIds, setSelectedFormIds] = useState<Set<number>>(new Set());

    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    // Load only the user's LOOSE forms — those not already assigned to any project.
    useEffect(() => {
        if (mode !== "existing" || forms.length > 0) return;
        setFormsLoading(true);
        formApi.getMyForms()
            .then((res) => setForms((res.data || []).filter((f: any) => f.projectId == null)))
            .catch(() => {})
            .finally(() => setFormsLoading(false));
    }, [mode, forms.length]);

    const toggleForm = (id: number) => {
        setSelectedFormIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const pickSuggestion = (s: DbSuggestion) => {
        setSelectedSuggestion(s.id);
        setAiPrompt(s.prompt);
    };

    // Resolve the AI prompt for the current mode (suggestions reuse the AI pipeline).
    const effectivePrompt = mode === "suggestions"
        ? (SUGGESTIONS.find((s) => s.id === selectedSuggestion)?.prompt || "")
        : aiPrompt.trim();

    const canCreate =
        name.trim().length > 0 &&
        (mode === "existing"
            ? selectedFormIds.size > 0
            : effectivePrompt.length > 0);

    const handleCreate = async () => {
        if (!name.trim()) { setError("Poné un nombre para la base de datos"); return; }
        if (creating) return;
        setCreating(true);
        setError("");
        try {
            const res = await projectApi.create({ name: name.trim(), color, isDatabase: true });
            const projectId = res.data.id;

            if (mode === "existing") {
                // Assign every selected form to the new project.
                await Promise.all(
                    [...selectedFormIds].map((fid) => projectApi.assignForm(fid, projectId).catch(() => {})),
                );
                navigate(`/form-builder/projects/${projectId}`);
            } else {
                // AI / suggestion: hand off to the relations view with the prompt pre-loaded.
                navigate(`/form-builder/projects/${projectId}/relations?ai=1&prompt=${encodeURIComponent(effectivePrompt)}`);
            }
        } catch (e: any) {
            setError(e.message || "No se pudo crear la base de datos");
            setCreating(false);
        }
    };

    const TABS: { id: Mode; label: string; icon: React.ElementType }[] = [
        { id: "suggestions", label: "Sugerencias", icon: Sparkles },
        { id: "ai", label: "Crear con IA", icon: Sparkles },
        { id: "existing", label: "Formularios existentes", icon: LayoutCellsLarge },
    ];

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/form-builder")} className="arbo-btn arbo-btn-ghost p-2 shrink-0">
                    <ArrowLeft className="size-4" />
                </button>
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--arbo-accent-muted)" }}>
                    <Database className="size-5" style={{ color: "var(--arbo-accent)" }} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold arbo-text">Nueva base de datos</h1>
                    <p className="text-sm arbo-text-muted">Un proyecto con formularios relacionados entre sí.</p>
                </div>
            </div>

            {/* Name + color */}
            <div className="arbo-panel p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold arbo-text-secondary uppercase tracking-wider">Nombre de la base de datos</label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        placeholder="Ej: Gestión de clientes"
                        className="arbo-input w-full"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold arbo-text-secondary uppercase tracking-wider">Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {PROJECT_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className="size-7 rounded-full transition-all"
                                style={{
                                    backgroundColor: c,
                                    boxShadow: color === c ? `0 0 0 2px var(--arbo-bg), 0 0 0 3.5px ${c}` : "none",
                                    transform: color === c ? "scale(1.15)" : "scale(1)",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map((tab) => {
                    const active = mode === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                            style={active
                                ? { background: "var(--arbo-accent-muted)", color: "var(--arbo-accent)", borderColor: "color-mix(in srgb, var(--arbo-accent) 40%, transparent)" }
                                : { background: "var(--arbo-surface-2)", color: "var(--arbo-text-secondary)", borderColor: "var(--arbo-border)" }}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Mode content */}
            {mode === "suggestions" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SUGGESTIONS.map((s) => {
                        const active = selectedSuggestion === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => pickSuggestion(s)}
                                className="group arbo-card text-left p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                                style={active ? { borderColor: "var(--arbo-accent)", boxShadow: "0 0 0 1px var(--arbo-accent)" } : undefined}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="size-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--arbo-surface-2)" }}>
                                        {s.icon}
                                    </div>
                                    {active && <Check className="size-4 text-[var(--arbo-accent)]" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold arbo-text group-hover:text-[var(--arbo-accent)] transition-colors">{s.label}</h3>
                                    <p className="text-xs arbo-text-muted mt-0.5">{s.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {mode === "ai" && (
                <div className="arbo-panel p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-[var(--arbo-accent)]" />
                        <p className="text-sm font-semibold arbo-text">Describí tu base de datos</p>
                    </div>
                    <textarea
                        ref={aiRef}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ej: Quiero gestionar una veterinaria con dueños, mascotas y consultas. Cada dueño tiene varias mascotas, y cada mascota tiene un historial de consultas con fecha, motivo y diagnóstico."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)] resize-none"
                    />
                    <p className="text-[11px] arbo-text-muted">La IA va a generar los formularios y sus relaciones automáticamente. Vas a poder revisarlos antes de guardar.</p>
                </div>
            )}

            {mode === "existing" && (
                <div className="arbo-panel p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold arbo-text">Elegí formularios sueltos a incluir</p>
                        {selectedFormIds.size > 0 && (
                            <span className="text-xs arbo-text-accent">{selectedFormIds.size} seleccionado{selectedFormIds.size !== 1 ? "s" : ""}</span>
                        )}
                    </div>
                    {formsLoading ? (
                        <div className="flex items-center justify-center py-8"><div className="arbo-spinner" /></div>
                    ) : forms.length === 0 ? (
                        <p className="text-sm arbo-text-muted text-center py-8">No tenés formularios sueltos. Todos ya pertenecen a un proyecto.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto">
                            {forms.map((f) => {
                                const checked = selectedFormIds.has(f.id);
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => toggleForm(f.id)}
                                        className="flex items-center gap-3 p-3 rounded-lg border text-left transition-colors"
                                        style={checked
                                            ? { background: "var(--arbo-accent-muted)", borderColor: "color-mix(in srgb, var(--arbo-accent) 40%, transparent)" }
                                            : { background: "var(--arbo-surface-2)", borderColor: "var(--arbo-border)" }}
                                    >
                                        <div
                                            className="size-5 rounded-md flex items-center justify-center shrink-0 border transition-colors"
                                            style={checked
                                                ? { background: "var(--arbo-accent)", borderColor: "var(--arbo-accent)" }
                                                : { borderColor: "var(--arbo-border-light)" }}
                                        >
                                            {checked && <Check className="size-3.5 text-[var(--arbo-bg)]" />}
                                        </div>
                                        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: f.styles?.gradient || f.styles?.accentColor || "var(--arbo-accent)" }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium arbo-text truncate">{f.title}</p>
                                            <p className="text-[10px] arbo-text-muted">
                                                {f.fields?.length || f.FormFields?.length || 0} campos
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <p className="text-[11px] arbo-text-muted">Después vas a poder conectarlos entre sí desde "Configurar BD".</p>
                </div>
            )}

            {error && <p className="text-sm text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-3 py-2 rounded-lg">{error}</p>}

            {/* Create */}
            <div className="flex items-center justify-end gap-3 pt-1">
                <button onClick={() => navigate("/form-builder")} className="arbo-btn arbo-btn-ghost">Cancelar</button>
                <button onClick={handleCreate} disabled={!canCreate || creating} className="arbo-btn arbo-btn-primary disabled:opacity-50">
                    {creating ? (
                        <><div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Creando…</>
                    ) : (
                        <>
                            {mode === "existing" ? "Crear base de datos" : "Crear y generar"}
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

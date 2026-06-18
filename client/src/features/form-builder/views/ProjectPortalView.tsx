import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { projectApi } from "@/services/api";
import { PortalContext, THEME_VARS, type PortalTheme } from "./portal/PortalContext";
import {
    House, LayoutList, Persons, Gear, ArrowLeft, ArrowRightFromSquare, Moon, Sun, Droplet,
    FileText, Sparkles, GraphNode, Printer, PersonMagnifier,
} from "@gravity-ui/icons";

const parseToken = (): { name?: string; email?: string } | null => {
    try {
        const t = localStorage.getItem("token");
        if (!t) return null;
        return JSON.parse(atob(t.split(".")[1]));
    } catch { return null; }
};

const NAV = [
    { id: "dashboard", label: "Dashboard",      icon: House,      path: "" },
    { id: "forms",     label: "Formularios",    icon: LayoutList, path: "/forms" },
    { id: "responses", label: "Respuestas",     icon: FileText,   path: "/responses" },
    { id: "respondents", label: "Por persona",  icon: PersonMagnifier, path: "/respondents" },
    { id: "docs",      label: "Documentación",  icon: Printer,    path: "/docs" },
    { id: "analysis",  label: "Análisis IA",    icon: Sparkles,   path: "/analysis" },
    { id: "database",  label: "Base de datos",  icon: GraphNode,  path: "/database" },
    { id: "agent",     label: "Agente IA",      icon: Sparkles,   path: "/agent" },
    { id: "users",     label: "Usuarios",       icon: Persons,    path: "/users" },
    { id: "settings",  label: "Configuración",  icon: Gear,       path: "/settings" },
];

const THEME_ICONS: Record<PortalTheme, React.ElementType> = { dark: Moon, light: Sun, glass: Droplet };

// Glass-specific animated background orbs
const GlassOrbs = () => (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[600px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(circle, #4ADE80 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-60 size-[500px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 left-1/3 size-[400px] rounded-full opacity-10 blur-[80px]"
            style={{ background: "radial-gradient(circle, #A855F7 0%, transparent 70%)" }} />
    </div>
);

export const ProjectPortalView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const projectId = Number(id);

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [theme, setThemeState] = useState<PortalTheme>(() => {
        return (localStorage.getItem(`arbo:portal:theme:${id}`) as PortalTheme) || "dark";
    });

    const setTheme = (t: PortalTheme) => {
        setThemeState(t);
        localStorage.setItem(`arbo:portal:theme:${id}`, t);
    };

    const reload = useCallback(async () => {
        try {
            const res = await projectApi.getById(projectId);
            setProject(res.data);
        } catch {
            navigate("/form-builder");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);

    useEffect(() => { reload(); }, [reload]);

    const user = parseToken();
    const isOwner = project?.user?.email === user?.email;

    // Active nav item
    const basePath = `/p/${id}`;
    const subPath = location.pathname.replace(basePath, "") || "";
    const activeNav = NAV.find((n) => n.path && subPath.startsWith(n.path)) ?? NAV[0];

    // Cycle theme
    const cycleTheme = () => {
        const order: PortalTheme[] = ["dark", "light", "glass"];
        setTheme(order[(order.indexOf(theme) + 1) % order.length]);
    };

    const ThemeIcon = THEME_ICONS[theme];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--arbo-bg)" }}>
                <div className="arbo-spinner" />
            </div>
        );
    }

    const themeVars = THEME_VARS[theme];
    const projectColor = project?.color || "var(--arbo-accent)";
    const forms = project?.forms || project?.userForms || project?.UserForms || [];

    return (
        <PortalContext.Provider value={{ project, projectId, theme, setTheme, reload, isOwner }}>
            {theme === "glass" && (
                <style>{`
                    .portal-glass main [style*="background: var(--arbo-surface"] {
                        backdrop-filter: blur(14px) saturate(1.6);
                        -webkit-backdrop-filter: blur(14px) saturate(1.6);
                    }
                    .portal-glass main [style*="background: rgba(255,255,255"] {
                        backdrop-filter: blur(14px) saturate(1.6);
                        -webkit-backdrop-filter: blur(14px) saturate(1.6);
                    }
                `}</style>
            )}
            <div
                className={`min-h-screen flex${theme === "glass" ? " portal-glass" : ""}`}
                style={{
                    ...themeVars,
                    background: theme === "glass"
                        ? "radial-gradient(ellipse at 20% 50%, rgba(10,10,25,0.95), #060610)"
                        : "var(--arbo-bg)",
                }}
            >
                {theme === "glass" && <GlassOrbs />}

                {/* ── Sidebar ── */}
                <aside
                    className="w-60 shrink-0 flex flex-col min-h-screen sticky top-0"
                    style={{
                        background: theme === "glass" ? "rgba(255,255,255,0.03)" : "var(--arbo-surface)",
                        borderRight: "1px solid var(--arbo-border)",
                        backdropFilter: theme === "glass" ? "blur(20px)" : undefined,
                    }}
                >
                    {/* Project identity */}
                    <div className="px-4 pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="size-9 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                                style={{ background: projectColor }}
                            >
                                {project?.name?.[0]?.toUpperCase() || "P"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: "var(--arbo-text)" }}>{project?.name}</p>
                                <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: projectColor }}>
                                    Portal
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats chips */}
                    <div className="px-4 pb-4 flex gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--arbo-surface-2)", color: "var(--arbo-text-muted)" }}>
                            {forms.length} forms
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="flex flex-col gap-0.5 px-2 flex-1">
                        {NAV.map((item) => {
                            const Icon = item.icon;
                            const isActive = item === activeNav;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(`${basePath}${item.path}`)}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all"
                                    style={{
                                        background: isActive ? projectColor : "transparent",
                                        color: isActive ? "#fff" : "var(--arbo-text-secondary)",
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLButtonElement).style.background = "var(--arbo-surface-2)";
                                            (e.currentTarget as HTMLButtonElement).style.color = "var(--arbo-text)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                            (e.currentTarget as HTMLButtonElement).style.color = "var(--arbo-text-secondary)";
                                        }
                                    }}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom: back + user */}
                    <div
                        className="px-2 py-3 flex flex-col gap-1 border-t mt-auto"
                        style={{ borderColor: "var(--arbo-border)" }}
                    >
                        <button
                            onClick={() => navigate(`/form-builder/projects/${projectId}`)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors w-full text-left"
                            style={{ color: "var(--arbo-text-muted)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--arbo-surface-2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                            <ArrowLeft className="size-3.5 shrink-0" /> Volver al proyecto
                        </button>
                        {/* User chip */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl mt-1" style={{ background: "var(--arbo-surface-2)" }}>
                            <div
                                className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                style={{ background: projectColor, color: "#fff" }}
                            >
                                {(user?.name || user?.email)?.[0]?.toUpperCase() || "?"}
                            </div>
                            <p className="text-xs truncate flex-1" style={{ color: "var(--arbo-text-secondary)" }}>
                                {user?.name || user?.email}
                            </p>
                            <button
                                onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
                                className="shrink-0"
                                style={{ color: "var(--arbo-text-muted)" }}
                                title="Salir"
                            >
                                <ArrowRightFromSquare className="size-3" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── Main ── */}
                <div className="flex-1 flex flex-col min-h-screen min-w-0">
                    {/* Header */}
                    <header
                        className="h-14 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-10"
                        style={{
                            background: theme === "glass" ? "rgba(255,255,255,0.03)" : "var(--arbo-surface)",
                            borderBottom: "1px solid var(--arbo-border)",
                            backdropFilter: theme === "glass" ? "blur(20px)" : undefined,
                        }}
                    >
                        <h1 className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>
                            {activeNav.label}
                        </h1>
                        <div className="flex-1" />

                        {/* Theme cycle button */}
                        <button
                            onClick={cycleTheme}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: "var(--arbo-text-muted)" }}
                            title={`Tema: ${theme}`}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--arbo-surface-2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                            <ThemeIcon className="size-4" />
                        </button>
                    </header>

                    {/* Content */}
                    <main className="flex-1 p-6 overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </PortalContext.Provider>
    );
};

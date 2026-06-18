import { useState } from "react";
import { usePortal, type PortalTheme } from "./PortalContext";
import { Moon, Sun, Droplet } from "@gravity-ui/icons";

const parseToken = (): { name?: string; email?: string } | null => {
    try {
        const t = localStorage.getItem("token");
        if (!t) return null;
        return JSON.parse(atob(t.split(".")[1]));
    } catch { return null; }
};

const THEMES: { id: PortalTheme; label: string; desc: string; icon: React.ElementType; preview: string }[] = [
    {
        id: "dark",
        label: "Dark",
        desc: "Fondo oscuro, bajo contraste. Ideal para sesiones largas.",
        icon: Moon,
        preview: "linear-gradient(135deg, #0f0f14 0%, #1a1a24 100%)",
    },
    {
        id: "light",
        label: "Light",
        desc: "Fondo claro, máxima legibilidad.",
        icon: Sun,
        preview: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)",
    },
    {
        id: "glass",
        label: "Glass",
        desc: "Superficies translúcidas con efecto frost. Estilo premium.",
        icon: Droplet,
        preview: "linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(59,130,246,0.1) 50%, rgba(168,85,247,0.1) 100%)",
    },
];

export const PortalSettings = () => {
    const { theme, setTheme, project, isOwner } = usePortal();
    const user = parseToken();
    const [saved, setSaved] = useState(false);

    const handleTheme = (t: PortalTheme) => {
        setTheme(t);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <div className="flex flex-col gap-8 max-w-2xl">
            {/* Appearance */}
            <section className="flex flex-col gap-4">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>Apariencia</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--arbo-text-muted)" }}>
                        El tema del portal se guarda en este dispositivo.
                        {saved && <span className="ml-2" style={{ color: "var(--arbo-accent)" }}>✓ Guardado</span>}
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {THEMES.map((t) => {
                        const Icon = t.icon;
                        const active = theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleTheme(t.id)}
                                className="flex flex-col gap-3 p-1 rounded-xl transition-all text-left"
                                style={{
                                    border: active
                                        ? "2px solid var(--arbo-accent)"
                                        : "2px solid var(--arbo-border)",
                                    background: active ? "var(--arbo-accent-subtle)" : "transparent",
                                }}
                            >
                                {/* Preview swatch */}
                                <div
                                    className="w-full h-16 rounded-lg"
                                    style={{ background: t.preview }}
                                />
                                <div className="px-2 pb-2 flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className="size-3.5 shrink-0" style={{ color: active ? "var(--arbo-accent)" : "var(--arbo-text-muted)" }} />
                                        <span className="text-xs font-semibold" style={{ color: active ? "var(--arbo-accent)" : "var(--arbo-text)" }}>
                                            {t.label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] leading-snug" style={{ color: "var(--arbo-text-muted)" }}>{t.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Project info */}
            {isOwner && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>Proyecto</h2>
                    <div
                        className="rounded-xl p-4 flex items-center gap-4"
                        style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                    >
                        <div
                            className="size-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                            style={{ background: project?.color || "var(--arbo-accent)" }}
                        >
                            {project?.name?.[0]?.toUpperCase() || "P"}
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>{project?.name}</p>
                            {project?.description && (
                                <p className="text-xs mt-0.5" style={{ color: "var(--arbo-text-muted)" }}>{project.description}</p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Account */}
            <section className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>Cuenta</h2>
                <div
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                >
                    <div
                        className="size-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                        style={{ background: "var(--arbo-accent-muted)", color: "var(--arbo-accent)" }}
                    >
                        {(user?.name || user?.email)?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--arbo-text)" }}>{user?.name || "Usuario"}</p>
                        <p className="text-xs truncate" style={{ color: "var(--arbo-text-muted)" }}>{user?.email}</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

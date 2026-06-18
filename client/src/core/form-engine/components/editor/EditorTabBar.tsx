import { ArrowLeft, ArrowRight } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";
import { EDITOR_TABS } from "../../constants/editor-constants";
import { useEditorContext } from "./EditorContext";

/** Sparkle icon — tiny inline SVG */
const Sparkles = () => (
    <svg className="size-2.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0l1.5 4.5L14 6l-4.5 1.5L8 12l-1.5-4.5L2 6l4.5-1.5L8 0z" />
        <path d="M12.5 9l.75 2.25L15.5 12l-2.25.75L12.5 15l-.75-2.25L9.5 12l2.25-.75L12.5 9z" opacity=".6" />
    </svg>
);

export const EditorTabBar = () => {
    const { t } = useTranslation();
    const { rightTab, setRightTab, tabsScrollRef } = useEditorContext();

    return (
        <div className="flex items-center border-b border-[var(--arbo-border)] shrink-0">
            <button
                onClick={() => tabsScrollRef.current?.scrollBy({ left: -60, behavior: "smooth" })}
                className="px-1.5 py-2.5 arbo-text-muted hover:arbo-text-secondary shrink-0 transition-colors"
                title={t("common.previous")}
            >
                <ArrowLeft className="size-3" />
            </button>
            <div
                ref={tabsScrollRef}
                className="flex flex-1 overflow-x-auto scrollbar-none"
                style={{ scrollbarWidth: "none" }}
            >
                {EDITOR_TABS.map((tab) => {
                    const isActive = rightTab === tab.key;
                    const tabLabel = t(`editor.tabs.${tab.key}`);

                    // Glowing AI tab
                    if (tab.glow) {
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setRightTab(tab.key)}
                                className={`shrink-0 px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-center transition-all flex items-center gap-1 relative ${
                                    isActive ? "border-b-2" : "hover:opacity-90"
                                }`}
                                style={{
                                    background: isActive
                                        ? "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(6,214,160,0.08))"
                                        : "transparent",
                                    color: isActive ? "#4ADE80" : undefined,
                                    borderColor: isActive ? "#4ADE80" : undefined,
                                    textShadow: isActive ? "0 0 12px rgba(74,222,128,0.6)" : "0 0 8px rgba(74,222,128,0.3)",
                                }}
                            >
                                {/* Glow background */}
                                <span
                                    className="absolute inset-0 rounded-t-md pointer-events-none"
                                    style={{
                                        background: isActive
                                            ? "radial-gradient(ellipse at 50% 100%, rgba(74,222,128,0.15) 0%, transparent 70%)"
                                            : "none",
                                    }}
                                />
                                <span
                                    className="relative flex items-center gap-1"
                                    style={{
                                        background: "linear-gradient(135deg, #4ADE80, #06D6A0, #34D399)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        filter: `drop-shadow(0 0 ${isActive ? "6px" : "3px"} rgba(74,222,128,${isActive ? "0.5" : "0.3"}))`,
                                    }}
                                >
                                    <Sparkles />
                                    {tabLabel}
                                    <Sparkles />
                                </span>
                            </button>
                        );
                    }

                    // Normal tab
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setRightTab(tab.key)}
                            className={`shrink-0 px-2 py-2.5 text-[9px] font-bold uppercase tracking-wider text-center transition-colors ${
                                isActive
                                    ? "arbo-text-accent border-b-2 border-[var(--arbo-accent)]"
                                    : "arbo-text-muted hover:arbo-text-secondary"
                            }`}
                        >
                            {tabLabel}
                        </button>
                    );
                })}
            </div>
            <button
                onClick={() => tabsScrollRef.current?.scrollBy({ left: 60, behavior: "smooth" })}
                className="px-1.5 py-2.5 arbo-text-muted hover:arbo-text-secondary shrink-0 transition-colors"
                title={t("common.next")}
            >
                <ArrowRight className="size-3" />
            </button>
        </div>
    );
};

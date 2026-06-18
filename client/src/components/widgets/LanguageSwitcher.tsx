import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const current = i18n.language;

    return (
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
            {(["es", "en"] as const).map((lng) => (
                <button
                    key={lng}
                    onClick={() => i18n.changeLanguage(lng)}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                        current === lng
                            ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)] shadow-sm"
                            : "arbo-text-muted hover:arbo-text-secondary"
                    }`}
                >
                    {lng.toUpperCase()}
                </button>
            ))}
        </div>
    );
};

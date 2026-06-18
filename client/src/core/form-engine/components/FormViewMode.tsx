import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Form } from "@heroui/react";
import { ArrowLeft, ArrowRight, Check, Pencil } from "@gravity-ui/icons";
import type { FormField, FormStyles } from "../types";
import { FORM_MODES } from "../constants/form-modes";
import { getShadowCss } from "../constants/style-presets";
import {
    getGlassStyle, getAccentStyle, getCardMaxWidth, getPageHeadingSizeClass,
    getEntranceAnimClass, getEntranceAnimStyle, getHoverAnimClass, getFieldFocusClass, getTransitionSpeed,
    applyAlpha, getPageBgWithAutoGlow,
} from "../utils/style-helpers";

interface FormViewModeProps {
    schema: {
        title: string;
        description?: string;
        fields: FormField[];
        onSubmit?: string;
        styles?: FormStyles;
    };
    styles: FormStyles;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    renderViewFields: (fields: FormField[]) => React.ReactNode;
    isPreview?: boolean;
    setSchemaMode?: (mode: string) => void;
    cardTitleColor: string;
    cardSubColor: string;
}

export const FormViewMode = ({
    schema, styles, handleSubmit, renderViewFields,
    isPreview = false, setSchemaMode,
    cardTitleColor, cardSubColor,
}: FormViewModeProps) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(0);

    const viewPages = useMemo(() => {
        const pageMap: Record<number, FormField[]> = {};
        schema.fields.filter((f) => !f.name?.startsWith("__page_break_")).forEach((f) => {
            const p = f.page ?? 0;
            if (!pageMap[p]) pageMap[p] = [];
            pageMap[p].push(f);
        });
        const result = Object.keys(pageMap).map(Number).sort((a, b) => a - b);
        return result.length > 0 ? result : [0];
    }, [schema.fields]);

    const viewTotalPages = viewPages.length;
    const safeCurrentPage = Math.min(currentPage, viewTotalPages - 1);
    const viewCurrentFields = schema.fields.filter(
        (f) => (f.page ?? 0) === viewPages[safeCurrentPage] && !f.name?.startsWith("__page_break_")
    );
    const isLastPage = safeCurrentPage === viewTotalPages - 1;
    const isFirstPage = safeCurrentPage === 0;
    const maxW = getCardMaxWidth(styles);

    const formVAlign = styles.formVerticalAlign || "start";

    const cardStyle = {
        ...getGlassStyle(styles.bgColor || "#1a1a24", styles),
        borderRadius: `${styles.borderRadius ?? 14}px`,
        border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
        boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
    };

    // Animation helpers
    const entranceClass = getEntranceAnimClass(styles);
    const hoverClass = getHoverAnimClass(styles);
    const focusClass = getFieldFocusClass(styles);
    const transitionSpeed = getTransitionSpeed(styles);
    const accentColor = styles.accentColor || "#4ADE80";
    const glowColor = applyAlpha(accentColor, 0.35);

    const animVars = {
        "--arbo-transition-speed": transitionSpeed,
        "--arbo-hover-glow-color": glowColor,
        "--arbo-focus-color": applyAlpha(accentColor, 0.3),
    } as React.CSSProperties;

    // In preview mode, show page heading here. In public view mode, the parent (PublicFormView) handles it.
    const hasPageHeading = (styles.pageHeadingEnabled ?? false) && !!styles.pageHeadingText;
    const showPageHeadingHere = hasPageHeading && isPreview;
    // Header card (title + description) is controlled independently by its own toggle
    const showHeaderCard = styles.cardHeaderEnabled !== false;

    /** Pagination progress dots (reused in both layouts) */
    const paginationDots = viewTotalPages > 1 ? (
        <div className="flex items-center gap-2 mt-3">
            {viewPages.map((_, idx) => (
                <div key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                        idx <= safeCurrentPage ? "" : "bg-[var(--arbo-border)]"
                    }`}
                    style={idx <= safeCurrentPage ? getAccentStyle(styles) : undefined}
                />
            ))}
        </div>
    ) : null;

    /** Navigation buttons (shared) */
    const navButtons = (
        <div className="flex items-center gap-2 pt-3">
            {!isFirstPage && (
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className="arbo-btn arbo-btn-secondary text-sm">
                    <ArrowLeft className="size-4" /> {t("common.previous")}
                </button>
            )}
            <div className="flex-1" />
            {viewTotalPages > 1 && (
                <span className="text-xs arbo-text-muted">
                    {t("form.pageIndicator", { current: safeCurrentPage + 1, total: viewTotalPages })}
                </span>
            )}
            {!isLastPage ? (
                <button type="button" onClick={() => setCurrentPage((p) => p + 1)}
                    className="arbo-btn arbo-btn-primary text-sm" style={getAccentStyle(styles)}>
                    {t("common.next")} <ArrowRight className="size-4" />
                </button>
            ) : (
                <Button className="arbo-btn-primary" type="submit" style={getAccentStyle(styles)}>
                    <Check className="size-4" /> {t("common.submit")}
                </Button>
            )}
        </div>
    );

    const viewFormContent = (
        <div className="flex flex-col justify-center items-center gap-4 w-full" style={animVars}>
            {/* Page heading (outside card) — only in preview; PublicFormView renders its own */}
            {showPageHeadingHere && (
                <div className="w-full" style={{ textAlign: styles.pageHeadingAlign || "center" }}>
                    <h2 className={`font-bold ${getPageHeadingSizeClass(styles.pageHeadingSize)}`}
                        style={{ color: styles.pageHeadingColor || "#ffffff" }}>
                        {styles.pageHeadingText}
                    </h2>
                    {schema.description && (
                        <p className="text-sm mt-1" style={{ color: applyAlpha(styles.pageHeadingColor || "#ffffff", 0.6) }}>
                            {schema.description}
                        </p>
                    )}
                    {paginationDots}
                </div>
            )}

            {/* Header card (title + description) — shown unless hidden via its toggle */}
            {showHeaderCard && (
                <div className={`w-full overflow-hidden ${entranceClass} ${hoverClass}`.trim()}
                    style={{ ...cardStyle, ...getEntranceAnimStyle(styles, 0) }}>
                    <div className="h-2" style={getAccentStyle(styles)} />
                    <div className="p-5">
                        <h1 className="text-xl font-bold" style={{ color: cardTitleColor }}>{schema.title}</h1>
                        {schema.description && (
                            <p className="text-sm mt-1" style={{ color: cardSubColor }}>{schema.description}</p>
                        )}
                        {paginationDots}
                    </div>
                </div>
            )}

            {/* Form card — overflow visible so dropdowns/popovers aren't clipped by the card */}
            <div className={`w-full ${entranceClass} ${hoverClass} ${focusClass}`.trim()}
                style={{ ...cardStyle, ...getEntranceAnimStyle(styles, showHeaderCard ? 1 : 0) }}>
                <div className="h-2" style={{ ...getAccentStyle(styles), borderRadius: `${styles.borderRadius ?? 14}px ${styles.borderRadius ?? 14}px 0 0` }} />
                <div className="p-6">
                    <Form validationBehavior="aria"
                        onSubmit={isPreview ? (e) => e.preventDefault() : handleSubmit}
                        className="flex flex-col gap-4">
                        {viewCurrentFields.length > 0 ? renderViewFields(viewCurrentFields) : (
                            <p className="text-sm arbo-text-muted text-center py-8">{t("form.noFieldsOnPage")}</p>
                        )}
                        {schema.onSubmit && <input type="hidden" name="actionType" value={schema.onSubmit} />}
                        {navButtons}
                    </Form>
                </div>
            </div>
        </div>
    );

    // Preview mode (from editor toggle)
    if (isPreview && setSchemaMode) {
        return (
            <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-end px-4 py-2.5 rounded-xl"
                    style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}>
                    <button onClick={() => setSchemaMode(FORM_MODES.edit)}
                        className="arbo-btn arbo-btn-secondary text-xs py-1.5 px-3">
                        <Pencil className="size-3.5" /> {t("editor.canvas.backToEditor")}
                    </button>
                </div>
                <div className={`rounded-xl overflow-hidden p-10 min-h-[500px] flex flex-col ${
                    formVAlign === "center" ? "justify-center" :
                    formVAlign === "end" ? "justify-end" : "justify-start"
                } items-center`}
                    style={{ background: getPageBgWithAutoGlow(styles), border: "1px solid var(--arbo-border)" }}>
                    <div style={{ maxWidth: maxW, width: "100%" }}>
                        {viewFormContent}
                    </div>
                </div>
            </div>
        );
    }

    // View mode (Public / Embed)
    return viewFormContent;
};

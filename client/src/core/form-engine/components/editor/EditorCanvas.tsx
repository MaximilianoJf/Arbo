import { Plus, Xmark, Gear, TrashBin, BucketPaint, Eye, ArrowRotateLeft, ArrowRotateRight } from "@gravity-ui/icons";
import { Form } from "@heroui/react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useTranslation } from "react-i18next";
import { SortableField } from "../ui/sortable/SortableField";
import { useFormStore } from "../../store";
import { FORM_MODES } from "../../constants/form-modes";
import { ModalWrapper, FieldSettingsForm } from "../forms";
import { getGlassStyle, getAccentStyle, getPageBgCss } from "../../utils/style-helpers";
import { getShadowCss } from "../../constants/style-presets";
import { useEditorContext } from "./EditorContext";

/** Simple preview button replacing the old toggle switch */
const PreviewButton = () => {
    const { setSchemaMode } = useFormStore();
    const { t } = useTranslation();
    return (
        <button
            onClick={() => setSchemaMode(FORM_MODES.preview)}
            className="arbo-btn arbo-btn-ghost text-xs py-1.5 px-3"
        >
            <Eye className="size-3.5" /> {t("common.preview")}
        </button>
    );
};

interface EditorCanvasProps {
    className?: string;
}

export const EditorCanvas = ({ className = "" }: EditorCanvasProps) => {
    const { t } = useTranslation();
    const {
        schema, setSchema, handleSubmit, styles,
        currentPage, setCurrentPage, currentPageFields, pages, totalPages, currentPageNumber,
        selectedField, setSelectedField, setRightTab,
        hoveredField, setHoveredField,
        copiedFieldStyle, setCopiedFieldStyle,
        removeField, removePage, renderField,
        handleDragEnd, sensors,
        undo, redo, canUndo, canRedo,
    } = useEditorContext();

    const renderEditFields = () => {
        const visibleFields = currentPageFields.filter((f) => !f.name?.startsWith("__page_break_"));
        if (visibleFields.length === 0) {
            return (
                <div className="flex flex-col items-center gap-3 py-16">
                    <div className="size-14 rounded-2xl bg-[var(--arbo-surface-2)] flex items-center justify-center">
                        <Plus className="size-6" style={{ color: "var(--arbo-text-muted)" }} />
                    </div>
                    <p className="text-sm arbo-text-muted text-center">
                        {t("editor.canvas.noFields")}<br />
                        <button type="button" onClick={() => setRightTab("inputs")}
                            className="text-[var(--arbo-accent)] hover:underline font-medium">
                            {t("editor.canvas.inputsPanel")}
                        </button>{" "}{t("editor.canvas.orUseAddField")}
                    </p>
                </div>
            );
        }
        const fieldIds = visibleFields.map((f) => f.name);
        return (
            <DndContext sensors={sensors} collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
                <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                    {visibleFields.map((field) => (
                        <SortableField key={field.name} id={field.name}>
                            <div
                                className={`relative flex items-start gap-2 p-3 rounded-lg transition-colors ${
                                    copiedFieldStyle
                                        ? "cursor-crosshair ring-1 ring-dashed ring-[var(--arbo-accent)]/20"
                                        : "cursor-pointer"
                                } ${
                                    selectedField === field.name
                                        ? "bg-[var(--arbo-accent-subtle)] border border-[var(--arbo-accent)]/30"
                                        : "hover:bg-[var(--arbo-surface-2)]"
                                }`}
                                onClick={() => {
                                    if (copiedFieldStyle) {
                                        setSchema((prev) => ({
                                            ...prev,
                                            fields: prev.fields.map((f) =>
                                                f.name === field.name
                                                    ? { ...f, fieldStyles: { ...copiedFieldStyle } }
                                                    : f
                                            ),
                                        }));
                                        setCopiedFieldStyle(null);
                                    } else {
                                        setSelectedField(field.name);
                                        setRightTab("field");
                                    }
                                }}
                                onMouseEnter={() => setHoveredField(field.name)}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                <div className="flex-1">{renderField(field)}</div>

                                {/* Hover action buttons */}
                                {!copiedFieldStyle && (hoveredField === field.name || selectedField === field.name) && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                                        {field.fieldStyles && (field.fieldStyles.labelColor || field.fieldStyles.inputBgColor || field.fieldStyles.inputTextColor || field.fieldStyles.inputBorderColor) && (
                                            <button type="button"
                                                onClick={(e) => { e.stopPropagation(); setCopiedFieldStyle({ ...field.fieldStyles }); }}
                                                className="p-1.5 rounded-md transition-colors"
                                                style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-accent)" }}
                                                title={t("editor.canvas.copyStyle")}>
                                                <BucketPaint className="size-3.5" />
                                            </button>
                                        )}
                                        <button type="button"
                                            onClick={(e) => { e.stopPropagation(); setSelectedField(field.name); setRightTab("field"); }}
                                            className="p-1.5 rounded-md transition-colors"
                                            style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-accent)" }}
                                            title={t("editor.canvas.configureField")}>
                                            <Gear className="size-3.5" />
                                        </button>
                                        <button type="button"
                                            onClick={(e) => { e.stopPropagation(); removeField(field.name); }}
                                            className="p-1.5 rounded-md transition-colors"
                                            style={{ background: "var(--arbo-danger-muted)", color: "var(--arbo-danger)" }}
                                            title={t("editor.canvas.deleteField")}>
                                            <TrashBin className="size-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SortableField>
                    ))}
                </SortableContext>
            </DndContext>
        );
    };

    // Page background with glass effect
    const hasGlass = (styles.cardOpacity ?? 100) < 100 || (styles.cardBlur ?? 0) > 0;
    const accent = styles.accentColor || "#4ADE80";
    const glowBg = getPageBgCss(styles);
    const editorBg = hasGlass && !styles.pageGlowEnabled
        ? `radial-gradient(ellipse at 25% 35%, ${accent}40 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, #8B5CF640 0%, transparent 55%), ${glowBg}`
        : glowBg;

    return (
        <>
            {/* Page indicator */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                        {pages.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentPage(idx)}
                                className={`size-7 rounded-lg text-xs font-bold transition-colors ${
                                    currentPage === idx
                                        ? "text-[var(--arbo-bg)]"
                                        : "bg-[var(--arbo-surface-2)] arbo-text-muted hover:bg-[var(--arbo-surface-3)]"
                                }`}
                                style={currentPage === idx ? getAccentStyle(styles) : undefined}>
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => removePage(currentPageNumber)}
                        className="text-[11px] arbo-text-muted hover:text-[var(--arbo-danger)] transition-colors">
                        {t("editor.canvas.removePage")}
                    </button>
                </div>
            )}

            {/* Fields Canvas */}
            <div className="w-full rounded-xl p-6 flex-1" style={{ background: editorBg }}>
                <div className="mx-auto w-full" style={{ maxWidth: "640px" }}>
                    <div
                        className={`p-5 rounded-[var(--arbo-radius-lg)] w-full ${className}`}
                        style={{
                            ...getGlassStyle(styles.bgColor || "#1a1a24", styles),
                            border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
                            boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
                        }}
                    >
                        {/* Paint-bucket paste banner */}
                        {copiedFieldStyle && (
                            <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg border border-[var(--arbo-accent)]/30 bg-[var(--arbo-accent-muted)]">
                                <div className="flex items-center gap-2">
                                    <BucketPaint className="size-4 text-[var(--arbo-accent)]" />
                                    <span className="text-xs font-medium text-[var(--arbo-accent)]">{t("editor.canvas.pasteStyleBanner")}</span>
                                </div>
                                <button onClick={() => setCopiedFieldStyle(null)}
                                    className="p-1 rounded-md hover:bg-[var(--arbo-surface-3)] transition-colors text-[var(--arbo-accent)]"
                                    title={t("common.cancel")}>
                                    <Xmark className="size-3.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <PreviewButton />
                                <ModalWrapper content={<FieldSettingsForm />}>
                                    <button className="arbo-btn arbo-btn-secondary text-xs py-1.5 px-3">
                                        <Plus className="size-3.5" /> {t("editor.canvas.addField")}
                                    </button>
                                </ModalWrapper>
                                {/* Undo / Redo */}
                                <div className="flex items-center gap-0.5 ml-1">
                                    <button
                                        type="button"
                                        onClick={undo}
                                        disabled={!canUndo}
                                        className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                                        style={{ color: "var(--arbo-text-muted)" }}
                                        title={t("editor.canvas.undoTitle")}
                                    >
                                        <ArrowRotateLeft className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={redo}
                                        disabled={!canRedo}
                                        className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                                        style={{ color: "var(--arbo-text-muted)" }}
                                        title={t("editor.canvas.redoTitle")}
                                    >
                                        <ArrowRotateRight className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                            <span className="text-xs arbo-text-muted">
                                {t("editor.canvas.pageOf", { current: currentPage + 1, total: totalPages })}
                            </span>
                        </div>
                        <Form validationBehavior="aria" onSubmit={handleSubmit} className="flex flex-col gap-3">
                            {renderEditFields()}
                            {schema.onSubmit && <input type="hidden" name="actionType" value={schema.onSubmit} />}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
};

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { formApi } from "@/services/api";
import type { FormSchema, FormField, ComponentType } from "@/core/form-engine/types";
import { getEnabledContactFields, firstMissingRequiredContact } from "@/core/form-engine/utils/contact-fields";
import { Check } from "@gravity-ui/icons";
import { TextField, Label, Input, FieldError } from "@heroui/react";
import { getShadowCss } from "@/core/form-engine/constants/style-presets";
import { parseSubmitActions } from "@/core/form-engine/services";
import {
    applyAlpha, isColorLight, getGlassStyle, getPageBgCss, getCardMaxWidth, getContactWidth,
    getEntranceAnimClass, getEntranceAnimStyle,
    getHoverAnimClass, getFieldFocusClass, getTransitionSpeed,
} from "@/core/form-engine/utils/style-helpers";

const mapApiFieldToSchema = (field: any): FormField => ({
    id: String(field.id),
    name: field.name,
    label: field.label || "",
    placeholder: field.placeholder || "",
    type: field.type,
    componentType: field.componentType as ComponentType,
    value: field.defaultValue || "",
    required: field.required || false,
    minLength: field.minLength,
    maxLength: field.maxLength,
    validate: field.validations || [],
    dependencies: field.dependencies || [],
    options: field.options || [],
    sortOrder: field.sortOrder || 0,
    page: field.page ?? 0,
    fieldStyles: field.fieldStyles || undefined,
});

export const EmbedFormView = () => {
    const { t } = useTranslation();
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const showContact = searchParams.get("contact") === "1";

    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [respondent, setRespondent] = useState<Record<string, string>>({});

    useEffect(() => {
        const load = async () => {
            try {
                const res = await formApi.getBySlug(slug!);
                const form = res.data;
                const formSchema: FormSchema = {
                    id: form.id,
                    title: form.title,
                    description: form.description,
                    onSubmit: form.onSubmit || "SaveToDB",
                    styles: form.styles || undefined,
                    fields: (form.fields || [])
                        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                        .map(mapApiFieldToSchema),
                };
                setSchema(formSchema);
            } catch {
                setError(t("form.formNotFound"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    // Notify parent window of height changes for auto-resize
    useEffect(() => {
        const sendHeight = () => {
            const height = document.documentElement.scrollHeight;
            window.parent.postMessage({ type: "arbo-embed-resize", height }, "*");
        };

        sendHeight();
        const observer = new ResizeObserver(sendHeight);
        observer.observe(document.body);
        return () => observer.disconnect();
    }, [schema, submitted]);

    const handleFormSubmit = async (data: Record<string, any>) => {
        if (!schema?.id) return;
        setSubmitError(null);

        // Enforce required contact fields when the contact panel is shown.
        if (showContact) {
            const missing = firstMissingRequiredContact(getEnabledContactFields(schema.styles), respondent);
            if (missing) {
                setSubmitError(t("form.contactRequired", { field: missing }));
                return;
            }
        }

        try {
            const actions = parseSubmitActions(schema.onSubmit);
            if (actions.includes("SendToEmail")) {
                const mailto = `mailto:?subject=${encodeURIComponent(schema.title + " - Response")}&body=${encodeURIComponent(JSON.stringify(data, null, 2))}`;
                window.open(mailto, "_blank");
            }
            if (actions.includes("SaveToDB")) {
                await formApi.submitResponse(schema.id, data, {
                    respondentName: respondent.respondentName || respondent.name || "",
                    respondentEmail: respondent.respondentEmail || respondent.email || "",
                });
            }
            setSubmitted(true);
        } catch (err: any) {
            setSubmitError(err.message || t("form.submitError"));
        }
    };

    if (loading) {
        return (
            <div className="min-h-dvh arbo-bg flex items-center justify-center">
                <div className="arbo-spinner" />
            </div>
        );
    }

    if (error || !schema) {
        return (
            <div className="min-h-dvh arbo-bg flex items-center justify-center px-4">
                <div className="arbo-card-static p-8 text-center">
                    <p className="text-sm text-[var(--arbo-danger)]">{error || t("form.formNotFound")}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-dvh arbo-bg flex flex-col items-center justify-center gap-4 px-4">
                <div className="arbo-card-static p-10 flex flex-col items-center gap-4 max-w-md">
                    <div className="size-14 rounded-2xl bg-[var(--arbo-accent-muted)] flex items-center justify-center">
                        <Check className="size-7 text-[var(--arbo-accent)]" />
                    </div>
                    <h2 className="text-lg font-semibold arbo-text">{t("form.thankYou")}</h2>
                    <p className="arbo-text-secondary text-center text-sm">{t("form.responseSent")}</p>
                    <button
                        onClick={() => { setSubmitted(false); setRespondent({}); }}
                        className="arbo-btn arbo-btn-secondary text-sm mt-1"
                    >
                        {t("form.submitAnother")}
                    </button>
                </div>
            </div>
        );
    }

    const embedStyles = schema.styles || {};
    const embedBgTransparent = embedStyles.embedBgTransparent ?? false;
    const embedContactEnabled = showContact;
    const embedContactPosition = embedStyles.embedContactPosition || "left";
    const accentStyle = embedStyles.gradient
        ? { background: embedStyles.gradient }
        : embedStyles.accentColor
            ? { background: embedStyles.accentColor }
            : { background: "var(--arbo-accent)" };
    const cardBg = embedStyles.bgColor || "#1a1a24";
    const glassStyle = getGlassStyle(cardBg, embedStyles);
    const cardIsLight = isColorLight(cardBg);
    const cardTitleColor = cardIsLight ? "#1e293b" : undefined;
    const cardMutedColor = cardIsLight ? "#9ca3af" : undefined;

    const contactFields = getEnabledContactFields(embedStyles);

    // Animation helpers
    const entranceClass = getEntranceAnimClass(embedStyles);
    const hoverClass = getHoverAnimClass(embedStyles);
    const focusClass = getFieldFocusClass(embedStyles);
    const transitionSpeed = getTransitionSpeed(embedStyles);
    const accentForGlowEmbed = embedStyles.accentColor || "#4ADE80";
    const glowColorEmbed = applyAlpha(accentForGlowEmbed, 0.35);

    const animVars = {
        "--arbo-transition-speed": transitionSpeed,
        "--arbo-hover-glow-color": glowColorEmbed,
        "--arbo-focus-color": applyAlpha(accentForGlowEmbed, 0.3),
    } as React.CSSProperties;

    const contactPanel = embedContactEnabled && contactFields.length > 0 && (
        <div className={`w-full shrink-0 arbo-panel-responsive ${entranceClass}`.trim()} style={{ '--panel-max-w': getContactWidth(embedStyles), ...getEntranceAnimStyle(embedStyles, 0) } as React.CSSProperties}>
            <div className={`overflow-hidden ${hoverClass}`.trim()} style={{
                ...glassStyle,
                borderRadius: `${embedStyles.borderRadius ?? 14}px`,
                border: `1px solid ${embedStyles.borderColor || "var(--arbo-border)"}`,
                boxShadow: getShadowCss(embedStyles.shadowStyle, embedStyles.accentColor, embedStyles.gradient),
            }}>
                <div className="h-2" style={accentStyle} />
                <div className="p-5">
                    <h2 className="text-base font-semibold mb-1" style={{ color: cardTitleColor || "var(--arbo-text)" }}>{t("form.contactTitle")}</h2>
                    <p className="text-xs mb-4" style={{ color: cardMutedColor || "var(--arbo-text-muted)" }}>{t("form.contactSubtitle")}</p>
                    <div className="flex flex-col gap-3">
                        {contactFields.map((cf) => (
                            <TextField key={cf.id} name={cf.name}
                                type={cf.type === "email" ? "email" : cf.type === "tel" ? "tel" : "text"}
                                value={respondent[cf.name] || ""}
                                isRequired={!!cf.required}
                                onChange={(v) => setRespondent((prev) => ({ ...prev, [cf.name]: v }))}>
                                <Label className="text-xs font-medium arbo-text-secondary">
                                    {cf.label}{cf.required && <span className="text-[var(--arbo-danger)]"> *</span>}
                                </Label>
                                <Input placeholder={cf.placeholder || ""} />
                                <FieldError />
                            </TextField>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const formPanel = (
        <div className={`w-full lg:flex-1 arbo-panel-responsive ${focusClass}`.trim()} style={{ '--panel-max-w': getCardMaxWidth(embedStyles) } as React.CSSProperties}>
            {submitError && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20">
                    <p className="text-sm text-[var(--arbo-danger)]">{submitError}</p>
                </div>
            )}
            <FormBuilder formSchema={schema} mode="view" isSystemForm={false} onAuthSubmit={handleFormSubmit} />
        </div>
    );

    return (
        <div className="min-h-dvh px-4 py-8" style={{ background: embedBgTransparent ? "transparent" : getPageBgCss(embedStyles), ...animVars }}>
            <div className={`max-w-5xl mx-auto ${embedContactEnabled ? "flex flex-col lg:flex-row items-center lg:items-start gap-5" : "flex justify-center"}`}>
                {embedContactPosition === "left" ? <>{contactPanel}{formPanel}</> : <>{formPanel}{contactPanel}</>}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
                <span className="text-[10px] arbo-text-muted tracking-wide">{t("form.poweredBy")}</span>
                <span className="text-[10px] font-semibold arbo-text-muted">Arbo Forms</span>
            </div>
        </div>
    );
};

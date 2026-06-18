import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { formApi } from "@/services/api";
import type { FormSchema, FormField, ComponentType, ContactField, PageBreakpoint } from "@/core/form-engine/types";
import { TextField, Label, Input, FieldError } from "@heroui/react";
import { Check } from "@gravity-ui/icons";
import { Logo } from "@/components/ui";
import { PageDecorView } from "@/core/form-engine/components/PageDecorView";
import arboLogo from "@/assets/arbo_logo_small.png";
import { getShadowCss } from "@/core/form-engine/constants/style-presets";
import {
    applyAlpha, isColorLight, getGlassStyle, getPageBgCss, getCardMaxWidth, getContactWidth,
    getPageHeadingSizeClass, getEntranceAnimClass, getEntranceAnimStyle,
    getHoverAnimClass, getFieldFocusClass, getTransitionSpeed,
    gridItemStyle, pageLayoutHeight, normalizePageLayout, getLayoutItems, findLayoutItem, breakpointFromWidth,
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

export const PublicFormView = () => {
    const { t } = useTranslation();
    const { slug } = useParams();
    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [respondent, setRespondent] = useState<Record<string, string>>({});
    const [bp, setBp] = useState<PageBreakpoint>(() => breakpointFromWidth(typeof window !== "undefined" ? window.innerWidth : 1280));

    useEffect(() => {
        const onResize = () => setBp(breakpointFromWidth(window.innerWidth));
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Measure the real content bottom so the grid container grows and the footer sits below everything
    const gridRef = useRef<HTMLDivElement>(null);
    const [contentBottom, setContentBottom] = useState(0);
    useEffect(() => {
        const el = gridRef.current;
        if (!el) return;
        const measure = () => {
            let maxB = 0;
            el.querySelectorAll<HTMLElement>("[data-grid-item]").forEach((c) => { maxB = Math.max(maxB, c.offsetTop + c.offsetHeight); });
            setContentBottom(maxB);
        };
        const ro = new ResizeObserver(measure);
        el.querySelectorAll("[data-grid-item]").forEach((c) => ro.observe(c));
        measure();
        return () => ro.disconnect();
    }, [bp, schema, submitted, respondent]);

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
                setError(t("form.formNotFoundPublished"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    const handleFormSubmit = async (data: Record<string, any>) => {
        if (!schema?.id) return;
        setSubmitError(null);
        try {
            if (schema.onSubmit === "SendToEmail") {
                const mailto = `mailto:?subject=${encodeURIComponent(schema.title + " - Response")}&body=${encodeURIComponent(JSON.stringify(data, null, 2))}`;
                window.open(mailto, "_blank");
                setSubmitted(true);
                return;
            }
            await formApi.submitResponse(schema.id, data, {
                respondentName: respondent.respondentName || respondent.name || "",
                respondentEmail: respondent.respondentEmail || respondent.email || "",
                respondentData: Object.keys(respondent).length > 0 ? respondent : undefined,
            });
            setSubmitted(true);
        } catch (err: any) {
            setSubmitError(err.message || t("form.submitError"));
        }
    };

    const pageBg = getPageBgCss(schema?.styles);

    // --- Loading ---
    if (loading) {
        return (
            <div className="min-h-dvh arbo-bg flex items-center justify-center">
                <div className="arbo-spinner" />
            </div>
        );
    }

    // --- Error ---
    if (error || !schema) {
        return (
            <div className="min-h-dvh arbo-bg flex flex-col items-center justify-center gap-6 px-4">
                <Logo width={40} />
                <div className="arbo-card-static p-8 text-center max-w-sm">
                    <p className="text-[var(--arbo-danger)] font-medium">{error || t("form.formNotFound")}</p>
                </div>
            </div>
        );
    }

    // --- Submitted ---
    if (submitted) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4" style={{ background: pageBg }}>
                <div className="arbo-card-static p-10 flex flex-col items-center gap-4 max-w-md">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-accent-muted)] flex items-center justify-center">
                        <Check className="size-8 text-[var(--arbo-accent)]" />
                    </div>
                    <h2 className="text-xl font-bold arbo-text">{t("form.thankYou")}</h2>
                    <p className="arbo-text-secondary text-center text-sm">{t("form.responseSent")}</p>
                    <button
                        onClick={() => { setSubmitted(false); setRespondent({}); }}
                        className="arbo-btn arbo-btn-secondary text-sm mt-2"
                    >
                        {t("form.submitAnother")}
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Style helpers ---
    const styles = schema.styles || {};
    const gridOn = !!styles.pageLayout?.enabled;   // when on, panels fill their grid cell
    const accentStyle = styles.gradient
        ? { background: styles.gradient }
        : styles.accentColor
            ? { background: styles.accentColor }
            : { background: "var(--arbo-accent)" };
    const cardBg = styles.bgColor || "#1a1a24";
    const glassStyle = getGlassStyle(cardBg, styles);
    const cardIsLight = isColorLight(cardBg);
    const cardTitleColor = cardIsLight ? "#1e293b" : undefined;
    const cardSubColor = cardIsLight ? "#475569" : undefined;
    const cardMutedColor = cardIsLight ? "#9ca3af" : undefined;
    const contactEnabled = styles.contactEnabled ?? true;
    const contactPosition = styles.contactPosition || "left";
    const defaultContactFields: ContactField[] = [
        { id: "name", name: "respondentName", label: "Nombre", type: "text", placeholder: "Tu nombre", required: false, enabled: true },
        { id: "email", name: "respondentEmail", label: "Email", type: "email", placeholder: "tu@email.com", required: false, enabled: true },
    ];
    const contactFields = (styles.contactFields || defaultContactFields).filter((cf) => cf.enabled);

    // Animation helpers (must be declared before contactPanel / formPanel)
    const entranceClass = getEntranceAnimClass(styles);
    const hoverClass = getHoverAnimClass(styles);
    const focusClass = getFieldFocusClass(styles);
    const transitionSpeed = getTransitionSpeed(styles);
    const accentForGlow = styles.accentColor || "#4ADE80";
    const glowColorPub = applyAlpha(accentForGlow, 0.35);

    const animVars = {
        "--arbo-transition-speed": transitionSpeed,
        "--arbo-hover-glow-color": glowColorPub,
        "--arbo-focus-color": applyAlpha(accentForGlow, 0.3),
    } as React.CSSProperties;

    const contactPanel = contactEnabled && contactFields.length > 0 && (
        <div className={`flex flex-col gap-4 w-full shrink-0 arbo-panel-responsive ${entranceClass}`.trim()} style={{ '--panel-max-w': gridOn ? '100%' : getContactWidth(styles), ...getEntranceAnimStyle(styles, 0) } as React.CSSProperties}>
            <div
                className={`overflow-hidden ${hoverClass}`.trim()}
                style={{
                    ...glassStyle,
                    borderRadius: `${styles.borderRadius ?? 14}px`,
                    border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
                    boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
                }}
            >
                <div className="h-2" style={accentStyle} />
                <div className="p-5">
                    <h2 className="text-base font-semibold mb-1" style={{ color: cardTitleColor || "var(--arbo-text)" }}>
                        {styles.contactTitle || t("form.contactTitle")}
                    </h2>
                    <p className="text-xs mb-4" style={{ color: cardMutedColor || "var(--arbo-text-muted)" }}>
                        {styles.contactSubtitle || t("form.contactSubtitle")}
                    </p>
                    <div className="flex flex-col gap-3">
                        {contactFields.map((cf) => (
                            <TextField
                                key={cf.id}
                                name={cf.name}
                                type={cf.type === "email" ? "email" : cf.type === "tel" ? "tel" : cf.type === "url" ? "url" : "text"}
                                value={respondent[cf.name] || ""}
                                onChange={(v) => setRespondent((prev) => ({ ...prev, [cf.name]: v }))}
                            >
                                <Label className="text-xs font-medium" style={{ color: cardMutedColor || "var(--arbo-text-secondary)" }}>{cf.label}</Label>
                                <Input placeholder={cf.placeholder || cf.label} />
                                <FieldError />
                            </TextField>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const formPanel = (
        <div className={`w-full lg:flex-1 arbo-panel-responsive ${focusClass}`.trim()} style={{ '--panel-max-w': gridOn ? '100%' : getCardMaxWidth(styles) } as React.CSSProperties}>
            {submitError && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20">
                    <p className="text-sm text-[var(--arbo-danger)]">{submitError}</p>
                </div>
            )}
            <FormBuilder formSchema={schema} mode="view" isSystemForm={false} onAuthSubmit={handleFormSubmit} />
        </div>
    );

    const formVAlign = styles.formVerticalAlign || "start";

    // ── Free grid layout (overrides the flex arrangement) ──
    const layout = styles.pageLayout?.enabled ? normalizePageLayout(styles.pageLayout) : null;
    if (layout) {
        const { cols, rowH } = layout;
        const items = getLayoutItems(layout, bp);   // breakpoint-specific positions
        const logoItem = findLayoutItem(items, "logo");
        const imageItem = findLayoutItem(items, "image");
        const headingItem = findLayoutItem(items, "heading");
        const headerItem = findLayoutItem(items, "header");
        const contactItem = findLayoutItem(items, "contact");
        const formItem = findLayoutItem(items, "form");
        const footerItem = findLayoutItem(items, "footer");

        const headingOn = (styles.pageHeadingEnabled ?? false) && !!styles.pageHeadingText;
        const headerOn = styles.cardHeaderEnabled !== false;
        const logoOn = styles.logoEnabled ?? true;
        // Bound the logo to its grid cell height (cells use min-height, so an image
        // would otherwise render at its natural size and look oversized).
        const logoH = (logoItem?.h ?? 1) * rowH;
        const logoEl = (
            <div className="flex items-center justify-center w-full" style={{ height: logoH }}>
                <img src={styles.logoUrl || arboLogo} alt="Logo" className="object-contain" style={{ maxHeight: "100%", maxWidth: "100%" }} />
            </div>
        );

        // Free image element (bound to its grid cell). When it spans the whole grid width it
        // becomes full-bleed (edge to edge of the screen) instead of the centered container.
        const imageH = (imageItem?.h ?? 1) * rowH;
        const imageFullBleed = !!imageItem && imageItem.x === 0 && imageItem.w === cols;
        const imageEl = styles.pageBgImage ? (
            <img src={styles.pageBgImage} alt="" className="w-full h-full" style={{ objectFit: styles.pageImageFit || "cover", borderRadius: imageFullBleed ? 0 : `${styles.borderRadius ?? 14}px` }} />
        ) : null;

        const headingEl = headingOn ? (
            <h2 className={`font-bold ${getPageHeadingSizeClass(styles.pageHeadingSize)}`}
                style={{ color: styles.pageHeadingColor || "#ffffff", textAlign: (styles.pageHeadingAlign || "center") as any }}>
                {styles.pageHeadingText}
            </h2>
        ) : null;

        // Standalone header card (title + description), positioned independently
        const cardChrome: React.CSSProperties = {
            ...glassStyle,
            borderRadius: `${styles.borderRadius ?? 14}px`,
            border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
            boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
        };
        const headerCardEl = (
            <div className="overflow-hidden" style={cardChrome}>
                <div className="h-2" style={accentStyle} />
                <div className="p-5">
                    <h1 className="text-xl font-bold" style={{ color: cardTitleColor || "var(--arbo-text)" }}>{schema.title}</h1>
                    {schema.description && (
                        <p className="text-sm mt-1" style={{ color: cardSubColor || "var(--arbo-text-secondary)" }}>{schema.description}</p>
                    )}
                </div>
            </div>
        );

        // Form element renders only the fields (header card is a separate element)
        const formGridEl = (
            <div className="w-full">
                {submitError && (
                    <div className="mb-4 p-3 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20">
                        <p className="text-sm text-[var(--arbo-danger)]">{submitError}</p>
                    </div>
                )}
                <FormBuilder
                    formSchema={{ ...schema, styles: { ...styles, cardHeaderEnabled: false } }}
                    mode="view"
                    isSystemForm={false}
                    onAuthSubmit={handleFormSubmit}
                />
            </div>
        );

        const cellVars = { ["--panel-max-w" as any]: "100%" };
        const decors = layout.decors || [];
        const decorPos = (d: (typeof decors)[number]): React.CSSProperties => ({
            position: "absolute",
            left: `${(d.x / cols) * 100}%`,
            top: d.y * rowH,
            width: `${(d.w / cols) * 100}%`,
            height: d.h * rowH,
        });
        const containerMinH = Math.max(pageLayoutHeight(items, rowH), contentBottom + (footerItem ? 64 : 16));
        return (
            <div className="min-h-dvh flex flex-col px-4 py-8" style={{ background: pageBg, ...animVars }}>
                <div ref={gridRef} className="relative w-full max-w-5xl mx-auto" style={{ minHeight: containerMinH }}>
                    {/* Image is a backdrop — rendered first (tree order) at z 0 so it sits behind the
                        other elements but in front of the page background. Full-width images break
                        out of the centered container to cover the whole screen width. */}
                    {imageItem && imageEl && (
                        <div
                            data-grid-item
                            style={imageFullBleed
                                ? { position: "absolute", top: imageItem.y * rowH, height: imageH, left: "calc(50% - 50vw)", width: "100vw", zIndex: 0 }
                                : { ...gridItemStyle(imageItem, cols, rowH), ...cellVars, zIndex: 0 }}
                        >
                            {imageEl}
                        </div>
                    )}
                    {/* Back-layer decorations: above the backdrop image, behind the form elements */}
                    {decors.filter((d) => (d.layer || "back") === "back").map((d) => (
                        <div key={d.id} data-grid-item style={{ ...decorPos(d), zIndex: 0 }}><PageDecorView decor={d} /></div>
                    ))}
                    {logoItem && logoOn && (
                        <div data-grid-item style={{ ...gridItemStyle(logoItem, cols, rowH), ...cellVars }}>{logoEl}</div>
                    )}
                    {headingItem && headingEl && (
                        <div data-grid-item style={{ ...gridItemStyle(headingItem, cols, rowH), ...cellVars }}>{headingEl}</div>
                    )}
                    {headerItem && headerOn && (
                        <div data-grid-item style={{ ...gridItemStyle(headerItem, cols, rowH), ...cellVars }}>{headerCardEl}</div>
                    )}
                    {contactItem && contactPanel && (
                        <div data-grid-item style={{ ...gridItemStyle(contactItem, cols, rowH), ...cellVars }}>{contactPanel}</div>
                    )}
                    {formItem && (
                        <div data-grid-item style={{ ...gridItemStyle(formItem, cols, rowH), ...cellVars }}>{formGridEl}</div>
                    )}
                    {/* Front-layer decorations: painted on top of everything */}
                    {decors.filter((d) => d.layer === "front").map((d) => (
                        <div key={d.id} data-grid-item className="pointer-events-none" style={decorPos(d)}><PageDecorView decor={d} /></div>
                    ))}
                    {/* Footer sits below the real content (its grid Y is unreliable with dynamic-height content) */}
                    {footerItem && (
                        <div style={{ position: "absolute", top: contentBottom + 16, left: 0, width: "100%" }}><Footer /></div>
                    )}
                </div>
                {!footerItem && <Footer />}
            </div>
        );
    }

    return (
        <div
            className={`min-h-dvh flex flex-col px-4 ${
                formVAlign === "center" ? "justify-center py-8" :
                formVAlign === "end"    ? "justify-end pb-10 pt-4" :
                                          "pt-10 pb-4"
            }`}
            style={{ background: pageBg, ...animVars }}
        >
            {/* Page heading */}
            {(styles.pageHeadingEnabled ?? false) && styles.pageHeadingText && (
                <h2 className={`w-full max-w-5xl mx-auto font-bold mb-5 ${getPageHeadingSizeClass(styles.pageHeadingSize)}`}
                    style={{ color: styles.pageHeadingColor || "#ffffff", textAlign: (styles.pageHeadingAlign || "center") as any }}>
                    {styles.pageHeadingText}
                </h2>
            )}

            <div className="flex w-full flex-col lg:flex-row items-center lg:items-start justify-center gap-5 max-w-5xl mx-auto">
                {contactPosition === "left" ? <>{contactPanel}{formPanel}</> : <>{formPanel}{contactPanel}</>}
            </div>
            <Footer />
        </div>
    );
};

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="py-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity">
                <Logo width={20} showText={false} />
                <span className="text-xs arbo-text-muted font-medium">
                    {t("form.createdWith")} <span className="arbo-text-secondary font-semibold">Arbo Forms</span>
                </span>
            </div>
        </footer>
    );
};

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { formApi, authApi, type ChildFormLink } from "@/services/api";
import { GoogleSignInButton } from "@/features/auth/components";
import type { FormSchema, FormField, ComponentType, PageBreakpoint } from "@/core/form-engine/types";
import { getEnabledContactFields, firstMissingRequiredContact } from "@/core/form-engine/utils/contact-fields";
import { applyFieldMeta } from "@/core/form-engine/utils/field-meta";
import { TextField, Label, Input, FieldError } from "@heroui/react";
import { Check, ArrowRight } from "@gravity-ui/icons";
import { Logo } from "@/components/ui";
import { PageDecorView } from "@/core/form-engine/components/PageDecorView";
import arboLogo from "@/assets/arbo_logo_small.png";
import { getShadowCss } from "@/core/form-engine/constants/style-presets";
import { parseSubmitActions } from "@/core/form-engine/services";
import {
    applyAlpha, isColorLight, getGlassStyle, getPageBgCss, getPageImageStyle, getCardMaxWidth, getContactWidth,
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
    ...applyFieldMeta(field),
});

/** Decode a JWT and return its payload (no verification, client-side only). */
const decodeToken = (token: string): { email?: string; name?: string } | null => {
    try {
        return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
        return null;
    }
};

export const PublicFormView = () => {
    const { t } = useTranslation();
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    // Signed references linking this submission to parent responses (relational chain / M:N bridge).
    const ref = searchParams.get("ref") || undefined;
    const ref2 = searchParams.get("ref2") || undefined;
    // isPreview is resolved after the form loads (requires isOwner from API).
    const previewParam = searchParams.get("preview") === "1";
    // Whether the respondent is authenticated.
    const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
    // Email decoded from the stored token (shown in the "Respondiendo como" chip).
    const [authEmail, setAuthEmail] = useState<string | null>(() => {
        const token = localStorage.getItem("token");
        return token ? (decodeToken(token)?.email ?? null) : null;
    });
    const [authError, setAuthError] = useState<string | null>(null);
    // True once confirmed from the API that the logged-in user owns this form.
    const [isOwner, setIsOwner] = useState(false);
    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [alreadyResponded, setAlreadyResponded] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [respondent, setRespondent] = useState<Record<string, string>>({});
    // Related forms to continue into, surfaced after a successful submit.
    const [childForms, setChildForms] = useState<ChildFormLink[]>([]);
    const [bp, setBp] = useState<PageBreakpoint>(() => breakpointFromWidth(typeof window !== "undefined" ? window.innerWidth : 1280));
    // Preview mode only applies when the API confirms the requester owns the form.
    const isPreview = previewParam && isOwner;

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
                setSchema({ ...formSchema, isRelational: form.isRelational ?? false });
                // Preview mode is only valid for the form's owner.
                if (form.isOwner) setIsOwner(true);

                // If the user is authenticated (and not in preview mode or N-side child form),
                // check upfront whether they already responded.
                // Skip when ?ref= is present: N-side (one_to_many) forms allow multiple entries,
                // and one_to_one uniqueness is enforced at submit time on the server.
                const ownerPreview = previewParam && !!form.isOwner;
                if (authed && !ownerPreview && !ref) {
                    try {
                        const mine = await formApi.checkMyResponse(form.id, ref);
                        if (mine.data.hasResponded) setAlreadyResponded(true);
                    } catch { /* non-blocking: duplicate check on submit will still catch it */ }
                }
            } catch {
                setError(t("form.formNotFoundPublished"));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    // Google sign-in: store the token and mark as authenticated.
    const handleGoogleSuccess = async (credential: string) => {
        setAuthError(null);
        try {
            const res = await authApi.google(credential);
            localStorage.setItem("token", res.token);
            try {
                const profile = decodeToken(credential);
                if (profile?.email) setAuthEmail(profile.email);
            } catch { /* prefill is best-effort */ }
            setAuthed(true);
        } catch (e: any) {
            setAuthError(e.message || "No se pudo iniciar sesión con Google");
        }
    };

    const handleFormSubmit = async (data: Record<string, any>) => {
        if (!schema?.id) return;
        if (isPreview) return; // no-op in preview mode
        setSubmitError(null);

        // If not authenticated, enforce required contact fields when the panel is enabled.
        if (!authed && (schema.styles?.contactEnabled ?? false)) {
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
                // Authenticated users are identified server-side; anonymous users send contact data.
                const res = await formApi.submitResponse(schema.id, data, {
                    respondentName: authed ? undefined : (respondent.respondentName || respondent.name || ""),
                    respondentEmail: authed ? undefined : (respondent.respondentEmail || respondent.email || ""),
                    respondentData: !authed && Object.keys(respondent).length > 0 ? respondent : undefined,
                }, ref, ref2);
                setChildForms(res.childForms || []);
            }
            setSubmitted(true);
        } catch (err: any) {
            if (err.message?.includes("Ya enviaste una respuesta")) {
                setAlreadyResponded(true);
            } else {
                setSubmitError(err.message || t("form.submitError"));
            }
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

                    {/* Related forms — continue the chain (each link carries a signed ref back to this response) */}
                    {childForms.length > 0 && (
                        <div className="w-full flex flex-col gap-2 mt-2">
                            <p className="text-xs font-semibold arbo-text-muted text-center">Continuar con</p>
                            {childForms.map((cf) => (
                                <a
                                    key={cf.formId}
                                    href={cf.url}
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] hover:border-[var(--arbo-accent)]/50 transition-colors"
                                >
                                    <span className="flex-1 text-sm font-medium arbo-text group-hover:text-[var(--arbo-accent)] transition-colors">{cf.title}</span>
                                    <ArrowRight className="size-4 arbo-text-muted group-hover:text-[var(--arbo-accent)] group-hover:translate-x-1 transition-all shrink-0" />
                                </a>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => { setSubmitted(false); setRespondent({}); setChildForms([]); }}
                        className="arbo-btn arbo-btn-secondary text-sm mt-2"
                    >
                        {t("form.submitAnother")}
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Already responded (duplicate gate) — skipped in preview mode ---
    if (alreadyResponded && !isPreview) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4" style={{ background: pageBg }}>
                <div className="arbo-card-static p-10 flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-accent-muted)] flex items-center justify-center">
                        <Check className="size-8 text-[var(--arbo-accent)]" />
                    </div>
                    <h2 className="text-xl font-bold arbo-text">Ya enviaste tu respuesta</h2>
                    <p className="text-sm arbo-text-muted">
                        Solo se permite una respuesta por persona en este formulario.
                        {authEmail && <> Estás identificado como <span className="arbo-text font-medium">{authEmail}</span>.</>}
                    </p>
                    <button onClick={() => window.history.back()} className="arbo-btn arbo-btn-secondary text-sm mt-2">
                        Volver
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Missing parent gate: relational child accessed without ?ref= ---
    // Blocked only when strict mode is ON (default) AND the visitor is not authenticated.
    // Authenticated users (owners / internal admins) always bypass this gate.
    // When requiresParentChain===false the form is in "free" mode — anyone can fill it directly.
    if (schema.isRelational && !ref && !isPreview && !authed && schema.styles?.requiresParentChain !== false) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4" style={{ background: pageBg }}>
                <Logo width={40} />
                <div className="arbo-card-static p-10 flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-warning-muted,#fef3c7)] flex items-center justify-center">
                        <ArrowRight className="size-8 text-[var(--arbo-warning,#d97706)]" />
                    </div>
                    <h2 className="text-xl font-bold arbo-text">Formulario vinculado</h2>
                    <p className="text-sm arbo-text-muted">
                        Este formulario es parte de un flujo relacional y solo puede responderse
                        desde el formulario principal que lo origina. Accedé primero al formulario
                        padre y completá este desde allí.
                    </p>
                    <button onClick={() => window.history.back()} className="arbo-btn arbo-btn-secondary text-sm mt-2">
                        Volver
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    // --- Auth gate: skipped entirely in preview mode ---
    const needsAuth = !isPreview && (schema.styles?.requiresGoogleAuth || !!ref);
    if (needsAuth && !authed) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4" style={{ background: pageBg }}>
                <Logo width={40} />
                <div className="arbo-card-static p-8 flex flex-col items-center gap-4 max-w-sm w-full text-center">
                    <h2 className="text-lg font-bold arbo-text">{schema.title}</h2>
                    <p className="text-sm arbo-text-muted">
                        Este formulario requiere que inicies sesión para responderlo.
                    </p>
                    <div className="w-full">
                        <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={() => setAuthError("No se pudo iniciar sesión con Google")} />
                    </div>
                    {authError && <p className="text-xs text-[var(--arbo-danger)]">{authError}</p>}
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 h-px bg-[var(--arbo-border)]" />
                        <span className="text-xs arbo-text-muted">o</span>
                        <div className="flex-1 h-px bg-[var(--arbo-border)]" />
                    </div>
                    <a
                        href={`/?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                        className="arbo-btn arbo-btn-secondary w-full text-sm"
                    >
                        Iniciar sesión con cuenta Arbo
                    </a>
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
    // Hide the contact panel for authenticated users — the server identifies them from the token.
    const contactEnabled = (styles.contactEnabled ?? false) && !authed;
    const contactPosition = styles.contactPosition || "left";
    const contactFields = getEnabledContactFields(styles);

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
                                isRequired={!!cf.required}
                                onChange={(v) => setRespondent((prev) => ({ ...prev, [cf.name]: v }))}
                            >
                                <Label className="text-xs font-medium" style={{ color: cardMutedColor || "var(--arbo-text-secondary)" }}>
                                    {cf.label}{cf.required && <span className="text-[var(--arbo-danger)]"> *</span>}
                                </Label>
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
            {/* Preview mode banner */}
            {isPreview && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--arbo-warning-muted,rgba(245,158,11,0.12))] border border-[var(--arbo-warning,#f59e0b)]/30 text-xs text-[var(--arbo-warning,#f59e0b)]">
                    <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Modo preview — las respuestas no se guardan</span>
                </div>
            )}
            {/* Identity chip: shown when the user is authenticated */}
            {authed && authEmail && !isPreview && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/20 text-xs arbo-text-accent">
                    <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span>Respondiendo como <span className="font-medium">{authEmail}</span></span>
                </div>
            )}
            {/* Relational info banner: shown when the form is in strict parent-chain mode
                and is being filled directly (no ?ref=). Informs authenticated admins that
                they are bypassing the normal flow. Hidden when requiresParentChain===false. */}
            {schema.isRelational && !ref && !isPreview && authed && schema.styles?.requiresParentChain !== false && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--arbo-warning-muted,rgba(245,158,11,0.12))] border border-[var(--arbo-warning,#f59e0b)]/30 text-xs text-[var(--arbo-warning,#f59e0b)]">
                    <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span>Flujo relacional — respondiendo como administrador sin pasar por el formulario padre.</span>
                </div>
            )}
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
            <img src={styles.pageBgImage} alt="" className="w-full h-full" style={getPageImageStyle(styles)} />
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
        // A snapped full-bleed image is anchored to the screen edge, so it must not drive the
        // page height — otherwise anchoring it to the bottom grows the page in a feedback loop.
        const imageSnapped = imageFullBleed && !!styles.pageImageSnap && styles.pageImageSnap !== "none";
        const heightItems = imageSnapped ? items.filter((it) => it.key !== "image") : items;
        const containerMinH = Math.max(pageLayoutHeight(heightItems, rowH), contentBottom + (footerItem ? 64 : 16));
        return (
            <div className="min-h-dvh flex flex-col px-4 py-8" style={{ background: pageBg, ...animVars }}>
                <div ref={gridRef} className={`relative w-full max-w-5xl mx-auto ${styles.pageImageSnap === "bottom" ? "flex-1" : ""}`} style={{ minHeight: containerMinH }}>
                    {/* Image is a backdrop — rendered first (tree order) at z 0 so it sits behind the
                        other elements but in front of the page background. Full-width images break
                        out of the centered container to cover the whole screen width. */}
                    {imageItem && imageEl && (
                        <div
                            // Snapped images are excluded from the content-bottom measurement —
                            // anchored to the container bottom they would grow the page forever.
                            {...(imageSnapped ? {} : { "data-grid-item": true })}
                            style={imageFullBleed
                                ? {
                                    position: "absolute", height: imageH, left: "calc(50% - 50vw)", width: "100vw", zIndex: 0,
                                    // Snap pulls the image past the page padding so it touches the screen edge
                                    ...(styles.pageImageSnap === "top" ? { top: -32 }
                                        : styles.pageImageSnap === "bottom" ? { top: "auto", bottom: -32 }
                                        : { top: imageItem.y * rowH }),
                                }
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
                    {/* Footer: use the grid Y as the minimum position, but push it below the
                        actual content when the form card is taller than its allocated rows. */}
                    {footerItem && (
                        <div style={{ position: "absolute", top: Math.max(footerItem.y * rowH, contentBottom + 16), left: 0, width: "100%" }}><Footer /></div>
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
            {/* Logo — same element as in grid mode, fixed centered position here */}
            {(styles.logoEnabled ?? true) && (
                <div className="w-full max-w-5xl mx-auto flex justify-center mb-4">
                    <img src={styles.logoUrl || arboLogo} alt="Logo" className="object-contain" style={{ maxHeight: 44 }} />
                </div>
            )}

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

/* eslint-disable react-refresh/only-export-components */
import { useTranslation } from "react-i18next";
import {
    getGlassStyle, getAccentStyle, getPageHeadingSizeClass,
    getEntranceAnimClass, getEntranceAnimStyle, getHoverAnimClass, getFieldFocusClass,
} from "../../utils/style-helpers";
import { getShadowCss } from "../../constants/style-presets";
import { DEFAULT_CONTACT_FIELDS } from "../../constants/editor-constants";
import { useEditorContext } from "./EditorContext";
import arboLogo from "@/assets/arbo_logo_small.png";

/** Shared card style derived from the current form styles. */
export const useCardStyle = (): React.CSSProperties => {
    const { styles } = useEditorContext();
    return {
        ...getGlassStyle(styles.bgColor || "#1a1a24", styles),
        borderRadius: `${styles.borderRadius ?? 14}px`,
        border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
        boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
    };
};

/** Editable page heading (the big title above the form). */
export const HeadingPreview = () => {
    const { t } = useTranslation();
    const { styles, updateStyles } = useEditorContext();
    return (
        <input
            className={`w-full bg-transparent border-0 outline-none font-bold ${getPageHeadingSizeClass(styles.pageHeadingSize)} focus:opacity-80 transition-opacity cursor-text`}
            style={{ color: styles.pageHeadingColor || "#ffffff", textAlign: (styles.pageHeadingAlign || "center") as any, fontFamily: "inherit" }}
            value={styles.pageHeadingText || ""}
            onChange={(e) => updateStyles({ pageHeadingText: e.target.value })}
            placeholder={t("editor.pageTab.yourTitleHere")}
        />
    );
};

/** Header card: editable title + description (positionable separately from the form). */
export const HeaderPreview = () => {
    const { t } = useTranslation();
    const { schema, setSchema, styles, updateStyles, cardTitleColor, cardSubColor } = useEditorContext();
    const cardStyle = useCardStyle();
    const entranceClass = getEntranceAnimClass(styles);
    const hoverClass = getHoverAnimClass(styles);

    return (
        <div className={`w-full overflow-hidden ${entranceClass} ${hoverClass}`.trim()} style={{ ...cardStyle, ...getEntranceAnimStyle(styles, 0) }}>
            <label className="block h-2 cursor-pointer" style={getAccentStyle(styles)} title="Clic para cambiar accent">
                <input type="color" value={styles.accentColor || "#4ADE80"} onChange={(e) => updateStyles({ accentColor: e.target.value, gradient: undefined })} className="opacity-0 w-full h-full cursor-pointer block" />
            </label>
            <div className="p-5">
                <input className="text-xl font-bold bg-transparent border-0 outline-none w-full p-0 focus:opacity-80 transition-opacity cursor-text"
                    style={{ color: cardTitleColor, fontFamily: "inherit" }}
                    value={schema.title}
                    onChange={(e) => setSchema((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder={t("editor.preview.formTitlePlaceholder")} />
                <input className="text-sm bg-transparent border-0 outline-none w-full p-0 mt-1 focus:opacity-80 transition-opacity cursor-text"
                    style={{ color: cardSubColor, fontFamily: "inherit" }}
                    value={schema.description || ""}
                    onChange={(e) => setSchema((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder={t("editor.preview.descriptionPlaceholder")} />
            </div>
        </div>
    );
};

/** The form: fields card only (header is a separate element now). */
export const FormPreview = () => {
    const { t } = useTranslation();
    const { schema, styles, updateStyles, renderViewFields, animReplayKey } = useEditorContext();
    const cardStyle = useCardStyle();
    const entranceClass = getEntranceAnimClass(styles);
    const hoverClass = getHoverAnimClass(styles);
    const focusClass = getFieldFocusClass(styles);
    const headerOn = styles.cardHeaderEnabled !== false;
    const visibleFields = schema.fields.filter((f) => !f.name?.startsWith("__page_break_"));

    return (
        <div className="w-full" key={animReplayKey}>
            <div className={`w-full overflow-hidden ${entranceClass} ${hoverClass} ${focusClass}`.trim()} style={{ ...cardStyle, ...getEntranceAnimStyle(styles, headerOn ? 1 : 0) }}>
                {!headerOn && (
                    <label className="block h-2 cursor-pointer" style={getAccentStyle(styles)} title="Clic para cambiar accent">
                        <input type="color" value={styles.accentColor || "#4ADE80"} onChange={(e) => updateStyles({ accentColor: e.target.value, gradient: undefined })} className="opacity-0 w-full h-full cursor-pointer block" />
                    </label>
                )}
                <div className="p-6 flex flex-col gap-4">
                    {visibleFields.length > 0
                        ? renderViewFields(visibleFields)
                        : <p className="text-sm arbo-text-muted text-center py-8">{t("editor.preview.noFields")}</p>}
                    <div className="flex justify-end pt-2">
                        <div className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={getAccentStyle(styles)}>{t("common.submit")}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Contact panel card. */
export const ContactPreview = () => {
    const { t } = useTranslation();
    const { styles } = useEditorContext();
    const cardStyle = useCardStyle();
    const contactFs = (styles.contactFields || DEFAULT_CONTACT_FIELDS).filter((cf: any) => cf.enabled);
    if (contactFs.length === 0) return null;

    return (
        <div className="w-full">
            <div className="overflow-hidden" style={cardStyle}>
                <div className="h-2" style={getAccentStyle(styles)} />
                <div className="p-5">
                    <h2 className="text-base font-semibold arbo-text mb-1">{styles.contactTitle || t("editor.preview.contactTitle")}</h2>
                    <p className="text-xs arbo-text-muted mb-4">{styles.contactSubtitle || t("editor.preview.contactSubtitle")}</p>
                    <div className="flex flex-col gap-3">
                        {contactFs.map((cf: any) => (
                            <div key={cf.id}>
                                <label className="text-xs font-medium arbo-text-secondary block mb-1">{cf.label}</label>
                                <input
                                    type={cf.type === "email" ? "email" : cf.type === "tel" ? "tel" : "text"}
                                    placeholder={cf.placeholder || ""}
                                    disabled
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm opacity-70"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Free image element (positioned/sized on the grid). */
export const ImagePreview = () => {
    const { styles } = useEditorContext();
    if (!styles.pageBgImage) return null;
    return (
        <img
            src={styles.pageBgImage}
            alt=""
            className="w-full h-full"
            style={{ objectFit: styles.pageImageFit || "cover", borderRadius: `${styles.borderRadius ?? 14}px` }}
        />
    );
};

/** Logo image (custom URL, or the Arbo logo by default). */
export const LogoPreview = () => {
    const { styles } = useEditorContext();
    const src = styles.logoUrl || arboLogo;
    return (
        <div className="flex items-center justify-center h-full w-full">
            <img src={src} alt="Logo" className="object-contain" style={{ maxHeight: "100%", maxWidth: "100%" }} />
        </div>
    );
};

/** "Created with Arbo Forms" footer. */
export const FooterPreview = () => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center opacity-50 py-2">
            <span className="text-xs arbo-text-muted font-medium">
                {t("editor.preview.createdWith")} <span className="arbo-text-secondary font-semibold">Arbo Forms</span>
            </span>
        </div>
    );
};

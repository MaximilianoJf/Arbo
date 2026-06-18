import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { FORM_MODES } from "@/core/form-engine/constants";
import type { FormSchema, FormField, ComponentType } from "@/core/form-engine/types";
import { FormFunctions } from "@/core/form-engine/services";
import { formApi } from "@/services/api";
import { Sparkles, ArrowRight, Camera } from "@gravity-ui/icons";
import { compressImage } from "@/core/form-engine/utils/compress-image";
import { mapAIFields } from "@/core/form-engine/utils/ai-field-mapper";

// ─── Form templates ───
interface FormTemplate {
    id: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    schema: FormSchema;
}

const uid = () => crypto.randomUUID();

const makeField = (overrides: Partial<FormField> & { name: string; componentType: ComponentType; type: string }): FormField => ({
    id: uid(),
    label: "",
    placeholder: "",
    value: "",
    required: false,
    validate: [],
    sortOrder: 0,
    page: 0,
    ...overrides,
});

const getTemplates = (t: (key: string) => string): FormTemplate[] => [
    {
        id: "blank",
        label: t("createForm.blank"),
        description: t("createForm.blankDesc"),
        icon: "➕",
        color: "#4ADE80",
        schema: {
            title: t("createForm.newForm"),
            onSubmit: FormFunctions.SaveToDB,
            fields: [],
        },
    },
    {
        id: "survey",
        label: t("createForm.questionnaire"),
        description: t("createForm.questionnaireDesc"),
        icon: "📋",
        color: "#3B82F6",
        schema: {
            title: t("createForm.questionnaire"),
            description: t("createForm.questionnaireSubtitle"),
            onSubmit: FormFunctions.SaveToDB,
            fields: [
                makeField({ name: "question_1", label: t("createForm.survey.question1"), componentType: "DynamicRadioGroup", type: "radio", options: [t("createForm.survey.excellent"), t("createForm.survey.good"), t("createForm.survey.regular"), t("createForm.survey.bad")], required: true, sortOrder: 0 }),
                makeField({ name: "question_2", label: t("createForm.survey.question2"), componentType: "DynamicCheckbox", type: "checkbox", options: [t("createForm.survey.quality"), t("createForm.survey.price"), t("createForm.survey.attention"), t("createForm.survey.speed")], sortOrder: 1 }),
                makeField({ name: "question_3", label: t("createForm.survey.question3"), componentType: "DynamicRadioGroup", type: "radio", options: [t("createForm.survey.yesDefinitely"), t("createForm.survey.probably"), t("createForm.survey.notSure"), t("createForm.survey.no")], sortOrder: 2 }),
                makeField({ name: "comments", label: t("createForm.survey.additionalComments"), componentType: "DynamicTextArea", type: "text", placeholder: t("createForm.survey.commentsPlaceholder"), sortOrder: 3 }),
            ],
        },
    },
    {
        id: "simple",
        label: t("createForm.simpleForm"),
        description: t("createForm.simpleFormDesc"),
        icon: "📝",
        color: "#8B5CF6",
        schema: {
            title: t("createForm.contactForm"),
            description: t("createForm.contactFormDesc"),
            onSubmit: FormFunctions.SaveToDB,
            fields: [
                makeField({ name: "full_name", label: t("createForm.contact.fullName"), componentType: "DynamicTextField", type: "text", placeholder: t("createForm.contact.fullNamePlaceholder"), required: true, validate: ["required"], sortOrder: 0 }),
                makeField({ name: "email", label: t("createForm.contact.email"), componentType: "DynamicTextField", type: "email", placeholder: t("createForm.contact.emailPlaceholder"), required: true, validate: ["required", "email"], sortOrder: 1 }),
                makeField({ name: "phone", label: t("createForm.contact.phone"), componentType: "DynamicTextField", type: "text", placeholder: t("createForm.contact.phonePlaceholder"), sortOrder: 2 }),
                makeField({ name: "message", label: t("createForm.contact.message"), componentType: "DynamicTextArea", type: "text", placeholder: t("createForm.contact.messagePlaceholder"), sortOrder: 3 }),
            ],
        },
    },
    {
        id: "user_data",
        label: t("createForm.userData"),
        description: t("createForm.userDataDesc"),
        icon: "👤",
        color: "#F59E0B",
        schema: {
            title: t("createForm.userRegistration"),
            description: t("createForm.userRegistrationDesc"),
            onSubmit: FormFunctions.SaveToDB,
            fields: [
                makeField({ name: "name", label: t("createForm.user.name"), componentType: "DynamicTextField", type: "text", placeholder: t("createForm.user.namePlaceholder"), required: true, validate: ["required", "text"], sortOrder: 0 }),
                makeField({ name: "email", label: t("createForm.user.email"), componentType: "DynamicTextField", type: "email", placeholder: t("createForm.user.emailPlaceholder"), required: true, validate: ["required", "email"], sortOrder: 1 }),
                makeField({ name: "age", label: t("createForm.user.age"), componentType: "DynamicNumberField", type: "number", placeholder: t("createForm.user.agePlaceholder"), validate: ["positiveNumber"], sortOrder: 2 }),
                makeField({ name: "country", label: t("createForm.user.country"), componentType: "DynamicSelect", type: "select", options: [t("createForm.user.argentina"), t("createForm.user.chile"), t("createForm.user.colombia"), t("createForm.user.mexico"), t("createForm.user.spain"), t("createForm.user.other")], sortOrder: 3 }),
                makeField({ name: "gender", label: t("createForm.user.gender"), componentType: "DynamicRadioGroup", type: "radio", options: [t("createForm.user.male"), t("createForm.user.female"), t("createForm.user.nonBinary"), t("createForm.user.preferNotToSay")], sortOrder: 4 }),
                makeField({ name: "birthdate", label: t("createForm.user.birthdate"), componentType: "DynamicDateField", type: "date", sortOrder: 5 }),
            ],
        },
    },
    {
        id: "review",
        label: t("createForm.reviewLabel"),
        description: t("createForm.reviewDesc"),
        icon: "⭐",
        color: "#EC4899",
        schema: {
            title: t("createForm.reviewTitle"),
            description: t("createForm.reviewSubtitle"),
            onSubmit: FormFunctions.SaveToDB,
            fields: [
                makeField({ name: "rating", label: t("createForm.review.overallRating"), componentType: "DynamicRadioGroup", type: "radio", options: [t("createForm.review.ratingExcellent"), t("createForm.review.ratingVeryGood"), t("createForm.review.ratingGood"), t("createForm.review.ratingRegular"), t("createForm.review.ratingBad")], required: true, sortOrder: 0 }),
                makeField({ name: "visit_date", label: t("createForm.review.visitDate"), componentType: "DynamicDateField", type: "date", sortOrder: 1 }),
                makeField({ name: "aspects", label: t("createForm.review.whatDidYouLike"), componentType: "DynamicCheckbox", type: "checkbox", options: [t("createForm.review.food"), t("createForm.review.ambiance"), t("createForm.review.service"), t("createForm.review.cleanliness"), t("createForm.review.price"), t("createForm.review.location")], sortOrder: 2 }),
                makeField({ name: "recommend", label: t("createForm.review.wouldRecommend"), componentType: "DynamicRadioGroup", type: "radio", options: [t("common.yes"), t("createForm.review.maybe"), t("common.no")], sortOrder: 3 }),
                makeField({ name: "review", label: t("createForm.review.yourReview"), componentType: "DynamicTextArea", type: "text", placeholder: t("createForm.review.reviewPlaceholder"), sortOrder: 4 }),
            ],
        },
    },
];

// ─── Template card ───
const TemplateCard = ({ template, onSelect, fieldsLabel }: { template: FormTemplate; onSelect: () => void; fieldsLabel: string }) => (
    <button
        onClick={onSelect}
        className="group arbo-card text-left p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] hover:border-[var(--arbo-accent)]/30"
    >
        <div className="flex items-start justify-between">
            <div
                className="size-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${template.color}20` }}
            >
                {template.icon}
            </div>
            {template.id !== "blank" && (
                <span className="text-[10px] font-medium arbo-text-muted px-2 py-0.5 rounded-full bg-[var(--arbo-surface-2)]">
                    {template.schema.fields.length} {fieldsLabel}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-sm font-semibold arbo-text group-hover:text-[var(--arbo-accent)] transition-colors">
                {template.label}
            </h3>
            <p className="text-xs arbo-text-muted mt-0.5">{template.description}</p>
        </div>
        {template.id !== "blank" && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
                {template.schema.fields.slice(0, 3).map((f) => (
                    <span key={f.name} className="text-[9px] arbo-text-muted bg-[var(--arbo-surface-2)] px-1.5 py-0.5 rounded">
                        {f.label}
                    </span>
                ))}
                {template.schema.fields.length > 3 && (
                    <span className="text-[9px] arbo-text-muted">+{template.schema.fields.length - 3}</span>
                )}
            </div>
        )}
    </button>
);

const EXAMPLE_PROMPTS = [
    "Formulario de registro para un evento con nombre, email, empresa y tipo de entrada",
    "Encuesta de satisfacción del cliente con calificación del 1 al 5 y comentarios",
    "Solicitud de turno médico con nombre, DNI, fecha, especialidad y motivo de consulta",
    "Formulario de postulación laboral con datos personales, experiencia y área de interés",
    "Pedido de presupuesto con nombre, empresa, servicio solicitado y descripción del proyecto",
];

// ─── Main view ───
export const CreateFormView = () => {
    const { t } = useTranslation();
    const [selectedSchema, setSelectedSchema] = useState<FormSchema | null>(null);
    const [showAI, setShowAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const templates = getTemplates(t);

    /** Builds a FormSchema from an AI update_schema payload (chat or photo scan). */
    const buildSchemaFromAI = (data: any): FormSchema => ({
        title: data.title || "Formulario generado",
        description: data.description || "",
        onSubmit: FormFunctions.SaveToDB,
        styles: data.styles || {},
        fields: mapAIFields(data.fields),
    });

    const handleGenerate = async () => {
        if (!aiPrompt.trim() || generating) return;
        setGenerating(true);
        setGenerateError(null);
        try {
            const emptySchema = { title: "Nuevo formulario", fields: [], onSubmit: FormFunctions.SaveToDB };
            const res = await formApi.aiChat(
                [{ role: "user", content: aiPrompt.trim() }],
                emptySchema,
            );
            const data = res.data;
            if (data?.action === "update_schema" && data.fields?.length) {
                setSelectedSchema(buildSchemaFromAI(data));
            } else {
                setGenerateError(data?.reply || "La IA no pudo generar el formulario. Intentá con una descripción más detallada.");
            }
        } catch (e: any) {
            setGenerateError(e.message || "Error al generar el formulario");
        } finally {
            setGenerating(false);
        }
    };

    const handleScan = async (file: File) => {
        if (scanning) return;
        setScanning(true);
        setScanError(null);
        try {
            const image = await compressImage(file);
            const res = await formApi.aiScan(image);
            const data = res.data;
            if (data?.action === "update_schema" && data.fields?.length) {
                setSelectedSchema(buildSchemaFromAI(data));
            } else {
                setScanError(data?.reply || "No se detectaron campos en la foto. Probá con una imagen más nítida.");
            }
        } catch (e: any) {
            setScanError(e.message || "Error al escanear la imagen");
        } finally {
            setScanning(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    if (selectedSchema) {
        return <FormBuilder formSchema={selectedSchema} mode={FORM_MODES.create} isSystemForm={false} />;
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold arbo-text">{t("createForm.title")}</h1>
                <p className="text-sm arbo-text-muted mt-1">{t("createForm.subtitle")}</p>
            </div>

            {/* AI panel */}
            {showAI ? (
                <div className="arbo-panel p-6 flex flex-col gap-4 border-[var(--arbo-accent)]/20">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-[var(--arbo-accent-muted)] flex items-center justify-center shrink-0">
                            <Sparkles className="size-4 text-[var(--arbo-accent)]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold arbo-text">Crear formulario con IA</p>
                            <p className="text-xs arbo-text-muted">Describí el formulario que necesitás y la IA lo armará por vos</p>
                        </div>
                        <button
                            onClick={() => { setShowAI(false); setAiPrompt(""); setGenerateError(null); }}
                            className="ml-auto text-xs arbo-text-muted hover:arbo-text transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
                        placeholder="Ej: Quiero un formulario de contacto para una clínica con nombre, teléfono, email, especialidad médica y motivo de consulta..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)] resize-none"
                        autoFocus
                    />

                    {/* Example prompts */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-semibold arbo-text-muted uppercase tracking-wider">Ejemplos rápidos</p>
                        <div className="flex flex-wrap gap-2">
                            {EXAMPLE_PROMPTS.map((ex) => (
                                <button
                                    key={ex}
                                    onClick={() => { setAiPrompt(ex); textareaRef.current?.focus(); }}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-muted hover:arbo-text hover:border-[var(--arbo-accent)]/40 transition-colors text-left"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>

                    {generateError && (
                        <p className="text-sm text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-3 py-2 rounded-lg">
                            {generateError}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={!aiPrompt.trim() || generating}
                            className="arbo-btn arbo-btn-primary disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-4" />
                                    Generar formulario
                                </>
                            )}
                        </button>
                        <span className="text-xs arbo-text-muted">Ctrl+Enter para generar</span>
                    </div>
                </div>
            ) : (
                /* AI + photo scan cards */
                <div className="grid gap-4 sm:grid-cols-2">
                    <button
                        onClick={() => setShowAI(true)}
                        className="group w-full arbo-card p-5 flex items-center gap-4 border-[var(--arbo-accent)]/20 hover:border-[var(--arbo-accent)]/50 hover:bg-[var(--arbo-accent-muted)]/30 transition-all"
                    >
                        <div className="size-12 rounded-xl bg-[var(--arbo-accent-muted)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Sparkles className="size-6 text-[var(--arbo-accent)]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-semibold arbo-text group-hover:text-[var(--arbo-accent)] transition-colors">
                                Crear con IA
                            </p>
                            <p className="text-xs arbo-text-muted mt-0.5">
                                Describí lo que necesitás y la IA arma el formulario por vos
                            </p>
                        </div>
                        <ArrowRight className="size-4 arbo-text-muted group-hover:text-[var(--arbo-accent)] group-hover:translate-x-1 transition-all shrink-0" />
                    </button>

                    {/* Photo scan card — on mobile, capture opens the camera directly */}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleScan(file);
                        }}
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={scanning}
                        className="group w-full arbo-card p-5 flex items-center gap-4 border-sky-400/20 hover:border-sky-400/50 hover:bg-sky-400/5 transition-all disabled:opacity-60"
                    >
                        <div className="size-12 rounded-xl bg-sky-400/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {scanning ? (
                                <div className="size-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Camera className="size-6 text-sky-400" />
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-semibold arbo-text group-hover:text-sky-400 transition-colors">
                                {scanning ? "Escaneando formulario..." : "Escanear desde foto"}
                            </p>
                            <p className="text-xs arbo-text-muted mt-0.5">
                                Subí o sacá una foto de un formulario y la IA lo recrea por vos
                            </p>
                        </div>
                        <ArrowRight className="size-4 arbo-text-muted group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>

                    {scanError && (
                        <p className="sm:col-span-2 text-sm text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-3 py-2 rounded-lg">
                            {scanError}
                        </p>
                    )}
                </div>
            )}

            {/* Templates grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((tmpl) => (
                    <TemplateCard
                        key={tmpl.id}
                        template={tmpl}
                        fieldsLabel={t("createForm.fields")}
                        onSelect={() => setSelectedSchema(tmpl.schema)}
                    />
                ))}
            </div>
        </div>
    );
};

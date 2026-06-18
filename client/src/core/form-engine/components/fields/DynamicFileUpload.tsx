import { useRef, useState } from "react";
import { ArrowUpFromSquare, File as FileIcon, Picture, Xmark } from "@gravity-ui/icons";
import { FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicFileUploadProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
}

const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * File upload field. type="image" shows a thumbnail preview; type="file" lists
 * the chosen file without preview. Accepted types come from field.accept.
 * NOTE: the file is kept client-side for now — the storage destination is
 * configured later (pending backend wiring).
 */
export const DynamicFileUpload = ({ name, label, type, formState, required, className, handleInputChange, accept }: DynamicFileUploadProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isImage = type === "image";
    const acceptAttr = accept?.length ? accept.join(",") : (isImage ? "image/*" : undefined);

    const commit = (value: string) => {
        const syntheticEvent = { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange?.(syntheticEvent);
    };

    const onPick = (f: File | null) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(f);
        setPreviewUrl(f && isImage ? URL.createObjectURL(f) : null);
        commit(f ? f.name : "");
    };

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <span data-slot="label" className="text-sm font-medium arbo-field-label">{label}</span>

            <input
                ref={inputRef}
                type="file"
                accept={acceptAttr}
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />

            {!file ? (
                <button
                    type="button"
                    data-slot="trigger"
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 w-full rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors cursor-pointer hover:border-[var(--arbo-accent)]"
                    style={{ borderColor: "var(--field-input-border, var(--arbo-border-light))", color: "var(--arbo-text-muted)", background: "transparent" }}
                >
                    {isImage ? <Picture className="size-6" /> : <ArrowUpFromSquare className="size-6" />}
                    <span>{isImage ? "Subir una imagen" : "Subir un archivo"}</span>
                    {accept?.length ? (
                        <span className="text-[11px] opacity-70">Acepta: {accept.join(", ")}</span>
                    ) : isImage ? (
                        <span className="text-[11px] opacity-70">JPG, PNG, GIF…</span>
                    ) : null}
                </button>
            ) : (
                <div
                    className="flex items-center gap-3 w-full rounded-lg border px-3 py-2.5"
                    style={{ borderColor: "var(--arbo-border-light)", background: "var(--arbo-surface-2)" }}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt={file.name} className="size-12 rounded-md object-cover shrink-0" />
                    ) : (
                        <span className="flex items-center justify-center size-10 rounded-md shrink-0"
                            style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-accent)" }}>
                            <FileIcon className="size-5" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "var(--arbo-text)" }}>{file.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--arbo-text-muted)" }}>{fmtSize(file.size)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onPick(null)}
                        className="p-1.5 rounded-md transition-colors hover:bg-[var(--arbo-surface-3)] shrink-0"
                        style={{ color: "var(--arbo-text-muted)" }}
                        title="Quitar archivo"
                    >
                        <Xmark className="size-4" />
                    </button>
                </div>
            )}

            {/* Submit value (filename) + native required validation */}
            <input
                type="text"
                name={name}
                value={file?.name ?? String(state.value ?? "")}
                required={required}
                readOnly
                tabIndex={-1}
                aria-hidden
                className="sr-only absolute w-px h-px opacity-0 pointer-events-none"
            />
            {isInvalid && <FieldError>{error}</FieldError>}
        </div>
    );
};

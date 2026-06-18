import { useState, useRef, useEffect, useCallback } from "react";
import { useEditorContext } from "../EditorContext";
import { formApi } from "@/services/api";
import type { ComponentType } from "../../../types";

interface ChatMsg {
    role: "user" | "assistant";
    content: string;
    isAction?: boolean;
}

const INITIAL_MESSAGE: ChatMsg = {
    role: "assistant",
    content: "Hola! Puedo crear campos y cambiar el diseño del formulario. Ejemplos:\n• \"Agregá un campo de teléfono\"\n• \"Fondo café con luces doradas\"\n• \"Efecto glass con sombra glow\"\n• \"Animación slideUp al entrar\"",
};

export const AITab = () => {
    const { schema, setSchema } = useEditorContext();

    // Per-form session storage key — survives page navigation, resets on tab close
    const storageKey = `arbo-ai-chat-${schema.id ?? "new"}`;

    const [messages, setMessages] = useState<ChatMsg[]>(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved) as ChatMsg[];
        } catch {
            // ignore parse errors
        }
        return [INITIAL_MESSAGE];
    });
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Persist messages to sessionStorage on every change
    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(messages));
        } catch {
            // ignore quota errors
        }
    }, [messages, storageKey]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: ChatMsg = { role: "user", content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            // Build conversation history for context (last 10 messages)
            const history = updatedMessages
                .slice(-10)
                .map((m) => ({ role: m.role, content: m.content }));

            const currentSchema = {
                title: schema.title,
                description: schema.description,
                styles: schema.styles || {},
                fields: schema.fields
                    .filter((f) => !f.name?.startsWith("__page_break_"))
                    .map((f) => ({
                        name: f.name,
                        label: f.label,
                        type: f.type,
                        componentType: f.componentType,
                        placeholder: f.placeholder,
                        required: f.required,
                        options: f.options,
                        validations: f.validate,
                        page: f.page,
                    })),
            };

            const res = await formApi.aiChat(history, currentSchema);
            const data = res.data;

            const hasFieldUpdate = data.action === "update_schema" && Array.isArray(data.fields);
            const hasStyleUpdate = data.styles && Object.keys(data.styles).length > 0;

            if (hasFieldUpdate || hasStyleUpdate) {
                setSchema((prev) => {
                    let next = { ...prev };

                    if (data.title) next = { ...next, title: data.title };
                    if (data.description !== undefined) next = { ...next, description: data.description };

                    if (hasFieldUpdate) {
                        const newFields = data.fields.map((f: any, i: number) => ({
                            id: crypto.randomUUID(),
                            name: f.name || `field_${Date.now()}_${i}`,
                            label: f.label || f.name,
                            placeholder: f.placeholder || "",
                            type: f.type || "text",
                            componentType: (f.componentType || "DynamicTextField") as ComponentType,
                            value: "",
                            required: f.required || false,
                            validate: f.validations || (f.required ? ["required"] : []),
                            options: f.options || [],
                            sortOrder: f.sortOrder ?? i,
                            page: f.page ?? 0,
                        }));
                        next = {
                            ...next,
                            fields: [
                                ...prev.fields.filter((f) => f.name?.startsWith("__page_break_")),
                                ...newFields,
                            ],
                        };
                    }

                    if (hasStyleUpdate) {
                        next = {
                            ...next,
                            styles: { ...(prev.styles || {}), ...data.styles },
                        };
                    }

                    return next;
                });

                const what: string[] = [];
                if (hasFieldUpdate) what.push(`${data.fields.length} campo(s)`);
                if (hasStyleUpdate) what.push("estilos");

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: data.reply || `Listo! Actualice ${what.join(" y ")} del formulario.`,
                        isAction: true,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.reply },
                ]);
            }
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Error: ${err.message || "No se pudo conectar con la IA"}`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, schema, setSchema]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full -m-3 -mb-3">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2 min-h-0">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-normal ${
                                msg.role === "user"
                                    ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)] rounded-br-sm"
                                    : msg.isAction
                                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-bl-sm"
                                    : "bg-[var(--arbo-surface-2)] text-[var(--arbo-text)] rounded-bl-sm"
                            }`}
                        >
                            {msg.isAction && (
                                <div className="flex items-center gap-1 mb-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                    <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Schema actualizado
                                </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[var(--arbo-surface-2)] rounded-lg px-3 py-2 rounded-bl-sm">
                            <div className="flex items-center gap-1">
                                <span className="size-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="size-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="size-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-[var(--arbo-border)] p-1.5">
                <div className="flex items-end gap-1.5">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ej: Agrega un campo de telefono..."
                        rows={1}
                        className="flex-1 resize-none bg-[var(--arbo-surface-2)] text-[var(--arbo-text)] text-[11px] rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-[var(--arbo-text-muted)]"
                        style={{ maxHeight: "60px" }}
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="shrink-0 size-7 rounded-md flex items-center justify-center transition-all disabled:opacity-30"
                        style={{
                            background: "linear-gradient(135deg, #4ADE80, #06D6A0, #00C9A7)",
                            color: "#0a0a0f",
                        }}
                        title="Enviar"
                    >
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
                <p className="text-[8px] text-[var(--arbo-text-muted)] mt-1 text-center opacity-60">
                    IA powered by OpenRouter
                </p>
            </div>
        </div>
    );
};

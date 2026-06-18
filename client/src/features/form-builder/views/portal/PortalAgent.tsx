import { useState, useRef, useEffect } from "react";
import { agentApi } from "@/services/api";
import { Sparkles } from "@gravity-ui/icons";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTIONS = [
    "¿Cuántos formularios tengo?",
    "¿Cuál es el formulario con más respuestas?",
    "Mostrá las últimas respuestas del formulario 1",
    "¿Qué proyectos tengo creados?",
];

export const PortalAgent = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const send = async (text: string) => {
        const userMsg = text.trim();
        if (!userMsg || loading) return;

        const next: Message[] = [...messages, { role: "user", content: userMsg }];
        setMessages(next);
        setInput("");
        setLoading(true);

        try {
            const res = await agentApi.chat(next);
            setMessages([...next, { role: "assistant", content: res.data.reply }]);
        } catch (err: any) {
            setMessages([...next, { role: "assistant", content: `Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    return (
        <div className="flex flex-col h-full" style={{ maxHeight: "calc(100vh - 80px)" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--arbo-border)" }}>
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ background: "var(--arbo-accent-subtle)" }}>
                    <Sparkles className="size-4" style={{ color: "var(--arbo-accent)" }} />
                </div>
                <div>
                    <h2 className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>Agente IA</h2>
                    <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                        Consultá tus formularios y respuestas en lenguaje natural
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center gap-6 mt-8">
                        <div className="flex items-center justify-center size-16 rounded-2xl" style={{ background: "var(--arbo-surface-2)" }}>
                            <Sparkles className="size-8" style={{ color: "var(--arbo-accent)" }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium mb-1" style={{ color: "var(--arbo-text)" }}>
                                ¿En qué te puedo ayudar?
                            </p>
                            <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                                Puedo consultar tus formularios, respuestas y proyectos en tiempo real.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    className="text-left text-xs px-3 py-2 rounded-lg transition-colors"
                                    style={{
                                        background: "var(--arbo-surface-2)",
                                        color: "var(--arbo-text-secondary)",
                                        border: "1px solid var(--arbo-border)",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--arbo-surface-3)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--arbo-surface-2)")}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                            className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                            style={msg.role === "user"
                                ? { background: "var(--arbo-accent)", color: "#000", borderBottomRightRadius: "4px" }
                                : { background: "var(--arbo-surface-2)", color: "var(--arbo-text)", border: "1px solid var(--arbo-border)", borderBottomLeftRadius: "4px" }
                            }
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl text-sm flex gap-1 items-center" style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)", borderBottomLeftRadius: "4px" }}>
                            <span className="size-1.5 rounded-full animate-bounce" style={{ background: "var(--arbo-text-muted)", animationDelay: "0ms" }} />
                            <span className="size-1.5 rounded-full animate-bounce" style={{ background: "var(--arbo-text-muted)", animationDelay: "150ms" }} />
                            <span className="size-1.5 rounded-full animate-bounce" style={{ background: "var(--arbo-text-muted)", animationDelay: "300ms" }} />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-6 py-4" style={{ borderTop: "1px solid var(--arbo-border)" }}>
                <div className="flex gap-2 items-end rounded-xl p-2" style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Preguntá algo sobre tus formularios... (Enter para enviar)"
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1"
                        style={{ color: "var(--arbo-text)", minHeight: "36px", maxHeight: "120px" }}
                    />
                    <button
                        onClick={() => send(input)}
                        disabled={!input.trim() || loading}
                        className="shrink-0 size-8 rounded-lg flex items-center justify-center transition-opacity"
                        style={{
                            background: "var(--arbo-accent)",
                            opacity: !input.trim() || loading ? 0.4 : 1,
                        }}
                    >
                        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </div>
                <p className="text-xs mt-1.5 text-center" style={{ color: "var(--arbo-text-muted)" }}>
                    El agente consulta tus datos en tiempo real · Shift+Enter para nueva línea
                </p>
            </div>
        </div>
    );
};

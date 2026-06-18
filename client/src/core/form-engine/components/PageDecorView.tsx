import type { PageDecor } from "../types";
import { DECOR_ICONS, DEFAULT_DECOR_ICON } from "../constants/decor-icons";

/** Renders one page decoration filling its absolutely-positioned wrapper. */
export const PageDecorView = ({ decor }: { decor: PageDecor }) => {
    const opacity = (decor.opacity ?? 100) / 100;

    if (decor.kind === "rect") {
        return (
            <div
                className="w-full h-full"
                style={{
                    background: decor.bgColor || "rgba(255,255,255,0.08)",
                    border: decor.borderColor ? `${decor.borderWidth ?? 1}px solid ${decor.borderColor}` : "none",
                    borderRadius: decor.radius ?? 12,
                    opacity,
                }}
            />
        );
    }

    if (decor.kind === "line") {
        const color = decor.bgColor || decor.borderColor || "#FFFFFF";
        const th = Math.max(1, decor.borderWidth ?? 2);
        return (
            <div className="w-full h-full flex items-center" style={{ opacity }}>
                <div style={{ width: "100%", height: th, background: color, borderRadius: th / 2 }} />
            </div>
        );
    }

    if (decor.kind === "icon") {
        const def = DECOR_ICONS[decor.iconId || DEFAULT_DECOR_ICON] || DECOR_ICONS[DEFAULT_DECOR_ICON];
        const color = decor.textColor || "#4ADE80";
        return (
            <svg viewBox="0 0 24 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ opacity }}>
                <path
                    d={def.path}
                    fill={def.mode === "fill" ? color : "none"}
                    stroke={def.mode === "stroke" ? color : "none"}
                    strokeWidth={def.mode === "stroke" ? 2 : 0}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    if (decor.kind === "image") {
        if (!decor.imageUrl) return null;
        return (
            <img
                src={decor.imageUrl}
                alt=""
                className="w-full h-full"
                style={{ objectFit: decor.imageFit || "cover", borderRadius: decor.radius ?? 12, opacity }}
            />
        );
    }

    // text
    return (
        <div
            className="w-full h-full flex"
            style={{
                opacity,
                alignItems: "center",
                justifyContent: decor.align === "center" ? "center" : decor.align === "right" ? "flex-end" : "flex-start",
            }}
        >
            <span
                className="whitespace-pre-wrap break-words w-full"
                style={{
                    color: decor.textColor || "#FFFFFF",
                    fontSize: decor.fontSize ?? 16,
                    fontWeight: decor.bold ? 700 : 400,
                    fontStyle: decor.italic ? "italic" : "normal",
                    textDecoration: decor.underline ? "underline" : "none",
                    textAlign: (decor.align || "left") as any,
                    lineHeight: 1.3,
                }}
            >
                {decor.text || "Texto"}
            </span>
        </div>
    );
};

import { useCallback } from "react";

const MIN_W = 320;
const MAX_W = 1100;

interface CardWidthHandleProps {
    /** Ref of the centered wrapper whose width is being resized. */
    wrapRef: React.RefObject<HTMLDivElement | null>;
    onChange: (px: number | undefined) => void;
}

/**
 * Vertical drag handle on the right edge of the form card.
 * Dragging resizes the card width (persisted as styles.cardCustomWidth);
 * double-click resets to the preset size.
 */
export const CardWidthHandle = ({ wrapRef, onChange }: CardWidthHandleProps) => {
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = wrapRef.current?.offsetWidth ?? 640;
        const onMove = (ev: MouseEvent) => {
            // The card is centered, so the edge moves half of the width delta
            const next = Math.round(startW + (ev.clientX - startX) * 2);
            onChange(Math.max(MIN_W, Math.min(MAX_W, next)));
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [wrapRef, onChange]);

    return (
        <div
            onMouseDown={onMouseDown}
            onDoubleClick={() => onChange(undefined)}
            className="absolute top-1/2 -translate-y-1/2 -right-3 w-2 h-16 rounded-full cursor-ew-resize bg-[var(--arbo-border)] hover:bg-[var(--arbo-accent)] transition-colors z-20"
            title="Arrastrar para redimensionar el formulario · Doble clic para restablecer"
        />
    );
};

import { useCallback } from "react";

const MIN_ROWS = 2;
const MAX_ROWS = 20;
const ROW_PX = 24;   // approx. height of one textarea row (text-sm)

interface FieldRowsResizerProps {
    rows: number;
    onChange: (rows: number) => void;
}

/**
 * Bottom-edge drag handle that resizes a textarea field's height (in rows).
 */
export const FieldRowsResizer = ({ rows, onChange }: FieldRowsResizerProps) => {
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startY = e.clientY;
        const startRows = rows;
        const onMove = (ev: MouseEvent) => {
            const dRows = Math.round((ev.clientY - startY) / ROW_PX);
            onChange(Math.max(MIN_ROWS, Math.min(MAX_ROWS, startRows + dRows)));
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [rows, onChange]);

    return (
        <div
            onMouseDown={onMouseDown}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-10 rounded-full cursor-ns-resize bg-[var(--arbo-accent)] opacity-0 group-hover:opacity-80 hover:!opacity-100 transition-opacity z-20"
            title="Arrastrar para cambiar el alto del área de texto"
        />
    );
};

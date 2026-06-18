import { useCallback } from "react";
import { FIELD_GRID_COLS } from "../../utils/field-grid";

interface FieldSpanResizerProps {
    span: number;
    onChange: (span: number) => void;
    /** Px width of one grid column step (col + gap), measured by the parent. */
    getColWidth: () => number;
}

/**
 * Right-edge drag handle that resizes a field's column span in the editor grid.
 * Converts the horizontal mouse delta into column steps.
 */
export const FieldSpanResizer = ({ span, onChange, getColWidth }: FieldSpanResizerProps) => {
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startSpan = span;
        const colW = getColWidth() || 1;
        const onMove = (ev: MouseEvent) => {
            const dCols = Math.round((ev.clientX - startX) / colW);
            onChange(Math.max(1, Math.min(FIELD_GRID_COLS, startSpan + dCols)));
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [span, onChange, getColWidth]);

    return (
        <div
            onMouseDown={onMouseDown}
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-full cursor-ew-resize bg-[var(--arbo-accent)] opacity-0 group-hover:opacity-80 hover:!opacity-100 transition-opacity z-20"
            title="Arrastrar para cambiar el ancho del campo"
        />
    );
};

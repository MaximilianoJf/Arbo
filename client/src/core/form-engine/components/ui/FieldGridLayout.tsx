import { useEffect, useRef, useState } from "react";
import type { FormField, FormStyles, PageBreakpoint } from "../../types";
import { getBreakpointForWidth, getFieldCellStyle, getFieldGridStyle } from "../../utils/field-grid";

interface FieldGridLayoutProps {
    fields: FormField[];
    styles?: FormStyles;
    renderItem: (field: FormField) => React.ReactNode;
    /** Force a breakpoint (editor previews); otherwise it's derived from the container width. */
    forceBp?: PageBreakpoint;
}

/**
 * Fluid 12-column grid for form fields (view/preview/public/embed).
 * The breakpoint comes from the *container* width via ResizeObserver,
 * so embeds and narrow panels collapse correctly without media queries.
 */
export const FieldGridLayout = ({ fields, styles, renderItem, forceBp }: FieldGridLayoutProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [measuredBp, setMeasuredBp] = useState<PageBreakpoint>("desktop");

    useEffect(() => {
        if (forceBp) return;
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0;
            if (w > 0) setMeasuredBp(getBreakpointForWidth(w));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [forceBp]);

    const bp = forceBp ?? measuredBp;

    return (
        <div ref={ref} className="arbo-field-grid" style={getFieldGridStyle(styles)}>
            {fields.map((field) => (
                <div key={field.name} style={getFieldCellStyle(field, bp)}>
                    {renderItem(field)}
                </div>
            ))}
        </div>
    );
};

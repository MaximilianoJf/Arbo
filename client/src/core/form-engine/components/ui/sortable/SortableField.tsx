import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip } from "@gravity-ui/icons";

interface SortableFieldProps {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
    /** Grid mode: the grip overlays the top-left corner instead of taking a flex column,
     *  so the field uses its full cell width and blocks stay aligned. */
    compact?: boolean;
}

export const SortableField = ({ id, children, disabled, compact }: SortableFieldProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
        zIndex: isDragging ? 50 : undefined,
    };

    if (compact) {
        return (
            <div ref={setNodeRef} style={style} className="group/sf">
                {!disabled && (
                    <button
                        type="button"
                        // touch-action:none lets touch devices drag the handle instead of scrolling.
                        // Always visible below xl (no hover on touch); hover-only on desktop.
                        style={{ touchAction: "none" }}
                        className="absolute top-1 left-1 z-20 cursor-grab active:cursor-grabbing arbo-text-muted hover:arbo-text-secondary transition-all p-0.5 rounded hover:bg-[var(--arbo-surface-3)] opacity-100 xl:opacity-0 xl:group-hover/sf:opacity-100"
                        {...attributes}
                        {...listeners}
                    >
                        <Grip className="size-3.5" />
                    </button>
                )}
                {children}
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 group">
            {!disabled && (
                <button
                    type="button"
                    // touch-action:none so a touch-drag moves the field instead of scrolling the page.
                    style={{ touchAction: "none" }}
                    className="mt-7 cursor-grab active:cursor-grabbing arbo-text-muted hover:arbo-text-secondary transition-colors shrink-0 p-1 rounded hover:bg-[var(--arbo-surface-3)]"
                    {...attributes}
                    {...listeners}
                >
                    <Grip className="size-4" />
                </button>
            )}
            <div className="flex-1">{children}</div>
        </div>
    );
};

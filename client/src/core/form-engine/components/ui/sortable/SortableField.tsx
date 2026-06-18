import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip } from "@gravity-ui/icons";

interface SortableFieldProps {
    id: string;
    children: React.ReactNode;
    disabled?: boolean;
}

export const SortableField = ({ id, children, disabled }: SortableFieldProps) => {
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

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 group">
            {!disabled && (
                <button
                    type="button"
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

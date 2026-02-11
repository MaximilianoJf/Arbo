import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableField = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center'
    };

    return (
        <div ref={setNodeRef} style={style}>

            <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '10px' }}>
                ⠿
            </div>

            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
};
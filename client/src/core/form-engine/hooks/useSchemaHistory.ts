import { useRef, useCallback, useState } from "react";
import type { FormSchema } from "../types";

const MAX_HISTORY = 50;

/**
 * Undo/redo hook for FormSchema.
 * Session-only — history lives in memory and is lost when the component unmounts.
 */
export const useSchemaHistory = (
    schema: FormSchema,
    setSchema: React.Dispatch<React.SetStateAction<FormSchema>>,
) => {
    // History stacks
    const undoStack = useRef<FormSchema[]>([]);
    const redoStack = useRef<FormSchema[]>([]);

    // Force re-render when stacks change (for canUndo/canRedo)
    const [, bump] = useState(0);
    const notify = () => bump((n) => n + 1);

    // Debounce timer to batch rapid changes (e.g. typing title)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSnapshot = useRef<FormSchema | null>(null);

    /** Flush any pending debounced snapshot immediately */
    const flush = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        if (pendingSnapshot.current) {
            undoStack.current.push(pendingSnapshot.current);
            if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
            pendingSnapshot.current = null;
        }
    }, []);

    /**
     * Wrapped setSchema that records undo history.
     * Rapid calls within 400ms are batched into a single snapshot.
     */
    const setSchemaWithHistory: React.Dispatch<React.SetStateAction<FormSchema>> = useCallback(
        (action) => {
            setSchema((prev) => {
                const next = typeof action === "function" ? action(prev) : action;

                // Skip if nothing changed
                if (prev === next) return next;

                // First call in a batch → save the "before" state
                if (!pendingSnapshot.current) {
                    pendingSnapshot.current = prev;
                }

                // Reset debounce timer
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                debounceTimer.current = setTimeout(() => {
                    flush();
                    redoStack.current = [];
                    notify();
                }, 400);

                return next;
            });
        },
        [setSchema, flush],
    );

    /** Undo last change */
    const undo = useCallback(() => {
        flush();
        const prev = undoStack.current.pop();
        if (!prev) return;

        setSchema((current) => {
            redoStack.current.push(current);
            return prev;
        });
        notify();
    }, [setSchema, flush]);

    /** Redo last undone change */
    const redo = useCallback(() => {
        const next = redoStack.current.pop();
        if (!next) return;

        setSchema((current) => {
            undoStack.current.push(current);
            return next;
        });
        notify();
    }, [setSchema]);

    const canUndo = undoStack.current.length > 0 || pendingSnapshot.current !== null;
    const canRedo = redoStack.current.length > 0;

    return { setSchemaWithHistory, undo, redo, canUndo, canRedo };
};

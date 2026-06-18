import type { FormField } from "../types";
import { mapAIFields } from "./ai-field-mapper";

/** Generates a name that doesn't collide with the existing ones. */
const uniqueName = (base: string, taken: Set<string>): string => {
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}_${i}`)) i++;
    return `${base}_${i}`;
};

/**
 * Prepares a library block's fields for insertion into a form:
 * fresh ids, collision-free names, internal visibleWhen/dependencies remapped,
 * and references to fields outside the block pruned.
 */
export const prepareBlockFields = (blockFields: any[], existingNames: string[], page: number, baseSortOrder: number, blockName?: string): FormField[] => {
    // Shared group id: the inserted fields behave (and get deleted) as a unit
    const groupId = crypto.randomUUID();
    // Normalize through the same tolerant mapper used for AI payloads
    const fields = mapAIFields(blockFields);

    const taken = new Set(existingNames);
    const renames = new Map<string, string>();
    for (const f of fields) {
        const newName = uniqueName(f.name, taken);
        taken.add(newName);
        renames.set(f.name, newName);
    }

    const internal = new Set(fields.map((f) => f.name));

    return fields.map((f, i) => ({
        ...f,
        id: crypto.randomUUID(),
        name: renames.get(f.name)!,
        page,
        sortOrder: baseSortOrder + i,
        groupId,
        groupLabel: blockName,
        // Remap logic refs to the renamed fields; drop refs to fields outside the block
        visibleWhen: f.visibleWhen
            ?.filter((c) => internal.has(c.field))
            .map((c) => ({ ...c, field: renames.get(c.field)! })),
        hiddenWhen: f.hiddenWhen
            ?.filter((c) => internal.has(c.field))
            .map((c) => ({ ...c, field: renames.get(c.field)! })),
    }));
};

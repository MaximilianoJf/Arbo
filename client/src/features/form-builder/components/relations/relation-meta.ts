import type { RelationType } from "@/services/api";

export interface RelationTypeMeta {
    short: string;
    label: string;
    desc: string;
    color: string;
}

// Cardinality options shown when configuring a connection between two forms.
export const REL_TYPE_META: Record<RelationType, RelationTypeMeta> = {
    one_to_one: {
        short: "1:1",
        label: "Uno a uno",
        desc: "Cada respuesta de A se vincula con exactamente una respuesta de B.",
        color: "#3B82F6",
    },
    one_to_many: {
        short: "1:N",
        label: "Uno a muchos",
        desc: "Cada respuesta de A tiene una o más respuestas de B.",
        color: "#4ADE80",
    },
    zero_to_many: {
        short: "0:N",
        label: "Cero a muchos",
        desc: "Cada respuesta de A puede tener cero o más respuestas de B (hijo opcional).",
        color: "#22D3EE",
    },
    one_to_zero: {
        short: "1:0",
        label: "Uno a cero o uno",
        desc: "Cada respuesta de A puede tener como máximo una respuesta de B (vínculo opcional).",
        color: "#F59E0B",
    },
    many_to_many: {
        short: "N:M",
        label: "Muchos a muchos",
        desc: "Se vinculan a través de un formulario puente que guarda la relación.",
        color: "#A855F7",
    },
};

export const REL_TYPE_ORDER: RelationType[] = ["one_to_one", "one_to_many", "zero_to_many", "one_to_zero", "many_to_many"];

export interface FormLite {
    id: number;
    title: string;
    slug?: string;
    allowMultiple?: boolean;
    requiresParentChain?: boolean;
    fields: { name: string; label: string }[];
}

export interface RelationEdgeData extends Record<string, unknown> {
    type: RelationType;
    joinFormId: number | null;
    keyField: string | null;
}

/**
 * Picks a sensible default linking field for a new connection: prefers an
 * identifier present in either form (id, *_id, dni/documento/rut/cuil, email…).
 * Returns null only when neither form has an id-like field.
 */
export const pickDefaultKeyField = (source: FormLite, target: FormLite): string | null => {
    const fields = [...source.fields, ...target.fields];
    const tests: ((n: string) => boolean)[] = [
        (n) => n === "id",
        (n) => /(^|_)id$/.test(n),
        (n) => /(dni|documento|cedula|cédula|rut|nif|cuil|cuit|pasaporte|passport)/.test(n),
        (n) => /(email|correo|mail)/.test(n),
    ];
    for (const test of tests) {
        const found = fields.find((f) => test(f.name.toLowerCase()));
        if (found) return found.name;
    }
    return null;
};

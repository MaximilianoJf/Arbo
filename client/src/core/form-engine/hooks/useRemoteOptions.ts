import { useEffect, useState } from "react";
import type { FieldOptionsSource } from "../types";
import { formApi } from "@/services/api";

export interface RemoteOption { value: string; label: string }

// Module-level cache so re-renders don't re-fetch
const cache = new Map<string, RemoteOption[]>();

function dig(obj: any, path: string): any {
    if (!path) return obj;
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

const isInternal = (s: FieldOptionsSource) => !!s.formId;
const isExternal = (s: FieldOptionsSource) => !!s.url && !!s.valueKey && !!s.labelKey;

export const useRemoteOptions = (source: FieldOptionsSource | undefined) => {
    const [items, setItems] = useState<RemoteOption[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cacheKey = source
        ? (source.formId
            ? `form:${source.formId}:${source.labelField ?? ""}`
            : `${source.url}::${source.valueKey}::${source.labelKey}::${source.dataPath ?? ""}`)
        : "";

    useEffect(() => {
        if (!source) return;
        if (!isInternal(source) && !isExternal(source)) return;

        if (cache.has(cacheKey)) {
            setItems(cache.get(cacheKey)!);
            return;
        }

        setLoading(true);
        setError(null);

        // Internal: pull another project form's records as options (value = response id).
        if (isInternal(source)) {
            formApi.getOptions(source.formId!, source.labelField)
                .then((res) => {
                    const mapped = (res.data || []).map((o) => ({ value: String(o.value), label: String(o.label) }));
                    // Only cache non-empty results — an empty list means the source form has no
                    // responses yet; caching it would prevent the dropdown from refreshing after
                    // the user fills that form and comes back.
                    if (mapped.length > 0) cache.set(cacheKey, mapped);
                    setItems(mapped);
                })
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
            return;
        }

        // External: fetch a JSON endpoint and map valueKey/labelKey.
        fetch(source.url!)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                const arr = dig(data, source.dataPath ?? "");
                if (!Array.isArray(arr)) throw new Error("La respuesta no es un array");
                const mapped: RemoteOption[] = arr
                    .map((item: any) => ({
                        value: String(item[source.valueKey!] ?? ""),
                        label: String(item[source.labelKey!] ?? item[source.valueKey!] ?? ""),
                    }))
                    .filter((o) => o.value);
                if (mapped.length > 0) cache.set(cacheKey, mapped);
                setItems(mapped);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);

    return { items, loading, error };
};

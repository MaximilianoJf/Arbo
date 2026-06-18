import { useEffect, useState } from "react";
import type { FieldOptionsSource } from "../types";

export interface RemoteOption { value: string; label: string }

// Module-level cache so re-renders don't re-fetch
const cache = new Map<string, RemoteOption[]>();

function dig(obj: any, path: string): any {
    if (!path) return obj;
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export const useRemoteOptions = (source: FieldOptionsSource | undefined) => {
    const [items, setItems] = useState<RemoteOption[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cacheKey = source ? `${source.url}::${source.valueKey}::${source.labelKey}::${source.dataPath ?? ""}` : "";

    useEffect(() => {
        if (!source?.url || !source.valueKey || !source.labelKey) return;

        if (cache.has(cacheKey)) {
            setItems(cache.get(cacheKey)!);
            return;
        }

        setLoading(true);
        setError(null);

        fetch(source.url)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => {
                const arr = dig(data, source.dataPath ?? "");
                if (!Array.isArray(arr)) throw new Error("La respuesta no es un array");
                const mapped: RemoteOption[] = arr
                    .map((item: any) => ({
                        value: String(item[source.valueKey] ?? ""),
                        label: String(item[source.labelKey] ?? item[source.valueKey] ?? ""),
                    }))
                    .filter((o) => o.value);
                cache.set(cacheKey, mapped);
                setItems(mapped);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey]);

    return { items, loading, error };
};

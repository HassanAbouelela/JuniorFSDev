export function toErrorMessage(err: unknown, fallback = "Something went wrong"): string {
    try {
        const anyErr = err as any;
        const detail = anyErr?.response?.data?.detail ?? anyErr?.data?.detail ?? anyErr?.detail;

        const coerce = (v: any) =>
            typeof v === "string"
                ? v
                : v?.msg ||
                v?.message ||
                v?.error ||
                v?.detail ||
                (typeof v === "object" ? JSON.stringify(v) : String(v));

        if (Array.isArray(detail)) {
            const parts = detail.map(coerce).filter(Boolean);
            if (parts.length) return parts.join("\n");
        }

        if (detail) {
            const s = coerce(detail);
            if (s) return s;
        }

        const msg = anyErr?.message || anyErr?.toString?.();
        if (msg && typeof msg === "string") return msg;
    } catch {
        // ignore
    }
    return fallback;
}

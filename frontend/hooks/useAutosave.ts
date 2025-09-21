import {useCallback, useEffect, useRef, useState} from "react";
import {toast} from "sonner";

export type UseAutosaveOptions<T> = {
    // The current (external) value from props or store
    value: T;
    // Called when a save should occur. Should throw on failure.
    onSave: (value: T) => Promise<void>;
    // If true, do NOT save on each change; save on blur instead (suitable for text inputs)
    isTextField?: boolean;
    // Optional messages
    successMessage?: string;
    errorMessage?: string;
};

export type UseAutosaveResult<T> = {
    value: T;
    setValue: React.Dispatch<React.SetStateAction<T>>;
    onChange: (next: T) => void;
    onBlur: () => void;
    saving: boolean;
    lastSavedAt: Date | null;
    error: string | null;
    flush: () => Promise<void>;
};

/**
 * useAutosave
 * - For non-text fields: saves immediately on change.
 * - For text fields: saves on blur.
 * Shows toast on success/failure.
 */
export function useAutosave<T>(opts: UseAutosaveOptions<T>): UseAutosaveResult<T> {
    const {
        value: externalValue,
        onSave,
        isTextField = false,
        successMessage = "Saved",
        errorMessage = "Failed to save",
    } = opts;

    const [value, setValue] = useState<T>(externalValue);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    const latestValueRef = useRef<T>(externalValue);
    const savingRef = useRef(false);
    const queuedRef = useRef<null | T>(null);
    const unmountedRef = useRef(false);

    useEffect(() => {
        latestValueRef.current = externalValue;
        setValue(externalValue);
    }, [externalValue]);

    useEffect(() => {
        return () => {
            unmountedRef.current = true;
        };
    }, []);

    const performSave = useCallback(
        async (val: T) => {
            if (savingRef.current) {
                // queue latest
                queuedRef.current = val;
                return;
            }
            savingRef.current = true;
            setSaving(true);
            setError(null);

            try {
                await onSave(val);
                if (unmountedRef.current) return;
                setLastSavedAt(new Date());
                toast.success(successMessage);
            } catch (e: any) {
                if (unmountedRef.current) return;
                const msg = e?.message || String(e) || errorMessage;
                setError(msg);
                toast.error(`${errorMessage}${msg ? `: ${msg}` : ""}`);
            } finally {
                if (unmountedRef.current) return;
                savingRef.current = false;
                setSaving(false);
                const queued = queuedRef.current;
                queuedRef.current = null;
                if (queued !== null) {
                    // save last queued change
                    void performSave(queued);
                }
            }
        },
        [onSave, successMessage, errorMessage],
    );

    const onChange = useCallback(
        (next: T) => {
            setValue(next);
            latestValueRef.current = next;
            if (!isTextField) {
                // Non-text: save immediately on change
                void performSave(next);
            }
        },
        [isTextField, performSave],
    );

    const onBlur = useCallback(() => {
        if (isTextField) {
            // Text fields: save on blur
            void performSave(latestValueRef.current);
        }
    }, [isTextField, performSave]);

    const flush = useCallback(async () => {
        await performSave(latestValueRef.current);
    }, [performSave]);

    return {
        value,
        setValue,
        onChange,
        onBlur,
        saving,
        lastSavedAt,
        error,
        flush,
    };
}

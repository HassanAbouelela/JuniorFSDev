"use client";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import type {Task, TaskPriority, TaskStatus} from "@/lib/types";

const priorities = ["Low", "Medium", "High"] as const;
const status = ["Pending", "In Progress", "Completed"] as const;

const TITLE_MAX = 100;
const DESC_MAX = 500;

const schema = z.object({
    title: z.string().min(1).max(TITLE_MAX),
    description: z.string().min(1).max(DESC_MAX),
    priority: z.enum(priorities).default("Medium"),
    status: z.enum(status).default("Pending"),
    deadline: z.string().datetime().nullable().optional(),
});

export type TaskFormValues = z.infer<typeof schema>;

export default function TaskForm({
                                     initial,
                                     onSubmit,
                                     submitting,
                                     autosave = false,
                                     onPatch,
                                     readOnly = false,
                                 }: {
    initial?: Partial<Task>;
    onSubmit?: (values: TaskFormValues) => Promise<void> | void;
    submitting?: boolean;
    // When true, the form will patch on field changes/blur and hide the save button
    autosave?: boolean;
    // Called when a single-field patch should be saved
    onPatch?: (patch: Partial<Task>) => Promise<void>;
    // When true, disable all inputs and block edits
    readOnly?: boolean;
}) {
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: {errors},
        watch,
    } = useForm<TaskFormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: {
            title: initial?.title || "",
            description: initial?.description || "",
            priority: (initial?.priority as TaskPriority) || "Medium",
            status: (initial?.status as TaskStatus) || "Pending",
            deadline: (initial?.deadline as any) ?? null,
        },
    });

    const titleVal = watch("title") || "";
    const descVal = watch("description") || "";

    const savePatch = async (patch: Partial<Task>) => {
        if (readOnly) return;
        if (!autosave || !onPatch) return;
        await onPatch(patch);
    };

    const titleReg = register("title");
    const descReg = register("description");

    return (
        <form
            onSubmit={
                readOnly
                    ? (e) => e.preventDefault()
                    : onSubmit
                        ? handleSubmit(async (v) => onSubmit(v))
                        : (e) => {
                            e.preventDefault();
                        }
            }
            className={`space-y-4 w-full min-w-0 ${readOnly ? "opacity-60" : ""}`}
        >
            <div className="grid gap-2 min-w-0">
                <label className="text-sm">Title</label>
                <input
                    className="input w-full"
                    maxLength={TITLE_MAX}
                    disabled={readOnly}
                    {...titleReg}
                    onBlur={async (e) => {
                        titleReg.onBlur(e);
                        if (autosave && !readOnly) {
                            const val = getValues("title");
                            await savePatch({title: val});
                        }
                    }}
                />
                <div className="h-5">
                    {errors.title ? (
                        <p className="form-error">{errors.title.message}</p>
                    ) : titleVal.length === TITLE_MAX ? (
                        <p className="form-error">Title must at most be {TITLE_MAX} characters</p>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-2 min-w-0">
                <label className="text-sm">Description</label>
                <textarea
                    className="textarea w-full"
                    rows={4}
                    maxLength={DESC_MAX}
                    disabled={readOnly}
                    {...descReg}
                    onBlur={async (e) => {
                        descReg.onBlur(e);
                        if (autosave && !readOnly) {
                            const val = getValues("description");
                            await savePatch({description: val});
                        }
                    }}
                />
                <div className="h-5">
                    {errors.description ? (
                        <p className="form-error">{errors.description.message}</p>
                    ) : descVal.length === DESC_MAX ? (
                        <p className="form-error">Description must at most be {DESC_MAX} characters</p>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
                <div className="grid min-w-0">
                    <label className="text-sm">Priority</label>
                    <select
                        className="select w-full min-w-0"
                        disabled={readOnly}
                        value={watch("priority")}
                        onChange={async (e) => {
                            if (readOnly) return;
                            const val = e.target.value as TaskPriority;
                            setValue("priority", val, {shouldValidate: true, shouldDirty: true});
                            if (autosave) {
                                await savePatch({priority: val});
                            }
                        }}
                    >
                        {priorities.map((val) => (
                            <option key={val} value={val}>
                                {val}
                            </option>
                        ))}
                    </select>
                    <div className="h-5"/>
                </div>

                <div className="grid min-w-0">
                    <label className="text-sm">Status</label>
                    <select
                        className="select w-full min-w-0"
                        disabled={readOnly}
                        value={watch("status")}
                        onChange={async (e) => {
                            if (readOnly) return;
                            const val = e.target.value as TaskStatus;
                            setValue("status", val, {shouldValidate: true, shouldDirty: true});
                            if (autosave) {
                                await savePatch({status: val});
                            }
                        }}
                    >
                        {status.map((val) => (
                            <option key={val} value={val}>
                                {val}
                            </option>
                        ))}
                    </select>
                    <div className="h-5"/>
                </div>

                <div className="grid min-w-0">
                    <label className="text-sm">Deadline</label>
                    <input
                        className="input w-full min-w-0"
                        type="datetime-local"
                        disabled={readOnly}
                        onChange={async (e) => {
                            if (readOnly) return;
                            const val = e.target.value ? new Date(e.target.value) : null;
                            const iso = val ? val.toISOString() : null;
                            setValue("deadline", iso as any, {shouldValidate: true, shouldDirty: true});
                            if (autosave) {
                                await savePatch({deadline: iso as any});
                            }
                            // Reduce chance of on-screen keyboard keeping focus
                            e.currentTarget.blur();
                        }}
                        defaultValue={initial?.deadline ? new Date(initial.deadline).toISOString().slice(0, 16) : ""}
                    />
                    <div className="h-5">{errors.deadline && <p className="form-error">Invalid date</p>}</div>
                </div>
            </div>

            {!autosave && !readOnly && (
                <div className="flex gap-2 justify-end">
                    <button className="btn" type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Save"}
                    </button>
                </div>
            )}
        </form>
    );
}

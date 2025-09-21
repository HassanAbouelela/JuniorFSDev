"use client";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {Tasks} from "@/lib/api";
import type {Task, TaskSummary} from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import AgentPanel from "@/components/AgentPanel";
import {toast} from "sonner";
import {toErrorMessage} from "@/lib/utils";
import {useAuth} from "@/lib/store";
import {useTaskWebSocket} from "@/lib/useWebSocket";

type ReaderProps = {
    id: string
    setTask: (task: Task | null) => void
}

function AddReaderBar({id, setTask}: ReaderProps) {
    const [subEmail, setSubEmail] = useState("");

    const subscribe = async () => {
        if (!subEmail) return;
        try {
            const updated = await Tasks.subscribe(id, subEmail);
            setTask(updated);
            setSubEmail("");
        } catch {
            toast.error("Failed to subscribe user");
        }
    };

    return <div className="flex gap-2 items-center">
        <input className="input" placeholder="Enter email to grant view access" value={subEmail}
               onChange={(e) => setSubEmail(e.target.value)}/>
        <button className="btn" onClick={subscribe}>Add</button>
    </div>
}

export default function TaskDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id as string;
    const router = useRouter();
    const {accessToken, hasHydrated} = useAuth();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tasksList, setTasksList] = useState<TaskSummary[]>([]);

    const {user} = useAuth();

    useEffect(() => {
        if (!hasHydrated) return;
        if (!accessToken) {
            router.replace("/login");
            return;
        }
        // Load task details
        Tasks.get(id)
            .then(setTask)
            .catch(() => toast.error("Failed to load task"))
            .finally(() => setLoading(false));

        // Load list of tasks for sidebar
        Tasks.list()
            .then(setTasksList)
            .catch(() => {
                // non-blocking sidebar error
            });
    }, [id, accessToken, hasHydrated, router]);

    useTaskWebSocket((msg) => {
        if (msg.event === "task.deleted" && msg.task_id === id) {
            toast.info("This task was deleted");
            router.replace("/tasks");
            return;
        }
        if (msg.event === "task.updated") {
            // A new task was created elsewhere; refresh the sidebar list
            Tasks.list()
                .then(setTasksList)
                .catch(() => {
                    // Ignore sidebar refresh errors
                });
        }
    });

    const onPatch = async (patch: Partial<Task>) => {
        setSaving(true);
        try {
            const updated = await Tasks.update(id, patch);
            setTask(updated);
            toast.success("Saved");
        } catch (e: any) {
            toast.error(toErrorMessage(e, "Failed to save"));
        } finally {
            setSaving(false);
        }
    };

    const toggleComplete = async () => {
        if (!task) return;
        setSaving(true);
        try {
            const updated = await Tasks.update(id, {status: task.status === "Completed" ? "Pending" : "Completed"} as any);
            setTask(updated);
        } catch {
            toast.error("Failed to toggle status");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        try {
            setSaving(true);
            await Tasks.remove(id);
            toast.success("Task deleted");
            router.replace("/tasks");
        } catch {
            toast.error("Failed to delete task");
        } finally {
            setSaving(false);
        }
    };

    const unsubscribe = async (email: string) => {
        try {
            const updated = await Tasks.unsubscribe(id, email);
            setTask(updated);
        } catch {
            toast.error("Failed to unsubscribe user");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (!task) return <p>Task not found</p>;
    const readOnly = task.owner_email !== user?.email;

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">{task.title}</h1>
                {readOnly ? null : (
                    <div className="flex gap-2">
                        {/*<button className="btn btn-outline" onClick={toggleComplete} disabled={saving}>*/}
                        {/*    {task.status === "Completed" ? "Mark Incomplete" : "Mark Complete"}*/}
                        {/*</button>*/}
                        <button
                            className="btn btn-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={saving}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar - hidden on mobile, sticky on large screens */}
                <aside className="hidden lg:block lg:col-span-1">
                    <div className="card">
                        <div className="card-body">
                            <div className="flex flex-col gap-2">
                                <Link href="/tasks?new=1"
                                      className="btn bg-green-600 hover:bg-green-700 text-white text-center">
                                    New Task
                                </Link>
                                <Link href="/tasks" className="btn btn-outline text-center">
                                    Back to Dashboard
                                </Link>
                            </div>

                            <div className="mt-4">
                                <div className="card-title mb-2">Your Tasks</div>
                                <div className="flex flex-col divide-y">
                                    {tasksList.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No tasks found</p>
                                    ) : tasksList.map((t) => {
                                        const active = t.id === id;
                                        return (
                                            <Link
                                                key={t.id}
                                                href={`/tasks/${t.id}`}
                                                className={`px-2 py-2 -mx-2 rounded ${active ? "bg-muted font-medium" : "hover:bg-muted"}`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate">{t.title}</span>
                                                    <span className="text-xs text-muted-foreground">{t.status}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main content */}
                <div className="lg:col-span-2 card min-w-0">
                    <div className="card-body min-w-0">
                        <TaskForm initial={task} autosave onPatch={onPatch} submitting={saving} readOnly={readOnly}/>
                        <div className="mt-6">
                            <div className="card-title mb-2">Readers</div>
                            {readOnly ? null : <AddReaderBar id={id} setTask={setTask}/>}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {task.reader_emails.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No readers</p>
                                )}
                                {
                                    task.reader_emails.map((email) => (
                                        <span key={email}
                                              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                                            {email}
                                            {
                                                (!readOnly || email == user?.email) ?
                                                    <button className="text-red-600"
                                                            onClick={() => unsubscribe(email)}>×</button>
                                                    : null
                                            }

                                          </span>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-1 grid gap-4">
                    {readOnly ? null : <AgentPanel taskId={id}/>}
                    <div className="card">
                        <div className="card-body">
                            <div className="card-title mb-2">Task Metadata</div>
                            <dl className="grid gap-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Owner</dt>
                                    <dd className="text-right">{task.owner_name} ({task.owner_email})</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Created</dt>
                                    <dd>{new Date(task.created_at).toLocaleString()}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Updated</dt>
                                    <dd>{new Date(task.updated_at).toLocaleString()}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Readers</dt>
                                    <dd>{task.reader_emails.length}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Access</dt>
                                    <dd>{readOnly ? "Read-only" : "Owner"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm backdrop-grayscale"/>
                    <div className="relative z-10 flex min-h-full items-center justify-center p-4">
                        <div className="card w-full max-w-md shadow-lg">
                            <div className="card-body">
                                <div className="card-title">Delete task?</div>
                                <p className="text-sm text-muted-foreground">
                                    This action cannot be undone. Are you sure you want to delete this task?
                                </p>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={async () => {
                                            setShowDeleteConfirm(false);
                                            await onDelete();
                                        }}
                                        disabled={saving}
                                    >
                                        {saving ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

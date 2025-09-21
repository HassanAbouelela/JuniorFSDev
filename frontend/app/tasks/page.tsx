"use client";
import {Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useAuth} from "@/lib/store";
import {Tasks} from "@/lib/api";
import type {TaskSummary} from "@/lib/types";
import TaskList from "@/components/TaskList";
import TaskForm, {TaskFormValues} from "@/components/TaskForm";
import {toast} from "sonner";
import {toErrorMessage} from "@/lib/utils";
import {useTaskWebSocket} from "@/lib/useWebSocket";

function TasksPageContent() {
    const auth = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tasks, setTasks] = useState<TaskSummary[]>([]);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!auth.hasHydrated) return;
        if (!auth.accessToken) {
            router.replace("/login");
            return;
        }
        // Load
        Tasks.list().then(setTasks).catch(() => toast.error("Failed to load tasks"));
    }, [auth.accessToken, auth.hasHydrated, router]);

    // Open creation form if ?new=1
    useEffect(() => {
        const wantsNew = searchParams.get("new") === "1";
        if (wantsNew) setCreating(true);
    }, [searchParams]);

    useTaskWebSocket((msg) => {
        if (msg.event === "task.updated" && msg.task && typeof msg.task === "string") {
            try {
                const updated = JSON.parse(msg.task) as any; // backend sends model_dump_json
                setTasks((list) => {
                    const idx = list.findIndex((t) => t.id === updated.id);
                    const summary: TaskSummary = {
                        id: updated.id,
                        title: updated.title,
                        priority: updated.priority,
                        status: updated.status,
                        deadline: updated.deadline,
                        user_id: updated.user_id,
                        owner_name: updated.owner_name,
                        owner_email: updated.owner_email,
                    };
                    if (idx >= 0) {
                        const next = [...list];
                        next[idx] = summary;
                        return next;
                    }
                    return [summary, ...list];
                });
            } catch {
            }
        } else if (msg.event === "task.deleted" && msg.task_id) {
            setTasks((list) => list.filter((t) => t.id !== msg.task_id));
        }
    });

    const onCreate = async (values: TaskFormValues) => {
        setSaving(true);
        try {
            const created = await Tasks.create(values as any);
            toast.success("Task created");
            router.push(`/tasks/${created.id}`);
        } catch (e: any) {
            toast.error(toErrorMessage(e, "Failed to create task"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tasks</h1>
                <button className="btn"
                        onClick={() => setCreating((v) => !v)}>{creating ? "Close" : "New Task"}</button>
            </div>

            {creating && (
                <div className="card">
                    <div className="card-body">
                        <TaskForm onSubmit={onCreate} submitting={saving}/>
                    </div>
                </div>
            )}

            <TaskList tasks={tasks}/>
        </div>
    );
}

export default function TasksPage() {
    return (
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading tasks...</div>}>
            <TasksPageContent/>
        </Suspense>
    );
}

"use client";
import Link from "next/link";
import type {TaskSummary} from "@/lib/types";
import {format} from "date-fns";

export default function TaskList({tasks}: { tasks: TaskSummary[] }) {
    return (
        <div className="grid gap-3">
            {tasks.map((t) => (
                <div key={t.id} className="card">
                    <div className="card-body flex items-center justify-between gap-4">
                        <div>
                            <div className="card-title">{t.title}</div>
                            <div className="text-sm text-muted-foreground">
                                Owner: {t.owner_name} ({t.owner_email})
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Priority: {t.priority} · Status: {t.status} ·
                                Deadline: {t.deadline ? format(new Date(t.deadline), "PPp") : "—"}
                            </div>
                        </div>
                        <Link href={`/tasks/${t.id}`} className="btn">Open</Link>
                    </div>
                </div>
            ))}
        </div>
    );
}

"use client";
import {useState} from "react";
import {Agents} from "@/lib/api";
import type {AgentResponse} from "@/lib/types";
import {toast} from "sonner";
import {toErrorMessage} from "@/lib/utils";

export default function AgentPanel({taskId}: { taskId: string }) {
    const [loading, setLoading] = useState<"analyze" | "assist" | null>(null);
    const [responses, setResponses] = useState<AgentResponse[]>([]);

    const run = async (action: "analyze" | "assist") => {
        setLoading(action);
        try {
            const resp = action === "analyze" ? await Agents.analyze(taskId) : await Agents.assist(taskId);
            setResponses((r) => [resp, ...r]);
        } catch (e: any) {
            toast.error(toErrorMessage(e, "Agent request failed"));
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="card">
            <div className="card-body space-y-3">
                <div className="flex flex-col items-center justify-between">
                    <div className="card-title mb-3">AI Assistant</div>
                    <div className="flex gap-2">
                        <button className="btn" disabled={loading !== null} onClick={() => run("analyze")}>
                            {loading === "analyze" ? "Analyzing..." : "Analyze Task"}
                        </button>
                        <button className="btn" disabled={loading !== null} onClick={() => run("assist")}>
                            {loading === "assist" ? "Assisting..." : "Get Assistance"}
                        </button>
                    </div>
                </div>
                <div className="grid gap-2">
                    {responses.length === 0 && (
                        <p className="text-sm text-muted-foreground">No responses yet. Use the buttons above to query
                            agents.</p>
                    )}
                    {responses.map((r) => (
                        <div key={r.id} className="border rounded-md p-3">
                            <div
                                className="text-xs text-muted-foreground mb-1">{r.agent_type} · {new Date(r.created_at).toLocaleString()}</div>
                            <pre className="whitespace-pre-wrap text-sm">{r.response_data}</pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

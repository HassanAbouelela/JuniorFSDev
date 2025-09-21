"use client";
import {useEffect, useRef} from "react";
import {WS_BASE} from "@/lib/config";
import {useAuth} from "@/lib/store";

export interface TaskWsUpdate {
    event: "task.updated" | "task.deleted";
    task?: string | object;
    task_id?: string;
}

export function useTaskWebSocket(onMessage: (msg: TaskWsUpdate) => void) {
    const token = useAuth((s) => s.accessToken);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!token) return;
        const url = `${WS_BASE}/ws/tasks?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onMessage(data as TaskWsUpdate);
            } catch {
            }
        };

        ws.onclose = () => {
            wsRef.current = null;
        };

        return () => {
            ws.close();
        };
    }, [token, onMessage]);
}

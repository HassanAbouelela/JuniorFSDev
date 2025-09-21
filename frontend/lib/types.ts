export type UUID = string;

export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Pending" | "In Progress" | "Completed";

export interface TaskSummary {
    id: UUID;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    deadline?: string | null;
    user_id: UUID;
    owner_name: string;
    owner_email: string;
}

export interface Task extends Omit<TaskSummary, "owner_name" | "owner_email"> {
    description: string;
    created_at: string;
    updated_at: string;
    owner_name: string;
    owner_email: string;
    reader_emails: string[];
}

export interface User {
    id: UUID;
    name: string;
    email: string;
    created_at: string;
    is_admin?: boolean;
}

export interface TokenPair {
    access_token: string;
    refresh_token: string;
}

export interface AgentResponse {
    id: UUID;
    task_id: UUID;
    agent_type: "analyzer" | "assistant";
    response_data: string;
    created_at: string;
}

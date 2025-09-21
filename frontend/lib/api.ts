import axios, {AxiosError} from "axios";
import {API_BASE} from "@/lib/config";
import {useAuth} from "@/lib/store";
import type {AgentResponse, Task, TaskSummary, TokenPair} from "@/lib/types";

const api = axios.create({baseURL: API_BASE});

api.interceptors.request.use((config) => {
    const {accessToken} = useAuth.getState();
    if (accessToken) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            try {
                await useAuth.getState().refresh();
                return api.request(error.config!);
            } catch (_) {
                useAuth.getState().logout();
            }
        }
        return Promise.reject(error);
    },
);

export const Users = {
    async me() {
        const {data} = await api.get("/users/me");
        return data;
    },
    async login(email: string, password: string) {
        const form = new URLSearchParams();
        form.set("username", email);
        form.set("password", password);
        const {data} = await api.post<TokenPair>("/users/token", form, {
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
        });
        return data;
    },
    async register(name: string, email: string, password: string) {
        await api.post("/users", {name, email, password});
    },
};

export const Tasks = {
    async list(skip = 0, limit = 50) {
        const {data} = await api.get<TaskSummary[]>(`/tasks`, {params: {skip, limit}});
        return data;
    },
    async create(payload: Partial<Task>) {
        const {data} = await api.post<Task>(`/tasks/`, payload);
        return data;
    },
    async get(id: string) {
        const {data} = await api.get<Task>(`/tasks/${id}`);
        return data;
    },
    async update(id: string, payload: Partial<Task>) {
        const {data} = await api.put<Task>(`/tasks/${id}`, payload);
        return data;
    },
    async remove(id: string) {
        await api.delete(`/tasks/${id}`);
    },
    async subscribe(taskId: string, otherEmail: string) {
        const {data} = await api.post<Task>(`/tasks/subscribe/${taskId}/${otherEmail}`);
        return data;
    },
    async unsubscribe(taskId: string, otherEmail: string) {
        const {data} = await api.delete<Task>(`/tasks/subscribe/${taskId}/${otherEmail}`);
        return data;
    },
};

export const Agents = {
    async analyze(taskId: string) {
        const {data} = await api.post<AgentResponse>(`/tasks/${taskId}/analyze`);
        return data;
    },
    async assist(taskId: string) {
        const {data} = await api.post<AgentResponse>(`/tasks/${taskId}/assist`);
        return data;
    },
};

export default api;

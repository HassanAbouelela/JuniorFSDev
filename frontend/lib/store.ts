import {create} from "zustand";
import axios from "axios";
import {API_BASE} from "@/lib/config";
import type {TokenPair, User} from "@/lib/types";
import {createJSONStorage, persist} from "zustand/middleware";


interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    hasHydrated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    refresh: () => Promise<void>;
    loadMe: () => Promise<void>;
    logout: () => void;
    setHasHydrated: (v: boolean) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            hasHydrated: false,
            setHasHydrated(v: boolean) {
                set({hasHydrated: v});
            },

            async login(email, password) {
                const form = new URLSearchParams();
                form.set("username", email);
                form.set("password", password);
                const {data} = await axios.post<TokenPair>(`${API_BASE}/users/token`, form, {
                    headers: {"Content-Type": "application/x-www-form-urlencoded"},
                });
                set({accessToken: data.access_token, refreshToken: data.refresh_token});
                await get().loadMe();
            },
            async register(name, email, password) {
                await axios.post(`${API_BASE}/users`, {name, email, password});
                await get().login(email, password);
            },
            async refresh() {
                const {refreshToken} = get();
                if (!refreshToken) throw new Error("No refresh token");
                const {data} = await axios.post<TokenPair>(`${API_BASE}/users/token/refresh`, {refresh_token: refreshToken});
                set({accessToken: data.access_token, refreshToken: data.refresh_token});
            },
            async loadMe() {
                const {accessToken} = get();
                if (!accessToken) return;
                const {data} = await axios.get<User>(`${API_BASE}/users/me`, {
                    headers: {Authorization: `Bearer ${accessToken}`},
                });
                set({user: data});
            },
            logout() {
                set({user: null, accessToken: null, refreshToken: null});
                if (typeof window !== "undefined") {
                    window.location.assign("/");
                }
            },
        }),
        {
            name: "auth",
            storage: createJSONStorage(() =>
                typeof window !== "undefined" ? localStorage : (undefined as any),
            ),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
            onRehydrateStorage: () => (state, error) => {
                const s = (state ?? {}) as AuthState;
                // Mark hydration complete so components depending on it can proceed
                s.setHasHydrated?.(true);

                if (error) return;
                const {accessToken, loadMe, logout} = s;
                if (accessToken) {
                    loadMe().catch(() => logout());
                }
            },
        },
    ),
);

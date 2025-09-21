"use client";
import Link from "next/link";
import {useAuth} from "@/lib/store";

export default function AuthStatus() {
    const {user, logout} = useAuth();
    return (
        <div className="flex items-center gap-2">
            {user ? (
                <>
                    <span className="text-sm text-muted-foreground">{user.name} ({user.email})</span>
                    <button className="btn btn-outline h-8" onClick={logout}>Logout</button>
                </>
            ) : (
                <Link href="/login" className="btn h-8">Login</Link>
            )}
        </div>
    );
}

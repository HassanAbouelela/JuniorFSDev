"use client";
import Link from "next/link";
import {useState} from "react";
import AuthStatus from "@/components/AuthStatus";
import {useAuth} from "@/lib/store";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const {user} = useAuth();

    return (
        <div className="w-full border-b border-border">
            <div className="container relative flex h-14 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col leading-tight">
                        <Link href="/" className="font-semibold">Task Manager</Link>
                        <span className="italic text-xs text-muted-foreground">By Hassan Abouelela</span>
                    </div>

                    {/* Desktop navigation */}
                    {user === null ? null : (
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href="/tasks"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                Dashboard
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right side: auth and burger */}
                <div className="flex items-center gap-2">
                    {/* Mobile burger */}
                    {user === null ? null : (
                        <button
                            type="button"
                            aria-label="Open menu"
                            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                            onClick={() => setOpen((v) => !v)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24"
                                 fill="currentColor">
                                {open ? (
                                    <path fillRule="evenodd"
                                          d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                                          clipRule="evenodd"/>
                                ) : (
                                    <path fillRule="evenodd"
                                          d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25A.75.75 0 014.5 11h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25A.75.75 0 014.5 16h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z"
                                          clipRule="evenodd"/>
                                )}
                            </svg>
                        </button>
                    )}

                    <AuthStatus/>
                </div>

                {/* Mobile dropdown */}
                {(open && user !== null) && (
                    <div className="absolute left-0 right-0 top-14 z-50 border-b border-border bg-background md:hidden">
                        <div className="container py-3">
                            <nav className="flex flex-col gap-2">
                                <Link
                                    href="/tasks"
                                    className="px-2 py-2 rounded hover:bg-muted text-sm"
                                    onClick={() => setOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

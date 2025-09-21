import "@/app/globals.css";
import type {ReactNode} from "react";
import {Toaster} from "sonner";
import Navbar from "@/components/Navbar";

export const metadata = {
    title: "Task Manager",
    description: "Manage tasks with the power of AI insights",
};

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en">
        <body>
        <Navbar/>
        <main className="container py-6">{children}</main>
        <Toaster richColors position="top-right"/>
        </body>
        </html>
    );
}

"use client";

import React from "react";
import {Toaster} from "sonner";

/**
 * Mount this once near the root layout to enable toast notifications.
 * Example (Next.js App Router):
 *   // in app/layout.tsx
 *   import { ToasterHost } from "@/components/ToasterHost";
 *   ...
 *   <body>
 *     <ToasterHost />
 *     {children}
 *   </body>
 */
export function ToasterHost() {
    return (
        <Toaster
            position="top-right"
            closeButton
            richColors
            expand
            duration={2500}
            toastOptions={{
                // Keep it compact and consistent
                classNames: {
                    toast: "shadow-md",
                },
            }}
        />
    );
}

export default ToasterHost;

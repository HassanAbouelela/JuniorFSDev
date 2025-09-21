import React from "react";
import cn from "classnames";

/**
 * TaskMetaColumn
 * Wrap meta cells (priority/status/deadline) with this to prevent horizontal overflow
 * in flex/grid contexts. Tailwind utility classes are used.
 */
export function TaskMetaColumn({
                                   className,
                                   children,
                                   title,
                               }: {
    className?: string;
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <div
            className={cn(
                // Key to prevent horizontal overflow in flex/grid children
                "min-w-0 overflow-hidden whitespace-nowrap text-ellipsis",
                className,
            )}
            title={title}
        >
            {/* Ensure descendants also don't force width growth */}
            <div className="min-w-0 overflow-hidden text-ellipsis">{children}</div>
        </div>
    );
}

export default TaskMetaColumn;

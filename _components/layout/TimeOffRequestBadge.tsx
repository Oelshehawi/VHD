"use client";

interface TimeOffRequestBadgeProps {
  count: number;
  className?: string;
}

export function TimeOffRequestBadge({
  count,
  className = "",
}: TimeOffRequestBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-5 h-5 px-2 text-xs font-bold leading-none text-white bg-red-500 rounded-full ${className}`}
      title={`${count} pending time-off request${count !== 1 ? "s" : ""}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Example usage in your sidebar/navigation:
 *
 * In your app layout or sidebar component:
 *
 * ```tsx
 * import { getPendingTimeOffCount } from "@/app/lib/data";
 * import { TimeOffRequestBadge } from "@/_components/layout/TimeOffRequestBadge";
 *
 * export default async function Sidebar() {
 *   const pendingCount = await getPendingTimeOffCount();
 *
 *   return (
 *     <nav>
 *       <Link href="/payroll">
 *         <div className="flex items-center gap-2">
 *           <span>Payroll</span>
 *           <TimeOffRequestBadge count={pendingCount} />
 *         </div>
 *       </Link>
 *     </nav>
 *   );
 * }
 * ```
 */

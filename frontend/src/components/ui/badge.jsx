import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Attendance status variants
        present:
          "border-success/20 bg-success/10 text-success",
        absent:
          "border-destructive/20 bg-destructive/10 text-destructive",
        late:
          "border-warning/20 bg-warning/10 text-warning",
        excused:
          "border-info/20 bg-info/10 text-info",
        // Payment status variants
        paid:
          "border-success/20 bg-success/10 text-success",
        pending:
          "border-warning/20 bg-warning/10 text-warning",
        overdue:
          "border-destructive/20 bg-destructive/10 text-destructive",
        partial:
          "border-info/20 bg-info/10 text-info",
        // Status variants
        active:
          "border-success/20 bg-success/10 text-success",
        inactive:
          "border-muted-foreground/20 bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }

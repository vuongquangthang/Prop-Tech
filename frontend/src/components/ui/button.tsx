import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-soft)] hover:bg-[#184478]",
        destructive:
          "bg-[var(--error)] text-white hover:bg-red-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[var(--surface-border)] bg-white/80 text-[var(--text-primary)] hover:bg-[var(--brand-surface)] hover:text-[var(--brand-primary)]",
        secondary:
          "border border-[var(--surface-border)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-card-2)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--brand-surface)] hover:text-[var(--brand-primary)]",
        link: "text-[var(--brand-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-[var(--radius-button)] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-[var(--radius-button)] px-6 has-[>svg]:px-4",
        icon: "size-10 rounded-[var(--radius-button)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

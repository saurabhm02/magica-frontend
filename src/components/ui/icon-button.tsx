import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors outline-none hover:bg-control-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-surface-tertiary aria-pressed:text-text-primary",
  {
    variants: {
      size: {
        sm: "size-7 [&_svg]:size-4",
        md: "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type IconButtonProps = React.ComponentProps<"button"> & VariantProps<typeof iconButtonVariants>;

export function IconButton({ className, size, ...props }: IconButtonProps) {
  return <button type="button" className={cn(iconButtonVariants({ size }), className)} {...props} />;
}

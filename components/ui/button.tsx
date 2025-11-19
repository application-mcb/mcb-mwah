import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 rounded-lg",
  {
    variants: {
      variant: {
        default:
          "bg-blue-900 text-white hover:bg-blue-900 shadow-lg",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-lg",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-lg",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="-ml-1 mr-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
        </div>
      )}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }

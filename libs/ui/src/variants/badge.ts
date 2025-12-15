// import { cva } from "class-variance-authority";

// export const badgeVariants = cva(
//   "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
//   {
//     variants: {
//       variant: {
//         primary: "border-primary bg-primary text-primary-foreground",
//         secondary: "border-secondary bg-secondary text-secondary-foreground",
//         error: "border-error bg-error text-error-foreground",
//         warning: "border-warning bg-warning text-warning-foreground",
//         info: "border-info bg-info text-info-foreground",
//         success: "border-success bg-success text-success-foreground",
//       },
//       outline: {
//         true: "bg-transparent",
//       },
//     },
//     compoundVariants: [
//       { outline: true, variant: "primary", className: "text-primary" },
//       { outline: true, variant: "secondary", className: "text-secondary" },
//       { outline: true, variant: "error", className: "text-error" },
//       { outline: true, variant: "warning", className: "text-warning" },
//       { outline: true, variant: "info", className: "text-info" },
//       { outline: true, variant: "success", className: "text-success" },
//     ],
//     defaultVariants: {
//       variant: "primary",
//       outline: false,
//     },
//   },
// );



// badge.tsx - Complete with all variants
import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        primary: "border-primary bg-primary text-primary-foreground",
        secondary: "border-secondary bg-secondary text-secondary-foreground",
        error: "border-error bg-error text-error-foreground",
        warning: "border-warning bg-warning text-warning-foreground",
        info: "border-info bg-info text-info-foreground",
        success: "border-success bg-success text-success-foreground",
        outline: "text-foreground border-border", // Added outline variant
        ghost: "border-transparent bg-transparent text-muted-foreground", // Added ghost variant
        destructive: "border-destructive bg-destructive text-destructive-foreground", // Added destructive variant
      },
      size: {
        default: "px-3 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1 text-sm",
      },
      outline: {
        true: "bg-transparent",
      },
    },
    compoundVariants: [
      // Outline variants
      { outline: true, variant: "primary", className: "border-primary text-primary" },
      { outline: true, variant: "secondary", className: "border-secondary text-secondary" },
      { outline: true, variant: "error", className: "border-error text-error" },
      { outline: true, variant: "warning", className: "border-warning text-warning" },
      { outline: true, variant: "info", className: "border-info text-info" },
      { outline: true, variant: "success", className: "border-success text-success" },
      { outline: true, variant: "destructive", className: "border-destructive text-destructive" },
      
      // Ghost variants don't have outline version since they're already transparent
      { variant: "ghost", className: "hover:bg-accent hover:text-accent-foreground" },
      { variant: "outline", className: "hover:bg-accent hover:text-accent-foreground" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      outline: false,
    },
  },
);
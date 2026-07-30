import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = [
    "btn",
    `btn--${variant}`,
    fullWidth ? "btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
